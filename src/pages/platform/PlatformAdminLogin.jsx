import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import { ShieldCheck, Phone, Lock, ArrowRight } from 'lucide-react';

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
  const { setCurrentStore } = useStoreManagement();
  const [form, setForm] = useState({ phone:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      // Clear any existing store owner session first
      logout();
      setCurrentStore(null);
      
      const { data } = await platformApi.login(form);
      
      // Set auth with platform_admin role
      localStorage.setItem('user', JSON.stringify(data.admin));
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'platform_admin');
      
      toast.success('Welcome, Admin!');
      
      // Force navigation with window.location to ensure clean state
      window.location.href = '/admin/dashboard';
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-3xl"/><div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl"/></div>
      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center mb-8"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/40"><ShieldCheck size={32} className="text-white"/></div></div>
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">Platform Admin</h1>
        <p className="text-white/50 text-center text-sm mb-8">Authorized access only</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-semibold text-white/70 mb-1.5">Admin Credential</label><div className="relative"><Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"/><input type="text" className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="Enter your credential" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></div></div>
          <div><label className="block text-sm font-semibold text-white/70 mb-1.5">Password</label><div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"/><input type="password" className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></div></div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30">{loading?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<>Access Panel <ArrowRight size={18}/></>}</button>
        </form>
        <Link to="/" className="block mt-6 text-center text-sm text-white/40 hover:text-white/60">← Back to main site</Link>
      </div>
    </div>
  );
}
