import type { Request } from 'express';
import { pool } from '../db/pool';

export async function writeAuditLog(
  req: Request,
  params: {
    action: 'create' | 'update' | 'delete' | 'publish';
    table_name: string;
    record_id: string | null;
    before_value: unknown;
    after_value: unknown;
  }
) {
  const adminUserId = req.user?.sub;
  if (!adminUserId) throw new Error('writeAuditLog called without an authenticated user on the request');

  await pool.query(
    `INSERT INTO audit_log (admin_user_id, action, table_name, record_id, before_value, after_value, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      adminUserId,
      params.action,
      params.table_name,
      params.record_id,
      params.before_value ? JSON.stringify(params.before_value) : null,
      params.after_value ? JSON.stringify(params.after_value) : null,
      req.ip ?? null,
    ]
  );
}
