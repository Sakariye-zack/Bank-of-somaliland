import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { HeroSlide } from '@bos/shared-types';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1').replace(/\/v1$/, '');

function mediaUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

type SlideRow = HeroSlide & { is_active: boolean };

export function HeroSlidesAdmin() {
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [form, setForm] = useState({ title: '', subtitle: '', link_url: '/press' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api
      .heroSlides()
      .then((r) => setSlides(r.results.sort((a, b) => a.sort_order - b.sort_order)))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (!imageFile && !videoFile) {
        throw new Error('Choose an image or a video for this slide.');
      }
      const uploaded = await api.uploadMedia(imageFile ? [imageFile] : [], videoFile);
      const image_url = uploaded.images[0] ?? null;
      const video_url = uploaded.video;

      const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.sort_order)) + 1 : 1;
      await api.createHeroSlide({
        title: form.title,
        subtitle: form.subtitle || undefined,
        image_url,
        video_url,
        link_url: form.link_url || undefined,
        sort_order: nextOrder,
      });

      setMessage('Slide added to the homepage slider.');
      setForm({ title: '', subtitle: '', link_url: '/press' });
      setImageFile(null);
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to add slide.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(slide: SlideRow) {
    await api.updateHeroSlide(slide.id, { is_active: !slide.is_active });
    load();
  }

  async function move(slide: SlideRow, direction: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const swapWith = slides[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      api.updateHeroSlide(slide.id, { sort_order: swapWith.sort_order }),
      api.updateHeroSlide(swapWith.id, { sort_order: slide.sort_order }),
    ]);
    load();
  }

  async function remove(slide: SlideRow) {
    if (!confirm(`Remove "${slide.title}" from the slider? This cannot be undone.`)) return;
    await api.deleteHeroSlide(slide.id);
    load();
  }

  return (
    <>
      <h1>Homepage Slider</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          These slides appear at the top of the public homepage, above the exchange rate box. Use "Hide" to pull a
          slide out of rotation without deleting it.
        </p>
        {message && <div className="status-ok">{message}</div>}
        {error && <div className="status-error">{error}</div>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add a Slide</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Subtitle (optional)</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Link (where "Read more" goes)</label>
            <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Image</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="form-row">
            <label>Or video (used only if no image is chosen)</label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Uploading…' : 'Add slide'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Current Slides ({slides.length})</h3>
        {slides.length === 0 && <p style={{ color: 'var(--bronze)' }}>No slides yet — the slider stays hidden until you add one.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: 10,
                opacity: slide.is_active ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 60,
                  borderRadius: 4,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--night), var(--night-2))',
                  position: 'relative',
                }}
              >
                {slide.image_url ? (
                  <img src={mediaUrl(slide.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : slide.video_url ? (
                  <video src={mediaUrl(slide.video_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{slide.title}</div>
                {slide.subtitle && <div style={{ fontSize: 12, color: 'var(--bronze)' }}>{slide.subtitle}</div>}
                <span className={`status-pill ${slide.is_active ? 'status-active' : 'status-revoked'}`}>
                  {slide.is_active ? 'shown' : 'hidden'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn"
                  style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                  disabled={i === 0}
                  onClick={() => move(slide, -1)}
                  title="Move earlier"
                >
                  ↑
                </button>
                <button
                  className="btn"
                  style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                  disabled={i === slides.length - 1}
                  onClick={() => move(slide, 1)}
                  title="Move later"
                >
                  ↓
                </button>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleActive(slide)}>
                  {slide.is_active ? 'Hide' : 'Show'}
                </button>
                <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => remove(slide)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
