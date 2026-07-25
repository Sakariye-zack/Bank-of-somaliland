import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { NavItem } from '@bos/shared-types';

type FlatNavItem = NavItem & { parent_id: string | null; is_active: boolean };

const KNOWN_PATHS = [
  { value: '/', label: 'Home' },
  { value: '/about', label: 'About the Bank' },
  { value: '/about/overview', label: 'BoSL Overview' },
  { value: '/about/governors-statement', label: "Governor's Statement" },
  { value: '/about/history', label: 'History' },
  { value: '/governance', label: 'Governance / Board of Directors' },
  { value: '/about/senior-management', label: 'Senior Management' },
  { value: '/about/office-of-the-governor', label: 'Office of the Governor' },
  { value: '/about/structure', label: 'BoSL Structure' },
  { value: '/core-functions', label: 'Core Functions (overview)' },
  { value: '/functions/currency-banking-operations', label: 'Currency & Banking Operations Group' },
  { value: '/functions/monetary-financial-regulatory-policy', label: 'Monetary, Financial & Regulatory Policy Group' },
  { value: '/functions/payment-systems-nps', label: 'Payment Systems (NPS)' },
  { value: '/functions/financial-admin-support', label: 'Financial Administrative & Support Services Group' },
  { value: '/institutions', label: 'Licensed Institutions' },
  { value: '/publications', label: 'Publications' },
  { value: '/laws', label: 'Laws & Regulations' },
  { value: '/press', label: 'Press Releases / News' },
  { value: '/careers', label: 'Careers & Tenders / Vacancy' },
  { value: '/opportunities/training', label: 'Training' },
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

  // Flattened, indented list of every item — used so a new item can be nested
  // under a dropdown header OR under one of that header's own children (3 levels deep).
  function buildSelectOptions(): { item: FlatNavItem; depth: number }[] {
    const out: { item: FlatNavItem; depth: number }[] = [];
    function walk(parentId: string | null, depth: number) {
      for (const item of items.filter((i) => i.parent_id === parentId)) {
        out.push({ item, depth });
        walk(item.id, depth + 1);
      }
    }
    walk(null, 0);
    return out;
  }
  const selectableParents = buildSelectOptions();

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
    const hasKids = childrenOf(item.id).length > 0;
    const warning = hasKids
      ? `"${item.label}" has sub-items under it. Remove it and everything nested inside it?`
      : `Remove "${item.label}" from the navigation bar?`;
    if (!confirm(warning)) return;
    await api.deleteNavItem(item.id);
    load();
  }

  function NavRow({ item, depth }: { item: FlatNavItem; depth: number }) {
    const kids = childrenOf(item.id);
    return (
      <Fragment>
        <tr>
          <td style={{ paddingLeft: 12 + depth * 20, fontWeight: depth === 0 ? 600 : 400 }}>
            {depth > 0 && '↳ '}
            {item.label}
          </td>
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
        {kids.map((child) => (
          <NavRow key={child.id} item={child} depth={depth + 1} />
        ))}
      </Fragment>
    );
  }

  return (
    <>
      <h1>Navigation Bar</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          Changes here update the public site's header navigation immediately — no code deploy needed. Items can be
          nested up to three levels deep (e.g. BoSL Functions → Core Functions → Currency &amp; Banking Operations Group).
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
            <label>Group under (optional — makes this a dropdown/flyout item)</label>
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">— Top-level item —</option>
              {selectableParents.map(({ item, depth }) => (
                <option key={item.id} value={item.id}>
                  {'—'.repeat(depth)} {item.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--bronze)', marginTop: 4 }}>
              Picking a top-level item nests this one level deep (a dropdown link). Picking an item that is itself
              already nested creates a third level (a flyout submenu) — that's how "BoSL Functions → Core Functions"
              works.
            </p>
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
              <NavRow key={item.id} item={item} depth={0} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
