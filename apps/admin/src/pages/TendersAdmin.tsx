import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { Tender } from '@bos/shared-types';

export function TendersAdmin() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', reference_number: '', closing_date: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', reference_number: '', closing_date: '', description: '' });

  function load() {
    api.tenders().then((r) => setTenders(r.results)).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      let file_url: string | undefined;
      if (file) {
        const uploaded = await api.uploadMedia([], null, file);
        file_url = uploaded.document ?? undefined;
      }
      await api.createTender({ ...form, file_url });
      setMessage('Tender published.');
      setForm({ title: '', reference_number: '', closing_date: '', description: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish tender.');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(t: Tender) {
    setEditingId(t.id);
    setEditForm({
      title: t.title,
      reference_number: t.reference_number,
      closing_date: t.closing_date.slice(0, 10),
      description: t.description ?? '',
    });
    setMessage(null);
    setError(null);
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await api.updateTender(id, editForm);
      setMessage('Tender updated.');
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update tender.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(t: Tender) {
    const nextStatus = t.status === 'closed' ? 'open' : 'closed';
    setBusyId(t.id);
    setError(null);
    setMessage(null);
    try {
      await api.updateTender(t.id, { status: nextStatus });
      setMessage(nextStatus === 'open' ? `${t.title} marked active.` : `${t.title} marked inactive.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update tender status.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(t: Tender) {
    if (!confirm(`Permanently delete the tender "${t.title}"? This cannot be undone.`)) return;
    setBusyId(t.id);
    setError(null);
    setMessage(null);
    try {
      await api.deleteTender(t.id);
      setMessage('Tender deleted.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete tender.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <h1>Tenders</h1>
      {message && <div className="status-ok">{message}</div>}
      {error && <div className="status-error">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Publish a Tender</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Reference number</label>
            <input
              required
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              placeholder="e.g. BOS-TND-2026-015"
            />
          </div>
          <div className="form-row">
            <label>Closing date</label>
            <input
              type="date"
              required
              value={form.closing_date}
              onChange={(e) => setForm({ ...form, closing_date: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Scope, eligibility, submission instructions…"
            />
          </div>
          <div className="form-row">
            <label>Tender document (PDF, optional)</label>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish tender'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>All Tenders</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Ref. No.</th>
              <th>Closes</th>
              <th>Description</th>
              <th>Status</th>
              <th>File</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) =>
              editingId === t.id ? (
                <tr key={t.id}>
                  <td>
                    <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </td>
                  <td>
                    <input
                      value={editForm.reference_number}
                      onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editForm.closing_date}
                      onChange={(e) => setEditForm({ ...editForm, closing_date: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      rows={2}
                      style={{ width: '100%' }}
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </td>
                  <td>{t.status === 'closed' ? 'Inactive' : 'Active'}</td>
                  <td>
                    {t.file_url ? (
                      <a href={mediaUrl(t.file_url)} target="_blank" rel="noreferrer">
                        View PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      disabled={busyId === t.id}
                      onClick={() => saveEdit(t.id)}
                    >
                      Save
                    </button>
                    <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.reference_number}</td>
                  <td>{t.closing_date}</td>
                  <td style={{ color: t.description ? 'inherit' : 'var(--bronze)', maxWidth: 260 }}>
                    {t.description ? (t.description.length > 120 ? t.description.slice(0, 120) + '…' : t.description) : 'No description'}
                  </td>
                  <td>{t.status === 'closed' ? 'Inactive' : 'Active'}</td>
                  <td>
                    {t.file_url ? (
                      <a href={mediaUrl(t.file_url)} target="_blank" rel="noreferrer">
                        View PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === t.id} onClick={() => startEdit(t)}>
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      disabled={busyId === t.id}
                      onClick={() => handleToggleStatus(t)}
                    >
                      {t.status === 'closed' ? 'Mark active' : 'Mark inactive'}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      disabled={busyId === t.id}
                      onClick={() => handleDelete(t)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
            {tenders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: 'var(--bronze)' }}>
                  No tenders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
