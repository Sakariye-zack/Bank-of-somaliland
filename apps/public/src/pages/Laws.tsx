import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import type { LawRegulation } from '@bos/shared-types';

export function Laws() {
  const [results, setResults] = useState<LawRegulation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .lawsRegulations()
      .then((r) => setResults(r.results))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <Reveal>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Laws & Regulations</h2>
            <div className="sub">The legal and regulatory framework governing the Bank of Somaliland.</div>
          </div>
        </div>

        {error && <div className="status-error">{error}</div>}
        {!results && !error && <div className="status-loading">Loading…</div>}
        {results?.length === 0 && <div className="status-loading">No laws or regulations published yet.</div>}

        <div className="pub-grid">
          {results?.map((law) => (
            <div className="pub-card" key={law.id}>
              <div className="pub-thumb">
                <span className="tag">{law.law_number ?? 'Law'}</span>
              </div>
              <div className="pub-body">
                <h4>{law.title}</h4>
                <div className="meta">{law.effective_date ?? '—'}</div>
                <a className="dl" href={mediaUrl(law.file_url)} target="_blank" rel="noreferrer">
                  Download PDF →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}
