import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerApi, aiApi, publicRoleTemplatesApi } from '../../utils/api';
import { useStoreManagement, useAuthStore, useAdminTheme } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import WhatsAppConfigModal,{WA_STATUSES,WA_STATUS_LABELS} from '../../components/shared/WhatsAppConfigModal';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { Save,Store,Palette,CreditCard,Truck,Bot,Upload,Globe,Users,ShoppingCart,Settings as SI,Bell,BarChart3,Shield,Tag,Code,Type,MessageSquare,Eye,Trash2,Plus,Check,Layout,Sliders,Zap,Lock,Package,Percent,AlertTriangle,Mail,Smartphone,QrCode,Copy,ExternalLink,RefreshCw,Key,User,Activity,Hash,TrendingUp,Sparkles,ChevronLeft,ChevronRight,X,Send,Wifi,WifiOff,Clock,MessageCircle,Phone,Edit2,ShoppingBag } from 'lucide-react';
import { ALL_PERMISSIONS, PERM_GROUPS } from '../../utils/permissions';

const themes=[{id:'classic',name:'Classic Store',desc:'PROFESSIONAL & CLEAN',c:'#7C3AED'},{id:'nova-dark',name:'Nova Dark',desc:'FUTURISTIC & SLEEK',c:'#8B5CF6'},{id:'enterprise',name:'Enterprise',desc:'DENSE & FUNCTIONAL',c:'#3B82F6'},{id:'ocean-bloom',name:'Ocean Bloom',desc:'SOFT & FRIENDLY',c:'#06B6D4'},{id:'nzxt-pro',name:'NZXT Pro',desc:'HIGH CONTRAST',c:'#A855F7'},{id:'moonlight',name:'Moonlight',desc:'ETHEREAL & CALM',c:'#818CF8'}];

// WA_STATUSES and WA_STATUS_LABELS imported from WhatsAppConfigModal
const brandColors=['#10B981','#06B6D4','#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#EF4444','#F97316','#EAB308','#84CC16','#22C55E','#14B8A6','#0EA5E9'];
const roles={};

// Section header component — left accent border style
const SH=({icon:Icon,title,subtitle,accent='brand'})=>{const colors={brand:'border-brand-500 bg-brand-50',blue:'border-blue-500 bg-blue-50',emerald:'border-emerald-500 bg-emerald-50',amber:'border-amber-500 bg-amber-50',red:'border-red-500 bg-red-50',purple:'border-purple-500 bg-purple-50',orange:'border-orange-500 bg-orange-50',gray:'border-gray-500 bg-gray-50'};return(<div className={`border-l-4 ${colors[accent]||colors.brand} rounded-r-xl p-4 flex items-center gap-3`}><Icon size={22} className="text-gray-700"/><div><h3 className="font-bold text-gray-900">{title}</h3>{subtitle&&<p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}</div></div>);};
// Stat pill
const SP=({label,value,color='brand'})=>{const bg={brand:'bg-brand-100 text-brand-700',emerald:'bg-emerald-100 text-emerald-700',blue:'bg-blue-100 text-blue-700',amber:'bg-amber-100 text-amber-700',red:'bg-red-100 text-red-700',purple:'bg-purple-100 text-purple-700'};return(<div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bg[color]||bg.brand}`}><span className="text-xs font-medium">{label}</span><span className="font-black text-sm">{value}</span></div>);};

function SubscriptionSection(){
  const{t}=useTranslation();
  const[data,setData]=useState(null);const[loading,setLoading]=useState(true);
  const[selectedPlan,setSelectedPlan]=useState(null);const[period,setPeriod]=useState('monthly');
  const[showPay,setShowPay]=useState(false);const[receipt,setReceipt]=useState('');const[submitting,setSubmitting]=useState(false);
  const fileRef=React.useRef(null);
  const load=()=>{setLoading(true);ownerApi.getSubscription().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));};
  React.useEffect(()=>{load();},[]);
  const uploadReceipt=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setReceipt(r.result);r.readAsDataURL(f);};
  const submitPayment=async()=>{if(!receipt)return toast.error(t('storePage.uploadReceiptFirst','Upload receipt first'));if(!selectedPlan)return toast.error(t('storePage.selectAPlan','Select a plan'));setSubmitting(true);try{const price=period==='yearly'?data.plans[selectedPlan].yearly:data.plans[selectedPlan].monthly;await ownerApi.paySubscription({plan:selectedPlan,period,amount:price,payment_method:'ccp',receipt_image:receipt});toast.success(t('storePage.paymentSubmitted','Payment submitted! Waiting for approval.'));setShowPay(false);setReceipt('');setSelectedPlan(null);load();}catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}setSubmitting(false);};
  const copy=(txt)=>{navigator.clipboard.writeText(txt);toast.success(t('storePage.copied','Copied!'));};
  if(loading)return<div className="py-12 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>;
  const plans=data?.plans||{};const isActive=data?.status==='active';const isSuspended=data?.status==='suspended';
  const expDate=data?.expires_at?new Date(data.expires_at).toLocaleDateString():null;
  return(<>
    {/* Status */}
    <div className={`glass-card-solid p-4 sm:p-6 ${isSuspended?'border-2 border-red-300 bg-red-50':''}`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSuspended?'bg-red-500':'bg-brand-500'} text-white`}><Zap size={20}/></div><div><p className="text-[10px] text-gray-400 uppercase font-bold">{t('storePage.currentPlan','Current Plan')}</p><p className="text-xl font-black capitalize">{data?.plan||t('storePage.free','Free')}</p></div></div><div className="text-right"><span className={`px-3 py-1 rounded-full text-xs font-bold ${isSuspended?'bg-red-500 text-white':isActive?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{isSuspended?t('storePage.suspended','SUSPENDED'):isActive?t('storePage.active','ACTIVE'):t('storePage.freeUpper','FREE')}</span>{expDate&&<p className="text-xs text-gray-400 mt-1">{t('storePage.expires','Expires:')} {expDate}</p>}</div></div>{isSuspended&&<div className="mt-4 p-3 bg-red-100 rounded-xl text-sm text-red-700 font-medium">{t('storePage.subscriptionSuspended','Your subscription is suspended. Renew below to restore access.')}</div>}</div>
    {/* Period toggle */}
    <div className="flex items-center justify-center gap-3 mt-4"><button onClick={()=>setPeriod('monthly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period==='monthly'?'bg-brand-500 text-white':'bg-gray-100 text-gray-500'}`}>{t('storePage.monthly','Monthly')}</button><button onClick={()=>setPeriod('yearly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period==='yearly'?'bg-brand-500 text-white':'bg-gray-100 text-gray-500'}`}>{t('storePage.yearly','Yearly')} <span className="text-[10px] opacity-70">{t('storePage.save20','Save 20%')}</span></button></div>
    {/* Plans */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{Object.entries(plans).map(([key,plan])=>{const price=period==='yearly'?plan.yearly:plan.monthly;const isCurrent=data?.plan===key&&isActive;return(<div key={key} className={`glass-card-solid p-5 relative ${key==='advanced'?'ring-2 ring-brand-400':''}`}>{key==='advanced'&&<div className="absolute top-0 right-0 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-xl">{t('storePage.popular','POPULAR')}</div>}<h3 className="font-bold text-lg">{plan.name}</h3><div className="mt-2 flex items-baseline gap-1"><span className="text-2xl font-black text-brand-600">{price.toLocaleString()}</span><span className="text-gray-400 text-xs">DZD/{period==='yearly'?'yr':'mo'}</span></div><div className="mt-3 space-y-1.5">{plan.features.map((f,i)=><div key={i} className="flex items-center gap-2 text-xs"><Check size={12} className="text-emerald-500 shrink-0"/><span className="text-gray-600">{f}</span></div>)}</div><button onClick={()=>{if(!isCurrent){setSelectedPlan(key);setShowPay(true);}}} disabled={isCurrent} className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm ${isCurrent?'bg-emerald-100 text-emerald-700':'bg-brand-500 text-white hover:bg-brand-600'}`}>{isCurrent?t('storePage.currentPlan','Current Plan'):t('storePage.subscribe','Subscribe')}</button></div>);})}</div>
    {/* Payment history */}
    {data?.payments?.length>0&&<div className="glass-card-solid p-5 mt-4"><h3 className="font-bold text-sm mb-3">{t('storePage.paymentHistory','Payment History')}</h3><div className="space-y-2">{data.payments.slice(0,5).map(p=><div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="text-sm font-medium capitalize">{p.plan} — {p.period}</p><p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold text-sm">{parseFloat(p.amount).toLocaleString()} DZD</p><span className={`text-[10px] font-bold ${p.status==='approved'?'text-emerald-600':p.status==='rejected'?'text-red-600':'text-amber-600'}`}>{p.status?.toUpperCase()}</span></div></div>)}</div></div>}
    {/* Pay modal */}
    {showPay&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowPay(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{t('storePage.subscribe','Subscribe')} — {plans[selectedPlan]?.name}</h2><button onClick={()=>setShowPay(false)}>✕</button></div><div className="p-4 bg-brand-50 rounded-xl text-center mb-4"><p className="text-3xl font-black text-brand-600">{(period==='yearly'?plans[selectedPlan]?.yearly:plans[selectedPlan]?.monthly)?.toLocaleString()} DZD</p><p className="text-xs text-gray-400 capitalize">{period}</p></div>
    {data?.billing_ccp&&<div className="p-4 bg-gray-50 rounded-xl mb-3"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('storePage.ccpTransfer','CCP Transfer')}</p><div className="flex items-center justify-between"><div><p className="font-mono font-bold">{data.billing_ccp}</p><p className="text-xs text-gray-400">{data.billing_ccp_name}</p></div><button onClick={()=>copy(data.billing_ccp)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div></div>}
    {data?.billing_baridimob_rip&&<div className="p-4 bg-gray-50 rounded-xl mb-3"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('storePage.baridiMob','BaridiMob')}</p><div className="flex items-center justify-between"><p className="font-mono font-bold">{data.billing_baridimob_rip}</p><button onClick={()=>copy(data.billing_baridimob_rip)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div>{data.billing_baridimob_qr&&<img src={data.billing_baridimob_qr} className="w-36 mx-auto mt-3 rounded-xl border"/>}</div>}
    {!data?.billing_ccp&&!data?.billing_baridimob_rip&&<div className="p-4 bg-amber-50 rounded-xl mb-3 text-center"><p className="text-sm text-amber-700">{t('storePage.paymentDetailsNotConfigured','Payment details not configured yet. Contact the platform admin.')}</p></div>}
    <div className="mb-4"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('storePage.uploadReceipt','Upload Receipt')}</p>{receipt?<div className="relative"><img src={receipt} className="w-full rounded-xl border"/><button onClick={()=>setReceipt('')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><span className="text-xs">✕</span></button></div>:<div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400" onClick={()=>fileRef.current?.click()}><Upload size={20} className="mx-auto text-gray-400 mb-1"/><p className="text-xs text-gray-500">{t('storePage.uploadPaymentScreenshot','Upload payment screenshot')}</p></div>}<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadReceipt}/></div>
    <button onClick={submitPayment} disabled={submitting||!receipt} className="btn-primary w-full py-3 disabled:opacity-50">{submitting?t('storePage.submitting','Submitting...'):t('storePage.submitPayment','Submit Payment')}</button><p className="text-[10px] text-gray-400 text-center mt-2">{t('storePage.reviewed24h','Reviewed within 24 hours')}</p></div></div>}
  </>);
}

// ============ CHECKOUT PREVIEW ============
function CheckoutPreview({ s }) {
  const theme = useAdminTheme();
  const isDark = theme.mode === 'dark';
  const pc = s.primary_color || '#7C3AED';
  const storeName = s.name || s.store_name || 'My Store';

  return (
    <div className="glass-card-solid p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={16} className="text-purple-500" />
        <h3 className="font-bold">Checkout Preview</h3>
        <span className="text-[10px] text-gray-400 ml-auto">Live preview</span>
      </div>

      {/* Phone frame */}
      <div className="mx-auto" style={{ maxWidth: 340 }}>
        <div
          className="rounded-[2rem] border-[6px] overflow-hidden shadow-2xl"
          style={{
            borderColor: isDark ? '#374151' : '#1f2937',
            background: isDark ? '#111827' : '#ffffff',
          }}
        >
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1" style={{ background: isDark ? '#111827' : '#ffffff' }}>
            <div className="w-20 h-5 rounded-full" style={{ background: isDark ? '#1f2937' : '#e5e7eb' }} />
          </div>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: pc }}>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
              {storeName[0]}
            </div>
            <span className="text-white text-sm font-bold truncate">{storeName}</span>
            <span className="ml-auto text-white/60 text-[10px]">Checkout</span>
          </div>

          {/* Scrollable content */}
          <div
            className="px-4 py-3 space-y-3 overflow-y-auto"
            style={{
              maxHeight: 420,
              background: isDark ? '#111827' : '#f9fafb',
            }}
          >
            {/* Customer Info */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: pc }}
              >
                Customer Info
              </p>
              {/* Full Name - always required */}
              <div>
                <p className="text-[9px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Full Name *
                </p>
                <div
                  className="h-7 rounded-lg mt-0.5 flex items-center px-2"
                  style={{
                    background: isDark ? '#111827' : '#f3f4f6',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  }}
                >
                  <span className="text-[10px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                    Ahmed Ben Ali
                  </span>
                </div>
              </div>
              {/* Phone - always required */}
              <div>
                <p className="text-[9px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  Phone *
                </p>
                <div
                  className="h-7 rounded-lg mt-0.5 flex items-center px-2"
                  style={{
                    background: isDark ? '#111827' : '#f3f4f6',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  }}
                >
                  <span className="text-[10px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                    +213 555 123 456
                  </span>
                </div>
              </div>
              {/* Email - conditional */}
              {s.checkout_email && (
                <div>
                  <p className="text-[9px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    Email
                  </p>
                  <div
                    className="h-7 rounded-lg mt-0.5 flex items-center px-2"
                    style={{
                      background: isDark ? '#111827' : '#f3f4f6',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    }}
                  >
                    <span className="text-[10px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                      customer@email.com
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Method */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: pc }}
              >
                Shipping
              </p>
              <label className="flex items-center gap-2 p-2 rounded-lg cursor-default" style={{ background: isDark ? '#111827' : '#f3f4f6' }}>
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: pc }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: pc }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold" style={{ color: isDark ? '#e5e7eb' : '#374151' }}>Home Delivery</p>
                  <p className="text-[9px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>2-4 days</p>
                </div>
                <span className="text-[10px] font-bold" style={{ color: isDark ? '#e5e7eb' : '#1f2937' }}>500 {s.currency || 'DZD'}</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg cursor-default" style={{ background: 'transparent' }}>
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Desk Pickup</p>
                  <p className="text-[9px]" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>1-2 days</p>
                </div>
                <span className="text-[10px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>300 {s.currency || 'DZD'}</span>
              </label>
            </div>

            {/* Order Notes - conditional */}
            {s.order_notes && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pc }}>
                  Order Notes
                </p>
                <div
                  className="h-12 rounded-lg mt-1.5 px-2 pt-1"
                  style={{
                    background: isDark ? '#111827' : '#f3f4f6',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  }}
                >
                  <span className="text-[9px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                    Special instructions...
                  </span>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: pc }}
              >
                Order Summary
              </p>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg" style={{ background: isDark ? '#374151' : '#e5e7eb' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: isDark ? '#e5e7eb' : '#374151' }}>
                    Sample Product
                  </p>
                  <p className="text-[9px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Qty: 1</p>
                </div>
                <span className="text-[10px] font-bold" style={{ color: isDark ? '#e5e7eb' : '#1f2937' }}>
                  2,500 {s.currency || 'DZD'}
                </span>
              </div>
              {s.show_savings && (
                <div className="flex justify-between text-[9px] px-1 pt-1" style={{ color: '#10b981' }}>
                  <span>You save</span>
                  <span className="font-bold">-500 {s.currency || 'DZD'}</span>
                </div>
              )}
              <div
                className="border-t pt-1.5 mt-1 flex justify-between"
                style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
              >
                <span className="text-[10px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Subtotal</span>
                <span className="text-[10px] font-bold" style={{ color: isDark ? '#e5e7eb' : '#1f2937' }}>2,500 {s.currency || 'DZD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Shipping</span>
                <span className="text-[10px]" style={{ color: isDark ? '#d1d5db' : '#374151' }}>500 {s.currency || 'DZD'}</span>
              </div>
              <div
                className="border-t pt-1.5 flex justify-between"
                style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
              >
                <span className="text-xs font-bold" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>Total</span>
                <span className="text-xs font-black" style={{ color: pc }}>3,000 {s.currency || 'DZD'}</span>
              </div>
            </div>

            {/* Trust Signals - conditional */}
            {s.trust_signals !== false && (
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="flex items-center gap-1">
                  <Lock size={9} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                  <span className="text-[8px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={9} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                  <span className="text-[8px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Protected</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check size={9} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                  <span className="text-[8px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Verified</span>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <button
              className="w-full py-2.5 rounded-xl text-white text-xs font-bold"
              style={{ backgroundColor: pc }}
            >
              {s.btn_order_now || 'Place Order'} - 3,000 {s.currency || 'DZD'}
            </button>

            {/* Sticky Checkout indicator */}
            {s.sticky_checkout && (
              <p className="text-[8px] text-center" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>
                Sticky checkout bar enabled
              </p>
            )}
          </div>

          {/* Bottom bar */}
          <div className="h-1.5 mx-auto w-24 rounded-full my-2" style={{ background: isDark ? '#374151' : '#d1d5db' }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scrollbar Studio — buyer-side scrollbar customization with quick presets,
// dimensions (width / height), and colors (thumb / track). Saves to store
// config; storefront reads these and renders matching CSS.
// ─────────────────────────────────────────────────────────────────────────────
function ScrollbarStudio({ s, setS, setV, t }) {
  const cfg = s.scrollbar || {};
  const setCfg = (k, v) => setS({ ...s, scrollbar: { ...(s.scrollbar||{}), [k]: v } });
  const presets = {
    default: { width: 8, height: 8, thumb: '#9ca3af', track: '#f3f4f6', radius: 8 },
    minimal: { width: 4, height: 4, thumb: '#cbd5e1', track: 'transparent', radius: 2 },
    bold:    { width: 14, height: 14, thumb: s.primary_color||'#7C3AED', track: '#e5e7eb', radius: 4 },
    rounded: { width: 10, height: 10, thumb: s.primary_color||'#7C3AED', track: 'transparent', radius: 12 },
  };
  const applyPreset = (key) => setS({ ...s, scrollbar: { ...presets[key], preset: key, enabled: true } });
  const isActive = (key) => cfg.preset === key;
  const w = cfg.width ?? 8, h = cfg.height ?? 8;
  const thumb = cfg.thumb || '#9ca3af';
  const track = cfg.track || '#f3f4f6';
  const radius = cfg.radius ?? 8;

  return (
    <div className="p-5 bg-gray-50 rounded-xl space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2"><Sliders size={16} className="text-violet-500"/><h4 className="font-bold text-sm">{t('storePage.scrollbarStudio','Scrollbar Studio')}</h4></div>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-500" checked={cfg.enabled!==false} onChange={e=>setCfg('enabled',e.target.checked)}/>
          {t('storePage.advanced','Advanced')}
        </label>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">⚡ {t('storePage.quickPresets','Quick Presets')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.keys(presets).map(k => {
            const p = presets[k];
            return (
              <button key={k} onClick={()=>applyPreset(k)} className={`p-3 rounded-2xl border-2 text-center transition-all ${isActive(k)?'border-brand-500 bg-brand-50 scale-[1.03]':'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="flex items-center justify-center mb-1.5 h-7">
                  <div className="rounded-full" style={{width:Math.max(4,p.width-2),height:24,backgroundColor:p.thumb,borderRadius:p.radius}}/>
                </div>
                <p className="text-[11px] font-bold text-gray-700 capitalize">{k}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimensions */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-[10px] font-bold text-blue-500 uppercase mb-2">📐 {t('storePage.dimensions','Dimensions')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1"><label className="text-[11px] font-bold text-gray-600">{t('storePage.widthVertical','Width (Vertical)')}</label><span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{w}PX</span></div>
            <input type="range" min="0" max="20" value={w} onChange={e=>setCfg('width',parseInt(e.target.value)||0)} className="w-full"/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><label className="text-[11px] font-bold text-gray-600">{t('storePage.heightHorizontal','Height (Horizontal)')}</label><span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{h}PX</span></div>
            <input type="range" min="0" max="20" value={h} onChange={e=>setCfg('height',parseInt(e.target.value)||0)} className="w-full"/>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1"><label className="text-[11px] font-bold text-gray-600">{t('storePage.cornerRadius','Corner Radius')}</label><span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{radius}PX</span></div>
            <input type="range" min="0" max="20" value={radius} onChange={e=>setCfg('radius',parseInt(e.target.value)||0)} className="w-full"/>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-[10px] font-bold text-violet-500 uppercase mb-2">🎨 {t('storePage.colors','Colors')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1"><label className="text-[11px] font-bold text-gray-600">{t('storePage.thumbColor','Thumb Color')}</label><button onClick={()=>setCfg('thumb','#9ca3af')} className="text-[10px] text-gray-400 hover:underline">{t('storePage.reset','Reset')}</button></div>
            <div className="flex items-center gap-2">
              <input type="color" value={thumb.startsWith('#')?thumb:'#9ca3af'} onChange={e=>setCfg('thumb',e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"/>
              <input className="input-field !py-1.5 text-xs font-mono" value={thumb} onChange={e=>setCfg('thumb',e.target.value)} placeholder="#9ca3af"/>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><label className="text-[11px] font-bold text-gray-600">{t('storePage.trackColor','Track Color')}</label><button onClick={()=>setCfg('track','transparent')} className="text-[10px] text-gray-400 hover:underline">{t('storePage.reset','Reset')}</button></div>
            <div className="flex items-center gap-2">
              <input type="color" value={track==='transparent'?'#f3f4f6':track} onChange={e=>setCfg('track',e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"/>
              <input className="input-field !py-1.5 text-xs font-mono" value={track} onChange={e=>setCfg('track',e.target.value)} placeholder="transparent"/>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview strip */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">{t('storePage.livePreview','Live Preview')}</p>
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-3 bg-white">
          <div
            style={{
              maxHeight:120,overflow:'auto',padding:8,borderRadius:8,
              scrollbarWidth: w<3?'none':'thin',
              scrollbarColor: `${thumb} ${track}`,
            }}
          >
            <style>{`
              .sb-preview::-webkit-scrollbar{width:${w}px;height:${h}px;}
              .sb-preview::-webkit-scrollbar-track{background:${track};border-radius:${radius}px;}
              .sb-preview::-webkit-scrollbar-thumb{background:${thumb};border-radius:${radius}px;}
            `}</style>
            <div className="sb-preview" style={{maxHeight:100,overflow:'auto'}}>
              {Array.from({length:18}).map((_,i)=>(<p key={i} className="text-xs text-gray-500 py-0.5">{t('storePage.scrollDemoLine','Scroll preview line')} {i+1} — sample content for the scrollbar.</p>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreSettings(){
  const{t}=useTranslation();const{currentStore,setCurrentStore,stores:adminStores}=useStoreManagement();const{user,logout}=useAuthStore();
  const[isMobile,setIsMobile]=useState(typeof window!=='undefined'&&window.innerWidth<1024);
  useEffect(()=>{const onR=()=>setIsMobile(window.innerWidth<1024);window.addEventListener('resize',onR);return()=>window.removeEventListener('resize',onR);},[]);
  const[s,setS]=useState({});const[sec,setSec]=useState(typeof window!=='undefined'&&window.innerWidth<1024?'':'store-details');const[loading,setLoading]=useState(false);
  const[staff,setStaff]=useState([]);const[wilayas,setWilayas]=useState([]);const[showRole,setShowRole]=useState(null);
  const[showStaff,setShowStaff]=useState(false);const[sf,setSf]=useState({name:'',email:'',phone:'',password:'',confirmPassword:'',avatar:'',role:'',assigned_store_ids:[]});
  // Pop-out store picker for the Create User modal — opens a list of every
  // store the admin owns so they can tick the ones the team member can sign in to.
  const[sfStorePickerOpen,setSfStorePickerOpen]=useState(false);
  // Admin-only editor for an existing team member (name/email/phone/password/role)
  const[editStaff,setEditStaff]=useState(null);
  const openEditStaff=(x)=>{setEditStaff({id:x.id,name:x.name||'',email:x.email||'',phone:x.phone||'',password:'',role:x.role||(x.role_template_id?'tpl_'+x.role_template_id:'')});};
  const saveEditStaff=async()=>{
    try{
      if(!editStaff?.id)return;
      const payload={name:editStaff.name,email:editStaff.email,phone:editStaff.phone};
      if(editStaff.password)payload.password=editStaff.password;
      if(editStaff.role){payload.role=editStaff.role;
        if(editStaff.role.startsWith('tpl_')){const tpl=platformTemplates.find(t=>String(t.id)===editStaff.role.slice(4));if(tpl)payload.permissions=JSON.stringify(tpl.permissions||[]);payload.role_template_id=editStaff.role;}
        else{const sr=storeRoles.find(r=>String(r.id)===String(editStaff.role));if(sr)payload.permissions=JSON.stringify(sr.permissions||[]);payload.role_template_id=editStaff.role;}
      }
      await ownerApi.updateStaff(currentStore.id,editStaff.id,payload);
      toast.success('Team member updated');setEditStaff(null);loadData();
    }catch(e){toast.error(e?.response?.data?.error||'Failed');}
  };
  const[platformTemplates,setPlatformTemplates]=useState([]);
  const[storeRoles,setStoreRoles]=useState([]);
  const[editRole,setEditRole]=useState(null); // {id?,name,description,permissions[]}
  useEffect(()=>{publicRoleTemplatesApi.list().then(r=>setPlatformTemplates(r.data?.templates||[])).catch(()=>{});},[]);
  const loadStoreRoles=()=>{if(!currentStore?.id)return;ownerApi.getRoleTemplates(currentStore.id).then(r=>setStoreRoles(r.data?.templates||[])).catch(()=>setStoreRoles([]));};
  useEffect(()=>{loadStoreRoles();},[currentStore?.id]);
  const saveRole=async()=>{
    try{
      if(!editRole?.name)return toast.error('Role name required');
      if(editRole.id){await ownerApi.updateRoleTemplate(currentStore.id,editRole.id,{name:editRole.name,description:editRole.description||'',permissions:editRole.permissions||[]});}
      else{await ownerApi.createRoleTemplate(currentStore.id,{name:editRole.name,description:editRole.description||'',permissions:editRole.permissions||[]});}
      toast.success('Role saved');setEditRole(null);loadStoreRoles();
    }catch(e){toast.error(e.response?.data?.error||'Failed');}
  };
  const deleteRole=async(id)=>{if(!window.confirm('Delete this role?'))return;try{await ownerApi.deleteRoleTemplate(currentStore.id,id);loadStoreRoles();toast.success('Deleted');}catch{toast.error('Failed');}};
  const togglePerm=(k)=>{const p=new Set(editRole?.permissions||[]);if(p.has(k))p.delete(k);else p.add(k);setEditRole({...editRole,permissions:[...p]});};
  // Open edit modal for a platform role — creates a store-scoped copy so
  // changes apply ONLY to this store (platform role itself stays untouched).
  const customizePlatformRole=(tpl)=>{
    const lang=(document.documentElement.lang||'en').slice(0,2);
    const name=(tpl.name&&(tpl.name[lang]||tpl.name.en))||'Role';
    const desc=(tpl.description&&(tpl.description[lang]||tpl.description.en))||'';
    setEditRole({name:name+' (custom)',description:desc,permissions:[...(tpl.permissions||[])]});
  };
  const changeStaffRole=async(staffId,roleValue)=>{
    try{
      const payload={role:roleValue};
      // If a role template is picked, attach its permissions for quick lookup
      if(roleValue.startsWith('tpl_')){const tpl=platformTemplates.find(t=>String(t.id)===roleValue.slice(4));if(tpl)payload.permissions=tpl.permissions||[];payload.role_template_id=roleValue;}
      else if(roleValue.startsWith('st_')){const tpl=storeRoles.find(t=>String(t.id)===roleValue);if(tpl)payload.permissions=tpl.permissions||[];payload.role_template_id=roleValue;}
      await ownerApi.updateStaff(currentStore.id,staffId,payload);toast.success('Updated');loadData();
    }catch{toast.error('Failed');}
  };
  const removeStaff=async(staffId)=>{if(!window.confirm('Remove this user?'))return;try{await ownerApi.deleteStaff(currentStore.id,staffId);toast.success('Removed');loadData();}catch{toast.error('Failed');}};
  const adminTheme=useAdminTheme();const settingsIsDark=adminTheme.mode==='dark';
  const logoR=useRef(null);const coverR=useRef(null);const faviconR=useRef(null);
  const[profile,setProfile]=useState({full_name:'',email:'',phone:'',username:''});
  const[pwForm,setPwForm]=useState({current_password:'',new_password:'',confirm_password:''});
  const[usernameEdit,setUsernameEdit]=useState(false);const[emailEdit,setEmailEdit]=useState(false);
  const[emailPw,setEmailPw]=useState('');const[newEmail,setNewEmail]=useState('');const[newUsername,setNewUsername]=useState('');
  const[deleteConfirm,setDeleteConfirm]=useState(false);const[deletePw,setDeletePw]=useState('');const[profileLoading,setProfileLoading]=useState(false);
  const[qrGenerated,setQrGenerated]=useState(false);const[showPwSection,setShowPwSection]=useState(false);
  const[showWaModal,setShowWaModal]=useState(false);
  const[waStatus,setWaStatus]=useState(null);
  const waCheckStatus=async()=>{if(!currentStore?.id)return;try{const{data}=await aiApi.waQrStatus(currentStore.id);setWaStatus(data);}catch{setWaStatus({status:'not_started',connected:false});}};

  useEffect(()=>{if(currentStore){setS({...currentStore,theme:currentStore.theme||'classic'});loadData();}},[currentStore?.id]);
  useEffect(()=>{if(sec==='account')loadProfile();},[sec]);
  const loadData=()=>{if(!currentStore?.id)return;api.get(`/owner/stores/${currentStore.id}/staff`).then(r=>setStaff(r.data)).catch(()=>{});api.get(`/manage/stores/${currentStore.id}/shipping-wilayas`).then(r=>setWilayas(Array.isArray(r.data)?r.data:(r.data?.wilayas||[]))).catch(()=>setWilayas([]));};
  const loadProfile=async()=>{try{const{data}=await ownerApi.getProfile();setProfile(data);setNewUsername(data.username||'');setNewEmail(data.email||'');}catch(e){}};
  const save=async()=>{setLoading(true);try{const{data}=await ownerApi.updateStore(currentStore.id,s);setCurrentStore(data);toast.success(t('storePage.savedCheck','Saved ✓'));}catch(e){const msg=e?.response?.data?.error||e?.message||t('storePage.failed','Failed');toast.error(typeof msg==='string'?msg:t('storePage.failed','Failed'));}setLoading(false);};
  const set=(k)=>(e)=>setS({...s,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
  const setV=(k,v)=>setS({...s,[k]:v});
  const imgUp=(field,sz=400)=>(e)=>{const f=e.target.files?.[0];if(!f)return;
    if(f.size>5*1024*1024){toast.error(t('storePage.imageTooLarge','Image too large (max 5 MB)'));return;}
    const r=new FileReader();
    r.onload=()=>{const i=new window.Image();i.onload=()=>{
      // Preserve aspect ratio: scale longest edge to `sz`, fit width/height proportionally.
      const ratio=Math.min(sz/i.width,sz/i.height,1);
      const w=Math.round(i.width*ratio),h=Math.round(i.height*ratio);
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(i,0,0,w,h);
      // Lower quality for cover images to keep payload small
      const q=field==='cover_image'?0.6:0.7;
      setS({...s,[field]:c.toDataURL('image/jpeg',q)});
      toast.success(t('storePage.uploaded','Uploaded!'));
    };i.onerror=()=>toast.error('Bad image');i.src=r.result;};
    r.onerror=()=>toast.error('Read failed');
    r.readAsDataURL(f);};
  const seedW=async()=>{try{await api.post(`/manage/stores/${currentStore.id}/shipping-wilayas/seed`);loadData();}catch{}};
  // Auto-seed the 58 Algerian wilayas the first time the store reaches the
  // shipping section with an empty list — no manual button required.
  useEffect(()=>{if(currentStore?.id&&wilayas.length===0&&sec==='shipping')seedW();},[sec,currentStore?.id,wilayas.length]);
  const addStaff=async()=>{try{
    if(!sf.name||!sf.password)return toast.error('Name and password required');
    if(sf.password!==sf.confirmPassword)return toast.error(t('storePage.passwordsDontMatch','Passwords do not match'));
    // Always include the current store + whatever extras were ticked.
    const extras=Array.isArray(sf.assigned_store_ids)?sf.assigned_store_ids:[];
    const assignedIds=Array.from(new Set([currentStore.id,...extras]));
    const{confirmPassword,...rest}=sf;void confirmPassword;
    const payload={...rest,assigned_store_ids:assignedIds};
    if(sf.role&&sf.role.startsWith('tpl_')){
      const id=sf.role.slice(4);
      const tpl=platformTemplates.find(t=>String(t.id)===String(id));
      if(tpl)payload.permissions=JSON.stringify(tpl.permissions||[]);
    }
    await api.post(`/owner/stores/${currentStore.id}/staff`,payload);
    toast.success(t('storePage.added','Added!'));
    setShowStaff(false);
    setSf({name:'',email:'',phone:'',password:'',confirmPassword:'',avatar:'',role:'',assigned_store_ids:[]});
    loadData();
  }catch(e){console.error('[addStaff]',e?.response?.status,e?.response?.data,e);toast.error(e?.response?.data?.error||e?.response?.data?.message||`Failed (${e?.response?.status||'network'})`);}};
  const saveProfile=async()=>{setProfileLoading(true);try{await ownerApi.updateProfile({full_name:profile.full_name,phone:profile.phone});toast.success(t('storePage.profileUpdated','Profile updated!'));}catch{toast.error(t('storePage.failed','Failed'));}setProfileLoading(false);};
  const saveUsername=async()=>{try{await ownerApi.updateUsername({username:newUsername});setProfile({...profile,username:newUsername});setUsernameEdit(false);toast.success(t('storePage.usernameUpdated','Username updated!'));}catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}};
  const saveEmail=async()=>{try{await ownerApi.updateEmail({email:newEmail,password:emailPw});setProfile({...profile,email:newEmail});setEmailEdit(false);setEmailPw('');toast.success(t('storePage.emailUpdated','Email updated!'));}catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}};
  const changePassword=async()=>{if(pwForm.new_password!==pwForm.confirm_password)return toast.error(t('storePage.passwordsDontMatch','Passwords do not match'));try{await ownerApi.updatePassword({current_password:pwForm.current_password,new_password:pwForm.new_password});setPwForm({current_password:'',new_password:'',confirm_password:''});setShowPwSection(false);toast.success(t('storePage.passwordUpdated','Password updated!'));}catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}};
  const deleteAccount=async()=>{try{await ownerApi.deleteAccount({password:deletePw});toast.success(t('storePage.accountDeleted','Account deleted'));logout();window.location.href='/';}catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}};

  const T=({label,desc,checked,onChange})=>(<label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"><div><p className="font-medium text-sm text-gray-800">{label}</p>{desc&&<p className="text-xs text-gray-400 mt-0.5">{desc}</p>}</div><div className={`w-11 h-6 rounded-full transition-colors ${checked?'bg-brand-500':'bg-gray-300'} relative`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked?'translate-x-5':'translate-x-0.5'}`}/></div><input type="checkbox" className="sr-only" checked={checked||false} onChange={onChange}/></label>);
  const secs=[{id:'store-details',icon:Store,l:t('storePage.secStoreDetails','Store Details')},{id:'customization',icon:Palette,l:t('storePage.secCustomization','Customization')},{id:'dashboard-config',icon:Layout,l:t('storePage.secDashboard','Dashboard')},{id:'users',icon:Users,l:t('storePage.secUsersPerms','Users & Permissions')},{id:'checkout',icon:ShoppingCart,l:t('storePage.secCheckout','Checkout')},{id:'shipping',icon:Truck,l:t('storePage.secShipping','Shipping')},{id:'payments',icon:CreditCard,l:t('storePage.secPayments','Payments')},{id:'taxes',icon:Percent,l:t('storePage.secTaxes','Taxes')},{id:'notifications',icon:Bell,l:t('storePage.secNotifications','Notifications')},{id:'orders-config',icon:Package,l:t('storePage.secOrders','Orders')},{id:'customers-config',icon:Users,l:t('storePage.secCustomers','Customers')},{id:'inventory',icon:BarChart3,l:t('storePage.secInventory','Inventory')},{id:'domains',icon:Globe,l:t('storePage.secDomains','Domains')},{id:'ai',icon:Bot,l:t('storePage.secAi','AI Messaging')},{id:'tracking-pixels',icon:TrendingUp,l:t('storePage.secTrackingPixels','Tracking Pixels')},{id:'subscription',icon:Zap,l:t('storePage.secSubscription','Subscription')},{id:'account',icon:SI,l:t('storePage.secAccount','Account')}];
  const storeDomain=currentStore?.slug?`${currentStore.slug}.ender-store.com`:'';

  const activeSec=secs.find(x=>x.id===sec);
  return(<DashboardLayout>
    {isMobile&&!sec?(
      <div className="animate-fade-in">
        <h1 className="page-header text-xl mb-4">{t('sidebar.settings')}</h1>
        <p className="text-xs text-gray-400 mb-4">{t('storePage.mobileSettingsHint','Tap any setting to open its dedicated page.')}</p>
        <div className="space-y-2">{secs.map(x=>{const I=x.icon;return(
          <button key={x.id} onClick={()=>setSec(x.id)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-300 active:bg-brand-50 transition-all shadow-sm">
            <div className="flex items-center gap-3 min-w-0"><div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><I size={20} className="text-brand-500"/></div><span className="font-bold text-gray-800 text-sm text-left truncate">{x.l}</span></div>
            <ChevronRight size={18} className="text-gray-400 shrink-0"/>
          </button>
        );})}</div>
      </div>
    ):(<>
    {isMobile?(
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 mb-4 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 flex items-center gap-2">
        <button onClick={()=>setSec('')} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 hover:bg-gray-50 active:scale-95 transition-all"><ChevronLeft size={18}/></button>
        <h1 className="font-black text-base flex-1 truncate">{activeSec?.l||t('sidebar.settings')}</h1>
        <button onClick={save} disabled={loading} className="btn-primary flex items-center gap-1.5 text-xs !px-3 !py-2 shrink-0">{loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={14}/>}Save</button>
      </div>
    ):(
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3"><h1 className="page-header text-lg sm:text-2xl truncate">{t('sidebar.settings')}</h1><button onClick={save} disabled={loading} className="btn-primary flex items-center gap-2 text-xs sm:text-sm !px-3 sm:!px-6 !py-2 sm:!py-3 shrink-0">{loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={16}/>}<span className="hidden sm:inline">{t('storePage.saveChanges','Save Changes')}</span><span className="sm:hidden">Save</span></button></div>
    )}
    <div className={isMobile?"":"flex flex-col lg:flex-row gap-4 lg:gap-6"}>
      {/* Desktop sidebar */}
      {!isMobile&&<div className="hidden lg:block w-56 shrink-0 space-y-0.5">{secs.map(x=>{const I=x.icon;return(<button key={x.id} onClick={()=>setSec(x.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${sec===x.id?'bg-brand-50 text-brand-600':'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><I size={16}/>{x.l}</button>);})}</div>}
      <div className={isMobile?"min-w-0 space-y-4 animate-fade-in pb-8":"flex-1 min-w-0 space-y-4 sm:space-y-6 animate-fade-in"}>

{sec==='store-details'&&<><div className="grid lg:grid-cols-2 gap-6">
<div className="glass-card-solid p-4 sm:p-6 space-y-4"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><Store size={20} className="text-brand-500"/></div><div><h3 className="font-bold text-gray-900">{t('storePage.storeIdentity','Store Identity')}</h3><p className="text-xs text-gray-400">{t('storePage.storeIdentityDesc','Manage how your business appears to the world.')}</p></div></div><div><label className="input-label">{t('storePage.storeName','Store Name')}</label><input className="input-field" value={s.name||s.store_name||''} onChange={e=>setS({...s,name:e.target.value})}/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="input-label">{t('storePage.storePhone','Store Phone')}</label><input className="input-field" value={s.contact_phone||''} onChange={set('contact_phone')}/></div><div><label className="input-label">{t('storePage.supportPhone','Support Phone')}</label><input className="input-field" value={s.support_phone||''} onChange={set('support_phone')}/></div></div>
<p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">{t('storePage.brandAssets','Brand Assets')}</p><div className="flex gap-4"><div><p className="text-xs font-semibold text-gray-600 mb-1">{t('storePage.storeLogo','Store Logo')}</p><div className="relative w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 group" onClick={()=>logoR.current?.click()}>{s.logo?<img src={s.logo} className="w-full h-full object-cover"/>:<Upload size={20} className="text-gray-400"/>}{s.logo&&<button type="button" onClick={(e)=>{e.stopPropagation();setV('logo','');}} className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove logo"><Trash2 size={12}/></button>}</div><input ref={logoR} type="file" accept="image/*" className="hidden" onChange={imgUp('logo')}/>{s.logo&&<p className="text-[10px] text-emerald-500 font-bold mt-1"><Check size={10} className="inline"/>{t('storePage.ready','READY')}</p>}</div><div><p className="text-xs font-semibold text-gray-600 mb-1">{t('storePage.coverImage','Cover Image')}</p><div className="relative w-36 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 group" onClick={()=>coverR.current?.click()}>{s.cover_image?<img src={s.cover_image} className="w-full h-full object-cover"/>:<div className="text-center"><Upload size={16} className="text-gray-400 mx-auto"/><p className="text-[10px] text-gray-400 mt-1">{t('storePage.clickToUpload','Click to upload')}</p></div>}{s.cover_image&&<button type="button" onClick={(e)=>{e.stopPropagation();setV('cover_image','');}} className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove cover"><Trash2 size={12}/></button>}</div><input ref={coverR} type="file" accept="image/*" className="hidden" onChange={imgUp('cover_image',800)}/></div><div><p className="text-xs font-semibold text-gray-600 mb-1">{t('storePage.favicon','Favicon')}</p><div className="relative w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 group" onClick={()=>faviconR.current?.click()} title="Shown in browser tabs for your store">{s.favicon?<img src={s.favicon} className="w-full h-full object-cover"/>:<Upload size={16} className="text-gray-400"/>}{s.favicon&&<button type="button" onClick={(e)=>{e.stopPropagation();setV('favicon','');}} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>}</div><input ref={faviconR} type="file" accept="image/*" className="hidden" onChange={imgUp('favicon',64)}/><p className="text-[10px] text-gray-400 mt-1">{t('storePage.faviconHint','Browser tab icon')}</p></div></div></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-4"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"><Globe size={20} className="text-cyan-500"/></div><div><h3 className="font-bold text-gray-900">{t('storePage.regionalSettings','Regional Settings')}</h3><p className="text-xs text-gray-400">{t('storePage.currencyLanguage','CURRENCY & LANGUAGE')}</p></div></div><div><label className="input-label text-xs uppercase tracking-wider">{t('storePage.storeCurrency','Store Currency')}</label><select className="input-field" value={s.currency||'DZD'} onChange={set('currency')}><option value="DZD">{t('storePage.currencyDzd','DZD - Algerian Dinar')}</option><option value="EUR">{t('storePage.currencyEur','EUR - Euro')}</option><option value="USD">{t('storePage.currencyUsd','USD - Dollar')}</option></select></div><div><label className="input-label text-xs uppercase tracking-wider">{t('storePage.defaultLanguage','Default Language')}</label><div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2">{[{c:'ar',l:'العربية',f:'🇩🇿'},{c:'fr',l:'Français',f:'🇫🇷'},{c:'en',l:'English',f:'🇬🇧'}].map(x=>(<button key={x.c} onClick={()=>setV('default_language',x.c)} className={`p-3 rounded-xl border-2 text-center transition-all ${(s.default_language||'en')===x.c?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}><span className="text-2xl block mb-1">{x.f}</span><span className="text-xs font-semibold">{x.l}</span>{(s.default_language||'en')===x.c&&<Check size={14} className="text-brand-500 mx-auto mt-1"/>}</button>))}</div></div></div>
</div>
<div className="grid lg:grid-cols-2 gap-6"><div className="glass-card-solid p-4 sm:p-6 space-y-3"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Globe size={20} className="text-blue-500"/></div><div><h3 className="font-bold text-gray-900">{t('storePage.socialMedia','Social Media')}</h3><p className="text-xs text-gray-400">{t('storePage.connectPlatforms','CONNECT YOUR PLATFORMS')}</p></div></div><input className="input-field" placeholder={t('storePage.facebookPageUrl','Facebook Page URL')} value={s.social_facebook||''} onChange={set('social_facebook')}/><input className="input-field" placeholder={t('storePage.instagramUrl','Instagram Profile URL')} value={s.social_instagram||''} onChange={set('social_instagram')}/><input className="input-field" placeholder={t('storePage.tiktokUrl','TikTok Profile URL')} value={s.social_tiktok||''} onChange={set('social_tiktok')}/><input className="input-field" placeholder={t('storePage.youtubeUrl','YouTube Channel URL')} value={s.youtube||''} onChange={set('youtube')}/></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-3"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><BarChart3 size={20} className="text-purple-500"/></div><div><h3 className="font-bold text-gray-900">{t('storePage.seo','SEO')}</h3><p className="text-xs text-gray-400">{t('storePage.seoDesc','IMPROVE VISIBILITY ON GOOGLE')}</p></div></div><div><label className="input-label text-xs">{t('storePage.homepageTitle','Homepage Title')}</label><input className="input-field" value={s.meta_title||''} onChange={set('meta_title')}/><p className="text-[10px] text-gray-400 mt-1">{t('storePage.charsMax70','70 chars max')}</p></div><div><label className="input-label text-xs">{t('storePage.metaDescription','Meta Description')}</label><textarea className="input-field" rows={3} value={s.meta_description||''} onChange={set('meta_description')}/><p className="text-[10px] text-gray-400 mt-1">{t('storePage.charsMax160','160 chars max')}</p></div></div></div>
{/* WhatsApp Floating Button */}
<div className="glass-card-solid p-4 sm:p-6 space-y-4 mt-6">
  <div className="flex items-center gap-3 mb-2">
    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#10b981"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
    </div>
    <div>
      <h3 className="font-bold text-gray-900">{t('storePage.whatsappButtonTitle','WhatsApp Floating Button')}</h3>
      <p className="text-xs text-gray-400">{t('storePage.whatsappButtonDesc','Show a button on your storefront that opens a WhatsApp chat with you.')}</p>
    </div>
  </div>
  <T label={t('storePage.whatsappButtonEnable','Enable WhatsApp button')} desc={t('storePage.whatsappButtonEnableDesc','Appears above the AI chatbot on every store page.')} checked={!!s.whatsapp_button_enabled} onChange={e=>setV('whatsapp_button_enabled',e.target.checked)}/>
  {s.whatsapp_button_enabled && (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="input-label text-xs">{t('storePage.whatsappButtonNumber','WhatsApp Number')}</label>
        <input className="input-field" placeholder="+213 555 12 34 56" value={s.whatsapp_button_number||''} onChange={set('whatsapp_button_number')}/>
        <p className="text-[10px] text-gray-400 mt-1">{t('storePage.whatsappButtonNumberHint','Include country code, e.g. +213…')}</p>
      </div>
      <div>
        <label className="input-label text-xs">{t('storePage.whatsappButtonMessage','Pre-filled Message')}</label>
        <input className="input-field" placeholder={`Hi ${s.name||'there'}, I have a question.`} value={s.whatsapp_button_message||''} onChange={set('whatsapp_button_message')}/>
        <p className="text-[10px] text-gray-400 mt-1">{t('storePage.whatsappButtonMessageHint','What appears in the chat box when the buyer clicks.')}</p>
      </div>
    </div>
  )}
</div></>}

{sec==='customization'&&<><div className="glass-card-solid p-4 sm:p-6"><div className="flex items-center gap-3 mb-4"><Palette size={20} className="text-brand-500"/><div><h3 className="font-bold text-gray-900">{t('storePage.designStudio','Design Studio')}</h3><p className="text-xs text-gray-400">{t('storePage.designStudioDesc','Choose a starting point or craft your unique style.')}</p></div></div><div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{themes.map(th=>(<button key={th.id} onClick={()=>setS({...s,theme:th.id,primary_color:th.c})} className={`p-4 rounded-xl border-2 text-left transition-all ${s.theme===th.id?'border-brand-500 bg-brand-50 ring-2 ring-brand-200':'border-gray-200 hover:border-gray-300'}`}><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg" style={{backgroundColor:th.c}}/><div><p className="font-bold text-sm">{th.name}</p><p className="text-[10px] text-gray-400 uppercase">{th.desc}</p></div></div>{s.theme===th.id&&<Check size={14} className="text-brand-500 mt-2"/>}</button>))}</div></div>
<div className="glass-card-solid p-4 sm:p-6"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('storePage.brandEssence','Brand Essence')}</p><div className="grid lg:grid-cols-2 gap-6"><div><p className="text-sm font-bold text-gray-800 mb-2"><span className="text-red-500">*</span> {t('storePage.primaryBrandColor','Primary Brand Color')}</p><div className="flex flex-wrap gap-2 mb-3">{brandColors.map(c=>(<button key={c} onClick={()=>setV('primary_color',c)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${s.primary_color===c?'ring-2 ring-offset-2 ring-brand-500 scale-110':''}`} style={{backgroundColor:c}}/>))}</div><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg" style={{backgroundColor:s.primary_color||'#7C3AED'}}/><input className="input-field !w-32 text-sm" value={s.primary_color||'#7C3AED'} onChange={set('primary_color')}/></div></div><div><p className="text-sm font-bold text-gray-800 mb-2"><span className="text-red-500">*</span> {t('storePage.textColors','Text Colors')}</p><div className="space-y-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-900"/><div><p className="text-[10px] text-gray-400 uppercase">{t('storePage.primaryText','Primary Text')}</p><input className="input-field !w-32 text-sm" value={s.text_color||'#202223'} onChange={set('text_color')}/></div></div><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">{t('storePage.secondaryText','Secondary Text')}</p><input className="input-field !w-32 text-sm" value={s.secondary_text||'#6d7175'} onChange={set('secondary_text')}/></div></div></div></div></div></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-3"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('storePage.advancedConfig','Advanced Config')}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><T label={t('storePage.stickyHeader','Sticky Header')} checked={s.sticky_header!==false} onChange={e=>setV('sticky_header',e.target.checked)}/><T label={t('storePage.pageTransitions','Page Transitions')} checked={s.page_transitions!==false} onChange={e=>setV('page_transitions',e.target.checked)}/></div>
<div className="p-5 bg-gray-50 rounded-xl space-y-3"><div className="flex items-center gap-2"><Type size={16}/><h4 className="font-bold text-sm">Store Name Font</h4></div><p className="text-[11px] text-gray-400">Select the font family used for your store name in the header.</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[{l:'Inter',v:'Inter'},{l:'Poppins',v:'Poppins, sans-serif'},{l:'Playfair',v:'"Playfair Display", serif'},{l:'Georgia',v:'Georgia, serif'},{l:'Bebas Neue',v:'"Bebas Neue", sans-serif'},{l:'Montserrat',v:'Montserrat, sans-serif'},{l:'Oswald',v:'Oswald, sans-serif'},{l:'Lobster',v:'Lobster, cursive'},{l:'Roboto Mono',v:'"Roboto Mono", monospace'}].map(f=><button key={f.l} onClick={()=>setV('header_font',f.v)} className={`p-2 rounded-lg border-2 text-sm transition-all ${(s.header_font||'Inter')===f.v?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300 bg-white'}`} style={{fontFamily:f.v}}>{f.l}</button>)}</div></div>
<div className="p-5 bg-gray-50 rounded-xl space-y-3"><div className="flex items-center gap-2"><Type size={16}/><h4 className="font-bold text-sm">{t('storePage.buttonText','Button Text')}</h4></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="input-label text-xs">{t('storePage.addToCart','Add to Cart')}</label><input className="input-field" value={s.btn_add_cart||t('storePage.addToCart','Add to Cart')} onChange={set('btn_add_cart')}/></div><div><label className="input-label text-xs">{t('storePage.orderNow','Order Now')}</label><input className="input-field" value={s.btn_order_now||t('storePage.orderNow','Order Now')} onChange={set('btn_order_now')}/></div></div></div>
<div className="p-5 bg-gray-50 rounded-xl space-y-3"><div className="flex items-center gap-2"><MessageSquare size={16}/><h4 className="font-bold text-sm">{t('storePage.storeMessages','Store Messages')}</h4></div><div><label className="input-label text-xs">{t('storePage.welcomeMessage','Welcome Message')}</label><textarea className="input-field" rows={2} value={s.welcome_message||''} onChange={set('welcome_message')}/></div><div><label className="input-label text-xs">{t('storePage.successMessage','Success Message')}</label><textarea className="input-field" rows={2} value={s.success_message||''} onChange={set('success_message')}/></div></div>
<div className="p-5 bg-gray-50 rounded-xl space-y-3"><div className="flex items-center gap-2"><Tag size={16} className="text-red-500"/><h4 className="font-bold text-sm">Offer & Sale Branding</h4></div><T label="Enable Offer Banner" desc="Show promotional banner with countdown" checked={s.offer_enabled} onChange={set('offer_enabled')}/>{s.offer_enabled&&<><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="input-label text-xs">Offer Title</label><input className="input-field" value={s.offer_title||'Limited Offer'} onChange={set('offer_title')}/></div><div><label className="input-label text-xs">Discount Text</label><input className="input-field" value={s.offer_discount||'40% OFF'} onChange={set('offer_discount')}/></div></div><div className="grid grid-cols-3 gap-2 sm:gap-3"><div><label className="input-label text-xs">Timer Label</label><input className="input-field" value={s.offer_label||'Ends in:'} onChange={set('offer_label')}/></div><div><label className="input-label text-xs">Hours</label><input type="number" className="input-field" value={s.offer_hours||15} onChange={set('offer_hours')}/></div><div><label className="input-label text-xs">Minutes</label><input type="number" className="input-field" value={s.offer_minutes||33} onChange={set('offer_minutes')}/></div></div></>}</div>
<ScrollbarStudio s={s} setS={setS} setV={setV} t={t}/>
</div></>}

{sec==='dashboard-config'&&<div className="glass-card-solid p-4 sm:p-6"><SH icon={Layout} title="Command Center" subtitle="Configure your primary workflow hub." accent="brand"/><div className="mt-6 space-y-4"><div className="flex items-center gap-2"><Sliders size={16} className="text-brand-500"/><h4 className="font-bold text-sm">Module Visibility</h4></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><T label="Action Bar" desc="Quick-entry tools" checked={s.dash_action!==false} onChange={e=>setV('dash_action',e.target.checked)}/><T label="Telemetry" desc="Core financial metrics" checked={s.dash_telemetry!==false} onChange={e=>setV('dash_telemetry',e.target.checked)}/><T label="Pulse Charts" desc="Visual trend analysis" checked={s.dash_pulse!==false} onChange={e=>setV('dash_pulse',e.target.checked)}/><T label="Log Stream" desc="Real-time order data" checked={s.dash_log!==false} onChange={e=>setV('dash_log',e.target.checked)}/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"><div className="p-5 bg-gray-50 rounded-xl"><h4 className="font-bold text-sm mb-2">Greeting</h4><input className="input-field" value={s.dash_greeting||'Welcome back! 👋'} onChange={set('dash_greeting')}/><T label="Show Date" desc="Display system date" checked={s.dash_date!==false} onChange={e=>setV('dash_date',e.target.checked)}/></div><div className="p-5 bg-gray-50 rounded-xl"><h4 className="font-bold text-sm mb-2">Chart Type</h4><div className="flex gap-2 mb-2">{['AREA','LINE','BAR'].map(t=>(<button key={t} onClick={()=>setV('chart_type',t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${(s.chart_type||'AREA')===t?'bg-brand-500 text-white':'bg-gray-200 text-gray-500'}`}>{t}</button>))}</div></div></div></div>}

{sec==='users'&&<><div className="glass-card-solid p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2 mb-4"><span className="text-sm font-bold text-brand-600 border-b-2 border-brand-500 pb-2">Team Members</span><button onClick={()=>setShowStaff(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={14}/>Create New User</button></div>
{staff.length===0?<p className="text-center py-8 text-gray-400 text-sm">No team members yet</p>:
<div className="space-y-2">{staff.map(x=>{
  // Prefer the full role string (tpl_<id> or <uuid>) so the select matches
  // its option values. Fall back to a prefixed role_template_id if only that
  // column exists on the staff row.
  const cur = x.role || (x.role_template_id ? 'tpl_'+x.role_template_id : '');
  return(
  <div key={x.id} className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">{x.name?.[0]?.toUpperCase()}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-800 truncate">{x.name}</p>
        <p className="text-xs text-gray-400 truncate">{x.email||x.phone||'—'}</p>
      </div>
    </div>
    <select className="input-field !py-1.5 !px-2 text-sm w-full sm:w-52 shrink-0" value={cur} onChange={e=>changeStaffRole(x.id,e.target.value)}>
      <option value="">— Select role —</option>
      <optgroup label="Platform Roles">{platformTemplates.map(tpl=>{const lang=(document.documentElement.lang||'en').slice(0,2);const name=(tpl.name&&(tpl.name[lang]||tpl.name.en))||'Role';return(<option key={'tpl_'+tpl.id} value={'tpl_'+tpl.id}>{name}</option>);})}</optgroup>
      {storeRoles.length>0&&<optgroup label="My Store Roles">{storeRoles.map(tpl=><option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}</optgroup>}
      {/* When the saved role matches none of the options, still show it so the select is not stuck on "Select role —" */}
      {cur&&!platformTemplates.some(t=>'tpl_'+t.id===cur)&&!storeRoles.some(t=>String(t.id)===String(cur))&&<option value={cur}>{cur.replace(/^tpl_/,'').replace(/_/g,' ')}</option>}
    </select>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={()=>openEditStaff(x)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-sm">
        <Edit2 size={13}/>Edit
      </button>
      <button onClick={()=>removeStaff(x.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-500" title="Remove"><Trash2 size={14}/></button>
    </div>
  </div>);})}</div>}
</div>
<div className="glass-card-solid p-4 sm:p-6"><div className="flex items-center justify-between mb-4"><h3 className={`font-bold ${settingsIsDark?'text-gray-100':'text-gray-900'}`}>My Store Roles & Permissions</h3><button onClick={()=>setEditRole({name:'',description:'',permissions:[]})} className="btn-primary text-xs flex items-center gap-1"><Plus size={14}/>New Role</button></div><p className="text-[11px] text-gray-400 mb-4">Custom roles you define here affect only this store. They work alongside platform-defined roles.</p><div className="space-y-3">{storeRoles.length===0&&<p className={`text-sm ${settingsIsDark?'text-gray-400':'text-gray-500'}`}>No custom roles yet. Click "New Role" to create one.</p>}{storeRoles.map(tpl=>(<div key={tpl.id} className={`flex items-center justify-between p-4 rounded-xl ${settingsIsDark?'bg-gray-800 border border-gray-700':'bg-gray-50'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">{tpl.name?.[0]?.toUpperCase()}</div><div><p className={`font-bold ${settingsIsDark?'text-gray-100':'text-gray-800'}`}>{tpl.name} <span className="text-[9px] ml-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">STORE</span></p><p className={`text-xs ${settingsIsDark?'text-gray-400':'text-gray-400'}`}>{tpl.description||`${(tpl.permissions||[]).length} permissions`}</p></div></div><div className="flex gap-1"><button onClick={()=>setEditRole({id:tpl.id,name:tpl.name,description:tpl.description||'',permissions:tpl.permissions||[]})} className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><Edit2 size={14}/></button><button onClick={()=>deleteRole(tpl.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 size={14}/></button></div></div>))}</div>
<div className="mt-6 pt-6 border-t border-gray-100"><h4 className="font-bold text-sm mb-3 text-gray-500">Platform-Defined Roles</h4><p className="text-[11px] text-gray-400 mb-3">Click "Customize" to copy a platform role into a store-scoped role you can edit.</p><div className="space-y-2">{platformTemplates.length===0&&<p className="text-sm text-gray-400">None defined yet.</p>}{platformTemplates.map(tpl=>{const lang=(document.documentElement.lang||'en').slice(0,2);const name=(tpl.name&&(tpl.name[lang]||tpl.name.en))||'Role';const desc=(tpl.description&&(tpl.description[lang]||tpl.description.en))||`${(tpl.permissions||[]).length} permissions`;return(<div key={'tpl_'+tpl.id} className={`flex items-center justify-between p-3 rounded-xl ${settingsIsDark?'bg-gray-800 border border-gray-700':'bg-gray-50'}`}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-sm">{name[0]?.toUpperCase()}</div><div><p className={`font-bold text-sm ${settingsIsDark?'text-gray-100':'text-gray-800'}`}>{name} <span className="text-[9px] ml-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">PLATFORM</span></p><p className={`text-xs ${settingsIsDark?'text-gray-400':'text-gray-400'}`}>{desc}</p></div></div><div className="flex items-center gap-2"><span className={`text-xs font-medium ${settingsIsDark?'text-purple-300':'text-purple-500'}`}>{(tpl.permissions||[]).length} perms</span><button onClick={()=>customizePlatformRole(tpl)} className="btn-ghost text-xs flex items-center gap-1"><Edit2 size={12}/>Customize</button></div></div>);})}</div></div></div>
{editRole&&<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>setEditRole(null)}><div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}><div className="p-5 border-b flex items-center justify-between"><h3 className="font-bold text-lg">{editRole.id?'Edit Role':'New Role'}</h3><button onClick={()=>setEditRole(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button></div><div className="p-5 space-y-4"><div><label className="input-label">Role Name</label><input className="input-field" value={editRole.name} onChange={e=>setEditRole({...editRole,name:e.target.value})} placeholder="e.g. Shipping Manager"/></div><div><label className="input-label">Description</label><input className="input-field" value={editRole.description} onChange={e=>setEditRole({...editRole,description:e.target.value})} placeholder="Optional description"/></div><div><label className="input-label">Permissions ({editRole.permissions?.length||0}/{ALL_PERMISSIONS.length})</label><div className="space-y-3 mt-2">{PERM_GROUPS.map(group=>(<div key={group} className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-500 uppercase mb-2">{group}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{ALL_PERMISSIONS.filter(p=>p.group===group).map(p=>{const on=(editRole.permissions||[]).includes(p.key);return(<label key={p.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white"><input type="checkbox" checked={on} onChange={()=>togglePerm(p.key)}/><span className="text-sm text-gray-700">{p.label}</span></label>);})}</div></div>))}</div></div></div><div className="p-5 border-t flex justify-end gap-2"><button onClick={()=>setEditRole(null)} className="btn-ghost text-sm">Cancel</button><button onClick={saveRole} className="btn-primary text-sm flex items-center gap-1"><Save size={14}/>Save Role</button></div></div></div>}</>}

{sec==='checkout'&&<div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6"><div className="space-y-4 min-w-0"><SH icon={ShoppingCart} title="Purchase Flow" subtitle="Optimize visitor to customer conversion." accent="purple"/>

{/* Order success message + logo customization. Shown to the buyer right
    after they place an order. Logo defaults to the store logo if unset. */}
<div className="glass-card-solid p-4 sm:p-6 space-y-3">
  <h3 className="font-bold flex items-center gap-2"><Check size={16} className="text-emerald-500"/>{t('storePage.successPageBlock','Order Success Page')}</h3>
  <p className="text-[11px] text-gray-400">{t('storePage.successPageHelp','Customize what the buyer sees right after placing an order.')}</p>
  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-start">
    <div>
      <label className="input-label text-xs">{t('storePage.successLogo','Logo')}</label>
      <div className="flex flex-col items-center gap-1">
        {(s.success_logo||s.logo) ? (
          <img src={s.success_logo||s.logo} alt="" className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"><Check size={26} className="text-emerald-600"/></div>
        )}
        <input type="file" accept="image/*" onChange={e=>{
          const f=e.target.files?.[0];if(!f)return;
          if(f.size>2*1024*1024){toast.error(t('storePage.imageTooLarge','Image too large'));return;}
          const r=new FileReader();r.onload=()=>setV('success_logo',r.result);r.readAsDataURL(f);
        }} className="text-[10px] text-gray-500 mt-1"/>
        {s.success_logo&&<button type="button" onClick={()=>setV('success_logo','')} className="text-[10px] text-red-500 hover:underline">{t('storePage.removePhoto','Remove')}</button>}
      </div>
    </div>
    <div className="space-y-2">
      <div>
        <label className="input-label text-xs">{t('storePage.successTitle','Title')}</label>
        <input className="input-field" value={s.success_title||''} onChange={set('success_title')} placeholder={t('storePage.successTitlePh','Order placed successfully!')}/>
      </div>
      <div>
        <label className="input-label text-xs">{t('storePage.successSubtitle','Subtitle / Message')}</label>
        <textarea className="input-field" rows={3} value={s.success_subtitle||''} onChange={set('success_subtitle')} placeholder={t('storePage.successSubtitlePh','Thanks for your order — we will contact you shortly to confirm.')}/>
      </div>
    </div>
  </div>
</div>

{/* Store-wide coupon — applies a percentage discount to the cart total
    when the buyer enters this code at checkout. Per-product coupons set
    on individual products still apply on top. */}
<div className="glass-card-solid p-4 sm:p-6 space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="font-bold flex items-center gap-2"><Percent size={16} className="text-amber-500"/>{t('storePage.storeCoupon','Store-wide Coupon')}</h3>
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!s.store_coupon_active} onChange={e=>setV('store_coupon_active',e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-600"/>
      <span className="text-xs font-bold text-gray-600">{s.store_coupon_active?t('storePage.couponActive','Active'):t('storePage.couponInactive','Inactive')}</span>
    </label>
  </div>
  <p className="text-[11px] text-gray-400">{t('storePage.storeCouponHelp','One coupon code that works on every product in this store. Applied to the cart subtotal at checkout.')}</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div><label className="input-label text-xs">{t('storePage.couponCode','Code')}</label><input className="input-field uppercase font-mono" placeholder="SAVE10" value={s.store_coupon_code||''} onChange={e=>setV('store_coupon_code',e.target.value.toUpperCase())} disabled={!s.store_coupon_active}/></div>
    <div><label className="input-label text-xs">{t('storePage.couponDiscountPercent','Discount %')}</label><input type="number" min="0" max="100" step="0.5" className="input-field" placeholder="10" value={s.store_coupon_discount_percent||''} onChange={set('store_coupon_discount_percent')} disabled={!s.store_coupon_active}/></div>
  </div>
</div>

<div className="glass-card-solid p-4 sm:p-6 space-y-3"><h3 className="font-bold flex items-center gap-2"><Lock size={16}/>Data Collection</h3><div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm">Full Name</p><p className="text-[10px] text-gray-400">Primary identifier</p></div><span className="badge badge-danger text-[10px]">REQUIRED</span></div><div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm">Phone Number</p><p className="text-[10px] text-gray-400">Delivery coordination</p></div><span className="badge badge-danger text-[10px]">REQUIRED</span></div><T label="Email Collection" desc="Automated invoice flow." checked={s.checkout_email} onChange={e=>setV('checkout_email',e.target.checked)}/></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-3"><h3 className="font-bold flex items-center gap-2"><Zap size={16}/>Experience</h3><T label="Cart Drawer" desc="Side-cart on click." checked={s.cart_drawer} onChange={e=>setV('cart_drawer',e.target.checked)}/><T label="Order Notes" desc="Special instructions." checked={s.order_notes} onChange={e=>setV('order_notes',e.target.checked)}/><T label="Trust Signals" desc="Security badges." checked={s.trust_signals!==false} onChange={e=>setV('trust_signals',e.target.checked)}/><T label="Sticky Checkout" desc="Always visible Buy Now." checked={s.sticky_checkout} onChange={e=>setV('sticky_checkout',e.target.checked)}/><T label="Show Savings" desc="Highlight discounts." checked={s.show_savings} onChange={e=>setV('show_savings',e.target.checked)}/></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-3"><div className="flex items-center gap-2"><Code size={16}/><h3 className="font-bold">Custom Scripts</h3></div><textarea className="input-field font-mono text-xs" rows={3} value={s.post_script||''} onChange={set('post_script')} placeholder="<script>...</script>"/><p className="text-[10px] text-gray-400">Runs on checkout page only.</p></div></div><div className="lg:sticky lg:top-4 lg:self-start"><CheckoutPreview s={s}/></div></div>}

{sec==='shipping'&&<><SH icon={Truck} title="Shipping & Delivery" subtitle="Manage delivery zones and rates." accent="blue"/>
<div className="glass-card-solid p-4 sm:p-6 mt-4"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Shipping Wilayas ({wilayas.length}/58)</h3><div className="flex gap-2"><button onClick={()=>window.location.href='/dashboard/shipping-wilayas'} className="btn-primary text-xs flex items-center gap-1"><ExternalLink size={12}/>Manage in Detail</button></div></div>
<div className="glass-card-solid p-4 mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><Truck size={18} className="text-cyan-500"/><div><p className="font-bold text-sm text-gray-900">Tracking Orders</p><p className="text-xs text-gray-400">Track shipments with delivery partners</p></div></div><button onClick={()=>window.location.href='/dashboard/tracking-orders'} className="btn-ghost text-xs flex items-center gap-1"><ExternalLink size={12}/>Open</button></div>{wilayas.length===0?<p className="text-center py-8 text-gray-400">Loading wilayas…</p>:<div className="max-h-72 overflow-y-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-white"><tr className="text-left text-xs text-gray-400 uppercase"><th className="pb-2">Code</th><th className="pb-2">Wilaya</th><th className="pb-2">Desk</th><th className="pb-2">Home</th><th className="pb-2">Days</th></tr></thead><tbody>{wilayas.map(w=>(<tr key={w.id} className="border-t border-gray-50"><td className="py-2 font-mono text-xs text-gray-400">{w.wilaya_code}</td><td className="font-medium">{w.wilaya_name}</td><td>{w.desk_delivery_price} DZD</td><td>{w.home_delivery_price} DZD</td><td>{w.delivery_days}d</td></tr>))}</tbody></table></div>}</div></>}

{sec==='payments'&&<div className="glass-card-solid p-4 sm:p-6 space-y-4"><h3 className="font-bold mb-2">Payment Methods</h3><T label="Cash on Delivery (COD)" desc="Pay in cash upon delivery." checked={s.enable_cod} onChange={set('enable_cod')}/><T label="CCP Direct Transfer" checked={s.enable_ccp} onChange={set('enable_ccp')}/>{s.enable_ccp&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-brand-200"><div><label className="input-label text-xs">CCP Account</label><input className="input-field" value={s.ccp_account||''} onChange={set('ccp_account')}/></div><div><label className="input-label text-xs">CCP Name</label><input className="input-field" value={s.ccp_name||''} onChange={set('ccp_name')}/></div></div>}<T label="BaridiMob QR" checked={s.enable_baridimob} onChange={set('enable_baridimob')}/>{s.enable_baridimob&&<div className="pl-4 border-l-2 border-brand-200 space-y-3"><div><label className="input-label text-xs">RIP</label><input className="input-field" value={s.baridimob_rip||''} onChange={set('baridimob_rip')}/></div><div><label className="input-label text-xs">BaridiMob QR Code (shown to buyers at checkout)</label><div className="flex items-center gap-4 mt-1">{s.baridimob_qr&&<img src={s.baridimob_qr} className="w-24 h-24 rounded-xl border object-cover" alt="QR"/>}<div className="flex-1"><div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400" onClick={()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{setS({...s,baridimob_qr:r.result});toast.success('QR uploaded!');};r.readAsDataURL(f);};inp.click();}}><Upload size={16} className="mx-auto text-gray-400 mb-1"/><p className="text-xs text-gray-500">{s.baridimob_qr?'Replace QR':'Upload QR image'}</p></div></div></div></div></div>}<T label="Bank Transfer" checked={s.enable_bank_transfer} onChange={set('enable_bank_transfer')}/>{s.enable_bank_transfer&&<div className="grid grid-cols-3 gap-2 sm:gap-3 pl-4 border-l-2 border-brand-200"><div><label className="input-label text-xs">Bank</label><input className="input-field" value={s.bank_name||''} onChange={set('bank_name')}/></div><div><label className="input-label text-xs">Account</label><input className="input-field" value={s.bank_account||''} onChange={set('bank_account')}/></div><div><label className="input-label text-xs">RIB</label><input className="input-field" value={s.bank_rib||''} onChange={set('bank_rib')}/></div></div>}</div>}

{sec==='notifications'&&<><SH icon={Bell} title="Notification Center" subtitle="Configure alerts for your store events." accent="purple"/>
<div className="glass-card-solid p-4 sm:p-6 space-y-4 mt-4"><h3 className="font-bold text-sm flex items-center gap-2"><Smartphone size={16} className="text-blue-500"/>Push Alerts</h3><T label="Order updates" desc="New orders and status changes" checked={s.notify_orders!==false} onChange={e=>setV('notify_orders',e.target.checked)}/><T label="Stock alerts" desc="Low stock notifications" checked={s.notify_stock!==false} onChange={e=>setV('notify_stock',e.target.checked)}/><T label="Customer activity" desc="New registrations" checked={s.notify_customers} onChange={e=>setV('notify_customers',e.target.checked)}/></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-4"><h3 className="font-bold text-sm flex items-center gap-2"><Mail size={16} className="text-purple-500"/>Email Digests</h3><T label="Email alerts" desc="Daily summary and critical alerts" checked={s.email_alerts!==false} onChange={e=>setV('email_alerts',e.target.checked)}/><div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3"><Mail size={16} className="text-gray-400"/><div><p className="text-sm font-medium text-gray-700">{profile.email||user?.email||'admin@store.com'}</p><p className="text-[10px] text-gray-400">Admin recipient for all system emails</p></div></div></div></>}

{sec==='orders-config'&&<><SH icon={Package} title="Order Configuration" subtitle="Sequencing logic and archiving rules." accent="blue"/>
<div className="glass-card-solid p-4 sm:p-6 space-y-4 mt-4"><h3 className="font-bold text-sm flex items-center gap-2"><Hash size={16} className="text-blue-500"/>Order ID Format</h3><div className="p-4 bg-blue-50 rounded-xl text-center mb-4"><p className="text-[10px] font-bold text-blue-400 uppercase">Preview</p><p className="text-2xl font-black text-gray-900 mt-1">{s.order_prefix||'DZ-'}<span className="text-brand-500">{s.order_start_number||'100000'}</span>{s.order_suffix?`-${s.order_suffix}`:''}</p></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><label className="input-label text-xs">Prefix</label><input className="input-field font-mono" value={s.order_prefix||'DZ-'} onChange={set('order_prefix')}/></div><div><label className="input-label text-xs">Start Number</label><input type="number" className="input-field font-mono" value={s.order_start_number||100000} onChange={set('order_start_number')}/></div><div><label className="input-label text-xs">Suffix</label><input className="input-field font-mono" value={s.order_suffix||''} onChange={set('order_suffix')} placeholder="Optional"/></div></div></div>
<div className="glass-card-solid p-4 sm:p-6"><T label="Auto-Archive" desc="Move completed orders to archive after 30 days." checked={s.auto_archive!==false} onChange={e=>setV('auto_archive',e.target.checked)}/></div></>}

{sec==='customers-config'&&<><SH icon={Shield} title="Security & Filtering" subtitle="Protect your store from fraudulent transactions." accent="emerald"/>
<div className="glass-card-solid p-4 sm:p-6 space-y-4 mt-4"><h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/>Blacklist Automation</h3><div className="p-3 bg-red-50 rounded-xl text-sm text-red-700 mb-3">Auto-blacklist customers exceeding cancellation threshold.</div><T label="Enable Auto Blacklist" desc="Automatic blacklisting on repeated cancellations." checked={s.auto_blacklist} onChange={e=>setV('auto_blacklist',e.target.checked)}/>{s.auto_blacklist&&<div className="pl-4 border-l-2 border-red-200"><label className="input-label text-xs">Threshold</label><input type="number" className="input-field !w-24" value={s.blacklist_threshold||3} onChange={set('blacklist_threshold')} min={1}/><p className="text-[10px] text-gray-400 mt-1">Cancellations before auto-blacklist</p></div>}</div></>}

{sec==='inventory'&&<><SH icon={Package} title="Inventory Management" subtitle="Stock tracking and visibility policies." accent="orange"/>
<div className="glass-card-solid p-4 sm:p-6 space-y-4 mt-4"><T label="Manage Stock" desc="Track product stock levels automatically." checked={s.manage_stock!==false} onChange={e=>setV('manage_stock',e.target.checked)}/><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="input-label text-xs">Low Stock Threshold</label><input type="number" className="input-field font-mono" value={s.low_stock_threshold||5} onChange={set('low_stock_threshold')} min={0}/><p className="text-[10px] text-gray-400 mt-1">Flag items below this count</p></div><div className="flex items-center"><T label="Show Stock on Storefront" desc="Display 'Only X left' message." checked={s.show_stock_storefront} onChange={e=>setV('show_stock_storefront',e.target.checked)}/></div></div></div><div className="flex gap-3"><SP label="Total SKUs" value={currentStore?.product_count||0} color="brand"/><SP label="Health" value="85% in stock" color="emerald"/></div></>}

{sec==='domains'&&<><SH icon={Globe} title="Domain Management" subtitle="Connect custom domains and manage your store URL." accent="blue"/>
<div className="glass-card-solid p-4 sm:p-6 mt-4"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Platform URL</p><div className="flex flex-wrap items-center gap-3"><p className="font-mono font-bold text-gray-900 break-all">{window.location.origin}/{currentStore?.slug}</p><span className="badge badge-success text-[10px]">FREE</span><button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/${currentStore?.slug}`);toast.success('Copied!');}} className="p-1.5 hover:bg-gray-100 rounded"><Copy size={14} className="text-gray-400"/></button></div></div>
<div className="glass-card-solid p-4 sm:p-6"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><Globe size={20} className="text-brand-500"/></div><div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900">Connect a Custom Domain</h3><p className="text-xs text-gray-500 mt-1">Use your own domain (e.g. mystore.com) for your store. Add the domain, configure DNS records, and verify the connection — all in one place.</p><button onClick={()=>window.location.href='/dashboard/domains'} className="btn-primary text-sm mt-4 flex items-center gap-2"><ExternalLink size={14}/>Open Domain Manager</button></div></div></div>
<div className="glass-card-solid p-4 sm:p-6 space-y-3"><h3 className="font-bold text-sm mb-3">Security</h3><T label="Force HTTPS" desc="Secure connections." checked={s.force_https!==false} onChange={e=>setV('force_https',e.target.checked)}/><T label="Redirect www" desc="www to root." checked={s.redirect_www!==false} onChange={e=>setV('redirect_www',e.target.checked)}/><T label="Clean URLs" desc="Remove .html extensions." checked={s.clean_urls!==false} onChange={e=>setV('clean_urls',e.target.checked)}/></div></>}

{sec==='ai'&&<>
  <SH icon={Bot} title="AI Messaging Agent" subtitle="Automated WhatsApp messaging for your store." accent="brand"/>
  {/* WhatsApp Card - Click to open modal */}
  <div onClick={()=>{if(!waStatus)waCheckStatus();setShowWaModal(true);}} className="glass-card-solid p-5 sm:p-6 mt-4 cursor-pointer hover:ring-2 hover:ring-emerald-300 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <MessageCircle size={28} className="text-white"/>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-gray-900 text-lg">WhatsApp Automation</h3>
        <p className="text-xs text-gray-400 mt-0.5">Send order updates, confirmations & cart recovery via WhatsApp</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {waStatus?.connected?<span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={12}/>Connected</span>:<span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 flex items-center gap-1"><WifiOff size={12}/>Not connected</span>}
        <ChevronRight size={20} className="text-gray-400 group-hover:text-emerald-500 transition-colors"/>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase">Status Updates</p><p className="text-lg font-black text-emerald-700">{WA_STATUSES.length}</p></div>
      <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-[10px] font-bold text-blue-600 uppercase">Language</p><p className="text-lg font-black text-blue-700">{(s.wa_language||'fr').toUpperCase()}</p></div>
      <div className="p-3 bg-purple-50 rounded-xl text-center"><p className="text-[10px] font-bold text-purple-600 uppercase">Cart Recovery</p><p className="text-lg font-black text-purple-700">{s.wa_abandoned_cart_enabled?'ON':'OFF'}</p></div>
    </div>
  </div>
</>}

{sec==='account'&&<><div className="glass-card-solid p-4 sm:p-6"><h3 className="font-bold text-lg text-gray-900 mb-4">Profile</h3><div className="flex items-start gap-8"><div className="flex-1 space-y-4"><div><label className="input-label text-xs">Full Name</label><input className="input-field" value={profile.full_name||''} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="input-label text-xs">Username</label>{usernameEdit?<div className="flex gap-2"><input className="input-field flex-1" value={newUsername} onChange={e=>setNewUsername(e.target.value)}/><button onClick={saveUsername} className="btn-primary text-xs">Save</button><button onClick={()=>setUsernameEdit(false)} className="btn-ghost text-xs">×</button></div>:<div className="flex gap-2"><input className="input-field flex-1" value={profile.username||''} readOnly/><button onClick={()=>setUsernameEdit(true)} className="px-3 py-2 border border-brand-500 text-brand-600 rounded-xl text-xs font-bold">Change</button></div>}</div></div><div><label className="input-label text-xs">Email</label>{emailEdit?<div className="space-y-2"><input className="input-field" placeholder="New email" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/><input type="password" className="input-field" placeholder="Password to confirm" value={emailPw} onChange={e=>setEmailPw(e.target.value)}/><div className="flex gap-2"><button onClick={saveEmail} className="btn-primary text-xs">Save</button><button onClick={()=>{setEmailEdit(false);setEmailPw('');}} className="btn-ghost text-xs">×</button></div></div>:<div className="flex gap-2"><input className="input-field flex-1" value={profile.email||''} readOnly/><button onClick={()=>setEmailEdit(true)} className="px-3 py-2 border border-brand-500 text-brand-600 rounded-xl text-xs font-bold">Change</button></div>}</div></div><div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center"><User size={32} className="text-gray-400"/></div></div><button onClick={saveProfile} disabled={profileLoading} className="btn-primary text-sm mt-4">{profileLoading?'Saving...':'Save Profile'}</button></div>
<div className="glass-card-solid p-4 sm:p-6"><h3 className="font-bold text-sm mb-3">Password</h3><div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"><div className="flex items-center gap-3"><Key size={18} className="text-amber-500"/><div><p className="font-medium text-sm">Security Credentials</p><p className="text-[10px] text-gray-400">Change your account password</p></div></div><button onClick={()=>setShowPwSection(!showPwSection)} className="text-sm text-brand-600 font-medium">Update</button></div>{showPwSection&&<div className="mt-4 space-y-3 pl-4 border-l-2 border-brand-200"><div><label className="input-label text-xs">Current Password</label><input type="password" className="input-field" value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})}/></div><div><label className="input-label text-xs">New Password</label><input type="password" className="input-field" value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})}/></div><div><label className="input-label text-xs">Confirm</label><input type="password" className="input-field" value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})}/></div><button onClick={changePassword} className="btn-primary text-sm">Update Password</button></div>}</div>
<div className="glass-card-solid p-4 sm:p-6"><h3 className="font-bold text-sm mb-3">Interface Language</h3><div className="grid grid-cols-3 gap-2 sm:gap-3">{[{c:'en',l:'EN'},{c:'fr',l:'FR'},{c:'ar',l:'العربية'}].map(x=>(<button key={x.c} onClick={()=>setV('interface_language',x.c)} className={`p-3 rounded-xl border-2 text-center font-bold ${(s.interface_language||'en')===x.c?'border-brand-500 bg-brand-50':'border-gray-200'}`}>{x.l}</button>))}</div></div>
<div className="grid lg:grid-cols-2 gap-6">
<div className="glass-card-solid p-4 sm:p-6 border-2 border-red-100"><h3 className="font-bold text-sm text-red-600 mb-3 flex items-center gap-2"><AlertTriangle size={14}/>Danger Zone</h3><p className="text-xs text-gray-400 mb-4">Permanently delete your account. This is irreversible.</p>{deleteConfirm?<div className="space-y-3"><input type="password" className="input-field" placeholder="Password to confirm" value={deletePw} onChange={e=>setDeletePw(e.target.value)}/><div className="flex gap-2"><button onClick={deleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Confirm Delete</button><button onClick={()=>{setDeleteConfirm(false);setDeletePw('');}} className="btn-ghost text-sm">Cancel</button></div></div>:<button onClick={()=>setDeleteConfirm(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">DELETE MY ACCOUNT</button>}</div></div></>}

{sec==='taxes'&&<><SH icon={Percent} title="Tax Configuration" subtitle="Set your tax rate — applied storewide on checkout & invoices." accent="purple"/>
<div className="glass-card-solid p-4 sm:p-6 mt-4 space-y-4">
  <T label="Enable Tax" desc="Apply tax to all orders" checked={s.config?.tax_enabled} onChange={e=>setS({...s,config:{...(s.config||{}),tax_enabled:e.target.checked}})}/>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div><label className="input-label text-xs">Tax Rate (%)</label><input type="number" step="0.01" min="0" max="100" className="input-field" value={s.config?.tax_rate||0} onChange={e=>setS({...s,config:{...(s.config||{}),tax_rate:parseFloat(e.target.value)||0}})}/></div>
    <div><label className="input-label text-xs">Label</label><input className="input-field" value={s.config?.tax_label||'TVA'} onChange={e=>setS({...s,config:{...(s.config||{}),tax_label:e.target.value}})}/></div>
    <div><label className="input-label text-xs">Price Mode</label><select className="input-field" value={s.config?.tax_inclusive?'inclusive':'exclusive'} onChange={e=>setS({...s,config:{...(s.config||{}),tax_inclusive:e.target.value==='inclusive'}})}><option value="exclusive">Tax-exclusive (added at checkout)</option><option value="inclusive">Tax-inclusive (included in price)</option></select></div>
  </div>
  <div className="flex flex-wrap gap-2"><span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Quick presets:</span>
    {[{l:'TVA 19%',v:19},{l:'TVA 9%',v:9},{l:'TAP 2%',v:2},{l:'0%',v:0}].map(p=><button key={p.l} onClick={()=>setS({...s,config:{...(s.config||{}),tax_rate:p.v}})} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${(s.config?.tax_rate||0)===p.v?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>{p.l}</button>)}
  </div>
  <p className="text-xs text-gray-400">For detailed revenue-based tax calculations, visit the <button onClick={()=>window.location.href='/dashboard/taxes'} className="text-brand-600 font-bold hover:underline">Taxes page</button>.</p>
</div></>}

{sec==='tracking-pixels'&&<><SH icon={TrendingUp} title="Tracking Pixels" subtitle="Measure ad performance and conversions." accent="purple"/>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
{[{id:'facebook_pixel',name:'Facebook Pixel',color:'#1877F2',ph:'123456789012345',field:'Pixel ID'},
  {id:'tiktok_pixel',name:'TikTok Pixel',color:'#000000',ph:'CXXXXXXXXXXXXXXXXX',field:'Pixel ID'},
  {id:'google_analytics',name:'Google Analytics',color:'#F9AB00',ph:'G-XXXXXXXXXX',field:'Measurement ID'},
  {id:'google_sheets',name:'Google Sheets',color:'#0F9D58',ph:'https://script.google.com/...',field:'Webhook URL'},
  {id:'snapchat_pixel',name:'Snapchat Pixel',color:'#FFFC00',ph:'xxxxxxxx-xxxx',field:'Pixel ID'},
].map(px=>{const tp=s.tracking_pixels||{};const c=tp[px.id]||{};const on=!!c.enabled;return(
  <div key={px.id} className={`glass-card-solid p-5 transition-all ${on?'ring-2 ring-offset-2':''}`} style={on?{ringColor:px.color}:{}}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{backgroundColor:px.color}}><span className="font-bold text-sm">{px.name[0]}</span></div>
      <div className="flex-1"><h4 className="font-bold text-sm">{px.name}</h4></div>
      <button onClick={()=>{const ntp={...tp,[px.id]:{...c,enabled:!on}};setS({...s,tracking_pixels:ntp});}} className="shrink-0">
        <div className={`w-11 h-6 rounded-full transition-colors relative ${on?'':'bg-gray-300'}`} style={on?{backgroundColor:px.color}:{}}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on?'translate-x-5':'translate-x-0.5'}`}/></div>
      </button>
    </div>
    {on&&<div><label className="text-xs font-bold text-gray-500 uppercase">{px.field}</label><input className="input-field font-mono text-sm mt-1" placeholder={px.ph} value={c.value||''} onChange={e=>{const ntp={...tp,[px.id]:{...c,value:e.target.value}};setS({...s,tracking_pixels:ntp});}}/>
      <div className="flex gap-2 mt-2">
        <button onClick={async()=>{if(!c.value){toast.error('Enter the '+px.field+' first');return;}try{await ownerApi.updateStore(currentStore.id,{tracking_pixels:s.tracking_pixels});toast.success(px.name+' applied ✓');}catch{toast.error('Failed to apply');}}} className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1" style={{backgroundColor:px.color,color:px.color==='#FFFC00'?'#000':'#fff'}}><Check size={12}/>Apply</button>
        <button onClick={async()=>{
          if(!c.value){toast.error('Enter the '+px.field+' first');return;}
          const v=String(c.value).trim();
          let ok=false,reason='';
          // Format validation per provider
          if(px.id==='facebook_pixel'){ok=/^\d{10,20}$/.test(v);reason=ok?'Format OK — Facebook accepts numeric IDs (10-20 digits)':'Invalid format. Facebook Pixel ID is 15-16 numeric digits.';}
          else if(px.id==='tiktok_pixel'){ok=/^C[A-Z0-9]{15,30}$/i.test(v);reason=ok?'Format OK — TikTok pixel codes start with C':'Invalid format. TikTok Pixel ID starts with "C" followed by alphanumeric chars.';}
          else if(px.id==='google_analytics'){ok=/^(G|UA|AW)-[A-Z0-9-]+$/i.test(v);reason=ok?'Format OK — GA4 (G-) / Universal (UA-) / Ads (AW-) accepted':'Invalid format. Should look like G-XXXXXXXXXX.';}
          else if(px.id==='google_sheets'){ok=/^https?:\/\/script\.google\.com\//i.test(v);reason=ok?'URL format OK':'Invalid URL. Must be a script.google.com macro URL.';
            if(ok){try{const r=await fetch(v,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({test:true,timestamp:Date.now()})});reason+=' — request sent (no-cors prevents reading response, check your Sheet)';}catch(e){ok=false;reason='Request failed: '+e.message;}}}
          else if(px.id==='snapchat_pixel'){ok=/^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(v)||/^[a-f0-9-]{8,}$/i.test(v);reason=ok?'Format OK':'Invalid format. Snapchat Pixel ID looks like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.';}
          else{ok=v.length>3;reason=ok?'OK':'Value seems too short';}
          if(ok)toast.success('✓ '+reason,{duration:5000});else toast.error('✗ '+reason,{duration:5000});
        }} className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1"><Send size={12}/>Test</button>
      </div>
    </div>}
  </div>);})}</div></>}

{sec==='subscription'&&<SubscriptionSection/>}

      </div>
    </div>
    </>)}
    <WhatsAppConfigModal show={showWaModal} onClose={()=>setShowWaModal(false)} storeId={currentStore?.id} initialConfig={s} onSave={(cfg)=>{setS(cfg);save();}}/>
    {showRole&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowRole(null)}><div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Role: {roles[showRole]?.label}</h2><button onClick={()=>setShowRole(null)} className="text-gray-400 hover:text-gray-600">✕</button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[['Orders',['View Dashboard','View Orders','Manage Orders','Delete Orders','Confirm Orders','Prepare Orders']],['Products',['View Products','Manage Products','Delete Products']],['Customers',['View Customers','Manage Customers']]].map(([cat,perms])=>(<div key={cat}><h4 className="font-bold text-xs text-gray-500 uppercase mb-2">{cat}</h4>{perms.map(p=>{const has=roles[showRole]?.perms.includes(p);return(<label key={p} className="flex items-center gap-2 mb-1.5"><div className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs ${has?'bg-brand-500':'bg-gray-200'}`}>{has&&<Check size={12}/>}</div><span className="text-sm text-gray-700">{p}</span></label>);})}</div>))}</div><button onClick={()=>setShowRole(null)} className="btn-primary w-full mt-6">Close</button></div></div>}
    {editStaff&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3" onClick={()=>setEditStaff(null)}><div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4 sm:mb-6"><h2 className="text-xl font-bold">Edit Team Member</h2><button onClick={()=>setEditStaff(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button></div>
      <div className="space-y-3">
        <div><label className="input-label">Name</label><input className="input-field" value={editStaff.name} onChange={e=>setEditStaff({...editStaff,name:e.target.value})}/></div>
        <div><label className="input-label">Email</label><input className="input-field" value={editStaff.email} onChange={e=>setEditStaff({...editStaff,email:e.target.value})}/></div>
        <div><label className="input-label">Phone</label><input className="input-field" value={editStaff.phone} onChange={e=>setEditStaff({...editStaff,phone:e.target.value})}/></div>
        <div><label className="input-label">New Password <span className="text-xs text-gray-400 font-normal">(leave empty to keep current)</span></label><input type="password" className="input-field" value={editStaff.password} onChange={e=>setEditStaff({...editStaff,password:e.target.value})}/></div>
        <div><label className="input-label">Role</label><select className="input-field" value={editStaff.role} onChange={e=>setEditStaff({...editStaff,role:e.target.value})}>
          <option value="">— Select role —</option>
          <optgroup label="Platform Roles">{platformTemplates.map(tpl=>{const lang=(document.documentElement.lang||'en').slice(0,2);const name=(tpl.name&&(tpl.name[lang]||tpl.name.en))||'Role';return(<option key={'tpl_'+tpl.id} value={'tpl_'+tpl.id}>{name}</option>);})}</optgroup>
          {storeRoles.length>0&&<optgroup label="My Store Roles">{storeRoles.map(tpl=><option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}</optgroup>}
        </select></div>
      </div>
      <div className="flex gap-2 mt-5"><button onClick={()=>setEditStaff(null)} className="btn-ghost flex-1">Cancel</button><button onClick={saveEditStaff} className="btn-primary flex-1">Save</button></div>
    </div></div>}
    {showStaff && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3" onClick={()=>setShowStaff(false)}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('storePage.createUser','Create User')}</h2>
            <button onClick={()=>setShowStaff(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-300"><X size={16}/></button>
          </div>
          <div className="space-y-3">
            {/* Profile photo */}
            <div>
              <label className="input-label">{t('storePage.profilePhoto','Profile Photo')}</label>
              <div className="flex items-center gap-3">
                {sf.avatar
                  ? <img src={sf.avatar} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"/>
                  : <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-lg shrink-0">{(sf.name||'?')[0]?.toUpperCase()}</div>}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={e=>{
                    const f=e.target.files?.[0];if(!f)return;
                    if(f.size>3*1024*1024)return toast.error(t('storePage.imageTooLarge','Image too large (max 3MB)'));
                    const r=new FileReader();r.onload=()=>setSf(p=>({...p,avatar:r.result}));r.readAsDataURL(f);
                  }} className="text-xs text-gray-500 dark:text-gray-400"/>
                  {sf.avatar&&<button type="button" onClick={()=>setSf({...sf,avatar:''})} className="block text-[11px] text-red-500 mt-1 hover:underline">{t('storePage.removePhoto','Remove photo')}</button>}
                </div>
              </div>
            </div>

            <div><label className="input-label">{t('storePage.name','Name')} *</label><input className="input-field" value={sf.name} onChange={e=>setSf({...sf,name:e.target.value})}/></div>
            <div><label className="input-label">{t('storePage.email','Email')}</label><input className="input-field" value={sf.email} onChange={e=>setSf({...sf,email:e.target.value})}/></div>
            <div><label className="input-label">{t('storePage.phone','Phone')}</label><input className="input-field" value={sf.phone} onChange={e=>setSf({...sf,phone:e.target.value})}/></div>
            <div><label className="input-label">{t('storePage.passwordRequired','Password *')}</label><input type="password" className="input-field" value={sf.password} onChange={e=>setSf({...sf,password:e.target.value})}/></div>
            {/* Confirm password — must match the password above. */}
            <div>
              <label className="input-label">{t('storePage.confirmPassword','Confirm Password')} *</label>
              <input type="password" className="input-field" value={sf.confirmPassword} onChange={e=>setSf({...sf,confirmPassword:e.target.value})}/>
              {sf.confirmPassword&&sf.password!==sf.confirmPassword&&(
                <p className="mt-1 text-xs text-red-500">{t('storePage.passwordsDontMatch','Passwords do not match')}</p>
              )}
            </div>

            {/* Stores access — opens a popup list of every store the admin owns. */}
            <div>
              <label className="input-label">{t('storePage.assignedStores','Stores this user can access')}</label>
              {(()=>{
                const allIds=Array.isArray(adminStores)?adminStores.map(s=>s.id):[];
                const picked=Array.from(new Set([...(sf.assigned_store_ids||[]),...(currentStore?.id?[currentStore.id]:[])])).filter(id=>allIds.includes(id)||id===currentStore?.id);
                return(
                  <button type="button" onClick={()=>setSfStorePickerOpen(true)} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 transition-all text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShoppingBag size={16} className="text-brand-500 shrink-0"/>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{picked.length} {picked.length===1?t('storePage.storeSingular','store'):t('storePage.storePlural','stores')} {t('storePage.selected','selected')}</p>
                        <p className="text-[11px] text-gray-400 truncate">{picked.slice(0,3).map(id=>(adminStores||[]).find(s=>s.id===id)?.name||(id===currentStore?.id?currentStore?.name:'')).filter(Boolean).join(' · ')}{picked.length>3?` +${picked.length-3}`:''}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold shrink-0">{t('storePage.choose','Choose')}</span>
                  </button>
                );
              })()}
            </div>

            <div>
              <label className="input-label">{t('storePage.role','Role')}</label>
              <select className="input-field" value={sf.role} onChange={e=>setSf({...sf,role:e.target.value})}>
                <option value="">{t('storePage.selectRole','Select a role…')}</option>
                {platformTemplates.map(tpl=>{const lang=(document.documentElement.lang||'en').slice(0,2);const name=(tpl.name&&(tpl.name[lang]||tpl.name.en))||'Role';return(<option key={'tpl_'+tpl.id} value={'tpl_'+tpl.id}>{name}</option>);})}
              </select>
              {platformTemplates.length===0&&<p className="text-[10px] text-gray-400 mt-1">{t('storePage.noRolesPlatform','No roles defined by platform yet.')}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>setShowStaff(false)} className="btn-ghost flex-1">{t('storePage.cancel','Cancel')}</button>
            <button onClick={addStaff} className="btn-primary flex-1">{t('storePage.create','Create')}</button>
          </div>
        </div>
      </div>
    )}

    {/* Stores picker — opens from the "Choose" button inside the Create User modal */}
    {sfStorePickerOpen && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={()=>setSfStorePickerOpen(false)}>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center"><ShoppingBag size={16} className="text-brand-500"/></div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{t('storePage.chooseStoresTitle','Choose stores this user can access')}</h3>
                <p className="text-[11px] text-gray-400">{t('storePage.chooseStoresHelp','Tick the stores this team member is allowed to sign in to.')}</p>
              </div>
            </div>
            <button onClick={()=>setSfStorePickerOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-300"><X size={16}/></button>
          </div>
          {(!Array.isArray(adminStores)||adminStores.length===0) ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('storePage.noStoresFound','No stores found.')}</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('storePage.yourStores','Your stores')}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setSf(p=>({...p,assigned_store_ids:adminStores.map(s=>s.id)}))} className="text-[11px] text-brand-600 font-bold hover:underline">{t('storePage.selectAll','Select all')}</button>
                  <button type="button" onClick={()=>setSf(p=>({...p,assigned_store_ids:currentStore?.id?[currentStore.id]:[]}))} className="text-[11px] text-gray-500 font-bold hover:underline">{t('storePage.clear','Clear')}</button>
                </div>
              </div>
              <div className="space-y-2">
                {adminStores.map(s=>{
                  const checked=sf.assigned_store_ids.includes(s.id)||s.id===currentStore?.id;
                  const locked=s.id===currentStore?.id;
                  return(
                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${checked?'border-brand-500 bg-brand-50 dark:bg-brand-500/15':'border-gray-100 dark:border-gray-700 hover:border-gray-200'} ${locked?'opacity-90 cursor-not-allowed':''}`}>
                      <input type="checkbox" checked={checked} disabled={locked} onChange={()=>{
                        if(locked)return;
                        setSf(p=>({...p,assigned_store_ids:p.assigned_store_ids.includes(s.id)?p.assigned_store_ids.filter(x=>x!==s.id):[...p.assigned_store_ids,s.id]}));
                      }} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"/>
                      {s.logo
                        ? <img src={s.logo} alt="" className="w-10 h-10 rounded-xl object-cover"/>
                        : <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 font-bold">{(s.name||'S')[0]}</div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">/{s.slug}{locked?` · ${t('storePage.currentStoreLocked','current store')}`:''}</p>
                      </div>
                      {checked&&<Check size={16} className="text-brand-500"/>}
                    </label>
                  );
                })}
              </div>
            </>
          )}
          <div className="flex gap-2 mt-5">
            <button onClick={()=>setSfStorePickerOpen(false)} className="btn-ghost flex-1">{t('storePage.cancel','Cancel')}</button>
            <button onClick={()=>setSfStorePickerOpen(false)} className="btn-primary flex-1">{t('storePage.done','Done')}</button>
          </div>
        </div>
      </div>
    )}
  </DashboardLayout>);
}
