import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import { ArrowIcon } from '../components/Icons';
import type { LawRegulation } from '@bos/shared-types';

export function Laws() {
  const { lang } = useLanguage();
  const t = useT();
  const [results, setResults] = useState<LawRegulation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .lawsRegulations(lang)
      .then((r) => setResults(r.results))
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('lawsTitle')}</h2>
              <div className="sub">{t('lawsSub')}</div>
            </div>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!results && !error && <div className="status-loading">{t('loading')}</div>}
          {results?.length === 0 && <div className="status-loading">{t('noLawsYet')}</div>}

          <div className="pub-grid">
            {results?.map((law) => (
              <div className="pub-card" key={law.id}>
                <div className="pub-thumb" style={law.thumbnail_url ? { backgroundImage: `url(${mediaUrl(law.thumbnail_url)})` } : undefined}>
                  <span className="tag">{law.law_number ?? t('law')}</span>
                </div>
                <div className="pub-body">
                  <h4>{law.title}</h4>
                  <div className="meta">{law.effective_date ?? '—'}</div>
                  {law.is_downloadable === false ? (
                    <a className="dl" href={mediaUrl(law.file_url)} target="_blank" rel="noreferrer">
                      {t('viewPdf')}
                      <ArrowIcon />
                    </a>
                  ) : (
                    <a className="dl" href={mediaUrl(law.file_url)} download target="_blank" rel="noreferrer">
                      {t('downloadPdf')}
                      <ArrowIcon />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
