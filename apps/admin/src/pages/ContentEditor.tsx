import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { ContentPageSummary, ContentPageDetail, LanguageCode } from '@bos/shared-types';

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'so', label: 'Somali' },
];

export function ContentEditor() {
  const [pages, setPages] = useState<ContentPageSummary[]>([]);
  const [selected, setSelected] = useState<ContentPageDetail | null>(null);
  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
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

  function loadFormFor(detail: ContentPageDetail, lang: LanguageCode) {
    const t = detail.translations.find((tr) => tr.language_code === lang);
    setForm({ title: t?.title ?? '', body: t?.body ?? '', status: detail.status });
  }

  async function openPage(id: string) {
    setError(null);
    setMessage(null);
    const detail = await api.contentPage(id);
    setSelected(detail);
    setActiveLang('en');
    loadFormFor(detail, 'en');
  }

  function switchLang(lang: LanguageCode) {
    if (!selected) return;
    setActiveLang(lang);
    setMessage(null);
    loadFormFor(selected, lang);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.updateContent(selected.id, {
        language_code: activeLang,
        title: form.title,
        body: form.body,
        status: form.status,
      });
      setMessage('Saved.');
      loadPages();
      const refreshed = await api.contentPage(selected.id);
      setSelected(refreshed);
      loadFormFor(refreshed, activeLang);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Content Editor</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
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
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {LANGUAGES.map((l) => (
                        <span
                          key={l.code}
                          title={`${l.label}: ${page.languages.includes(l.code) ? 'complete' : 'missing'}`}
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 6px',
                            borderRadius: 10,
                            background: page.languages.includes(l.code) ? 'rgba(30,122,69,.15)' : 'rgba(178,58,58,.1)',
                            color: page.languages.includes(l.code) ? 'var(--teal)' : 'var(--danger)',
                          }}
                        >
                          {l.code.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {!selected && <p style={{ color: 'var(--bronze)' }}>Select a page to edit its content.</p>}
          {selected && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{selected.slug}</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  {LANGUAGES.map((l) => {
                    const hasContent = selected.translations.some((tr) => tr.language_code === l.code && tr.title);
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => switchLang(l.code)}
                        className="btn"
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          background: activeLang === l.code ? 'var(--gold)' : 'var(--parchment-2)',
                          color: activeLang === l.code ? 'var(--night)' : 'var(--ink)',
                        }}
                      >
                        {l.label} {hasContent ? '✓' : '—'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && <div className="status-ok">{message}</div>}
              {error && <div className="status-error">{error}</div>}

              <div className="form-row">
                <label>Title ({activeLang.toUpperCase()})</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Body ({activeLang.toUpperCase()}, HTML)</label>
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
                {saving ? 'Saving…' : `Save ${activeLang.toUpperCase()}`}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
