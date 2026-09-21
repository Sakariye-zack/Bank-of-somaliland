import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { JobPosting } from '@bos/shared-types';

export function CareersAdmin() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', closing_date: '', description: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', department: '', closing_date: '', description: '' });

  function load() {
    api.jobPostings().then((r) => setJobs(r.results)).catch((e) => setError(e.message));
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
      setForm({ title: '', department: '', closing_date: '', description: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create job posting.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(job: JobPosting) {
    setBusyId(job.id);
    setError(null);
    setMessage(null);
    try {
      await api.updateJobPosting(job.id, { status: job.status === 'open' ? 'closed' : 'open' });
      setMessage(job.status === 'open' ? `${job.title} unpublished.` : `${job.title} published.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(job: JobPosting) {
    setEditingId(job.id);
    setEditForm({
      title: job.title,
      department: job.department ?? '',
      closing_date: job.closing_date.slice(0, 10),
      description: job.description ?? '',
    });
    setMessage(null);
    setError(null);
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await api.updateJobPosting(id, editForm);
      setMessage('Job posting updated.');
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update job posting.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(job: JobPosting) {
    if (!confirm(`Permanently delete the job posting "${job.title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    setError(null);
    setMessage(null);
    try {
      await api.deleteJobPosting(job.id);
      setMessage('Job posting deleted.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete job posting.');
    } finally {
      setBusyId(null);
    }
  }

  const open = jobs.filter((j) => j.status === 'open');
  const closed = jobs.filter((j) => j.status === 'closed');

  function renderRow(job: JobPosting) {
    if (editingId === job.id) {
      return (
        <tr key={job.id}>
          <td>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </td>
          <td>
            <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
          </td>
          <td>
            <input
              type="date"
              value={editForm.closing_date}
              onChange={(e) => setEditForm({ ...editForm, closing_date: e.target.value })}
            />
          </td>
          <td colSpan={2}>
            <textarea
              rows={3}
              style={{ width: '100%' }}
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </td>
          <td style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === job.id} onClick={() => saveEdit(job.id)}>
              Save
            </button>
            <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </td>
        </tr>
      );
    }
    return (
      <tr key={job.id}>
        <td>{job.title}</td>
        <td>{job.department ?? '—'}</td>
        <td>{job.closing_date}</td>
        <td colSpan={2} style={{ color: job.description ? 'inherit' : 'var(--bronze)', maxWidth: 320 }}>
          {job.description ? (job.description.length > 140 ? job.description.slice(0, 140) + '…' : job.description) : 'No description'}
        </td>
        <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === job.id} onClick={() => startEdit(job)}>
            Edit
          </button>
          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === job.id} onClick={() => toggleStatus(job)}>
            {job.status === 'open' ? 'Unpublish' : 'Publish'}
          </button>
          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === job.id} onClick={() => handleDelete(job)}>
            Delete
          </button>
        </td>
      </tr>
    );
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
          <div className="form-row">
            <label>Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Responsibilities, requirements, how to apply…"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post position'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Published Positions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Closes</th>
              <th colSpan={2}>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {open.map(renderRow)}
            {open.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--bronze)' }}>
                  No published positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Unpublished Positions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Closes</th>
              <th colSpan={2}>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {closed.map(renderRow)}
            {closed.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--bronze)' }}>
                  No unpublished positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
