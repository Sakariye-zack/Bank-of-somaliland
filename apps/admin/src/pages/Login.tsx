import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login(email, password, needsTotp ? totpCode : undefined);
      if (result.requires_totp) {
        setNeedsTotp(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <img src="/logo.jpg" alt="Bank of Somaliland emblem" className="login-logo" />
        <h1>Bank of Somaliland</h1>
        <div className="sub">Admin Panel</div>
        {error && <div className="status-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!needsTotp && (
            <>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-row">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}
          {needsTotp && (
            <div className="form-row">
              <label htmlFor="totp">Authenticator code</label>
              <p style={{ fontSize: 12.5, color: 'var(--bronze)', marginTop: 0 }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <input
                id="totp"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Signing in…' : needsTotp ? 'Verify' : 'Sign in'}
          </button>
        </form>
        {!needsTotp && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Link to="/forgot-password" style={{ fontSize: 13 }}>
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
