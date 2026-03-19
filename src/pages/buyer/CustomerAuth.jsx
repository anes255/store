import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { User, Phone, Lock, Mail, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CustomerAuth() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '', city: '', wilaya: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        const res = await storeApi.loginCustomer(storeSlug, { phone: form.phone, password: form.password });
        data = res.data;
      } else {
        const res = await storeApi.registerCustomer(storeSlug, form);
        data = res.data;
      }
      setAuth(data.customer, data.token, 'customer');
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate(`/s/${storeSlug}/profile`);
    } catch (err) { toast.error(err.response?.data?.error || 'Authentication failed'); }
    setLoading(false);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 text-gray-500 mb-6 text-sm hover:text-gray-700"><ArrowLeft size={16} />Back to store</Link>
        <div className="glass-card-solid p-8">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{t('auth.login')}</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>{t('auth.register')}</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div><label className="input-label">{t('auth.name')}</label>
                <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-10" value={form.name} onChange={set('name')} required /></div>
              </div>
            )}
            <div><label className="input-label">{t('auth.phone')}</label>
              <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-10" value={form.phone} onChange={set('phone')} required /></div>
            </div>
            {mode === 'register' && (
              <div><label className="input-label">{t('auth.email')}</label>
                <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" className="input-field !pl-10" value={form.email} onChange={set('email')} /></div>
              </div>
            )}
            <div><label className="input-label">{t('auth.password')}</label>
              <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" className="input-field !pl-10" value={form.password} onChange={set('password')} required /></div>
            </div>
            {mode === 'register' && (
              <>
                <div><label className="input-label">{t('auth.address')}</label><input className="input-field" value={form.address} onChange={set('address')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="input-label">{t('auth.city')}</label><input className="input-field" value={form.city} onChange={set('city')} /></div>
                  <div><label className="input-label">{t('auth.wilaya')}</label><input className="input-field" value={form.wilaya} onChange={set('wilaya')} /></div>
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{mode === 'login' ? t('auth.login') : t('auth.register')} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
