import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlatformInfo } from '../../utils/api';
import { ShoppingBag, ArrowRight, Check, Star, Globe, CreditCard, Bot, Truck } from 'lucide-react';

export default function LandingPage() {
  const [info, setInfo] = useState({ site_name: 'KyoMarket' });
  const [blocks, setBlocks] = useState([]);
  const [hasBlocks, setHasBlocks] = useState(false);

  useEffect(() => {
    getPlatformInfo().then(r => {
      setInfo(r.data);
      try { const b = JSON.parse(r.data.landing_blocks || '[]'); if (Array.isArray(b) && b.length > 0) { setBlocks(b); setHasBlocks(true); } } catch {}
    }).catch(() => {});
  }, []);

  const pc = info.primary_color || '#7C3AED';

  const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return m ? m[1] : null;
  };

  const renderBlock = (block, i) => {
    const pad = block.padding ? `${block.padding}px` : undefined;
    const bg = block.bgColor || '#FFFFFF';
    const tc = block.textColor || '#111827';

    switch (block.type) {
      case 'hero':
        return (
          <section key={i} className="relative text-center overflow-hidden" style={{ backgroundColor: bg, padding: pad || '80px 24px', color: block.textColor || '#FFFFFF' }}>
            <div className="absolute inset-0 opacity-10">{[...Array(6)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 300 + 100, height: Math.random() * 300 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3 }} />)}</div>
            <div className="relative max-w-4xl mx-auto">
              <h1 className="font-black tracking-tight" style={{ fontSize: `${block.fontSize || 48}px`, lineHeight: 1.1 }}>{block.title}</h1>
              {block.subtitle && <p className="mt-4 opacity-80 max-w-2xl mx-auto" style={{ fontSize: `${Math.max(16, (parseInt(block.fontSize) || 48) / 3)}px` }}>{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all" style={{ backgroundColor: block.btnColor || '#FFFFFF', color: block.btnColor ? '#FFFFFF' : bg }}>{block.btnText} <ArrowRight size={20} /></Link>}
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-3xl mx-auto" style={{ textAlign: block.align || 'center' }}>
              <h2 className="font-black" style={{ color: tc, fontSize: `${block.fontSize || 30}px` }}>{block.title}</h2>
              {block.content && <p className="mt-4 leading-relaxed" style={{ color: tc, opacity: 0.7, fontSize: '18px' }}>{block.content}</p>}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="font-black text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${block.columns || 4}, 1fr)` }}>
                {(block.items || []).map((f, j) => (
                  <div key={j} className="rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow" style={{ backgroundColor: block.cardBg || '#FFFFFF' }}>
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
            <div className="max-w-4xl mx-auto">
              <h2 className="font-black text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${(block.plans || []).length}, 1fr)` }}>
                {(block.plans || []).map((plan, j) => (
                  <div key={j} className={`rounded-3xl p-8 ${plan.popular ? 'ring-4 ring-brand-400 text-white' : 'border-2 border-gray-200'}`} style={{ backgroundColor: plan.popular ? '#111827' : '#FFFFFF' }}>
                    {plan.popular && <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-brand-500 text-white mb-4">POPULAR</span>}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-black">{parseFloat(plan.price).toLocaleString()}</span><span className="text-sm opacity-60">DZD/{plan.period}</span></div>
                    <div className="mt-6 space-y-3">{(plan.features || []).map((f, k) => <div key={k} className="flex items-center gap-2"><Check size={16} className="text-emerald-400 shrink-0" /><span className="text-sm">{f}</span></div>)}</div>
                    {plan.btnText && <Link to={plan.btnLink || '/register'} className={`block mt-8 text-center py-3 rounded-xl font-bold ${plan.popular ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{plan.btnText}</Link>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={i} style={{ padding: pad || '64px 24px' }}>
            <div className="max-w-4xl mx-auto rounded-3xl p-12 text-center" style={{ backgroundColor: bg, color: block.textColor || '#FFFFFF' }}>
              <h2 className="text-3xl font-black">{block.title}</h2>
              {block.subtitle && <p className="text-lg mt-3 opacity-80">{block.subtitle}</p>}
              {block.btnText && <Link to={block.btnLink || '/register'} className="inline-flex items-center gap-2 mt-6 px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all" style={{ backgroundColor: block.btnColor || '#FFFFFF', color: block.btnColor ? '#FFFFFF' : bg }}>{block.btnText} <ArrowRight size={18} /></Link>}
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-black text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` }}>
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
          <section key={i} style={{ backgroundColor: bg, padding: pad || '64px 24px' }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-black text-center mb-12" style={{ color: tc, fontSize: '30px' }}>{block.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(block.items || []).map((s, j) => (
                  <div key={j} className="text-center"><p className="text-4xl font-black" style={{ color: block.accentColor || pc }}>{s.value}</p><p className="text-sm mt-1" style={{ color: tc, opacity: 0.6 }}>{s.label}</p></div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'image':
        const imgContent = block.src ? <img src={block.src} alt={block.alt || ''} className="mx-auto" style={{ width: `${block.width || 100}%`, borderRadius: `${block.borderRadius || 16}px` }} /> : null;
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '32px 24px' }}>
            <div className="max-w-6xl mx-auto">
              {block.link ? <a href={block.link} target="_blank" rel="noopener noreferrer">{imgContent}</a> : imgContent}
            </div>
          </section>
        );

      case 'video':
        const ytId = getYouTubeId(block.url);
        return (
          <section key={i} style={{ backgroundColor: bg, padding: pad || '48px 24px' }}>
            <div className="max-w-4xl mx-auto">
              {block.title && <h2 className="font-black text-center mb-8" style={{ color: block.textColor || '#FFFFFF', fontSize: '30px' }}>{block.title}</h2>}
              {ytId ? <div className="relative pb-[56.25%] rounded-2xl overflow-hidden shadow-2xl"><iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen /></div> : block.url ? <video src={block.url} controls className="w-full rounded-2xl shadow-2xl" /> : <div className="bg-gray-800 rounded-2xl p-12 text-center"><p className="text-gray-400">No video URL set</p></div>}
            </div>
          </section>
        );

      case 'spacer':
        return <div key={i} style={{ height: `${block.height || 48}px`, backgroundColor: block.bgColor || 'transparent' }} />;

      default: return null;
    }
  };

  const DefaultPage = () => (
    <>
      <section className="relative py-20 md:py-32 px-6 text-center text-white overflow-hidden" style={{ backgroundColor: pc }}>
        <div className="absolute inset-0 opacity-10">{[...Array(6)].map((_, j) => <div key={j} className="absolute rounded-full bg-white" style={{ width: Math.random() * 300 + 100, height: Math.random() * 300 + 100, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3 }} />)}</div>
        <div className="relative max-w-4xl mx-auto"><h1 className="text-4xl md:text-6xl font-black">Launch Your Store in Algeria</h1><p className="text-lg md:text-xl mt-4 opacity-80 max-w-2xl mx-auto">The all-in-one e-commerce platform for Algerian entrepreneurs.</p><Link to="/register" className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white rounded-2xl font-bold text-lg hover:shadow-xl" style={{ color: pc }}>Create Your Store <ArrowRight size={20} /></Link></div>
      </section>
      <section className="py-16 px-6 bg-gray-50"><div className="max-w-6xl mx-auto"><h2 className="text-3xl font-black text-center text-gray-900 mb-12">Everything You Need</h2><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{[{icon:ShoppingBag,t:'Quick Setup',d:'Launch in 5 minutes'},{icon:Globe,t:'58 Wilayas',d:'Nationwide delivery'},{icon:CreditCard,t:'Local Payments',d:'COD, CCP, BaridiMob'},{icon:Bot,t:'AI Powered',d:'Smart chatbot included'}].map((f,i)=>{const I=f.icon;return<div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg"><div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{backgroundColor:pc+'15'}}><I size={22} style={{color:pc}}/></div><h3 className="font-bold text-gray-900">{f.t}</h3><p className="text-sm text-gray-500 mt-2">{f.d}</p></div>;})}</div></div></section>
      <section className="py-16 px-6"><div className="max-w-4xl mx-auto rounded-3xl p-12 text-center text-white" style={{backgroundColor:'#10B981'}}><h2 className="text-3xl font-black">Ready to Start Selling?</h2><p className="text-lg mt-3 opacity-80">Join hundreds of Algerian businesses.</p><Link to="/register" className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-white text-emerald-600 rounded-xl font-bold hover:shadow-lg">Get Started Free <ArrowRight size={18}/></Link></div></section>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50"><div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"><Link to="/" className="flex items-center gap-3">{info.site_logo?<img src={info.site_logo} className="w-10 h-10 rounded-2xl object-cover" alt=""/>:<div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{background:`linear-gradient(135deg, ${pc}, #9333EA)`}}><ShoppingBag size={20}/></div>}<span className="text-xl font-black text-gray-900">{info.site_name}</span></Link><div className="flex items-center gap-4"><Link to="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900">Log In</Link><Link to="/register" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 shadow-md" style={{backgroundColor:pc}}>Get Started</Link></div></div></nav>
      <div className="pt-20">{hasBlocks ? blocks.map((b, i) => renderBlock(b, i)) : <DefaultPage />}</div>
      <footer className="bg-gray-900 text-white py-12 px-6"><div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"><p className="text-gray-400 text-sm">© {new Date().getFullYear()} {info.site_name}</p><div className="flex gap-6"><Link to="/login" className="text-gray-400 hover:text-white text-sm">Login</Link><Link to="/register" className="text-gray-400 hover:text-white text-sm">Register</Link></div></div></footer>
    </div>
  );
}
