import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storeApi } from '../../utils/api';
import { useAuthStore, useBuyerTheme } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { User, Phone, Lock, Mail, MapPin, ArrowLeft, ArrowRight, Eye, EyeOff, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';

export default function CustomerAuth() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  // This screen ignored the storefront theme entirely and was always light.
  const buyerTheme = useBuyerTheme();
  const isDarkBuyer = buyerTheme.mode === 'dark';
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '', city: '', wilaya: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
        toast.success(t('store.welcomeBackShort','Welcome back!'));
        navigate(`/s/${storeSlug}`);
      } else {
        if (!form.name || !form.phone || !form.password) { toast.error(t('store.namePhonePasswordRequired','Name, phone, and password required')); setLoading(false); return; }
        const { data } = await storeApi.registerCustomer(storeSlug, form);
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2.5">
            {store?.logo ? <img src={store.logo} className="w-10 h-10 rounded-full object-cover bg-white/20 shrink-0" alt=""/> : <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 font-bold shrink-0" style={{color:headerText}}>{store?.name?.[0]||'S'}</div>}
            <span data-store-name className="store-header-title text-lg sm:text-2xl font-extrabold" style={{ color: headerText, WebkitTextFillColor: headerText }}>{store?.name||'Store'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold hover:bg-white/20 rounded-lg"><ArrowLeft size={14}/>{t('store.backToStore','Store')}</Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-2 hover:bg-white/20 rounded-full"><Heart size={20}/></Link>
            <Link to={`/s/${storeSlug}/checkout`} className="p-2 hover:bg-white/20 rounded-full"><ShoppingCart size={20}/></Link>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {/* The card's surface is set explicitly rather than via `bg-white/80`:
            that utility is not covered by the buyer dark-mode overrides, so in
            dark mode it stayed light grey while the text inside turned white. */}
        <div className="w-full max-w-md backdrop-blur-xl rounded-3xl shadow-2xl border p-8"
          style={{
            backgroundColor: isDarkBuyer ? 'rgba(12,12,12,0.88)' : 'rgba(255,255,255,0.85)',
            borderColor: pc + (isDarkBuyer ? '55' : '33'),
            ...(!isDarkBuyer && bodyTextColor ? { color: bodyTextColor } : {}),
          }}>
          <div className="flex justify-center mb-6">
            {store?.logo ? <img src={store.logo} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt=""/> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
          </div>
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
              </div>




              {mode === 'register' && (
                <>
                  <div>
                    <label className="input-label">{t('auth.city','الدائرة (City)')}</label>
                    <div className="relative"><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-11" placeholder={t('store.yourCity','Your city')} value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
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
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold hover:underline" style={{color:pc}}>
                {mode === 'login' ? t('auth.register','Create Account') : t('auth.login','Log In')}
              </button>
            </p>
        </div>
      </div>
    </div>
  );
}
