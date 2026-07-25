import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function load() {
    api
      .newsletterSubscribers()
      .then((r) => setSubscribers(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await api.exportNewsletterCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-subscribers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <h1>Newsletter Subscribers</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          Visitors who signed up for email alerts via the public site footer. Export the list as a CSV for use with
          an email tool.
        </p>
        {error && <div className="status-error">{error}</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Subscribers ({subscribers.length})</h3>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting || subscribers.length === 0}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        {subscribers.length === 0 && <p style={{ color: 'var(--bronze)' }}>No subscribers yet.</p>}
        {subscribers.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
