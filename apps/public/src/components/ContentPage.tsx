import { useEffect, useState, type JSX, type MouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from './Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import { BuildingIcon, ScaleIcon, GearIcon, CapIcon, DocumentIcon } from './Icons';
import type { ContentResponse } from '@bos/shared-types';

const TYPE_STYLE: Record<string, { accent: string; Icon: () => JSX.Element }> = {
  about: { accent: 'teal', Icon: BuildingIcon },
  governance: { accent: 'gold', Icon: ScaleIcon },
  core_function: { accent: 'forest', Icon: GearIcon },
  support_function: { accent: 'bronze', Icon: GearIcon },
  opportunities: { accent: 'gold', Icon: CapIcon },
  custom: { accent: 'teal', Icon: DocumentIcon },
};

const BREADCRUMB_HOME: Record<string, string> = { en: 'Home', so: 'Guriga', ar: 'الرئيسية' };
const BREADCRUMB_CATEGORY: Record<string, Record<string, string>> = {
  about: { en: 'About Us', so: 'Ku Saabsan', ar: 'من نحن' },
  governance: { en: 'Governance', so: 'Maamulka', ar: 'الحوكمة' },
  core_function: { en: 'BoSL Functions', so: 'Hawlaha BoSL', ar: 'وظائف البنك' },
  support_function: { en: 'BoSL Functions', so: 'Hawlaha BoSL', ar: 'وظائف البنك' },
  opportunities: { en: 'Opportunities', so: 'Fursado', ar: 'الفرص' },
  legal: { en: 'Legal', so: 'Sharci', ar: 'قانوني' },
};

export function ContentPage({ slug: slugProp }: { slug?: string }) {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugProp ?? slugParam ?? '';
  const { lang } = useLanguage();
  const t = useT();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleContentClick(e: MouseEvent<HTMLElement>) {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/') || anchor.target === '_blank') return;
    e.preventDefault();
    navigate(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (!slug) return;
    setContent(null);
    setError(null);
    api
      .content(slug, lang)
      .then(setContent)
      .catch((e) => setError(e.message));
  }, [slug, lang]);

  if (error) {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="status-error">{error}</div>
        </div>
      </section>
    );
  }

  if (!content) {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="status-loading">{t('loading')}</div>
        </div>
      </section>
    );
  }

  const style = TYPE_STYLE[content.page_type] ?? TYPE_STYLE.custom;
  const { Icon } = style;
  const categoryLabel = BREADCRUMB_CATEGORY[content.page_type]?.[lang];

  return (
    <>
      <div className={`page-hero page-hero-${style.accent}`}>
        {content.banner_video_url ? (
          <video className="page-hero-media" src={mediaUrl(content.banner_video_url)} autoPlay muted loop playsInline />
        ) : content.banner_image_url ? (
          <img className="page-hero-media" src={mediaUrl(content.banner_image_url)} alt="" />
        ) : (
          <div className="page-hero-icon">
            <Icon />
          </div>
        )}
        <div className="page-hero-overlay" />
        <div className="wrap page-hero-content">
          <div className="page-hero-breadcrumb">
            <a href="/" onClick={handleContentClick}>
              {BREADCRUMB_HOME[lang] ?? BREADCRUMB_HOME.en}
            </a>
            {categoryLabel && (
              <>
                <span className="sep">/</span>
                <span>{categoryLabel}</span>
              </>
            )}
            <span className="sep">/</span>
            <span>{content.title}</span>
          </div>
          <h1>{content.title}</h1>
          {content.subtitle && <p className="page-hero-lede">{content.subtitle}</p>}
        </div>
      </div>

      <section>
        <Reveal variant={content.animation_style}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            {content.fallback_used && <div className="fallback-notice">{t('fallbackNotice')}</div>}
            <div
              className="content-body"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: content.body ?? '' }}
            />
          </div>
        </Reveal>
      </section>
    </>
  );
}
