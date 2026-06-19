import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { useBuyerTheme } from '../../hooks/useStore';
import { Truck, Search, ArrowLeft, Package, Check, Clock, Ban, ShoppingBag, Phone, MapPin, CreditCard, Hash, Box, Home } from 'lucide-react';
import { isValidAlgerianPhone } from './Checkout';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
const DEFAULT_STATUS_COLORS = {
  new_order: 'bg-indigo-500/20 text-indigo-300',
  pending: 'bg-amber-500/20 text-amber-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  preparing: 'bg-purple-500/20 text-purple-300',
  under_preparation: 'bg-purple-500/20 text-purple-300',
  ready: 'bg-teal-500/20 text-teal-300',
  shipped: 'bg-cyan-500/20 text-cyan-300',
  delivered: 'bg-emerald-500/20 text-emerald-300',
  cancelled: 'bg-red-500/20 text-red-300',
  returned: 'bg-gray-600/40 text-gray-300',
};

// Visual pipeline steps (order-level lifecycle). Labels are looked up via
// i18n at render time using these keys → falls back to the English defaults
// when a translation is missing.
const PIPELINE = [
  { key: 'new_order', icon: Hash,    defaultLabel: 'New',       i18n: 'track.stepNew' },
  { key: 'confirmed', icon: Check,   defaultLabel: 'Confirmed', i18n: 'track.stepConfirmed' },
  { key: 'preparing', icon: Box,     defaultLabel: 'Preparing', i18n: 'track.stepPreparing' },
  { key: 'ready',     icon: Package, defaultLabel: 'Ready',     i18n: 'track.stepReady' },
  { key: 'shipped',   icon: Truck,   defaultLabel: 'Shipped',   i18n: 'track.stepShipped' },
  { key: 'delivered', icon: Home,    defaultLabel: 'Delivered', i18n: 'track.stepDelivered' },
];
const FAIL = ['cancelled', 'returned', 'delivery_failed'];
function stepIndexFor(status) {
  const i = PIPELINE.findIndex(s => s.key === status);
  if (i >= 0) return i;
  if (status === 'pending') return 0;
  if (status === 'out_for_delivery' || status === 'in_transit' || status === 'at_center' || status === 'picked_up' || status === 'awaiting_pickup') return 4;
  return 0;
}

export default function TrackOrder() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const buyerTheme = useBuyerTheme();
  const [store, setStore] = useState({
    name: '', currency: 'DZD', logo: '', primary_color: '',
    tracking_enabled: true,
    tracking_search_method: 'phone',
    tracking_hero_title: '',
    tracking_hero_sub: '',
    tracking_show_price: true,
    tracking_show_items: true,
    tracking_show_timeline: true,
    tracking_show_address: true,
    tracking_show_payment: true,
    tracking_show_tracking_number: true,
  });
  const [statusMap, setStatusMap] = useState({});
  const [phone, setPhone] = useState('');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [mode, setMode] = useState('phone'); // active tab when method==='both'
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    storeApi.getStore(storeSlug).then(r => {
      const d = r.data || {};
      setStore(s => ({
        ...s,
        name: d.name || '',
        currency: d.currency || 'DZD',
        logo: d.logo || '',
        primary_color: d.primary_color || '',
        tracking_enabled: d.tracking_enabled !== false,
        tracking_search_method: d.tracking_search_method || 'phone',
        tracking_hero_title: d.tracking_hero_title || '',
        tracking_hero_sub: d.tracking_hero_sub || '',
        tracking_show_price: d.tracking_show_price !== false,
        tracking_show_items: d.tracking_show_items !== false,
        tracking_show_timeline: d.tracking_show_timeline !== false,
        tracking_show_address: d.tracking_show_address !== false,
        tracking_show_payment: d.tracking_show_payment !== false,
        tracking_show_tracking_number: d.tracking_show_tracking_number !== false,
        tracking_bg: d.config?.tracking_bg_color || '',
      }));
      setMode((d.tracking_search_method === 'order_id') ? 'order_id' : 'phone');
      setStoreReady(true);
      if (d.id) {
        storeApi.getStatusTemplates(d.id).then(rr => {
          const rows = Array.isArray(rr.data) ? rr.data : [];
          const map = {};
          rows.forEach(r => { map[r.key] = { label: r.label, color: r.color }; });
          setStatusMap(map);
        }).catch(() => {});
      }
    }).catch(() => { setStoreReady(true); });
  }, [storeSlug]);

  const currency = store.currency || 'DZD';
  const pc = store.primary_color || buyerTheme.primaryColor || '#7c3aed';

  const lookup = async () => {
    const useMode = store.tracking_search_method === 'both' ? mode : store.tracking_search_method;
    setLoading(true);
    try {
      let res;
      if (useMode === 'order_id') {
        if (!orderIdInput.trim()) { toast.error(t('track.enterOrderId', 'Enter your order ID')); setLoading(false); return; }
        res = await storeApi.trackByOrderId(storeSlug, orderIdInput.trim());
      } else {
        if (!isValidAlgerianPhone(phone)) { toast.error(t('track.invalidPhone', 'Enter a valid Algerian phone (e.g. 0555123456)')); setLoading(false); return; }
        res = await storeApi.trackOrders(storeSlug, encodeURIComponent(phone));
      }
      const data = res.data;
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch {
      toast.error(t('track.notFound', 'No orders found'));
      setOrders([]);
    }
    setLoading(false);
  };

  // Order status pretty label: prefer the merchant's per-status template,
  // then a built-in i18n key, then a humanised fallback of the raw status.
  const STATUS_I18N = {
    new_order: ['track.statusNewOrder','New Order'],
    pending: ['track.statusPending','Pending'],
    confirmed: ['track.statusConfirmed','Confirmed'],
    preparing: ['track.statusPreparing','Preparing'],
    under_preparation: ['track.statusPreparing','Preparing'],
    ready: ['track.statusReady','Ready'],
    shipped: ['track.statusShipped','Shipped'],
    out_for_delivery: ['track.statusOutForDelivery','Out for delivery'],
    in_transit: ['track.statusInTransit','In transit'],
    at_center: ['track.statusAtCenter','At delivery center'],
    picked_up: ['track.statusPickedUp','Picked up'],
    awaiting_pickup: ['track.statusAwaitingPickup','Awaiting pickup'],
    delivered: ['track.statusDelivered','Delivered'],
    cancelled: ['track.statusCancelled','Cancelled'],
    returned: ['track.statusReturned','Returned'],
    delivery_failed: ['track.statusDeliveryFailed','Delivery failed'],
    failed_call_1: ['track.statusFailedCall1','Call failed (1)'],
    failed_call_2: ['track.statusFailedCall2','Call failed (2)'],
    failed_call_3: ['track.statusFailedCall3','Call failed (3)'],
  };
  const statusLabel = (s) => {
    if (statusMap[s]?.label) return statusMap[s].label;
    const k = STATUS_I18N[s];
    if (k) return t(k[0], k[1]);
    return (s || '').replace(/_/g, ' ');
  };
  const PAYMENT_LABEL = {
    cod: t('track.paymentCod','Cash on delivery'),
    ccp: t('track.paymentCcp','CCP'),
    baridimob: t('track.paymentBaridiPay','BaridiPay'),
    bank_transfer: t('track.paymentBank','Bank transfer'),
    chargily: t('track.paymentChargily','Card (Chargily)'),
  };
  const paymentLabel = (m) => PAYMENT_LABEL[m] || (m || 'cod').replace(/_/g,' ');
  const PAYMENT_STATUS_LABEL = {
    paid: t('track.paid','Paid'),
    unpaid: t('track.unpaid','Unpaid'),
    pending: t('track.pending','Pending'),
    refunded: t('track.refunded','Refunded'),
  };
  const paymentStatusLabel = (s) => PAYMENT_STATUS_LABEL[s] || s || PAYMENT_STATUS_LABEL.unpaid;
  const statusChipStyle = (s) => {
    const cfg = statusMap[s];
    if (cfg?.color) return { backgroundColor: cfg.color + '33', color: cfg.color };
    return null;
  };
  const statusIcon = (s) => {
    if (s === 'delivered') return <Check size={12} />;
    if (s === 'shipped') return <Truck size={12} />;
    if (s === 'cancelled' || s === 'returned') return <Ban size={12} />;
    return <Clock size={12} />;
  };

  // Wait for store data to load before rendering to avoid color flash
  if (!storeReady) {
    return <div className="min-h-screen" style={{ background: '#020617' }} />;
  }

  // Tracking disabled → blocked screen
  if (!store.tracking_enabled) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4"><Ban size={22} className="text-gray-400"/></div>
        <h1 className="text-lg font-extrabold">{t('track.disabledTitle', 'Order tracking is disabled')}</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">{t('track.disabledDesc', 'This store has turned off public order tracking.')}</p>
        <Link to={`/s/${storeSlug}`} className="mt-6 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm font-bold">{t('common.back', 'Back')}</Link>
      </div>
    );
  }

  const method = store.tracking_search_method;
  const showPhoneInput = method === 'phone' || (method === 'both' && mode === 'phone');
  const showOrderInput = method === 'order_id' || (method === 'both' && mode === 'order_id');

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: store.tracking_bg || 'radial-gradient(circle at 20% 0%, #1e1b4b 0%, #0f172a 50%, #020617 100%)' }}>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle, ${pc}66 0%, transparent 70%)` }} />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20" style={{ background: `radial-gradient(circle, ${pc}88 0%, transparent 70%)` }} />

      <header className="relative z-10 sticky top-0 backdrop-blur-xl border-b border-white/10" style={{backgroundColor:pc}}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={`/s/${storeSlug}`} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0"><ArrowLeft size={16} /></Link>
          {store.logo
            ? <img src={store.logo} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: pc }}>{store.name?.[0] || 'S'}</div>}
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold truncate">{store.tracking_hero_title || t('track.title', 'Track your order')}</h1>
            <p className="text-[11px] text-gray-400 truncate">{store.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher variant="header"/>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Lookup card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}88)` }}>
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{t('track.findOrder', 'Find your order')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{store.tracking_hero_sub || t('track.desc', 'Enter the info you used at checkout.')}</p>
            </div>
          </div>

          {/* Tab switch when method === 'both' */}
          {method === 'both' && (
            <div className="mb-3 inline-flex rounded-xl bg-white/5 border border-white/10 p-1 text-xs">
              <button onClick={() => setMode('phone')} className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${mode === 'phone' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Phone size={12}/>{t('track.byPhone', 'By phone')}</button>
              <button onClick={() => setMode('order_id')} className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${mode === 'order_id' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Hash size={12}/>{t('track.byOrderId', 'By order ID')}</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              {showPhoneInput && (
                <>
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookup()}
                    placeholder="0555 12 34 56"
                    className="w-full pl-11 pr-3 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                    inputMode="tel"
                  />
                </>
              )}
              {showOrderInput && (
                <>
                  <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={orderIdInput}
                    onChange={e => setOrderIdInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookup()}
                    placeholder={t('track.orderIdPh', 'ORD-00123')}
                    className="w-full pl-11 pr-3 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                  />
                </>
              )}
            </div>
            <button onClick={lookup} disabled={loading} className="px-6 py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 4px 20px ${pc}44` }}>
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{t('track.searching', 'Searching…')}</>
                : <><Search size={14} />{t('track.lookup', 'Track')}</>}
            </button>
          </div>
        </div>

        {orders && orders.length === 0 && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Package size={24} className="text-gray-500" />
            </div>
            <p className="font-bold text-white">{t('track.noResultsTitle', 'No orders found')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('track.noResults', 'No orders matched that lookup.')}</p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">{orders.length} {orders.length === 1 ? t('track.orderFound', 'order found') : t('track.ordersFound', 'orders found')}</p>
            {orders.map(o => {
              const items = o.items || [];
              const chipInline = statusChipStyle(o.status);
              return (
                <div key={o.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/[0.07] transition-all">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-white text-sm truncate">{o.order_number}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1"><Clock size={10} />{new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${chipInline ? '' : (DEFAULT_STATUS_COLORS[o.status] || 'bg-gray-700/40 text-gray-300')}`}
                          style={chipInline || undefined}
                        >
                          {statusIcon(o.status)}{statusLabel(o.status)}
                        </span>
                        {store.tracking_show_price && (
                          <p className="text-lg font-extrabold text-white mt-1">{parseFloat(o.total || 0).toLocaleString()} {currency}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      {store.tracking_show_payment && <span className="flex items-center gap-1"><CreditCard size={10} />{paymentLabel(o.payment_method)}</span>}
                      {store.tracking_show_items && items.length > 0 && <span className="flex items-center gap-1"><Package size={10} />{items.length} {items.length === 1 ? t('track.item', 'item') : t('track.items', 'items')}</span>}
                      {store.tracking_show_tracking_number && o.tracking_number && <span className="font-mono text-cyan-300 flex items-center gap-1"><Hash size={10} />{o.tracking_number}</span>}
                    </div>

                    {store.tracking_show_timeline && (() => {
                      const cur = o.status || 'new_order';
                      const failed = FAIL.includes(cur);
                      const idx = stepIndexFor(cur);
                      const visible = PIPELINE.filter(s => !statusMap[s.key] || statusMap[s.key] !== undefined);
                      return (
                        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-1.5"><Truck size={11}/>{t('track.progress','Delivery progress')}</p>
                          {failed ? (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                              <Ban size={24} className="mx-auto text-red-400 mb-2"/>
                              <p className="text-sm font-bold text-red-300 capitalize">{statusMap[cur]?.label || cur.replace(/_/g,' ')}</p>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10 rounded-full"/>
                              <div className="absolute top-4 left-4 h-0.5 rounded-full transition-all duration-700" style={{ width: `calc(${Math.max(0, (idx/(visible.length-1))*100)}% - 32px)`, background: 'linear-gradient(to right, #10b981, #34d399)' }}/>
                              <div className="relative flex justify-between">
                                {visible.map((step, i) => {
                                  const Icon = step.icon;
                                  const done = i < idx;
                                  const active = i === idx;
                                  const cfg = statusMap[step.key];
                                  const label = cfg?.label || t(step.i18n, step.defaultLabel);
                                  const color = active ? (cfg?.color || pc) : null;
                                  return (
                                    <div key={step.key} className="flex flex-col items-center flex-1 min-w-0">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${active ? 'scale-110 shadow-lg' : done ? 'bg-emerald-500/80 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                        style={active ? { backgroundColor: color, borderColor: color, color: '#fff', boxShadow: `0 0 0 4px ${color}33` } : undefined}
                                      >
                                        {done && !active ? <Check size={13}/> : <Icon size={13}/>}
                                      </div>
                                      <p className={`text-[9px] sm:text-[10px] font-bold mt-2 text-center leading-tight truncate w-full px-0.5 ${active ? 'text-white' : done ? 'text-emerald-300' : 'text-gray-500'}`}>{label}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {store.tracking_show_items && items.length > 0 && (
                    <div className="border-t border-white/5 bg-white/[0.02] p-4 space-y-2">
                      {items.map((item, idx) => {
                        const img = item.product_image;
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            {img
                              ? <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-800 shrink-0" />
                              : <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0"><Package size={16} className="text-gray-600" /></div>}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.product_name || item.name}</p>
                              {item.variant_label && <p className="text-[10px] text-gray-500">{item.variant_label}</p>}
                              <p className="text-xs text-gray-400">{t('store.qty', 'Qty')}: {item.quantity}{store.tracking_show_price && <><span className="mx-1.5 text-gray-600">|</span>{parseFloat(item.price || item.unit_price || 0).toLocaleString()} {currency}</>}</p>
                            </div>
                            {store.tracking_show_price && <p className="text-sm font-bold text-white shrink-0">{(parseFloat(item.price || item.unit_price || 0) * (item.quantity || 1)).toLocaleString()} {currency}</p>}
                          </div>
                        );
                      })}

                      {store.tracking_show_price && (o.shipping_cost != null && parseFloat(o.shipping_cost) > 0) && (
                        <div className="flex items-center justify-between px-3 pt-2 text-xs text-gray-500"><span>{t('store.shipping', 'Shipping')}</span><span>{parseFloat(o.shipping_cost).toLocaleString()} {currency}</span></div>
                      )}
                      {store.tracking_show_price && (o.discount != null && parseFloat(o.discount) > 0) && (
                        <div className="flex items-center justify-between px-3 text-xs text-emerald-400"><span>{t('store.discount', 'Discount')}</span><span>-{parseFloat(o.discount).toLocaleString()} {currency}</span></div>
                      )}

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
                        {store.tracking_show_address && (
                          <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1"><MapPin size={10} />{t('store.shippingAddress', 'Shipping Address')}</p>
                            <p className="text-xs text-white/90">{o.shipping_address || '—'}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{[o.shipping_city, o.shipping_wilaya].filter(Boolean).join(', ')}</p>
                            {o.shipping_type && <p className="text-[11px] text-gray-400 mt-0.5">{o.shipping_type === 'home' ? t('store.homeDelivery', 'Home delivery') : t('store.deskDelivery', 'Desk delivery')}</p>}
                            {o.delivery_company && <p className="text-[11px] text-cyan-300 mt-1">{o.delivery_company}</p>}
                          </div>
                        )}
                        {store.tracking_show_payment && (
                          <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1"><Phone size={10} />{t('store.paymentContact', 'Payment & Contact')}</p>
                            <p className="text-xs text-white/90">{paymentLabel(o.payment_method)} · <span className={o.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>{paymentStatusLabel(o.payment_status)}</span></p>
                            <p className="text-[11px] text-gray-400 mt-1 font-mono">{o.customer_phone || ''}</p>
                            {o.customer_email && <p className="text-[11px] text-gray-400">{o.customer_email}</p>}
                          </div>
                        )}
                        {o.notes && (
                          <div className="sm:col-span-2 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                            <p className="text-[10px] font-bold text-blue-300 uppercase mb-1">{t('store.orderNotes', 'Order Notes')}</p>
                            <p className="text-xs text-blue-100">{o.notes}</p>
                          </div>
                        )}
                        {store.tracking_show_price && (
                          <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 p-3">
                            <span className="text-[11px] text-gray-400">{t('store.subtotal', 'Subtotal')}</span>
                            <span className="text-xs font-bold text-white">{parseFloat(o.subtotal || o.total || 0).toLocaleString()} {currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!orders && !loading && (
          <div className="mt-8 flex flex-col items-center text-center opacity-70">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border border-white/10 bg-white/5">
              <ShoppingBag size={30} style={{ color: pc }} />
            </div>
            <p className="text-sm text-gray-400 max-w-sm">{store.tracking_hero_sub || t('track.hint', 'Enter the info you used at checkout to see your delivery status and items.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
