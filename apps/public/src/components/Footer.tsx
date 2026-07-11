import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/about', label: 'About the Bank' },
  { to: '/governance', label: 'Governance' },
  { to: '/core-functions', label: 'Core Functions' },
  { to: '/institutions', label: 'Licensed Institutions' },
];

const RESOURCE_LINKS = [
  { to: '/publications', label: 'Publications' },
  { to: '/laws', label: 'Laws & Regulations' },
  { to: '/press', label: 'Press Releases' },
  { to: '/careers', label: 'Careers & Tenders' },
];

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img src="/logo.jpg" alt="Bank of Somaliland emblem" className="footer-logo" />
            <div>
              <div className="footer-brand-name">Bank of Somaliland</div>
              <div className="footer-brand-sub">Central Monetary Authority</div>
            </div>
          </div>
          <p className="footer-blurb">
            The official monetary authority of the Republic of Somaliland — responsible for currency issuance,
            financial sector supervision, and monetary policy. Hargeisa, Somaliland.
          </p>
        </div>

        <div className="footer-col">
          <h5>About</h5>
          <ul>
            {QUICK_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>Resources</h5>
          <ul>
            {RESOURCE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h5>Stay Informed</h5>
          <p className="footer-note">
            Official exchange rates and licensed institution status are published exclusively on this site —
            treat any other source as unverified.
          </p>
          <Link className="footer-cta" to="/press">
            Read the latest announcements →
          </Link>
          <Link className="footer-cta" to="/contact">
            Contact the Bank →
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-row">
          <p>© {new Date().getFullYear()} Bank of Somaliland. All rights reserved.</p>
          <p className="footer-bottom-note">The Bank of Somaliland is the sole regulator of licensed financial institutions in Somaliland.</p>
        </div>
      </div>
    </footer>
  );
}
