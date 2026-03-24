import React,{useState,useEffect} from'react';import{Link,useLocation,useNavigate}from'react-router-dom';import{useAuthStore,useStoreManagement,useLangStore}from'../../hooks/useStore';import{useTranslation}from'react-i18next';import LanguageSwitcher from'./LanguageSwitcher';import{LayoutDashboard,ShoppingCart,Package,Settings,Users,ChevronDown,ChevronLeft,Globe,Zap,LogOut,Search,Bell,Menu,X,Eye,Truck,BarChart3,DollarSign,CreditCard,FileText,Phone,HelpCircle,Info,Layout,Layers,Link as LinkIcon,Bot,UserX}from'lucide-react';

function NotifBell(){const[open,setOpen]=React.useState(false);const[notifs]=React.useState([{id:1,text:"Welcome to KyoMarket!",time:"Just now",read:false},{id:2,text:"Your store is live and ready.",time:"1h ago",read:true}]);return(<div className="relative"><button onClick={()=>setOpen(!open)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"><Bell size={18}/>{notifs.filter(n=>!n.read).length>0&&<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>}</button>{open&&<div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"><div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-sm">Notifications</h3><span className="text-xs text-brand-500 cursor-pointer">Mark all read</span></div><div className="max-h-64 overflow-y-auto">{notifs.map(n=>(<div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${!n.read?"bg-brand-50/30":""}`}><p className="text-sm text-gray-800">{n.text}</p><p className="text-xs text-gray-400 mt-1">{n.time}</p></div>))}</div><button onClick={()=>setOpen(false)} className="w-full p-3 text-center text-xs text-brand-500 font-medium hover:bg-gray-50">View All</button></div>}</div>);}
export default function DashboardLayout({children}){const{t}=useTranslation();const location=useLocation();const navigate=useNavigate();const{user,logout}=useAuthStore();const{currentStore}=useStoreManagement();const[sidebarOpen,setSidebarOpen]=useState(true);const[openMenus,setOpenMenus]=useState({orders:false,store:false,products:false,delivery:false,customers:false});
const toggle=(k)=>setOpenMenus({...openMenus,[k]:!openMenus[k]});
const isActive=(p)=>location.pathname===p;
const SLink=({to,icon:Icon,label})=>(<Link to={to} className={isActive(to)?'sidebar-link-active':'sidebar-link'}><Icon size={18}/>{sidebarOpen&&<span>{label}</span>}</Link>);
const SubLink=({to,label})=>(<Link to={to} className={`pl-12 py-1.5 block text-sm ${isActive(to)?'text-brand-600 font-semibold':'text-gray-400 hover:text-gray-600'}`}>{label}</Link>);
const MenuGroup=({id,icon:Icon,label,children:ch})=>(<div><button onClick={()=>toggle(id)} className="sidebar-link w-full justify-between"><div className="flex items-center gap-3"><Icon size={18}/>{sidebarOpen&&<span>{label}</span>}</div>{sidebarOpen&&<ChevronDown size={14} className={`transition-transform ${openMenus[id]?'rotate-180':''}`}/>}</button>{openMenus[id]&&sidebarOpen&&<div className="pb-1">{ch}</div>}</div>);
return(<div className="flex min-h-screen bg-gray-50/50">
<aside className={`${sidebarOpen?'w-56':'w-16'} bg-white border-r border-gray-100 flex flex-col fixed h-screen z-20 transition-all duration-300`}>
<div className="p-4 border-b border-gray-100 flex items-center gap-2">{currentStore?.logo?<img src={currentStore.logo} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs">{(currentStore?.name||'K')[0]}</div>}{sidebarOpen&&<div><p className="font-bold text-sm text-gray-800 truncate">{currentStore?.name||'MyMarket'}</p><p className="text-[10px] text-gray-400">STORE DASHBOARD</p></div>}</div>
{sidebarOpen&&<div className="px-3 pt-3"><input className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none" placeholder="Search..."/></div>}
<nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto text-sm">
{sidebarOpen&&<p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</p>}
<SLink to="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')}/>
<SLink to="/dashboard/apps" icon={Zap} label={t('sidebar.apps')}/>
<MenuGroup id="orders" icon={ShoppingCart} label={t('sidebar.orders')}>
<SubLink to="/dashboard/orders" label="Orders"/><SubLink to="/dashboard/abandoned" label="Abandoned Orders"/><SubLink to="/dashboard/preparing" label="Preparing"/></MenuGroup>
<MenuGroup id="products" icon={Package} label={t('sidebar.products')}>
<SubLink to="/dashboard/products" label="Products"/><SubLink to="/dashboard/stock" label="Stock Manager"/><SubLink to="/dashboard/landing-pages" label="Landing Pages"/><SubLink to="/dashboard/ai-intelligence" label="AI Intelligence"/></MenuGroup>
<MenuGroup id="store" icon={Globe} label="Store & Settings">
<SubLink to="/dashboard/settings" label="All Settings"/><SubLink to="/dashboard/homepage" label="Home Page"/><SubLink to="/dashboard/contact" label="Contact Info"/><SubLink to="/dashboard/faqs" label="FAQs"/><SubLink to="/dashboard/about" label="About Us"/><SubLink to="/dashboard/order-tracking" label="Order Tracking"/><SubLink to="/dashboard/domains" label="Domains"/></MenuGroup>
<MenuGroup id="delivery" icon={Truck} label="Delivery Companies">
<SubLink to="/dashboard/shipping-partners" label="Shipping Partners"/><SubLink to="/dashboard/shipping-wilayas" label="Shipping Wilayas"/><SubLink to="/dashboard/how-to-connect" label="How to Connect"/></MenuGroup>
<MenuGroup id="customers" icon={Users} label={t('sidebar.customers')}>
<SubLink to="/dashboard/customers" label="Customers"/><SubLink to="/dashboard/blacklist" label="Automatic Blacklist"/></MenuGroup>
<SLink to="/dashboard/analytics" icon={BarChart3} label="Analytics"/>
<SLink to="/dashboard/costs" icon={DollarSign} label="Costs"/>
<SLink to="/dashboard/billing" icon={CreditCard} label="Billing & Plans"/>
</nav>
<div className="border-t border-gray-100 p-3">
<div className="flex items-center gap-2 bg-brand-50 rounded-xl p-2.5 mb-2"><div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]||'U'}</div>{sidebarOpen&&<div><p className="text-xs font-bold text-gray-800">{user?.name||'User'}</p><p className="text-[10px] text-gray-400">Admin</p></div>}</div>
<SLink to="/dashboard/settings" icon={Settings} label="Settings"/>
<button onClick={()=>setSidebarOpen(!sidebarOpen)} className="sidebar-link w-full"><ChevronLeft size={18} className={`transition-transform ${sidebarOpen?'':'rotate-180'}`}/>{sidebarOpen&&<span>Collapse</span>}</button>
<button onClick={()=>{logout();navigate('/login');}} className="sidebar-link w-full text-red-500"><LogOut size={18}/>{sidebarOpen&&<span>Disconnect</span>}</button>
</div></aside>
<main className={`flex-1 ${sidebarOpen?'ml-56':'ml-16'} transition-all duration-300`}>
<header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between">
<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg overflow-hidden">{currentStore?.logo&&<img src={currentStore.logo} className="w-full h-full object-cover"/>}</div><div><p className="text-[10px] text-gray-400">STORE DASHBOARD</p><p className="font-bold text-sm">{location.pathname.split('/').pop()?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||'Dashboard'}</p></div></div>
<div className="flex items-center gap-3">
<div className="relative hidden md:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm w-64 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Search everything..."/></div>
{currentStore?.is_live!==false&&<span className="badge badge-success text-[10px] flex items-center gap-1">● 1 Live</span>}
<Link to={`/s/${currentStore?.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={18}/></Link>
<NotifBell/>
<LanguageSwitcher compact/>
<div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5"><span className="text-sm font-bold text-gray-700">Admin</span><div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]||'A'}</div></div>
</div></header>
<div className="p-6">{children}</div>
</main></div>);}
