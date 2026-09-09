// Shared colour helpers for the buyer-facing pages, so Favorites, Track Order
// and Profile all derive their canvas from the store's own colour the same way.

// Darken a hex colour toward black. Returns an OPAQUE colour on purpose: an
// alpha stop inside a page-level gradient composites against the browser's
// white default, which washed the canvas out and made white text unreadable.
export function darkenHex(hex, amount = 0.22) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return '#0a0a0a';
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * amount);
  const g = Math.round(((n >> 8) & 255) * amount);
  const b = Math.round((n & 255) * amount);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

// The dark canvas a buyer page should sit on: the store's explicit dark-mode
// background when set, otherwise a gradient tinted with the store's colour.
export function storeCanvas(store, primaryColor) {
  const explicit = store?.config?.store_dark_bg_color;
  if (explicit) return explicit;
  const tint = darkenHex(primaryColor || '#7C3AED', 0.28);
  return `linear-gradient(135deg, #050505 0%, ${tint} 45%, #000000 100%)`;
}
