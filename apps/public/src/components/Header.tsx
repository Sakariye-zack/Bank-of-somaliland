import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Phone, Mail, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { XIcon as TwitterXIcon, FacebookIcon, YoutubeIcon, LinkedinIcon } from './SocialIcons';
import { SomalilandFlag } from './SomalilandFlag';
import { SearchIcon, XIcon } from './Icons';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { NavItem, SiteSettings } from '@bos/shared-types';

const FALLBACK_NAV: NavItem[] = [
  {
    id: 'fallback-about',
    label: 'About',
    path: '#',
    parent_id: null,
    sort_order: 1,
    children: [
      { id: 'fallback-about-1', label: 'About the Bank', path: '/about', parent_id: null, sort_order: 1 },
      { id: 'fallback-about-2', label: 'Governance', path: '/governance', parent_id: null, sort_order: 2 },
      { id: 'fallback-about-3', label: 'Core Functions', path: '/core-functions', parent_id: null, sort_order: 3 },
    ],
  },
  { id: 'fallback-inst', label: 'Licensed Institutions', path: '/institutions', parent_id: null, sort_order: 2 },
  {
    id: 'fallback-resources',
    label: 'Resources',
    path: '#',
    parent_id: null,
    sort_order: 3,
    children: [
      { id: 'fallback-res-1', label: 'Publications', path: '/publications', parent_id: null, sort_order: 1 },
      { id: 'fallback-res-2', label: 'Laws & Regulations', path: '/laws', parent_id: null, sort_order: 2 },
      { id: 'fallback-res-3', label: 'Press Releases', path: '/press', parent_id: null, sort_order: 3 },
      { id: 'fallback-res-4', label: 'Careers & Tenders', path: '/careers', parent_id: null, sort_order: 4 },
    ],
  },
  { id: 'fallback-contact', label: 'Contact', path: '/contact', parent_id: null, sort_order: 4 },
];

function NavLinkOrExternal({ path, children }: { path: string; children: ReactNode }) {
  if (/^https?:\/\//.test(path)) {
    return (
      <a href={path} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <NavLink to={path} className={({ isActive }) => (isActive ? 'active' : '')}>{children}</NavLink>;
}

// Renders one level of a dropdown panel's items. An item with its own children
// becomes a group header that flies out a nested panel on hover (desktop) or
// expands in place (mobile) — recurses to support arbitrary nav depth.
function DropdownItems({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item) =>
        item.children && item.children.length > 0 ? (
          <div className="nav-subgroup" key={item.id}>
            <span className="nav-subgroup-label">
              {item.label} <ChevronRight className="sub-caret" size={13} />
            </span>
            <div className="nav-subpanel">
              <DropdownItems items={item.children} />
            </div>
          </div>
        ) : (
          <NavLinkOrExternal key={item.id} path={item.path}>
            {item.label}
          </NavLinkOrExternal>
        )
      )}
    </>
  );
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Header() {
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { lang, setLang } = useLanguage();
  const t = useT();
  const now = useClock();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  }

  useEffect(() => {
    api
      .navItems(lang)
      .then((r) => {
        if (r.results.length > 0) setNavItems(r.results);
      })
      .catch(() => {
        // Keep the fallback nav — a nav-items outage shouldn't take down navigation entirely.
      });
  }, [lang]);

  useEffect(() => {
    api.siteSettings().then(setSettings).catch(() => {});
  }, []);

  const timeStr = now.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {(settings?.show_country_label ?? true) && (
        <div className="country-ribbon">
          <div className="wrap">
            {settings?.country_flag_url ? (
              <img className="country-ribbon-flag" src={mediaUrl(settings.country_flag_url)} alt="" />
            ) : (
              <SomalilandFlag width={34} />
            )}
            <div className="country-ribbon-text">
              <span className="line1">{settings?.country_label_en || t('republicOfSomaliland')}</span>
              <span className="line2">{settings?.country_label_so || 'Jamhuuriyadda Somaliland'}</span>
            </div>
          </div>
        </div>
      )}
      <div className="utility">
        <div className="wrap">
          <div className="links">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`}>
                <Phone size={13} /> {settings.phone}
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`}>
                <Mail size={13} /> {settings.email}
              </a>
            )}
            {(settings?.social_x || settings?.social_facebook || settings?.social_youtube || settings?.social_linkedin) && (
              <span className="follow-us">
                {t('followUs')}
                {settings.social_x && (
                  <a href={settings.social_x} target="_blank" rel="noreferrer" aria-label="X">
                    <TwitterXIcon size={13} />
                  </a>
                )}
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <FacebookIcon size={13} />
                  </a>
                )}
                {settings.social_youtube && (
                  <a href={settings.social_youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                    <YoutubeIcon size={14} />
                  </a>
                )}
                {settings.social_linkedin && (
                  <a href={settings.social_linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <LinkedinIcon size={13} />
                  </a>
                )}
              </span>
            )}
          </div>
          <div className="utility-right">
            <span className="clock">
              <Clock size={13} /> {timeStr}
            </span>
            <span className="clock">
              <Calendar size={13} /> {dateStr}
            </span>
            <div className="lang-switch" aria-label={t('langSwitcher')}>
            <button
              className={lang === 'en' ? 'active' : ''}
              type="button"
              title={t('langEnTitle')}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              className={lang === 'so' ? 'active' : ''}
              type="button"
              title={t('langSoTitle')}
              onClick={() => setLang('so')}
            >
              SO
            </button>
            <button
              className={lang === 'ar' ? 'active' : ''}
              type="button"
              title={t('langArTitle')}
              onClick={() => setLang('ar')}
            >
              AR
            </button>
            </div>
          </div>
        </div>
      </div>
      <header className="site">
        <div className="wrap nav-row">
          <Link className="brand" to="/">
            <img className="brand-mark-img" src={settings?.logo_url ? mediaUrl(settings.logo_url) : '/logo.jpg'} alt={t('bankEmblem')} />
            <div className="brand-text">
              <div className="t1">{settings?.site_name || t('bankName')}</div>
              <div className="t2">{t('centralMonetaryAuthority')}</div>
            </div>
          </Link>

          <div className="header-actions">
            <div className="header-search">
              <button
                type="button"
                className="search-toggle"
                aria-label={t('searchLabel')}
                onClick={() => setSearchOpen((v) => !v)}
              >
                {searchOpen ? <XIcon /> : <SearchIcon />}
              </button>
              {searchOpen && (
                <form className="search-popover" onSubmit={submitSearch}>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                  />
                  <button type="submit" aria-label={t('searchLabel')}>
                    <SearchIcon />
                  </button>
                </form>
              )}
            </div>

            <button
              className="menu-toggle"
              type="button"
              aria-label={t('toggleNav')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav className={`primary${mobileOpen ? ' open' : ''}`}>
            {navItems.map((item) =>
              item.children && item.children.length > 0 ? (
                <div className="nav-dropdown" key={item.id}>
                  <a>
                    {item.label} <ChevronDown className="caret" size={14} />
                  </a>
                  <div className="dd-panel">
                    <DropdownItems items={item.children} />
                  </div>
                </div>
              ) : (
                <NavLinkOrExternal key={item.id} path={item.path}>
                  {item.label}
                </NavLinkOrExternal>
              )
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
