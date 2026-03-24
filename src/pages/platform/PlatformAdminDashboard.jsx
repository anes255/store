import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { platformApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {LayoutDashboard,Users,Store,Settings,LogOut,Shield,ShoppingCart,DollarSign,Save,Globe,Eye,EyeOff,Ban,CheckCircle,AlertTriangle,TrendingUp,BarChart3,Package,Search,Trash2,RefreshCw,Server,Database,Wifi,WifiOff,ChevronRight,X,ExternalLink,Activity,Zap,CreditCard,Mail,Smartphone,Bot,ArrowUp,ArrowDown,Calendar} from 'lucide-react';

function Sidebar(){
  const loc=useLocation();const{logout}=useAuthStore();const nav=useNavigate();
  const links=[
    {path:'/admin/dashboard',icon:LayoutDashboard,label:'Overview',desc:'Platform stats'},
    {path:'/admin/store-owners',icon:Users,label:'Store Owners',desc:'Manage users'},
    {path:'/admin/stores',icon:Store,label:'All Stores',desc:'Manage stores'},
    {path:'/admin/orders',icon:ShoppingCart,label:'All Orders',desc:'Platform orders'},
    {path:'/admin/site-settings',icon:Globe,label:'Site & Branding',desc:'Customize'},
    {path:'/admin/system',icon:Server,label:'System',desc:'Health & services'},
  ];
  return(
    <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen flex flex-col fixed">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20"><Shield size={20} className="text-white"/></div>
          <div><h3 className="text-white font-bold text-sm">Super Admin</h3><p className="text-white/30 text-[10px] uppercase tracking-wider">Control Panel</p></div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l=>{const I=l.icon;const active=loc.pathname===l.path;return(
          <Link key={l.path} to={l.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${active?'bg-white/10 text-white shadow-lg':'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <I size={18}/><div><p className="font-medium">{l.label}</p>{active&&<p className="text-[10px] text-white/40">{l.desc}</p>}</div>
          </Link>
        );})}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="px-4 py-3 bg-white/5 rounded-xl mb-2"><p className="text-white/60 text-xs font-medium">Platform Admin</p><p className="text-white/30 text-[10px]">Full Access</p></div>
        <button onClick={()=>{logout();nav('/admin/login');}} className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm"><LogOut size={16}/>Logout</button>
      </div>
    </aside>);
}

// ═══════ OVERVIEW ═══════
function Overview(){
  const[data,setData]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{platformApi.getDashboard().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  if(loading)return<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin"/></div>;
  const s=data?.stats||{};
  const cards=[
    {label:'Store Owners',value:s.totalOwners,icon:Users,color:'from-blue-500 to-blue-600',sub:`+${s.weekOwners||0} this week`},
    {label:'Active Stores',value:s.totalStores,icon:Store,color:'from-purple-500 to-purple-600',sub:'Total stores'},
    {label:'Total Orders',value:s.totalOrders,icon:ShoppingCart,color:'from-emerald-500 to-emerald-600',sub:`${s.todayOrders||0} today`},
    {label:'Revenue',value:`${(s.totalRevenue||0).toLocaleString()} DZD`,icon:DollarSign,color:'from-amber-500 to-orange-500',sub:`${(s.todayRevenue||0).toLocaleString()} DZD today`},
    {label:'Products',value:s.totalProducts,icon:Package,color:'from-cyan-500 to-cyan-600',sub:'Across all stores'},
    {label:'Customers',value:s.totalCustomers,icon:Users,color:'from-pink-500 to-rose-500',sub:'Registered buyers'},
  ];
  return(<div>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-black text-gray-900">Platform Overview</h1><p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p></div><button onClick={()=>window.location.reload()} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-200"><RefreshCw size={14}/>Refresh</button></div>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">{cards.map((c,i)=>{const I=c.icon;return(
      <div key={i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}><I size={18} className="text-white"/></div></div>
        <p className="text-2xl font-black text-gray-900">{c.value}</p><p className="text-xs text-gray-400 mt-1">{c.label}</p><p className="text-[10px] text-emerald-500 font-bold mt-1">{c.sub}</p>
      </div>);})}</div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ShoppingCart size={16}/>Recent Orders</h3>
        <div className="space-y-2">{(data?.recentOrders||[]).slice(0,8).map(o=>(
          <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3"><span className="font-mono text-xs font-bold text-brand-600">{o.order_number}</span><span className="text-sm text-gray-700">{o.customer_name}</span></div>
            <div className="flex items-center gap-3"><span className="text-sm font-bold">{parseFloat(o.total).toLocaleString()}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status==='delivered'?'bg-emerald-100 text-emerald-700':o.status==='pending'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>{o.status}</span></div>
          </div>
        ))}</div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Store size={16}/>Recent Stores</h3>
        <div className="space-y-2">{(data?.recentStores||[]).slice(0,8).map(s=>(
          <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div><p className="text-sm font-bold text-gray-800">{s.name||s.store_name}</p><p className="text-[10px] text-gray-400">{s.owner_name} · {s.product_count||0} products</p></div>
            <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-600">{parseFloat(s.revenue||0).toLocaleString()} DZD</span>{s.is_published?<span className="w-2 h-2 rounded-full bg-emerald-400"/>:<span className="w-2 h-2 rounded-full bg-gray-300"/>}</div>
          </div>
        ))}</div>
      </div>
    </div>
  </div>);
}

// ═══════ STORE OWNERS ═══════
function StoreOwners(){
  const[owners,setOwners]=useState([]);const[search,setSearch]=useState('');const[loading,setLoading]=useState(true);
  const load=()=>{platformApi.getStoreOwners({search}).then(r=>setOwners(r.data.owners||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[search]);
  const toggle=async(id)=>{try{await platformApi.toggleOwner(id);toast.success('Updated');load();}catch{toast.error('Failed');}};
  const del=async(id)=>{if(!confirm('Delete this owner and deactivate their stores?'))return;try{await api.delete(`/platform/store-owners/${id}`);toast.success('Deleted');load();}catch{toast.error('Failed');}};
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">Store Owners</h1><span className="text-sm text-gray-400">{owners.length} total</span></div>
    <div className="relative max-w-md mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Search by name, email, phone..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Stores</th><th className="px-5 py-3">Revenue</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
    <tbody>{owners.map(o=>(
      <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{o.full_name?.[0]||'U'}</div><div><p className="font-bold text-gray-800">{o.full_name||o.name}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div></div></td>
        <td className="px-5 py-4"><p className="text-gray-700">{o.email}</p><p className="text-xs text-gray-400">{o.phone}</p></td>
        <td className="px-5 py-4 font-bold text-center">{o.store_count||0}</td>
        <td className="px-5 py-4 font-bold text-gray-900">{parseFloat(o.total_revenue||0).toLocaleString()} DZD</td>
        <td className="px-5 py-4">{o.is_active!==false?<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>:<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Suspended</span>}</td>
        <td className="px-5 py-4"><div className="flex gap-1"><button onClick={()=>toggle(o.id)} className={`p-2 rounded-lg text-xs font-bold ${o.is_active!==false?'hover:bg-red-50 text-red-500':'hover:bg-emerald-50 text-emerald-500'}`}>{o.is_active!==false?<Ban size={14}/>:<CheckCircle size={14}/>}</button><button onClick={()=>del(o.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14}/></button></div></td>
      </tr>
    ))}</tbody></table>{owners.length===0&&<p className="text-center py-12 text-gray-400">No owners found</p>}</div>}
  </div>);
}

// ═══════ ALL STORES ═══════
function AllStores(){
  const[stores,setStores]=useState([]);const[loading,setLoading]=useState(true);
  const load=()=>{platformApi.getStores().then(r=>setStores(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const toggle=async(id)=>{try{await api.patch(`/platform/stores/${id}/toggle`);toast.success('Toggled');load();}catch{toast.error('Failed');}};
  const del=async(id)=>{if(!confirm('Delete this store and ALL its data? This cannot be undone.'))return;try{await api.delete(`/platform/stores/${id}`);toast.success('Deleted');load();}catch{toast.error('Failed');}};
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">All Stores</h1><span className="text-sm text-gray-400">{stores.length} total</span></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="grid gap-4">{stores.map(s=>(
      <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">{(s.name||s.store_name||'S')[0]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><p className="font-bold text-gray-900">{s.name||s.store_name}</p>{s.is_published?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">LIVE</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">OFFLINE</span>}</div>
            <p className="text-xs text-gray-400">Owner: {s.owner_name||'N/A'} · {s.owner_email||''}</p>
          </div>
          <div className="text-right"><p className="text-sm font-bold">{parseFloat(s.revenue||0).toLocaleString()} DZD</p><p className="text-[10px] text-gray-400">{s.product_count||0} products · {s.order_count||0} orders</p></div>
          <div className="flex gap-2 shrink-0">
            <a href={`/s/${s.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ExternalLink size={14}/></a>
            <button onClick={()=>toggle(s.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">{s.is_published?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            <button onClick={()=>del(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14}/></button>
          </div>
        </div>
      </div>
    ))}{stores.length===0&&<p className="text-center py-12 text-gray-400">No stores yet</p>}</div>}
  </div>);
}

// ═══════ ALL ORDERS ═══════
function AllOrders(){
  const[orders,setOrders]=useState([]);const[total,setTotal]=useState(0);const[filter,setFilter]=useState('all');const[search,setSearch]=useState('');const[loading,setLoading]=useState(true);
  const load=()=>{api.get('/platform/orders',{params:{status:filter,search}}).then(r=>{setOrders(r.data.orders||[]);setTotal(r.data.total||0);}).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[filter,search]);
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">All Orders</h1><span className="text-sm text-gray-400">{total} total</span></div>
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">{['all','pending','confirmed','shipped','delivered','cancelled'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter===f?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{f==='all'?'All':f}</button>)}</div>
      <div className="relative flex-1 max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Store</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr></thead>
    <tbody>{orders.map(o=>(
      <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-5 py-3 font-mono font-bold text-xs text-brand-600">{o.order_number}</td>
        <td className="px-5 py-3"><p className="text-gray-800">{o.customer_name}</p><p className="text-[10px] text-gray-400">{o.customer_phone}</p></td>
        <td className="px-5 py-3 text-gray-500 text-xs">{o.store_name}</td>
        <td className="px-5 py-3 font-bold">{parseFloat(o.total).toLocaleString()} DZD</td>
        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status==='delivered'?'bg-emerald-100 text-emerald-700':o.status==='pending'?'bg-amber-100 text-amber-700':o.status==='cancelled'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{o.status}</span></td>
        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
      </tr>
    ))}</tbody></table>{orders.length===0&&<p className="text-center py-12 text-gray-400">No orders found</p>}</div>}
  </div>);
}

// ═══════ SITE SETTINGS ═══════
function SiteSettings(){
  const[s,setS]=useState({});const[loading,setLoading]=useState(false);const logoRef=useRef(null);const favRef=useRef(null);
  useEffect(()=>{platformApi.getSettings().then(r=>setS(r.data)).catch(()=>{});},[]);
  const save=async()=>{setLoading(true);try{const{data}=await platformApi.updateSettings(s);setS(data);toast.success('Saved!');}catch{toast.error('Failed');}setLoading(false);};
  const imgUp=(field,sz=200)=>(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{setS({...s,[field]:r.result});toast.success('Uploaded!');};r.readAsDataURL(f);};
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">Site & Branding</h1><button onClick={save} disabled={loading} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-600 disabled:opacity-50"><Save size={16}/>Save Changes</button></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">Platform Identity</h3>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Site Name</label><input className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" value={s.site_name||''} onChange={e=>setS({...s,site_name:e.target.value})}/></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Meta Description</label><textarea className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none" rows={3} value={s.meta_description||''} onChange={e=>setS({...s,meta_description:e.target.value})}/></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Currency</label><select className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.currency||'DZD'} onChange={e=>setS({...s,currency:e.target.value})}><option value="DZD">DZD</option><option value="EUR">EUR</option><option value="USD">USD</option></select></div>
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer"><div><p className="font-medium text-sm text-gray-800">Maintenance Mode</p><p className="text-xs text-gray-400">Temporarily disable the platform</p></div><div className={`w-11 h-6 rounded-full transition-colors ${s.maintenance_mode?'bg-red-500':'bg-gray-300'} relative`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${s.maintenance_mode?'translate-x-5':'translate-x-0.5'}`}/></div><input type="checkbox" className="sr-only" checked={s.maintenance_mode||false} onChange={e=>setS({...s,maintenance_mode:e.target.checked})}/></label>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">Colors & Branding</h3>
        <div className="grid grid-cols-3 gap-3">{[{k:'primary_color',l:'Primary',d:'#7C3AED'},{k:'secondary_color',l:'Secondary',d:'#06B6D4'},{k:'accent_color',l:'Accent',d:'#F59E0B'}].map(c=>(
          <div key={c.k}><label className="text-xs font-bold text-gray-400 uppercase">{c.l}</label><div className="flex items-center gap-2 mt-1"><input type="color" className="w-8 h-8 rounded" value={s[c.k]||c.d} onChange={e=>setS({...s,[c.k]:e.target.value})}/><input className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs" value={s[c.k]||c.d} onChange={e=>setS({...s,[c.k]:e.target.value})}/></div></div>
        ))}</div>
        <div className="flex gap-4"><div><p className="text-xs font-bold text-gray-400 uppercase mb-1">Logo</p><div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer" onClick={()=>logoRef.current?.click()}>{s.site_logo?<img src={s.site_logo} className="w-full h-full object-cover" alt=""/>:<span className="text-xs text-gray-400">Upload</span>}</div><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={imgUp('site_logo')}/></div><div><p className="text-xs font-bold text-gray-400 uppercase mb-1">Favicon</p><div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer" onClick={()=>favRef.current?.click()}>{s.favicon?<img src={s.favicon} className="w-full h-full object-cover" alt=""/>:<span className="text-xs text-gray-400">Upload</span>}</div><input ref={favRef} type="file" accept="image/*" className="hidden" onChange={imgUp('favicon')}/></div></div>
        <h3 className="font-bold text-gray-900 pt-4">Pricing</h3>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-gray-400 uppercase">Monthly Price (DZD)</label><input type="number" className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.subscription_monthly_price||''} onChange={e=>setS({...s,subscription_monthly_price:e.target.value})}/></div><div><label className="text-xs font-bold text-gray-400 uppercase">Yearly Price (DZD)</label><input type="number" className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.subscription_yearly_price||''} onChange={e=>setS({...s,subscription_yearly_price:e.target.value})}/></div></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Trial Days</label><input type="number" className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.trial_days||7} onChange={e=>setS({...s,trial_days:e.target.value})}/></div>
      </div>
    </div>
  </div>);
}

// ═══════ SYSTEM ═══════
function SystemHealth(){
  const[sys,setSys]=useState(null);
  useEffect(()=>{api.get('/platform/system').then(r=>setSys(r.data)).catch(()=>{});},[]);
  if(!sys)return<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>;
  const svc=[
    {name:'WhatsApp',ok:sys.services?.whatsapp,icon:Smartphone,desc:'Meta Cloud API'},
    {name:'SMS',ok:sys.services?.sms,icon:Mail,desc:'Twilio'},
    {name:'Email',ok:sys.services?.email,icon:Mail,desc:'Resend'},
    {name:'AI Chatbot',ok:sys.services?.ai,icon:Bot,desc:'Google Gemini'},
    {name:'Payments',ok:sys.services?.payments,icon:CreditCard,desc:'Chargily Pay'},
  ];
  return(<div>
    <h1 className="text-2xl font-black text-gray-900 mb-6">System Health</h1>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Server size={16}/>Server Info</h3>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span className="text-sm text-gray-500">Node.js</span><span className="font-mono text-sm font-bold">{sys.node}</span></div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span className="text-sm text-gray-500">Uptime</span><span className="font-mono text-sm font-bold">{sys.uptime}</span></div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span className="text-sm text-gray-500">DB Size</span><span className="font-mono text-sm font-bold">{sys.dbSize}</span></div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span className="text-sm text-gray-500">Tables</span><span className="font-mono text-sm font-bold">{sys.tables?.length||0}</span></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap size={16}/>Services Status</h3>
        <div className="space-y-3">{svc.map(s=>(
          <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3"><s.icon size={16} className="text-gray-400"/><div><p className="text-sm font-bold text-gray-700">{s.name}</p><p className="text-[10px] text-gray-400">{s.desc}</p></div></div>
            {s.ok?<span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><Wifi size={12}/>Connected</span>:<span className="flex items-center gap-1 text-xs font-bold text-gray-400"><WifiOff size={12}/>Not configured</span>}
          </div>
        ))}</div>
      </div>
    </div>
    <div className="bg-white rounded-2xl p-6 shadow-sm mt-6"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Database size={16}/>Database Tables</h3><div className="flex flex-wrap gap-2">{(sys.tables||[]).map(t=><span key={t} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">{t}</span>)}</div></div>
  </div>);
}

// ═══════ MAIN LAYOUT ═══════
export default function PlatformAdminDashboard(){
  return(
    <div className="flex min-h-screen bg-gray-50/80">
      <Sidebar/>
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield size={16} className="text-red-500"/><span className="text-sm font-bold text-gray-700">Platform Administration</span></div>
          <div className="flex items-center gap-3"><span className="px-3 py-1 bg-red-50 rounded-full text-[10px] font-bold text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"/>SUPER ADMIN</span></div>
        </header>
        <div className="p-8">
          <Routes>
            <Route path="dashboard" element={<Overview/>}/>
            <Route path="store-owners" element={<StoreOwners/>}/>
            <Route path="stores" element={<AllStores/>}/>
            <Route path="orders" element={<AllOrders/>}/>
            <Route path="site-settings" element={<SiteSettings/>}/>
            <Route path="system" element={<SystemHealth/>}/>
            <Route path="*" element={<Overview/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
}
