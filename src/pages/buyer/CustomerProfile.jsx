import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useAuthStore, useCartStore, useWishlistStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, ShoppingCart, Package, LogOut, Clock, Check, Truck,
  Edit3, Save, X, MapPin, Phone, Mail, Eye, Camera, Heart, Trash2,
  ChevronDown, ChevronUp, AlertTriangle, ShoppingBag, Minus, Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
const statusLabels = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
const statusColors = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};

const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'orders', icon: Package, label: 'Orders' },
  { id: 'cart', icon: ShoppingCart, label: 'Cart' },
  { id: 'favorites', icon: Heart, label: 'Favorites' },
];

// ---------------------------------------------------------------------------
// TrackingModal (unchanged)
// ---------------------------------------------------------------------------
function TrackingModal({ order, onClose, pc }) {
  const { t } = useTranslation();
  const status = order.status || 'pending';
  const isCancelled = status === 'cancelled';
  const currentIdx = STATUS_FLOW.indexOf(status);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between border-b" style={{ backgroundColor: pc, color: '#fff' }}>
          <div>
            <p className="text-xs opacity-80">{t('store.tracking', 'Tracking')}</p>
            <p className="font-extrabold font-mono">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">
          {isCancelled ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><X size={28} className="text-red-500" /></div>
              <p className="font-bold text-gray-800">{t('store.orderCancelled', 'Order Cancelled')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'} ${active ? 'ring-4 ring-emerald-100 animate-pulse' : ''}`}>
                        {done ? <Check size={16} /> : i + 1}
                      </div>
                      {i < STATUS_FLOW.length - 1 && <div className={`w-0.5 h-8 ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                    </div>
                    <div className="pt-1">
                      <p className={`font-semibold text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{statusLabels[s]}</p>
                      {active && <p className="text-xs text-emerald-600 mt-0.5">{t('store.currentStatus', 'Current status')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {order.tracking_number && (
            <div className="mt-6 p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">{t('store.trackingNumber', 'Tracking Number')}</p>
              <p className="font-mono font-bold text-gray-800 text-sm">{order.tracking_number}</p>
            </div>
          )}
          {order.shipping_partner && (
            <p className="mt-3 text-center text-xs text-gray-500">{t('store.shippedVia', 'Shipped via')} <span className="font-semibold text-gray-700">{order.shipping_partner}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getProductImage(item) {
  if (item.thumbnail) return item.thumbnail;
  if (item.image) return item.image;
  let imgs = item.images;
  if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
  if (Array.isArray(imgs) && imgs.length) return typeof imgs[0] === 'string' ? imgs[0] : null;
  return null;
}

function getProductName(p) {
  return p.name_en || p.name_fr || p.name_ar || p.name || 'Untitled';
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function CustomerProfile() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, logout, setAuth } = useAuthStore();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', wilaya: '' });
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const fileInputRef = useRef(null);

  // Orders
  const [trackOrder, setTrackOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Init wishlist
  useEffect(() => { wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line

  useEffect(() => {
    if (!token) { navigate(`/s/${storeSlug}/auth`); return; }
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '', orders: [], total_orders: 0, total_spent: 0 });
    }
    storeApi.getCustomerProfile(storeSlug)
      .then(r => {
        setProfile(r.data);
        setForm({
          name: r.data.name || '', email: r.data.email || '', phone: r.data.phone || '',
          address: r.data.address || '', city: r.data.city || '', wilaya: r.data.wilaya || '',
        });
        if (r.data.profile_picture) setAvatarPreview(r.data.profile_picture);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    storeApi.getStore(storeSlug).then(r => {
      setStore(r.data);
      try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(r.data)); } catch {}
    }).catch(() => {});
  }, [storeSlug]); // eslint-disable-line

  // Theme
  const tplSec = Array.isArray(store?.page_builder) ? store.page_builder.find(s => s.visible !== false) : null;
  const tplStyle = tplSec?.style || {};
  const headerBg = tplStyle.bg || store?.primary_color || '#7C3AED';
  const headerText = tplStyle.textColor || '#ffffff';
  const headerFont = tplStyle.fontFamily || 'Inter';
  const pc = store?.primary_color || '#7C3AED';
  const currency = store?.currency || 'DZD';

  // -- Handlers ---------------------------------------------------------------

  const handleLogout = () => { logout(); navigate(`/s/${storeSlug}`); };

  const handleAvatarClick = () => { fileInputRef.current?.click(); };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t('store.imageTooLarge', 'Image must be under 2MB')); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!form.name || !form.phone) return toast.error(t('store.nameAndPhoneRequired', 'Name and phone are required'));
    setSaving(true);
    try {
      const payload = { ...form };
      if (avatarBase64) payload.profile_picture = avatarBase64;
      const { data } = await storeApi.updateCustomerProfile(storeSlug, payload);
      setProfile(p => ({ ...p, ...data }));
      if (setAuth && token) setAuth({ ...user, ...data }, token, 'customer');
      toast.success(t('store.profileUpdated', 'Profile updated'));
      setEditing(false);
      setAvatarBase64(null);
    } catch (e) {
      toast.error(e.response?.data?.error || t('store.updateFailed', 'Failed to update'));
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await storeApi.deleteCustomerAccount(storeSlug);
      toast.success(t('store.accountDeleted', 'Account deleted'));
      logout();
      navigate(`/s/${storeSlug}`);
    } catch (e) {
      toast.error(e.response?.data?.error || t('store.deleteFailed', 'Failed to delete account'));
    }
    setDeleting(false);
  };

  const handleRemoveCartItem = (index) => {
    cartStore.removeItem(index);
    toast.success(t('store.removedFromCart', 'Removed from cart'));
  };

  const handleRemoveFavorite = (productId) => {
    wishlistStore.remove(productId);
    toast.success(t('store.removedFromFavorites', 'Removed from favorites'));
  };

  // Cart items & wishlist items
  const cartItems = cartStore.items;
  const cartTotal = cartStore.getTotal();
  const favItems = wishlistStore.items;

  // -- Loading state ----------------------------------------------------------
  if (!store || (loading && !profile)) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: store?.primary_color ? '#f5f5f5' : '#ffffff' }}>
      <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!profile) return null;

  // -- Render -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: headerFont }}>
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: headerBg, color: headerText, fontFamily: headerFont }}>
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-4" style={{ color: headerText }}>
            {store.logo
              ? <img src={store.logo} className="w-14 h-14 rounded-xl object-cover bg-white/20" alt="" />
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20 font-bold text-xl" style={{ color: headerText }}>{store.name?.[0]}</div>}
            <span className="text-2xl font-extrabold" style={{ color: headerText, fontFamily: headerFont }}>{store.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/20 text-sm font-semibold" style={{ color: headerText }}>
              <ArrowLeft size={16} />{t('store.backToStore', 'Back to Store')}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/20 text-sm font-semibold" style={{ color: headerText }}>
              <LogOut size={16} />{t('store.logout', 'Logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ==================== TAB NAVIGATION ==================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = tab.id === 'cart' ? cartItems.length : tab.id === 'favorites' ? favItems.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${
                  isActive ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                style={isActive ? { backgroundColor: pc } : {}}
              >
                <Icon size={16} />
                <span className="hidden sm:inline truncate">{t(`store.tab${tab.label}`, tab.label)}</span>
                {badgeCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                    isActive ? 'bg-white' : 'bg-red-500 text-white'
                  }`} style={isActive ? { color: pc } : {}}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Card with Avatar */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative group cursor-pointer" onClick={editing ? handleAvatarClick : undefined}>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={profile.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-3xl border-4 border-white shadow-lg"
                        style={{ backgroundColor: pc }}
                      >
                        {(profile.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {editing && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm text-gray-500">{profile.phone}{profile.email && ` \u00B7 ${profile.email}`}</p>
                    {(profile.city || profile.wilaya) && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {[profile.city, profile.wilaya].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Edit3 size={12} />{t('store.edit', 'Edit')}
                  </button>
                ) : (
                  <button onClick={() => { setEditing(false); setAvatarBase64(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
                )}
              </div>

              {/* Edit Form */}
              {editing && (
                <div className="mt-2 space-y-3 border-t border-gray-100 pt-4">
                  {avatarBase64 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check size={12} />{t('store.newPhotoSelected', 'New photo selected - save to apply')}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.fullName', 'Full Name')}</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.phoneNumber', 'Phone')}</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.email', 'Email')}</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.address', 'Address')}</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.city', 'City')}</label>
                      <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.wilaya', 'Wilaya')}</label>
                      <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': pc + '33' }} value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} />
                    </div>
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity" style={{ backgroundColor: pc }}>
                    <Save size={14} />{saving ? t('store.saving', 'Saving...') : t('store.saveChanges', 'Save Changes')}
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <ShoppingCart size={20} className="mx-auto mb-1" style={{ color: pc }} />
                  <p className="text-2xl font-extrabold text-gray-900">{profile.total_orders || profile.orders?.length || 0}</p>
                  <p className="text-xs text-gray-400">{t('store.totalOrders', 'Total Orders')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <Package size={20} className="mx-auto text-emerald-500 mb-1" />
                  <p className="text-2xl font-extrabold text-gray-900">{parseFloat(profile.total_spent || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{t('store.totalSpent', 'Total Spent')} ({currency})</p>
                </div>
              </div>
            </div>

            {/* Logout + Danger Zone */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={16} />{t('store.logout', 'Logout')}
              </button>

              {/* Delete Account */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-red-400" />
                  {t('store.dangerZone', 'Danger Zone')}
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />{t('store.deleteAccount', 'Delete My Account')}
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                    <p className="text-sm text-red-700 font-semibold">{t('store.deleteAccountWarning', 'Are you sure? This action is permanent and cannot be undone. All your data will be removed.')}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 size={14} />{deleting ? t('store.deleting', 'Deleting...') : t('store.confirmDelete', 'Yes, Delete')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                      >
                        {t('store.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ORDERS TAB ==================== */}
        {activeTab === 'orders' && (
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">{t('store.orderHistory', 'Order History')}</h3>
            {(!profile.orders || profile.orders.length === 0) ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">{t('store.noOrdersYet', 'No orders yet')}</p>
                <Link to={`/s/${storeSlug}`} className="mt-4 inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: pc }}>{t('store.startShopping', 'Start Shopping')}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.orders.map(order => {
                  const isActive = !['delivered', 'cancelled'].includes(order.status);
                  const isExpanded = expandedOrder === order.id;
                  const orderItems = order.items || order.order_items || [];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Order Header */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-800 font-mono text-sm">{order.order_number}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'} capitalize`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                            <p className="text-lg font-extrabold text-gray-900 mt-1">{parseFloat(order.total).toLocaleString()} {currency}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            <span>{(order.payment_method || 'cod').replace('_', ' ').toUpperCase()}</span>
                            {order.tracking_number && <span className="font-mono">#{order.tracking_number}</span>}
                            {orderItems.length > 0 && (
                              <span className="text-gray-500">{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {orderItems.length > 0 && (
                              <button
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-bold transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {isExpanded ? t('store.hideDetails', 'Hide') : t('store.showDetails', 'Details')}
                              </button>
                            )}
                            {isActive && (
                              <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold" style={{ backgroundColor: pc }}>
                                <Truck size={12} />{t('store.track', 'Track')}
                              </button>
                            )}
                            {!isActive && (
                              <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold">
                                <Eye size={12} />{t('store.view', 'View')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Items */}
                      {isExpanded && orderItems.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-2">
                          {orderItems.map((item, idx) => {
                            const img = getProductImage(item);
                            return (
                              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                {img ? (
                                  <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <Package size={16} className="text-gray-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name || item.name || getProductName(item)}</p>
                                  {item.variant_label && <p className="text-[10px] text-gray-400">{item.variant_label}</p>}
                                  <p className="text-xs text-gray-500">
                                    {t('store.qty', 'Qty')}: {item.quantity}
                                    <span className="mx-1.5 text-gray-300">|</span>
                                    {parseFloat(item.price || 0).toLocaleString()} {currency}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-gray-900 shrink-0">
                                  {(parseFloat(item.price || 0) * (item.quantity || 1)).toLocaleString()} {currency}
                                </p>
                              </div>
                            );
                          })}
                          {/* Order summary row */}
                          {order.shipping_cost != null && parseFloat(order.shipping_cost) > 0 && (
                            <div className="flex items-center justify-between px-3 pt-2 text-xs text-gray-500">
                              <span>{t('store.shipping', 'Shipping')}</span>
                              <span>{parseFloat(order.shipping_cost).toLocaleString()} {currency}</span>
                            </div>
                          )}
                          {order.discount != null && parseFloat(order.discount) > 0 && (
                            <div className="flex items-center justify-between px-3 text-xs text-emerald-600">
                              <span>{t('store.discount', 'Discount')}</span>
                              <span>-{parseFloat(order.discount).toLocaleString()} {currency}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== CART TAB ==================== */}
        {activeTab === 'cart' && (
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <ShoppingCart size={20} style={{ color: pc }} />
              {t('store.myCart', 'My Cart')}
              {cartItems.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pc }}>
                  {cartItems.length}
                </span>
              )}
            </h3>
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">{t('store.cartEmpty', 'Your cart is empty')}</p>
                <Link to={`/s/${storeSlug}`} className="mt-4 inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: pc }}>
                  {t('store.startShopping', 'Start Shopping')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          {item.variant.type === 'color' && item.variant.value && (
                            <span className="w-3 h-3 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: item.variant.value }} />
                          )}
                          {item.variant.label || item.variant.name || (item.variant.type && item.variant.value ? `${item.variant.type}: ${item.variant.value}` : '')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-base font-extrabold" style={{ color: pc }}>
                          {parseFloat(item.price || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => cartStore.updateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => cartStore.updateQuantity(index, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    {/* Subtotal + remove */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} {currency}</p>
                      <button
                        onClick={() => handleRemoveCartItem(index)}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold mt-1 flex items-center gap-0.5 ml-auto transition-colors"
                      >
                        <Trash2 size={10} />{t('store.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                ))}
                {/* Cart Total */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t('store.cartTotal', 'Cart Total')}</p>
                    <p className="text-2xl font-extrabold text-gray-900">{cartTotal.toLocaleString()} {currency}</p>
                  </div>
                  <Link
                    to={`/s/${storeSlug}/checkout`}
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
                    style={{ backgroundColor: pc }}
                  >
                    {t('store.proceedToCheckout', 'Checkout')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== FAVORITES TAB ==================== */}
        {activeTab === 'favorites' && (
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Heart size={20} style={{ color: pc }} />
              {t('store.myFavorites', 'My Favorites')}
              {favItems.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pc }}>
                  {favItems.length}
                </span>
              )}
            </h3>
            {favItems.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">{t('store.noFavoritesYet', 'Start saving the products you love')}</p>
                <Link to={`/s/${storeSlug}`} className="mt-4 inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: pc }}>
                  {t('store.startShopping', 'Start Shopping')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favItems.map(product => {
                  const thumb = getProductImage(product);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 group">
                      <Link to={`/s/${storeSlug}/product/${product.slug}`} className="shrink-0">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Package size={20} className="text-gray-300" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                          <p className="font-bold text-sm text-gray-900 truncate hover:underline">{getProductName(product)}</p>
                        </Link>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-base font-extrabold" style={{ color: pc }}>
                            {parseFloat(product.price || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">{currency}</span>
                          {product.compare_at_price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {parseFloat(product.compare_at_price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => { cartStore.addItem(product, 1, null); toast.success(t('store.addedToCart', 'Added to cart')); }}
                            className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                            style={{ backgroundColor: pc }}
                          >
                            <ShoppingCart size={12} />{t('store.addToCart', 'Add to Cart')}
                          </button>
                          <button
                            onClick={() => handleRemoveFavorite(product.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {favItems.length > 0 && (
              <div className="text-center mt-6">
                <Link to={`/s/${storeSlug}/favorites`} className="inline-flex items-center gap-2 text-sm font-bold hover:underline" style={{ color: pc }}>
                  <Heart size={14} />
                  {t('store.viewFullFavorites', 'View Full Favorites Page')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {trackOrder && <TrackingModal order={trackOrder} onClose={() => setTrackOrder(null)} pc={pc} />}
    </div>
  );
}
