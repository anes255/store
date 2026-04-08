import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storeApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { User, Phone, Lock, Mail, MapPin, ArrowLeft, ArrowRight, Eye, EyeOff, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';

export default function CustomerAuth() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '', city: '', wilaya: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { storeApi.getStore(storeSlug).then(r => setStore(r.data)).catch(() => {}).finally(() => setStoreLoading(false)); }, [storeSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data } = await storeApi.loginCustomer(storeSlug, { phone: form.phone, password: form.password });
        setAuth(data.customer, data.token, 'customer');
        toast.success('Welcome back!');
        navigate(`/s/${storeSlug}`);
      } else {
        if (!form.name || !form.phone || !form.password) { toast.error('Name, phone, and password required'); setLoading(false); return; }
        const { data } = await storeApi.registerCustomer(storeSlug, form);
        setAuth(data.customer, data.token, 'customer');
        toast.success('Account created!');
        navigate(`/s/${storeSlug}`);
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  const pc = store?.primary_color || '#7C3AED';

  if (storeLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-brand-50 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl pointer-events-none"/>
      {/* Store Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2.5">
            {store?.logo ? <img src={store.logo} className="w-9 h-9 rounded-lg object-cover" alt=""/> : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
            <span className="text-lg font-extrabold text-gray-900">{store?.name||'Store'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft size={14}/>Store</Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Heart size={20}/></Link>
            <Link to={`/s/${storeSlug}/checkout`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ShoppingCart size={20}/></Link>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="flex justify-center mb-6">
            {store?.logo ? <img src={store.logo} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt=""/> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg" style={{backgroundColor:pc}}>{store?.name?.[0]||'S'}</div>}
          </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{mode === 'login' ? 'Log In' : 'Create Account'}</h1>
            <p className="text-gray-500 mb-8">{mode === 'login' ? 'Enter your phone number and password' : 'Fill in your details to get started'}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="input-label">Full Name</label>
                  <div className="relative"><User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-11" placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                </div>
              )}

              <div>
                <label className="input-label">Phone Number</label>
                <div className="relative"><Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="tel" className="input-field !pl-11" placeholder="0555123456" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="input-label">Email (optional)</label>
                  <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" className="input-field !pl-11" placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                </div>
              )}

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} className="input-field !pl-11 !pr-11" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
              </div>

              {mode === 'register' && (<>
                <div>
                  <label className="input-label">Address</label>
                  <div className="relative"><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field !pl-11" placeholder="Your delivery address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="input-label">City</label><input className="input-field" placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                  <div><label className="input-label">Wilaya</label><input className="input-field" placeholder="Wilaya" value={form.wilaya} onChange={e => setForm({...form, wilaya: e.target.value})} /></div>
                </div>
              </>)}

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-all" style={{backgroundColor:pc}}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{mode === 'login' ? 'Log In' : 'Create Account'} <ArrowRight size={18}/></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold hover:underline" style={{color:pc}}>
                {mode === 'login' ? 'Create Account' : 'Log In'}
              </button>
            </p>
        </div>
      </div>
    </div>
  );
}
