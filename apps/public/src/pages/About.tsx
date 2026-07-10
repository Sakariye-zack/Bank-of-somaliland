import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ContentResponse } from '@bos/shared-types';

export function About() {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .content('about-the-bank', 'en')
      .then(setContent)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <div className="wrap" style={{ maxWidth: 760 }}>
        {error && <div className="status-error">{error}</div>}
        {!content && !error && <div className="status-loading">Loading…</div>}
        {content?.fallback_used && (
          <div className="fallback-notice">
            This page is not yet translated into the language you requested — showing the English version instead.
          </div>
        )}
        {content && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>{content.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: content.body ?? '' }} />
          </>
        )}
      </div>
    </section>
  );
}
