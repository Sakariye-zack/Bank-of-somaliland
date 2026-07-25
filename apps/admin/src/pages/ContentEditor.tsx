import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { RichTextEditor } from '../components/RichTextEditor';
import type { ContentPageSummary, ContentPageDetail, LanguageCode } from '@bos/shared-types';

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'so', label: 'Somali' },
  { code: 'ar', label: 'Arabic' },
];

export function ContentEditor() {
  const [pages, setPages] = useState<ContentPageSummary[]>([]);
  const [selected, setSelected] = useState<ContentPageDetail | null>(null);
  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
  const [form, setForm] = useState({ title: '', subtitle: '', body: '', status: 'draft' as 'draft' | 'published' });
  const [editMode, setEditMode] = useState<'rich' | 'html'>('rich');
  const [animationStyle, setAnimationStyle] = useState<string>('fade-up');
  const [banner, setBanner] = useState<{ image: string | null; video: string | null }>({ image: null, video: null });
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerVideoFile, setBannerVideoFile] = useState<File | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerImageRef = useRef<HTMLInputElement>(null);
  const bannerVideoRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showNewPage, setShowNewPage] = useState(false);
  const [newPage, setNewPage] = useState({ slug: '', title: '' });
  const [creating, setCreating] = useState(false);

  function loadPages() {
    api
      .contentPages()
      .then((r) => setPages(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(loadPages, []);

  // Seeded rich pages (History, Governance, Office of the Governor, BoSL Structure)
  // use hand-built card/timeline/chart markup that TipTap would flatten on save.
  // `content-wide` is the shared full-bleed wrapper every one of them uses, so it
  // catches future layouts too without needing another prefix added here.
  function hasCustomLayout(html: string): boolean {
    return /class="(gov-|history-|struct-|content-wide)/.test(html);
  }

  function loadFormFor(detail: ContentPageDetail, lang: LanguageCode) {
    const t = detail.translations.find((tr) => tr.language_code === lang);
    const body = t?.body ?? '';
    setForm({ title: t?.title ?? '', subtitle: t?.subtitle ?? '', body, status: detail.status });
    setEditMode(hasCustomLayout(body) ? 'html' : 'rich');
  }

  async function openPage(id: string) {
    setError(null);
    setMessage(null);
    const detail = await api.contentPage(id);
    setSelected(detail);
    setActiveLang('en');
    loadFormFor(detail, 'en');
    setBanner({ image: detail.banner_image_url ?? null, video: detail.banner_video_url ?? null });
    setAnimationStyle(detail.animation_style ?? 'fade-up');
    setBannerImageFile(null);
    setBannerVideoFile(null);
    if (bannerImageRef.current) bannerImageRef.current.value = '';
    if (bannerVideoRef.current) bannerVideoRef.current.value = '';
  }

  function switchLang(lang: LanguageCode) {
    if (!selected) return;
    setActiveLang(lang);
    setMessage(null);
    loadFormFor(selected, lang);
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleCreatePage() {
    const slug = slugify(newPage.slug || newPage.title);
    if (!slug || !newPage.title.trim()) {
      setError('Enter a page title (and optionally a slug).');
      return;
    }
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await api.createContentPage({ slug, title: newPage.title.trim() });
      setNewPage({ slug: '', title: '' });
      setShowNewPage(false);
      loadPages();
      await openPage(created.id);
      setMessage(`Page "${slug}" created. It's saved as a draft — publish it below when it's ready, then link it from Navigation Bar using the Custom URL option: /pages/${slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create page.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePage() {
    if (!selected) return;
    if (!confirm(`Delete page "${selected.slug}"? Remove it from Navigation Bar first if it's linked there. This cannot be undone.`)) return;
    setError(null);
    try {
      await api.deleteContentPage(selected.id);
      setSelected(null);
      loadPages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete page.');
    }
  }

  async function handleInlineImageSelected(file: File) {
    setInlineUploading(true);
    setError(null);
    try {
      const uploaded = await api.uploadMedia([file], null);
      const url = uploaded.images[0];
      if (!url) return;
      const fullUrl = mediaUrl(url);
      const imgTag = `<img src="${fullUrl}" alt="" />`;

      // Known photo slots: if the body has one of these containers, replace its
      // contents automatically instead of asking the admin to hand-edit the HTML
      // (manual cursor-paste into raw HTML is error-prone and easy to break).
      const photoSlotPattern = /(<div class="gov-profile-photo-art"[^>]*>)([\s\S]*?)(<\/div>)/;
      if (photoSlotPattern.test(form.body)) {
        setForm((f) => ({ ...f, body: f.body.replace(photoSlotPattern, `$1${imgTag}$3`) }));
        setMessage('Photo uploaded and placed automatically. Save to publish it.');
        return;
      }

      const textarea = bodyTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        const next = textarea.value.slice(0, start) + imgTag + textarea.value.slice(end);
        setForm((f) => ({ ...f, body: next }));
        setMessage('Image uploaded and inserted at the cursor position.');
      } else {
        setForm((f) => ({ ...f, body: f.body + imgTag }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload image.');
    } finally {
      setInlineUploading(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let banner_image_url = banner.image;
      let banner_video_url = banner.video;
      if (bannerImageFile) {
        const uploaded = await api.uploadMedia([bannerImageFile], null);
        banner_image_url = uploaded.images[0] ?? banner_image_url;
      }
      if (bannerVideoFile) {
        const uploaded = await api.uploadMedia([], bannerVideoFile);
        banner_video_url = uploaded.video ?? banner_video_url;
      }
      await api.updateContent(selected.id, {
        language_code: activeLang,
        title: form.title,
        subtitle: form.subtitle || null,
        body: form.body,
        status: form.status,
        banner_image_url,
        banner_video_url,
        animation_style: animationStyle,
      });
      setMessage('Saved.');
      setBannerImageFile(null);
      setBannerVideoFile(null);
      if (bannerImageRef.current) bannerImageRef.current.value = '';
      if (bannerVideoRef.current) bannerVideoRef.current.value = '';
      loadPages();
      const refreshed = await api.contentPage(selected.id);
      setSelected(refreshed);
      loadFormFor(refreshed, activeLang);
      setBanner({ image: refreshed.banner_image_url ?? null, video: refreshed.banner_video_url ?? null });
      setAnimationStyle(refreshed.animation_style ?? 'fade-up');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBanner(kind: 'image' | 'video') {
    if (!selected) return;
    setBannerUploading(true);
    setError(null);
    try {
      await api.updateContent(selected.id, {
        language_code: activeLang,
        title: form.title,
        subtitle: form.subtitle || null,
        body: form.body,
        status: form.status,
        banner_image_url: kind === 'image' ? null : banner.image,
        banner_video_url: kind === 'video' ? null : banner.video,
        animation_style: animationStyle,
      });
      setBanner((b) => ({ ...b, [kind]: null }));
      loadPages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove banner.');
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <>
      <h1>Content Editor</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Pages</h3>
            <button type="button" className="btn" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowNewPage((v) => !v)}>
              {showNewPage ? 'Cancel' : '+ New page'}
            </button>
          </div>

          {showNewPage && (
            <div style={{ background: 'var(--parchment-2)', borderRadius: 6, padding: 14, margin: '14px 0' }}>
              <div className="form-row">
                <label>Page title</label>
                <input
                  value={newPage.title}
                  onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Currency Exchange Guidelines"
                />
              </div>
              <div className="form-row">
                <label>URL slug (optional — auto-generated from title)</label>
                <input
                  value={newPage.slug}
                  onChange={(e) => setNewPage((p) => ({ ...p, slug: e.target.value }))}
                  placeholder={slugify(newPage.title) || 'currency-exchange-guidelines'}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={handleCreatePage} disabled={creating}>
                {creating ? 'Creating…' : 'Create page'}
              </button>
              {error && <div className="status-error" style={{ marginTop: 10 }}>{error}</div>}
            </div>
          )}

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
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {selected.page_type === 'custom' && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: 12, marginRight: 8 }}
                      onClick={handleDeletePage}
                    >
                      Delete page
                    </button>
                  )}
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

              <div className="form-row" style={{ background: 'var(--parchment-2)', borderRadius: 6, padding: 14 }}>
                <label style={{ marginBottom: 8 }}>Page banner (image or video, shown at the top of this page)</label>
                {banner.image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <img src={mediaUrl(banner.image)} alt="" style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                    <button type="button" className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} disabled={bannerUploading} onClick={() => handleRemoveBanner('image')}>
                      Remove image
                    </button>
                  </div>
                )}
                {banner.video && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <video src={mediaUrl(banner.video)} style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 4 }} muted />
                    <button type="button" className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} disabled={bannerUploading} onClick={() => handleRemoveBanner('video')}>
                      Remove video
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--bronze)' }}>Banner image</label>
                    <input ref={bannerImageRef} type="file" accept="image/*" onChange={(e) => setBannerImageFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--bronze)' }}>Or banner video</label>
                    <input ref={bannerVideoRef} type="file" accept="video/mp4,video/webm" onChange={(e) => setBannerVideoFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--bronze)', margin: '8px 0 0' }}>
                  Choosing a file here only takes effect after you press Save below.
                </p>
              </div>

              <div className="form-row">
                <label>Title ({activeLang.toUpperCase()})</label>
                <input
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Hero lede ({activeLang.toUpperCase()})</label>
                <textarea
                  dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                  rows={3}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Short summary shown under the page title in the hero banner. Leave empty to hide."
                  style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 6, resize: 'vertical' }}
                />
              </div>
              <div className="form-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Body ({activeLang.toUpperCase()})</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        background: editMode === 'rich' ? 'var(--gold)' : 'var(--parchment-2)',
                        color: editMode === 'rich' ? 'var(--night)' : 'var(--ink)',
                      }}
                      onClick={() => setEditMode('rich')}
                    >
                      Rich Text
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        background: editMode === 'html' ? 'var(--gold)' : 'var(--parchment-2)',
                        color: editMode === 'html' ? 'var(--night)' : 'var(--ink)',
                      }}
                      onClick={() => setEditMode('html')}
                    >
                      HTML Source
                    </button>
                    {editMode === 'html' && (
                      <>
                        <button
                          type="button"
                          className="btn"
                          disabled={inlineUploading}
                          style={{ padding: '4px 10px', fontSize: 11.5, background: 'var(--parchment-2)', color: 'var(--ink)' }}
                          onClick={() => inlineImageRef.current?.click()}
                        >
                          {inlineUploading ? 'Uploading…' : 'Upload Image'}
                        </button>
                        <input
                          ref={inlineImageRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInlineImageSelected(file);
                            e.target.value = '';
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                {hasCustomLayout(form.body) && editMode === 'rich' && (
                  <div className="status-error" style={{ marginBottom: 8, fontSize: 12.5 }}>
                    This page uses a custom design layout (cards, timelines, tables). Switching to Rich Text and saving
                    will strip that formatting down to plain paragraphs. Use "HTML Source" to edit the text safely.
                  </div>
                )}
                {editMode === 'html' ? (
                  <textarea
                    ref={bodyTextareaRef}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                    rows={22}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      padding: 12,
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      resize: 'vertical',
                    }}
                  />
                ) : (
                  <RichTextEditor
                    key={`${selected.id}-${activeLang}`}
                    value={form.body}
                    onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                    dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
                  />
                )}
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
              <div className="form-row">
                <label>Scroll-in animation for this page's content</label>
                <select value={animationStyle} onChange={(e) => setAnimationStyle(e.target.value)}>
                  <option value="fade-up">Fade up (default)</option>
                  <option value="fade-in">Fade in (no movement)</option>
                  <option value="slide-left">Slide in from the left</option>
                  <option value="slide-right">Slide in from the right</option>
                  <option value="zoom">Zoom in</option>
                  <option value="none">None</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--bronze)', margin: '6px 0 0' }}>
                  Controls how this page's content and hero title animate into view. Gives each page its own feel.
                </p>
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
