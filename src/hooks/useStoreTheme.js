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
  return {
    mode: theme.mode,
    dark: theme.mode === 'dark',
    palette: theme.palette,
    setMode: theme.setMode,
    setPrimaryColor: theme.setPrimaryColor,
    // What the store admin set wins; otherwise the colour the buyer picked;
    // otherwise the default purple.
    pcFor: (store) => store?.primary_color || theme.primaryColor || '#7C3AED',
  };
}
