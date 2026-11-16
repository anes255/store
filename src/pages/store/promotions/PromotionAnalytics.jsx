import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart,
} from 'recharts';
import { Tag, Ticket, TrendingUp, Percent, ShoppingBag, Users, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import { useStoreManagement } from '../../../hooks/useStore';
import { promotionApi } from '../../../utils/api';
import { EmptyState, TableSkeleton, ErrorState, useMoney } from './shared';

// What the promotions actually did. Everything here is read from the
// redemption rows written when an order was placed, so the figures do not
// move when an offer is later edited, paused or deleted.

function Stat({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="glass-card-solid p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-xl grid place-items-center ${tones[tone]}`}><Icon size={15} /></span>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function PromotionAnalytics() {
  const { t, i18n } = useTranslation();
  const { currentStore } = useStoreManagement();
  const sid = currentStore?.id;
  const currency = currentStore?.currency || 'DZD';
  const money = useMoney(currency);

  const [range, setRange] = useState({ from: '', to: '' });
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!sid) return;
    setD(null); setError(null);
    promotionApi.analytics(sid, { from: range.from || undefined, to: range.to || undefined })
      .then((r) => setD(r.data))
      .catch((e) => setError(e?.response?.data?.error || e.message));
  }, [sid, range.from, range.to]);
  useEffect(() => { load(); }, [load]);

  const dayLabel = (v) => {
    try { return new Date(v).toLocaleDateString((i18n.language || 'en').slice(0, 2), { day: 'numeric', month: 'short' }); }
    catch { return v; }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('promo.analytics', 'Promotion analytics')}</h1>
          <p className="text-sm text-gray-400">{t('promo.analyticsSubtitle', 'What your offers and coupons brought in, and what they cost you.')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter align="end" value={range} onChange={(r) => setRange({ from: r.from || '', to: r.to || '' })} />
          <Link to="/dashboard/offers" className="btn-ghost text-sm flex items-center gap-1.5"><Tag size={14} />{t('promo.offers', 'Offers')}</Link>
          <Link to="/dashboard/coupons" className="btn-ghost text-sm flex items-center gap-1.5"><Ticket size={14} />{t('promo.coupons', 'Coupons')}</Link>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={load} />
        : !d ? <TableSkeleton rows={6} />
          : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Stat icon={ShoppingBag} label={t('promo.ordersWithPromo', 'Orders with a promotion')} value={d.overall.promo_orders || 0}
                  hint={t('promo.ofNOrders', 'of {{n}} orders', { n: d.overall.orders || 0 })} />
                <Stat icon={TrendingUp} tone="emerald" label={t('promo.revenue', 'Revenue')} value={money(d.overall.promo_revenue)} />
                <Stat icon={Percent} tone="amber" label={t('promo.customerSavings', 'Customer savings')} value={money(d.overall.saved)} />
                <Stat icon={BarChart3} tone="blue" label={t('promo.avgOrderValue', 'Average order value')} value={money(d.overall.avg_order_value)} />
                <Stat icon={Users} label={t('promo.conversionRate', 'Share of orders')} value={`${d.overall.conversion_rate || 0}%`}
                  hint={t('promo.conversionHint', 'Orders that used a promotion')} />
              </div>

              <div className="glass-card-solid p-4">
                <p className="font-bold text-gray-900 mb-3">{t('promo.byDay', 'Discounts given, day by day')}</p>
                {!(d.by_day || []).some((x) => x.offer_discount || x.coupon_discount) ? (
                  <p className="text-sm text-gray-400 py-10 text-center">{t('promo.noDataRange', 'Nothing was discounted in this period.')}</p>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={d.by_day} margin={{ top: 5, right: 8, bottom: 0, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => money(v)} labelFormatter={dayLabel} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="offer_discount" name={t('promo.offerDiscount', 'Offer discount')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="coupon_discount" name={t('promo.couponDiscount', 'Coupon discount')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="coupon_revenue" name={t('promo.revenue', 'Revenue')} stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="glass-card-solid overflow-hidden">
                  <p className="font-bold text-gray-900 p-4 pb-2">{t('promo.topOffers', 'Offers')}</p>
                  {!(d.offers || []).length ? <p className="text-sm text-gray-400 px-4 pb-6">{t('promo.noOfferUse', 'No offer was used in this period.')}</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">
                          {[t('promo.name', 'Name'), t('promo.orders', 'Orders'), t('promo.revenue', 'Revenue'), t('promo.discount', 'Discount'), t('promo.avgOrderValue', 'Avg order'), t('promo.remaining', 'Left')].map((h, i) => <th key={i} className="px-3 py-2 text-start font-bold">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {d.offers.map((o) => (
                            <tr key={o.offer_id || o.name} className="border-b border-gray-50">
                              <td className="px-3 py-2 font-semibold text-gray-900">{o.name || '—'}</td>
                              <td className="px-3 py-2 tabular-nums">{o.orders}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{money(o.revenue)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-amber-600">−{money(o.discount)}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{money(o.avg_order_value)}</td>
                              <td className="px-3 py-2 tabular-nums text-gray-500">{o.remaining == null ? '∞' : o.remaining}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="glass-card-solid overflow-hidden">
                  <p className="font-bold text-gray-900 p-4 pb-2">{t('promo.topCoupons', 'Coupons')}</p>
                  {!(d.coupons || []).length ? <p className="text-sm text-gray-400 px-4 pb-6">{t('promo.noCouponUse', 'No coupon was used in this period.')}</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">
                          {[t('promo.code', 'Code'), t('promo.uses', 'Uses'), t('promo.customers', 'Customers'), t('promo.revenue', 'Revenue'), t('promo.discount', 'Discount'), t('promo.avgOrderValue', 'Avg order')].map((h, i) => <th key={i} className="px-3 py-2 text-start font-bold">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {d.coupons.map((c) => (
                            <tr key={c.coupon_id || c.code} className="border-b border-gray-50">
                              <td className="px-3 py-2 font-mono font-bold text-gray-900">{c.code}</td>
                              <td className="px-3 py-2 tabular-nums">{c.uses}</td>
                              <td className="px-3 py-2 tabular-nums">{c.customers}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{money(c.revenue)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-amber-600">−{money(c.discount)}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{money(c.avg_order_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card-solid overflow-hidden">
                <p className="font-bold text-gray-900 p-4 pb-2">{t('promo.topProducts', 'Products sold at a discount')}</p>
                {!(d.top_products || []).length ? (
                  <EmptyState icon={Tag} title={t('promo.noDiscountedProducts', 'Nothing was sold at a discount yet')} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">
                        {[t('promo.product', 'Product'), t('promo.units', 'Units'), t('promo.discount', 'Discount'), t('promo.revenue', 'Revenue')].map((h, i) => <th key={i} className="px-3 py-2 text-start font-bold">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {d.top_products.map((p) => (
                          <tr key={p.product_id} className="border-b border-gray-50">
                            <td className="px-3 py-2 font-semibold text-gray-900">{p.name}</td>
                            <td className="px-3 py-2 tabular-nums">{p.units}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-amber-600">−{money(p.discount)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{money(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
    </DashboardLayout>
  );
}
