import { Fragment, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { ContactMessage } from '@bos/shared-types';

export function ContactMessagesAdmin() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .contactMessages()
      .then((r) => {
        setMessages(r.results);
        setUnreadCount(r.unread_count);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load messages.'));
  }

  useEffect(load, []);

  async function open(msg: ContactMessage) {
    setOpenId(openId === msg.id ? null : msg.id);
    if (!msg.is_read) {
      try {
        await api.markMessageRead(msg.id);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
        setUnreadCount((n) => Math.max(0, n - 1));
        window.dispatchEvent(new Event('contact-message-read'));
      } catch {
        // Non-critical — the message still opens even if the read-receipt call fails.
      }
    }
  }

  return (
    <>
      <h1>
        Contact Messages{' '}
        {unreadCount > 0 && (
          <span
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              background: 'var(--gold)',
              color: 'var(--night)',
              borderRadius: 12,
              padding: '2px 10px',
              verticalAlign: 'middle',
            }}
          >
            {unreadCount} unread
          </span>
        )}
      </h1>
      {error && <div className="status-error">{error}</div>}

      <div className="card">
        <p style={{ marginTop: 0, color: 'var(--bronze)' }}>
          Messages submitted through the public site's "Contact the Bank" form. Most recent first.
        </p>
        {messages.length === 0 && !error && <p style={{ color: 'var(--bronze)' }}>No messages yet.</p>}
        <table className="admin-table">
          <tbody>
            {messages.map((m) => (
              <Fragment key={m.id}>
                <tr
                  onClick={() => open(m)}
                  style={{ cursor: 'pointer', fontWeight: m.is_read ? 400 : 700 }}
                >
                  <td style={{ width: 24 }}>{!m.is_read && <span style={{ color: 'var(--gold)' }}>●</span>}</td>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.subject}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--bronze)' }}>
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                </tr>
                {openId === m.id && (
                  <tr>
                    <td></td>
                    <td colSpan={4} style={{ background: 'var(--parchment-2)', whiteSpace: 'pre-wrap' }}>
                      {m.message}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
