import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Shield, Save, Trash2, Search, Briefcase, X } from 'lucide-react';
import DashboardLayout from '../../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import { workersApi } from '../../../utils/api';
import { ALL_PERMISSIONS } from '../../../utils/permissions';
import { dangerConfirm } from '../../../components/shared/DangerConfirm';
import { PermissionPicker, Skeleton } from './shared';

export default function WorkerRoles() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const { can, perms } = useStaffAccess();
  const sid = currentStore?.id;
  const canManage = can('workers_manage');
  const [roles, setRoles] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [sel, setSel] = useState(null);   // role being edited (or {new:true})
  const [draft, setDraft] = useState(null);
  const [applyAll, setApplyAll] = useState(true);
  const [q, setQ] = useState('');
  const [newJob, setNewJob] = useState('');
  const [tab, setTab] = useState('roles');
  const [saving, setSaving] = useState(false);

  const load = async (keep) => {
    try {
      const { data } = await workersApi.roles(sid); setRoles(data.roles || []);
      const pick = keep ? data.roles.find((r) => String(r.id) === String(keep)) : data.roles[0];
      if (pick) { setSel(pick); setDraft({ name: pick.name, description: pick.description || '', permissions: pick.permissions || [] }); }
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); }
  };
  useEffect(() => { if (sid) { load(); workersApi.jobTypes(sid).then((r) => setJobs(r.data.job_types || [])).catch(() => {}); } }, [sid]); // eslint-disable-line

  const choose = (r) => { setSel(r); setDraft({ name: r.name, description: r.description || '', permissions: r.permissions || [] }); };
  const save = async () => {
    if (!draft?.name?.trim()) return toast.error(t('workers.err.roleName', 'Give the role a name'));
    setSaving(true);
    try {
      if (sel?.new) { const { data } = await workersApi.createRole(sid, draft); toast.success(t('workers.roleCreated', 'Role created')); await load(data.role.id); }
      else { const { data } = await workersApi.updateRole(sid, sel.id, { ...draft, apply_to_workers: applyAll }); toast.success(applyAll && data.workers_updated ? t('workers.roleSavedN', 'Role saved — {{n}} worker(s) updated', { n: data.workers_updated }) : t('workers.saved', 'Saved')); await load(sel.id); }
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); }
    setSaving(false);
  };
  const del = async () => {
    if (!(await dangerConfirm({ title: t('workers.deleteRoleTitle', 'Delete this role?'), description: t('workers.deleteRoleDesc', 'Workers keep their current permissions. A role still used by workers cannot be deleted.'), holdLabel: t('workers.holdDeleteRole', 'Hold to delete role'), cancelLabel: t('workers.keepRole', 'Keep role') }))) return;
    try { await workersApi.removeRole(sid, sel.id); toast.success(t('workers.deleted', 'Deleted')); setSel(null); await load(); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); }
  };
  const shown = (roles || []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  const notAllowed = ALL_PERMISSIONS.filter((p) => !(draft?.permissions || []).includes(p.key)).slice(0, 8);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h1 className="text-xl sm:text-2xl font-black text-gray-900">{t('workers.rolesTitle', 'Roles & Permissions')}</h1><p className="text-sm text-gray-400">{t('workers.rolesSubtitle', 'What each kind of worker may see and do')}</p></div>
        <div className="flex bg-gray-100 rounded-xl p-1 self-start">
          {[['roles', t('workers.roles', 'Roles')], ['jobs', t('workers.jobTypes', 'Job types')]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${tab === k ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>{l}</button>)}
        </div>
      </div>

      {tab === 'jobs' ? (
        <div className="glass-card-solid p-4 max-w-2xl">
          <p className="text-sm text-gray-500 mb-3">{t('workers.jobsHint', 'Jobs describe what a worker does (shown on their profile and payroll). Access is controlled by their role.')}</p>
          <div className="flex flex-wrap gap-2 mb-4">{jobs.map((j) => (
            <span key={j.id} className="inline-flex items-center gap-1.5 ps-3 pe-1.5 py-1.5 rounded-full bg-gray-100 text-sm font-semibold text-gray-700"><Briefcase size={13} />{t(`workers.jobName.${j.name}`, j.name)}
              {canManage && !j.is_default && <button onClick={async () => { try { await workersApi.removeJobType(sid, j.id); setJobs(jobs.filter((x) => x.id !== j.id)); } catch {} }} className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400"><X size={13} /></button>}
            </span>))}</div>
          {canManage && <div className="flex gap-2"><input className="input-field text-sm" value={newJob} onChange={(e) => setNewJob(e.target.value)} placeholder={t('workers.customJob', 'Custom job…')} />
            <button className="btn-primary text-sm shrink-0" disabled={!newJob.trim()} onClick={async () => { try { const { data } = await workersApi.addJobType(sid, newJob.trim()); setJobs((js) => js.some((x) => x.id === data.job_type.id) ? js : [...js, data.job_type]); setNewJob(''); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); } }}>{t('workers.add', 'Add')}</button></div>}
        </div>
      ) : !roles ? <Skeleton className="h-96" /> : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="glass-card-solid p-3 h-fit">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1"><Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !ps-8 !py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('workers.searchRoles', 'Search roles…')} /></div>
              {canManage && <button className="btn-primary text-xs flex items-center gap-1 shrink-0" onClick={() => { setSel({ new: true }); setDraft({ name: '', description: '', permissions: [] }); }}><Plus size={14} />{t('workers.addRole', 'Add role')}</button>}
            </div>
            <div className="space-y-1">{shown.map((r) => (
              <button key={r.id} onClick={() => choose(r)} className={`w-full text-start rounded-xl px-3 py-2.5 flex items-center gap-3 ${String(sel?.id) === String(r.id) ? 'bg-brand-500/10 ring-1 ring-brand-400' : 'hover:bg-gray-50'}`}>
                <span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-600 grid place-items-center shrink-0"><Shield size={16} /></span>
                <span className="min-w-0"><span className="block text-sm font-bold text-gray-900 truncate">{t(`workers.roleName.${r.name}`, r.name)}</span><span className="block text-[11px] text-gray-400 truncate">{t('workers.nWorkers', '{{n}} worker(s)', { n: r.workers || 0 })} · {t('workers.nPerms', '{{n}} permissions', { n: (r.permissions || []).length })}</span></span>
              </button>))}</div>
          </div>
          {draft && (
            <div className="glass-card-solid p-4">
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div><label className="input-label">{t('workers.roleNameLabel', 'Role name')}</label><input className="input-field" disabled={!canManage} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div><label className="input-label">{t('workers.description', 'Description')}</label><input className="input-field" disabled={!canManage} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
              </div>
              <PermissionPicker value={draft.permissions} onChange={(v) => canManage && setDraft({ ...draft, permissions: v })} allowed={perms} />
              {notAllowed.length > 0 && <p className="text-[11px] text-gray-400 mt-3">{t('workers.notAllowedHint', 'Not allowed for this role')}: {notAllowed.map((p) => t(`workers.perm.${p.key}`, p.label)).join(', ')}{ALL_PERMISSIONS.length - (draft.permissions || []).length > 8 ? '…' : ''}</p>}
              {canManage && <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                {!sel?.new ? <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />{t('workers.applyToWorkers', 'Also update the {{n}} worker(s) with this role', { n: sel?.workers || 0 })}</label> : <span />}
                <div className="flex gap-2">
                  {!sel?.new && <button className="btn-ghost text-sm text-red-500 flex items-center gap-1" onClick={del}><Trash2 size={14} />{t('workers.delete', 'Delete')}</button>}
                  <button className="btn-primary text-sm flex items-center gap-1.5" disabled={saving} onClick={save}><Save size={14} />{sel?.new ? t('workers.createRole', 'Create role') : t('workers.saveRole', 'Save role')}</button>
                </div>
              </div>}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
