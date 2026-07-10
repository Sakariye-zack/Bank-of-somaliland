import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AuditLogEntry } from '@bos/shared-types';

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .auditLog(100)
      .then((r) => setEntries(r.results))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Audit Log</h1>
      <div className="card">
        {error && <div className="status-error">{error}</div>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.created_at).toLocaleString()}</td>
                <td>{e.admin_email}</td>
                <td>{e.action}</td>
                <td>{e.table_name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.record_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
