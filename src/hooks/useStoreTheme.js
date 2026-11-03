import { useEffect } from 'react';
import { useBuyerTheme } from './useStore';

// One place where every storefront page works out its colours.
//
// Pages used to each do their own `store.primary_color || '#7C3AED'`, and only
// some of them also fell back to the buyer's chosen theme colour or called
// init() — so landing straight on the cart, favourites or the tracking page
// gave a different accent (and no dark mode) from the shop itself.
//
// Call it at the top of the component (it is a hook, so never after an early
// return) and use `pcFor(store)` wherever the accent is needed — `store`
// usually arrives from a fetch long after the first render.
export default function useStoreTheme() {
  const theme = useBuyerTheme();
  useEffect(() => { theme.init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const dark = theme.mode === 'dark';
  return {
    mode: theme.mode,
    dark,
    palette: theme.palette,
    setMode: theme.setMode,
    setPrimaryColor: theme.setPrimaryColor,
    // What the store admin set wins; otherwise the colour the buyer picked;
    // otherwise the default purple.
    pcFor: (store) => store?.primary_color || theme.primaryColor || '#7C3AED',
    // The page background, identical on every storefront page so switching
    // pages never switches theme: the store's dark background in dark mode,
    // its light background otherwise. `glass` is for the pages drawn dark-only
    // (track, favourites, profile): in light mode `buyer-theme-light` turns
    // their white-on-glass styling into dark-on-white.
    surface: (store, { glass = false } = {}) => {
      const cfg = store?.config || {};
      return dark
        ? { className: `store-page ${glass ? '' : 'buyer-theme-dark'} text-gray-100`, style: { '--page-bg': cfg.store_dark_bg_color || '#000000' } }
        : { className: `store-page ${glass ? 'buyer-theme-light' : ''} text-gray-900`, style: { '--page-bg': cfg.store_bg_color || '#f5f5f5' } };
    },
  };
}
