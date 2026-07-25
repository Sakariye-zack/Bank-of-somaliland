import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { BankBranch } from '@bos/shared-types';

type BranchRow = BankBranch & { is_active: boolean };

export function BankBranchesAdmin() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    is_headquarters: false,
    manager_name: '',
    manager_title: '',
    email: '',
    photo_url: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ manager_name: '', manager_title: '', email: '', phone: '' });

  function load() {
    api
      .bankBranches()
      .then((r) => setBranches(r.results.sort((a, b) => a.sort_order - b.sort_order)))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      let photoUrl = form.photo_url;

      if (photoFile) {
        const uploadRes = await api.uploadMedia([photoFile], null);
        photoUrl = uploadRes.images[0] ?? '';
      }

      const nextOrder = branches.length > 0 ? Math.max(...branches.map((b) => b.sort_order)) + 1 : 1;
      await api.createBankBranch({
        name: form.name,
        city: form.city,
        address: form.address || undefined,
        phone: form.phone || undefined,
        is_headquarters: form.is_headquarters,
        sort_order: nextOrder,
        manager_name: form.manager_name || undefined,
        manager_title: form.manager_title || undefined,
        email: form.email || undefined,
        photo_url: photoUrl || undefined,
      });
      setMessage('Branch added.');
      setForm({ name: '', city: '', address: '', phone: '', is_headquarters: false, manager_name: '', manager_title: '', email: '', photo_url: '' });
      setPhotoFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to add branch.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(branch: BranchRow) {
    await api.updateBankBranch(branch.id, { is_active: !branch.is_active });
    load();
  }

  async function move(branch: BranchRow, direction: -1 | 1) {
    const idx = branches.findIndex((b) => b.id === branch.id);
    const swapWith = branches[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      api.updateBankBranch(branch.id, { sort_order: swapWith.sort_order }),
      api.updateBankBranch(swapWith.id, { sort_order: branch.sort_order }),
    ]);
    load();
  }

  async function remove(branch: BranchRow) {
    if (!confirm(`Remove "${branch.name}"? This cannot be undone.`)) return;
    await api.deleteBankBranch(branch.id);
    load();
  }

  function startEdit(branch: BranchRow) {
    setEditingId(branch.id);
    setEditForm({
      manager_name: branch.manager_name ?? '',
      manager_title: branch.manager_title ?? '',
      email: branch.email ?? '',
      phone: branch.phone ?? '',
    });
  }

  async function saveEdit(branch: BranchRow) {
    await api.updateBankBranch(branch.id, {
      manager_name: editForm.manager_name || null,
      manager_title: editForm.manager_title || null,
      email: editForm.email || null,
      phone: editForm.phone || null,
    });
    setEditingId(null);
    load();
  }

  return (
    <>
      <h1>Central Bank Branches</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          These branch offices appear on the public homepage, below the Licensed Institutions register. Use "Hide"
          to pull a branch out of the public list without deleting it.
        </p>
        {message && <div className="status-ok">{message}</div>}
        {error && <div className="status-error">{error}</div>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add a Branch</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Branch name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Head Office, Burao Branch"
            />
          </div>
          <div className="form-row">
            <label>City</label>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Address (optional)</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Branch manager name (optional)</label>
            <input
              value={form.manager_name}
              onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
              placeholder="e.g. Full name of the manager in charge"
            />
          </div>
          <div className="form-row">
            <label>Manager title (optional)</label>
            <input
              value={form.manager_title}
              onChange={(e) => setForm({ ...form, manager_title: e.target.value })}
              placeholder="e.g. Branch Manager"
            />
          </div>
          <div className="form-row">
            <label>Branch email (optional)</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Branch manager photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhotoFile(file);
              }}
            />
            {photoFile && <div style={{ fontSize: 12, color: 'var(--bronze)', marginTop: 4 }}>Selected: {photoFile.name}</div>}
          </div>
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_headquarters}
                onChange={(e) => setForm({ ...form, is_headquarters: e.target.checked })}
              />
              This is the head office
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add branch'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Current Branches ({branches.length})</h3>
        {branches.length === 0 && <p style={{ color: 'var(--bronze)' }}>No branches yet — add the head office first.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {branches.map((branch, i) => (
            <div
              key={branch.id}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: 10,
                opacity: branch.is_active ? 1 : 0.55,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {branch.name} {branch.is_headquarters && <span className="status-pill status-active">HQ</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--bronze)' }}>
                    {branch.city}
                    {branch.address ? ` — ${branch.address}` : ''}
                    {branch.phone ? ` · ${branch.phone}` : ''}
                  </div>
                  {branch.manager_name && (
                    <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2 }}>
                      {branch.manager_title || 'Branch Manager'}: {branch.manager_name}
                    </div>
                  )}
                  <span className={`status-pill ${branch.is_active ? 'status-active' : 'status-revoked'}`}>
                    {branch.is_active ? 'shown' : 'hidden'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn"
                    style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === 0}
                    onClick={() => move(branch, -1)}
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === branches.length - 1}
                    onClick={() => move(branch, 1)}
                    title="Move later"
                  >
                    ↓
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: 12, background: 'var(--parchment-2)' }}
                    onClick={() => (editingId === branch.id ? setEditingId(null) : startEdit(branch))}
                  >
                    {editingId === branch.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleActive(branch)}>
                    {branch.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => remove(branch)}>
                    Delete
                  </button>
                </div>
              </div>
              {editingId === branch.id && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Manager name</label>
                    <input value={editForm.manager_name} onChange={(e) => setEditForm({ ...editForm, manager_name: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Manager title</label>
                    <input value={editForm.manager_title} onChange={(e) => setEditForm({ ...editForm, manager_title: e.target.value })} placeholder="e.g. Branch Manager" />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Phone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Email</label>
                    <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => saveEdit(branch)}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
