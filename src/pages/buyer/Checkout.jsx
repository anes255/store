import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi, paymentApi } from '../../utils/api';
import { useCartStore, useLangStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, ArrowLeft, X, Minus, Plus, CreditCard, Banknote, QrCode, Building, Trash2, Check, Lock, Upload, Copy, AlertTriangle, Smartphone, ArrowRight, Wifi } from 'lucide-react';

export default function Checkout() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null); // null=checkout, 'ccp','baridimob','bank_transfer','chargily'
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptRef, setReceiptRef] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    shipping_address: '', shipping_city: '', shipping_wilaya: '', shipping_zip: '',
    payment_method: 'cod', notes: '', coupon_code: '',
  });
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => { storeApi.getStore(storeSlug).then(r => setStore(r.data)).catch(() => {}); }, [storeSlug]);

  const subtotal = getTotal();
  const shipping = store ? parseFloat(store.shipping_default_price || 0) : 0;
  const total = subtotal + shipping - couponDiscount;
  const pc = store?.primary_color || '#7C3AED';

  const validateCoupon = async () => {
    if (!form.coupon_code) return;
    try { const { data } = await storeApi.validateCoupon(storeSlug, { code: form.coupon_code, subtotal }); setCouponDiscount(data.discount); toast.success(`-${data.discount.toLocaleString()} DZD`); }
    catch { toast.error('Invalid coupon'); setCouponDiscount(0); }
  };

  const handleReceiptUpload = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { setReceiptImage(r.result); toast.success('Receipt uploaded!'); };
    r.readAsDataURL(f);
  };

  const submitReceipt = async () => {
    if (!receiptImage) return toast.error('Please upload your receipt');
    if (!orderSuccess?.id) return;
    try {
      await paymentApi.uploadReceipt({ store_slug: storeSlug, order_id: orderSuccess.id, receipt_image: receiptImage, payment_method: form.payment_method, reference_number: receiptRef });
      toast.success('Receipt submitted! Will be verified within 24 hours.');
      setPaymentStep(null);
    } catch { toast.error('Upload failed'); }
  };

  const placeOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.shipping_address || !form.shipping_wilaya) return toast.error('Please fill all required fields');
    setLoading(true);
    try {
      const { data } = await storeApi.placeOrder(storeSlug, { ...form, items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, variant: i.variant })) });
      setOrderSuccess(data);
      clearCart();
      // If non-COD method, show payment step
      if (form.payment_method !== 'cod') setPaymentStep(form.payment_method);
    } catch (err) { toast.error(err.response?.data?.error || 'Order failed'); }
    setLoading(false);
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  if (!store) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>;

  // ═══════ PAYMENT INSTRUCTION PAGES ═══════
  if (orderSuccess && paymentStep) {
    const orderNum = orderSuccess.order_number;
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-30 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="font-bold text-sm text-gray-700">Complete Payment</span>
            <button onClick={() => { setPaymentStep(null); navigate(`/s/${storeSlug}`); }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{backgroundColor: pc + '20'}}><CreditCard size={28} style={{color: pc}}/></div>
            <h2 className="text-xl font-black text-gray-900">Order {orderNum} Placed!</h2>
            <p className="text-3xl font-black mt-2" style={{color: pc}}>{parseFloat(orderSuccess.total).toLocaleString()} DZD</p>
          </div>

          {/* CCP Payment */}
          {paymentStep === 'ccp' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CreditCard size={20} className="text-amber-600"/></div><div><h3 className="font-bold text-gray-900">CCP Transfer</h3><p className="text-xs text-gray-400">Transfer to our CCP account</p></div></div>
              <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">CCP Account</span><div className="flex items-center gap-2"><span className="font-mono font-bold text-lg">{store.ccp_account || 'N/A'}</span><button onClick={() => copyToClipboard(store.ccp_account || '')} className="p-1 hover:bg-amber-100 rounded"><Copy size={14}/></button></div></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Account Name</span><span className="font-bold">{store.ccp_name || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Amount</span><span className="font-black text-lg" style={{color: pc}}>{parseFloat(orderSuccess.total).toLocaleString()} DZD</span></div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-700">After transferring, upload your CCP receipt below to confirm your payment.</p></div>
              <div><label className="input-label text-xs">Reference Number (optional)</label><input className="input-field" value={receiptRef} onChange={e => setReceiptRef(e.target.value)} placeholder="CCP transfer reference"/></div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-colors" onClick={() => document.getElementById('receipt-upload').click()}>
                {receiptImage ? <div><img src={receiptImage} className="max-h-40 mx-auto rounded-lg mb-2" alt=""/><p className="text-xs text-emerald-600 font-bold">✓ Receipt uploaded</p></div> : <div><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">Click to upload receipt photo</p></div>}
              </div>
              <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
              <button onClick={submitReceipt} className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{backgroundColor: pc}}>Submit Receipt <ArrowRight size={16}/></button>
            </div>
          )}

          {/* BaridiMob Payment */}
          {paymentStep === 'baridimob' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Smartphone size={20} className="text-emerald-600"/></div><div><h3 className="font-bold text-gray-900">BaridiMob Payment</h3><p className="text-xs text-gray-400">Pay via BaridiMob app</p></div></div>
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">RIP Number</span><div className="flex items-center gap-2"><span className="font-mono font-bold">{store.baridimob_rip || 'N/A'}</span><button onClick={() => copyToClipboard(store.baridimob_rip || '')} className="p-1 hover:bg-emerald-100 rounded"><Copy size={14}/></button></div></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Amount</span><span className="font-black text-lg" style={{color: pc}}>{parseFloat(orderSuccess.total).toLocaleString()} DZD</span></div>
              </div>
              {store.baridimob_qr && <div className="text-center p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">Scan to Pay</p><img src={store.baridimob_qr} className="max-w-[200px] mx-auto rounded-xl border" alt="BaridiMob QR"/></div>}
              <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-bold text-gray-500 mb-2">Steps:</p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Open BaridiMob app on your phone</li>
                  {store.baridimob_qr ? <li>2. Scan the QR code above OR transfer to RIP manually</li> : <li>2. Go to "Transfer" → "Transfer to RIP"</li>}
                  <li>3. Enter the exact amount: {parseFloat(orderSuccess.total).toLocaleString()} DZD</li>
                  <li>4. Confirm and screenshot your receipt</li>
                </ol>
              </div>
              <div><label className="input-label text-xs">Transaction Reference</label><input className="input-field" value={receiptRef} onChange={e => setReceiptRef(e.target.value)} placeholder="BaridiMob transaction ID"/></div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => document.getElementById('receipt-upload').click()}>
                {receiptImage ? <div><img src={receiptImage} className="max-h-40 mx-auto rounded-lg mb-2" alt=""/><p className="text-xs text-emerald-600 font-bold">✓ Receipt uploaded</p></div> : <div><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">Upload your BaridiMob receipt</p></div>}
              </div>
              <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
              <button onClick={submitReceipt} className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{backgroundColor: pc}}>Submit Receipt <ArrowRight size={16}/></button>
            </div>
          )}

          {/* Bank Transfer - Under Development */}
          {paymentStep === 'bank_transfer' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Building size={20} className="text-gray-500"/></div><div><h3 className="font-bold text-gray-900">Bank Transfer</h3><p className="text-xs text-gray-400">Direct bank wire</p></div></div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3"/>
                <h3 className="font-bold text-amber-800 text-lg mb-2">Under Development</h3>
                <p className="text-sm text-amber-700">Bank transfer payment is currently being set up. Please use CCP, BaridiMob, or Cash on Delivery for now.</p>
                <p className="text-xs text-amber-600 mt-3">We apologize for the inconvenience. This feature will be available soon.</p>
              </div>
              <button onClick={() => { setPaymentStep(null); navigate(`/s/${storeSlug}`); }} className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Back to Store</button>
            </div>
          )}

          {/* Chargily - Online Card */}
          {paymentStep === 'chargily' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><Wifi size={20} className="text-brand-600"/></div><div><h3 className="font-bold text-gray-900">Online Card Payment</h3><p className="text-xs text-gray-400">Pay with Edahabia or CIB card</p></div></div>
              <p className="text-sm text-gray-500">You will be redirected to a secure payment page to complete your transaction.</p>
              <button onClick={async () => {
                try { const { data } = await paymentApi.chargilyCheckout({ store_slug: storeSlug, order_id: orderSuccess.id }); window.location.href = data.checkoutUrl; }
                catch { toast.error('Payment gateway unavailable'); }
              }} className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{backgroundColor: pc}}>Pay Now with Card <ArrowRight size={16}/></button>
            </div>
          )}

          <button onClick={() => { setPaymentStep(null); navigate(`/s/${storeSlug}`); }} className="w-full mt-4 py-3 text-center text-sm text-gray-500 hover:text-gray-700">Skip — I'll pay later</button>
        </div>
      </div>
    );
  }

  // ═══════ SUCCESS PAGE (COD) ═══════
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"><Check size={36} className="text-emerald-600"/></div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t('store.orderSuccess')}</h2>
          <p className="text-gray-500 mb-4">Order #{orderSuccess.order_number}</p>
          <p className="text-3xl font-extrabold mb-2" style={{ color: pc }}>{parseFloat(orderSuccess.total).toLocaleString()} {store.currency || 'DZD'}</p>
          <p className="text-sm text-gray-400 mb-6">Cash on Delivery — Pay when you receive your order</p>
          <Link to={`/s/${storeSlug}`} className="inline-flex px-8 py-3 rounded-xl text-white font-bold" style={{backgroundColor: pc}}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  // ═══════ MAIN CHECKOUT ═══════
  const paymentMethods = [
    store.enable_cod && { key: 'cod', icon: Banknote, label: 'Cash on Delivery', desc: 'Pay in cash upon delivery', color: 'emerald' },
    store.enable_ccp && { key: 'ccp', icon: CreditCard, label: 'CCP Transfer', desc: `Transfer to CCP: ${store.ccp_account || ''}`, color: 'amber' },
    store.enable_baridimob && { key: 'baridimob', icon: QrCode, label: 'BaridiMob', desc: 'Pay via BaridiMob app', color: 'green' },
    store.enable_chargily && { key: 'chargily', icon: Wifi, label: 'Edahabia / CIB Card', desc: 'Pay online with your bank card', color: 'brand' },
    store.enable_bank_transfer && { key: 'bank_transfer', icon: Building, label: 'Bank Transfer', desc: 'Under development', color: 'gray', disabled: true },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 text-gray-600"><ArrowLeft size={18}/><span className="font-bold text-sm">Back</span></Link>
          <div className="flex items-center gap-2"><ShoppingCart size={18} style={{color: pc}}/><span className="font-extrabold">{t('store.orderNow')}</span></div>
          <div className="flex items-center gap-1 text-xs font-bold" style={{color: pc}}><Lock size={12}/>SECURE</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{backgroundColor:pc}}>1</span>Shipping Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="input-label">{t('auth.name')} *</label><input className="input-field" value={form.customer_name} onChange={set('customer_name')}/></div>
                  <div><label className="input-label">{t('auth.phone')} *</label><input className="input-field" value={form.customer_phone} onChange={set('customer_phone')}/></div>
                </div>
                <div><label className="input-label">{t('auth.email')}</label><input type="email" className="input-field" value={form.customer_email} onChange={set('customer_email')}/></div>
                <div><label className="input-label">{t('auth.address')} *</label><input className="input-field" value={form.shipping_address} onChange={set('shipping_address')}/></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="input-label">{t('auth.city')}</label><input className="input-field" value={form.shipping_city} onChange={set('shipping_city')}/></div>
                  <div><label className="input-label">{t('auth.wilaya')} *</label><select className="input-field" value={form.shipping_wilaya} onChange={set('shipping_wilaya')}><option value="">Select...</option>{["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane"].map(w=><option key={w} value={w}>{w}</option>)}</select></div>
                  <div><label className="input-label">ZIP</label><input className="input-field" value={form.shipping_zip} onChange={set('shipping_zip')}/></div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{backgroundColor:pc}}>2</span>Payment Method</h3>
              <div className="space-y-2">
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  const selected = form.payment_method === pm.key;
                  return (
                    <label key={pm.key} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${pm.disabled ? 'opacity-50 cursor-not-allowed border-gray-100' : selected ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`} onClick={pm.disabled ? (e) => e.preventDefault() : undefined}>
                      <input type="radio" name="payment" value={pm.key} checked={selected} onChange={() => !pm.disabled && setForm({ ...form, payment_method: pm.key })} className="sr-only" disabled={pm.disabled}/>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={selected ? {backgroundColor: pc} : {}}>
                        <Icon size={18}/>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{pm.label}</p>
                        <p className="text-xs text-gray-400">{pm.desc}</p>
                      </div>
                      {pm.disabled && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">COMING SOON</span>}
                      {selected && !pm.disabled && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: pc}}><Check size={12} className="text-white"/></div>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">{t('store.orderSummary')}</h3>
              <div className="space-y-3 mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                    {item.image && <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt=""/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(i, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Minus size={10}/></button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(i, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Plus size={10}/></button>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()}</p><button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-4"><input className="input-field text-sm flex-1" placeholder="Coupon code" value={form.coupon_code} onChange={set('coupon_code')}/><button onClick={validateCoupon} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200">Apply</button></div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{subtotal.toLocaleString()} {store.currency||'DZD'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="font-semibold">{shipping.toLocaleString()} {store.currency||'DZD'}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-emerald-600 font-semibold">-{couponDiscount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-extrabold text-xl pt-2 border-t"><span>Total</span><span style={{color: pc}}>{total.toLocaleString()} {store.currency||'DZD'}</span></div>
              </div>
              <button onClick={placeOrder} disabled={loading || items.length === 0} className="w-full mt-6 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:opacity-90 transition-all" style={{backgroundColor: pc}}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>{t('store.placeOrder')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
