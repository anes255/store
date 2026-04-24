import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { ownerApi, publicPlansApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { Zap, Check, X, CreditCard, Upload, Clock, AlertTriangle, Copy, Smartphone, Building2, Banknote, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Renders a live countdown until `expiresAt` (ISO string). Updates every second.
function Countdown({ expiresAt, t }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (!expiresAt) return null;
  const diff = Math.max(0, new Date(expiresAt).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const expired = diff === 0;
  const box = (val, label) => (
    <div className="flex flex-col items-center min-w-[54px] px-2 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
      <span className="text-xl font-black text-white tabular-nums">{String(val).padStart(2, '0')}</span>
      <span className="text-[9px] uppercase tracking-wider text-white/70">{label}</span>
    </div>
  );
  return (
    <div className={`rounded-2xl p-5 text-white ${expired ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-brand-500 to-purple-600'} shadow-lg`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1 flex items-center gap-1.5"><Clock size={12}/>{t('storePage.timeLeft', 'Time left on current subscription')}</p>
      {expired
        ? <p className="text-2xl font-black">{t('storePage.expired', 'Subscription Expired')}</p>
        : <div className="flex items-center gap-2 mt-1">{box(d, t('storePage.days', 'Days'))}{box(h, t('storePage.hours', 'Hours'))}{box(m, t('storePage.minutes', 'Min'))}{box(s, t('storePage.seconds', 'Sec'))}</div>}
    </div>
  );
}

export default function StoreBilling() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  // Safe string extraction — never return an object/array, only a string.
  // Strict: pick only the current language (no cross-language fallback that mixes items).
  // Fallback order applied once per whole field: current lang → en → fr → ar → first available.
  const pickLangStrict = (v, L) => {
    if (v == null) return null;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v;
    if (typeof v === 'object') {
      if (v[L] != null && v[L] !== '') return v[L];
      return null;
    }
    return null;
  };
  const pickLangWithFallback = (v) => {
    if (v == null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    for (const L of [lang, 'en', 'fr', 'ar']) if (v[L] != null && v[L] !== '') return v[L];
    const first = Object.values(v).find(x => x != null && x !== '');
    return first ?? null;
  };
  const toArr = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : (v ? [v] : []); } catch { return v ? [v] : []; } }
    if (typeof v === 'object') return Object.values(v);
    return [];
  };
  const stringifyItem = (v) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map(stringifyItem).filter(Boolean).join(', ');
    if (typeof v === 'object') {
      // Strict per-item: only current lang, avoid mixing languages.
      const strict = pickLangStrict(v, lang);
      if (strict != null) return stringifyItem(strict);
      return '';
    }
    return '';
  };
  const localizedName = (plan) => {
    const direct = plan?.name_i18n?.[lang];
    if (direct) return stringifyItem(direct);
    return stringifyItem(pickLangWithFallback(plan?.name_i18n) ?? plan?.[`name_${lang}`] ?? plan?.name_en ?? plan?.name);
  };
  const localizedTagline = (plan) => {
    const direct = plan?.tagline_i18n?.[lang];
    if (direct) return stringifyItem(direct);
    return stringifyItem(pickLangWithFallback(plan?.tagline_i18n) ?? plan?.[`tagline_${lang}`] ?? plan?.tagline_en ?? plan?.tagline);
  };
  const localizedFeatures = (plan) => {
    // Prefer a single whole-list source in the chosen language; only fall back as a whole block.
    let src = plan?.features_i18n?.[lang];
    if (!src || (Array.isArray(src) && src.length === 0)) src = plan?.[`features_${lang}`];
    if (!src || (Array.isArray(src) && src.length === 0)) src = plan?.features_i18n && pickLangWithFallback(plan.features_i18n);
    if (!src || (Array.isArray(src) && src.length === 0)) src = plan?.features_en || plan?.features;
    return toArr(src).map(stringifyItem).filter(Boolean);
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [showPay, setShowPay] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allPlans, setAllPlans] = useState([]);
  const fileRef = useRef(null);

  const load = () => { setLoading(true); ownerApi.getSubscription().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  const loadAllPlans = () => { publicPlansApi.list().then(r => setAllPlans(r.data?.plans || [])).catch(() => setAllPlans([])); };
  useEffect(() => { load(); loadAllPlans(); }, []);
  // Poll all-plans every 30 s so new super-admin edits show up without a refresh.
  useEffect(() => { const id = setInterval(loadAllPlans, 30000); return () => clearInterval(id); }, []);

  const uploadReceipt = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setReceipt(r.result); r.readAsDataURL(f); };

  const submitPayment = async () => {
    if (!receipt) return toast.error(t('storePage.uploadReceiptError', 'Upload your payment receipt'));
    if (!selectedPlan) return toast.error(t('storePage.selectPlanError', 'Select a plan'));
    setSubmitting(true);
    try {
      const plan = selectedPlan;
      const price = period === 'yearly' ? data.plans[plan].yearly : data.plans[plan].monthly;
      await ownerApi.paySubscription({ plan, period, amount: price, payment_method: 'ccp', receipt_image: receipt });
      toast.success(t('storePage.paymentSubmitted', 'Payment submitted! Waiting for admin approval.'));
      setShowPay(false); setReceipt(''); setSelectedPlan(null); load();
    } catch (e) { toast.error(e.response?.data?.error || t('storePage.failed', 'Failed')); }
    setSubmitting(false);
  };

  const copy = (txt) => { navigator.clipboard.writeText(txt); toast.success(t('storePage.copied', 'Copied!')); };

  if (loading) return <DashboardLayout><div className="py-20 text-center"><Loader2 size={28} className="animate-spin text-brand-500 mx-auto"/></div></DashboardLayout>;

  const plans = data?.plans || {};
  const isActive = data?.status === 'active';
  const isSuspended = data?.status === 'suspended';
  const expDate = data?.expires_at ? new Date(data.expires_at).toLocaleDateString() : null;

  // Payment methods info
  const paymentMethods = [
    {
      key: 'ccp',
      icon: Building2,
      title: t('storePage.pmCcpTitle', 'CCP Transfer'),
      available: !!data?.billing_ccp,
      value: data?.billing_ccp,
      valueLabel: data?.billing_ccp_name,
      steps: [
        t('storePage.pmCcpStep1', 'Go to any Algeria Post office or use BaridiNet.'),
        t('storePage.pmCcpStep2', 'Transfer the plan amount to the CCP number shown below.'),
        t('storePage.pmCcpStep3', 'Keep the receipt — you will upload a photo of it below.'),
      ],
      color: 'blue',
    },
    {
      key: 'baridimob',
      icon: Smartphone,
      title: t('storePage.pmBaridiTitle', 'BaridiMob'),
      available: !!data?.billing_baridimob_rip,
      value: data?.billing_baridimob_rip,
      qr: data?.billing_baridimob_qr,
      steps: [
        t('storePage.pmBaridiStep1', 'Open the BaridiMob app and choose “Transfer”.'),
        t('storePage.pmBaridiStep2', 'Scan the QR code or enter the RIP number below.'),
        t('storePage.pmBaridiStep3', 'Confirm the transfer and screenshot the confirmation.'),
      ],
      color: 'emerald',
    },
    {
      key: 'cash',
      icon: Banknote,
      title: t('storePage.pmCashTitle', 'Cash Payment'),
      available: true,
      value: null,
      steps: [
        t('storePage.pmCashStep1', 'Hand the cash directly to the platform representative or agent.'),
        t('storePage.pmCashStep2', 'Request a signed receipt with the plan name and paid amount.'),
        t('storePage.pmCashStep3', 'Upload a photo of that receipt below to activate your plan.'),
      ],
      color: 'amber',
    },
  ];

  const COLOR_CLASSES = {
    blue:    { chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-400/30',       icon: 'bg-blue-500',    ring: 'ring-blue-200', glow: 'shadow-blue-500/20' },
    emerald: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30', icon: 'bg-emerald-500', ring: 'ring-emerald-200', glow: 'shadow-emerald-500/20' },
    amber:   { chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30', icon: 'bg-amber-500', ring: 'ring-amber-200', glow: 'shadow-amber-500/20' },
    purple:  { chip: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-400/30', icon: 'bg-purple-500',  ring: 'ring-purple-200', glow: 'shadow-purple-500/20' },
  };

  return (<DashboardLayout>
    <div className="mb-6"><h1 className="text-2xl font-bold">{t('storePage.billingTitle', 'Billing & Subscription')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.billingSubtitle', 'Manage your plan and payment history')}</p></div>

    {/* Countdown (only when active + expires set) */}
    {isActive && data?.expires_at && <div className="mb-4"><Countdown expiresAt={data.expires_at} t={t}/></div>}

    {/* Current Status */}
    <div className={`glass-card-solid p-6 mb-6 ${isSuspended ? 'border-2 border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isSuspended ? 'bg-red-500' : isActive ? 'bg-brand-500' : 'bg-gray-400'} text-white`}><Zap size={24}/></div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{t('storePage.currentPlan', 'Current Plan')}</p>
            <p className="text-xl font-black text-gray-900 capitalize">{data?.plan || t('storePage.free', 'Free')}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSuspended ? 'bg-red-500 text-white' : isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{isSuspended ? t('storePage.suspended', 'SUSPENDED') : isActive ? t('storePage.active', 'ACTIVE') : t('storePage.freeStatus', 'FREE')}</span>
          {expDate && <p className="text-xs text-gray-400 mt-1">{t('storePage.expires', 'Expires')}: {expDate}</p>}
        </div>
      </div>
      {isSuspended && <div className="mt-4 p-3 bg-red-100 rounded-xl flex items-center gap-2"><AlertTriangle size={16} className="text-red-600"/><p className="text-sm text-red-700 font-medium">{t('storePage.suspendedMessage', 'Your subscription is suspended. Please renew to restore access.')}</p></div>}
    </div>

    {/* Payment Methods — how they work */}
    <div className="glass-card-solid p-8 mb-8 dark:bg-gray-900/40 dark:border-white/10">
      <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center"><CreditCard size={20} className="text-brand-500"/></div><h3 className="text-xl font-black text-gray-900 dark:text-white">{t('storePage.acceptedPayments', 'Accepted Payment Methods')}</h3></div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('storePage.acceptedPaymentsDesc', 'Pay using any of these methods. After transferring, upload your receipt when you subscribe.')}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {paymentMethods.map(pm => {
          const c = COLOR_CLASSES[pm.color];
          const Icon = pm.icon;
          return (
            <div key={pm.key} className={`rounded-3xl border-2 p-6 flex flex-col transition-all hover:shadow-xl ${pm.available ? 'bg-white border-gray-200 dark:bg-gray-900/60 dark:border-white/10' : 'bg-gray-50 border-gray-100 opacity-70 dark:bg-gray-900/30 dark:border-white/5'} ${c.glow}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-2xl ${c.icon} text-white flex items-center justify-center shadow-lg`}><Icon size={24}/></div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-gray-900 dark:text-white truncate">{pm.title}</p>
                  <span className={`inline-block text-[10px] mt-1 px-2 py-0.5 rounded-full border font-bold tracking-wide ${pm.available ? c.chip : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-white/10'}`}>{pm.available ? t('storePage.pmAvailable', 'AVAILABLE') : t('storePage.pmNotSetup', 'NOT SET UP')}</span>
                </div>
              </div>
              <ol className="space-y-2.5 mb-4 text-[13px] text-gray-700 dark:text-gray-300 list-decimal list-inside leading-relaxed">
                {pm.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {pm.available && pm.value && (
                <div className="mt-auto p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{pm.value}</p>
                    {pm.valueLabel && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{pm.valueLabel}</p>}
                  </div>
                  <button onClick={() => copy(pm.value)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg shrink-0"><Copy size={15} className="text-gray-600 dark:text-gray-300"/></button>
                </div>
              )}
              {pm.available && pm.qr && <img src={pm.qr} alt="" className="w-full max-w-[160px] mx-auto mt-3 rounded-xl border dark:border-white/10"/>}
            </div>
          );
        })}
      </div>
    </div>

    {/* Period Toggle */}
    <div className="flex items-center justify-center gap-3 mb-6">
      <button onClick={() => setPeriod('monthly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period === 'monthly' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{t('storePage.monthly', 'Monthly')}</button>
      <button onClick={() => setPeriod('yearly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period === 'yearly' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{t('storePage.yearly', 'Yearly')} <span className="text-[10px] ml-1 opacity-70">{t('storePage.save20', 'Save 20%')}</span></button>
    </div>

    {/* Current plans — subscription actions */}
    <div className={`mb-8 grid gap-6 mx-auto ${Object.keys(plans).length >= 3 ? 'max-w-5xl sm:grid-cols-2 lg:grid-cols-3' : Object.keys(plans).length === 2 ? 'max-w-3xl sm:grid-cols-2' : 'max-w-md'}`}>
      {Object.entries(plans).map(([key, plan]) => {
        const price = period === 'yearly' ? plan.yearly : plan.monthly;
        const isCurrent = data?.plan === key && isActive;
        return (
          <div key={key} className={`glass-card-solid p-8 ${plan.is_popular ? 'ring-2 ring-brand-400 relative' : 'border border-gray-200'}`}>
            {plan.is_popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">{t('storePage.mostPopular', 'MOST POPULAR')}</span>}
            <div className="text-center mb-4"><h3 className="text-2xl font-black text-gray-900">{localizedName(plan)}</h3></div>
            <div className="text-center mb-6"><span className="text-4xl font-black text-brand-600">{price.toLocaleString()}</span><span className="text-gray-400 text-sm ml-1">{plan.currency || t('storePage.dzd', 'DZD')} / {period === 'yearly' ? t('storePage.year', 'year') : t('storePage.month', 'month')}</span></div>
            <div className="space-y-2 mb-6">{localizedFeatures(plan).map((f, i) => <div key={i} className="flex items-center gap-2 text-sm"><Check size={14} className="text-emerald-500 shrink-0"/><span className="text-gray-600">{f}</span></div>)}</div>
            <button onClick={() => { if (!isCurrent) { setSelectedPlan(key); setShowPay(true); } }} disabled={isCurrent} className={`w-full py-3.5 rounded-xl font-bold text-sm ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{isCurrent ? t('storePage.currentPlanBtn', 'Current Plan') : t('storePage.subscribe', 'Subscribe')}</button>
          </div>
        );
      })}
    </div>

    {/* All Plans Comparison Table — auto-syncs with super-admin edits */}
    <div className="glass-card-solid p-8 mb-8 dark:bg-gray-900/40 dark:border-white/10">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center"><Info size={20} className="text-brand-500"/></div><h3 className="text-xl font-black text-gray-900 dark:text-white">{t('storePage.allPlansTitle', 'All Subscription Plans & Features')}</h3></div>
        <button onClick={loadAllPlans} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-gray-600 dark:text-gray-300">{t('common.refresh', 'Refresh')}</button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('storePage.allPlansDesc', 'Live view of every plan the platform offers. Updates automatically when the admin changes pricing or features.')}</p>
      {allPlans.length === 0
        ? <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">{t('storePage.noPlansYet', 'No plans published yet.')}</p>
        : (() => {
            // Plans become rows; features + limits become columns.
            const allFeatSet = new Set();
            allPlans.forEach(p => localizedFeatures(p).forEach(f => allFeatSet.add(f)));
            const allFeatures = Array.from(allFeatSet);
            return (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm border-separate border-spacing-0" style={{minWidth: `${Math.max(640, 260 + (5 + allFeatures.length) * 160)}px`}}>
                  <thead>
                    <tr>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 rounded-l-xl border-b-2 border-gray-200 dark:border-white/10 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black sticky left-0 z-10">{t('storePage.planCol', 'Plan')}</th>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black">{t('storePage.priceMonthly', 'Monthly')}</th>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black">{t('storePage.priceYearly', 'Yearly')}</th>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black">{t('storePage.maxProducts', 'Products')}</th>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black">{t('storePage.maxOrders', 'Orders/mo')}</th>
                      <th className="py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black">{t('storePage.maxStaff', 'Staff')}</th>
                      {allFeatures.map((feat, i) => (
                        <th key={'feath_'+i} className={`py-4 px-5 bg-gray-50 dark:bg-white/5 border-b-2 border-gray-200 dark:border-white/10 text-center text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-black ${i===allFeatures.length-1?'rounded-r-xl':''}`}>{feat}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPlans.map(p => {
                      const name = localizedName(p);
                      const tagline = localizedTagline(p);
                      const isCurrent = data?.plan === p.slug && isActive;
                      const planFeats = localizedFeatures(p);
                      return (
                        <tr key={p.id || p.slug} className={isCurrent ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''}>
                          <td className="py-3 px-5 border-b border-gray-100 dark:border-white/10 sticky left-0 bg-white dark:bg-gray-900">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-base font-black text-gray-900 dark:text-white normal-case">{name}</span>
                                {p.is_popular && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-black">{t('storePage.popularTag', 'POPULAR')}</span>}
                                {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-black">{t('storePage.currentTag', 'CURRENT')}</span>}
                              </div>
                              {tagline && <span className="text-[10px] text-gray-500 dark:text-gray-400 normal-case">{tagline}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-5 text-center border-b border-gray-100 dark:border-white/10 font-black text-gray-900 dark:text-white whitespace-nowrap">{parseFloat(p.price_monthly || 0).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{p.currency||'DZD'}</span></td>
                          <td className="py-3 px-5 text-center border-b border-gray-100 dark:border-white/10 font-black text-gray-900 dark:text-white whitespace-nowrap">{parseFloat(p.price_yearly || 0).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{p.currency||'DZD'}</span></td>
                          <td className="py-3 px-5 text-center border-b border-gray-100 dark:border-white/10 font-black text-gray-900 dark:text-white">{p.max_products || t('storePage.unlimited', '∞')}</td>
                          <td className="py-3 px-5 text-center border-b border-gray-100 dark:border-white/10 font-black text-gray-900 dark:text-white">{p.max_orders_month || t('storePage.unlimited', '∞')}</td>
                          <td className="py-3 px-5 text-center border-b border-gray-100 dark:border-white/10 font-black text-gray-900 dark:text-white">{p.max_staff || t('storePage.unlimited', '∞')}</td>
                          {allFeatures.map((feat, i) => {
                            const has = planFeats.includes(feat);
                            return <td key={p.id+'_f'+i} className="py-2.5 px-5 text-center border-b border-gray-100 dark:border-white/10">{has ? <Check size={16} className="inline text-emerald-500"/> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
    </div>

    {/* Payment History */}
    <div className="glass-card-solid p-6">
      <h3 className="font-bold text-gray-900 mb-4">{t('storePage.paymentHistory', 'Payment History')}</h3>
      {!data?.payments?.length ? <p className="text-center py-8 text-gray-400 text-sm">{t('storePage.noPaymentsYet', 'No payments yet')}</p> :
        <div className="space-y-2">{data.payments.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><CreditCard size={16}/></div>
            <div className="flex-1"><p className="font-medium text-sm text-gray-800 capitalize">{p.plan} — {p.period}</p><p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()} · {p.payment_method?.toUpperCase()}</p></div>
            <div className="text-right"><p className="font-bold text-sm">{parseFloat(p.amount).toLocaleString()} {t('storePage.dzd', 'DZD')}</p><span className={`text-[10px] font-bold ${p.status === 'approved' ? 'text-emerald-600' : p.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>{p.status?.toUpperCase()}</span></div>
          </div>
        ))}</div>}
    </div>

    {/* Payment Modal */}
    {showPay && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPay(false)}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{t('storePage.subscribeTo', 'Subscribe to')} {localizedName(plans[selectedPlan])}</h2><button onClick={() => setShowPay(false)}><X size={20}/></button></div>

        <div className="p-4 bg-brand-50 rounded-xl mb-4 text-center">
          <p className="text-xs text-gray-400">{t('storePage.amountToPay', 'Amount to pay')}</p>
          <p className="text-3xl font-black text-brand-600">{(period === 'yearly' ? plans[selectedPlan]?.yearly : plans[selectedPlan]?.monthly)?.toLocaleString()} {t('storePage.dzd', 'DZD')}</p>
          <p className="text-xs text-gray-400 capitalize">{period}</p>
        </div>

        <div className="space-y-3 mb-4">
          {data?.billing_ccp && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.ccpTransfer', 'CCP Transfer')}</p><div className="flex items-center justify-between"><div><p className="font-mono font-bold">{data.billing_ccp}</p><p className="text-xs text-gray-400">{data.billing_ccp_name}</p></div><button onClick={() => copy(data.billing_ccp)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div></div>}
          {data?.billing_baridimob_rip && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.baridiMob', 'BaridiMob')}</p><div className="flex items-center justify-between"><div><p className="font-mono font-bold">{data.billing_baridimob_rip}</p></div><button onClick={() => copy(data.billing_baridimob_rip)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div>{data.billing_baridimob_qr && <img src={data.billing_baridimob_qr} className="w-40 h-40 mx-auto mt-3 rounded-xl border" alt="QR"/>}</div>}
          {!data?.billing_ccp && !data?.billing_baridimob_rip && <div className="p-4 bg-amber-50 rounded-xl text-center"><AlertTriangle size={20} className="mx-auto text-amber-500 mb-2"/><p className="text-sm text-amber-700">{t('storePage.paymentNotConfigured', 'Payment details not configured yet. Contact the platform admin.')}</p></div>}
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.uploadReceipt', 'Upload Payment Receipt')}</p>
          {receipt ? <div className="relative"><img src={receipt} className="w-full rounded-xl border" alt="Receipt"/><button onClick={() => setReceipt('')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14}/></button></div> :
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400" onClick={() => fileRef.current?.click()}><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">{t('storePage.clickUploadReceipt', 'Click to upload receipt screenshot')}</p></div>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadReceipt}/>
        </div>

        <button onClick={submitPayment} disabled={submitting || !receipt} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CreditCard size={16}/>}
          {t('storePage.submitPayment', 'Submit Payment')}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-3">{t('storePage.paymentReviewNote', 'Payment will be reviewed and approved within 24 hours')}</p>
      </div>
    </div>}
  </DashboardLayout>);
}
