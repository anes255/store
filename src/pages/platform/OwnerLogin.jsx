import React, { useState, useEffect } from 'react';
import { getPlatformInfo } from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi, platformApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, ArrowRight, Eye, EyeOff, Store as StoreIcon, Check, Shield, RefreshCw, KeyRound, Phone, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

export default function OwnerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCurrentStore, setStores } = useStoreManagement();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storePicker, setStorePicker] = useState(null); // {owner, token, stores} when multi-store owner signs in
  // Two-step verification challenge: when 2FA is enabled the API returns
  // {requires_2fa,otp_token,method,masked} and we render a code prompt.
  const [twoFa, setTwoFa] = useState(null); // {otp_token, method, masked}
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  // ═══ Forgot password flow ═══
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('phone'); // phone | code | newpw
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState(''); // otp_token from server
  const [forgotCode, setForgotCode] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotNewPw2, setForgotNewPw2] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMasked, setForgotMasked] = useState('');
  const [forgotShowPw, setForgotShowPw] = useState(false);

  const forgotReset = () => { setForgotStep('phone'); setForgotPhone(''); setForgotCode(''); setForgotOtp(''); setForgotResetToken(''); setForgotNewPw(''); setForgotNewPw2(''); setForgotShowPw(false); };
  const openForgot = () => { forgotReset(); setForgotOpen(true); };
  const closeForgot = () => { setForgotOpen(false); forgotReset(); };

  const forgotRequestCode = async () => {
    if (!forgotPhone.trim()) return toast.error(t('auth.phoneRequired', 'Phone or email is required'));
    setForgotLoading(true);
    try {
      // Try owner endpoint first
      try {
        const { data } = await api.post('/owner/forgot-password', { identifier: forgotPhone.trim() });
        setForgotOtp(data.otp_token); setForgotMasked(data.masked); setForgotStep('code');
        toast.success(t('auth.resetCodeSent', 'Reset code sent via WhatsApp'));
        setForgotLoading(false); return;
      } catch (ownerErr) {
        if (ownerErr.response?.status !== 404) throw ownerErr;
      }
      // Try admin endpoint
      const { data } = await api.post('/admin/forgot-password', { phone: forgotPhone.trim() });
      setForgotOtp(data.otp_token); setForgotMasked(data.masked); setForgotStep('code');
      toast.success(t('auth.resetCodeSent', 'Reset code sent via WhatsApp'));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send reset code'); }
    setForgotLoading(false);
  };

  const forgotVerifyCode = async () => {
    if (!forgotCode || forgotCode.length < 6) return toast.error(t('auth.enter6Digit', 'Enter the 6-digit code'));
    setForgotLoading(true);
    try {
      // Try owner verify first
      try {
        const { data } = await api.post('/owner/forgot-password/verify', { otp_token: forgotOtp, code: forgotCode });
        setForgotResetToken(data.reset_token); setForgotStep('newpw');
        setForgotLoading(false); return;
      } catch (e) {
        if (e.response?.status === 401 && e.response?.data?.error?.includes('Invalid')) throw e;
        // Try admin verify
      }
      const { data } = await api.post('/admin/forgot-password/verify', { otp_token: forgotOtp, code: forgotCode });
      setForgotResetToken(data.reset_token); setForgotStep('newpw');
    } catch (e) { toast.error(e.response?.data?.error || 'Invalid code'); }
    setForgotLoading(false);
  };

  const forgotSetNewPassword = async () => {
    if (!forgotNewPw || forgotNewPw.length < 6) return toast.error(t('auth.pwMin6', 'Password must be at least 6 characters'));
    if (forgotNewPw !== forgotNewPw2) return toast.error(t('auth.pwMismatch', 'Passwords do not match'));
    setForgotLoading(true);
    try {
      // Try owner reset first
      try {
        await api.post('/owner/forgot-password/reset', { reset_token: forgotResetToken, new_password: forgotNewPw });
        toast.success(t('auth.pwResetSuccess', 'Password reset successfully! You can now sign in.'));
        closeForgot(); setForgotLoading(false); return;
      } catch (e) {
        if (e.response?.status === 401 && e.response?.data?.error?.includes('Invalid')) {
          // Try admin reset
        } else throw e;
      }
      await api.post('/admin/forgot-password/reset', { reset_token: forgotResetToken, new_password: forgotNewPw });
      toast.success(t('auth.pwResetSuccess', 'Password reset successfully! You can now sign in.'));
      closeForgot();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to reset password'); }
    setForgotLoading(false);
  };

  // Brand comes exclusively from the super-admin's platform settings.
  // Empty until /platform/info responds; render the name only once set.
  const [brand, setBrand] = useState({ logo: '', favicon: '', name: '' });
  useEffect(() => {
    getPlatformInfo().then(r => {
      const d = r.data || {};
      setBrand({ logo: d.site_logo || '', favicon: d.favicon || '', name: d.site_name || '' });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const identifier = (form.identifier || '').trim();
    const password = (form.password || '').trim();

    // Try store-owner login first
    try {
      const { data } = await ownerApi.login({ identifier, password });
      if (data.requires_2fa) {
        setTwoFa({ otp_token: data.otp_token, method: data.method, masked: data.masked });
        toast.success(data.message || `Code sent to your ${data.method === 'email' ? 'email' : 'WhatsApp'}`);
        setLoading(false);
        return;
      }
      if (data.redirect === '/admin/dashboard') {
        setAuth(data.owner, data.token, 'platform_admin');
        toast.success('Welcome, Super Admin!');
        window.location.href = '/admin/dashboard';
        return;
      }
      setAuth(data.owner, data.token, 'store_owner');
      setStores(data.stores);
      // Cache stores for staff so DashboardLayout can rehydrate them after a
      // page refresh (staff can't refetch via /owner/stores like owners do).
      try{if(data.owner?.is_staff)localStorage.setItem('staff_stores',JSON.stringify(data.stores||[]));}catch{}
      // If the user has several stores, show a picker so they choose which
      // one to manage before navigating. Applies to owners AND staff with
      // multi-store assignments.
      if ((data.stores || []).length > 1) {
        setStorePicker({ owner: data.owner, stores: data.stores });
        setLoading(false);
        return;
      }
      if (data.stores.length > 0) setCurrentStore(data.stores[0]);
      toast.success(`Welcome back, ${data.owner.name}!`);
      navigate('/dashboard');
      setLoading(false);
      return;
    } catch (err) {
      // Fall through to platform-admin login on 401/404; bubble other errors
      const status = err.response?.status;
      if (status && status !== 401 && status !== 403 && status !== 404) {
        toast.error(err.response?.data?.error || 'Login failed');
        setLoading(false);
        return;
      }
    }

    // Try platform-admin login (phone+password)
    try {
      const { data } = await platformApi.login({ phone: identifier, password });
      setAuth(data.admin, data.token, 'platform_admin');
      toast.success('Welcome, Super Admin!');
      window.location.href = '/admin/dashboard';
      return;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  const verifyTwoFa = async () => {
    if (!twoFaCode || twoFaCode.length < 6) return toast.error(t('auth.enter6Digit','Enter the 6-digit code'));
    setTwoFaLoading(true);
    try {
      const { data } = await api.post('/owner/login/verify-2fa', { otp_token: twoFa.otp_token, code: twoFaCode });
      setAuth(data.owner, data.token, 'store_owner');
      setStores(data.stores);
      try { if (data.owner?.is_staff) localStorage.setItem('staff_stores', JSON.stringify(data.stores || [])); } catch {}
      if ((data.stores || []).length > 1) {
        setStorePicker({ owner: data.owner, stores: data.stores });
        setTwoFa(null); setTwoFaCode('');
        setTwoFaLoading(false);
        return;
      }
      if (data.stores.length > 0) setCurrentStore(data.stores[0]);
      toast.success(`Welcome back, ${data.owner.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
    }
    setTwoFaLoading(false);
  };

  const resendTwoFa = async () => {
    try {
      const { data } = await api.post('/owner/login/resend-2fa', { otp_token: twoFa.otp_token });
      setTwoFa({ otp_token: data.otp_token, method: data.method, masked: data.masked });
      toast.success(t('auth.codeResent','Code resent'));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to resend'); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
      {/* Landing-style animated blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-brand-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/30 to-brand-500/30 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-400/20 to-brand-400/20 rounded-full blur-3xl"/>
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              {brand.logo || brand.favicon ? (
                <img src={brand.logo || brand.favicon} alt="" className="w-10 h-10 rounded-2xl object-cover bg-white shadow-lg shadow-brand-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>
              )}
              {brand.name && <span className="text-xl font-extrabold font-display">{brand.name}</span>}
            </Link>
            <LanguageSwitcher />
          </div>

          <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-2">{t('auth.login')}</h1>
          <p className="text-gray-500 mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">{t('auth.emailOrPhone')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input-field !pl-11" placeholder={t('auth.emailOrPhonePlaceholder')}
                  autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="username"
                  value={form.identifier} onChange={e => setForm({...form, identifier: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="input-label">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('auth.login')} <ArrowRight size={18}/></>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={openForgot} className="text-sm text-brand-600 font-semibold hover:underline">{t('auth.forgotPassword','Forgot password?')}</button>
          </div>
          <p className="mt-3 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('auth.register')}</Link>
          </p>
        </div>
      </div>

      {/* Two-step verification prompt — shown when /login responds with requires_2fa */}
      {twoFa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><Shield size={26} className="text-emerald-500" /></div>
              <h2 className="text-xl font-extrabold text-gray-900">{t('auth.twoStepTitle','Two-step verification')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {twoFa.method === 'email'
                  ? t('auth.twoStepEmailHelp','We sent a 6-digit code to {{m}}. Enter it below to finish signing in.').replace('{{m}}', twoFa.masked)
                  : t('auth.twoStepWaHelp','We sent a 6-digit code to your WhatsApp ({{m}}). Enter it below to finish signing in.').replace('{{m}}', twoFa.masked)}
              </p>
            </div>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && verifyTwoFa()}
              className="input-field text-center text-3xl tracking-[0.6em] font-mono mb-3"
              placeholder="------"
            />
            <button onClick={verifyTwoFa} disabled={twoFaLoading || twoFaCode.length !== 6} className="btn-primary w-full !py-3.5 mb-2 disabled:opacity-50">
              {twoFaLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('auth.verifyAndContinue','Verify & continue')}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => { setTwoFa(null); setTwoFaCode(''); }} className="text-gray-500 hover:underline">{t('auth.cancel','Cancel')}</button>
              <button onClick={resendTwoFa} className="text-brand-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={11} />{t('auth.resendCode','Resend code')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            {forgotStep === 'phone' && (<>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3"><KeyRound size={26} className="text-orange-500" /></div>
                <h2 className="text-xl font-extrabold text-gray-900">{t('auth.forgotPassword','Forgot password?')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('auth.forgotHelp','Enter your phone number or email. We\'ll send a reset code via WhatsApp.')}</p>
              </div>
              <div className="relative mb-3">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus className="input-field !pl-11" placeholder={t('auth.emailOrPhonePlaceholder','Phone or email')}
                  value={forgotPhone} onChange={e => setForgotPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && forgotRequestCode()} />
              </div>
              <button onClick={forgotRequestCode} disabled={forgotLoading} className="btn-primary w-full !py-3.5 mb-2 disabled:opacity-50">
                {forgotLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('auth.sendResetCode','Send reset code')}
              </button>
              <button onClick={closeForgot} className="w-full text-center text-sm text-gray-500 hover:underline">{t('auth.backToLogin','Back to login')}</button>
            </>)}

            {forgotStep === 'code' && (<>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><Shield size={26} className="text-emerald-500" /></div>
                <h2 className="text-xl font-extrabold text-gray-900">{t('auth.enterCode','Enter code')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('auth.resetCodeHelp','We sent a 6-digit code to {{m}}').replace('{{m}}', forgotMasked)}</p>
              </div>
              <input autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={forgotCode} onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && forgotVerifyCode()}
                className="input-field text-center text-3xl tracking-[0.6em] font-mono mb-3" placeholder="------" />
              <button onClick={forgotVerifyCode} disabled={forgotLoading || forgotCode.length !== 6} className="btn-primary w-full !py-3.5 mb-2 disabled:opacity-50">
                {forgotLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('auth.verify','Verify')}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button onClick={() => setForgotStep('phone')} className="text-gray-500 hover:underline flex items-center gap-1"><ArrowLeft size={11}/>{t('auth.back','Back')}</button>
                <button onClick={forgotRequestCode} className="text-brand-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={11}/>{t('auth.resendCode','Resend code')}</button>
              </div>
            </>)}

            {forgotStep === 'newpw' && (<>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3"><Lock size={26} className="text-brand-500" /></div>
                <h2 className="text-xl font-extrabold text-gray-900">{t('auth.setNewPassword','Set new password')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('auth.newPwHelp','Choose a strong password for your account.')}</p>
              </div>
              <div className="space-y-3 mb-3">
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={forgotShowPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder={t('auth.newPassword','New password')}
                    value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} />
                  <button type="button" onClick={() => setForgotShowPw(!forgotShowPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {forgotShowPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={forgotShowPw ? 'text' : 'password'} className="input-field !pl-11" placeholder={t('auth.confirmPassword','Confirm password')}
                    value={forgotNewPw2} onChange={e => setForgotNewPw2(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && forgotSetNewPassword()} />
                </div>
              </div>
              <button onClick={forgotSetNewPassword} disabled={forgotLoading} className="btn-primary w-full !py-3.5 mb-2 disabled:opacity-50">
                {forgotLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('auth.resetPassword','Reset password')}
              </button>
              <button onClick={closeForgot} className="w-full text-center text-sm text-gray-500 hover:underline">{t('auth.cancel','Cancel')}</button>
            </>)}
          </div>
        </div>
      )}

      {/* Multi-store picker shown right after login for owners with 2+ stores */}
      {storePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3"><StoreIcon size={26} className="text-brand-500" /></div>
              <h2 className="text-xl font-extrabold text-gray-900">{t('storePage.chooseStore','Choose a Store')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('storePage.chooseStoreHelp','Pick which store you want to manage right now.')}</p>
            </div>
            <div className="space-y-2">
              {storePicker.stores.map(st => (
                <button key={st.id} onClick={() => { setCurrentStore(st); toast.success(`Managing ${st.name}`); navigate('/dashboard'); }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-500 hover:bg-brand-50 transition-all text-left">
                  {st.logo ? <img src={st.logo} className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold">{(st.name || 'S')[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{st.name}</p>
                    <p className="text-xs text-gray-400 truncate">/{st.slug}{st.is_live !== false ? ' · Live' : ' · Draft'}</p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
