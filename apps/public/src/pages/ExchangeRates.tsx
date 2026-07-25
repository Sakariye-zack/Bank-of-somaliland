import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import { Reveal } from '../components/Reveal';
import { CurrencyConverter } from '../components/CurrencyConverter';
import { RateHistoryChart } from '../components/RateHistoryChart';
import type { ExchangeRatesLatestResponse } from '@bos/shared-types';

export function ExchangeRates() {
  const { lang } = useLanguage();
  const t = useT();
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .latestRates(lang)
      .then(setRates)
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('exchangeRatesTitle')}</h2>
              <div className="sub">{t('exchangeRatesSub')}</div>
            </div>
            <span className="as-of">
              {t('asOf')} {rates?.as_of ?? '—'}
            </span>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!rates && !error && <div className="status-loading">{t('loadingRates')}</div>}
          {rates?.rates.length === 0 && <div className="status-loading">{t('noRatesYet')}</div>}

          {rates && rates.rates.length > 0 && (
            <table className="inst-table">
              <thead>
                <tr>
                  <th>{t('colCurrency')}</th>
                  <th>{t('colBuyingRate')}</th>
                  <th>{t('colSellingRate')}</th>
                  <th>{t('colSpread')}</th>
                  <th>{t('colTrend')}</th>
                </tr>
              </thead>
              <tbody>
                {rates.rates.map((r) => (
                  <tr key={r.currency_code}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {r.flag_url && <img className="rate-flag" src={mediaUrl(r.flag_url)} alt="" />}
                        <div>
                          <strong>{r.currency_code}</strong>
                          <div style={{ fontSize: 11.5, color: 'var(--bronze)' }}>{r.currency_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      1 {r.currency_code} = {r.buying_rate} SLSH
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      1 {r.currency_code} = {r.selling_rate} SLSH
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>
                      {r.spread} SLSH ({r.spread_pct}%)
                    </td>
                    <td>
                      <span className={`trend ${r.trend}`}>
                        {r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '–'} {r.change_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="ledger-note" style={{ marginTop: 20 }}>
            {t('officialRateNote')}
          </div>

          {rates && rates.rates.length > 0 && <CurrencyConverter rates={rates.rates} />}
          {rates && rates.rates.length > 0 && <RateHistoryChart currencies={rates.rates.map((r) => r.currency_code)} />}
        </div>
      </Reveal>
    </section>
  );
}
