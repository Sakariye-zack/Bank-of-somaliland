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

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

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
