import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { NavItem } from '@bos/shared-types';

type FlatNavItem = NavItem & { parent_id: string | null; is_active: boolean };

const KNOWN_PATHS = [
  { value: '/', label: 'Home' },
  { value: '/about', label: 'About the Bank' },
  { value: '/governance', label: 'Governance' },
  { value: '/core-functions', label: 'Core Functions' },
  { value: '/institutions', label: 'Licensed Institutions' },
  { value: '/publications', label: 'Publications' },
  { value: '/laws', label: 'Laws & Regulations' },
  { value: '/press', label: 'Press Releases' },
  { value: '/careers', label: 'Careers & Tenders' },
  { value: '/contact', label: 'Contact' },
  { value: '#', label: '(Dropdown header — no link)' },
  { value: 'custom', label: 'Custom URL…' },
];

export function NavigationAdmin() {
  const [items, setItems] = useState<FlatNavItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    label: '',
    pathChoice: '/about',
    customPath: '',
    parent_id: '',
    sort_order: 1,
  });

  function load() {
    api
      .navItems()
      .then((r) => setItems(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  const topLevel = items.filter((i) => !i.parent_id);
  const childrenOf = (id: string) => items.filter((i) => i.parent_id === id);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const path = form.pathChoice === 'custom' ? form.customPath : form.pathChoice;
      if (!path) throw new Error('Enter a URL for this custom link.');
      await api.createNavItem({
        label: form.label,
        path,
        parent_id: form.parent_id || null,
        sort_order: form.sort_order,
      });
      setMessage('Navigation item added.');
      setForm({ label: '', pathChoice: '/about', customPath: '', parent_id: '', sort_order: 1 });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add navigation item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: FlatNavItem) {
    await api.updateNavItem(item.id, { is_active: !item.is_active });
    load();
  }

  async function removeItem(item: FlatNavItem) {
    if (!confirm(`Remove "${item.label}" from the navigation bar?`)) return;
    await api.deleteNavItem(item.id);
    load();
  }

  return (
    <>
      <h1>Navigation Bar</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          Changes here update the public site's header navigation immediately — no code deploy needed.
        </p>
        {message && <div className="status-ok">{message}</div>}
        {error && <div className="status-error">{error}</div>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add Navigation Item</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Label (shown in the nav bar)</label>
            <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Links to</label>
            <select value={form.pathChoice} onChange={(e) => setForm({ ...form, pathChoice: e.target.value })}>
              {KNOWN_PATHS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {form.pathChoice === 'custom' && (
            <div className="form-row">
              <label>Custom URL</label>
              <input
                required
                placeholder="https://example.com or /some-path"
                value={form.customPath}
                onChange={(e) => setForm({ ...form, customPath: e.target.value })}
              />
            </div>
          )}
          <div className="form-row">
            <label>Group under (optional — makes this a dropdown item)</label>
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">— Top-level item —</option>
              {topLevel.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Order (lower numbers appear first)</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add to navigation'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Current Navigation</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Links to</th>
              <th>Order</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {topLevel.map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td style={{ fontWeight: 600 }}>{item.label}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.path}</td>
                  <td>{item.sort_order}</td>
                  <td>
                    <span className={`status-pill ${item.is_active ? 'status-active' : 'status-revoked'}`}>
                      {item.is_active ? 'active' : 'hidden'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleActive(item)}>
                      {item.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => removeItem(item)}>
                      Delete
                    </button>
                  </td>
                </tr>
                {childrenOf(item.id).map((child) => (
                  <tr key={child.id}>
                    <td style={{ paddingLeft: 28 }}>↳ {child.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{child.path}</td>
                    <td>{child.sort_order}</td>
                    <td>
                      <span className={`status-pill ${child.is_active ? 'status-active' : 'status-revoked'}`}>
                        {child.is_active ? 'active' : 'hidden'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleActive(child)}>
                        {child.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => removeItem(child)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
