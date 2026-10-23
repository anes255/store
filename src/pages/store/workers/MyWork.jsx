import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle, Clock, XCircle, Wallet, Home, ShoppingCart, User, Save, Camera, KeyRound, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement, useAuthStore, useLangStore } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { workersApi } from '../../../utils/api';
import { formatMoney, approxConversions } from '../../../utils/money';
import PasswordInput from '../../../components/shared/PasswordInput';
import PasswordStrength from '../../../components/shared/PasswordStrength';
import { Avatar, StatusBadge, StatCard, Skeleton, useRuleLabel, useActionLabel, timeAgo, MONTHS } from './shared';
import { readImage } from './AddWorkerWizard';

// The logged-in worker's own page: today's work, this month's earnings
// (fixed + commissions, calculated from their own actions), recent actions,
// payroll history and their profile / password.
export default function MyWork() {
  const { t, i18n } = useTranslation();
  const { currentStore } = useStoreManagement();
  const { setAuth } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { can, canAny } = useStaffAccess();
  const ruleLabel = useRuleLabel();
  const actionLabel = useActionLabel();
  const sid = currentStore?.id;
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('home');
  const [p, setP] = useState(null);
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const load = () => workersApi.me(sid).then((r) => { setD(r.data); const w = r.data.worker; if (w) setP({ first_name: w.first_name || w.name || '', last_name: w.last_name || '', phone: w.phone || '', avatar: w.avatar || '', language: w.language || i18n.language }); }).catch(() => setD({ is_staff: false }));
  useEffect(() => { if (sid) load(); }, [sid]); // eslint-disable-line

  if (!user?.is_staff) return <DashboardLayout><div className="glass-card-solid p-8 text-center text-gray-500">{t('workers.myWorkOwner', 'This page is for workers. Manage your team from Workers.')} <Link to="/dashboard/workers" className="text-brand-600 font-bold">{t('workers.title', 'Workers')}</Link></div></DashboardLayout>;
  if (!d) return <DashboardLayout><Skeleton className="h-24 mb-3" /><Skeleton className="h-64" /></DashboardLayout>;
  const w = d.worker || {};
  const c = d.counts || {};
  const n = (a, k) => c[a]?.[k] || 0;
  const earnings = Object.entries(d.earnings || {});
  const hour = new Date().getHours();
  const hello = hour < 12 ? t('workers.goodMorning', 'Good morning') : hour < 18 ? t('workers.goodAfternoon', 'Good afternoon') : t('workers.goodEvening', 'Good evening');

  const saveProfile = async () => {
    setSaving(true);
    try {
      await workersApi.updateMyProfile(p);
      if (p.language && p.language !== i18n.language) { try { useLangStore.getState().setLang?.(p.language); } catch {} i18n.changeLanguage(p.language); }
      setAuth({ ...user, name: `${p.first_name} ${p.last_name}`.trim(), avatar: p.avatar }, localStorage.getItem('token'), 'store_owner');
      toast.success(t('workers.saved', 'Saved')); load();
    } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setSaving(false);
  };
  const changePassword = async () => {
    if (pw.new_password !== pw.confirm) return toast.error(t('auth.passwordsDontMatch', 'Passwords do not match'));
    setSaving(true);
    try { const { data } = await workersApi.changeMyPassword(pw); setAuth(data.owner, data.token, 'store_owner'); setPw({ current_password: '', new_password: '', confirm: '' }); toast.success(t('workers.pwChanged', 'Password changed — other devices were logged out')); }
    catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setSaving(false);
  };

  const Home_ = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase text-gray-400 mb-2">{t('workers.today', 'Today')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={ClipboardList} label={t('workers.assignedToday', 'Assigned today')} value={d.assigned?.today ?? 0} sub={t('workers.nOpen', '{{n}} assigned in total', { n: d.assigned?.total ?? 0 })} />
          <StatCard icon={CheckCircle} tone="green" label={t('workers.confirmed', 'Confirmed')} value={n('confirmed', 'today')} />
          <StatCard icon={Clock} tone="amber" label={t('workers.pending', 'Pending')} value={d.assigned?.pending ?? 0} />
          <StatCard icon={XCircle} tone="red" label={t('workers.rejected', 'Rejected')} value={n('cancelled', 'today')} />
        </div>
      </div>
      <div>
        <p className="text-xs font-black uppercase text-gray-400 mb-2">{t('workers.performance', 'Performance')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={TrendingUp} label={t('workers.thisWeek', 'This week')} value={n('confirmed', 'week')} sub={t('workers.confirmed', 'Confirmed')} />
          <StatCard icon={TrendingUp} tone="green" label={t('workers.thisMonth', 'This month')} value={n('confirmed', 'month')} sub={t('workers.confirmed', 'Confirmed')} />
          <StatCard icon={TrendingUp} tone="violet" label={t('workers.prepared', 'Prepared')} value={n('prepared', 'month')} sub={t('workers.thisMonth', 'This month')} />
          <StatCard icon={TrendingUp} tone="blue" label={t('workers.confirmationRate', 'Confirmation rate')} value={n('confirmed', 'month') + n('cancelled', 'month') ? Math.round((n('confirmed', 'month') / (n('confirmed', 'month') + n('cancelled', 'month'))) * 100) + '%' : '—'} sub={t('workers.thisMonth', 'This month')} />
        </div>
      </div>
      {canAny('orders_view', 'orders_view_assigned') && <Link to="/dashboard/orders" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 !py-3 text-base"><ShoppingCart size={18} />{t('workers.openMyOrders', 'Open my orders')}</Link>}
      <div className="glass-card-solid p-4">
        <p className="font-black text-gray-900 mb-3">{t('workers.recentActivity', 'Recent activity')}</p>
        {d.recent?.length ? <div className="space-y-1.5">{d.recent.map((a, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm rounded-xl bg-gray-50 px-3 py-2"><span className="min-w-0 truncate"><b className="text-gray-900">#{a.order_number}</b> <span className="text-gray-500">{actionLabel(a.action)}</span></span><span className="text-[11px] text-gray-400 shrink-0">{timeAgo(a.created_at, t)}</span></div>))}</div>
          : <p className="text-sm text-gray-400">{t('workers.noActivity', 'No activity yet')}</p>}
      </div>
    </div>
  );

  const Earnings_ = (
    <div className="space-y-4">
      <div className="glass-card-solid p-5">
        <p className="text-sm text-gray-500 mb-1">{t('workers.estimatedThisMonth', 'Estimated earnings this month')}</p>
        {!earnings.length ? <p className="text-sm text-gray-400">{t('workers.noPayRulesWorker', 'Your pay rules have not been set yet.')}</p> : earnings.map(([cur, v]) => (
          <div key={cur} className="mb-3">
            <p className="text-3xl font-black text-brand-600 mb-3">{formatMoney(v.fixed + v.commission, cur)}</p>
            {(() => { let pref = 'DZD'; try { pref = localStorage.getItem('display_currency') || 'DZD'; } catch {} const x = pref !== cur ? approxConversions(v.fixed + v.commission, cur, d.fx_rates).find((y) => y.currency === pref) : null; return x ? <p className="text-xs text-gray-400 -mt-2 mb-3">≈ {formatMoney(x.amount, x.currency)} · <i>{t('workers.approx', 'Approximate conversion')}</i></p> : null; })()}
            <div className="space-y-1.5 text-sm">
              {v.lines.map((l, i) => l.type === 'fixed_monthly'
                ? <div key={i} className="flex justify-between"><span className="text-gray-500">{t('workers.fixedSalary', 'Fixed salary')}</span><b>{formatMoney(l.amount, cur)}</b></div>
                : <div key={i} className="flex justify-between gap-2"><span className="text-gray-500">{ruleLabel(l.type)} <span className="text-[11px]">({l.count} × {formatMoney(l.rate, cur)})</span></span><b className="shrink-0">{formatMoney(l.amount, cur)}</b></div>)}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-gray-400">{t('workers.earningsNote', 'Counted from your own confirmations, preparations and deliveries. The final amount is set when the payroll is approved.')}</p>
      </div>
      {d.payroll?.length > 0 && <div className="glass-card-solid p-4">
        <p className="font-black text-gray-900 mb-2">{t('workers.myPayslips', 'My payroll')}</p>
        {d.payroll.map((x) => <div key={x.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"><span className="font-semibold">{MONTHS(i18n.language)[x.month - 1]} {x.year}</span><span className="flex items-center gap-2"><b>{formatMoney(x.net_amount, x.currency)}</b><StatusBadge status={x.status} /></span></div>)}
      </div>}
    </div>
  );

  const Profile_ = p && (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="glass-card-solid p-4 space-y-3">
        <p className="font-black text-gray-900">{t('workers.myProfile', 'My profile')}</p>
        <label className="relative inline-block cursor-pointer"><Avatar worker={{ ...w, avatar: p.avatar }} size={64} /><span className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center"><Camera size={13} /></span>
          <input type="file" accept="image/*" className="hidden" onChange={async (ev) => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) { try { setP({ ...p, avatar: await readImage(f) }); } catch {} } }} /></label>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="input-label">{t('workers.firstName', 'First name')}</label><input className="input-field" value={p.first_name} onChange={(e) => setP({ ...p, first_name: e.target.value })} /></div>
          <div><label className="input-label">{t('workers.lastName', 'Last name')}</label><input className="input-field" value={p.last_name} onChange={(e) => setP({ ...p, last_name: e.target.value })} /></div>
        </div>
        <div><label className="input-label">{t('workers.phone', 'Phone number')}</label><input className="input-field" dir="ltr" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
        <div><label className="input-label">{t('workers.language', 'Language')}</label><div className="flex gap-2">{[['ar', 'العربية'], ['fr', 'Français'], ['en', 'English']].map(([k, l]) => <button key={k} type="button" onClick={() => setP({ ...p, language: k })} className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold ${p.language === k ? 'border-brand-500 text-brand-600' : 'border-gray-200 text-gray-500'}`}>{l}</button>)}</div></div>
        <p className="text-[11px] text-gray-400">{t('workers.selfServiceNote', 'Your role, permissions, salary and stores are managed by your store admin.')}</p>
        <div className="flex justify-end"><button className="btn-primary text-sm flex items-center gap-1.5" disabled={saving} onClick={saveProfile}><Save size={14} />{t('workers.save', 'Save')}</button></div>
      </div>
      <div className="glass-card-solid p-4 space-y-3">
        <p className="font-black text-gray-900 flex items-center gap-2"><KeyRound size={16} />{t('workers.changePassword', 'Change password')}</p>
        <div><label className="input-label">{t('store.currentPassword', 'Current password')}</label><PasswordInput className="input-field" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} autoComplete="current-password" /></div>
        <div><label className="input-label">{t('store.newPassword', 'New password')}</label><PasswordInput className="input-field" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} autoComplete="new-password" /><PasswordStrength password={pw.new_password} /></div>
        <div><label className="input-label">{t('auth.confirmPassword', 'Confirm password')}</label><PasswordInput className="input-field" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></div>
        <div className="flex justify-end"><button className="btn-primary text-sm" disabled={saving || !pw.current_password || !pw.new_password} onClick={changePassword}>{t('workers.changePassword', 'Change password')}</button></div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="glass-card-solid p-4 sm:p-5 mb-4 flex items-center gap-4">
        <Avatar worker={w} size={56} />
        <div className="min-w-0 flex-1"><p className="text-sm text-gray-400">{hello} 👋</p><h1 className="text-xl font-black text-gray-900 truncate">{w.full_name}</h1><p className="text-xs text-brand-600 font-semibold truncate">{w.job_type ? t(`workers.jobName.${w.job_type}`, w.job_type) : ''}{currentStore?.name ? ` · ${currentStore.name}` : ''}</p></div>
        <StatusBadge status={w.status || 'active'} />
      </div>
      <div className="hidden sm:flex gap-1 mb-4 border-b border-gray-200">
        {[['home', t('workers.home', 'Home')], ['earnings', t('workers.earnings', 'Earnings')], ['profile', t('workers.profile', 'Profile')]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === k ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400'}`}>{l}</button>)}
      </div>
      <div className="pb-24 sm:pb-0">{tab === 'home' ? Home_ : tab === 'earnings' ? Earnings_ : Profile_}</div>
      {/* phone bottom bar */}
      <div role="navigation" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {[['home', Home, t('workers.home', 'Home')], ['orders', ShoppingCart, t('workers.orders', 'Orders')], ['earnings', Wallet, t('workers.earnings', 'Earnings')], ['profile', User, t('workers.profile', 'Profile')]].map(([k, I, l]) => k === 'orders'
          ? <Link key={k} to="/dashboard/orders" className="flex flex-col items-center py-2 text-gray-400"><I size={20} /><span className="text-[10px] font-bold">{l}</span></Link>
          : <button key={k} onClick={() => { setTab(k); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex flex-col items-center py-2 ${tab === k ? 'text-brand-600' : 'text-gray-400'}`}><I size={20} /><span className="text-[10px] font-bold">{l}</span></button>)}
      </div>
    </DashboardLayout>
  );
}
