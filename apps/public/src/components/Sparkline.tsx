// Tiny inline trend line for the homepage exchange-rate table. Purely decorative
// shape — the precise numbers live in the Buy/Sell columns next to it, so there
// are no axes or labels here.
export function Sparkline({ values, trend }: { values: number[]; trend: 'up' | 'down' | 'flat' }) {
  if (values.length < 2) return <div className="sparkline sparkline-empty" aria-hidden="true" />;

  const w = 92;
  const h = 26;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const stroke = trend === 'down' ? 'var(--danger)' : 'var(--teal)';

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" focusable="false">
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
