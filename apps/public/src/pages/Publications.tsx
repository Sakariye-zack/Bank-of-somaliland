import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { Reveal } from '../components/Reveal';
import type { Publication, PublicationCategory } from '@bos/shared-types';

const CATEGORY_LABELS: Record<PublicationCategory, string> = {
  annual_report: 'Annual Report',
  circular: 'Circular',
  stability_report: 'Stability Report',
};

export function Publications() {
  const [results, setResults] = useState<Publication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    api
      .publications(category || undefined)
      .then((r) => setResults(r.results))
      .catch((e) => setError(e.message));
  }, [category]);

  return (
    <section>
      <Reveal>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Publications & Laws</h2>
            <div className="sub">Annual reports, circulars, and financial stability reports.</div>
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="status-error">{error}</div>}
        {!results && !error && <div className="status-loading">Loading publications…</div>}
        {results?.length === 0 && <div className="status-loading">No publications in this category yet.</div>}

        <div className="pub-grid">
          {results?.map((pub) => (
            <div className="pub-card" key={pub.id}>
              <div className="pub-thumb">
                <span className="tag">{CATEGORY_LABELS[pub.category]}</span>
              </div>
              <div className="pub-body">
                <h4>{pub.title}</h4>
                <div className="meta">{pub.publish_date}</div>
                <a className="dl" href={mediaUrl(pub.file_url)} target="_blank" rel="noreferrer">
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
