import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Save, Phone, Mail, Clock, Shield, KeyRound, LogOut, Store as StoreIcon, Plus, Camera, Wallet, Activity, ShoppingCart, CheckCircle, Package, Truck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement, useAuthStore } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { workersApi } from '../../../utils/api';
import { formatMoney, formatMulti } from '../../../utils/money';
import { Avatar, StatusBadge, StatCard, Skeleton, PermissionPicker, RulesEditor, useRuleLabel, useActionLabel, timeAgo, MONTHS } from './shared';
import { WorkerActions } from './WorkersPage';
import { readImage } from './AddWorkerWizard';

const TABS = ['overview', 'orders', 'performance', 'compensation', 'payroll', 'activity', 'permissions', 'security'];

export default function WorkerProfile() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { currentStore, stores } = useStoreManagement();
  const user = useAuthStore((s) => s.user);
  const { can, perms } = useStaffAccess();
  const ruleLabel = useRuleLabel();
  const actionLabel = useActionLabel();
  const sid = currentStore?.id;
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const [d, setD] = useState(null);
  const [edit, setEdit] = useState(params.get('edit') === '1');
  const [form, setForm] = useState({});
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rules, setRules] = useState([]);
  const [permsDraft, setPermsDraft] = useState([]);
  const [perf, setPerf] = useState(null);
  const [saving, setSaving] = useState(false);
  const canManage = can('workers_manage');
  const canPay = can('payroll_manage') || canManage;

  const load = async () => {
    try {
      const { data } = await workersApi.get(sid, id);
      setD(data);
      const w = data.worker;
      setForm({ first_name: w.first_name || w.name || '', last_name: w.last_name || '', phone: w.phone || '', email: w.email || '', username: w.username || '', date_of_birth: w.date_of_birth ? String(w.date_of_birth).slice(0, 10) : '', address: w.address || '', notes: w.notes || '', job_type: w.job_type || '', role_id: w.role_template_id || '', avatar: w.avatar || '' });
      setRules(data.rules.map((r) => ({ rule_type: r.rule_type, amount: String(parseFloat(r.amount)), currency: r.currency })));
      setPermsDraft(w.permissions || []);
    } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
  };
  useEffect(() => { if (sid) { load(); workersApi.jobTypes(sid).then((r) => setJobs(r.data.job_types || [])).catch(() => {}); workersApi.roles(sid).then((r) => setRoles(r.data.roles || [])).catch(() => {}); } }, [sid, id]); // eslint-disable-line
  useEffect(() => { if (sid && tab === 'performance') workersApi.performance(sid, { worker: id, range: '30d' }).then((r) => setPerf(r.data)).catch(() => {}); }, [sid, id, tab]);

  const save = async (patch, msg) => {
    setSaving(true);
    try { await workersApi.update(sid, id, patch); toast.success(msg || t('workers.saved', 'Saved')); setEdit(false); await load(); }
    catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setSaving(false);
  };
  if (!d) return <DashboardLayout><Skeleton className="h-32 mb-4" /><Skeleton className="h-64" /></DashboardLayout>;
  const w = d.worker;
  const e = d.earnings || {};
  const tabLabel = { overview: t('workers.tab.overview', 'Overview'), orders: t('workers.tab.orders', 'Orders'), performance: t('workers.tab.performance', 'Performance'), compensation: t('workers.tab.compensation', 'Compensation'), payroll: t('workers.tab.payroll', 'Payroll'), activity: t('workers.tab.activity', 'Activity'), permissions: t('workers.tab.permissions', 'Permissions'), security: t('workers.tab.security', 'Security') };
  const monthName = (m) => MONTHS(i18n.language)[m - 1];
  const otherStores = (stores || []).filter((s) => !d.stores.some((x) => String(x.store_id) === String(s.id)));
  const totalByCur = Object.fromEntries(Object.entries(e).map(([c, v]) => [c, v.fixed + v.commission]));

  return (
    <DashboardLayout>
      <Link to="/dashboard/workers" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3"><ArrowLeft size={15} />{t('workers.title', 'Workers')}</Link>
      {/* header */}
      <div className="glass-card-solid p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar worker={w} size={72} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl sm:text-2xl font-black text-gray-900">{w.full_name}</h1><StatusBadge status={w.status} />{w.online && <span className="text-[11px] font-bold text-emerald-600">● {t('workers.onlineNow', 'Online')}</span>}</div>
          <p className="text-sm text-brand-600 font-semibold">{w.job_type ? t(`workers.jobName.${w.job_type}`, w.job_type) : '—'}{w.role_name ? <span className="text-gray-400 font-normal"> · {t(`workers.roleName.${w.role_name}`, w.role_name)}</span> : null}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
            {w.phone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={12} />{w.phone}</span>}
            {w.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{w.email}</span>}
            <span className="inline-flex items-center gap-1"><Clock size={12} />{t('workers.lastLogin', 'Last login')}: {w.last_login_at ? new Date(w.last_login_at).toLocaleString() : '—'}</span>
          </div>
        </div>
        {canManage && <div className="flex items-center gap-2 shrink-0">
          {!edit && <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={() => { setEdit(true); setParams({ tab: 'overview' }); }}><Edit size={14} />{t('workers.edit', 'Edit')}</button>}
          <WorkerActions worker={w} onChanged={load} compact />
        </div>}
      </div>

      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto mb-4 border-b border-gray-200 -mx-1 px-1">
        {TABS.filter((x) => x !== 'payroll' || can('payroll_view') || canManage).map((x) => (
          <button key={x} onClick={() => setParams({ tab: x })} className={`px-3 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${tab === x ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>{tabLabel[x]}</button>
        ))}
      </div>

      {tab === 'overview' && (edit ? (
        <div className="glass-card-solid p-4 sm:p-5 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer"><Avatar worker={{ ...w, avatar: form.avatar }} size={64} /><span className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center"><Camera size={13} /></span>
              <input type="file" accept="image/*" className="hidden" onChange={async (ev) => { const file = ev.target.files?.[0]; ev.target.value = ''; if (file) { try { setForm({ ...form, avatar: await readImage(file) }); } catch {} } }} /></label>
            {form.avatar && <button className="text-xs text-red-500" onClick={() => setForm({ ...form, avatar: '' })}>{t('workers.remove', 'Remove')}</button>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[['first_name', t('workers.firstName', 'First name')], ['last_name', t('workers.lastName', 'Last name')], ['phone', t('workers.phone', 'Phone number')], ['email', t('workers.email', 'Email')], ['username', t('workers.username', 'Username')], ['address', t('workers.address', 'Address')]].map(([k, l]) => (
              <div key={k}><label className="input-label">{l}</label><input className="input-field" dir={['phone', 'email', 'username'].includes(k) ? 'ltr' : undefined} value={form[k]} onChange={(ev) => setForm({ ...form, [k]: ev.target.value })} /></div>
            ))}
            <div><label className="input-label">{t('workers.dob', 'Date of birth')}</label><input type="date" className="input-field" value={form.date_of_birth} onChange={(ev) => setForm({ ...form, date_of_birth: ev.target.value })} /></div>
            <div><label className="input-label">{t('workers.job', 'Job')}</label><select className="input-field" value={form.job_type} onChange={(ev) => setForm({ ...form, job_type: ev.target.value })}><option value="">—</option>{jobs.map((j) => <option key={j.id} value={j.name}>{t(`workers.jobName.${j.name}`, j.name)}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="input-label">{t('workers.role', 'Role')}</label><select className="input-field" value={form.role_id} onChange={(ev) => setForm({ ...form, role_id: ev.target.value })}><option value="">—</option>{roles.map((r) => <option key={r.id} value={r.id}>{t(`workers.roleName.${r.name}`, r.name)}</option>)}</select>
              <p className="text-[11px] text-gray-400 mt-1">{t('workers.roleChangeNote', 'Changing the role does not change the permissions below — use "Apply role permissions" on the Permissions tab.')}</p></div>
          </div>
          <div><label className="input-label">{t('workers.notes', 'Notes')}</label><textarea className="input-field" rows={2} value={form.notes} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost text-sm" onClick={() => setEdit(false)}>{t('workers.cancel', 'Cancel')}</button>
            <button className="btn-primary text-sm flex items-center gap-1.5" disabled={saving} onClick={() => save({ ...form, date_of_birth: form.date_of_birth || null })}><Save size={14} />{t('workers.save', 'Save')}</button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard icon={CheckCircle} tone="green" label={t('workers.confirmed', 'Confirmed')} value={d.counts.confirmed || 0} sub={t('workers.thisMonth', 'This month')} />
              <StatCard icon={Package} tone="violet" label={t('workers.prepared', 'Prepared')} value={d.counts.prepared || 0} sub={t('workers.thisMonth', 'This month')} />
              <StatCard icon={Truck} tone="blue" label={t('workers.completed', 'Completed')} value={d.counts.completed || 0} sub={t('workers.thisMonth', 'This month')} />
              <StatCard icon={Wallet} tone="amber" label={t('workers.earnings', 'Earnings')} value={formatMulti(totalByCur)} sub={t('workers.thisMonth', 'This month')} />
            </div>
            <div className="glass-card-solid p-4">
              <p className="font-black text-gray-900 mb-3">{t('workers.recentActivity', 'Recent activity')}</p>
              {d.recent.length ? <div className="space-y-1.5">{d.recent.slice(0, 10).map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm rounded-xl bg-gray-50 px-3 py-2"><span className="min-w-0 truncate"><b className="text-gray-900">{actionLabel(a.action)}</b> <span className="text-gray-400">#{a.order_number}</span></span><span className="text-[11px] text-gray-400 shrink-0">{timeAgo(a.created_at, t)}</span></div>
              ))}</div> : <p className="text-sm text-gray-400">{t('workers.noActivity', 'No activity yet')}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <EarningsCard e={e} t={t} ruleLabel={ruleLabel} />
            <div className="glass-card-solid p-4">
              <p className="font-black text-gray-900 mb-2 flex items-center gap-2"><StoreIcon size={15} />{t('workers.storeAccess', 'Store access')}</p>
              {d.stores.map((s) => <div key={s.worker_id} className="flex items-center justify-between text-sm py-1.5"><span className="font-semibold text-gray-800 truncate">{s.store_name}</span><StatusBadge status={s.status} /></div>)}
              {canManage && !user?.is_staff && otherStores.length > 0 && (
                <select className="input-field text-sm mt-2" value="" onChange={async (ev) => { if (!ev.target.value) return; try { await workersApi.addToStore(sid, id, ev.target.value); toast.success(t('workers.saved', 'Saved')); load(); } catch (er) { toast.error(er?.response?.data?.error || 'Failed'); } }}>
                  <option value="">+ {t('workers.addToStore', 'Give access to another store…')}</option>{otherStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            {w.notes && <div className="glass-card-solid p-4"><p className="font-black text-gray-900 mb-1">{t('workers.notes', 'Notes')}</p><p className="text-sm text-gray-600 whitespace-pre-wrap">{w.notes}</p></div>}
          </div>
        </div>
      ))}

      {tab === 'orders' && <WorkerOrders sid={sid} wid={id} t={t} actionLabel={actionLabel} />}

      {tab === 'performance' && (!perf ? <Skeleton className="h-64" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatCard label={t('workers.assigned', 'Assigned')} value={perf.totals.assigned} />
            <StatCard label={t('workers.confirmed', 'Confirmed')} value={perf.totals.confirmed} tone="green" />
            <StatCard label={t('workers.completed', 'Completed')} value={perf.totals.completed} tone="blue" />
            <StatCard label={t('workers.cancelledRejected', 'Cancelled')} value={perf.totals.cancelled} tone="red" />
            <StatCard label={t('workers.confirmationRate', 'Confirmation rate')} value={perf.rates.confirmation != null ? perf.rates.confirmation + '%' : '—'} tone="violet" />
            <StatCard label={t('workers.avgTime', 'Avg. time to confirm')} value={perf.avg_processing_minutes != null ? `${perf.avg_processing_minutes} min` : '—'} tone="amber" />
          </div>
          <div className="glass-card-solid p-4"><p className="font-black text-gray-900 mb-3">{t('workers.dailyPerformance', 'Daily performance (30 days)')}</p>
            <div className="h-64"><ResponsiveContainer><BarChart data={perf.daily}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} width={30} /><Tooltip /><Bar dataKey="confirmed" name={t('workers.confirmed', 'Confirmed')} fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="completed" name={t('workers.completed', 'Completed')} fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
      ))}

      {tab === 'compensation' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="glass-card-solid p-4">
            <p className="font-black text-gray-900 mb-3">{t('workers.payRules', 'Pay rules')}</p>
            {canPay ? <>
              <RulesEditor rules={rules} onChange={setRules} defaultCurrency={currentStore?.currency || 'DZD'} />
              <div className="flex justify-end mt-3"><button className="btn-primary text-sm flex items-center gap-1.5" disabled={saving} onClick={async () => { setSaving(true); try { await workersApi.setCompensation(sid, id, rules.filter((r) => Number(r.amount) > 0)); toast.success(t('workers.saved', 'Saved')); load(); } catch (er) { toast.error(er?.response?.data?.error || 'Failed'); } setSaving(false); }}><Save size={14} />{t('workers.save', 'Save')}</button></div>
              <p className="text-[11px] text-gray-400 mt-2">{t('workers.rulesHistoryNote', 'Changes apply from now on. Approved payrolls are never changed.')}</p>
            </> : d.rules.map((r) => <div key={r.id} className="flex justify-between text-sm py-1.5"><span className="text-gray-500">{ruleLabel(r.rule_type)}</span><b>{formatMoney(r.amount, r.currency)}</b></div>)}
          </div>
          <EarningsCard e={e} t={t} ruleLabel={ruleLabel} />
        </div>
      )}

      {tab === 'payroll' && (
        <div className="glass-card-solid overflow-x-auto">
          {d.payroll.length ? <table className="w-full text-sm"><thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">{[t('workers.month', 'Month'), t('workers.fixedSalary', 'Fixed salary'), t('workers.commission', 'Commission'), t('workers.bonuses', 'Bonuses'), t('workers.deductions', 'Deductions'), t('workers.netSalary', 'Net salary'), t('workers.status', 'Status')].map((h) => <th key={h} className="px-3 py-3 text-start">{h}</th>)}</tr></thead>
            <tbody>{d.payroll.map((p) => <tr key={p.id} className="border-b border-gray-50"><td className="px-3 py-2.5 font-semibold">{monthName(p.month)} {p.year}</td><td className="px-3 py-2.5">{formatMoney(p.fixed_amount, p.currency)}</td><td className="px-3 py-2.5">{formatMoney(p.commission_amount, p.currency)}</td><td className="px-3 py-2.5">{formatMoney(p.bonuses, p.currency)}</td><td className="px-3 py-2.5">{formatMoney(p.deductions, p.currency)}</td><td className="px-3 py-2.5 font-black">{formatMoney(p.net_amount, p.currency)}</td><td className="px-3 py-2.5"><StatusBadge status={p.status} /></td></tr>)}</tbody></table>
            : <p className="p-6 text-sm text-gray-400 text-center">{t('workers.noPayroll', 'No payroll yet')}</p>}
        </div>
      )}

      {tab === 'activity' && <WorkerActivityList sid={sid} wid={id} t={t} actionLabel={actionLabel} />}

      {tab === 'permissions' && (
        <div className="glass-card-solid p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="font-black text-gray-900 flex items-center gap-2"><Shield size={16} />{t('workers.permissions', 'Permissions')}</p>
            {canManage && <div className="flex gap-2">
              {roles.find((r) => String(r.id) === String(w.role_template_id)) && <button className="btn-secondary text-xs" onClick={() => setPermsDraft(roles.find((r) => String(r.id) === String(w.role_template_id)).permissions || [])}>{t('workers.applyRolePerms', 'Apply role permissions')}</button>}
              <button className="btn-primary text-xs flex items-center gap-1" disabled={saving} onClick={() => save({ permissions: permsDraft }, t('workers.permsSaved', 'Permissions saved — they apply on the worker\'s next action.'))}><Save size={13} />{t('workers.save', 'Save')}</button>
            </div>}
          </div>
          {canManage ? <PermissionPicker value={permsDraft} onChange={setPermsDraft} allowed={perms} /> : <p className="text-sm text-gray-500">{(w.permissions || []).join(', ') || '—'}</p>}
        </div>
      )}

      {tab === 'security' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card-solid p-4">
            <p className="font-black text-gray-900 mb-3">{t('workers.loginHistory', 'Login history')}</p>
            {d.logins.length ? <div className="space-y-1.5">{d.logins.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm rounded-xl bg-gray-50 px-3 py-2">
                <span className="min-w-0 truncate"><span className={`font-bold ${l.success ? 'text-emerald-600' : 'text-red-600'}`}>{l.success ? t('workers.loginOk', 'Logged in') : t('workers.loginFailed', 'Failed login')}</span>{!l.success && l.reason && <span className="text-gray-400"> · {t(`workers.loginReason.${l.reason}`, l.reason.replace(/_/g, ' '))}</span>}<span className="text-gray-400 text-[11px] block truncate">{l.ip} · {(l.user_agent || '').slice(0, 60)}</span></span>
                <span className="text-[11px] text-gray-400 shrink-0">{new Date(l.created_at).toLocaleString()}</span>
              </div>))}</div> : <p className="text-sm text-gray-400">{t('workers.noLogins', 'No logins yet')}</p>}
          </div>
          {canManage && <div className="glass-card-solid p-4 space-y-2">
            <p className="font-black text-gray-900 mb-1">{t('workers.account', 'Account')}</p>
            <p className="text-xs text-gray-500">{t('workers.loginWith', 'Logs in with')}: <b dir="ltr">{w.username || w.email}</b></p>
            <select className="input-field text-sm" value={w.status} onChange={(ev) => save({ status: ev.target.value })}>
              {['active', 'inactive', 'suspended'].concat(w.status === 'pending' ? ['pending'] : []).map((s) => <option key={s} value={s}>{s === 'pending' ? t('workers.pendingInvite', 'Pending invitation') : t(`workers.${s}`, s)}</option>)}
            </select>
            <p className="text-[11px] text-gray-400">{t('workers.statusNote', 'Inactive or suspended workers are logged out at once and cannot log in.')}</p>
            <button className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5" onClick={async () => { try { await workersApi.revokeSessions(sid, id); toast.success(t('workers.loggedOut', 'Worker logged out everywhere')); } catch (er) { toast.error('Failed'); } }}><LogOut size={14} />{t('workers.logoutEverywhere', 'Log out everywhere')}</button>
            <button className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5" onClick={async () => { try { const { data } = await workersApi.resetWorkerPassword(sid, id, 'link'); await navigator.clipboard?.writeText(data.link); toast.success(data.sent?.length ? t('workers.resetLinkSent', 'Reset link sent and copied') : t('workers.linkCopied', 'Link copied')); } catch (er) { toast.error(er?.response?.data?.error || 'Failed'); } }}><KeyRound size={14} />{t('workers.sendResetLink', 'Send password reset link')}</button>
          </div>}
        </div>
      )}
    </DashboardLayout>
  );
}

function EarningsCard({ e, t, ruleLabel }) {
  const entries = Object.entries(e || {});
  return (
    <div className="glass-card-solid p-4">
      <p className="font-black text-gray-900 mb-3 flex items-center gap-2"><Wallet size={15} />{t('workers.thisMonthEarnings', 'This month\'s earnings')}</p>
      {!entries.length ? <p className="text-sm text-gray-400">{t('workers.noPayRules', 'No pay rules')}</p> : entries.map(([cur, v]) => (
        <div key={cur} className="space-y-1.5 text-sm mb-2">
          {v.lines.map((l, i) => l.type === 'fixed_monthly'
            ? <div key={i} className="flex justify-between"><span className="text-gray-500">{t('workers.fixedSalary', 'Fixed salary')}</span><span className="font-semibold">{formatMoney(l.amount, cur)}</span></div>
            : <div key={i} className="flex justify-between gap-2"><span className="text-gray-500">{ruleLabel(l.type)} <span className="text-[11px]">({l.count} × {formatMoney(l.rate, cur)})</span></span><span className="font-semibold shrink-0">{formatMoney(l.amount, cur)}</span></div>)}
          <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-gray-900">{t('workers.total', 'Total')}</span><span className="font-black text-brand-600 text-lg">{formatMoney(v.fixed + v.commission, cur)}</span></div>
        </div>
      ))}
    </div>
  );
}

function WorkerOrders({ sid, wid, t, actionLabel }) {
  const [rows, setRows] = useState(null);
  const [kind, setKind] = useState('');
  useEffect(() => { setRows(null); workersApi.activity(sid, { worker: wid, kind: 'orders', action: kind || undefined, limit: 100 }).then((r) => setRows(r.data.entries)).catch(() => setRows([])); }, [sid, wid, kind]);
  return (
    <div className="glass-card-solid p-4">
      <div className="flex flex-wrap gap-1.5 mb-3">{['', 'confirmed', 'prepared', 'completed', 'cancelled', 'assigned', 'called'].map((k) => (
        <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${kind === k ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{k ? actionLabel(k) : t('workers.all', 'All')}</button>
      ))}</div>
      {!rows ? <Skeleton className="h-40" /> : !rows.length ? <p className="text-sm text-gray-400 py-6 text-center">{t('workers.noOrders', 'No orders yet')}</p> : (
        <div className="space-y-1.5">{rows.map((a, i) => (
          <Link key={i} to={`/dashboard/orders?highlight=${a.target_id}`} className="flex items-center justify-between gap-3 text-sm rounded-xl bg-gray-50 hover:bg-gray-100 px-3 py-2">
            <span className="min-w-0 truncate"><b className="text-gray-900">#{a.target}</b> <span className="text-gray-500">{actionLabel(a.action)}</span>{a.after && <span className="text-gray-400 text-[11px]"> → {a.after}</span>}</span>
            <span className="text-[11px] text-gray-400 shrink-0">{new Date(a.created_at).toLocaleString()}</span>
          </Link>))}</div>
      )}
    </div>
  );
}

export function WorkerActivityList({ sid, wid, t, actionLabel }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { workersApi.activity(sid, { worker: wid, limit: 100 }).then((r) => setRows(r.data.entries)).catch(() => setRows([])); }, [sid, wid]);
  if (!rows) return <Skeleton className="h-40" />;
  return (
    <div className="glass-card-solid p-4">
      {!rows.length ? <p className="text-sm text-gray-400 text-center py-6">{t('workers.noActivity', 'No activity yet')}</p> : <ol className="relative border-s border-gray-200 ms-2 space-y-3">{rows.map((a, i) => (
        <li key={i} className="ms-4"><span className={`absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full ${a.kind === 'order' ? 'bg-brand-500' : 'bg-gray-400'}`} />
          <p className="text-sm"><b className="text-gray-900">{actionLabel(a.action)}</b>{a.kind === 'order' ? <span className="text-gray-500"> #{a.target}</span> : null}</p>
          <p className="text-[11px] text-gray-400">{new Date(a.created_at).toLocaleString()}{a.before || (a.kind === 'order' && a.after) ? ` · ${a.before || '—'} → ${a.after || '—'}` : ''}</p></li>
      ))}</ol>}
    </div>
  );
}
