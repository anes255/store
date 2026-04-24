import React, { useState, useEffect } from 'react';
import { getPlatformInfo } from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi, platformApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, ArrowRight, Eye, EyeOff, Store as StoreIcon, Check } from 'lucide-react';

export default function OwnerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCurrentStore, setStores } = useStoreManagement();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storePicker, setStorePicker] = useState(null); // {owner, token, stores} when multi-store owner signs in
  // Pull the platform branding (logo/favicon/site name) so the login screen
  // reflects whatever the super-admin has configured.
  const [brand, setBrand] = useState({ logo: '', favicon: '', name: 'KyoMarket' });
  useEffect(() => {
    getPlatformInfo().then(r => {
      const d = r.data || {};
      setBrand({ logo: d.site_logo || '', favicon: d.favicon || '', name: d.site_name || 'KyoMarket' });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const identifier = (form.identifier || '').trim();
    const password = (form.password || '').trim();

    // Try store-owner login first
    try {
      const { data } = await ownerApi.login({ identifier, password });
      if (data.redirect === '/admin/dashboard') {
        setAuth(data.owner, data.token, 'platform_admin');
        toast.success('Welcome, Super Admin!');
        window.location.href = '/admin/dashboard';
        return;
      }
      setAuth(data.owner, data.token, 'store_owner');
      setStores(data.stores);
      // If the owner has several stores, show a picker so they choose which
      // one to manage before navigating.
      if ((data.stores || []).length > 1 && !data.owner.is_staff) {
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
              <span className="text-xl font-extrabold font-display">{brand.name}</span>
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

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('auth.register')}</Link>
          </p>
        </div>
      </div>

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
