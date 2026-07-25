import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { ExchangeRatesLatestResponse, Currency } from '@bos/shared-types';

export function ExchangeRates() {
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState({
    currency_code: 'USD',
    buying_rate: '',
    selling_rate: '',
    rate_date: new Date().toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ buying_rate: '', selling_rate: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', name_so: '', name_ar: '' });
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);
  const [currencySubmitting, setCurrencySubmitting] = useState(false);

  function load() {
    api.latestRates().then(setRates).catch(() => {});
    api.currencies().then((r) => setCurrencies(r.results.sort((a, b) => a.sort_order - b.sort_order))).catch(() => {});
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createRate(form);
      setMessage({ type: 'ok', text: 'Rate published.' });
      setForm({ ...form, buying_rate: '', selling_rate: '' });
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

  function startEdit(id: string, buying_rate: string, selling_rate: string) {
    setEditingId(id);
    setEditForm({ buying_rate, selling_rate });
  }

  async function saveEdit(id: string) {
    setEditSubmitting(true);
    setMessage(null);
    try {
      await api.updateRate(id, editForm.buying_rate, editForm.selling_rate);
      setMessage({ type: 'ok', text: 'Rate updated.' });
      setEditingId(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to update rate.' });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleAddCurrency(e: FormEvent) {
    e.preventDefault();
    setCurrencySubmitting(true);
    setMessage(null);
    try {
      let flag_url: string | undefined;
      if (flagFile) {
        const uploaded = await api.uploadMedia([flagFile], null);
        flag_url = uploaded.images[0];
      }
      await api.createCurrency({
        code: currencyForm.code.toUpperCase(),
        name: currencyForm.name,
        name_so: currencyForm.name_so || undefined,
        name_ar: currencyForm.name_ar || undefined,
        flag_url,
      });
      setMessage({ type: 'ok', text: 'Currency added.' });
      setCurrencyForm({ code: '', name: '', name_so: '', name_ar: '' });
      setFlagFile(null);
      if (flagInputRef.current) flagInputRef.current.value = '';
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to add currency.' });
    } finally {
      setCurrencySubmitting(false);
    }
  }

  async function toggleCurrencyActive(c: Currency) {
    await api.updateCurrency(c.code, { is_active: !c.is_active });
    load();
  }

  async function moveCurrency(c: Currency, direction: -1 | 1) {
    const idx = currencies.findIndex((x) => x.code === c.code);
    const swapWith = currencies[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      api.updateCurrency(c.code, { sort_order: swapWith.sort_order }),
      api.updateCurrency(swapWith.code, { sort_order: c.sort_order }),
    ]);
    load();
  }

  return (
    <>
      <h1>Exchange Rates</h1>
      {message && <div className={message.type === 'ok' ? 'status-ok' : 'status-error'}>{message.text}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Enter Today's Rate</h3>
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          Buying rate is what the Bank pays for foreign currency; selling rate is what it charges — both are shown to
          the public as "1 [currency] = X SLSH", alongside the spread between them.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Currency</label>
            <select value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Buying rate (SLSH per 1 unit)</label>
            <input
              type="text"
              required
              placeholder="8900.0000"
              value={form.buying_rate}
              onChange={(e) => setForm({ ...form, buying_rate: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Selling rate (SLSH per 1 unit)</label>
            <input
              type="text"
              required
              placeholder="8920.0000"
              value={form.selling_rate}
              onChange={(e) => setForm({ ...form, selling_rate: e.target.value })}
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
                <th>Buying</th>
                <th>Selling</th>
                <th>Spread</th>
                <th>Trend vs previous entry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.rates.map((r) => (
                <tr key={r.currency_code}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {r.flag_url && <img src={mediaUrl(r.flag_url)} alt="" style={{ width: 22, height: 16, objectFit: 'cover', borderRadius: 2 }} />}
                    {r.currency_code}
                  </td>
                  {editingId === r.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.buying_rate}
                          onChange={(e) => setEditForm({ ...editForm, buying_rate: e.target.value })}
                          style={{ width: 100 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.selling_rate}
                          onChange={(e) => setEditForm({ ...editForm, selling_rate: e.target.value })}
                          style={{ width: 100 }}
                        />
                      </td>
                      <td>—</td>
                      <td>—</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} disabled={editSubmitting} onClick={() => saveEdit(r.id)}>
                          {editSubmitting ? 'Saving…' : 'Save'}
                        </button>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>1 {r.currency_code} = {r.buying_rate} SLSH</td>
                      <td>1 {r.currency_code} = {r.selling_rate} SLSH</td>
                      <td>{r.spread} SLSH ({r.spread_pct}%)</td>
                      <td>
                        {r.trend} ({r.change_pct}%)
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => startEdit(r.id, r.buying_rate, r.selling_rate)}
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Currencies</h3>
        <form onSubmit={handleAddCurrency} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 18 }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Code (3 letters)</label>
            <input
              required
              maxLength={3}
              placeholder="GBP"
              value={currencyForm.code}
              onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Name (English)</label>
            <input
              required
              placeholder="British Pound"
              value={currencyForm.name}
              onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Name (Somali)</label>
            <input
              placeholder="Bandhka Ingiriiska"
              value={currencyForm.name_so}
              onChange={(e) => setCurrencyForm({ ...currencyForm, name_so: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Name (Arabic)</label>
            <input
              placeholder="جنيه إسترليني"
              value={currencyForm.name_ar}
              onChange={(e) => setCurrencyForm({ ...currencyForm, name_ar: e.target.value })}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Flag image</label>
            <input ref={flagInputRef} type="file" accept="image/*" onChange={(e) => setFlagFile(e.target.files?.[0] ?? null)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={currencySubmitting}>
            {currencySubmitting ? 'Adding…' : 'Add currency'}
          </button>
        </form>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Code</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c, i) => (
              <tr key={c.code} style={{ opacity: c.is_active ? 1 : 0.55 }}>
                <td>{c.flag_url ? <img src={mediaUrl(c.flag_url)} alt="" style={{ width: 26, height: 18, objectFit: 'cover', borderRadius: 2 }} /> : '—'}</td>
                <td>{c.code}</td>
                <td>
                  {c.name}
                  {(c.name_so || c.name_ar) && (
                    <div style={{ fontSize: 11, color: 'var(--bronze)' }}>
                      {[c.name_so, c.name_ar].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-pill ${c.is_active ? 'status-active' : 'status-revoked'}`}>
                    {c.is_active ? 'active' : 'hidden'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn"
                    style={{ padding: '5px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === 0}
                    onClick={() => moveCurrency(c, -1)}
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '5px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === currencies.length - 1}
                    onClick={() => moveCurrency(c, 1)}
                    title="Move later"
                  >
                    ↓
                  </button>
                  <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => toggleCurrencyActive(c)}>
                    {c.is_active ? 'Hide' : 'Show'}
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
