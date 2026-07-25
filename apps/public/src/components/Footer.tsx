import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';

export function Footer() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.subscribeNewsletter(email);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  const ABOUT_LINKS = [
    { to: '/about', label: t('navAboutTheBank') },
    { to: '/governance', label: t('navGovernance') },
    { to: '/core-functions', label: t('navCoreFunctions') },
    { to: '/institutions', label: t('navLicensedInstitutions') },
  ];

  const RESOURCE_LINKS = [
    { to: '/publications', label: t('navPublications') },
    { to: '/laws', label: t('navLawsRegulations') },
    { to: '/press', label: t('navPressReleases') },
    { to: '/careers', label: t('navCareersTenders') },
    { to: '/faq', label: t('footerFaq') },
    { to: '/statistics', label: t('footerStatistics') },
  ];

  return (
    <footer className="site">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img src="/logo.jpg" alt={t('bankEmblem')} className="footer-logo" />
            <div>
              <div className="footer-brand-name">{t('bankName')}</div>
              <div className="footer-brand-sub">{t('centralMonetaryAuthority')}</div>
            </div>
          </div>
          <p className="footer-blurb">{t('footerBlurb')}</p>
        </div>

        <div className="footer-col">
          <h5>{t('footerAbout')}</h5>
          <ul>
            {ABOUT_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>{t('footerResources')}</h5>
          <ul>
            {RESOURCE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>{t('footerStayInformed')}</h5>
          <p className="footer-note">{t('footerNote')}</p>
          <Link className="footer-cta" to="/press">
            {t('footerReadAnnouncements')}
          </Link>
          <Link className="footer-cta" to="/contact">
            {t('footerContact')}
          </Link>
          <a className="footer-cta" href={mediaUrl('/rss.xml')} target="_blank" rel="noreferrer">
            {t('footerRss')}
          </a>

          <p className="footer-note" style={{ marginTop: 16, marginBottom: 6 }}>
            {t('footerNewsletterTitle')}
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-form-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footerNewsletterPlaceholder')}
              />
              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? t('footerNewsletterSubmitting') : t('footerNewsletterButton')}
              </button>
            </div>
            {status === 'success' && <p className="newsletter-note is-success">{t('footerNewsletterSuccess')}</p>}
            {status === 'error' && <p className="newsletter-note is-error">{t('footerNewsletterError')}</p>}
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-row">
          <p>{t('footerRights', new Date().getFullYear())}</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link className="footer-bottom-note" to="/privacy-policy">
              {t('footerPrivacyPolicy')}
            </Link>
            <Link className="footer-bottom-note" to="/terms-of-use">
              {t('footerTermsOfUse')}
            </Link>
            <p className="footer-bottom-note" style={{ margin: 0 }}>
              {t('footerBottomNote')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
