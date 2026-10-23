import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { ALL_PERMISSIONS, PERM_GROUPS } from '../../../utils/permissions';
import { formatMoney } from '../../../utils/money';

// Shared building blocks for the Workers / Payroll screens. Styling uses the
// dashboard's own classes (glass-card-solid, input-field, btn-primary, brand
// colours) so these pages follow the store's theme and dark mode.

export function Avatar({ worker, size = 40, className = '' }) {
  const { t } = useTranslation();
  const name = worker?.full_name || worker?.name || worker?.worker_name || '?';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {worker?.avatar
        ? <img src={worker.avatar} alt="" className="w-full h-full rounded-full object-cover border border-gray-200" />
        : <div className="w-full h-full rounded-full bg-brand-500/15 text-brand-600 font-bold grid place-items-center" style={{ fontSize: size * 0.36 }}>{initials}</div>}
      {worker?.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title={t('workers.online', 'Online')} />}
    </div>
  );
}

const STATUS_STYLE = {
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-200 text-gray-600', suspended: 'bg-red-100 text-red-700', pending: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-200 text-gray-600', calculated: 'bg-blue-100 text-blue-700', approved: 'bg-violet-100 text-violet-700', paid: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};
export function useStatusLabel() {
  const { t } = useTranslation();
  return (s) => ({
    active: t('workers.active', 'Active'), inactive: t('workers.inactive', 'Inactive'), suspended: t('workers.suspended', 'Suspended'), pending: t('workers.pendingInvite', 'Pending invitation'),
    draft: t('workers.draft', 'Draft'), calculated: t('workers.calculated', 'Calculated'), approved: t('workers.approved', 'Approved'), paid: t('workers.paid', 'Paid'), cancelled: t('workers.cancelled', 'Cancelled'),
  }[s] || s);
}
export function StatusBadge({ status }) {
  const label = useStatusLabel();
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_STYLE[status] || STATUS_STYLE.draft}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{label(status)}
  </span>;
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-500/10 text-brand-600', green: 'bg-emerald-500/10 text-emerald-600', red: 'bg-red-500/10 text-red-600', blue: 'bg-blue-500/10 text-blue-600', amber: 'bg-amber-500/10 text-amber-600', violet: 'bg-violet-500/10 text-violet-600' };
  return (
    <div className="glass-card-solid p-3 sm:p-4 flex items-center gap-3 min-w-0">
      {Icon && <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl grid place-items-center shrink-0 ${tones[tone]}`}><Icon size={20} /></div>}
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className={`font-black text-gray-900 leading-tight ${String(value).length > 14 ? 'text-sm sm:text-base break-words' : String(value).length > 8 ? 'text-base sm:text-lg break-words' : 'text-lg sm:text-xl truncate'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) { return <div className={`animate-pulse rounded-xl bg-gray-200/70 ${className}`} />; }

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="glass-card-solid p-10 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 grid place-items-center mx-auto mb-3"><Icon size={26} /></div>}
      <p className="font-bold text-gray-800">{title}</p>
      {hint && <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Modal on computers, bottom sheet on phones.
export function Sheet({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4" onMouseDown={onClose}>
      <div className={`bg-white w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-[pop_.2s_ease-out]`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-gray-300" />
          <h2 className="text-lg font-black text-gray-900 min-w-0 truncate">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>, document.body);
}

// Grouped permission checkboxes. `allowed` (Set) limits what can be ticked
// (a staff manager can only hand out permissions they hold).
export function PermissionPicker({ value = [], onChange, allowed = null, compact = false }) {
  const { t } = useTranslation();
  const set = new Set(value);
  const toggle = (k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); onChange([...n]); };
  const groupLabel = (g) => t(`workers.permGroup.${g.toLowerCase()}`, g);
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {PERM_GROUPS.map((g) => {
        const perms = ALL_PERMISSIONS.filter((p) => p.group === g);
        const allOn = perms.every((p) => set.has(p.key));
        return (
          <div key={g} className="rounded-2xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">{groupLabel(g)}</p>
              <button type="button" onClick={() => { const n = new Set(set); perms.forEach((p) => { if (!allowed || allowed.has(p.key)) allOn ? n.delete(p.key) : n.add(p.key); }); onChange([...n]); }} className="text-[10px] font-bold text-brand-600 hover:underline">
                {allOn ? t('workers.none', 'None') : t('workers.all', 'All')}
              </button>
            </div>
            <div className="space-y-1">
              {perms.map((p) => {
                const on = set.has(p.key); const locked = allowed && !allowed.has(p.key);
                return (
                  <label key={p.key} className={`flex items-center gap-2 px-1.5 py-1 rounded-lg text-sm ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                    <span className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${on ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>{on && <Check size={11} strokeWidth={3} />}</span>
                    <input type="checkbox" className="hidden" checked={on} disabled={locked} onChange={() => toggle(p.key)} />
                    <span className="text-gray-700">{t(`workers.perm.${p.key}`, p.label)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const RULE_TYPES = ['fixed_monthly', 'per_confirmed', 'per_prepared', 'per_completed', 'per_shipped'];
export function useRuleLabel() {
  const { t } = useTranslation();
  return (type) => ({
    fixed_monthly: t('workers.rule.fixed_monthly', 'Fixed monthly salary'), per_confirmed: t('workers.rule.per_confirmed', 'Per confirmed order'),
    per_prepared: t('workers.rule.per_prepared', 'Per prepared order'), per_completed: t('workers.rule.per_completed', 'Per completed (delivered) order'),
    per_shipped: t('workers.rule.per_shipped', 'Per shipped order'),
  }[type] || type);
}
export function ruleSummary(rules, ruleLabel, t) {
  if (!rules?.length) return t('workers.noPayRules', 'No pay rules');
  return rules.map((r) => r.rule_type === 'fixed_monthly' ? `${formatMoney(r.amount, r.currency)} / ${t('workers.month', 'month')}` : `${formatMoney(r.amount, r.currency)} / ${ruleLabel(r.rule_type).replace(/^(Per|Par|لكل)\s*/i, '')}`).join(' + ');
}

// Compensation rules: several lines, each with its own amount + currency.
export function RulesEditor({ rules, onChange, defaultCurrency = 'DZD' }) {
  const { t } = useTranslation();
  const ruleLabel = useRuleLabel();
  const update = (i, patch) => onChange(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const used = new Set(rules.map((r) => r.rule_type + r.currency));
  const fixed = rules.filter((r) => r.rule_type === 'fixed_monthly').reduce((s, r) => ({ ...s, [r.currency]: (s[r.currency] || 0) + (Number(r.amount) || 0) }), {});
  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-3 space-y-2">
          <select className="input-field !py-2 text-sm w-full" value={r.rule_type} onChange={(e) => update(i, { rule_type: e.target.value })}>
            {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{ruleLabel(rt)}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="any" inputMode="decimal" className="input-field !py-2 text-sm flex-1 min-w-0" value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} placeholder="0" />
            <select className="input-field !py-2 text-sm !w-24 shrink-0" value={r.currency} onChange={(e) => update(i, { currency: e.target.value })}>
              {['DZD', 'USD', 'EUR'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="button" onClick={() => onChange(rules.filter((_, j) => j !== i))} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {RULE_TYPES.filter((rt) => !used.has(rt + defaultCurrency)).map((rt) => (
          <button key={rt} type="button" onClick={() => onChange([...rules, { rule_type: rt, amount: '', currency: defaultCurrency }])}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-gray-300 text-xs font-bold text-gray-500 hover:border-brand-400 hover:text-brand-600">
            <Plus size={12} />{ruleLabel(rt)}
          </button>
        ))}
      </div>
      {rules.length > 0 && (
        <div className="rounded-2xl bg-gray-50 p-3 text-sm space-y-1">
          <p className="text-[10px] font-black uppercase text-gray-400">{t('workers.summary', 'Summary')}</p>
          {Object.entries(fixed).map(([c, v]) => <div key={c} className="flex justify-between"><span className="text-gray-500">{t('workers.fixedSalary', 'Fixed salary')}</span><b>{formatMoney(v, c)}</b></div>)}
          {rules.filter((r) => r.rule_type !== 'fixed_monthly' && Number(r.amount) > 0).map((r, i) => <div key={i} className="flex justify-between"><span className="text-gray-500">{ruleLabel(r.rule_type)}</span><b>{formatMoney(r.amount, r.currency)}</b></div>)}
        </div>
      )}
    </div>
  );
}

export function timeAgo(d, t) {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return t('workers.justNow', 'just now');
  if (s < 3600) return t('workers.minAgo', '{{n}} min ago', { n: Math.floor(s / 60) });
  if (s < 86400) return t('workers.hAgo', '{{n}} h ago', { n: Math.floor(s / 3600) });
  return t('workers.dAgo', '{{n}} d ago', { n: Math.floor(s / 86400) });
}

// Readable, translated activity details: order status changes, or
// "field: old → new" for account and payroll changes.
export function useActivityFormat() {
  const { t } = useTranslation();
  const status = (v) => { if (!v) return '—'; const m = String(v).match(/call_?(\d)$/); const k = m ? `call_failed_${m[1]}` : ({ under_preparation: 'preparing', awaiting_pickup: 'awaiting' }[v] || v); return t(`storePage.status_${k}`, String(v)); };
  const value = (k, v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (k === 'permissions' && Array.isArray(v)) return t('workers.nPermissions', '{{n}} permissions', { n: v.length });
    if (k === 'sent' && Array.isArray(v)) return v.length ? v.map((c) => t(`workers.channel.${c}`, c)).join(', ') : t('workers.notSentShort', 'not sent');
    if (k === 'compensation' && Array.isArray(v)) return t('workers.nRules', '{{n}} pay rule(s)', { n: v.length });
    if (Array.isArray(v)) return String(v.length);
    if (typeof v === 'boolean') return v ? t('workers.yes', 'Yes') : t('workers.no', 'No');
    if (typeof v === 'object') return Object.entries(v).map(([a, b]) => `${a} ${b}`).join(' · ');
    if (k === 'status') return t(`workers.${v}`, String(v));
    if (k === 'job') return t(`workers.jobName.${v}`, String(v));
    if (k === 'role') return /^(tpl_|st_)/.test(v) ? t('workers.customRole', 'custom role') : t(`workers.roleName.${v}`, String(v));
    if (k === 'method') return t(`workers.method.${v}`, String(v));
    if (['amount', 'net', 'bonuses', 'deductions'].includes(k) && !isNaN(Number(v))) return Number(v).toLocaleString();
    return String(v);
  };
  const field = (k) => t(`workers.field.${k}`, k);
  const details = (a) => {
    if (a.kind === 'order') return a.before || a.after ? `${status(a.before)} → ${status(a.after)}` : '';
    try {
      const j = JSON.parse(a.after || 'null'); if (!j) return '';
      if (Array.isArray(j.after)) return `${field('compensation')}: ${value('compensation', j.before)} → ${value('compensation', j.after)}`;
      if (j.before && j.after && typeof j.after === 'object' && !Array.isArray(j.after)) return Object.keys(j.after).filter((k) => JSON.stringify(j.before[k]) !== JSON.stringify(j.after[k])).map((k) => `${field(k)}: ${value(k, j.before[k])} → ${value(k, j.after[k])}`).join(' · ').slice(0, 240);
      const src = j.after && typeof j.after === 'object' && !Array.isArray(j.after) ? j.after : (j.before && !j.after ? j.before : j);
      return Object.entries(src).filter(([k]) => !['after', 'before', 'id', 'scope', 'is_default', 'description', 'created_at', 'updated_at'].includes(k)).map(([k, v]) => `${field(k)}: ${value(k, v)}`).join(' · ').slice(0, 240);
    } catch { const m = String(a.after || '').match(/^→\s*(\S+)$/); return m ? `→ ${status(m[1])}` : String(a.after || '').slice(0, 160); }
  };
  const entity = (type) => t(`workers.entityType.${type}`, type);
  return { status, value, field, details, entity };
}

export function useActionLabel() {
  const { t } = useTranslation();
  return (a) => ({
    confirmed: t('workers.act.confirmed', 'Confirmed order'), prepared: t('workers.act.prepared', 'Prepared order'), completed: t('workers.act.completed', 'Order delivered'),
    shipped: t('workers.act.shipped', 'Shipped order'), cancelled: t('workers.act.cancelled', 'Cancelled / rejected order'), preparing: t('workers.act.preparing', 'Started preparing'),
    assigned: t('workers.act.assigned', 'Order assigned'), unassigned: t('workers.act.unassigned', 'Order unassigned'), called: t('workers.act.called', 'Called customer'), status_change: t('workers.act.status_change', 'Changed status'),
    worker_login: t('workers.act.worker_login', 'Logged in'), worker_created: t('workers.act.worker_created', 'Worker created'), worker_updated: t('workers.act.worker_updated', 'Worker edited'),
    worker_inactive: t('workers.act.worker_inactive', 'Worker disabled'), worker_suspended: t('workers.act.worker_suspended', 'Worker suspended'), worker_enabled: t('workers.act.worker_enabled', 'Worker enabled'),
    worker_deleted: t('workers.act.worker_deleted', 'Worker deleted'), compensation_changed: t('workers.act.compensation_changed', 'Salary / commission changed'),
    role_created: t('workers.act.role_created', 'Role created'), role_updated: t('workers.act.role_updated', 'Role changed'), role_deleted: t('workers.act.role_deleted', 'Role deleted'),
    payroll_calculated: t('workers.act.payroll_calculated', 'Payroll calculated'), payroll_approved: t('workers.act.payroll_approved', 'Payroll approved'), payroll_paid: t('workers.act.payroll_paid', 'Payroll paid'),
    payroll_adjusted: t('workers.act.payroll_adjusted', 'Payroll adjusted'), payroll_cancelled: t('workers.act.payroll_cancelled', 'Payroll cancelled'), payroll_item_edited: t('workers.act.payroll_item_edited', 'Bonus / deduction changed'),
    worker_password_reset: t('workers.act.worker_password_reset', 'Password reset'), worker_password_changed: t('workers.act.worker_password_changed', 'Password changed'), worker_sessions_revoked: t('workers.act.worker_sessions_revoked', 'Logged out everywhere'),
    worker_invited: t('workers.act.worker_invited', 'Invitation sent'), worker_invite_accepted: t('workers.act.worker_invite_accepted', 'Invitation accepted'), worker_reset_link: t('workers.act.worker_reset_link', 'Reset link sent'),
    order_status_change: t('workers.act.order_status_change', 'Order status changed'), job_type_created: t('workers.act.job_type_created', 'Job type created'), worker_store_added: t('workers.act.worker_store_added', 'Access to another store'),
    order_dispatched: t('workers.act.order_dispatched', 'Order sent to carrier'), product_create: t('workers.act.product_create', 'Product created'), product_edit: t('workers.act.product_edit', 'Product edited'),
    product_delete: t('workers.act.product_delete', 'Product deleted'), settings_edit: t('workers.act.settings_edit', 'Settings changed'), staff_create: t('workers.act.staff_create', 'Team member added'),
    staff_edit: t('workers.act.staff_edit', 'Team member edited'), login: t('workers.act.login', 'Logged in'), exchange_rates_updated: t('workers.act.exchange_rates_updated', 'Exchange rates changed'),
  }[a] || String(a || '').replace(/_/g, ' '));
}

export const MONTHS = (lng) => Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString(lng === 'ar' ? 'ar-DZ' : lng === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' }));
