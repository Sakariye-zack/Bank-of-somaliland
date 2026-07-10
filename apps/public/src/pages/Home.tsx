import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { ExchangeRatesLatestResponse, PressReleasesResponse } from '@bos/shared-types';

const CURRENCY_LABELS: Record<string, string> = {
  USD: 'US Dollar',
  SAR: 'Saudi Riyal',
  ETB: 'Ethiopian Birr',
  AED: 'UAE Dirham',
};

export function Home() {
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [press, setPress] = useState<PressReleasesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.latestRates(), api.pressReleases(1, 3)])
      .then(([r, p]) => {
        setRates(r);
        setPress(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero" style={{ padding: '56px 0 0' }}>
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Central Bank of the Republic of Somaliland</div>
            <h1>The official monetary authority of Somaliland</h1>
            <p className="lede">
              Daily exchange rates, the register of licensed financial institutions, and official publications —
              published directly by the Bank of Somaliland.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to="/institutions">
                Verify a licensed institution
              </Link>
              <Link className="btn btn-ghost" to="/publications">
                View publications
              </Link>
            </div>
          </div>

          <div className="ledger">
            <div className="ledger-head">
              <h3>Official Exchange Rates</h3>
              <span className="as-of">as of {rates?.as_of ?? '—'}</span>
            </div>
            {error && <div className="status-error">{error}</div>}
            {!error && !rates && <div className="status-loading">Loading rates…</div>}
            {rates?.rates.length === 0 && <div className="status-loading">No rates published yet.</div>}
            {rates?.rates.map((r) => (
              <div className="rate-row" key={r.currency_code}>
                <div className="rate-cur">
                  {r.currency_code}
                  <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--bronze)' }}>
                    {CURRENCY_LABELS[r.currency_code] ?? ''}
                  </div>
                </div>
                <div className="rate-val">
                  {r.rate_to_ssh} SSH
                  <span className={`trend ${r.trend}`}>
                    {r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '–'} {r.change_pct}%
                  </span>
                </div>
              </div>
            ))}
            <div className="ledger-note">
              "Official Rate" — set by the Bank of Somaliland. No free-floating market rate exists for the
              Somaliland Shilling.
            </div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </section>

      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Recent Announcements</h2>
              <div className="sub">The latest from the Bank of Somaliland</div>
            </div>
            <Link className="view-all" to="/press">
              View all press releases →
            </Link>
          </div>
          {!press && !error && <div className="status-loading">Loading announcements…</div>}
          {press?.results.length === 0 && <div className="status-loading">No announcements published yet.</div>}
          <div className="news-strip">
            {press?.results.map((item) => (
              <article className="news-item" key={item.id}>
                {item.images.length > 0 && (
                  <img className="news-item-thumb" src={mediaUrl(item.images[0])} alt="" />
                )}
                <div className="date">{item.publish_date}</div>
                <h4>{item.title}</h4>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
