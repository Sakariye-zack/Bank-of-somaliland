import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { Publication, LawRegulation, PublicationCategory, PublicationCategoryOption } from '@bos/shared-types';

export function PublicationsAdmin() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [laws, setLaws] = useState<LawRegulation[]>([]);
  const [categories, setCategories] = useState<PublicationCategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [pubForm, setPubForm] = useState({
    title: '',
    category: '' as PublicationCategory,
    publish_date: new Date().toISOString().slice(0, 10),
    is_downloadable: true,
  });
  const [pubFile, setPubFile] = useState<File | null>(null);
  const [pubThumb, setPubThumb] = useState<File | null>(null);
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const pubFileRef = useRef<HTMLInputElement>(null);
  const pubThumbRef = useRef<HTMLInputElement>(null);

  const [newCategory, setNewCategory] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  function categoryLabel(slug: string): string {
    return categories.find((c) => c.slug === slug)?.name ?? slug;
  }

  async function togglePublicationStatus(p: Publication) {
    const next = p.status === 'draft' ? 'published' : 'draft';
    setError(null);
    try {
      await api.setPublicationStatus(p.id, next);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  async function deletePublication(p: Publication) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.deletePublication(p.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete publication.');
    }
  }

  async function toggleLawStatus(l: LawRegulation) {
    const next = l.status === 'draft' ? 'published' : 'draft';
    setError(null);
    try {
      await api.setLawStatus(l.id, next);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  async function deleteLaw(l: LawRegulation) {
    if (!confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.deleteLawRegulation(l.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete law/regulation.');
    }
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setCategorySubmitting(true);
    setError(null);
    try {
      const created = await api.createPublicationCategory({ name: newCategory.trim() });
      setCategories((prev) => [...prev, created]);
      setPubForm((f) => ({ ...f, category: created.slug }));
      setNewCategory('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add category.');
    } finally {
      setCategorySubmitting(false);
    }
  }

  const [lawForm, setLawForm] = useState({ title: '', law_number: '', effective_date: '', is_downloadable: true });
  const [lawFile, setLawFile] = useState<File | null>(null);
  const [lawThumb, setLawThumb] = useState<File | null>(null);
  const [lawSubmitting, setLawSubmitting] = useState(false);
  const lawFileRef = useRef<HTMLInputElement>(null);
  const lawThumbRef = useRef<HTMLInputElement>(null);

  function load() {
    api.publications().then((r) => setPublications(r.results)).catch((e) => setError(e.message));
    api.lawsRegulations().then((r) => setLaws(r.results)).catch((e) => setError(e.message));
    api.publicationCategories().then((r) => {
      setCategories(r.results);
      setPubForm((f) => ({ ...f, category: f.category || r.results[0]?.slug || '' }));
    }).catch((e) => setError(e.message));
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
      let thumbnail_url: string | undefined;
      if (pubThumb) {
        const thumbUploaded = await api.uploadMedia([pubThumb], null);
        thumbnail_url = thumbUploaded.images[0];
      }
      await api.createPublication({ ...pubForm, file_url: uploaded.document, thumbnail_url });
      setMessage('Publication uploaded.');
      setPubForm({ title: '', category: categories[0]?.slug ?? '', publish_date: new Date().toISOString().slice(0, 10), is_downloadable: true });
      setPubFile(null);
      setPubThumb(null);
      if (pubFileRef.current) pubFileRef.current.value = '';
      if (pubThumbRef.current) pubThumbRef.current.value = '';
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
      let thumbnail_url: string | undefined;
      if (lawThumb) {
        const thumbUploaded = await api.uploadMedia([lawThumb], null);
        thumbnail_url = thumbUploaded.images[0];
      }
      await api.createLawRegulation({ ...lawForm, file_url: uploaded.document, thumbnail_url });
      setMessage('Law/regulation uploaded.');
      setLawForm({ title: '', law_number: '', effective_date: '', is_downloadable: true });
      setLawFile(null);
      setLawThumb(null);
      if (lawFileRef.current) lawFileRef.current.value = '';
      if (lawThumbRef.current) lawThumbRef.current.value = '';
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
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                placeholder="New category name…"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn" onClick={handleAddCategory} disabled={categorySubmitting || !newCategory.trim()}>
                {categorySubmitting ? 'Adding…' : '+ Add category'}
              </button>
            </div>
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
            <label>Cover thumbnail (optional — shown on the card instead of a plain block)</label>
            <input ref={pubThumbRef} type="file" accept="image/*" onChange={(e) => setPubThumb(e.target.files?.[0] ?? null)} />
          </div>
          <div className="form-row">
            <label>PDF file</label>
            <input ref={pubFileRef} type="file" accept="application/pdf" onChange={(e) => setPubFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pubForm.is_downloadable}
                onChange={(e) => setPubForm({ ...pubForm, is_downloadable: e.target.checked })}
              />
              Allow visitors to download this file (uncheck for view-only — opens in browser, no save prompt)
            </label>
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
              <th>Cover</th>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Access</th>
              <th>Status</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.thumbnail_url ? (
                    <img src={mediaUrl(p.thumbnail_url)} alt="" style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 3 }} />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{p.title}</td>
                <td>{categoryLabel(p.category)}</td>
                <td>{p.publish_date}</td>
                <td>{p.is_downloadable === false ? 'View only' : 'Downloadable'}</td>
                <td>{p.status === 'draft' ? 'Unpublished' : 'Published'}</td>
                <td>
                  <a href={mediaUrl(p.file_url)} target="_blank" rel="noreferrer">
                    View PDF
                  </a>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" onClick={() => togglePublicationStatus(p)}>
                    {p.status === 'draft' ? 'Publish' : 'Unpublish'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => deletePublication(p)}>
                    Delete
                  </button>
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
            <label>Cover thumbnail (optional)</label>
            <input ref={lawThumbRef} type="file" accept="image/*" onChange={(e) => setLawThumb(e.target.files?.[0] ?? null)} />
          </div>
          <div className="form-row">
            <label>PDF file</label>
            <input ref={lawFileRef} type="file" accept="application/pdf" onChange={(e) => setLawFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lawForm.is_downloadable}
                onChange={(e) => setLawForm({ ...lawForm, is_downloadable: e.target.checked })}
              />
              Allow visitors to download this file (uncheck for view-only)
            </label>
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
              <th>Cover</th>
              <th>Title</th>
              <th>Law No.</th>
              <th>Effective</th>
              <th>Access</th>
              <th>Status</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {laws.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.thumbnail_url ? (
                    <img src={mediaUrl(l.thumbnail_url)} alt="" style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 3 }} />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{l.title}</td>
                <td>{l.law_number ?? '—'}</td>
                <td>{l.effective_date ?? '—'}</td>
                <td>{l.is_downloadable === false ? 'View only' : 'Downloadable'}</td>
                <td>{l.status === 'draft' ? 'Unpublished' : 'Published'}</td>
                <td>
                  <a href={mediaUrl(l.file_url)} target="_blank" rel="noreferrer">
                    View PDF
                  </a>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" onClick={() => toggleLawStatus(l)}>
                    {l.status === 'draft' ? 'Publish' : 'Unpublish'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => deleteLaw(l)}>
                    Delete
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
