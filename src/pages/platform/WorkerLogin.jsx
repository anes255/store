import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag, Users, ShieldCheck, TrendingUp, Wallet, ArrowLeft } from 'lucide-react';
import { workersApi, getPlatformInfo } from '../../utils/api';
import { useAuthStore, useStoreManagement, useLangStore } from '../../hooks/useStore';

// Worker login — workers have their own accounts (never the owner's). After
// logging in they land on "My work" inside the normal dashboard, which only
// shows what their role allows.
export default function WorkerLogin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { setCurrentStore, setStores } = useStoreManagement();
  const [brand, setBrand] = useState({ name: 'MarketDz', logo: '' });
  const [form, setForm] = useState({ identifier: '', password: '', remember: true });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const [currency, setCurrency] = useState(() => { try { return localStorage.getItem('display_currency') || 'DZD'; } catch { return 'DZD'; } });
  useEffect(() => { getPlatformInfo().then((r) => setBrand({ name: r.data?.site_name || 'MarketDz', logo: r.data?.site_logo || '' })).catch(() => {}); }, []);
  useEffect(() => { if (params.get('disabled')) toast.error(t('workers.sessionEnded', 'Your session has ended. Please log in again.')); }, []); // eslint-disable-line
  const setLang = (l) => { try { useLangStore.getState().setLang(l); } catch {} i18n.changeLanguage(l); };
  const pickCurrency = (c) => { setCurrency(c); try { localStorage.setItem('display_currency', c); } catch {} };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) return toast.error(t('workers.err.fillLogin', 'Enter your email or username and password'));
    setLoading(true);
    try {
      const { data } = await workersApi.login(form);
      setAuth(data.owner, data.token, 'store_owner');
      setStores(data.stores);
      try { localStorage.setItem('staff_stores', JSON.stringify(data.stores || [])); } catch {}
      if (data.stores?.length) setCurrentStore(data.stores[0]);
      if (data.owner?.language && data.owner.language !== i18n.language) setLang(data.owner.language);
      toast.success(t('workers.welcomeBack', 'Welcome back, {{n}}!', { n: (data.owner?.name || '').split(' ')[0] }));
      navigate('/dashboard/me');
    } catch (err) { toast.error(err?.response?.data?.error || t('workers.err.login', 'Login failed')); }
    setLoading(false);
  };
  const sendReset = async (e) => {
    e.preventDefault();
    if (!form.identifier) return toast.error(t('workers.err.identifier', 'Enter your email or username'));
    setLoading(true);
    try { await workersApi.forgot(form.identifier); setSent(true); } catch { setSent(true); }
    setLoading(false);
  };

  return (
    <div className="auth-dark min-h-screen relative overflow-hidden text-gray-100" style={{ backgroundColor: '#111111' }}>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-brand-500/25 to-orange-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-orange-600/20 to-brand-600/25 rounded-full blur-3xl" />
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-[1fr_300px] rounded-3xl shadow-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: 'rgba(24,24,24,0.88)', backdropFilter: 'blur(20px)' }}>
          <div className="p-6 sm:p-10">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2">
                {brand.logo ? <img src={brand.logo} alt="" className="w-10 h-10 rounded-2xl object-cover bg-white" /> : <div className="w-10 h-10 rounded-2xl bg-brand-500 grid place-items-center"><ShoppingBag size={20} className="text-white" /></div>}
                <span className="text-xl font-extrabold font-display">{brand.name}</span>
              </Link>
              <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-bold">{['ar', 'fr', 'en'].map((l) => <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1.5 ${i18n.language === l ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>{l.toUpperCase()}</button>)}</div>
            </div>
            {!forgot ? <>
              <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-1">{t('workers.workerLogin', 'Worker Login')}</h1>
              <p className="text-gray-500 mb-7">{t('workers.workerLoginSub', 'Access your worker account')}</p>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="input-label">{t('workers.emailOrUsername', 'Email or username')}</label>
                  <div className="relative"><Mail size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input-field !ps-11" dir="ltr" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="username" placeholder="ahmed.confirm" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></div></div>
                <div><label className="input-label">{t('auth.password', 'Password')}</label>
                  <div className="relative"><Lock size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPw ? 'text' : 'password'} className="input-field !ps-11 !pe-11" autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer"><input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="accent-orange-500" />{t('workers.rememberMe', 'Remember me')}</label>
                  <button type="button" onClick={() => { setForgot(true); setSent(false); }} className="text-brand-500 font-semibold hover:underline">{t('auth.forgotPassword', 'Forgot password?')}</button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 text-base">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('workers.login', 'Login')} <ArrowRight size={18} /></>}
                </button>
              </form>
              <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-bold">{['DZD', 'USD', 'EUR'].map((c) => <button key={c} onClick={() => pickCurrency(c)} className={`px-3 py-1.5 ${currency === c ? 'bg-brand-500 text-white' : 'text-gray-400'}`}>{c}</button>)}</div>
                <Link to="/login" className="text-xs text-gray-500 hover:text-gray-300">{t('workers.ownerLoginLink', 'Store owner? Log in here')}</Link>
              </div>
            </> : (
              <>
                <button onClick={() => setForgot(false)} className="text-sm text-gray-400 flex items-center gap-1 mb-4"><ArrowLeft size={14} />{t('workers.back', 'Back')}</button>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{t('auth.forgotPassword', 'Forgot password?')}</h1>
                {sent ? <p className="text-gray-400 mt-3">{t('workers.resetSent', 'If an account exists, a reset link has been sent to its email or WhatsApp. It expires in 1 hour. No message? Ask your store admin to reset your password.')}</p> : <>
                  <p className="text-gray-500 mb-5">{t('workers.forgotHint', 'Enter your email or username. We send a reset link to your email (or WhatsApp).')}</p>
                  <form onSubmit={sendReset} className="space-y-4">
                    <input className="input-field" dir="ltr" placeholder={t('workers.emailOrUsername', 'Email or username')} value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
                    <button className="btn-primary w-full !py-3" disabled={loading}>{t('workers.sendResetLink', 'Send password reset link')}</button>
                  </form></>}
              </>
            )}
          </div>
          <div className="hidden md:flex flex-col justify-center gap-5 p-8 bg-white/[0.03] border-s border-white/10">
            <Users size={36} className="text-brand-500" />
            <p className="text-xl font-black text-gray-900 leading-tight">{t('workers.portalTitle', 'Your work makes the difference')}</p>
            {[[ShieldCheck, t('workers.portalSecure', 'Your own secure account')], [TrendingUp, t('workers.portalPerf', 'Track your performance')], [Wallet, t('workers.portalEarn', 'See your earnings')]].map(([I, l], i) => <p key={i} className="flex items-center gap-3 text-sm text-gray-400"><span className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-500 grid place-items-center"><I size={17} /></span>{l}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
