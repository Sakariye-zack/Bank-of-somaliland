import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { SearchResponse, SearchResultType } from '@bos/shared-types';

export function Search() {
  const { lang } = useLanguage();
  const t = useT();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }
    setData(null);
    setError(null);
    api
      .search(q, lang)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [q, lang]);

  const typeLabels: Record<SearchResultType, string> = {
    page: t('searchTypePage'),
    press: t('searchTypePress'),
    publication: t('searchTypePublication'),
    law: t('searchTypeLaw'),
  };

  return (
    <section>
      <Reveal>
        <div className="wrap" style={{ maxWidth: 800 }}>
          <div className="section-head">
            <div>
              <h2>{t('searchResultsTitle')}</h2>
              {q && (
                <div className="sub">
                  {t('searchResultsFor')} “{q}”
                </div>
              )}
            </div>
          </div>

          {!q && <div className="status-loading">{t('searchPrompt')}</div>}
          {error && <div className="status-error">{error}</div>}
          {q && !data && !error && <div className="status-loading">{t('loading')}</div>}
          {q && data && data.results.length === 0 && <div className="status-loading">{t('searchNoResults')}</div>}

          {data && data.results.length > 0 && (
            <div className="search-results">
              {data.results.map((r, i) => (
                <Link className="search-result" to={r.url} key={i}>
                  <span className="search-result-type">{typeLabels[r.type]}</span>
                  <h4>{r.title}</h4>
                  {r.snippet && <p>{r.snippet}</p>}
                  {r.date && <div className="search-result-date">{r.date}</div>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
