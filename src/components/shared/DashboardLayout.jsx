import React,{useState,useEffect,useRef} from'react';import{Link,useLocation,useNavigate}from'react-router-dom';import{useAuthStore,useStoreManagement,useLangStore}from'../../hooks/useStore';import{useTranslation}from'react-i18next';import LanguageSwitcher from'./LanguageSwitcher';import{LayoutDashboard,ShoppingCart,Package,Settings,Users,ChevronDown,ChevronLeft,Globe,Zap,LogOut,Search,Bell,Menu,X,Eye,Truck,BarChart3,DollarSign,CreditCard,GripVertical,Percent,LayoutTemplate}from'lucide-react';

function NotifBell(){
  const[open,setOpen]=React.useState(false);
  const[notifs,setNotifs]=React.useState([]);
  const[unread,setUnread]=React.useState(0);
  const[pushOk,setPushOk]=React.useState(false);
  const{currentStore}=useStoreManagement();

  const enablePush=async()=>{
    try{
      if(!('serviceWorker' in navigator)||!('PushManager' in window)){alert('Push notifications not supported on this browser');return;}
      const perm=await Notification.requestPermission();
      if(perm!=='granted'){alert('Notifications blocked. Go to browser Settings → Site Settings → Notifications → Allow');return;}
      const reg=await navigator.serviceWorker.register('/sw-notif.js');
      await navigator.serviceWorker.ready;
      const{ownerApi}=await import('../../utils/api');
      const{data}=await ownerApi.getVapidKey();
      if(!data.publicKey){alert('Push not configured on server');return;}
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        const raw=atob(data.publicKey.replace(/-/g,'+').replace(/_/g,'/'));
        const key=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)key[i]=raw.charCodeAt(i);
        sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
      }
      await ownerApi.subscribePush({subscription:sub.toJSON(),storeId:currentStore.id});
      setPushOk(true);
      alert('Push notifications enabled! You will receive alerts for new orders.');
    }catch(e){alert('Push setup failed: '+e.message);}
  };

  // Check if already subscribed
  React.useEffect(()=>{
    if('serviceWorker' in navigator&&'PushManager' in window){
      navigator.serviceWorker.ready.then(reg=>reg.pushManager.getSubscription()).then(sub=>{if(sub)setPushOk(true);}).catch(()=>{});
    }
  },[]);

  const load=React.useCallback(()=>{
    if(!currentStore?.id)return;
    import('../../utils/api').then(({ownerApi})=>{
      ownerApi.getNotifications(currentStore.id).then(r=>{
        setNotifs(r.data.notifications||[]);
        setUnread(r.data.unread||0);
      }).catch(()=>{});
    });
  },[currentStore?.id]);
  
  React.useEffect(()=>{load();const i=setInterval(load,15000);return()=>clearInterval(i);},[load]);
  
  const markRead=async(nid)=>{
    try{const{ownerApi}=await import('../../utils/api');await ownerApi.markNotifRead(currentStore.id,nid);load();}catch{}
  };
  const markAll=async()=>{
    try{const{ownerApi}=await import('../../utils/api');await ownerApi.markAllRead(currentStore.id);load();}catch{}
  };
  
  const timeAgo=(d)=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'Just now';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';};
  const typeIcon={order:'🛒',stock:'📦',info:'ℹ️',customer:'👤'};
  
  return(<div className="relative flex items-center gap-1">
    {!pushOk&&<button onClick={enablePush} className="px-2 py-1 bg-brand-500 text-white text-[10px] font-bold rounded-lg animate-pulse hover:bg-brand-600">🔔 Enable</button>}
    <button onClick={()=>{if(!open){load();if(unread>0&&currentStore?.id){import('../../utils/api').then(({ownerApi})=>{ownerApi.markAllRead(currentStore.id).then(()=>{setUnread(0);setNotifs(prev=>prev.map(n=>({...n,is_read:true})));}).catch(()=>{});});}}setOpen(!open);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"><Bell size={18}/>{unread>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{unread>9?'9+':unread}</span>}</button>
    {open&&<div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-sm">Notifications</h3>{unread>0&&<button onClick={markAll} className="text-xs text-brand-500 cursor-pointer hover:underline">Mark all read</button>}</div>
      <div className="max-h-72 overflow-y-auto">{notifs.length===0?<p className="p-6 text-center text-gray-400 text-sm">No notifications yet</p>:notifs.slice(0,20).map(n=>(
        <div key={n.id} onClick={()=>{if(!n.is_read)markRead(n.id);}} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.is_read?'bg-brand-50/30':''}`}>
          <div className="flex items-start gap-2"><span className="text-sm mt-0.5">{typeIcon[n.type]||'📌'}</span><div className="flex-1 min-w-0"><p className="text-sm text-gray-800 font-medium truncate">{n.title}</p>{n.message&&<p className="text-xs text-gray-400 truncate">{n.message}</p>}<p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(n.created_at)}</p></div>{!n.is_read&&<span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0"/>}</div>
        </div>
      ))}</div>
      <button onClick={()=>setOpen(false)} className="w-full p-3 text-center text-xs text-gray-400 hover:bg-gray-50 border-t">Close</button>
    </div>}
  </div>);
}

// Default sidebar order
const DEFAULT_ITEMS = [
  {id:'dashboard',type:'link',to:'/dashboard',icon:'LayoutDashboard',label:'sidebar.dashboard'},
  {id:'apps',type:'link',to:'/dashboard/apps',icon:'Zap',label:'sidebar.apps'},
  {id:'page-builder',type:'link',to:'/dashboard/page-builder',icon:'LayoutTemplate',label:'sidebar.pageBuilder'},
  {id:'orders',type:'group',icon:'ShoppingCart',label:'sidebar.orders',children:[
    {to:'/dashboard/orders',label:'sidebar.ordersList'},{to:'/dashboard/abandoned',label:'sidebar.abandonedOrders'},{to:'/dashboard/preparing',label:'sidebar.preparing'}]},
  {id:'products',type:'group',icon:'Package',label:'sidebar.products',children:[
    {to:'/dashboard/products',label:'sidebar.productsList'},{to:'/dashboard/stock',label:'sidebar.stockManager'},{to:'/dashboard/smart-reviews',label:'sidebar.smartReviews'},{to:'/dashboard/ai-intelligence',label:'sidebar.aiIntelligence'}]},
  {id:'store',type:'group',icon:'Globe',label:'sidebar.store',children:[
    {to:'/dashboard/settings',label:'sidebar.allSettings'},{to:'/dashboard/contact',label:'sidebar.contactInfo'},{to:'/dashboard/faqs',label:'sidebar.faqs'},{to:'/dashboard/about',label:'sidebar.about'}]},
  {id:'delivery',type:'group',icon:'Truck',label:'sidebar.delivery',children:[
    {to:'/dashboard/shipping-partners',label:'sidebar.shippingPartners'},{to:'/dashboard/shipping-wilayas',label:'sidebar.shippingWilayas'},{to:'/dashboard/how-to-connect',label:'sidebar.howToConnect'}]},
  {id:'customers',type:'group',icon:'Users',label:'sidebar.customers',children:[
    {to:'/dashboard/customers',label:'sidebar.customersList'},{to:'/dashboard/blacklist',label:'sidebar.blacklist'}]},
  {id:'analytics',type:'link',to:'/dashboard/analytics',icon:'BarChart3',label:'sidebar.analytics'},
  {id:'costs',type:'link',to:'/dashboard/costs',icon:'DollarSign',label:'sidebar.costs'},
  {id:'taxes',type:'link',to:'/dashboard/taxes',icon:'Percent',label:'sidebar.taxes'},
  {id:'billing',type:'link',to:'/dashboard/billing',icon:'CreditCard',label:'sidebar.billing'},
];

const ICONS = {LayoutDashboard,ShoppingCart,Package,Globe,Zap,Truck,Users,BarChart3,DollarSign,CreditCard,Settings,Percent,LayoutTemplate};

export default function DashboardLayout({children}){
  const{t}=useTranslation();const location=useLocation();const navigate=useNavigate();
  const{user,logout}=useAuthStore();const{currentStore}=useStoreManagement();
  const[sidebarOpen,setSidebarOpen]=useState(()=>typeof window!=='undefined'?window.innerWidth>=1024:true);
  const[openMenus,setOpenMenus]=useState({});

  // Draggable sidebar order
  const[items,setItems]=useState(()=>{
    try{const saved=localStorage.getItem('sidebar_order');if(saved){const ids=JSON.parse(saved);const mapped=ids.map(id=>DEFAULT_ITEMS.find(i=>i.id===id)).filter(Boolean);const missing=DEFAULT_ITEMS.filter(d=>!ids.includes(d.id));return[...mapped,...missing];}}catch{}
    return DEFAULT_ITEMS;
  });
  const[dragIdx,setDragIdx]=useState(null);
  const[overIdx,setOverIdx]=useState(null);

  const saveOrder=(newItems)=>{setItems(newItems);localStorage.setItem('sidebar_order',JSON.stringify(newItems.map(i=>i.id)));};

  const handleDragStart=(e,idx)=>{setDragIdx(idx);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',idx);};
  const handleDragOver=(e,idx)=>{e.preventDefault();e.dataTransfer.dropEffect='move';setOverIdx(idx);};
  const handleDrop=(e,idx)=>{e.preventDefault();if(dragIdx===null||dragIdx===idx)return;const newItems=[...items];const[moved]=newItems.splice(dragIdx,1);newItems.splice(idx,0,moved);saveOrder(newItems);setDragIdx(null);setOverIdx(null);};
  const handleDragEnd=()=>{setDragIdx(null);setOverIdx(null);};

  const toggle=(k)=>setOpenMenus({...openMenus,[k]:!openMenus[k]});
  const isActive=(p)=>location.pathname===p;

  const SLink=({to,icon:Icon,label})=>(<Link to={to} className={isActive(to)?'sidebar-link-active':'sidebar-link'}><Icon size={18}/>{sidebarOpen&&<span>{label}</span>}</Link>);
  const SubLink=({to,label})=>{const lbl=typeof label==='string'&&label.startsWith('sidebar.')?t(label):label;return(<Link to={to} className={`pl-12 py-1.5 block text-sm ${isActive(to)?'text-brand-600 font-semibold':'text-gray-400 hover:text-gray-600'}`}>{lbl}</Link>);};

  const renderItem=(item,idx)=>{
    const Icon=ICONS[item.icon]||Settings;
    const lbl=typeof item.label==='string'&&item.label.startsWith('sidebar.')?t(item.label):item.label;
    const isDragging=dragIdx===idx;
    const isOver=overIdx===idx&&dragIdx!==idx;

    return(
      <div key={item.id}
        draggable={sidebarOpen}
        onDragStart={e=>handleDragStart(e,idx)}
        onDragOver={e=>handleDragOver(e,idx)}
        onDrop={e=>handleDrop(e,idx)}
        onDragEnd={handleDragEnd}
        className={`transition-all ${isDragging?'opacity-30':'opacity-100'} ${isOver?'border-t-2 border-brand-400':''}`}
        style={{cursor:sidebarOpen?'grab':'default'}}
      >
        {item.type==='link'?(
          <div className="flex items-center group">
            {sidebarOpen&&<div className="opacity-0 group-hover:opacity-40 px-0.5"><GripVertical size={12} className="text-gray-400"/></div>}
            <div className="flex-1"><SLink to={item.to} icon={Icon} label={lbl}/></div>
          </div>
        ):(
          <div className="group">
            <div className="flex items-center">
              {sidebarOpen&&<div className="opacity-0 group-hover:opacity-40 px-0.5"><GripVertical size={12} className="text-gray-400"/></div>}
              <button onClick={()=>toggle(item.id)} className="sidebar-link w-full justify-between flex-1">
                <div className="flex items-center gap-3"><Icon size={18}/>{sidebarOpen&&<span>{lbl}</span>}</div>
                {sidebarOpen&&<ChevronDown size={14} className={`transition-transform ${openMenus[item.id]?'rotate-180':''}`}/>}
              </button>
            </div>
            {openMenus[item.id]&&sidebarOpen&&<div className="pb-1">{item.children.map(c=><SubLink key={c.to} to={c.to} label={c.label}/>)}</div>}
          </div>
        )}
      </div>
    );
  };

  // Mobile detection
  const[isMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<1024);

  return(<div className="flex min-h-screen bg-gray-50/50">
    {/* Mobile overlay */}
    {sidebarOpen&&isMobile&&<div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
    <aside className={`bg-white border-r border-gray-100 flex flex-col fixed h-screen z-40 transition-all duration-300 ${isMobile?(sidebarOpen?'w-56 translate-x-0':'-translate-x-full w-56'):(sidebarOpen?'w-56':'w-16')}`}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">{currentStore?.logo?<img src={currentStore.logo} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs">{(currentStore?.name||'K')[0]}</div>}{sidebarOpen&&<div><p className="font-bold text-sm text-gray-800 truncate">{currentStore?.name||'MyMarket'}</p><p className="text-[10px] text-gray-400">{t('sidebar.storeDashboard','STORE DASHBOARD')}</p></div>}</div>
        {isMobile&&<button onClick={()=>setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 lg:hidden"><X size={18}/></button>}
      </div>
      {sidebarOpen&&<div className="px-3 pt-3"><input className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-100 focus:outline-none" placeholder={t('common.search','Search...')}/></div>}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto text-sm">
        {sidebarOpen&&<p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('sidebar.mainMenu','Main Menu')}</p>}
        {items.map((item,idx)=>renderItem(item,idx))}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 bg-brand-50 rounded-xl p-2.5 mb-2"><div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]||'U'}</div>{sidebarOpen&&<div><p className="text-xs font-bold text-gray-800">{user?.name||'User'}</p><p className="text-[10px] text-gray-400">{t('sidebar.adminRole','Admin')}</p></div>}</div>
        {!isMobile&&<button onClick={()=>setSidebarOpen(!sidebarOpen)} className="sidebar-link w-full"><ChevronLeft size={18} className={`transition-transform ${sidebarOpen?'':'rotate-180'}`}/>{sidebarOpen&&<span>{t('sidebar.collapse','Collapse')}</span>}</button>}
        <button onClick={()=>{logout();navigate('/login');}} className="sidebar-link w-full text-red-500"><LogOut size={18}/>{sidebarOpen&&<span>{t('sidebar.disconnect','Disconnect')}</span>}</button>
      </div>
    </aside>
    <main className={`flex-1 transition-all duration-300 ${isMobile?'ml-0':(sidebarOpen?'ml-56':'ml-16')}`}>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile&&<button onClick={()=>setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl lg:hidden"><Menu size={20} className="text-gray-600"/></button>}
          <div className="hidden md:flex items-center gap-3"><div className="w-8 h-8 rounded-lg overflow-hidden">{currentStore?.logo&&<img src={currentStore.logo} className="w-full h-full object-cover"/>}</div><div><p className="text-[10px] text-gray-400">{t('sidebar.storeDashboard','STORE DASHBOARD')}</p><p className="font-bold text-sm">{location.pathname.split('/').pop()?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||t('sidebar.dashboard','Dashboard')}</p></div></div>
          <p className="md:hidden font-bold text-sm text-gray-800">{location.pathname.split('/').pop()?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||t('sidebar.dashboard','Dashboard')}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative hidden md:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm w-64 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder={t('sidebar.searchEverything','Search everything...')}/></div>
          {currentStore?.is_live!==false&&<span className="badge badge-success text-[10px] hidden sm:flex items-center gap-1">● {t('sidebar.live','Live')}</span>}
          <Link to={`/s/${currentStore?.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={18}/></Link>
          <NotifBell/>
          <div className="hidden md:block"><LanguageSwitcher compact/></div>
          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5"><span className="text-sm font-bold text-gray-700">{t('sidebar.adminRole','Admin')}</span><div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]||'A'}</div></div>
        </div>
      </header>
      <div className="p-4 md:p-6">{children}</div>
    </main>
  </div>);
}
