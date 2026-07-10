import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireRole } from '../middleware/requireRole';
import { writeAuditLog } from '../lib/auditLog';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Content editing — content_editor, super_admin
// ---------------------------------------------------------------------------
const contentUpdateSchema = z.object({
  language_code: z.enum(['en', 'so', 'ar']),
  title: z.string().max(300).optional(),
  body: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

adminRouter.put('/content/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = contentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid content payload.' } });
  }
  const { language_code, title, body, status } = parsed.data;

  const pageRes = await pool.query('SELECT * FROM content_pages WHERE id = $1', [req.params.id]);
  const page = pageRes.rows[0];
  if (!page) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content page not found.' } });

  const ifUnmodifiedSince = req.headers['if-unmodified-since'];
  if (ifUnmodifiedSince && new Date(page.updated_at).getTime() > new Date(String(ifUnmodifiedSince)).getTime()) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Record was modified by another editor since you loaded it.' } });
  }

  const before = { ...page };

  if (status) {
    await pool.query(
      'UPDATE content_pages SET status = $1, updated_by = $2, updated_at = now() WHERE id = $3',
      [status, req.user!.sub, page.id]
    );
  } else {
    await pool.query('UPDATE content_pages SET updated_by = $1, updated_at = now() WHERE id = $2', [req.user!.sub, page.id]);
  }

  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, 'content_pages', $2, $3, $4)
     ON CONFLICT (content_id, content_table, language_code)
     DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()`,
    [page.id, language_code, title ?? null, body ?? null]
  );

  const afterRes = await pool.query('SELECT * FROM content_pages WHERE id = $1', [page.id]);
  await writeAuditLog(req, {
    action: 'update',
    table_name: 'content_pages',
    record_id: page.id,
    before_value: before,
    after_value: afterRes.rows[0],
  });

  res.json(afterRes.rows[0]);
});

// ---------------------------------------------------------------------------
// Exchange rates — exchange_rate_officer, super_admin
// ---------------------------------------------------------------------------
const rateSchema = z.object({
  currency_code: z.string().length(3),
  rate_to_ssh: z.string().regex(/^\d+(\.\d{1,4})?$/),
  rate_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

adminRouter.post('/exchange-rates', requireRole('exchange_rate_officer', 'super_admin'), async (req, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'currency_code, rate_to_ssh, rate_date are required.' } });
  }
  const { currency_code, rate_to_ssh, rate_date } = parsed.data;

  const existing = await pool.query(
    'SELECT id FROM exchange_rates WHERE currency_code = $1 AND rate_date = $2',
    [currency_code.toUpperCase(), rate_date]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'A rate for this currency/date already exists. Use PUT to correct it.' },
    });
  }

  const { rows } = await pool.query(
    `INSERT INTO exchange_rates (currency_code, rate_to_ssh, rate_date, entered_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [currency_code.toUpperCase(), rate_to_ssh, rate_date, req.user!.sub]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'exchange_rates',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

adminRouter.put('/exchange-rates/:id', requireRole('exchange_rate_officer', 'super_admin'), async (req, res) => {
  const parsed = rateSchema.pick({ rate_to_ssh: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'rate_to_ssh is required.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM exchange_rates WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Exchange rate entry not found.' } });

  const { rows } = await pool.query(
    'UPDATE exchange_rates SET rate_to_ssh = $1 WHERE id = $2 RETURNING *',
    [parsed.data.rate_to_ssh, req.params.id]
  );

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'exchange_rates',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Licensed institutions — supervision_data_officer, super_admin
// ---------------------------------------------------------------------------
const institutionUpdateSchema = z.object({
  status: z.enum(['active', 'revoked']).optional(),
  name: z.string().max(200).optional(),
  headquarters: z.string().max(120).optional(),
  license_number: z.string().max(50).optional(),
});

adminRouter.put('/institutions/:id', requireRole('supervision_data_officer', 'super_admin'), async (req, res) => {
  const parsed = institutionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid institution payload.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM licensed_institutions WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } });

  const fields = parsed.data;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    params.push(value);
    sets.push(`${key} = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'No fields to update.' } });
  }
  params.push(req.user!.sub);
  sets.push(`updated_by = $${params.length}`);
  sets.push('updated_at = now()');
  params.push(req.params.id);

  const { rows } = await pool.query(
    `UPDATE licensed_institutions SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  // Non-optional audit row — ties directly to regulatory accountability (spec Section 2.5).
  await writeAuditLog(req, {
    action: 'update',
    table_name: 'licensed_institutions',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.post('/institutions', requireRole('supervision_data_officer', 'super_admin'), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(200),
    institution_type: z.enum(['bank', 'remit', 'mm', 'mfi', 'pay', 'takaful', 'fx']),
    license_number: z.string().max(50).optional(),
    headquarters: z.string().max(120).optional(),
    license_date: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid institution payload.' } });
  }

  const { rows } = await pool.query(
    `INSERT INTO licensed_institutions (name, institution_type, license_number, headquarters, license_date, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      parsed.data.name,
      parsed.data.institution_type,
      parsed.data.license_number ?? null,
      parsed.data.headquarters ?? null,
      parsed.data.license_date ?? null,
      req.user!.sub,
    ]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'licensed_institutions',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

// ---------------------------------------------------------------------------
// Users — super_admin only
// ---------------------------------------------------------------------------
adminRouter.get('/users', requireRole('super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM admin_users ORDER BY created_at DESC'
  );
  res.json({ results: rows });
});

const createUserSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer']),
});

adminRouter.post('/users', requireRole('super_admin'), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid user payload.' } });
  }
  const { name, email, password, role } = parsed.data;

  const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'A user with this email already exists.' } });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (name, email, password_hash, role, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, is_active, created_at`,
    [name, email, password_hash, role, req.user!.sub]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'admin_users',
    record_id: rows[0].id,
    before_value: null,
    after_value: { ...rows[0], password_hash: undefined },
  });

  res.status(201).json(rows[0]);
});

adminRouter.put('/users/:id', requireRole('super_admin'), async (req, res) => {
  const schema = z.object({ is_active: z.boolean().optional(), role: createUserSchema.shape.role.optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid payload.' } });
  }

  const beforeRes = await pool.query('SELECT id, name, email, role, is_active FROM admin_users WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });

  const sets: string[] = [];
  const params: unknown[] = [];
  if (parsed.data.is_active !== undefined) {
    params.push(parsed.data.is_active);
    sets.push(`is_active = $${params.length}`);
  }
  if (parsed.data.role !== undefined) {
    params.push(parsed.data.role);
    sets.push(`role = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'No fields to update.' } });
  }
  sets.push('updated_at = now()');
  params.push(req.params.id);

  const { rows } = await pool.query(
    `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${params.length}
     RETURNING id, name, email, role, is_active`,
    params
  );

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'admin_users',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Audit log — super_admin only
// ---------------------------------------------------------------------------
adminRouter.get('/audit-log', requireRole('super_admin'), async (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
  const { rows } = await pool.query(
    `SELECT al.*, au.name AS admin_name, au.email AS admin_email
     FROM audit_log al
     JOIN admin_users au ON au.id = al.admin_user_id
     ORDER BY al.created_at DESC LIMIT $1`,
    [limit]
  );
  res.json({ results: rows });
});
