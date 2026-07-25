import type { BankBranch } from '@bos/shared-types';
import { useT } from '../lib/i18n';

// Marker positions for known branch cities, projected from their real
// coordinates onto the outline below using the same equirectangular
// projection. Cities we don't recognise are simply skipped.
const CITY_POSITIONS: Record<string, { x: number; y: number }> = {
  hargeisa: { x: 101.8, y: 160.8 },
  hargeysa: { x: 101.8, y: 160.8 },
  berbera: { x: 155.4, y: 109.8 },
  burao: { x: 185.1, y: 163.1 },
  burco: { x: 185.1, y: 163.1 },
  borama: { x: 50.7, y: 139.1 },
  boorama: { x: 50.7, y: 139.1 },
  erigavo: { x: 290, y: 99.6 },
  ceerigaabo: { x: 290, y: 99.6 },
};

// Outline traced from Natural Earth's "Somaliland" map-subunit boundary
// (naturalearthdata.com, public domain), simplified and projected
// (equirectangular, longitude corrected by cos(latitude)) into this 400x300
// viewBox. Simplified for legibility at this size — see the caption.
const OUTLINE =
  '380,62.8 380,167.2 325.1,251.7 267.9,251.7 98.8,194.2 75.7,173.9 64.2,169.4 61.4,161.8 54.4,155.5 50.9,142.1 44.1,139.9 39.1,130 30.8,123.3 26.8,109.1 20.1,99.9 56.4,48.3 61.7,54.6 66.5,56.9 68.2,55.2 68.1,63.4 87.7,88.7 117.3,111.3 130.9,113.1 140.4,110.5 152.4,111.2 173,96.9 182.5,95.6 198.6,84.4 217.7,90.6 225.4,89.3 231,94.2 237.5,95.1 249.6,91.6 292.3,66.6 299,66.4 309.7,71.4 333.7,69.4 345.9,61.3 356.1,58.8 363.7,58.1';

export function SomalilandMap({ branches }: { branches: BankBranch[] }) {
  const t = useT();

  return (
    <div className="map-panel">
      <svg viewBox="0 0 400 300" role="img" aria-label={t('bankBranchesTitle')} className="somaliland-map">
        <rect width="400" height="300" fill="#eaf3ee" />
        <text x="230" y="18" textAnchor="middle" className="map-water-label">
          Gulf of Aden
        </text>
        <polygon points={OUTLINE} fill="#0b4a2a" stroke="#d9971d" strokeWidth="2" strokeLinejoin="round" />
        <text x="14" y="90" className="map-neighbor-label">
          Djibouti
        </text>
        <text x="160" y="290" textAnchor="middle" className="map-neighbor-label">
          Ethiopia
        </text>
        <text x="390" y="120" textAnchor="end" className="map-neighbor-label">
          Puntland
        </text>

        {branches.map((branch) => {
          const pos = CITY_POSITIONS[branch.city.trim().toLowerCase()];
          if (!pos) return null;
          return (
            <g key={branch.id}>
              <circle cx={pos.x} cy={pos.y} r={branch.is_headquarters ? 7 : 5} fill="#d9971d" stroke="#fff" strokeWidth="1.5" />
              <text x={pos.x} y={pos.y - 12} textAnchor="middle" className="map-city-label">
                {branch.city}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="map-caption">{t('mapNotToScale')}</div>
    </div>
  );
}
