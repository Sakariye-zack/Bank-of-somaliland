import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { Publication, PublicationCategory } from '@bos/shared-types';

export function Publications() {
  const { lang } = useLanguage();
  const t = useT();
  const [results, setResults] = useState<Publication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');

  const CATEGORY_LABELS: Record<PublicationCategory, string> = {
    annual_report: t('catAnnualReport'),
    circular: t('catCircular'),
    stability_report: t('catStabilityReport'),
  };

  useEffect(() => {
    api
      .publications(category || undefined, lang)
      .then((r) => setResults(r.results))
      .catch((e) => setError(e.message));
  }, [category, lang]);

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('publicationsTitle')}</h2>
              <div className="sub">{t('publicationsSub')}</div>
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('allCategories')}</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!results && !error && <div className="status-loading">{t('loadingPublications')}</div>}
          {results?.length === 0 && <div className="status-loading">{t('noPublicationsYet')}</div>}

          <div className="pub-grid">
            {results?.map((pub) => (
              <div className="pub-card" key={pub.id}>
                <div className="pub-thumb">
                  <span className="tag">{CATEGORY_LABELS[pub.category]}</span>
                </div>
                <div className="pub-body">
                  <h4>{pub.title}</h4>
                  <div className="meta">{pub.publish_date}</div>
                  <a className="dl" href={mediaUrl(pub.file_url)} target="_blank" rel="noreferrer">
                    {t('downloadPdf')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
