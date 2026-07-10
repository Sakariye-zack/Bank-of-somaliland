import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { ExchangeRatesLatestResponse } from '@bos/shared-types';

const CURRENCIES = ['USD', 'SAR', 'ETB', 'AED'];

export function ExchangeRates() {
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [form, setForm] = useState({ currency_code: 'USD', rate_to_ssh: '', rate_date: new Date().toISOString().slice(0, 10) });
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.latestRates().then(setRates).catch(() => {});
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createRate(form);
      setMessage({ type: 'ok', text: 'Rate published.' });
      setForm({ ...form, rate_to_ssh: '' });
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setMessage({ type: 'error', text: 'A rate for this currency/date already exists. Correct it from the table below instead.' });
      } else {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to publish rate.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Exchange Rates</h1>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Enter Today's Rate</h3>
        {message && <div className={message.type === 'ok' ? 'status-ok' : 'status-error'}>{message.text}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Currency</label>
            <select value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Rate to SSH</label>
            <input
              type="text"
              required
              placeholder="8900.0000"
              value={form.rate_to_ssh}
              onChange={(e) => setForm({ ...form, rate_to_ssh: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" required value={form.rate_date} onChange={(e) => setForm({ ...form, rate_date: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish rate'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Current Published Rates (as of {rates?.as_of ?? '—'})</h3>
        {!rates && <div>Loading…</div>}
        {rates && rates.rates.length === 0 && <div>No rates published yet.</div>}
        {rates && rates.rates.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Rate to SSH</th>
                <th>Trend vs previous entry</th>
              </tr>
            </thead>
            <tbody>
              {rates.rates.map((r) => (
                <tr key={r.currency_code}>
                  <td>{r.currency_code}</td>
                  <td>{r.rate_to_ssh}</td>
                  <td>
                    {r.trend} ({r.change_pct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
