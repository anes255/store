import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, Truck, XCircle, Percent, Timer, Trophy, Wallet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import { workersApi } from '../../../utils/api';
import { formatMoney } from '../../../utils/money';
import { Avatar, StatCard, Skeleton, EmptyState } from './shared';

export default function WorkerPerformance() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const sid = currentStore?.id;
  const [workers, setWorkers] = useState([]);
  const [worker, setWorker] = useState('');
  const [range, setRange] = useState('30d');
  const [d, setD] = useState(null);
  useEffect(() => { if (sid) workersApi.list(sid, { limit: 200 }).then((r) => setWorkers(r.data.workers || [])).catch(() => {}); }, [sid]);
  useEffect(() => { if (!sid) return; setD(null); workersApi.performance(sid, { worker: worker || undefined, range }).then((r) => setD(r.data)).catch(() => setD({ totals: {}, rates: {}, daily: [], board: [] })); }, [sid, worker, range]);
  const tt = d?.totals || {};

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('workers.performance', 'Performance')}</h1><p className="text-sm text-gray-400">{t('workers.performanceSubtitle', 'Measured from what each worker actually did')}</p></div>
        <div className="flex gap-2">
          <select className="input-field text-sm !w-48" value={worker} onChange={(e) => setWorker(e.target.value)}><option value="">{t('workers.allWorkers', 'All workers')}</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.full_name}</option>)}</select>
          <div className="flex bg-gray-100 rounded-xl p-1">{['7d', '30d', '90d'].map((r) => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-bold ${range === r ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>{t(`workers.range.${r}`, { '7d': '7 days', '30d': '30 days', '90d': '3 months' }[r])}</button>)}</div>
        </div>
      </div>
      {!d ? <Skeleton className="h-96" /> : <>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 mb-4">
          <StatCard icon={ClipboardList} label={t('workers.assigned', 'Assigned')} value={tt.assigned ?? 0} />
          <StatCard icon={CheckCircle} tone="green" label={t('workers.confirmed', 'Confirmed')} value={tt.confirmed ?? 0} />
          <StatCard icon={Truck} tone="blue" label={t('workers.completed', 'Completed')} value={tt.completed ?? 0} />
          <StatCard icon={XCircle} tone="red" label={t('workers.cancelledRejected', 'Cancelled')} value={tt.cancelled ?? 0} />
          <StatCard icon={Percent} tone="violet" label={t('workers.confirmationRate', 'Confirmation rate')} value={d.rates?.confirmation != null ? `${d.rates.confirmation}%` : '—'} sub={d.rates?.completion != null ? t('workers.completionRateX', 'Completion {{x}}%', { x: d.rates.completion }) : null} />
          <StatCard icon={Timer} tone="amber" label={t('workers.avgTime', 'Avg. time to confirm')} value={d.avg_processing_minutes != null ? t('workers.nMin', '{{n}} min', { n: d.avg_processing_minutes }) : '—'} />
        </div>
        {d.earnings && Object.keys(d.earnings).length > 0 && <div className="glass-card-solid p-4 mb-4 flex flex-wrap items-center gap-4"><Wallet className="text-brand-600" size={20} /><span className="text-sm text-gray-500">{t('workers.currentEarnings', 'Current earnings this month')}:</span>{Object.entries(d.earnings).map(([c, v]) => <b key={c} className="text-lg text-gray-900">{formatMoney(v.fixed + v.commission, c)}</b>)}</div>}
        {!d.daily.length ? <EmptyState icon={ClipboardList} title={t('workers.noData', 'No activity in this period')} hint={t('workers.noDataHint', 'Numbers appear as workers confirm, prepare and deliver orders.')} /> : (
          <div className="grid xl:grid-cols-2 gap-4 mb-4">
            <div className="glass-card-solid p-4"><p className="font-black text-gray-900 mb-3">{t('workers.ordersTrend', 'Orders per day')}</p>
              <div className="h-64"><ResponsiveContainer><BarChart data={d.daily}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} width={30} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="confirmed" name={t('workers.confirmed', 'Confirmed')} fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="prepared" name={t('workers.prepared', 'Prepared')} fill="#8b5cf6" radius={[4, 4, 0, 0]} /><Bar dataKey="completed" name={t('workers.completed', 'Completed')} fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
            <div className="glass-card-solid p-4"><p className="font-black text-gray-900 mb-3">{t('workers.cancellationsTrend', 'Confirmed vs cancelled')}</p>
              <div className="h-64"><ResponsiveContainer><LineChart data={d.daily}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} width={30} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="confirmed" name={t('workers.confirmed', 'Confirmed')} stroke="#10b981" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="cancelled" name={t('workers.cancelledRejected', 'Cancelled')} stroke="#ef4444" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
          </div>
        )}
        {!worker && d.board?.length > 0 && <div className="glass-card-solid p-4">
          <p className="font-black text-gray-900 mb-3 flex items-center gap-2"><Trophy size={16} className="text-amber-500" />{t('workers.leaderboard', 'Leaderboard')}</p>
          <div className="space-y-1.5">{d.board.map((b, i) => (
            <Link key={b.staff_id} to={`/dashboard/workers/${b.staff_id}?tab=performance`} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50">
              <span className="w-6 text-center font-black text-gray-400">{i + 1}</span><Avatar worker={b} size={34} />
              <span className="flex-1 min-w-0"><span className="block font-bold text-gray-900 truncate">{b.name}</span><span className="block text-[11px] text-gray-400 truncate">{b.job_type ? t(`workers.jobName.${b.job_type}`, b.job_type) : ''}</span></span>
              <span className="grid grid-cols-3 gap-3 text-center text-xs"><span><b className="block text-sm text-emerald-600">{b.confirmed}</b>{t('workers.confirmedShort', 'conf.')}</span><span><b className="block text-sm text-violet-600">{b.prepared}</b>{t('workers.preparedShort', 'prep.')}</span><span><b className="block text-sm text-blue-600">{b.completed}</b>{t('workers.completedShort', 'deliv.')}</span></span>
            </Link>))}</div>
        </div>}
      </>}
    </DashboardLayout>
  );
}
