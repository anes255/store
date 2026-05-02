import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi, aiApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore, useWishlistStore, useBuyerTheme } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Search, User, X, Send, Bot, ChevronRight, Package, Menu, SlidersHorizontal, ArrowUpDown, ChevronDown, Sparkles, Tag, Zap, Minus, Plus, Check, Star, Truck, Shield, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import ThemePanel from '../../components/shared/ThemePanel';
import { motion } from 'framer-motion';
import Checkout from './Checkout';
import ProductQuickAdd from '../../components/shared/ProductQuickAdd';
import { initPixels, trackAddToCart, trackViewContent } from '../../utils/trackingPixels';

// Ending-soon offer banner with live countdown. Merchants configure it in
// Settings → Customization → Offer & Sale Branding (offer_enabled + fields).
function OfferBanner({ store }) {
  const hours = parseInt(store.offer_hours) || 0;
  const minutes = parseInt(store.offer_minutes) || 0;
  const key = `offer_deadline_${store.id}_${hours}_${minutes}`;
  const [deadline] = useState(() => {
    try {
      const cached = parseInt(localStorage.getItem(key));
      if (cached && cached > Date.now()) return cached;
    } catch {}
    const d = Date.now() + (hours * 3600 + minutes * 60) * 1000;
    try { localStorage.setItem(key, String(d)); } catch {}
    return d;
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  const diff = Math.max(0, deadline - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  if (diff <= 0) return null;
  const bg = store.offer_bg || 'linear-gradient(90deg,#ef4444,#f97316)';
  const tc = store.offer_tc || '#ffffff';
  return (
    <div className="w-full text-center py-2 px-3 text-sm font-bold flex flex-wrap items-center justify-center gap-x-3 gap-y-1" style={{ background: bg, color: tc }}>
      <span className="inline-flex items-center gap-1.5"><Tag size={14}/>{store.offer_title || 'Limited Offer'} — {store.offer_discount || '40% OFF'}</span>
      <span className="opacity-80 text-xs">{store.offer_label || 'Ends in:'}</span>
      <span className="font-mono tabular-nums bg-white/20 rounded px-2 py-0.5 text-xs">{pad(h)}:{pad(m)}:{pad(s)}</span>
    </div>
  );
}

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
      <button onClick={()=>setOpen(!open)} className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform" style={{background:'linear-gradient(135deg, #7C3AED, #9333EA)'}}>
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

// ============ PRODUCT DETAIL MODAL ============
function ProductDetailModal({ product, store, storeSlug, pc, currency, getName, getThumb, onClose, onAddToCart, onBuyNow, wishlistStore }) {
  const [selectedVariants, setSelectedVariants] = React.useState({});
  const [quantity, setQuantity] = React.useState(1);
  const [selectedImage, setSelectedImage] = React.useState(0);

  if (!product) return null;

  // Parse variants
  let variants = product.variants || [];
  if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
  if (!Array.isArray(variants)) variants = [];

  const variantGroups = {};
  variants.forEach((v, i) => {
    const t = (v.type || 'option').toLowerCase();
    if (!variantGroups[t]) variantGroups[t] = [];
    variantGroups[t].push({ ...v, _idx: i });
  });
  const groupTypes = Object.keys(variantGroups);

  const selectedIdxes = Object.values(selectedVariants).filter(v => v !== null && v !== undefined);
  const primarySelected = selectedIdxes.length > 0 ? variants[selectedIdxes[0]] : null;

  const basePrice = parseFloat(product.price) || 0;
  const priceAdj = selectedIdxes.reduce((sum, idx) => sum + (parseFloat(variants[idx]?.price_adjustment) || 0), 0);
  const finalPrice = basePrice + priceAdj;
  const stockCount = primarySelected ? (primarySelected.stock ?? product.stock_quantity) : product.stock_quantity;

  const variantLabel = selectedIdxes.map(idx => {
    const v = variants[idx];
    if (v?.type === 'color' && v?.value && /^#[0-9a-f]{3,8}$/i.test(v.value)) return v.name || '';
    return v?.name || v?.value || '';
  }).filter(Boolean).join(' / ');

  const buildVariantObj = () => {
    if (selectedIdxes.length === 0) return null;
    const parts = selectedIdxes.map(idx => {
      const v = variants[idx];
      return { name: v.name, type: v.type, value: v.value };
    });
    if (parts.length === 1) return parts[0];
    return { selections: parts, label: variantLabel };
  };

  const selectVariant = (type, idx) => {
    setSelectedVariants(prev => ({ ...prev, [type]: prev[type] === idx ? null : idx }));
    setSelectedImage(0);
  };

  // Images
  const allImages = (() => {
    if (primarySelected?.images?.length > 0) return primarySelected.images;
    let imgs = product.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (!Array.isArray(imgs)) imgs = [];
    if (imgs.length === 0 && product.thumbnail) imgs = [product.thumbnail];
    return imgs;
  })();

  const getDesc = () => product.description_en || product.description || product.description_fr || '';

  const isColor = (val) => {
    if (!val) return false;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) return true;
    if (/^(rgb|hsl)a?\(/.test(val)) return true;
    const names = ['red','blue','green','black','white','yellow','orange','purple','pink','brown','gray','grey','navy','teal','cyan','magenta','beige','cream','gold','silver','maroon','olive','coral','salmon','turquoise','indigo','violet','lime','aqua','tan','khaki'];
    return names.includes(val.toLowerCase());
  };

  const inWishlist = wishlistStore.has(product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {/* Wishlist */}
        <button
          onClick={() => { const added = wishlistStore.toggle(product); if (added) toast.success('Added to favorites'); else toast.success('Removed from favorites'); }}
          className="absolute top-4 right-16 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Heart size={18} className={inWishlist ? 'text-red-400' : 'text-white/70'} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 shrink-0 p-4 md:p-6">
            <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10">
              {allImages[selectedImage]
                ? <img src={allImages[selectedImage]} className="w-full h-full object-cover" alt={getName(product)} />
                : <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-white/20" /></div>}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${selectedImage === i ? 'border-white/60 shadow-lg' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
            {product.compare_at_price && parseFloat(product.compare_at_price) > finalPrice && (
              <span className="inline-block mt-3 px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-lg border border-red-500/30">
                SALE - Save {(parseFloat(product.compare_at_price) - finalPrice).toLocaleString()} {currency}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-5 md:p-6 md:pl-2 flex flex-col">
            <h2 className="text-2xl font-extrabold text-white pr-20">{getName(product)}</h2>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold" style={{ color: pc }}>{finalPrice.toLocaleString()} {currency}</span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > finalPrice && (
                <span className="text-base text-white/30 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>
              )}
            </div>

            {/* Stock */}
            <div className="mt-2">
              {stockCount > 0
                ? <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold"><span className="w-2 h-2 bg-emerald-400 rounded-full" />{store.show_stock_storefront ? `${stockCount} in stock` : 'In stock'}</span>
                : product.allow_oversell
                  ? <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-semibold"><span className="w-2 h-2 bg-amber-400 rounded-full" />Available for order</span>
                  : <span className="text-red-400 text-sm font-semibold">Out of stock</span>}
            </div>

            {/* Description */}
            {getDesc() && <p className="mt-3 text-white/50 text-sm leading-relaxed line-clamp-3">{getDesc()}</p>}

            {/* Selected variant label */}
            {variantLabel && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-white/40">Selected:</span>
                <span className="text-xs font-bold text-white px-2.5 py-1 bg-white/10 rounded-lg">{variantLabel}</span>
              </div>
            )}

            {/* Variant Selectors */}
            {groupTypes.length > 0 && (
              <div className="mt-4 space-y-4 flex-1">
                {groupTypes.map(type => {
                  const group = variantGroups[type];
                  const typeLabel = type === 'color' ? 'Color' : type === 'size' ? 'Size' : type === 'material' ? 'Material' : type === 'style' ? 'Style' : type.charAt(0).toUpperCase() + type.slice(1);
                  const selectedInGroup = selectedVariants[type];
                  const selName = selectedInGroup != null ? variants[selectedInGroup]?.name : null;

                  return (
                    <div key={type}>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                        {typeLabel}
                        {selName && <span className="text-white normal-case font-semibold text-sm">-- {selName}</span>}
                      </p>

                      {type === 'color' ? (
                        <div className="flex flex-wrap gap-2.5">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            const colorVal = v.value || '#ccc';
                            const useColor = isColor(colorVal);
                            const hasImg = v.images && v.images.length > 0;
                            return (
                              <button key={v._idx} onClick={() => selectVariant(type, v._idx)} className="relative flex flex-col items-center gap-1 transition-all" title={v.name}>
                                <div className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${isSel ? 'border-white scale-110 shadow-lg ring-2 ring-white/30' : 'border-white/20 hover:border-white/50 hover:scale-105'}`}
                                  style={useColor && !hasImg ? { backgroundColor: colorVal } : {}}>
                                  {hasImg ? <img src={v.images[0]} className="w-full h-full object-cover" alt={v.name} />
                                    : !useColor && <span className="text-[9px] font-bold text-white/50 text-center leading-tight px-0.5">{(v.value || v.name || '?').slice(0, 3)}</span>}
                                  {isSel && <Check size={14} className="absolute text-white drop-shadow-md" />}
                                </div>
                                <span className={`text-[10px] font-medium ${isSel ? 'text-white font-bold' : 'text-white/40'}`}>{v.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : type === 'size' ? (
                        <div className="flex flex-wrap gap-2">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            return (
                              <button key={v._idx} onClick={() => selectVariant(type, v._idx)}
                                className={`min-w-[42px] h-[42px] px-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center ${isSel ? 'text-white border-white bg-white/15' : 'border-white/15 text-white/60 hover:border-white/40 bg-white/5'}`}>
                                {v.name || v.value || 'Opt'}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            return (
                              <button key={v._idx} onClick={() => selectVariant(type, v._idx)}
                                className={`px-3.5 py-2 rounded-full text-sm font-bold border transition-all ${isSel ? 'text-white shadow-md border-transparent' : 'border-white/15 text-white/60 hover:border-white/40 bg-white/5'}`}
                                style={isSel ? { backgroundColor: pc, borderColor: pc } : {}}>
                                {v.name || v.value || 'Option'}
                                {v.price_adjustment && parseFloat(v.price_adjustment) !== 0 && (
                                  <span className="ml-1.5 opacity-70 text-xs">({parseFloat(v.price_adjustment) > 0 ? '+' : ''}{parseFloat(v.price_adjustment).toLocaleString()})</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/10 rounded-xl border border-white/10">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-white/10 rounded-l-xl transition-colors text-white/60"><Minus size={15} /></button>
                  <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-white/10 rounded-r-xl transition-colors text-white/60"><Plus size={15} /></button>
                </div>
              </div>
              <button
                onClick={() => {
                  const missing = groupTypes.filter(t => selectedVariants[t] == null);
                  if (missing.length) { toast.error('Please choose: ' + missing.map(m=>m.charAt(0).toUpperCase()+m.slice(1)).join(', ')); return; }
                  if (!quantity || quantity < 1) { toast.error('Pick a quantity'); return; }
                  onAddToCart({ ...product, price: finalPrice }, quantity, buildVariantObj()); onClose();
                }}
                disabled={stockCount <= 0 && !product.allow_oversell}
                className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50 transition-all text-sm"
                style={{ backgroundColor: pc }}
              >
                <ShoppingCart size={16} /> {store.btn_add_cart || 'Add to Cart'}
              </button>
              <button
                onClick={() => {
                  const missing = groupTypes.filter(t => selectedVariants[t] == null);
                  if (missing.length) { toast.error('Please choose: ' + missing.map(m=>m.charAt(0).toUpperCase()+m.slice(1)).join(', ')); return; }
                  if (!quantity || quantity < 1) { toast.error('Pick a quantity'); return; }
                  onBuyNow({ ...product, price: finalPrice }, quantity, buildVariantObj()); onClose();
                }}
                disabled={stockCount <= 0 && !product.allow_oversell}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border-2 hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                style={{ borderColor: pc, color: pc, backgroundColor: pc + '15' }}
              >
                <Zap size={16} /> {store.btn_buy_now || 'Buy Now'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: Truck, label: 'Fast Delivery' },
                { icon: Shield, label: 'Secure' },
                { icon: Package, label: 'Returns' },
              ].map((f, i) => {
                const I = f.icon;
                return (
                  <div key={i} className="p-2.5 bg-white/5 rounded-xl text-center border border-white/5">
                    <I size={14} className="mx-auto text-white/30 mb-1" />
                    <p className="text-[10px] font-bold text-white/40">{f.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CHECKOUT PREVIEW MODAL ============
// Lightweight order summary shown after the buyer clicks "Buy Now" but before
// they commit to the full Checkout flow. Lets them sanity-check the product,
// quantity, shipping estimate and total. "Continue" advances to the real
// Checkout, "Cancel" closes the preview without losing the buy-now selection.
function CheckoutPreview({ items, store, pc, currency, shippingEstimate, onConfirm, onClose }) {
  if (!items || items.length === 0) return null;
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Checkout Preview</p>
              <h2 className="text-xl font-extrabold mt-0.5">Confirm your order</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X size={16}/></button>
          </div>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                {it.image ? <img src={it.image} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-300"/></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{it.name}</p>
                {it.variant && <p className="text-[11px] text-gray-400">{it.variant.label || it.variant.name || (it.variant.type === 'color' && it.variant.value && /^#[0-9a-f]{3,8}$/i.test(it.variant.value) ? '' : it.variant.value) || ''}</p>}
                <p className="text-[11px] text-gray-500">Qty: {it.quantity}</p>
              </div>
              <p className="font-extrabold text-sm" style={{ color: pc }}>
                {(parseFloat(it.price) * (it.quantity || 1)).toLocaleString()} {currency}
              </p>
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{subtotal.toLocaleString()} {currency}</span></div>
            <div className="flex justify-between text-base font-extrabold pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-800 dark:text-gray-100">Total</span>
              <span style={{ color: pc }}>{subtotal.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={onConfirm} className="flex-[1.4] py-3 rounded-xl text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: pc }}>
            <Check size={14}/> Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DARK PRODUCT CARD ============
function DarkProductCard({ product, storeSlug, pc, currency, getName, getThumb, openQuickAdd, openDetail, wishlist, toggleWishlist, onBuyNow, themeMode }) {
  const thumb = getThumb(product);
  const inWishlist = wishlist.includes(product.id);
  const cartItems = useCartStore(s => s.items);
  const inCart = cartItems.some(i => i.product_id === product.id);
  const price = parseFloat(product.price) || 0;
  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const onSale = comparePrice && comparePrice > price;
  const stockCount = product.stock_quantity;
  const isLight = themeMode === 'light';

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group relative ${inCart ? 'ring-2 ring-yellow-400' : ''}`}
      style={{ background: inCart ? (isLight ? '#fef9c3' : 'linear-gradient(145deg, #713f12 0%, #422006 60%, #1c1917 100%)') : (isLight ? '#ffffff' : 'linear-gradient(145deg, #1e293b 0%, #1e1b4b 60%, #0f172a 100%)'), border: isLight && !inCart ? '1px solid #e5e7eb' : 'none' }}>
      {/* Product Image */}
      <div className="relative cursor-pointer" onClick={() => openDetail(product)}>
        <div className="aspect-square bg-white/5 relative overflow-hidden m-2.5 rounded-xl">
          {thumb
            ? <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-white/15" /></div>}
        </div>

        {/* Favourite on LEFT top. SALE badge at BOTTOM-LEFT. Cart on top-RIGHT. */}
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
          className={`absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-white/10 ${inWishlist ? 'bg-red-500 text-white' : 'bg-gray-900 text-white hover:text-red-300 hover:bg-black'}`}
          aria-label="Add to favorites"><Heart size={14} fill={inWishlist ? 'white' : 'none'} /></button>
        {onSale && <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg shadow-lg">SALE</span>}
        <button onClick={(e) => { e.stopPropagation(); openQuickAdd(product); }}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-white/10 ${inCart ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-900 text-white hover:bg-black'}`}
          aria-label="Add to cart"><ShoppingCart size={14} /></button>
      </div>

      {/* Product Info */}
      <div className="px-3.5 pb-3 pt-1">
        <div className="cursor-pointer" onClick={() => openDetail(product)}>
          <h3 className={`font-semibold text-sm truncate transition-colors ${isLight ? 'text-gray-800 hover:text-gray-900' : 'text-white/90 hover:text-white'}`}>{getName(product)}</h3>
        </div>

        {/* Variants preview (colors, sizes, materials) */}
        {(() => {
          let variants = product.variants || [];
          if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
          if (!Array.isArray(variants) || variants.length === 0) return null;
          const groups = {};
          variants.forEach(v => { const t = (v.type || 'option').toLowerCase(); if (!groups[t]) groups[t] = []; groups[t].push(v); });
          const isColorVal = (val) => val && (/^#[0-9A-Fa-f]{3,8}$/.test(val) || /^(rgb|hsl)a?\(/.test(val) || ['red','blue','green','black','white','yellow','orange','purple','pink','brown','gray','grey','navy','teal','cyan','magenta','beige','cream','gold','silver'].includes((val||'').toLowerCase()));
          return (
            <div className="mt-1.5 space-y-1">
              {groups.color && (
                <div className="flex items-center gap-1 flex-wrap">
                  {groups.color.slice(0, 6).map((v, i) => (
                    <span key={i} className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: isColorVal(v.value) ? v.value : '#ccc' }} title={v.name || v.value}/>
                  ))}
                  {groups.color.length > 6 && <span className={`text-[9px] font-bold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>+{groups.color.length - 6}</span>}
                </div>
              )}
              {groups.size && (
                <div className="flex items-center gap-1 flex-wrap">
                  {groups.size.slice(0, 4).map((v, i) => (
                    <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/50'}`}>{v.name || v.value}</span>
                  ))}
                  {groups.size.length > 4 && <span className={`text-[9px] font-bold ${isLight ? 'text-gray-400' : 'text-white/30'}`}>+{groups.size.length - 4}</span>}
                </div>
              )}
              {groups.material && (
                <div className="flex items-center gap-1 flex-wrap">
                  {groups.material.slice(0, 3).map((v, i) => (
                    <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/50'}`}>{v.name || v.value}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Stock badge */}
        <div className="mt-1.5">
          {stockCount > 0
            ? <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />In Stock</span>
            : product.allow_oversell
              ? <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Available</span>
              : <span className="text-red-400 text-[10px] font-bold">Out of Stock</span>}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-lg font-extrabold" style={{ color: pc }}>{price.toLocaleString()}</span>
          <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/30'}`}>{currency}</span>
          {onSale && <span className={`text-xs line-through ${isLight ? 'text-gray-400' : 'text-white/25'}`}>{comparePrice.toLocaleString()}</span>}
        </div>

        {/* Buy Now button */}
        <button
          onClick={(e) => { e.stopPropagation(); onBuyNow(product); }}
          className="w-full mt-2.5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 shadow-lg transition-all"
          style={{ backgroundColor: pc }}
        >
          <Zap size={13} /> ORDER NOW
        </button>
      </div>
    </div>
  );
}

// ============ MAIN STOREFRONT ============
export default function Storefront() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const { lang } = useLangStore();
  const { addItem, getCount } = useCartStore();
  const { token: authToken, role: authRole, user: authUser } = useAuthStore();
  const isLoggedInCustomer = !!authToken && authRole === 'customer';
  const isStoreOwner = !!authToken && authRole === 'store_owner';
  const wishlistStore = useWishlistStore();
  // Bind the wishlist store to this storefront's slug as soon as we mount.
  useEffect(()=>{ wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  // Track a single store visit per browser session (not per page view).
  useEffect(()=>{
    if(!storeSlug)return;
    const k='visited_'+storeSlug;
    if(sessionStorage.getItem(k))return;
    sessionStorage.setItem(k,'1');
    import('../../utils/api').then(({default:api})=>{api.post(`/storefront/${storeSlug}/visit`).catch(()=>{});});
  },[storeSlug]);

  // Live-visitor heartbeat — pings the backend every 15s while the storefront
  // is open so the admin dashboard's "Live (N)" badge reflects real activity.
  useEffect(()=>{
    if(!storeSlug)return;
    let visitorId=sessionStorage.getItem('visitor_id');
    if(!visitorId){visitorId=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('visitor_id',visitorId);}
    const beat=()=>{
      import('../../utils/api').then(({default:api})=>{
        api.post(`/store/${storeSlug}/heartbeat`,{visitor_id:visitorId}).catch(()=>{});
      });
    };
    beat();
    const id=setInterval(beat,15000);
    return ()=>clearInterval(id);
  },[storeSlug]);
  const wishlist = wishlistStore.items.map(p=>p.id);
  const [store, setStore] = useState(() => { try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; } });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, name_asc, name_desc, price_asc, price_desc
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
  const [favAddProduct, setFavAddProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState(null);
  const [previewItems, setPreviewItems] = useState(null);
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const buyerTheme = useBuyerTheme();
  useEffect(() => { buyerTheme.init(); }, []); // eslint-disable-line
  const navigate = useNavigate();

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
        try { initPixels(storeData?.tracking_pixels); } catch {}
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
  // If the product has variants and isn't already in the wishlist, open the
  // same variant-picker modal used for cart so buyers can save a specific
  // color/size combo.
  const toggleWishlist = (productOrId) => {
    const product = typeof productOrId === 'object' ? productOrId : products.find(p=>p.id===productOrId);
    if (!product) return;
    const already = wishlistStore.has(product.id);
    let variants = product.variants || [];
    if (typeof variants === 'string') { try { variants = JSON.parse(variants); } catch { variants = []; } }
    const hasVariants = Array.isArray(variants) && variants.length > 0;
    if (!already && hasVariants) {
      setFavAddProduct(product);
      return;
    }
    const added = wishlistStore.toggle(product);
    if (added) toast.success(t('store.addedToFavorites','Added to favorites'));
    else toast.success(t('store.removedFromFavorites','Removed from favorites'));
  };

  // Callback from the ProductQuickAdd modal when used in favorite mode.
  const handleFavAdd = ({ product: p, selectedVariant, quantity: qty }) => {
    const label = selectedVariant
      ? (selectedVariant.label || selectedVariant.name || '')
      : '';
    // Attach the chosen variant to the product object so Favorites.jsx can
    // display it and pre-fill it when the buyer adds it to the cart.
    const saved = { ...p, _selectedVariant: selectedVariant || null, _variantLabel: label || null };
    wishlistStore.toggle(saved);
    toast.success(label ? `Saved "${label}" to favorites` : t('store.addedToFavorites','Added to favorites'));
  };

  // Wrapper around the cart store that fires a toast — used everywhere on the
  // storefront so the feedback is consistent.
  const quickAddToCart = (product) => {
    addItem(product);
    try { trackAddToCart(store?.tracking_pixels, product, 1); } catch {}
    toast.success(t('store.addedToCart','Added to cart'));
  };

  // Navigate to the full product detail page (with reviews, comments, etc.)
  const openDetail = (product) => {
    try { trackViewContent(store?.tracking_pixels, product); } catch {}
    const slug = product.slug || product.id;
    navigate(`/s/${storeSlug}/product/${slug}`);
  };
  // Buy now: open the variant picker (same as Add to Cart) so the buyer can
  // choose color/size/qty, then proceed directly to checkout.
  const handleBuyNow = (product, qty = 1, variant = null) => {
    const p = typeof product.price === 'number' ? product : { ...product, price: parseFloat(product.price) || 0 };
    let variants = p.variants || [];
    if (typeof variants === 'string') { try { variants = JSON.parse(variants); } catch { variants = []; } }
    if (Array.isArray(variants) && variants.length > 0) {
      setBuyNowProduct(p);
    } else {
      const items = [{ product_id: p.id, name: getName(p), price: p.price, image: getThumb(p), quantity: qty, variant }];
      setBuyNowItems(items);
      setBuyNowOpen(true);
    }
  };
  const handleBuyNowFromQuickAdd = ({ product: p, selectedVariant, quantity: qty }) => {
    const items = [{ product_id: p.id, name: getName(p), price: p.price, image: getThumb(p), quantity: qty, variant: selectedVariant }];
    setBuyNowItems(items);
    setBuyNowOpen(true);
  };
  // Opens the quick-add popup so the buyer can pick variants before adding.
  const openQuickAdd = (product) => setQuickAddProduct(product);

  // Callback from the ProductQuickAdd modal.
  const handleQuickAddToCart = ({ product: p, selectedVariant, quantity: qty }) => {
    addItem(p, qty, selectedVariant);
    try { trackAddToCart(store?.tracking_pixels, p, qty); } catch {}
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
  if (loading && !store) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-500 animate-spin"/></div>;
  if (suspended) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center max-w-md"><div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Package size={32} className="text-red-500"/></div><h1 className="text-2xl font-bold text-gray-900 mb-2">Store Temporarily Unavailable</h1><p className="text-gray-500">This store is currently suspended. Please check back later or contact the store owner.</p></div></div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><Package size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 text-lg font-medium">Store not found</p><Link to="/" className="text-brand-500 text-sm font-semibold hover:underline mt-2 inline-block">Go to homepage</Link></div></div>;

  // Templates removed: theme picker fully drives the storefront palette.
  // Admin's customization primary_color takes precedence over the buyer theme
  // default so colors picked in Settings → Customization actually apply.
  const pc = store.primary_color || buyerTheme.primaryColor || '#7C3AED';
  const tplStyle = {};
  const headerBg = pc;
  const headerText = '#ffffff';
  const nameFont = store.header_font || 'Arial, sans-serif';
  const headerFont = store.header_font || 'Arial, sans-serif';
  const bodyTextColor = store.text_color || undefined;

  // Owner-customised scrollbar (Settings → Customization → Scrollbar Studio).
  const sb = store.scrollbar || {};
  const sbCss = sb.enabled !== false ? `
    .storefront-scope::-webkit-scrollbar,.storefront-scope *::-webkit-scrollbar{width:${sb.width??8}px;height:${sb.height??8}px;}
    .storefront-scope::-webkit-scrollbar-track,.storefront-scope *::-webkit-scrollbar-track{background:${sb.track||'#f3f4f6'};border-radius:${sb.radius??8}px;}
    .storefront-scope::-webkit-scrollbar-thumb,.storefront-scope *::-webkit-scrollbar-thumb{background:${sb.thumb||'#9ca3af'};border-radius:${sb.radius??8}px;}
    .storefront-scope{scrollbar-width:${(sb.width??8)<3?'none':'thin'};scrollbar-color:${sb.thumb||'#9ca3af'} ${sb.track||'#f3f4f6'};}
  ` : '';

  return (
    <div className={`storefront-scope min-h-screen pb-20 md:pb-0 ${buyerTheme.mode === 'dark' ? 'buyer-theme-dark bg-[#0b1020] text-gray-100' : 'bg-[#f5f5f5] text-gray-900'}`} style={bodyTextColor?{color:bodyTextColor}:undefined}>
      {sbCss && <style>{sbCss}</style>}
      {/* ============ OFFER BANNER ============ */}
      {store.offer_enabled && <OfferBanner store={store}/>}
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-30 shadow-md" style={{backgroundColor:headerBg,color:headerText,fontFamily:headerFont}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink" style={{color:headerText}}>
              {store.logo ? <img src={store.logo} className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl object-cover bg-white/20 shrink-0" alt=""/> : <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-white/20 font-bold text-base sm:text-xl shrink-0" style={{color:headerText}}>{(store.name || storeSlug)?.[0]}</div>}
              <span data-store-name className="store-header-title text-base sm:text-2xl font-extrabold truncate" style={{color:headerText,WebkitTextFillColor:headerText,fontFamily:nameFont}}>{store.name || storeSlug}</span>
            </Link>
          </div>
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
          <div className="flex items-center gap-1 sm:gap-3 shrink-0 overflow-x-auto max-w-full" style={{scrollbarWidth:'none'}}>
            {isStoreOwner && <Link to="/dashboard" className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full shrink-0" title="Dashboard"><LayoutDashboard size={18} className="sm:w-5 sm:h-5"/></Link>}
            <LanguageSwitcher variant="header"/>
            <ThemePanel compact modeOnly mode={buyerTheme.mode} primaryColor={buyerTheme.primaryColor} onModeChange={buyerTheme.setMode} onColorChange={buyerTheme.setPrimaryColor}/>
            <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full shrink-0"><User size={18} className="sm:w-5 sm:h-5"/></Link>
            {store.tracking_enabled !== false && <Link to={`/s/${storeSlug}/track`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full shrink-0" title="Track your order"><Truck size={18} className="sm:w-5 sm:h-5"/></Link>}
            {/* Favourites sits right beside the cart in the header */}
            <Link to={`/s/${storeSlug}/favorites`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative shrink-0" title="Favorites">
              <Heart size={18} className="sm:w-5 sm:h-5"/>
              {wishlist.length>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>}
            </Link>
            <button onClick={()=>setCartOpen(true)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative shrink-0">
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

      {false?(
        <BuilderSections sections={store.page_builder} products={products} categories={categories} store={store} storeSlug={storeSlug} pc={pc} getName={getName} getThumb={getThumb} addItem={quickAddToCart} openQuickAdd={openQuickAdd} wishlist={wishlist} toggleWishlist={toggleWishlist} search={search} setSearch={setSearch} t={t}/>
      ):<>

      {/* ============ HERO ============ */}
      <section className="relative py-10 sm:py-16 px-4 text-center overflow-hidden" style={{background:store.cover_image?'none':'#f0f0f0'}}>
        {store.cover_image&&<div className="absolute inset-0"><img src={store.cover_image} className="w-full h-full object-cover" alt=""/><div className="absolute inset-0 bg-black/40"/></div>}
        <div className="relative z-10">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tight ${store.cover_image?'text-white':'text-gray-900'}`} style={{fontFamily:store.header_font||'"Georgia","Times New Roman",serif'}}>{store.hero_title || store.welcome_message || store.name}</h1>
          <p className={`mt-3 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed ${store.cover_image?'text-white/80':'text-gray-500'}`}>
            {store.hero_subtitle || store.description || 'See why this product stands out from the rest. Every detail is meticulously designed for your satisfaction.'}
          </p>
          <div className="w-12 h-1 mx-auto mt-4 rounded-full" style={{backgroundColor:store.cover_image?'#fff':pc}}/>
        </div>
      </section>

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
              {sortBy === 'price_asc' ? t('store.sortPriceLow','Price: Low to High') : sortBy === 'price_desc' ? t('store.sortPriceHigh','Price: High to Low') : sortBy === 'date_asc' ? t('store.sortDateOldest','Date: Oldest first') : sortBy === 'name_asc' ? t('store.sortNameAZ','Name: A → Z') : sortBy === 'name_desc' ? t('store.sortNameZA','Name: Z → A') : t('store.sortDateNewest','Date: Newest first')}
              <ChevronDown size={13} className="text-gray-400"/>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {[
                { key: 'date_desc', label: t('store.sortDateNewest','Date: Newest first'), icon: Sparkles },
                { key: 'date_asc', label: t('store.sortDateOldest','Date: Oldest first'), icon: ArrowUpDown },
                { key: 'name_asc', label: t('store.sortNameAZ','Name: A → Z'), icon: ArrowUpDown },
                { key: 'name_desc', label: t('store.sortNameZA','Name: Z → A'), icon: ArrowUpDown },
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
          // Client-side sort: by date or by name (price sort already handled server-side)
          const nameOf = (p) => (getName(p) || p.name || '').toLowerCase();
          if (sortBy === 'date_asc') filtered = [...filtered].sort((a,b) => new Date(a.created_at||0) - new Date(b.created_at||0));
          else if (sortBy === 'date_desc') filtered = [...filtered].sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
          else if (sortBy === 'name_asc') filtered = [...filtered].sort((a,b) => nameOf(a).localeCompare(nameOf(b)));
          else if (sortBy === 'name_desc') filtered = [...filtered].sort((a,b) => nameOf(b).localeCompare(nameOf(a)));
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
            {filtered.map(product=>(
              <DarkProductCard key={product.id} product={product} storeSlug={storeSlug} pc={pc}
                currency={store.currency||'DZD'} getName={getName} getThumb={getThumb}
                openQuickAdd={openQuickAdd} openDetail={openDetail}
                wishlist={wishlist} toggleWishlist={toggleWishlist} onBuyNow={handleBuyNow} themeMode={buyerTheme.mode}/>
            ))}
          </div>
        );})()}
      </div>
      </>}

      {/* ============ FOOTER ============ */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          {(store.contact_phone || store.support_phone) && (
            <div className="flex items-center justify-center gap-6 mb-3 flex-wrap">
              {store.contact_phone && <a href={`tel:${String(store.contact_phone).replace(/[^\d+]/g,'')}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>{store.contact_phone}</a>}
              {store.support_phone && store.support_phone !== store.contact_phone && <a href={`tel:${String(store.support_phone).replace(/[^\d+]/g,'')}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Support: {store.support_phone}</a>}
            </div>
          )}
          <p className="text-sm text-gray-400">{store.footer_text || `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}</p>
          <p className="text-xs text-gray-300 mt-1">Powered by MakretDZ</p>
          {(() => { const fb = store.facebook_url || store.social_facebook; const ig = store.instagram_url || store.social_instagram; const tw = store.twitter_url || store.social_twitter; const tk = store.tiktok_url || store.social_tiktok; const yt = store.youtube_url || store.youtube; const li = store.linkedin_url || store.social_linkedin; return (fb||ig||tw||tk||yt||li) ? (
            <div className="flex items-center justify-center gap-4 mt-4">
              {fb && <a href={fb} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
              {ig && <a href={ig} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>}
              {tw && <a href={tw} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>}
              {tk && <a href={tk} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>}
              {yt && <a href={yt} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>}
              {li && <a href={li} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>}
            </div>
          ) : null; })()}
        </div>
      </footer>

      {/* ============ WHATSAPP FLOATING BUTTON ============ */}
      {(() => {
        const rawNum = store.whatsapp_button_enabled && store.whatsapp_button_number ? store.whatsapp_button_number : (store.whatsapp_number || store.support_phone || store.contact_phone);
        if (!rawNum) return null;
        const cleanNum = String(rawNum).replace(/[^\d+]/g,'').replace(/^\+/,'');
        if (!cleanNum) return null;
        const msg = store.whatsapp_button_enabled && store.whatsapp_button_message ? encodeURIComponent(store.whatsapp_button_message) : '';
        const href = msg ? `https://wa.me/${cleanNum}?text=${msg}` : `https://wa.me/${cleanNum}`;
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-[calc(160px+env(safe-area-inset-bottom))] md:bottom-24 left-4 md:left-6 z-40 w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
            style={{background:'linear-gradient(135deg, #25D366, #128C7E)'}}
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
          </a>
        );
      })()}

      {/* ============ SUPPORT PHONE BUTTON (right side) ============ */}
      {store.support_phone && (() => {
        const cleanPhone = String(store.support_phone).replace(/[^\d+]/g,'');
        return (
          <a href={`tel:${cleanPhone}`} className="fixed bottom-[calc(160px+env(safe-area-inset-bottom))] md:bottom-24 right-4 md:right-6 z-40 w-14 h-14 rounded-2xl text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform" style={{background:'linear-gradient(135deg, #3b82f6, #1d4ed8)'}} title="Call support" aria-label="Call support">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
        );
      })()}

      {/* ============ AI CHATBOT ============ */}
      <AIChatbot store={store} slug={storeSlug}/>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-stretch justify-around gap-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${buyerTheme.mode==='dark'?'bg-gray-900 border-t border-white/10':'bg-white border-t border-gray-100'}`}>
        <Link to={`/s/${storeSlug}`} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-white/10" style={{color:pc}}><Package size={20}/><span className="text-[10px] font-bold">{t('store.shop','Shop')}</span></Link>
        <Link to={`/s/${storeSlug}/favorites`} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-white/10 relative">
          <Heart size={20}/>
          {wishlist.length>0&&<span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>}
          <span className="text-[10px] font-bold">{t('store.favorites','Favs')}</span>
        </Link>
        {store.tracking_enabled !== false && <Link to={`/s/${storeSlug}/track`} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-white/10"><Truck size={20}/><span className="text-[10px] font-bold">{t('store.track','Track')}</span></Link>}
        <button onClick={()=>setCartOpen(true)} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-white/10 relative">
          <ShoppingCart size={20}/>
          {getCount()>0&&<span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{getCount()}</span>}
          <span className="text-[10px] font-bold">{t('store.cart','Cart')}</span>
        </button>
        <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-white/10"><User size={20}/><span className="text-[10px] font-bold">{t('store.account','Account')}</span></Link>
      </div>

      {/* ============ PRODUCT DETAIL MODAL ============ */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct} store={store} storeSlug={storeSlug} pc={pc}
          currency={store.currency||'DZD'} getName={getName} getThumb={getThumb}
          onClose={() => setDetailProduct(null)}
          onAddToCart={(p, qty, variant) => { addItem(p, qty, variant); toast.success(t('store.addedToCart','Added to cart')); }}
          onBuyNow={(p, qty, variant) => handleBuyNow(p, qty, variant)}
          wishlistStore={wishlistStore}
        />
      )}

      {cartOpen && <Checkout isModal onClose={()=>setCartOpen(false)} storeSlug={storeSlug}/>}
      <ProductQuickAdd
        show={!!buyNowProduct}
        onClose={() => setBuyNowProduct(null)}
        product={buyNowProduct}
        storeSlug={storeSlug}
        primaryColor={pc}
        currency={store.currency || 'DZD'}
        mode="buyNow"
        onAddToCart={handleBuyNowFromQuickAdd}
      />
      {buyNowOpen && <Checkout isModal onClose={()=>{setBuyNowOpen(false);setBuyNowItems(null);}} storeSlug={storeSlug} directItems={buyNowItems}/>}
      <ProductQuickAdd
        show={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        storeSlug={storeSlug}
        primaryColor={pc}
        currency={store.currency || 'DZD'}
        onAddToCart={handleQuickAddToCart}
      />
      <ProductQuickAdd
        show={!!favAddProduct}
        onClose={() => setFavAddProduct(null)}
        product={favAddProduct}
        storeSlug={storeSlug}
        primaryColor={pc}
        currency={store.currency || 'DZD'}
        mode="favorite"
        onAddToCart={handleFavAdd}
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
                <Link to={`/s/${storeSlug}/product/${product.slug}`}><div className="aspect-square bg-gray-100 relative overflow-hidden">{thumb?<img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>:<div className="w-full h-full flex items-center justify-center"><Package size={32} style={{color:'#d1d5db'}}/></div>}{product.compare_at_price&&<span className="absolute bottom-2 left-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">SALE</span>}</div></Link>
                {/* Favourite on the LEFT (top), cart on the RIGHT. SALE is at bottom-left of image. */}
                <button onClick={(e)=>{e.preventDefault();e.stopPropagation();toggleWishlist(product);}} className={`absolute left-3 top-3 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${inW?'bg-red-500 text-white':'bg-gray-900 text-white hover:bg-black hover:text-red-300'}`} aria-label="Add to favorites"><Heart size={14} fill={inW?'white':'none'}/></button>
                {c.showBtn!==false&&<button onClick={(e)=>{e.preventDefault();e.stopPropagation();openQuickAdd(product);}} className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform bg-gray-900 hover:bg-black" aria-label="Add to cart"><ShoppingCart size={14}/></button>}
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
