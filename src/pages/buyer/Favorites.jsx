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
// A premium-feeling wishlist page. Buyers can:
//   • see every saved product as an animated card
//   • add items to the cart or open the product page in one tap
//   • multi-select to bulk add/remove
//   • search inside their own favorites
// The whole layout stays hidden behind a skeleton until the store info AND the
// wishlist items have hydrated, so the page never appears half-rendered.
// =============================================================================
export default function Favorites() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const wishlistStore = useWishlistStore();

  // Hydrate the wishlist store on mount with this storefront's slug.
  useEffect(() => { wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  const items = wishlistStore.items;

  // Lazy-load the store object so the header colors/font/logo match the
  // storefront. Cached aggressively so it appears instantly on repeat visits.
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

  // ----- UI state ------------------------------------------------------------
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  // Derived: visible items respect the local search filter.
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(p =>
      (p.name_en || p.name || '').toLowerCase().includes(q) ||
      (p.name_fr || '').toLowerCase().includes(q) ||
      (p.name_ar || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  // ----- Helpers -------------------------------------------------------------
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
    if (product.variants && product.variants.length > 0) {
      setQuickAddProduct(product);
    } else {
      addItem(product, 1, null);
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
  // Skeleton loader — page stays hidden until everything is ready.
  // --------------------------------------------------------------------------
  if (!storeReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse"/>
        <div className="max-w-6xl mx-auto px-4 -mt-12 relative">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse mb-4"/>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({length:8}).map((_,i)=>(
                <div key={i} className="bg-gray-100 rounded-2xl animate-pulse aspect-[3/4]"/>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4"/>
          <p className="text-gray-500">Store not found</p>
        </div>
      </div>
    );
  }

  // ----- Theming pulled from the store's page builder template ---------------
  const tplSec = Array.isArray(store.page_builder) ? store.page_builder.find(s => s.visible !== false) : null;
  const tplStyle = tplSec?.style || {};
  const headerBg = tplStyle.bg || store.primary_color || '#7C3AED';
  const headerText = tplStyle.textColor || '#ffffff';
  const headerFont = store.header_font || tplStyle.fontFamily || 'Inter';
  const accent = store.primary_color || '#7C3AED';
  const currency = store.currency || 'DZD';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50" style={{fontFamily: headerFont}}>
      {/* ============ HEADER (mirrors storefront branding) ============ */}
      <header className="sticky top-0 z-30 shadow-lg" style={{backgroundColor: headerBg, color: headerText}}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-3 min-w-0" style={{color: headerText}}>
            <button className="p-2 rounded-full hover:bg-white/15 transition-colors shrink-0"><ArrowLeft size={20}/></button>
            {store.logo
              ? <img src={store.logo} className="w-10 h-10 rounded-xl object-cover bg-white/20 shrink-0" alt=""/>
              : <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 font-bold shrink-0">{store.name?.[0]}</div>}
            <span className="text-lg sm:text-xl font-extrabold truncate" style={{fontFamily: headerFont}}>{store.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Heart size={18} fill="currentColor" className="text-red-300"/>
            <span className="text-sm font-bold hidden sm:inline">{t('store.favorites', 'Favorites')}</span>
          </div>
        </div>
      </header>

      {/* ============ HERO BANNER ============ */}
      <motion.section
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
        className="relative overflow-hidden"
        style={{background: `linear-gradient(135deg, ${accent}15, ${accent}05 60%, transparent)`}}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{backgroundColor: accent}}/>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{backgroundColor: accent}}/>
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{backgroundColor: accent}}>
              <Heart size={22} className="text-white" fill="white"/>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900" style={{fontFamily: headerFont}}>
                {t('store.yourFavorites', 'Your Favorites')}
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500"/>
                {items.length === 0
                  ? t('store.noFavoritesYet', 'Start saving the products you love')
                  : t('store.savedProductsCount', `${items.length} saved product${items.length > 1 ? 's' : ''}`)}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto px-4 pb-20 -mt-2">
        {/* ============ SEARCH + ACTIONS ============ */}
        {items.length > 0 && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, delay: 0.1}}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
          >
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-100">
              <Search size={16} className="ml-4 text-gray-400"/>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('store.searchFavorites', 'Search your favorites...')}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
              />
              {search && <button onClick={() => setSearch('')} className="px-3 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CheckSquare size={14}/>
                {selected.length === filtered.length && filtered.length > 0
                  ? t('store.deselectAll', 'DESELECT')
                  : t('store.selectAll', 'SELECT ALL')}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14}/>
                {t('store.clearAll', 'CLEAR ALL')}
              </button>
            </div>
          </motion.div>
        )}

        {/* ============ EMPTY STATE ============ */}
        {items.length === 0 ? (
          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
            className="bg-white rounded-3xl shadow-md border border-gray-100 py-20 px-6 text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{backgroundColor: `${accent}15`}}>
                <Heart size={40} style={{color: accent}}/>
              </div>
              <motion.div
                animate={{scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7]}}
                transition={{duration: 2, repeat: Infinity}}
                className="absolute inset-0 rounded-full"
                style={{boxShadow: `0 0 0 8px ${accent}10`}}
              />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{t('store.emptyFavoritesTitle', 'Nothing here yet')}</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {t('store.emptyFavoritesDesc', 'Tap the heart icon on any product to save it for later. Your wishlist follows you across devices.')}
            </p>
            <Link
              to={`/s/${storeSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform"
              style={{backgroundColor: accent}}
            >
              <ShoppingBag size={16}/>
              {t('store.startShopping', 'Start Shopping')}
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 py-16 text-center">
            <Search size={32} className="mx-auto text-gray-300 mb-3"/>
            <p className="text-gray-500 font-medium">{t('store.noMatchInFavorites', 'No favorites match your search')}</p>
          </div>
        ) : (
          /* ============ PRODUCT GRID ============ */
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
                    className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow border-2 ${isSelected ? '' : 'border-transparent'}`}
                    style={isSelected ? {borderColor: accent} : {}}
                  >
                    {/* Selection checkbox */}
                    <button
                      onClick={() => toggleSelect(product.id)}
                      className="absolute top-3 left-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-all"
                      style={isSelected
                        ? {backgroundColor: accent, color: '#fff'}
                        : {backgroundColor: 'rgba(255,255,255,0.85)', color: '#9ca3af'}}
                    >
                      {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                    </button>

                    {/* Remove pill */}
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center bg-white/85 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Remove from favorites"
                    >
                      <X size={14}/>
                    </button>

                    {/* Image */}
                    <Link to={`/s/${storeSlug}/product/${product.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {thumb
                          ? <img src={thumb} alt={getName(product)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                          : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-300"/></div>}
                        {product.compare_at_price && (
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-md">SALE</span>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-3 sm:p-4">
                      <Link to={`/s/${storeSlug}/product/${product.slug}`}>
                        <h3 className="font-bold text-sm text-gray-900 truncate hover:text-brand-600 transition-colors">{getName(product)}</h3>
                      </Link>
                      {/* Variant label if saved from product detail */}
                      {product._variantLabel && (
                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                          {product._selectedVariant?.type === 'color' && product._selectedVariant?.value && (
                            <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0 inline-block" style={{backgroundColor: product._selectedVariant.value}}/>
                          )}
                          {product._variantLabel}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-base sm:text-lg font-black" style={{color: accent}}>
                          {parseFloat(product.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">{currency}</span>
                        {product.compare_at_price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {parseFloat(product.compare_at_price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Action row */}
                      <div className="flex gap-1.5 mt-3">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-black text-white shadow-md hover:shadow-lg transition-all"
                          style={{backgroundColor: accent}}
                        >
                          <ShoppingCart size={12}/> ADD
                        </button>
                        <Link
                          to={`/s/${storeSlug}/product/${product.slug}`}
                          className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
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
            <Link to={`/s/${storeSlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={14}/>
              {t('store.continueShopping', 'Continue Shopping')}
            </Link>
          </div>
        )}
      </div>

      {/* ============ STICKY BULK ACTION BAR ============ */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{y: 80, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 80, opacity: 0}}
            transition={{type: 'spring', stiffness: 260, damping: 22}}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{backgroundColor: accent}}>
                {selected.length}
              </div>
              <span className="text-sm font-medium text-gray-200 flex-1 min-w-0 truncate">
                {t('store.itemsSelected', `${selected.length} selected`)}
              </span>
              <button
                onClick={handleBulkAddToCart}
                className="px-3 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-md"
                style={{backgroundColor: accent}}
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
        primaryColor={accent}
        onAddToCart={({product:p,selectedVariant,quantity})=>{addItem(p,quantity,selectedVariant);toast.success(t('store.addedToCart','Added to cart'));setQuickAddProduct(null);}}
      />
    </div>
  );
}
