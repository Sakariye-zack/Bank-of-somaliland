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
  subtitle: string | null;
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
    `SELECT title, subtitle, body FROM content_translations WHERE content_id = $1 AND content_table = $2 AND language_code = $3`,
    [contentId, table, requested]
  );
  if (res.rows.length === 0 && requested !== 'en') {
    served = 'en';
    fallbackUsed = true;
    res = await pool.query(
      `SELECT title, subtitle, body FROM content_translations WHERE content_id = $1 AND content_table = $2 AND language_code = 'en'`,
      [contentId, table]
    );
  }
  const row = res.rows[0];
  return {
    title: row?.title ?? null,
    subtitle: row?.subtitle ?? null,
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
    `SELECT id, slug, page_type, status, updated_at, banner_image_url, banner_video_url, animation_style
     FROM content_pages WHERE slug = $1 AND status = 'published'`,
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
    subtitle: t.subtitle,
    body: t.body,
    updated_at: page.updated_at,
    banner_image_url: page.banner_image_url,
    banner_video_url: page.banner_video_url,
    animation_style: page.animation_style,
  });
});

publicRouter.get('/exchange-rates/latest', async (_req, res) => {
  const latestDateRes = await pool.query('SELECT MAX(rate_date) AS as_of FROM exchange_rates');
  const asOf: string | null = latestDateRes.rows[0]?.as_of ?? null;

  if (!asOf) {
    return res.json({ as_of: null, rates: [] });
  }

  const lang = parseLang(_req.query.lang);
  const currentRes = await pool.query(
    `SELECT er.id, er.currency_code, er.buying_rate, er.selling_rate, c.name, c.name_so, c.name_ar, c.flag_url, c.sort_order
     FROM exchange_rates er
     LEFT JOIN currencies c ON c.code = er.currency_code
     WHERE er.rate_date = $1 AND (c.is_active IS NULL OR c.is_active = true)
     ORDER BY COALESCE(c.sort_order, 999), er.currency_code`,
    [asOf]
  );

  const rates = await Promise.all(
    currentRes.rows.map(async (row) => {
      const prevRes = await pool.query(
        `SELECT buying_rate FROM exchange_rates
         WHERE currency_code = $1 AND rate_date < $2
         ORDER BY rate_date DESC LIMIT 1`,
        [row.currency_code, asOf]
      );
      const prev = prevRes.rows[0]?.buying_rate;
      let trend: 'up' | 'down' | 'flat' = 'flat';
      let changePct = '0.0';
      if (prev) {
        const current = parseFloat(row.buying_rate);
        const previous = parseFloat(prev);
        const pct = ((current - previous) / previous) * 100;
        trend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
        changePct = pct.toFixed(1);
      }
      const name = lang === 'so' && row.name_so ? row.name_so : lang === 'ar' && row.name_ar ? row.name_ar : row.name;
      const spread = (parseFloat(row.selling_rate) - parseFloat(row.buying_rate)).toFixed(4);
      const spreadPct = ((parseFloat(row.selling_rate) - parseFloat(row.buying_rate)) / parseFloat(row.buying_rate) * 100).toFixed(2);
      return {
        id: row.id,
        currency_code: row.currency_code,
        currency_name: name,
        flag_url: row.flag_url,
        buying_rate: row.buying_rate,
        selling_rate: row.selling_rate,
        rate_to_ssh: row.buying_rate,
        spread,
        spread_pct: spreadPct,
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
    `SELECT rate_date, rate_to_ssh, buying_rate, selling_rate FROM exchange_rates
     WHERE currency_code = $1 AND rate_date BETWEEN $2 AND $3
     ORDER BY rate_date ASC`,
    [currency, from, to]
  );

  res.json({
    currency_code: currency,
    series: rows.map((r) => ({
      rate_date: r.rate_date,
      rate_to_ssh: r.rate_to_ssh,
      buying_rate: r.buying_rate,
      selling_rate: r.selling_rate,
    })),
  });
});

publicRouter.get('/site-settings', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT site_name, logo_url, watermark_url, phone, email,
            social_x, social_facebook, social_youtube, social_linkedin,
            country_label_en, country_label_so, show_country_label, country_flag_url
     FROM site_settings WHERE id = 1`
  );
  res.json(rows[0]);
});

publicRouter.get('/publication-categories', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query('SELECT slug, name, name_so, name_ar FROM publication_categories ORDER BY sort_order ASC');
  res.json({
    results: rows.map((r) => ({
      slug: r.slug,
      name: lang === 'so' && r.name_so ? r.name_so : lang === 'ar' && r.name_ar ? r.name_ar : r.name,
    })),
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
    `SELECT id, name, institution_type, status, headquarters, license_number, logo_url, website_url
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
  const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 50)) : null;
  const params: unknown[] = [];
  let where = "WHERE status = 'published'";
  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  let limitClause = '';
  if (limit) {
    params.push(limit);
    limitClause = ` LIMIT $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT id, title_content_id, category, file_url, publish_date, thumbnail_url, is_downloadable
     FROM publications ${where} ORDER BY publish_date DESC${limitClause}`,
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
        thumbnail_url: row.thumbnail_url,
        is_downloadable: row.is_downloadable,
        fallback_used: t.fallback_used,
      };
    })
  );

  res.json({ results });
});

publicRouter.get('/laws-regulations', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, title_content_id, file_url, law_number, effective_date, thumbnail_url, is_downloadable
     FROM laws_regulations WHERE status = 'published' ORDER BY effective_date DESC NULLS LAST`
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
        thumbnail_url: row.thumbnail_url,
        is_downloadable: row.is_downloadable,
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
    `SELECT id, label, label_so, label_ar, path, parent_id, sort_order FROM nav_items WHERE is_active = true ORDER BY sort_order ASC`
  );

  const localized = rows.map((r) => ({
    id: r.id,
    label: lang === 'so' && r.label_so ? r.label_so : lang === 'ar' && r.label_ar ? r.label_ar : r.label,
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
    `SELECT id, title, title_so, title_ar, subtitle, subtitle_so, subtitle_ar, image_url, video_url, link_url, sort_order
     FROM hero_slides WHERE is_active = true ORDER BY sort_order ASC`
  );

  function pick(base: string, so: string | null, ar: string | null): string {
    if (lang === 'so' && so) return so;
    if (lang === 'ar' && ar) return ar;
    return base;
  }

  res.json({
    results: rows.map((r) => ({
      id: r.id,
      title: pick(r.title, r.title_so, r.title_ar),
      subtitle: r.subtitle ? pick(r.subtitle, r.subtitle_so, r.subtitle_ar) : null,
      image_url: r.image_url,
      video_url: r.video_url,
      link_url: r.link_url,
      sort_order: r.sort_order,
    })),
  });
});

publicRouter.get('/faqs', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, question, question_so, question_ar, answer, answer_so, answer_ar
     FROM faqs WHERE is_active = true ORDER BY sort_order ASC`
  );

  function pick(base: string, so: string | null, ar: string | null): string {
    if (lang === 'so' && so) return so;
    if (lang === 'ar' && ar) return ar;
    return base;
  }

  res.json({
    results: rows.map((r) => ({
      id: r.id,
      question: pick(r.question, r.question_so, r.question_ar),
      answer: pick(r.answer, r.answer_so, r.answer_ar),
    })),
  });
});

const newsletterSchema = z.object({
  email: z.string().trim().email().max(255),
});

publicRouter.post('/newsletter/subscribe', async (req, res) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A valid email address is required.' } });
  }
  await pool.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [parsed.data.email]
  );
  res.status(201).json({ subscribed: true });
});

publicRouter.get('/statistics', async (_req, res) => {
  const [instByType, pubByCategory, pressByYear, rateCount] = await Promise.all([
    pool.query(
      `SELECT institution_type, COUNT(*)::int AS count FROM licensed_institutions WHERE status = 'active' GROUP BY institution_type ORDER BY count DESC`
    ),
    pool.query(
      `SELECT category, COUNT(*)::int AS count FROM publications WHERE status = 'published' GROUP BY category ORDER BY count DESC`
    ),
    pool.query(
      `SELECT EXTRACT(YEAR FROM publish_date)::int AS year, COUNT(*)::int AS count
       FROM press_releases WHERE status = 'published' GROUP BY year ORDER BY year ASC`
    ),
    pool.query(`SELECT COUNT(*)::int AS count FROM currencies WHERE is_active = true`),
  ]);

  res.json({
    institutions_by_type: instByType.rows,
    publications_by_category: pubByCategory.rows,
    press_releases_by_year: pressByYear.rows,
    active_currencies: rateCount.rows[0]?.count ?? 0,
  });
});

publicRouter.get('/bank-branches', async (req, res) => {
  const lang = parseLang(req.query.lang);
  const { rows } = await pool.query(
    `SELECT id, name, name_so, name_ar, city, city_so, city_ar, address, address_so, address_ar, phone, is_headquarters, sort_order,
            manager_name, manager_name_so, manager_name_ar, manager_title, manager_title_so, manager_title_ar, email, photo_url
     FROM bank_branches WHERE is_active = true ORDER BY sort_order ASC`
  );

  function pick(base: string, so: string | null, ar: string | null): string {
    if (lang === 'so' && so) return so;
    if (lang === 'ar' && ar) return ar;
    return base;
  }

  function pickNullable(base: string | null, so: string | null, ar: string | null): string | null {
    if (!base) return null;
    return pick(base, so, ar);
  }

  res.json({
    results: rows.map((r) => ({
      id: r.id,
      name: pick(r.name, r.name_so, r.name_ar),
      city: pick(r.city, r.city_so, r.city_ar),
      address: r.address ? pick(r.address, r.address_so, r.address_ar) : null,
      phone: r.phone,
      is_headquarters: r.is_headquarters,
      sort_order: r.sort_order,
      manager_name: pickNullable(r.manager_name, r.manager_name_so, r.manager_name_ar),
      manager_title: pickNullable(r.manager_title, r.manager_title_so, r.manager_title_ar),
      email: r.email,
      photo_url: r.photo_url,
    })),
  });
});

function snippetFor(body: string | null, q: string): string | null {
  if (!body) return null;
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return null;
  const idx = plain.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return plain.slice(0, 160) + (plain.length > 160 ? '…' : '');
  const start = Math.max(0, idx - 60);
  const end = Math.min(plain.length, idx + q.length + 100);
  return (start > 0 ? '…' : '') + plain.slice(start, end) + (end < plain.length ? '…' : '');
}

publicRouter.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const lang = parseLang(req.query.lang);

  if (q.length < 2) {
    return res.json({ query: q, results: [] });
  }
  const like = `%${q}%`;

  const [pages, press, pubs, laws] = await Promise.all([
    pool.query(
      `SELECT cp.slug, ct.title, ct.body
       FROM content_pages cp
       JOIN content_translations ct ON ct.content_id = cp.id AND ct.content_table = 'content_pages' AND ct.language_code = $1
       WHERE cp.status = 'published' AND (ct.title ILIKE $2 OR ct.body ILIKE $2)
       LIMIT 8`,
      [lang, like]
    ),
    pool.query(
      `SELECT pr.publish_date, ct.title, ct.body
       FROM press_releases pr
       JOIN content_translations ct ON ct.content_id = pr.content_id AND ct.content_table = 'press_releases' AND ct.language_code = $1
       WHERE pr.status = 'published' AND (ct.title ILIKE $2 OR ct.body ILIKE $2)
       ORDER BY pr.publish_date DESC
       LIMIT 8`,
      [lang, like]
    ),
    pool.query(
      `SELECT p.publish_date, p.category, ct.title
       FROM publications p
       JOIN content_translations ct ON ct.content_id = p.title_content_id AND ct.content_table = 'publications' AND ct.language_code = $1
       WHERE p.status = 'published' AND ct.title ILIKE $2
       ORDER BY p.publish_date DESC
       LIMIT 8`,
      [lang, like]
    ),
    pool.query(
      `SELECT l.effective_date, l.law_number, ct.title
       FROM laws_regulations l
       JOIN content_translations ct ON ct.content_id = l.title_content_id AND ct.content_table = 'laws_regulations' AND ct.language_code = $1
       WHERE l.status = 'published' AND ct.title ILIKE $2
       ORDER BY l.effective_date DESC NULLS LAST
       LIMIT 8`,
      [lang, like]
    ),
  ]);

  const results = [
    ...pages.rows.map((r) => ({
      type: 'page' as const,
      title: r.title,
      snippet: snippetFor(r.body, q),
      url: `/pages/${r.slug}`,
      date: null,
    })),
    ...press.rows.map((r) => ({
      type: 'press' as const,
      title: r.title,
      snippet: snippetFor(r.body, q),
      url: '/press',
      date: r.publish_date,
    })),
    ...pubs.rows.map((r) => ({
      type: 'publication' as const,
      title: r.title,
      snippet: null,
      url: '/publications',
      date: r.publish_date,
    })),
    ...laws.rows.map((r) => ({
      type: 'law' as const,
      title: r.title,
      snippet: null,
      url: '/laws',
      date: r.effective_date,
    })),
  ];

  res.json({ query: q, results });
});
