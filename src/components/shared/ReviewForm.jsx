import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Camera, Video, X, Check, Loader2, ShieldCheck } from 'lucide-react';
import { storeApi } from '../../utils/api';
import { StarPicker } from './StarRating';

// Writing a review: the five criteria, the words, and the pictures.
//
// The overall score is shown as it is worked out but never sent — the server
// takes the mean of the criteria itself, so the number under a review is
// always the one its stars add up to.

export const CRITERIA = [
  { key: 'product_quality', label: 'Product Quality', ar: 'جودة المنتج' },
  { key: 'description_accuracy', label: 'Description Accuracy', ar: 'مطابقة الوصف' },
  { key: 'packaging', label: 'Packaging', ar: 'التغليف' },
  { key: 'delivery_speed', label: 'Delivery Speed', ar: 'سرعة التوصيل' },
  { key: 'value_for_money', label: 'Value for Money', ar: 'القيمة مقابل السعر' },
];

const MAX_TEXT = 1000;

// A photo straight off a phone is several megabytes of detail nobody will
// see in a 400px thumbnail. Shrinking it in the browser keeps the upload
// quick on a mobile connection.
async function shrinkImage(file, maxSide = 1600, quality = 0.82) {
  if (!/^image\//.test(file.type) || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}

const videoDuration = (file) => new Promise((resolve) => {
  try {
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(el.duration || 0); };
    el.onerror = () => resolve(0);
    el.src = URL.createObjectURL(file);
  } catch { resolve(0); }
});

export default function ReviewForm({ storeSlug, productSlug, pc = '#111827', prefill = {}, onDone, onCancel }) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.language || 'en').slice(0, 2) === 'ar';
  const [ratings, setRatings] = useState({});
  const [form, setForm] = useState({
    customer_name: prefill.name || '', customer_phone: prefill.phone || '', title: '', content: '',
  });
  const [photos, setPhotos] = useState([]);   // {file, url}
  const [video, setVideo] = useState(null);   // {file, url, duration}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eligibility, setEligibility] = useState(null);
  const photoInput = useRef(null);
  const videoInput = useRef(null);

  const limits = eligibility?.settings || { allow_photos: true, allow_videos: true, max_photos: 5, max_videos: 1, max_video_seconds: 30 };

  // What the stars add up to, shown live. The server recomputes it.
  const overall = useMemo(() => {
    const given = CRITERIA.map((c) => ratings[c.key]).filter((v) => v >= 1 && v <= 5);
    if (!given.length) return 0;
    return Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 10) / 10;
  }, [ratings]);

  // Whether this person may review, and which purchase it attaches to.
  useEffect(() => {
    const phone = String(form.customer_phone || '').replace(/\D/g, '');
    if (phone.length < 9 && !prefill.customerId) { setEligibility(null); return; }
    let dead = false;
    const h = setTimeout(() => {
      storeApi.reviewEligibility(storeSlug, productSlug, { phone: form.customer_phone, customer_id: prefill.customerId })
        .then((r) => { if (!dead) setEligibility(r.data); })
        .catch(() => { if (!dead) setEligibility(null); });
    }, 400);
    return () => { dead = true; clearTimeout(h); };
  }, [form.customer_phone, storeSlug, productSlug, prefill.customerId]);

  useEffect(() => () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    if (video) URL.revokeObjectURL(video.url);
  }, []); // eslint-disable-line

  const addPhotos = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    const room = limits.max_photos - photos.length;
    if (room <= 0) return toast.error(t('store.reviewMaxPhotos', 'Up to {{n}} photos', { n: limits.max_photos }));
    const picked = files.slice(0, room);
    const out = [];
    for (const f of picked) {
      if (!/^image\//.test(f.type)) { toast.error(t('store.reviewOnlyImages', 'Choose image files')); continue; }
      const small = await shrinkImage(f);
      out.push({ file: small, url: URL.createObjectURL(small) });
    }
    setPhotos((p) => [...p, ...out]);
  };

  const addVideo = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^video\//.test(f.type)) return toast.error(t('store.reviewOnlyVideo', 'Choose a video file'));
    const d = await videoDuration(f);
    if (d && d > limits.max_video_seconds) {
      return toast.error(t('store.reviewVideoTooLong', 'Videos must be under {{n}} seconds', { n: limits.max_video_seconds }));
    }
    setVideo({ file: f, url: URL.createObjectURL(f), duration: d });
  };

  const removePhoto = (i) => setPhotos((p) => { URL.revokeObjectURL(p[i].url); return p.filter((_, j) => j !== i); });
  const removeVideo = () => { if (video) URL.revokeObjectURL(video.url); setVideo(null); };

  const submit = async () => {
    if (!form.customer_name.trim()) return toast.error(t('store.reviewNameNeeded', 'Your name is required'));
    if (String(form.customer_phone || '').replace(/\D/g, '').length < 9) {
      return toast.error(t('store.reviewPhoneNeeded', 'Enter the phone number you used to order this product'));
    }
    if (!overall) return toast.error(t('store.reviewRateFirst', 'Give at least one rating'));

    setBusy(true); setProgress(0);
    try {
      const payload = { ...form, customer_id: prefill.customerId || undefined };
      CRITERIA.forEach((c) => { if (ratings[c.key]) payload[`${c.key}_rating`] = ratings[c.key]; });
      const { data } = await storeApi.submitReview(storeSlug, productSlug, payload);

      // The review is saved; the files follow. One failing upload must not
      // throw away what they wrote.
      const files = [...photos.map((p) => ({ file: p.file })), ...(video ? [{ file: video.file, duration: video.duration }] : [])];
      let done = 0;
      for (const f of files) {
        try {
          await storeApi.uploadReviewMedia(storeSlug, data.id, f.file, {
            duration: f.duration,
            onProgress: (p) => setProgress(Math.round(((done + p / 100) / files.length) * 100)),
          });
        } catch (err) {
          toast.error(err?.response?.data?.error || t('store.reviewMediaFailed', 'A file could not be uploaded'));
        }
        done += 1;
      }

      toast.success(data.auto_approved
        ? t('store.reviewPublished', 'Thank you — your review is live.')
        : t('store.reviewSubmitted', 'Review submitted! It will appear after approval.'));
      onDone?.(data);
    } catch (e) {
      toast.error(e?.response?.data?.error || t('store.reviewFailed', 'Could not submit your review'));
    }
    setBusy(false);
  };

  const blocked = eligibility && eligibility.can_review === false && eligibility.reason !== 'phone_required';
  const blockedMessage = {
    not_purchased: t('store.reviewNotBuyer', 'Only customers who bought this product can review it. Use the phone number from your order.'),
    already_reviewed: t('store.reviewAlready', 'You have already reviewed this purchase.'),
    disabled: t('store.reviewsOff', 'This store is not accepting reviews right now.'),
  }[eligibility?.reason];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-extrabold text-gray-900 mb-1">{t('store.rateYourExperience', 'Rate your experience')}</p>
        <p className="text-[11px] text-gray-400">{t('store.rateHint', 'Tap the stars for each part of your order.')}</p>
      </div>

      <div className="space-y-1">
        {CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm font-semibold text-gray-700 min-w-0 flex-1">{t(`store.criteria.${c.key}`, isAr ? c.ar : c.label)}</span>
            <div className="flex items-center gap-2 shrink-0">
              <StarPicker value={ratings[c.key] || 0} onChange={(v) => setRatings((r) => ({ ...r, [c.key]: v }))}
                size={22} label={t(`store.criteria.${c.key}`, isAr ? c.ar : c.label)} disabled={busy} />
              <span className="text-xs font-bold text-gray-400 w-7 text-end tabular-nums">{ratings[c.key] ? `${ratings[c.key]}/5` : '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {overall > 0 && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: `${pc}10` }}>
          <span className="text-sm text-gray-600">{t('store.overallRating', 'Overall')}</span>
          <span className="text-lg font-black" style={{ color: pc }}>{overall.toFixed(1)}</span>
          <span className="text-sm text-gray-400">/ 5</span>
          <span className="text-[11px] text-gray-400 ms-auto">{t('store.overallAuto', 'Worked out from your stars')}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <input className="input-field text-sm" placeholder={t('store.yourNameReq', 'Your name *')} value={form.customer_name}
          onChange={(e) => setForm({ ...form, customer_name: e.target.value })} disabled={busy} />
        <input type="tel" inputMode="tel" className="input-field text-sm" placeholder={t('store.reviewPhone', 'Phone used for your order *')}
          value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} disabled={busy} />
      </div>

      {eligibility?.can_review && (
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <ShieldCheck size={13} />{t('store.verifiedPurchase', 'Verified Purchase')}
          {eligibility.variant_label && <span className="text-gray-400 font-normal">· {eligibility.variant_label}</span>}
        </p>
      )}
      {blocked && <p className="text-[11px] font-semibold text-red-600">{blockedMessage}</p>}

      <input className="input-field text-sm" placeholder={t('store.reviewTitleOpt', 'Review title (optional)')} value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={busy} />

      <div>
        <textarea rows={4} maxLength={MAX_TEXT} className="input-field text-sm w-full"
          placeholder={t('store.tellUsAbout', 'Tell us about your experience…')}
          value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} disabled={busy} />
        <p className="text-[10px] text-gray-400 text-end">{form.content.length}/{MAX_TEXT}</p>
      </div>

      {(limits.allow_photos || limits.allow_videos) && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">{t('store.addPhotosVideo', 'Add photos or a short video')}</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} disabled={busy}
                  className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center"><X size={11} /></button>
              </div>
            ))}
            {video && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-black">
                <video src={video.url} className="w-full h-full object-cover" muted />
                <button type="button" onClick={removeVideo} disabled={busy}
                  className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center"><X size={11} /></button>
                {video.duration > 0 && <span className="absolute bottom-0.5 start-1 text-[9px] font-bold text-white">{Math.round(video.duration)}s</span>}
              </div>
            )}
            {limits.allow_photos && photos.length < limits.max_photos && (
              <button type="button" onClick={() => photoInput.current?.click()} disabled={busy}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 grid place-items-center text-gray-400 hover:border-gray-400">
                <Camera size={18} />
              </button>
            )}
            {limits.allow_videos && !video && (
              <button type="button" onClick={() => videoInput.current?.click()} disabled={busy}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 grid place-items-center text-gray-400 hover:border-gray-400">
                <Video size={18} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {t('store.mediaLimits', 'Up to {{p}} photos and {{v}} video of {{s}} seconds.', {
              p: limits.max_photos, v: limits.max_videos, s: limits.max_video_seconds })}
          </p>
          <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
          <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={addVideo} />
        </div>
      )}

      {busy && progress > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: pc }} />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700">{t('store.cancel', 'Cancel')}</button>
        )}
        <button type="button" onClick={submit} disabled={busy || blocked}
          className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: pc }}>
          {busy ? <><Loader2 size={15} className="animate-spin" />{t('store.submitting', 'Submitting...')}</>
            : <><Check size={15} />{t('store.submitReview', 'Submit Review')}</>}
        </button>
      </div>
    </div>
  );
}
