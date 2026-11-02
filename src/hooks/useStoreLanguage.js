import { useEffect } from 'react';
import i18n from '../i18n';
import { useLangStore } from './useStore';

// The "Default language" the owner picks in Settings → Regional was saved but
// nothing ever read it, so every storefront opened in English.
//
// A visitor who has picked a language themselves keeps it — their choice is
// remembered under `lang_explicit`. Everyone else gets the store's default,
// and it follows the owner if they change it later.
const EXPLICIT = 'lang_explicit';

export const markLanguageChosen = () => { try { localStorage.setItem(EXPLICIT, '1'); } catch {} };
export const languageWasChosen = () => { try { return !!localStorage.getItem(EXPLICIT); } catch { return false; } };

export default function useStoreLanguage(store) {
  const wanted = store?.default_language;
  useEffect(() => {
    if (!wanted || !['en', 'fr', 'ar'].includes(wanted)) return;
    if (languageWasChosen()) return;
    if ((i18n.language || '').slice(0, 2) === wanted) return;
    i18n.changeLanguage(wanted);
    try { useLangStore.getState().setLang(wanted); } catch {}
  }, [wanted]);
}
