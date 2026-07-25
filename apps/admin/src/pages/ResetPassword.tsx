import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <img src="/logo.jpg" alt="Bank of Somaliland emblem" className="login-logo" />
        <h1>Bank of Somaliland</h1>
        <div className="sub">Choose a new password</div>
        {!token && <div className="status-error">This link is missing a token — request a new one.</div>}
        {error && <div className="status-error">{error}</div>}
        {done ? (
          <p style={{ textAlign: 'center', fontSize: 14 }}>Password updated — redirecting to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="password">New password</label>
              <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting || !token} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Link to="/login" style={{ fontSize: 13 }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
