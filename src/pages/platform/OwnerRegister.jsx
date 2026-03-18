import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ownerApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { ShoppingBag, Mail, Lock, User, Phone, MapPin, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function OwnerRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '', city: '', wilaya: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error(t('auth.allFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await ownerApi.register(form);
      setAuth(data.owner, data.token, 'store_owner');
      toast.success('Account created! Welcome aboard!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); }
    setLoading(false);
  };
  const set = (k) => (e) => setForm({...form, [k]: e.target.value});

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-brand-500 to-purple-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random() * 300 + 50, height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.2,
            }} />
          ))}
        </div>
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-4xl font-extrabold font-display mb-4">{t('auth.registerHeroTitle')}</h2>
          <p className="text-white/70 text-lg mb-8">{t('auth.registerHeroSubtitle')}</p>
          <div className="space-y-3">
            {['Set up in under 5 minutes', 'Sell across 58 wilayas', 'AI-powered features included', 'Local payment methods'].map((f,i)=>(
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>{f}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>
              <span className="text-xl font-extrabold font-display">KyoMarket</span>
            </Link>
            <LanguageSwitcher compact />
          </div>

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
              <label className="input-label">{t('auth.address')}</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field !pl-11" placeholder={t('auth.addressPlaceholder')} value={form.address} onChange={set('address')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="input-label">{t('auth.city')}</label><input className="input-field" placeholder="City" value={form.city} onChange={set('city')} /></div>
              <div><label className="input-label">{t('auth.wilaya')}</label><input className="input-field" placeholder="Wilaya" value={form.wilaya} onChange={set('wilaya')} /></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('auth.register')} <ArrowRight size={18}/></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
