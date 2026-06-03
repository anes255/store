import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  
  setAuth: (user, token, role) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    set({ user, token, role });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('currentStoreId');
    localStorage.removeItem('currentStoreSlug');
    localStorage.removeItem('currentStore');
    localStorage.removeItem('cart');
    localStorage.removeItem('cartStoreSlug');
    set({ user: null, token: null, role: null });
  },
}));

export const useStoreManagement = create((set) => ({
  currentStore: JSON.parse(localStorage.getItem('currentStore') || 'null'),
  stores: [],

  setCurrentStore: (store) => {
    // Strip heavy fields (base64 images, builder JSON, raw config) before
    // persisting. localStorage has a 5–10MB cap and stores with uploaded
    // logos/banners/page-builder content easily exceed it. We keep the full
    // object in memory but only persist the slim version.
    try {
      if (store && typeof store === 'object') {
        const slim = { ...store };
        // Drop base64 dataURIs (images embedded as `data:image/...`); keep URL strings.
        const isHeavy = (v) => typeof v === 'string' && (v.startsWith('data:') || v.length > 4000);
        for (const k of ['logo','logo_url','favicon','favicon_url','cover_image','banner_url','baridimob_qr','offer_bg']) {
          if (isHeavy(slim[k])) delete slim[k];
        }
        // Drop bulky structured fields
        delete slim.page_builder;
        delete slim.landing_blocks;
        // The expanded `config` already duplicates many keys; keep it but trim heavy ones.
        if (slim.config && typeof slim.config === 'object') {
          const cfg = { ...slim.config };
          for (const k of Object.keys(cfg)) { if (isHeavy(cfg[k])) delete cfg[k]; }
          delete cfg.page_builder;
          delete cfg.landing_blocks;
          slim.config = cfg;
        }
        const json = JSON.stringify(slim);
        // Final guard: if even the slim version is huge, persist only id+slug+name.
        if (json.length > 2_000_000) {
          localStorage.setItem('currentStore', JSON.stringify({ id: store.id, slug: store.slug, name: store.name||store.store_name }));
        } else {
          localStorage.setItem('currentStore', json);
        }
      } else {
        localStorage.removeItem('currentStore');
      }
    } catch (e) {
      // Quota or other failure — drop persisted copy so we don't loop, keep in-memory.
      try { localStorage.removeItem('currentStore'); } catch {}
    }
    if (store?.id) localStorage.setItem('currentStoreId', store.id);
    if (store?.slug) localStorage.setItem('currentStoreSlug', store.slug);
    set({ currentStore: store });
  },

  setStores: (stores) => set({ stores }),
}));

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  storeSlug: localStorage.getItem('cartStoreSlug') || null,

  addItem: (product, quantity = 1, variant = null) => {
    const items = get().items;
    const existingIndex = items.findIndex(i => i.product_id === product.id && JSON.stringify(i.variant) === JSON.stringify(variant));
    
    let newItems;
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex].quantity += quantity;
    } else {
      // Parse images safely — backend sometimes returns a JSON string
      let imgs = product.images;
      if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
      if (!Array.isArray(imgs)) imgs = [];
      newItems = [...items, {
        product_id: product.id,
        name: product.name_en || product.name_fr || product.name_ar || product.name,
        price: product.price,
        image: product.thumbnail || imgs[0] || null,
        quantity,
        variant,
        coupon_code: product.coupon_code || '',
        coupon_discount_percent: product.coupon_discount_percent || 0,
        coupon_active: !!product.coupon_active,
      }];
    }
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  removeItem: (index) => {
    const newItems = get().items.filter((_, i) => i !== index);
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  updateQuantity: (index, quantity) => {
    const newItems = [...get().items];
    newItems[index].quantity = Math.max(1, quantity);
    localStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },

  setStoreSlug: (slug) => {
    localStorage.setItem('cartStoreSlug', slug);
    set({ storeSlug: slug });
  },

  getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

// ============ WISHLIST STORE ============
// Per-store wishlist persisted to localStorage under `wishlist_${slug}`.
// Stores full product objects so the Favorites page can render with no extra
// API calls. Synchronises across tabs/components via the `storage` event.
const readWishlist = (slug) => {
  if (!slug) return [];
  try { return JSON.parse(localStorage.getItem('wishlist_' + slug) || '[]'); } catch { return []; }
};
// Remember the last bound slug so wishlist actions never silently no-op if a
// component calls toggle/remove before its init effect has run.
let _lastWishlistSlug = null;
try { _lastWishlistSlug = localStorage.getItem('wishlist_active_slug') || null; } catch {}

export const useWishlistStore = create((set, get) => ({
  slug: null,
  items: [],

  // Bind the store to a specific store slug. Idempotent — calling repeatedly
  // with the same slug is a no-op so we don't thrash state during re-renders.
  init: (slug) => {
    if (!slug) return;
    _lastWishlistSlug = slug;
    try { localStorage.setItem('wishlist_active_slug', slug); } catch {}
    if (get().slug === slug) return;
    set({ slug, items: readWishlist(slug) });
  },

  // Replace the in-memory list (used by storage-event syncing)
  hydrate: (slug) => {
    if (!slug) return;
    set({ items: readWishlist(slug) });
  },

  has: (productId) => get().items.some(p => p.id === productId),

  // Toggle a product. Returns true if it was added, false if removed,
  // so callers can show the appropriate toast.
  toggle: (product) => {
    let slug = get().slug || _lastWishlistSlug;
    if (slug && get().slug !== slug) set({ slug, items: readWishlist(slug) });
    if (!slug || !product) return false;
    const items = get().items;
    const key = product._wishlistKey || product.id;
    const exists = items.some(p => (p._wishlistKey || p.id) === key);
    const next = exists ? items.filter(p => (p._wishlistKey || p.id) !== key) : [...items, product];
    localStorage.setItem('wishlist_' + slug, JSON.stringify(next));
    set({ items: next });
    return !exists;
  },

  remove: (key) => {
    const slug = get().slug;
    if (!slug) return;
    const next = get().items.filter(p => (p._wishlistKey || p.id) !== key);
    localStorage.setItem('wishlist_' + slug, JSON.stringify(next));
    set({ items: next });
  },

  clear: () => {
    const slug = get().slug;
    if (!slug) return;
    localStorage.removeItem('wishlist_' + slug);
    set({ items: [] });
  },

  setItems: (items) => {
    const slug = get().slug;
    if (!slug) return;
    localStorage.setItem('wishlist_' + slug, JSON.stringify(items));
    set({ items });
  },

  count: () => get().items.length,
}));

// Cross-tab sync — when localStorage changes in another tab, mirror it.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith('wishlist_')) return;
    const slug = e.key.slice('wishlist_'.length);
    const state = useWishlistStore.getState();
    if (state.slug === slug) state.hydrate(slug);
  });
}

export const useLangStore = create((set) => ({
  lang: localStorage.getItem('lang') || 'en',
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    // Only translate text — never switch layout direction
    document.documentElement.lang = lang; document.documentElement.dir = 'ltr';
    document.documentElement.dir = 'ltr'; // Always LTR
    set({ lang });
  },
}));

// ============ THEME STORE ============
// Persists admin dashboard theme preferences: mode (light/dark) + primary color.
// CSS custom properties on :root are updated whenever theme changes so Tailwind
// and globals.css pick up the new values immediately.

const COLOR_PRESETS = {
  '#7C3AED': { 50:'#f3f0ff',100:'#e9e3ff',200:'#d5cbff',300:'#b5a3ff',400:'#9171ff',500:'#7C3AED',600:'#6d28d9',700:'#5b21b6' },
  '#3B82F6': { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3B82F6',600:'#2563eb',700:'#1d4ed8' },
  '#10B981': { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10B981',600:'#059669',700:'#047857' },
  '#F59E0B': { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#F59E0B',600:'#d97706',700:'#b45309' },
  '#EF4444': { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#EF4444',600:'#dc2626',700:'#b91c1c' },
  '#EC4899': { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#EC4899',600:'#db2777',700:'#be185d' },
  '#06B6D4': { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06B6D4',600:'#0891b2',700:'#0e7490' },
  '#8B5CF6': { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8B5CF6',600:'#7c3aed',700:'#6d28d9' },
  '#F97316': { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#F97316',600:'#ea580c',700:'#c2410c' },
  '#14B8A6': { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14B8A6',600:'#0d9488',700:'#0f766e' },
};

// Generate palette shades from an arbitrary hex color via HSL shifting
function generatePalette(hex) {
  if (COLOR_PRESETS[hex]) return COLOR_PRESETS[hex];
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
  let h = 0, s = 0, l = (max+min)/2;
  if (d !== 0) { s = l>0.5 ? d/(2-max-min) : d/(max-min); h = max===r ? ((g-b)/d+(g<b?6:0))*60 : max===g ? ((b-r)/d+2)*60 : ((r-g)/d+4)*60; }
  const hsl = (h2,s2,l2) => { s2/=100; l2/=100; const a=s2*Math.min(l2,1-l2); const f=n=>{const k=(n+h2/30)%12;return l2-a*Math.max(Math.min(k-3,9-k,1),-1);}; return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join(''); };
  return { 50:hsl(h,Math.min(100,s*100+10),97), 100:hsl(h,Math.min(100,s*100+5),93), 200:hsl(h,s*100,86), 300:hsl(h,s*100,76), 400:hsl(h,s*100,64), 500:hex, 600:hsl(h,s*100,l*100-10), 700:hsl(h,s*100,l*100-20) };
}

function applyThemeToDOM(mode, color, context) {
  const root = document.documentElement;
  const palette = generatePalette(color);

  // Set the palette as CSS custom properties
  Object.entries(palette).forEach(([shade, val]) => {
    root.style.setProperty(`--${context}-${shade}`, val);
  });
  root.style.setProperty(`--${context}`, color);

  // Apply dark mode class per-context
  if (context === 'admin') {
    const adminMode = localStorage.getItem('admin_theme_mode') || 'light';
    if (adminMode === 'dark') root.classList.add('admin-dark');
    else root.classList.remove('admin-dark');
  }
  if (context === 'platform') {
    const platformMode = localStorage.getItem('platform_theme_mode') || 'light';
    if (platformMode === 'dark') root.classList.add('platform-dark');
    else root.classList.remove('platform-dark');
  }
  if (context === 'buyer') {
    const buyerMode = localStorage.getItem('buyer_theme_mode') || 'dark';
    if (buyerMode === 'dark') root.classList.add('buyer-dark');
    else root.classList.remove('buyer-dark');
  }
}

// Store admin theme
export const useAdminTheme = create((set, get) => ({
  mode: localStorage.getItem('admin_theme_mode') || 'light',
  primaryColor: localStorage.getItem('admin_theme_color') || '#7C3AED',
  palette: generatePalette(localStorage.getItem('admin_theme_color') || '#7C3AED'),

  init: () => {
    const state = get();
    applyThemeToDOM(state.mode, state.primaryColor, 'admin');
  },

  setMode: (mode) => {
    localStorage.setItem('admin_theme_mode', mode);
    const state = get();
    applyThemeToDOM(mode, state.primaryColor, 'admin');
    set({ mode });
  },

  setPrimaryColor: (color) => {
    localStorage.setItem('admin_theme_color', color);
    const palette = generatePalette(color);
    const state = get();
    applyThemeToDOM(state.mode, color, 'admin');
    set({ primaryColor: color, palette });
  },
}));

// Platform super admin theme
export const usePlatformTheme = create((set, get) => ({
  mode: localStorage.getItem('platform_theme_mode') || 'light',
  primaryColor: localStorage.getItem('platform_theme_color') || '#EF4444',
  palette: generatePalette(localStorage.getItem('platform_theme_color') || '#EF4444'),

  init: () => {
    const state = get();
    applyThemeToDOM(state.mode, state.primaryColor, 'platform');
  },

  setMode: (mode) => {
    localStorage.setItem('platform_theme_mode', mode);
    const state = get();
    applyThemeToDOM(mode, state.primaryColor, 'platform');
    set({ mode });
  },

  setPrimaryColor: (color) => {
    localStorage.setItem('platform_theme_color', color);
    const palette = generatePalette(color);
    const state = get();
    applyThemeToDOM(state.mode, color, 'platform');
    set({ primaryColor: color, palette });
  },
}));

// Buyer (storefront) theme — picks light/dark mode for shoppers and an
// override primary color. Independent from the admin/platform themes so
// merchants and customers don't share preferences.
export const useBuyerTheme = create((set, get) => ({
  mode: localStorage.getItem('buyer_theme_mode') || 'dark',
  primaryColor: localStorage.getItem('buyer_theme_color') || '#7C3AED',
  palette: generatePalette(localStorage.getItem('buyer_theme_color') || '#7C3AED'),

  init: () => {
    const state = get();
    applyThemeToDOM(state.mode, state.primaryColor, 'buyer');
  },

  setMode: (mode) => {
    localStorage.setItem('buyer_theme_mode', mode);
    const state = get();
    applyThemeToDOM(mode, state.primaryColor, 'buyer');
    set({ mode });
  },

  setPrimaryColor: (color) => {
    localStorage.setItem('buyer_theme_color', color);
    const palette = generatePalette(color);
    const state = get();
    applyThemeToDOM(state.mode, color, 'buyer');
    set({ primaryColor: color, palette });
  },
}));

export { COLOR_PRESETS, generatePalette };
