import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/institutions', label: 'Licensed Institutions' },
  { to: '/publications', label: 'Publications & Laws' },
  { to: '/press', label: 'Press Releases' },
  { to: '/about', label: 'About the Bank' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
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
            <div className="brand-mark">BS</div>
            <div className="brand-text">
              <div className="t1">Bank of Somaliland</div>
              <div className="t2">Central Monetary Authority</div>
            </div>
          </Link>
          <nav className="primary">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
