import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Check, KeyRound } from 'lucide-react';
import { workersApi } from '../../utils/api';
import PasswordInput from '../../components/shared/PasswordInput';
import PasswordStrength from '../../components/shared/PasswordStrength';

// Invitation ("Set password & login") and password-reset links for workers.
// The link carries a one-time token; it is checked before the form shows.
export default function WorkerReset() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [pw, setPw] = useState({ a: '', b: '' });
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { workersApi.tokenInfo(token).then((r) => setInfo(r.data)).catch((e) => setErr(e?.response?.data?.error || t('workers.linkInvalid', 'This link is invalid or has expired.'))); }, [token]); // eslint-disable-line
  const submit = async (e) => {
    e.preventDefault();
    if (pw.a !== pw.b) return toast.error(t('auth.passwordsDontMatch', 'Passwords do not match'));
    setLoading(true);
    try { const { data } = await workersApi.resetPassword(token, pw.a); setDone(data); } catch (e2) { toast.error(e2?.response?.data?.error || 'Failed'); }
    setLoading(false);
  };
  const invite = info?.kind === 'invite';
  return (
    <div className="auth-dark min-h-screen flex items-center justify-center p-4 text-gray-100" style={{ backgroundColor: '#111111' }}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 p-7 shadow-2xl" style={{ backgroundColor: 'rgba(24,24,24,0.9)' }}>
        {err ? <><p className="text-xl font-black text-gray-900 mb-2">{t('workers.linkExpired', 'Link not valid')}</p><p className="text-gray-400 text-sm">{err}</p><Link to="/worker/login" className="btn-primary w-full mt-6 inline-flex justify-center !py-3">{t('workers.goToLogin', 'Go to login')}</Link></>
          : !info ? <div className="w-8 h-8 border-2 border-white/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
          : done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white grid place-items-center mx-auto mb-4"><Check size={32} strokeWidth={3} /></div>
              <p className="text-xl font-black text-gray-900">{invite ? t('workers.accountReady', 'Your account is ready') : t('workers.passwordUpdated', 'Password updated')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('workers.loginWithX', 'Log in with {{x}}', { x: done.login })}</p>
              <Link to="/worker/login" className="btn-primary w-full mt-6 inline-flex justify-center !py-3">{t('workers.login', 'Login')}</Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center mb-4"><KeyRound size={22} /></div>
              <p className="text-2xl font-black text-gray-900">{invite ? t('workers.welcomeTo', 'Welcome to {{s}}', { s: info.store }) : t('workers.setNewPassword', 'Set a new password')}</p>
              <div className="text-sm text-gray-400 mt-2 space-y-0.5">
                <p>{info.name}{info.role ? ` · ${info.role}` : ''}</p>
                <p>{t('workers.login', 'Login')}: <b dir="ltr" className="text-gray-200">{info.login}</b></p>
              </div>
              <form onSubmit={submit} className="space-y-3 mt-6">
                <div><label className="input-label">{t('store.newPassword', 'New password')}</label><PasswordInput className="input-field" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} autoComplete="new-password" /><PasswordStrength password={pw.a} /></div>
                <div><label className="input-label">{t('auth.confirmPassword', 'Confirm password')}</label><PasswordInput className="input-field" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} autoComplete="new-password" /></div>
                <button className="btn-primary w-full !py-3" disabled={loading || !pw.a}>{invite ? t('workers.setPasswordLogin', 'Set password & login') : t('workers.savePassword', 'Save password')}</button>
              </form>
            </>
          )}
      </div>
    </div>
  );
}
