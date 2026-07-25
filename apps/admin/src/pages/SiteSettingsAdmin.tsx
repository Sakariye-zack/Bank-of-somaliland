import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { SiteSettings } from '@bos/shared-types';

export function SiteSettingsAdmin() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.siteSettings().then(setForm).catch((e) => setMessage({ type: 'error', text: e.message }));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setMessage(null);
    try {
      let logo_url = form.logo_url;
      let watermark_url = form.watermark_url;
      let country_flag_url = form.country_flag_url;
      if (logoFile) {
        const uploaded = await api.uploadMedia([logoFile], null);
        logo_url = uploaded.images[0] ?? logo_url;
      }
      if (watermarkFile) {
        const uploaded = await api.uploadMedia([watermarkFile], null);
        watermark_url = uploaded.images[0] ?? watermark_url;
      }
      if (flagFile) {
        const uploaded = await api.uploadMedia([flagFile], null);
        country_flag_url = uploaded.images[0] ?? country_flag_url;
      }
      const updated = await api.updateSiteSettings({ ...form, logo_url, watermark_url, country_flag_url });
      setForm(updated);
      setLogoFile(null);
      setWatermarkFile(null);
      setFlagFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (watermarkInputRef.current) watermarkInputRef.current.value = '';
      if (flagInputRef.current) flagInputRef.current.value = '';
      setMessage({ type: 'ok', text: 'Settings saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to save settings.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return <h1>Website Settings</h1>;

  return (
    <>
      <h1>Website Settings</h1>
      {message && <div className={message.type === 'ok' ? 'status-ok' : 'status-error'}>{message.text}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Branding</h3>
          <div className="form-row">
            <label>Website name</label>
            <input required value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Logo</label>
            {form.logo_url && (
              <img src={mediaUrl(form.logo_url)} alt="Current logo" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }} />
            )}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="form-row">
            <label>Watermark image (overlaid faintly on every page)</label>
            {form.watermark_url && (
              <img src={mediaUrl(form.watermark_url)} alt="Current watermark" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }} />
            )}
            <input ref={watermarkInputRef} type="file" accept="image/*" onChange={(e) => setWatermarkFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Country Masthead</h3>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
            A thin bilingual bar shown above the phone/email bar at the very top of every public page.
          </p>
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.show_country_label ?? true}
                onChange={(e) => setForm({ ...form, show_country_label: e.target.checked })}
              />
              Show the country masthead
            </label>
          </div>
          <div className="form-row">
            <label>Country name (English)</label>
            <input
              value={form.country_label_en ?? ''}
              onChange={(e) => setForm({ ...form, country_label_en: e.target.value })}
              placeholder="Republic of Somaliland"
            />
          </div>
          <div className="form-row">
            <label>Country name (Somali)</label>
            <input
              value={form.country_label_so ?? ''}
              onChange={(e) => setForm({ ...form, country_label_so: e.target.value })}
              placeholder="Jamhuuriyadda Somaliland"
            />
          </div>
          <div className="form-row">
            <label>Flag / emblem image (optional — replaces the default flag icon)</label>
            {form.country_flag_url && (
              <img
                src={mediaUrl(form.country_flag_url)}
                alt="Current flag"
                style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 3, marginBottom: 8 }}
              />
            )}
            <input ref={flagInputRef} type="file" accept="image/*" onChange={(e) => setFlagFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Contact</h3>
          <div className="form-row">
            <label>Phone</label>
            <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+252-63-7857777" />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@bankofsomaliland.so" />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Social Links</h3>
          <div className="form-row">
            <label>X (Twitter)</label>
            <input value={form.social_x ?? ''} onChange={(e) => setForm({ ...form, social_x: e.target.value })} placeholder="https://x.com/…" />
          </div>
          <div className="form-row">
            <label>Facebook</label>
            <input value={form.social_facebook ?? ''} onChange={(e) => setForm({ ...form, social_facebook: e.target.value })} placeholder="https://facebook.com/…" />
          </div>
          <div className="form-row">
            <label>YouTube</label>
            <input value={form.social_youtube ?? ''} onChange={(e) => setForm({ ...form, social_youtube: e.target.value })} placeholder="https://youtube.com/…" />
          </div>
          <div className="form-row">
            <label>LinkedIn</label>
            <input value={form.social_linkedin ?? ''} onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })} placeholder="https://linkedin.com/…" />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </>
  );
}
