import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { platformApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {LayoutDashboard,Users,Store,Settings,LogOut,Shield,ShoppingCart,DollarSign,Save,Globe,Eye,EyeOff,Ban,CheckCircle,AlertTriangle,TrendingUp,BarChart3,Package,Search,Trash2,RefreshCw,Server,Database,Wifi,WifiOff,ChevronRight,X,ExternalLink,Activity,Zap,CreditCard,Mail,Smartphone,Bot,ArrowUp,ArrowDown,Calendar,Layers,Plus,GripVertical,Image,Type,Menu} from 'lucide-react';

function Sidebar({open,onClose}){
  const loc=useLocation();const{logout}=useAuthStore();const nav=useNavigate();
  const links=[
    {path:'/admin/dashboard',icon:LayoutDashboard,label:'Overview',desc:'Platform stats'},
    {path:'/admin/store-owners',icon:Users,label:'Store Owners',desc:'Manage users'},
    {path:'/admin/stores',icon:Store,label:'All Stores',desc:'Manage stores'},
    {path:'/admin/orders',icon:ShoppingCart,label:'All Orders',desc:'Platform orders'},
    {path:'/admin/subscriptions',icon:CreditCard,label:'Subscriptions',desc:'Payments & plans'},
    {path:'/admin/billing-config',icon:DollarSign,label:'Billing Config',desc:'Payment methods'},
    {path:'/admin/site-settings',icon:Globe,label:'Site & Branding',desc:'Customize'},
    {path:'/admin/page-builder',icon:Layers,label:'Page Builder',desc:'Edit landing page'},
    {path:'/admin/system',icon:Server,label:'System',desc:'Health & services'},
  ];
  return(<>
    {open&&<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}/>}
    <aside className={`fixed top-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen flex flex-col transition-transform duration-300 lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20"><Shield size={20} className="text-white"/></div>
          <div><h3 className="text-white font-bold text-sm">Super Admin</h3><p className="text-white/30 text-[10px] uppercase tracking-wider">Control Panel</p></div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white"><X size={18}/></button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(l=>{const I=l.icon;const active=loc.pathname===l.path;return(
          <Link key={l.path} to={l.path} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${active?'bg-white/10 text-white shadow-lg':'text-white/40 hover:text-white/70 hover:bg-white/5'}`}>
            <I size={18}/><div><p className="font-medium">{l.label}</p>{active&&<p className="text-[10px] text-white/40">{l.desc}</p>}</div>
          </Link>
        );})}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="px-4 py-3 bg-white/5 rounded-xl mb-2"><p className="text-white/60 text-xs font-medium">Platform Admin</p><p className="text-white/30 text-[10px]">Full Access</p></div>
        <button onClick={()=>{logout();nav('/admin/login');}} className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm"><LogOut size={16}/>Logout</button>
      </div>
    </aside></>);
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Stores</th><th className="px-5 py-3">Revenue</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
    <tbody>{owners.map(o=>(
      <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{o.full_name?.[0]||'U'}</div><div><p className="font-bold text-gray-800">{o.full_name||o.name}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div></div></td>
        <td className="px-5 py-4"><p className="text-gray-700">{o.email}</p><p className="text-xs text-gray-400">{o.phone}</p></td>
        <td className="px-5 py-4 font-bold text-center">{o.store_count||0}</td>
        <td className="px-5 py-4 font-bold text-gray-900">{parseFloat(o.total_revenue||0).toLocaleString()} DZD</td>
        <td className="px-5 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 capitalize">{o.subscription_plan||'free'}</span></td>
        <td className="px-5 py-4">{o.subscription_status==='suspended'||o.is_active===false?<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Suspended</span>:<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>}</td>
        <td className="px-5 py-4"><div className="flex gap-1">
          {o.subscription_status==='suspended'||o.is_active===false?
            <button onClick={async()=>{try{await platformApi.setOwnerSubscription(o.id,{action:'activate'});toast.success('Activated');load();}catch{toast.error('Failed');}}} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-500" title="Activate"><CheckCircle size={14}/></button>:
            <button onClick={async()=>{if(!confirm('Suspend? Their stores go offline.'))return;try{await platformApi.setOwnerSubscription(o.id,{action:'suspend'});toast.success('Suspended');load();}catch{toast.error('Failed');}}} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Suspend"><Ban size={14}/></button>}
          <button onClick={()=>del(o.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14}/></button>
        </div></td>
      </tr>
    ))}</tbody></table>{owners.length===0&&<p className="text-center py-12 text-gray-400">No owners found</p>}</div>}
  </div>);
}

// ═══════ ALL STORES ═══════
function AllStores(){
  const[stores,setStores]=useState([]);const[loading,setLoading]=useState(true);const[detail,setDetail]=useState(null);
  const load=()=>{platformApi.getStores().then(r=>setStores(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const toggle=async(id)=>{try{await api.patch(`/platform/stores/${id}/toggle`);toast.success('Toggled');load();}catch{toast.error('Failed');}};
  const del=async(id)=>{if(!confirm('Delete this store and ALL its data? This cannot be undone.'))return;try{await api.delete(`/platform/stores/${id}`);toast.success('Deleted');setDetail(null);load();}catch{toast.error('Failed');}};
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">All Stores</h1><span className="text-sm text-gray-400">{stores.length} total</span></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="grid gap-4">{stores.map(s=>(
      <div key={s.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">{(s.name||s.store_name||'S')[0]}</div>
          <div className="flex-1 cursor-pointer" onClick={()=>setDetail(detail?.id===s.id?null:s)}>
            <div className="flex items-center gap-2"><p className="font-bold text-gray-900">{s.name||s.store_name}</p>{s.is_published?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">LIVE</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">OFFLINE</span>}</div>
            <p className="text-xs text-gray-400">Owner: {s.owner_name||'N/A'} · {s.owner_email||''} {(s.owner_active===false||s.subscription_status==='suspended')&&<span className="text-red-500 font-bold">⚠ OWNER SUSPENDED</span>}</p>
          </div>
          <div className="text-right"><p className="text-sm font-bold">{parseFloat(s.revenue||0).toLocaleString()} DZD</p><p className="text-[10px] text-gray-400">{s.product_count||0} products · {s.order_count||0} orders</p></div>
          <div className="flex gap-2 shrink-0">
            <button onClick={()=>setDetail(detail?.id===s.id?null:s)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Details"><Eye size={14}/></button>
            <a href={`/s/${s.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Visit"><ExternalLink size={14}/></a>
            <button onClick={()=>toggle(s.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title={s.is_published?'Take offline':'Put live'}>{s.is_published?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            <button onClick={()=>del(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400" title="Delete"><Trash2 size={14}/></button>
          </div>
        </div>
        {detail?.id===s.id&&<div className="border-t border-gray-100 p-5 bg-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Slug</p><p className="font-mono text-sm">{s.slug}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Owner Phone</p><p className="text-sm">{s.owner_phone||'N/A'}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Products</p><p className="text-sm font-bold">{s.product_count||0}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Orders</p><p className="text-sm font-bold">{s.order_count||0}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Revenue</p><p className="text-sm font-bold text-emerald-600">{parseFloat(s.revenue||0).toLocaleString()} DZD</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Created</p><p className="text-sm">{new Date(s.created_at).toLocaleDateString()}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Status</p><p className="text-sm">{s.is_published?'🟢 Live':'🔴 Offline'}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase font-bold">Visit</p><a href={`/s/${s.slug}`} target="_blank" className="text-sm text-brand-600 hover:underline">Open Store →</a></div>
          {(s.owner_active===false||s.subscription_status==='suspended')&&<div><p className="text-[10px] text-gray-400 uppercase font-bold">Action</p><button onClick={async()=>{try{await platformApi.setOwnerSubscription(s.owner_id,{action:'activate'});toast.success('Owner activated!');load();}catch{toast.error('Failed');}}} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold mt-1">Activate Owner</button></div>}
        </div>}
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
// ═══════ SUBSCRIPTIONS ═══════
function Subscriptions(){
  const[data,setData]=useState({payments:[],stats:{}});const[loading,setLoading]=useState(true);const[filter,setFilter]=useState('all');
  const[rejectModal,setRejectModal]=useState(null);const[rejectNotes,setRejectNotes]=useState('');
  const[viewReceipt,setViewReceipt]=useState(null);  const load=()=>{setLoading(true);platformApi.getSubscriptions({status:filter}).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[filter]);
  const approve=async(pid)=>{try{await platformApi.approvePayment(pid);toast.success('Payment approved! Subscription activated.');load();}catch{toast.error('Failed');}};
  const reject=async()=>{if(!rejectModal)return;try{await platformApi.rejectPayment(rejectModal,{notes:rejectNotes});toast.success('Rejected');setRejectModal(null);setRejectNotes('');load();}catch{toast.error('Failed');}};
  const suspend=async(oid)=>{if(!confirm('Suspend this owner? Their stores will go offline.'))return;try{await platformApi.setOwnerSubscription(oid,{action:'suspend'});toast.success('Suspended');load();}catch{toast.error('Failed');}};
  const activate=async(oid)=>{try{await platformApi.setOwnerSubscription(oid,{action:'activate'});toast.success('Activated');load();}catch{toast.error('Failed');}};
  const stats=data.stats||{};
  return(<div>
    <h1 className="text-2xl font-black text-gray-900 mb-6">Subscription Payments</h1>
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-red-400" onClick={()=>setFilter('all')}><p className="text-xs text-gray-400">Total</p><p className="text-2xl font-black">{(stats.pending||0)+(stats.approved||0)+(stats.rejected||0)}</p></div>
      <div className="bg-amber-50 rounded-2xl p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-amber-400" onClick={()=>setFilter('pending')}><p className="text-xs text-amber-600">Pending</p><p className="text-2xl font-black text-amber-700">{stats.pending||0}</p></div>
      <div className="bg-emerald-50 rounded-2xl p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-emerald-400" onClick={()=>setFilter('approved')}><p className="text-xs text-emerald-600">Approved</p><p className="text-2xl font-black text-emerald-700">{stats.approved||0}</p></div>
      <div className="bg-red-50 rounded-2xl p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-red-400" onClick={()=>setFilter('rejected')}><p className="text-xs text-red-600">Rejected</p><p className="text-2xl font-black text-red-700">{stats.rejected||0}</p></div>
    </div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {data.payments.length===0?<p className="text-center py-12 text-gray-400">No subscription payments {filter!=='all'?`with status "${filter}"`:''}</p>:
      <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
      <tbody>{data.payments.map(p=>(
        <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
          <td className="px-5 py-4"><div><p className="font-bold text-gray-800">{p.owner_name||'N/A'}</p><p className="text-[10px] text-gray-400">{p.owner_phone}</p></div></td>
          <td className="px-5 py-4"><span className="font-bold capitalize">{p.plan}</span><br/><span className="text-[10px] text-gray-400 capitalize">{p.period}</span></td>
          <td className="px-5 py-4 font-bold">{parseFloat(p.amount).toLocaleString()} DZD</td>
          <td className="px-5 py-4 uppercase text-xs">{p.payment_method}</td>
          <td className="px-5 py-4">{p.receipt_image?<button onClick={()=>setViewReceipt(p)} className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1"><Eye size={12}/>View</button>:'-'}</td>
          <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.status==='approved'?'bg-emerald-100 text-emerald-700':p.status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{p.status?.toUpperCase()}</span></td>
          <td className="px-5 py-4">{p.status==='pending'?<div className="flex gap-1"><button onClick={()=>approve(p.id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">Approve</button><button onClick={()=>{setRejectModal(p.id);setRejectNotes('');}} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">Reject</button></div>:p.status==='approved'?<button onClick={()=>suspend(p.owner_id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Suspend</button>:'-'}</td>
        </tr>
      ))}</tbody></table>}
    </div>}
    {rejectModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setRejectModal(null)}><div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}><h3 className="font-bold text-lg mb-4">Reject Payment</h3><textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" rows={3} placeholder="Reason for rejection..." value={rejectNotes} onChange={e=>setRejectNotes(e.target.value)}/><div className="flex gap-3 mt-4"><button onClick={()=>setRejectModal(null)} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm font-bold">Cancel</button><button onClick={reject} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Reject</button></div></div></div>}
    {viewReceipt&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setViewReceipt(null)}><div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg">Payment Receipt</h3><button onClick={()=>setViewReceipt(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18}/></button></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 uppercase">Owner</p><p className="font-bold text-sm">{viewReceipt.owner_name}</p><p className="text-xs text-gray-400">{viewReceipt.owner_phone}</p></div>
        <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 uppercase">Plan</p><p className="font-bold text-sm capitalize">{viewReceipt.plan} — {viewReceipt.period}</p></div>
        <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 uppercase">Amount</p><p className="font-bold text-sm">{parseFloat(viewReceipt.amount).toLocaleString()} DZD</p></div>
        <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 uppercase">Method</p><p className="font-bold text-sm uppercase">{viewReceipt.payment_method}</p></div>
      </div>
      {viewReceipt.receipt_image&&<img src={viewReceipt.receipt_image} className="w-full rounded-xl border" alt="Receipt"/>}
      <p className="text-xs text-gray-400 mt-3 text-center">Submitted {new Date(viewReceipt.created_at).toLocaleString()}</p>
      {viewReceipt.status==='pending'&&<div className="flex gap-3 mt-4"><button onClick={()=>{approve(viewReceipt.id);setViewReceipt(null);}} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold">Approve</button><button onClick={()=>{setRejectModal(viewReceipt.id);setRejectNotes('');setViewReceipt(null);}} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold">Reject</button></div>}
    </div></div>}
  </div>);
}

// ═══════ BILLING CONFIG ═══════
function BillingConfig(){
  const[config,setConfig]=useState({billing_ccp_account:'',billing_ccp_name:'',billing_baridimob_rip:'',billing_baridimob_qr:'',subscription_monthly_price:'2900',subscription_yearly_price:'29000'});
  const[saving,setSaving]=useState(false);const fileRef=useRef(null);
  useEffect(()=>{platformApi.getSettings().then(r=>{const s=r.data||{};setConfig({billing_ccp_account:s.billing_ccp_account||'',billing_ccp_name:s.billing_ccp_name||'',billing_baridimob_rip:s.billing_baridimob_rip||'',billing_baridimob_qr:s.billing_baridimob_qr||'',subscription_monthly_price:s.subscription_monthly_price||'2900',subscription_yearly_price:s.subscription_yearly_price||'29000'});}).catch(()=>{});},[]);
  const save=async()=>{setSaving(true);try{await platformApi.updateBillingConfig(config);toast.success('Billing config saved!');}catch{toast.error('Failed');}setSaving(false);};
  const uploadQR=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setConfig({...config,billing_baridimob_qr:r.result});r.readAsDataURL(f);};
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">Billing Configuration</h1><button onClick={save} disabled={saving} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 flex items-center gap-2"><Save size={16}/>{saving?'Saving...':'Save'}</button></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18}/>Subscription Pricing</h3>
        <p className="text-xs text-gray-400">Set the prices store owners pay for their subscriptions</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Monthly Price (DZD)</label><input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-500/20" value={config.subscription_monthly_price} onChange={e=>setConfig({...config,subscription_monthly_price:e.target.value})}/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Yearly Price (DZD)</label><input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-500/20" value={config.subscription_yearly_price} onChange={e=>setConfig({...config,subscription_yearly_price:e.target.value})}/></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">CCP Account</h3>
        <p className="text-xs text-gray-400">Store owners will transfer payments to this CCP account</p>
        <div><label className="text-xs font-bold text-gray-500 uppercase">CCP Number</label><input className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20" value={config.billing_ccp_account} onChange={e=>setConfig({...config,billing_ccp_account:e.target.value})} placeholder="0012345678 CLE 99"/></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">Account Holder Name</label><input className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-500/20" value={config.billing_ccp_name} onChange={e=>setConfig({...config,billing_ccp_name:e.target.value})}/></div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">BaridiMob</h3>
        <p className="text-xs text-gray-400">Store owners can also pay via BaridiMob</p>
        <div><label className="text-xs font-bold text-gray-500 uppercase">RIP Number</label><input className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20" value={config.billing_baridimob_rip} onChange={e=>setConfig({...config,billing_baridimob_rip:e.target.value})}/></div>
        <div><label className="text-xs font-bold text-gray-500 uppercase">QR Code</label>
          <div className="flex items-center gap-4 mt-1">
            {config.billing_baridimob_qr&&<img src={config.billing_baridimob_qr} className="w-24 h-24 rounded-xl border object-cover"/>}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-red-400 flex-1" onClick={()=>fileRef.current?.click()}><p className="text-sm text-gray-500">{config.billing_baridimob_qr?'Replace QR':'Upload QR image'}</p></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadQR}/>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Preview — What store owners see</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {config.billing_ccp_account&&<div className="flex items-center justify-between"><span className="text-sm text-gray-500">CCP</span><span className="font-mono font-bold">{config.billing_ccp_account}</span></div>}
          {config.billing_ccp_name&&<div className="flex items-center justify-between"><span className="text-sm text-gray-500">Name</span><span className="font-bold">{config.billing_ccp_name}</span></div>}
          {config.billing_baridimob_rip&&<div className="flex items-center justify-between"><span className="text-sm text-gray-500">RIP</span><span className="font-mono font-bold">{config.billing_baridimob_rip}</span></div>}
          {config.billing_baridimob_qr&&<img src={config.billing_baridimob_qr} className="w-32 mx-auto rounded-xl border mt-2"/>}
          {!config.billing_ccp_account&&!config.billing_baridimob_rip&&<p className="text-center text-gray-400 text-sm">No payment methods configured yet</p>}
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">Store owners see these details when subscribing. Make sure they're correct before going live.</div>
      </div>
    </div>
  </div>);
}

// ═══════ PAGE BUILDER ═══════
function PageBuilder(){
  const BLOCK_TYPES=[
    {type:'hero',label:'Hero Banner',icon:Image,defaults:{title:'Welcome to Our Platform',subtitle:'Build your online store in minutes',btnText:'Get Started',btnLink:'/register',bgColor:'#7C3AED',textColor:'#FFFFFF',padding:'80',fontSize:'48'}},
    {type:'text',label:'Text Block',icon:Type,defaults:{title:'About Us',content:'We provide the best e-commerce platform.',align:'center',bgColor:'#FFFFFF',textColor:'#111827',padding:'64',fontSize:'30'}},
    {type:'features',label:'Features Grid',icon:Layers,defaults:{title:'Why Choose Us',columns:'4',bgColor:'#F9FAFB',cardBg:'#FFFFFF',textColor:'#111827',items:[{icon:'🚀',title:'Fast Setup',desc:'Launch in minutes'},{icon:'💳',title:'Local Payments',desc:'CCP, BaridiMob, COD'},{icon:'📦',title:'58 Wilayas',desc:'Nationwide delivery'},{icon:'🤖',title:'AI Powered',desc:'Smart chatbot'}]}},
    {type:'pricing',label:'Pricing Plans',icon:CreditCard,defaults:{title:'Simple Pricing',bgColor:'#FFFFFF',plans:[{name:'Basic',price:'2900',period:'month',features:['50 Products','300 Orders','Basic Analytics'],btnText:'Get Started',btnLink:'/register'},{name:'Advanced',price:'7250',period:'month',features:['Unlimited Products','Unlimited Orders','AI Features','Priority Support'],popular:true,btnText:'Get Started',btnLink:'/register'}]}},
    {type:'cta',label:'Call to Action',icon:Zap,defaults:{title:'Ready to Start?',subtitle:'Join hundreds of Algerian businesses.',btnText:'Create Store',btnLink:'/register',bgColor:'#10B981',textColor:'#FFFFFF',padding:'64'}},
    {type:'testimonials',label:'Testimonials',icon:Users,defaults:{title:'What Users Say',bgColor:'#F9FAFB',columns:'2',items:[{name:'Ahmed B.',text:'Best platform for e-commerce in Algeria!',role:'Store Owner'},{name:'Sara M.',text:'Setup was incredibly easy.',role:'Entrepreneur'}]}},
    {type:'stats',label:'Stats Counter',icon:BarChart3,defaults:{title:'Platform in Numbers',bgColor:'#FFFFFF',accentColor:'#7C3AED',items:[{value:'500+',label:'Active Stores'},{value:'10K+',label:'Orders'},{value:'58',label:'Wilayas'},{value:'24/7',label:'Support'}]}},
    {type:'image',label:'Image',icon:Image,defaults:{src:'',alt:'Image',width:'100',height:'0',borderRadius:'16',link:'',position:'center',padding:'32',bgColor:'transparent'}},
    {type:'video',label:'Video Embed',icon:Activity,defaults:{url:'',title:'Watch Our Demo',bgColor:'#000000',padding:'48'}},
    {type:'spacer',label:'Spacer',icon:ArrowDown,defaults:{height:'48',bgColor:'transparent'}},
  ];

  const[blocks,setBlocks]=useState([]);const[saving,setSaving]=useState(false);const[editIdx,setEditIdx]=useState(null);
  const imgRef=useRef(null);

  useEffect(()=>{platformApi.getSettings().then(r=>{try{setBlocks(JSON.parse(r.data?.landing_blocks||'[]'));}catch{setBlocks([]);}}).catch(()=>{});},[]);

  const save=async(overrideBlocks)=>{setSaving(true);try{await platformApi.updateSettings({landing_blocks:JSON.stringify(overrideBlocks!==undefined?overrideBlocks:blocks)});toast.success('Page saved!');}catch(e){toast.error('Failed');}setSaving(false);};
  const addBlock=(type)=>{const t=BLOCK_TYPES.find(b=>b.type===type);if(t)setBlocks([...blocks,{type:t.type,...JSON.parse(JSON.stringify(t.defaults)),id:Date.now()}]);};
  const removeBlock=(idx)=>setBlocks(blocks.filter((_,i)=>i!==idx));
  const moveBlock=(from,to)=>{if(to<0||to>=blocks.length)return;const n=[...blocks];const[m]=n.splice(from,1);n.splice(to,0,m);setBlocks(n);};
  const updateBlock=(idx,key,val)=>{const n=[...blocks];n[idx]={...n[idx],[key]:val};setBlocks(n);};
  const updateItem=(blockIdx,itemIdx,key,val)=>{const n=[...blocks];const items=[...(n[blockIdx].items||[])];items[itemIdx]={...items[itemIdx],[key]:val};n[blockIdx]={...n[blockIdx],items};setBlocks(n);};
  const addItem=(blockIdx,template)=>{const n=[...blocks];n[blockIdx]={...n[blockIdx],items:[...(n[blockIdx].items||[]),template]};setBlocks(n);};
  const removeItem=(blockIdx,itemIdx)=>{const n=[...blocks];n[blockIdx]={...n[blockIdx],items:n[blockIdx].items.filter((_,i)=>i!==itemIdx)};setBlocks(n);};
  const addPlan=(blockIdx)=>{const n=[...blocks];n[blockIdx]={...n[blockIdx],plans:[...(n[blockIdx].plans||[]),{name:'New Plan',price:'0',period:'month',features:['Feature 1'],btnText:'Get Started',btnLink:'/register'}]};setBlocks(n);};
  const updatePlan=(blockIdx,planIdx,key,val)=>{const n=[...blocks];const plans=[...(n[blockIdx].plans||[])];plans[planIdx]={...plans[planIdx],[key]:val};n[blockIdx]={...n[blockIdx],plans};setBlocks(n);};
  const removePlan=(blockIdx,planIdx)=>{const n=[...blocks];n[blockIdx]={...n[blockIdx],plans:n[blockIdx].plans.filter((_,i)=>i!==planIdx)};setBlocks(n);};

  const uploadImage=(idx)=>(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>updateBlock(idx,'src',r.result);r.readAsDataURL(f);};

  // Color+text input helper
  const F=({label,value,onChange,type='text',placeholder=''})=>{
    return(<div><label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
    {type==='color'?<div className="flex gap-1 mt-0.5"><input type="color" className="w-7 h-7 rounded" value={value||'#000000'} onChange={e=>onChange(e.target.value)}/><input className="flex-1 px-2 py-1 bg-white rounded-lg border border-gray-200 text-xs" value={value||''} onChange={e=>onChange(e.target.value)}/></div>
    :type==='textarea'?<textarea className="w-full mt-0.5 px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-xs" rows={2} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    :<input type={type} className="w-full mt-0.5 px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-xs" value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
    </div>);
  };

  // Full editor for a block
  const renderEditor=(block,idx)=>{
    const common=<div className="grid grid-cols-3 gap-2 mb-2"><F label="Background" value={block.bgColor} onChange={v=>updateBlock(idx,'bgColor',v)} type="color"/><F label="Text Color" value={block.textColor} onChange={v=>updateBlock(idx,'textColor',v)} type="color"/><F label="Padding (px)" value={block.padding} onChange={v=>updateBlock(idx,'padding',v)} type="number"/></div>;
    switch(block.type){
      case'hero':return<>{common}<div className="grid grid-cols-2 gap-2"><F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Font Size (px)" value={block.fontSize} onChange={v=>updateBlock(idx,'fontSize',v)} type="number"/></div><F label="Subtitle" value={block.subtitle} onChange={v=>updateBlock(idx,'subtitle',v)}/><div className="grid grid-cols-3 gap-2"><F label="Button Text" value={block.btnText} onChange={v=>updateBlock(idx,'btnText',v)}/><F label="Button Link" value={block.btnLink} onChange={v=>updateBlock(idx,'btnLink',v)}/><F label="Button Color" value={block.btnColor} onChange={v=>updateBlock(idx,'btnColor',v)} type="color"/></div></>;
      case'text':return<>{common}<F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Content" value={block.content} onChange={v=>updateBlock(idx,'content',v)} type="textarea"/><div className="flex gap-2 mt-1">{['left','center','right'].map(a=><button key={a} onClick={()=>updateBlock(idx,'align',a)} className={`px-3 py-1 rounded text-xs font-bold ${block.align===a?'bg-brand-500 text-white':'bg-gray-200'}`}>{a}</button>)}</div></>;
      case'features':return(<>{common}<div className="grid grid-cols-2 gap-2"><F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Columns" value={block.columns} onChange={v=>updateBlock(idx,'columns',v)} type="number"/></div><F label="Card Background" value={block.cardBg} onChange={v=>updateBlock(idx,'cardBg',v)} type="color"/><p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Items</p>{(block.items||[]).map((item,ii)=><div key={ii} className="flex gap-1 mt-1 items-start p-2 bg-white rounded-lg border"><div className="flex-1 grid grid-cols-3 gap-1"><input className="px-1 py-0.5 border rounded text-xs" value={item.icon} onChange={e=>updateItem(idx,ii,'icon',e.target.value)} placeholder="emoji"/><input className="px-1 py-0.5 border rounded text-xs" value={item.title} onChange={e=>updateItem(idx,ii,'title',e.target.value)} placeholder="title"/><input className="px-1 py-0.5 border rounded text-xs" value={item.desc} onChange={e=>updateItem(idx,ii,'desc',e.target.value)} placeholder="desc"/>
</div><button onClick={()=>removeItem(idx,ii)} className="text-red-400 p-0.5"><Trash2 size={10}/></button>
</div>)}<button onClick={()=>addItem(idx,{icon:'⭐',title:'New Feature',desc:'Description'})} className="text-xs text-brand-600 font-bold mt-1">+ Add Feature</button></>);
      case'pricing':return(<>{common}<F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Plans</p>{(block.plans||[]).map((plan,pi)=><div key={pi} className="p-2 bg-white rounded-lg border mt-1 space-y-1"><div className="flex items-center justify-between"><span className="text-xs font-bold">{plan.name}</span><div className="flex gap-1"><label className="flex items-center gap-1 text-[9px]"><input type="checkbox" checked={plan.popular||false} onChange={e=>updatePlan(idx,pi,'popular',e.target.checked)}/>Popular</label><button onClick={()=>removePlan(idx,pi)} className="text-red-400"><Trash2 size={10}/></button></div>
</div><div className="grid grid-cols-3 gap-1"><input className="px-1 py-0.5 border rounded text-xs" value={plan.name} onChange={e=>updatePlan(idx,pi,'name',e.target.value)} placeholder="Name"/><input className="px-1 py-0.5 border rounded text-xs" value={plan.price} onChange={e=>updatePlan(idx,pi,'price',e.target.value)} placeholder="Price"/><select className="px-1 py-0.5 border rounded text-xs" value={plan.period} onChange={e=>updatePlan(idx,pi,'period',e.target.value)}><option value="month">month</option><option value="year">year</option></select></div>
<div className="grid grid-cols-2 gap-1"><input className="px-1 py-0.5 border rounded text-xs" value={plan.btnText||''} onChange={e=>updatePlan(idx,pi,'btnText',e.target.value)} placeholder="Button text"/><input className="px-1 py-0.5 border rounded text-xs" value={plan.btnLink||''} onChange={e=>updatePlan(idx,pi,'btnLink',e.target.value)} placeholder="Button link"/></div><textarea className="w-full px-1 py-0.5 border rounded text-[10px]" rows={2} value={(plan.features||[]).join('\n')} onChange={e=>updatePlan(idx,pi,'features',e.target.value.split('\n'))} placeholder="One feature per line"/>
</div>
)}<button onClick={()=>addPlan(idx)} className="text-xs text-brand-600 font-bold mt-1">+ Add Plan</button></>);
      case'cta':return<>{common}<F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Subtitle" value={block.subtitle} onChange={v=>updateBlock(idx,'subtitle',v)}/><div className="grid grid-cols-3 gap-2"><F label="Button Text" value={block.btnText} onChange={v=>updateBlock(idx,'btnText',v)}/><F label="Button Link" value={block.btnLink} onChange={v=>updateBlock(idx,'btnLink',v)}/><F label="Button Color" value={block.btnColor} onChange={v=>updateBlock(idx,'btnColor',v)} type="color"/></div></>;
      case'testimonials':return(<>{common}<div className="grid grid-cols-2 gap-2"><F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Columns" value={block.columns} onChange={v=>updateBlock(idx,'columns',v)} type="number"/></div>{(block.items||[]).map((t,ti)=><div key={ti} className="flex gap-1 mt-1 items-start p-2 bg-white rounded-lg border"><div className="flex-1 grid grid-cols-3 gap-1"><input className="px-1 py-0.5 border rounded text-xs" value={t.name} onChange={e=>updateItem(idx,ti,'name',e.target.value)} placeholder="Name"/><input className="px-1 py-0.5 border rounded text-xs" value={t.role} onChange={e=>updateItem(idx,ti,'role',e.target.value)} placeholder="Role"/><input className="px-1 py-0.5 border rounded text-xs col-span-2" value={t.text} onChange={e=>updateItem(idx,ti,'text',e.target.value)} placeholder="Quote"/></div><button onClick={()=>removeItem(idx,ti)} className="text-red-400 p-0.5"><Trash2 size={10}/></button></div>)}<button onClick={()=>addItem(idx,{name:'New Person',text:'Great platform!',role:'User'})} className="text-xs text-brand-600 font-bold mt-1">+ Add Testimonial</button></>);
      case'stats':return(<>{common}<div className="grid grid-cols-2 gap-2"><F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/><F label="Accent Color" value={block.accentColor} onChange={v=>updateBlock(idx,'accentColor',v)} type="color"/></div>{(block.items||[]).map((s,si)=><div key={si} className="flex gap-1 mt-1 items-center"><input className="px-1 py-0.5 border rounded text-xs w-20" value={s.value} onChange={e=>updateItem(idx,si,'value',e.target.value)} placeholder="500+"/><input className="px-1 py-0.5 border rounded text-xs flex-1" value={s.label} onChange={e=>updateItem(idx,si,'label',e.target.value)} placeholder="Label"/><button onClick={()=>removeItem(idx,si)} className="text-red-400"><Trash2 size={10}/></button></div>)}<button onClick={()=>addItem(idx,{value:'100+',label:'New Stat'})} className="text-xs text-brand-600 font-bold mt-1">+ Add Stat</button></>);
      case'image':return<>{common}<div className="grid grid-cols-3 gap-2"><F label="Width (%)" value={block.width} onChange={v=>updateBlock(idx,'width',v)} type="number"/><F label="Height (px, 0=auto)" value={block.height} onChange={v=>updateBlock(idx,'height',v)} type="number"/><F label="Border Radius (px)" value={block.borderRadius} onChange={v=>updateBlock(idx,'borderRadius',v)} type="number"/></div><div><label className="text-[10px] font-bold text-gray-400 uppercase">Position</label><div className="flex gap-1 mt-0.5">{[{v:'far-left',l:'⬅️ Far Left'},{v:'left',l:'◀ Left'},{v:'center',l:'⬛ Center'},{v:'right',l:'▶ Right'},{v:'far-right',l:'➡️ Far Right'}].map(p=><button key={p.v} onClick={()=>updateBlock(idx,'position',p.v)} className={`px-2 py-1 rounded text-[9px] font-bold ${(block.position||'center')===p.v?'bg-brand-500 text-white':'bg-gray-200 text-gray-600'}`}>{p.l}</button>)}</div></div><F label="Link URL (optional)" value={block.link} onChange={v=>updateBlock(idx,'link',v)} placeholder="https://..."/><F label="Alt Text" value={block.alt} onChange={v=>updateBlock(idx,'alt',v)} placeholder="Image description"/>{block.src?<div className="mt-1 relative"><img src={block.src} className="w-full rounded-lg border max-h-32 object-cover"/><button onClick={()=>updateBlock(idx,'src','')} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={10}/></button></div>:<div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-brand-400" onClick={()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=uploadImage(idx);inp.click();}}><Image size={20} className="mx-auto text-gray-400 mb-1"/><p className="text-xs text-gray-500">Click to upload image</p></div>}</>;
      case'video':return<>{common}<F label="YouTube/Vimeo URL" value={block.url} onChange={v=>updateBlock(idx,'url',v)} placeholder="https://youtube.com/watch?v=..."/><F label="Title" value={block.title} onChange={v=>updateBlock(idx,'title',v)}/></>;
      case'spacer':return<div className="grid grid-cols-2 gap-2"><F label="Height (px)" value={block.height} onChange={v=>updateBlock(idx,'height',v)} type="number"/><F label="Background" value={block.bgColor} onChange={v=>updateBlock(idx,'bgColor',v)} type="color"/></div>;
      default:return null;
    }
  };

  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-black text-gray-900">Page Builder</h1><div className="flex gap-2"><button onClick={()=>{if(confirm('Reset to original landing page? All custom blocks will be removed.')){setBlocks([]);save([]);}}} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 flex items-center gap-1"><RefreshCw size={14}/>Reset to Original</button><a href="/" target="_blank" className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold flex items-center gap-1"><Eye size={14}/>Preview</a><button onClick={()=>save()} disabled={saving} className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 flex items-center gap-2"><Save size={16}/>{saving?'Saving...':'Save Page'}</button></div></div>

    <div className="grid lg:grid-cols-[1fr,280px] gap-6">
      <div className="space-y-3">
        {blocks.length===0&&<div className="bg-white rounded-2xl p-12 text-center shadow-sm"><Layers size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No custom blocks</p><p className="text-sm text-gray-400 mt-1">The default landing page is showing. Add blocks to customize it.</p></div>}
        {blocks.map((block,idx)=>{const BT=BLOCK_TYPES.find(b=>b.type===block.type);const Icon=BT?.icon||Layers;const isEditing=editIdx===idx;return(
          <div key={block.id||idx} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isEditing?'ring-2 ring-brand-400':''}`}>
            <div className="px-4 py-2.5 bg-gray-50 flex items-center gap-2 border-b">
              <GripVertical size={12} className="text-gray-300"/>
              <Icon size={14} className="text-brand-500"/>
              <span className="font-bold text-xs text-gray-700 flex-1">{BT?.label||block.type}</span>
              <button onClick={()=>moveBlock(idx,idx-1)} disabled={idx===0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={10}/></button>
              <button onClick={()=>moveBlock(idx,idx+1)} disabled={idx===blocks.length-1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={10}/></button>
              <button onClick={()=>setEditIdx(isEditing?null:idx)} className={`p-1 rounded ${isEditing?'bg-brand-500 text-white':'hover:bg-blue-50 text-blue-500'}`}><Settings size={10}/></button>
              <button onClick={()=>{removeBlock(idx);if(editIdx===idx)setEditIdx(null);}} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={10}/></button>
            </div>
            {/* Mini preview */}
            <div className="p-3 text-xs text-gray-500 max-h-16 overflow-hidden">
              {block.type==='hero'&&<div className="rounded-lg p-2 text-white text-center" style={{backgroundColor:block.bgColor||'#7C3AED'}}><p className="font-bold text-sm truncate">{block.title}</p></div>}
              {block.type==='text'&&<p className="truncate"><span className="font-bold">{block.title}</span> — {block.content}</p>}
              {block.type==='features'&&<p>📋 {(block.items||[]).length} features: {(block.items||[]).map(i=>i.title).join(', ')}</p>}
              {block.type==='pricing'&&<p>💳 {(block.plans||[]).length} plans: {(block.plans||[]).map(p=>`${p.name} (${p.price} DZD)`).join(', ')}</p>}
              {block.type==='cta'&&<div className="rounded-lg p-2 text-white text-center" style={{backgroundColor:block.bgColor||'#10B981'}}><p className="font-bold text-sm truncate">{block.title}</p></div>}
              {block.type==='testimonials'&&<p>💬 {(block.items||[]).length} testimonials</p>}
              {block.type==='stats'&&<p>📊 {(block.items||[]).map(s=>s.value).join(' · ')}</p>}
              {block.type==='image'&&(block.src?<div className="flex items-center gap-2"><img src={block.src} className="h-12 rounded object-cover"/><span className="text-[10px] text-gray-400">{block.width}% · {block.position||'center'}</span></div>:<p>🖼️ No image uploaded</p>)}
              {block.type==='video'&&<p>🎬 {block.url||'No URL set'}</p>}
              {block.type==='spacer'&&<p>↕️ {block.height||48}px spacer</p>}
            </div>
            {/* Full editor */}
            {isEditing&&<div className="border-t p-3 bg-gray-50 space-y-2">{renderEditor(block,idx)}</div>}
          </div>
        );})}
      </div>

      {/* Block palette */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Add Blocks</p>
        {BLOCK_TYPES.map(bt=>{const Icon=bt.icon;return(
          <button key={bt.type} onClick={()=>addBlock(bt.type)} className="w-full flex items-center gap-2 p-2.5 bg-white rounded-xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-brand-400 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><Icon size={14} className="text-brand-500"/></div>
            <div className="flex-1 min-w-0"><p className="font-bold text-xs text-gray-800">{bt.label}</p></div>
            <Plus size={12} className="text-gray-300 shrink-0"/>
          </button>
        );})}
      </div>
    </div>
  </div>);
}


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
  const[sidebarOpen,setSidebarOpen]=useState(false);
  return(
    <div className="flex min-h-screen bg-gray-50/80">
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      <main className="flex-1 lg:ml-64 min-w-0">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"><Menu size={20} className="text-gray-600"/></button>
            <Shield size={16} className="text-red-500 hidden md:block"/><span className="text-sm font-bold text-gray-700">Platform Administration</span>
          </div>
          <div className="flex items-center gap-3"><span className="px-3 py-1 bg-red-50 rounded-full text-[10px] font-bold text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"/>SUPER ADMIN</span></div>
        </header>
        <div className="p-4 md:p-8">
          <Routes>
            <Route path="dashboard" element={<Overview/>}/>
            <Route path="store-owners" element={<StoreOwners/>}/>
            <Route path="stores" element={<AllStores/>}/>
            <Route path="orders" element={<AllOrders/>}/>
            <Route path="site-settings" element={<SiteSettings/>}/>
            <Route path="subscriptions" element={<Subscriptions/>}/>
            <Route path="billing-config" element={<BillingConfig/>}/>
            <Route path="page-builder" element={<PageBuilder/>}/>
            <Route path="system" element={<SystemHealth/>}/>
            <Route path="*" element={<Overview/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
}
