import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ShieldCheck, ThumbsUp, Flag, Camera, Video, X, ChevronDown, MessageSquare, Star } from 'lucide-react';
import { storeApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import { Stars, CriterionBar } from './StarRating';
import ReviewForm, { CRITERIA } from './ReviewForm';

// The review section on a product page: what everyone scored it, what they
// said, and a way to add your own.
//
// The summary arrives with the first request and is drawn immediately; the
// reviews themselves page in underneath, so a product with a hundred
// thousand of them opens as fast as one with none.

const PAGE = 10;

// A key for this browser, so a guest can be stopped from voting twice
// without pretending it identifies them.
function visitorKey() {
  try {
    let k = localStorage.getItem('visitorKey');
    if (!k) { k = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('visitorKey', k); }
    return k;
  } catch { return 'anon'; }
}

const REPORT_REASONS = ['spam', 'offensive', 'fake', 'personal_info', 'irrelevant', 'other'];

export default function ProductReviews({ storeSlug, productSlug, pc = '#111827' }) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.language || 'en').slice(0, 2) === 'ar';
  const authUser = useAuthStore((s) => (s.role === 'customer' ? s.user : null));

  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ star: 0, verified: false, photos: false, videos: false });
  const [sort, setSort] = useState('recent');
  const [voted, setVoted] = useState({});
  const [reporting, setReporting] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const params = useMemo(() => ({
    sort,
    ...(filter.star ? { star: filter.star } : {}),
    ...(filter.verified ? { verified: 1 } : {}),
    ...(filter.photos ? { with_photos: 1 } : {}),
    ...(filter.videos ? { with_videos: 1 } : {}),
  }), [sort, filter]);

  const load = useCallback((offset = 0) => {
    const first = offset === 0;
    if (first) setLoading(true); else setLoadingMore(true);
    storeApi.getProductReviews(storeSlug, productSlug, { ...params, limit: PAGE, offset })
      .then((r) => {
        const rows = r.data.reviews || [];
        setReviews((prev) => (first ? rows : [...prev, ...rows]));
        setTotal(r.data.total || 0);
        if (r.data.stats) setStats(r.data.stats);
      })
      .catch(() => { if (first) setReviews([]); })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [storeSlug, productSlug, params]);

  useEffect(() => { load(0); }, [load]);

  const vote = async (review) => {
    if (voted[review.id]) return;
    setVoted((v) => ({ ...v, [review.id]: true }));
    setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r)));
    try { await storeApi.voteReview(storeSlug, review.id, true, visitorKey()); }
    catch (e) {
      setVoted((v) => ({ ...v, [review.id]: false }));
      setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, helpful_count: Math.max(0, (r.helpful_count || 1) - 1) } : r)));
      toast.error(e?.response?.data?.error || t('store.voteFailed', 'Could not record that'));
    }
  };

  const report = async (reason) => {
    const review = reporting;
    setReporting(null);
    try {
      await storeApi.reportReview(storeSlug, review.id, { reason }, visitorKey());
      toast.success(t('store.reportThanks', 'Thank you — a moderator will look at it.'));
    } catch (e) { toast.error(e?.response?.data?.error || t('store.reportFailed', 'Could not send that')); }
  };

  const avg = Number(stats?.overall || stats?.avg_rating || 0);
  const count = Number(stats?.total || 0);
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, n: Number(stats?.[`r${s}`] || 0) }));
  const chip = (on) => `px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors ${
    on ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`;

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">{t('store.customerReviews', 'Customer Reviews')}</h2>
        <button onClick={() => setShowForm((s) => !s)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: pc }}>
          {showForm ? t('store.cancel', 'Cancel') : t('store.writeReview', 'Write a Review')}
        </button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl mb-6">
          <ReviewForm
            storeSlug={storeSlug} productSlug={productSlug} pc={pc}
            prefill={{ name: authUser?.name || authUser?.full_name || '', phone: authUser?.phone || '', customerId: authUser?.id }}
            onCancel={() => setShowForm(false)}
            onDone={() => { setShowForm(false); load(0); }}
          />
        </div>
      )}

      {count > 0 && (
        <div className="grid md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-8 mb-6 pb-6 border-b border-gray-100">
          <div className="text-center md:text-start">
            <p className="text-4xl font-black text-gray-900 leading-none">{avg.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">{t('store.outOf5', 'out of 5')}</p>
            <Stars value={avg} size={16} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">{t('store.nReviews', '{{n}} reviews', { n: count })}</p>
            {stats.verified_percent > 0 && (
              <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1 justify-center md:justify-start">
                <ShieldCheck size={12} />{t('store.verifiedPercent', 'Verified Purchase: {{n}}%', { n: stats.verified_percent })}
              </p>
            )}
          </div>

          <div className="space-y-1.5 self-center">
            {dist.map(({ star, n }) => {
              const pct = count ? Math.round((n / count) * 100) : 0;
              return (
                <button key={star} onClick={() => setFilter((f) => ({ ...f, star: f.star === star ? 0 : star }))}
                  className="w-full flex items-center gap-2 group" aria-label={`${star} stars`}>
                  <span className="text-[11px] text-gray-500 w-7 shrink-0 text-start">{star} ★</span>
                  <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden min-w-0">
                    <span className="block h-full rounded-full transition-all group-hover:opacity-80"
                      style={{ width: `${pct}%`, backgroundColor: filter.star === star ? pc : '#fbbf24' }} />
                  </span>
                  <span className="text-[11px] text-gray-400 w-9 text-end tabular-nums">{pct}%</span>
                </button>
              );
            })}
          </div>

          {stats.criteria && (
            <div className="space-y-2 self-center">
              {CRITERIA.map((c) => (
                <CriterionBar key={c.key} pc={pc}
                  label={t(`store.criteria.${c.key}`, isAr ? c.ar : c.label)}
                  value={stats.criteria[c.key]} />
              ))}
            </div>
          )}
        </div>
      )}

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          <button onClick={() => setFilter({ star: 0, verified: false, photos: false, videos: false })}
            className={chip(!filter.star && !filter.verified && !filter.photos && !filter.videos)}
            style={!filter.star && !filter.verified && !filter.photos && !filter.videos ? { backgroundColor: pc } : undefined}>
            {t('store.filterAll', 'All')}
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button key={s} onClick={() => setFilter((f) => ({ ...f, star: f.star === s ? 0 : s }))}
              className={chip(filter.star === s)} style={filter.star === s ? { backgroundColor: pc } : undefined}>
              {s} ★
            </button>
          ))}
          <button onClick={() => setFilter((f) => ({ ...f, verified: !f.verified }))}
            className={chip(filter.verified)} style={filter.verified ? { backgroundColor: pc } : undefined}>
            <ShieldCheck size={11} className="inline me-1" />{t('store.filterVerified', 'Verified')}
          </button>
          <button onClick={() => setFilter((f) => ({ ...f, photos: !f.photos }))}
            className={chip(filter.photos)} style={filter.photos ? { backgroundColor: pc } : undefined}>
            <Camera size={11} className="inline me-1" />{t('store.filterPhotos', 'With photos')}
          </button>
          <button onClick={() => setFilter((f) => ({ ...f, videos: !f.videos }))}
            className={chip(filter.videos)} style={filter.videos ? { backgroundColor: pc } : undefined}>
            <Video size={11} className="inline me-1" />{t('store.filterVideos', 'With video')}
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="ms-auto text-[11px] font-bold rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-600">
            <option value="recent">{t('store.sortRecent', 'Most recent')}</option>
            <option value="helpful">{t('store.sortHelpful', 'Most helpful')}</option>
            <option value="highest">{t('store.sortHighest', 'Highest rating')}</option>
            <option value="lowest">{t('store.sortLowest', 'Lowest rating')}</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
      ) : !reviews.length ? (
        <div className="text-center py-10">
          <Star size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-400 text-sm">
            {count ? t('store.noReviewsMatch', 'No reviews match those filters.')
              : t('store.noReviewsYet', 'No reviews yet. Be the first to review this product!')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: pc }}>
                  {(r.customer_name || '?')[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-bold text-sm text-gray-800">{r.customer_name}</p>
                    {r.verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                        <ShieldCheck size={10} />{t('store.verifiedPurchase', 'Verified Purchase')}
                      </span>
                    )}
                    {r.variant_label && <span className="text-[11px] text-gray-400">· {r.variant_label}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars value={r.overall_rating || r.rating} size={12} />
                    <span className="text-xs font-bold text-gray-700">{Number(r.overall_rating || r.rating).toFixed(1)}</span>
                    <span className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* the five, when they were given */}
              {CRITERIA.some((c) => r[`${c.key}_rating`]) && (
                <div className="grid sm:grid-cols-2 gap-x-5 gap-y-1 mt-3 ps-12">
                  {CRITERIA.filter((c) => r[`${c.key}_rating`]).map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500 truncate">{t(`store.criteria.${c.key}`, isAr ? c.ar : c.label)}</span>
                      <Stars value={r[`${c.key}_rating`]} size={10} />
                    </div>
                  ))}
                </div>
              )}

              {r.title && <p className="font-bold text-sm text-gray-900 mt-3 ps-12">{r.title}</p>}
              {r.content && <p className="text-sm text-gray-600 mt-1 ps-12 whitespace-pre-line">{r.content}</p>}

              {Array.isArray(r.media) && r.media.length > 0 && (
                <div className="flex gap-2 mt-3 ps-12 overflow-x-auto no-scrollbar">
                  {r.media.map((m) => (
                    <button key={m.id} onClick={() => setLightbox({ ...m, slug: storeSlug })}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-black/5">
                      {m.kind === 'video'
                        ? <span className="w-full h-full grid place-items-center bg-gray-900 text-white"><Video size={16} /></span>
                        : <img src={storeApi.reviewMediaUrl(storeSlug, m.id)} alt="" loading="lazy" className="w-full h-full object-cover" />}
                    </button>
                  ))}
                </div>
              )}

              {r.seller_response && (
                <div className="mt-3 ms-12 p-3 rounded-xl bg-white border-s-2" style={{ borderColor: pc }}>
                  <p className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: pc }}>
                    <MessageSquare size={11} />{t('store.sellerResponse', 'Store Response')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{r.seller_response}</p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3 ps-12">
                <button onClick={() => vote(r)} disabled={!!voted[r.id]}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1.5 border transition-colors ${
                    voted[r.id] ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 border-gray-200 hover:bg-white'}`}>
                  <ThumbsUp size={11} />{t('store.helpful', 'Helpful')}{r.helpful_count ? ` · ${r.helpful_count}` : ''}
                </button>
                <button onClick={() => setReporting(r)} className="text-[11px] text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
                  <Flag size={10} />{t('store.report', 'Report')}
                </button>
              </div>
            </article>
          ))}

          {reviews.length < total && (
            <button onClick={() => load(reviews.length)} disabled={loadingMore}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <ChevronDown size={14} />
              {loadingMore ? t('store.loading', 'Loading…') : t('store.showMoreReviews', 'Show more ({{n}} left)', { n: total - reviews.length })}
            </button>
          )}
        </div>
      )}

      {reporting && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setReporting(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-black text-gray-900 mb-1">{t('store.reportReview', 'Report this review')}</p>
            <p className="text-xs text-gray-400 mb-4">{t('store.reportWhy', 'Why are you reporting it?')}</p>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <button key={reason} onClick={() => report(reason)}
                  className="w-full text-start px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100">
                  {t(`store.reportReason.${reason}`, reason.replace('_', ' '))}
                </button>
              ))}
            </div>
            <button onClick={() => setReporting(null)} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-gray-500">
              {t('store.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center" onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
          {lightbox.kind === 'video'
            ? <video src={storeApi.reviewMediaUrl(lightbox.slug, lightbox.id)} controls autoPlay playsInline className="max-w-full max-h-[85vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
            : <img src={storeApi.reviewMediaUrl(lightbox.slug, lightbox.id)} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </div>
  );
}
