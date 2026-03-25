import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://test-4ok3.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        localStorage.removeItem('token');
        if (path.startsWith('/admin')) window.location.href = '/admin/login';
        else if (path.startsWith('/dashboard')) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Platform Admin
export const platformApi = {
  login: (data) => api.post('/platform/login', data),
  getSettings: () => api.get('/platform/settings'),
  updateSettings: (data) => api.put('/platform/settings', data),
  getDashboard: () => api.get('/platform/dashboard'),
  getStoreOwners: (params) => api.get('/platform/store-owners', { params }),
  toggleOwner: (id) => api.patch(`/platform/store-owners/${id}/toggle`),
  deleteOwner: (id) => api.delete(`/platform/store-owners/${id}`),
  getStores: () => api.get('/platform/stores'),
  toggleStore: (id) => api.patch(`/platform/stores/${id}/toggle`),
  deleteStore: (id) => api.delete(`/platform/stores/${id}`),
  getOrders: (params) => api.get('/platform/orders', { params }),
  getProducts: () => api.get('/platform/products'),
  getSystem: () => api.get('/platform/system'),
  // Subscriptions
  getSubscriptions: (params) => api.get('/platform/subscriptions', { params }),
  approvePayment: (pid) => api.patch(`/platform/subscriptions/${pid}/approve`),
  rejectPayment: (pid, data) => api.patch(`/platform/subscriptions/${pid}/reject`, data),
  setOwnerSubscription: (ownerId, data) => api.patch(`/platform/store-owners/${ownerId}/subscription`, data),
  updateBillingConfig: (data) => api.put('/platform/billing-config', data),
};

// Store Owner
export const ownerApi = {
  register: (data) => api.post('/owner/register', data),
  login: (data) => api.post('/owner/login', data),
  getProfile: () => api.get('/owner/profile'),
  updateProfile: (data) => api.put('/owner/profile', data),
  updateUsername: (data) => api.put('/owner/username', data),
  updateEmail: (data) => api.put('/owner/email', data),
  updatePassword: (data) => api.put('/owner/password', data),
  toggleTwoFa: (data) => api.put('/owner/two-fa', data),
  deleteAccount: (data) => api.delete('/owner/account', { data }),
  getStores: () => api.get('/owner/stores'),
  createStore: (data) => api.post('/owner/stores', data),
  getDashboard: (storeId) => api.get(`/owner/stores/${storeId}/dashboard`),
  updateStore: (storeId, data) => api.put(`/owner/stores/${storeId}`, data),
  getStaff: (storeId) => api.get(`/owner/stores/${storeId}/staff`),
  addStaff: (storeId, data) => api.post(`/owner/stores/${storeId}/staff`, data),
  getDomains: (storeId) => api.get(`/owner/stores/${storeId}/domains`),
  requestDomain: (storeId, data) => api.post(`/owner/stores/${storeId}/domains`, data),
  // Notifications
  getNotifications: (storeId) => api.get(`/owner/stores/${storeId}/notifications`),
  markNotifRead: (storeId, nid) => api.patch(`/owner/stores/${storeId}/notifications/${nid}/read`),
  markAllRead: (storeId) => api.patch(`/owner/stores/${storeId}/notifications/read-all`),
  clearRead: (storeId) => api.delete(`/owner/stores/${storeId}/notifications`),
  // Subscription
  getSubscription: () => api.get('/owner/subscription'),
  paySubscription: (data) => api.post('/owner/subscription/pay', data),
};

// Products & Categories
export const productApi = {
  getAll: (storeId, params) => api.get(`/manage/stores/${storeId}/products`, { params }),
  create: (storeId, data) => api.post(`/manage/stores/${storeId}/products`, data),
  update: (storeId, productId, data) => api.put(`/manage/stores/${storeId}/products/${productId}`, data),
  delete: (storeId, productId) => api.delete(`/manage/stores/${storeId}/products/${productId}`),
  getCategories: (storeId) => api.get(`/manage/stores/${storeId}/categories`),
  createCategory: (storeId, data) => api.post(`/manage/stores/${storeId}/categories`, data),
  getCoupons: (storeId) => api.get(`/manage/stores/${storeId}/coupons`),
  createCoupon: (storeId, data) => api.post(`/manage/stores/${storeId}/coupons`, data),
};

// Orders
export const orderApi = {
  getAll: (storeId, params) => api.get(`/manage/stores/${storeId}/orders`, { params }),
  getOne: (storeId, orderId) => api.get(`/manage/stores/${storeId}/orders/${orderId}`),
  updateStatus: (storeId, orderId, data) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/status`, data),
  updatePayment: (storeId, orderId, data) => api.patch(`/manage/stores/${storeId}/orders/${orderId}/payment`, data),
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
};

// Public storefront
export const storeApi = {
  getStore: (slug) => api.get(`/store/${slug}`),
  getProducts: (slug, params) => api.get(`/store/${slug}/products`, { params }),
  getProduct: (slug, productSlug) => api.get(`/store/${slug}/products/${productSlug}`),
  getCategories: (slug) => api.get(`/store/${slug}/categories`),
  registerCustomer: (slug, data) => api.post(`/store/${slug}/customers/register`, data),
  loginCustomer: (slug, data) => api.post(`/store/${slug}/customers/login`, data),
  getCustomerProfile: (slug) => api.get(`/store/${slug}/customers/profile`),
  placeOrder: (slug, data) => api.post(`/store/${slug}/orders`, data),
  validateCoupon: (slug, data) => api.post(`/store/${slug}/validate-coupon`, data),
  getPages: (slug) => api.get(`/store/${slug}/pages`),
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
