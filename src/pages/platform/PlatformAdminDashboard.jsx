import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { platformApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import toast from 'react-hot-toast';
import { LayoutDashboard, Users, Store, Settings, LogOut, Shield, ShoppingCart, DollarSign, Save, Palette } from 'lucide-react';

function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const links = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/store-owners', icon: Users, label: 'Store Owners' },
    { path: '/admin/stores', icon: Store, label: 'Stores' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];
  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col fixed">
      <div className="p-6 border-b border-white/10"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"><Shield size={20} className="text-white" /></div><div><h3 className="text-white font-bold text-sm">Platform Admin</h3><p className="text-white/40 text-xs">Master Panel</p></div></div></div>
      <nav className="flex-1 px-4 py-6 space-y-1">{links.map(l=>{const Icon=l.icon;const active=location.pathname===l.path;return(<Link key={l.path} to={l.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active?'bg-white/10 text-white':'text-white/50 hover:text-white/80 hover:bg-white/5'}`}><Icon size={18}/>{l.label}</Link>);})}</nav>
      <div className="p-4 border-t border-white/10"><div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center"><span className="text-red-400 text-sm font-bold">A</span></div><div><p className="text-white text-sm font-semibold">{user?.name}</p><p className="text-white/40 text-xs">Super Admin</p></div></div><button onClick={()=>{logout();navigate('/admin/login');}} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm"><LogOut size={16}/>Logout</button></div>
    </aside>
  );
}

function DashboardHome() {
  const [data, setData] = useState(null);
  useEffect(() => { platformApi.getDashboard().then(r=>setData(r.data)).catch(()=>{}); }, []);
  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin"/></div>;
  const stats = [
    { label: 'Total Store Owners', value: data.stats.totalOwners, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Stores', value: data.stats.totalStores, icon: Store, color: 'from-purple-500 to-pink-500' },
    { label: 'Total Orders', value: data.stats.totalOrders, icon: ShoppingCart, color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Revenue', value: `${data.stats.totalRevenue.toLocaleString()} DZD`, icon: DollarSign, color: 'from-amber-500 to-orange-500' },
  ];
  return (
    <div>
      <h1 className="page-header mb-6">Platform Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{stats.map((s,i)=>{const Icon=s.icon;return(<div key={i} className="glass-card-solid p-6"><div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}><Icon size={22} className="text-white"/></div><p className="text-sm text-gray-500 font-medium">{s.label}</p><p className="text-2xl font-extrabold text-gray-900 mt-1">{s.value}</p></div>);})}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-solid p-6"><h3 className="font-bold text-gray-900 mb-4">Recent Stores</h3><div className="space-y-3">{data.recentStores.map(s=>(<div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.owner_name}</p></div><span className={`badge ${s.is_live?'badge-success':'badge-neutral'}`}>{s.is_live?'Live':'Draft'}</span></div>))}</div></div>
        <div className="glass-card-solid p-6"><h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3><div className="space-y-3">{data.recentOrders.slice(0,5).map(o=>(<div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-semibold text-sm text-gray-800">{o.order_number}</p><p className="text-xs text-gray-400">{o.store_name}</p></div><span className="font-bold text-sm text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</span></div>))}</div></div>
      </div>
    </div>
  );
}

function StoreOwnersList() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(() => { platformApi.getStoreOwners({ search }).then(r=>setOwners(r.data.owners)).catch(()=>{}); }, [search]);
  const toggleOwner = async (id) => { try { await platformApi.toggleOwner(id); setOwners(owners.map(o=>o.id===id?{...o,is_active:!o.is_active}:o)); toast.success('Updated'); } catch { toast.error('Failed'); }};
  return (
    <div>
      <h1 className="page-header mb-6">Store Owners</h1>
      <div className="mb-4"><input className="input-field max-w-sm" placeholder="Search owners..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      <div className="table-container bg-white"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead><tbody>{owners.map(o=>(<tr key={o.id}><td className="font-semibold text-gray-800">{o.name}</td><td className="text-gray-500">{o.email}</td><td className="text-gray-500">{o.phone}</td><td><span className="badge badge-info">{o.subscription_plan}</span></td><td><span className={`badge ${o.is_active?'badge-success':'badge-danger'}`}>{o.is_active?'Active':'Suspended'}</span></td><td><button onClick={()=>toggleOwner(o.id)} className="text-sm text-brand-600 font-medium hover:underline">{o.is_active?'Suspend':'Activate'}</button></td></tr>))}</tbody></table></div>
    </div>
  );
}

function StoresList() {
  const [stores, setStores] = useState([]);
  useEffect(() => { platformApi.getStores().then(r=>setStores(r.data)).catch(()=>{}); }, []);
  return (
    <div>
      <h1 className="page-header mb-6">All Stores</h1>
      <div className="table-container bg-white"><table><thead><tr><th>Store</th><th>Owner</th><th>Orders</th><th>Revenue</th><th>Status</th></tr></thead><tbody>{stores.map(s=>(<tr key={s.id}><td className="font-semibold text-gray-800">{s.name}</td><td className="text-gray-500">{s.owner_name}</td><td>{s.order_count}</td><td className="font-semibold">{parseFloat(s.revenue||0).toLocaleString()} DZD</td><td><span className={`badge ${s.is_live?'badge-success':'badge-neutral'}`}>{s.is_live?'Live':'Draft'}</span></td></tr>))}</tbody></table></div>
    </div>
  );
}

function PlatformSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => { platformApi.getSettings().then(r=>setSettings(r.data)).catch(()=>{}); }, []);
  const handleSave = async () => { setLoading(true); try { await platformApi.updateSettings(settings); toast.success('Saved!'); } catch { toast.error('Failed'); } setLoading(false); };
  const set = (k) => (e) => setSettings({...settings, [k]: e.target.value});
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="page-header">Platform Settings</h1><button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">{loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={16}/>}Save</button></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Settings size={18}/>General</h3>
          <div><label className="input-label">Site Name</label><input className="input-field" value={settings.site_name||''} onChange={set('site_name')}/></div>
          <div><label className="input-label">Meta Description</label><textarea className="input-field" rows={3} value={settings.meta_description||''} onChange={set('meta_description')}/></div>
          <div><label className="input-label">Default Language</label><select className="input-field" value={settings.default_language||'en'} onChange={set('default_language')}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></div>
        </div>
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Palette size={18}/>Branding</h3>
          <div className="grid grid-cols-3 gap-4">{['primary_color','secondary_color','accent_color'].map(c=>(<div key={c}><label className="input-label text-xs">{c.replace(/_/g,' ')}</label><input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={settings[c]||'#7C3AED'} onChange={set(c)}/></div>))}</div>
          <div><label className="input-label">Logo URL</label><input className="input-field" value={settings.site_logo||''} onChange={set('site_logo')}/></div>
        </div>
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign size={18}/>Pricing</h3>
          <div><label className="input-label">Monthly Price (DZD)</label><input type="number" className="input-field" value={settings.subscription_monthly_price||''} onChange={set('subscription_monthly_price')}/></div>
          <div><label className="input-label">Yearly Price (DZD)</label><input type="number" className="input-field" value={settings.subscription_yearly_price||''} onChange={set('subscription_yearly_price')}/></div>
          <div><label className="input-label">Trial Days</label><input type="number" className="input-field" value={settings.trial_days||''} onChange={set('trial_days')}/></div>
        </div>
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Shield size={18}/>Maintenance</h3>
          <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="sr-only" checked={settings.maintenance_mode||false} onChange={e=>setSettings({...settings,maintenance_mode:e.target.checked})}/><div className={`w-12 h-7 rounded-full transition-colors ${settings.maintenance_mode?'bg-red-500':'bg-gray-200'} relative`}><div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode?'translate-x-5':'translate-x-0.5'}`}/></div><span className="font-medium text-gray-700">Maintenance Mode</span></label>
        </div>
      </div>
    </div>
  );
}

export default function PlatformAdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-end mb-4"><LanguageSwitcher compact /></div>
        <Routes>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="store-owners" element={<StoreOwnersList />} />
          <Route path="stores" element={<StoresList />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="*" element={<DashboardHome />} />
        </Routes>
      </main>
    </div>
  );
}
