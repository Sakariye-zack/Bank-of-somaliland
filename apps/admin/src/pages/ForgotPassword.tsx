import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <img src="/logo.jpg" alt="Bank of Somaliland emblem" className="login-logo" />
        <h1>Bank of Somaliland</h1>
        <div className="sub">Reset your password</div>
        {sent ? (
          <p style={{ textAlign: 'center', fontSize: 14 }}>
            If an account exists for that email, a reset link has been sent. It's valid for 1 hour.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Sending…' : 'Send reset link'}
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
