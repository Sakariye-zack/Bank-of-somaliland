import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import { ArrowIcon } from '../components/Icons';
import type { Publication, PublicationCategoryOption } from '@bos/shared-types';

export function Publications() {
  const { lang } = useLanguage();
  const t = useT();
  const [results, setResults] = useState<Publication[] | null>(null);
  const [categories, setCategories] = useState<PublicationCategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');

  function categoryLabel(slug: string): string {
    return categories.find((c) => c.slug === slug)?.name ?? slug;
  }

  useEffect(() => {
    api.publicationCategories(lang).then((r) => setCategories(r.results)).catch(() => {});
  }, [lang]);

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
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
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
                <div className="pub-thumb" style={pub.thumbnail_url ? { backgroundImage: `url(${mediaUrl(pub.thumbnail_url)})` } : undefined}>
                  <span className="tag">{categoryLabel(pub.category)}</span>
                </div>
                <div className="pub-body">
                  <h4>{pub.title}</h4>
                  <div className="meta">{pub.publish_date}</div>
                  {pub.is_downloadable === false ? (
                    <a className="dl" href={mediaUrl(pub.file_url)} target="_blank" rel="noreferrer">
                      {t('viewPdf')}
                      <ArrowIcon />
                    </a>
                  ) : (
                    <a className="dl" href={mediaUrl(pub.file_url)} download target="_blank" rel="noreferrer">
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
