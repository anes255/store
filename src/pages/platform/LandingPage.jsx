import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformInfo } from '../../utils/api';
import { ShoppingBag, ArrowRight, Check, Star, Zap, Globe, Shield, BarChart3, Truck, Bot, Smartphone, CreditCard } from 'lucide-react';

const defaultFeatures = [
  { icon: ShoppingBag, title: 'One-Click Store Setup', desc: 'Launch your store in under 5 minutes.' },
  { icon: Globe, title: '58 Wilayas Coverage', desc: 'Sell everywhere in Algeria.' },
  { icon: CreditCard, title: 'Local Payments', desc: 'COD, CCP, BaridiMob.' },
  { icon: Bot, title: 'AI-Powered', desc: 'Smart chatbot and cart recovery.' },
];

export default function LandingPage() {
  const [info, setInfo] = useState({ site_name: 'KyoMarket' });
  const [blocks, setBlocks] = useState([]);
  const [hasBlocks, setHasBlocks] = useState(false);

  useEffect(() => {
    getPlatformInfo().then(r => {
      setInfo(r.data);
      try {
        const b = JSON.parse(r.data.landing_blocks || '[]');
        if (Array.isArray(b) && b.length > 0) { setBlocks(b); setHasBlocks(true); }
      } catch {}
    }).catch(() => {});
  }, []);

  const pc = info.primary_color || '#7C3AED';

  // ═══ BLOCK RENDERER ═══
  const renderBlock = (block, i) => {
    switch (block.type) {
      case 'hero':
        return (
          <section key={i} className="relative py-20 md:py-32 px-6 text-center text-white overflow-hidden" style={{ backgroundColor: block.bgColor || pc }}>
            <div className="absolute inset-0 opacity-10">{[...Array(6)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 300 + 100, height: Math.random() * 300 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3 }} />)}</div>
            <div className="relative max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">{block.title}</h1>
              {block.subtitle && <p className="text-lg md:text-xl mt-4 opacity-80 max-w-2xl mx-auto">{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white rounded-2xl font-bold text-gray-900 hover:shadow-xl transition-all text-lg" style={{ color: block.bgColor || pc }}>{block.btnText} <ArrowRight size={20} /></Link>}
            </div>
          </section>
        );
      case 'text':
        return (
          <section key={i} className="py-16 px-6">
            <div className={`max-w-3xl mx-auto text-${block.align || 'center'}`}>
              <h2 className="text-3xl font-black text-gray-900">{block.title}</h2>
              {block.content && <p className="text-lg text-gray-600 mt-4 leading-relaxed">{block.content}</p>}
            </div>
          </section>
        );
      case 'features':
        return (
          <section key={i} className="py-16 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-12">{block.title}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(block.items || []).map((f, j) => (
                  <div key={j} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                    <span className="text-3xl block mb-3">{f.icon}</span>
                    <h3 className="font-bold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-500 mt-2">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'pricing':
        return (
          <section key={i} className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-12">{block.title}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {(block.plans || []).map((plan, j) => (
                  <div key={j} className={`rounded-3xl p-8 ${plan.popular ? 'bg-gray-900 text-white ring-4 ring-brand-400' : 'bg-white border-2 border-gray-200'}`}>
                    {plan.popular && <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-brand-500 text-white mb-4">MOST POPULAR</span>}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-black">{plan.price}</span><span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>DZD/{plan.period}</span></div>
                    <div className="mt-6 space-y-3">{(plan.features || []).map((f, k) => <div key={k} className="flex items-center gap-2"><Check size={16} className="text-emerald-400 shrink-0" /><span className="text-sm">{f}</span></div>)}</div>
                    <Link to="/register" className={`block mt-8 text-center py-3 rounded-xl font-bold ${plan.popular ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Get Started</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'cta':
        return (
          <section key={i} className="py-16 px-6">
            <div className="max-w-4xl mx-auto rounded-3xl p-12 text-center text-white" style={{ backgroundColor: block.bgColor || '#10B981' }}>
              <h2 className="text-3xl font-black">{block.title}</h2>
              {block.subtitle && <p className="text-lg mt-3 opacity-80">{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-white rounded-xl font-bold hover:shadow-lg transition-all" style={{ color: block.bgColor || '#10B981' }}>{block.btnText} <ArrowRight size={18} /></Link>}
            </div>
          </section>
        );
      case 'testimonials':
        return (
          <section key={i} className="py-16 px-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-12">{block.title}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {(block.items || []).map((t, j) => (
                  <div key={j} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}</div>
                    <p className="text-gray-600 italic">"{t.text}"</p>
                    <div className="mt-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">{t.name?.[0]}</div><div><p className="font-bold text-sm text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.role}</p></div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'stats':
        return (
          <section key={i} className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-center text-gray-900 mb-12">{block.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(block.items || []).map((s, j) => (
                  <div key={j} className="text-center"><p className="text-4xl font-black" style={{ color: pc }}>{s.value}</p><p className="text-sm text-gray-500 mt-1">{s.label}</p></div>
                ))}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  // ═══ DEFAULT PAGE (when no blocks saved) ═══
  const DefaultPage = () => (
    <>
      <section className="relative py-20 md:py-32 px-6 text-center text-white overflow-hidden" style={{ backgroundColor: pc }}>
        <div className="absolute inset-0 opacity-10">{[...Array(6)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 300 + 100, height: Math.random() * 300 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3 }} />)}</div>
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Launch Your Store in Algeria</h1>
          <p className="text-lg md:text-xl mt-4 opacity-80 max-w-2xl mx-auto">The all-in-one e-commerce platform built for Algerian entrepreneurs. Start selling online today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all" style={{ color: pc }}>Create Your Store <ArrowRight size={20} /></Link>
        </div>
      </section>
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultFeatures.map((f, i) => { const Icon = f.icon; return (<div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"><div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: pc + '15' }}><Icon size={22} style={{ color: pc }} /></div><h3 className="font-bold text-gray-900">{f.title}</h3><p className="text-sm text-gray-500 mt-2">{f.desc}</p></div>); })}
          </div>
        </div>
      </section>
      <section className="py-16 px-6"><div className="max-w-4xl mx-auto rounded-3xl p-12 text-center text-white" style={{ backgroundColor: '#10B981' }}><h2 className="text-3xl font-black">Ready to Start Selling?</h2><p className="text-lg mt-3 opacity-80">Join hundreds of Algerian businesses on our platform.</p><Link to="/register" className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:shadow-lg">Get Started Free <ArrowRight size={18} /></Link></div></section>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {info.site_logo ? <img src={info.site_logo} className="w-10 h-10 rounded-2xl object-cover" alt="" /> : <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${pc}, #9333EA)` }}><ShoppingBag size={20} /></div>}
            <span className="text-xl font-black text-gray-900">{info.site_name}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900">Log In</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 shadow-md" style={{ backgroundColor: pc }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-20">
        {hasBlocks ? blocks.map((block, i) => renderBlock(block, i)) : <DefaultPage />}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} {info.site_name}. All rights reserved.</p>
          <div className="flex gap-6"><Link to="/login" className="text-gray-400 hover:text-white text-sm">Login</Link><Link to="/register" className="text-gray-400 hover:text-white text-sm">Register</Link></div>
        </div>
      </footer>
    </div>
  );
}
