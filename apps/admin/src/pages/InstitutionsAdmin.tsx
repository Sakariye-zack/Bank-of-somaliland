import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
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

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1').replace(/\/v1$/, '');

function mediaUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function InstitutionsAdmin() {
  const [results, setResults] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', institution_type: 'bank', license_number: '', headquarters: '' });
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [websiteDraft, setWebsiteDraft] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  function startEditBranding(inst: Institution) {
    setEditingId(inst.id);
    setWebsiteDraft(inst.website_url ?? '');
    setLogoFile(null);
    setMessage(null);
    setError(null);
  }

  async function saveBranding(inst: Institution) {
    setSavingBranding(true);
    setError(null);
    setMessage(null);
    try {
      let logo_url = inst.logo_url ?? null;
      if (logoFile) {
        const uploaded = await api.uploadMedia([logoFile], null);
        logo_url = uploaded.images[0] ?? logo_url;
      }
      await api.updateInstitutionBranding(inst.id, { logo_url, website_url: websiteDraft || null });
      setMessage(`Updated branding for ${inst.name}.`);
      setEditingId(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save branding.');
    } finally {
      setSavingBranding(false);
    }
  }

  return (
    <>
      <h1>Licensed Institutions</h1>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Register New Institution</h3>
        {error && !editingId && <div className="status-error">{error}</div>}
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
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          Institutions with a logo and website link appear in the scrolling showcase on the public homepage.
        </p>
        {message && <div className="status-ok">{message}</div>}
        {editingId && error && <div className="status-error">{error}</div>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Logo</th>
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
              <Fragment key={inst.id}>
                <tr>
                  <td>
                    {inst.logo_url ? (
                      <img
                        src={mediaUrl(inst.logo_url)}
                        alt=""
                        style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--parchment-2)',
                          color: 'var(--bronze)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {initials(inst.name)}
                      </div>
                    )}
                  </td>
                  <td>{inst.name}</td>
                  <td>{TYPE_LABELS[inst.institution_type]}</td>
                  <td>{inst.headquarters ?? '—'}</td>
                  <td>{inst.license_number ?? '—'}</td>
                  <td>
                    <span className={`status-pill status-${inst.status}`}>{inst.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: 12, background: 'var(--parchment-2)' }}
                      onClick={() => (editingId === inst.id ? setEditingId(null) : startEditBranding(inst))}
                    >
                      {editingId === inst.id ? 'Close' : 'Edit branding'}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => toggleStatus(inst)}
                    >
                      {inst.status === 'active' ? 'Revoke' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
                {editingId === inst.id && (
                  <tr>
                    <td colSpan={7} style={{ background: 'var(--parchment-2)' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', padding: '10px 4px' }}>
                        <div className="form-row" style={{ marginBottom: 0 }}>
                          <label>Logo (image)</label>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                        <div className="form-row" style={{ marginBottom: 0, minWidth: 260 }}>
                          <label>Website URL</label>
                          <input
                            placeholder="https://example.com"
                            value={websiteDraft}
                            onChange={(e) => setWebsiteDraft(e.target.value)}
                          />
                        </div>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={savingBranding}
                          onClick={() => saveBranding(inst)}
                        >
                          {savingBranding ? 'Saving…' : 'Save branding'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
