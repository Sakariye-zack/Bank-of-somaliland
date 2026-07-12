import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { PressReleasesResponse } from '@bos/shared-types';

export function Press() {
  const { lang } = useLanguage();
  const t = useT();
  const [data, setData] = useState<PressReleasesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .pressReleases(page, 10, lang)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, lang]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('pressTitle')}</h2>
              <div className="sub">{t('pressSub')}</div>
            </div>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!data && !error && <div className="status-loading">{t('loadingPress')}</div>}
          {data?.results.length === 0 && <div className="status-loading">{t('noPressYet')}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data?.results.map((item) => (
              <article className="news-item press-list-item" key={item.id} style={{ minWidth: 'auto' }}>
                <div className="news-item-visual press-list-visual">
                  {item.images.length > 0 ? (
                    <img className="news-item-thumb" src={mediaUrl(item.images[0])} alt="" />
                  ) : item.video_url ? (
                    <>
                      <video className="news-item-video" src={mediaUrl(item.video_url)} muted loop autoPlay playsInline />
                      <div className="news-item-video-badge">▶</div>
                    </>
                  ) : (
                    <div className="news-item-emblem">
                      <img src="/logo.jpg" alt="" />
                    </div>
                  )}
                </div>
                <div className="news-item-body press-list-body">
                  <div className="date">
                    {item.publish_date} {item.featured && t('featured')}
                  </div>
                  <h4>{item.title}</h4>
                  {item.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {item.images.slice(1).map((img) => (
                        <img key={img} src={mediaUrl(img)} alt="" className="news-gallery-thumb" />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {data && totalPages > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--ink)', borderColor: 'var(--line)' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('previous')}
              </button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--bronze)' }}>{t('pageOf', page, totalPages)}</span>
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--ink)', borderColor: 'var(--line)' }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
