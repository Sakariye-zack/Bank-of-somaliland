import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import type { ExchangeRatesLatestResponse } from '@bos/shared-types';

export function Dashboard() {
  const { user } = useAuth();
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);

  useEffect(() => {
    api.latestRates().then(setRates).catch(() => {});
  }, []);

  return (
    <>
      <h1>Dashboard</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          Signed in as <strong>{user?.email}</strong> — role: <strong>{user?.role.replace(/_/g, ' ')}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--bronze)', marginTop: 8 }}>
          Every write action below is enforced server-side by role. The navigation you see is filtered for
          convenience only — it is not the security boundary.
        </p>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Latest Published Rates</h3>
        {!rates && <div>Loading…</div>}
        {rates && rates.rates.length === 0 && <div>No rates published yet.</div>}
        {rates && rates.rates.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Rate to SSH</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rates.rates.map((r) => (
                <tr key={r.currency_code}>
                  <td>{r.currency_code}</td>
                  <td>{r.rate_to_ssh}</td>
                  <td>
                    {r.trend} ({r.change_pct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
