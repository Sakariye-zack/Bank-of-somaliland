import path from 'node:path';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { adminRouter } from './routes/admin';
import { requireRole } from './middleware/requireRole';
import { pool } from './db/pool';

const app = express();

// Uploaded media (press release images/video) is public read content, served
// cross-origin to the public site — relax CORP so <img>/<video> tags on a
// different port can actually load it.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

const publicOrigin = process.env.CORS_ORIGIN_PUBLIC || 'http://localhost:5173';
const adminOrigin = process.env.CORS_ORIGIN_ADMIN || 'http://localhost:5174';
app.use(
  cors({
    origin: [publicOrigin, adminOrigin],
    credentials: true,
  })
);

// Contact form / write-ish public traffic gets a stricter limiter; reads are generous.
const generalLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false });
app.use(generalLimiter);

app.get('/v1/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/rss.xml', async (_req, res) => {
  const siteUrl = process.env.PUBLIC_SITE_URL || publicOrigin;
  const settingsRes = await pool.query('SELECT site_name FROM site_settings WHERE id = 1');
  const siteName = settingsRes.rows[0]?.site_name || 'Bank of Somaliland';

  const { rows } = await pool.query(
    `SELECT pr.id, pr.publish_date, ct.title, ct.body
     FROM press_releases pr
     JOIN content_translations ct ON ct.content_id = pr.content_id AND ct.content_table = 'press_releases' AND ct.language_code = 'en'
     WHERE pr.status = 'published'
     ORDER BY pr.publish_date DESC
     LIMIT 30`
  );

  const items = rows
    .map((r) => {
      const plain = (r.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
      const link = `${siteUrl}/press`;
      const pubDate = new Date(r.publish_date).toUTCString();
      return `  <item>
    <title>${escapeXml(r.title || '(untitled)')}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="false">${r.id}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(plain)}</description>
  </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteName)} — Press Releases</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Official press releases from the ${escapeXml(siteName)}.</description>
  <language>en</language>
${items}
</channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
});

app.use('/v1/auth', authLimiter, authRouter);
app.use('/v1/contact', contactLimiter);
app.use('/v1', publicRouter);
app.use('/v1/admin', adminRouter);

app.get('/v1/admin/me', requireRole('super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer'), (req, res) => {
  res.json({ sub: req.user!.sub, email: req.user!.email, role: req.user!.role });
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Bank of Somaliland API listening on http://localhost:${port}`);
});

// Route handlers here are async and don't all wrap their DB calls in
// try/catch — since Node 15, an unhandled rejection terminates the process
// by default, so a single bad request (e.g. a malformed query) would take
// the whole site down for every user. Log and stay up instead.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (request likely failed, server staying up):', reason);
});
