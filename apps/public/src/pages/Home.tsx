import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { NewsSlider } from '../components/NewsSlider';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { ExchangeRatesLatestResponse, PressReleasesResponse, HeroSlide } from '@bos/shared-types';

export function Home() {
  const { lang } = useLanguage();
  const t = useT();
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [press, setPress] = useState<PressReleasesResponse | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [error, setError] = useState<string | null>(null);

  const CURRENCY_LABELS: Record<string, string> = {
    USD: t('usDollar'),
    SAR: t('saudiRiyal'),
    ETB: t('ethiopianBirr'),
    AED: t('uaeDirham'),
  };

  useEffect(() => {
    Promise.all([api.latestRates(), api.pressReleases(1, 6, lang), api.heroSlides(lang)])
      .then(([r, p, s]) => {
        setRates(r);
        setPress(p);
        setSlides(s.results);
      })
      .catch((e) => setError(e.message));
  }, [lang]);

  const recentItems = (press?.results ?? []).slice(0, 3);

  return (
    <>
      {slides.length > 0 && <NewsSlider items={slides} />}

      <section className="hero" style={{ padding: '56px 0 0' }}>
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">{t('heroEyebrow')}</div>
            <h1>{t('heroTitle')}</h1>
            <p className="lede">{t('heroLede')}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to="/institutions">
                {t('verifyInstitution')}
              </Link>
              <Link className="btn btn-ghost" to="/publications">
                {t('viewPublications')}
              </Link>
            </div>
          </div>

          <div className="ledger">
            <div className="ledger-head">
              <h3>{t('officialExchangeRates')}</h3>
              <span className="as-of">
                {t('asOf')} {rates?.as_of ?? '—'}
              </span>
            </div>
            {error && <div className="status-error">{error}</div>}
            {!error && !rates && <div className="status-loading">{t('loadingRates')}</div>}
            {rates?.rates.length === 0 && <div className="status-loading">{t('noRatesYet')}</div>}
            {rates?.rates.map((r) => (
              <div className="rate-row" key={r.currency_code}>
                <div className="rate-cur">
                  {r.currency_code}
                  <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--bronze)' }}>
                    {CURRENCY_LABELS[r.currency_code] ?? ''}
                  </div>
                </div>
                <div className="rate-val">
                  {r.rate_to_ssh} SSH
                  <span className={`trend ${r.trend}`}>
                    {r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '–'} {r.change_pct}%
                  </span>
                </div>
              </div>
            ))}
            <div className="ledger-note">{t('officialRateNote')}</div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </section>

      <Reveal>
        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>{t('recentAnnouncements')}</h2>
                <div className="sub">{t('latestFromBank')}</div>
              </div>
              <Link className="view-all" to="/press">
                {t('viewAllPress')}
              </Link>
            </div>
            {!press && !error && <div className="status-loading">{t('loadingAnnouncements')}</div>}
            {press?.results.length === 0 && <div className="status-loading">{t('noAnnouncementsYet')}</div>}
            <div className="news-strip">
              {recentItems.map((item) => (
                <article className="news-item" key={item.id}>
                  <div className="news-item-visual">
                    {item.images.length > 0 ? (
                      <img className="news-item-thumb" src={mediaUrl(item.images[0])} alt="" />
                    ) : item.video_url ? (
                      <>
                        <video
                          className="news-item-video"
                          src={mediaUrl(item.video_url)}
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                        <div className="news-item-video-badge">▶</div>
                      </>
                    ) : (
                      <div className="news-item-emblem">
                        <img src="/logo.jpg" alt="" />
                      </div>
                    )}
                  </div>
                  <div className="news-item-body">
                    <div className="date">{item.publish_date}</div>
                    <h4>{item.title}</h4>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
