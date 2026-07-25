import { useMemo, useState } from 'react';
import { useT } from '../lib/i18n';
import { mediaUrl } from '../lib/media';
import type { ExchangeRateLatest } from '@bos/shared-types';

function formatNumber(n: number): string {
  if (!isFinite(n)) return '0.00';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyConverter({ rates }: { rates: ExchangeRateLatest[] }) {
  const t = useT();
  const [amount, setAmount] = useState('1000');
  const [currencyCode, setCurrencyCode] = useState(rates[0]?.currency_code ?? '');
  const [direction, setDirection] = useState<'to_slsh' | 'from_slsh'>('to_slsh');

  const selected = rates.find((r) => r.currency_code === currencyCode) ?? rates[0];
  const numericAmount = parseFloat(amount) || 0;

  const result = useMemo(() => {
    if (!selected) return 0;
    if (direction === 'to_slsh') {
      return numericAmount * parseFloat(selected.buying_rate);
    }
    const sell = parseFloat(selected.selling_rate);
    return sell > 0 ? numericAmount / sell : 0;
  }, [numericAmount, selected, direction]);

  if (rates.length === 0 || !selected) return null;

  const slshLabel = `SLSH — ${t('somalilandShilling')}`;

  // The currency picker always drives the non-SLSH side; swapping only flips
  // which side that is, so the same <select> serves both directions.
  const currencySelect = (
    <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
      {rates.map((r) => (
        <option key={r.currency_code} value={r.currency_code}>
          {r.currency_code} — {r.currency_name ?? r.currency_code}
        </option>
      ))}
    </select>
  );
  const slshField = <div className="converter-static">{slshLabel}</div>;

  return (
    <div className="converter-panel">
      <div className="converter-title">{t('converterTitle')}</div>

      <div className="converter-side">
        <label>{t('converterFrom')}</label>
        <div className="converter-side-row">
          <div className="converter-select-wrap">
            {direction === 'to_slsh' && selected.flag_url && (
              <img className="converter-flag" src={mediaUrl(selected.flag_url)} alt="" />
            )}
            {direction === 'to_slsh' ? currencySelect : slshField}
          </div>
          <input
            className="converter-amount"
            type="number"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="converter-swap-row">
        <button
          type="button"
          className="converter-swap"
          onClick={() => setDirection((d) => (d === 'to_slsh' ? 'from_slsh' : 'to_slsh'))}
          aria-label={t('converterSwap')}
          title={t('converterSwap')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4v13M7 17l-3-3M7 17l3-3" />
            <path d="M17 20V7M17 7l3 3M17 7l-3 3" />
          </svg>
        </button>
      </div>

      <div className="converter-side">
        <label>{t('converterTo')}</label>
        <div className="converter-side-row">
          <div className="converter-select-wrap">
            {direction === 'from_slsh' && selected.flag_url && (
              <img className="converter-flag" src={mediaUrl(selected.flag_url)} alt="" />
            )}
            {direction === 'from_slsh' ? currencySelect : slshField}
          </div>
          <output className="converter-amount converter-output">{formatNumber(result)}</output>
        </div>
      </div>

      <div className="converter-note">
        {direction === 'to_slsh' ? t('converterUsingBuying') : t('converterUsingSelling')}
      </div>
    </div>
  );
}
