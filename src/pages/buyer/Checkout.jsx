import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi, paymentApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore } from '../../hooks/useStore';
import i18n from '../../i18n';
import toast from 'react-hot-toast';
import { ShoppingCart, ArrowLeft, X, Minus, Plus, CreditCard, Banknote, QrCode, Building, Trash2, Check, Lock, Upload, Copy, AlertTriangle, Smartphone, ArrowRight, Wifi, User, Heart, Globe } from 'lucide-react';

// Algerian phone validator: accepts 0[567]xxxxxxxx or +213[567]xxxxxxxx
export function isValidAlgerianPhone(p) {
  if (!p) return false;
  const cleaned = String(p).replace(/[\s.-]/g, '');
  return /^(0[567]\d{8}|\+?213[567]\d{8})$/.test(cleaned);
}
import WILAYA_CITIES from '../../data/wilayaCities';
import { bilingualLabel } from '../../data/wilayaTranslations';
import { trackPurchase, trackInitiateCheckout, initPixels } from '../../utils/trackingPixels';

// Stable wrapper component defined at module level so it doesn't unmount on every parent re-render.
function ShellWrapper({ isModal, onClose, children }) {
  return isModal
    ? (<div className="fixed inset-0 z-[100] flex items-stretch justify-end bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
         <div className="w-full max-w-3xl bg-gray-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
           {children}
         </div>
       </div>)
    : (<div className="min-h-screen bg-gray-50">{children}</div>);
}

// directItems: optional array of items for "Buy Now" flow (skips cart).
// Each item: { product_id, name, price, image, quantity, variant }
export default function Checkout({ isModal = false, onClose, storeSlug: storeSlugProp, directItems = null }) {
  const params = useParams();
  const storeSlug = storeSlugProp || params.storeSlug;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const closeOrGoHome = () => { if (isModal) onClose?.(); else navigate(`/s/${storeSlug}`); };
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isModal]);
  const cartStore = useCartStore();
  // "Buy Now" uses directItems; regular checkout uses the cart store.
  const isBuyNow = !!directItems;
  const [buyNowItems, setBuyNowItems] = useState(directItems || []);
  const items = isBuyNow ? buyNowItems : cartStore.items;
  const removeItem = (idx) => { if (isBuyNow) setBuyNowItems(prev => prev.filter((_,i)=>i!==idx)); else cartStore.removeItem(idx); };
  const updateQuantity = (idx, qty) => { if (isBuyNow) setBuyNowItems(prev => { const n=[...prev]; n[idx]={...n[idx],quantity:Math.max(1,qty)}; return n; }); else cartStore.updateQuantity(idx, qty); };
  const clearItems = () => { if (isBuyNow) setBuyNowItems([]); else cartStore.clearCart(); };
  const getTotal = () => items.reduce((s,i) => s + (i.price||0) * (i.quantity||1), 0);

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null); // null=checkout, 'ccp','baridimob','bank_transfer','chargily'
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptRef, setReceiptRef] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    shipping_address: '', shipping_city: '', shipping_wilaya: '', shipping_zip: '',
    shipping_type: 'desk', // 'desk' (to desk/relay point) or 'home' (domicile)
    payment_method: 'cod', notes: '', coupon_code: '',
    notification_preference: 'whatsapp',
  });
  const [saveInfo, setSaveInfo] = useState(() => localStorage.getItem('checkout.saveInfo') === '1');

  // Auto-load saved info on first mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('checkout.savedInfo') || 'null');
      if (saved && typeof saved === 'object') setForm(prev => ({ ...prev, ...saved }));
    } catch {}
  }, []);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [shippingWilayas, setShippingWilayas] = useState([]); // per-wilaya rates from admin
  const [selectedWilayaData, setSelectedWilayaData] = useState(null); // current wilaya's rate row

  useEffect(() => { storeApi.getStore(storeSlug).then(r => { setStore(r.data); try { initPixels(r.data?.tracking_pixels); trackInitiateCheckout(r.data?.tracking_pixels, items, items.reduce((s,i)=>s+Number(i.price||0)*Number(i.quantity||1),0)); } catch {} }).catch(() => {}); }, [storeSlug]); // eslint-disable-line
  // Load shipping wilayas for real pricing
  useEffect(() => {
    if (!storeSlug) return;
    storeApi.getShippingWilayas(storeSlug).then(r => { if (Array.isArray(r.data)) setShippingWilayas(r.data); }).catch(() => {});
  }, [storeSlug]);
  // Wilaya code lookup for zip auto-fill (works even when API fails)
  const WILAYA_CODES={'Adrar':'01','Chlef':'02','Laghouat':'03','Oum El Bouaghi':'04','Batna':'05','Béjaïa':'06','Biskra':'07','Béchar':'08','Blida':'09','Bouira':'10','Tamanrasset':'11','Tébessa':'12','Tlemcen':'13','Tiaret':'14','Tizi Ouzou':'15','Alger':'16','Djelfa':'17','Jijel':'18','Sétif':'19','Saïda':'20','Skikda':'21','Sidi Bel Abbès':'22','Annaba':'23','Guelma':'24','Constantine':'25','Médéa':'26','Mostaganem':'27',"M'Sila":'28','Mascara':'29','Ouargla':'30','Oran':'31','El Bayadh':'32','Illizi':'33','Bordj Bou Arréridj':'34','Boumerdès':'35','El Tarf':'36','Tindouf':'37','Tissemsilt':'38','El Oued':'39','Khenchela':'40','Souk Ahras':'41','Tipaza':'42','Mila':'43','Aïn Defla':'44','Naâma':'45','Aïn Témouchent':'46','Ghardaïa':'47','Relizane':'48'};
  // When wilaya changes, update selected wilaya data and auto-fill zip
  useEffect(() => {
    if (!form.shipping_wilaya) { setSelectedWilayaData(null); return; }
    const match = shippingWilayas.find(w => w.wilaya_name === form.shipping_wilaya);
    setSelectedWilayaData(match || null);
    // Auto-fill zip from wilaya code
    const code = match?.wilaya_code || WILAYA_CODES[form.shipping_wilaya] || '';
    if (code && !form.shipping_zip) setForm(prev => ({ ...prev, shipping_zip: code.padStart(2,'0') + '000' }));
  }, [form.shipping_wilaya, shippingWilayas]);

  // Sync cart to backend for abandoned cart recovery
  useEffect(() => {
    if (!form.customer_phone || form.customer_phone.length < 8 || !items.length || !storeSlug) return;
    const timer = setTimeout(() => {
      const cartItems = items.map(i => ({ product_id: i.product_id || i.id, name: i.name || i.name_en, price: i.price, quantity: i.quantity, variant: i.variant || null }));
      storeApi.saveCart(storeSlug, { customer_phone: form.customer_phone, customer_name: form.customer_name, customer_email: form.customer_email || '', items: cartItems }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [form.customer_phone, form.customer_name, form.customer_email, items, storeSlug]);

  // For registered customers, auto-save cart on mount and whenever items change
  useEffect(() => {
    if (isBuyNow || !items.length || !storeSlug) return;
    const auth = useAuthStore.getState();
    if (auth.role !== 'customer' || !auth.user?.phone) return;
    const timer = setTimeout(() => {
      const cartItems = items.map(i => ({ product_id: i.product_id || i.id, name: i.name || i.name_en, price: i.price, quantity: i.quantity, variant: i.variant || null }));
      storeApi.saveCart(storeSlug, { customer_phone: auth.user.phone, customer_name: auth.user.name || '', customer_email: auth.user.email || '', items: cartItems }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [items, storeSlug, isBuyNow]);

  const subtotal = getTotal();
  // Use per-wilaya shipping price (desk vs home), fall back to store default
  const shipping = selectedWilayaData
    ? parseFloat(form.shipping_type === 'home' ? selectedWilayaData.home_delivery_price : selectedWilayaData.desk_delivery_price) || 0
    : (store ? parseFloat(store.shipping_default_price || 0) : 0);
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
    const emailRequired = store?.checkout_email === true;
    // Field-specific errors so the message matches the actual missing field.
    if (!form.customer_name) return toast.error(t('checkout.errName', 'Please enter your name'));
    if (!form.customer_phone) return toast.error(t('checkout.errPhone', 'Please enter your phone number'));
    if (!isValidAlgerianPhone(form.customer_phone)) return toast.error(t('checkout.errPhoneAlg', 'Please enter a valid Algerian phone (e.g. 0555123456)'));
    if (emailRequired && !form.customer_email) return toast.error(t('checkout.errEmail', 'Please enter your email'));
    if (form.customer_email && !/^\S+@\S+\.\S+$/.test(form.customer_email)) return toast.error(t('checkout.errEmailFormat', 'Please enter a valid email address'));
    if (!form.shipping_address) return toast.error(t('checkout.errAddress', 'Please enter your shipping address'));
    if (!form.shipping_wilaya) return toast.error(t('checkout.errWilaya', 'Please choose your wilaya'));
    if (saveInfo) {
      try {
        const { coupon_code, notes, ...persist } = form;
        localStorage.setItem('checkout.savedInfo', JSON.stringify(persist));
        localStorage.setItem('checkout.saveInfo', '1');
      } catch {}
    } else {
      localStorage.removeItem('checkout.savedInfo');
      localStorage.removeItem('checkout.saveInfo');
    }
    setLoading(true);
    try {
      const authUser = useAuthStore.getState().user;
      const authRole = useAuthStore.getState().role;
      const customer_id = authRole === 'customer' && authUser?.id ? authUser.id : undefined;
      const { data } = await storeApi.placeOrder(storeSlug, { ...form, shipping_type: form.shipping_type, customer_id, items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, variant: i.variant })) });
      setOrderSuccess(data);
      try { trackPurchase(store?.tracking_pixels, { ...data, items, customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email }); } catch {}
      clearItems();
      // If non-COD method, show payment step
      if (form.payment_method !== 'cod') setPaymentStep(form.payment_method);
    } catch (err) { toast.error(err.response?.data?.error || 'Order failed'); }
    setLoading(false);
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // Wrapper that renders as full page or modal depending on isModal.
  // IMPORTANT: must be a stable function reference (not re-created on every render)
  // so React doesn't unmount its children on each keystroke, which would blur inputs.
  const Shell = ShellWrapper;
  const shellProps = { isModal, onClose };

  if (!store) return <Shell {...shellProps}><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div></Shell>;

  // ═══════ PAYMENT INSTRUCTION PAGES ═══════
  if (orderSuccess && paymentStep) {
    const orderNum = orderSuccess.order_number;
    return (
      <Shell {...shellProps}>
        <header className="bg-white border-b sticky top-0 z-30 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="font-bold text-sm text-gray-700">Complete Payment</span>
            <button onClick={() => { setPaymentStep(null); closeOrGoHome(); }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
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
              <button onClick={() => { setPaymentStep(null); closeOrGoHome(); }} className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Back to Store</button>
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

          <button onClick={() => { setPaymentStep(null); closeOrGoHome(); }} className="w-full mt-4 py-3 text-center text-sm text-gray-500 hover:text-gray-700">Skip — I'll pay later</button>
        </div>
      </Shell>
    );
  }

  // ═══════ SUCCESS PAGE (COD) ═══════
  if (orderSuccess) {
    return (
      <Shell {...shellProps}>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"><Check size={36} className="text-emerald-600"/></div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{store.success_message || t('store.orderSuccess')}</h2>
            <p className="text-gray-500 mb-4">Order #{orderSuccess.order_number}</p>
            {Array.isArray(orderSuccess.items) && orderSuccess.items.length > 0 && (
              <div className="mb-4 text-left bg-gray-50 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                {orderSuccess.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate mr-2">{it.product_name} × {it.quantity}</span>
                    <span className="font-semibold text-gray-900 shrink-0">{parseFloat(it.total_price || (it.unit_price * it.quantity) || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-3xl font-extrabold mb-2" style={{ color: pc }}>{parseFloat(orderSuccess.total).toLocaleString()} {store.currency || 'DZD'}</p>
            <p className="text-sm text-gray-400 mb-6">Cash on Delivery — Pay when you receive your order</p>
            {isModal
              ? <button onClick={onClose} className="inline-flex px-8 py-3 rounded-xl text-white font-bold" style={{backgroundColor: pc}}>Continue Shopping</button>
              : <Link to={`/s/${storeSlug}`} className="inline-flex px-8 py-3 rounded-xl text-white font-bold" style={{backgroundColor: pc}}>Continue Shopping</Link>}
          </div>
        </div>
      </Shell>
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
    <Shell {...shellProps}>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {isModal ? (
            <div className="flex items-center gap-2.5">
              <ShoppingCart size={22} style={{color:pc}}/>
              <span className="text-lg font-extrabold text-gray-900">Your Cart</span>
              {items.length>0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{backgroundColor:pc}}>{items.length}</span>}
            </div>
          ) : (
            <Link to={`/s/${storeSlug}`} className="flex items-center gap-2.5">
              {store?.logo ? <img src={store.logo} className="w-9 h-9 rounded-lg object-cover" alt=""/> : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
              <span className="text-lg font-extrabold text-gray-900">{store?.name||'Store'}</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {/* Language switcher (visible on the checkout page) */}
            <div className="flex items-center bg-gray-100 rounded-full p-0.5 mr-1">
              <Globe size={14} className="text-gray-500 ml-2" />
              {[{c:'en',l:'EN'},{c:'fr',l:'FR'},{c:'ar',l:'AR'}].map(L => (
                <button key={L.c} onClick={() => i18n.changeLanguage(L.c)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold ${i18n.language?.startsWith(L.c) ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {L.l}
                </button>
              ))}
            </div>
            {isModal ? (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            ) : (<>
              <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft size={14}/>Store</Link>
              <Link to={`/s/${storeSlug}/auth`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><User size={20}/></Link>
              <Link to={`/s/${storeSlug}/favorites`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Heart size={20}/></Link>
              <div className="p-2 text-gray-500 relative"><ShoppingCart size={20} style={{color:pc}}/>{items.length>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{items.length}</span>}</div>
            </>)}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stacked layout: shipping → payment → updates → summary, one under the other */}
        <div className="space-y-6">
          <div className="space-y-6">
            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('checkout.shippingInfo','Shipping Information')}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="input-label">{t('auth.name')} *</label><input className="input-field" value={form.customer_name} onChange={set('customer_name')}/></div>
                  <div><label className="input-label">{t('auth.phone')} *</label><input className="input-field" value={form.customer_phone} onChange={set('customer_phone')}/></div>
                </div>
                {store?.checkout_email!==false && <div><label className="input-label">{t('auth.email')}{store?.checkout_email===true?' *':''}</label><input type="email" className="input-field" value={form.customer_email} onChange={set('customer_email')} placeholder="email@example.com" required={store?.checkout_email===true}/></div>}
                <div><label className="input-label">{t('auth.address')} *</label><input className="input-field" value={form.shipping_address} onChange={set('shipping_address')}/></div>

                {/* Wilaya → City → ZIP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">{t('auth.wilaya')} *</label>
                    <select className="input-field" value={form.shipping_wilaya} onChange={e => {
                      const w = e.target.value;
                      setForm(prev => ({ ...prev, shipping_wilaya: w, shipping_city: '', shipping_zip: '' }));
                    }}>
                      <option value="">{t('checkout.selectWilaya','Select wilaya...')}</option>
                      {(shippingWilayas.length ? shippingWilayas.filter(w=>w.is_active!==false) :[{wilaya_name:'Adrar',wilaya_code:'01'},{wilaya_name:'Chlef',wilaya_code:'02'},{wilaya_name:'Laghouat',wilaya_code:'03'},{wilaya_name:'Oum El Bouaghi',wilaya_code:'04'},{wilaya_name:'Batna',wilaya_code:'05'},{wilaya_name:'Béjaïa',wilaya_code:'06'},{wilaya_name:'Biskra',wilaya_code:'07'},{wilaya_name:'Béchar',wilaya_code:'08'},{wilaya_name:'Blida',wilaya_code:'09'},{wilaya_name:'Bouira',wilaya_code:'10'},{wilaya_name:'Tamanrasset',wilaya_code:'11'},{wilaya_name:'Tébessa',wilaya_code:'12'},{wilaya_name:'Tlemcen',wilaya_code:'13'},{wilaya_name:'Tiaret',wilaya_code:'14'},{wilaya_name:'Tizi Ouzou',wilaya_code:'15'},{wilaya_name:'Alger',wilaya_code:'16'},{wilaya_name:'Djelfa',wilaya_code:'17'},{wilaya_name:'Jijel',wilaya_code:'18'},{wilaya_name:'Sétif',wilaya_code:'19'},{wilaya_name:'Saïda',wilaya_code:'20'},{wilaya_name:'Skikda',wilaya_code:'21'},{wilaya_name:'Sidi Bel Abbès',wilaya_code:'22'},{wilaya_name:'Annaba',wilaya_code:'23'},{wilaya_name:'Guelma',wilaya_code:'24'},{wilaya_name:'Constantine',wilaya_code:'25'},{wilaya_name:'Médéa',wilaya_code:'26'},{wilaya_name:'Mostaganem',wilaya_code:'27'},{wilaya_name:"M'Sila",wilaya_code:'28'},{wilaya_name:'Mascara',wilaya_code:'29'},{wilaya_name:'Ouargla',wilaya_code:'30'},{wilaya_name:'Oran',wilaya_code:'31'},{wilaya_name:'El Bayadh',wilaya_code:'32'},{wilaya_name:'Illizi',wilaya_code:'33'},{wilaya_name:'Bordj Bou Arréridj',wilaya_code:'34'},{wilaya_name:'Boumerdès',wilaya_code:'35'},{wilaya_name:'El Tarf',wilaya_code:'36'},{wilaya_name:'Tindouf',wilaya_code:'37'},{wilaya_name:'Tissemsilt',wilaya_code:'38'},{wilaya_name:'El Oued',wilaya_code:'39'},{wilaya_name:'Khenchela',wilaya_code:'40'},{wilaya_name:'Souk Ahras',wilaya_code:'41'},{wilaya_name:'Tipaza',wilaya_code:'42'},{wilaya_name:'Mila',wilaya_code:'43'},{wilaya_name:'Aïn Defla',wilaya_code:'44'},{wilaya_name:'Naâma',wilaya_code:'45'},{wilaya_name:'Aïn Témouchent',wilaya_code:'46'},{wilaya_name:'Ghardaïa',wilaya_code:'47'},{wilaya_name:'Relizane',wilaya_code:'48'}]).map(w => (
                        <option key={w.wilaya_code} value={w.wilaya_name} disabled={w.is_active===false}>{w.is_active===false?'(Inactive) ':''}{w.wilaya_code} - {bilingualLabel(w.wilaya_name)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">{t('auth.city','City')} *</label>
                    <select className="input-field" value={form.shipping_city} onChange={e => {
                      const city = e.target.value;
                      const wCode = selectedWilayaData?.wilaya_code || shippingWilayas.find(w=>w.wilaya_name===form.shipping_wilaya)?.wilaya_code || WILAYA_CODES[form.shipping_wilaya] || '';
                      // Postal codes: first 2 digits = wilaya, last 3 = commune (derived deterministically from city index within the wilaya).
                      const cities = WILAYA_CITIES[form.shipping_wilaya] || [form.shipping_wilaya];
                      const idx = Math.max(0, cities.indexOf(city));
                      const commune = String((idx + 1) * 50).padStart(3, '0');
                      setForm(prev => ({ ...prev, shipping_city: city, shipping_zip: wCode ? wCode.padStart(2,'0') + commune : '' }));
                    }} disabled={!form.shipping_wilaya}>
                      <option value="">{form.shipping_wilaya ? t('checkout.selectCity','Select city...') : t('checkout.selectWilayaFirst','Select wilaya first')}</option>
                      {form.shipping_wilaya && (WILAYA_CITIES[form.shipping_wilaya] || [form.shipping_wilaya]).map(c => (
                        <option key={c} value={c}>{bilingualLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">ZIP</label>
                    <input className="input-field bg-gray-50" value={form.shipping_zip} onChange={set('shipping_zip')} placeholder="Auto-filled"/>
                  </div>
                </div>

                {/* Desk vs Home delivery toggle */}
                {selectedWilayaData && (
                  <div>
                    <label className="input-label mb-2">{t('checkout.deliveryType','Delivery Type')} *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'desk', label: t('checkout.deskDelivery','Desk / Relay Point'), price: parseFloat(selectedWilayaData.desk_delivery_price)||0, icon: '🏢' },
                        { key: 'home', label: t('checkout.homeDelivery','Home Delivery'), price: parseFloat(selectedWilayaData.home_delivery_price)||0, icon: '🏠' },
                      ].map(dt => {
                        const sel = form.shipping_type === dt.key;
                        return (
                          <label key={dt.key} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${sel ? 'shadow-sm' : 'border-gray-100 hover:border-gray-200'}`} style={sel ? { borderColor: pc, backgroundColor: pc + '08' } : {}}>
                            <input type="radio" name="shipping_type" value={dt.key} checked={sel} onChange={() => setForm(prev => ({ ...prev, shipping_type: dt.key }))} className="sr-only"/>
                            <span className="text-xl">{dt.icon}</span>
                            <div className="flex-1">
                              <p className="font-bold text-sm text-gray-800">{dt.label}</p>
                              <p className="text-xs text-gray-400">{selectedWilayaData.delivery_days || '?'} {t('checkout.days','days')}</p>
                            </div>
                            <span className="font-extrabold text-sm" style={sel ? { color: pc } : { color: '#6B7280' }}>{dt.price.toLocaleString()} {store?.currency||'DZD'}</span>
                            {sel && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: pc}}><Check size={12} className="text-white"/></div>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('checkout.paymentMethod','Payment Method')}</h3>
              <div className="space-y-2">
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  const selected = form.payment_method === pm.key;
                  return (
                    <label key={pm.key} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${pm.disabled ? 'opacity-50 cursor-not-allowed border-gray-100 bg-white' : selected ? 'shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`} style={selected && !pm.disabled ? {borderColor: pc, backgroundColor: pc + '1A'} : undefined} onClick={pm.disabled ? (e) => e.preventDefault() : undefined}>
                      <input type="radio" name="payment" value={pm.key} checked={selected} onChange={() => !pm.disabled && setForm({ ...form, payment_method: pm.key })} className="sr-only" disabled={pm.disabled}/>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={selected ? {backgroundColor: pc} : {}}>
                        <Icon size={18}/>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{pm.label}</p>
                        <p className="text-xs text-gray-600">{pm.desc}</p>
                      </div>
                      {pm.disabled && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">COMING SOON</span>}
                      {selected && !pm.disabled && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: pc}}><Check size={12} className="text-white"/></div>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notification Preference */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('checkout.orderUpdates','Order Updates')}</h3>
              <p className="text-xs text-gray-400 mb-3">How would you like to receive order updates?</p>
              <div className="grid grid-cols-2 gap-2">
                {[{key:'whatsapp',label:'WhatsApp',icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785c-1.784 0-3.532-.48-5.063-1.39l-.363-.215-3.764.988.999-3.648-.236-.375A9.731 9.731 0 012.27 12.05c0-5.384 4.383-9.767 9.78-9.767a9.714 9.714 0 016.922 2.868 9.714 9.714 0 012.868 6.919c-.004 5.384-4.387 9.765-9.79 9.765zM20.52 3.449A11.917 11.917 0 0012.05 0C5.495 0 .16 5.335.157 11.892a11.852 11.852 0 001.588 5.946L0 24l6.305-1.654a11.881 11.881 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.452z"/></svg>},{key:'email',label:'Email',icon:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}].map(ch=>{
                  const selected=form.notification_preference===ch.key;
                  return(<label key={ch.key} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?'border-current bg-opacity-10':'border-gray-200 hover:border-gray-300'}`} style={selected?{borderColor:pc,backgroundColor:pc+'10'}:{}}>
                    <input type="radio" name="notif_pref" value={ch.key} checked={selected} onChange={()=>setForm({...form,notification_preference:ch.key})} className="sr-only"/>
                    <span className="shrink-0">{ch.icon}</span>
                    <span className={`text-sm font-bold ${selected?'':'text-gray-600'}`} style={selected?{color:pc}:{}}>{ch.label}</span>
                  </label>);
                })}
              </div>
            </div>
          </div>

          {/* Save info option (sits between forms and summary) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={saveInfo} onChange={e => setSaveInfo(e.target.checked)} className="w-4 h-4 accent-current" style={{accentColor: pc}} />
              <div>
                <p className="text-sm font-bold text-gray-800">{t('checkout.saveInfo','Save my information for next time')}</p>
                <p className="text-[11px] text-gray-400">{t('checkout.saveInfoDesc','Your name, phone, address and wilaya will be remembered on this device.')}</p>
              </div>
            </label>
          </div>

          {/* Summary (now stacked under the shipping info, not side-by-side) */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t('store.orderSummary')}</h3>
              <div className="space-y-3 mb-4">
                {items.map((item, i) => {
                  // Build a variant label from whatever was stored
                  const vLabel = (() => {
                    const v = item.variant;
                    if (!v) return '';
                    if (v.label) return v.label; // composite label
                    if (v.selections) return v.selections.map(s => s.name).filter(Boolean).join(' / ');
                    if (v.name) return v.name;
                    return '';
                  })();
                  // Determine color swatch if it's a color variant
                  const vColor = (() => {
                    const v = item.variant;
                    if (!v) return null;
                    if (v.type === 'color' && v.value) return v.value;
                    if (v.selections) { const c = v.selections.find(s => s.type === 'color'); return c?.value || null; }
                    return null;
                  })();
                  return (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    {item.image && <img src={item.image} className="w-12 h-12 rounded-lg object-cover shrink-0" alt=""/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      {vLabel && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {vColor && <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{backgroundColor: vColor}}/>}
                          <span className="text-[11px] text-gray-500 font-medium truncate">{vLabel}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(i, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Minus size={10}/></button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(i, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><Plus size={10}/></button>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()}</p><button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button></div>
                  </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mb-4"><input className="input-field text-sm flex-1" placeholder="Coupon code" value={form.coupon_code} onChange={set('coupon_code')}/><button onClick={validateCoupon} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200">Apply</button></div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{subtotal.toLocaleString()} {store.currency||'DZD'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="font-semibold">{shipping.toLocaleString()} {store.currency||'DZD'}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-emerald-600 font-semibold">-{couponDiscount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-extrabold text-xl pt-2 border-t"><span>Total</span><span style={{color: pc}}>{total.toLocaleString()} {store.currency||'DZD'}</span></div>
                {store?.show_savings && couponDiscount>0 && <div className="text-xs text-emerald-600 text-right font-semibold">You saved {couponDiscount.toLocaleString()} {store.currency||'DZD'}!</div>}
              </div>
              {store?.order_notes && <div className="mt-4"><label className="input-label text-xs">Order Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} placeholder="Special instructions..."/></div>}
              <button onClick={placeOrder} disabled={loading || items.length === 0} className={`w-full mt-6 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:opacity-90 transition-all ${store?.sticky_checkout?'sm:sticky sm:bottom-4':''}`} style={{backgroundColor: pc}}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>{store?.btn_order_now || t('store.placeOrder')}</>}
              </button>
              {store?.trust_signals!==false && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Lock size={12}/> Secure checkout</span>
                  <span className="flex items-center gap-1"><Check size={12}/> Money-back</span>
                  <span className="flex items-center gap-1"><Wifi size={12}/> Verified store</span>
                </div>
              )}
              {store?.post_script && <div dangerouslySetInnerHTML={{__html:store.post_script}}/>}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
