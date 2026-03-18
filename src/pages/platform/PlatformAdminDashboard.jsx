import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { platformApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Store, Settings, LogOut, Shield, ShoppingCart, DollarSign, Save, Palette,
  Globe, CreditCard, Eye, EyeOff, Ban, CheckCircle, Upload, Image, AlertTriangle, TrendingUp, BarChart3
} from 'lucide-react';

function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const links = [
    { path:'/admin/dashboard', icon:LayoutDashboard, label:'Overview' },
    { path:'/admin/store-owners', icon:Users, label:'Store Owners' },
    { path:'/admin/stores', icon:Store, label:'All Stores' },
    { path:'/admin/subscriptions', icon:CreditCard, label:'Subscriptions' },
    { path:'/admin/site-settings', icon:Globe, label:'Site & Branding' },
    { path:'/admin/pricing', icon:DollarSign, label:'Pricing & Plans' },
  ];
  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col fixed">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"><Shield size={20} className="text-white"/></div>
          <div><h3 className="text-white font-bold text-sm">Platform Admin</h3><p className="text-white/40 text-xs">Master Control Panel</p></div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map(l=>{const Icon=l.icon; const active=location.pathname===l.path; return(
          <Link key={l.path} to={l.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active?'bg-white/10 text-white':'text-white/50 hover:text-white/80 hover:bg-white/5'}`}><Icon size={18}/>{l.label}</Link>
        );})}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button onClick={()=>{logout();navigate('/admin/login');}} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm"><LogOut size={16}/>Logout</button>
      </div>
    </aside>
  );
}

// ============ OVERVIEW ============
function DashboardHome() {
  const [data, setData] = useState(null);
  useEffect(()=>{ platformApi.getDashboard().then(r=>setData(r.data)).catch(()=>{}); },[]);
  if(!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin"/></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {label:'Store Owners', value:data.stats.totalOwners, icon:Users, color:'from-blue-500 to-cyan-500'},
          {label:'Active Stores', value:data.stats.totalStores, icon:Store, color:'from-purple-500 to-pink-500'},
          {label:'Total Orders', value:data.stats.totalOrders, icon:ShoppingCart, color:'from-emerald-500 to-teal-500'},
          {label:'Platform Revenue', value:`${data.stats.totalRevenue?.toLocaleString()||0} DZD`, icon:DollarSign, color:'from-amber-500 to-orange-500'},
        ].map((s,i)=>{const Icon=s.icon; return(
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}><Icon size={22} className="text-white"/></div>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{s.value}</p>
          </div>
        );})}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100"><h3 className="font-bold text-gray-900 mb-4">Recent Stores</h3>
          <div className="space-y-3">{data.recentStores?.map(s=>(<div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm text-gray-800">{s.name||s.store_name}</p><p className="text-xs text-gray-400">{s.owner_name}</p></div><span className={`badge ${s.is_live||s.is_published?'badge-success':'badge-neutral'}`}>{s.is_live||s.is_published?'Live':'Draft'}</span></div>))}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100"><h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">{data.recentOrders?.slice(0,5).map(o=>(<div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm text-gray-800">{o.order_number}</p><p className="text-xs text-gray-400">{o.store_name}</p></div><span className="font-bold text-sm text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</span></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// ============ STORE OWNERS ============
function StoreOwnersList() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(()=>{ platformApi.getStoreOwners({search}).then(r=>setOwners(r.data.owners)).catch(()=>{}); },[search]);
  const toggleOwner = async (id) => { try{ await platformApi.toggleOwner(id); setOwners(owners.map(o=>o.id===id?{...o,is_active:!o.is_active}:o)); toast.success('Updated'); }catch{toast.error('Failed');} };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Owners</h1>
      <p className="text-sm text-gray-500 mb-6">Manage all registered store owners, their subscriptions, and account status.</p>
      <input className="input-field max-w-sm mb-4" placeholder="Search by name, email, or phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody>{owners.map(o=>(<tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
            <td className="px-4 py-3"><p className="font-semibold text-gray-800">{o.name||o.full_name}</p></td>
            <td className="px-4 py-3"><p className="text-gray-600 text-xs">{o.email}</p><p className="text-gray-400 text-xs">{o.phone}</p></td>
            <td className="px-4 py-3"><span className="badge badge-info">{o.subscription_plan||'trial'}</span></td>
            <td className="px-4 py-3"><span className={`badge ${o.is_active?'badge-success':'badge-danger'}`}>{o.is_active?'Active':'Blocked'}</span></td>
            <td className="px-4 py-3 text-xs text-gray-400">{o.created_at?new Date(o.created_at).toLocaleDateString():'-'}</td>
            <td className="px-4 py-3">
              <button onClick={()=>toggleOwner(o.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${o.is_active?'bg-red-50 text-red-600 hover:bg-red-100':'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                {o.is_active?'Block':'Unblock'}
              </button>
            </td>
          </tr>))}</tbody>
        </table>
        {owners.length===0&&<div className="text-center py-12 text-gray-400">No store owners found</div>}
      </div>
    </div>
  );
}

// ============ ALL STORES ============
function StoresList() {
  const [stores, setStores] = useState([]);
  useEffect(()=>{ platformApi.getStores().then(r=>setStores(r.data)).catch(()=>{}); },[]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">All Stores</h1>
      <p className="text-sm text-gray-500 mb-6">View and monitor all stores on the platform.</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Store</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th></tr></thead>
          <tbody>{stores.map(s=>(<tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
            <td className="px-4 py-3"><p className="font-semibold text-gray-800">{s.name||s.store_name}</p><p className="text-xs text-gray-400 font-mono">/s/{s.slug}</p></td>
            <td className="px-4 py-3 text-gray-500">{s.owner_name}</td>
            <td className="px-4 py-3"><span className={`badge ${s.is_live||s.is_published?'badge-success':'badge-neutral'}`}>{s.is_live||s.is_published?'Live':'Draft'}</span></td>
            <td className="px-4 py-3 text-xs text-gray-400">{s.created_at?new Date(s.created_at).toLocaleDateString():'-'}</td>
          </tr>))}</tbody>
        </table>
        {stores.length===0&&<div className="text-center py-12 text-gray-400">No stores yet</div>}
      </div>
    </div>
  );
}

// ============ SUBSCRIPTIONS ============
function Subscriptions() {
  const [owners, setOwners] = useState([]);
  useEffect(()=>{ platformApi.getStoreOwners({}).then(r=>setOwners(r.data.owners)).catch(()=>{}); },[]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
      <p className="text-sm text-gray-500 mb-6">Monitor subscription plans, expiry dates, and payment status.</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expires</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
          <tbody>{owners.map(o=>{
            const expired = o.subscription_end && new Date(o.subscription_end) < new Date();
            return (<tr key={o.id} className="border-t border-gray-50">
              <td className="px-4 py-3"><p className="font-semibold text-gray-800">{o.name||o.full_name}</p><p className="text-xs text-gray-400">{o.email}</p></td>
              <td className="px-4 py-3"><span className="badge badge-info uppercase">{o.subscription_plan||'trial'}</span></td>
              <td className="px-4 py-3 text-xs">{o.subscription_end?new Date(o.subscription_end).toLocaleDateString():'No expiry'}</td>
              <td className="px-4 py-3">{expired?<span className="badge badge-danger flex items-center gap-1 w-fit"><AlertTriangle size={10}/>Expired</span>:<span className="badge badge-success flex items-center gap-1 w-fit"><CheckCircle size={10}/>Active</span>}</td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// ============ SITE & BRANDING ============
function SiteSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const logoRef = useRef(null);
  const faviconRef = useRef(null);
  useEffect(()=>{ platformApi.getSettings().then(r=>setSettings(r.data)).catch(()=>{}); },[]);

  const handleSave = async () => { setLoading(true); try{await platformApi.updateSettings(settings);toast.success('Saved!');}catch{toast.error('Failed');} setLoading(false); };
  const set = (k)=>(e)=>setSettings({...settings,[k]:e.target.value});

  const handleImageUpload = (field) => (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = field==='favicon'?64:400;
        canvas.width=size; canvas.height=size;
        canvas.getContext('2d').drawImage(img,0,0,size,size);
        setSettings({...settings, [field]: canvas.toDataURL('image/png',0.9)});
        toast.success('Uploaded!');
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Site & Branding</h1><p className="text-sm text-gray-500 mt-1">Customize the main platform appearance.</p></div>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">{loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={16}/>}Save</button>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">General</h3>
          <div><label className="input-label">Site Name</label><input className="input-field" value={settings.site_name||''} onChange={set('site_name')}/></div>
          <div><label className="input-label">Meta Description</label><textarea className="input-field" rows={2} value={settings.meta_description||''} onChange={set('meta_description')}/></div>
          <div className="flex items-center gap-4">
            <div><label className="input-label">Logo</label>
              <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden" onClick={()=>logoRef.current?.click()}>
                {settings.site_logo||settings.logo_url?<img src={settings.site_logo||settings.logo_url} className="w-full h-full object-cover"/>:<Upload size={20} className="text-gray-400"/>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload('site_logo')}/>
            </div>
            <div><label className="input-label">Favicon</label>
              <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden" onClick={()=>faviconRef.current?.click()}>
                {settings.favicon||settings.favicon_url?<img src={settings.favicon||settings.favicon_url} className="w-full h-full object-cover"/>:<Upload size={20} className="text-gray-400"/>}
              </div>
              <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload('favicon')}/>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" className="sr-only" checked={settings.maintenance_mode||false} onChange={e=>setSettings({...settings,maintenance_mode:e.target.checked})}/>
            <div className={`w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode?'bg-red-500':'bg-gray-200'} relative`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode?'translate-x-5':'translate-x-0.5'}`}/></div>
            <span className="font-medium text-gray-700">Maintenance Mode</span>
          </label>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">Brand Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            {['primary_color','secondary_color','accent_color'].map(c=>(<div key={c}><label className="input-label text-xs capitalize">{c.replace(/_/g,' ')}</label><input type="color" className="w-full h-12 rounded-lg cursor-pointer" value={settings[c]||'#7C3AED'} onChange={set(c)}/></div>))}
          </div>
          <div><label className="input-label">Currency</label><input className="input-field" value={settings.currency||'DZD'} onChange={set('currency')}/></div>
        </div>
      </div>
    </div>
  );
}

// ============ PRICING ============
function PricingSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ platformApi.getSettings().then(r=>setSettings(r.data)).catch(()=>{}); },[]);
  const handleSave = async () => { setLoading(true); try{await platformApi.updateSettings(settings);toast.success('Saved!');}catch{toast.error('Failed');} setLoading(false); };
  const set = (k)=>(e)=>setSettings({...settings,[k]:e.target.value});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Pricing & Plans</h1><p className="text-sm text-gray-500 mt-1">Set subscription pricing and trial duration.</p></div>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">{loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={16}/>}Save</button>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 max-w-xl space-y-4">
        <div><label className="input-label">Monthly Subscription Price (DZD)</label><input type="number" className="input-field" value={settings.subscription_monthly_price||''} onChange={set('subscription_monthly_price')}/></div>
        <div><label className="input-label">Yearly Subscription Price (DZD)</label><input type="number" className="input-field" value={settings.subscription_yearly_price||''} onChange={set('subscription_yearly_price')}/></div>
        <div><label className="input-label">Free Trial Duration (days)</label><input type="number" className="input-field" value={settings.trial_days||settings.subscription_trial_days||''} onChange={set('trial_days')}/></div>
      </div>
    </div>
  );
}

// ============ MAIN LAYOUT ============
export default function PlatformAdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar/>
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-end mb-4"><LanguageSwitcher compact/></div>
        <Routes>
          <Route path="dashboard" element={<DashboardHome/>}/>
          <Route path="store-owners" element={<StoreOwnersList/>}/>
          <Route path="stores" element={<StoresList/>}/>
          <Route path="subscriptions" element={<Subscriptions/>}/>
          <Route path="site-settings" element={<SiteSettings/>}/>
          <Route path="pricing" element={<PricingSettings/>}/>
          <Route path="*" element={<DashboardHome/>}/>
        </Routes>
      </main>
    </div>
  );
}
