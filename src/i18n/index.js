import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';

// English ships in the main bundle (it is both the default and the fallback,
// so it is always needed). French and Arabic are separate chunks that are
// fetched only for the visitor who actually uses them — previously all three
// tables were parsed on every single page load, for everyone.
const LOADERS = {
  fr: () => import('./fr'),
  ar: () => import('./ar'),
};

const stored = (() => { try { return localStorage.getItem('lang') || 'en'; } catch { return 'en'; } })();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Fetch a language's table and register it. Resolves immediately for a
// language that is already loaded (or unknown, which falls back to English).
export function loadLanguage(lng) {
  const code = (lng || 'en').slice(0, 2);
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) return Promise.resolve(code);
  const loader = LOADERS[code];
  if (!loader) return Promise.resolve('en');
  return loader()
    .then(m => { i18n.addResourceBundle(code, 'translation', m.default, true, true); return code; })
    .catch(() => 'en');
}

// Every caller that switches language goes through i18n.changeLanguage, so
// wrapping it here means no component has to know the table is lazy.
const nativeChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (lng, ...rest) => loadLanguage(lng).then(code => nativeChangeLanguage(code, ...rest));

// Awaited by main.jsx before the first render so a French/Arabic visitor never
// sees a flash of English.
export const initialLanguageReady = stored === 'en'
  ? Promise.resolve()
  : loadLanguage(stored).then(code => nativeChangeLanguage(code)).catch(() => {});

export default i18n;
