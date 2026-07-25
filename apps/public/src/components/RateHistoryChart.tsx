import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';
import type { ExchangeRateHistoryPoint } from '@bos/shared-types';

const WIDTH = 680;
const HEIGHT = 220;
const PAD_LEFT = 52;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function RateHistoryChart({ currencies }: { currencies: string[] }) {
  const t = useT();
  const [currency, setCurrency] = useState(currencies[0] ?? '');
  const [series, setSeries] = useState<ExchangeRateHistoryPoint[] | null>(null);

  useEffect(() => {
    if (!currency) return;
    setSeries(null);
    api
      .rateHistory(currency, 90)
      .then((r) => setSeries(r.series))
      .catch(() => setSeries([]));
  }, [currency]);

  if (currencies.length === 0) return null;

  const points = series ?? [];
  const values = points.map((p) => parseFloat(p.buying_rate));
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const range = max - min || 1;
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(i: number): number {
    return points.length <= 1 ? PAD_LEFT : PAD_LEFT + (i / (points.length - 1)) * innerW;
  }
  function yFor(v: number): number {
    return PAD_TOP + innerH - ((v - min) / range) * innerH;
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(parseFloat(p.buying_rate))}`).join(' ');
  const areaPath =
    points.length > 1
      ? `${linePath} L ${xFor(points.length - 1)} ${PAD_TOP + innerH} L ${xFor(0)} ${PAD_TOP + innerH} Z`
      : '';

  return (
    <div className="converter-panel">
      <div className="converter-title">{t('historyChartTitle')}</div>
      <div className="converter-tabs">
        {currencies.map((c) => (
          <button key={c} type="button" className={c === currency ? 'is-active' : ''} onClick={() => setCurrency(c)}>
            {c}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <div className="ledger-note" style={{ marginTop: 8 }}>
          {t('historyChartNoData')}
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="rate-chart-svg" role="img">
          <defs>
            <linearGradient id="rateChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((f) => (
            <line
              key={f}
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={PAD_TOP + innerH * f}
              y2={PAD_TOP + innerH * f}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}
          <text x={4} y={PAD_TOP + 4} className="rate-chart-axis-label">
            {max.toFixed(2)}
          </text>
          <text x={4} y={PAD_TOP + innerH + 4} className="rate-chart-axis-label">
            {min.toFixed(2)}
          </text>
          <path d={areaPath} fill="url(#rateChartFill)" />
          <path d={linePath} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x={PAD_LEFT} y={HEIGHT - 6} className="rate-chart-axis-label">
            {points[0].rate_date}
          </text>
          <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} textAnchor="end" className="rate-chart-axis-label">
            {points[points.length - 1].rate_date}
          </text>
        </svg>
      )}
    </div>
  );
}
