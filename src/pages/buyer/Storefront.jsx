import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi, aiApi } from '../../utils/api';
import { useCartStore, useLangStore } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Heart, Search, User, Menu, X, Send, Bot,
  ChevronRight, Star, Package, Truck
} from 'lucide-react';

function AIChatbot({ store, slug }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    { label: 'Shipping rates', action: 'What are the shipping rates?' },
    { label: 'Best sellers', action: 'What are your best sellers?' },
    { label: 'Contact info', action: 'How can I contact you?' },
  ]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: store.ai_chatbot_greeting || `Welcome to ${store.name}! How can I help?` }]);
    }
  }, [open]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiApi.chat(slug, { message: text, history: messages });
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      if (data.suggestedActions) setSuggestions(data.suggestedActions.map(a => ({ label: a.label, action: a.label })));
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble right now. Please try again!" }]);
    }
    setLoading(false);
  };

  if (!store.ai_chatbot_enabled) return null;

  return (
    <>
      {/* Chat Button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-2xl shadow-brand-500/40 flex items-center justify-center hover:scale-105 transition-transform">
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">{store.ai_chatbot_name || 'Support Bot'}</h3>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Operational
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            <p className="w-full text-[10px] text-gray-400 font-bold uppercase tracking-wider">SUGGESTED ACTIONS</p>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s.action)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all">
                {s.label} <ChevronRight size={10} className="inline" />
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-brand-400"
                placeholder="Enter command..." value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)} />
              <button onClick={() => sendMessage(input)} className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white hover:bg-brand-600 transition-colors">
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-1.5">Powered by {store.name} KyoBot V2</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function Storefront() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const { lang } = useLangStore();
  const { addItem, getCount } = useCartStore();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const [storeRes, productsRes, catsRes] = await Promise.all([
          storeApi.getStore(storeSlug),
          storeApi.getProducts(storeSlug, { search, category: selectedCategory }),
          storeApi.getCategories(storeSlug),
        ]);
        setStore(storeRes.data);
        setProducts(productsRes.data.products);
        setCategories(catsRes.data);
        // Apply store theme
        document.documentElement.style.setProperty('--brand-primary', storeRes.data.primary_color || '#7C3AED');
      } catch { setStore(null); }
      setLoading(false);
    };
    loadStore();
  }, [storeSlug, search, selectedCategory]);

  const getName = (item) => lang === 'ar' ? (item.name_ar || item.name_en || item.name_fr) : lang === 'fr' ? (item.name_fr || item.name_en) : (item.name_en || item.name_fr);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 text-lg">Store not found</p></div>;

  const storeStyle = {
    '--store-primary': store.primary_color || '#7C3AED',
    '--store-secondary': store.secondary_color || '#10B981',
    '--store-bg': store.bg_color || '#FAFAFA',
    '--store-text': store.text_color || '#1F2937',
  };

  return (
    <div style={storeStyle} className="min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Store Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2">
            {store.logo ? <img src={store.logo} className="w-8 h-8 rounded-lg object-cover" alt="" /> : null}
            <span className="text-lg font-extrabold font-display" style={{ color: store.primary_color }}>{store.name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher compact />
            <Link to={`/s/${storeSlug}/auth`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><User size={20} /></Link>
            <Link to={`/s/${storeSlug}/checkout`} className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <ShoppingCart size={20} />
              {getCount() > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{getCount()}</span>}
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={22} /></button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-4 text-center" style={{ backgroundColor: store.bg_color || '#FAFAFA' }}>
        <h1 className="text-4xl md:text-5xl font-extrabold font-display" style={{ color: store.text_color }}>{store.name}</h1>
        <p className="mt-3 text-gray-500 max-w-xl mx-auto">{store.description || 'See why this product stands out from the rest. Every detail is meticulously designed for your satisfaction.'}</p>
        <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: store.primary_color }} />
      </section>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 -mt-4 relative z-10">
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-glass p-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-10 pr-4 py-3 bg-transparent text-sm focus:outline-none"
              placeholder={t('store.search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: store.primary_color }}>
            {t('store.allCategories')}
          </button>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700">{t('store.new')}</button>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={!selectedCategory ? { backgroundColor: store.primary_color } : {}}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={selectedCategory === cat.id ? { backgroundColor: store.primary_color } : {}}>
              {getName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-glass transition-all group">
                <Link to={`/s/${storeSlug}/product/${product.slug}`} className="block">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.thumbnail ? (
                      <img src={product.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-300" /></div>
                    )}
                    {product.compare_at_price && <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">SALE</span>}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                    <h3 className="font-semibold text-sm text-gray-800 truncate">{getName(product)}</h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-lg font-extrabold" style={{ color: store.primary_color }}>{parseFloat(product.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">{store.currency || 'DZD'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { addItem(product); toast.success('Added to cart!'); }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105"
                        style={{ backgroundColor: store.primary_color }}>
                        <ShoppingCart size={14} />
                      </button>
                      <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Heart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-400">{store.footer_text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}</p>
          <p className="text-xs text-gray-300 mt-1">Powered by KyoMarket</p>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot store={store} slug={storeSlug} />

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 px-4 py-2 flex items-center justify-around">
        <Link to={`/s/${storeSlug}`} className="flex flex-col items-center gap-0.5 text-gray-400"><Package size={20} /><span className="text-[10px]">Shop</span></Link>
        <Link to={`/s/${storeSlug}/auth`} className="flex flex-col items-center gap-0.5 text-gray-400"><User size={20} /><span className="text-[10px]">Account</span></Link>
        <Link to={`/s/${storeSlug}/checkout`} className="flex flex-col items-center gap-0.5 relative" style={{ color: store.primary_color }}>
          <ShoppingCart size={20} />
          {getCount() > 0 && <span className="absolute -top-1 right-0 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">{getCount()}</span>}
          <span className="text-[10px]">Cart</span>
        </Link>
      </div>
    </div>
  );
}
