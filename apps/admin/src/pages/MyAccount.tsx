import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { api, ApiError } from '../lib/api';

export function MyAccount() {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [emailForm, setEmailForm] = useState({ new_email: user?.email ?? '', current_password: '' });
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const [totpEnabled, setTotpEnabled] = useState(user?.totp_enabled ?? false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_data_url: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twofaSubmitting, setTwofaSubmitting] = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwSubmitting(true);
    setMessage(null);
    try {
      await api.changeMyPassword(pwForm.current_password, pwForm.new_password);
      setMessage({ type: 'ok', text: 'Password changed.' });
      setPwForm({ current_password: '', new_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to change password.' });
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault();
    setEmailSubmitting(true);
    setMessage(null);
    try {
      await api.changeMyEmail(emailForm.new_email, emailForm.current_password);
      setMessage({ type: 'ok', text: 'Email updated. Use the new address next time you sign in.' });
      setEmailForm({ ...emailForm, current_password: '' });
      await refreshUser();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to change email.' });
    } finally {
      setEmailSubmitting(false);
    }
  }

  async function startSetup() {
    setMessage(null);
    try {
      const data = await api.setup2fa();
      setSetupData(data);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to start 2FA setup.' });
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setTwofaSubmitting(true);
    setMessage(null);
    try {
      await api.verify2fa(verifyCode);
      setMessage({ type: 'ok', text: 'Two-factor authentication enabled.' });
      setTotpEnabled(true);
      setSetupData(null);
      setVerifyCode('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Invalid code.' });
    } finally {
      setTwofaSubmitting(false);
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    setTwofaSubmitting(true);
    setMessage(null);
    try {
      await api.disable2fa(disablePassword);
      setMessage({ type: 'ok', text: 'Two-factor authentication disabled.' });
      setTotpEnabled(false);
      setDisablePassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to disable 2FA.' });
    } finally {
      setTwofaSubmitting(false);
    }
  }

  return (
    <>
      <h1>My Account</h1>
      {message && <div className={message.type === 'ok' ? 'status-ok' : 'status-error'}>{message.text}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Signed in as</h3>
        <p style={{ marginTop: 0 }}>
          <strong>{user?.email}</strong> — role: {user?.role.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-row">
            <label>Current password</label>
            <input type="password" required value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
          </div>
          <div className="form-row">
            <label>New password (min 8 characters)</label>
            <input type="password" required minLength={8} value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pwSubmitting}>
            {pwSubmitting ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Change Email</h3>
        <form onSubmit={handleEmailChange}>
          <div className="form-row">
            <label>New email</label>
            <input type="email" required value={emailForm.new_email} onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Current password</label>
            <input type="password" required value={emailForm.current_password} onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={emailSubmitting}>
            {emailSubmitting ? 'Saving…' : 'Change email'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Two-Factor Authentication (2FA)</h3>
        {totpEnabled ? (
          <>
            <p style={{ color: 'var(--teal)' }}>✓ Enabled — your account requires an authenticator code at sign-in.</p>
            <form onSubmit={handleDisable}>
              <div className="form-row">
                <label>Current password (to disable)</label>
                <input type="password" required value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
              </div>
              <button className="btn btn-danger" type="submit" disabled={twofaSubmitting}>
                {twofaSubmitting ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </form>
          </>
        ) : setupData ? (
          <>
            <p>Scan this QR code with Google Authenticator, Authy, or a similar app, then enter the 6-digit code it shows.</p>
            <img src={setupData.qr_data_url} alt="2FA QR code" style={{ width: 200, height: 200 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Manual entry key: {setupData.secret}</p>
            <form onSubmit={handleVerify}>
              <div className="form-row">
                <label>6-digit code</label>
                <input inputMode="numeric" maxLength={6} required value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={twofaSubmitting}>
                {twofaSubmitting ? 'Verifying…' : 'Verify & enable'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--bronze)' }}>Not enabled. Add an authenticator app for extra login security.</p>
            <button className="btn btn-primary" type="button" onClick={startSetup}>
              Set up 2FA
            </button>
          </>
        )}
      </div>
    </>
  );
}
