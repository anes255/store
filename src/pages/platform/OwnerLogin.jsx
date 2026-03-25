import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function OwnerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCurrentStore, setStores } = useStoreManagement();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await ownerApi.login({ identifier: form.identifier, password: form.password });
      
      // If platform admin logged in through owner login
      if (data.redirect === '/admin/dashboard') {
        localStorage.setItem('user', JSON.stringify(data.owner));
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'platform_admin');
        toast.success('Welcome, Super Admin!');
        window.location.href = '/admin/dashboard';
        return;
      }
      
      setAuth(data.owner, data.token, 'store_owner');
      setStores(data.stores);
      if (data.stores.length > 0) setCurrentStore(data.stores[0]);
      toast.success(`Welcome back, ${data.owner.name}!`);
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-purple-600 to-brand-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random() * 200 + 50, height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }} />
          ))}
        </div>
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-4xl font-extrabold font-display mb-4">Manage your store effortlessly</h2>
          <p className="text-white/70 text-lg">Access your dashboard, track orders, manage products, and grow your business — all in one place.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>
              <span className="text-xl font-extrabold font-display">KyoMarket</span>
            </Link>
            <LanguageSwitcher compact />
          </div>

          <h1 className="text-3xl font-extrabold font-display text-gray-900 mb-2">{t('auth.login')}</h1>
          <p className="text-gray-500 mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">{t('auth.emailOrPhone')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input-field !pl-11" placeholder={t('auth.emailOrPhonePlaceholder')}
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
    </div>
  );
}
