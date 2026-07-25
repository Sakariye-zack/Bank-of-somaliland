import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { initials } from '../lib/institutions';
import { PinIcon, GlobeIcon } from '../components/Icons';
import { useT } from '../lib/i18n';
import { Reveal } from '../components/Reveal';
import type { Institution, InstitutionType } from '@bos/shared-types';

export function Institutions() {
  const t = useT();
  const [results, setResults] = useState<Institution[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const TYPE_LABELS: Record<InstitutionType, string> = {
    bank: t('typeBank'),
    remit: t('typeRemit'),
    mm: t('typeMm'),
    mfi: t('typeMfi'),
    pay: t('typePay'),
    takaful: t('typeTakaful'),
    fx: t('typeFx'),
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .institutions({ type: type || undefined, status: status || undefined, q: q || undefined })
        .then((r) => setResults(r.results))
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [type, status, q]);

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('institutionsTitle')}</h2>
              <div className="sub">{t('institutionsSub')}</div>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-controls">
              <input
                type="text"
                placeholder={t('searchByName')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">{t('allTypes')}</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t('allStatuses')}</option>
                <option value="active">{t('statusActive')}</option>
                <option value="revoked">{t('statusRevoked')}</option>
              </select>
            </div>

            {error && <div className="status-error">{error}</div>}
            {!results && !error && <div className="status-loading">{t('loadingInstitutions')}</div>}
            {results?.length === 0 && <div className="status-loading">{t('noInstitutionsMatch')}</div>}
          </div>

          {results && results.length > 0 && (
            <div className="pub-grid" style={{ marginTop: 24 }}>
              {results.map((inst) => (
                <div className="pub-card inst-card" key={inst.id}>
                  <div className="pub-thumb inst-card-thumb">
                    <span className="tag">{TYPE_LABELS[inst.institution_type]}</span>
                    <div className="inst-card-logo">
                      {inst.logo_url ? (
                        <img src={mediaUrl(inst.logo_url)} alt="" />
                      ) : (
                        <span className="inst-card-logo-fallback">{initials(inst.name)}</span>
                      )}
                    </div>
                  </div>
                  <div className="pub-body">
                    <h4>{inst.name}</h4>
                    {inst.headquarters && (
                      <div className="inst-card-row">
                        <PinIcon />
                        <span>{inst.headquarters}</span>
                      </div>
                    )}
                    {inst.license_number && (
                      <div className="inst-card-row">
                        <span className="inst-card-row-label">{t('colLicenseNo')}:</span>
                        <span>{inst.license_number}</span>
                      </div>
                    )}
                    <div className="inst-card-footer">
                      <span className={`status-pill status-${inst.status}`}>
                        {inst.status === 'active' ? t('statusActive') : t('statusRevoked')}
                      </span>
                      {inst.website_url && (
                        <a className="inst-card-link" href={inst.website_url} target="_blank" rel="noreferrer">
                          <GlobeIcon />
                          {t('visitWebsite')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
