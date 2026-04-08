import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ArrowLeft, User, ShoppingCart, Package, LogOut, Clock, Check, Truck, Edit3, Save, X, MapPin, Phone, Mail, Eye } from 'lucide-react';

const STATUS_FLOW = ['pending','confirmed','preparing','shipped','delivered'];
const statusLabels = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
const statusColors = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};

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
            <p className="text-xs opacity-80">{t('store.tracking','Tracking')}</p>
            <p className="font-extrabold font-mono">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">
          {isCancelled ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><X size={28} className="text-red-500" /></div>
              <p className="font-bold text-gray-800">{t('store.orderCancelled','Order Cancelled')}</p>
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
                      {active && <p className="text-xs text-emerald-600 mt-0.5">{t('store.currentStatus','Current status')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {order.tracking_number && (
            <div className="mt-6 p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">{t('store.trackingNumber','Tracking Number')}</p>
              <p className="font-mono font-bold text-gray-800 text-sm">{order.tracking_number}</p>
            </div>
          )}
          {order.shipping_partner && (
            <p className="mt-3 text-center text-xs text-gray-500">{t('store.shippedVia','Shipped via')} <span className="font-semibold text-gray-700">{order.shipping_partner}</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token, logout, setAuth } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', wilaya: '' });
  const [saving, setSaving] = useState(false);
  const [trackOrder, setTrackOrder] = useState(null);

  useEffect(() => {
    if (!token) { navigate(`/s/${storeSlug}/auth`); return; }
    // Always show something — start with whatever auth has in memory
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
      })
      .catch(() => {/* keep in-memory profile; don't bounce */})
      .finally(() => setLoading(false));
    storeApi.getStore(storeSlug).then(r => {
      setStore(r.data);
      try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(r.data)); } catch {}
    }).catch(() => {});
  }, [storeSlug]);

  const tplSec = Array.isArray(store?.page_builder) ? store.page_builder.find(s => s.visible !== false) : null;
  const tplStyle = tplSec?.style || {};
  const headerBg = tplStyle.bg || store?.primary_color || '#7C3AED';
  const headerText = tplStyle.textColor || '#ffffff';
  const headerFont = tplStyle.fontFamily || 'Inter';
  const pc = store?.primary_color || '#7C3AED';

  const handleLogout = () => { logout(); navigate(`/s/${storeSlug}`); };

  const saveProfile = async () => {
    if (!form.name || !form.phone) return toast.error(t('store.nameAndPhoneRequired','Name and phone are required'));
    setSaving(true);
    try {
      const { data } = await storeApi.updateCustomerProfile(storeSlug, form);
      setProfile(p => ({ ...p, ...data }));
      if (setAuth && token) setAuth({ ...user, ...data }, token, 'customer');
      toast.success(t('store.profileUpdated','Profile updated'));
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.error || t('store.updateFailed','Failed to update'));
    }
    setSaving(false);
  };

  if (loading && !profile) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: headerBg, color: headerText, fontFamily: headerFont }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2" style={{ color: headerText }}>
            <ArrowLeft size={18} />
            <span className="font-semibold text-sm" style={{ color: headerText, fontFamily: headerFont }}>{t('store.backToStore','Back to Store')}</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium opacity-90 hover:opacity-100" style={{ color: headerText }}>
            <LogOut size={16} />{t('store.logout','Logout')}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl" style={{ backgroundColor: pc }}>
                {(profile.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.phone}{profile.email && ` · ${profile.email}`}</p>
                {(profile.city || profile.wilaya) && <p className="text-xs text-gray-400 mt-0.5">{[profile.city, profile.wilaya].filter(Boolean).join(', ')}</p>}
              </div>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1">
                <Edit3 size={12} />{t('store.edit','Edit')}
              </button>
            ) : (
              <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
            )}
          </div>

          {editing && (
            <div className="mt-2 space-y-3 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.fullName','Full Name')}</label>
                  <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.phoneNumber','Phone')}</label>
                  <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.email','Email')}</label>
                <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.address','Address')}</label>
                <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.city','City')}</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{t('store.wilaya','Wilaya')}</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: pc }}>
                <Save size={14} />{saving ? t('store.saving','Saving...') : t('store.saveChanges','Save Changes')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <ShoppingCart size={20} className="mx-auto mb-1" style={{ color: pc }} />
              <p className="text-2xl font-extrabold text-gray-900">{profile.total_orders || profile.orders?.length || 0}</p>
              <p className="text-xs text-gray-400">{t('store.totalOrders','Total Orders')}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <Package size={20} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-2xl font-extrabold text-gray-900">{parseFloat(profile.total_spent || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">{t('store.totalSpent','Total Spent')} (DZD)</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <h3 className="font-bold text-gray-900 text-lg mb-4">{t('store.orderHistory','Order History')}</h3>
        {(!profile.orders || profile.orders.length === 0) ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t('store.noOrdersYet','No orders yet')}</p>
            <Link to={`/s/${storeSlug}`} className="mt-4 inline-flex px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: pc }}>{t('store.startShopping','Start Shopping')}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.orders.map(order => {
              const isActive = !['delivered','cancelled'].includes(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800 font-mono text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'} capitalize`}>{statusLabels[order.status] || order.status}</span>
                      <p className="text-lg font-extrabold text-gray-900 mt-1">{parseFloat(order.total).toLocaleString()} DZD</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>{(order.payment_method || 'cod').replace('_',' ').toUpperCase()}</span>
                      {order.tracking_number && <span className="font-mono">#{order.tracking_number}</span>}
                    </div>
                    {isActive && (
                      <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold" style={{ backgroundColor: pc }}>
                        <Truck size={12} />{t('store.track','Track')}
                      </button>
                    )}
                    {!isActive && (
                      <button onClick={() => setTrackOrder(order)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold">
                        <Eye size={12} />{t('store.view','View')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {trackOrder && <TrackingModal order={trackOrder} onClose={() => setTrackOrder(null)} pc={pc} />}
    </div>
  );
}
