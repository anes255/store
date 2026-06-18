import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore, useWishlistStore, useBuyerTheme } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, ArrowRight, Star, Truck, Shield, Package, Check, User, Globe, X, Search, Zap, ZoomIn, ZoomOut, Maximize2, Tag } from 'lucide-react';
const Checkout = lazy(() => import('./Checkout'));
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import ThemePanel from '../../components/shared/ThemePanel';

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen image lightbox with zoom controls. Supports:
//   • Click / wheel / +/- buttons to zoom in & out
//   • Drag to pan when zoomed in
//   • Double-click to fit / 200% toggle
//   • Pinch zoom on touch devices
//   • Arrow keys / on-screen arrows for prev/next
// ─────────────────────────────────────────────────────────────────────────────
function LightboxImage({ images, index, onClose, onChange }) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const pinchStart = useRef(null);

  useEffect(() => { setScale(1); setOrigin({ x: 0, y: 0 }); }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && images.length > 1) onChange((index + 1) % images.length);
      else if (e.key === 'ArrowLeft' && images.length > 1) onChange((index - 1 + images.length) % images.length);
      else if (e.key === '+' || e.key === '=') setScale(s => Math.min(5, +(s + 0.5).toFixed(2)));
      else if (e.key === '-') setScale(s => Math.max(1, +(s - 0.5).toFixed(2)));
      else if (e.key === '0') { setScale(1); setOrigin({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onChange]);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setScale(s => Math.max(1, Math.min(5, +(s + delta).toFixed(2))));
  };

  const onPointerDown = (e) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: origin.x, oy: origin.y };
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setOrigin({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const onPointerUp = () => setDragging(false);

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.hypot(dx, dy), scale };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = Math.max(1, Math.min(5, pinchStart.current.scale * (dist / pinchStart.current.dist)));
      setScale(+next.toFixed(2));
    }
  };
  const onTouchEnd = () => { pinchStart.current = null; };

  const toggleZoom = () => {
    if (scale > 1) { setScale(1); setOrigin({ x: 0, y: 0 }); }
    else setScale(2);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center select-none"
      onClick={onClose}
      onWheel={onWheel}
    >
      {/* Top toolbar — hidden on mobile, shown on sm+ */}
      <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-2 py-1.5 z-10" onClick={e => e.stopPropagation()}>
        <button onClick={() => setScale(s => Math.max(1, +(s - 0.5).toFixed(2)))} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center" title="Zoom out (-)"><ZoomOut size={16}/></button>
        <span className="text-white text-xs font-bold font-mono w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(5, +(s + 0.5).toFixed(2)))} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center" title="Zoom in (+)"><ZoomIn size={16}/></button>
        <span className="w-px h-5 bg-white/20"/>
        <button onClick={() => { setScale(1); setOrigin({ x: 0, y: 0 }); }} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center" title="Reset (0)"><Maximize2 size={14}/></button>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"><X size={20}/></button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl z-10">‹</button>
          <button onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl z-10">›</button>
        </>
      )}

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={toggleZoom}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in', touchAction: scale > 1 ? 'none' : 'auto' }}
      >
        <img
          src={images[index]}
          alt=""
          loading="eager"
          decoding="sync"
          draggable={false}
          className="max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl"
          style={{
            transform: `translate(${origin.x}px, ${origin.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.2s ease',
            imageRendering: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-3 py-1.5 rounded-full z-10" onClick={e => e.stopPropagation()}>
          {images.map((_, i) => (
            <button key={i} onClick={() => onChange(i)} className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-white w-6' : 'bg-white/40'}`}/>
          ))}
        </div>
      )}

      <p className="hidden sm:block absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-mono">
        Scroll / +/- to zoom · drag to pan · double-click to toggle · Esc to close
      </p>
    </div>
  );
}

// Real-time limited-offer countdown — ticks down every second. The deadline is
// persisted in localStorage per product so it survives reloads instead of
// resetting on each render.
function ProductOfferCountdown({ product }) {
  const h = parseInt(product.offer_hours) || 0;
  const m = parseInt(product.offer_minutes) || 0;
  const key = `poffer_${product.id}_${h}_${m}`;
  const deadline = React.useMemo(() => {
    if (!h && !m) return 0;
    try { const c = parseInt(localStorage.getItem(key)); if (c && c > Date.now()) return c; } catch {}
    const d = Date.now() + (h * 3600 + m * 60) * 1000;
    try { localStorage.setItem(key, String(d)); } catch {}
    return d;
  }, [key, h, m]);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (!product.is_on_sale || (!h && !m)) return null;
  const diff = Math.max(0, deadline - now);
  if (diff <= 0) return null;
  const hh = Math.floor(diff / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  return <div className="mt-3 flex items-center gap-3 text-lg font-extrabold text-red-600"><Tag size={20}/><span className="text-base sm:text-lg">{product.offer_title || 'Limited Offer'}</span><span className="font-mono bg-red-50 px-3 py-1.5 rounded-xl border-2 border-red-200 text-base sm:text-lg tracking-wider">{pad(hh)}:{pad(mm)}:{pad(ss)}</span></div>;
}

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addItem, getCount } = useCartStore();
  const { lang } = useLangStore();
  const { token:authToken, role:authRole } = useAuthStore();
  const wishlistStore = useWishlistStore();
  const buyerTheme = useBuyerTheme();
  useEffect(() => { wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  useEffect(() => { buyerTheme.init(); }, []); // eslint-disable-line
  const isLoggedInCustomer = !!authToken && authRole === 'customer';
  const cachedStore = (() => { try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; } })();
  const [store, setStore] = useState(cachedStore);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  // Lightbox: when set, an overlay shows that image full-screen.
  const [lightboxIdx, setLightboxIdx] = useState(null);
  // Track selected variants per type so buyers can pick one from each group
  // e.g. { color: 2, size: 0 }
  const [selectedVariants, setSelectedVariants] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/s/${storeSlug}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sr, pr] = await Promise.all([storeApi.getStore(storeSlug), storeApi.getProduct(storeSlug, productSlug)]);
        if (cancelled) return;
        setStore(sr.data); setProduct(pr.data);
        try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(sr.data)); } catch {}
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [storeSlug, productSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#7C3AED] rounded-full animate-spin"/></div>;
  if (!product || !store) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Product not found</p></div>;

  const getName = (item) => lang==='ar'?(item.name_ar||item.name_en||item.name):lang==='fr'?(item.name_fr||item.name_en||item.name):item.name_en||item.name;
  const getDesc = () => lang==='ar'?(product.description_ar||product.description_en||product.description):lang==='fr'?(product.description_fr||product.description_en||product.description):product.description_en||product.description;
  const pc = store.primary_color || '#7C3AED';
  const currency = store.currency || 'DZD';

  // Parse variants safely
  let variants = product.variants || [];
  if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
  if (!Array.isArray(variants)) variants = [];

  // Group variants by type (color, size, material, style, custom, etc.)
  const variantGroups = {};
  variants.forEach((v,i) => {
    const t = (v.type || 'option').toLowerCase();
    if (!variantGroups[t]) variantGroups[t] = [];
    variantGroups[t].push({ ...v, _idx: i });
  });
  const groupTypes = Object.keys(variantGroups);

  // Build the combined selected variant info. When there's only one group,
  // the selected variant is directly from that group. With multiple groups
  // we build a composite label from all selections.
  const selectedIdxes = Object.values(selectedVariants).filter(v => v !== null && v !== undefined);
  const primarySelected = selectedIdxes.length > 0 ? variants[selectedIdxes[0]] : null;

  // For images/stock, use the first selected variant's data
  const sv = primarySelected;
  const allImages = (() => {
    // If a color or image-bearing variant is selected, show its images first
    if (sv?.images?.length > 0) return sv.images;
    let imgs = product.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (!Array.isArray(imgs)) imgs = [];
    if (imgs.length === 0 && product.thumbnail) imgs = [product.thumbnail];
    return imgs;
  })();

  const rawBasePrice = parseFloat(product.price) || 0;
  const offerPct = product.is_on_sale && product.offer_discount ? (parseFloat(String(product.offer_discount).replace(/[^0-9.]/g, '')) || 0) : 0;
  const basePrice = offerPct > 0 ? Math.round(rawBasePrice * (1 - offerPct / 100)) : rawBasePrice;
  // Sum all price adjustments from selected variants
  const priceAdj = selectedIdxes.reduce((sum, idx) => sum + (parseFloat(variants[idx]?.price_adjustment) || 0), 0);
  // Quantity offers (tiered "buy N, save") are presented at checkout, not here,
  // so the product price reflects only the sale + variant adjustments.
  const finalPrice = basePrice + priceAdj;
  const stockCount = sv ? (sv.stock ?? product.stock_quantity) : product.stock_quantity;

  // Build a variant label for display
  const variantLabel = selectedIdxes.map(idx => {
    const v = variants[idx];
    if (v?.type === 'color' && v?.value && /^#[0-9a-f]{3,8}$/i.test(v.value)) return v.name || '';
    return v?.name || v?.value || '';
  }).filter(Boolean).join(' / ');

  // Build the variant object to pass to cart/wishlist
  const buildVariantObj = () => {
    if (selectedIdxes.length === 0) return null;
    const parts = selectedIdxes.map(idx => {
      const v = variants[idx];
      return { name: v.name, type: v.type, value: v.value };
    });
    // For a single variant type, return a flat object.
    // For multiple, return the array so the cart/favorites can display all.
    if (parts.length === 1) return parts[0];
    return { selections: parts, label: variantLabel };
  };

  const selectVariant = (type, idx) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: prev[type] === idx ? null : idx,
    }));
    setSelectedImage(0);
  };

  const requireSelections = () => {
    const missing = groupTypes.filter(t => selectedVariants[t] == null);
    if (missing.length) { toast.error(t('store.pleaseChoose','Please choose: ') + missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')); return false; }
    if (!quantity || quantity < 1) { toast.error(t('store.pickQuantity','Pick a quantity')); return false; }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireSelections()) return;
    addItem({ ...product, price: finalPrice, quantity_offers: product.quantity_offers || [] }, quantity, buildVariantObj());
    toast.success(variantLabel ? `Added "${variantLabel}" to cart` : 'Added to cart');
  };

  const handleBuyNow = () => {
    let imgs = product.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (!Array.isArray(imgs)) imgs = [];
    const directItem = {
      product_id: product.id,
      name: product.name_en || product.name_fr || product.name_ar || product.name,
      price: finalPrice,
      image: product.thumbnail || imgs[0] || null,
      quantity: 1,
      variant: null,
      quantity_offers: product.quantity_offers || [],
      variants: product.variants || [],
    };
    setBuyNowItems([directItem]);
    setBuyNowOpen(true);
  };

  const handleToggleWishlist = () => {
    if (groupTypes.length > 0 && !requireSelections()) return;
    const variantObj = buildVariantObj();
    const key = product.id + (variantLabel ? '::' + variantLabel : '');
    const productWithVariant = {
      ...product,
      price: finalPrice,
      _selectedVariant: variantObj,
      _variantLabel: variantLabel,
      _wishlistKey: key,
    };
    const added = wishlistStore.toggle(productWithVariant);
    if (added) toast.success(variantLabel ? `"${variantLabel}" added to favorites` : 'Added to favorites');
    else toast.success(t('store.removedFromFavorites','Removed from favorites'));
  };

  const inWishlist = wishlistStore.has(product.id);

  // Detect if a value looks like a CSS color
  const isColor = (val) => {
    if (!val) return false;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) return true;
    if (/^(rgb|hsl)a?\(/.test(val)) return true;
    // Common color names
    const names = ['red','blue','green','black','white','yellow','orange','purple','pink','brown','gray','grey','navy','teal','cyan','magenta','beige','cream','gold','silver','maroon','olive','coral','salmon','turquoise','indigo','violet','lime','aqua','tan','khaki'];
    return names.includes(val.toLowerCase());
  };

  // Match header style to the storefront's page builder template
  const tplSec = Array.isArray(store.page_builder) ? store.page_builder.find(s => s.visible !== false) : null;
  const tplStyle = tplSec?.style || {};
  const headerBg = tplStyle.bg || pc;
  const headerText = tplStyle.textColor || '#ffffff';
  const nameFont = store.header_font || tplStyle.fontFamily || 'Arial, sans-serif';
  const headerFont = store.header_font || tplStyle.fontFamily || 'Arial, sans-serif';

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${buyerTheme.mode==='dark'?'buyer-theme-dark bg-[#0b1020] text-gray-100':'bg-[#f5f5f5] text-gray-900'}`}>
      <header className="sticky top-0 z-30 shadow-md" style={{backgroundColor:headerBg,color:headerText,fontFamily:headerFont}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink" style={{color:headerText}}>
            {store.logo ? <img src={store.logo} className="w-9 h-9 sm:w-14 sm:h-14 rounded-full object-cover bg-white/20 shrink-0" alt=""/> : <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/20 font-bold text-base sm:text-xl shrink-0" style={{color:headerText}}>{store.name?.[0]}</div>}
            <span className="text-base sm:text-2xl font-extrabold truncate" style={{color:headerText,fontFamily:nameFont}}>{store.name}</span>
          </Link>
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="flex items-center bg-white/95 rounded-full shadow-md w-full">
              <Search size={20} className="ml-5 text-gray-400"/>
              <input
                className="flex-1 bg-transparent px-4 py-3.5 text-base focus:outline-none text-gray-800"
                placeholder={t('store.search','Search products...')}
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden sm:block"><LanguageSwitcher variant="header"/></div>
            <div className="hidden sm:block"><ThemePanel compact modeOnly mode={buyerTheme.mode} primaryColor={buyerTheme.primaryColor} onModeChange={buyerTheme.setMode} onColorChange={buyerTheme.setPrimaryColor}/></div>
            <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full"><User size={18} className="sm:w-5 sm:h-5"/></Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <Heart size={18} className="sm:w-5 sm:h-5"/>
              {wishlistStore.count()>0&&<span className="notif-badge">{wishlistStore.count()}</span>}
            </Link>
            <button onClick={()=>setCartOpen(true)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5"/>
              {getCount()>0&&<span className="notif-badge">{getCount()}</span>}
            </button>
          </div>
        </div>
        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden px-3 pb-3">
          <div className="flex items-center bg-white/95 rounded-full shadow-md w-full">
            <Search size={16} className="ml-4 text-gray-400 shrink-0"/>
            <input
              className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none text-gray-800"
              placeholder={t('store.search','Search products...')}
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </header>

      <div className="max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
          {/* ═══ IMAGES ═══ */}
          <div className="space-y-3">
            <div className="bg-white sm:rounded-3xl cursor-zoom-in relative w-full max-w-full overflow-hidden flex items-center justify-center px-12 py-3" style={{height:'min(55vh, 420px)'}} onClick={()=>allImages[selectedImage]&&setLightboxIdx(selectedImage)}>
              {allImages[selectedImage]
                ? <img src={allImages[selectedImage]} loading="eager" decoding="async" fetchpriority="high" className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl sm:rounded-xl" alt=""/>
                : <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package size={64} className="text-gray-300"/></div>}
              {allImages.length > 1 && (
                <>
                  <button aria-label="Previous image" onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage - 1 + allImages.length) % allImages.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 text-white grid place-items-center z-20 active:scale-90 shadow-xl">
                    <ArrowLeft size={18}/>
                  </button>
                  <button aria-label="Next image" onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage + 1) % allImages.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 text-white grid place-items-center z-20 active:scale-90 shadow-xl">
                    <ArrowRight size={18}/>
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 px-3 sm:px-0">
                {allImages.map((img,i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white overflow-hidden shrink-0 border-2 transition-all ${selectedImage===i ? 'border-brand-500 shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={img} loading="lazy" className="w-full h-full object-contain" alt=""/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══ DETAILS ═══ */}
          <div className="px-4 sm:px-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{getName(product)}</h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold" style={{color:pc}}>{finalPrice.toLocaleString()} {currency}</span>
              {((product.compare_at_price && parseFloat(product.compare_at_price) > finalPrice) || offerPct > 0) && (
                <span className="text-lg text-gray-400 line-through">{(offerPct > 0 ? rawBasePrice : parseFloat(product.compare_at_price)).toLocaleString()}</span>
              )}
              {priceAdj !== 0 && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold">{priceAdj > 0 ? '+' : ''}{priceAdj.toLocaleString()} {currency}</span>}
              {offerPct > 0 && <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">{product.sale_badge_text || 'SALE'} - {product.offer_discount}</span>}
            </div>
            {/* Offer timer */}
            <ProductOfferCountdown product={product} />

            {/* Selected variant label */}
            {variantLabel && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <span className="text-sm font-bold text-gray-800 px-2.5 py-1 bg-gray-100 rounded-lg">{variantLabel}</span>
              </div>
            )}

            {/* Description */}
            {getDesc() && <p className="mt-4 text-gray-600 leading-relaxed">{getDesc()}</p>}
            {sv?.description && <p className="mt-2 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">{sv.description}</p>}

            {/* Stock */}
            <div className="mt-3">
              {stockCount > 0
                ? <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"/>
                    {store.show_stock_storefront ? `${stockCount} in stock` : 'In stock'}
                  </span>
                : product.allow_oversell
                  ? <span className="inline-flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"/>
                      Available for order
                    </span>
                  : <span className="text-red-500 text-sm font-semibold">Out of stock</span>}
            </div>

            {/* ═══ VARIANT SELECTORS ═══ */}
            {groupTypes.length > 0 && (
              <div className="mt-6 space-y-5">
                {groupTypes.map(type => {
                  const group = variantGroups[type];
                  const typeLabel = type === 'color' ? 'Color' : type === 'size' ? 'Size' : type === 'material' ? 'Material' : type === 'style' ? 'Style' : type.charAt(0).toUpperCase() + type.slice(1);
                  const selectedInGroup = selectedVariants[type];
                  const selName = selectedInGroup != null ? variants[selectedInGroup]?.name : null;

                  return (
                    <div key={type}>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        {typeLabel}
                        {selName && <span className="text-gray-800 normal-case font-semibold text-sm">— {selName}</span>}
                      </p>

                      {/* COLOR TYPE — render swatches */}
                      {type === 'color' ? (
                        <div className="flex flex-wrap gap-3">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            const colorVal = v.value || '#ccc';
                            const useColor = isColor(colorVal);
                            return (
                              <button
                                key={v._idx}
                                onClick={() => selectVariant(type, v._idx)}
                                className={`relative flex flex-col items-center gap-1 transition-all`}
                                title={v.name}
                              >
                                <div
                                  className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center ${isSel ? 'border-gray-900 scale-110 shadow-lg ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-400 hover:scale-105'}`}
                                  style={useColor ? { backgroundColor: colorVal } : {}}
                                >
                                  {!useColor && <span className="text-[9px] font-bold text-gray-500 text-center leading-tight px-0.5">{(v.value || v.name || '?').slice(0, 3)}</span>}
                                  {isSel && <Check size={16} className="text-white drop-shadow-md"/>}
                                </div>
                                <span className={`text-[10px] font-medium ${isSel ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{v.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* NON-COLOR TYPES — render pill buttons */
                        <div className="flex flex-wrap gap-2">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            return (
                              <button
                                key={v._idx}
                                onClick={() => selectVariant(type, v._idx)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                  isSel
                                    ? 'text-white shadow-md'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                                }`}
                                style={isSel ? { backgroundColor: pc, borderColor: pc } : {}}
                              >
                                {/* Always prefer the human-readable name; fall back to value
                                    only when the admin didn't set one (and strip hex prefix). */}
                                {v.name || (v.value && !/^#[0-9a-f]{3,8}$/i.test(v.value) ? v.value : 'Option')}
                                {(parseFloat(v.price_adjustment) || 0) !== 0 && (
                                  <span className="ml-1.5 opacity-70 text-xs">
                                    ({parseFloat(v.price_adjustment) > 0 ? '+' : ''}{parseFloat(v.price_adjustment).toLocaleString()})
                                  </span>
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

            {/* ═══ ADD TO CART + BUY NOW + WISHLIST ═══ */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl">
                  <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="p-3 hover:bg-gray-200 rounded-l-xl"><Minus size={16}/></button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity+1)} className="p-3 hover:bg-gray-200 rounded-r-xl"><Plus size={16}/></button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={stockCount <= 0 && !product.allow_oversell}
                  className="flex-1 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50 transition-all"
                  style={{backgroundColor:pc}}
                >
                  <ShoppingCart size={18}/>{store.btn_add_cart || 'Add to Cart'}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-xl border-2 transition-all ${inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                >
                  <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'}/>
                </button>
              </div>
              {/* Buy Now — goes straight to checkout */}
              <button
                onClick={handleBuyNow}
                disabled={stockCount <= 0 && !product.allow_oversell}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border-2 hover:opacity-90 shadow-sm disabled:opacity-50 transition-all"
                style={{borderColor:pc, color:pc, backgroundColor: pc + '08'}}
              >
                <Zap size={18}/>{store.btn_buy_now || 'Buy Now'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                {icon:Truck, label:'Fast Delivery', desc:'All 58 wilayas'},
                {icon:Shield, label:'Secure', desc:'Multiple options'},
                {icon:Package, label:'Returns', desc:'30-day policy'},
              ].map((f,i) => {
                const I = f.icon;
                return (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                    <I size={18} className="mx-auto text-gray-500 mb-1"/>
                    <p className="text-xs font-bold text-gray-700">{f.label}</p>
                    <p className="text-[10px] text-gray-400">{f.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Product weight */}
            {parseFloat(product.weight) > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Package size={16} className="text-gray-400"/>
                <span className="font-semibold">{t('store.weight','Weight')}:</span>
                <span>{parseFloat(product.weight)} {t('store.kg','kg')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ REVIEWS SECTION ═══ */}
        <ReviewsSection storeSlug={storeSlug} productSlug={productSlug} pc={pc}/>
      </div>
      {cartOpen && <Suspense fallback={null}><Checkout isModal onClose={()=>setCartOpen(false)} storeSlug={storeSlug}/></Suspense>}
      {buyNowOpen && <Suspense fallback={null}><Checkout isModal onClose={()=>setBuyNowOpen(false)} storeSlug={storeSlug} directItems={buyNowItems}/></Suspense>}

      {/* Image lightbox — full-screen view with click/scroll/pinch zoom. */}
      {lightboxIdx !== null && allImages[lightboxIdx] && (
        <LightboxImage
          images={allImages}
          index={lightboxIdx}
          onClose={()=>setLightboxIdx(null)}
          onChange={setLightboxIdx}
        />
      )}
    </div>
  );
}

function ReviewsSection({storeSlug,productSlug,pc}){
  const[reviews,setReviews]=React.useState([]);const[stats,setStats]=React.useState({});
  const[showForm,setShowForm]=React.useState(false);const[submitting,setSubmitting]=React.useState(false);
  const[form,setForm]=React.useState({customer_name:'',customer_phone:'',rating:5,title:'',content:''});

  React.useEffect(()=>{
    storeApi.getProductReviews(storeSlug,productSlug).then(r=>{setReviews(r.data.reviews||[]);setStats(r.data.stats||{});}).catch(()=>{});
  },[storeSlug,productSlug]);

  const submit=async()=>{
    if(!form.customer_name)return;
    setSubmitting(true);
    try{
      await storeApi.submitReview(storeSlug,productSlug,form);
      toast.success(t('store.reviewSubmitted','Review submitted! It will appear after approval.'));
      setShowForm(false);setForm({customer_name:'',customer_phone:'',rating:5,title:'',content:''});
      const r=await storeApi.getProductReviews(storeSlug,productSlug);setReviews(r.data.reviews||[]);setStats(r.data.stats||{});
    }catch(e){toast.error(e.response?.data?.error||'Failed to submit review');}
    setSubmitting(false);
  };

  const avgRating=parseFloat(stats.avg_rating)||0;
  const total=parseInt(stats.total)||0;

  return(
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Customer Reviews</h2>
          {total>0&&<div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={16} className={i<=Math.round(avgRating)?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>
            <span className="text-sm font-bold text-gray-700">{avgRating}</span>
            <span className="text-sm text-gray-400">({total} review{total!==1?'s':''})</span>
          </div>}
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{backgroundColor:pc}}>Write a Review</button>
      </div>

      {showForm&&(
        <div className="p-5 bg-gray-50 rounded-2xl mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">Your Rating:</span>
            <div className="flex gap-1">{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setForm({...form,rating:i})}><Star size={24} className={i<=form.rating?'text-amber-400 fill-amber-400':'text-gray-300 hover:text-amber-300'}/></button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Your name *" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/>
            <input className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Phone (optional)" value={form.customer_phone} onChange={e=>setForm({...form,customer_phone:e.target.value})}/>
          </div>
          <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Review title (optional)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" rows={3} placeholder="Write your review..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={submit} disabled={submitting||!form.customer_name} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{backgroundColor:pc}}>
              {submitting?'Submitting...':'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {reviews.length===0?(
        <div className="text-center py-8"><p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p></div>
      ):(
        <div className="space-y-4">
          {reviews.map(r=>(
            <div key={r.id} className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:pc}}>{(r.customer_name||'?')[0].toUpperCase()}</div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{r.customer_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=r.rating?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>
                    <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {r.title&&<p className="font-semibold text-sm text-gray-800 mb-1">{r.title}</p>}
              {r.content&&<p className="text-sm text-gray-600">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
