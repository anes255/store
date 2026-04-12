import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore, useWishlistStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star, Truck, Shield, Package, Check, User, Globe, X, Search, Zap } from 'lucide-react';
import Checkout from './Checkout';

function StoreLangSwitcher() {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLangStore();
  const langs = [{code:'en',label:'EN',flag:'🟢'},{code:'fr',label:'FR',flag:'🇫🇷'},{code:'ar',label:'AR',flag:'🇩🇿'}];
  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
      {langs.map(l=>(
        <button key={l.code} onClick={()=>{i18n.changeLanguage(l.code);setLang(l.code);}} className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${lang===l.code?'bg-brand-500 text-white shadow':'text-gray-500'}`}>
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addItem, getCount } = useCartStore();
  const { lang } = useLangStore();
  const { token:authToken, role:authRole } = useAuthStore();
  const wishlistStore = useWishlistStore();
  useEffect(() => { wishlistStore.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  const isLoggedInCustomer = !!authToken && authRole === 'customer';
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
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
    (async () => {
      try {
        const [sr, pr] = await Promise.all([storeApi.getStore(storeSlug), storeApi.getProduct(storeSlug, productSlug)]);
        setStore(sr.data); setProduct(pr.data);
      } catch {}
      setLoading(false);
    })();
  }, [storeSlug, productSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin"/></div>;
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

  const basePrice = parseFloat(product.price) || 0;
  // Sum all price adjustments from selected variants
  const priceAdj = selectedIdxes.reduce((sum, idx) => sum + (parseFloat(variants[idx]?.price_adjustment) || 0), 0);
  const finalPrice = basePrice + priceAdj;
  const stockCount = sv ? (sv.stock ?? product.stock_quantity) : product.stock_quantity;

  // Build a variant label for display
  const variantLabel = selectedIdxes.map(idx => {
    const v = variants[idx];
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

  const handleAddToCart = () => {
    addItem({ ...product, price: finalPrice }, quantity, buildVariantObj());
    toast.success(variantLabel ? `Added "${variantLabel}" to cart` : 'Added to cart');
  };

  const handleBuyNow = () => {
    // Parse images safely
    let imgs = product.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (!Array.isArray(imgs)) imgs = [];
    const directItem = {
      product_id: product.id,
      name: product.name_en || product.name_fr || product.name_ar || product.name,
      price: finalPrice,
      image: product.thumbnail || imgs[0] || null,
      quantity,
      variant: buildVariantObj(),
    };
    setBuyNowItems([directItem]);
    setBuyNowOpen(true);
  };

  const handleToggleWishlist = () => {
    // Store variant info with the product in the wishlist
    const productWithVariant = {
      ...product,
      price: finalPrice,
      _selectedVariant: buildVariantObj(),
      _variantLabel: variantLabel,
    };
    const added = wishlistStore.toggle(productWithVariant);
    if (added) toast.success(variantLabel ? `"${variantLabel}" added to favorites` : 'Added to favorites');
    else toast.success('Removed from favorites');
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
  const nameFont = store.header_font || tplStyle.fontFamily || 'Inter';
  const headerFont = tplStyle.fontFamily || 'Inter';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="sticky top-0 z-30 shadow-md" style={{backgroundColor:headerBg,color:headerText,fontFamily:headerFont}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink" style={{color:headerText}}>
            {store.logo ? <img src={store.logo} className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl object-cover bg-white/20 shrink-0" alt=""/> : <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-white/20 font-bold text-base sm:text-xl shrink-0" style={{color:headerText}}>{store.name?.[0]}</div>}
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
            <div className="hidden sm:block"><StoreLangSwitcher /></div>
            <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full"><User size={18} className="sm:w-5 sm:h-5"/></Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <Heart size={18} className="sm:w-5 sm:h-5"/>
              {wishlistStore.count()>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlistStore.count()}</span>}
            </Link>
            <button onClick={()=>setCartOpen(true)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full relative">
              <ShoppingCart size={18} className="sm:w-5 sm:h-5"/>
              {getCount()>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{getCount()}</span>}
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* ═══ IMAGES ═══ */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden">
              {allImages[selectedImage]
                ? <img src={allImages[selectedImage]} className="w-full h-full object-cover" alt=""/>
                : <div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-300"/></div>}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img,i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border-2 transition-all ${selectedImage===i ? 'border-brand-500 shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={img} className="w-full h-full object-cover" alt=""/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══ DETAILS ═══ */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{getName(product)}</h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold" style={{color:pc}}>{finalPrice.toLocaleString()} {currency}</span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > finalPrice && (
                <span className="text-lg text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>
              )}
              {priceAdj !== 0 && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold">{priceAdj > 0 ? '+' : ''}{priceAdj.toLocaleString()} {currency}</span>}
            </div>

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
                                {v.name || v.value || 'Option'}
                                {v.price_adjustment && parseFloat(v.price_adjustment) !== 0 && (
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
          </div>
        </div>

        {/* ═══ REVIEWS SECTION ═══ */}
        <ReviewsSection storeSlug={storeSlug} productSlug={productSlug} pc={pc}/>
      </div>
      {cartOpen && <Checkout isModal onClose={()=>setCartOpen(false)} storeSlug={storeSlug}/>}
      {buyNowOpen && <Checkout isModal onClose={()=>setBuyNowOpen(false)} storeSlug={storeSlug} directItems={buyNowItems}/>}
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
      toast.success('Review submitted! It will appear after approval.');
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
