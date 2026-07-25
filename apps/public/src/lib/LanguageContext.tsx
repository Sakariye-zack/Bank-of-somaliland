import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LanguageCode } from '@bos/shared-types';

interface LanguageState {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

const STORAGE_KEY = 'bos_lang';

function readStoredLang(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'so' || stored === 'ar' ? stored : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(readStoredLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', lang === 'ar');
  }, [lang]);

  function setLang(next: LanguageCode) {
    setLangState(next);
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
