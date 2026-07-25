import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { NewsSlider } from '../components/NewsSlider';
import { Reveal } from '../components/Reveal';
import { CurrencyConverter } from '../components/CurrencyConverter';
import { Sparkline } from '../components/Sparkline';
import {
  PinIcon,
  PhoneIcon,
  MailIcon,
  ArrowIcon,
  BuildingIcon,
  UsersIcon,
  ShieldCheckIcon,
  TrendUpIcon,
  NetworkIcon,
  ChartBarIcon,
  ScaleIcon,
} from '../components/Icons';
import { SomalilandMap } from '../components/SomalilandMap';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import { initials } from '../lib/institutions';
import type {
  ExchangeRatesLatestResponse,
  PressReleasesResponse,
  HeroSlide,
  Publication,
  PublicationCategoryOption,
  ContentResponse,
  BankBranch,
  InstitutionsResponse,
  InstitutionType,
} from '@bos/shared-types';

export function Home() {
  const { lang } = useLanguage();
  const t = useT();
  const [rates, setRates] = useState<ExchangeRatesLatestResponse | null>(null);
  const [press, setPress] = useState<PressReleasesResponse | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [pubCategories, setPubCategories] = useState<PublicationCategoryOption[]>([]);
  const [aboutSomaliland, setAboutSomaliland] = useState<ContentResponse | null>(null);
  const [branches, setBranches] = useState<BankBranch[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionsResponse | null>(null);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Scroll by roughly one card-and-gap, in the reading direction of the page.
  function scrollCarousel(direction: 1 | -1) {
    const el = carouselRef.current;
    if (!el) return;
    const rtl = document.documentElement.dir === 'rtl';
    const step = 220 * direction * (rtl ? -1 : 1);
    el.scrollBy({ left: step, behavior: 'smooth' });
  }

  function pubCategoryLabel(slug: string): string {
    return pubCategories.find((c) => c.slug === slug)?.name ?? slug;
  }

  const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
    bank: t('typeBank'),
    remit: t('typeRemit'),
    mm: t('typeMm'),
    mfi: t('typeMfi'),
    pay: t('typePay'),
    takaful: t('typeTakaful'),
    fx: t('typeFx'),
  };

  useEffect(() => {
    Promise.all([
      api.latestRates(lang),
      api.pressReleases(1, 6, lang),
      api.heroSlides(lang),
      api.publications(undefined, lang, 3),
      api.publicationCategories(lang),
    ])
      .then(([r, p, s, pubs, cats]) => {
        setRates(r);
        setPress(p);
        setSlides(s.results);
        setPublications(pubs.results);
        setPubCategories(cats.results);
      })
      .catch((e) => setError(e.message));
  }, [lang]);

  useEffect(() => {
    api.content('about-somaliland', lang).then(setAboutSomaliland).catch(() => setAboutSomaliland(null));
    api
      .bankBranches(lang)
      .then((r) => setBranches(r.results))
      .catch(() => {});
    api
      .institutions({ status: 'active' })
      .then(setInstitutions)
      .catch(() => {});
  }, [lang]);

  // Trend sparkline for the rate table: pull a wide window and keep the last 7
  // readings, rather than asking for "the last 7 days" — rates aren't published
  // every day, so a strict date window can come back empty.
  useEffect(() => {
    const codes = (rates?.rates ?? []).map((r) => r.currency_code);
    if (codes.length === 0) return;
    let cancelled = false;
    Promise.all(
      codes.map((code) =>
        api
          .rateHistory(code, 60)
          .then(
            (h) =>
              [code, h.series.map((p) => parseFloat(p.selling_rate)).filter(Number.isFinite).slice(-7)] as const
          )
          .catch(() => [code, [] as number[]] as const)
      )
    ).then((entries) => {
      if (!cancelled) setSparklines(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [rates]);

  const recentItems = (press?.results ?? []).slice(0, 3);
  const yearsOfService = new Date().getFullYear() - 1994;
  const institutionCount = institutions?.results.length ?? 0;

  const mandates = [
    { Icon: ScaleIcon, title: t('mandateMonetaryTitle'), desc: t('mandateMonetaryDesc') },
    { Icon: TrendUpIcon, title: t('mandateFinancialTitle'), desc: t('mandateFinancialDesc') },
    { Icon: NetworkIcon, title: t('mandatePaymentsTitle'), desc: t('mandatePaymentsDesc') },
    { Icon: ShieldCheckIcon, title: t('mandateConsumerTitle'), desc: t('mandateConsumerDesc') },
    { Icon: ChartBarIcon, title: t('mandateResearchTitle'), desc: t('mandateResearchDesc') },
  ];

  return (
    <>
      {slides.length > 0 && <NewsSlider items={slides} />}

      <div className="wrap home-stats-wrap">
        <div className="home-stats">
          <div className="home-stat">
            <div className="home-stat-icon"><BuildingIcon /></div>
            <div>
              <div className="home-stat-value">{yearsOfService}+</div>
              <div className="home-stat-label">{t('statYearsLabel')}</div>
              <div className="home-stat-sub">{t('statYearsSub')}</div>
            </div>
          </div>
          <div className="home-stat">
            <div className="home-stat-icon"><UsersIcon /></div>
            <div>
              <div className="home-stat-value">{institutionCount > 0 ? `${institutionCount}+` : '—'}</div>
              <div className="home-stat-label">{t('statInstitutionsLabel')}</div>
              <div className="home-stat-sub">{t('statInstitutionsSub')}</div>
            </div>
          </div>
          <div className="home-stat">
            <div className="home-stat-icon"><PinIcon /></div>
            <div>
              <div className="home-stat-value">{branches.length > 0 ? branches.length : '—'}</div>
              <div className="home-stat-label">{t('statBranchesLabel')}</div>
              <div className="home-stat-sub">{t('statBranchesSub')}</div>
            </div>
          </div>
          <div className="home-stat">
            <div className="home-stat-icon"><ShieldCheckIcon /></div>
            <div>
              <div className="home-stat-value">100%</div>
              <div className="home-stat-label">{t('statCurrencyLabel')}</div>
              <div className="home-stat-sub">{t('statCurrencySub')}</div>
            </div>
          </div>
        </div>
      </div>

      <Reveal>
        <section className="home-section">
          <div className="wrap home-split">
            <div className="home-panel">
              <div className="home-panel-head">
                <h3>{t('officialExchangeRates')}</h3>
                <span className="as-of">
                  {t('asOf')} {rates?.as_of ?? '—'}
                </span>
              </div>
              {error && <div className="status-error">{error}</div>}
              {!error && !rates && <div className="status-loading">{t('loadingRates')}</div>}
              {rates?.rates.length === 0 && <div className="status-loading">{t('noRatesYet')}</div>}
              {(rates?.rates.length ?? 0) > 0 && (
                <div className="rate-table-scroll">
                  <table className="rate-table">
                    <thead>
                      <tr>
                        <th>{t('colCurrency')}</th>
                        <th>{t('colBuy')}</th>
                        <th>{t('colSell')}</th>
                        <th>{t('colChange24h')}</th>
                        <th>{t('col7DayTrend')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates?.rates.map((r) => (
                        <tr key={r.currency_code}>
                          <td>
                            <div className="rate-cur">
                              {r.flag_url && <img className="rate-flag" src={mediaUrl(r.flag_url)} alt="" />}
                              <div>
                                <strong>{r.currency_code}</strong>
                                <div className="rate-cur-name">{r.currency_name ?? ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="rate-num">{r.buying_rate}</td>
                          <td className="rate-num">{r.selling_rate}</td>
                          <td>
                            <span className={`trend ${r.trend}`}>
                              {r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '–'} {r.change_pct}%
                            </span>
                          </td>
                          <td>
                            <Sparkline values={sparklines[r.currency_code] ?? []} trend={r.trend} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Link className="home-panel-link" to="/exchange-rates">
                {t('viewAllRates')} <ArrowIcon />
              </Link>
            </div>

            <div className="home-panel home-panel-converter">
              {(rates?.rates.length ?? 0) > 0 ? (
                <CurrencyConverter rates={rates!.rates} />
              ) : (
                <div className="status-loading">{t('loadingRates')}</div>
              )}
              <Link className="home-panel-link" to="/exchange-rates">
                {t('moreTools')} <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-section">
          <div className="wrap home-split">
            <div>
              <div className="section-head">
                <div>
                  <div className="section-kicker">{t('kickerNews')}</div>
                  <h2>{t('recentAnnouncements')}</h2>
                </div>
                <Link className="view-all" to="/press">
                  {t('viewAllPress')}
                </Link>
              </div>
            {!press && !error && <div className="status-loading">{t('loadingAnnouncements')}</div>}
            {press?.results.length === 0 && <div className="status-loading">{t('noAnnouncementsYet')}</div>}
            <div className="news-strip">
              {recentItems.map((item) => (
                <Link className="news-item" to="/press" key={item.id}>
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
                    <span className="news-item-more">
                      {t('readMore')}
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            </div>

            <div>
              <div className="section-head">
                <div>
                  <div className="section-kicker">{t('kickerPublications')}</div>
                  <h2>{t('publicationsTitle')}</h2>
                </div>
                <Link className="view-all" to="/publications">
                  {t('viewPublications')}
                </Link>
              </div>
              <div className="pub-grid">
                {publications.map((pub) => (
                  <div className="pub-card" key={pub.id}>
                    <div
                      className="pub-thumb"
                      style={pub.thumbnail_url ? { backgroundImage: `url(${mediaUrl(pub.thumbnail_url)})` } : undefined}
                    >
                      <span className="tag">{pubCategoryLabel(pub.category)}</span>
                    </div>
                    <div className="pub-body">
                      <h4>{pub.title}</h4>
                      <div className="meta">
                        <span className="pub-filetype">PDF</span>
                        {pub.publish_date}
                      </div>
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
          </div>
        </section>
      </Reveal>

      {(institutions?.results.length ?? 0) > 0 && (
        <Reveal>
          <section className="home-section">
            <div className="wrap">
              <div className="home-card">
              <div className="home-card-head">
                <h3>{t('licensedInstitutionsTitle')}</h3>
                <Link className="view-all" to="/institutions">
                  {t('viewAllInstitutions')}
                </Link>
              </div>
              <div className="institution-carousel-wrap">
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-prev"
                  aria-label={t('carouselPrev')}
                  onClick={() => scrollCarousel(-1)}
                >
                  ‹
                </button>
                <div className="institution-carousel" ref={carouselRef}>
                {institutions?.results.map((inst) => (
                  <div className="institution-card" key={inst.id}>
                    <div className="institution-badge">{INSTITUTION_TYPE_LABELS[inst.institution_type]}</div>
                    <div className="institution-logo-wrap">
                      {inst.logo_url ? (
                        <img className="institution-logo" src={mediaUrl(inst.logo_url)} alt={inst.name} />
                      ) : (
                        <div className="institution-logo-placeholder">
                          {inst.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </div>
                      )}
                    </div>
                    <div className="institution-body">
                      <h4>{inst.name}</h4>
                      {inst.headquarters && <div className="institution-city"><PinIcon /> {inst.headquarters}</div>}
                    </div>
                  </div>
                ))}
                </div>
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-next"
                  aria-label={t('carouselNext')}
                  onClick={() => scrollCarousel(1)}
                >
                  ›
                </button>
              </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {(aboutSomaliland?.body || branches.length > 0) && (
        <Reveal>
          <section className="home-section">
            <div className="wrap home-split">
              {aboutSomaliland?.body && (
                <div className="home-card">
                  <div className="home-card-head">
                    <h3>{aboutSomaliland.title || t('aboutSomalilandTitle')}</h3>
                    <Link className="view-all" to="/about/somaliland">
                      {t('readMore')} →
                    </Link>
                  </div>
                  {/* Map first in DOM so it can float beside the opening facts and
                      let the prose below it run the card's full width. */}
                  <div className="about-grid">
                    {branches.length > 0 && <SomalilandMap branches={branches} />}
                    <div className="about-panel">
                      <div className="content-body" dangerouslySetInnerHTML={{ __html: aboutSomaliland.body }} />
                    </div>
                  </div>
                </div>
              )}

              {branches.length > 0 && (
                <div className="home-card">
                  <div className="home-card-head">
                    <h3>{t('bankBranchesTitle')}</h3>
                    <Link className="view-all" to="/contact">
                      {t('viewAllBranches')}
                    </Link>
                  </div>
                  {/* Homepage shows a short list; the full set lives on /contact. */}
                  <div className="branch-chip-grid">
                    {branches.slice(0, 6).map((branch) => (
                      <div
                        className={`branch-chip${branch.is_headquarters ? ' branch-chip-hq' : ''}`}
                        key={branch.id}
                      >
                        <div className="branch-chip-head">
                          <div className="branch-chip-avatar">{initials(branch.name)}</div>
                          <div>
                            <h4>{branch.name}</h4>
                            <div className="branch-chip-city">{branch.city}</div>
                          </div>
                        </div>
                        {branch.is_headquarters && (
                          <div className="branch-chip-rows">
                            {branch.phone && (
                              <div className="branch-chip-row">
                                <PhoneIcon />
                                <span>{branch.phone}</span>
                              </div>
                            )}
                            {branch.email && (
                              <div className="branch-chip-row">
                                <MailIcon />
                                <span>{branch.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <div className="wrap">
          <div className="home-mandates">
            {mandates.map(({ Icon, title, desc }) => (
              <div className="home-mandate" key={title}>
                <div className="home-mandate-icon">
                  <Icon />
                </div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </>
  );
}
