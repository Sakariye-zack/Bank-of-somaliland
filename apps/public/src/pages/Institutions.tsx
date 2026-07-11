import { useEffect, useState } from 'react';
import { api } from '../lib/api';
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

            {results && results.length > 0 && (
              <table className="inst-table">
                <thead>
                  <tr>
                    <th>{t('colName')}</th>
                    <th>{t('colType')}</th>
                    <th>{t('colHeadquarters')}</th>
                    <th>{t('colLicenseNo')}</th>
                    <th>{t('colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((inst) => (
                    <tr key={inst.id}>
                      <td>{inst.name}</td>
                      <td>{TYPE_LABELS[inst.institution_type]}</td>
                      <td>{inst.headquarters ?? '—'}</td>
                      <td>{inst.license_number ?? '—'}</td>
                      <td>
                        <span className={`status-pill status-${inst.status}`}>
                          {inst.status === 'active' ? t('statusActive') : t('statusRevoked')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
