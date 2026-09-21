import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { JobPosting, Tender } from '@bos/shared-types';

export function Careers() {
  const { lang } = useLanguage();
  const t = useT();
  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [tenders, setTenders] = useState<Tender[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.jobPostings(lang), api.tenders(lang)])
      .then(([j, tRes]) => {
        setJobs(j.results);
        setTenders(tRes.results);
      })
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <>
      <Reveal>
        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>{t('careersTitle')}</h2>
                <div className="sub">{t('careersSub')}</div>
              </div>
            </div>
            {error && <div className="status-error">{error}</div>}
            {!jobs && !error && <div className="status-loading">{t('loading')}</div>}
            {jobs?.length === 0 && <div className="status-loading">{t('noJobsYet')}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {jobs?.map((job) => (
                <article className="list-card" key={job.id}>
                  <div className="list-card-icon">
                    <BriefcaseIcon />
                  </div>
                  <div className="list-card-body">
                    <span className="list-card-tag">{job.department ?? t('bankName')}</span>
                    <h4>{job.title}</h4>
                    {job.description && <p className="list-card-desc">{job.description}</p>}
                  </div>
                  <div className="list-card-closing">
                    {t('closes')}
                    <br />
                    {job.closing_date}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>{t('tendersTitle')}</h2>
                <div className="sub">{t('tendersSub')}</div>
              </div>
            </div>
            {tenders?.length === 0 && <div className="status-loading">{t('noTendersYet')}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tenders?.map((tender) => (
                <article className="list-card" key={tender.id}>
                  <div className="list-card-icon">
                    <DocumentIcon />
                  </div>
                  <div className="list-card-body">
                    <span className="list-card-tag">
                      {t('ref')} {tender.reference_number}
                    </span>
                    <h4>{tender.title}</h4>
                    {tender.description && <p className="list-card-desc">{tender.description}</p>}
                    {tender.file_url && (
                      <a className="list-card-dl" href={mediaUrl(tender.file_url)} target="_blank" rel="noreferrer">
                        {t('downloadTender')}
                        <ArrowIcon />
                      </a>
                    )}
                  </div>
                  <div className="list-card-closing">
                    {t('closes')}
                    <br />
                    {tender.closing_date}
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

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M15 2v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
