import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Search, Percent, Tag, Layers, Gift, Truck } from 'lucide-react';
import { promotionApi } from '../../../utils/api';
import { topLevel, childrenOf } from '../../../utils/categoryTree';
import { Drawer, Field, Toggle, toLocalInput, fromLocalInput, useMoney } from './shared';

// Create or change one offer. Every rule the engine understands has a box
// here, and the boxes that do not apply to the chosen type stay out of the
// way rather than being shown greyed out.

export const OFFER_TYPES = [
  { key: 'percentage', icon: Percent, label: 'Percentage discount', hint: 'Take a percentage off each item.' },
  { key: 'fixed', icon: Tag, label: 'Fixed amount discount', hint: 'Take a set amount off each item.' },
  { key: 'tiered', icon: Layers, label: 'Buy more & save more', hint: 'A price ladder: the more they buy, the less each one costs.' },
  { key: 'bxgy', icon: Gift, label: 'Buy X get Y', hint: 'Buy a number, get more at a discount or free.' },
  { key: 'free_shipping', icon: Truck, label: 'Free shipping', hint: 'Delivery costs nothing on a qualifying order.' },
];

export const EMPTY_OFFER = {
  name: '', internal_name: '', description: '', offer_type: 'percentage', scope: 'all',
  product_ids: [], variant_keys: [], category_ids: [],
  discount_percent: '', discount_amount: '', buy_quantity: '', get_quantity: '', get_discount_percent: 100,
  tiers: [{ quantity: 2, total_price: '' }], offer_price: '',
  min_quantity: '', max_quantity: '', min_order_amount: '', max_discount: '',
  starts_at: '', ends_at: '', usage_limit: '', usage_per_customer: '', priority: 0,
  status: 'active', show_on_product: true, show_on_storefront: true, show_at_checkout: true, badge_text: '',
};

export function offerToForm(o) {
  const arr = (v) => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } } return []; };
  return {
    ...EMPTY_OFFER, ...o,
    product_ids: arr(o.product_ids), variant_keys: arr(o.variant_keys), category_ids: arr(o.category_ids),
    tiers: arr(o.tiers).length ? arr(o.tiers) : EMPTY_OFFER.tiers,
    discount_percent: o.discount_percent ?? '', discount_amount: o.discount_amount ?? '',
    offer_price: o.offer_price ?? '', min_order_amount: o.min_order_amount ?? '', max_discount: o.max_discount ?? '',
    starts_at: toLocalInput(o.starts_at), ends_at: toLocalInput(o.ends_at),
  };
}

export default function OfferEditor({ open, onClose, sid, offer, products, categories, currency, onSaved, newType }) {
  const { t } = useTranslation();
  const money = useMoney(currency);
  const [f, setF] = useState(() => (offer ? offerToForm(offer) : { ...EMPTY_OFFER, ...(newType ? { offer_type: newType } : {}) }));
  const [saving, setSaving] = useState(false);
  const [pq, setPq] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const isNew = !offer?.id;

  // reset when a different offer is opened in the same drawer
  const key = offer?.id || 'new';
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setF(offer ? offerToForm(offer) : { ...EMPTY_OFFER, ...(newType ? { offer_type: newType } : {}) }); }

  const shown = useMemo(() => {
    const q = pq.trim().toLowerCase();
    const list = products || [];
    return q ? list.filter((p) => String(p.name || '').toLowerCase().includes(q)) : list.slice(0, 60);
  }, [pq, products]);

  const toggleIn = (k, id) => setF((s) => {
    const cur = s[k].map(String);
    return { ...s, [k]: cur.includes(String(id)) ? cur.filter((x) => x !== String(id)) : [...cur, String(id)] };
  });

  const setTier = (i, k, v) => setF((s) => { const tiers = [...s.tiers]; tiers[i] = { ...tiers[i], [k]: v }; return { ...s, tiers }; });
  const addTier = () => setF((s) => ({ ...s, tiers: [...s.tiers, { quantity: (Number(s.tiers[s.tiers.length - 1]?.quantity) || 1) + 1, total_price: '' }] }));
  const removeTier = (i) => setF((s) => ({ ...s, tiers: s.tiers.filter((_, j) => j !== i) }));

  // What the shopper will see for the tiers, worked out the same way the
  // server does it, so the admin can sanity-check before saving.
  const tierPreview = useMemo(() => {
    const base = Number(products?.find((p) => f.product_ids.map(String).includes(String(p.id)))?.price) || 0;
    return (f.tiers || [])
      .filter((x) => Number(x.quantity) > 0)
      .map((x) => {
        const qty = Number(x.quantity);
        const full = base * qty;
        const price = x.total_price !== '' && x.total_price != null ? Number(x.total_price)
          : x.discount_type === 'fixed' ? Math.max(0, full - Number(x.discount_value || 0))
            : full - Math.round((full * Number(x.discount_value || 0)) / 100);
        return { qty, price, save: Math.max(0, full - price) };
      })
      .sort((a, b) => a.qty - b.qty);
  }, [f.tiers, f.product_ids, products]);

  const save = async () => {
    if (!String(f.name).trim()) return toast.error(t('promo.err.name', 'Give the offer a name'));
    if (f.offer_type === 'percentage' && !(Number(f.discount_percent) > 0)) return toast.error(t('promo.err.percent', 'Set a discount percentage'));
    if (f.offer_type === 'fixed' && !(Number(f.discount_amount) > 0)) return toast.error(t('promo.err.amount', 'Set a discount amount'));
    if (f.offer_type === 'bxgy' && !(Number(f.buy_quantity) > 0 && Number(f.get_quantity) > 0)) return toast.error(t('promo.err.bxgy', 'Set both quantities'));
    if (f.offer_type === 'tiered' && !tierPreview.length) return toast.error(t('promo.err.tiers', 'Add at least one quantity tier'));
    if (f.scope === 'products' && !f.product_ids.length) return toast.error(t('promo.err.products', 'Pick at least one product'));
    if (f.scope === 'categories' && !f.category_ids.length) return toast.error(t('promo.err.categories', 'Pick at least one category'));
    if (f.scope === 'variants' && !f.variant_keys.length) return toast.error(t('promo.err.variants', 'Name at least one variant'));
    if (f.starts_at && f.ends_at && new Date(f.ends_at) <= new Date(f.starts_at)) return toast.error(t('promo.err.dates', 'The end must come after the start'));

    setSaving(true);
    try {
      const body = { ...f, starts_at: fromLocalInput(f.starts_at), ends_at: fromLocalInput(f.ends_at) };
      const { data } = isNew ? await promotionApi.createOffer(sid, body) : await promotionApi.updateOffer(sid, offer.id, body);
      toast.success(isNew ? t('promo.offerCreated', 'Offer created') : t('promo.offerSaved', 'Offer saved'));
      onSaved?.(data.offer);
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('promo.failed', 'Failed'));
    }
    setSaving(false);
  };

  const num = (k, extra = {}) => (
    <input type="number" min="0" className="input-field" value={f[k] ?? ''} onChange={(e) => set(k)(e.target.value)} {...extra} />
  );

  return (
    <Drawer open={open} onClose={onClose} wide
      title={isNew ? t('promo.newOffer', 'Create offer') : t('promo.editOffer', 'Edit offer')}
      subtitle={t('promo.offerSubtitle', 'The rule that decides what a buyer pays.')}
      footer={<>
        <button onClick={onClose} className="btn-ghost text-sm">{t('promo.cancel', 'Cancel')}</button>
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
          <Save size={14} />{saving ? t('promo.saving', 'Saving…') : t('promo.save', 'Save offer')}
        </button>
      </>}>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.name', 'Name')} hint={t('promo.nameHint', 'Buyers can see this one.')}>
          <input className="input-field" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder={t('promo.namePh', 'Winter sale')} />
        </Field>
        <Field label={t('promo.internalName', 'Internal name')} hint={t('promo.internalHint', 'Only your team sees this.')}>
          <input className="input-field" value={f.internal_name || ''} onChange={(e) => set('internal_name')(e.target.value)} />
        </Field>
      </div>
      <Field label={t('promo.description', 'Description')}>
        <textarea rows={2} className="input-field" value={f.description || ''} onChange={(e) => set('description')(e.target.value)} />
      </Field>

      <Field label={t('promo.type', 'Offer type')}>
        <div className="grid sm:grid-cols-2 gap-2">
          {OFFER_TYPES.map((o) => {
            const Icon = o.icon; const on = f.offer_type === o.key;
            return (
              <button key={o.key} type="button" onClick={() => set('offer_type')(o.key)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-start transition-colors ${on ? 'border-brand-500 bg-brand-500/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <Icon size={16} className={on ? 'text-brand-600 mt-0.5' : 'text-gray-400 mt-0.5'} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-900">{t(`promo.type.${o.key}`, o.label)}</span>
                  <span className="block text-[11px] text-gray-400">{t(`promo.typeHint.${o.key}`, o.hint)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {f.offer_type === 'percentage' && (
        <Field label={t('promo.percentOff', 'Percentage off')}>{num('discount_percent', { max: 100, placeholder: '20' })}</Field>
      )}
      {f.offer_type === 'fixed' && (
        <Field label={t('promo.amountOff', 'Amount off each item')} hint={currency}>{num('discount_amount', { placeholder: '300' })}</Field>
      )}
      {f.offer_type === 'bxgy' && (
        <div className="grid grid-cols-3 gap-3">
          <Field label={t('promo.buyQty', 'Buy')}>{num('buy_quantity', { placeholder: '2' })}</Field>
          <Field label={t('promo.getQty', 'Get')}>{num('get_quantity', { placeholder: '1' })}</Field>
          <Field label={t('promo.getOff', '% off those')} hint={t('promo.getOffHint', '100 = free')}>{num('get_discount_percent', { max: 100 })}</Field>
        </div>
      )}

      {f.offer_type === 'tiered' && (
        <Field label={t('promo.tiers', 'Quantity tiers')} hint={t('promo.tiersHint', 'Set the total price for that many items. Leave the price empty to use a percentage instead.')}>
          <div className="space-y-2">
            {(f.tiers || []).map((tier, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-20">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{t('promo.buy', 'Buy')}</label>
                  <input type="number" min="1" className="input-field !py-1.5 text-sm" value={tier.quantity ?? ''} onChange={(e) => setTier(i, 'quantity', e.target.value)} />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{t('promo.totalPrice', 'Total price')}</label>
                  <input type="number" min="0" className="input-field !py-1.5 text-sm" value={tier.total_price ?? ''} onChange={(e) => setTier(i, 'total_price', e.target.value)} placeholder="3200" />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{t('promo.orPercent', 'or % off')}</label>
                  <input type="number" min="0" max="100" className="input-field !py-1.5 text-sm" value={tier.discount_value ?? ''} onChange={(e) => { setTier(i, 'discount_type', 'percent'); setTier(i, 'discount_value', e.target.value); }} />
                </div>
                <button type="button" onClick={() => removeTier(i)} className="p-2 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={addTier} className="btn-ghost text-xs flex items-center gap-1"><Plus size={12} />{t('promo.addTier', 'Add tier')}</button>
          </div>
          {tierPreview.length > 0 && f.product_ids.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-100 p-3 bg-white">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('promo.whatBuyersSee', 'What buyers will see')}</p>
              <div className="flex flex-wrap gap-2">
                {tierPreview.map((x) => (
                  <div key={x.qty} className="px-3 py-2 rounded-xl border border-gray-200 text-center">
                    <p className="text-[11px] text-gray-400">{t('promo.buyN', 'Buy {{n}}', { n: x.qty })}</p>
                    <p className="text-sm font-black text-gray-900">{money(x.price)}</p>
                    {x.save > 0 && <p className="text-[11px] font-bold text-emerald-600">{t('promo.saveX', 'Save {{v}}', { v: money(x.save) })}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Field>
      )}

      <Field label={t('promo.scope', 'Applies to')}>
        <div className="flex flex-wrap gap-1.5">
          {[['all', t('promo.scopeAll', 'The whole store')], ['products', t('promo.scopeProducts', 'Chosen products')],
            ['categories', t('promo.scopeCategories', 'Chosen categories')], ['variants', t('promo.scopeVariants', 'Chosen variants')]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => set('scope')(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${f.scope === k ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
            ))}
        </div>
      </Field>

      {f.scope === 'products' && (
        <Field label={t('promo.products', 'Products')} hint={t('promo.pickedN', '{{n}} picked', { n: f.product_ids.length })}>
          <div className="relative mb-2">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field !ps-9 text-sm" value={pq} onChange={(e) => setPq(e.target.value)} placeholder={t('promo.searchProducts', 'Search products…')} />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
            {shown.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={f.product_ids.map(String).includes(String(p.id))} onChange={() => toggleIn('product_ids', p.id)} />
                <span className="flex-1 min-w-0 truncate">{p.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{money(p.price)}</span>
              </label>
            ))}
            {!shown.length && <p className="px-3 py-4 text-sm text-gray-400">{t('promo.noProducts', 'No products match')}</p>}
          </div>
        </Field>
      )}

      {f.scope === 'categories' && (
        <Field label={t('promo.categories', 'Categories')}>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
            {topLevel(categories || []).map((c) => (
              <React.Fragment key={c.id}>
                <label className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={f.category_ids.map(String).includes(String(c.id))} onChange={() => toggleIn('category_ids', c.id)} />
                  <span className="font-semibold">{c.name_en || c.name}</span>
                </label>
                {childrenOf(categories || [], c.id).map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 ps-8 pe-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={f.category_ids.map(String).includes(String(s.id))} onChange={() => toggleIn('category_ids', s.id)} />
                    <span>↳ {s.name_en || s.name}</span>
                  </label>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Field>
      )}

      {f.scope === 'variants' && (
        <Field label={t('promo.variants', 'Variants')} hint={t('promo.variantsHint', 'One per line: the colour, size or option this offer covers, e.g. "black" or "XL".')}>
          <textarea rows={3} className="input-field" value={(f.variant_keys || []).join('\n')}
            onChange={(e) => set('variant_keys')(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
        </Field>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.minQty', 'Minimum quantity')} hint={t('promo.minQtyHint', '0 = no minimum')}>{num('min_quantity')}</Field>
        <Field label={t('promo.maxQty', 'Maximum quantity')} hint={t('promo.maxQtyHint', '0 = no cap')}>{num('max_quantity')}</Field>
        <Field label={t('promo.minOrder', 'Minimum order amount')} hint={currency}>{num('min_order_amount')}</Field>
        <Field label={t('promo.maxDiscount', 'Maximum discount')} hint={t('promo.maxDiscountHint', '0 = uncapped')}>{num('max_discount')}</Field>
        <Field label={t('promo.offerPrice', 'Offer price per item')} hint={t('promo.offerPriceHint', 'Optional. Replaces the price outright.')}>{num('offer_price')}</Field>
        <Field label={t('promo.priority', 'Priority')} hint={t('promo.priorityHint', 'When two offers fit the same item, the higher number wins.')}>
          <input type="number" className="input-field" value={f.priority ?? 0} onChange={(e) => set('priority')(e.target.value)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.startsAt', 'Starts')} hint={t('promo.startsHint', 'Leave empty to start now.')}>
          <input type="datetime-local" className="input-field" value={f.starts_at || ''} onChange={(e) => set('starts_at')(e.target.value)} />
        </Field>
        <Field label={t('promo.endsAt', 'Ends')} hint={t('promo.endsHint', 'Leave empty to run until paused.')}>
          <input type="datetime-local" className="input-field" value={f.ends_at || ''} onChange={(e) => set('ends_at')(e.target.value)} />
        </Field>
        <Field label={t('promo.usageLimit', 'Total uses')} hint={t('promo.usageLimitHint', '0 = unlimited')}>{num('usage_limit')}</Field>
        <Field label={t('promo.usagePerCustomer', 'Uses per customer')} hint={t('promo.usageLimitHint', '0 = unlimited')}>{num('usage_per_customer')}</Field>
      </div>

      <Field label={t('promo.badgeText', 'Badge text')} hint={t('promo.badgeHint', 'Shown on the product card. Left empty, one is written from the offer.')}>
        <input className="input-field" value={f.badge_text || ''} onChange={(e) => set('badge_text')(e.target.value)} placeholder={t('promo.badgePh', 'SAVE 20%')} />
      </Field>

      <div className="space-y-2.5 rounded-2xl border border-gray-100 p-4">
        <Toggle label={t('promo.showOnProduct', 'Show on the product page')} checked={f.show_on_product} onChange={set('show_on_product')} />
        <Toggle label={t('promo.showOnStorefront', 'Show on the shop')} checked={f.show_on_storefront} onChange={set('show_on_storefront')} />
        <Toggle label={t('promo.showAtCheckout', 'Show at checkout')} checked={f.show_at_checkout} onChange={set('show_at_checkout')} />
        <Toggle label={t('promo.activeNow', 'Active')} hint={t('promo.activeHint', 'Paused offers never change a price.')}
          checked={f.status !== 'paused'} onChange={(v) => set('status')(v ? 'active' : 'paused')} />
      </div>
    </Drawer>
  );
}
