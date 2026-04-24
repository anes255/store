import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { platformApi } from '../../utils/api';
import { useAuthStore, usePlatformTheme, generatePalette } from '../../hooks/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PlansEditor from './PlansEditor';
import RoleTemplatesEditor from './RoleTemplatesEditor';
import AdminWhatsApp from './AdminWhatsApp';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import ThemePanel from '../../components/shared/ThemePanel';
import {LayoutDashboard,Users,Store,Settings,LogOut,Shield,ShoppingCart,DollarSign,Save,Globe,Eye,EyeOff,Ban,CheckCircle,AlertTriangle,TrendingUp,BarChart3,Package,Search,Trash2,RefreshCw,Server,Database,Wifi,WifiOff,ChevronRight,X,ExternalLink,Activity,Zap,CreditCard,Mail,Smartphone,Bot,ArrowUp,ArrowDown,Calendar,Layers,Plus,GripVertical,Image,Type,Menu,Bell,Gift,Clock} from 'lucide-react';

function NotificationsBell({isDark,pc}){
  const nav=useNavigate();
  const[open,setOpen]=useState(false);
  const[items,setItems]=useState([]);
  const[unread,setUnread]=useState(0);
  const[loading,setLoading]=useState(false);
  const load=()=>{setLoading(true);platformApi.getNotifications().then(r=>{setItems(r.data?.notifications||[]);setUnread(r.data?.unread||0);}).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();const id=setInterval(load,60000);return()=>clearInterval(id);},[]);
  const markRead=async(id)=>{try{await platformApi.markNotificationRead(id);load();}catch{}};
  const markAll=async()=>{try{await platformApi.markAllNotificationsRead();load();}catch{}};
  const clearAll=async()=>{if(!confirm('Clear all notifications?'))return;try{await platformApi.clearNotifications();load();}catch{}};
  const del=async(id,e)=>{e.stopPropagation();try{await platformApi.deleteNotification(id);load();}catch{}};
  const iconFor=(t)=>{
    if(t==='subscription_payment')return{I:CreditCard,c:'text-amber-500',bg:'bg-amber-100'};
    if(t==='subscription_approved')return{I:CheckCircle,c:'text-emerald-500',bg:'bg-emerald-100'};
    if(t==='subscription_expiring')return{I:Clock,c:'text-amber-500',bg:'bg-amber-100'};
    if(t==='subscription_expired')return{I:AlertTriangle,c:'text-red-500',bg:'bg-red-100'};
    if(t==='account_deleted')return{I:Trash2,c:'text-red-500',bg:'bg-red-100'};
    return{I:Bell,c:'text-gray-500',bg:'bg-gray-100'};
  };
  const click=(n)=>{if(!n.is_read)markRead(n.id);if(n.link){setOpen(false);nav(n.link);}};
  return(
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className={`relative p-2 rounded-xl ${isDark?'hover:bg-white/10 text-gray-300':'hover:bg-gray-100 text-gray-700'}`} title="Notifications">
        <Bell size={18}/>
        {unread>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread>99?'99+':unread}</span>}
      </button>
      {open&&(<>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[380px] max-h-[75vh] overflow-y-auto rounded-2xl shadow-2xl border z-50 ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'}`}>
          <div className={`sticky top-0 px-4 py-3 border-b flex items-center justify-between ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'}`}>
            <div>
              <div className={`text-sm font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>Notifications</div>
              <div className="text-[11px] text-gray-400">{unread} unread · {items.length} total</div>
            </div>
            <div className="flex items-center gap-1">
              {unread>0&&<button onClick={markAll} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark?'hover:bg-white/10 text-gray-300':'hover:bg-gray-100 text-gray-600'}`} title="Mark all read">Mark all</button>}
              <button onClick={load} className={`p-1.5 rounded-lg ${isDark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-500'}`} title="Refresh"><RefreshCw size={14}/></button>
              {items.length>0&&<button onClick={clearAll} className={`p-1.5 rounded-lg ${isDark?'hover:bg-white/10 text-red-400':'hover:bg-red-50 text-red-500'}`} title="Clear all"><Trash2 size={14}/></button>}
            </div>
          </div>
          {loading?<div className="p-6 text-center text-xs text-gray-400">Loading...</div>:items.length===0?<div className="p-8 text-center text-xs text-gray-400">No notifications</div>:(
            <div className={isDark?'divide-y divide-gray-800':'divide-y divide-gray-100'}>
              {items.map(n=>{const ic=iconFor(n.type);const I=ic.I;return(
                <div key={n.id} onClick={()=>click(n)} className={`p-3 cursor-pointer flex items-start gap-3 ${n.is_read?'':(isDark?'bg-blue-950/30':'bg-blue-50/50')} ${isDark?'hover:bg-white/5':'hover:bg-gray-50'}`}>
                  <div className={`w-9 h-9 rounded-xl ${ic.bg} flex items-center justify-center shrink-0`}><I size={16} className={ic.c}/></div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold ${isDark?'text-gray-100':'text-gray-900'} flex items-center gap-2`}>
                      {!n.is_read&&<span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"/>}
                      <span className="truncate">{n.title}</span>
                    </div>
                    {n.body&&<div className={`text-[11px] mt-0.5 ${isDark?'text-gray-400':'text-gray-500'}`}>{n.body}</div>}
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={(e)=>del(n.id,e)} className={`p-1 rounded-lg shrink-0 ${isDark?'hover:bg-white/10 text-gray-500':'hover:bg-gray-100 text-gray-400'}`}><X size={12}/></button>
                </div>
              );})}
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}

function ExpiringSubscriptionsBell({isDark,pc}){
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);
  const [extending,setExtending]=useState(null);
  const [daysMap,setDaysMap]=useState({});
  const load=()=>{setLoading(true);platformApi.getExpiringSubscriptions().then(r=>setItems(r.data?.owners||[])).catch(()=>setItems([])).finally(()=>setLoading(false));};
  useEffect(()=>{load();const id=setInterval(load,60000);return()=>clearInterval(id);},[]);
  const extend=async(ownerId)=>{
    const days=parseInt(daysMap[ownerId]||7,10);
    if(!days||days<1)return toast.error('Enter days');
    setExtending(ownerId);
    try{await platformApi.extendSubscription(ownerId,{days});toast.success(`Granted ${days} free day(s)`);load();}
    catch(e){toast.error(e?.response?.data?.error||'Failed');}
    setExtending(null);
  };
  const urgentCount=items.filter(i=>i.hours_remaining<=24).length;
  return(
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className={`relative p-2 rounded-xl ${isDark?'hover:bg-white/10 text-gray-300':'hover:bg-gray-100 text-gray-700'}`} title="Expiring subscriptions">
        <Bell size={18}/>
        {urgentCount>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{urgentCount}</span>}
      </button>
      {open&&(
        <>
          <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
          <div className={`absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[360px] max-h-[70vh] overflow-y-auto rounded-2xl shadow-2xl border z-50 ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'}`}>
            <div className={`sticky top-0 px-4 py-3 border-b flex items-center justify-between ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'}`}>
              <div>
                <div className={`text-sm font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>Expiring Subscriptions</div>
                <div className="text-[11px] text-gray-400">Owners within 24h of expiry or recently expired</div>
              </div>
              <button onClick={load} className={`p-1.5 rounded-lg ${isDark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-500'}`} title="Refresh"><RefreshCw size={14}/></button>
            </div>
            {loading?<div className="p-6 text-center text-xs text-gray-400">Loading...</div>:items.length===0?<div className="p-6 text-center text-xs text-gray-400">No expiring subscriptions</div>:(
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map(o=>{
                  const hrs=o.hours_remaining;
                  const expired=hrs<0;
                  const badge=expired?{bg:'bg-red-100 text-red-700',t:`Expired ${Math.abs(hrs)}h ago`}:hrs<=24?{bg:'bg-amber-100 text-amber-700',t:`${hrs}h left`}:{bg:'bg-blue-100 text-blue-700',t:`${hrs}h left`};
                  return(
                    <div key={o.id} className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className={`text-sm font-bold truncate ${isDark?'text-gray-100':'text-gray-900'}`}>{o.name||'Owner'}</div>
                          <div className="text-[11px] text-gray-400 truncate">{o.phone||o.email}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10}/>{new Date(o.subscription_expires_at).toLocaleString()}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${badge.bg}`}>{badge.t}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="365" placeholder="7" value={daysMap[o.id]||''} onChange={e=>setDaysMap(m=>({...m,[o.id]:e.target.value}))} className={`w-16 px-2 py-1.5 rounded-lg border text-xs ${isDark?'bg-gray-800 border-gray-700 text-gray-100':'bg-white border-gray-200 text-gray-900'}`}/>
                        <span className="text-[11px] text-gray-400">days</span>
                        <button disabled={extending===o.id} onClick={()=>extend(o.id)} className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50" style={{backgroundColor:pc}}>
                          <Gift size={12}/>{extending===o.id?'...':'Grant Free'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar({open,onClose,isDark,pc,pl}){
  const {t}=useTranslation();
  const loc=useLocation();const{logout,user}=useAuthStore();const nav=useNavigate();
  const links=[
    {path:'/admin/dashboard',icon:LayoutDashboard,label:t('admin.overview','Overview')},
    {path:'/admin/store-owners',icon:Users,label:t('admin.storeOwners','Store Owners')},
    {path:'/admin/stores',icon:Store,label:t('admin.allStores','All Stores')},
    {path:'/admin/orders',icon:ShoppingCart,label:t('admin.allOrders','All Orders')},
    {path:'/admin/subscriptions',icon:CreditCard,label:t('admin.subscriptions','Subscriptions')},
    {path:'/admin/plans',icon:Layers,label:t('admin.plansEditor','Plans Editor')},
    {path:'/admin/role-templates',icon:Shield,label:t('admin.roleTemplates','Role Templates')},
    {path:'/admin/billing-config',icon:DollarSign,label:t('admin.billingConfig','Billing Config')},
    {path:'/admin/site-settings',icon:Globe,label:t('admin.siteBranding','Site & Branding')},
    {path:'/admin/page-builder',icon:Layers,label:t('admin.pageBuilder','Page Builder')},
    {path:'/admin/whatsapp',icon:Smartphone,label:t('admin.platformWhatsapp','Platform WhatsApp')},
    {path:'/admin/system',icon:Server,label:t('admin.systemHealth','System Health')},
    {path:'/admin/profile',icon:Settings,label:t('admin.myProfile','My Profile')},
    {path:'/admin/admins',icon:Shield,label:t('admin.superAdmins','Super Admins')},
  ];
  return(<>
    {open&&<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}/>}
    <aside className={`fixed top-0 left-0 z-50 w-56 border-r h-screen flex flex-col transition-transform duration-300 lg:translate-x-0 ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} ${open?'translate-x-0':'-translate-x-full'}`}>
      <div className={`p-4 border-b flex items-center justify-between ${isDark?'border-gray-800':'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:pc}}><Shield size={16} className="text-white"/></div>
          <div><p className={`font-bold text-sm ${isDark?'text-gray-100':'text-gray-800'}`}>{t('admin.superAdmin','Super Admin')}</p><p className="text-[10px]" style={{color:pl[400]}}>{t('admin.controlPanel','CONTROL PANEL')}</p></div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600"><X size={18}/></button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{color:pl[400]}}>Main Menu</p>
        {links.map(l=>{const I=l.icon;const active=loc.pathname===l.path;
          // Generate palette for platform primary color
          return(
          <Link key={l.path} to={l.path} onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${active?'text-white font-bold shadow-md':''}`}
            style={active?{backgroundColor:pc,boxShadow:`0 4px 12px ${pc}40`}:{color:isDark?pl[300]:pl[600]}}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.backgroundColor=isDark?pc+'15':pl[50];e.currentTarget.style.color=isDark?pl[200]:pl[700];}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.backgroundColor='';e.currentTarget.style.color=isDark?pl[300]:pl[600];}}}
          >
            <I size={16}/><span>{l.label}</span>
          </Link>
        );})}
      </nav>
      <div className={`p-3 border-t ${isDark?'border-gray-800':'border-gray-100'}`}>
        <div className="flex items-center gap-2 rounded-xl p-2.5 mb-2" style={{backgroundColor:pc+'15'}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:pc}}>{user?.name?.[0]||'A'}</div>
          <div><p className={`text-xs font-bold ${isDark?'text-gray-200':'text-gray-800'}`}>{user?.name||'Admin'}</p><p className="text-[10px] text-gray-400">Super Admin</p></div>
        </div>
        <button onClick={()=>{logout();nav('/admin/login');}} className={`w-full flex items-center gap-2 px-3 py-2 text-red-500 rounded-xl text-sm font-medium ${isDark?'hover:bg-red-500/10':'hover:bg-red-50'}`}><LogOut size={14}/>{t('admin.logout','Logout')}</button>
      </div>
    </aside></>);
}

// ═══════ OVERVIEW ═══════
function Overview(){
  const {t}=useTranslation();
  const theme=usePlatformTheme();const isDark=theme.mode==='dark';
  const[data,setData]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{platformApi.getDashboard().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  if(loading)return<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin"/></div>;
  const s=data?.stats||{};
  const cards=[
    {label:t('admin.storeOwners','Store Owners'),value:s.totalOwners,icon:Users,color:'from-blue-500 to-blue-600',sub:`+${s.weekOwners||0} ${t('admin.thisWeek','this week')}`,to:'/admin/store-owners'},
    {label:t('admin.activeStores','Active Stores'),value:s.totalStores,icon:Store,color:'from-purple-500 to-purple-600',sub:t('admin.totalStores','Total stores'),to:'/admin/stores'},
    {label:t('admin.totalOrders','Total Orders'),value:s.totalOrders,icon:ShoppingCart,color:'from-emerald-500 to-emerald-600',sub:`${s.todayOrders||0} ${t('admin.today','today')}`,to:'/admin/orders'},
    {label:t('admin.revenue','Revenue'),value:`${(s.totalRevenue||0).toLocaleString()} DZD`,icon:DollarSign,color:'from-amber-500 to-orange-500',sub:`${(s.todayRevenue||0).toLocaleString()} DZD ${t('admin.today','today')}`,to:'/admin/subscriptions'},
    {label:t('admin.products','Products'),value:s.totalProducts,icon:Package,color:'from-cyan-500 to-cyan-600',sub:t('admin.acrossStores','Across all stores'),to:'/admin/stores'},
    {label:t('admin.customers','Customers'),value:s.totalCustomers,icon:Users,color:'from-pink-500 to-rose-500',sub:t('admin.registeredBuyers','Registered buyers'),to:'/admin/store-owners'},
  ];
  return(<div>
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6"><div className="min-w-0"><h1 className={`text-xl md:text-2xl font-black ${isDark?'text-gray-100':'text-gray-900'}`}>{t('admin.platformOverview','Platform Overview')}</h1><p className="text-xs md:text-sm text-gray-400 mt-1">{new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p></div><button onClick={()=>window.location.reload()} className={`px-3 md:px-4 py-2 ${isDark?'bg-gray-800 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200'} rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 shrink-0`}><RefreshCw size={14}/>{t('common.refresh','Refresh')}</button></div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 mb-8">{cards.map((c,i)=>{const I=c.icon;return(
      <Link key={i} to={c.to} className={`${isDark?'bg-gray-800 hover:bg-gray-750':'bg-white hover:bg-gray-50'} rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer block group`}>
        <div className="flex items-center justify-between mb-3"><div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}><I size={16} className="text-white"/></div><ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors"/></div>
        <p className={`text-lg md:text-2xl font-black break-words ${isDark?'text-gray-100':'text-gray-900'}`}>{c.value}</p><p className="text-[11px] md:text-xs text-gray-400 mt-1">{c.label}</p><p className="text-[10px] text-emerald-500 font-bold mt-1 truncate">{c.sub}</p>
      </Link>);})}</div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl p-6 shadow-sm`}><h3 className={`font-bold ${isDark?'text-gray-100':'text-gray-900'} mb-4 flex items-center gap-2`}><ShoppingCart size={16}/>{t('admin.recentOrders','Recent Orders')}</h3>
        <div className="space-y-2">{(data?.recentOrders||[]).slice(0,8).map(o=>(
          <div key={o.id} className={`flex items-center justify-between p-3 ${isDark?'bg-gray-900':'bg-gray-50'} rounded-xl`}>
            <div className="flex items-center gap-3"><span className="font-mono text-xs font-bold text-brand-600">{o.order_number}</span><span className={`text-sm ${isDark?'text-gray-300':'text-gray-700'}`}>{o.customer_name}</span></div>
            <div className="flex items-center gap-3"><span className="text-sm font-bold">{parseFloat(o.total).toLocaleString()}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status==='delivered'?'bg-emerald-100 text-emerald-700':o.status==='pending'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>{o.status}</span></div>
          </div>
        ))}</div>
      </div>
      <div className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl p-6 shadow-sm`}><h3 className={`font-bold ${isDark?'text-gray-100':'text-gray-900'} mb-4 flex items-center gap-2`}><Store size={16}/>{t('admin.recentStores','Recent Stores')}</h3>
        <div className="space-y-2">{(data?.recentStores||[]).slice(0,8).map(s=>(
          <div key={s.id} className={`flex items-center justify-between p-3 ${isDark?'bg-gray-900':'bg-gray-50'} rounded-xl`}>
            <div><p className={`text-sm font-bold ${isDark?'text-gray-200':'text-gray-800'}`}>{s.name||s.store_name}</p><p className="text-[10px] text-gray-400">{s.owner_name} · {s.product_count||0} products</p></div>
            <div className="flex items-center gap-2"><span className={`text-sm font-bold ${isDark?'text-gray-300':'text-gray-600'}`}>{parseFloat(s.revenue||0).toLocaleString()} DZD</span>{s.is_published?<span className="w-2 h-2 rounded-full bg-emerald-400"/>:<span className="w-2 h-2 rounded-full bg-gray-300"/>}</div>
          </div>
        ))}</div>
      </div>
    </div>
  </div>);
}

// ═══════ STORE OWNERS ═══════
function StoreOwners(){
  const theme=usePlatformTheme();const isDark=theme.mode==='dark';
  const[owners,setOwners]=useState([]);const[search,setSearch]=useState('');const[loading,setLoading]=useState(true);
  const load=()=>{platformApi.getStoreOwners({search}).then(r=>setOwners(r.data.owners||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[search]);
  const toggle=async(id)=>{try{await platformApi.toggleOwner(id);toast.success('Updated');load();}catch{toast.error('Failed');}};
  const del=async(id)=>{
    if(!confirm('Delete this owner and deactivate their stores?'))return;
    try{
      await platformApi.deleteOwner(id);
      toast.success('Owner deleted');
      // Optimistically remove from the list so the UI updates even if the
      // reload race-conditions or returns a cached response.
      setOwners(prev=>prev.filter(o=>o.id!==id));
      load();
    }catch(e){
      const msg=e?.response?.data?.error||e?.response?.data?.message||e?.message||'Failed to delete owner';
      toast.error(msg);
    }
  };
  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-2 mb-6"><h1 className={`text-xl md:text-2xl font-black ${isDark?'text-gray-100':'text-gray-900'}`}>Store Owners</h1><span className="text-xs md:text-sm text-gray-400">{owners.length} total</span></div>
    <div className="relative max-w-md mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className={`w-full pl-10 pr-4 py-3 ${isDark?'bg-gray-800 border-gray-700 text-gray-100':'bg-white border-gray-200'} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20`} placeholder="Search by name, email, phone..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:<>
    {/* Mobile card list */}
    <div className="md:hidden space-y-3">
      {owners.length===0?<p className="text-center py-12 text-gray-400">No owners found</p>:owners.map(o=>{
        const suspended=o.subscription_status==='suspended'||o.is_active===false;
        return(
          <div key={o.id} className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl shadow-sm p-4`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">{o.full_name?.[0]||'U'}</div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold truncate ${isDark?'text-gray-200':'text-gray-800'}`}>{o.full_name||o.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{o.email}</p>
                <p className="text-[11px] text-gray-400 truncate">{o.phone}</p>
              </div>
              {suspended?<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 shrink-0">Suspended</span>:<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">Active</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><p className="text-[9px] uppercase font-bold text-gray-400">Stores</p><p className={`text-sm font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>{o.store_count||0}</p></div>
              <div><p className="text-[9px] uppercase font-bold text-gray-400">Revenue</p><p className={`text-sm font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>{parseFloat(o.total_revenue||0).toLocaleString()} DZD</p></div>
              <div><p className="text-[9px] uppercase font-bold text-gray-400">Plan</p><p className="text-sm font-bold text-brand-600 capitalize">{o.subscription_plan||'free'}</p></div>
            </div>
            <div className="flex gap-1 mt-3 justify-end">
              {suspended?
                <button onClick={async()=>{try{await platformApi.setOwnerSubscription(o.id,{action:'activate'});toast.success('Activated');load();}catch{toast.error('Failed');}}} className="flex-1 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold">Activate</button>:
                <button onClick={async()=>{if(!confirm('Suspend? Their stores go offline.'))return;try{await platformApi.setOwnerSubscription(o.id,{action:'suspend'});toast.success('Suspended');load();}catch{toast.error('Failed');}}} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Suspend</button>}
              <button onClick={()=>del(o.id)} className="py-2 px-3 rounded-lg bg-red-50 text-red-500"><Trash2 size={14}/></button>
            </div>
          </div>
        );
      })}
    </div>
    <div className={`hidden md:block ${isDark?'bg-gray-800':'bg-white'} rounded-2xl shadow-sm overflow-x-auto`}><table className="w-full text-sm min-w-[720px]"><thead><tr className={`${isDark?'bg-gray-900':'bg-gray-50'} text-left text-xs text-gray-400 uppercase`}><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Stores</th><th className="px-5 py-3">Revenue</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
    <tbody>{owners.map(o=>(
      <tr key={o.id} className={`border-t ${isDark?'border-gray-700 hover:bg-gray-700':'border-gray-100 hover:bg-gray-50'}`}>
        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{o.full_name?.[0]||'U'}</div><div><p className={`font-bold ${isDark?'text-gray-200':'text-gray-800'}`}>{o.full_name||o.name}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div></div></td>
        <td className="px-5 py-4"><p className={`${isDark?'text-gray-300':'text-gray-700'}`}>{o.email}</p><p className="text-xs text-gray-400">{o.phone}</p></td>
        <td className="px-5 py-4 font-bold text-center">{o.store_count||0}</td>
        <td className={`px-5 py-4 font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>{parseFloat(o.total_revenue||0).toLocaleString()} DZD</td>
        <td className="px-5 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 capitalize">{o.subscription_plan||'free'}</span></td>
        <td className="px-5 py-4">{o.subscription_status==='suspended'||o.is_active===false?<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Suspended</span>:<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>}</td>
        <td className="px-5 py-4"><div className="flex gap-1">
          {o.subscription_status==='suspended'||o.is_active===false?
            <button onClick={async()=>{try{await platformApi.setOwnerSubscription(o.id,{action:'activate'});toast.success('Activated');load();}catch{toast.error('Failed');}}} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-500" title="Activate"><CheckCircle size={14}/></button>:
            <button onClick={async()=>{if(!confirm('Suspend? Their stores go offline.'))return;try{await platformApi.setOwnerSubscription(o.id,{action:'suspend'});toast.success('Suspended');load();}catch{toast.error('Failed');}}} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Suspend"><Ban size={14}/></button>}
          <button onClick={()=>del(o.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14}/></button>
        </div></td>
      </tr>
    ))}</tbody></table>{owners.length===0&&<p className="text-center py-12 text-gray-400">No owners found</p>}</div></>}
  </div>);
}

// ═══════ ALL STORES ═══════
function AllStores(){
  const {t}=useTranslation();
  const theme=usePlatformTheme();const isDark=theme.mode==='dark';
  const[stores,setStores]=useState([]);const[loading,setLoading]=useState(true);const[detail,setDetail]=useState(null);
  const load=()=>{platformApi.getStores().then(r=>setStores(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const toggle=async(id)=>{try{await api.patch(`/platform/stores/${id}/toggle`);toast.success('Toggled');load();}catch{toast.error('Failed');}};
  const del=async(id)=>{if(!confirm('Delete this store and ALL its data? This cannot be undone.'))return;try{await api.delete(`/platform/stores/${id}`);toast.success('Deleted');setDetail(null);load();}catch{toast.error('Failed');}};
  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-2 mb-6"><h1 className={`text-xl md:text-2xl font-black ${isDark?'text-gray-100':'text-gray-900'}`}>{t('admin.allStores','All Stores')}</h1><span className="text-xs md:text-sm text-gray-400">{stores.length} {t('admin.total','total')}</span></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:
    <div className="grid gap-4">{stores.map(s=>(
      <div key={s.id} className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
        <div className="p-4 md:p-5 flex flex-wrap items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">{(s.name||s.store_name||'S')[0]}</div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setDetail(detail?.id===s.id?null:s)}>
            <div className="flex flex-wrap items-center gap-2"><p className={`font-bold truncate ${isDark?'text-gray-100':'text-gray-900'}`}>{s.name||s.store_name}</p>{s.is_published?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{t('admin.live','LIVE')}</span>:<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>{t('admin.offline','OFFLINE')}</span>}</div>
            <p className="text-xs text-gray-400 truncate">Owner: {s.owner_name||'N/A'} · {s.owner_email||''} {(s.owner_active===false||s.subscription_status==='suspended')&&<span className="text-red-500 font-bold">⚠ OWNER SUSPENDED</span>}</p>
          </div>
          <div className="text-right ml-auto"><p className="text-sm font-bold whitespace-nowrap">{parseFloat(s.revenue||0).toLocaleString()} DZD</p><p className="text-[10px] text-gray-400 whitespace-nowrap">{s.product_count||0} products · {s.order_count||0} orders</p></div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button onClick={()=>setDetail(detail?.id===s.id?null:s)} className={`p-2 ${isDark?'hover:bg-gray-700':'hover:bg-gray-100'} rounded-lg text-gray-400`} title="Details"><Eye size={14}/></button>
            <a href={`/s/${s.slug}`} target="_blank" className={`p-2 ${isDark?'hover:bg-gray-700':'hover:bg-gray-100'} rounded-lg text-gray-400`} title="Visit"><ExternalLink size={14}/></a>
            <button onClick={()=>toggle(s.id)} className={`p-2 ${isDark?'hover:bg-gray-700':'hover:bg-gray-100'} rounded-lg text-gray-400`} title={s.is_published?'Take offline':'Put live'}>{s.is_published?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            <button onClick={()=>del(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400" title="Delete"><Trash2 size={14}/></button>
          </div>
        </div>
        {detail?.id===s.id&&<div className={`border-t ${isDark?'border-gray-700 bg-gray-900':'border-gray-100 bg-gray-50'} p-4 md:p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}>
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
  const[expanded,setExpanded]=useState(null);
  const load=()=>{api.get('/platform/orders',{params:{status:filter,search}}).then(r=>{setOrders(r.data.orders||[]);setTotal(r.data.total||0);}).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[filter,search]);
  const variantLabel=(v)=>{try{const vv=typeof v==='string'?JSON.parse(v):v;if(!vv)return'';return vv.label||vv.name||(Array.isArray(vv.selections)?vv.selections.map(s=>s.name).filter(Boolean).join(' / '):'');}catch{return'';}};
  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-2 mb-6"><h1 className="text-xl md:text-2xl font-black text-gray-900">All Orders</h1><span className="text-xs md:text-sm text-gray-400">{total} total</span></div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">{['all','pending','confirmed','shipped','delivered','cancelled'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter===f?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{f==='all'?'All':f}</button>)}</div>
      <div className="relative flex-1 sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:<>
    {/* Mobile cards */}
    <div className="md:hidden space-y-3">
      {orders.length===0?<p className="text-center py-12 text-gray-400">No orders found</p>:orders.map(o=>{const isOpen=expanded===o.id;return(
        <div key={o.id} className="bg-white rounded-2xl shadow-sm p-4">
          <div onClick={()=>setExpanded(isOpen?null:o.id)} className="flex items-start justify-between gap-2 cursor-pointer">
            <div className="min-w-0">
              <p className="font-mono font-bold text-xs text-brand-600">{o.order_number}</p>
              <p className="text-sm text-gray-800 truncate mt-0.5">{o.customer_name}</p>
              <p className="text-[11px] text-gray-400 truncate">{o.customer_phone} · {o.store_name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold whitespace-nowrap">{parseFloat(o.total).toLocaleString()} DZD</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status==='delivered'?'bg-emerald-100 text-emerald-700':o.status==='pending'?'bg-amber-100 text-amber-700':o.status==='cancelled'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{o.status}</span>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {isOpen&&(<div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {(!o.items||!o.items.length)?<p className="text-xs text-gray-400">No items recorded for this order.</p>:o.items.map((it,idx)=>{const vl=variantLabel(it.variant_info);return(
              <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                {it.image?<img src={it.image} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-gray-200"/>:<div className="w-10 h-10 rounded-md bg-gray-200 shrink-0"/>}
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{it.product_name}</p>{vl&&<p className="text-[10px] text-gray-500 truncate">{vl}</p>}<p className="text-[10px] text-gray-400">{parseFloat(it.price||0).toLocaleString()} × {it.quantity}</p></div>
                <p className="text-xs font-bold text-gray-900 shrink-0">{parseFloat(it.total_price||(it.price*it.quantity)||0).toLocaleString()}</p>
              </div>);})}
          </div>)}
        </div>
      );})}
    </div>
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto"><table className="w-full text-sm min-w-[820px]"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="px-5 py-3 w-8"></th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Store</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr></thead>
    <tbody>{orders.map(o=>{const isOpen=expanded===o.id;return(<React.Fragment key={o.id}>
      <tr onClick={()=>setExpanded(isOpen?null:o.id)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
        <td className="px-5 py-3 text-gray-400"><ChevronRight size={16} className={`transition-transform ${isOpen?'rotate-90':''}`}/></td>
        <td className="px-5 py-3 font-mono font-bold text-xs text-brand-600">{o.order_number}</td>
        <td className="px-5 py-3"><p className="text-gray-800">{o.customer_name}</p><p className="text-[10px] text-gray-400">{o.customer_phone}</p></td>
        <td className="px-5 py-3 text-gray-500 text-xs">{o.store_name}</td>
        <td className="px-5 py-3 text-gray-700 text-xs font-semibold">{(o.items||[]).reduce((s,i)=>s+(parseInt(i.quantity)||0),0)} ({(o.items||[]).length})</td>
        <td className="px-5 py-3 font-bold">{parseFloat(o.total).toLocaleString()} DZD</td>
        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status==='delivered'?'bg-emerald-100 text-emerald-700':o.status==='pending'?'bg-amber-100 text-amber-700':o.status==='cancelled'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{o.status}</span></td>
        <td className="px-5 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
      </tr>
      {isOpen&&(<tr className="bg-gray-50/50"><td colSpan={8} className="px-5 py-4"><div className="space-y-2">
        {(!o.items||!o.items.length)?<p className="text-xs text-gray-400">No items recorded for this order.</p>:o.items.map((it,idx)=>{const vl=variantLabel(it.variant_info);return(
          <div key={idx} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
            {it.image?<img src={it.image} alt="" className="w-11 h-11 rounded-md object-cover shrink-0 border border-gray-200"/>:<div className="w-11 h-11 rounded-md bg-gray-200 shrink-0"/>}
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{it.product_name}</p>{vl&&<p className="text-[11px] text-gray-500 truncate">{vl}</p>}<p className="text-[11px] text-gray-400 mt-0.5">{parseFloat(it.price||0).toLocaleString()} × {it.quantity}</p></div>
            <p className="text-sm font-bold text-gray-900 shrink-0">{parseFloat(it.total_price||(it.price*it.quantity)||0).toLocaleString()} DZD</p>
          </div>);})}
      </div></td></tr>)}
    </React.Fragment>);})}</tbody></table>{orders.length===0&&<p className="text-center py-12 text-gray-400">No orders found</p>}</div></>}
  </div>);
}

// ═══════ SITE SETTINGS ═══════
function SiteSettings(){
  const[s,setS]=useState({});const[loading,setLoading]=useState(false);const logoRef=useRef(null);const favRef=useRef(null);
  useEffect(()=>{platformApi.getSettings().then(r=>setS(r.data)).catch(()=>{});},[]);
  const save=async()=>{setLoading(true);try{const{data}=await platformApi.updateSettings(s);setS(data);toast.success('Saved!');}catch{toast.error('Failed');}setLoading(false);};
  const imgUp=(field)=>(e)=>{const f=e.target.files?.[0];if(!f){toast.error('No file');return;}const reader=new FileReader();reader.onerror=()=>toast.error('Read failed');reader.onload=()=>{const img=new window.Image();img.onerror=()=>toast.error('Image invalid');img.onload=()=>{try{const c=document.createElement('canvas');const max=field==='favicon'?128:400;const ratio=Math.min(max/img.width,max/img.height,1);c.width=Math.max(1,Math.round(img.width*ratio));c.height=Math.max(1,Math.round(img.height*ratio));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const compressed=c.toDataURL('image/png');setS(prev=>({...(prev||{}),[field]:compressed}));toast.success('Uploaded — click Save to apply');}catch(err){toast.error('Compress failed');}};img.src=reader.result;};reader.readAsDataURL(f);e.target.value='';};
  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><h1 className="text-xl md:text-2xl font-black text-gray-900">Site & Branding</h1><button onClick={save} disabled={loading} className="px-4 md:px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-600 disabled:opacity-50"><Save size={16}/>Save Changes</button></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">Platform Identity</h3>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Site Name</label><input className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" value={s.site_name||''} onChange={e=>setS({...s,site_name:e.target.value})}/></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Meta Description</label><textarea className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none" rows={3} value={s.meta_description||''} onChange={e=>setS({...s,meta_description:e.target.value})}/></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Currency</label><select className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.currency||'DZD'} onChange={e=>setS({...s,currency:e.target.value})}><option value="DZD">DZD</option><option value="EUR">EUR</option><option value="USD">USD</option></select></div>
        <div><label className="text-xs font-bold text-gray-400 uppercase">Google OAuth Client ID</label><input className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono" value={s.google_client_id||''} onChange={e=>setS({...s,google_client_id:e.target.value})} placeholder="xxxx.apps.googleusercontent.com"/><p className="text-[10px] text-gray-400 mt-1">For Google Sheets integration. Get from console.cloud.google.com → Credentials → OAuth Client ID</p></div>
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer"><div><p className="font-medium text-sm text-gray-800">Maintenance Mode</p><p className="text-xs text-gray-400">Temporarily disable the platform</p></div><div className={`w-11 h-6 rounded-full transition-colors ${s.maintenance_mode?'bg-red-500':'bg-gray-300'} relative`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${s.maintenance_mode?'translate-x-5':'translate-x-0.5'}`}/></div><input type="checkbox" className="sr-only" checked={s.maintenance_mode||false} onChange={e=>setS({...s,maintenance_mode:e.target.checked})}/></label>
      </div>
      {/* Free Trial for new users */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Gift size={16} className="text-emerald-500"/>Free Trial (new users)</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-gray-500 uppercase">{s.trial_enabled!==false?'Enabled':'Disabled'}</span>
            <div className={`w-11 h-6 rounded-full transition-colors ${s.trial_enabled!==false?'bg-emerald-500':'bg-gray-300'} relative`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${s.trial_enabled!==false?'translate-x-5':'translate-x-0.5'}`}/></div>
            <input type="checkbox" className="sr-only" checked={s.trial_enabled!==false} onChange={e=>setS({...s,trial_enabled:e.target.checked})}/>
          </label>
        </div>
        <p className="text-xs text-gray-400">When enabled, every newly-registered store owner gets the selected plan free for the specified number of days.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-gray-400 uppercase">Trial Duration (days)</label>
            <input type="number" min="0" max="3650" className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={s.trial_days??''} onChange={e=>setS({...s,trial_days:e.target.value===''?'':parseInt(e.target.value,10)})} placeholder="14"/>
            <div className="flex gap-1.5 mt-2 flex-wrap">{[3,7,14,30,60,90].map(d=>(<button key={d} type="button" onClick={()=>setS({...s,trial_days:d})} className={`px-2 py-1 rounded-lg text-[11px] font-bold ${s.trial_days===d?'bg-emerald-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}d</button>))}</div>
          </div>
          <div><label className="text-xs font-bold text-gray-400 uppercase">Trial Plan</label>
            <select className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm" value={s.trial_plan||'basic'} onChange={e=>setS({...s,trial_plan:e.target.value})}>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Plan granted during the trial period. Use any plan slug defined in your Subscriptions Plans page.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900">Colors & Branding</h3>
        <div className="grid grid-cols-3 gap-3">{[{k:'primary_color',l:'Primary',d:'#7C3AED'},{k:'secondary_color',l:'Secondary',d:'#06B6D4'},{k:'accent_color',l:'Accent',d:'#F59E0B'}].map(c=>(
          <div key={c.k}><label className="text-xs font-bold text-gray-400 uppercase">{c.l}</label><div className="flex items-center gap-2 mt-1"><input type="color" className="w-8 h-8 rounded" value={s[c.k]||c.d} onChange={e=>setS({...s,[c.k]:e.target.value})}/><input className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs" value={s[c.k]||c.d} onChange={e=>setS({...s,[c.k]:e.target.value})}/></div></div>
        ))}</div>
        <div className="flex gap-4"><div><p className="text-xs font-bold text-gray-400 uppercase mb-1">Logo</p><div className="relative w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer group" onClick={()=>logoRef.current?.click()}>{s.site_logo?<img src={s.site_logo} className="w-full h-full object-cover" alt=""/>:<span className="text-xs text-gray-400">Upload</span>}{s.site_logo&&<button type="button" onClick={(e)=>{e.stopPropagation();setS({...s,site_logo:''});}} className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" aria-label="Remove logo">✕</button>}</div><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={imgUp('site_logo')}/></div><div><p className="text-xs font-bold text-gray-400 uppercase mb-1">Favicon</p><div className="relative w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer group" onClick={()=>favRef.current?.click()}>{s.favicon?<img src={s.favicon} className="w-full h-full object-cover" alt=""/>:<span className="text-xs text-gray-400">Upload</span>}{s.favicon&&<button type="button" onClick={(e)=>{e.stopPropagation();setS({...s,favicon:''});}} className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" aria-label="Remove favicon">✕</button>}</div><input ref={favRef} type="file" accept="image/*" className="hidden" onChange={imgUp('favicon')}/></div></div>
      </div>
    </div>
  </div>);
}

// ═══════ SYSTEM ═══════
// ═══════ SUBSCRIPTIONS ═══════
function Subscriptions({isDark}){
  const[data,setData]=useState({payments:[],stats:{}});const[loading,setLoading]=useState(true);const[filter,setFilter]=useState('all');
  const[rejectModal,setRejectModal]=useState(null);const[rejectNotes,setRejectNotes]=useState('');
  const[viewReceipt,setViewReceipt]=useState(null);
  const[expiring,setExpiring]=useState([]);const[grantModal,setGrantModal]=useState(null);const[grantDays,setGrantDays]=useState(7);
  const load=()=>{setLoading(true);platformApi.getSubscriptions({status:filter}).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));
    platformApi.getExpiringSubscriptions().then(r=>setExpiring(r.data?.owners||[])).catch(()=>setExpiring([]));};
  useEffect(()=>{load();},[filter]);
  const approve=async(pid)=>{try{await platformApi.approvePayment(pid);toast.success('Payment approved! Subscription activated.');load();}catch{toast.error('Failed');}};
  const reject=async()=>{if(!rejectModal)return;try{await platformApi.rejectPayment(rejectModal,{notes:rejectNotes});toast.success('Rejected');setRejectModal(null);setRejectNotes('');load();}catch{toast.error('Failed');}};
  const suspend=async(oid)=>{if(!confirm('Suspend this owner? Their stores will go offline.'))return;try{await platformApi.setOwnerSubscription(oid,{action:'suspend'});toast.success('Suspended');load();}catch{toast.error('Failed');}};
  const activate=async(oid)=>{try{await platformApi.setOwnerSubscription(oid,{action:'activate'});toast.success('Activated');load();}catch{toast.error('Failed');}};
  const grant=async()=>{if(!grantModal)return;const d=parseInt(grantDays,10);if(!d||d<1)return toast.error('Enter valid days');
    try{await platformApi.extendSubscription(grantModal.id,{days:d});toast.success(`Granted ${d} free day(s) to ${grantModal.name||grantModal.full_name}`);setGrantModal(null);setGrantDays(7);load();}catch{toast.error('Failed');}};
  const stats=data.stats||{};
  const card=isDark?'bg-gray-900 border border-gray-800':'bg-white';
  const cardSoft=isDark?'bg-gray-800/50 border border-gray-700':'bg-gray-50';
  const titleC=isDark?'text-gray-100':'text-gray-900';
  const textC=isDark?'text-gray-200':'text-gray-800';
  const mutedC=isDark?'text-gray-400':'text-gray-400';
  const rowHover=isDark?'hover:bg-white/5':'hover:bg-gray-50';
  const rowBorder=isDark?'border-gray-800':'border-gray-100';
  const theadBg=isDark?'bg-gray-800/60':'bg-gray-50';
  const inputCls=isDark?'bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500':'border border-gray-200 text-gray-900';
  return(<div>
    <h1 className={`text-xl md:text-2xl font-black ${titleC} mb-6`}>Subscription Payments</h1>

    {/* Expiring subscriptions — grant free extra days */}
    <div className={`${card} rounded-2xl shadow-sm mb-6 overflow-hidden`}>
      <div className={`px-5 py-4 border-b ${rowBorder} flex items-center justify-between`}>
        <div className="flex items-center gap-2"><Clock size={16} className={titleC}/><h3 className={`font-bold ${titleC}`}>Expiring / Recently Expired</h3></div>
        <span className={`text-xs ${mutedC}`}>{expiring.length} owner(s)</span>
      </div>
      {expiring.length===0?<p className={`text-center py-8 text-xs ${mutedC}`}>No expiring subscriptions in the next 24h</p>:(
        <div className="divide-y" style={{borderColor:isDark?'#1f2937':'#f3f4f6'}}>
          {expiring.map(o=>(
            <div key={o.id} className={`flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 ${rowHover}`}>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${textC}`}>{o.name||o.full_name}</p>
                <p className={`text-[11px] ${mutedC}`}>{o.email||o.phone} · <span className="capitalize">{o.subscription_plan||'free'}</span> · expires {new Date(o.subscription_expires_at).toLocaleString()} {o.hours_remaining!=null&&<span className={o.hours_remaining<0?'text-red-500 font-bold':'text-amber-500 font-bold'}> ({o.hours_remaining}h)</span>}</p>
              </div>
              <button onClick={()=>{setGrantModal(o);setGrantDays(7);}} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 flex items-center gap-1 shrink-0 ml-auto"><Gift size={12}/>Grant free days</button>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <div className={`${card} rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-red-400`} onClick={()=>setFilter('all')}><p className={`text-xs ${mutedC}`}>Total</p><p className={`text-xl md:text-2xl font-black ${titleC}`}>{(stats.pending||0)+(stats.approved||0)+(stats.rejected||0)}</p></div>
      <div className={`${isDark?'bg-amber-900/30 border border-amber-800':'bg-amber-50'} rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-amber-400`} onClick={()=>setFilter('pending')}><p className={`text-xs ${isDark?'text-amber-300':'text-amber-600'}`}>Pending</p><p className={`text-xl md:text-2xl font-black ${isDark?'text-amber-200':'text-amber-700'}`}>{stats.pending||0}</p></div>
      <div className={`${isDark?'bg-emerald-900/30 border border-emerald-800':'bg-emerald-50'} rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-emerald-400`} onClick={()=>setFilter('approved')}><p className={`text-xs ${isDark?'text-emerald-300':'text-emerald-600'}`}>Approved</p><p className={`text-xl md:text-2xl font-black ${isDark?'text-emerald-200':'text-emerald-700'}`}>{stats.approved||0}</p></div>
      <div className={`${isDark?'bg-red-900/30 border border-red-800':'bg-red-50'} rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:ring-2 hover:ring-red-400`} onClick={()=>setFilter('rejected')}><p className={`text-xs ${isDark?'text-red-300':'text-red-600'}`}>Rejected</p><p className={`text-xl md:text-2xl font-black ${isDark?'text-red-200':'text-red-700'}`}>{stats.rejected||0}</p></div>
    </div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto"/></div>:<>
    {/* Mobile cards */}
    <div className="md:hidden space-y-3">
      {data.payments.length===0?<p className={`text-center py-12 ${mutedC}`}>No subscription payments {filter!=='all'?`with status "${filter}"`:''}</p>:data.payments.map(p=>(
        <div key={p.id} className={`${card} rounded-2xl shadow-sm p-4`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-bold ${textC} truncate`}>{p.owner_name||'N/A'}</p>
              <p className={`text-[11px] ${mutedC}`}>{p.owner_phone}</p>
              <p className={`text-[11px] mt-1 capitalize ${textC}`}><span className="font-bold">{p.plan}</span> · {p.period}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold ${textC}`}>{parseFloat(p.amount).toLocaleString()} DZD</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold ${p.status==='approved'?'bg-emerald-100 text-emerald-700':p.status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{p.status?.toUpperCase()}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 mt-3 text-[11px] ${mutedC}`}>
            <span className="uppercase font-bold">{p.payment_method}</span>
            {p.receipt_image&&<button onClick={()=>setViewReceipt(p)} className="text-brand-600 font-bold hover:underline flex items-center gap-1 ml-auto"><Eye size={12}/>Receipt</button>}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {p.status==='pending'&&<><button onClick={()=>approve(p.id)} className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold">Approve</button><button onClick={()=>{setRejectModal(p.id);setRejectNotes('');}} className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold">Reject</button></>}
            {p.status==='approved'&&<button onClick={()=>suspend(p.owner_id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Suspend</button>}
            {p.owner_id&&<button onClick={()=>{setGrantModal({id:p.owner_id,name:p.owner_name});setGrantDays(7);}} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"><Gift size={12}/>Grant</button>}
          </div>
        </div>
      ))}
    </div>
    <div className={`hidden md:block ${card} rounded-2xl shadow-sm overflow-x-auto`}>
      {data.payments.length===0?<p className={`text-center py-12 ${mutedC}`}>No subscription payments {filter!=='all'?`with status "${filter}"`:''}</p>:
      <table className="w-full text-sm min-w-[780px]"><thead><tr className={`${theadBg} text-left text-xs uppercase ${mutedC}`}><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
      <tbody>{data.payments.map(p=>(
        <tr key={p.id} className={`border-t ${rowBorder} ${rowHover}`}>
          <td className="px-5 py-4"><div><p className={`font-bold ${textC}`}>{p.owner_name||'N/A'}</p><p className={`text-[10px] ${mutedC}`}>{p.owner_phone}</p></div></td>
          <td className={`px-5 py-4 ${textC}`}><span className="font-bold capitalize">{p.plan}</span><br/><span className={`text-[10px] ${mutedC} capitalize`}>{p.period}</span></td>
          <td className={`px-5 py-4 font-bold ${textC}`}>{parseFloat(p.amount).toLocaleString()} DZD</td>
          <td className={`px-5 py-4 uppercase text-xs ${textC}`}>{p.payment_method}</td>
          <td className="px-5 py-4">{p.receipt_image?<button onClick={()=>setViewReceipt(p)} className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1"><Eye size={12}/>View</button>:'-'}</td>
          <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.status==='approved'?'bg-emerald-100 text-emerald-700':p.status==='rejected'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{p.status?.toUpperCase()}</span></td>
          <td className="px-5 py-4"><div className="flex gap-1 flex-wrap">
            {p.status==='pending'&&<><button onClick={()=>approve(p.id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">Approve</button><button onClick={()=>{setRejectModal(p.id);setRejectNotes('');}} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">Reject</button></>}
            {p.status==='approved'&&<button onClick={()=>suspend(p.owner_id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Suspend</button>}
            {p.owner_id&&<button onClick={()=>{setGrantModal({id:p.owner_id,name:p.owner_name});setGrantDays(7);}} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1" title="Grant extra free days"><Gift size={12}/>Grant days</button>}
          </div></td>
        </tr>
      ))}</tbody></table>}
    </div></>}
    {rejectModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setRejectModal(null)}><div className={`${card} rounded-3xl p-6 w-full max-w-sm shadow-2xl`} onClick={e=>e.stopPropagation()}><h3 className={`font-bold text-lg mb-4 ${titleC}`}>Reject Payment</h3><textarea className={`w-full px-4 py-3 rounded-xl text-sm ${inputCls}`} rows={3} placeholder="Reason for rejection..." value={rejectNotes} onChange={e=>setRejectNotes(e.target.value)}/><div className="flex gap-3 mt-4"><button onClick={()=>setRejectModal(null)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${isDark?'bg-gray-800 text-gray-200':'bg-gray-100'}`}>Cancel</button><button onClick={reject} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Reject</button></div></div></div>}
    {grantModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setGrantModal(null)}><div className={`${card} rounded-3xl p-6 w-full max-w-sm shadow-2xl`} onClick={e=>e.stopPropagation()}>
      <h3 className={`font-bold text-lg mb-2 ${titleC} flex items-center gap-2`}><Gift size={18} className="text-emerald-500"/>Grant Free Days</h3>
      <p className={`text-xs ${mutedC} mb-4`}>Extend subscription for <strong className={textC}>{grantModal.name||grantModal.full_name}</strong></p>
      <label className={`text-xs font-bold uppercase ${mutedC}`}>Days</label>
      <input type="number" min="1" max="3650" className={`w-full px-4 py-3 rounded-xl text-sm mt-1 ${inputCls}`} value={grantDays} onChange={e=>setGrantDays(e.target.value)}/>
      <div className="flex gap-2 mt-2 flex-wrap">{[3,7,14,30,90].map(d=>(<button key={d} onClick={()=>setGrantDays(d)} className={`px-2 py-1 rounded-lg text-[11px] font-bold ${isDark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>+{d}d</button>))}</div>
      <div className="flex gap-3 mt-4"><button onClick={()=>setGrantModal(null)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${isDark?'bg-gray-800 text-gray-200':'bg-gray-100'}`}>Cancel</button><button onClick={grant} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold">Grant</button></div>
    </div></div>}
    {viewReceipt&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setViewReceipt(null)}><div className={`${card} rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className={`font-bold text-lg ${titleC}`}>Payment Receipt</h3><button onClick={()=>setViewReceipt(null)} className={`p-1 rounded-lg ${isDark?'hover:bg-white/10 text-gray-300':'hover:bg-gray-100'}`}><X size={18}/></button></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 ${cardSoft} rounded-xl`}><p className={`text-[10px] uppercase ${mutedC}`}>Owner</p><p className={`font-bold text-sm ${textC}`}>{viewReceipt.owner_name}</p><p className={`text-xs ${mutedC}`}>{viewReceipt.owner_phone}</p></div>
        <div className={`p-3 ${cardSoft} rounded-xl`}><p className={`text-[10px] uppercase ${mutedC}`}>Plan</p><p className={`font-bold text-sm capitalize ${textC}`}>{viewReceipt.plan} — {viewReceipt.period}</p></div>
        <div className={`p-3 ${cardSoft} rounded-xl`}><p className={`text-[10px] uppercase ${mutedC}`}>Amount</p><p className={`font-bold text-sm ${textC}`}>{parseFloat(viewReceipt.amount).toLocaleString()} DZD</p></div>
        <div className={`p-3 ${cardSoft} rounded-xl`}><p className={`text-[10px] uppercase ${mutedC}`}>Method</p><p className={`font-bold text-sm uppercase ${textC}`}>{viewReceipt.payment_method}</p></div>
      </div>
      {viewReceipt.receipt_image&&<img src={viewReceipt.receipt_image} className="w-full rounded-xl border" alt="Receipt"/>}
      <p className={`text-xs ${mutedC} mt-3 text-center`}>Submitted {new Date(viewReceipt.created_at).toLocaleString()}</p>
      {viewReceipt.status==='pending'&&<div className="flex gap-3 mt-4"><button onClick={()=>{approve(viewReceipt.id);setViewReceipt(null);}} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold">Approve</button><button onClick={()=>{setRejectModal(viewReceipt.id);setRejectNotes('');setViewReceipt(null);}} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold">Reject</button></div>}
    </div></div>}
  </div>);
}

// ═══════ BILLING CONFIG ═══════
function BillingConfig(){
  const[config,setConfig]=useState({billing_ccp_account:'',billing_ccp_name:'',billing_baridimob_rip:'',billing_baridimob_qr:''});
  const[plans,setPlans]=useState([]);
  const[saving,setSaving]=useState(false);const fileRef=useRef(null);
  useEffect(()=>{
    platformApi.getSettings().then(r=>{const s=r.data||{};setConfig({billing_ccp_account:s.billing_ccp_account||'',billing_ccp_name:s.billing_ccp_name||'',billing_baridimob_rip:s.billing_baridimob_rip||'',billing_baridimob_qr:s.billing_baridimob_qr||''});}).catch(()=>{});
    platformApi.getPlans().then(r=>{setPlans(r.data?.plans||[]);}).catch(()=>{});
  },[]);
  const save=async()=>{setSaving(true);try{await platformApi.updateBillingConfig(config);toast.success('Billing config saved!');}catch{toast.error('Failed');}setSaving(false);};
  const uploadQR=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setConfig({...config,billing_baridimob_qr:r.result});r.readAsDataURL(f);};
  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><h1 className="text-xl md:text-2xl font-black text-gray-900">Billing Configuration</h1><button onClick={save} disabled={saving} className="px-4 md:px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 flex items-center gap-2"><Save size={16}/>{saving?'Saving...':'Save'}</button></div>

    {/* Active subscription plans summary */}
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1"><CreditCard size={18}/>Subscription Plans & Pricing</h3>
      <p className="text-xs text-gray-400 mb-4">Pricing is managed per plan in the <strong>Subscriptions</strong> page. Below is a summary of your active plans.</p>
      {plans.length===0?<div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700 flex items-center gap-2"><AlertTriangle size={16}/>No subscription plans created yet. Go to <strong className="mx-1">Subscriptions</strong> to add plans with pricing.</div>:(
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.filter(p=>p.is_active).map(p=>(
            <div key={p.id} className={`p-4 rounded-xl border-2 ${p.is_popular?'border-brand-400 bg-brand-50':'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">{p.name?.en||p.slug}</span>
                {p.is_popular&&<span className="text-[9px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">POPULAR</span>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Monthly</span><span className="font-bold text-gray-900">{(p.price_monthly||0).toLocaleString()} {p.currency||'DZD'}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Yearly</span><span className="font-bold text-gray-900">{(p.price_yearly||0).toLocaleString()} {p.currency||'DZD'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
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
            {config.billing_baridimob_qr&&(
              <div className="relative w-24 h-24 group">
                <img src={config.billing_baridimob_qr} className="w-24 h-24 rounded-xl border object-cover"/>
                <button type="button" onClick={()=>setConfig({...config,billing_baridimob_qr:''})} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg" aria-label="Remove QR">✕</button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-red-400 flex-1" onClick={()=>fileRef.current?.click()}><p className="text-sm text-gray-500">{config.billing_baridimob_qr?'Replace QR':'Upload QR image'}</p></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadQR}/>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2">
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
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><h1 className="text-xl md:text-2xl font-black text-gray-900">Page Builder</h1><div className="flex flex-wrap gap-2"><button onClick={()=>{if(confirm('Reset to original landing page? All custom blocks will be removed.')){setBlocks([]);save([]);}}} className="px-3 md:px-4 py-2 bg-gray-100 rounded-xl text-xs md:text-sm font-bold text-gray-600 hover:bg-gray-200 flex items-center gap-1"><RefreshCw size={14}/><span className="hidden sm:inline">Reset to Original</span><span className="sm:hidden">Reset</span></button><a href="/" target="_blank" className="px-3 md:px-4 py-2 bg-gray-100 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1"><Eye size={14}/>Preview</a><button onClick={()=>save()} disabled={saving} className="px-4 md:px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-red-600 flex items-center gap-2"><Save size={16}/>{saving?'Saving...':'Save'}</button></div></div>

    <div className="grid lg:grid-cols-[1fr,280px] gap-4 md:gap-6">
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
    {name:'Email',ok:sys.services?.email,icon:Mail,desc:'Resend'},
    {name:'AI Chatbot',ok:sys.services?.ai,icon:Bot,desc:'Google Gemini'},
    {name:'Payments',ok:sys.services?.payments,icon:CreditCard,desc:'Chargily Pay'},
  ];
  return(<div>
    <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-6">System Health</h1>
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

// ═══════ MY PROFILE ═══════
function MyProfile(){
  const {t}=useTranslation();
  const{user,setUser}=useAuthStore();
  const[form,setForm]=useState({name:'',email:'',phone:''});
  const[pwForm,setPwForm]=useState({current_password:'',new_password:'',confirm_password:''});
  const[saving,setSaving]=useState(false);
  const[changingPw,setChangingPw]=useState(false);

  useEffect(()=>{
    platformApi.getAdminProfile().then(r=>{const p=r.data;setForm({name:p.name||'',email:p.email||'',phone:p.phone||''});}).catch(()=>{
      if(user)setForm({name:user.name||'',email:user.email||'',phone:user.phone||''});
    });
  },[]);

  const saveProfile=async()=>{
    if(!form.name||!form.email)return toast.error('Name and email are required');
    setSaving(true);
    try{
      const{data}=await platformApi.updateAdminProfile(form);
      if(data&&setUser)setUser({...user,...data});
      toast.success('Profile updated');
    }catch(e){toast.error(e.response?.data?.error||'Failed to update profile');}
    setSaving(false);
  };

  const changePassword=async()=>{
    if(!pwForm.current_password||!pwForm.new_password)return toast.error('All password fields required');
    if(pwForm.new_password!==pwForm.confirm_password)return toast.error('Passwords do not match');
    if(pwForm.new_password.length<6)return toast.error('Password must be at least 6 characters');
    setChangingPw(true);
    try{
      await platformApi.changeAdminPassword(pwForm);
      toast.success('Password changed');
      setPwForm({current_password:'',new_password:'',confirm_password:''});
    }catch(e){toast.error(e.response?.data?.error||'Failed to change password');}
    setChangingPw(false);
  };

  return(<div>
    <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2"><Settings size={22} className="text-red-500"/>{t('admin.myProfile','My Profile')}</h1>
    <p className="text-sm text-gray-400 mb-6">{t('admin.updateLoginInfo','Update your login information')}</p>

    <div className="grid lg:grid-cols-2 gap-6">
      {/* Profile info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Name</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label><input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+213..."/></div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="mt-4 w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><Save size={14}/>{saving?'Saving...':'Save Profile'}</button>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Current Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})}/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">New Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})}/></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Confirm New Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})}/></div>
        </div>
        <button onClick={changePassword} disabled={changingPw} className="mt-4 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"><Shield size={14}/>{changingPw?'Changing...':'Change Password'}</button>
      </div>
    </div>
  </div>);
}

// ═══════ ADMIN MANAGEMENT ═══════
function AdminManagement(){
  const{user}=useAuthStore();
  const theme=usePlatformTheme();const isDark=theme.mode==='dark';
  const[admins,setAdmins]=useState([]);
  const[loading,setLoading]=useState(true);
  const[loadError,setLoadError]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({name:'',email:'',phone:'',password:''});
  const[saving,setSaving]=useState(false);

  const load=()=>{
    setLoading(true);setLoadError(null);
    platformApi.getAdmins()
      .then(r=>setAdmins(Array.isArray(r.data)?r.data:(r.data?.admins||[])))
      .catch(e=>{setLoadError(e?.response?.data?.error||e?.message||'Failed to load admins');})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const add=async()=>{
    if(!form.name||!form.email||!form.password)return toast.error('Name, email and password are required');
    setSaving(true);
    try{await platformApi.addAdmin(form);toast.success('Super admin added!');setShowAdd(false);setForm({name:'',email:'',phone:'',password:''});load();}catch(e){toast.error(e.response?.data?.error||'Failed');}
    setSaving(false);
  };

  const remove=async(id)=>{if(!confirm('Remove this admin? They will lose all super admin access.'))return;try{await platformApi.removeAdmin(id);toast.success('Removed');load();}catch(e){toast.error(e?.response?.data?.error||'Failed');}};
  const toggle=async(id)=>{try{await platformApi.toggleAdmin(id);load();}catch{toast.error('Failed');}};

  return(<div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${isDark?'text-gray-100':'text-gray-900'}`}><Shield size={22} className="text-red-500"/>Super Admins</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-1">Grant or revoke super admin access to trusted accounts</p>
      </div>
      <button onClick={()=>setShowAdd(true)} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 shrink-0"><Plus size={14}/>Add Admin</button>
    </div>

    {loading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin"/></div>:
    loadError?<div className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl p-12 shadow-sm text-center`}><AlertTriangle size={40} className="mx-auto text-amber-500 mb-3"/><p className={`${isDark?'text-gray-200':'text-gray-700'} font-bold mb-1`}>Couldn't load admins</p><p className="text-sm text-gray-400 mb-4">{loadError}</p><button onClick={load} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button></div>:
    admins.length===0?<div className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl p-16 shadow-sm text-center`}><Shield size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500">No other admins yet</p></div>:
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {admins.map(a=>(
        <div key={a.id} className={`${isDark?'bg-gray-800':'bg-white'} rounded-2xl p-6 shadow-sm relative ${!a.is_active?'opacity-50':''}`}>
          {a.id===user?.id&&<span className="absolute top-3 left-3 text-[9px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-600 rounded-full">You</span>}
          <div className="text-center mb-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-red-500">{(a.name||'?')[0].toUpperCase()}</span>
            </div>
            <h3 className={`font-bold ${isDark?'text-gray-100':'text-gray-900'}`}>{a.name}</h3>
            <p className="text-xs text-gray-400">{a.email}</p>
            {a.phone&&<p className="text-xs text-gray-400">{a.phone}</p>}
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <div className={`w-2 h-2 rounded-full ${a.is_active?'bg-emerald-500':'bg-gray-300'}`}/>
              <span className={`text-[10px] font-bold ${a.is_active?'text-emerald-600':'text-gray-400'}`}>{a.is_active?'Active':'Inactive'}</span>
            </div>
          </div>
          {a.id!==user?.id&&(
            <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
              <button onClick={()=>toggle(a.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${a.is_active?'bg-amber-50 text-amber-600 hover:bg-amber-100':'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>{a.is_active?'Deactivate':'Activate'}</button>
              <button onClick={()=>remove(a.id)} className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100">Remove</button>
            </div>
          )}
        </div>
      ))}
    </div>}

    {showAdd&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowAdd(false)}>
        <div className={`${isDark?'bg-gray-900 text-gray-100':'bg-white text-gray-900'} rounded-3xl p-8 w-full max-w-md shadow-2xl`} onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Add Super Admin</h2><button onClick={()=>setShowAdd(false)} className={`p-2 rounded-lg ${isDark?'hover:bg-gray-800':'hover:bg-gray-100'}`}><X size={18}/></button></div>
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={14}/>Super admins have full access to the entire platform including all stores, owners, and settings.</p>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Name *</label><input className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark?'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500':'bg-white border-gray-200 text-gray-900'}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email *</label><input type="email" className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark?'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500':'bg-white border-gray-200 text-gray-900'}`} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label><input className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark?'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500':'bg-white border-gray-200 text-gray-900'}`} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+213..."/></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Password *</label><input type="password" className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark?'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500':'bg-white border-gray-200 text-gray-900'}`} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>setShowAdd(false)} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${isDark?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
            <button onClick={add} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50">{saving?'Adding...':'Add Super Admin'}</button>
          </div>
        </div>
      </div>
    )}
  </div>);
}

// ═══════ MAIN LAYOUT ═══════
export default function PlatformAdminDashboard(){
  const {t}=useTranslation();
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const theme = usePlatformTheme();
  const isDark = theme.mode === 'dark';
  const pc = theme.primaryColor;
  useEffect(() => { theme.init(); }, []); // eslint-disable-line
  return(
    <div className={`flex min-h-screen ${isDark?'bg-gray-950':'bg-gray-50/80'}`}>
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} isDark={isDark} pc={pc} pl={generatePalette(pc)}/>
      <main className="flex-1 lg:ml-56 min-w-0">
        <header className={`sticky top-0 z-10 backdrop-blur-xl border-b px-3 md:px-8 py-3 flex items-center justify-between gap-2 ${isDark?'bg-gray-900/90 border-gray-800':'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={()=>setSidebarOpen(true)} className={`lg:hidden p-2 rounded-xl ${isDark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-600'}`}><Menu size={20}/></button>
            <span className={`text-sm font-bold truncate ${isDark?'text-gray-200':'text-gray-700'}`}><span className="hidden sm:inline">{t('admin.platformAdministration','Platform Administration')}</span><span className="sm:hidden">{t('admin.superAdmin','Super Admin')}</span></span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <NotificationsBell isDark={isDark} pc={pc}/>
            <ThemePanel compact mode={theme.mode} primaryColor={pc} onModeChange={theme.setMode} onColorChange={theme.setPrimaryColor}/>
            <LanguageSwitcher/>
            <span className="hidden md:flex px-3 py-1 rounded-full text-[10px] font-bold items-center gap-1" style={{backgroundColor:pc+'15',color:pc}}><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:pc}}/>{t('admin.superAdminBadge','SUPER ADMIN')}</span>
          </div>
        </header>
        <div className="p-3 sm:p-4 md:p-8">
          <Routes>
            <Route path="dashboard" element={<Overview/>}/>
            <Route path="store-owners" element={<StoreOwners/>}/>
            <Route path="stores" element={<AllStores/>}/>
            <Route path="orders" element={<AllOrders/>}/>
            <Route path="site-settings" element={<SiteSettings/>}/>
            <Route path="subscriptions" element={<Subscriptions isDark={isDark}/>}/>
            <Route path="plans" element={<PlansEditor/>}/>
            <Route path="role-templates" element={<RoleTemplatesEditor/>}/>
            <Route path="billing-config" element={<BillingConfig/>}/>
            <Route path="page-builder" element={<PageBuilder/>}/>
            <Route path="whatsapp" element={<AdminWhatsApp/>}/>
            <Route path="system" element={<SystemHealth/>}/>
            <Route path="profile" element={<MyProfile/>}/>
            <Route path="admins" element={<AdminManagement/>}/>
            <Route path="*" element={<Overview/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
}
