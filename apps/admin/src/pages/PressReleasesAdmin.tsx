import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { PressRelease } from '@bos/shared-types';

export function PressReleasesAdmin() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [form, setForm] = useState({ title: '', body: '', publish_date: new Date().toISOString().slice(0, 10), featured: false });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api
      .pressReleases()
      .then((r) => setReleases(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      let images: string[] = [];
      let video_url: string | null = null;

      if (imageFiles.length > 0 || videoFile) {
        const uploaded = await api.uploadMedia(imageFiles, videoFile);
        images = uploaded.images;
        video_url = uploaded.video;
      }

      await api.createPressRelease({ ...form, images, video_url });

      setMessage('Press release published.');
      setForm({ title: '', body: '', publish_date: new Date().toISOString().slice(0, 10), featured: false });
      setImageFiles([]);
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish press release.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Press Releases</h1>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Publish a Press Release</h3>
        {message && <div className="status-ok">{message}</div>}
        {error && <div className="status-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Body</label>
            <textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Publish date</label>
            <input
              type="date"
              required
              value={form.publish_date}
              onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Featured
            </label>
          </div>
          <div className="form-row">
            <label>Images (one or many)</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
            />
            {imageFiles.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--bronze)' }}>{imageFiles.length} image(s) selected</div>
            )}
          </div>
          <div className="form-row">
            <label>Video (optional)</label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            {videoFile && <div style={{ fontSize: 12, color: 'var(--bronze)' }}>{videoFile.name}</div>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Published Releases</h3>
        {releases.length === 0 && <p style={{ color: 'var(--bronze)' }}>No press releases yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {releases.map((r) => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--bronze)' }}>
                {r.publish_date} {r.featured && '· Featured'}
              </div>
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              {(r.images.length > 0 || r.video_url) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {r.images.map((img) => (
                    <img key={img} src={mediaUrl(img)} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 4 }} />
                  ))}
                  {r.video_url && (
                    <video src={mediaUrl(r.video_url)} style={{ width: 110, height: 70, borderRadius: 4 }} controls />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
