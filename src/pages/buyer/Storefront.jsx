import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi, aiApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore, useWishlistStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Search, User, X, Send, Bot, ChevronRight, Package, Menu, SlidersHorizontal, ArrowUpDown, ChevronDown, Sparkles, Tag } from 'lucide-react';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { motion } from 'framer-motion';
import Checkout from './Checkout';
import ProductQuickAdd from '../../components/shared/ProductQuickAdd';

// ============ ANIMATION PRESETS ============
// Two groups:
// 1. Per-template motion keys stamped by the AdvancedBuilder templates
//    (editorial, luxe, warm, bouncy, calm, slam, tech, glow, rise, noble).
// 2. Store-wide presets the merchant can pick from StoreSettings →
//    Customization → Section Animations. These override the template key.
//
// All durations were cut roughly in half vs. the original templates — the
// merchant feedback was "fade-in takes too long". Everything now lands in
// 0.35s–0.6s, which still feels premium but no longer makes the page crawl.
const ANIM_PRESETS = {
  // ——— Popular/aesthetic store-wide options (shown in settings) ———
  none:      { initial:{opacity:1},                          whileInView:{opacity:1},                           transition:{duration:0} },
  fade:      { initial:{opacity:0},                          whileInView:{opacity:1},                           transition:{duration:0.45,ease:'easeOut'} },
  'slide-up':{ initial:{opacity:0,y:28},                     whileInView:{opacity:1,y:0},                       transition:{duration:0.5,ease:[0.22,1,0.36,1]} },
  zoom:      { initial:{opacity:0,scale:0.92},               whileInView:{opacity:1,scale:1},                   transition:{duration:0.5,ease:[0.22,1,0.36,1]} },
  blur:      { initial:{opacity:0,filter:'blur(10px)'},      whileInView:{opacity:1,filter:'blur(0px)'},        transition:{duration:0.55,ease:'easeOut'} },
  dynamic:   { initial:{opacity:0,y:30,scale:0.96},          whileInView:{opacity:1,y:0,scale:1},               transition:{type:'spring',stiffness:260,damping:22,mass:0.6} },
  // ——— Template-specific motion (kept but sped up) ———
  editorial: { initial:{opacity:0,y:28,filter:'blur(6px)'},  whileInView:{opacity:1,y:0,filter:'blur(0px)'},    transition:{duration:0.55,ease:[0.22,1,0.36,1]} },
  luxe:      { initial:{opacity:0,scale:0.95,y:20},          whileInView:{opacity:1,scale:1,y:0},               transition:{duration:0.55,ease:[0.22,1,0.36,1]} },
  warm:      { initial:{opacity:0,x:-30},                    whileInView:{opacity:1,x:0},                       transition:{duration:0.45,ease:'easeOut'} },
  bouncy:    { initial:{opacity:0,scale:0.88,y:24},          whileInView:{opacity:1,scale:1,y:0},               transition:{type:'spring',stiffness:220,damping:16} },
  calm:      { initial:{opacity:0,y:24},                     whileInView:{opacity:1,y:0},                       transition:{duration:0.5,ease:'easeOut'} },
  slam:      { initial:{opacity:0,y:-40,skewY:-1},           whileInView:{opacity:1,y:0,skewY:0},               transition:{type:'spring',stiffness:340,damping:22} },
  tech:      { initial:{opacity:0,x:30,rotateY:4},           whileInView:{opacity:1,x:0,rotateY:0},             transition:{duration:0.5,ease:[0.16,1,0.3,1]} },
  glow:      { initial:{opacity:0,filter:'blur(10px)',scale:1.02}, whileInView:{opacity:1,filter:'blur(0px)',scale:1}, transition:{duration:0.6,ease:'easeOut'} },
  rise:      { initial:{opacity:0,y:32,scale:0.97},          whileInView:{opacity:1,y:0,scale:1},               transition:{duration:0.5,ease:[0.25,0.46,0.45,0.94]} },
  noble:     { initial:{opacity:0,scale:0.97},               whileInView:{opacity:1,scale:1},                   transition:{duration:0.5,ease:'easeOut'} },
};
const getPreset = (key) => ANIM_PRESETS[key] || ANIM_PRESETS.fade;

// ============ AI CHATBOT WIDGET ============
function AIChatbot({ store, slug }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(null);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    if (open && messages.length === 0)
      setMessages([{ role:'bot', text: store.ai_chatbot_greeting || `Welcome to ${store.name}! How can I help you today?` }]);
  }, [open]);

  // Auto-scroll on ANY change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Detect language from each message — bot follows the user's language
  const detectLang = (text) => {
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasFrench = /[àâéèêëïîôùûüÿçœæ]|(?:^|\s)(je|tu|il|nous|vous|les|des|une|est|bonjour|merci|comment|combien)(?:\s|$)/i.test(text);
    const detected = hasArabic ? 'ar' : hasFrench ? 'fr' : 'en';
    setLang(detected);
    return detected;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const msgLang = detectLang(text);
    setMessages(prev=>[...prev,{role:'user',text}]);
    setInput('');
    setLoading(true);
    try {
      const{data}=await aiApi.chat(slug,{message:text,history:messages,language:msgLang});
      setMessages(prev=>[...prev,{role:'bot',text:data.response}]);
    } catch(e) { setMessages(prev=>[...prev,{role:'bot',text:e.response?.data?.error || "Sorry, I'm having trouble. Please try again!"}]); }
    setLoading(false);
  };

  return (
    <>
      <button onClick={()=>setOpen(!open)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform" style={{background:'linear-gradient(135deg, #7C3AED, #9333EA)'}}>
        {open ? <X size={22}/> : <Bot size={22}/>}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up">
          <div className="p-4" style={{background:'linear-gradient(135deg, #7C3AED, #9333EA)'}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Bot size={20} className="text-white"/></div>
              <div className="flex-1"><h3 className="font-bold text-sm text-white">{store.ai_chatbot_name || 'Kyo-Bot Support Unit'}</h3><p className="text-white/70 text-xs flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full"/>Operational</p></div>
              <button onClick={()=>setOpen(false)} className="text-white/60 hover:text-white"><X size={18}/></button>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[280px]">
            {messages.map((msg,i)=>(
              <div key={i} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                {msg.role==='bot'&&<div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mr-2 shrink-0 mt-1"><Bot size={14} className="text-gray-500"/></div>}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.role==='user'?'bg-brand-500 text-white rounded-tr-sm':'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>{msg.text}</div>
              </div>
            ))}
            {loading&&(<div className="flex justify-start"><div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mr-2 shrink-0"><Bot size={14} className="text-gray-500"/></div><div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div></div></div>)}
          </div>
          <div className="px-4 pb-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">SUGGESTED ACTIONS</p>
            <div className="flex flex-wrap gap-1.5">
              {['Shipping rates','Best sellers','Contact info'].map((s,i)=>(
                <button key={i} onClick={()=>sendMessage(s)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all">{s} <ChevronRight size={10} className="inline"/></button>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-brand-400" placeholder="Enter command..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage(input)}/>
              <button onClick={()=>sendMessage(input)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors" style={{backgroundColor:store.primary_color||'#7C3AED'}}><Send size={14}/></button>
            </div>
            <p className="text-[9px] text-gray-300 text-center mt-1.5">Powered by {store.name} KyoBot V2</p>
          </div>
        </div>
      )}
    </>
  );
}

// ============ MAIN STOREFRONT ============
export default function Storefront() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const { lang } = useLangStore();
  const { addItem, getCount } = useCartStore();
  const { token: authToken, role: authRole } = useAuthStore();
  const isLoggedInCustomer = !!authToken && authRole === 'customer';
  const wishlistStore = useWishlistStore();
  // Bind the wishlist store to this storefront's slug as soon as we mount.
  useEffect(()=>{ wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  const wishlist = wishlistStore.items.map(p=>p.id);
  const [store, setStore] = useState(() => { try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; } });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc
  const [priceRange, setPriceRange] = useState([0, 0]); // [min, max] — 0 means no filter
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // We only flip "ready" once the store, products and categories have all
  // resolved, so the page never appears half-rendered. Start true if we have
  // every piece in cache so returning visitors see the page instantly.
  const cachedStore = (() => { try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; } })();
  const [loading, setLoading] = useState(!cachedStore);
  const [contentReady, setContentReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  const [suspended, setSuspended] = useState(false);

  // For registered customers, sync cart to backend every time items change.
  // This ensures cart recovery works even if they never open checkout.
  const cartItems = useCartStore(s => s.items);
  useEffect(() => {
    if (!isLoggedInCustomer || !cartItems.length || !storeSlug) return;
    const auth = useAuthStore.getState();
    if (!auth.user?.phone) return;
    const timer = setTimeout(() => {
      const mapped = cartItems.map(i => ({ product_id: i.product_id || i.id, name: i.name || i.name_en, price: i.price, quantity: i.quantity, variant: i.variant || null }));
      storeApi.saveCart(storeSlug, { customer_phone: auth.user.phone, customer_name: auth.user.name || '', customer_email: auth.user.email || '', items: mapped }).catch(() => {});
    }, 5000); // Debounce 5s to avoid spamming
    return () => clearTimeout(timer);
  }, [cartItems, storeSlug, isLoggedInCustomer]); // eslint-disable-line

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Reset readiness — we don't show the page again until everything is back
      setContentReady(false);
      try {
        // Fire all three requests in parallel — much faster than waiting on
        // the store first. We still catch the store error separately so 403
        // (suspended) and 404 (not found) can be handled correctly.
        const storeP = storeApi.getStore(storeSlug);
        const prodsP = storeApi.getProducts(storeSlug, { search, category: selectedCategory, sort: sortBy === 'price_asc' ? 'price_asc' : sortBy === 'price_desc' ? 'price_desc' : undefined });
        const catsP  = storeApi.getCategories(storeSlug);

        let storeData;
        try {
          const storeRes = await storeP;
          storeData = storeRes.data;
        } catch(e) {
          if (cancelled) return;
          if(e.response?.status===403) { setSuspended(true); setLoading(false); return; }
          setStore(null); setLoading(false); return;
        }
        if (cancelled) return;
        setStore(storeData);
        try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(storeData)); } catch {}
        if(storeData.name) document.title = storeData.name;
        if(storeData.favicon){let l=document.querySelector("link[rel~='icon']");if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l);}l.href=storeData.favicon;}

        // Wait for products + categories so the layout never pops in.
        const [prodsRes, catsRes] = await Promise.allSettled([prodsP, catsP]);
        if (cancelled) return;
        setProducts(prodsRes.status==='fulfilled' ? (prodsRes.value.data.products||[]) : []);
        setCategories(catsRes.status==='fulfilled' ? (catsRes.value.data||[]) : []);
      } catch(e) {
        if (!cancelled) setStore(null);
      }
      if (!cancelled) { setLoading(false); setContentReady(true); }
    };
    load();
    return () => { cancelled = true; };
  }, [storeSlug, search, selectedCategory, sortBy]);

  const getName = (item) => {
    if (lang==='ar') return item.name_ar||item.name_en||item.name||'';
    if (lang==='fr') return item.name_fr||item.name_en||item.name||'';
    return item.name_en||item.name||'';
  };

  // Toggle a product in/out of the wishlist. Toasts confirm both actions so
  // shoppers always get feedback even from a quick-add button.
  const toggleWishlist = (productOrId) => {
    const product = typeof productOrId === 'object' ? productOrId : products.find(p=>p.id===productOrId);
    if (!product) return;
    const added = wishlistStore.toggle(product);
    if (added) toast.success(t('store.addedToFavorites','Added to favorites'));
    else toast.success(t('store.removedFromFavorites','Removed from favorites'));
  };

  // Wrapper around the cart store that fires a toast — used everywhere on the
  // storefront so the feedback is consistent.
  const quickAddToCart = (product) => {
    addItem(product);
    toast.success(t('store.addedToCart','Added to cart'));
  };

  // Opens the quick-add popup so the buyer can pick variants before adding.
  const openQuickAdd = (product) => setQuickAddProduct(product);

  // Callback from the ProductQuickAdd modal.
  const handleQuickAddToCart = ({ product: p, selectedVariant, quantity: qty }) => {
    addItem(p, qty, selectedVariant);
    const label = selectedVariant
      ? (selectedVariant.label || selectedVariant.name || '')
      : '';
    toast.success(label ? `Added "${label}" to cart` : t('store.addedToCart','Added to cart'));
  };

  const getThumb = (p) => {
    if (p.thumbnail) return p.thumbnail;
    if (Array.isArray(p.images)&&p.images.length) return typeof p.images[0]==='string'?p.images[0]:null;
    return null;
  };

  // Block the entire page until store, products and categories are all in.
  // This is the "don't appear half-loaded" guarantee — the spinner stays until
  // every dependency is ready, then the real layout slides in.
  if (loading || !contentReady) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-500 animate-spin"/></div>;
  if (suspended) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center max-w-md"><div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Package size={32} className="text-red-500"/></div><h1 className="text-2xl font-bold text-gray-900 mb-2">Store Temporarily Unavailable</h1><p className="text-gray-500">This store is currently suspended. Please check back later or contact the store owner.</p></div></div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><Package size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Store not found</p><Link to="/" className="text-brand-500 text-sm font-semibold hover:underline mt-2 inline-block">Go to homepage</Link></div></div>;

  const pc = store.primary_color || '#7C3AED';
  // Match header style to page builder template (first hero/section)
  const tplSec = Array.isArray(store.page_builder)?store.page_builder.find(s=>s.visible!==false):null;
  const tplStyle = tplSec?.style||{};
  const headerBg = tplStyle.bg || pc;
  const headerText = tplStyle.textColor || '#ffffff';
  // Owner-controlled font for the store name. Falls back to template font, then Inter.
  const nameFont = store.header_font || tplStyle.fontFamily || 'Inter';
  const headerFont = tplStyle.fontFamily || 'Inter';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-30 shadow-md" style={{backgroundColor:headerBg,color:headerText,fontFamily:headerFont}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink" style={{color:headerText}}>
            {store.logo ? <img src={store.logo} className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl object-cover bg-white/20 shrink-0" alt=""/> : <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-white/20 font-bold text-base sm:text-xl shrink-0" style={{color:headerText}}>{store.name?.[0]}</div>}
            <span className="text-base sm:text-2xl font-extrabold truncate" style={{color:headerText,fontFamily:nameFont}}>{store.name}</span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="flex items-center bg-white/95 rounded-full shadow-md w-full">
              <Search size={20} className="ml-5 text-gray-400"/>
              <input
                className="flex-1 bg-transparent px-4 py-3.5 text-base focus:outline-none"
                placeholder={t('store.search','Search products...')}
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden sm:block"><LanguageSwitcher variant="header"/></div>
            <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full"><User size={18} className="sm:w-5 sm:h-5"/></Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <Heart size={18} className="sm:w-5 sm:h-5"/>
              {wishlist.length>0&&<span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px]">{wishlist.length}</span>}
            </Link>
            <button onClick={()=>setCartOpen(true)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5"/>
              {getCount()>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{getCount()}</span>}
            </button>
          </div>
        </div>
        {/* Mobile-only search row */}
        <div className="md:hidden px-3 pb-3">
          <div className="flex items-center bg-white/95 rounded-full shadow-md w-full">
            <Search size={16} className="ml-4 text-gray-400 shrink-0"/>
            <input
              className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none text-gray-800"
              placeholder={t('store.search','Search products...')}
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {store.page_builder&&Array.isArray(store.page_builder)&&store.page_builder.length>0?(
        <BuilderSections sections={store.page_builder} products={products} categories={categories} store={store} storeSlug={storeSlug} pc={pc} getName={getName} getThumb={getThumb} addItem={quickAddToCart} openQuickAdd={openQuickAdd} wishlist={wishlist} toggleWishlist={toggleWishlist} search={search} setSearch={setSearch} t={t}/>
      ):<>

      {/* ============ HERO ============ */}
      <section className="relative py-16 px-4 text-center overflow-hidden" style={{background:store.cover_image?'none':'#f0f0f0'}}>
        {store.cover_image&&<div className="absolute inset-0"><img src={store.cover_image} className="w-full h-full object-cover" alt=""/><div className="absolute inset-0 bg-black/40"/></div>}
        <div className="relative z-10">
          <h1 className={`text-5xl md:text-6xl font-black italic tracking-tight ${store.cover_image?'text-white':'text-gray-900'}`} style={{fontFamily:'"Georgia","Times New Roman",serif'}}>{store.hero_title || store.name}</h1>
          <p className={`mt-3 max-w-xl mx-auto text-sm leading-relaxed ${store.cover_image?'text-white/80':'text-gray-500'}`}>
            {store.hero_subtitle || store.description || 'See why this product stands out from the rest. Every detail is meticulously designed for your satisfaction.'}
          </p>
          <div className="w-12 h-1 mx-auto mt-4 rounded-full" style={{backgroundColor:store.cover_image?'#fff':pc}}/>
        </div>
      </section>

      {/* ============ SEARCH BAR ============ */}
      <div className="max-w-4xl mx-auto px-4 -mt-5 relative z-10">
        <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="w-full pl-11 pr-4 py-3.5 text-sm focus:outline-none" placeholder={t('store.search')} value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-gray-700 border-l border-gray-100 hover:bg-gray-50 transition-colors">{t('store.allCategories')}</button>
          <button className="px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white" style={{backgroundColor:pc}}>{t('store.new')}</button>
        </div>
      </div>

      {/* ============ CATEGORY TABS ============ */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={()=>setSelectedCategory(null)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${!selectedCategory?'text-white shadow-md':'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} style={!selectedCategory?{backgroundColor:pc}:{}}>All</button>
          {categories.map(cat=>(
            <button key={cat.id} onClick={()=>setSelectedCategory(cat.id)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory===cat.id?'text-white shadow-md':'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`} style={selectedCategory===cat.id?{backgroundColor:pc}:{}}>{getName(cat)}</button>
          ))}
        </div>
      </div>

      {/* ============ FILTER BAR ============ */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showFilters ? 'text-white shadow-md border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              style={showFilters ? { backgroundColor: pc } : {}}
            >
              <SlidersHorizontal size={15}/>
              {t('store.filters','Filters')}
              {(onlyOnSale || priceRange[1] > 0) && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: showFilters ? 'rgba(255,255,255,0.3)' : pc }}>
                  {(onlyOnSale ? 1 : 0) + (priceRange[1] > 0 ? 1 : 0)}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-400">{products.length} {t('store.products','products')}</span>
          </div>
          {/* Sort dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 transition-all">
              <ArrowUpDown size={14}/>
              {sortBy === 'price_asc' ? t('store.sortPriceLow','Price: Low to High') : sortBy === 'price_desc' ? t('store.sortPriceHigh','Price: High to Low') : t('store.sortNewest','Newest')}
              <ChevronDown size={13} className="text-gray-400"/>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {[
                { key: 'newest', label: t('store.sortNewest','Newest'), icon: Sparkles },
                { key: 'price_asc', label: t('store.sortPriceLow','Price: Low to High'), icon: ArrowUpDown },
                { key: 'price_desc', label: t('store.sortPriceHigh','Price: High to Low'), icon: ArrowUpDown },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-all first:rounded-t-xl last:rounded-b-xl ${sortBy === s.key ? 'font-bold' : 'text-gray-600 hover:bg-gray-50'}`} style={sortBy === s.key ? { color: pc, backgroundColor: pc + '10' } : {}}>
                  <s.icon size={13}/>{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="flex flex-wrap gap-6 items-end">
              {/* Price Range */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('store.priceRange','Price Range')} ({store.currency || 'DZD'})</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={t('store.min','Min')}
                    value={priceRange[0] || ''}
                    onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': pc + '30' }}
                  />
                  <span className="text-gray-300 font-bold">—</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('store.max','Max')}
                    value={priceRange[1] || ''}
                    onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': pc + '30' }}
                  />
                </div>
              </div>

              {/* On Sale toggle */}
              <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all" style={onlyOnSale ? { borderColor: pc, backgroundColor: pc + '10' } : { borderColor: '#e5e7eb' }}>
                <input type="checkbox" checked={onlyOnSale} onChange={e => setOnlyOnSale(e.target.checked)} className="sr-only"/>
                <Tag size={15} style={{ color: onlyOnSale ? pc : '#9ca3af' }}/>
                <span className={`text-sm font-bold ${onlyOnSale ? '' : 'text-gray-500'}`} style={onlyOnSale ? { color: pc } : {}}>{t('store.onSale','On Sale')}</span>
              </label>

              {/* Clear All */}
              {(onlyOnSale || priceRange[0] > 0 || priceRange[1] > 0) && (
                <button
                  onClick={() => { setPriceRange([0, 0]); setOnlyOnSale(false); }}
                  className="px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  {t('store.clearFilters','Clear Filters')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ PRODUCTS GRID ============ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {(()=>{
          // Client-side filtering for price range and on-sale
          let filtered = products;
          if (priceRange[0] > 0) filtered = filtered.filter(p => parseFloat(p.price) >= priceRange[0]);
          if (priceRange[1] > 0) filtered = filtered.filter(p => parseFloat(p.price) <= priceRange[1]);
          if (onlyOnSale) filtered = filtered.filter(p => p.compare_at_price && parseFloat(p.compare_at_price) > parseFloat(p.price));
          return filtered.length===0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-gray-300 mb-4"/>
            <p className="text-gray-500">{t('store.noProducts','No products found')}</p>
            {(onlyOnSale || priceRange[0] > 0 || priceRange[1] > 0) && (
              <button onClick={() => { setPriceRange([0, 0]); setOnlyOnSale(false); }} className="mt-3 text-sm font-bold hover:underline" style={{ color: pc }}>{t('store.clearFilters','Clear Filters')}</button>
            )}
          </div>
        ):(
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map(product=>{
              const thumb = getThumb(product);
              const inWishlist = wishlist.includes(product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group relative">
                  {/* Product Image */}
                  <Link to={`/s/${storeSlug}/product/${product.slug}`} className="block">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {thumb?<img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>
                        :<div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-300"/></div>}
                      {product.compare_at_price&&<span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">SALE</span>}
                    </div>
                  </Link>

                  {/* Action buttons — floating, quick add directly from grid */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    <button onClick={(e)=>{e.preventDefault();e.stopPropagation();openQuickAdd(product);}} className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform" style={{backgroundColor:pc}} aria-label="Add to cart"><ShoppingCart size={14}/></button>
                    <button onClick={(e)=>{e.preventDefault();e.stopPropagation();toggleWishlist(product);}} className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${inWishlist?'bg-red-500 text-white':'bg-white text-gray-400 hover:text-red-500'}`} aria-label="Add to favorites"><Heart size={14} fill={inWishlist?'white':'none'}/></button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3.5">
                    <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                      <h3 className="font-semibold text-sm text-gray-800 truncate hover:text-brand-600 transition-colors">{getName(product)}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-extrabold" style={{color:pc}}>{parseFloat(product.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-400">{store.currency||'DZD'}</span>
                      {product.compare_at_price&&<span className="text-xs text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );})()}
      </div>
      </>}

      {/* ============ FOOTER ============ */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-400">{store.footer_text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}</p>
          <p className="text-xs text-gray-300 mt-1">Powered by KyoMarket</p>
        </div>
      </footer>

      {/* ============ AI CHATBOT ============ */}
      <AIChatbot store={store} slug={storeSlug}/>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 px-4 py-2 flex items-center justify-around safe-area-bottom">
        <Link to={`/s/${storeSlug}`} className="flex flex-col items-center gap-0.5 text-gray-400"><Package size={20}/><span className="text-[10px]">Shop</span></Link>
        <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="flex flex-col items-center gap-0.5 text-gray-400"><User size={20}/><span className="text-[10px]">Account</span></Link>
        <button onClick={()=>setCartOpen(true)} className="flex flex-col items-center gap-0.5 relative" style={{color:pc}}>
          <ShoppingCart size={20}/>
          {getCount()>0&&<span className="absolute -top-1 right-0 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">{getCount()}</span>}
          <span className="text-[10px]">Cart</span>
        </button>
      </div>

      {cartOpen && <Checkout isModal onClose={()=>setCartOpen(false)} storeSlug={storeSlug}/>}
      <ProductQuickAdd
        show={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        storeSlug={storeSlug}
        primaryColor={pc}
        currency={store.currency || 'DZD'}
        onAddToCart={handleQuickAddToCart}
      />
    </div>
  );
}

function BuilderSections({sections,products,categories,store,storeSlug,pc,getName,getThumb,addItem,openQuickAdd,wishlist,toggleWishlist,search,setSearch,t}){
  const renderSection=(sec)=>{
    const s=sec.style||{};const c=sec.content||{};
    const wrap={backgroundColor:s.bg||'#ffffff',color:s.textColor||'#1f2937',padding:`${s.padding||60}px 16px`,fontFamily:s.fontFamily||'Inter',borderRadius:`${s.borderRadius||0}px`};
    const inner={maxWidth:`${s.maxWidth||1200}px`,margin:'0 auto'};

    if(sec.type==='hero'){
      // Fall back to the store-wide cover image so templates without their
      // own bgImage still display the merchant's hero photo.
      const heroBg=c.bgImage||store.cover_image||store.config?.cover_image||'';
      return(
      <section key={sec.id} style={{...wrap,minHeight:`${c.height||500}px`,backgroundImage:heroBg?`url(${heroBg})`:'none',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:c.align==='left'?'flex-start':c.align==='right'?'flex-end':'center',justifyContent:'center',flexDirection:'column',position:'relative',textAlign:c.align||'center'}}>
        {heroBg&&<div style={{position:'absolute',inset:0,backgroundColor:`rgba(0,0,0,${c.overlay||0.3})`}}/>}
        <div style={{...inner,position:'relative',zIndex:1}}>
          <h1 style={{fontSize:`${c.titleSize||48}px`,fontWeight:900,lineHeight:1.1}}>{c.title||store.name}</h1>
          {c.subtitle&&<p style={{fontSize:`${c.subtitleSize||20}px`,opacity:0.8,marginTop:12}}>{c.subtitle}</p>}
          {c.btnText&&<a href={c.btnLink||'#'} style={{display:'inline-block',marginTop:20,padding:'14px 32px',backgroundColor:c.btnColor||pc,color:'#fff',borderRadius:12,fontWeight:700,fontSize:16,textDecoration:'none'}}>{c.btnText}</a>}
        </div>
      </section>);
    }

    if(sec.type==='products'){
      const cols=parseInt(c.columns)||4;const limit=parseInt(c.limit)||8;
      const filtered=c.featured?products.filter(p=>p.is_featured):products;
      const shown=filtered.slice(0,limit);
      const cardClass=c.cardStyle==='border'?'border border-gray-200':c.cardStyle==='flat'?'':'shadow-sm hover:shadow-lg';
      return(
        <section key={sec.id} style={wrap}><div style={inner}>
          {c.title&&<h2 style={{fontSize:`${c.titleSize||28}px`,fontWeight:800,textAlign:'center',marginBottom:24}}>{c.title}</h2>}
          {shown.length===0?<p style={{textAlign:'center',color:'#9ca3af',padding:40}}>No products found</p>:
          <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:20}}>
            {shown.map(product=>{const thumb=getThumb(product);const inW=wishlist.includes(product.id);return(
              <div key={product.id} className={`bg-white rounded-2xl overflow-hidden ${cardClass} group relative transition-all`}>
                <Link to={`/s/${storeSlug}/product/${product.slug}`}><div className="aspect-square bg-gray-100 relative overflow-hidden">{thumb?<img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>:<div className="w-full h-full flex items-center justify-center"><Package size={32} style={{color:'#d1d5db'}}/></div>}{product.compare_at_price&&<span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">SALE</span>}</div></Link>
                {/* Floating quick actions — cart + favorite, no navigation required */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                  {c.showBtn!==false&&<button onClick={(e)=>{e.preventDefault();e.stopPropagation();openQuickAdd(product);}} className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform" style={{backgroundColor:pc}} aria-label="Add to cart"><ShoppingCart size={14}/></button>}
                  <button onClick={(e)=>{e.preventDefault();e.stopPropagation();toggleWishlist(product);}} className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${inW?'bg-red-500 text-white':'bg-white text-gray-400 hover:text-red-500'}`} aria-label="Add to favorites"><Heart size={14} fill={inW?'white':'none'}/></button>
                </div>
                <div className="p-3.5">{c.showName!==false&&<Link to={`/s/${storeSlug}/product/${product.slug}`}><h3 className="font-semibold text-sm text-gray-800 truncate">{getName(product)}</h3></Link>}{c.showPrice!==false&&<div className="flex items-baseline gap-2 mt-2"><span className="text-lg font-extrabold" style={{color:pc}}>{parseFloat(product.price).toLocaleString()}</span><span className="text-xs text-gray-400">{store.currency||'DZD'}</span>{product.compare_at_price&&<span className="text-xs text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>}</div>}</div>
              </div>);})}
          </div>}
        </div></section>);
    }

    if(sec.type==='text')return(
      <section key={sec.id} style={wrap}><div style={{...inner,maxWidth:`${c.maxWidth||800}px`,textAlign:c.align||'left'}}>
        <p style={{fontSize:`${c.fontSize||16}px`,lineHeight:c.lineHeight||'1.7',whiteSpace:'pre-wrap'}}>{c.text}</p>
      </div></section>);

    if(sec.type==='image')return(
      <section key={sec.id} style={{...wrap,textAlign:c.align||'center'}}><div style={inner}>
        {c.src?<a href={c.link||undefined} target={c.link?'_blank':undefined}><img src={c.src} style={{width:`${c.width||100}%`,borderRadius:`${c.rounded||12}px`,maxWidth:'100%',display:'inline-block'}} alt={c.alt||''}/></a>:<div style={{height:200,backgroundColor:'#f3f4f6',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af'}}>No image set</div>}
      </div></section>);

    if(sec.type==='banner')return(
      <section key={sec.id} style={{...wrap,textAlign:c.align||'center'}}>
        <p style={{fontSize:`${c.fontSize||24}px`,fontWeight:800}}>{c.text}</p>
        {c.btnText&&<a href={c.btnLink||'#'} style={{display:'inline-block',marginTop:16,padding:'12px 28px',backgroundColor:'#ffffff33',border:'2px solid currentColor',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none',color:'inherit'}}>{c.btnText}</a>}
      </section>);

    if(sec.type==='spacer')return<div key={sec.id} style={{height:`${c.height||60}px`}}/>;

    if(sec.type==='features'){
      const cols=parseInt(c.columns)||3;
      return(<section key={sec.id} style={wrap}><div style={{...inner,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:24,textAlign:'center'}}>
        {(c.items||[]).map((f,i)=><div key={i}><span style={{fontSize:36}}>{f.icon}</span><p style={{fontWeight:700,fontSize:16,marginTop:8}}>{f.title}</p><p style={{fontSize:14,opacity:0.6,marginTop:4}}>{f.desc}</p></div>)}
      </div></section>);
    }

    if(sec.type==='testimonials')return(
      <section key={sec.id} style={wrap}><div style={inner}>
        {c.title&&<h2 style={{fontSize:`${c.titleSize||28}px`,fontWeight:800,textAlign:'center',marginBottom:24}}>{c.title}</h2>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
          {(c.items||[]).map((t,i)=><div key={i} style={{backgroundColor:'#f9fafb',padding:24,borderRadius:16}}>
            <p style={{fontSize:14,lineHeight:1.6}}>"{t.text}"</p>
            <p style={{fontWeight:700,fontSize:14,marginTop:12}}>— {t.name}</p>
            <p style={{color:'#f59e0b',marginTop:4}}>{'★'.repeat(t.rating||5)}{'☆'.repeat(5-(t.rating||5))}</p>
          </div>)}
        </div>
      </div></section>);

    if(sec.type==='categories')return(
      <section key={sec.id} style={wrap}><div style={inner}>
        {c.title&&<h2 style={{fontSize:`${c.titleSize||28}px`,fontWeight:800,textAlign:'center',marginBottom:24}}>{c.title}</h2>}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${parseInt(c.columns)||3},1fr)`,gap:16}}>
          {categories.map(cat=><Link key={cat.id} to={`/s/${storeSlug}?category=${cat.id}`} style={{padding:20,backgroundColor:'#f3f4f6',borderRadius:12,textAlign:'center',fontWeight:700,fontSize:14,color:'inherit',textDecoration:'none'}}>{getName(cat)}</Link>)}
        </div>
      </div></section>);

    if(sec.type==='custom_html')return<section key={sec.id} style={wrap}><div style={inner} dangerouslySetInnerHTML={{__html:c.html||''}}/></section>;

    return null;
  };
  // Store-wide override — merchants pick this in
  // StoreSettings → Customization → Section Animations. When set to 'none'
  // the motion wrapper is bypassed entirely so nothing delays rendering.
  const storeAnim=store.animation_style;
  const animationsDisabled=store.animations_enabled===false||storeAnim==='none';
  return(<>{sections.filter(s=>s.visible!==false).map((sec,i)=>{
    const node=renderSection(sec);
    if(!node)return null;
    if(animationsDisabled)return <div key={sec.id}>{node}</div>;
    // Store setting wins over the template's baked-in motion key.
    const preset=getPreset(storeAnim||sec.animation);
    // Cascading delay is kept tight (0.04s × index, max 0.2s) so later
    // sections don't sit around waiting.
    const delay=Math.min(((sec.animationIndex??i)%6)*0.04,0.2);
    return(
      <motion.div
        key={sec.id}
        initial={preset.initial}
        whileInView={preset.whileInView}
        viewport={{once:true,amount:0.15}}
        transition={{...preset.transition,delay}}
        style={{willChange:'transform,opacity,filter'}}
      >{node}</motion.div>
    );
  })}</>);
}
