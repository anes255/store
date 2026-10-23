import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, Clock, Coins, RefreshCw, Download, BadgeCheck, Settings2, Lock, Plus, ListOrdered, Banknote, XCircle } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { workersApi } from '../../../utils/api';
import { formatMoney, formatMulti, approxConversions } from '../../../utils/money';
import { dangerConfirm } from '../../../components/shared/DangerConfirm';
import { Avatar, StatusBadge, StatCard, Skeleton, EmptyState, Sheet, useRuleLabel, MONTHS } from './shared';

const due = (i) => (parseFloat(i.net_amount) || 0) + (parseFloat(i.adjustments) || 0);

export default function Payroll() {
  const { t, i18n } = useTranslation();
  const { currentStore } = useStoreManagement();
  const { can } = useStaffAccess();
  const sid = currentStore?.id;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [fWorker, setFWorker] = useState('');
  const [fJob, setFJob] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [fxOpen, setFxOpen] = useState(false);
  const canManage = can('payroll_manage');
  const canPay = can('payroll_pay') || canManage;

  const load = async () => {
    setD(null);
    try { const { data } = await workersApi.payroll(sid, year, month); setD(data); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); setD({ items: [], totals: {} }); }
  };
  useEffect(() => { if (sid) load(); }, [sid, year, month]); // eslint-disable-line

  const items = useMemo(() => (d?.items || []).filter((i) => (!fWorker || i.staff_id === fWorker) && (!fJob || i.job_type === fJob) && (!fStatus || i.status === fStatus)), [d, fWorker, fJob, fStatus]);
  const workers = useMemo(() => [...new Map((d?.items || []).map((i) => [i.staff_id, i.worker_name])).entries()], [d]);
  const jobsList = useMemo(() => [...new Set((d?.items || []).map((i) => i.job_type).filter(Boolean))], [d]);
  const totals = d?.totals || {};
  const sum = (k) => Object.fromEntries(Object.entries(totals).map(([c, v]) => [c, v[k]]));
  const n = (i, a) => (i.counts && i.counts[a] != null ? i.counts[a] : (Array.isArray(i.breakdown) ? i.breakdown : []).filter((l) => l.action === a).reduce((s, l) => s + (l.count || 0), 0));
  const c = (i, a) => (Array.isArray(i.breakdown) ? i.breakdown : []).filter((l) => l.action === a).reduce((s, l) => s + (l.amount || 0), 0);
  const months = MONTHS(i18n.language);

  const recalc = async () => { setBusy(true); try { const { data } = await workersApi.calculatePayroll(sid, year, month); setD(data); toast.success(t('workers.recalculated', 'Payroll recalculated (approved lines unchanged)')); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); } setBusy(false); };
  const approveAll = async () => {
    if (!(await dangerConfirm({ title: t('workers.approveAllTitle', 'Approve this month\'s payroll?'), description: t('workers.approveAllDesc', 'Approved lines are locked: later order changes go into adjustments instead of changing them.'), holdLabel: t('workers.holdApprove', 'Hold to approve'), cancelLabel: t('workers.notYet', 'Not yet') }))) return;
    try { const { data } = await workersApi.approveAllPayroll(sid, year, month); toast.success(t('workers.approvedN', '{{n}} line(s) approved', { n: data.approved })); load(); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); }
  };
  const exportCsv = async () => {
    try { const r = await workersApi.exportPayroll(sid, year, month); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `payroll-${year}-${String(month).padStart(2, '0')}.csv`; a.click(); URL.revokeObjectURL(a.href); } catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('workers.payroll', 'Payroll')}</h1><p className="text-sm text-gray-400">{t('workers.payrollSubtitle', 'Worker salaries and commissions, month by month')}</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-1.5"><Download size={15} />{t('workers.export', 'Export')}</button>
          {canManage && <button onClick={() => setFxOpen(true)} className="btn-secondary text-sm flex items-center gap-1.5" title={t('workers.exchangeRates', 'Exchange rates')}><Settings2 size={15} /></button>}
          {canManage && <button onClick={recalc} disabled={busy} className="btn-secondary text-sm flex items-center gap-1.5"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} />{t('workers.recalculate', 'Recalculate')}</button>}
          {canManage && <button onClick={approveAll} className="btn-primary text-sm flex items-center gap-1.5"><BadgeCheck size={15} />{t('workers.approveAll', 'Approve all')}</button>}
        </div>
      </div>

      <div className="glass-card-solid p-3 mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select className="input-field text-sm" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <select className="input-field text-sm" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>{[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y}>{y}</option>)}</select>
        <select className="input-field text-sm" value={fWorker} onChange={(e) => setFWorker(e.target.value)}><option value="">{t('workers.allWorkers', 'All workers')}</option>{workers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select className="input-field text-sm" value={fJob} onChange={(e) => setFJob(e.target.value)}><option value="">{t('workers.allJobs', 'All jobs')}</option>{jobsList.map((j) => <option key={j} value={j}>{t(`workers.jobName.${j}`, j)}</option>)}</select>
        <select className="input-field text-sm col-span-2 md:col-span-1" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">{t('workers.allStatuses', 'All statuses')}</option>{['calculated', 'approved', 'paid', 'cancelled'].map((s) => <option key={s} value={s}>{t(`workers.${s}`, s)}</option>)}</select>
      </div>

      {!d ? <Skeleton className="h-64" /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <StatCard icon={Wallet} label={t('workers.totalPayroll', 'Total payroll')} value={formatMulti(sum('total'))} />
          <StatCard icon={CheckCircle} tone="green" label={t('workers.paid', 'Paid')} value={formatMulti(sum('paid'))} />
          <StatCard icon={Clock} tone="amber" label={t('workers.pending', 'Pending')} value={formatMulti(sum('pending'))} />
          <StatCard icon={Coins} tone="violet" label={t('workers.commissions', 'Commissions')} value={formatMulti(sum('commission'))} />
        </div>
        {d.fx_rates && Object.entries(totals).map(([cur, v]) => { const conv = approxConversions(v.total, cur, d.fx_rates); return conv.length ? <p key={cur} className="text-[11px] text-gray-400 -mt-2 mb-3">{formatMoney(v.total, cur)} ≈ {conv.map((x) => formatMoney(x.amount, x.currency)).join(' ≈ ')} · <i>{t('workers.approx', 'Approximate conversion')}</i></p> : null; })}

        {!items.length ? <EmptyState icon={Wallet} title={t('workers.noPayrollMonth', 'No payroll for this month')} hint={t('workers.noPayrollHint', 'Give your workers pay rules (on their profile) and press Recalculate.')} /> : <>
          <div className="hidden lg:block glass-card-solid overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">{[t('workers.worker', 'Worker'), t('workers.job', 'Job'), t('workers.fixedSalary', 'Fixed salary'), t('workers.completedOrders', 'Completed'), t('workers.completedCommission', 'Completed comm.'), t('workers.confirmedOrders', 'Confirmed'), t('workers.confirmedCommission', 'Confirmed comm.'), t('workers.bonuses', 'Bonuses'), t('workers.deductions', 'Deductions'), t('workers.netSalary', 'Net salary'), t('workers.status', 'Status')].map((h) => <th key={h} className="px-3 py-3 text-start whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{items.map((i) => (
                <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer" onClick={() => setOpenId(i.id)}>
                  <td className="px-3 py-2.5"><div className="flex items-center gap-2.5"><Avatar worker={{ name: i.worker_name, avatar: i.avatar }} size={34} /><span className="font-bold text-gray-900 whitespace-nowrap">{i.worker_name}</span></div></td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{i.job_type ? t(`workers.jobName.${i.job_type}`, i.job_type) : '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(i.fixed_amount, i.currency)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{n(i, 'completed') || '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c(i, 'completed') ? formatMoney(c(i, 'completed'), i.currency) : '—'}</td>
                  <td className="px-3 py-2.5 tabular-nums">{n(i, 'confirmed') || '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{c(i, 'confirmed') ? formatMoney(c(i, 'confirmed'), i.currency) : '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{parseFloat(i.bonuses) ? formatMoney(i.bonuses, i.currency) : '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{parseFloat(i.deductions) ? formatMoney(i.deductions, i.currency) : '—'}</td>
                  <td className="px-3 py-2.5 font-black text-gray-900 whitespace-nowrap">{formatMoney(due(i), i.currency)}{i.locked && <Lock size={11} className="inline ms-1 text-gray-400" />}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={i.status} /></td>
                </tr>))}</tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-2">
            {items.map((i) => (
              <button key={i.id} onClick={() => setOpenId(i.id)} className="w-full glass-card-solid p-3 flex items-center gap-3 text-start">
                <Avatar worker={{ name: i.worker_name, avatar: i.avatar }} size={42} />
                <span className="flex-1 min-w-0"><span className="block font-bold text-gray-900 truncate">{i.worker_name}</span><span className="block text-[11px] text-gray-400 truncate">{i.job_type ? t(`workers.jobName.${i.job_type}`, i.job_type) : ''}</span></span>
                <span className="text-end shrink-0"><span className="block font-black text-gray-900">{formatMoney(due(i), i.currency)}</span><StatusBadge status={i.status} /></span>
              </button>))}
          </div>
        </>}
      </>}
      <PayrollItemSheet sid={sid} id={openId} onClose={() => setOpenId(null)} onChanged={load} canManage={canManage} canPay={canPay} />
      <FxSheet open={fxOpen} onClose={() => setFxOpen(false)} sid={sid} rates={d?.fx_rates} onSaved={load} />
    </DashboardLayout>
  );
}

function PayrollItemSheet({ sid, id, onClose, onChanged, canManage, canPay }) {
  const { t, i18n } = useTranslation();
  const ruleLabel = useRuleLabel();
  const [d, setD] = useState(null);
  const [edit, setEdit] = useState({ bonuses: '', deductions: '', notes: '' });
  const [pay, setPay] = useState(null);
  const [adj, setAdj] = useState(null);
  const [orders, setOrders] = useState(null);
  const load = async () => { try { const { data } = await workersApi.payrollItem(sid, id); setD(data); setEdit({ bonuses: String(parseFloat(data.item.bonuses) || ''), deductions: String(parseFloat(data.item.deductions) || ''), notes: data.item.notes || '' }); } catch (e) { toast.error('Failed'); } };
  useEffect(() => { setD(null); setPay(null); setAdj(null); setOrders(null); if (id) load(); }, [id]); // eslint-disable-line
  if (!id) return null;
  const it = d?.item;
  const cur = it?.currency;
  const adjTotal = (d?.adjustments || []).reduce((s, a) => s + parseFloat(a.amount), 0);
  const paid = (d?.payments || []).reduce((s, p) => s + parseFloat(p.amount), 0);
  const total = it ? (parseFloat(it.net_amount) || 0) + adjTotal : 0;
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); await load(); onChanged(); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); } };
  const conv = it ? approxConversions(total, cur, d.fx_rates) : [];

  return (
    <Sheet open={!!id} onClose={onClose} wide title={t('workers.payrollDetails', 'Payroll details')}
      footer={it && <>
        {canManage && !it.locked && <button className="btn-ghost text-sm text-red-500 flex items-center gap-1" onClick={() => act(() => workersApi.cancelPayrollItem(sid, id), t('workers.cancelledMsg', 'Cancelled'))}><XCircle size={14} />{t('workers.cancelPayroll', 'Cancel')}</button>}
        {canManage && !it.locked && <button className="btn-secondary text-sm" onClick={() => act(() => workersApi.updatePayrollItem(sid, id, edit), t('workers.saved', 'Saved'))}>{t('workers.save', 'Save')}</button>}
        {canManage && (it.status === 'calculated' || it.status === 'draft') && <button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => act(() => workersApi.approvePayrollItem(sid, id), t('workers.approvedMsg', 'Approved and locked'))}><BadgeCheck size={14} />{t('workers.approve', 'Approve')}</button>}
        {canPay && it.status === 'approved' && <button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => setPay({ amount: String(Math.max(0, Math.round((total - paid) * 100) / 100)), method: 'cash', reference: '', paid_at: new Date().toISOString().slice(0, 10), notes: '' })}><Banknote size={14} />{t('workers.markPaid', 'Mark as paid')}</button>}
      </>}>
      {!d ? <Skeleton className="h-60" /> : <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar worker={d.worker || { name: it.worker_name }} size={48} />
          <div className="min-w-0 flex-1"><p className="font-black text-gray-900">{it.worker_name}</p><p className="text-xs text-gray-400">{it.job_type ? t(`workers.jobName.${it.job_type}`, it.job_type) : ''} · {MONTHS(i18n.language)[d.period.month - 1]} {d.period.year}</p></div>
          <StatusBadge status={it.status} />
        </div>
        {it.locked && it.status !== 'cancelled' && <p className="text-xs rounded-xl bg-violet-50 text-violet-700 px-3 py-2 flex items-center gap-1.5"><Lock size={12} />{t('workers.lockedNote', 'Approved and locked — later order changes are added as adjustments, the calculation itself never changes.')}</p>}

        {/* transparent calculation */}
        <div className="rounded-2xl border border-gray-200 p-4 space-y-2 text-sm">
          {(it.breakdown || []).map((l, i) => l.type === 'fixed_monthly'
            ? <div key={i} className="flex justify-between"><span className="text-gray-500">{t('workers.fixedSalary', 'Fixed salary')}</span><b>{formatMoney(l.amount, cur)}</b></div>
            : <div key={i} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-500">{ruleLabel(l.type)}<br /><span className="text-[12px] text-gray-700 font-semibold">{l.count} × {formatMoney(l.rate, cur)} = {formatMoney(l.amount, cur)}</span></span>
              {l.count > 0 && <button className="text-xs font-bold text-brand-600 flex items-center gap-1" onClick={async () => { const { data } = await workersApi.payrollItemOrders(sid, id, { action: l.action, limit: 200 }); setOrders(data); }}><ListOrdered size={13} />{t('workers.viewOrders', 'View orders')}</button>}
            </div>)}
          {!it.locked ? (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div><label className="input-label">{t('workers.bonuses', 'Bonuses')} ({cur})</label><input type="number" min="0" className="input-field" disabled={!canManage} value={edit.bonuses} onChange={(e) => setEdit({ ...edit, bonuses: e.target.value })} /></div>
              <div><label className="input-label">{t('workers.deductions', 'Deductions')} ({cur})</label><input type="number" min="0" className="input-field" disabled={!canManage} value={edit.deductions} onChange={(e) => setEdit({ ...edit, deductions: e.target.value })} /></div>
            </div>
          ) : <>
            {parseFloat(it.bonuses) > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('workers.bonuses', 'Bonuses')}</span><b>+{formatMoney(it.bonuses, cur)}</b></div>}
            {parseFloat(it.deductions) > 0 && <div className="flex justify-between"><span className="text-gray-500">{t('workers.deductions', 'Deductions')}</span><b>−{formatMoney(it.deductions, cur)}</b></div>}
          </>}
          {(d.adjustments || []).map((a) => <div key={a.id} className="flex justify-between gap-2"><span className="text-gray-500 min-w-0">{t('workers.adjustment', 'Adjustment')}: <i>{a.reason}</i></span><b className="shrink-0">{a.amount > 0 ? '+' : ''}{formatMoney(a.amount, cur)}</b></div>)}
          <div className="flex justify-between pt-2 border-t border-gray-100 text-base"><span className="font-black text-gray-900">{t('workers.total', 'Total')}</span><span className="font-black text-brand-600">{formatMoney(total, cur)}</span></div>
          {conv.length > 0 && <p className="text-[11px] text-gray-400 text-end">≈ {conv.map((x) => formatMoney(x.amount, x.currency)).join(' ≈ ')} · <i>{t('workers.approx', 'Approximate conversion')}</i></p>}
        </div>
        {it.locked && canManage && it.status !== 'cancelled' && <button className="text-xs font-bold text-brand-600 flex items-center gap-1" onClick={() => setAdj({ amount: '', reason: '' })}><Plus size={13} />{t('workers.addAdjustment', 'Add an adjustment')}</button>}

        {(d.payments || []).length > 0 && <div>
          <p className="text-xs font-black uppercase text-gray-400 mb-1.5">{t('workers.payments', 'Payments')}</p>
          {d.payments.map((p) => <div key={p.id} className="flex justify-between text-sm rounded-xl bg-gray-50 px-3 py-2 mb-1"><span>{new Date(p.paid_at).toLocaleDateString()} · {t(`workers.method.${p.method}`, { cash: 'Cash', bank_transfer: 'Bank transfer', ccp: 'CCP', baridimob: 'BaridiMob', other: 'Other' }[p.method] || p.method)}{p.reference ? ` · ${p.reference}` : ''}</span><b>{formatMoney(p.amount, p.currency)}</b></div>)}
          <p className="text-xs text-gray-500 text-end">{t('workers.paidOf', 'Paid {{p}} of {{t}}', { p: formatMoney(paid, cur), t: formatMoney(total, cur) })}</p>
        </div>}

        {pay && <div className="rounded-2xl border-2 border-brand-300 p-4 space-y-2">
          <p className="font-black text-gray-900">{t('workers.recordPayment', 'Record payment')}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div><label className="input-label">{t('workers.amount', 'Amount')} ({cur})</label><input type="number" className="input-field" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
            <div><label className="input-label">{t('workers.paymentDate', 'Payment date')}</label><input type="date" className="input-field" value={pay.paid_at} onChange={(e) => setPay({ ...pay, paid_at: e.target.value })} /></div>
            <div><label className="input-label">{t('workers.paymentMethod', 'Payment method')}</label><select className="input-field" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{['cash', 'bank_transfer', 'ccp', 'baridimob', 'other'].map((m) => <option key={m} value={m}>{t(`workers.method.${m}`, { cash: 'Cash', bank_transfer: 'Bank transfer', ccp: 'CCP', baridimob: 'BaridiMob', other: 'Other' }[m])}</option>)}</select></div>
            <div><label className="input-label">{t('workers.reference', 'Reference')}</label><input className="input-field" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></div>
          </div>
          <input className="input-field" placeholder={t('workers.notes', 'Notes')} value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} />
          <div className="flex justify-end gap-2"><button className="btn-ghost text-sm" onClick={() => setPay(null)}>{t('workers.cancel', 'Cancel')}</button><button className="btn-primary text-sm" onClick={() => act(() => workersApi.payPayrollItem(sid, id, pay), t('workers.paymentSaved', 'Payment recorded')).then(() => setPay(null))}>{t('workers.savePayment', 'Save payment')}</button></div>
        </div>}

        {adj && <div className="rounded-2xl border-2 border-violet-300 p-4 space-y-2">
          <p className="font-black text-gray-900">{t('workers.addAdjustment', 'Add an adjustment')}</p>
          <p className="text-[11px] text-gray-500">{t('workers.adjustHint', 'Positive to add, negative to deduct. The reason is kept in the history.')}</p>
          <div className="grid sm:grid-cols-[140px_1fr] gap-2"><input type="number" className="input-field" placeholder={`0 ${cur}`} value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} /><input className="input-field" placeholder={t('workers.reason', 'Reason')} value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><button className="btn-ghost text-sm" onClick={() => setAdj(null)}>{t('workers.cancel', 'Cancel')}</button><button className="btn-primary text-sm" onClick={() => act(() => workersApi.adjustPayrollItem(sid, id, adj), t('workers.saved', 'Saved')).then(() => setAdj(null))}>{t('workers.save', 'Save')}</button></div>
        </div>}

        {orders && <div>
          <p className="text-xs font-black uppercase text-gray-400 mb-1.5">{t('workers.ordersCounted', '{{n}} orders counted', { n: orders.total })}</p>
          <div className="max-h-72 overflow-y-auto space-y-1">{orders.orders.map((o) => (
            <a key={o.order_id + o.created_at} href={`/dashboard/orders?highlight=${o.order_id}`} className="flex justify-between gap-2 text-sm rounded-xl bg-gray-50 hover:bg-gray-100 px-3 py-1.5"><span className="truncate"><b>#{o.order_number}</b> <span className="text-gray-500">{o.customer_name}</span></span><span className="text-[11px] text-gray-400 shrink-0">{new Date(o.created_at).toLocaleDateString()}</span></a>
          ))}</div>
          {orders.total > orders.orders.length && <p className="text-[11px] text-gray-400 mt-1">{t('workers.firstN', 'Showing the first {{n}}', { n: orders.orders.length })}</p>}
        </div>}
      </div>}
    </Sheet>
  );
}

function FxSheet({ open, onClose, sid, rates, onSaved }) {
  const { t } = useTranslation();
  const [fx, setFx] = useState({ USD: '', EUR: '' });
  useEffect(() => { if (open) setFx({ USD: rates?.USD || '', EUR: rates?.EUR || '' }); }, [open, rates]);
  return (
    <Sheet open={open} onClose={onClose} title={t('workers.exchangeRates', 'Exchange rates')}
      footer={<button className="btn-primary text-sm" onClick={async () => { try { await workersApi.savePayrollSettings(sid, { fx_rates: fx }); toast.success(t('workers.saved', 'Saved')); onClose(); onSaved(); } catch { toast.error('Failed'); } }}>{t('workers.save', 'Save')}</button>}>
      <p className="text-sm text-gray-500 mb-3">{t('workers.fxHint', 'Only used to show approximate conversions next to totals. Salaries are always paid and stored in their own currency.')}</p>
      {['USD', 'EUR'].map((c) => <div key={c} className="mb-2"><label className="input-label">1 {c} = … DZD</label><input type="number" min="0" step="any" className="input-field" value={fx[c]} onChange={(e) => setFx({ ...fx, [c]: e.target.value })} /></div>)}
    </Sheet>
  );
}
