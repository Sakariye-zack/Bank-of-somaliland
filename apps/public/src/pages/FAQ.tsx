import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Reveal } from '../components/Reveal';
import { useLanguage } from '../lib/LanguageContext';
import { useT } from '../lib/i18n';
import type { Faq } from '@bos/shared-types';

export function FAQ() {
  const { lang } = useLanguage();
  const t = useT();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api
      .faqs(lang)
      .then((r) => setFaqs(r.results))
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <section>
      <Reveal>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>{t('faqTitle')}</h2>
              <div className="sub">{t('faqSub')}</div>
            </div>
          </div>

          {error && <div className="status-error">{error}</div>}
          {!faqs && !error && <div className="status-loading">{t('loadingFaqs')}</div>}
          {faqs?.length === 0 && <div className="status-loading">{t('noFaqsYet')}</div>}

          <div className="faq-list">
            {faqs?.map((faq) => {
              const open = openId === faq.id;
              return (
                <div className={`faq-item${open ? ' is-open' : ''}`} key={faq.id}>
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenId(open ? null : faq.id)}
                    aria-expanded={open}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-chevron" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {open && <div className="faq-answer">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
