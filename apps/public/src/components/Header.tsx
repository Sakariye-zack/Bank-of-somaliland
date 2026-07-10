import { Link, NavLink } from 'react-router-dom';

const ABOUT_LINKS = [
  { to: '/about', label: 'About the Bank' },
  { to: '/governance', label: 'Governance' },
  { to: '/core-functions', label: 'Core Functions' },
];

const RESOURCE_LINKS = [
  { to: '/publications', label: 'Publications' },
  { to: '/laws', label: 'Laws & Regulations' },
  { to: '/press', label: 'Press Releases' },
  { to: '/careers', label: 'Careers & Tenders' },
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
            <img className="brand-mark-img" src="/logo.jpg" alt="Bank of Somaliland emblem" />
            <div className="brand-text">
              <div className="t1">Bank of Somaliland</div>
              <div className="t2">Central Monetary Authority</div>
            </div>
          </Link>
          <nav className="primary">
            <div className="nav-dropdown">
              <a>
                About <span className="caret">▾</span>
              </a>
              <div className="dd-panel">
                {ABOUT_LINKS.map((link) => (
                  <Link key={link.to} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/institutions" className={({ isActive }) => (isActive ? 'active' : '')}>
              Licensed Institutions
            </NavLink>
            <div className="nav-dropdown">
              <a>
                Resources <span className="caret">▾</span>
              </a>
              <div className="dd-panel">
                {RESOURCE_LINKS.map((link) => (
                  <Link key={link.to} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>
              Contact
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  );
}
