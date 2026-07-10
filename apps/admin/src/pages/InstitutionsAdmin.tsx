import { useEffect, useState, type FormEvent } from 'react';
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

export function InstitutionsAdmin() {
  const [results, setResults] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', institution_type: 'bank', license_number: '', headquarters: '' });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api
      .institutions()
      .then((r) => setResults(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createInstitution(form);
      setForm({ name: '', institution_type: 'bank', license_number: '', headquarters: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create institution.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(inst: Institution) {
    const next = inst.status === 'active' ? 'revoked' : 'active';
    if (!confirm(`Change ${inst.name} status to "${next}"? This writes an audit log entry.`)) return;
    await api.updateInstitutionStatus(inst.id, next);
    load();
  }

  return (
    <>
      <h1>Licensed Institutions</h1>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Register New Institution</h3>
        {error && <div className="status-error">{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Type</label>
            <select value={form.institution_type} onChange={(e) => setForm({ ...form, institution_type: e.target.value })}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>License No.</label>
            <input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Headquarters</label>
            <input value={form.headquarters} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add institution'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>All Institutions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Headquarters</th>
              <th>License No.</th>
              <th>Status</th>
              <th></th>
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
                  <span className={`status-pill status-${inst.status}`}>{inst.status}</span>
                </td>
                <td>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => toggleStatus(inst)}
                  >
                    {inst.status === 'active' ? 'Revoke' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
