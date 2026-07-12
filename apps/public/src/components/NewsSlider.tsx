import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/media';
import { useT } from '../lib/i18n';
import type { HeroSlide } from '@bos/shared-types';

const AUTO_ADVANCE_MS = 6000;

export function NewsSlider({ items }: { items: HeroSlide[] }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % items.length) + items.length) % items.length);
    },
    [items.length]
  );

  useEffect(() => {
    if (paused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, items.length]);

  if (items.length === 0) return null;

  return (
    <section
      className="news-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t('sliderEyebrow')}
    >
      <div className="news-slider-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {items.map((item, i) => (
          <div className={`news-slide${i === active ? ' is-active' : ''}`} key={item.id} aria-hidden={i !== active}>
            {item.image_url ? (
              <img className="news-slide-img" src={mediaUrl(item.image_url)} alt="" />
            ) : item.video_url ? (
              <video className="news-slide-img news-slide-video" src={mediaUrl(item.video_url)} muted loop autoPlay playsInline />
            ) : (
              <div className="news-slide-fallback" />
            )}
            <img className="news-slide-watermark" src="/logo.jpg" alt="" />
            <div className="news-slide-scrim" />
            <div className="news-slide-content">
              <div className="news-slide-eyebrow">{t('sliderEyebrow')}</div>
              <h2 className="news-slide-title">{item.title}</h2>
              {item.subtitle && <p className="news-slide-subtitle">{item.subtitle}</p>}
              <Link className="btn btn-primary" to={item.link_url || '/press'}>
                {t('sliderCta')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button className="news-slider-arrow prev" type="button" aria-label={t('previous')} onClick={() => goTo(active - 1)}>
            ‹
          </button>
          <button className="news-slider-arrow next" type="button" aria-label={t('next')} onClick={() => goTo(active + 1)}>
            ›
          </button>
          <div className="news-slider-dots">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`news-slider-dot${i === active ? ' is-active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
