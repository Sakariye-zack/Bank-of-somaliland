import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import type { LanguageCode } from '@bos/shared-types';

export const publicRouter = Router();

const LANGS: LanguageCode[] = ['en', 'so', 'ar'];

function parseLang(value: unknown): LanguageCode {
  return LANGS.includes(value as LanguageCode) ? (value as LanguageCode) : 'en';
}

interface Translation {
  title: string | null;
  body: string | null;
  language_served: LanguageCode;
  fallback_used: boolean;
}

// Looks up a translation for the requested language, falling back to English
// (with fallback_used: true) when the requested language isn't available yet —
// the same contract as GET /content/:slug, generalized to every content type
// that hangs off the polymorphic content_translations table.
async function getTranslation(contentId: string, table: string, requested: LanguageCode): Promise<Translation> {
  let served = requested;
  let fallbackUsed = false;
  let res = await pool.query(
    `SELECT title, body FROM content_translations WHERE content_id = $1 AND content_table = $2 AND language_code = $3`,
    [contentId, table, requested]
  );
  if (res.rows.length === 0 && requested !== 'en') {
    served = 'en';
    fallbackUsed = true;
    res = await pool.query(
      `SELECT title, body FROM content_translations WHERE content_id = $1 AND content_table = $2 AND language_code = 'en'`,
      [contentId, table]
    );
  }
  const row = res.rows[0];
  return {
    title: row?.title ?? null,
    body: row?.body ?? null,
    language_served: served,
    fallback_used: fallbackUsed,
  };
}

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

publicRouter.get('/content/:slug', async (req, res) => {
  const { slug } = req.params;
  const requested = parseLang(req.query.lang);

  const pageRes = await pool.query(
    `SELECT id, slug, page_type, status, updated_at FROM content_pages WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  const page = pageRes.rows[0];
  if (!page) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } });
  }

  const t = await getTranslation(page.id, 'content_pages', requested);

  res.json({
    slug: page.slug,
    page_type: page.page_type,
    status: page.status,
    language_requested: requested,
    language_served: t.language_served,
    fallback_used: t.fallback_used,
    title: t.title,
    body: t.body,
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
  const lang = parseLang(req.query.lang);

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM press_releases WHERE status = 'published'`);
  const { rows } = await pool.query(
    `SELECT pr.id, pr.publish_date, pr.featured, pr.content_id, pr.video_url
     FROM press_releases pr
     WHERE pr.status = 'published'
     ORDER BY pr.publish_date DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const t = await getTranslation(row.content_id, 'press_releases', lang);
      const imgRes = await pool.query(
        `SELECT image_url FROM press_release_images WHERE press_release_id = $1 ORDER BY sort_order ASC`,
        [row.id]
      );
      return {
        id: row.id,
        publish_date: row.publish_date,
        title: t.title ?? '(untitled)',
        featured: row.featured,
        images: imgRes.rows.map((r) => r.image_url),
        video_url: row.video_url,
        language_served: t.language_served,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ page, page_size: pageSize, total: totalRes.rows[0].total, results });
});

publicRouter.get('/press-releases/:id', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, publish_date, content_id, featured, video_url FROM press_releases WHERE id = $1 AND status = 'published'`,
    [req.params.id]
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Press release not found.' } });

  const t = await getTranslation(row.content_id, 'press_releases', lang);
  const imgRes = await pool.query(
    `SELECT image_url FROM press_release_images WHERE press_release_id = $1 ORDER BY sort_order ASC`,
    [row.id]
  );

  res.json({
    id: row.id,
    publish_date: row.publish_date,
    featured: row.featured,
    title: t.title ?? '(untitled)',
    body: t.body ?? '',
    images: imgRes.rows.map((r) => r.image_url),
    video_url: row.video_url,
    language_served: t.language_served,
    fallback_used: t.fallback_used,
  });
});

publicRouter.get('/publications', async (req, res) => {
  const category = req.query.category ? String(req.query.category) : null;
  const lang = parseLang(req.query.lang);
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
      const t = await getTranslation(row.title_content_id, 'publications', lang);
      return {
        id: row.id,
        title: t.title ?? '(untitled)',
        category: row.category,
        file_url: row.file_url,
        publish_date: row.publish_date,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/laws-regulations', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, title_content_id, file_url, law_number, effective_date FROM laws_regulations ORDER BY effective_date DESC NULLS LAST`
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const t = await getTranslation(row.title_content_id, 'laws_regulations', lang);
      return {
        id: row.id,
        title: t.title ?? '(untitled)',
        file_url: row.file_url,
        law_number: row.law_number,
        effective_date: row.effective_date,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/job-postings', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : 'open';
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, title_content_id, department, closing_date, status FROM job_postings WHERE status = $1 ORDER BY closing_date ASC`,
    [status]
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const t = await getTranslation(row.title_content_id, 'job_postings', lang);
      return {
        id: row.id,
        title: t.title ?? '(untitled)',
        department: row.department,
        closing_date: row.closing_date,
        status: row.status,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/tenders', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, title_content_id, reference_number, closing_date, file_url FROM tenders ORDER BY closing_date ASC`
  );

  const results = await Promise.all(
    rows.map(async (row) => {
      const t = await getTranslation(row.title_content_id, 'tenders', lang);
      return {
        id: row.id,
        title: t.title ?? '(untitled)',
        reference_number: row.reference_number,
        closing_date: row.closing_date,
        file_url: row.file_url,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/nav-items', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, label, label_so, path, parent_id, sort_order FROM nav_items WHERE is_active = true ORDER BY sort_order ASC`
  );

  const localized = rows.map((r) => ({
    id: r.id,
    label: lang === 'so' && r.label_so ? r.label_so : r.label,
    path: r.path,
    parent_id: r.parent_id,
    sort_order: r.sort_order,
  }));

  const byId = new Map(localized.map((r) => [r.id, { ...r, children: [] as unknown[] }]));
  const roots: unknown[] = [];
  for (const row of localized) {
    const node = byId.get(row.id)!;
    if (row.parent_id && byId.has(row.parent_id)) {
      byId.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  res.json({ results: roots });
});

publicRouter.get('/hero-slides', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, title, title_so, subtitle, subtitle_so, image_url, video_url, link_url, sort_order
     FROM hero_slides WHERE is_active = true ORDER BY sort_order ASC`
  );

  res.json({
    results: rows.map((r) => ({
      id: r.id,
      title: lang === 'so' && r.title_so ? r.title_so : r.title,
      subtitle: (lang === 'so' && r.subtitle_so ? r.subtitle_so : r.subtitle) ?? null,
      image_url: r.image_url,
      video_url: r.video_url,
      link_url: r.link_url,
      sort_order: r.sort_order,
    })),
  });
});
