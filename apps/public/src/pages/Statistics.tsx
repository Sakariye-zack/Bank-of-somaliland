import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Reveal } from '../components/Reveal';
import { useT } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import type { StatisticsResponse, InstitutionType, PublicationCategoryOption } from '@bos/shared-types';

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="stat-bar-row">
      <div className="stat-bar-label">{label}</div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="stat-bar-count">{count}</div>
    </div>
  );
}

export function Statistics() {
  const t = useT();
  const { lang } = useLanguage();
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [pubCategories, setPubCategories] = useState<PublicationCategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.statistics(), api.publicationCategories(lang)])
      .then(([s, cats]) => {
        setStats(s);
        setPubCategories(cats.results);
      })
      .catch((e) => setError(e.message));
  }, [lang]);

  const TYPE_LABELS: Record<InstitutionType, string> = {
    bank: t('typeBank'),
    remit: t('typeRemit'),
    mm: t('typeMm'),
    mfi: t('typeMfi'),
    pay: t('typePay'),
    takaful: t('typeTakaful'),
    fx: t('typeFx'),
  };

  function pubCategoryLabel(slug: string): string {
    return pubCategories.find((c) => c.slug === slug)?.name ?? slug;
  }

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('statisticsTitle')}</h2>
              <div className="sub">{t('statisticsSub')}</div>
            </div>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!stats && !error && <div className="status-loading">{t('loadingStatistics')}</div>}

          {stats && (
            <>
              <div className="stat-tiles">
                <div className="stat-tile">
                  <div className="stat-tile-value">{stats.active_currencies}</div>
                  <div className="stat-tile-label">{t('statActiveCurrencies')}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">
                    {stats.institutions_by_type.reduce((sum, r) => sum + r.count, 0)}
                  </div>
                  <div className="stat-tile-label">{t('institutionsTitle')}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">
                    {stats.publications_by_category.reduce((sum, r) => sum + r.count, 0)}
                  </div>
                  <div className="stat-tile-label">{t('publicationsTitle')}</div>
                </div>
              </div>

              <div className="stat-chart-panel">
                <h4>{t('statInstitutionsByType')}</h4>
                {stats.institutions_by_type.map((row) => (
                  <BarRow
                    key={row.institution_type}
                    label={TYPE_LABELS[row.institution_type as InstitutionType] ?? row.institution_type}
                    count={row.count}
                    max={Math.max(...stats.institutions_by_type.map((r) => r.count), 1)}
                  />
                ))}
              </div>

              <div className="stat-chart-panel">
                <h4>{t('statPublicationsByCategory')}</h4>
                {stats.publications_by_category.map((row) => (
                  <BarRow
                    key={row.category}
                    label={pubCategoryLabel(row.category)}
                    count={row.count}
                    max={Math.max(...stats.publications_by_category.map((r) => r.count), 1)}
                  />
                ))}
              </div>

              <div className="stat-chart-panel">
                <h4>{t('statPressByYear')}</h4>
                {stats.press_releases_by_year.map((row) => (
                  <BarRow
                    key={row.year}
                    label={String(row.year)}
                    count={row.count}
                    max={Math.max(...stats.press_releases_by_year.map((r) => r.count), 1)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}
