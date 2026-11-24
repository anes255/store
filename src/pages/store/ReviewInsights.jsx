import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Sparkles, ThumbsUp, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, Camera, Video } from 'lucide-react';
import api from '../../utils/api';
import { CRITERIA } from '../../components/shared/ReviewForm';

// What the reviews add up to: the criteria averages, how the overall has
// moved, the words customers keep using, and a summary.
//
// Everything here is counted from the reviews themselves. The AI, when a
// shop turns it on, only describes those numbers — it never invents a view
// nobody expressed.

const Bar = ({ label, value }) => {
  const v = Number(value) || 0;
  const tone = v >= 4.5 ? 'bg-emerald-500' : v >= 4 ? 'bg-lime-500' : v >= 3 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden min-w-0">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${(v / 5) * 100}%` }} />
      </span>
      <span className="text-xs font-bold text-gray-700 w-8 text-end tabular-nums">{v ? v.toFixed(1) : '—'}</span>
    </div>
  );
};

export default function ReviewInsights({ storeId }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!open || !storeId || analytics) return;
    api.get(`/manage/stores/${storeId}/review-analytics`).then((r) => setAnalytics(r.data)).catch(() => setAnalytics({ totals: {}, by_day: [] }));
    api.get(`/manage/stores/${storeId}/review-insights`).then((r) => setInsights(r.data)).catch(() => setInsights(null));
  }, [open, storeId, analytics]);

  const day = (v) => { try { return new Date(v).toLocaleDateString((i18n.language || 'en').slice(0, 2), { day: 'numeric', month: 'short' }); } catch { return v; } };
  const tt = analytics?.totals || {};

  return (
    <div className="glass-card-solid mb-6 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 text-start">
        <Sparkles size={15} className="text-brand-500" />
        <span className="font-bold text-sm text-gray-900 flex-1">{t('storePage.reviewInsights', 'Review insights')}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {!analytics ? (
            <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.avgRating', 'Avg Rating')}</p>
                  <p className="text-xl font-black text-gray-900">{tt.overall || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><ShieldCheck size={10} />{t('storePage.verified', 'Verified')}</p>
                  <p className="text-xl font-black text-gray-900">{tt.verified_percent || 0}%</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Camera size={10} />{t('storePage.withPhotos', 'With photos')}</p>
                  <p className="text-xl font-black text-gray-900">{tt.photo_percent || 0}%</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Video size={10} />{t('storePage.withVideos', 'With video')}</p>
                  <p className="text-xl font-black text-gray-900">{tt.video_percent || 0}%</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('storePage.byCriterion', 'By criterion')}</p>
                  <div className="space-y-1.5">
                    {CRITERIA.map((c) => <Bar key={c.key} label={t(`store.criteria.${c.key}`, c.label)} value={tt[c.key]} />)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('storePage.ratingTrend', 'Rating over time')}</p>
                  {!(analytics.by_day || []).some((d) => d.reviews) ? (
                    <p className="text-sm text-gray-400 py-8 text-center">{t('storePage.noReviewsRange', 'No reviews in this period.')}</p>
                  ) : (
                    <div style={{ width: '100%', height: 150 }}>
                      <ResponsiveContainer>
                        <AreaChart data={analytics.by_day} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                          <XAxis dataKey="day" tickFormatter={day} tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                          <Tooltip labelFormatter={day} />
                          <Area type="monotone" dataKey="overall" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {insights && (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-700">{insights.summary}</p>
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    {insights.loved?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1 mb-1"><ThumbsUp size={11} />{t('storePage.customersLove', 'Customers love')}</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {insights.loved.map((l) => <li key={l.area}>· {t(`store.criteria.${l.area.replace(/ /g, '_')}`, l.area)} — {l.score}</li>)}
                        </ul>
                      </div>
                    )}
                    {insights.problems?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-amber-600 uppercase flex items-center gap-1 mb-1"><AlertTriangle size={11} />{t('storePage.commonProblems', 'Customers mention')}</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {insights.problems.map((l) => <li key={l.area}>· {t(`store.criteria.${l.area.replace(/ /g, '_')}`, l.area)} — {l.score}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  {(insights.positive_keywords?.length > 0 || insights.negative_keywords?.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {insights.positive_keywords.slice(0, 8).map((w) => (
                        <span key={`p-${w.word}`} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{w.word} · {w.count}</span>
                      ))}
                      {insights.negative_keywords.slice(0, 6).map((w) => (
                        <span key={`n-${w.word}`} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">{w.word} · {w.count}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(analytics.by_product || []).length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('storePage.byProduct', 'By product')}</p>
                  <table className="w-full text-sm">
                    <thead><tr className="text-[10px] uppercase text-gray-400 border-b border-gray-100">
                      {[t('storePage.product', 'Product'), t('storePage.total', 'Total'), t('storePage.avgRating', 'Avg'), t('storePage.verified', 'Verified'), t('storePage.negative', 'Negative')].map((h, i) =>
                        <th key={i} className="px-2 py-1.5 text-start font-bold">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {analytics.by_product.map((p) => (
                        <tr key={p.product_id} className="border-b border-gray-50">
                          <td className="px-2 py-1.5 font-semibold text-gray-800">{p.name || '—'}</td>
                          <td className="px-2 py-1.5 tabular-nums">{p.total}</td>
                          <td className="px-2 py-1.5 tabular-nums font-bold">{p.overall || '—'}</td>
                          <td className="px-2 py-1.5 tabular-nums text-gray-500">{p.verified}</td>
                          <td className="px-2 py-1.5 tabular-nums text-red-500">{p.negative}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
