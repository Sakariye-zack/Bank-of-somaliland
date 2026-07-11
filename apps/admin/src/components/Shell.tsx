import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const NAV_ITEMS: { to: string; label: string; roles: string[] }[] = [
  { to: '/', label: 'Dashboard', roles: ['super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer'] },
  { to: '/content', label: 'Content Editor', roles: ['super_admin', 'content_editor'] },
  { to: '/press-releases', label: 'Press Releases', roles: ['super_admin', 'content_editor'] },
  { to: '/publications', label: 'Publications & Laws', roles: ['super_admin', 'content_editor'] },
  { to: '/navigation', label: 'Navigation Bar', roles: ['super_admin', 'content_editor'] },
  { to: '/exchange-rates', label: 'Exchange Rates', roles: ['super_admin', 'exchange_rate_officer'] },
  { to: '/institutions', label: 'Licensed Institutions', roles: ['super_admin', 'supervision_data_officer'] },
  { to: '/users', label: 'Admin Users', roles: ['super_admin'] },
  { to: '/audit-log', label: 'Audit Log', roles: ['super_admin'] },
];

export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand-row">
          <img className="sidebar-logo" src="/logo.jpg" alt="Bank of Somaliland emblem" />
          <div className="brand">Bank of Somaliland</div>
        </div>
        <div className="role-tag">{user?.role.replace(/_/g, ' ')}</div>
        <nav>
          {NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role)).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
