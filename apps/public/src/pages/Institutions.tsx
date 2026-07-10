import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Institution, InstitutionType } from '@bos/shared-types';

const TYPE_LABELS: Record<InstitutionType, string> = {
  bank: 'Bank',
  remit: 'Remittance',
  mm: 'Mobile Money',
  mfi: 'Microfinance',
  pay: 'Payment System',
  takaful: 'Takaful / Insurance',
  fx: 'Forex Dealer',
};

export function Institutions() {
  const [results, setResults] = useState<Institution[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .institutions({ type: type || undefined, status: status || undefined, q: q || undefined })
        .then((r) => setResults(r.results))
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [type, status, q]);

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Licensed Institutions Register</h2>
            <div className="sub">Confirm whether a financial institution currently holds a Bank of Somaliland license.</div>
          </div>
        </div>

        <div className="search-panel">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search by institution name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!results && !error && <div className="status-loading">Loading institutions…</div>}
          {results?.length === 0 && <div className="status-loading">No institutions match your search.</div>}

          {results && results.length > 0 && (
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Headquarters</th>
                  <th>License No.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((inst) => (
                  <tr key={inst.id}>
                    <td>{inst.name}</td>
                    <td>{TYPE_LABELS[inst.institution_type]}</td>
                    <td>{inst.headquarters ?? '—'}</td>
                    <td>{inst.license_number ?? '—'}</td>
                    <td>
                      <span className={`status-pill status-${inst.status}`}>
                        {inst.status === 'active' ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
