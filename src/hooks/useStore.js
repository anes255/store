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
    localStorage.setItem('currentStore', JSON.stringify(store));
    localStorage.setItem('currentStoreId', store?.id);
    localStorage.setItem('currentStoreSlug', store?.slug);
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

export const useWishlistStore = create((set, get) => ({
  slug: null,
  items: [],

  // Bind the store to a specific store slug. Idempotent — calling repeatedly
  // with the same slug is a no-op so we don't thrash state during re-renders.
  init: (slug) => {
    if (!slug || get().slug === slug) return;
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
    const slug = get().slug;
    if (!slug || !product) return false;
    const items = get().items;
    const exists = items.some(p => p.id === product.id);
    const next = exists ? items.filter(p => p.id !== product.id) : [...items, product];
    localStorage.setItem('wishlist_' + slug, JSON.stringify(next));
    set({ items: next });
    return !exists;
  },

  remove: (productId) => {
    const slug = get().slug;
    if (!slug) return;
    const next = get().items.filter(p => p.id !== productId);
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
