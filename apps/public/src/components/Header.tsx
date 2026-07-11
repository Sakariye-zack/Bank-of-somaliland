import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../lib/api';
import type { NavItem } from '@bos/shared-types';

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

export function Header() {
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api
      .navItems()
      .then((r) => {
        if (r.results.length > 0) setNavItems(r.results);
      })
      .catch(() => {
        // Keep the fallback nav — a nav-items outage shouldn't take down navigation entirely.
      });
  }, []);

  return (
    <>
      <div className="utility">
        <div className="wrap">
          <div className="links">
            <a href="tel:+252">Contact the Bank</a>
          </div>
          <div className="lang-switch" aria-label="Language switcher">
            <button className="active" type="button" title="English (only fully supported language for now)">
              EN
            </button>
            <button type="button" title="Somali — coming soon, will show fallback notice" disabled>
              SO
            </button>
            <button type="button" title="Arabic — coming soon, will show fallback notice" disabled>
              AR
            </button>
          </div>
        </div>
      </div>
      <header className="site">
        <div className="wrap nav-row">
          <Link className="brand" to="/">
            <img className="brand-mark-img" src="/logo.jpg" alt="Bank of Somaliland emblem" />
            <div className="brand-text">
              <div className="t1">Bank of Somaliland</div>
              <div className="t2">Central Monetary Authority</div>
            </div>
          </Link>

          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`primary${mobileOpen ? ' open' : ''}`}>
            {navItems.map((item) =>
              item.children && item.children.length > 0 ? (
                <div className="nav-dropdown" key={item.id}>
                  <a>
                    {item.label} <span className="caret">▾</span>
                  </a>
                  <div className="dd-panel">
                    {item.children.map((child) => (
                      <NavLinkOrExternal key={child.id} path={child.path}>
                        {child.label}
                      </NavLinkOrExternal>
                    ))}
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
