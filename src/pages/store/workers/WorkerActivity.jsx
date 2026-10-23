import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Activity, Download } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import { workersApi } from '../../../utils/api';
import { Skeleton, EmptyState, useActionLabel, useActivityFormat } from './shared';

// Who did what, when — order actions and account / admin actions together.
export default function WorkerActivity() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const actionLabel = useActionLabel();
  const sid = currentStore?.id;
  const [workers, setWorkers] = useState([]);
  const [f, setF] = useState({ worker: '', kind: 'all', action: '', from: '', to: '' });
  const [rows, setRows] = useState(null);
  const [more, setMore] = useState(false);
  const PAGE = 30;
  useEffect(() => { if (sid) workersApi.list(sid, { limit: 200 }).then((r) => setWorkers(r.data.workers || [])).catch(() => {}); }, [sid]);
  const load = async (offset = 0) => {
    try {
      const { data } = await workersApi.activity(sid, { worker: f.worker || undefined, kind: f.kind, action: f.action || undefined, from: f.from || undefined, to: f.to || undefined, limit: PAGE, offset });
      setRows((p) => (offset ? [...(p || []), ...data.entries] : data.entries)); setMore(data.has_more);
    } catch { setRows([]); }
  };
  useEffect(() => { if (sid) { setRows(null); load(0); } }, [sid, f]); // eslint-disable-line
  const { details, entity } = useActivityFormat();
  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [[t('workers.when', 'Date & time'), t('workers.who', 'Who'), t('workers.what', 'Action'), t('workers.entity', 'Entity'), t('workers.details', 'Details')].map(esc).join(',')].concat((rows || []).map((a) => [new Date(a.created_at).toISOString(), a.actor_name, actionLabel(a.action), a.target_type ? `${entity(a.target_type)} ${a.target || ''}` : '', details(a)].map(esc).join(','))).join('\n');
    const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); el.download = 'worker-activity.csv'; el.click();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('workers.activityLogs', 'Activity Logs')}</h1><p className="text-sm text-gray-400">{t('workers.activitySubtitle', 'Every worker action and every sensitive change, with who and when')}</p></div>
        <button onClick={exportCsv} disabled={!rows?.length} className="btn-secondary text-sm flex items-center gap-1.5 self-start"><Download size={15} />{t('workers.export', 'Export')}</button>
      </div>
      <div className="glass-card-solid p-3 mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select className="input-field text-sm" value={f.worker} onChange={(e) => setF({ ...f, worker: e.target.value })}><option value="">{t('workers.allWorkers', 'All workers')}</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.full_name}</option>)}</select>
        <select className="input-field text-sm" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, action: '' })}><option value="all">{t('workers.allActions', 'All actions')}</option><option value="orders">{t('workers.orderActions', 'Order actions')}</option><option value="account">{t('workers.accountActions', 'Account & admin actions')}</option></select>
        <select className="input-field text-sm" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}><option value="">{t('workers.anyAction', 'Any action')}</option>{['confirmed', 'prepared', 'completed', 'shipped', 'cancelled', 'assigned', 'called', 'worker_login', 'worker_created', 'worker_updated', 'compensation_changed', 'role_updated', 'payroll_approved', 'payroll_paid', 'worker_password_reset'].map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}</select>
        <input type="date" className="input-field text-sm" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
        <input type="date" className="input-field text-sm" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
      </div>
      {!rows ? <Skeleton className="h-96" /> : !rows.length ? <EmptyState icon={Activity} title={t('workers.noActivity', 'No activity yet')} /> : (
        <div className="glass-card-solid overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">{[t('workers.when', 'Date & time'), t('workers.who', 'Who'), t('workers.what', 'Action'), t('workers.entity', 'Entity'), t('workers.details', 'Details')].map((h) => <th key={h} className="px-3 py-3 text-start whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{rows.map((a, i) => (
              <tr key={i} className="border-b border-gray-50 align-top">
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-[12px]">{new Date(a.created_at).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{a.actor_id && a.kind === 'order' ? <Link to={`/dashboard/workers/${a.actor_id}`} className="hover:text-brand-600">{a.actor_name}</Link> : (['Owner', 'Staff'].includes(a.actor_name) ? t(`workers.jobName.${a.actor_name}`, a.actor_name) : (a.actor_name || '—'))}</td>
                <td className="px-3 py-2.5 whitespace-nowrap"><span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${a.kind === 'order' ? 'bg-brand-500/10 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>{actionLabel(a.action)}</span></td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{a.kind === 'order' ? <Link to={`/dashboard/orders?highlight=${a.target_id}`} className="hover:text-brand-600">#{a.target}</Link> : (a.target_type ? `${entity(a.target_type)}${a.target_type === 'order' && a.target ? ` #${a.target}` : ''}` : '—')}</td>
                <td className="px-3 py-2.5 text-gray-500 text-[12px] max-w-[360px] break-words">{details(a)}</td>
              </tr>))}</tbody>
          </table>
          {more && <div className="text-center p-3"><button className="btn-secondary text-sm" onClick={() => load(rows.length)}>{t('workers.loadMore', 'Load more')}</button></div>}
        </div>
      )}
    </DashboardLayout>
  );
}
