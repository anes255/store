import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Check, Zap, ChevronRight, Tag, Truck, Shield, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DirectCheckoutModal({ product, store, pc, currency, getName, getThumb, onClose, onProceedToCheckout }) {
  const { t } = useTranslation();
  if (!product) return null;

  const pColor = pc || '#7C3AED';

  // ── Parse variants ──
  let rawVariants = product.variants || [];
  if (typeof rawVariants === 'string') try { rawVariants = JSON.parse(rawVariants); } catch { rawVariants = []; }
  if (!Array.isArray(rawVariants)) rawVariants = [];
  const variants = rawVariants;

  const variantGroups = {};
  variants.forEach((v, i) => {
    const tp = (v.type || 'option').toLowerCase();
    if (!variantGroups[tp]) variantGroups[tp] = [];
    variantGroups[tp].push({ ...v, _idx: i });
  });
  const groupTypes = Object.keys(variantGroups);
  const hasVariants = groupTypes.length > 0;

  // ── Parse quantity offers ──
  let rawOffers = product.quantity_offers || [];
  if (typeof rawOffers === 'string') try { rawOffers = JSON.parse(rawOffers); } catch { rawOffers = []; }
  if (!Array.isArray(rawOffers)) rawOffers = [];
  const qtyOffers = rawOffers
    .filter(q => parseInt(q.quantity) > 0)
    .sort((a, b) => parseInt(a.quantity) - parseInt(b.quantity));

  const hasOffers = qtyOffers.length > 0;

  // Build offer list: always "Buy 1" + each quantity offer
  const offerOptions = useMemo(() => {
    const opts = [{ quantity: 1, label: null, discount_type: null, discount_value: 0, isDefault: true }];
    qtyOffers.forEach(qo => opts.push({ ...qo, quantity: parseInt(qo.quantity) }));
    return opts;
  }, [product.id]);

  // ── State ──
  const [selectedOfferIdx, setSelectedOfferIdx] = useState(() => hasOffers ? 1 : 0);
  const selectedOffer = offerOptions[selectedOfferIdx] || offerOptions[0];
  const unitCount = selectedOffer.quantity;

  // Per-unit variant selections: [{[type]: variantIdx}, ...]
  const [unitVariants, setUnitVariants] = useState([]);

  useEffect(() => {
    setUnitVariants(prev => {
      const arr = [];
      for (let i = 0; i < unitCount; i++) arr.push(prev[i] || {});
      return arr;
    });
  }, [unitCount]);

  // Reset when product changes
  const [prevId, setPrevId] = useState(null);
  if (product && product.id !== prevId) {
    setPrevId(product.id);
    setSelectedOfferIdx(hasOffers ? 1 : 0);
    setUnitVariants([]);
  }

  // ── Pricing ──
  const rawBasePrice = parseFloat(product.price) || 0;
  const salePct = product.is_on_sale && product.offer_discount
    ? (parseFloat(String(product.offer_discount).replace(/[^0-9.]/g, '')) || 0) : 0;
  const basePrice = salePct > 0 ? Math.round(rawBasePrice * (1 - salePct / 100)) : rawBasePrice;

  const getOfferUnitPrice = (offer) => {
    if (offer.isDefault) return basePrice;
    const dv = parseFloat(offer.discount_value) || 0;
    if (dv > 0) {
      if (offer.discount_type === 'fixed') return Math.max(0, basePrice - dv);
      return Math.round(basePrice * (1 - dv / 100));
    }
    if (offer.label) {
      const m = String(offer.label).match(/(\d+(?:\.\d+)?)\s*%/);
      if (m) return Math.round(basePrice * (1 - parseFloat(m[1]) / 100));
    }
    return basePrice;
  };

  const getOfferDiscount = (offer) => {
    if (offer.isDefault) return 0;
    const dv = parseFloat(offer.discount_value) || 0;
    if (dv > 0) {
      if (offer.discount_type === 'fixed') return 0;
      return dv;
    }
    if (offer.label) {
      const m = String(offer.label).match(/(\d+(?:\.\d+)?)\s*%/);
      if (m) return parseFloat(m[1]);
    }
    return 0;
  };

  const unitPrice = getOfferUnitPrice(selectedOffer);
  const totalPrice = unitPrice * unitCount;
  const savings = (basePrice * unitCount) - totalPrice;

  // ── Variant helpers ──
  const selectUnitVariant = (unitIdx, type, variantIdx) => {
    setUnitVariants(prev => {
      const arr = [...prev];
      const current = { ...(arr[unitIdx] || {}) };
      current[type] = current[type] === variantIdx ? null : variantIdx;
      arr[unitIdx] = current;
      return arr;
    });
  };

  const isColor = (val) => {
    if (!val) return false;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) return true;
    if (/^(rgb|hsl)a?\(/.test(val)) return true;
    const names = ['red','blue','green','black','white','yellow','orange','purple','pink','brown','gray','grey','navy','teal','cyan','magenta','beige','cream','gold','silver','maroon','olive','coral','salmon','turquoise','indigo','violet','lime','aqua','tan','khaki'];
    return names.includes(val.toLowerCase());
  };

  const getVariantLabel = (uv) => {
    const idxes = Object.values(uv || {}).filter(v => v != null);
    return idxes.map(idx => {
      const v = variants[idx];
      if (!v) return '';
      return (v.type || '').toLowerCase() === 'color' ? (v.name || 'Color') : (v.name || v.value || '');
    }).filter(Boolean).join(' / ');
  };

  // ── Continue to checkout ──
  const handleContinue = () => {
    if (hasVariants) {
      for (let i = 0; i < unitCount; i++) {
        const uv = unitVariants[i] || {};
        const missing = groupTypes.filter(tp => uv[tp] == null);
        if (missing.length) {
          toast.error(`${t('store.unit','Unit')} ${i + 1}: ${t('store.pleaseChoose','Please choose')} ${missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}`);
          return;
        }
      }
    }

    // Build per-unit variant breakdown for the order
    const perUnit = unitVariants.map((uv, i) => {
      const idxes = Object.values(uv || {}).filter(v => v != null);
      return idxes.map(idx => {
        const v = variants[idx];
        return { name: v.name, type: v.type, value: v.value };
      });
    });

    // Build a combined label
    const countMap = {};
    perUnit.forEach(parts => {
      const key = parts.map(p => (p.type === 'color' ? p.name : (p.name || p.value || ''))).filter(Boolean).join('/');
      countMap[key] = (countMap[key] || 0) + 1;
    });
    const label = Object.entries(countMap).map(([k, c]) => c > 1 ? `${c}x ${k}` : k).join(', ');

    const variantObj = hasVariants ? {
      label: label || undefined,
      per_unit: perUnit.map((parts, i) => {
        if (parts.length === 1) return parts[0];
        return { selections: parts, label: parts.map(p => p.name || p.value).filter(Boolean).join(' / ') };
      }),
    } : null;

    const items = [{
      product_id: product.id,
      name: getName(product),
      price: basePrice,
      image: getThumb(product),
      quantity: unitCount,
      variant: variantObj,
      quantity_offers: product.quantity_offers,
      offer_qty: unitCount,
    }];

    onProceedToCheckout(items);
  };

  // ── Images ──
  const productImage = (() => {
    if (product.thumbnail) return product.thumbnail;
    let imgs = product.images;
    if (typeof imgs === 'string') try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    if (Array.isArray(imgs) && imgs.length) return imgs[0];
    return null;
  })();

  // ── Render ──
  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl max-h-[95vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100">
          <div className="p-4 flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
              {productImage
                ? <img src={productImage} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-300" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-gray-900 text-base truncate">{getName(product)}</h2>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-extrabold" style={{ color: pColor }}>{basePrice.toLocaleString()} {currency}</span>
                {salePct > 0 && <span className="text-xs text-gray-400 line-through">{rawBasePrice.toLocaleString()}</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* ── Offer Selection ── */}
          {hasOffers && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Gift size={13} />
                {t('store.selectOffer', 'Select Your Offer')}
              </p>
              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(offerOptions.length, 3)}, 1fr)` }}>
                {offerOptions.map((offer, idx) => {
                  const isSel = idx === selectedOfferIdx;
                  const oPrice = getOfferUnitPrice(offer);
                  const disc = getOfferDiscount(offer);
                  const isPopular = offer.highlight || idx === Math.min(2, offerOptions.length - 1);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOfferIdx(idx)}
                      className={`relative rounded-2xl p-3 text-center transition-all border-2 ${
                        isSel
                          ? 'shadow-lg scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      style={isSel ? { borderColor: pColor, backgroundColor: pColor + '08' } : {}}
                    >
                      {isPopular && !offer.isDefault && (
                        <span
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: pColor }}
                        >
                          {t('store.popular', 'Popular')}
                        </span>
                      )}
                      <div className="text-2xl font-black text-gray-900">{offer.quantity}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                        {offer.quantity === 1 ? t('store.unit', 'Unit') : t('store.units', 'Units')}
                      </div>
                      {disc > 0 && (
                        <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#ef4444' }}>
                          -{disc}%
                        </div>
                      )}
                      <div className="mt-1.5 text-sm font-extrabold" style={{ color: pColor }}>
                        {(oPrice * offer.quantity).toLocaleString()} {currency}
                      </div>
                      {disc > 0 && (
                        <div className="text-[10px] text-gray-400 line-through">
                          {(basePrice * offer.quantity).toLocaleString()}
                        </div>
                      )}
                      {offer.free_shipping && (
                        <div className="mt-1 flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <Truck size={10} /> {t('store.freeShipping', 'Free shipping')}
                        </div>
                      )}
                      {isSel && (
                        <div
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow"
                          style={{ backgroundColor: pColor }}
                        >
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Per-Unit Variant Customization ── */}
          {hasVariants && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {unitCount > 1
                  ? t('store.customizeEachUnit', 'Customize Each Unit')
                  : t('store.chooseOptions', 'Choose Your Options')}
              </p>
              <div className="space-y-3">
                {Array.from({ length: unitCount }, (_, unitIdx) => {
                  const uv = unitVariants[unitIdx] || {};
                  const unitLabel = getVariantLabel(uv);
                  return (
                    <div
                      key={unitIdx}
                      className="rounded-2xl border border-gray-200 bg-gray-50/50 p-3.5 transition-all"
                    >
                      {/* Unit header */}
                      {unitCount > 1 && (
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                              style={{ backgroundColor: pColor }}
                            >
                              {unitIdx + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              {t('store.unit', 'Unit')} {unitIdx + 1}
                            </span>
                          </div>
                          {unitLabel && (
                            <span className="text-[11px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                              {unitLabel}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Variant selectors */}
                      <div className={unitCount > 1 ? 'space-y-3' : 'space-y-4'}>
                        {groupTypes.map(type => {
                          const group = variantGroups[type];
                          const typeLabel = type === 'color'
                            ? t('store.variantColor', 'Color')
                            : type === 'size'
                            ? t('store.variantSize', 'Size')
                            : type === 'material'
                            ? t('store.variantMaterial', 'Material')
                            : type === 'style'
                            ? t('store.variantStyle', 'Style')
                            : type.charAt(0).toUpperCase() + type.slice(1);
                          const selectedInUnit = uv[type];

                          return (
                            <div key={type}>
                              {(unitCount === 1 || groupTypes.length > 1) && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                  {typeLabel}
                                </p>
                              )}

                              {type === 'color' ? (
                                <div className="flex flex-wrap gap-2">
                                  {group.map(v => {
                                    const isSel = selectedInUnit === v._idx;
                                    const colorVal = v.value || '#ccc';
                                    const useColor = isColor(colorVal);
                                    const hasImg = v.images && v.images.length > 0;
                                    return (
                                      <button
                                        key={v._idx}
                                        onClick={() => selectUnitVariant(unitIdx, type, v._idx)}
                                        className="relative flex flex-col items-center gap-0.5 transition-all"
                                        title={v.name}
                                      >
                                        <div
                                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${
                                            isSel
                                              ? 'border-gray-900 scale-110 shadow-lg ring-2 ring-gray-900/20'
                                              : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                                          }`}
                                          style={useColor && !hasImg ? { backgroundColor: colorVal } : {}}
                                        >
                                          {hasImg ? (
                                            <img src={v.images[0]} className="w-full h-full object-cover" alt={v.name} />
                                          ) : !useColor ? (
                                            <span className="text-[8px] font-bold text-gray-500">{(v.name || '?').slice(0, 3)}</span>
                                          ) : null}
                                          {isSel && <Check size={12} className="absolute text-white drop-shadow-md" />}
                                        </div>
                                        <span className={`text-[9px] font-medium ${isSel ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                                          {v.name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {group.map(v => {
                                    const isSel = selectedInUnit === v._idx;
                                    return (
                                      <button
                                        key={v._idx}
                                        onClick={() => selectUnitVariant(unitIdx, type, v._idx)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                          isSel
                                            ? 'text-white shadow-md'
                                            : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                                        }`}
                                        style={isSel ? { backgroundColor: pColor, borderColor: pColor } : {}}
                                      >
                                        {v.name || v.value || 'Option'}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Price Summary ── */}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{unitCount}x {getName(product)}</span>
              <span>{unitPrice.toLocaleString()} {currency} {t('store.each', 'each')}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold mt-1">
                <span>{t('store.youSave', 'You save')}</span>
                <span>-{savings.toLocaleString()} {currency}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-gray-900 mt-2 pt-2 border-t border-gray-200">
              <span>{t('store.total', 'Total')}</span>
              <span style={{ color: pColor }}>{totalPrice.toLocaleString()} {currency}</span>
            </div>
          </div>

          {/* ── Continue Button ── */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all text-sm"
            style={{ backgroundColor: pColor }}
          >
            <Zap size={16} />
            {t('store.continueToCheckout', 'Continue to Checkout')}
            <ChevronRight size={16} />
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, label: t('store.fastDelivery', 'Fast Delivery') },
              { icon: Shield, label: t('store.secure', 'Secure') },
              { icon: Package, label: t('store.returns', 'Returns') },
            ].map((f, i) => {
              const I = f.icon;
              return (
                <div key={i} className="p-2 bg-gray-50 rounded-xl text-center border border-gray-100">
                  <I size={14} className="mx-auto text-gray-400 mb-0.5" />
                  <p className="text-[9px] font-bold text-gray-400">{f.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
