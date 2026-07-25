import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { PressRelease } from '@bos/shared-types';

export function PressDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLanguage();
  const t = useT();
  const [item, setItem] = useState<PressRelease | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setItem(null);
    setError(null);
    api
      .pressRelease(id, lang)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id, lang]);

  if (error) {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="status-error">{error}</div>
          <Link className="view-all" to="/press">
            ← {t('pressTitle')}
          </Link>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="status-loading">{t('loadingPress')}</div>
        </div>
      </section>
    );
  }

  const [lead, ...rest] = item.images;

  return (
    <>
      <div className="page-hero page-hero-teal">
        {item.video_url ? (
          <video className="page-hero-media" src={mediaUrl(item.video_url)} autoPlay muted loop playsInline />
        ) : lead ? (
          <img className="page-hero-media" src={mediaUrl(lead)} alt="" />
        ) : null}
        <div className="page-hero-overlay" />
        <div className="wrap page-hero-content">
          <div className="page-hero-breadcrumb">
            <Link to="/press">{t('pressTitle')}</Link>
            <span className="sep">/</span>
            <span>{item.publish_date}</span>
          </div>
          <h1>{item.title}</h1>
        </div>
      </div>

      <section>
        <Reveal>
          <div className="wrap" style={{ maxWidth: 820 }}>
            {item.fallback_used && <div className="fallback-notice">{t('fallbackNotice')}</div>}
            <div className="press-detail-meta">
              {item.publish_date}
              {item.featured && <span className="press-detail-flag">{t('featured')}</span>}
            </div>
            {item.body ? (
              <div className="content-body" dangerouslySetInnerHTML={{ __html: item.body }} />
            ) : (
              <p className="status-loading">{t('noPressBody')}</p>
            )}

            {rest.length > 0 && (
              <div className="press-detail-gallery">
                {rest.map((img) => (
                  <img key={img} src={mediaUrl(img)} alt="" />
                ))}
              </div>
            )}

            <Link className="view-all press-detail-back" to="/press">
              ← {t('pressTitle')}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
