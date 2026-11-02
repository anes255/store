import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import OtpInput from '../../components/shared/OtpInput';
import PasswordStrength, { isStrongPassword } from '../../components/shared/PasswordStrength';
import { getPlatformInfo } from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi } from '../../utils/api';
import { useAuthStore, useAdminTheme } from '../../hooks/useStore';
import AuthShell, { AuthTabs } from '../../components/shared/AuthShell';
import { bilingualLabel } from '../../data/wilayaTranslations';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, User, Phone, MapPin, ArrowRight, Eye, EyeOff, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import WILAYA_CITIES from '../../data/wilayaCities';

export default function OwnerRegister() {
  const { t } = useTranslation();
  // The owner's own dashboard theme drives this screen too, so signing up
  // looks like the product they are signing up to.
  const theme = useAdminTheme();
  useEffect(() => { theme.init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pc = theme.primaryColor || '#7C3AED';
  const dark = theme.mode === 'dark';
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', address: '', city: '', wilaya: '' });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [otpToken, setOtpToken] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [code, setCode] = useState('');
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | error | success
  // After a correct code the card turns into a "Verification successful"
  // screen; the dashboard opens on its own after a moment (or on the button).
  const [verified, setVerified] = useState(null);
  const leftRef = useRef(false);
  const goToDashboard = (d) => { if (leftRef.current || !d) return; leftRef.current = true; setAuth(d.owner, d.token, 'store_owner'); navigate('/dashboard'); };
  const [resendIn, setResendIn] = useState(0);
  // Platform branding comes exclusively from the super admin's settings —
  // no hard-coded fallback name is shown if the API hasn't responded yet.
  const [brand, setBrand] = useState({ logo: '', favicon: '', name: '' });
  useEffect(() => {
    getPlatformInfo().then(r => {
      const d = r.data || {};
      setBrand({ logo: d.site_logo || '', favicon: d.favicon || '', name: d.site_name || '' });
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error(t('auth.allFieldsRequired'));
      return;
    }
    if (!isStrongPassword(form.password)) {
      toast.error(t('auth.pwNeedsAll','Your password needs a capital letter, a small letter, a number and a symbol, and at least 8 characters.'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordsDontMatch','Passwords do not match'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await ownerApi.requestOtp(form);
      setOtpToken(data.otp_token);
      setPhoneMasked(data.phone_masked || form.phone);
      setStep(2);
      setResendIn(60);
      toast.success(t('auth.codeSentWhatsApp','Verification code sent to your WhatsApp'));
    } catch (err) { toast.error(err.response?.data?.error || t('auth.failedSendCode','Failed to send code')); }
    setLoading(false);
  };

  const handleVerify = async (e, typed) => {
    e?.preventDefault?.();
    const c = typed || code;
    if (!c || c.length < 6) { toast.error(t('auth.enterCode','Enter the 6-digit code')); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await ownerApi.verifyOtp({ otp_token: otpToken, code: c });
      setCodeStatus('success');
      // the boxes flash green first, then the success screen takes over
      setTimeout(() => setVerified(data), 450);
      setTimeout(() => goToDashboard(data), 2600);
    } catch (err) {
      setCodeStatus('error');
      setTimeout(() => setCodeStatus('idle'), 900);
      toast.error(err.response?.data?.error || t('auth.invalidCode','Invalid code'));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      const { data } = await ownerApi.requestOtp(form);
      setOtpToken(data.otp_token);
      setResendIn(60);
      toast.success(t('auth.codeResent','Code resent'));
    } catch (err) { toast.error(err.response?.data?.error || t('auth.failedResend','Failed to resend')); }
    setLoading(false);
  };

  const set = (k) => (e) => setForm({...form, [k]: e.target.value});

  const header = (
    <>
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2">
          {brand.logo || brand.favicon ? (
            <img src={brand.logo || brand.favicon} alt="" className="w-10 h-10 rounded-2xl object-cover bg-white shadow-lg" style={{ boxShadow: `0 8px 20px ${pc}4d` }} />
          ) : (
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: pc, boxShadow: `0 8px 20px ${pc}4d` }}><ShoppingBag size={20} className="text-white" /></div>
          )}
          {brand.name && <span className="text-xl font-extrabold font-display">{brand.name}</span>}
        </Link>
        <LanguageSwitcher />
      </div>
      {step === 1 && <AuthTabs value="register" pc={pc} labels={{ login: t('auth.login'), register: t('auth.register') }} onChange={(m) => { if (m === 'login') navigate('/login'); }} />}
    </>
  );

  return (
    <AuthShell pc={pc} dark={dark} header={header}>
      <>

          {step === 1 ? (<>
          <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-2">{t('auth.register')}</h1>
          <p className="text-gray-500 mb-8">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">{t('auth.name')} *</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field !pl-11" placeholder={t('auth.namePlaceholder')} value={form.name} onChange={set('name')} required />
              </div>
            </div>
            <div>
              <label className="input-label">{t('auth.email')} *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="input-field !pl-11" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div>
              <label className="input-label">{t('auth.phone')} *</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" className="input-field !pl-11" placeholder={t('auth.phonePlaceholder')} value={form.phone} onChange={set('phone')} required />
              </div>
            </div>
            <div>
              <label className="input-label">{t('auth.password')} *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder={t('auth.pwPlaceholderStrong','8+ chars, A-Z, a-z, 0-9, symbol')}
                  value={form.password} onChange={set('password')} required minLength={8} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              <PasswordStrength password={form.password}/>
            </div>
            <div>
              <label className="input-label">{t('auth.confirmPassword','Confirm password')} *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw2 ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder={t('auth.confirmPasswordPlaceholder','Re-enter your password')}
                  value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={8} />
                <button type="button" onClick={()=>setShowPw2(!showPw2)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw2 ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{t('auth.passwordsDontMatch','Passwords do not match')}</p>
              )}
            </div>
            <div>
              <label className="input-label">{t('auth.address')}</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field !pl-11" placeholder={t('auth.addressPlaceholder')} value={form.address} onChange={set('address')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Wilaya is a dropdown so registrations are consistent with
                  the checkout flow — picking a wilaya filters the city list. */}
              <div>
                <label className="input-label">{t('auth.wilaya')}</label>
                <select className="input-field" value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value, city: '' })}>
                  <option value="">{t('auth.wilayaPlaceholder', '— Select wilaya —')}</option>
                  {/* Numbered and in both spellings, the same list as the store form */}
                  {Object.keys(WILAYA_CITIES).map((w, i) => <option key={w} value={w}>{String(i + 1).padStart(2, '0')} - {bilingualLabel(w)}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">{t('auth.city','الدائرة (City)')}</label>
                <select className="input-field disabled:opacity-60" value={form.city} onChange={set('city')} disabled={!form.wilaya}>
                  <option value="">{t('auth.cityPlaceholder', '— Select city —')}</option>
                  {(WILAYA_CITIES[form.wilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 mt-2" style={{ backgroundColor: pc }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('auth.sendCode','Send code')} <ArrowRight size={18}/></>}
            </button>
          </form>

          </>) : verified ? (
            <motion.div className="text-center py-6" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <div className="relative w-20 h-20 mx-auto mb-5">
                <motion.span className="absolute inset-0 rounded-full bg-emerald-400/30" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
                <motion.span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 grid place-items-center text-white shadow-lg shadow-emerald-500/40"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
                  <Check size={38} strokeWidth={3} />
                </motion.span>
              </div>
              <motion.h1 className="text-2xl font-extrabold font-display text-gray-900" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                {t('auth.verificationSuccessful', 'Verification successful')}
              </motion.h1>
              <motion.p className="text-gray-500 mt-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                {t('auth.accountCreated','Account created! Welcome aboard!')}
              </motion.p>
              <motion.button type="button" onClick={() => goToDashboard(verified)} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 mt-7"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {t('auth.continueToDashboard', 'Continue to dashboard')} <ArrowRight size={18}/>
              </motion.button>
            </motion.div>
          ) : (<>
            <button type="button" onClick={() => { setStep(1); setCode(''); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft size={16}/> {t('storePage.back','Back')}
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-4">
              <MessageCircle size={26} className="text-white"/>
            </div>
            <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-2">{t('auth.verifyWhatsApp','Verify WhatsApp')}</h1>
            <p className="text-gray-500 mb-8">{t('auth.codeSentTo','We sent a 6-digit code to')} <strong>{phoneMasked}</strong>. {t('auth.enterCodeBelow','Enter it below to finish creating your account.')}</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="input-label">{t('auth.verificationCode','Verification code')}</label>
                {/* One box per digit; the code is checked as soon as all 6 are in. */}
                <OtpInput value={code} onChange={(v) => { setCode(v); if (codeStatus !== 'idle') setCodeStatus('idle'); }}
                  status={codeStatus} disabled={codeStatus === 'success'}
                  onComplete={(v) => handleVerify(null, v)} />
                {codeStatus === 'success' && <p className="mt-3 text-center text-sm font-bold text-emerald-600">✓ {t('auth.verified','Verified!')}</p>}
              </div>
              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('auth.verifyAndCreate','Verify & Create Account')} <ArrowRight size={18}/></>}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading} className="text-brand-600 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                {resendIn > 0 ? `${t('auth.resendIn','Resend code in')} ${resendIn}s` : t('auth.resendCode','Resend code')}
              </button>
            </div>
          </>)}
      </>
    </AuthShell>
  );
}
