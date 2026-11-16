import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Tag, Pause, Play, Trash2, Edit2, Layers, Calendar, Ticket, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { promotionApi, productApi } from '../../../utils/api';
import { StatusBadge, EmptyState, TableSkeleton, ErrorState, useMoney, Pagination } from './shared';
import OfferEditor, { OFFER_TYPES } from './OfferEditor';

// All Offers / Buy More & Save / Scheduled are the same table with a
// different filter, so they share one page and one data load.

const TABS = [
  { key: 'all', label: 'All offers' },
  { key: 'tiered', label: 'Buy more & save' },
  { key: 'scheduled', label: 'Scheduled' },
];
const PAGE_SIZE = 20;

export default function OffersPage() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const { can } = useStaffAccess();
  const canEdit = can('offers_manage');
  const sid = currentStore?.id;
  const currency = currentStore?.currency || 'DZD';
  const money = useMoney(currency);

  const [params, setParams] = useSearchParams();
  const tab = TABS.some((x) => x.key === params.get('tab')) ? params.get('tab') : 'all';
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // offer | {} for new
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    if (!sid) return;
    setError(null);
    promotionApi.listOffers(sid)
      .then((r) => setOffers(r.data.offers || []))
      .catch((e) => { setOffers([]); setError(e?.response?.data?.error || e.message); });
  }, [sid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!sid) return;
    productApi.getAll(sid, {}).then((r) => setProducts(r.data.products || [])).catch(() => {});
    productApi.getCategories(sid).then((r) => setCategories(r.data || [])).catch(() => {});
  }, [sid]);
  useEffect(() => { setPage(1); }, [tab, q, status]);

  const filtered = useMemo(() => {
    const now = Date.now();
    let list = offers || [];
    if (tab === 'tiered') list = list.filter((o) => o.offer_type === 'tiered');
    if (tab === 'scheduled') list = list.filter((o) => o.starts_at && new Date(o.starts_at).getTime() > now);
    if (status) {
      list = list.filter((o) => {
        const ended = o.ends_at && new Date(o.ends_at).getTime() < now;
        if (status === 'expired') return ended;
        if (status === 'active') return o.status === 'active' && !ended;
        return o.status === status;
      });
    }
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((o) => `${o.name} ${o.internal_name || ''}`.toLowerCase().includes(needle));
    return list;
  }, [offers, tab, status, q]);

  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setStatusOf = async (o, next) => {
    try {
      await promotionApi.setOfferStatus(sid, o.id, next);
      setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
      toast.success(next === 'paused' ? t('promo.paused', 'Offer paused') : t('promo.resumed', 'Offer running'));
    } catch (e) { toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
  };

  const remove = async (o) => {
    setConfirm(null);
    try {
      await promotionApi.deleteOffer(sid, o.id);
      setOffers((prev) => prev.filter((x) => x.id !== o.id));
      toast.success(t('promo.offerDeleted', 'Offer deleted'));
    } catch (e) { toast.error(e?.response?.data?.error || t('promo.failed', 'Failed')); }
  };

  const describe = (o) => {
    if (o.offer_type === 'percentage') return t('promo.descPercent', '{{n}}% off', { n: Number(o.discount_percent) || 0 });
    if (o.offer_type === 'fixed') return t('promo.descFixed', '{{v}} off each', { v: money(o.discount_amount) });
    if (o.offer_type === 'free_shipping') return t('promo.descFreeShip', 'Free shipping');
    if (o.offer_type === 'bxgy') return t('promo.descBxgy', 'Buy {{b}} get {{g}}', { b: o.buy_quantity, g: o.get_quantity });
    if (o.offer_type === 'tiered') {
      let tiers = o.tiers; if (typeof tiers === 'string') { try { tiers = JSON.parse(tiers); } catch { tiers = []; } }
      return t('promo.descTiers', '{{n}} quantity tiers', { n: (tiers || []).length });
    }
    return '—';
  };

  const scopeOf = (o) => ({
    all: t('promo.scopeAll', 'The whole store'),
    products: t('promo.scopeNProducts', '{{n}} products', { n: (Array.isArray(o.product_ids) ? o.product_ids : []).length }),
    categories: t('promo.scopeNCategories', '{{n}} categories', { n: (Array.isArray(o.category_ids) ? o.category_ids : []).length }),
    variants: t('promo.scopeNVariants', '{{n}} variants', { n: (Array.isArray(o.variant_keys) ? o.variant_keys : []).length }),
  }[o.scope] || '—');

  const typeLabel = (k) => t(`promo.type.${k}`, OFFER_TYPES.find((x) => x.key === k)?.label || k);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('promo.offers', 'Offers')}</h1>
          <p className="text-sm text-gray-400">{t('promo.offersSubtitle', 'Discounts that apply on their own, with no code to type.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/coupons" className="btn-ghost text-sm flex items-center gap-1.5"><Ticket size={14} />{t('promo.coupons', 'Coupons')}</Link>
          <Link to="/dashboard/promotions/analytics" className="btn-ghost text-sm flex items-center gap-1.5"><BarChart3 size={14} />{t('promo.analytics', 'Analytics')}</Link>
          {canEdit && <button onClick={() => setEditing({})} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={14} />{t('promo.createOffer', 'Create offer')}</button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {TABS.map((x) => (
            <button key={x.key} onClick={() => setParams(x.key === 'all' ? {} : { tab: x.key }, { replace: true })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${tab === x.key ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>
              {x.key === 'tiered' && <Layers size={12} />}{x.key === 'scheduled' && <Calendar size={12} />}
              {t(`promo.tab.${x.key}`, x.label)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[12rem] max-w-xs">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !ps-9 !py-2 text-sm w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('promo.searchOffers', 'Search offers…')} />
        </div>
        <select className="input-field !py-2 text-sm w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('promo.allStatuses', 'Any status')}</option>
          <option value="active">{t('promo.statusActive', 'Active')}</option>
          <option value="paused">{t('promo.statusPaused', 'Paused')}</option>
          <option value="expired">{t('promo.statusExpired', 'Expired')}</option>
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={load} />
        : offers === null ? <TableSkeleton />
          : !filtered.length ? (
            <EmptyState icon={Tag}
              title={offers.length ? t('promo.noMatch', 'Nothing matches those filters') : t('promo.noOffers', 'No offers yet')}
              hint={offers.length ? null : t('promo.noOffersHint', 'An offer takes money off on its own — no code for the buyer to remember.')}
              action={canEdit && !offers.length ? <button onClick={() => setEditing({})} className="btn-primary text-sm inline-flex items-center gap-1.5"><Plus size={14} />{t('promo.createOffer', 'Create offer')}</button> : null} />
          ) : (
            <div className="glass-card-solid overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      {[t('promo.name', 'Name'), t('promo.type', 'Type'), t('promo.discount', 'Discount'), t('promo.appliesTo', 'Applies to'),
                        t('promo.used', 'Used'), t('promo.schedule', 'Schedule'), t('promo.status', 'Status'), ''].map((h, i) => (
                          <th key={i} className="px-3 py-2.5 text-start font-bold">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-gray-900">{o.name}</p>
                          {o.internal_name && <p className="text-[11px] text-gray-400">{o.internal_name}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{typeLabel(o.offer_type)}</td>
                        <td className="px-3 py-2.5 text-gray-900 font-semibold whitespace-nowrap">{describe(o)}</td>
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{scopeOf(o)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-gray-600">
                          {o.used_count || 0}{Number(o.usage_limit) > 0 ? ` / ${o.usage_limit}` : ''}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                          {o.starts_at ? new Date(o.starts_at).toLocaleDateString() : t('promo.now', 'Now')}
                          {' → '}
                          {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : t('promo.noEnd', 'No end')}
                        </td>
                        <td className="px-3 py-2.5"><StatusBadge status={o.status} startsAt={o.starts_at} endsAt={o.ends_at} /></td>
                        <td className="px-3 py-2.5">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setStatusOf(o, o.status === 'paused' ? 'active' : 'paused')} title={o.status === 'paused' ? t('promo.resume', 'Resume') : t('promo.pause', 'Pause')}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">{o.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}</button>
                              <button onClick={() => setEditing(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                              <button onClick={() => setConfirm(o)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-gray-50">
                {shown.map((o) => (
                  <div key={o.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{o.name}</p>
                        <p className="text-[11px] text-gray-400">{typeLabel(o.offer_type)} · {scopeOf(o)}</p>
                      </div>
                      <StatusBadge status={o.status} startsAt={o.starts_at} endsAt={o.ends_at} />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="text-sm font-black text-gray-900">{describe(o)}</p>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setStatusOf(o, o.status === 'paused' ? 'active' : 'paused')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">{o.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}</button>
                          <button onClick={() => setEditing(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirm(o)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
            </div>
          )}

      {editing && (
        <OfferEditor open onClose={() => setEditing(null)} sid={sid} offer={editing.id ? editing : null}
          products={products} categories={categories} currency={currency} onSaved={load} />
      )}

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900">{t('promo.deleteOffer', 'Delete “{{n}}”?', { n: confirm.name })}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('promo.deleteOfferHint', 'Carts stop using it straight away. Orders that already used it keep the price they were charged.')}</p>
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
