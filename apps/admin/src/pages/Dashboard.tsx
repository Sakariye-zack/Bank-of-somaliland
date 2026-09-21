import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  BookOpen,
  Newspaper,
  Briefcase,
  ClipboardList,
  Mail,
  Send,
  HelpCircle,
  MapPin,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import type { ExchangeRatesLatestResponse, AuditLogEntry } from '@bos/shared-types';

interface Stats {
  institutions: number;
  publications: number;
  pressReleases: number;
  openJobs: number;
  openTenders: number;
  pendingMessages: number;
  subscribers: number;
  faqs: number;
  branches: number;
}

function formatAction(entry: AuditLogEntry): string {
  const verb = entry.action === 'create' ? 'Created' : entry.action === 'update' ? 'Updated' : entry.action === 'delete' ? 'Deleted' : 'Published';
  const table = entry.table_name.replace(/_/g, ' ');
  return `${verb} ${table}`;
}

export function Dashboard() {
  const { user } = useAuth();
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    api.latestRates().then(setRates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const canSeeContent = ['super_admin', 'content_editor'].includes(user.role);
    const canSeeInstitutions = ['super_admin', 'supervision_data_officer'].includes(user.role);

    Promise.all([
      canSeeInstitutions ? api.institutions() : Promise.resolve({ results: [] }),
      canSeeContent ? api.publications() : Promise.resolve({ results: [] }),
      canSeeContent ? api.pressReleases() : Promise.resolve({ results: [] }),
      canSeeContent ? api.jobPostings() : Promise.resolve({ results: [] }),
      canSeeContent ? api.tenders() : Promise.resolve({ results: [] }),
      canSeeContent ? api.contactMessages() : Promise.resolve({ results: [], unread_count: 0 }),
      canSeeContent ? api.newsletterSubscribers() : Promise.resolve({ results: [] }),
      canSeeContent ? api.faqs() : Promise.resolve({ results: [] }),
      canSeeContent ? api.bankBranches() : Promise.resolve({ results: [] }),
    ])
      .then(([institutions, publications, pressReleases, jobs, tenders, messages, subscribers, faqs, branches]) => {
        const today = new Date().toISOString().slice(0, 10);
        setStats({
          institutions: institutions.results.length,
          publications: publications.results.length,
          pressReleases: pressReleases.results.length,
          openJobs: jobs.results.filter((j) => j.status === 'open').length,
          openTenders: tenders.results.filter((t) => t.closing_date >= today).length,
          pendingMessages: messages.unread_count,
          subscribers: subscribers.results.length,
          faqs: faqs.results.filter((f) => f.is_active).length,
          branches: branches.results.filter((b) => b.is_active).length,
        });
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    api.auditLog(6).then((r) => setActivity(r.results)).catch(() => {});
  }, [user]);

  return (
    <>
      <h1>Dashboard</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          Signed in as <strong>{user?.email}</strong> — role: <strong>{user?.role.replace(/_/g, ' ')}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--bronze)', marginTop: 8, marginBottom: 0 }}>
          Every write action below is enforced server-side by role. The navigation you see is filtered for
          convenience only — it is not the security boundary.
        </p>
      </div>

      {stats && (
        <div className="dash-tiles">
          {['super_admin', 'supervision_data_officer'].includes(user?.role ?? '') && (
            <Link className="dash-tile" to="/institutions">
              <Building2 style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
              <div className="dash-tile-value">{stats.institutions}</div>
              <div className="dash-tile-label">Licensed Institutions</div>
            </Link>
          )}
          {['super_admin', 'content_editor'].includes(user?.role ?? '') && (
            <>
              <Link className="dash-tile" to="/publications">
                <BookOpen style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.publications}</div>
                <div className="dash-tile-label">Publications & Laws</div>
              </Link>
              <Link className="dash-tile" to="/press-releases">
                <Newspaper style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.pressReleases}</div>
                <div className="dash-tile-label">Press Releases</div>
              </Link>
              <Link className="dash-tile" to="/careers">
                <Briefcase style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.openJobs}</div>
                <div className="dash-tile-label">Open Job Postings</div>
              </Link>
              <Link className="dash-tile" to="/tenders">
                <ClipboardList style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.openTenders}</div>
                <div className="dash-tile-label">Open Tenders</div>
              </Link>
              <Link className="dash-tile" to="/contact-messages">
                {stats.pendingMessages > 0 && <span className="dash-tile-badge">NEW</span>}
                <Mail style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.pendingMessages}</div>
                <div className="dash-tile-label">Unread Messages</div>
              </Link>
              <Link className="dash-tile" to="/newsletter">
                <Send style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.subscribers}</div>
                <div className="dash-tile-label">Newsletter Subscribers</div>
              </Link>
              <Link className="dash-tile" to="/faqs">
                <HelpCircle style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.faqs}</div>
                <div className="dash-tile-label">Published FAQs</div>
              </Link>
              <Link className="dash-tile" to="/bank-branches">
                <MapPin style={{ width: 20, height: 20, color: 'var(--gold)', marginBottom: 8 }} />
                <div className="dash-tile-value">{stats.branches}</div>
                <div className="dash-tile-label">Bank Branches</div>
              </Link>
            </>
          )}
        </div>
      )}

      {['super_admin', 'content_editor'].includes(user?.role ?? '') && (
        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
          <div className="dash-quicklinks">
            <Link className="dash-quicklink" to="/press-releases">
              <PlusCircle /> New Press Release
            </Link>
            <Link className="dash-quicklink" to="/publications">
              <PlusCircle /> New Publication
            </Link>
            <Link className="dash-quicklink" to="/careers">
              <PlusCircle /> New Job Posting
            </Link>
            <Link className="dash-quicklink" to="/tenders">
              <PlusCircle /> New Tender
            </Link>
            <Link className="dash-quicklink" to="/faqs">
              <PlusCircle /> New FAQ
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Latest Published Rates</h3>
        {!rates && <div>Loading…</div>}
        {rates && rates.rates.length === 0 && <div>No rates published yet.</div>}
        {rates && rates.rates.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Rate to SSH</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rates.rates.map((r) => (
                <tr key={r.currency_code}>
                  <td>{r.currency_code}</td>
                  <td>{r.rate_to_ssh}</td>
                  <td>
                    {r.trend} ({r.change_pct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {user?.role === 'super_admin' && activity && activity.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
            <Link to="/audit-log" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
              View full log →
            </Link>
          </div>
          <div className="dash-activity">
            {activity.map((entry) => (
              <div className="dash-activity-row" key={entry.id}>
                <div>
                  <span className="dash-activity-action">{formatAction(entry)}</span>
                  {entry.admin_name && <span style={{ color: 'var(--bronze)' }}> · {entry.admin_name}</span>}
                </div>
                <div className="dash-activity-meta">{new Date(entry.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
