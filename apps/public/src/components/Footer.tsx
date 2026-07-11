import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';

export function Footer() {
  const t = useT();

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
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-row">
          <p>{t('footerRights', new Date().getFullYear())}</p>
          <p className="footer-bottom-note">{t('footerBottomNote')}</p>
        </div>
      </div>
    </footer>
  );
}
