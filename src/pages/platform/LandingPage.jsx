import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { getPlatformInfo } from '../../utils/api';
import { ShoppingBag, Zap, Globe, Shield, BarChart3, Truck, Bot, Smartphone, CreditCard, ArrowRight, Check, Star, Play, Sparkles } from 'lucide-react';

const defaultFeatures = [
  { icon: ShoppingBag, title: 'One-Click Store Setup', desc: 'Launch your store in under 5 minutes with beautiful templates and zero coding.' },
  { icon: Globe, title: '58 Wilayas Coverage', desc: 'Sell everywhere in Algeria with integrated shipping to all wilayas.' },
  { icon: CreditCard, title: 'Local Payments', desc: 'Accept COD, CCP, BaridiMob, and bank transfers natively.' },
  { icon: Bot, title: 'AI-Powered Tools', desc: 'Smart chatbot, fake order detection, and cart recovery automation.' },
  { icon: Truck, title: 'Delivery Integration', desc: 'Connect with major delivery companies and track shipments.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track sales, visitors, and orders with real-time analytics.' },
  { icon: Smartphone, title: 'Mobile Optimized', desc: 'Every store is perfectly responsive on all devices.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'SSL encryption, DDoS protection, and 99.9% uptime.' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState({ site_name: 'KyoMarket' });
  const [blocks, setBlocks] = useState([]);
  const [hasCustom, setHasCustom] = useState(false);

  useEffect(() => {
    getPlatformInfo().then(r => {
      setInfo(r.data);
      try {
        const b = JSON.parse(r.data.landing_blocks || '[]');
        if (Array.isArray(b) && b.length > 0) { setBlocks(b); setHasCustom(true); }
      } catch {}
    }).catch(() => {});
  }, []);

  const pc = info.primary_color || '#7C3AED';

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
      case 'pricing':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-5xl mx-auto">
              <h2 className="font-extrabold text-center mb-12" style={{ color: tc, fontSize: '36px' }}>{block.title}</h2>
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min((block.plans || []).length, 3)}, 1fr)` }}>
                {(block.plans || []).map((plan, j) => (
                  <div key={j} className={`relative rounded-3xl p-8 transition-all hover:shadow-xl ${plan.popular ? 'scale-105 shadow-2xl text-white' : 'border-2 border-gray-200'}`} style={{ backgroundColor: plan.popular ? '#111827' : '#FFF' }}>
                    {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">MOST POPULAR</span>}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-extrabold">{parseFloat(plan.price).toLocaleString()} DZD</span><span className="text-sm opacity-60">/{plan.period}</span></div>
                    <div className="mt-6 space-y-3">{(plan.features || []).map((f, k) => <div key={k} className="flex items-center gap-2"><Check size={16} className={plan.popular ? 'text-emerald-400' : 'text-brand-500'} /><span className="text-sm">{f}</span></div>)}</div>
                    {plan.btnText && <Link to={plan.btnLink || '/register'} className={`block mt-8 text-center py-3.5 rounded-xl font-bold transition-all ${plan.popular ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{plan.btnText}</Link>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
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

  // ═══ THE EXACT ORIGINAL LANDING PAGE ═══
  const OriginalPage = () => (
    <>
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" /><div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" /></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-full text-brand-600 text-sm font-bold mb-8"><Sparkles size={16} />Now with AI-Powered Features</div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight"><span className="text-gray-900">{t('hero.title').split(' ').slice(0, 2).join(' ')}</span><br /><span className="gradient-text">{t('hero.title').split(' ').slice(2).join(' ')}</span></h1>
            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">{t('hero.subtitle')}</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-base !py-4 !px-8 flex items-center gap-2 group">{t('hero.cta')}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
              <a href="#features" className="btn-secondary text-base !py-4 !px-8 flex items-center gap-2"><Play size={16} />{t('hero.cta2')}</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> Cancel anytime</span>
            </div>
          </div>
          <div className="mt-16 relative">
            <div className="bg-white rounded-3xl shadow-glass-lg border border-gray-200/50 overflow-hidden p-2">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                  {[{ label: 'Stores Created', value: '2,400+', color: 'from-blue-500 to-cyan-500' }, { label: 'Orders Processed', value: '150K+', color: 'from-purple-500 to-pink-500' }, { label: 'Revenue Generated', value: '₫89M+', color: 'from-emerald-500 to-teal-500' }, { label: 'Happy Merchants', value: '98.5%', color: 'from-amber-500 to-orange-500' }].map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                      <div className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                      <p className="text-white/60 text-xs mt-1 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">{t('features.title')}</h2><p className="mt-4 text-lg text-gray-500">{t('features.subtitle')}</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultFeatures.map((feature, i) => { const Icon = feature.icon; return (
              <div key={i} className="glass-card-solid p-6 hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300"><Icon size={22} className="text-brand-500 group-hover:text-white transition-colors" /></div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">{t('pricing.title')}</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[{ name: 'Starter', price: 'Free', period: '14 days', features: ['1 Store', '50 Products', 'Basic Analytics', 'COD Payment'] }, { name: 'Pro', price: '2,900 DZD', period: '/month', popular: true, features: ['3 Stores', 'Unlimited Products', 'AI Chatbot', 'All Payments', 'Cart Recovery', 'Custom Domain'] }, { name: 'Enterprise', price: '7,900 DZD', period: '/month', features: ['Unlimited Stores', 'Priority Support', 'API Access', 'White Label', 'Dedicated Server'] }].map((plan, i) => (
              <div key={i} className={`relative rounded-3xl p-8 ${plan.popular ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-2xl shadow-brand-500/30 scale-105' : 'bg-gray-50 border border-gray-200'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">MOST POPULAR</span>}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6"><span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span><span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.period}</span></div>
                <ul className="space-y-3 mb-8">{plan.features.map((f, j) => <li key={j} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-white/90' : 'text-gray-600'}`}><Check size={16} className={plan.popular ? 'text-white' : 'text-brand-500'} />{f}</li>)}</ul>
                <Link to="/register" className={`block w-full py-3 rounded-xl font-bold text-center transition-all ${plan.popular ? 'bg-white text-brand-600 hover:bg-gray-100' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{t('pricing.start')}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-brand-500 via-purple-600 to-brand-700 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white relative z-10">Ready to Start Selling?</h2>
          <p className="mt-4 text-white/70 text-lg relative z-10">Join thousands of merchants already growing with {info.site_name}.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-2xl relative z-10 group">Get Started Free<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {info.site_logo ? <img src={info.site_logo} className="w-10 h-10 rounded-2xl object-cover" alt="" /> : <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>}
            <span className="text-xl font-extrabold text-gray-900">{info.site_name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {!hasCustom && <><a href="#features" className="text-sm font-semibold text-gray-600 hover:text-brand-600">{t('nav.features')}</a><a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-brand-600">{t('nav.pricing')}</a></>}
            <LanguageSwitcher compact />
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600">{t('nav.login')}</Link>
            <Link to="/register" className="btn-primary text-sm !py-2.5 !px-5">{t('nav.signup')}</Link>
          </div>
          <div className="md:hidden flex items-center gap-3"><LanguageSwitcher compact /><Link to="/register" className="btn-primary text-xs !py-2 !px-4">{t('nav.signup')}</Link></div>
        </div>
      </nav>

      {hasCustom ? <div className="pt-20">{blocks.map((b, i) => renderBlock(b, i))}</div> : <OriginalPage />}

      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><ShoppingBag size={16} className="text-white" /></div><span className="font-bold text-gray-900">{info.site_name}</span></div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} {info.site_name}. All rights reserved.</p>
          <Link to="/admin/login" className="text-xs text-gray-200 hover:text-gray-400 select-none" aria-hidden="true">·</Link>
        </div>
      </footer>
    </div>
  );
}
