import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart, ArrowLeft, ShoppingCart, Eye, Trash2, CheckSquare, Square, X, Package, Sparkles, ShoppingBag, Search } from 'lucide-react';
import { useCartStore, useWishlistStore } from '../../hooks/useStore';
import { storeApi } from '../../utils/api';
import ProductQuickAdd from '../../components/shared/ProductQuickAdd';

// =============================================================================
// FAVORITES PAGE
// -----------------------------------------------------------------------------
// Matches the dark gradient aesthetic of CustomerProfile / cart sections so
// the three buyer-account pages feel like a single experience. Buyers can:
//   • see every saved product as an animated card on a dark canvas
//   • add items to the cart or open the product page in one tap
//   • multi-select to bulk add/remove
//   • search inside their own favorites
// =============================================================================
export default function Favorites() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const wishlistStore = useWishlistStore();

  useEffect(() => { wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  const items = wishlistStore.items;

  const [store, setStore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; }
  });
  const [storeReady, setStoreReady] = useState(!!store);

  useEffect(() => {
    let cancelled = false;
    storeApi.getStore(storeSlug).then(r => {
      if (cancelled) return;
      setStore(r.data);
      setStoreReady(true);
      try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(r.data)); } catch {}
    }).catch(() => { if (!cancelled) setStoreReady(true); });
    return () => { cancelled = true; };
  }, [storeSlug]);

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(p =>
      (p.name_en || p.name || '').toLowerCase().includes(q) ||
      (p.name_fr || '').toLowerCase().includes(q) ||
      (p.name_ar || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const getThumb = (p) => {
    if (p.thumbnail) return p.thumbnail;
    if (Array.isArray(p.images) && p.images.length) return typeof p.images[0] === 'string' ? p.images[0] : null;
    return null;
  };

  const getName = (p) => p.name_en || p.name_fr || p.name_ar || p.name || 'Untitled';

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  const clearSelection = () => setSelected([]);

  const handleRemove = (id) => {
    wishlistStore.remove(id);
    setSelected(s => s.filter(x => x !== id));
    toast.success(t('store.removedFromFavorites', 'Removed from favorites'));
  };

  const handleClearAll = () => {
    if (!items.length) return;
    if (!window.confirm(t('store.confirmClearFavorites', 'Remove all favorites?'))) return;
    wishlistStore.clear();
    setSelected([]);
    toast.success(t('store.favoritesCleared', 'Favorites cleared'));
  };

  const handleAddToCart = (product) => {
    if (product.variants && product.variants.length > 0 && !product._selectedVariant) {
      setQuickAddProduct(product);
    } else {
      addItem(product, 1, product._selectedVariant || null);
      toast.success(t('store.addedToCart', 'Added to cart'));
    }
  };

  const handleBulkAddToCart = () => {
    const picks = items.filter(p => selected.includes(p.id));
    if (!picks.length) return;
    picks.forEach(p => addItem(p, 1, p._selectedVariant || null));
    toast.success(t('store.bulkAddedToCart', `${picks.length} item${picks.length > 1 ? 's' : ''} added to cart`));
    setSelected([]);
  };

  const handleBulkRemove = () => {
    if (!selected.length) return;
    wishlistStore.setItems(items.filter(p => !selected.includes(p.id)));
    toast.success(t('store.removedFromFavorites', 'Removed from favorites'));
    setSelected([]);
  };

  // --------------------------------------------------------------------------
  // Loading state — mirrors CustomerProfile so the transition between tabs is
  // seamless when the buyer comes from the profile cart tab.
  // --------------------------------------------------------------------------
  const pcFallback = store?.primary_color || '#7C3AED';
  if (!storeReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="w-10 h-10 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: pcFallback }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="text-center">
          <Package size={48} className="mx-auto text-white/20 mb-4"/>
          <p className="text-white/60">Store not found</p>
        </div>
      </div>
    );
  }

  const pc = store.primary_color || '#7C3AED';
  const currency = store.currency || 'DZD';

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* ==================== TOP BAR ==================== */}
      <div className="sticky top-0 z-30 bg-gray-900/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-3 text-white min-w-0">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"><ArrowLeft size={18}/></button>
            {store.logo
              ? <img src={store.logo} className="w-9 h-9 rounded-lg object-cover ring-2 ring-white/10 shrink-0" alt=""/>
              : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 shrink-0" style={{ backgroundColor: pc }}>{store.name?.[0]}</div>}
            <span className="font-bold text-sm truncate">{store.name}</span>
          </Link>
          <Link to={`/s/${storeSlug}/profile`} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold text-white/80 hidden sm:flex items-center gap-2">
            {t('store.backToProfile', 'Profile')}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-24">
        {/* ==================== HEADER ==================== */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}88)` }}>
            <Heart size={22} className="text-white" fill="white"/>
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white italic" style={{ letterSpacing: '-0.03em' }}>
              {t('store.yourFavorites', 'Your')} <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, #f472b6)` }}>Favorites</span>
            </h1>
            <p className="text-sm text-gray-300/70 mt-2 font-light tracking-[0.2em] uppercase flex items-center gap-2">
              <Sparkles size={12} className="text-amber-400"/>
              {items.length === 0
                ? t('store.noFavoritesYet', 'Start saving the products you love')
                : t('store.savedProductsCount', `${items.length} saved product${items.length > 1 ? 's' : ''}`)}
            </p>
          </div>
        </motion.div>

        {/* ==================== SEARCH + ACTIONS ==================== */}
        {items.length > 0 && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, delay: 0.1}}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
          >
            <div className="flex-1 flex items-center bg-white/5 rounded-xl border border-white/10">
              <Search size={16} className="ml-4 text-gray-400"/>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('store.searchFavorites', 'Search your favorites...')}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
              {search && <button onClick={() => setSearch('')} className="px-3 text-gray-400 hover:text-white"><X size={14}/></button>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <CheckSquare size={14}/>
                {selected.length === filtered.length && filtered.length > 0
                  ? t('store.deselectAll', 'DESELECT')
                  : t('store.selectAll', 'SELECT ALL')}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
              >
                <Trash2 size={14}/>
                {t('store.clearAll', 'CLEAR ALL')}
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== EMPTY STATE ==================== */}
        {items.length === 0 ? (
          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.5}}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm py-20 px-6 text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}33, ${pc}11)` }}>
                <Heart size={40} style={{ color: pc }}/>
              </div>
              <motion.div
                animate={{scale: [1, 1.2, 1], opacity: [0.5, 0.15, 0.5]}}
                transition={{duration: 2, repeat: Infinity}}
                className="absolute inset-0 rounded-full"
                style={{boxShadow: `0 0 0 8px ${pc}22`}}
              />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic">{t('store.emptyFavoritesTitle', 'Nothing here yet')}</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {t('store.emptyFavoritesDesc', 'Tap the heart icon on any product to save it for later. Your wishlist follows you across devices.')}
            </p>
            <Link
              to={`/s/${storeSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}
            >
              <ShoppingBag size={16}/>
              {t('store.startShopping', 'Start Shopping')}
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm py-16 text-center">
            <Search size={32} className="mx-auto text-white/20 mb-3"/>
            <p className="text-gray-400 font-medium">{t('store.noMatchInFavorites', 'No favorites match your search')}</p>
          </div>
        ) : (
          /* ==================== PRODUCT GRID ==================== */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {opacity: 0},
              visible: {opacity: 1, transition: {staggerChildren: 0.05}},
            }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(product => {
                const thumb = getThumb(product);
                const isSelected = selected.includes(product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    variants={{
                      hidden: {opacity: 0, y: 24, scale: 0.96},
                      visible: {opacity: 1, y: 0, scale: 1, transition: {duration: 0.45, ease: [0.22, 1, 0.36, 1]}},
                    }}
                    exit={{opacity: 0, scale: 0.9, transition: {duration: 0.25}}}
                    whileHover={{y: -4}}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border"
                    style={{
                      background: 'linear-gradient(145deg, #1e293b 0%, #1e1b4b 60%, #0f172a 100%)',
                      borderColor: isSelected ? pc : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Selection checkbox */}
                    <button
                      onClick={() => toggleSelect(product.id)}
                      className="absolute top-3 left-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-all"
                      style={isSelected
                        ? {backgroundColor: pc, color: '#fff'}
                        : {backgroundColor: 'rgba(15,23,42,0.6)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)'}}
                    >
                      {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                    </button>

                    {/* Remove pill — always visible so mobile buyers can see it */}
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center bg-black/50 backdrop-blur-md text-gray-300 hover:text-red-400 hover:bg-black/70 border border-white/10 transition-all"
                      aria-label="Remove from favorites"
                    >
                      <X size={14}/>
                    </button>

                    {/* Image */}
                    <Link to={`/s/${storeSlug}/product/${product.slug}`} className="block">
                      <div className="aspect-square bg-white/5 relative overflow-hidden m-2.5 rounded-xl">
                        {thumb
                          ? <img src={thumb} alt={getName(product)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                          : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-white/20"/></div>}
                        {product.compare_at_price && (
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-md">SALE</span>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="px-3.5 pb-3.5 pt-0.5">
                      <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                        <h3 className="font-semibold text-sm text-white/90 truncate hover:text-white transition-colors">{getName(product)}</h3>
                      </Link>
                      {/* Variant label if saved from product detail */}
                      {(product._variantLabel || product._selectedVariant) && (
                        <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                          {product._selectedVariant?.type === 'color' && product._selectedVariant?.value && (
                            <span className="w-3 h-3 rounded-full border border-white/20 shrink-0 inline-block" style={{backgroundColor: product._selectedVariant.value}}/>
                          )}
                          {product._selectedVariant?.type === 'color' ? product._selectedVariant?.name : (product._variantLabel || product._selectedVariant?.name || '')}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-base sm:text-lg font-extrabold" style={{ color: pc }}>
                          {parseFloat(product.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-white/40 font-bold">{currency}</span>
                        {product.compare_at_price && (
                          <span className="text-[10px] text-white/30 line-through">
                            {parseFloat(product.compare_at_price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Action row */}
                      <div className="flex gap-1.5 mt-3">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-black text-white shadow-md hover:shadow-lg transition-all"
                          style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}
                        >
                          <ShoppingCart size={12}/> ADD
                        </button>
                        <Link
                          to={`/s/${storeSlug}/product/${product.slug}`}
                          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 transition-colors"
                          aria-label="View product"
                        >
                          <Eye size={12}/>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Continue shopping link */}
        {items.length > 0 && (
          <div className="text-center mt-10">
            <Link to={`/s/${storeSlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={14}/>
              {t('store.continueShopping', 'Continue Shopping')}
            </Link>
          </div>
        )}
      </div>

      {/* ==================== STICKY BULK ACTION BAR ==================== */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{y: 80, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 80, opacity: 0}}
            transition={{type: 'spring', stiffness: 260, damping: 22}}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: pc}}>
                {selected.length}
              </div>
              <span className="text-sm font-medium text-gray-200 flex-1 min-w-0 truncate">
                {t('store.itemsSelected', `${selected.length} selected`)}
              </span>
              <button
                onClick={handleBulkAddToCart}
                className="px-3 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-md"
                style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}
              >
                <ShoppingCart size={12}/> CART
              </button>
              <button
                onClick={handleBulkRemove}
                className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                aria-label="Remove selected"
              >
                <Trash2 size={14}/>
              </button>
              <button onClick={clearSelection} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Clear selection">
                <X size={14}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ProductQuickAdd
        show={!!quickAddProduct}
        onClose={()=>setQuickAddProduct(null)}
        product={quickAddProduct}
        storeSlug={storeSlug}
        primaryColor={pc}
        currency={currency}
        onAddToCart={({product:p,selectedVariant,quantity})=>{addItem(p,quantity,selectedVariant);toast.success(t('store.addedToCart','Added to cart'));setQuickAddProduct(null);}}
      />
    </div>
  );
}
