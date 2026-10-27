import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordStrength from '../../components/shared/PasswordStrength';
import OtpInput from '../../components/shared/OtpInput';
import { StoreBottomNav, StoreHeaderIcons, StoreBrand } from '../../components/shared/StoreNav';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storeApi } from '../../utils/api';
import { useAuthStore, useBuyerTheme, useCartStore } from '../../hooks/useStore';
import { useStoreFont } from '../../utils/storeFont';
import WILAYA_CITIES from '../../data/wilayaCities';
import { bilingualLabel } from '../../data/wilayaTranslations';
import { isValidAlgerianPhone } from '../../utils/phone';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { User, Phone, Lock, Mail, MapPin, ArrowLeft, ArrowRight, Eye, EyeOff, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';

export default function CustomerAuth() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setAuth } = useAuthStore();
  // This screen ignored the storefront theme entirely and was always light.
  const buyerTheme = useBuyerTheme();
  const isDarkBuyer = buyerTheme.mode === 'dark';
  const cartCount = useCartStore(st => (st.items || []).length);
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  useStoreFont(store);
  const [mode, setMode] = useState('login');
  // Switching between "Log in" and "Create account": the pill moves at once,
  // the form fades out, the store logo holds the card for a beat, then the
  // other form fades in (the card resizes around it).
  const [pillMode, setPillMode] = useState('login');
  const [swapping, setSwapping] = useState(false);
  const swapTimers = useRef([]);
  useEffect(() => () => swapTimers.current.forEach(clearTimeout), []);
  const switchMode = (m) => {
    if (m === pillMode) return;
    swapTimers.current.forEach(clearTimeout);
    setPillMode(m); setSwapping(true);
    swapTimers.current = [setTimeout(() => setMode(m), 220), setTimeout(() => setSwapping(false), 680)];
  };
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', address: '', city: '', wilaya: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  // Forgot password: phone → 6-digit WhatsApp code → new password.
  const [forgot, setForgot] = useState(null); // null | { step, phone, otp_token, masked, code, reset_token, pw, pw2 }
  const fset = (patch) => setForgot((f) => ({ ...f, ...patch }));
  const sendCode = async () => {
    if (!isValidAlgerianPhone(forgot.phone)) return toast.error(t('checkout.errPhoneAlg', 'Please enter a valid Algerian phone (e.g. 0555123456)'));
    setLoading(true);
    try { const { data } = await storeApi.customerForgotPassword(storeSlug, { phone: forgot.phone, lang: (i18n.language || 'en').slice(0, 2) }); fset({ step: 'code', otp_token: data.otp_token, masked: data.masked, code: '' }); toast.success(t('auth.codeSentWhatsapp', 'Code sent to your WhatsApp')); }
    catch (err) { toast.error(err.response?.data?.error || t('storePage.failed', 'Failed')); }
    setLoading(false);
  };
  const verifyCode = async (code = forgot.code) => {
    if (String(code).length !== 6) return toast.error(t('auth.enter6Digit', 'Enter the 6-digit code'));
    setLoading(true);
    try { const { data } = await storeApi.customerForgotVerify(storeSlug, { otp_token: forgot.otp_token, code }); fset({ step: 'password', reset_token: data.reset_token, pw: '', pw2: '' }); }
    catch (err) { toast.error(err.response?.data?.error || t('storePage.failed', 'Failed')); fset({ code: '' }); }
    setLoading(false);
  };
  const resetPassword = async () => {
    if ((forgot.pw || '').length < 6) return toast.error(t('auth.pwMin6', 'Password must be at least 6 characters'));
    if (forgot.pw !== forgot.pw2) return toast.error(t('auth.pwMismatch', 'Passwords do not match'));
    setLoading(true);
    try { await storeApi.customerForgotReset(storeSlug, { reset_token: forgot.reset_token, new_password: forgot.pw }); toast.success(t('auth.pwResetSuccess', 'Password reset successfully! You can now sign in.')); setForm((f) => ({ ...f, phone: forgot.phone, password: '' })); setForgot(null); }
    catch (err) { toast.error(err.response?.data?.error || t('storePage.failed', 'Failed')); }
    setLoading(false);
  };

  useEffect(() => {
    try { const cached = JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); if (cached) { setStore(cached); setStoreLoading(false); } } catch {}
    storeApi.getStore(storeSlug).then(r => { setStore(r.data); try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(r.data)); } catch {} }).catch(() => {}).finally(() => setStoreLoading(false));
  }, [storeSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data } = await storeApi.loginCustomer(storeSlug, { phone: form.phone, password: form.password });
        setAuth(data.customer, data.token, 'customer');
        toast.success(data.deletion_cancelled ? t('store.deletionCancelledOnLogin','Welcome back! Your account deletion was cancelled.') : t('store.welcomeBackShort','Welcome back!'));
        navigate(`/s/${storeSlug}`);
      } else {
        if (!form.name || !form.phone || !form.password) { toast.error(t('store.namePhonePasswordRequired','Name, phone, and password required')); setLoading(false); return; }
        if (!isValidAlgerianPhone(form.phone)) { toast.error(t('checkout.errPhoneAlg','Please enter a valid Algerian phone (e.g. 0555123456)')); setLoading(false); return; }
        if (form.password.length < 6) { toast.error(t('auth.minChars','Min 6 characters')); setLoading(false); return; }
        if (form.password !== form.confirmPassword) { toast.error(t('auth.passwordsDontMatch','Passwords do not match')); setLoading(false); return; }
        if (!form.wilaya || !form.city) { toast.error(t('auth.pickWilayaCity','Please choose your wilaya and city')); setLoading(false); return; }
        const { confirmPassword, ...payload } = form;
        const { data } = await storeApi.registerCustomer(storeSlug, payload);
        setAuth(data.customer, data.token, 'customer');
        toast.success(t('auth.accountCreated','Account created!'));
        navigate(`/s/${storeSlug}`);
      }
    } catch (err) { toast.error(err.response?.data?.error || t('storePage.failed','Failed')); }
    setLoading(false);
  };

  const pc = store?.primary_color || '#7C3AED';
  // Same values the storefront header uses, so the two bars match exactly.
  const headerBg = pc;
  const headerText = '#ffffff';
  const headerFont = store?.header_font || 'Arial, sans-serif';
  const bodyTextColor = store?.text_color || undefined;

  if (storeLoading) return <div className={`min-h-screen flex items-center justify-center ${isDarkBuyer ? 'buyer-theme-dark bg-black' : 'bg-gray-50'}`}><div className="w-8 h-8 border-3 border-gray-200 rounded-full animate-spin" style={{borderTopColor:store?.primary_color||'#7C3AED'}}/></div>;

  return (
    <div className={`customer-auth-scope min-h-screen flex flex-col relative overflow-hidden ${isDarkBuyer ? 'buyer-theme-dark text-gray-100' : ''}`}
      style={{
        fontFamily: headerFont,
        // Exposed to CSS so .input-field focus rings pick up the store colour
        // instead of the platform's gold.
        '--store-pc': pc,
        '--store-pc-ring': pc + '55',
        // Dark mode follows the storefront's own dark background setting.
        ...(isDarkBuyer
          ? { background: store?.config?.store_dark_bg_color || '#000000' }
          : { background: store?.config?.store_bg_color || `linear-gradient(135deg, #f8fafc 0%, #ffffff 45%, ${pc}1f 100%)` }),
      }}>
      {/* Ambient blobs, tinted with the store's own colour so the sign-in
          screen belongs to the same storefront the buyer came from. */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (isDarkBuyer ? '33' : '55') }}/>
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (isDarkBuyer ? '22' : '44') }}/>
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (isDarkBuyer ? '1a' : '33') }}/>
      {/* Store Header */}
      <header className="backdrop-blur-xl sticky top-0 z-30 shadow-md" style={{ backgroundColor: headerBg, color: headerText, fontFamily: headerFont }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <StoreBrand store={store} storeSlug={storeSlug} color={headerText}/>
          <div className="flex items-center gap-2">
            <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold hover:bg-white/20 rounded-lg"><ArrowLeft size={14}/>{t('store.backToStore','Store')}</Link>
            <StoreHeaderIcons storeSlug={storeSlug} store={store}/>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {/* The card's surface is set explicitly rather than via `bg-white/80`:
            that utility is not covered by the buyer dark-mode overrides, so in
            dark mode it stayed light grey while the text inside turned white. */}
        <motion.div layout transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
          initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-full max-w-md backdrop-blur-xl rounded-3xl shadow-2xl border p-8 overflow-hidden"
          style={{
            backgroundColor: isDarkBuyer ? 'rgba(12,12,12,0.88)' : 'rgba(255,255,255,0.85)',
            borderColor: pc + (isDarkBuyer ? '55' : '33'),
            ...(!isDarkBuyer && bodyTextColor ? { color: bodyTextColor } : {}),
          }}>
          {/* Log in / Create account switch — a pill slides under the active side */}
          <div className="relative grid grid-cols-2 p-1 mb-6 rounded-2xl" style={{ backgroundColor: pc + '14' }}>
            <motion.span aria-hidden className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-md"
              initial={false} animate={{ left: pillMode === 'login' ? 4 : 'calc(50%)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ backgroundColor: pc }} />
            {['login', 'register'].map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`relative z-10 py-2 text-sm font-bold rounded-xl transition-colors duration-200 ${pillMode === m ? 'text-white' : 'text-gray-500'}`}>
                {m === 'login' ? t('auth.login','Log In') : t('auth.register','Create Account')}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-6">
            {store?.logo ? <img src={store.logo} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt=""/> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
          </div>
          <motion.div initial={false}
            animate={{ opacity: swapping ? 0 : 1, scale: swapping ? 0.97 : 1, filter: swapping ? 'blur(6px)' : 'blur(0px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }} style={{ pointerEvents: swapping ? 'none' : undefined }}>
            {forgot ? (
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{forgot.step === 'password' ? t('auth.setNewPassword', 'Set new password') : t('auth.forgotPassword', 'Forgot password?')}</h1>
                <p className="text-gray-500 mb-6">{forgot.step === 'phone' ? t('store.forgotPhoneHelp', 'Enter the phone number of your account. We will send you a code on WhatsApp.') : forgot.step === 'code' ? t('auth.resetCodeHelp', 'We sent a 6-digit code to {{m}}', { m: forgot.masked }) : t('auth.newPwHelp', 'Choose a strong password for your account.')}</p>
                {forgot.step === 'phone' && <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4">
                  <div className="relative"><Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" autoFocus className="input-field !pl-11" placeholder="0555123456" value={forgot.phone} onChange={(e) => fset({ phone: e.target.value })} /></div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90" style={{ backgroundColor: pc }}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.sendResetCode', 'Send reset code')}</button>
                </form>}
                {forgot.step === 'code' && <div className="space-y-4">
                  <OtpInput value={forgot.code} onChange={(v) => fset({ code: v })} onComplete={(v) => verifyCode(v)} color={pc} disabled={loading} />
                  <button type="button" disabled={loading} onClick={() => verifyCode()} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90" style={{ backgroundColor: pc }}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.verify', 'Verify')}</button>
                  <button type="button" disabled={loading} onClick={sendCode} className="w-full text-sm font-semibold hover:underline" style={{ color: pc }}>{t('storePage.resendCode', 'Resend code')}</button>
                </div>}
                {forgot.step === 'password' && <form onSubmit={(e) => { e.preventDefault(); resetPassword(); }} className="space-y-4">
                  <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type={showPw ? 'text' : 'password'} autoFocus className="input-field !pl-11 !pr-11" placeholder={t('auth.newPassword', 'New password')} value={forgot.pw} onChange={(e) => fset({ pw: e.target.value })} /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
                  <PasswordStrength password={forgot.pw} />
                  <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type={showPw ? 'text' : 'password'} className="input-field !pl-11" placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')} value={forgot.pw2} onChange={(e) => fset({ pw2: e.target.value })} /></div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90" style={{ backgroundColor: pc }}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.resetPassword', 'Reset password')}</button>
                </form>}
                <button type="button" onClick={() => setForgot(null)} className="mt-6 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:underline"><ArrowLeft size={14} />{t('auth.backToLogin', 'Back to login')}</button>
              </div>
            ) : <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{mode === 'login' ? t('auth.login','Log In') : t('auth.register','Create Account')}</h1>
            <p className="text-gray-500 mb-8">{mode === 'login' ? t('store.enterPhonePassword','Enter your phone number and password') : t('store.fillDetails','Fill in your details to get started')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="input-label">{t('auth.name','Full Name')}</label>
                  <div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-11" placeholder={t('auth.namePlaceholder','Your full name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                </div>
              )}

              <div>
                <label className="input-label">{t('auth.phone','Phone Number')}</label>
                <div className="relative"><Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" className="input-field !pl-11" placeholder="0555123456" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="input-label">{t('auth.email','Email')} ({t('store.optional','optional')})</label>
                  <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" className="input-field !pl-11" placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                </div>
              )}

              <div>
                <label className="input-label">{t('auth.password','Password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
                {mode !== 'login' && <PasswordStrength password={form.password}/>}
                {mode === 'login' && <div className="flex justify-end mt-1.5"><button type="button" onClick={() => setForgot({ step: 'phone', phone: form.phone })} className="text-xs font-semibold hover:underline" style={{ color: pc }}>{t('auth.forgotPassword', 'Forgot password?')}</button></div>}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="input-label">{t('auth.confirmPassword','Confirm password')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder={t('auth.confirmPasswordPlaceholder','Re-enter your password')} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-red-500 mt-1">{t('auth.passwordsDontMatch','Passwords do not match')}</p>}
                </div>
              )}




              {mode === 'register' && (
                <>
                  <div>
                    <label className="input-label">{t('auth.wilaya','Wilaya')}</label>
                    <div className="relative"><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select className="input-field !pl-11" value={form.wilaya} onChange={e => setForm({...form, wilaya: e.target.value, city: ''})} required>
                        <option value="">{t('auth.wilayaPlaceholder','— Select wilaya —')}</option>
                        {Object.keys(WILAYA_CITIES).map((w, i) => <option key={w} value={w}>{String(i + 1).padStart(2, '0')} - {bilingualLabel(w)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">{t('auth.city','الدائرة (City)')}</label>
                    <div className="relative"><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select className="input-field !pl-11 disabled:opacity-60" value={form.city} onChange={e => setForm({...form, city: e.target.value})} disabled={!form.wilaya} required>
                        <option value="">{form.wilaya ? t('auth.cityPlaceholder','— Select city —') : t('checkout.selectWilayaFirst','Select wilaya first')}</option>
                        {(WILAYA_CITIES[form.wilaya] || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">{t('auth.address','Address')}</label>
                    <div className="relative"><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-11" placeholder={t('auth.addressPlaceholder','Your address')} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-all" style={{backgroundColor:pc}}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{mode === 'login' ? t('auth.login','Log In') : t('auth.register','Create Account')} <ArrowRight size={18}/></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === 'login' ? t('auth.noAccount',"Don't have an account?") + ' ' : t('auth.hasAccount','Already have an account?') + ' '}
              <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="font-semibold hover:underline" style={{color:pc}}>
                {mode === 'login' ? t('auth.register','Create Account') : t('auth.login','Log In')}
              </button>
            </p>
            </>}
          </motion.div>
          {/* logo interlude while the forms swap */}
          <motion.div aria-hidden className="absolute inset-0 grid place-items-center pointer-events-none" initial={false}
            animate={{ opacity: swapping ? 1 : 0 }} transition={{ duration: 0.18 }}>
            <motion.div className="relative" initial={false}
              animate={{ scale: swapping ? 1 : 0.6, rotate: swapping ? 0 : -12 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
              <span className="absolute -inset-2 rounded-[22px] border-2 border-t-transparent animate-spin" style={{ borderColor: pc, borderTopColor: 'transparent', animationDuration: '0.9s' }} />
              {store?.logo ? <img src={store.logo} className="w-16 h-16 rounded-2xl object-cover shadow-xl" alt=""/> : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <StoreBottomNav storeSlug={storeSlug} store={store} pc={pc}/>
    </div>
  );
}
