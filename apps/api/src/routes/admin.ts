import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireRole } from '../middleware/requireRole';
import { writeAuditLog } from '../lib/auditLog';
import { uploadMedia, enforcePerFieldSizeLimits, cleanupFiles, publicUrlFor } from '../lib/upload';
import { sendMail } from '../lib/mailer';

const ALL_ROLES = ['super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer'] as const;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Media upload — content_editor, super_admin. Real files on disk, not URLs
// the editor has to host themselves.
// ---------------------------------------------------------------------------
adminRouter.post('/uploads', requireRole('content_editor', 'super_admin'), (req, res) => {
  uploadMedia(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      return res.status(400).json({ error: { code: 'UPLOAD_FAILED', message } });
    }

    const files = req.files as
      | { images?: Express.Multer.File[]; video?: Express.Multer.File[]; document?: Express.Multer.File[] }
      | undefined;
    if (!files || (!files.images?.length && !files.video?.length && !files.document?.length)) {
      return res.status(400).json({ error: { code: 'NO_FILES', message: 'No files were uploaded.' } });
    }

    const sizeError = enforcePerFieldSizeLimits(files);
    if (sizeError) {
      cleanupFiles(files);
      return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: sizeError } });
    }

    res.status(201).json({
      images: (files.images ?? []).map(publicUrlFor),
      video: files.video?.[0] ? publicUrlFor(files.video[0]) : null,
      document: files.document?.[0] ? publicUrlFor(files.document[0]) : null,
    });
  });
});

// ---------------------------------------------------------------------------
// Content editing — content_editor, super_admin
// ---------------------------------------------------------------------------
adminRouter.get('/content-pages', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT cp.id, cp.slug, cp.page_type, cp.status, cp.updated_at,
            array_remove(array_agg(DISTINCT ct.language_code), NULL) AS languages
     FROM content_pages cp
     LEFT JOIN content_translations ct ON ct.content_id = cp.id AND ct.content_table = 'content_pages'
     GROUP BY cp.id
     ORDER BY cp.page_type, cp.slug`
  );
  res.json({ results: rows });
});

adminRouter.get('/content-pages/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const pageRes = await pool.query('SELECT * FROM content_pages WHERE id = $1', [req.params.id]);
  const page = pageRes.rows[0];
  if (!page) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content page not found.' } });

  const tRes = await pool.query(
    `SELECT language_code, title, subtitle, body FROM content_translations WHERE content_id = $1 AND content_table = 'content_pages'`,
    [page.id]
  );

  res.json({ ...page, translations: tRes.rows });
});

const contentCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only (e.g. my-new-page).'),
  title: z.string().min(1).max(300),
  body: z.string().optional(),
});

adminRouter.post('/content-pages', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = contentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid page payload.' } });
  }
  const { slug, title, body } = parsed.data;

  const existing = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'A page with this slug already exists.' } });
  }

  const { rows } = await pool.query(
    `INSERT INTO content_pages (slug, page_type, status, updated_by) VALUES ($1, 'custom', 'draft', $2) RETURNING *`,
    [slug, req.user!.sub]
  );
  const page = rows[0];

  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, 'content_pages', 'en', $2, $3)`,
    [page.id, title, body ?? null]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'content_pages',
    record_id: page.id,
    before_value: null,
    after_value: { ...page, title },
  });

  res.status(201).json(page);
});

const contentUpdateSchema = z.object({
  language_code: z.enum(['en', 'so', 'ar']),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(600).nullable().optional(),
  body: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  banner_image_url: z.string().max(500).nullable().optional(),
  banner_video_url: z.string().max(500).nullable().optional(),
  animation_style: z.enum(['fade-up', 'fade-in', 'slide-left', 'slide-right', 'zoom', 'none']).nullable().optional(),
});

adminRouter.put('/content/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = contentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid content payload.' } });
  }
  const { language_code, title, subtitle, body, status, banner_image_url, banner_video_url, animation_style } = parsed.data;

  const pageRes = await pool.query('SELECT * FROM content_pages WHERE id = $1', [req.params.id]);
  const page = pageRes.rows[0];
  if (!page) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content page not found.' } });

  const ifUnmodifiedSince = req.headers['if-unmodified-since'];
  if (ifUnmodifiedSince && new Date(page.updated_at).getTime() > new Date(String(ifUnmodifiedSince)).getTime()) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Record was modified by another editor since you loaded it.' } });
  }

  const before = { ...page };

  const pageSets: string[] = ['updated_by = $1', 'updated_at = now()'];
  const pageParams: unknown[] = [req.user!.sub];
  if (status !== undefined) {
    pageParams.push(status);
    pageSets.push(`status = $${pageParams.length}`);
  }
  if (banner_image_url !== undefined) {
    pageParams.push(banner_image_url);
    pageSets.push(`banner_image_url = $${pageParams.length}`);
  }
  if (banner_video_url !== undefined) {
    pageParams.push(banner_video_url);
    pageSets.push(`banner_video_url = $${pageParams.length}`);
  }
  if (animation_style !== undefined) {
    pageParams.push(animation_style);
    pageSets.push(`animation_style = $${pageParams.length}`);
  }
  pageParams.push(page.id);
  await pool.query(`UPDATE content_pages SET ${pageSets.join(', ')} WHERE id = $${pageParams.length}`, pageParams);

  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, subtitle, body)
     VALUES ($1, 'content_pages', $2, $3, $4, $5)
     ON CONFLICT (content_id, content_table, language_code)
     DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, body = EXCLUDED.body, updated_at = now()`,
    [page.id, language_code, title ?? null, subtitle ?? null, body ?? null]
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

adminRouter.delete('/content-pages/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM content_pages WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content page not found.' } });
  if (before.page_type !== 'custom') {
    return res.status(400).json({ error: { code: 'PROTECTED', message: 'Only custom pages can be deleted; built-in pages are wired into the site navigation and routes.' } });
  }

  await pool.query('DELETE FROM content_pages WHERE id = $1', [req.params.id]);
  await pool.query(`DELETE FROM content_translations WHERE content_id = $1 AND content_table = 'content_pages'`, [req.params.id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'content_pages',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Exchange rates — exchange_rate_officer, super_admin
// ---------------------------------------------------------------------------
const rateRegex = /^\d+(\.\d{1,4})?$/;
const rateSchema = z.object({
  currency_code: z.string().length(3),
  buying_rate: z.string().regex(rateRegex),
  selling_rate: z.string().regex(rateRegex),
  rate_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

adminRouter.post('/exchange-rates', requireRole('exchange_rate_officer', 'super_admin'), async (req, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'currency_code, buying_rate, selling_rate, rate_date are required.' } });
  }
  const { currency_code, buying_rate, selling_rate, rate_date } = parsed.data;

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
    `INSERT INTO exchange_rates (currency_code, rate_to_ssh, buying_rate, selling_rate, rate_date, entered_by)
     VALUES ($1, $2, $2, $3, $4, $5) RETURNING *`,
    [currency_code.toUpperCase(), buying_rate, selling_rate, rate_date, req.user!.sub]
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
  const parsed = rateSchema.pick({ buying_rate: true, selling_rate: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'buying_rate and selling_rate are required.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM exchange_rates WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Exchange rate entry not found.' } });

  const { rows } = await pool.query(
    'UPDATE exchange_rates SET buying_rate = $1, selling_rate = $2, rate_to_ssh = $1 WHERE id = $3 RETURNING *',
    [parsed.data.buying_rate, parsed.data.selling_rate, req.params.id]
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
  logo_url: z.string().max(500).nullable().optional(),
  website_url: z.string().max(500).nullable().optional(),
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
// Laws & Regulations, Job Postings, Tenders — content_editor, super_admin
// (same content-management role band as press_releases/publications per
// Database_API_Auth_Specification.md Section 3.3)
// ---------------------------------------------------------------------------
const lawSchema = z.object({
  title: z.string().min(1).max(300),
  file_url: z.string().max(500),
  law_number: z.string().max(50).optional(),
  effective_date: z.string().optional(),
  thumbnail_url: z.string().max(500).optional(),
  is_downloadable: z.boolean().optional(),
});

adminRouter.post('/laws-regulations', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = lawSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid law/regulation payload.' } });
  }
  const { title, file_url, law_number, effective_date, thumbnail_url, is_downloadable } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO laws_regulations (title_content_id, file_url, law_number, effective_date, thumbnail_url, is_downloadable)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5) RETURNING *`,
    [file_url, law_number ?? null, effective_date ?? null, thumbnail_url ?? null, is_downloadable ?? true]
  );
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title)
     VALUES ($1, 'laws_regulations', 'en', $2)`,
    [rows[0].title_content_id, title]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'laws_regulations',
    record_id: rows[0].id,
    before_value: null,
    after_value: { ...rows[0], title },
  });

  res.status(201).json({ ...rows[0], title });
});

const publicationSchema = z.object({
  title: z.string().min(1).max(300),
  file_url: z.string().max(500),
  category: z.string().min(1).max(60),
  publish_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  thumbnail_url: z.string().max(500).optional(),
  is_downloadable: z.boolean().optional(),
});

adminRouter.post('/publications', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = publicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid publication payload.' } });
  }
  const { title, file_url, category, publish_date, thumbnail_url, is_downloadable } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO publications (title_content_id, file_url, category, publish_date, thumbnail_url, is_downloadable)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5) RETURNING *`,
    [file_url, category, publish_date, thumbnail_url ?? null, is_downloadable ?? true]
  );
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title)
     VALUES ($1, 'publications', 'en', $2)`,
    [rows[0].title_content_id, title]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'publications',
    record_id: rows[0].id,
    before_value: null,
    after_value: { ...rows[0], title },
  });

  res.status(201).json({ ...rows[0], title });
});

// Admin listings (all statuses, incl. drafts) + delete + publish/unpublish
adminRouter.get('/laws-regulations', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, ct.title FROM laws_regulations l
     LEFT JOIN content_translations ct ON ct.content_id = l.title_content_id AND ct.content_table = 'laws_regulations' AND ct.language_code = 'en'
     ORDER BY l.effective_date DESC NULLS LAST`
  );
  res.json({ results: rows });
});

adminRouter.put('/laws-regulations/:id/status', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const status = req.body?.status;
  if (status !== 'draft' && status !== 'published') {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'status must be draft or published.' } });
  }
  const beforeRes = await pool.query('SELECT * FROM laws_regulations WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Law/regulation not found.' } });

  const { rows } = await pool.query('UPDATE laws_regulations SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'laws_regulations',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.delete('/laws-regulations/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM laws_regulations WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Law/regulation not found.' } });

  await pool.query('DELETE FROM laws_regulations WHERE id = $1', [req.params.id]);
  await pool.query(`DELETE FROM content_translations WHERE content_id = $1 AND content_table = 'laws_regulations'`, [before.title_content_id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'laws_regulations',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

adminRouter.get('/publications', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, ct.title FROM publications p
     LEFT JOIN content_translations ct ON ct.content_id = p.title_content_id AND ct.content_table = 'publications' AND ct.language_code = 'en'
     ORDER BY p.publish_date DESC`
  );
  res.json({ results: rows });
});

adminRouter.put('/publications/:id/status', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const status = req.body?.status;
  if (status !== 'draft' && status !== 'published') {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'status must be draft or published.' } });
  }
  const beforeRes = await pool.query('SELECT * FROM publications WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Publication not found.' } });

  const { rows } = await pool.query('UPDATE publications SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'publications',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.delete('/publications/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM publications WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Publication not found.' } });

  await pool.query('DELETE FROM publications WHERE id = $1', [req.params.id]);
  await pool.query(`DELETE FROM content_translations WHERE content_id = $1 AND content_table = 'publications'`, [before.title_content_id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'publications',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

const jobSchema = z.object({
  title: z.string().min(1).max(300),
  department: z.string().max(150).optional(),
  closing_date: z.string(),
});

adminRouter.post('/job-postings', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid job posting payload.' } });
  }
  const { title, department, closing_date } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO job_postings (title_content_id, department, closing_date)
     VALUES (uuid_generate_v4(), $1, $2) RETURNING *`,
    [department ?? null, closing_date]
  );
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title)
     VALUES ($1, 'job_postings', 'en', $2)`,
    [rows[0].title_content_id, title]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'job_postings',
    record_id: rows[0].id,
    before_value: null,
    after_value: { ...rows[0], title },
  });

  res.status(201).json({ ...rows[0], title });
});

adminRouter.put('/job-postings/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const schema = z.object({ status: z.enum(['open', 'closed']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'status is required.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM job_postings WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job posting not found.' } });

  const { rows } = await pool.query('UPDATE job_postings SET status = $1 WHERE id = $2 RETURNING *', [
    parsed.data.status,
    req.params.id,
  ]);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'job_postings',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

const tenderSchema = z.object({
  title: z.string().min(1).max(300),
  reference_number: z.string().min(1).max(50),
  closing_date: z.string(),
  file_url: z.string().max(500).optional(),
});

async function getEnTitle(contentId: string, table: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = $2 AND language_code = 'en'`,
    [contentId, table]
  );
  return rows[0]?.title ?? '(untitled)';
}

adminRouter.get('/tenders', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM tenders ORDER BY closing_date DESC');
  const results = await Promise.all(
    rows.map(async (row) => ({ ...row, title: await getEnTitle(row.title_content_id, 'tenders') }))
  );
  res.json({ results });
});

adminRouter.post('/tenders', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = tenderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid tender payload.' } });
  }
  const { title, reference_number, closing_date, file_url } = parsed.data;

  const existing = await pool.query('SELECT id FROM tenders WHERE reference_number = $1', [reference_number]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'A tender with this reference number already exists.' } });
  }

  const { rows } = await pool.query(
    `INSERT INTO tenders (title_content_id, reference_number, closing_date, file_url)
     VALUES (uuid_generate_v4(), $1, $2, $3) RETURNING *`,
    [reference_number, closing_date, file_url ?? null]
  );
  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title)
     VALUES ($1, 'tenders', 'en', $2)`,
    [rows[0].title_content_id, title]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'tenders',
    record_id: rows[0].id,
    before_value: null,
    after_value: { ...rows[0], title },
  });

  res.status(201).json({ ...rows[0], title });
});

const tenderUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  reference_number: z.string().min(1).max(50).optional(),
  closing_date: z.string().optional(),
  file_url: z.string().max(500).nullable().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

adminRouter.put('/tenders/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = tenderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid tender payload.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tender not found.' } });

  const { title, reference_number, closing_date, file_url, status } = parsed.data;

  if (reference_number && reference_number !== before.reference_number) {
    const existing = await pool.query('SELECT id FROM tenders WHERE reference_number = $1 AND id != $2', [
      reference_number,
      req.params.id,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'A tender with this reference number already exists.' } });
    }
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  if (reference_number !== undefined) {
    params.push(reference_number);
    sets.push(`reference_number = $${params.length}`);
  }
  if (closing_date !== undefined) {
    params.push(closing_date);
    sets.push(`closing_date = $${params.length}`);
  }
  if (file_url !== undefined) {
    params.push(file_url);
    sets.push(`file_url = $${params.length}`);
  }
  if (status !== undefined) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (sets.length > 0) {
    params.push(req.params.id);
    await pool.query(`UPDATE tenders SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  }
  if (title !== undefined) {
    await pool.query(
      `UPDATE content_translations SET title = $1 WHERE content_id = $2 AND content_table = 'tenders' AND language_code = 'en'`,
      [title, before.title_content_id]
    );
  }

  const { rows } = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.id]);
  const after = { ...rows[0], title: await getEnTitle(rows[0].title_content_id, 'tenders') };

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'tenders',
    record_id: rows[0].id,
    before_value: before,
    after_value: after,
  });

  res.json(after);
});

adminRouter.delete('/tenders/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tender not found.' } });

  await pool.query('DELETE FROM tenders WHERE id = $1', [req.params.id]);
  await pool.query(`DELETE FROM content_translations WHERE content_id = $1 AND content_table = 'tenders'`, [
    before.title_content_id,
  ]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'tenders',
    record_id: before.id,
    before_value: before,
    after_value: null,
  });

  res.json({ status: 'deleted' });
});

// ---------------------------------------------------------------------------
// Press releases — content_editor, super_admin
// ---------------------------------------------------------------------------
const pressReleaseSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().optional(),
  publish_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  featured: z.boolean().optional(),
  images: z.array(z.string()).max(10).optional(),
  video_url: z.string().nullable().optional(),
});

adminRouter.post('/press-releases', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = pressReleaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid press release payload.' } });
  }
  const { title, body, publish_date, featured, images, video_url } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO press_releases (publish_date, content_id, status, featured, video_url)
     VALUES ($1, uuid_generate_v4(), 'published', $2, $3) RETURNING *`,
    [publish_date, featured ?? false, video_url ?? null]
  );
  const pressRelease = rows[0];

  await pool.query(
    `INSERT INTO content_translations (content_id, content_table, language_code, title, body)
     VALUES ($1, 'press_releases', 'en', $2, $3)`,
    [pressRelease.content_id, title, body ?? '']
  );

  for (let i = 0; i < (images ?? []).length; i++) {
    await pool.query(
      `INSERT INTO press_release_images (press_release_id, image_url, sort_order) VALUES ($1, $2, $3)`,
      [pressRelease.id, images![i], i]
    );
  }

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'press_releases',
    record_id: pressRelease.id,
    before_value: null,
    after_value: { ...pressRelease, title, images: images ?? [] },
  });

  res.status(201).json({ ...pressRelease, title, images: images ?? [] });
});

// ---------------------------------------------------------------------------
// Contact messages — content_editor, super_admin (read-only inbox)
// ---------------------------------------------------------------------------
adminRouter.get('/contact-messages', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, subject, message, is_read, created_at
     FROM contact_messages ORDER BY created_at DESC LIMIT 200`
  );
  const unreadRes = await pool.query('SELECT count(*)::int AS n FROM contact_messages WHERE is_read = false');
  res.json({ results: rows, unread_count: unreadRes.rows[0].n });
});

adminRouter.put('/contact-messages/:id/read', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE contact_messages SET is_read = true WHERE id = $1 RETURNING id, is_read',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Message not found.' } });
  res.json(rows[0]);
});

adminRouter.delete('/contact-messages/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const { rows } = await pool.query('DELETE FROM contact_messages WHERE id = $1 RETURNING id', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Message not found.' } });
  res.json({ status: 'deleted' });
});

// ---------------------------------------------------------------------------
// Users — super_admin only
// ---------------------------------------------------------------------------
adminRouter.get('/users', requireRole('super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, is_active, totp_enabled, created_at FROM admin_users ORDER BY created_at DESC'
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

  if (parsed.data.is_active === false) {
    if (req.params.id === req.user!.sub) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'You cannot deactivate your own account.' } });
    }
    if (before.role === 'super_admin') {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS n FROM admin_users WHERE role = 'super_admin' AND is_active = true AND id != $1`,
        [req.params.id]
      );
      if (rows[0].n === 0) {
        return res.status(400).json({
          error: { code: 'LAST_SUPER_ADMIN', message: 'Cannot deactivate the only remaining active super admin.' },
        });
      }
    }
  }

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

adminRouter.delete('/users/:id', requireRole('super_admin'), async (req, res) => {
  if (req.params.id === req.user!.sub) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'You cannot delete your own account.' } });
  }

  const beforeRes = await pool.query('SELECT id, name, email, role, is_active FROM admin_users WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });

  if (before.role === 'super_admin') {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM admin_users WHERE role = 'super_admin' AND is_active = true AND id != $1`,
      [req.params.id]
    );
    if (rows[0].n === 0) {
      return res.status(400).json({
        error: { code: 'LAST_SUPER_ADMIN', message: 'Cannot delete the only remaining active super admin.' },
      });
    }
  }

  try {
    await pool.query('DELETE FROM admin_users WHERE id = $1', [req.params.id]);
  } catch (err) {
    // FK violation (23503) — this user has attributed history (audit log entries,
    // entered exchange rates, content edits, etc.) that a hard delete would orphan.
    // Deactivating preserves that trail; only accounts with no history can be
    // truly deleted.
    if ((err as { code?: string }).code === '23503') {
      return res.status(409).json({
        error: {
          code: 'HAS_HISTORY',
          message:
            'This user has activity on record (audit log, exchange rates, or edits) and cannot be deleted — deactivate the account instead to preserve that history.',
        },
      });
    }
    throw err;
  }

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'admin_users',
    record_id: before.id,
    before_value: before,
    after_value: null,
  });

  res.json({ status: 'deleted' });
});

// ---------------------------------------------------------------------------
// Self-service account security — any authenticated role, acting on their
// own account only (req.user.sub, never a body-supplied id).
// ---------------------------------------------------------------------------
const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

adminRouter.put('/me/password', requireRole(...ALL_ROLES), async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Current and new password (min 8 chars) are required.' } });
  }
  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.user!.sub]);
  const ok = await bcrypt.compare(parsed.data.current_password, rows[0].password_hash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' } });
  }
  const newHash = await bcrypt.hash(parsed.data.new_password, 12);
  await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, req.user!.sub]);
  res.json({ status: 'ok' });
});

const changeEmailSchema = z.object({
  new_email: z.string().email(),
  current_password: z.string().min(1),
});

adminRouter.put('/me/email', requireRole(...ALL_ROLES), async (req, res) => {
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A valid new email and current password are required.' } });
  }
  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.user!.sub]);
  const ok = await bcrypt.compare(parsed.data.current_password, rows[0].password_hash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' } });
  }
  const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1 AND id != $2', [parsed.data.new_email, req.user!.sub]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'That email is already in use.' } });
  }
  await pool.query('UPDATE admin_users SET email = $1, updated_at = now() WHERE id = $2', [parsed.data.new_email, req.user!.sub]);
  res.json({ status: 'ok', email: parsed.data.new_email });
});

adminRouter.post('/me/2fa/setup', requireRole(...ALL_ROLES), async (req, res) => {
  const secret = authenticator.generateSecret();
  await pool.query('UPDATE admin_users SET totp_secret = $1, totp_enabled = false WHERE id = $2', [secret, req.user!.sub]);
  const otpauth = authenticator.keyuri(req.user!.email, 'Bank of Somaliland Admin', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  res.json({ secret, qr_data_url: qrDataUrl });
});

const verify2faSchema = z.object({ code: z.string().min(6).max(6) });

adminRouter.post('/me/2fa/verify', requireRole(...ALL_ROLES), async (req, res) => {
  const parsed = verify2faSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A 6-digit code is required.' } });
  }
  const { rows } = await pool.query('SELECT totp_secret FROM admin_users WHERE id = $1', [req.user!.sub]);
  if (!rows[0]?.totp_secret) {
    return res.status(400).json({ error: { code: 'NOT_SETUP', message: 'Run 2FA setup first.' } });
  }
  const valid = authenticator.check(parsed.data.code, rows[0].totp_secret);
  if (!valid) {
    return res.status(401).json({ error: { code: 'INVALID_TOTP', message: 'Incorrect code — check your authenticator app and try again.' } });
  }
  await pool.query('UPDATE admin_users SET totp_enabled = true WHERE id = $1', [req.user!.sub]);
  res.json({ status: 'ok' });
});

const disable2faSchema = z.object({ current_password: z.string().min(1) });

adminRouter.post('/me/2fa/disable', requireRole(...ALL_ROLES), async (req, res) => {
  const parsed = disable2faSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Current password is required.' } });
  }
  const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [req.user!.sub]);
  const ok = await bcrypt.compare(parsed.data.current_password, rows[0].password_hash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' } });
  }
  await pool.query('UPDATE admin_users SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [req.user!.sub]);
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Admin-triggered account recovery — super_admin acting on another user.
// ---------------------------------------------------------------------------
adminRouter.post('/users/:id/reset-password', requireRole('super_admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM admin_users WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });

  const token = crypto.randomUUID() + crypto.randomUUID();
  await pool.query(
    `UPDATE admin_users SET reset_token = $1, reset_token_expires = now() + interval '1 hour' WHERE id = $2`,
    [hashToken(token), rows[0].id]
  );
  const resetUrl = `${process.env.CORS_ORIGIN_ADMIN || 'http://localhost:5174'}/reset-password?token=${token}`;
  await sendMail(rows[0].email, 'Your Bank of Somaliland admin password was reset', `Hi ${rows[0].name},\n\nA super admin triggered a password reset for your account. Use this link (valid for 1 hour):\n${resetUrl}`);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'admin_users',
    record_id: rows[0].id,
    before_value: null,
    after_value: { action: 'password_reset_triggered' },
  });

  res.json({ status: 'ok' });
});

adminRouter.post('/users/:id/2fa/reset', requireRole('super_admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id FROM admin_users WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });

  await pool.query('UPDATE admin_users SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [rows[0].id]);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'admin_users',
    record_id: rows[0].id,
    before_value: null,
    after_value: { action: '2fa_reset_by_admin' },
  });

  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Navigation items — content_editor, super_admin (site-wide structure, same
// content-management role band). Ordering/parenting managed here rather than
// in the DDL spec since the nav bar wasn't originally meant to be dynamic.
// ---------------------------------------------------------------------------
adminRouter.get('/nav-items', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM nav_items ORDER BY parent_id NULLS FIRST, sort_order ASC`
  );
  res.json({ results: rows });
});

const navItemSchema = z.object({
  label: z.string().min(1).max(100),
  label_so: z.string().max(100).optional(),
  label_ar: z.string().max(100).optional(),
  path: z.string().min(1).max(300),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional(),
});

adminRouter.post('/nav-items', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = navItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid navigation item payload.' } });
  }
  const { label, label_so, label_ar, path, parent_id, sort_order } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO nav_items (label, label_so, label_ar, path, parent_id, sort_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [label, label_so ?? null, label_ar ?? null, path, parent_id ?? null, sort_order ?? 0, req.user!.sub]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'nav_items',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

const navItemUpdateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  label_so: z.string().max(100).nullable().optional(),
  label_ar: z.string().max(100).nullable().optional(),
  path: z.string().min(1).max(300).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

adminRouter.put('/nav-items/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = navItemUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid navigation item payload.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM nav_items WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Navigation item not found.' } });

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
    `UPDATE nav_items SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'nav_items',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.delete('/nav-items/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM nav_items WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Navigation item not found.' } });

  // Detach children rather than cascading — deleting a parent shouldn't
  // silently delete its dropdown items.
  await pool.query('UPDATE nav_items SET parent_id = NULL WHERE parent_id = $1', [req.params.id]);
  await pool.query('DELETE FROM nav_items WHERE id = $1', [req.params.id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'nav_items',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Hero slides (homepage slider) — content_editor, super_admin. Deliberately
// independent of press_releases so the admin can curate the slider directly
// (upload an image, hide/show a slide) without publishing an announcement.
// ---------------------------------------------------------------------------
adminRouter.get('/hero-slides', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(`SELECT * FROM hero_slides ORDER BY sort_order ASC`);
  res.json({ results: rows });
});

const heroSlideSchema = z.object({
  title: z.string().min(1).max(300),
  title_so: z.string().max(300).optional(),
  title_ar: z.string().max(300).optional(),
  subtitle: z.string().max(300).optional(),
  subtitle_so: z.string().max(300).optional(),
  subtitle_ar: z.string().max(300).optional(),
  image_url: z.string().max(500).nullable().optional(),
  video_url: z.string().max(500).nullable().optional(),
  link_url: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
});

adminRouter.post('/hero-slides', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = heroSlideSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid hero slide payload.' } });
  }
  if (!parsed.data.image_url && !parsed.data.video_url) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A hero slide needs an image or a video.' } });
  }
  const { title, title_so, title_ar, subtitle, subtitle_so, subtitle_ar, image_url, video_url, link_url, sort_order } =
    parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO hero_slides (title, title_so, title_ar, subtitle, subtitle_so, subtitle_ar, image_url, video_url, link_url, sort_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      title,
      title_so ?? null,
      title_ar ?? null,
      subtitle ?? null,
      subtitle_so ?? null,
      subtitle_ar ?? null,
      image_url ?? null,
      video_url ?? null,
      link_url ?? null,
      sort_order ?? 0,
      req.user!.sub,
    ]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'hero_slides',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

const heroSlideUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  title_so: z.string().max(300).nullable().optional(),
  title_ar: z.string().max(300).nullable().optional(),
  subtitle: z.string().max(300).nullable().optional(),
  subtitle_so: z.string().max(300).nullable().optional(),
  subtitle_ar: z.string().max(300).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  video_url: z.string().max(500).nullable().optional(),
  link_url: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

adminRouter.put('/hero-slides/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = heroSlideUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid hero slide payload.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM hero_slides WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hero slide not found.' } });

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
    `UPDATE hero_slides SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'hero_slides',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.delete('/hero-slides/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM hero_slides WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hero slide not found.' } });

  await pool.query('DELETE FROM hero_slides WHERE id = $1', [req.params.id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'hero_slides',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Bank branches (Central Bank of Somaliland branch directory) — content_editor,
// super_admin. Shown on the public homepage below Licensed Institutions.
// ---------------------------------------------------------------------------
adminRouter.get('/bank-branches', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(`SELECT * FROM bank_branches ORDER BY sort_order ASC`);
  res.json({ results: rows });
});

const bankBranchSchema = z.object({
  name: z.string().min(1).max(150),
  name_so: z.string().max(150).optional(),
  name_ar: z.string().max(150).optional(),
  city: z.string().min(1).max(100),
  city_so: z.string().max(100).optional(),
  city_ar: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  address_so: z.string().max(300).optional(),
  address_ar: z.string().max(300).optional(),
  phone: z.string().max(50).optional(),
  is_headquarters: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  manager_name: z.string().max(150).optional(),
  manager_name_so: z.string().max(150).optional(),
  manager_name_ar: z.string().max(150).optional(),
  manager_title: z.string().max(150).optional(),
  manager_title_so: z.string().max(150).optional(),
  manager_title_ar: z.string().max(150).optional(),
  email: z.string().max(150).optional(),
  photo_url: z.string().max(500).optional(),
});

adminRouter.post('/bank-branches', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = bankBranchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid bank branch payload.' } });
  }
  const {
    name, name_so, name_ar, city, city_so, city_ar, address, address_so, address_ar, phone, is_headquarters, sort_order,
    manager_name, manager_name_so, manager_name_ar, manager_title, manager_title_so, manager_title_ar, email, photo_url,
  } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO bank_branches (name, name_so, name_ar, city, city_so, city_ar, address, address_so, address_ar, phone, is_headquarters, sort_order, manager_name, manager_name_so, manager_name_ar, manager_title, manager_title_so, manager_title_ar, email, photo_url, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
    [
      name,
      name_so ?? null,
      name_ar ?? null,
      city,
      city_so ?? null,
      city_ar ?? null,
      address ?? null,
      address_so ?? null,
      address_ar ?? null,
      phone ?? null,
      is_headquarters ?? false,
      sort_order ?? 0,
      manager_name ?? null,
      manager_name_so ?? null,
      manager_name_ar ?? null,
      manager_title ?? null,
      manager_title_so ?? null,
      manager_title_ar ?? null,
      email ?? null,
      photo_url ?? null,
      req.user!.sub,
    ]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'bank_branches',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

const bankBranchUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  name_so: z.string().max(150).nullable().optional(),
  name_ar: z.string().max(150).nullable().optional(),
  city: z.string().min(1).max(100).optional(),
  city_so: z.string().max(100).nullable().optional(),
  city_ar: z.string().max(100).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  address_so: z.string().max(300).nullable().optional(),
  address_ar: z.string().max(300).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  is_headquarters: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  manager_name: z.string().max(150).nullable().optional(),
  manager_name_so: z.string().max(150).nullable().optional(),
  manager_name_ar: z.string().max(150).nullable().optional(),
  manager_title: z.string().max(150).nullable().optional(),
  manager_title_so: z.string().max(150).nullable().optional(),
  manager_title_ar: z.string().max(150).nullable().optional(),
  email: z.string().max(150).nullable().optional(),
  photo_url: z.string().max(500).nullable().optional(),
});

adminRouter.put('/bank-branches/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = bankBranchUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid bank branch payload.' } });
  }

  const beforeRes = await pool.query('SELECT * FROM bank_branches WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bank branch not found.' } });

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
    `UPDATE bank_branches SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'bank_branches',
    record_id: rows[0].id,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

adminRouter.delete('/bank-branches/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM bank_branches WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bank branch not found.' } });

  await pool.query('DELETE FROM bank_branches WHERE id = $1', [req.params.id]);

  await writeAuditLog(req, {
    action: 'delete',
    table_name: 'bank_branches',
    record_id: req.params.id,
    before_value: before,
    after_value: null,
  });

  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Site settings — super_admin only (branding, contact, social links)
// ---------------------------------------------------------------------------
adminRouter.get('/site-settings', requireRole('super_admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM site_settings WHERE id = 1');
  res.json(rows[0]);
});

const siteSettingsSchema = z.object({
  site_name: z.string().min(1).max(200).optional(),
  logo_url: z.string().max(500).nullable().optional(),
  watermark_url: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  social_x: z.string().max(500).nullable().optional(),
  social_facebook: z.string().max(500).nullable().optional(),
  social_youtube: z.string().max(500).nullable().optional(),
  social_linkedin: z.string().max(500).nullable().optional(),
  country_label_en: z.string().max(150).optional(),
  country_label_so: z.string().max(150).optional(),
  show_country_label: z.boolean().optional(),
  country_flag_url: z.string().max(500).nullable().optional(),
  tagline_en: z.string().max(150).optional(),
  tagline_so: z.string().max(150).optional(),
  tagline_ar: z.string().max(150).optional(),
});

adminRouter.put('/site-settings', requireRole('super_admin'), async (req, res) => {
  const parsed = siteSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid site settings payload.' } });
  }
  const beforeRes = await pool.query('SELECT * FROM site_settings WHERE id = 1');
  const before = beforeRes.rows[0];

  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    params.push(value === '' ? null : value);
    sets.push(`${key} = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'No fields to update.' } });
  }
  sets.push('updated_at = now()', `updated_by = $${params.length + 1}`);
  params.push(req.user!.sub);

  const { rows } = await pool.query(`UPDATE site_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`, params);

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'site_settings',
    record_id: null,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Currencies — super_admin manages the list + flags; exchange_rate_officer
// can read it (needed to populate the rate-entry form) but not modify it.
// ---------------------------------------------------------------------------
adminRouter.get('/currencies', requireRole('super_admin', 'exchange_rate_officer'), async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM currencies ORDER BY sort_order ASC');
  res.json({ results: rows });
});

const currencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  name_so: z.string().max(100).optional(),
  name_ar: z.string().max(100).optional(),
  flag_url: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
});

adminRouter.post('/currencies', requireRole('super_admin', 'exchange_rate_officer'), async (req, res) => {
  const parsed = currencySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid currency payload.' } });
  }
  const { code, name, name_so, name_ar, flag_url, sort_order } = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO currencies (code, name, name_so, name_ar, flag_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_so = EXCLUDED.name_so,
       name_ar = EXCLUDED.name_ar, flag_url = COALESCE(EXCLUDED.flag_url, currencies.flag_url)
     RETURNING *`,
    [code.toUpperCase(), name, name_so ?? null, name_ar ?? null, flag_url ?? null, sort_order ?? 0]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'currencies',
    record_id: null,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
});

const currencyUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  name_so: z.string().max(100).nullable().optional(),
  name_ar: z.string().max(100).nullable().optional(),
  flag_url: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

adminRouter.put('/currencies/:code', requireRole('super_admin', 'exchange_rate_officer'), async (req, res) => {
  const parsed = currencyUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid payload.' } });
  }
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    params.push(value);
    sets.push(`${key} = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'No fields to update.' } });
  }
  params.push(req.params.code.toUpperCase());

  const beforeRes = await pool.query('SELECT * FROM currencies WHERE code = $1', [req.params.code.toUpperCase()]);
  const before = beforeRes.rows[0];

  const { rows } = await pool.query(`UPDATE currencies SET ${sets.join(', ')} WHERE code = $${params.length} RETURNING *`, params);
  if (rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Currency not found.' } });

  await writeAuditLog(req, {
    action: 'update',
    table_name: 'currencies',
    record_id: null,
    before_value: before,
    after_value: rows[0],
  });

  res.json(rows[0]);
});

// ---------------------------------------------------------------------------
// Publication categories — content_editor, super_admin
// ---------------------------------------------------------------------------
adminRouter.get('/publication-categories', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM publication_categories ORDER BY sort_order ASC');
  res.json({ results: rows });
});

const publicationCategorySchema = z.object({
  name: z.string().min(1).max(100),
  name_so: z.string().max(100).optional(),
  name_ar: z.string().max(100).optional(),
});

adminRouter.post('/publication-categories', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = publicationCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A category name is required.' } });
  }
  const slug = parsed.data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const existing = await pool.query('SELECT id FROM publication_categories WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'A category with this name already exists.' } });
  }

  const maxSort = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM publication_categories');
  const { rows } = await pool.query(
    `INSERT INTO publication_categories (slug, name, name_so, name_ar, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [slug, parsed.data.name, parsed.data.name_so ?? null, parsed.data.name_ar ?? null, maxSort.rows[0].next]
  );

  await writeAuditLog(req, {
    action: 'create',
    table_name: 'publication_categories',
    record_id: rows[0].id,
    before_value: null,
    after_value: rows[0],
  });

  res.status(201).json(rows[0]);
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

// ---------------------------------------------------------------------------
// FAQs — content_editor, super_admin
// ---------------------------------------------------------------------------
adminRouter.get('/faqs', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(`SELECT * FROM faqs ORDER BY sort_order ASC`);
  res.json({ results: rows });
});

const faqSchema = z.object({
  question: z.string().min(1).max(300),
  question_so: z.string().max(300).optional(),
  question_ar: z.string().max(300).optional(),
  answer: z.string().min(1),
  answer_so: z.string().optional(),
  answer_ar: z.string().optional(),
  sort_order: z.number().int().optional(),
});

adminRouter.post('/faqs', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = faqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid FAQ payload.' } });
  }
  const { question, question_so, question_ar, answer, answer_so, answer_ar, sort_order } = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO faqs (question, question_so, question_ar, answer, answer_so, answer_ar, sort_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [question, question_so ?? null, question_ar ?? null, answer, answer_so ?? null, answer_ar ?? null, sort_order ?? 0, req.user!.sub]
  );
  await writeAuditLog(req, { action: 'create', table_name: 'faqs', record_id: rows[0].id, before_value: null, after_value: rows[0] });
  res.status(201).json(rows[0]);
});

const faqUpdateSchema = z.object({
  question: z.string().min(1).max(300).optional(),
  question_so: z.string().max(300).nullable().optional(),
  question_ar: z.string().max(300).nullable().optional(),
  answer: z.string().min(1).optional(),
  answer_so: z.string().nullable().optional(),
  answer_ar: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

adminRouter.put('/faqs/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const parsed = faqUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid FAQ payload.' } });
  }
  const beforeRes = await pool.query('SELECT * FROM faqs WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'FAQ not found.' } });

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

  const { rows } = await pool.query(`UPDATE faqs SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  await writeAuditLog(req, { action: 'update', table_name: 'faqs', record_id: rows[0].id, before_value: before, after_value: rows[0] });
  res.json(rows[0]);
});

adminRouter.delete('/faqs/:id', requireRole('content_editor', 'super_admin'), async (req, res) => {
  const beforeRes = await pool.query('SELECT * FROM faqs WHERE id = $1', [req.params.id]);
  const before = beforeRes.rows[0];
  if (!before) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'FAQ not found.' } });
  await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
  await writeAuditLog(req, { action: 'delete', table_name: 'faqs', record_id: before.id, before_value: before, after_value: null });
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Newsletter subscribers — content_editor, super_admin (read + export only)
// ---------------------------------------------------------------------------
adminRouter.get('/newsletter-subscribers', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(`SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC`);
  res.json({ results: rows });
});

adminRouter.get('/newsletter-subscribers/export.csv', requireRole('content_editor', 'super_admin'), async (_req, res) => {
  const { rows } = await pool.query(`SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC`);
  const lines = ['email,subscribed_at', ...rows.map((r) => `${r.email},${new Date(r.created_at).toISOString()}`)];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
  res.send(lines.join('\n'));
});
