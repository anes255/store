import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

// Pieces the Offers, Coupons and Promotion analytics pages all use, so the
// three read as one section rather than three separate screens.

export function StatusBadge({ status, startsAt, endsAt }) {
  const { t } = useTranslation();
  const now = Date.now();
  let key = status === 'paused' ? 'paused' : 'active';
  if (key === 'active' && endsAt && new Date(endsAt).getTime() < now) key = 'expired';
  if (key === 'active' && startsAt && new Date(startsAt).getTime() > now) key = 'scheduled';
  const style = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-gray-100 text-gray-500 border-gray-200',
    expired: 'bg-red-50 text-red-600 border-red-200',
    scheduled: 'bg-blue-50 text-blue-600 border-blue-200',
  }[key];
  const label = {
    active: t('promo.statusActive', 'Active'),
    paused: t('promo.statusPaused', 'Paused'),
    expired: t('promo.statusExpired', 'Expired'),
    scheduled: t('promo.statusScheduled', 'Scheduled'),
  }[key];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${style}`}>{label}</span>;
}

// A panel that slides in from the side on a computer and covers the screen on
// a phone — the create/edit surface for both offers and coupons.
export function Drawer({ open, onClose, title, subtitle, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} h-full flex flex-col shadow-2xl sm:rounded-s-3xl animate-[slideIn_.2s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-gray-900 truncate">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 shrink-0"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
        {footer && <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="input-label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" className="mt-1 shrink-0" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        {hint && <span className="block text-[11px] text-gray-400 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="glass-card-solid py-16 px-6 text-center">
      {Icon && <Icon size={40} className="mx-auto text-gray-300 mb-3" />}
      <p className="font-bold text-gray-700">{title}</p>
      {hint && <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="glass-card-solid p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card-solid py-12 px-6 text-center">
      <p className="font-bold text-red-600">{t('promo.loadFailed', 'Could not load this')}</p>
      {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
      {onRetry && <button onClick={onRetry} className="btn-ghost text-sm mt-4">{t('promo.retry', 'Try again')}</button>}
    </div>
  );
}

// Money the way the store writes it, in the language the admin is reading.
export function useMoney(currency = 'DZD') {
  const { i18n } = useTranslation();
  return (v) => {
    const n = Number(v) || 0;
    const lang = (i18n.language || 'en').slice(0, 2);
    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: currency === 'DZD' ? 0 : 2 }).format(n);
    } catch {
      return `${n.toLocaleString(locale)} ${currency}`;
    }
  };
}

// <input type="datetime-local"> wants a local "YYYY-MM-DDTHH:mm" string; the
// API speaks ISO. These two keep the boxes and the database in step without
// the value drifting by the timezone offset each time it is edited.
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export function Pagination({ page, pageSize, total, onPage }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 text-[11px] font-bold text-gray-500">
      <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}</span>
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}
        className="w-7 h-7 rounded-lg hover:bg-gray-100 disabled:opacity-30">‹</button>
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages}
        className="w-7 h-7 rounded-lg hover:bg-gray-100 disabled:opacity-30">›</button>
      <span className="sr-only">{t('promo.page', 'Page')} {page}/{pages}</span>
    </div>
  );
}
