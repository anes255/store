import React, { useState, useMemo } from 'react';
import { X, Minus, Plus, ShoppingCart, Package, Check, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// PRODUCT QUICK-ADD POPUP
// -----------------------------------------------------------------------------
// A modal overlay that lets buyers pick variants (color swatches, size pills,
// etc.) and quantity before adding to cart — without leaving the product grid.
//
// Props:
//   show          – boolean, controls visibility
//   onClose       – callback to close the popup
//   product       – full product object (must include .variants, .images, etc.)
//   storeSlug     – current store slug (unused for now, reserved for future)
//   primaryColor  – hex color string for the store's brand accent
//   currency      – currency code (e.g. 'DZD')
//   onAddToCart   – ({ product, selectedVariant, quantity }) => void
// =============================================================================
export default function ProductQuickAdd({ show, onClose, product, storeSlug, primaryColor, currency = 'DZD', onAddToCart, mode = 'cart' }) {
  const pc = primaryColor || '#7C3AED';

  // ---- local state ----
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Reset state every time a new product is shown
  const [prevId, setPrevId] = useState(null);
  if (product && product.id !== prevId) {
    setPrevId(product.id);
    setSelectedVariants({});
    setQuantity(1);
  }

  // ---- Parse variants safely ----
  const variants = useMemo(() => {
    if (!product) return [];
    let v = product.variants || [];
    if (typeof v === 'string') try { v = JSON.parse(v); } catch { v = []; }
    if (!Array.isArray(v)) v = [];
    return v;
  }, [product]);

  // Group variants by type (color, size, material, style, custom, etc.)
  const variantGroups = useMemo(() => {
    const groups = {};
    variants.forEach((v, i) => {
      const t = (v.type || 'option').toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push({ ...v, _idx: i });
    });
    return groups;
  }, [variants]);
  const groupTypes = Object.keys(variantGroups);

  // ---- Derived values ----
  const selectedIdxes = Object.values(selectedVariants).filter(v => v !== null && v !== undefined);
  const primarySelected = selectedIdxes.length > 0 ? variants[selectedIdxes[0]] : null;

  const basePrice = parseFloat(product?.price) || 0;
  const priceAdj = selectedIdxes.reduce((sum, idx) => sum + (parseFloat(variants[idx]?.price_adjustment) || 0), 0);
  const finalPrice = basePrice + priceAdj;

  const variantLabel = selectedIdxes.map(idx => {
    const v = variants[idx];
    const t = (v?.type || '').toLowerCase();
    // Never show raw hex/color codes in the label — always prefer name
    if (t === 'color') return v?.name || 'Color';
    return v?.name || v?.value || '';
  }).filter(Boolean).join(' / ');

  // Build the variant object matching ProductDetail's format
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
    setSelectedVariants(prev => ({
      ...prev,
      [type]: prev[type] === idx ? null : idx,
    }));
  };

  // ---- Image logic ----
  const displayImage = (() => {
    // If a color/image-bearing variant is selected, show its first image
    if (primarySelected?.images?.length > 0) return primarySelected.images[0];
    if (product?.thumbnail) return product.thumbnail;
    let imgs = product?.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    return null;
  })();

  // Detect CSS color values (mirrors ProductDetail logic)
  const isColor = (val) => {
    if (!val) return false;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) return true;
    if (/^(rgb|hsl)a?\(/.test(val)) return true;
    const names = ['red','blue','green','black','white','yellow','orange','purple','pink','brown','gray','grey','navy','teal','cyan','magenta','beige','cream','gold','silver','maroon','olive','coral','salmon','turquoise','indigo','violet','lime','aqua','tan','khaki'];
    return names.includes(val.toLowerCase());
  };

  const handleAdd = () => {
    // Require a selection from every variant group before allowing add/order
    const missing = groupTypes.filter(t => selectedVariants[t] == null);
    if (missing.length) {
      toast.error('Please choose: ' + missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', '));
      return;
    }
    if (!quantity || quantity < 1) { toast.error('Please pick a quantity'); return; }
    onAddToCart({
      product: { ...product, price: finalPrice },
      selectedVariant: buildVariantObj(),
      quantity,
    });
    onClose();
  };

  // ---- Render ----
  if (!show || !product) return null;

  const getName = (p) => p.name_en || p.name_fr || p.name_ar || p.name || 'Untitled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* ---- LEFT: Product Image ---- */}
          <div className="md:w-5/12 shrink-0">
            <div className="aspect-square bg-gray-100 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
              {displayImage
                ? <img src={displayImage} className="w-full h-full object-cover" alt={getName(product)} />
                : <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-gray-300" /></div>}
            </div>
          </div>

          {/* ---- RIGHT: Options ---- */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col">
            {/* Name */}
            <h2 className="text-xl font-extrabold text-gray-900 pr-8">{getName(product)}</h2>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-extrabold" style={{ color: pc }}>{finalPrice.toLocaleString()} {currency}</span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > finalPrice && (
                <span className="text-sm text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>
              )}
              {priceAdj !== 0 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold">
                  {priceAdj > 0 ? '+' : ''}{priceAdj.toLocaleString()} {currency}
                </span>
              )}
            </div>

            {/* Selected variant label */}
            {variantLabel && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Selected:</span>
                <span className="text-xs font-bold text-gray-800 px-2 py-0.5 bg-gray-100 rounded-lg">{variantLabel}</span>
              </div>
            )}

            {/* ---- VARIANT SELECTORS ---- */}
            {groupTypes.length > 0 && (
              <div className="mt-4 space-y-4 flex-1">
                {groupTypes.map(type => {
                  const group = variantGroups[type];
                  const typeLabel = type === 'color' ? 'Color' : type === 'size' ? 'Size' : type === 'material' ? 'Material' : type === 'style' ? 'Style' : type.charAt(0).toUpperCase() + type.slice(1);
                  const selectedInGroup = selectedVariants[type];
                  const selName = selectedInGroup != null ? variants[selectedInGroup]?.name : null;

                  return (
                    <div key={type}>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        {typeLabel}
                        {selName && <span className="text-gray-800 normal-case font-semibold text-sm">-- {selName}</span>}
                      </p>

                      {/* COLOR TYPE -- render swatches */}
                      {type === 'color' ? (
                        <div className="flex flex-wrap gap-2.5">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            const colorVal = v.value || '#ccc';
                            const useColor = isColor(colorVal);
                            return (
                              <button
                                key={v._idx}
                                onClick={() => selectVariant(type, v._idx)}
                                className="relative flex flex-col items-center gap-1 transition-all"
                                title={v.name}
                              >
                                <div
                                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${isSel ? 'border-gray-900 scale-110 shadow-lg ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-400 hover:scale-105'}`}
                                  style={useColor ? { backgroundColor: colorVal } : {}}
                                >
                                  {!useColor && <span className="text-[9px] font-bold text-gray-500 text-center leading-tight px-0.5">{(v.name || '?').slice(0, 3)}</span>}
                                  {isSel && <Check size={14} className="text-white drop-shadow-md" />}
                                </div>
                                <span className={`text-[10px] font-medium ${isSel ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{v.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* NON-COLOR TYPES -- render pill buttons */
                        <div className="flex flex-wrap gap-2">
                          {group.map(v => {
                            const isSel = selectedInGroup === v._idx;
                            return (
                              <button
                                key={v._idx}
                                onClick={() => selectVariant(type, v._idx)}
                                className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
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

            {/* ---- QUANTITY + ADD TO CART ---- */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-gray-200 rounded-l-xl transition-colors"><Minus size={15} /></button>
                <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-gray-200 rounded-r-xl transition-colors"><Plus size={15} /></button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg transition-all text-sm"
                style={{ backgroundColor: mode === 'favorite' ? '#ef4444' : pc }}
              >
                {mode === 'favorite'
                  ? (<><Heart size={16} fill="white" /> Add to Favorites</>)
                  : (<><ShoppingCart size={16} /> Add to Cart</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
