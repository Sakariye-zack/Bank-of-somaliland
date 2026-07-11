import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Reveal } from './Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { ContentResponse } from '@bos/shared-types';

export function ContentPage({ slug }: { slug: string }) {
  const { lang } = useLanguage();
  const t = useT();
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    api
      .content(slug, lang)
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [slug, lang]);

  return (
    <section>
      <Reveal>
        <div className="wrap" style={{ maxWidth: 760 }}>
          {error && <div className="status-error">{error}</div>}
          {!content && !error && <div className="status-loading">{t('loading')}</div>}
          {content?.fallback_used && <div className="fallback-notice">{t('fallbackNotice')}</div>}
          {content && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>{content.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body ?? '' }} />
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}
