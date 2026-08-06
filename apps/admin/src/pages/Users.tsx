import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { AdminUser } from '@bos/shared-types';

const ROLES = ['super_admin', 'content_editor', 'supervision_data_officer', 'exchange_rate_officer'];

export function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'content_editor' });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api
      .users()
      .then((r) => setUsers(r.results))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleResetPassword(user: AdminUser) {
    if (!confirm(`Send a password reset link to ${user.email}?`)) return;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      await api.adminResetUserPassword(user.id);
      setMessage(`Password reset link sent to ${user.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger reset.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset2fa(user: AdminUser) {
    if (!confirm(`Disable 2FA for ${user.email}? They will be able to sign in with just their password until they set it up again.`)) return;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      await api.adminReset2fa(user.id);
      setMessage(`2FA disabled for ${user.email}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset 2FA.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    const activating = !user.is_active;
    if (!confirm(activating ? `Reactivate ${user.email}?` : `Deactivate ${user.email}? They will not be able to sign in until reactivated.`)) return;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      await api.setUserActive(user.id, activating);
      setMessage(activating ? `${user.email} was reactivated.` : `${user.email} was deactivated.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user status.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Permanently delete the admin account for ${user.name} (${user.email})? This cannot be undone.`)) return;
    setBusyId(user.id);
    setMessage(null);
    setError(null);
    try {
      await api.deleteUser(user.id);
      setMessage(`${user.email} was deleted.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createUser(form);
      setForm({ name: '', email: '', password: '', role: 'content_editor' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Admin Users</h1>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Create Admin User</h3>
        {error && <div className="status-error">{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Temporary password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>All Admin Users</h3>
        {message && <div className="status-ok">{message}</div>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>2FA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role.replace(/_/g, ' ')}</td>
                <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                <td>{u.totp_enabled ? '✓ On' : '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === u.id} onClick={() => handleResetPassword(u)}>
                    Reset password
                  </button>
                  {u.totp_enabled && (
                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === u.id} onClick={() => handleReset2fa(u)}>
                      Reset 2FA
                    </button>
                  )}
                  <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === u.id} onClick={() => handleToggleActive(u)}>
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} disabled={busyId === u.id} onClick={() => handleDelete(u)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
