import { useState, type FormEvent, type CSSProperties } from 'react';
import { api } from '../lib/api';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await api.submitContact(form);
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <section>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="section-head">
          <div>
            <h2>Contact the Bank</h2>
            <div className="sub">General inquiries — the Bank does not accept account service requests here.</div>
          </div>
        </div>

        {status === 'sent' && (
          <div className="fallback-notice" style={{ background: 'rgba(30,122,69,.12)', color: 'var(--teal)' }}>
            Thank you — your message has been received.
          </div>
        )}
        {status === 'error' && <div className="status-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email address"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Message"
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            style={inputStyle}
          />
          <button className="btn btn-primary" type="submit" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </section>
  );
}

const inputStyle: CSSProperties = {
  padding: '11px 14px',
  border: '1px solid var(--line)',
  borderRadius: 5,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  background: '#fff',
};
