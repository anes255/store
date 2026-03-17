import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useCartStore, useLangStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, ArrowLeft, X, Minus, Plus, CreditCard, Banknote, QrCode, Building, Trash2, Check, Lock } from 'lucide-react';

export default function Checkout() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useLangStore();
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    shipping_address: '', shipping_city: '', shipping_wilaya: '', shipping_zip: '',
    payment_method: 'cod', notes: '', coupon_code: '',
  });
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [step, setStep] = useState(1); // 1: cart, 2: info, 3: payment

  useEffect(() => {
    storeApi.getStore(storeSlug).then(r => setStore(r.data)).catch(() => {});
  }, [storeSlug]);

  const subtotal = getTotal();
  const shipping = store ? parseFloat(store.shipping_default_price || 0) : 0;
  const freeShipping = store?.free_shipping_threshold && subtotal >= store.free_shipping_threshold;
  const shippingCost = freeShipping ? 0 : shipping;
  const total = subtotal + shippingCost - couponDiscount;

  const validateCoupon = async () => {
    if (!form.coupon_code) return;
    try {
      const { data } = await storeApi.validateCoupon(storeSlug, { code: form.coupon_code, subtotal });
      setCouponDiscount(data.discount);
      toast.success(`Coupon applied! -${data.discount.toLocaleString()} DZD`);
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid coupon'); setCouponDiscount(0); }
  };

  const placeOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.shipping_address || !form.shipping_wilaya) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await storeApi.placeOrder(storeSlug, {
        ...form, items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, variant: i.variant })),
        coupon_code: form.coupon_code || undefined,
      });
      setOrderSuccess(data);
      clearCart();
    } catch (err) { toast.error(err.response?.data?.error || 'Order failed'); }
    setLoading(false);
  };

  if (!store) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="glass-card-solid p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t('store.orderSuccess')}</h2>
          <p className="text-gray-500 mb-4">Order #{orderSuccess.order_number}</p>
          <p className="text-3xl font-extrabold mb-6" style={{ color: store.primary_color }}>{parseFloat(orderSuccess.total).toLocaleString()} {store.currency || 'DZD'}</p>
          {orderSuccess.payment_method !== 'cod' && (
            <div className="p-4 bg-amber-50 rounded-xl mb-4 text-sm text-amber-700">
              Please complete your payment via {orderSuccess.payment_method.replace('_', ' ').toUpperCase()} to confirm your order.
              {store.enable_ccp && orderSuccess.payment_method === 'ccp' && <p className="mt-2 font-mono font-bold">{store.ccp_account} — {store.ccp_name}</p>}
            </div>
          )}
          <Link to={`/s/${storeSlug}`} className="btn-primary inline-flex">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    store.enable_cod && { key: 'cod', icon: Banknote, label: t('store.cod'), desc: 'Pay in cash upon delivery of your order' },
    store.enable_ccp && { key: 'ccp', icon: CreditCard, label: t('store.ccp'), desc: `Manual transfer to our CCP account` },
    store.enable_baridimob && { key: 'baridimob', icon: QrCode, label: t('store.baridimob'), desc: 'Quick scan & pay via BaridiMob app' },
    store.enable_bank_transfer && { key: 'bank_transfer', icon: Building, label: t('store.bankTransfer'), desc: 'Pay via Bank Transfer' },
  ].filter(Boolean);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 text-gray-600"><ArrowLeft size={18} /><span className="font-bold text-sm">Back</span></Link>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: store.primary_color }} />
            <span className="font-extrabold font-display">{t('store.orderNow')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: store.primary_color }}>
            <Lock size={12} />SECURE PAYMENT<span className="ml-2 text-gray-300">SSL SECURED</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex items-center gap-1 text-sm" style={{ color: store.primary_color }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">CASH ON DELIVERY AVAILABLE IN ALL 58 WILAYAS</span>
          </div>
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
            SAVE INFORMATION FOR NEXT TIME
          </label>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping Info */}
            <div className="glass-card-solid p-6">
              <h3 className="font-bold text-gray-900 mb-4">2. {t('store.shippingInfo')}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="input-label">{t('auth.name')} *</label><input className="input-field" value={form.customer_name} onChange={set('customer_name')} required /></div>
                  <div><label className="input-label">{t('auth.phone')} *</label><input className="input-field" value={form.customer_phone} onChange={set('customer_phone')} required /></div>
                </div>
                <div><label className="input-label">{t('auth.email')}</label><input type="email" className="input-field" value={form.customer_email} onChange={set('customer_email')} /></div>
                <div><label className="input-label">{t('auth.address')} *</label><input className="input-field" value={form.shipping_address} onChange={set('shipping_address')} required /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="input-label">{t('auth.city')}</label><input className="input-field" value={form.shipping_city} onChange={set('shipping_city')} /></div>
                  <div><label className="input-label">{t('auth.wilaya')} *</label><input className="input-field" value={form.shipping_wilaya} onChange={set('shipping_wilaya')} required /></div>
                  <div><label className="input-label">ZIP</label><input className="input-field" value={form.shipping_zip} onChange={set('shipping_zip')} /></div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card-solid p-6">
              <h3 className="font-bold text-gray-900 mb-4">3. {t('store.paymentMethod')}</h3>
              <div className="space-y-2">
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  const selected = form.payment_method === pm.key;
                  return (
                    <label key={pm.key} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${selected ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" value={pm.key} checked={selected} onChange={() => setForm({ ...form, payment_method: pm.key })} className="sr-only" />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{pm.label}</p>
                        <p className="text-xs text-gray-400">{pm.desc}</p>
                      </div>
                      {selected && <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-2">
            <div className="glass-card-solid p-6 sticky top-28">
              <h3 className="font-bold text-gray-900 mb-4">{t('store.orderSummary')}</h3>
              <div className="space-y-3 mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                    {item.image && <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(i, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Minus size={10} /></button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(i, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Plus size={10} /></button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()}</p>
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <input className="input-field text-sm flex-1" placeholder="Coupon code" value={form.coupon_code} onChange={set('coupon_code')} />
                <button onClick={validateCoupon} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200">Apply</button>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500">PRODUCT PRICE</span><span className="font-semibold">{subtotal.toLocaleString()} {store.currency || 'DZD'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">SHIPPING+</span><span className="font-semibold">{freeShipping ? 'FREE' : `${shippingCost.toLocaleString()} ${store.currency || 'DZD'}`}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">DISCOUNT</span><span className="text-emerald-600 font-semibold">-{couponDiscount.toLocaleString()} {store.currency || 'DZD'}</span></div>}
                <div className="flex justify-between font-extrabold text-xl pt-2 border-t">
                  <span>TOTAL TO PAY</span>
                  <span style={{ color: store?.primary_color }}>{total.toLocaleString()} {store?.currency || 'DZD'}</span>
                </div>
              </div>

              <button onClick={placeOrder} disabled={loading || items.length === 0}
                className="w-full mt-6 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg disabled:opacity-50"
                style={{ backgroundColor: store?.primary_color }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('store.placeOrder')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
