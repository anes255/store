import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://test-dz47.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const storeSlug = localStorage.getItem('currentStoreSlug');
  if (storeSlug) config.headers['x-store-slug'] = storeSlug;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// ═══ WAKE-UP PING ═══
// Render free-tier cold-starts take ~30s. Fire an instant health-check on
// page load so the backend wakes while the user is still reading the page.
// Subsequent API calls then hit a warm server.
let _backendWarm = false;
const wakeBackend = () => {
  if (_backendWarm) return;
  fetch(`${API_URL.replace(/\/api$/, '')}/api/health`, { method: 'GET', mode: 'cors' })
    .then(() => { _backendWarm = true; })
    .catch(() => {});
};
wakeBackend();
// Re-ping every 10 minutes to keep it alive from the frontend
setInterval(wakeBackend, 10 * 60 * 1000);

// Clearing one platform key is never enough: approving a payment changes the
// owners list, the subscriptions list AND the dashboard counters. Drop the
// whole `pf:` namespace after any platform mutation.
const invalidatePlatform = () => invalidateCache('pf:');

// Platform Admin
export const platformApi = {
  login: (data) => api.post('/platform/login', data),
  getSettings: () => cachedGet('pf:settings', () => api.get('/platform/settings')),
  updateSettings: (data) => api.put('/platform/settings', data).then(r => { invalidateCache('pf:settings'); return r; }),
  getDashboard: () => cachedGet('pf:dash', () => api.get('/platform/dashboard')),
  getStoreOwners: (params) => cachedGet(`pf:owners:${JSON.stringify(params||{})}`, () => api.get('/platform/store-owners', { params })),
  toggleOwner: (id) => api.patch(`/platform/store-owners/${id}/toggle`).then(r => { invalidatePlatform(); return r; }),
  deleteOwner: (id) => api.delete(`/platform/store-owners/${id}`).then(r => { invalidatePlatform(); return r; }),
  getStores: () => cachedGet('pf:stores', () => api.get('/platform/stores')),
  toggleStore: (id) => api.patch(`/platform/stores/${id}/toggle`).then(r => { invalidatePlatform(); return r; }),
  deleteStore: (id) => api.delete(`/platform/stores/${id}`).then(r => { invalidatePlatform(); return r; }),
  getOrders: (params) => cachedGet(`pf:orders:${JSON.stringify(params||{})}`, () => api.get('/platform/orders', { params })),
  getProducts: () => cachedGet('pf:products', () => api.get('/platform/products')),
  getSystem: () => api.get('/platform/system'),
  // Subscriptions
  getSubscriptions: (params) => cachedGet(`pf:subs:${JSON.stringify(params||{})}`, () => api.get('/platform/subscriptions', { params })),
  approvePayment: (pid) => api.patch(`/platform/subscriptions/${pid}/approve`).then(r => { invalidatePlatform(); return r; }),
  rejectPayment: (pid, data) => api.patch(`/platform/subscriptions/${pid}/reject`, data).then(r => { invalidatePlatform(); return r; }),
  setOwnerSubscription: (ownerId, data) => api.patch(`/platform/store-owners/${ownerId}/subscription`, data).then(r => { invalidatePlatform(); return r; }),
  getExpiringSubscriptions: () => api.get('/platform/expiring-subscriptions'),
  extendSubscription: (ownerId, data) => api.post(`/platform/store-owners/${ownerId}/extend-subscription`, data).then(r => { invalidatePlatform(); return r; }),
  // Admin notifications
  getNotifications: () => api.get('/platform/notifications'),
  markNotificationRead: (id) => api.patch(`/platform/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/platform/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/platform/notifications/${id}`),
  clearNotifications: () => api.delete('/platform/notifications'),
  updateBillingConfig: (data) => api.put('/platform/billing-config', data).then(r => { invalidateCache('pf:'); return r; }),
  // Admin profile & co-admins
  getAdminProfile: () => api.get('/platform/profile'),
  updateAdminProfile: (data) => api.put('/platform/profile', data),
  changeAdminPassword: (data) => api.put('/platform/profile/password', data),
  getAdmins: () => api.get('/platform/admins'),
  addAdmin: (data) => api.post('/platform/admins', data),
  removeAdmin: (id) => api.delete(`/platform/admins/${id}`),
  toggleAdmin: (id) => api.patch(`/platform/admins/${id}/toggle`),
  // Subscription plans (super-admin CRUD)
  getPlans: () => cachedGet('pf:plans', () => api.get('/platform/plans')),
  createPlan: (data) => api.post('/platform/plans', data).then(r => { invalidateCache('pf:plans'); return r; }),
  updatePlan: (id, data) => api.put(`/platform/plans/${id}`, data).then(r => { invalidateCache('pf:plans'); return r; }),
  deletePlan: (id) => api.delete(`/platform/plans/${id}`).then(r => { invalidateCache('pf:plans'); return r; }),
  // Staff role templates (super-admin CRUD)
  getRoleTemplates: () => api.get('/platform/role-templates'),
  createRoleTemplate: (data) => api.post('/platform/role-templates', data),
  updateRoleTemplate: (id, data) => api.put(`/platform/role-templates/${id}`, data),
  deleteRoleTemplate: (id) => api.delete(`/platform/role-templates/${id}`),
  // Platform WhatsApp (registration OTP sender)
  waStart: () => api.post('/platform/whatsapp/start'),
  waStatus: () => api.get('/platform/whatsapp/status'),
  waDisconnect: () => api.post('/platform/whatsapp/disconnect'),
  waTestSend: (data) => api.post('/platform/whatsapp/test-send', data),
};

// Store-owner access to the public role templates list
export const publicRoleTemplatesApi = {
  list: () => api.get('/platform/role-templates/public'),
};

// Public plans (no auth) — used by landing + billing pages
export const publicPlansApi = {
  list: () => api.get('/platform/plans/public'),
};

// Store Owner
export const ownerApi = {
  register: (data) => api.post('/owner/register', data),
  requestOtp: (data) => api.post('/owner/register/request-otp', data),
  verifyOtp: (data) => api.post('/owner/register/verify-otp', data),
  login: (data) => api.post('/owner/login', data),
  getProfile: () => api.get('/owner/profile'),
  updateProfile: (data) => api.put('/owner/profile', data),
  updateUsername: (data) => api.put('/owner/username', data),
  updateEmail: (data) => api.put('/owner/email', data),
  updatePassword: (data) => api.put('/owner/password', data),
  toggleTwoFa: (data) => api.put('/owner/two-fa', data),
  update2FA: (data) => api.put('/owner/two-fa', data),
  deleteAccount: (data) => api.delete('/owner/account', { data }),
  getStores: () => cachedGet('owner:stores', () => api.get('/owner/stores')),
  createStore: (data) => api.post('/owner/stores', data),
  getDashboard: (storeId) => cachedGet(`dash:${storeId}`, () => api.get(`/owner/stores/${storeId}/dashboard`)),
  updateStore: (storeId, data) => api.put(`/owner/stores/${storeId}`, data).then(r => { invalidateCache('store'); invalidateCache('dash'); invalidateCache('owner:stores'); return r; }),
  getStaff: (storeId) => api.get(`/owner/stores/${storeId}/staff`),
  addStaff: (storeId, data) => api.post(`/owner/stores/${storeId}/staff`, data),
  updateStaff: (storeId, staffId, data) => api.patch(`/owner/stores/${storeId}/staff/${staffId}`, data),
  deleteStaff: (storeId, staffId) => api.delete(`/owner/stores/${storeId}/staff/${staffId}`),
  // Store-scoped role templates (owner-defined roles affecting only this store)
  getRoleTemplates: (storeId) => api.get(`/owner/stores/${storeId}/role-templates`),
  createRoleTemplate: (storeId, data) => api.post(`/owner/stores/${storeId}/role-templates`, data),
  updateRoleTemplate: (storeId, tid, data) => api.put(`/owner/stores/${storeId}/role-templates/${tid}`, data),
  deleteRoleTemplate: (storeId, tid) => api.delete(`/owner/stores/${storeId}/role-templates/${tid}`),
  getDomains: (storeId) => api.get(`/owner/stores/${storeId}/domains`),
  requestDomain: (storeId, data) => api.post(`/owner/stores/${storeId}/domains`, data),
  verifyDomain: (storeId, domainId) => api.post(`/owner/stores/${storeId}/domains/${domainId}/verify`),
  deleteDomain: (storeId, domainId) => api.delete(`/owner/stores/${storeId}/domains/${domainId}`),
  // Notifications
  getNotifications: (storeId) => api.get(`/owner/stores/${storeId}/notifications`),
  markNotifRead: (storeId, nid) => api.patch(`/owner/stores/${storeId}/notifications/${nid}/read`),
  markAllRead: (storeId) => api.patch(`/owner/stores/${storeId}/notifications/read-all`),
  clearRead: (storeId) => api.delete(`/owner/stores/${storeId}/notifications`),
  deleteNotification: (storeId, nid) => api.delete(`/owner/stores/${storeId}/notifications/${nid}`),
  // Subscription
  getSubscription: () => api.get('/owner/subscription'),
  paySubscription: (data) => api.post('/owner/subscription/pay', data),
  getMyFeatures: () => api.get('/owner/me/features'),
  // Push notifications
  getVapidKey: () => api.get('/owner/push/vapid-key'),
  subscribePush: (data) => api.post('/owner/push/subscribe', data),
};

// Products & Categories
export const productApi = {
  getAll: (storeId, params) => cachedGet(`mprods:${storeId}:${JSON.stringify(params||{})}`, () => api.get(`/manage/stores/${storeId}/products`, { params })),
  create: (storeId, data) => api.post(`/manage/stores/${storeId}/products`, data).then(r => { invalidateCache('mprods'); invalidateCache('prods'); return r; }),
  update: (storeId, productId, data) => api.put(`/manage/stores/${storeId}/products/${productId}`, data).then(r => { invalidateCache('mprods'); invalidateCache('prods'); invalidateCache('prod'); return r; }),
  delete: (storeId, productId) => api.delete(`/manage/stores/${storeId}/products/${productId}`).then(r => { invalidateCache('mprods'); invalidateCache('prods'); return r; }),
  getCategories: (storeId) => api.get(`/manage/stores/${storeId}/categories`),
  createCategory: (storeId, data) => api.post(`/manage/stores/${storeId}/categories`, data),
  getCoupons: (storeId) => api.get(`/manage/stores/${storeId}/coupons`),
  createCoupon: (storeId, data) => api.post(`/manage/stores/${storeId}/coupons`, data),
};

// Orders
export const orderApi = {
  getAll: (storeId, params) => cachedGet(`mords:${storeId}:${JSON.stringify(params||{})}`, () => api.get(`/manage/stores/${storeId}/orders`, { params })),
  getOne: (storeId, orderId) => cachedGet(`mord:${storeId}:${orderId}`, () => api.get(`/manage/stores/${storeId}/orders/${orderId}`)),
  updateStatus: (storeId, orderId, data) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/status`, data).then(r => { invalidateCache('mord'); invalidateCache('dash'); return r; }),
  dispatch: (storeId, orderId, data) => api.post(`/manage/stores/${storeId}/orders/${orderId}/dispatch`, data).then(r => { invalidateCache('mord'); invalidateCache('dash'); return r; }),
  updatePayment: (storeId, orderId, data) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/payment`, data).then(r => { invalidateCache('mord'); return r; }),
  archive: (storeId, orderId, archived=true) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/archive`, { archived }).then(r => { invalidateCache('mord'); return r; }),
  bulkArchive: (storeId, ids, archived=true) => api.patch(`/manage/stores/${storeId}/orders/bulk-archive`, { ids, archived }).then(r => { invalidateCache('mord'); return r; }),
  delete: (storeId, orderId) => api.delete(`/manage/stores/${storeId}/orders/${orderId}`).then(r => { invalidateCache('mord'); return r; }),
  bulkDelete: (storeId, ids) => api.post(`/manage/stores/${storeId}/orders/bulk-delete`, { ids }).then(r => { invalidateCache('mord'); return r; }),
  restore: (storeId, orderId) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/restore`).then(r => { invalidateCache('mord'); return r; }),
  purge: (storeId, orderId) => api.delete(`/manage/stores/${storeId}/orders/${orderId}/purge`).then(r => { invalidateCache('mord'); return r; }),
  getAbandoned: (storeId) => api.get(`/manage/stores/${storeId}/abandoned-carts`),
  getCustomers: (storeId, params) => api.get(`/manage/stores/${storeId}/customers`, { params }),
  getShippingWilayas: (storeId) => api.get(`/manage/stores/${storeId}/shipping-wilayas`),
  addShippingWilaya: (storeId, data) => api.post(`/manage/stores/${storeId}/shipping-wilayas`, data),
  // Blacklist
  getBlacklist: (storeId) => api.get(`/manage/stores/${storeId}/blacklist`),
  addBlacklist: (storeId, data) => api.post(`/manage/stores/${storeId}/blacklist`, data),
  removeBlacklist: (storeId, id) => api.delete(`/manage/stores/${storeId}/blacklist/${id}`),
  // Expenses
  getExpenses: (storeId) => api.get(`/manage/stores/${storeId}/expenses`),
  addExpense: (storeId, data) => api.post(`/manage/stores/${storeId}/expenses`, data),
  updateExpense: (storeId, id, data) => api.put(`/manage/stores/${storeId}/expenses/${id}`, data),
  deleteExpense: (storeId, id) => api.delete(`/manage/stores/${storeId}/expenses/${id}`),
  // Store Pages (FAQs, About)
  getPages: (storeId) => api.get(`/manage/stores/${storeId}/pages`),
  addPage: (storeId, data) => api.post(`/manage/stores/${storeId}/pages`, data),
  updatePage: (storeId, id, data) => api.put(`/manage/stores/${storeId}/pages/${id}`, data),
  deletePage: (storeId, id) => api.delete(`/manage/stores/${storeId}/pages/${id}`),
  saveFaqs: (storeId, faqs) => api.put(`/manage/stores/${storeId}/faqs`, { faqs }),
  // Stock
  updateStock: (storeId, productId, data) => api.patch(`/manage/stores/${storeId}/products/${productId}/stock`, data),
  // Email
  emailDebug: (storeId, orderId) => api.get(`/manage/stores/${storeId}/orders/${orderId}/email-debug`),
  sendOrderEmail: (storeId, orderId, data) => api.post(`/manage/stores/${storeId}/orders/${orderId}/send-email`, data),
};

// Shipping partner sync
export const shippingApi = {
  toggleAutoSync: (storeId, companyId, data) => api.patch(`/manage/stores/${storeId}/delivery-companies/${companyId}/auto-sync`, data),
  fullSync: (storeId, companyId) => api.post(`/manage/stores/${storeId}/delivery-companies/${companyId}/full-sync`),
  refreshTracking: (storeId, companyId) => api.post(`/manage/stores/${storeId}/delivery-companies/${companyId}/refresh-tracking`),
  sync: (storeId, companyId) => api.post(`/manage/stores/${storeId}/delivery-companies/${companyId}/sync`),
};

// Public storefront
// ═══ IN-MEMORY CACHE ═══
// Buyer-facing GET requests are cached in memory so navigating between
// Storefront ↔ ProductDetail is instant. Each entry lives for 60 seconds,
// then a background re-fetch refreshes it (stale-while-revalidate pattern).
const _cache = new Map();
const CACHE_TTL = 60_000; // 60s
const SS_PREFIX = 'apicache:';

// Persist the payload to sessionStorage so a full reload (or returning to the
// tab) can paint instantly from the last response while it revalidates.
function ssLoad(key) {
  try { const raw = sessionStorage.getItem(SS_PREFIX + key); if (raw) { const o = JSON.parse(raw); return { data: { data: o.d }, ts: o.t }; } } catch {}
  return null;
}
function ssSave(key, response, ts) {
  try { sessionStorage.setItem(SS_PREFIX + key, JSON.stringify({ d: response.data, t: ts })); } catch {}
}

function cachedGet(key, fetcher) {
  const now = Date.now();
  const store = (r) => { _cache.set(key, { data: r, ts: Date.now() }); ssSave(key, r, Date.now()); };
  let entry = _cache.get(key);
  if (!entry) { entry = ssLoad(key); if (entry) _cache.set(key, entry); } // hydrate memory from sessionStorage
  if (entry) {
    // Serve cached data immediately; revalidate in the background when stale.
    if (now - entry.ts >= CACHE_TTL) fetcher().then(store).catch(() => {});
    return Promise.resolve(entry.data);
  }
  // No cache yet: run the real fetch and propagate any error to the caller.
  const p = fetcher();
  p.then(store).catch(() => {});
  return p;
}
// Invalidate cache entries matching a prefix (call after mutations)
export function invalidateCache(prefix) {
  const clearSS = (pre) => { try { Object.keys(sessionStorage).forEach(k => { if (k.startsWith(SS_PREFIX + (pre || ''))) sessionStorage.removeItem(k); }); } catch {} };
  if (!prefix) { _cache.clear(); clearSS(''); return; }
  for (const k of _cache.keys()) { if (k.startsWith(prefix)) _cache.delete(k); }
  clearSS(prefix);
}

export const storeApi = {
  getLanding: (slug, lpSlug) => api.get(`/store/${slug}/landing/${lpSlug}`),
  getStore: (slug) => cachedGet(`store:${slug}`, () => api.get(`/store/${slug}`)),
  getProducts: (slug, params) => {
    const k = `prods:${slug}:${JSON.stringify(params||{})}`;
    return cachedGet(k, () => api.get(`/store/${slug}/products`, { params }));
  },
  getProduct: (slug, productSlug) => cachedGet(`prod:${slug}:${productSlug}`, () => api.get(`/store/${slug}/products/${productSlug}`)),
  getCategories: (slug) => cachedGet(`cats:${slug}`, () => api.get(`/store/${slug}/categories`)),
  registerCustomer: (slug, data) => api.post(`/store/${slug}/customers/register`, data),
  loginCustomer: (slug, data) => api.post(`/store/${slug}/customers/login`, data),
  getCustomerProfile: (slug) => api.get(`/store/${slug}/customers/profile`),
  updateCustomerProfile: (slug, data) => api.put(`/store/${slug}/customers/profile`, data),
  deleteCustomerAccount: (slug) => api.delete(`/store/${slug}/customers/profile`),
  placeOrder: (slug, data) => api.post(`/store/${slug}/orders`, data),
  cancelOrder: (slug, orderId) => api.post(`/store/${slug}/orders/${orderId}/cancel`),
  deleteOrder: (slug, orderId) => api.delete(`/store/${slug}/orders/${orderId}`),
  validateCoupon: (slug, data) => api.post(`/store/${slug}/validate-coupon`, data),
  getPages: (slug) => api.get(`/store/${slug}/pages`),
  // Reviews
  getProductReviews: (slug, productSlug) => api.get(`/store/${slug}/products/${productSlug}/reviews`),
  submitReview: (slug, productSlug, data) => api.post(`/store/${slug}/products/${productSlug}/reviews`, data),
  // Public tracking
  trackOrders: (slug, phone) => api.get(`/store/${slug}/track?phone=${phone}`),
  trackByOrderId: (slug, orderId) => api.get(`/store/${slug}/track?order_id=${encodeURIComponent(orderId)}`),
  getStatusTemplates: (storeId) => api.get(`/public/stores/${storeId}/status-templates`),
  // Cart sync
  saveCart: (slug, data) => api.post(`/store/${slug}/save-cart`, data),
  restoreCart: (slug, phone) => api.get(`/store/${slug}/restore-cart?phone=${encodeURIComponent(phone)}`),
  // Shipping wilayas (public, for checkout)
  getShippingWilayas: (slug) => cachedGet(`sw:${slug}`, () => api.get(`/store/${slug}/shipping-wilayas`)),
  getDeliveryCompanies: (slug) => cachedGet(`dc:${slug}`, () => api.get(`/store/${slug}/delivery-companies`)),
  // Domain lookup
  lookupDomain: (domain) => api.get(`/store/by-domain/${domain}`),
};

// AI
export const aiApi = {
  chat: (slug, data) => api.post(`/ai/${slug}/chatbot`, data),
  detectFake: (data) => api.post('/ai/detect-fake', data),
  cartRecoverySuggest: (data) => api.post('/ai/cart-recovery/suggest', data),
  cartRecoverySend: (data) => api.post('/ai/cart-recovery/send', data),
  notifyOrder: (data) => api.post('/ai/notify/order', data),
  messagingStatus: () => api.get('/ai/messaging/status'),
  testChat: (data) => api.post('/ai/test-chat', data),
  generateDescription: (data) => api.post('/ai/generate-description', data),
  generateRecovery: (data) => api.post('/ai/generate-recovery', data),
  testSend: (data) => api.post('/ai/test-send', data),
  whatsappTest: (data) => api.post('/ai/whatsapp-test', data),
  whatsappDebug: () => api.get('/ai/whatsapp-debug'),
  // Reviews
  moderateReview: (data) => api.post('/ai/moderate-review', data),
  generateLanding: (data) => api.post('/ai/generate-landing', data),
  // Full-page GPT generation + image generation can take 60-90s — override the default 15s timeout.
  generateLandingHtml: (data) => api.post('/ai/generate-landing-html', data, { timeout: 180000 }),
  // GPT image generation (gpt-image-1 / DALL·E 3) — replaces any 3rd-party image AI.
  generateImage: (data) => api.post('/ai/generate-image', data, { timeout: 120000 }),
  // Translate landing-page strings to a target language (AR/FR/EN).
  translate: (data) => api.post('/ai/translate', data, { timeout: 60000 }),
  // Multi-language description
  generateDescriptionMulti: (data) => api.post('/ai/generate-description-multi', data),
  // WhatsApp QR (Baileys)
  waQrStart: (storeId) => api.post('/ai/whatsapp-qr/start', { storeId }),
  waQrStatus: (storeId) => api.get(`/ai/whatsapp-qr/status/${storeId}`),
  waQrDisconnect: (storeId) => api.post('/ai/whatsapp-qr/disconnect', { storeId }),
  waQrSend: (data) => api.post('/ai/whatsapp-qr/send', data),
  waSendTest: (storeId, data) => api.post('/ai/whatsapp-qr/send', { storeId, phone:data.phone, message:data.message }),
  waQrLog: (storeId) => api.get(`/ai/whatsapp-qr/log/${storeId}`),
  waQrDebug: () => api.get('/ai/whatsapp-qr/debug'),
};

// Payments
export const paymentApi = {
  chargilyCheckout: (data) => api.post('/payments/chargily/checkout', data),
  chargilyStatus: () => api.get('/payments/chargily/status'),
  uploadReceipt: (data) => api.post('/payments/receipt/upload', data),
  reviewReceipt: (receiptId, data) => api.patch(`/payments/receipt/${receiptId}/review`, data),
  getReceipts: (storeId) => api.get(`/payments/receipts/${storeId}`),
};

// Platform public info
export const getPlatformInfo = () => api.get('/platform-info');

export default api;
