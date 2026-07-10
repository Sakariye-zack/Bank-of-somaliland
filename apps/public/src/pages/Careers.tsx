import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { JobPosting, Tender } from '@bos/shared-types';

export function Careers() {
  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [tenders, setTenders] = useState<Tender[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.jobPostings(), api.tenders()])
      .then(([j, t]) => {
        setJobs(j.results);
        setTenders(t.results);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Careers</h2>
              <div className="sub">Open positions at the Bank of Somaliland.</div>
            </div>
          </div>
          {error && <div className="status-error">{error}</div>}
          {!jobs && !error && <div className="status-loading">Loading…</div>}
          {jobs?.length === 0 && <div className="status-loading">No open positions right now.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {jobs?.map((job) => (
              <article className="news-item" key={job.id} style={{ minWidth: 'auto' }}>
                <div className="date">
                  {job.department ?? 'Bank of Somaliland'} · Closes {job.closing_date}
                </div>
                <h4>{job.title}</h4>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Tenders</h2>
              <div className="sub">Procurement opportunities open for bidding.</div>
            </div>
          </div>
          {tenders?.length === 0 && <div className="status-loading">No open tenders right now.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tenders?.map((tender) => (
              <article className="news-item" key={tender.id} style={{ minWidth: 'auto' }}>
                <div className="date">
                  Ref. {tender.reference_number} · Closes {tender.closing_date}
                </div>
                <h4>{tender.title}</h4>
                {tender.file_url && (
                  <a
                    className="dl"
                    href={tender.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', textDecoration: 'none' }}
                  >
                    Download tender document →
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
