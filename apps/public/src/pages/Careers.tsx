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
                <article className="news-item" key={job.id} style={{ minWidth: 'auto' }}>
                  <div className="date">
                    {job.department ?? t('bankName')} · {t('closes')} {job.closing_date}
                  </div>
                  <h4>{job.title}</h4>
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
                <article className="news-item" key={tender.id} style={{ minWidth: 'auto' }}>
                  <div className="date">
                    {t('ref')} {tender.reference_number} · {t('closes')} {tender.closing_date}
                  </div>
                  <h4>{tender.title}</h4>
                  {tender.file_url && (
                    <a
                      className="dl"
                      href={mediaUrl(tender.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', textDecoration: 'none' }}
                    >
                      {t('downloadTender')}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
