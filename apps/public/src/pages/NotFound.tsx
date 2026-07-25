import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';

export function NotFound() {
  const t = useT();

  return (
    <section style={{ padding: '90px 0' }}>
      <div className="wrap" style={{ textAlign: 'center', maxWidth: 480 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 72,
            fontWeight: 700,
            color: 'var(--gold)',
            lineHeight: 1,
          }}
        >
          404
        </div>
        <h2 style={{ marginTop: 10 }}>{t('notFoundTitle')}</h2>
        <p className="sub" style={{ margin: '10px 0 26px' }}>
          {t('notFoundMessage')}
        </p>
        <Link className="btn btn-primary" to="/">
          {t('backToHome')}
        </Link>
      </div>
    </section>
  );
}
