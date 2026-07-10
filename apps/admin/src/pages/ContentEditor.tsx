import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { ContentPageSummary, ContentPageDetail } from '@bos/shared-types';

export function ContentEditor() {
  const [pages, setPages] = useState<ContentPageSummary[]>([]);
  const [selected, setSelected] = useState<ContentPageDetail | null>(null);
  const [form, setForm] = useState({ title: '', body: '', status: 'draft' as 'draft' | 'published' });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function loadPages() {
    api
      .contentPages()
      .then((r) => setPages(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(loadPages, []);

  async function openPage(id: string) {
    setError(null);
    setMessage(null);
    const detail = await api.contentPage(id);
    setSelected(detail);
    const en = detail.translations.find((t) => t.language_code === 'en');
    setForm({ title: en?.title ?? '', body: en?.body ?? '', status: detail.status });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateContent(selected.id, {
        language_code: 'en',
        title: form.title,
        body: form.body,
        status: form.status,
      });
      setMessage('Saved.');
      loadPages();
      openPage(selected.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Content Editor</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Pages</h3>
          {error && !selected && <div className="status-error">{error}</div>}
          <table className="admin-table">
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  onClick={() => openPage(page.id)}
                  style={{ cursor: 'pointer', background: selected?.id === page.id ? 'var(--parchment-2)' : undefined }}
                >
                  <td>
                    {page.slug}
                    <div style={{ fontSize: 11, color: 'var(--bronze)' }}>
                      {page.page_type} · {page.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {!selected && <p style={{ color: 'var(--bronze)' }}>Select a page to edit its English content.</p>}
          {selected && (
            <>
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>{selected.slug} (English)</h3>
              {message && <div className="status-ok">{message}</div>}
              {error && <div className="status-error">{error}</div>}
              <div className="form-row">
                <label>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Body (HTML)</label>
                <textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
