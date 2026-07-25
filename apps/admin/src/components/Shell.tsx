import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GalleryHorizontal,
  FileText,
  Newspaper,
  BookOpen,
  Briefcase,
  ClipboardList,
  Mail,
  HelpCircle,
  Send,
  Navigation as NavigationIcon,
  Coins,
  Building2,
  MapPin,
  Users as UsersIcon,
  Settings,
  ScrollText,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const ALL_ROLES = ['super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer'];

const NAV_GROUPS: { section: string; items: { to: string; label: string; roles: string[]; icon: typeof LayoutDashboard }[] }[] = [
  {
    section: '',
    items: [{ to: '/', label: 'Dashboard', roles: ALL_ROLES, icon: LayoutDashboard }],
  },
  {
    section: 'Content',
    items: [
      { to: '/hero-slides', label: 'Homepage Slider', roles: ['super_admin', 'content_editor'], icon: GalleryHorizontal },
      { to: '/content', label: 'Content Editor', roles: ['super_admin', 'content_editor'], icon: FileText },
      { to: '/press-releases', label: 'Press Releases', roles: ['super_admin', 'content_editor'], icon: Newspaper },
      { to: '/publications', label: 'Publications & Laws', roles: ['super_admin', 'content_editor'], icon: BookOpen },
      { to: '/faqs', label: 'FAQs', roles: ['super_admin', 'content_editor'], icon: HelpCircle },
      { to: '/navigation', label: 'Navigation Bar', roles: ['super_admin', 'content_editor'], icon: NavigationIcon },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/careers', label: 'Careers', roles: ['super_admin', 'content_editor'], icon: Briefcase },
      { to: '/tenders', label: 'Tenders', roles: ['super_admin', 'content_editor'], icon: ClipboardList },
      { to: '/exchange-rates', label: 'Exchange Rates', roles: ['super_admin', 'exchange_rate_officer'], icon: Coins },
      { to: '/institutions', label: 'Licensed Institutions', roles: ['super_admin', 'supervision_data_officer'], icon: Building2 },
      { to: '/bank-branches', label: 'Bank Branches', roles: ['super_admin', 'content_editor'], icon: MapPin },
    ],
  },
  {
    section: 'Communications',
    items: [
      { to: '/contact-messages', label: 'Contact Messages', roles: ['super_admin', 'content_editor'], icon: Mail },
      { to: '/newsletter', label: 'Newsletter Subscribers', roles: ['super_admin', 'content_editor'], icon: Send },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/users', label: 'Admin Users', roles: ['super_admin'], icon: UsersIcon },
      { to: '/site-settings', label: 'Website Settings', roles: ['super_admin'], icon: Settings },
      { to: '/audit-log', label: 'Audit Log', roles: ['super_admin'], icon: ScrollText },
      { to: '/my-account', label: 'My Account', roles: ALL_ROLES, icon: UserCircle },
    ],
  },
];

export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user || !['super_admin', 'content_editor'].includes(user.role)) return;
    const refresh = () => api.contactMessages().then((r) => setUnreadMessages(r.unread_count)).catch(() => {});
    refresh();
    window.addEventListener('contact-message-read', refresh);
    return () => window.removeEventListener('contact-message-read', refresh);
  }, [user]);

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
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !user || item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.section || 'top'}>
                {group.section && <div className="sidebar-section-label">{group.section}</div>}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <Icon />
                      {item.label}
                      {item.to === '/contact-messages' && unreadMessages > 0 && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--gold)',
                            color: 'var(--night)',
                            borderRadius: 10,
                            padding: '1px 7px',
                          }}
                        >
                          {unreadMessages}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
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
