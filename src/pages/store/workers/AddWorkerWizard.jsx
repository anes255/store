import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, Copy, Camera, RefreshCw, Send, UserPlus, Store as StoreIcon, Mail, Link2 } from 'lucide-react';
import { workersApi } from '../../../utils/api';
import { useStoreManagement, useAuthStore } from '../../../hooks/useStore';
import useStaffAccess from '../../../hooks/useStaffAccess';
import PasswordInput from '../../../components/shared/PasswordInput';
import PasswordStrength from '../../../components/shared/PasswordStrength';
import { Sheet, PermissionPicker, RulesEditor, useRuleLabel, ruleSummary } from './shared';

const EMPTY = {
  first_name: '', last_name: '', phone: '', email: '', avatar: '', date_of_birth: '', address: '', notes: '',
  username: '', password: '', confirm: '', invite: false,
  job_type: '', role_id: '', permissions: [], compensation: [{ rule_type: 'fixed_monthly', amount: '', currency: 'DZD' }],
  store_mode: 'current', store_ids: [],
};

// Defined at module level so inputs keep focus while typing.
const Field = ({ label, children, req }) => <div><label className="input-label">{label}{req && ' *'}</label>{children}</div>;

export function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const a = new Uint32Array(12); crypto.getRandomValues(a);
  let p = Array.from(a, (n) => chars[n % chars.length]).join('');
  if (!/\d/.test(p)) p = p.slice(0, 11) + '7';
  return p;
}
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256, k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject; img.src = rd.result;
    };
    rd.onerror = reject; rd.readAsDataURL(file);
  });
}

export default function AddWorkerWizard({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentStore, stores } = useStoreManagement();
  const user = useAuthStore((s) => s.user);
  const { perms } = useStaffAccess();
  const ruleLabel = useRuleLabel();
  const [step, setStep] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newJob, setNewJob] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const sid = currentStore?.id;
  const currency = currentStore?.currency || 'DZD';

  useEffect(() => {
    if (!open || !sid) return;
    setStep(0); setDone(null); setF({ ...EMPTY, compensation: [{ rule_type: 'fixed_monthly', amount: '', currency }] });
    workersApi.jobTypes(sid).then((r) => setJobs(r.data.job_types || [])).catch(() => {});
    workersApi.roles(sid).then((r) => setRoles(r.data.roles || [])).catch(() => {});
  }, [open, sid]); // eslint-disable-line

  const STEPS = [
    t('workers.step.personal', 'Personal'), t('workers.step.account', 'Account'), t('workers.step.job', 'Job'), t('workers.step.role', 'Role'),
    t('workers.step.permissions', 'Permissions'), t('workers.step.pay', 'Compensation'), t('workers.step.access', 'Store access'), t('workers.step.review', 'Review'),
  ];
  const role = roles.find((r) => String(r.id) === String(f.role_id));

  const check = () => {
    if (step === 0) {
      if (!f.first_name.trim() || !f.last_name.trim()) return t('workers.err.name', 'First and last name are required.');
      if (!f.phone.trim()) return t('workers.err.phone', 'Phone number is required.');
      if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return t('workers.err.email', 'Email address is not valid.');
    }
    if (step === 1) {
      if (!f.email.trim() && !f.username.trim()) return t('workers.err.login', 'Give the worker an email or a username to log in with.');
      if (!f.invite) {
        if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) return t('workers.err.pw', 'Temporary password: at least 8 characters with letters and numbers.');
        if (f.password !== f.confirm) return t('auth.passwordsDontMatch', 'Passwords do not match');
      }
    }
    if (step === 2 && !f.job_type) return t('workers.err.job', 'Choose a job.');
    if (step === 3 && !f.role_id) return t('workers.err.role', 'Choose a role.');
    if (step === 5 && f.compensation.some((r) => r.amount !== '' && !(Number(r.amount) >= 0))) return t('workers.err.amount', 'Amounts must be numbers.');
    if (step === 6 && f.store_mode === 'multiple' && !f.store_ids.length) return t('workers.err.stores', 'Pick at least one store.');
    return null;
  };
  const next = () => { const e = check(); if (e) return toast.error(e); setStep((s) => Math.min(STEPS.length - 1, s + 1)); };
  const pickRole = (r) => set({ role_id: r.id, permissions: (r.permissions || []).filter((p) => !perms || perms.has(p)) });

  const storeIds = useMemo(() => {
    if (f.store_mode === 'all') return (stores || []).map((s) => s.id);
    if (f.store_mode === 'multiple') return [...new Set([sid, ...f.store_ids])];
    return [sid];
  }, [f.store_mode, f.store_ids, stores, sid]);

  const create = async () => {
    setSaving(true);
    try {
      const { data } = await workersApi.create(sid, {
        first_name: f.first_name, last_name: f.last_name, phone: f.phone, email: f.email, avatar: f.avatar || undefined,
        date_of_birth: f.date_of_birth || null, address: f.address, notes: f.notes, username: f.username,
        password: f.invite ? undefined : f.password, invite: f.invite, send_invitation: f.invite,
        job_type: f.job_type, role_id: f.role_id, role_label: role?.name, permissions: f.permissions,
        compensation: f.compensation.filter((r) => Number(r.amount) > 0), store_ids: storeIds,
      });
      setDone({ ...data, password: f.invite ? null : f.password });
      onCreated?.(data.worker);
    } catch (e) { toast.error(e?.response?.data?.error || t('workers.err.create', 'Could not create the worker')); }
    setSaving(false);
  };

  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success(t('store.copied', 'Copied!'))).catch(() => {});
  const loginText = done ? [
    `${t('workers.loginPage', 'Login page')}: ${done.login?.url}`,
    `${t('workers.emailOrUsername', 'Email or username')}: ${done.login?.identifier}`,
    done.password ? `${t('workers.tempPassword', 'Temporary password')}: ${done.password}` : `${t('workers.setPasswordLink', 'Set your password')}: ${done.invite_link}`,
  ].join('\n') : '';

  // ── success screen
  if (done) return (
    <Sheet open={open} onClose={onClose} title={t('workers.created', 'Worker created')}
      footer={<button className="btn-primary text-sm" onClick={() => { onClose(); navigate(`/dashboard/workers/${done.worker.id}`); }}>{t('workers.openProfile', 'Open worker profile')}</button>}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white grid place-items-center mx-auto mb-3 animate-[pop_.35s_ease-out]"><Check size={32} strokeWidth={3} /></div>
        <p className="text-lg font-black text-gray-900">{t('workers.createdMsg', 'Worker created successfully.')}</p>
        <p className="text-sm text-gray-500 mt-1">{done.worker.full_name} · {f.job_type}{done.stores > 1 ? ` · ${t('workers.nStores', '{{n}} stores', { n: done.stores })}` : ''}</p>
      </div>
      <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm font-mono whitespace-pre-wrap break-all text-gray-700">{loginText}</div>
      {done.invite_link && <p className="text-xs text-gray-500 mt-2">{done.sent?.length ? t('workers.inviteSentVia', 'Invitation sent by {{c}}.', { c: done.sent.join(' + ') }) : t('workers.inviteNotSent', 'No email or WhatsApp could be sent — share the link yourself.')}</p>}
      {done.password && <p className="text-xs text-amber-600 mt-2">{t('workers.tempPwNote', 'Share this password privately (not in a group chat). The worker should change it after the first login.')}</p>}
      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        <button className="btn-secondary text-sm flex items-center justify-center gap-2" onClick={() => copy(loginText)}><Copy size={14} />{t('workers.copyLogin', 'Copy login information')}</button>
        {done.invite_link
          ? <button className="btn-secondary text-sm flex items-center justify-center gap-2" onClick={() => copy(done.invite_link)}><Link2 size={14} />{t('workers.copyInvite', 'Copy invitation link')}</button>
          : <button className="btn-secondary text-sm flex items-center justify-center gap-2" onClick={async () => { try { const { data } = await workersApi.invite(sid, done.worker.id); copy(data.link); toast.success(data.sent?.length ? t('workers.inviteSent', 'Invitation sent') : t('workers.linkCopied', 'Link copied')); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); } }}><Send size={14} />{t('workers.sendInvite', 'Send invitation')}</button>}
      </div>
    </Sheet>
  );

  return (
    <Sheet open={open} onClose={onClose} wide title={t('workers.addWorker', 'Add Worker')}
      footer={<>
        {step > 0 && <button className="btn-ghost text-sm flex items-center gap-1" onClick={() => setStep(step - 1)}><ArrowLeft size={14} />{t('workers.back', 'Back')}</button>}
        <button className="btn-ghost text-sm" onClick={onClose}>{t('workers.cancel', 'Cancel')}</button>
        {step < STEPS.length - 1
          ? <button className="btn-primary text-sm flex items-center gap-1" onClick={next}>{t('workers.next', 'Next')}<ArrowRight size={14} /></button>
          : <button className="btn-primary text-sm flex items-center gap-1.5" disabled={saving} onClick={create}>{saving ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}{t('workers.createWorker', 'Create Worker')}</button>}
      </>}>
      {/* stepper */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <button type="button" onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 shrink-0 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-black ${i === step ? 'bg-brand-500 text-white shadow-md' : i < step ? 'bg-brand-500/15 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>{i < step ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
              <span className={`text-[11px] font-bold hidden md:inline ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-0.5 w-4 sm:w-6 rounded shrink-0 ${i < step ? 'bg-brand-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
      <p className="text-base font-black text-gray-900 mb-1">{step + 1}. {STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">{t('workers.personalHint', 'Basic information about the worker')}</p>
          <div className="flex items-center gap-3">
            <label className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 grid place-items-center overflow-hidden cursor-pointer shrink-0">
              {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full object-cover" /> : <Camera size={22} className="text-gray-400" />}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { set({ avatar: await readImage(file) }); } catch { toast.error(t('storePage.imageLoadFailed', 'Could not read that image')); } }} />
            </label>
            <div className="text-xs text-gray-500">{t('workers.profilePhoto', 'Profile photo')}{f.avatar && <button type="button" className="block text-red-500 mt-1" onClick={() => set({ avatar: '' })}>{t('workers.remove', 'Remove')}</button>}</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t('workers.firstName', 'First name')} req><input className="input-field" value={f.first_name} onChange={(e) => set({ first_name: e.target.value })} autoFocus /></Field>
            <Field label={t('workers.lastName', 'Last name')} req><input className="input-field" value={f.last_name} onChange={(e) => set({ last_name: e.target.value })} /></Field>
            <Field label={t('workers.phone', 'Phone number')} req><input className="input-field" dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0556 12 34 56" /></Field>
            <Field label={t('workers.email', 'Email')}><input className="input-field" dir="ltr" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="ahmed@email.com" /></Field>
            <Field label={`${t('workers.dob', 'Date of birth')} (${t('workers.optional', 'optional')})`}><input className="input-field" type="date" value={f.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} /></Field>
            <Field label={`${t('workers.address', 'Address')} (${t('workers.optional', 'optional')})`}><input className="input-field" value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
          </div>
          <Field label={`${t('workers.notes', 'Notes')} (${t('workers.optional', 'optional')})`}><textarea className="input-field" rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">{t('workers.accountHint', 'The worker gets their own login — never the owner\'s.')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t('workers.username', 'Username')}><input className="input-field" dir="ltr" value={f.username} onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} placeholder="ahmed.confirm" /></Field>
            <Field label={t('workers.email', 'Email')}><input className="input-field" dir="ltr" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[[false, t('workers.createAccount', 'Create account now'), t('workers.createAccountHint', 'You set a temporary password')], [true, t('workers.sendInvitation', 'Send invitation'), t('workers.sendInvitationHint', 'The worker sets their own password')]].map(([v, title, hint]) => (
              <button key={String(v)} type="button" onClick={() => set({ invite: v })} className={`text-left rounded-2xl border-2 p-3 transition-colors ${f.invite === v ? 'border-brand-500 bg-brand-500/5' : 'border-gray-200'}`}>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">{v ? <Mail size={14} /> : <UserPlus size={14} />}{title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>
              </button>
            ))}
          </div>
          {!f.invite ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between"><label className="input-label">{t('workers.tempPassword', 'Temporary password')} *</label>
                  <button type="button" className="text-[11px] font-bold text-brand-600 flex items-center gap-1" onClick={() => { const p = generatePassword(); set({ password: p, confirm: p }); }}><RefreshCw size={11} />{t('workers.generate', 'Generate')}</button></div>
                <PasswordInput className="input-field" value={f.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
                <PasswordStrength password={f.password} />
              </div>
              <Field label={t('auth.confirmPassword', 'Confirm password')} req><PasswordInput className="input-field" value={f.confirm} onChange={(e) => set({ confirm: e.target.value })} autoComplete="new-password" /></Field>
            </div>
          ) : (
            <p className="text-xs text-gray-500 rounded-2xl bg-gray-50 p-3">{t('workers.inviteExplain', 'We send a one-time link by email (and WhatsApp when your store\'s WhatsApp is connected). You can also copy the link after creating the worker. It expires in 7 days.')}</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{t('workers.jobHint', 'What the worker does. The job is separate from the role (what they may access).')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {jobs.map((j) => (
              <button key={j.id} type="button" onClick={() => set({ job_type: j.name })} className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold text-left transition-colors ${f.job_type === j.name ? 'border-brand-500 bg-brand-500/5 text-brand-700' : 'border-gray-200 text-gray-700'}`}>
                {t(`workers.jobName.${j.name}`, j.name)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input-field text-sm" value={newJob} onChange={(e) => setNewJob(e.target.value)} placeholder={t('workers.customJob', 'Custom job…')} />
            <button type="button" className="btn-secondary text-sm shrink-0" disabled={!newJob.trim()} onClick={async () => { try { const { data } = await workersApi.addJobType(sid, newJob.trim()); setJobs((js) => js.some((x) => x.id === data.job_type.id) ? js : [...js, data.job_type]); set({ job_type: data.job_type.name }); setNewJob(''); } catch (e) { toast.error(e?.response?.data?.error || 'Failed'); } }}>{t('workers.add', 'Add')}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{t('workers.roleHint', 'The role decides which pages and actions the worker can use.')}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" onClick={() => pickRole(r)} className={`text-left rounded-2xl border-2 p-3 transition-colors ${String(f.role_id) === String(r.id) ? 'border-brand-500 bg-brand-500/5' : 'border-gray-200'}`}>
                <p className="text-sm font-bold text-gray-900">{t(`workers.roleName.${r.name}`, r.name)}</p>
                <p className="text-[11px] text-gray-500">{r.description || ''} · {t('workers.nPerms', '{{n}} permissions', { n: (r.permissions || []).length })}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">{t('workers.permsHint', 'Taken from the role "{{r}}". Adjust them for this worker if needed.', { r: role?.name || '' })}</p>
          <PermissionPicker value={f.permissions} onChange={(v) => set({ permissions: v })} allowed={perms} compact />
        </div>
      )}

      {step === 5 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">{t('workers.payHint', 'How the worker is paid. Combine a fixed salary with commissions; each line keeps its own currency.')}</p>
          <RulesEditor rules={f.compensation} onChange={(v) => set({ compensation: v })} defaultCurrency={currency} />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-2">{t('workers.accessHint', 'Which of your stores this worker can work in. They never see other businesses.')}</p>
          {[['current', t('workers.currentStoreOnly', 'Current store only'), currentStore?.name],
            ...(!user?.is_staff && (stores || []).length > 1 ? [['multiple', t('workers.multipleStores', 'Multiple stores'), t('workers.pickStores', 'Pick the stores below')], ['all', t('workers.allStores', 'All my stores'), t('workers.nStores', '{{n}} stores', { n: stores.length })]] : [])].map(([v, title, hint]) => (
            <button key={v} type="button" onClick={() => set({ store_mode: v })} className={`w-full text-left rounded-2xl border-2 p-3 flex items-center gap-3 ${f.store_mode === v ? 'border-brand-500 bg-brand-500/5' : 'border-gray-200'}`}>
              <StoreIcon size={18} className="text-brand-600 shrink-0" /><span><span className="block text-sm font-bold text-gray-900">{title}</span><span className="block text-[11px] text-gray-500">{hint}</span></span>
            </button>
          ))}
          {f.store_mode === 'multiple' && (
            <div className="grid sm:grid-cols-2 gap-2 pt-1">
              {(stores || []).filter((s) => s.id !== sid).map((s) => { const on = f.store_ids.includes(s.id); return (
                <label key={s.id} className={`flex items-center gap-2 rounded-xl border p-2.5 text-sm cursor-pointer ${on ? 'border-brand-400 bg-brand-500/5' : 'border-gray-200'}`}>
                  <input type="checkbox" checked={on} onChange={() => set({ store_ids: on ? f.store_ids.filter((x) => x !== s.id) : [...f.store_ids, s.id] })} />{s.name}
                </label>
              ); })}
            </div>
          )}
        </div>
      )}

      {step === 7 && (
        <div className="space-y-2 text-sm">
          {[
            [t('workers.worker', 'Worker'), `${f.first_name} ${f.last_name} · ${f.phone}${f.email ? ' · ' + f.email : ''}`],
            [t('workers.login', 'Login'), `${f.username || f.email} · ${f.invite ? t('workers.sendInvitation', 'Send invitation') : t('workers.tempPassword', 'Temporary password')}`],
            [t('workers.job', 'Job'), f.job_type],
            [t('workers.role', 'Role'), role?.name],
            [t('workers.permissions', 'Permissions'), t('workers.nPerms', '{{n}} permissions', { n: f.permissions.length })],
            [t('workers.storeAccess', 'Store access'), storeIds.length > 1 ? t('workers.nStores', '{{n}} stores', { n: storeIds.length }) : currentStore?.name],
            [t('workers.compensation', 'Compensation'), ruleSummary(f.compensation.filter((r) => Number(r.amount) > 0), ruleLabel, t)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2.5"><span className="text-gray-500 shrink-0">{k}</span><span className="font-semibold text-gray-900 text-right break-words min-w-0">{v || '—'}</span></div>
          ))}
          {f.compensation.some((r) => r.rule_type !== 'fixed_monthly' && Number(r.amount) > 0) && <p className="text-[11px] text-gray-400">{t('workers.commissionNote', 'Commissions are counted from what the worker actually does (each confirmation, preparation…), never from an order\'s current status.')}</p>}
        </div>
      )}
    </Sheet>
  );
}

