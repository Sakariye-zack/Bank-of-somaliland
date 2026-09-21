import { useEffect, useState, type FormEvent, type CSSProperties } from 'react';
import { api } from '../lib/api';
import { Reveal } from '../components/Reveal';
import { useT } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Mail } from 'lucide-react';
import { PinIcon, PhoneIcon } from '../components/Icons';
import { XIcon, FacebookIcon, YoutubeIcon, LinkedinIcon } from '../components/SocialIcons';
import type { SiteSettings, BankBranch } from '@bos/shared-types';

export function Contact() {
  const t = useT();
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  // Honeypot: a field real visitors never see or fill, but form-filling bots
  // do. Any non-empty value here means the submission is spam.
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [headOffice, setHeadOffice] = useState<BankBranch | null>(null);

  useEffect(() => {
    api.siteSettings().then(setSettings).catch(() => {});
    api
      .bankBranches(lang)
      .then((r) => setHeadOffice(r.results.find((b) => b.is_headquarters) ?? r.results[0] ?? null))
      .catch(() => {});
  }, [lang]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await api.submitContact({ ...form, website });
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
      setWebsite('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    }
  }

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('contactTitle')}</h2>
              <div className="sub">{t('contactSub')}</div>
            </div>
          </div>

          <div className="contact-grid">
            <div>
              {status === 'sent' && (
                <div className="fallback-notice" style={{ background: 'rgba(30,122,69,.12)', color: 'var(--teal)' }}>
                  {t('contactThanks')}
                </div>
              )}
              {status === 'error' && <div className="status-error">{error}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                />
                <input
                  type="text"
                  placeholder={t('fullName')}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder={t('emailAddress')}
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder={t('subject')}
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                />
                <textarea
                  placeholder={t('message')}
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={inputStyle}
                />
                <button className="btn btn-primary" type="submit" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
                  {status === 'sending' ? t('sending') : t('sendMessage')}
                </button>
              </form>
            </div>

            <div className="contact-info-panel">
              <h3>{t('contactInfoTitle')}</h3>
              {settings?.phone && (
                <a className="contact-info-row" href={`tel:${settings.phone}`}>
                  <PhoneIcon />
                  <span>{settings.phone}</span>
                </a>
              )}
              {settings?.email && (
                <a className="contact-info-row" href={`mailto:${settings.email}`}>
                  <Mail size={16} />
                  <span>{settings.email}</span>
                </a>
              )}
              {headOffice && (
                <div className="contact-info-row">
                  <PinIcon />
                  <span>
                    {t('headOfficeLabel')} — {headOffice.city}
                    {headOffice.address ? `, ${headOffice.address}` : ''}
                  </span>
                </div>
              )}
              {(settings?.social_x || settings?.social_facebook || settings?.social_youtube || settings?.social_linkedin) && (
                <div className="contact-info-social">
                  {settings.social_x && (
                    <a href={settings.social_x} target="_blank" rel="noreferrer" aria-label="X">
                      <XIcon size={16} />
                    </a>
                  )}
                  {settings.social_facebook && (
                    <a href={settings.social_facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                      <FacebookIcon size={16} />
                    </a>
                  )}
                  {settings.social_youtube && (
                    <a href={settings.social_youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                      <YoutubeIcon size={17} />
                    </a>
                  )}
                  {settings.social_linkedin && (
                    <a href={settings.social_linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <LinkedinIcon size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const inputStyle: CSSProperties = {
  padding: '11px 14px',
  border: '1px solid var(--line)',
  borderRadius: 5,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  background: '#fff',
};
