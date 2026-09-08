import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { locales, LocaleCode } from './locales';

type TranslationValue = string | Record<string, unknown>;

type Ctx = {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

function lookup(locale: LocaleCode, key: string): string {
  const getValue = (source: unknown, parts: string[]): unknown => {
    let current = source;

    for (const part of parts) {
      if (
        typeof current !== 'object' ||
        current === null ||
        !(part in current)
      ) {
        return undefined;
      }

      current = (current as Record<string, unknown>)[part];
    }

    return current;
  };

  const parts = key.split('.');

  const value =
    getValue(locales[locale], parts) ??
    getValue(locales.en, parts);

  return typeof value === 'string' ? value : key;
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<LocaleCode>('en');

  const t = (key: string, vars?: Record<string, string | number>) => {
    let str = lookup(locale, key);

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }

    return str;
  };

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);

  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return ctx;
}