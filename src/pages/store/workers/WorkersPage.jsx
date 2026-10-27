import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, UserCheck, UserX, Wifi, Wallet, Coins, Search, Plus, Download, Eye, Edit, MoreHorizontal, Power, Ban, KeyRound, LogOut, Send, Trash2, Copy, Shuffle } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { workersApi } from '../../../utils/api';
import { formatMulti, formatMoney } from '../../../utils/money';
import { dangerConfirm } from '../../../components/shared/DangerConfirm';
import { Avatar, StatusBadge, StatCard, Skeleton, EmptyState, Sheet, useRuleLabel, ruleSummary, timeAgo } from './shared';
import AddWorkerWizard from './AddWorkerWizard';
import DistributeOrders from './DistributeOrders';

const earningsText = (e) => formatMulti(Object.fromEntries(Object.entries(e || {}).map(([c, v]) => [c, (v.fixed || 0) + (v.commission || 0)])));

export function WorkerActions({ worker, onChanged, compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentStore } = useStoreManagement();
  const sid = currentStore?.id;
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', h); window.addEventListener('scroll', close, true); window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [open]);
  // The menu lives in a portal with fixed coordinates so the table's scroll
  // box can't clip it; it opens upward when there isn't room below the button.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const b = btnRef.current.getBoundingClientRect();
    const h = menuRef.current?.offsetHeight || 0, w = 224, gap = 4, vh = window.innerHeight;
    const up = b.bottom + gap + h > vh - 8 && b.top - gap - h > 8;
    const left = Math.min(Math.max(8, b.right - w), window.innerWidth - w - 8);
    setPos({ left, top: up ? b.top - gap - h : b.bottom + gap, ready: h > 0 });
  }, [open, pos?.ready]);
  const run = async (fn, okMsg) => { setOpen(false); try { const r = await fn(); if (okMsg) toast.success(okMsg); onChanged?.(); return r; } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); } };
  const setStatus = (status) => run(() => workersApi.update(sid, worker.id, { status }), t('workers.saved', 'Saved'));
  const items = [
    worker.status !== 'active' && worker.status !== 'pending' && { icon: Power, label: t('workers.enable', 'Enable'), onClick: () => setStatus('active') },
    worker.status === 'active' && { icon: Power, label: t('workers.disable', 'Disable'), onClick: () => setStatus('inactive') },
    worker.status !== 'suspended' && { icon: Ban, label: t('workers.suspend', 'Suspend'), onClick: () => setStatus('suspended') },
    worker.status === 'pending' && { icon: Send, label: t('workers.resendInvite', 'Resend invitation'), onClick: async () => { const r = await run(() => workersApi.invite(sid, worker.id)); if (r) setSecret({ title: t('workers.invitationLink', 'Invitation link'), value: r.data.link, note: r.data.sent?.length ? t('workers.inviteSentVia', 'Invitation sent by {{c}}.', { c: r.data.sent.join(' + ') }) : t('workers.inviteNotSent', 'No email or WhatsApp could be sent — share the link yourself.') }); } },
    worker.status !== 'pending' && { icon: KeyRound, label: t('workers.resetPassword', 'Reset password'), onClick: async () => { const r = await run(() => workersApi.resetWorkerPassword(sid, worker.id, 'temp')); if (r) setSecret({ title: t('workers.newTempPassword', 'New temporary password'), value: r.data.password, note: t('workers.resetNote', 'The worker was logged out everywhere. Share this password privately.') }); } },
    { icon: LogOut, label: t('workers.logoutEverywhere', 'Log out everywhere'), onClick: () => run(() => workersApi.revokeSessions(sid, worker.id), t('workers.loggedOut', 'Worker logged out everywhere')) },
    { icon: Trash2, label: t('workers.delete', 'Delete'), danger: true, onClick: async () => { setOpen(false); if (!(await dangerConfirm({ title: t('workers.deleteTitle', 'Delete this worker?'), description: t('workers.deleteDesc', 'Their account in this store is removed. Past actions and payroll stay in the history.'), holdLabel: t('workers.holdDelete', 'Hold to delete worker'), cancelLabel: t('workers.keepWorker', 'Keep worker') }))) return; run(() => workersApi.remove(sid, worker.id), t('workers.deleted', 'Worker deleted')); } },
  ].filter(Boolean);
  return (
    <div className="relative inline-flex items-center gap-0.5" ref={ref}>
      {!compact && <>
        <button onClick={() => navigate(`/dashboard/workers/${worker.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-gray-100" title={t('workers.view', 'View')}><Eye size={15} /></button>
        <button onClick={() => navigate(`/dashboard/workers/${worker.id}?tab=overview&edit=1`)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-gray-100" title={t('workers.edit', 'Edit')}><Edit size={15} /></button>
      </>}
      <button ref={btnRef} onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><MoreHorizontal size={16} /></button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos?.ready ? 'visible' : 'hidden' }}
          className="z-[60] w-56 rounded-2xl bg-white shadow-2xl border border-gray-100 p-1.5">
          {items.map((it, i) => { const I = it.icon; return (
            <button key={i} onClick={it.onClick} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-start ${it.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}><I size={15} />{it.label}</button>
          ); })}
        </div>,
        document.body
      )}
      <Sheet open={!!secret} onClose={() => setSecret(null)} title={secret?.title}
        footer={<button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => navigator.clipboard?.writeText(secret.value).then(() => toast.success(t('store.copied', 'Copied!')))}><Copy size={14} />{t('workers.copy', 'Copy')}</button>}>
        <div className="rounded-2xl bg-gray-50 p-4 font-mono text-sm break-all select-all">{secret?.value}</div>
        <p className="text-xs text-gray-500 mt-2">{secret?.note}</p>
      </Sheet>
    </div>
  );
}

export default function WorkersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentStore } = useStoreManagement();
  const { can } = useStaffAccess();
  const ruleLabel = useRuleLabel();
  const sid = currentStore?.id;
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [job, setJob] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [wizard, setWizard] = useState(false);
  const [distribute, setDistribute] = useState(false);
  const canManage = can('workers_manage');

  const load = useCallback(async (offset = 0) => {
    if (!sid) return;
    if (!offset) setLoading(true);
    try {
      const { data: d } = await workersApi.list(sid, { q: q || undefined, job: job || undefined, role: role || undefined, status: status || undefined, offset, limit: 50 });
      setData(d); setRows((prev) => (offset ? [...prev, ...d.workers] : d.workers));
    } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setLoading(false);
  }, [sid, q, job, role, status]); // eslint-disable-line
  useEffect(() => { const h = setTimeout(() => load(0), q ? 300 : 0); return () => clearTimeout(h); }, [load]); // eslint-disable-line
  useEffect(() => { if (!sid) return; workersApi.jobTypes(sid).then((r) => setJobs(r.data.job_types || [])).catch(() => {}); workersApi.roles(sid).then((r) => setRoles(r.data.roles || [])).catch(() => {}); }, [sid]);

  const st = data?.stats || {};
  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Worker', 'Phone', 'Email', 'Job', 'Role', 'Status', 'Orders', 'Confirmed', 'Pay rules', 'Earnings this month'].map(esc).join(',')]
      .concat(rows.map((w) => [w.full_name, w.phone, w.email, w.job_type, w.role_name, w.status, w.orders, w.confirmed, ruleSummary(w.rules, ruleLabel, t), earningsText(w.earnings)].map(esc).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `workers-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const fixedOf = (w) => formatMulti(w.rules.filter((r) => r.rule_type === 'fixed_monthly').reduce((s, r) => ({ ...s, [r.currency]: (s[r.currency] || 0) + r.amount }), {}));
  const commissionOf = (w) => { const c = w.rules.filter((r) => r.rule_type !== 'fixed_monthly'); return c.length ? c.map((r) => `${formatMoney(r.amount, r.currency)}/${ruleLabel(r.rule_type).split(' ').slice(-2).join(' ')}`).join(', ') : '—'; };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('workers.title', 'Workers')}</h1>
          <p className="text-sm text-gray-400">{t('workers.subtitle', 'Manage your team, roles, permissions and payroll')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!rows.length} className="btn-secondary text-sm flex items-center gap-1.5"><Download size={15} />{t('workers.export', 'Export')}</button>
          {can('orders_assign') && <button onClick={() => setDistribute(true)} className="btn-secondary text-sm flex items-center gap-1.5"><Shuffle size={15} />{t('workers.distButton', 'Distribute orders')}</button>}
          {canManage && <button onClick={() => setWizard(true)} className="btn-primary text-sm flex items-center gap-1.5 shadow-lg"><Plus size={16} />{t('workers.addWorker', 'Add Worker')}</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 mb-5">
        {!data ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[74px]" />) : <>
          <StatCard icon={Users} label={t('workers.totalWorkers', 'Total workers')} value={st.total ?? 0} sub={st.new_this_month ? t('workers.newThisMonth', '+{{n}} this month', { n: st.new_this_month }) : null} />
          <StatCard icon={UserCheck} tone="green" label={t('workers.activeWorkers', 'Active')} value={st.active ?? 0} />
          <StatCard icon={UserX} tone="red" label={t('workers.inactiveWorkers', 'Inactive')} value={st.inactive ?? 0} />
          <StatCard icon={Wifi} tone="blue" label={t('workers.online', 'Online now')} value={st.online ?? 0} />
          <StatCard icon={Wallet} tone="violet" label={t('workers.payrollThisMonth', 'Payroll this month')} value={formatMulti(st.payroll_this_month)} sub={t('workers.estimated', 'estimated')} />
          <StatCard icon={Coins} tone="amber" label={t('workers.commissionsThisMonth', 'Commissions this month')} value={formatMulti(st.commissions_this_month)} />
        </>}
      </div>

      <div className="glass-card-solid p-3 mb-4 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !ps-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('workers.search', 'Search workers…')} /></div>
        <div className="grid grid-cols-3 gap-2 md:w-[480px]">
          <select className="input-field text-sm" value={job} onChange={(e) => setJob(e.target.value)}><option value="">{t('workers.allJobs', 'All jobs')}</option>{jobs.map((j) => <option key={j.id} value={j.name}>{t(`workers.jobName.${j.name}`, j.name)}</option>)}</select>
          <select className="input-field text-sm" value={role} onChange={(e) => setRole(e.target.value)}><option value="">{t('workers.allRoles', 'All roles')}</option>{roles.map((r) => <option key={r.id} value={r.id}>{t(`workers.roleName.${r.name}`, r.name)}</option>)}</select>
          <select className="input-field text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t('workers.allStatuses', 'All statuses')}</option>{['active', 'inactive', 'suspended', 'pending'].map((s) => <option key={s} value={s}>{s === 'pending' ? t('workers.pendingInvite', 'Pending invitation') : t(`workers.${s}`, s)}</option>)}</select>
        </div>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        : !rows.length ? (
          <EmptyState icon={Users} title={q || job || role || status ? t('workers.noMatch', 'No worker matches these filters') : t('workers.empty', 'No workers yet')}
            hint={t('workers.emptyHint', 'Add your confirmers, preparers and other team members. Each one gets their own login and only sees what you allow.')}
            action={canManage && !(q || job || role || status) && <button onClick={() => setWizard(true)} className="btn-primary text-sm inline-flex items-center gap-1.5"><Plus size={15} />{t('workers.addWorker', 'Add Worker')}</button>} />
        ) : <>
          {/* desktop table */}
          <div className="hidden lg:block glass-card-solid overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                {[t('workers.worker', 'Worker'), t('workers.job', 'Job'), t('workers.role', 'Role'), t('workers.status', 'Status'), t('workers.orders', 'Orders'), t('workers.confirmed', 'Confirmed'), t('workers.fixedSalary', 'Fixed salary'), t('workers.commission', 'Commission'), t('workers.totalEarnings', 'Total earnings'), t('workers.lastActivity', 'Last activity'), ''].map((h, i) => <th key={i} className="px-3 py-3 text-start font-bold whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>{rows.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer" onClick={(e) => { if (!e.target.closest('button')) navigate(`/dashboard/workers/${w.id}`); }}>
                  <td className="px-3 py-2.5"><div className="flex items-center gap-2.5 min-w-[180px]"><Avatar worker={w} size={38} /><div className="min-w-0"><p className="font-bold text-gray-900 truncate">{w.full_name}</p><p className="text-[11px] text-gray-400 truncate" dir="ltr">{w.phone || w.email}</p></div></div></td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{w.job_type ? t(`workers.jobName.${w.job_type}`, w.job_type) : '—'}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{w.role_name ? t(`workers.roleName.${w.role_name}`, w.role_name) : '—'}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={w.status} /></td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{w.orders}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{w.confirmed || '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{fixedOf(w)}</td>
                  <td className="px-3 py-2.5 text-[12px] text-gray-500 max-w-[160px] truncate">{commissionOf(w)}</td>
                  <td className="px-3 py-2.5 font-black text-gray-900 whitespace-nowrap tabular-nums">{earningsText(w.earnings)}</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap text-[12px]">{w.online ? <span className="text-emerald-600 font-bold">{t('workers.onlineNow', 'Online')}</span> : timeAgo(w.last_activity, t)}</td>
                  <td className="px-3 py-2.5 text-end">{canManage ? <WorkerActions worker={w} onChanged={() => load(0)} /> : <Link to={`/dashboard/workers/${w.id}`} className="p-1.5 inline-block text-gray-400 hover:text-brand-600"><Eye size={15} /></Link>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* phone / tablet cards */}
          <div className="lg:hidden grid sm:grid-cols-2 gap-3">
            {rows.map((w) => (
              <div key={w.id} className="glass-card-solid p-4" onClick={(e) => { if (!e.target.closest('button')) navigate(`/dashboard/workers/${w.id}`); }}>
                <div className="flex items-start gap-3">
                  <Avatar worker={w} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><p className="font-black text-gray-900 truncate">{w.full_name}</p><StatusBadge status={w.status} /></div>
                    <p className="text-xs text-brand-600 font-semibold truncate">{w.job_type ? t(`workers.jobName.${w.job_type}`, w.job_type) : '—'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{w.role_name ? t(`workers.roleName.${w.role_name}`, w.role_name) : ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-xl bg-gray-50 py-2"><p className="text-base font-black text-gray-900">{w.orders}</p><p className="text-[10px] text-gray-400">{t('workers.orders', 'Orders')}</p></div>
                  <div className="rounded-xl bg-gray-50 py-2"><p className="text-base font-black text-gray-900">{w.confirmed}</p><p className="text-[10px] text-gray-400">{t('workers.confirmed', 'Confirmed')}</p></div>
                  <div className="rounded-xl bg-gray-50 py-2 px-1"><p className="text-[13px] font-black text-gray-900 truncate">{earningsText(w.earnings)}</p><p className="text-[10px] text-gray-400">{t('workers.thisMonth', 'This month')}</p></div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">{w.online ? <span className="text-emerald-600 font-bold">● {t('workers.onlineNow', 'Online')}</span> : timeAgo(w.last_activity, t)}</span>
                  {canManage && <WorkerActions worker={w} onChanged={() => load(0)} />}
                </div>
              </div>
            ))}
          </div>
          {data && rows.length < data.total && <div className="text-center mt-4"><button className="btn-secondary text-sm" onClick={() => load(rows.length)}>{t('workers.loadMore', 'Load more')}</button></div>}
        </>}
      {/* sticky add button on phones */}
      {canManage && <button onClick={() => setWizard(true)} className="lg:hidden fixed bottom-5 end-5 z-30 w-14 h-14 rounded-full bg-brand-500 text-white shadow-2xl grid place-items-center" aria-label={t('workers.addWorker', 'Add Worker')}><Plus size={24} /></button>}
      <AddWorkerWizard open={wizard} onClose={() => setWizard(false)} onCreated={() => load(0)} />
      <DistributeOrders sid={sid} open={distribute} onClose={() => setDistribute(false)} onDone={() => load(0)} />
    </DashboardLayout>
  );
}
