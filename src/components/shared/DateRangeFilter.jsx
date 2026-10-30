import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, X } from 'lucide-react';

// One date filter for every page that shows dated data (analytics, orders,
// costs, activity, tracking…). Quick choices for the common cases plus two
// real calendars for "from date A to date B".
//
// value / onChange use { from, to } as 'YYYY-MM-DD' strings; {} means all time.

export const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const monthStart = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };

export const PRESETS = [
  { key: 'today', labelKey: 'dateFilter.today', fallback: 'Today', range: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { key: '7d', labelKey: 'dateFilter.last7', fallback: 'Last 7 days', range: () => ({ from: daysAgo(6), to: iso(new Date()) }) },
  { key: '30d', labelKey: 'dateFilter.last30', fallback: 'Last 30 days', range: () => ({ from: daysAgo(29), to: iso(new Date()) }) },
  { key: 'month', labelKey: 'dateFilter.thisMonth', fallback: 'This month', range: () => ({ from: monthStart(), to: iso(new Date()) }) },
  { key: '90d', labelKey: 'dateFilter.last90', fallback: 'Last 90 days', range: () => ({ from: daysAgo(89), to: iso(new Date()) }) },
  { key: 'year', labelKey: 'dateFilter.lastYear', fallback: 'Last year', range: () => ({ from: daysAgo(364), to: iso(new Date()) }) },
  { key: 'all', labelKey: 'dateFilter.allTime', fallback: 'All time', range: () => ({}) },
];

/** Keeps rows between value.from and value.to for pages that filter in the browser. */
export function inRange(dateLike, value) {
  if (!value?.from && !value?.to) return true;
  const d = String(dateLike || '').slice(0, 10);
  if (!d) return false;
  if (value.from && d < value.from) return false;
  if (value.to && d > value.to) return false;
  return true;
}

export default function DateRangeFilter({ value, onChange, align = 'end', className = '', compact = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: value?.from || '', to: value?.to || '' });
  const box = useRef(null);

  useEffect(() => { setDraft({ from: value?.from || '', to: value?.to || '' }); }, [value?.from, value?.to]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const active = PRESETS.find((p) => {
    const r = p.range();
    return (r.from || '') === (value?.from || '') && (r.to || '') === (value?.to || '');
  });
  const label = active
    ? t(active.labelKey, active.fallback)
    : `${value?.from || '…'} → ${value?.to || '…'}`;

  const apply = () => {
    // A backwards range is almost always the two boxes filled in the wrong
    // order, so swap instead of showing an error.
    const from = draft.from || '';
    const to = draft.to || '';
    onChange(from && to && from > to ? { from: to, to: from } : { ...(from && { from }), ...(to && { to }) });
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={box}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="input-field text-sm !py-1.5 !px-3 flex items-center gap-2 whitespace-nowrap min-w-[150px]">
        <Calendar size={14} className="text-gray-400 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {open && (
        <div className={`absolute z-50 mt-2 w-[290px] rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 p-3 ${align === 'start' ? 'start-0' : 'end-0'}`}>
          {!compact && (
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {PRESETS.map((p) => (
                <button key={p.key} type="button" onClick={() => { onChange(p.range()); setOpen(false); }}
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold ${active?.key === p.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                  {t(p.labelKey, p.fallback)}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase text-gray-400">{t('dateFilter.from', 'From')}</span>
              <input type="date" className="input-field text-sm !py-1.5 w-full" value={draft.from} max={draft.to || undefined}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase text-gray-400">{t('dateFilter.to', 'To')}</span>
              <input type="date" className="input-field text-sm !py-1.5 w-full" value={draft.to} min={draft.from || undefined}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" className="btn-ghost text-xs flex items-center gap-1 flex-1" onClick={() => { onChange({}); setOpen(false); }}>
              <X size={12} />{t('dateFilter.clear', 'Clear')}
            </button>
            <button type="button" className="btn-primary text-xs flex-1" onClick={apply}>{t('dateFilter.apply', 'Apply')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
