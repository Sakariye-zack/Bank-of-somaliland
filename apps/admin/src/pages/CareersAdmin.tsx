import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { JobPosting } from '@bos/shared-types';

export function CareersAdmin() {
  const [open, setOpen] = useState<JobPosting[]>([]);
  const [closed, setClosed] = useState<JobPosting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', closing_date: '' });

  function load() {
    api.jobPostings('open').then((r) => setOpen(r.results)).catch((e) => setError(e.message));
    api.jobPostings('closed').then((r) => setClosed(r.results)).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.createJobPosting(form);
      setMessage('Job posting created.');
      setForm({ title: '', department: '', closing_date: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create job posting.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(job: JobPosting) {
    setError(null);
    try {
      await api.updateJobPostingStatus(job.id, job.status === 'open' ? 'closed' : 'open');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  return (
    <>
      <h1>Careers</h1>
      {message && <div className="status-ok">{message}</div>}
      {error && <div className="status-error">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Post a New Position</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Bank Supervision Department" />
          </div>
          <div className="form-row">
            <label>Closing date</label>
            <input
              type="date"
              required
              value={form.closing_date}
              onChange={(e) => setForm({ ...form, closing_date: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post position'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Open Positions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Closes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {open.map((j) => (
              <tr key={j.id}>
                <td>{j.title}</td>
                <td>{j.department ?? '—'}</td>
                <td>{j.closing_date}</td>
                <td>
                  <button className="btn" onClick={() => toggleStatus(j)}>
                    Close
                  </button>
                </td>
              </tr>
            ))}
            {open.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--bronze)' }}>
                  No open positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Closed Positions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Closes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {closed.map((j) => (
              <tr key={j.id}>
                <td>{j.title}</td>
                <td>{j.department ?? '—'}</td>
                <td>{j.closing_date}</td>
                <td>
                  <button className="btn" onClick={() => toggleStatus(j)}>
                    Reopen
                  </button>
                </td>
              </tr>
            ))}
            {closed.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--bronze)' }}>
                  No closed positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
