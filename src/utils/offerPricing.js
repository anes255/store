// What an offer does to a price, worked out in the browser.
//
// This mirrors services/pricing.js on the server, and exists only so the shop
// can show a price before anything is sent anywhere: the ladder under a
// product, the badge on a card, the running total in the cart. The figure
// that is actually charged always comes back from the server's own quote, so
// if these two ever disagree the server wins and the buyer is never charged
// more than the page promised.
//
// Money is handled in integer minor units here too, for the same reason.

export const toUnits = (v) => Math.round((Number(v) || 0) * 100);
export const fromUnits = (u) => Math.round(u) / 100;
const pctOf = (units, percent) => Math.max(0, Math.round((units * (Number(percent) || 0)) / 100));

export const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};
const ids = (v) => new Set(asArray(v).map(String));
const lower = (v) => String(v == null ? '' : v).trim().toLowerCase();

function variantWords(variant) {
  let v = variant;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return [lower(variant)].filter(Boolean); } }
  const out = [];
  const walk = (x) => {
    if (x == null) return;
    if (typeof x !== 'object') { out.push(lower(x)); return; }
    if (Array.isArray(x)) { x.forEach(walk); return; }
    ['label', 'name', 'value', 'option', 'sku'].forEach((k) => { if (x[k] != null) out.push(lower(x[k])); });
    if (Array.isArray(x.selections)) x.selections.forEach(walk);
    if (Array.isArray(x.per_unit)) x.per_unit.forEach(walk);
  };
  walk(v);
  return out.filter(Boolean);
}

/** Does this offer cover this product (and variant, when it names variants)? */
export function offerCovers(offer, product, variant) {
  if (!offer || !product) return false;
  const scope = offer.scope || 'all';
  if (scope === 'all') return true;
  if (scope === 'products') return ids(offer.product_ids).has(String(product.id));
  if (scope === 'categories') return !!product.category_id && ids(offer.category_ids).has(String(product.category_id));
  if (scope === 'variants') {
    const keys = asArray(offer.variant_keys).map(lower);
    return variantWords(variant).some((w) => keys.includes(w));
  }
  return false;
}

/** The discount one offer gives on `qty` of something costing `unit`. */
export function offerDiscountUnits(offer, unitUnits, qty) {
  const minQ = parseInt(offer.min_quantity, 10) || 0;
  if (minQ && qty < minQ) return 0;
  const maxQ = parseInt(offer.max_quantity, 10) || 0;
  const n = maxQ ? Math.min(qty, maxQ) : qty;
  let discount = 0;

  switch (offer.offer_type) {
    case 'percentage':
      discount = pctOf(unitUnits * n, offer.discount_percent);
      break;
    case 'fixed':
      discount = Math.min(unitUnits, toUnits(offer.discount_amount)) * n;
      break;
    case 'bxgy': {
      const buy = parseInt(offer.buy_quantity, 10) || 0;
      const get = parseInt(offer.get_quantity, 10) || 0;
      if (buy > 0 && get > 0) {
        const sets = Math.floor(n / (buy + get));
        const pct = offer.get_discount_percent == null ? 100 : Number(offer.get_discount_percent);
        discount = pctOf(unitUnits * sets * get, pct);
      }
      break;
    }
    case 'tiered': {
      const tiers = normalizeTiers(offer.tiers);
      let left = n;
      let charged = 0;
      for (const tier of tiers) {
        while (left >= tier.quantity) {
          if (tier.total_price != null) charged += tier.total_price;
          else if (tier.discount_type === 'fixed') charged += Math.max(0, unitUnits * tier.quantity - toUnits(tier.discount_value));
          else charged += unitUnits * tier.quantity - pctOf(unitUnits * tier.quantity, tier.discount_value);
          left -= tier.quantity;
        }
      }
      charged += unitUnits * left;
      discount = Math.max(0, unitUnits * n - charged);
      break;
    }
    default:
      break;
  }

  if (offer.offer_price != null && offer.offer_price !== '') {
    const target = toUnits(offer.offer_price);
    if (target < unitUnits) discount = Math.max(discount, (unitUnits - target) * n);
  }
  const cap = toUnits(offer.max_discount);
  if (cap > 0) discount = Math.min(discount, cap);
  return Math.min(discount, unitUnits * qty);
}

/** Tiers, largest first, in the shape the maths above expects. */
export function normalizeTiers(raw) {
  return asArray(raw)
    .map((t) => ({
      quantity: parseInt(t.quantity, 10) || 0,
      total_price: t.total_price != null && t.total_price !== '' ? toUnits(t.total_price) : null,
      discount_type: t.discount_type === 'fixed' ? 'fixed' : 'percent',
      discount_value: Number(t.discount_value) || (() => {
        const m = String(t.label || '').match(/(\d+(?:\.\d+)?)\s*%/);
        return m ? Number(m[1]) : 0;
      })(),
      label: t.label || null,
    }))
    .filter((t) => t.quantity > 0 && (t.total_price != null || t.discount_value > 0))
    .sort((a, b) => b.quantity - a.quantity);
}

/** The quantity tiers on a product: its own, plus any tiered offer covering it. */
export function tieredOffersFor(product, offers, variant) {
  const out = [];
  const own = normalizeTiers(product?.quantity_offers);
  if (own.length) out.push({ id: null, name: null, offer_type: 'tiered', tiers: product.quantity_offers, priority: 0 });
  (offers || []).forEach((o) => {
    if (o.offer_type !== 'tiered') return;
    if (o.show_on_product === false) return;
    if (!offerCovers(o, product, variant)) return;
    out.push(o);
  });
  return out;
}

/**
 * The best offer for a line, and what it saves — the same "one offer wins,
 * highest priority then biggest saving" rule the server applies, so the two
 * pick the same one.
 */
export function bestOfferFor({ product, offers, unitUnits, quantity, variant, subtotalUnits = null }) {
  let best = null;
  const candidates = [];
  if (normalizeTiers(product?.quantity_offers).length) {
    candidates.push({ id: null, name: null, offer_type: 'tiered', tiers: product.quantity_offers, priority: 0, _legacy: true });
  }
  (offers || []).forEach((o) => {
    if (subtotalUnits != null && toUnits(o.min_order_amount) > subtotalUnits) return;
    if (!offerCovers(o, product, variant)) return;
    candidates.push(o);
  });
  for (const o of candidates) {
    const discount = offerDiscountUnits(o, unitUnits, quantity);
    if (discount <= 0) continue;
    const better = !best
      || (Number(o.priority) || 0) > (Number(best.offer.priority) || 0)
      || ((Number(o.priority) || 0) === (Number(best.offer.priority) || 0) && discount > best.discount);
    if (better) best = { offer: o, discount };
  }
  return best;
}

/**
 * The savings ladder shown under a product: one row per tier, with what that
 * many costs in total and what it saves against the normal price.
 */
export function savingsLadder({ product, offers, unitUnits, variant }) {
  const tiered = tieredOffersFor(product, offers, variant);
  if (!tiered.length) return [];
  const quantities = new Set([1]);
  tiered.forEach((o) => normalizeTiers(o.tiers).forEach((t) => quantities.add(t.quantity)));
  return [...quantities].sort((a, b) => a - b).map((qty) => {
    const best = bestOfferFor({ product, offers: tiered, unitUnits, quantity: qty, variant });
    const full = unitUnits * qty;
    const price = full - (best ? best.discount : 0);
    return {
      quantity: qty,
      total_units: price,
      total: fromUnits(price),
      unit: fromUnits(Math.round(price / qty)),
      save_units: full - price,
      save: fromUnits(full - price),
      best: false,
    };
  }).map((row, _, all) => ({
    ...row,
    // the tier that saves the most per item is the one worth highlighting
    best: row.save_units > 0 && row.save_units / row.quantity === Math.max(...all.map((r) => r.save_units / r.quantity)),
  }));
}

/** A short badge for a product card: "SAVE 20%", "BUY 2 SAVE 400", … */
export function offerBadge(product, offers, t, formatMoney) {
  const tr = t || ((k, d) => d);
  const fm = formatMoney || ((v) => String(v));
  const unitUnits = toUnits(product?.price);
  const covering = (offers || []).filter((o) => o.show_on_storefront !== false && offerCovers(o, product));
  const own = normalizeTiers(product?.quantity_offers);

  const explicit = covering.find((o) => o.badge_text);
  if (explicit) return explicit.badge_text;

  const pct = covering.find((o) => o.offer_type === 'percentage' && Number(o.discount_percent) > 0);
  if (pct) return tr('store.badgeSavePct', 'SAVE {{n}}%', { n: Math.round(Number(pct.discount_percent)) });

  const fixed = covering.find((o) => o.offer_type === 'fixed' && Number(o.discount_amount) > 0);
  if (fixed) return tr('store.badgeSaveAmount', 'SAVE {{v}}', { v: fm(fixed.discount_amount) });

  const bxgy = covering.find((o) => o.offer_type === 'bxgy' && Number(o.buy_quantity) > 0);
  if (bxgy) return tr('store.badgeBxgy', 'BUY {{b}} GET {{g}}', { b: bxgy.buy_quantity, g: bxgy.get_quantity });

  const ship = covering.find((o) => o.offer_type === 'free_shipping');
  if (ship) return tr('store.badgeFreeShipping', 'FREE SHIPPING');

  const tiered = covering.find((o) => o.offer_type === 'tiered');
  const tiers = tiered ? normalizeTiers(tiered.tiers) : own;
  if (tiers.length && unitUnits > 0) {
    const smallest = tiers[tiers.length - 1];
    const save = offerDiscountUnits({ offer_type: 'tiered', tiers }, unitUnits, smallest.quantity);
    if (save > 0) return tr('store.badgeBuyNSave', 'BUY {{n}} SAVE {{v}}', { n: smallest.quantity, v: fm(fromUnits(save)) });
    return tr('store.badgeBuyMore', 'BUY MORE & SAVE');
  }

  if (product?.is_on_sale) return product.sale_badge_text || tr('store.badgeSale', 'SALE');
  return null;
}
