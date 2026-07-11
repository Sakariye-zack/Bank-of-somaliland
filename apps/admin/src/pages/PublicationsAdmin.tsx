import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { Publication, LawRegulation, PublicationCategory } from '@bos/shared-types';

const CATEGORY_LABELS: Record<PublicationCategory, string> = {
  annual_report: 'Annual Report',
  circular: 'Circular',
  stability_report: 'Stability Report',
};

export function PublicationsAdmin() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [laws, setLaws] = useState<LawRegulation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [pubForm, setPubForm] = useState({
    title: '',
    category: 'annual_report' as PublicationCategory,
    publish_date: new Date().toISOString().slice(0, 10),
  });
  const [pubFile, setPubFile] = useState<File | null>(null);
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const pubFileRef = useRef<HTMLInputElement>(null);

  const [lawForm, setLawForm] = useState({ title: '', law_number: '', effective_date: '' });
  const [lawFile, setLawFile] = useState<File | null>(null);
  const [lawSubmitting, setLawSubmitting] = useState(false);
  const lawFileRef = useRef<HTMLInputElement>(null);

  function load() {
    api.publications().then((r) => setPublications(r.results)).catch((e) => setError(e.message));
    api.lawsRegulations().then((r) => setLaws(r.results)).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handlePublicationSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pubFile) {
      setError('Choose a PDF file for this publication.');
      return;
    }
    setPubSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const uploaded = await api.uploadMedia([], null, pubFile);
      if (!uploaded.document) throw new Error('Upload did not return a document URL.');
      await api.createPublication({ ...pubForm, file_url: uploaded.document });
      setMessage('Publication uploaded.');
      setPubForm({ title: '', category: 'annual_report', publish_date: new Date().toISOString().slice(0, 10) });
      setPubFile(null);
      if (pubFileRef.current) pubFileRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload publication.');
    } finally {
      setPubSubmitting(false);
    }
  }

  async function handleLawSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lawFile) {
      setError('Choose a PDF file for this law/regulation.');
      return;
    }
    setLawSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const uploaded = await api.uploadMedia([], null, lawFile);
      if (!uploaded.document) throw new Error('Upload did not return a document URL.');
      await api.createLawRegulation({ ...lawForm, file_url: uploaded.document });
      setMessage('Law/regulation uploaded.');
      setLawForm({ title: '', law_number: '', effective_date: '' });
      setLawFile(null);
      if (lawFileRef.current) lawFileRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload law/regulation.');
    } finally {
      setLawSubmitting(false);
    }
  }

  return (
    <>
      <h1>Publications &amp; Laws</h1>
      {message && <div className="status-ok">{message}</div>}
      {error && <div className="status-error">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Upload a Publication</h3>
        <form onSubmit={handlePublicationSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Category</label>
            <select
              value={pubForm.category}
              onChange={(e) => setPubForm({ ...pubForm, category: e.target.value as PublicationCategory })}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Publish date</label>
            <input
              type="date"
              required
              value={pubForm.publish_date}
              onChange={(e) => setPubForm({ ...pubForm, publish_date: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>PDF file</label>
            <input ref={pubFileRef} type="file" accept="application/pdf" onChange={(e) => setPubFile(e.target.files?.[0] ?? null)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pubSubmitting}>
            {pubSubmitting ? 'Uploading…' : 'Upload publication'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>All Publications</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{CATEGORY_LABELS[p.category]}</td>
                <td>{p.publish_date}</td>
                <td>
                  <a href={mediaUrl(p.file_url)} target="_blank" rel="noreferrer">
                    View PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Upload a Law / Regulation</h3>
        <form onSubmit={handleLawSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={lawForm.title} onChange={(e) => setLawForm({ ...lawForm, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Law number</label>
            <input value={lawForm.law_number} onChange={(e) => setLawForm({ ...lawForm, law_number: e.target.value })} placeholder="e.g. 54/2012" />
          </div>
          <div className="form-row">
            <label>Effective date</label>
            <input
              type="date"
              value={lawForm.effective_date}
              onChange={(e) => setLawForm({ ...lawForm, effective_date: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>PDF file</label>
            <input ref={lawFileRef} type="file" accept="application/pdf" onChange={(e) => setLawFile(e.target.files?.[0] ?? null)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={lawSubmitting}>
            {lawSubmitting ? 'Uploading…' : 'Upload law/regulation'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>All Laws &amp; Regulations</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Law No.</th>
              <th>Effective</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {laws.map((l) => (
              <tr key={l.id}>
                <td>{l.title}</td>
                <td>{l.law_number ?? '—'}</td>
                <td>{l.effective_date ?? '—'}</td>
                <td>
                  <a href={mediaUrl(l.file_url)} target="_blank" rel="noreferrer">
                    View PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
