import { Pool, types } from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
}

// DATE (OID 1082) defaults to a JS Date at local midnight, which shifts by a day
// once .toISOString() re-renders it in UTC. Keep it as the raw 'YYYY-MM-DD' string instead.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
