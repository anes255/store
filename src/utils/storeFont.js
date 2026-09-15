// Loads the store's chosen heading font on ANY buyer page, not just the
// storefront. Only Storefront.jsx used to inject the Google Fonts stylesheet,
// so Track Order, Favorites, Login, Profile and Product pages named the font
// but never downloaded it and silently fell back to a system sans-serif.
import { useEffect } from 'react';

const loaded = new Set();

export function storeFontFamily(store) {
  return store?.header_font || undefined;
}

export function useStoreFont(store) {
  const family = store?.header_font;
  useEffect(() => {
    if (!family) return;
    const name = String(family).split(',')[0].replace(/['"]/g, '').trim();
    if (!name || loaded.has(name)) return;
    // System stacks have nothing to download.
    if (/^(arial|helvetica|georgia|times|verdana|tahoma|system-ui|sans-serif|serif|monospace)$/i.test(name)) return;
    loaded.add(name);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, [family]);
  return family || undefined;
}
