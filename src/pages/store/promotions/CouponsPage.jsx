import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, Search, Ticket, Pause, Play, Trash2, Edit2, Copy, Save, Tag, BarChart3, Users,
} from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { promotionApi, productApi, ownerApi } from '../../../utils/api';
import { topLevel, childrenOf } from '../../../utils/categoryTree';
import {
  StatusBadge, Drawer, Field, Toggle, EmptyState, TableSkeleton, ErrorState,
  useMoney, toLocalInput, fromLocalInput, Pagination,
} from './shared';

const PAGE_SIZE = 20;
const EMPTY = {
  code: '', name: '', description: '', discount_type: 'percent',
  discount_percent: '', discount_amount: '', max_discount: '', min_order_amount: '',
  min_quantity: '', max_quantity: '',
  product_ids: [], variant_keys: [], category_ids: [], excluded_product_ids: [], excluded_category_ids: [],
  free_shipping: false, stackable: false, starts_at: '', ends_at: '',
  usage_limit: '', usage_per_customer: '', status: 'active',
};

const arr = (v) => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } } return []; };

function toForm(c) {
  return {
    ...EMPTY, ...c,
    product_ids: arr(c.product_ids), variant_keys: arr(c.variant_keys), category_ids: arr(c.category_ids),
    excluded_product_ids: arr(c.excluded_product_ids), excluded_category_ids: arr(c.excluded_category_ids),
    discount_percent: c.discount_percent ?? '', discount_amount: c.discount_amount ?? '',
    max_discount: c.max_discount ?? '', min_order_amount: c.min_order_amount ?? '',
    starts_at: toLocalInput(c.starts_at), ends_at: toLocalInput(c.ends_at),
  };
}

// A code the buyer types in. Offers apply on their own; this does not.
function CouponEditor({ open, onClose, sid, coupon, products, categories, currency, onSaved }) {
  const { t } = useTranslation();
  const money = useMoney(currency);
  const [f, setF] = useState(() => (coupon ? toForm(coupon) : { ...EMPTY }));
  const [saving, setSaving] = useState(false);
  const [pq, setPq] = useState('');
  const isNew = !coupon?.id;
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const key = coupon?.id || 'new';
  const [seen, setSeen] = useState(key);
  if (seen !== key) { setSeen(key); setF(coupon ? toForm(coupon) : { ...EMPTY }); }

  const shown = useMemo(() => {
    const q = pq.trim().toLowerCase();
    const list = products || [];
    return q ? list.filter((p) => String(p.name || '').toLowerCase().includes(q)) : list.slice(0, 60);
  }, [pq, products]);

  const toggleIn = (k, id) => setF((s) => {
    const cur = s[k].map(String);
    return { ...s, [k]: cur.includes(String(id)) ? cur.filter((x) => x !== String(id)) : [...cur, String(id)] };
  });

  const save = async () => {
    const code = String(f.code).trim().toUpperCase();
    if (!code) return toast.error(t('promo.err.code', 'Give the coupon a code'));
    if (!/^[A-Z0-9_-]+$/.test(code)) return toast.error(t('promo.err.codeChars', 'Use letters, numbers, - and _ only'));
    if (f.discount_type === 'percent' && !(Number(f.discount_percent) > 0)) return toast.error(t('promo.err.percent', 'Set a discount percentage'));
    if (f.discount_type === 'fixed' && !(Number(f.discount_amount) > 0)) return toast.error(t('promo.err.amount', 'Set a discount amount'));
    if (f.starts_at && f.ends_at && new Date(f.ends_at) <= new Date(f.starts_at)) return toast.error(t('promo.err.dates', 'The end must come after the start'));
    setSaving(true);
    try {
      const body = { ...f, code, starts_at: fromLocalInput(f.starts_at), ends_at: fromLocalInput(f.ends_at) };
      const { data } = isNew ? await promotionApi.createCoupon(sid, body) : await promotionApi.updateCoupon(sid, coupon.id, body);
      toast.success(isNew ? t('promo.couponCreated', 'Coupon created') : t('promo.couponSaved', 'Coupon saved'));
      onSaved?.(data.coupon);
      onClose();
    } catch (e) { toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
    setSaving(false);
  };

  const num = (k, extra = {}) => <input type="number" min="0" className="input-field" value={f[k] ?? ''} onChange={(e) => set(k)(e.target.value)} {...extra} />;

  return (
    <Drawer open={open} onClose={onClose} wide
      title={isNew ? t('promo.newCoupon', 'Create coupon') : t('promo.editCoupon', 'Edit coupon')}
      subtitle={t('promo.couponSubtitle', 'A code the buyer types at checkout.')}
      footer={<>
        <button onClick={onClose} className="btn-ghost text-sm">{t('promo.cancel', 'Cancel')}</button>
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
          <Save size={14} />{saving ? t('promo.saving', 'Saving…') : t('promo.save', 'Save coupon')}
        </button>
      </>}>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.code', 'Coupon code')} hint={t('promo.codeHint', 'What the buyer types. Case does not matter.')}>
          <input className="input-field font-mono uppercase" value={f.code} onChange={(e) => set('code')(e.target.value.toUpperCase())} placeholder="WELCOME10" />
        </Field>
        <Field label={t('promo.name', 'Name')} hint={t('promo.couponNameHint', 'For your own records.')}>
          <input className="input-field" value={f.name || ''} onChange={(e) => set('name')(e.target.value)} />
        </Field>
      </div>
      <Field label={t('promo.description', 'Description')}>
        <textarea rows={2} className="input-field" value={f.description || ''} onChange={(e) => set('description')(e.target.value)} />
      </Field>

      <Field label={t('promo.discountType', 'Discount')}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[['percent', t('promo.percentage', 'Percentage')], ['fixed', t('promo.fixedAmount', 'Fixed amount')], ['free_shipping', t('promo.freeShipping', 'Free shipping')]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => set('discount_type')(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${f.discount_type === k ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
        {f.discount_type === 'percent' && num('discount_percent', { max: 100, placeholder: '10' })}
        {f.discount_type === 'fixed' && num('discount_amount', { placeholder: '500' })}
        {f.discount_type === 'free_shipping' && <p className="text-sm text-gray-400">{t('promo.freeShippingHint', 'Delivery costs the buyer nothing when this code is used.')}</p>}
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.maxDiscount', 'Maximum discount')} hint={t('promo.maxDiscountHint', '0 = uncapped')}>{num('max_discount')}</Field>
        <Field label={t('promo.minOrder', 'Minimum order amount')} hint={currency}>{num('min_order_amount')}</Field>
        <Field label={t('promo.minQty', 'Minimum quantity')}>{num('min_quantity')}</Field>
        <Field label={t('promo.maxQty', 'Maximum quantity')}>{num('max_quantity')}</Field>
      </div>

      <Field label={t('promo.appliesTo', 'Applies to')} hint={t('promo.couponScopeHint', 'Leave both empty and the code works on the whole cart.')}>
        <div className="relative mb-2">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !ps-9 text-sm" value={pq} onChange={(e) => setPq(e.target.value)} placeholder={t('promo.searchProducts', 'Search products…')} />
        </div>
        <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
          {shown.map((p) => (
            <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={f.product_ids.map(String).includes(String(p.id))} onChange={() => toggleIn('product_ids', p.id)} />
              <span className="flex-1 min-w-0 truncate">{p.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{money(p.price)}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label={t('promo.categories', 'Categories')}>
        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
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

      <Field label={t('promo.excluded', 'Never applies to')} hint={t('promo.excludedHint', 'These win over the lists above.')}>
        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
          {shown.map((p) => (
            <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={f.excluded_product_ids.map(String).includes(String(p.id))} onChange={() => toggleIn('excluded_product_ids', p.id)} />
              <span className="flex-1 min-w-0 truncate">{p.name}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label={t('promo.variants', 'Variants')} hint={t('promo.variantsHint', 'One per line: the colour, size or option this covers.')}>
        <textarea rows={2} className="input-field" value={(f.variant_keys || []).join('\n')}
          onChange={(e) => set('variant_keys')(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t('promo.startsAt', 'Starts')}><input type="datetime-local" className="input-field" value={f.starts_at || ''} onChange={(e) => set('starts_at')(e.target.value)} /></Field>
        <Field label={t('promo.endsAt', 'Ends')}><input type="datetime-local" className="input-field" value={f.ends_at || ''} onChange={(e) => set('ends_at')(e.target.value)} /></Field>
        <Field label={t('promo.usageLimit', 'Total uses')} hint={t('promo.usageLimitHint', '0 = unlimited')}>{num('usage_limit')}</Field>
        <Field label={t('promo.usagePerCustomer', 'Uses per customer')} hint={t('promo.usageLimitHint', '0 = unlimited')}>{num('usage_per_customer')}</Field>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-gray-100 p-4">
        <Toggle label={t('promo.alsoFreeShipping', 'Also makes shipping free')} checked={f.free_shipping} onChange={set('free_shipping')} disabled={f.discount_type === 'free_shipping'} />
        <Toggle label={t('promo.stackable', 'Can be combined with other coupons')} hint={t('promo.stackableHint', 'Only matters while stacking is switched on for the store.')} checked={f.stackable} onChange={set('stackable')} />
        <Toggle label={t('promo.activeNow', 'Active')} checked={f.status !== 'paused'} onChange={(v) => set('status')(v ? 'active' : 'paused')} />
      </div>
    </Drawer>
  );
}

export default function CouponsPage() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const { can } = useStaffAccess();
  const canEdit = can('offers_manage');
  const sid = currentStore?.id;
  const currency = currentStore?.currency || 'DZD';
  const money = useMoney(currency);

  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uses, setUses] = useState(null);
  const [stacking, setStacking] = useState(!!(currentStore?.config?.coupon_stacking));
  const [savingStack, setSavingStack] = useState(false);

  const load = useCallback(() => {
    if (!sid) return;
    setError(null);
    promotionApi.listCoupons(sid)
      .then((r) => setCoupons(r.data.coupons || []))
      .catch((e) => { setCoupons([]); setError(e?.response?.data?.error || e.message); });
  }, [sid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!sid) return;
    productApi.getAll(sid, {}).then((r) => setProducts(r.data.products || [])).catch(() => {});
    productApi.getCategories(sid).then((r) => setCategories(r.data || [])).catch(() => {});
  }, [sid]);
  useEffect(() => { setStacking(!!(currentStore?.config?.coupon_stacking)); }, [currentStore?.config?.coupon_stacking]);
  useEffect(() => { setPage(1); }, [q, status]);

  const saveStacking = async (next) => {
    setStacking(next); setSavingStack(true);
    try {
      await ownerApi.updateStore(sid, { coupon_stacking: next });
      setCurrentStore?.({ ...currentStore, config: { ...(currentStore?.config || {}), coupon_stacking: next } });
      toast.success(next ? t('promo.stackingOn', 'Coupons can now be combined') : t('promo.stackingOff', 'One coupon at a time'));
    } catch (e) { setStacking(!next); toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
    setSavingStack(false);
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    let list = coupons || [];
    if (status) {
      list = list.filter((c) => {
        const ended = c.ends_at && new Date(c.ends_at).getTime() < now;
        if (status === 'expired') return ended;
        if (status === 'active') return c.status === 'active' && !ended;
        return c.status === status;
      });
    }
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((c) => `${c.code} ${c.name || ''}`.toLowerCase().includes(needle));
    return list;
  }, [coupons, status, q]);
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setStatusOf = async (c, next) => {
    try {
      await promotionApi.setCouponStatus(sid, c.id, next);
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
      toast.success(next === 'paused' ? t('promo.couponPaused', 'Coupon paused') : t('promo.couponResumed', 'Coupon active'));
    } catch (e) { toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
  };
  const remove = async (c) => {
    setConfirm(null);
    try {
      await promotionApi.deleteCoupon(sid, c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      toast.success(t('promo.couponDeleted', 'Coupon deleted'));
    } catch (e) { toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
  };
  const openUses = async (c) => {
    setUses({ coupon: c, rows: null });
    try { const { data } = await promotionApi.couponRedemptions(sid, c.id, { limit: 100 }); setUses({ coupon: c, rows: data.redemptions || [], total: data.total }); }
    catch { setUses({ coupon: c, rows: [] }); }
  };

  const value = (c) => (c.discount_type === 'percent' ? `${Number(c.discount_percent) || 0}%`
    : c.discount_type === 'fixed' ? money(c.discount_amount)
      : t('promo.freeShipping', 'Free shipping'));

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('promo.coupons', 'Coupons')}</h1>
          <p className="text-sm text-gray-400">{t('promo.couponsSubtitle', 'Codes buyers type at checkout.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/offers" className="btn-ghost text-sm flex items-center gap-1.5"><Tag size={14} />{t('promo.offers', 'Offers')}</Link>
          <Link to="/dashboard/promotions/analytics" className="btn-ghost text-sm flex items-center gap-1.5"><BarChart3 size={14} />{t('promo.analytics', 'Analytics')}</Link>
          {canEdit && <button onClick={() => setEditing({})} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={14} />{t('promo.createCoupon', 'Create coupon')}</button>}
        </div>
      </div>

      {canEdit && (
        <div className="glass-card-solid p-4 mb-4">
          <Toggle
            label={t('promo.allowStacking', 'Allow coupon stacking')}
            hint={t('promo.allowStackingHint', 'Off: one coupon per order. On: codes marked as combinable can be used together, each one working on what is left after the last.')}
            checked={stacking} disabled={savingStack} onChange={saveStacking} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[12rem] max-w-xs">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !ps-9 !py-2 text-sm w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('promo.searchCoupons', 'Search codes…')} />
        </div>
        <select className="input-field !py-2 text-sm w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('promo.allStatuses', 'Any status')}</option>
          <option value="active">{t('promo.statusActive', 'Active')}</option>
          <option value="paused">{t('promo.statusPaused', 'Paused')}</option>
          <option value="expired">{t('promo.statusExpired', 'Expired')}</option>
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={load} />
        : coupons === null ? <TableSkeleton />
          : !filtered.length ? (
            <EmptyState icon={Ticket}
              title={coupons.length ? t('promo.noMatch', 'Nothing matches those filters') : t('promo.noCoupons', 'No coupons yet')}
              hint={coupons.length ? null : t('promo.noCouponsHint', 'A coupon only works when the buyer types its code — good for a campaign you want to measure.')}
              action={canEdit && !coupons.length ? <button onClick={() => setEditing({})} className="btn-primary text-sm inline-flex items-center gap-1.5"><Plus size={14} />{t('promo.createCoupon', 'Create coupon')}</button> : null} />
          ) : (
            <div className="glass-card-solid overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      {[t('promo.code', 'Code'), t('promo.discount', 'Discount'), t('promo.conditions', 'Conditions'),
                        t('promo.used', 'Used'), t('promo.schedule', 'Schedule'), t('promo.status', 'Status'), ''].map((h, i) => (
                          <th key={i} className="px-3 py-2.5 text-start font-bold">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5">
                          <button onClick={() => { navigator.clipboard?.writeText(c.code); toast.success(t('promo.copied', 'Code copied')); }}
                            className="font-mono font-black text-gray-900 hover:text-brand-600 flex items-center gap-1.5">
                            {c.code}<Copy size={11} className="text-gray-300" />
                          </button>
                          {c.name && <p className="text-[11px] text-gray-400">{c.name}</p>}
                        </td>
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{value(c)}{c.free_shipping && c.discount_type !== 'free_shipping' && <span className="text-[11px] text-emerald-600"> + {t('promo.freeShipping', 'Free shipping')}</span>}</td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-500">
                          {Number(c.min_order_amount) > 0 && <span className="block">{t('promo.minOrderN', 'Min {{v}}', { v: money(c.min_order_amount) })}</span>}
                          {arr(c.product_ids).length > 0 && <span className="block">{t('promo.scopeNProducts', '{{n}} products', { n: arr(c.product_ids).length })}</span>}
                          {arr(c.category_ids).length > 0 && <span className="block">{t('promo.scopeNCategories', '{{n}} categories', { n: arr(c.category_ids).length })}</span>}
                          {!Number(c.min_order_amount) && !arr(c.product_ids).length && !arr(c.category_ids).length && '—'}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          <button onClick={() => openUses(c)} className="hover:underline text-gray-700">
                            {c.used_count || 0}{Number(c.usage_limit) > 0 ? ` / ${c.usage_limit}` : ''}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                          {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : t('promo.now', 'Now')} → {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : t('promo.noEnd', 'No end')}
                        </td>
                        <td className="px-3 py-2.5"><StatusBadge status={c.status} startsAt={c.starts_at} endsAt={c.ends_at} /></td>
                        <td className="px-3 py-2.5">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setStatusOf(c, c.status === 'paused' ? 'active' : 'paused')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">{c.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}</button>
                              <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                              <button onClick={() => setConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-gray-50">
                {shown.map((c) => (
                  <div key={c.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono font-black text-gray-900 truncate">{c.code}</p>
                        <p className="text-[11px] text-gray-400">{value(c)} · {t('promo.usedN', 'used {{n}}', { n: c.used_count || 0 })}</p>
                      </div>
                      <StatusBadge status={c.status} startsAt={c.starts_at} endsAt={c.ends_at} />
                    </div>
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <button onClick={() => setStatusOf(c, c.status === 'paused' ? 'active' : 'paused')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">{c.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}</button>
                        <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                        <button onClick={() => setConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
            </div>
          )}

      {editing && (
        <CouponEditor open onClose={() => setEditing(null)} sid={sid} coupon={editing.id ? editing : null}
          products={products} categories={categories} currency={currency} onSaved={load} />
      )}

      {uses && (
        <Drawer open onClose={() => setUses(null)} title={uses.coupon.code}
          subtitle={t('promo.whoUsed', 'Who used this code')}>
          {uses.rows === null ? <TableSkeleton rows={4} />
            : !uses.rows.length ? <p className="text-sm text-gray-400">{t('promo.notUsedYet', 'Nobody has used it yet.')}</p>
              : (
                <div className="space-y-2">
                  {uses.rows.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <Users size={16} className="text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.customer_name || r.customer_phone || t('promo.guest', 'Guest')}</p>
                        <p className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleString()}{r.order_number ? ` · #${r.order_number}` : ''}</p>
                      </div>
                      <p className="text-sm font-black text-emerald-600 shrink-0">−{money(r.discount_amount)}</p>
                    </div>
                  ))}
                </div>
              )}
        </Drawer>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900">{t('promo.deleteCoupon', 'Delete “{{n}}”?', { n: confirm.code })}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('promo.deleteCouponHint', 'The code stops working at once. Orders that used it keep the price they were charged, and still show in the reports.')}</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-sm text-gray-700">{t('promo.cancel', 'Cancel')}</button>
              <button onClick={() => remove(confirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm">{t('promo.delete', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
