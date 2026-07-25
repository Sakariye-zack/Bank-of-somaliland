import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { Tender } from '@bos/shared-types';

export function TendersAdmin() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', reference_number: '', closing_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setForm({ title: '', reference_number: '', closing_date: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish tender.');
    } finally {
      setSubmitting(false);
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
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.reference_number}</td>
                <td>{t.closing_date}</td>
                <td>
                  {t.file_url ? (
                    <a href={mediaUrl(t.file_url)} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {tenders.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--bronze)' }}>
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
