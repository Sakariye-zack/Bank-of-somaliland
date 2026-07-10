import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import type { LanguageCode } from '@bos/shared-types';

export const publicRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
});

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

publicRouter.post('/contact', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Please fill in all fields with a valid email.' } });
  }
  const { name, email, subject, message } = parsed.data;

  await pool.query(
    `INSERT INTO contact_messages (name, email, subject, message, ip_address) VALUES ($1, $2, $3, $4, $5)`,
    [stripTags(name), email, stripTags(subject), stripTags(message), req.ip ?? null]
  );

  res.status(201).json({ status: 'received' });
});

const LANGS: LanguageCode[] = ['en', 'so', 'ar'];

publicRouter.get('/content/:slug', async (req, res) => {
  const { slug } = req.params;
  const requested = LANGS.includes(req.query.lang as LanguageCode) ? (req.query.lang as LanguageCode) : 'en';

  const pageRes = await pool.query(
    `SELECT id, slug, page_type, status, updated_at FROM content_pages WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  const page = pageRes.rows[0];
  if (!page) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } });
  }

  let served: LanguageCode = requested;
  let fallbackUsed = false;
  let tRes = await pool.query(
    `SELECT title, body FROM content_translations WHERE content_id = $1 AND content_table = 'content_pages' AND language_code = $2`,
    [page.id, requested]
  );
  if (tRes.rows.length === 0 && requested !== 'en') {
    served = 'en';
    fallbackUsed = true;
    tRes = await pool.query(
      `SELECT title, body FROM content_translations WHERE content_id = $1 AND content_table = 'content_pages' AND language_code = 'en'`,
      [page.id]
    );
  }
  const translation = tRes.rows[0] ?? { title: null, body: null };

  res.json({
    slug: page.slug,
    page_type: page.page_type,
    status: page.status,
    language_requested: requested,
    language_served: served,
    fallback_used: fallbackUsed,
    title: translation.title,
    body: translation.body,
    updated_at: page.updated_at,
  });
});

publicRouter.get('/exchange-rates/latest', async (_req, res) => {
  const latestDateRes = await pool.query('SELECT MAX(rate_date) AS as_of FROM exchange_rates');
  const asOf: string | null = latestDateRes.rows[0]?.as_of ?? null;

  if (!asOf) {
    return res.json({ as_of: null, rates: [] });
  }

  const currentRes = await pool.query(
    'SELECT currency_code, rate_to_ssh FROM exchange_rates WHERE rate_date = $1',
    [asOf]
  );

  const rates = await Promise.all(
    currentRes.rows.map(async (row) => {
      const prevRes = await pool.query(
        `SELECT rate_to_ssh FROM exchange_rates
         WHERE currency_code = $1 AND rate_date < $2
         ORDER BY rate_date DESC LIMIT 1`,
        [row.currency_code, asOf]
      );
      const prev = prevRes.rows[0]?.rate_to_ssh;
      let trend: 'up' | 'down' | 'flat' = 'flat';
      let changePct = '0.0';
      if (prev) {
        const current = parseFloat(row.rate_to_ssh);
        const previous = parseFloat(prev);
        const pct = ((current - previous) / previous) * 100;
        trend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
        changePct = pct.toFixed(1);
      }
      return {
        currency_code: row.currency_code,
        rate_to_ssh: row.rate_to_ssh,
        trend,
        change_pct: changePct,
      };
    })
  );

  res.json({ as_of: asOf, rates });
});

publicRouter.get('/exchange-rates/history', async (req, res) => {
  const currency = String(req.query.currency || 'USD').toUpperCase();
  const from = req.query.from ? String(req.query.from) : '1900-01-01';
  const to = req.query.to ? String(req.query.to) : '2999-12-31';

  const { rows } = await pool.query(
    `SELECT rate_date, rate_to_ssh FROM exchange_rates
     WHERE currency_code = $1 AND rate_date BETWEEN $2 AND $3
     ORDER BY rate_date ASC`,
    [currency, from, to]
  );

  res.json({
    currency_code: currency,
    series: rows.map((r) => ({ rate_date: r.rate_date, rate_to_ssh: r.rate_to_ssh })),
  });
});

publicRouter.get('/institutions', async (req, res) => {
  const { type, status, q } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    params.push(type);
    conditions.push(`institution_type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (q) {
    params.push(`%${String(q).toLowerCase()}%`);
    conditions.push(`LOWER(name) LIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT id, name, institution_type, status, headquarters, license_number
     FROM licensed_institutions ${where} ORDER BY name ASC`,
    params
  );

  res.json({ total: rows.length, results: rows });
});

publicRouter.get('/press-releases', async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.page_size ?? '10'), 10) || 10));
  const offset = (page - 1) * pageSize;

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM press_releases WHERE status = 'published'`);
  const { rows } = await pool.query(
    `SELECT pr.id, pr.publish_date, pr.featured, pr.content_id
     FROM press_releases pr
     WHERE pr.status = 'published'
     ORDER BY pr.publish_date DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const tRes = await pool.query(
        `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = 'press_releases' AND language_code = 'en'`,
        [row.content_id]
      );
      return {
        id: row.id,
        publish_date: row.publish_date,
        title: tRes.rows[0]?.title ?? '(untitled)',
        featured: row.featured,
      };
    })
  );

  res.json({ page, page_size: pageSize, total: totalRes.rows[0].total, results });
});

publicRouter.get('/press-releases/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, publish_date, content_id, featured FROM press_releases WHERE id = $1 AND status = 'published'`,
    [req.params.id]
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Press release not found.' } });

  const tRes = await pool.query(
    `SELECT title, body FROM content_translations WHERE content_id = $1 AND content_table = 'press_releases' AND language_code = 'en'`,
    [row.content_id]
  );

  res.json({
    id: row.id,
    publish_date: row.publish_date,
    featured: row.featured,
    title: tRes.rows[0]?.title ?? '(untitled)',
    body: tRes.rows[0]?.body ?? '',
  });
});

publicRouter.get('/publications', async (req, res) => {
  const category = req.query.category ? String(req.query.category) : null;
  const params: unknown[] = [];
  let where = '';
  if (category) {
    params.push(category);
    where = 'WHERE category = $1';
  }

  const { rows } = await pool.query(
    `SELECT id, title_content_id, category, file_url, publish_date FROM publications ${where} ORDER BY publish_date DESC`,
    params
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const tRes = await pool.query(
        `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = 'publications' AND language_code = 'en'`,
        [row.title_content_id]
      );
      return {
        id: row.id,
        title: tRes.rows[0]?.title ?? '(untitled)',
        category: row.category,
        file_url: row.file_url,
        publish_date: row.publish_date,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/laws-regulations', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title_content_id, file_url, law_number, effective_date FROM laws_regulations ORDER BY effective_date DESC NULLS LAST`
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const tRes = await pool.query(
        `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = 'laws_regulations' AND language_code = 'en'`,
        [row.title_content_id]
      );
      return {
        id: row.id,
        title: tRes.rows[0]?.title ?? '(untitled)',
        file_url: row.file_url,
        law_number: row.law_number,
        effective_date: row.effective_date,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/job-postings', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : 'open';
  const { rows } = await pool.query(
    `SELECT id, title_content_id, department, closing_date, status FROM job_postings WHERE status = $1 ORDER BY closing_date ASC`,
    [status]
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const tRes = await pool.query(
        `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = 'job_postings' AND language_code = 'en'`,
        [row.title_content_id]
      );
      return {
        id: row.id,
        title: tRes.rows[0]?.title ?? '(untitled)',
        department: row.department,
        closing_date: row.closing_date,
        status: row.status,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/tenders', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title_content_id, reference_number, closing_date, file_url FROM tenders ORDER BY closing_date ASC`
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const tRes = await pool.query(
        `SELECT title FROM content_translations WHERE content_id = $1 AND content_table = 'tenders' AND language_code = 'en'`,
        [row.title_content_id]
      );
      return {
        id: row.id,
        title: tRes.rows[0]?.title ?? '(untitled)',
        reference_number: row.reference_number,
        closing_date: row.closing_date,
        file_url: row.file_url,
      };
    })
  );

  res.json({ results });
});
