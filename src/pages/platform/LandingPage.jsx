import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { getPlatformInfo, publicPlansApi } from '../../utils/api';
import { ShoppingBag, Zap, Globe, Shield, BarChart3, Truck, Bot, Smartphone, CreditCard, ArrowRight, Check, Star, Play, Sparkles, RefreshCw, Palette, Layout, Wand2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// LANDING PAGE STYLE PRESETS — each preset controls colors, layout,
// card style, hero style, typography, and section backgrounds.
// The "Regenerate" button cycles through these randomly.
// ═══════════════════════════════════════════════════════════════════
const STYLE_PRESETS = [
  {
    id: 'default',
    name: 'Midnight Gold',
    // Body
    bodyBg: '#111111',
    bodyText: 'text-gray-100',
    // Nav
    navBg: 'bg-[#1A1A1A]/90',
    navBorder: 'border-[#2A2A2A]',
    navText: 'text-gray-100',
    // Hero
    heroLayout: 'center', // center | left | split
    heroBg: 'transparent',
    heroGlow1: 'bg-brand-500/10',
    heroGlow2: 'bg-brand-700/10',
    heroTitleClass: 'text-gray-100',
    heroAccentClass: 'text-brand-400',
    heroSubClass: 'text-gray-400',
    heroBadgeBg: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
    // Features
    featuresBg: 'transparent',
    cardBg: 'bg-[#1A1A1A]',
    cardBorder: 'border-[#2A2A2A]',
    cardHover: 'hover:shadow-glass-lg',
    cardIconBg: 'bg-brand-500/10',
    cardIconHoverBg: 'group-hover:bg-brand-500',
    cardIconColor: 'text-brand-400',
    cardTitleColor: 'text-gray-100',
    cardDescColor: 'text-gray-400',
    // Pricing
    pricingBg: 'bg-[#0D0D0D]',
    pricingCardBg: 'bg-[#1A1A1A]',
    pricingCardBorder: 'border-[#2A2A2A]',
    pricingPopularGrad: 'bg-gradient-to-br from-brand-500 to-brand-700',
    pricingPopularShadow: 'shadow-brand-500/30',
    // CTA
    ctaGrad: 'bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700',
    ctaBtnBg: 'bg-[#111]',
    ctaBtnText: 'text-brand-400',
    // Footer
    footerBg: 'bg-[#0D0D0D]',
    footerBorder: 'border-[#2A2A2A]',
    footerText: 'text-gray-500',
    // Shape
    cardRadius: 'rounded-2xl',
    btnRadius: 'rounded-xl',
    sectionPadding: 'py-24 px-6',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    bodyBg: '#0a192f',
    bodyText: 'text-slate-100',
    navBg: 'bg-[#0d1f3c]/90',
    navBorder: 'border-cyan-900/30',
    navText: 'text-slate-100',
    heroLayout: 'center',
    heroBg: 'transparent',
    heroGlow1: 'bg-cyan-500/15',
    heroGlow2: 'bg-blue-700/15',
    heroTitleClass: 'text-slate-100',
    heroAccentClass: 'text-cyan-400',
    heroSubClass: 'text-slate-400',
    heroBadgeBg: 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400',
    featuresBg: 'transparent',
    cardBg: 'bg-[#112240]',
    cardBorder: 'border-cyan-800/20',
    cardHover: 'hover:shadow-cyan-500/10 hover:shadow-xl',
    cardIconBg: 'bg-cyan-500/10',
    cardIconHoverBg: 'group-hover:bg-cyan-500',
    cardIconColor: 'text-cyan-400',
    cardTitleColor: 'text-slate-100',
    cardDescColor: 'text-slate-400',
    pricingBg: 'bg-[#071426]',
    pricingCardBg: 'bg-[#112240]',
    pricingCardBorder: 'border-cyan-800/20',
    pricingPopularGrad: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    pricingPopularShadow: 'shadow-cyan-500/30',
    ctaGrad: 'bg-gradient-to-br from-cyan-600 via-blue-500 to-cyan-700',
    ctaBtnBg: 'bg-[#0a192f]',
    ctaBtnText: 'text-cyan-400',
    footerBg: 'bg-[#071426]',
    footerBorder: 'border-cyan-900/30',
    footerText: 'text-slate-500',
    cardRadius: 'rounded-3xl',
    btnRadius: 'rounded-2xl',
    sectionPadding: 'py-24 px-6',
  },
  {
    id: 'sunset',
    name: 'Sunset Ember',
    bodyBg: '#1a0a0a',
    bodyText: 'text-orange-50',
    navBg: 'bg-[#1f0e0e]/90',
    navBorder: 'border-orange-900/30',
    navText: 'text-orange-50',
    heroLayout: 'center',
    heroBg: 'transparent',
    heroGlow1: 'bg-orange-500/15',
    heroGlow2: 'bg-red-700/10',
    heroTitleClass: 'text-orange-50',
    heroAccentClass: 'text-orange-400',
    heroSubClass: 'text-orange-200/60',
    heroBadgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    featuresBg: 'transparent',
    cardBg: 'bg-[#2a1010]',
    cardBorder: 'border-orange-900/20',
    cardHover: 'hover:shadow-orange-500/10 hover:shadow-xl',
    cardIconBg: 'bg-orange-500/10',
    cardIconHoverBg: 'group-hover:bg-orange-500',
    cardIconColor: 'text-orange-400',
    cardTitleColor: 'text-orange-50',
    cardDescColor: 'text-orange-200/60',
    pricingBg: 'bg-[#120808]',
    pricingCardBg: 'bg-[#2a1010]',
    pricingCardBorder: 'border-orange-900/20',
    pricingPopularGrad: 'bg-gradient-to-br from-orange-500 to-red-600',
    pricingPopularShadow: 'shadow-orange-500/30',
    ctaGrad: 'bg-gradient-to-br from-orange-600 via-red-500 to-orange-700',
    ctaBtnBg: 'bg-[#1a0a0a]',
    ctaBtnText: 'text-orange-400',
    footerBg: 'bg-[#120808]',
    footerBorder: 'border-orange-900/30',
    footerText: 'text-orange-300/40',
    cardRadius: 'rounded-2xl',
    btnRadius: 'rounded-xl',
    sectionPadding: 'py-24 px-6',
  },
  {
    id: 'emerald',
    name: 'Emerald Night',
    bodyBg: '#0a1a14',
    bodyText: 'text-emerald-50',
    navBg: 'bg-[#0d2019]/90',
    navBorder: 'border-emerald-900/30',
    navText: 'text-emerald-50',
    heroLayout: 'center',
    heroBg: 'transparent',
    heroGlow1: 'bg-emerald-500/15',
    heroGlow2: 'bg-teal-700/10',
    heroTitleClass: 'text-emerald-50',
    heroAccentClass: 'text-emerald-400',
    heroSubClass: 'text-emerald-200/60',
    heroBadgeBg: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400',
    featuresBg: 'transparent',
    cardBg: 'bg-[#0f2a1f]',
    cardBorder: 'border-emerald-800/20',
    cardHover: 'hover:shadow-emerald-500/10 hover:shadow-xl',
    cardIconBg: 'bg-emerald-500/10',
    cardIconHoverBg: 'group-hover:bg-emerald-500',
    cardIconColor: 'text-emerald-400',
    cardTitleColor: 'text-emerald-50',
    cardDescColor: 'text-emerald-200/60',
    pricingBg: 'bg-[#071410]',
    pricingCardBg: 'bg-[#0f2a1f]',
    pricingCardBorder: 'border-emerald-800/20',
    pricingPopularGrad: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    pricingPopularShadow: 'shadow-emerald-500/30',
    ctaGrad: 'bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700',
    ctaBtnBg: 'bg-[#0a1a14]',
    ctaBtnText: 'text-emerald-400',
    footerBg: 'bg-[#071410]',
    footerBorder: 'border-emerald-900/30',
    footerText: 'text-emerald-300/40',
    cardRadius: 'rounded-3xl',
    btnRadius: 'rounded-full',
    sectionPadding: 'py-28 px-6',
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    bodyBg: '#0f0a1a',
    bodyText: 'text-purple-50',
    navBg: 'bg-[#150e24]/90',
    navBorder: 'border-purple-900/30',
    navText: 'text-purple-50',
    heroLayout: 'center',
    heroBg: 'transparent',
    heroGlow1: 'bg-purple-500/15',
    heroGlow2: 'bg-violet-700/10',
    heroTitleClass: 'text-purple-50',
    heroAccentClass: 'text-purple-400',
    heroSubClass: 'text-purple-200/60',
    heroBadgeBg: 'bg-purple-500/10 border-purple-400/30 text-purple-400',
    featuresBg: 'transparent',
    cardBg: 'bg-[#1a102a]',
    cardBorder: 'border-purple-800/20',
    cardHover: 'hover:shadow-purple-500/10 hover:shadow-xl',
    cardIconBg: 'bg-purple-500/10',
    cardIconHoverBg: 'group-hover:bg-purple-500',
    cardIconColor: 'text-purple-400',
    cardTitleColor: 'text-purple-50',
    cardDescColor: 'text-purple-200/60',
    pricingBg: 'bg-[#0a0714]',
    pricingCardBg: 'bg-[#1a102a]',
    pricingCardBorder: 'border-purple-800/20',
    pricingPopularGrad: 'bg-gradient-to-br from-purple-500 to-violet-600',
    pricingPopularShadow: 'shadow-purple-500/30',
    ctaGrad: 'bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700',
    ctaBtnBg: 'bg-[#0f0a1a]',
    ctaBtnText: 'text-purple-400',
    footerBg: 'bg-[#0a0714]',
    footerBorder: 'border-purple-900/30',
    footerText: 'text-purple-300/40',
    cardRadius: 'rounded-2xl',
    btnRadius: 'rounded-xl',
    sectionPadding: 'py-24 px-6',
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    bodyBg: '#1a0f14',
    bodyText: 'text-rose-50',
    navBg: 'bg-[#241419]/90',
    navBorder: 'border-rose-900/30',
    navText: 'text-rose-50',
    heroLayout: 'center',
    heroBg: 'transparent',
    heroGlow1: 'bg-rose-500/15',
    heroGlow2: 'bg-pink-700/10',
    heroTitleClass: 'text-rose-50',
    heroAccentClass: 'text-rose-400',
    heroSubClass: 'text-rose-200/60',
    heroBadgeBg: 'bg-rose-500/10 border-rose-400/30 text-rose-400',
    featuresBg: 'transparent',
    cardBg: 'bg-[#2a1420]',
    cardBorder: 'border-rose-800/20',
    cardHover: 'hover:shadow-rose-500/10 hover:shadow-xl',
    cardIconBg: 'bg-rose-500/10',
    cardIconHoverBg: 'group-hover:bg-rose-500',
    cardIconColor: 'text-rose-400',
    cardTitleColor: 'text-rose-50',
    cardDescColor: 'text-rose-200/60',
    pricingBg: 'bg-[#120a0e]',
    pricingCardBg: 'bg-[#2a1420]',
    pricingCardBorder: 'border-rose-800/20',
    pricingPopularGrad: 'bg-gradient-to-br from-rose-500 to-pink-600',
    pricingPopularShadow: 'shadow-rose-500/30',
    ctaGrad: 'bg-gradient-to-br from-rose-600 via-pink-500 to-rose-700',
    ctaBtnBg: 'bg-[#1a0f14]',
    ctaBtnText: 'text-rose-400',
    footerBg: 'bg-[#120a0e]',
    footerBorder: 'border-rose-900/30',
    footerText: 'text-rose-300/40',
    cardRadius: 'rounded-[20px]',
    btnRadius: 'rounded-2xl',
    sectionPadding: 'py-24 px-6',
  },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const pick = (obj, fallback = '') => (obj && (obj[lang] || obj.en)) || fallback;

  // ── Style preset (Regenerate button) ───────────────────────────
  const [presetIdx, setPresetIdx] = useState(() => {
    try { const saved = localStorage.getItem('landing_preset'); return saved ? parseInt(saved, 10) : 0; } catch { return 0; }
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const S = STYLE_PRESETS[presetIdx] || STYLE_PRESETS[0];

  const regenerate = useCallback(() => {
    setIsRegenerating(true);
    let next;
    do { next = Math.floor(Math.random() * STYLE_PRESETS.length); } while (next === presetIdx && STYLE_PRESETS.length > 1);
    setTimeout(() => {
      setPresetIdx(next);
      try { localStorage.setItem('landing_preset', String(next)); } catch {}
      setTimeout(() => setIsRegenerating(false), 600);
    }, 300);
  }, [presetIdx]);

  const defaultFeatures = [
    { icon: ShoppingBag, title: t('landing.f1Title','One-Click Store Setup'), desc: t('landing.f1Desc','Launch your store in under 5 minutes with beautiful templates and zero coding.') },
    { icon: Globe, title: t('landing.f2Title','58 Wilayas Coverage'), desc: t('landing.f2Desc','Sell everywhere in Algeria with integrated shipping to all wilayas.') },
    { icon: CreditCard, title: t('landing.f3Title','Local Payments'), desc: t('landing.f3Desc','Accept COD, CCP, BaridiMob, and bank transfers natively.') },
    { icon: Bot, title: t('landing.f4Title','AI-Powered Tools'), desc: t('landing.f4Desc','Smart chatbot, fake order detection, and cart recovery automation.') },
    { icon: Truck, title: t('landing.f5Title','Delivery Integration'), desc: t('landing.f5Desc','Connect with major delivery companies and track shipments.') },
    { icon: BarChart3, title: t('landing.f6Title','Analytics Dashboard'), desc: t('landing.f6Desc','Track sales, visitors, and orders with real-time analytics.') },
    { icon: Smartphone, title: t('landing.f7Title','Mobile Optimized'), desc: t('landing.f7Desc','Every store is perfectly responsive on all devices.') },
    { icon: Shield, title: t('landing.f8Title','Secure & Reliable'), desc: t('landing.f8Desc','SSL encryption, DDoS protection, and 99.9% uptime.') },
  ];
  // Brand name comes exclusively from super-admin platform identity
  // (platform_settings.site_name). No hard-coded fallback name is shown —
  // the spot stays empty until /platform/info responds.
  const cachedInfo = (() => { try { const c = JSON.parse(localStorage.getItem('platform_info_cache') || 'null'); return c && typeof c === 'object' ? c : null; } catch { return null; } })();
  const [info, setInfo] = useState(cachedInfo || { site_name: '' });
  const [infoLoaded, setInfoLoaded] = useState(!!cachedInfo);
  const [blocks, setBlocks] = useState([]);
  const [hasCustom, setHasCustom] = useState(false);
  const [apiPlans, setApiPlans] = useState(null); // null = still loading / unavailable

  useEffect(() => {
    publicPlansApi.list().then(r => {
      if (Array.isArray(r.data?.plans) && r.data.plans.length) setApiPlans(r.data.plans);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if(info.site_name) document.title=info.site_name;
    getPlatformInfo().then(r => {
      // Use the super-admin's configured site name only — no fallback name.
      const resolvedName = (r.data && (r.data.site_name||r.data.siteName||r.data.name)) || '';
      setInfo({ ...r.data, site_name: resolvedName });
      try { localStorage.setItem('platform_info_cache', JSON.stringify({ ...r.data, site_name: resolvedName })); } catch {}
      if(resolvedName) document.title=resolvedName;
      if(r.data.favicon){
        let link=document.querySelector("link[rel~='icon']");
        if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
        link.href=r.data.favicon;
      }
      try {
        const b = JSON.parse(r.data.landing_blocks || '[]');
        if (Array.isArray(b) && b.length > 0) { setBlocks(b); setHasCustom(true); }
      } catch {}
      setInfoLoaded(true);
    }).catch(() => { setInfoLoaded(true); });
  }, []);

  const pc = info.primary_color || '#C5A55A';

  const getYTId = (url) => { if (!url) return null; const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/); return m ? m[1] : null; };

  const renderBlock = (block, i) => {
    const pad = block.padding ? `${block.padding}px` : undefined;
    const bg = block.bgColor || '#FFFFFF';
    const tc = block.textColor || '#111827';

    switch (block.type) {
      case 'hero':
        return (
          <section key={i} className="relative text-center overflow-hidden" style={{ backgroundColor: bg, padding: pad || '80px 24px', color: block.textColor || '#FFF' }}>
            <div className="absolute inset-0 opacity-10">{[...Array(5)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 300 + 80, height: Math.random() * 300 + 80, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3 }} />)}</div>
            <div className="relative max-w-4xl mx-auto">
              <h1 className="font-extrabold tracking-tight" style={{ fontSize: `${block.fontSize || 48}px`, lineHeight: 1.1 }}>{block.title}</h1>
              {block.subtitle && <p className="mt-4 opacity-80 max-w-2xl mx-auto" style={{ fontSize: `${Math.max(16, (parseInt(block.fontSize) || 48) / 3)}px` }}>{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all" style={{ backgroundColor: block.btnColor || '#FFFFFF', color: block.btnColor ? '#FFF' : bg }}>{block.btnText} <ArrowRight size={20} /></Link>}
            </div>
          </section>
        );
      case 'text':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-3xl mx-auto" style={{ textAlign: block.align || 'center' }}>
              <h2 className="font-extrabold" style={{ color: tc, fontSize: `${block.fontSize || 30}px` }}>{block.title}</h2>
              {block.content && <p className="mt-4 leading-relaxed" style={{ color: tc, opacity: 0.7, fontSize: '18px' }}>{block.content}</p>}
            </div>
          </section>
        );
      case 'features':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="font-extrabold text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${block.columns || 4}, 1fr)` }}>
                {(block.items || []).map((f, j) => (
                  <div key={j} className="rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: block.cardBg || '#FFF' }}>
                    <span className="text-3xl block mb-3">{f.icon}</span>
                    <h3 className="font-bold" style={{ color: tc }}>{f.title}</h3>
                    <p className="text-sm mt-2" style={{ color: tc, opacity: 0.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'pricing': {
        // Use real plans from the API if available — ensures pricing on the
        // landing page always matches what the super admin configured in the
        // Subscriptions page. Falls back to the page-builder hardcoded plans
        // only when the API hasn't returned data yet.
        const realPlans = apiPlans && apiPlans.length ? apiPlans.map(p => ({
          name: pick(p.name, 'Plan'),
          price: p.price_monthly > 0 ? `${Number(p.price_monthly).toLocaleString()}` : t('landing.free','Free'),
          currency: p.currency || 'DZD',
          period: p.price_monthly > 0 ? t('landing.perMonth','/month') : '',
          popular: !!p.is_popular,
          features: (p.features && (p.features[lang] && p.features[lang].length ? p.features[lang] : p.features.en)) || [],
          btnText: block.plans?.[0]?.btnText || t('pricing.start','Get Started'),
          btnLink: block.plans?.[0]?.btnLink || '/register',
        })) : (block.plans || []);
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="font-extrabold text-center mb-12" style={{ color: tc, fontSize: '36px' }}>{block.title}</h2>
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min(realPlans.length, 3)}, 1fr)` }}>
                {realPlans.map((plan, j) => (
                  <div key={j} className={`relative rounded-3xl p-8 transition-all hover:shadow-xl ${plan.popular ? 'scale-105 shadow-2xl text-white' : 'border-2 border-gray-200'}`} style={{ backgroundColor: plan.popular ? '#111827' : '#FFF' }}>
                    {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">{t('landing.mostPopular','MOST POPULAR')}</span>}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-extrabold">{typeof plan.price === 'string' && plan.price.includes('DZD') ? plan.price : `${plan.price} ${plan.currency || 'DZD'}`}</span><span className="text-sm opacity-60">{plan.period}</span></div>
                    <div className="mt-6 space-y-3">{(plan.features || []).map((f, k) => <div key={k} className="flex items-center gap-2"><Check size={16} className={plan.popular ? 'text-emerald-400' : 'text-brand-500'} /><span className="text-sm">{f}</span></div>)}</div>
                    {plan.btnText && <Link to={plan.btnLink || '/register'} className={`block mt-8 text-center py-3.5 rounded-xl font-bold transition-all ${plan.popular ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{plan.btnText}</Link>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }
      case 'cta':
        return (
          <section key={i} style={{ padding: pad || '48px 24px' }}>
            <div className="max-w-4xl mx-auto rounded-3xl p-12 md:p-16 text-center relative overflow-hidden" style={{ backgroundColor: bg, color: block.textColor || '#FFF' }}>
              <div className="absolute inset-0 opacity-10">{[...Array(3)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 200 + 100, height: Math.random() * 200 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />)}</div>
              <h2 className="text-3xl md:text-4xl font-extrabold relative z-10">{block.title}</h2>
              {block.subtitle && <p className="text-lg mt-4 opacity-80 relative z-10">{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all relative z-10" style={{ backgroundColor: block.btnColor || '#FFF', color: block.btnColor ? '#FFF' : bg }}>{block.btnText} <ArrowRight size={18} /></Link>}
            </div>
          </section>
        );
      case 'testimonials':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="font-extrabold text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` }}>
                {(block.items || []).map((t, j) => (
                  <div key={j} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}</div>
                    <p className="text-gray-600 italic leading-relaxed">"{t.text}"</p>
                    <div className="mt-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{t.name?.[0]}</div><div><p className="font-bold text-sm text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.role}</p></div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'stats':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="font-extrabold text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {(block.items || []).map((s, j) => (
                  <div key={j} className="text-center p-6 bg-white/50 rounded-2xl"><p className="text-4xl font-extrabold" style={{ color: block.accentColor || pc }}>{s.value}</p><p className="text-sm mt-2 font-medium" style={{ color: tc, opacity: 0.6 }}>{s.label}</p></div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'image': {
        const pos = block.position || 'center';
        const justify = { 'far-left': 'flex-start', left: 'flex-start', center: 'center', right: 'flex-end', 'far-right': 'flex-end' }[pos] || 'center';
        const maxW = { 'far-left': '100%', left: '85%', center: '100%', right: '85%', 'far-right': '100%' }[pos] || '100%';
        const px = { 'far-left': '0', left: '24px', center: '24px', right: '24px', 'far-right': '0' }[pos] || '24px';
        const imgEl = block.src ? <img src={block.src} alt={block.alt || ''} style={{ width: `${block.width || 100}%`, maxWidth: maxW, borderRadius: `${block.borderRadius || 16}px`, height: block.height ? `${block.height}px` : 'auto', objectFit: 'cover' }} /> : null;
        return (
          <section key={i} style={{ backgroundColor: block.bgColor || 'transparent', padding: `${block.padding || 32}px ${px}` }}>
            <div className="max-w-6xl mx-auto flex" style={{ justifyContent: justify }}>
              {block.link ? <a href={block.link} target="_blank" rel="noopener noreferrer">{imgEl}</a> : imgEl}
            </div>
          </section>
        );
      }
      case 'video': {
        const ytId = getYTId(block.url);
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '48px 24px' }}>
            <div className="max-w-4xl mx-auto">
              {block.title && <h2 className="font-extrabold text-center mb-8" style={{ color: block.textColor || '#FFF', fontSize: '30px' }}>{block.title}</h2>}
              {ytId ? <div className="relative pb-[56.25%] rounded-2xl overflow-hidden shadow-2xl"><iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen /></div> : <div className="bg-gray-800 rounded-2xl p-12 text-center"><p className="text-gray-400">Set a YouTube URL in the page builder</p></div>}
            </div>
          </section>
        );
      }
      case 'spacer':
        return <div key={i} style={{ height: `${block.height || 48}px`, backgroundColor: block.bgColor || 'transparent' }} />;
      default: return null;
    }
  };

  // ═══ THE ORIGINAL LANDING PAGE (theme-aware via S preset) ═══
  const OriginalPage = () => (
    <>
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden"><div className={`absolute -top-40 -right-40 w-[600px] h-[600px] ${S.heroGlow1} rounded-full blur-3xl`} /><div className={`absolute -bottom-40 -left-40 w-[500px] h-[500px] ${S.heroGlow2} rounded-full blur-3xl`} /></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div key={S.id+'badge'} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold mb-8 ${S.heroBadgeBg}`}><Sparkles size={16} />{t('landing.aiBadge','Now with AI-Powered Features')}</motion.div>
            <motion.h1 key={S.id+'h1'} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-5xl md:text-7xl font-extrabold leading-tight"><span className={S.heroTitleClass}>{t('hero.title').split(' ').slice(0, 2).join(' ')}</span><br /><span className={S.heroAccentClass}>{t('hero.title').split(' ').slice(2).join(' ')}</span></motion.h1>
            <motion.p key={S.id+'sub'} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2,duration:0.5}} className={`mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${S.heroSubClass}`}>{t('hero.subtitle')}</motion.p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className={`bg-brand-500 hover:bg-brand-600 text-white text-base font-bold py-4 px-8 ${S.btnRadius} flex items-center gap-2 group shadow-lg shadow-brand-500/30 transition-all`} style={!infoLoaded?{visibility:'hidden'}:undefined}>{infoLoaded?(info.trial_enabled!==false?t('hero.ctaDays','Start Free — {{count}} Days Trial',{count:info.trial_days||14}):t('hero.ctaNoTrial','Get Started')):'\u00A0'}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
              <a href="#features" className={`border border-gray-600 hover:border-brand-500 hover:text-brand-400 text-base font-bold py-4 px-8 ${S.btnRadius} flex items-center gap-2 transition-all ${S.heroSubClass}`}><Play size={16} />{t('hero.cta2')}</a>
            </div>
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 text-sm ${S.heroSubClass}`}>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> {t('landing.noCreditCard','No credit card required')}</span>
              {infoLoaded&&info.trial_enabled!==false&&<span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> {t('landing.freeTrialDays','{{count}}-day free trial',{count:info.trial_days||14})}</span>}
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> {t('landing.cancelAnytime','Cancel anytime')}</span>
            </div>
          </div>
        </div>
      </section>
      {/* ── FEATURES ── */}
      <section id="features" className={S.sectionPadding}>
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.3}} transition={{duration:0.5,ease:'easeOut'}}>
            <h2 className={`text-4xl md:text-5xl font-extrabold ${S.cardTitleColor}`}>{t('features.title')}</h2>
            <p className={`mt-4 text-lg ${S.cardDescColor}`}>{t('features.subtitle')}</p>
          </motion.div>
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="show" viewport={{once:true,amount:0.15}} variants={{hidden:{},show:{transition:{staggerChildren:0.08,delayChildren:0.05}}}}>
            {defaultFeatures.map((feature, i) => { const Icon = feature.icon; return (
              <motion.div key={S.id+i} className={`${S.cardBg} border ${S.cardBorder} ${S.cardRadius} p-6 ${S.cardHover} hover:-translate-y-1 transition-all duration-300 group`} variants={{hidden:{opacity:0,y:30,scale:0.96},show:{opacity:1,y:0,scale:1,transition:{type:'spring',stiffness:260,damping:22,mass:0.6}}}}>
                <div className={`w-12 h-12 ${S.cardRadius} ${S.cardIconBg} flex items-center justify-center mb-4 ${S.cardIconHoverBg} group-hover:shadow-lg transition-all duration-300`}><Icon size={22} className={`${S.cardIconColor} group-hover:text-white transition-colors`} /></div>
                <h3 className={`text-base font-bold ${S.cardTitleColor} mb-2`}>{feature.title}</h3>
                <p className={`text-sm ${S.cardDescColor} leading-relaxed`}>{feature.desc}</p>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>
      {/* ── PRICING ── */}
      {apiPlans && apiPlans.length > 0 && (
      <section id="pricing" className={`${S.sectionPadding} ${S.pricingBg}`}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className={`text-4xl md:text-5xl font-extrabold ${S.cardTitleColor}`}>{t('pricing.title')}</h2>
          <div className={`mt-12 grid gap-8 mx-auto ${apiPlans.length >= 3 ? 'md:grid-cols-3 max-w-5xl' : 'md:grid-cols-2 max-w-3xl'}`}>
            {apiPlans.map(p => ({
                  name: pick(p.name, 'Plan'),
                  price: p.price_monthly > 0 ? `${Number(p.price_monthly).toLocaleString()} ${p.currency || 'DZD'}` : t('landing.free','Free'),
                  period: p.price_monthly > 0 ? t('landing.perMonth','/month') : t('landing.daysN','{{count}} days',{count:info.trial_days||14}),
                  popular: !!p.is_popular,
                  features: (p.features && (p.features[lang] && p.features[lang].length ? p.features[lang] : p.features.en)) || [],
                })).map((plan, i) => (
              <motion.div key={S.id+'p'+i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className={`relative ${S.cardRadius} p-8 ${plan.popular ? `${S.pricingPopularGrad} text-white shadow-2xl ${S.pricingPopularShadow} scale-105` : `${S.pricingCardBg} border ${S.pricingCardBorder}`}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-400 text-gray-900 text-xs font-bold rounded-full">{t('landing.mostPopular','MOST POPULAR')}</span>}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : S.cardTitleColor}`}>{plan.name}</h3>
                <div className="mt-4 mb-6"><span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : S.cardTitleColor}`}>{plan.price}</span><span className={`text-sm ${plan.popular ? 'text-white/70' : S.cardDescColor}`}>{plan.period}</span></div>
                <ul className="space-y-3 mb-8">{plan.features.map((f, j) => <li key={j} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-white/90' : S.cardDescColor}`}><Check size={16} className={plan.popular ? 'text-white' : S.cardIconColor} />{f}</li>)}</ul>
                <Link to="/register" className={`block w-full py-3 ${S.btnRadius} font-bold text-center transition-all ${plan.popular ? 'bg-white text-brand-700 hover:bg-gray-100' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{t('pricing.start')}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}
      {/* ── CTA ── */}
      <section className={S.sectionPadding}>
        <div className={`max-w-4xl mx-auto text-center ${S.ctaGrad} rounded-3xl p-12 md:p-16 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">{[...Array(3)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 200 + 100, height: Math.random() * 200 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />)}</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white relative z-10">{t('landing.readyTitle','Ready to Start Selling?')}</h2>
          <p className="mt-4 text-white/70 text-lg relative z-10">{t('landing.readySubtitle','Join thousands of merchants already growing with')}{info.site_name?` ${info.site_name}.`:'.'}</p>
          <Link to="/register" className={`mt-8 inline-flex items-center gap-2 px-8 py-4 ${S.ctaBtnBg} ${S.ctaBtnText} font-bold ${S.btnRadius} hover:opacity-90 transition-all shadow-2xl relative z-10 group`}>{t('landing.getStartedFree','Get Started Free')}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
        </div>
      </section>
    </>
  );

  return (
    <div className={`min-h-screen overflow-hidden ${S.bodyText} transition-colors duration-500`} style={{ backgroundColor: S.bodyBg }}>
      {/* ── REGENERATE FLOATING BUTTON ── */}
      {!hasCustom && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
          <AnimatePresence>
            {isRegenerating && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}} className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xl text-xs font-bold text-white shadow-lg border border-white/20">
                {S.name}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={regenerate}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-2xl shadow-brand-500/40 flex items-center justify-center hover:shadow-brand-500/60 transition-shadow ${isRegenerating ? 'animate-spin' : ''}`}
            title="Regenerate Style"
            style={{ animationDuration: isRegenerating ? '0.6s' : undefined }}
          >
            <Wand2 size={22} />
          </motion.button>
        </div>
      )}

      <nav className={`fixed top-0 w-full z-50 ${S.navBg} backdrop-blur-2xl border-b ${S.navBorder}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {info.site_logo ? <img src={info.site_logo} className="w-10 h-10 rounded-2xl object-cover aspect-square" alt="" /> : <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>}
            {info.site_name && <span className={`text-sm sm:text-base font-extrabold ${S.navText}`}>{info.site_name}</span>}
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {!hasCustom && <><a href="#features" className="text-sm font-semibold text-gray-400 hover:text-brand-400">{t('nav.features')}</a><a href="#pricing" className="text-sm font-semibold text-gray-400 hover:text-brand-400">{t('nav.pricing')}</a></>}
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-brand-400">{t('nav.login')}</Link>
            <Link to="/register" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all">{t('nav.signup')}</Link>
          </div>
          <div className="md:hidden flex items-center gap-2"><LanguageSwitcher /><Link to="/login" className="text-xs font-semibold text-gray-300 hover:text-brand-400 px-2">{t('nav.login')}</Link><Link to="/register" className="bg-brand-500 text-white text-xs font-bold py-2 px-4 rounded-xl">{t('nav.signup')}</Link></div>
        </div>
      </nav>

      {hasCustom ? <div className="pt-20">{blocks.map((b, i) => renderBlock(b, i))}</div> : <OriginalPage />}

      <footer className={`border-t ${S.footerBorder} py-12 px-6 ${S.footerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center"><ShoppingBag size={16} className="text-white" /></div>{info.site_name && <span className={`font-bold ${S.navText}`}>{info.site_name}</span>}</div>
          <p className={`text-sm ${S.footerText}`}>© {new Date().getFullYear()}{info.site_name?` ${info.site_name}.`:'.'} {t('landing.allRights','All rights reserved.')}</p>
          <Link to="/admin/login" className="text-xs text-gray-200 hover:text-gray-400 select-none" aria-hidden="true">·</Link>
        </div>
      </footer>
    </div>
  );
}
