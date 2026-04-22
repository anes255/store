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
  Lock, Sparkles, Star,
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
  pending: 'bg-amber-400/20 text-amber-300', confirmed: 'bg-blue-400/20 text-blue-300',
  preparing: 'bg-purple-400/20 text-purple-300', shipped: 'bg-cyan-400/20 text-cyan-300',
  delivered: 'bg-emerald-400/20 text-emerald-300', cancelled: 'bg-red-400/20 text-red-300',
};

const NAV_ITEMS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'orders', icon: Package, label: 'My Orders' },
  { id: 'favorites', icon: Heart, label: 'Favorites' },
  { id: 'cart', icon: ShoppingCart, label: 'My Cart' },
];

// ---------------------------------------------------------------------------
// TrackingModal (dark-themed)
// ---------------------------------------------------------------------------
function TrackingModal({ order, onClose, pc }) {
  const { t } = useTranslation();
  const status = order.status || 'pending';
  const isCancelled = status === 'cancelled';
  const currentIdx = STATUS_FLOW.indexOf(status);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between border-b border-white/10" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}88)` }}>
          <div>
            <p className="text-xs opacity-80 text-white">{t('store.tracking', 'Tracking')}</p>
            <p className="font-extrabold font-mono text-white">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full text-white"><X size={20} /></button>
        </div>
        <div className="p-6">
          {isCancelled ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3"><X size={28} className="text-red-400" /></div>
              <p className="font-bold text-white">{t('store.orderCancelled', 'Order Cancelled')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500'} ${active ? 'ring-4 ring-emerald-500/30 animate-pulse' : ''}`}>
                        {done ? <Check size={16} /> : i + 1}
                      </div>
                      {i < STATUS_FLOW.length - 1 && <div className={`w-0.5 h-8 ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-700'}`} />}
                    </div>
                    <div className="pt-1">
                      <p className={`font-semibold text-sm ${done ? 'text-white' : 'text-gray-500'}`}>{statusLabels[s]}</p>
                      {active && <p className="text-xs text-emerald-400 mt-0.5">{t('store.currentStatus', 'Current status')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {order.tracking_number && (
            <div className="mt-6 p-3 bg-white/5 rounded-xl text-center border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase font-bold">{t('store.trackingNumber', 'Tracking Number')}</p>
              <p className="font-mono font-bold text-white text-sm">{order.tracking_number}</p>
            </div>
          )}
          {order.shipping_partner && (
            <p className="mt-3 text-center text-xs text-gray-400">{t('store.shippedVia', 'Shipped via')} <span className="font-semibold text-white">{order.shipping_partner}</span></p>
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
  // order_items table stores the snapshot under product_image
  if (item.product_image) return item.product_image;
  if (item.thumbnail) return item.thumbnail;
  if (item.image) return item.image;
  let imgs = item.images;
  if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
  if (Array.isArray(imgs) && imgs.length) return typeof imgs[0] === 'string' ? imgs[0] : (imgs[0]?.url || null);
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

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Split name for display
  const nameParts = (profile?.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // -- Loading state ----------------------------------------------------------
  if (!store || (loading && !profile)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-10 h-10 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: pc }} />
    </div>
  );
  if (!profile) return null;

  // -- Render -----------------------------------------------------------------
  return (
    <div className="min-h-screen" style={{ fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* ==================== MOBILE TOP BAR ==================== */}
      <div className="lg:hidden sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-3 text-white">
            {store.logo
              ? <img src={store.logo} className="w-8 h-8 rounded-lg object-cover" alt="" />
              : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: pc }}>{store.name?.[0]}</div>}
            <span className="font-bold text-sm">{store.name}</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-10 h-screen w-[280px] shrink-0
          bg-gray-900/70 backdrop-blur-2xl border-r border-white/10
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Store branding */}
          <div className="px-5 pt-6 pb-2">
            <Link to={`/s/${storeSlug}`} className="flex items-center gap-3 group">
              {store.logo
                ? <img src={store.logo} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" alt="" />
                : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10" style={{ backgroundColor: pc }}>{store.name?.[0]}</div>}
              <span className="font-bold text-white text-sm group-hover:opacity-80 transition-opacity">{store.name}</span>
            </Link>
          </div>

          {/* Avatar section */}
          <div className="px-5 py-6 flex flex-col items-center">
            <div className="relative group cursor-pointer mb-3" onClick={handleAvatarClick}>
              <div className="w-24 h-24 rounded-full p-[3px]" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}66, #818cf8)` }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover border-[3px] border-gray-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-extrabold text-3xl border-[3px] border-gray-900" style={{ backgroundColor: pc + '44' }}>
                    {(profile.name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Camera size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center border-[3px] border-gray-900" style={{ backgroundColor: pc }}>
                <Camera size={11} className="text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <h3 className="text-xl text-white italic" style={{ fontFamily: "Arial, sans-serif", fontWeight: 600 }}>{profile.name || 'Customer'}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">{t('store.activeMember', 'Active Member')}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeCount = item.id === 'cart' ? cartItems.length : item.id === 'favorites' ? favItems.length : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? { backgroundColor: pc + 'dd', boxShadow: `0 8px 25px ${pc}33` } : {}}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                  <span>{t(`store.nav${item.label.replace(/\s/g, '')}`, item.label)}</span>
                  {badgeCount > 0 && (
                    <span className={`ml-auto w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'text-white'
                    }`} style={!isActive ? { backgroundColor: pc } : {}}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Back to store + Logout */}
          <div className="px-3 pb-6 space-y-2">
            <Link
              to={`/s/${storeSlug}`}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <ArrowLeft size={18} className="text-gray-500" />
              <span>{t('store.backToStore', 'Back to Store')}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={18} />
              <span>{t('store.logout', 'Logout')}</span>
            </button>
          </div>
        </aside>

        {/* ==================== RIGHT CONTENT AREA ==================== */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

          {/* ==================== PROFILE SECTION ==================== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Welcome Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}88)` }}>
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-white italic" style={{ letterSpacing: '-0.03em', fontFamily: "Arial, sans-serif" }}>
                    {t('store.welcomeBack', 'Welcome back,')} <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, #818cf8)` }}>{firstName || 'Customer'}!</span>
                  </h1>
                  <p className="text-sm text-gray-300/80 mt-2 font-light tracking-[0.2em] uppercase">{t('store.manageProfile', 'Manage your profile and preferences')}</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Your Orders stat */}
                <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-medium">{t('store.yourOrders', 'Your Orders')}</p>
                      <p className="text-4xl font-bold text-white mt-1" style={{ fontFamily: "Arial, sans-serif" }}>{profile.total_orders || profile.orders?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}33, ${pc}11)` }}>
                      <Package size={22} style={{ color: pc }} className="group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </div>
                {/* Saved Items stat */}
                <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-medium">{t('store.savedItems', 'Saved Items')}</p>
                      <p className="text-4xl font-bold text-white mt-1" style={{ fontFamily: "Arial, sans-serif" }}>{favItems.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/15">
                      <Heart size={22} className="text-pink-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 italic" style={{ fontFamily: "Arial, sans-serif" }}>
                    <User size={18} style={{ color: pc }} />
                    {t('store.profileDetails', 'Profile Details')}
                  </h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-sm font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      style={{ color: pc }}
                    >
                      <Edit3 size={14} />
                      {t('store.editProfile', 'Edit Profile')}
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(false); setAvatarBase64(null); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {!editing ? (
                  /* View mode */
                  <div className="p-6 space-y-6">
                    {avatarBase64 && (
                      <p className="text-xs text-amber-400 flex items-center gap-1 -mt-2 mb-2">
                        <AlertTriangle size={12} />{t('store.unsavedPhoto', 'Unsaved photo - click Edit to save')}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.firstName', 'First Name')}</label>
                        <p className="text-white text-xl font-medium" style={{ fontFamily: "Arial, sans-serif" }}>{firstName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.lastName', 'Last Name')}</label>
                        <p className="text-white text-xl font-medium" style={{ fontFamily: "Arial, sans-serif" }}>{lastName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.emailAddress', 'Email Address')}</label>
                        <p className="text-white text-xl font-medium flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                          <Mail size={14} className="text-gray-500 shrink-0" />
                          {profile.email || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.phoneNumber', 'Phone Number')}</label>
                        <p className="text-white text-xl font-medium flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                          <Phone size={14} className="text-gray-500 shrink-0" />
                          {profile.phone || '-'}
                        </p>
                      </div>
                    </div>
                    {(profile.address || profile.city || profile.wilaya) && (
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.address', 'Address')}</label>
                        <p className="text-white text-xl font-medium flex items-center gap-2" style={{ fontFamily: "Arial, sans-serif" }}>
                          <MapPin size={14} className="text-gray-500 shrink-0" />
                          {[profile.address, profile.city, profile.wilaya].filter(Boolean).join(', ') || '-'}
                        </p>
                      </div>
                    )}
                    {/* Password (decorative) */}
                    <div className="pt-2 border-t border-white/5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.3em] block mb-2" style={{ color: pc + 'bb' }}>{t('store.password', 'Password')}</label>
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-gray-500" />
                        <span className="text-white tracking-widest">{'*'.repeat(10)}</span>
                        <span className="text-[10px] text-gray-500 font-medium ml-1">{t('store.securelyHidden', 'Securely Hidden')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit mode */
                  <div className="p-6 space-y-4">
                    {avatarBase64 && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1 -mt-1">
                        <Check size={12} />{t('store.newPhotoSelected', 'New photo selected - save to apply')}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.fullName', 'Full Name')}</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                            style={{ '--tw-ring-color': pc + '55' }}
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={t('store.fullName', 'Full Name')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.phoneNumber', 'Phone')}</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                            style={{ '--tw-ring-color': pc + '55' }}
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            placeholder={t('store.phoneNumber', 'Phone')}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.email', 'Email')}</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                          style={{ '--tw-ring-color': pc + '55' }}
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder={t('store.email', 'Email')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.address', 'Address')}</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                          style={{ '--tw-ring-color': pc + '55' }}
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder={t('store.address', 'Address')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.city', 'City')}</label>
                        <input
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                          style={{ '--tw-ring-color': pc + '55' }}
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          placeholder={t('store.city', 'City')}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('store.wilaya', 'Wilaya')}</label>
                        <input
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 placeholder-gray-600 transition-all"
                          style={{ '--tw-ring-color': pc + '55' }}
                          value={form.wilaya}
                          onChange={e => setForm({ ...form, wilaya: e.target.value })}
                          placeholder={t('store.wilaya', 'Wilaya')}
                        />
                      </div>
                    </div>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg"
                      style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}
                    >
                      <Save size={14} />{saving ? t('store.saving', 'Saving...') : t('store.saveChanges', 'Save Changes')}
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <AlertTriangle size={12} className="text-red-400" />
                  {t('store.dangerZone', 'Danger Zone')}
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />{t('store.deleteAccount', 'Delete My Account')}
                  </button>
                ) : (
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 space-y-3">
                    <p className="text-sm text-red-300 font-semibold">{t('store.deleteAccountWarning', 'Are you sure? This action is permanent and cannot be undone. All your data will be removed.')}</p>
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
                        className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/15 transition-colors"
                      >
                        {t('store.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ORDERS SECTION ==================== */}
          {activeTab === 'orders' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}44, ${pc}22)` }}>
                  <Package size={20} style={{ color: pc }} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white">{t('store.orderHistory', 'Order History')}</h1>
                  <p className="text-sm text-gray-400">{t('store.trackYourOrders', 'Track and manage your orders')}</p>
                </div>
              </div>

              {(!profile.orders || profile.orders.length === 0) ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${pc}22, ${pc}11)` }}>
                    <ShoppingCart size={28} style={{ color: pc + '88' }} />
                  </div>
                  <p className="text-gray-400 mb-4">{t('store.noOrdersYet', 'No orders yet')}</p>
                  <Link to={`/s/${storeSlug}`} className="inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}>
                    {t('store.startShopping', 'Start Shopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.orders.map(order => {
                    const isActive = !['delivered', 'cancelled'].includes(order.status);
                    const isExpanded = expandedOrder === order.id;
                    const orderItems = order.items || order.order_items || [];
                    return (
                      <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/[0.07] transition-all duration-200">
                        {/* Order Header */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-white font-mono text-sm">{order.order_number}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[order.status] || 'bg-gray-700 text-gray-300'} capitalize`}>
                                {statusLabels[order.status] || order.status}
                              </span>
                              <p className="text-lg font-extrabold text-white mt-1">{parseFloat(order.total).toLocaleString()} {currency}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                              <span className="uppercase">{(order.payment_method || 'cod').replace('_', ' ')}</span>
                              {order.tracking_number && <span className="font-mono text-gray-400">#{order.tracking_number}</span>}
                              {orderItems.length > 0 && (
                                <span className="text-gray-400">{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md" style={{ backgroundColor: pc }}>
                                  <Truck size={12} />{t('store.track', 'Track')}
                                </button>
                              )}
                              {!isActive && (
                                <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold border border-white/5 transition-colors">
                                  <Eye size={12} />{t('store.view', 'View')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items — always visible so buyers see the products, variants, and quantities they ordered */}
                        {orderItems.length > 0 && (
                          <div className="border-t border-white/5 bg-white/[0.02] p-4 space-y-2">
                            {orderItems.map((item, idx) => {
                              const img = getProductImage(item);
                              return (
                                <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                  {img ? (
                                    <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-800 shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                                      <Package size={16} className="text-gray-600" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{item.product_name || item.name || getProductName(item)}</p>
                                    {item.variant_label && <p className="text-[10px] text-gray-500">{item.variant_label}</p>}
                                    <p className="text-xs text-gray-400">
                                      {t('store.qty', 'Qty')}: {item.quantity}
                                      <span className="mx-1.5 text-gray-600">|</span>
                                      {parseFloat(item.price || 0).toLocaleString()} {currency}
                                    </p>
                                  </div>
                                  <p className="text-sm font-bold text-white shrink-0">
                                    {(parseFloat(item.price || 0) * (item.quantity || 1)).toLocaleString()} {currency}
                                  </p>
                                </div>
                              );
                            })}
                            {order.shipping_cost != null && parseFloat(order.shipping_cost) > 0 && (
                              <div className="flex items-center justify-between px-3 pt-2 text-xs text-gray-500">
                                <span>{t('store.shipping', 'Shipping')}</span>
                                <span>{parseFloat(order.shipping_cost).toLocaleString()} {currency}</span>
                              </div>
                            )}
                            {order.discount != null && parseFloat(order.discount) > 0 && (
                              <div className="flex items-center justify-between px-3 text-xs text-emerald-400">
                                <span>{t('store.discount', 'Discount')}</span>
                                <span>-{parseFloat(order.discount).toLocaleString()} {currency}</span>
                              </div>
                            )}
                            {/* Extra order details: shipping address, contact, payment, notes */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
                              <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('store.shippingAddress','Shipping Address')}</p>
                                <p className="text-xs text-white/90">{order.shipping_address || '—'}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{[order.shipping_city, order.shipping_wilaya].filter(Boolean).join(', ')}{order.shipping_zip ? ` · ${order.shipping_zip}` : ''}</p>
                                {order.shipping_type && (
                                  <p className="text-[11px] text-gray-400 mt-0.5">{order.shipping_type === 'home' ? t('store.homeDelivery','Home delivery') : t('store.deskDelivery','Desk delivery')}</p>
                                )}
                              </div>
                              <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">{t('store.paymentContact','Payment & Contact')}</p>
                                <p className="text-xs text-white/90 uppercase">{(order.payment_method || 'cod').replace('_',' ')} · <span className={order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>{order.payment_status || 'unpaid'}</span></p>
                                <p className="text-[11px] text-gray-400 mt-1 font-mono">{order.customer_phone || ''}</p>
                                {order.customer_email && <p className="text-[11px] text-gray-400">{order.customer_email}</p>}
                                {order.tracking_number && <p className="text-[11px] text-cyan-300 mt-1 font-mono">#{order.tracking_number}</p>}
                              </div>
                              {order.notes && (
                                <div className="sm:col-span-2 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                                  <p className="text-[10px] font-bold text-blue-300 uppercase mb-1">{t('store.orderNotes','Order Notes')}</p>
                                  <p className="text-xs text-blue-100">{order.notes}</p>
                                </div>
                              )}
                              <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 p-3">
                                <span className="text-[11px] text-gray-400">{t('store.subtotal','Subtotal')}</span>
                                <span className="text-xs font-bold text-white">{parseFloat(order.subtotal || order.total).toLocaleString()} {currency}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== CART SECTION ==================== */}
          {activeTab === 'cart' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}44, ${pc}22)` }}>
                  <ShoppingCart size={20} style={{ color: pc }} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                    {t('store.myCart', 'My Cart')}
                    {cartItems.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: pc }}>
                        {cartItems.length}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-400">{t('store.reviewItems', 'Review your selected items')}</p>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${pc}22, ${pc}11)` }}>
                    <ShoppingBag size={28} style={{ color: pc + '88' }} />
                  </div>
                  <p className="text-gray-400 mb-4">{t('store.cartEmpty', 'Your cart is empty')}</p>
                  <Link to={`/s/${storeSlug}`} className="inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}>
                    {t('store.startShopping', 'Start Shopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex items-center gap-4 hover:bg-white/[0.07] transition-all duration-200">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-800 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{item.name}</p>
                        {item.variant && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            {item.variant.type === 'color' && item.variant.value && (
                              <span className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{ backgroundColor: item.variant.value }} />
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
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => cartStore.updateQuantity(index, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Subtotal + remove */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{(item.price * item.quantity).toLocaleString()} {currency}</p>
                        <button
                          onClick={() => handleRemoveCartItem(index)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-1 flex items-center gap-0.5 ml-auto transition-colors"
                        >
                          <Trash2 size={10} />{t('store.remove', 'Remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Cart Total */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('store.cartTotal', 'Cart Total')}</p>
                      <p className="text-2xl font-extrabold text-white">{cartTotal.toLocaleString()} {currency}</p>
                    </div>
                    <Link
                      to={`/s/${storeSlug}/checkout`}
                      className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg"
                      style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}
                    >
                      {t('store.proceedToCheckout', 'Checkout')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== FAVORITES SECTION ==================== */}
          {activeTab === 'favorites' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/15">
                  <Heart size={20} className="text-pink-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                    {t('store.myFavorites', 'My Favorites')}
                    {favItems.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300">
                        {favItems.length}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-400">{t('store.savedProducts', 'Products you have saved')}</p>
                </div>
              </div>

              {favItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-pink-500/10">
                    <Heart size={28} className="text-pink-400/50" />
                  </div>
                  <p className="text-gray-400 mb-4">{t('store.noFavoritesYet', 'Start saving the products you love')}</p>
                  <Link to={`/s/${storeSlug}`} className="inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}>
                    {t('store.startShopping', 'Start Shopping')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favItems.map(product => {
                    const thumb = getProductImage(product);
                    return (
                      <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex items-center gap-4 group hover:bg-white/[0.07] transition-all duration-200">
                        <Link to={`/s/${storeSlug}/product/${product.slug}`} className="shrink-0">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-20 h-20 rounded-xl object-cover bg-gray-800" />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center">
                              <Package size={20} className="text-gray-600" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                            <p className="font-bold text-sm text-white truncate hover:underline">{getProductName(product)}</p>
                          </Link>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-extrabold" style={{ color: pc }}>
                              {parseFloat(product.price || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold">{currency}</span>
                            {product.compare_at_price && (
                              <span className="text-[10px] text-gray-600 line-through">
                                {parseFloat(product.compare_at_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => { cartStore.addItem(product, 1, null); toast.success(t('store.addedToCart', 'Added to cart')); }}
                              className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1 transition-all hover:shadow-md"
                              style={{ backgroundColor: pc }}
                            >
                              <ShoppingCart size={12} />{t('store.addToCart', 'Add to Cart')}
                            </button>
                            <button
                              onClick={() => handleRemoveFavorite(product.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
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
        </main>
      </div>

      {trackOrder && <TrackingModal order={trackOrder} onClose={() => setTrackOrder(null)} pc={pc} />}
    </div>
  );
}
