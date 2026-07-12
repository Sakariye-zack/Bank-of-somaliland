import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { useT } from '../lib/i18n';
import type { Institution } from '@bos/shared-types';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function InstitutionPill({ inst }: { inst: Institution }) {
  const content = (
    <>
      <div className="marquee-logo">
        {inst.logo_url ? (
          <img src={mediaUrl(inst.logo_url)} alt="" />
        ) : (
          <span className="marquee-logo-fallback">{initials(inst.name)}</span>
        )}
      </div>
      <span className="marquee-name">{inst.name}</span>
    </>
  );

  if (inst.website_url) {
    return (
      <a className="marquee-item" href={inst.website_url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return <div className="marquee-item marquee-item-static">{content}</div>;
}

export function InstitutionsMarquee() {
  const t = useT();
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    api
      .institutions({ status: 'active' })
      .then((r) => setInstitutions(r.results))
      .catch(() => {});
  }, []);

  if (institutions.length === 0) return null;

  // Duplicate the list so the CSS translateX(-50%) loop is seamless.
  const track = [...institutions, ...institutions];

  return (
    <section className="marquee-section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>{t('institutionsTitle')}</h2>
            <div className="sub">{t('institutionsSub')}</div>
          </div>
          <Link className="view-all" to="/institutions">
            {t('viewAllInstitutions')}
          </Link>
        </div>
      </div>
      <div className="marquee-viewport">
        <div className="marquee-track">
          {track.map((inst, i) => (
            <InstitutionPill inst={inst} key={`${inst.id}-${i}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
