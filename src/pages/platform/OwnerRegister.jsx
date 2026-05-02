import React, { useState, useEffect } from 'react';
import { getPlatformInfo } from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, User, Phone, MapPin, ArrowRight, Eye, EyeOff, MessageCircle, ArrowLeft } from 'lucide-react';
import WILAYA_CITIES from '../../data/wilayaCities';

export default function OwnerRegister() {
  const { t } = useTranslation();
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
      toast.success('Verification code sent to your WhatsApp');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send code'); }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await ownerApi.verifyOtp({ otp_token: otpToken, code });
      setAuth(data.owner, data.token, 'store_owner');
      toast.success('Account created! Welcome aboard!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      const { data } = await ownerApi.requestOtp(form);
      setOtpToken(data.otp_token);
      setResendIn(60);
      toast.success('Code resent');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to resend'); }
    setLoading(false);
  };

  const set = (k) => (e) => setForm({...form, [k]: e.target.value});

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-brand-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/30 to-brand-500/30 rounded-full blur-3xl animate-pulse"/>
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-400/20 to-brand-400/20 rounded-full blur-3xl"/>
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-y-auto">
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
                <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder="Min 6 characters"
                  value={form.password} onChange={set('password')} required minLength={6} />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">{t('auth.confirmPassword','Confirm password')} *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw2 ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder={t('auth.confirmPasswordPlaceholder','Re-enter your password')}
                  value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={6} />
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
                  {Object.keys(WILAYA_CITIES).sort().map(w => <option key={w} value={w}>{w}</option>)}
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
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send code <ArrowRight size={18}/></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
          </>) : (<>
            <button type="button" onClick={() => { setStep(1); setCode(''); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft size={16}/> Back
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-4">
              <MessageCircle size={26} className="text-white"/>
            </div>
            <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-2">Verify WhatsApp</h1>
            <p className="text-gray-500 mb-8">We sent a 6-digit code to <strong>{phoneMasked}</strong>. Enter it below to finish creating your account.</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="input-label">Verification code</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-3xl tracking-[0.6em] font-mono"
                  placeholder="------"
                  required
                />
              </div>
              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Create Account <ArrowRight size={18}/></>}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading} className="text-brand-600 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
