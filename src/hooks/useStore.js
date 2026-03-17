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
      newItems = [...items, {
        product_id: product.id,
        name: product.name_en || product.name_fr || product.name_ar,
        price: product.price,
        image: product.thumbnail || (product.images && product.images[0]),
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

export const useLangStore = create((set) => ({
  lang: localStorage.getItem('lang') || 'en',
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    // Only translate text — never switch layout direction
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr'; // Always LTR
    set({ lang });
  },
}));
