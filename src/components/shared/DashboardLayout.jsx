import React,{useState,useEffect,useRef} from'react';import{createPortal}from'react-dom';import{Link,useLocation,useNavigate}from'react-router-dom';import{useAuthStore,useStoreManagement,useLangStore,useAdminTheme}from'../../hooks/useStore';import{useTranslation}from'react-i18next';import LanguageSwitcher from'./LanguageSwitcher';import ThemePanel from'./ThemePanel';import usePlanFeatures from'../../hooks/usePlanFeatures';import{LayoutDashboard,ShoppingCart,Package,Settings,Users,ChevronDown,ChevronLeft,Globe,Zap,LogOut,Search,Bell,Menu,X,Eye,Truck,BarChart3,DollarSign,CreditCard,GripVertical,Percent,LayoutTemplate,Lock,Target,Check,Plus}from'lucide-react';

// Map sidebar item IDs to the feature_key that gates them. If a plan doesn't
// include the key the sidebar item renders with a lock icon + muted styling,
// and clicking it toasts a "locked" message instead of navigating.
const FEATURE_GATE_MAP = {
  'page-builder': 'page_builder',
  'ai-intelligence': 'ai_chatbot',
  'smart-reviews': 'ai_moderation',
  'abandoned': 'abandoned_cart',
};

// Maps sidebar routes to the staff permission required to use them.
// Used to hide/disable items for team members based on the permissions their
// store admin granted them. Owners (is_staff=false) bypass this entirely.
const PERM_GATE_MAP = {
  '/dashboard': 'dashboard_view',
  '/dashboard/analytics': 'analytics_view',
  '/dashboard/orders': 'orders_view',
  '/dashboard/abandoned': 'orders_view',
  '/dashboard/preparing': 'orders_prepare',
  '/dashboard/orders-archive': 'orders_view',
  '/dashboard/products': 'products_view',
  '/dashboard/stock': 'stock_manage',
  '/dashboard/smart-reviews': 'reviews_manage',
  '/dashboard/ai-intelligence': 'analytics_view',
  '/dashboard/settings': 'settings_view',
  '/dashboard/contact': 'settings_view',
  '/dashboard/faqs': 'settings_edit',
  '/dashboard/about': 'settings_edit',
  '/dashboard/shipping-partners': 'shipping_manage',
  '/dashboard/shipping-wilayas': 'shipping_manage',
  '/dashboard/how-to-connect': 'shipping_manage',
  '/dashboard/tracking-orders': 'orders_view',
  '/dashboard/customers': 'customers_view',
  '/dashboard/blacklist': 'customers_blacklist',
  '/dashboard/auto-blacklist': 'customers_blacklist',
  '/dashboard/costs': 'finances_view',
  '/dashboard/taxes': 'taxes_view',
  '/dashboard/billing': 'settings_edit',
  '/dashboard/apps': 'settings_view',
  '/dashboard/staff': 'staff_manage',
  '/dashboard/domains': 'domains_manage',
};

// LiveBadge — shows the live "● Live" pill plus a count of buyers currently
// browsing the store (polled every 15s from /store/:slug/live-visitors which
// counts heartbeats from the storefront within the last 60 seconds).
function LiveBadge({storeId}){
  const {t} = useTranslation();
  const [count, setCount] = React.useState(null);
  React.useEffect(()=>{
    if(!storeId)return;
    let mounted = true;
    const tick = async () => {
      try{
        const mod=await import('../../utils/api');
        const api=mod.default;
        const{data}=await api.get(`/store/by-id/${storeId}/live-visitors`);
        if(mounted)setCount(data?.count ?? 0);
      }catch{ if(mounted) setCount(null); }
    };
    tick();
    const id = setInterval(tick, 15000);
    return ()=>{ mounted = false; clearInterval(id); };
  },[storeId]);
  return (
    <span className="badge badge-success text-[10px] flex items-center gap-1.5" title={count!=null?`${count} buyer${count===1?'':'s'} browsing now`:''}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"/>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
      </span>
      {t('sidebar.live','Live')}
      {count!=null&&count>0&&<span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/30 text-[9px] font-extrabold">{count}</span>}
      {count===0&&<span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold">0</span>}
    </span>
  );
}

// HeaderStoreSwitcher — anchored dropdown that opens directly under the
// "storeq ▼" pill in the header. Portal-rendered so the blurred header
// doesn't trap it inside its containing block.
function HeaderStoreSwitcher({ open, setOpen, stores, currentStore, setCurrentStore, user, navigate, isDark, pc, t }) {
  const btnRef = React.useRef(null);
  const [anchor, setAnchor] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect(); if (!r) return;
      const width = Math.min(288, window.innerWidth - 16);
      // Pin the dropdown's LEFT edge to the button's left edge so it appears
      // directly under it (not floating to the right of the page).
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
      setAnchor({ top: r.bottom + 6, left, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);

  const pickStore = (st) => {
    setOpen(false);
    if (currentStore?.id === st.id) return;
    // Clear cached store data so the next page doesn't render with stale data.
    try { localStorage.removeItem('storeCache_' + (currentStore?.slug || '')); } catch {}
    try { localStorage.setItem('selected_store_id', st.id); } catch {}
    setCurrentStore(st);
    // Force a full reload so every page (orders, products, settings, etc.)
    // refetches with the newly selected store.
    setTimeout(() => { window.location.href = '/dashboard'; }, 50);
  };

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(!open)} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all max-w-[120px] sm:max-w-[180px] ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
        <Globe size={13} style={{ color: pc }} />
        <span className="truncate">{currentStore?.name || t('sidebar.selectStore', 'Stores')}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && anchor && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className={`fixed rounded-2xl shadow-2xl border z-[101] p-2 max-h-[70vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
            style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{t('sidebar.yourStores', 'Your Stores')}</p>
            {(stores || []).map(st => {
              const sel = currentStore?.id === st.id;
              return (
                <button key={st.id} type="button" onClick={() => pickStore(st)} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-left transition-colors ${sel ? (isDark ? 'bg-gray-800' : 'bg-brand-50') : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}`}>
                  {st.logo ? <img src={st.logo} className="w-7 h-7 rounded-full object-cover shrink-0" /> : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: pc }}>{(st.name || 'S')[0]}</div>}
                  <div className="flex-1 min-w-0"><p className={`font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{st.name}</p><p className="text-[10px] text-gray-400 truncate">/{st.slug}</p></div>
                  {sel && <Check size={12} style={{ color: pc }} />}
                </button>
              );
            })}
            {!user?.is_staff && (
              <button type="button" onClick={() => { setOpen(false); navigate('/dashboard?new_store=1'); }} className={`w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-lg text-xs border-t font-bold ${isDark ? 'border-gray-700 text-brand-400 hover:bg-gray-800' : 'border-gray-100 text-brand-600 hover:bg-brand-50'}`}>
                <Plus size={12} />{t('sidebar.createAnotherStore', 'Create another store')}
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function NotifBell(){
  const[open,setOpen]=React.useState(false);
  const[notifs,setNotifs]=React.useState([]);
  const[unread,setUnread]=React.useState(0);
  const[pushOk,setPushOk]=React.useState(false);
  const{currentStore}=useStoreManagement();
  const navigate=useNavigate();
  const wrapRef=React.useRef(null);
  const btnRef=React.useRef(null);
  // Track the bell-button's bounding rect so the portal-rendered popover
  // can position itself relative to the viewport (not its detached parent).
  const[anchor,setAnchor]=React.useState(null);
  React.useLayoutEffect(()=>{
    if(!open||!btnRef.current)return;
    const update=()=>{
      const r=btnRef.current?.getBoundingClientRect();if(!r)return;
      const isMobile=window.innerWidth<640;
      // On mobile, anchor to the LEFT side so the popover doesn't overflow viewport
      if(isMobile)setAnchor({top:r.bottom+8,left:8,right:null});
      else setAnchor({top:r.bottom+8,right:Math.max(8,window.innerWidth-r.right),left:null});
    };
    update();
    window.addEventListener('resize',update);window.addEventListener('scroll',update,true);
    return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
  },[open]);
  // Map a notification to its destination + highlight target id
  const routeFor=(n)=>{
    const t=n.type,r=n.ref_id||n.order_id||n.product_id||n.customer_id;
    if(t==='order')return r?`/dashboard/orders?highlight=${r}`:'/dashboard/orders';
    if(t==='stock')return r?`/dashboard/stock?highlight=${r}`:'/dashboard/stock';
    if(t==='customer')return r?`/dashboard/customers?highlight=${r}`:'/dashboard/customers';
    return n.url||'/dashboard';
  };
  const openNotif=(n)=>{if(!n.is_read)markRead(n.id);setOpen(false);navigate(routeFor(n));};

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
  const[selected,setSelected]=React.useState(new Set());
  const[selectMode,setSelectMode]=React.useState(false);
  const toggleSelected=(id)=>setSelected(p=>{const n=new Set(p);if(n.has(id))n.delete(id);else n.add(id);return n;});
  const removeOne=async(id)=>{
    try{const{ownerApi}=await import('../../utils/api');
      if(ownerApi.deleteNotification){await ownerApi.deleteNotification(currentStore.id,id);}
      else{// optimistic local-only fallback if backend route is missing
        setNotifs(prev=>prev.filter(n=>n.id!==id));return;}
      load();
    }catch{setNotifs(prev=>prev.filter(n=>n.id!==id));}
  };
  const removeSelected=async()=>{
    if(!selected.size)return;
    if(!confirm(t('notifications.deleteSelected','Delete {{count}} notification(s)?',{count:selected.size})))return;
    for(const id of Array.from(selected))await removeOne(id);
    setSelected(new Set());setSelectMode(false);
  };
  const removeAll=async()=>{
    if(!notifs.length)return;
    if(!confirm(t('notifications.deleteAll','Delete all notifications?')))return;
    for(const n of notifs)await removeOne(n.id);
  };

  return(<div ref={wrapRef} className="relative flex items-center gap-1">
    {!pushOk&&<button onClick={enablePush} className="px-2 py-1 text-white text-[10px] font-bold rounded-lg animate-pulse" style={{backgroundColor:useAdminTheme.getState().primaryColor}}>🔔 Enable</button>}
    <button ref={btnRef} onClick={()=>{if(!open){load();if(unread>0&&currentStore?.id){import('../../utils/api').then(({ownerApi})=>{ownerApi.markAllRead(currentStore.id).then(()=>{setUnread(0);setNotifs(prev=>prev.map(n=>({...n,is_read:true})));}).catch(()=>{});});}}setOpen(!open);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"><Bell size={18}/>{unread>0&&<span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none" style={{width:20,height:20,minWidth:20,minHeight:20}}>{unread>9?'9+':unread}</span>}</button>
    {open&&anchor&&createPortal(<>
      <div className="fixed inset-0 z-[100]" onClick={()=>setOpen(false)}/>
      <div className="fixed w-[min(92vw,22rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[101] overflow-hidden" style={{top:anchor.top,...(anchor.left!=null?{left:anchor.left}:{right:anchor.right})}}>
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <h3 className="font-bold text-sm flex-1">Notifications</h3>
          {selectMode?(<>
            <button onClick={()=>{setSelected(new Set(notifs.map(n=>n.id)));}} className="text-[11px] text-gray-500 hover:underline">All</button>
            <button onClick={removeSelected} disabled={!selected.size} className="text-[11px] font-bold text-red-500 disabled:text-gray-300 hover:underline">Delete{selected.size?` (${selected.size})`:''}</button>
            <button onClick={()=>{setSelectMode(false);setSelected(new Set());}} className="text-[11px] text-gray-500 hover:underline">Cancel</button>
          </>):(<>
            {notifs.length>0&&<button onClick={()=>setSelectMode(true)} className="text-[11px] text-gray-500 hover:underline">Select</button>}
            {unread>0&&<button onClick={markAll} className="text-[11px] text-brand-500 hover:underline">Mark read</button>}
            {notifs.length>0&&<button onClick={removeAll} className="text-[11px] text-red-500 hover:underline">Clear</button>}
          </>)}
        </div>
        <div className="max-h-80 overflow-y-auto">{notifs.length===0?<p className="p-6 text-center text-gray-400 text-sm">No notifications yet</p>:notifs.slice(0,30).map(n=>(
          <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex items-start gap-2 ${!n.is_read?'bg-brand-50/30':''}`} onClick={()=>{if(selectMode){toggleSelected(n.id);return;}openNotif(n);}}>
            {selectMode && <input type="checkbox" checked={selected.has(n.id)} onChange={()=>toggleSelected(n.id)} onClick={e=>e.stopPropagation()} className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-500"/>}
            <span className="text-sm mt-0.5">{typeIcon[n.type]||'📌'}</span>
            <div className="flex-1 min-w-0"><p className="text-sm text-gray-800 font-medium truncate">{n.title}</p>{n.message&&<p className="text-xs text-gray-400 truncate">{n.message}</p>}<p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(n.created_at)}</p></div>
            {!n.is_read&&<span className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0"/>}
            {!selectMode && <button onClick={(e)=>{e.stopPropagation();removeOne(n.id);}} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 shrink-0" title="Remove"><X size={14}/></button>}
          </div>
        ))}</div>
        <button onClick={()=>setOpen(false)} className="w-full p-3 text-center text-xs text-gray-400 hover:bg-gray-50 border-t">Close</button>
      </div>
    </>,document.body)}
  </div>);
}

// Default sidebar order
const DEFAULT_ITEMS = [
  {id:'dashboard',type:'link',to:'/dashboard',icon:'LayoutDashboard',label:'sidebar.dashboard'},
  {id:'apps',type:'link',to:'/dashboard/apps',icon:'Zap',label:'sidebar.apps'},
  {id:'orders',type:'group',icon:'ShoppingCart',label:'sidebar.orders',children:[
    {to:'/dashboard/orders',label:'sidebar.ordersList'},{to:'/dashboard/abandoned',label:'sidebar.abandonedOrders'},{to:'/dashboard/preparing',label:'sidebar.preparing'},{to:'/dashboard/orders-archive',label:'sidebar.ordersArchive'}]},
  {id:'products',type:'group',icon:'Package',label:'sidebar.products',children:[
    {to:'/dashboard/products',label:'sidebar.productsList'},{to:'/dashboard/stock',label:'sidebar.stockManager'},{to:'/dashboard/offers',label:'sidebar.offers'},{to:'/dashboard/landing-pages',label:'sidebar.landingPages'},{to:'/dashboard/smart-reviews',label:'sidebar.smartReviews'}]},
  {id:'store',type:'group',icon:'Globe',label:'sidebar.store',children:[
    {to:'/dashboard/contact',label:'sidebar.contactInfo'},{to:'/dashboard/faqs',label:'sidebar.faqs'},{to:'/dashboard/about',label:'sidebar.about'}]},
  {id:'delivery',type:'group',icon:'Truck',label:'sidebar.delivery',children:[
    {to:'/dashboard/shipping-partners',label:'sidebar.shippingPartners'},{to:'/dashboard/shipping-wilayas',label:'sidebar.shippingWilayas'},{to:'/dashboard/how-to-connect',label:'sidebar.howToConnect'},{to:'/dashboard/tracking-orders',label:'sidebar.trackingOrders'}]},
  {id:'customers',type:'group',icon:'Users',label:'sidebar.customers',children:[
    {to:'/dashboard/customers',label:'sidebar.customersList'},{to:'/dashboard/blacklist',label:'sidebar.blacklist'},{to:'/dashboard/auto-blacklist',label:'sidebar.autoBlacklist'}]},
  {id:'analytics',type:'link',to:'/dashboard/analytics',icon:'BarChart3',label:'sidebar.analytics'},
  {id:'costs',type:'link',to:'/dashboard/costs',icon:'DollarSign',label:'sidebar.costs'},
  {id:'taxes',type:'link',to:'/dashboard/taxes',icon:'Percent',label:'sidebar.taxes'},
  {id:'billing',type:'link',to:'/dashboard/billing',icon:'CreditCard',label:'sidebar.billing'},
];

const ICONS = {LayoutDashboard,ShoppingCart,Package,Globe,Zap,Truck,Users,BarChart3,DollarSign,CreditCard,Settings,Percent,LayoutTemplate,Target};

export default function DashboardLayout({children}){
  const{t}=useTranslation();const location=useLocation();const navigate=useNavigate();
  const{user,logout}=useAuthStore();const{currentStore,setCurrentStore,stores,setStores}=useStoreManagement();
  const[storeSwitchOpen,setStoreSwitchOpen]=useState(false);
  // Load owner's store list if empty (e.g. after page refresh).
  // Staff: skip the API call (they can't list owner stores) but seed `stores`
  // from the login response which already returned every store they were
  // assigned to, so the store switcher works for multi-store staff.
  useEffect(()=>{
    if(!user)return;
    if(Array.isArray(stores)&&stores.length>0)return;
    if(user.is_staff){
      try{
        const cached=JSON.parse(localStorage.getItem('staff_stores')||'[]');
        if(Array.isArray(cached)&&cached.length)setStores(cached);
      }catch{}
      return;
    }
    import('../../utils/api').then(m=>{m.ownerApi.getStores().then(r=>{
      if(Array.isArray(r.data)){
        setStores(r.data);
        if(currentStore?.id){
          const fresh=r.data.find(s=>s.id===currentStore.id);
          if(fresh)setCurrentStore(fresh);
        }
      }
    }).catch(()=>{});});
  },[user]);// eslint-disable-line
  const planCtx = usePlanFeatures();
  const theme = useAdminTheme();
  const isDark = theme.mode === 'dark';
  const pc = theme.primaryColor;
  const pl = theme.palette;
  // Initialize theme CSS vars on mount
  useEffect(() => { theme.init(); }, []); // eslint-disable-line
  // Apply the store's favicon + tab title to the admin dashboard (mirrors the
  // storefront behavior so admins see the same identity in their browser tab)
  useEffect(()=>{
    if(!currentStore)return;
    if(currentStore.favicon){
      let l=document.querySelector("link[rel~='icon']");
      if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l);}
      l.href=currentStore.favicon;
    }
    if(currentStore.name)document.title=currentStore.name+' — Admin';
  },[currentStore?.favicon,currentStore?.name]);
  const[isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<1024);
  const[sidebarOpen,setSidebarOpen]=useState(()=>typeof window!=='undefined'?window.innerWidth>=1024:true);
  // Persist expanded sidebar groups across navigation so "Show all" (or any
  // opened group) stays open after clicking a link and loading a new page.
  const[openMenus,setOpenMenus]=useState(()=>{try{return JSON.parse(localStorage.getItem('sidebarOpenMenus')||'{}');}catch{return{};}});
  useEffect(()=>{try{localStorage.setItem('sidebarOpenMenus',JSON.stringify(openMenus));}catch{}},[openMenus]);
  const[sideQuery,setSideQuery]=useState('');
  const[topQuery,setTopQuery]=useState('');
  const[topFocus,setTopFocus]=useState(false);
  const[headerHidden,setHeaderHidden]=useState(false);
  const lastScrollY=useRef(0);

  // Resize listener — keep isMobile in sync so the sidebar is correctly
  // shown/hidden when the window is resized or on orientation change.
  useEffect(()=>{
    const onResize=()=>{
      const m=window.innerWidth<1024;
      setIsMobile(m);
      // On desktop, the sidebar should always be visible.
      if(!m)setSidebarOpen(true);
    };
    window.addEventListener('resize',onResize);
    return()=>window.removeEventListener('resize',onResize);
  },[]);

  // The sidebar stays open across navigation — admins explicitly asked that
  // clicking a sidebar item should NOT auto-close the sidebar; only the close
  // button should do that. (Previously the sidebar collapsed on mobile after
  // every link click.)

  // Hide header when scrolling down on mobile, show when scrolling up.
  useEffect(()=>{
    if(!isMobile){setHeaderHidden(false);return;}
    const onScroll=()=>{
      const y=window.scrollY;
      if(y<50){setHeaderHidden(false);}
      else if(y>lastScrollY.current+5){setHeaderHidden(true);}
      else if(y<lastScrollY.current-5){setHeaderHidden(false);}
      lastScrollY.current=y;
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[isMobile]);

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

  // ===== Staff permission gating =====
  // When the logged-in user is a team member (is_staff=true), restrict sidebar
  // items to the permissions their store admin granted. Owners see everything.
  const staffPerms = React.useMemo(() => {
    if (!user?.is_staff) return null; // null = owner, show everything
    let p = user.permissions;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = []; } }
    return Array.isArray(p) ? p : [];
  }, [user]);
  const hasStaffPerm=(path)=>{
    if(!staffPerms)return true;
    const need=PERM_GATE_MAP[path];
    if(!need)return true; // unmapped routes default visible
    return staffPerms.includes(need);
  };
  const isStaffBlocked=(path)=>!!staffPerms&&!hasStaffPerm(path);

  // Check if a sidebar route is gated by the plan. Look up by the route path
  // last segment or by the item id for top-level links.
  const isGated=(idOrTo)=>{
    if(!idOrTo)return false;
    const key=FEATURE_GATE_MAP[idOrTo];
    if(!key)return false;
    return !planCtx.hasFeature(key);
  };
  const handleGated=(e,label)=>{e.preventDefault();
    const toast=require('react-hot-toast').default;
    toast.error(`"${label}" is locked on your current plan. Upgrade to unlock it.`);};

  const SLink=({to,icon:Icon,label,gated})=>{
    if(isStaffBlocked(to))return null;
    if(gated)return(<button onClick={e=>handleGated(e,label)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm opacity-50 w-full" style={{color:isDark?pl[300]:pl[400]}}><Icon size={18}/>{sidebarOpen&&<span className="flex items-center gap-1">{label}<Lock size={12} className="text-gray-400"/></span>}</button>);
    const active=isActive(to);
    return(<Link to={to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${active?'text-white font-semibold shadow-lg':''}`}
      style={active?{backgroundColor:pc,boxShadow:`0 4px 12px ${pc}40`}:{color:isDark?pl[300]:pl[600]}}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.backgroundColor=isDark?pc+'15':pl[50];e.currentTarget.style.color=isDark?pl[200]:pl[700];}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.backgroundColor='';e.currentTarget.style.color=isDark?pl[300]:pl[600];}}}
    ><Icon size={18}/>{sidebarOpen&&<span>{label}</span>}</Link>);
  };
  const SubLink=({to,label})=>{
    if(isStaffBlocked(to))return null;
    const lbl=typeof label==='string'&&label.startsWith('sidebar.')?t(label):label;
    const segment=to.split('/').pop();
    const gated=isGated(segment);
    if(gated)return(<button onClick={e=>handleGated(e,lbl)} className="pl-12 py-1.5 block text-sm cursor-not-allowed w-full text-left" style={{color:isDark?pl[400]+'80':pl[300]}}><span className="flex items-center gap-1">{lbl}<Lock size={10}/></span></button>);
    const active=isActive(to);
    return(<Link to={to} className={`pl-12 py-1.5 block text-sm transition-all ${active?'font-semibold':''}`}
      style={active?{color:pc}:{color:isDark?pl[400]:pl[300]}}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.color=isDark?pl[200]:pl[600];}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.color=isDark?pl[400]:pl[300];}}}
    >{lbl}</Link>);
  };

  const renderItem=(item,idx)=>{
    const Icon=ICONS[item.icon]||Settings;
    const lbl=typeof item.label==='string'&&item.label.startsWith('sidebar.')?t(item.label):item.label;
    const isDragging=dragIdx===idx;
    const isOver=overIdx===idx&&dragIdx!==idx;

    // For link items: hide entirely if staff-blocked
    if(item.type==='link'&&isStaffBlocked(item.to))return null;
    // Hide taxes when tax_enabled is off in store config
    if(item.id==='taxes'&&!currentStore?.config?.tax_enabled)return null;

    // For group items: hide entire group if ALL children are staff-blocked
    if(item.type==='group'&&staffPerms){
      const hasVisibleChild=item.children.some(c=>!isStaffBlocked(c.to));
      if(!hasVisibleChild)return null;
    }

    return(
      <div key={item.id}
        draggable={sidebarOpen}
        onDragStart={e=>handleDragStart(e,idx)}
        onDragOver={e=>handleDragOver(e,idx)}
        onDrop={e=>handleDrop(e,idx)}
        onDragEnd={handleDragEnd}
        className={`transition-all ${isDragging?'opacity-30':'opacity-100'} ${isOver?'border-t-2':''}`}
        style={{cursor:sidebarOpen?'grab':'default',...(isOver?{borderColor:pc}:{})}}
      >
        {item.type==='link'?(
          <div className="flex items-center group">
            {sidebarOpen&&<div className="opacity-0 group-hover:opacity-40 px-0.5"><GripVertical size={12} className="text-gray-400"/></div>}
            <div className="flex-1"><SLink to={item.to} icon={Icon} label={lbl} gated={isGated(item.id)}/></div>
          </div>
        ):(
          <div className="group">
            <div className="flex items-center">
              {sidebarOpen&&<div className="opacity-0 group-hover:opacity-40 px-0.5"><GripVertical size={12} className="text-gray-400"/></div>}
              <button onClick={()=>toggle(item.id)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm w-full justify-between flex-1 transition-all"
                style={{color:isDark?pl[300]:pl[600]}}
                onMouseEnter={e=>{e.currentTarget.style.backgroundColor=isDark?pc+'15':pl[50];e.currentTarget.style.color=isDark?pl[200]:pl[700];}}
                onMouseLeave={e=>{e.currentTarget.style.backgroundColor='';e.currentTarget.style.color=isDark?pl[300]:pl[600];}}
              >
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

  return(<div className={`flex min-h-screen ${isDark?'bg-gray-950':'bg-gray-50/50'}`}>
    {/* Mobile overlay */}
    {sidebarOpen&&isMobile&&<div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
    <aside className={`flex flex-col fixed h-screen z-40 transition-all duration-300 border-r ${isDark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} ${isMobile?(sidebarOpen?'w-56 translate-x-0':'-translate-x-full w-56'):(sidebarOpen?'w-56':'w-16')}`}>
      <div className={`p-4 border-b flex items-center justify-between ${isDark?'border-gray-800':'border-gray-100'}`}>
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={t('sidebar.dashboard','Dashboard')}>{currentStore?.logo?<img src={currentStore.logo} className="w-8 h-8 rounded-full object-cover shrink-0"/>:<div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" style={{backgroundColor:pc}}>{(currentStore?.name||'K')[0]}</div>}{sidebarOpen&&<div><p className={`font-bold text-sm truncate ${isDark?'text-gray-100':'text-gray-800'}`}>{currentStore?.name||'MyMarket'}</p><p className="text-[10px]" style={{color:pl[400]}}>{t('sidebar.storeDashboard','STORE DASHBOARD')}</p></div>}</Link>
        {isMobile&&<button onClick={()=>setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 lg:hidden"><X size={18}/></button>}
      </div>
      {/* Store switcher — only shows when owner has multiple stores */}
      {sidebarOpen&&Array.isArray(stores)&&stores.length>1&&(
        <div className={`px-3 pt-3 relative`}>
          <button onClick={()=>setStoreSwitchOpen(!storeSwitchOpen)} className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${isDark?'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200':'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}>
            <span className="flex items-center gap-2 min-w-0"><Globe size={12} className="shrink-0" style={{color:pc}}/><span className="font-bold truncate">{currentStore?.name||t('sidebar.selectStore','Select store')}</span></span>
            <ChevronDown size={12} className={`shrink-0 transition-transform ${storeSwitchOpen?'rotate-180':''}`}/>
          </button>
          {storeSwitchOpen&&(<>
            <div className="fixed inset-0 z-30" onClick={()=>setStoreSwitchOpen(false)}/>
            <div className={`absolute left-3 right-3 top-full mt-1 rounded-lg border shadow-xl z-40 max-h-64 overflow-y-auto ${isDark?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
              {stores.map(st=>{const sel=currentStore?.id===st.id;return(
                <button key={st.id} onClick={()=>{
                  if(currentStore?.id===st.id){setStoreSwitchOpen(false);return;}
                  setCurrentStore(st);
                  setStoreSwitchOpen(false);
                  // Full page reload so every page (dashboard, orders, products,
                  // settings, etc.) refetches data for the newly selected store.
                  window.location.href='/dashboard';
                }} className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${sel?(isDark?'bg-gray-800':'bg-brand-50'):(isDark?'hover:bg-gray-800':'hover:bg-gray-50')}`}>
                  {st.logo?<img src={st.logo} className="w-5 h-5 rounded-full object-cover shrink-0"/>:<div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{backgroundColor:pc}}>{(st.name||'S')[0]}</div>}
                  <span className={`flex-1 truncate font-medium ${isDark?'text-gray-200':'text-gray-700'}`}>{st.name}</span>
                  {sel&&<Check size={12} style={{color:pc}}/>}
                </button>
              );})}
            </div>
          </>)}
        </div>
      )}
      {sidebarOpen&&<div className="px-3 pt-3 relative">
        <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
        <input
          className={`w-full pl-7 pr-7 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 ${isDark?'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500':'bg-gray-50 border-gray-100 text-gray-700 placeholder-gray-400'}`}
          style={{'--tw-ring-color':pc+'30'}}
          placeholder={t('common.search','Search...')}
          value={sideQuery}
          onChange={e=>setSideQuery(e.target.value)}
        />
        {sideQuery&&<button onClick={()=>setSideQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12}/></button>}
      </div>}
      <nav className={`flex-1 px-2 py-3 space-y-0.5 overflow-y-auto text-sm ${isDark?'text-gray-300':'text-gray-700'}`}>
        {sidebarOpen&&<div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{color:pl[400]}}>{t('sidebar.mainMenu','Main Menu')}</p>
          {(()=>{const groupIds=items.filter(it=>it.type!=='link'&&it.children).map(it=>it.id);const allOpen=groupIds.length>0&&groupIds.every(id=>openMenus[id]);return(
            <button type="button" onClick={()=>{const next={};groupIds.forEach(id=>{next[id]=!allOpen;});setOpenMenus({...openMenus,...next});}} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all ${isDark?'text-gray-400 hover:text-gray-200 hover:bg-white/5':'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`} title={allOpen?t('sidebar.hideAll','Hide all'):t('sidebar.showAll','Show all')}>
              {allOpen?t('sidebar.hideAll','Hide all'):t('sidebar.showAll','Show all')}
            </button>);})()}
        </div>}
        {(()=>{
          const q=sideQuery.trim().toLowerCase();
          if(!q)return items.map((item,idx)=>renderItem(item,idx));
          // Flatten matching links from groups + top-level links
          const matches=[];
          items.forEach(item=>{
            const lbl=typeof item.label==='string'&&item.label.startsWith('sidebar.')?t(item.label):item.label;
            if(item.type==='link'){
              if((lbl||'').toLowerCase().includes(q))matches.push(item);
            }else if(item.children){
              const kids=item.children.filter(c=>{
                const cl=typeof c.label==='string'&&c.label.startsWith('sidebar.')?t(c.label):c.label;
                return(cl||'').toLowerCase().includes(q)||(lbl||'').toLowerCase().includes(q);
              });
              if(kids.length)matches.push({...item,children:kids});
            }
          });
          if(!matches.length)return<p className="px-3 py-4 text-xs text-gray-400 text-center">{t('common.noResults','No matches')}</p>;
          return matches.map((item,idx)=>{
            const Icon=ICONS[item.icon]||Settings;
            const lbl=typeof item.label==='string'&&item.label.startsWith('sidebar.')?t(item.label):item.label;
            if(item.type==='link')return(<SLink key={item.id} to={item.to} icon={Icon} label={lbl}/>);
            return(<div key={item.id}>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lbl}</div>
              {item.children.map(c=><SubLink key={c.to} to={c.to} label={c.label}/>)}
            </div>);
          });
        })()}
      </nav>
      <div className={`border-t ${sidebarOpen?'p-3':'p-2'} ${isDark?'border-gray-800':'border-gray-100'}`}>
        <div className={`flex items-center ${sidebarOpen?'gap-2 rounded-xl p-2.5':'justify-center rounded-lg p-2'} mb-2`} style={{backgroundColor:pc+'15'}}><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{backgroundColor:pc}}>{user?.name?.[0]||'U'}</div>{sidebarOpen&&<div className="min-w-0"><p className={`text-xs font-bold truncate ${isDark?'text-gray-200':'text-gray-800'}`}>{user?.name||'User'}</p><p className="text-[10px] text-gray-400 truncate">{user?.is_staff?(user.staff_role_label||(typeof user.staff_role==='string'&&!user.staff_role.startsWith('tpl_')&&!user.staff_role.startsWith('st_')?user.staff_role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):t('sidebar.staffRole','Staff'))):t('sidebar.adminRole','Admin')}</p></div>}</div>
        {!isMobile&&<button onClick={()=>setSidebarOpen(!sidebarOpen)} className={`flex items-center ${sidebarOpen?'gap-3 px-4':'justify-center px-0'} py-2.5 rounded-xl font-medium text-sm w-full transition-all ${isDark?'text-gray-400 hover:bg-white/5':'text-gray-600 hover:bg-gray-100'}`}><ChevronLeft size={18} className={`transition-transform ${sidebarOpen?'':'rotate-180'}`}/>{sidebarOpen&&<span>{t('sidebar.collapse','Collapse')}</span>}</button>}
        <button
          type="button"
          onClick={()=>navigate('/dashboard/settings')}
          className={`flex items-center ${sidebarOpen?'gap-3 px-4':'justify-center px-0'} py-2.5 rounded-xl font-medium text-sm w-full transition-all mb-1 ${isDark?'text-gray-300 hover:bg-white/5':'text-gray-700 hover:bg-gray-100'}`}
          title={!sidebarOpen?t('sidebar.settings','Settings'):''}
        ><Settings size={18}/>{sidebarOpen&&<span>{t('sidebar.settings','Settings')}</span>}</button>
        <button
          type="button"
          onClick={(e)=>{e.preventDefault();e.stopPropagation();try{logout();}catch{}try{localStorage.removeItem('token');}catch{}window.location.href='/login';}}
          className={`flex items-center ${sidebarOpen?'gap-3 px-4':'justify-center px-0'} py-2.5 rounded-xl font-medium text-sm w-full text-red-500 cursor-pointer transition-all ${isDark?'hover:bg-red-500/10':'hover:bg-red-50'}`}
          title={!sidebarOpen?t('sidebar.disconnect','Disconnect'):''}
        ><LogOut size={18}/>{sidebarOpen&&<span>{t('sidebar.disconnect','Disconnect')}</span>}</button>
      </div>
    </aside>
    <main className={`flex-1 min-w-0 transition-all duration-300 min-h-screen overflow-x-hidden ${isDark?'bg-gray-950 text-gray-100':'bg-gray-50 text-gray-900'} ${isMobile?'ml-0':(sidebarOpen?'ml-56':'ml-16')}`}>
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b px-4 md:px-6 py-3 flex items-center gap-2 transition-transform duration-300 ${isDark?'bg-gray-900/90 border-gray-800':'bg-white/90 border-gray-100'} ${headerHidden?'-translate-y-full':'translate-y-0'}`}>
        <div className="flex items-center gap-3 shrink-0">
          {isMobile&&<button onClick={()=>setSidebarOpen(true)} className={`p-2 rounded-xl lg:hidden ${isDark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-600'}`}><Menu size={20}/></button>}
          <div className="hidden md:flex items-center gap-3"><div className="w-8 h-8 rounded-lg overflow-hidden">{currentStore?.logo&&<img src={currentStore.logo} className="w-full h-full object-cover"/>}</div><div><p className="text-[10px] text-gray-400">{t('sidebar.storeDashboard','STORE DASHBOARD')}</p><p className={`font-bold text-sm ${isDark?'text-gray-100':'text-gray-900'}`}>{location.pathname.split('/').pop()?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||t('sidebar.dashboard','Dashboard')}</p></div></div>
          <p className={`md:hidden font-bold text-sm truncate max-w-[140px] ${isDark?'text-gray-100':'text-gray-800'}`}>{location.pathname.split('/').pop()?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||t('sidebar.dashboard','Dashboard')}</p>
        </div>
        <div className="flex-1 min-w-0 overflow-x-auto" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
        <div className="flex items-center justify-end gap-2 md:gap-3 w-max ml-auto">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input
              className={`pl-9 pr-8 py-2 rounded-xl text-sm w-64 border focus:outline-none focus:ring-2 ${isDark?'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500':'bg-gray-50 border-gray-100 text-gray-800 placeholder-gray-400'}`}
              style={{'--tw-ring-color':pc+'30'}}
              placeholder={t('sidebar.searchEverything','Search everything...')}
              value={topQuery}
              onChange={e=>setTopQuery(e.target.value)}
              onFocus={()=>setTopFocus(true)}
              onBlur={()=>setTimeout(()=>setTopFocus(false),180)}
              onKeyDown={e=>{
                if(e.key==='Escape'){setTopQuery('');e.currentTarget.blur();}
                if(e.key==='Enter'){
                  const q=topQuery.trim().toLowerCase();if(!q)return;
                  const flat=[];items.forEach(it=>{const lbl=typeof it.label==='string'&&it.label.startsWith('sidebar.')?t(it.label):it.label;if(it.type==='link')flat.push({to:it.to,label:lbl});else if(it.children)it.children.forEach(c=>{const cl=typeof c.label==='string'&&c.label.startsWith('sidebar.')?t(c.label):c.label;flat.push({to:c.to,label:cl});});});
                  const hit=flat.find(x=>(x.label||'').toLowerCase().includes(q));
                  if(hit){navigate(hit.to);setTopQuery('');setTopFocus(false);}
                }
              }}
            />
            {topQuery&&<button onMouseDown={e=>{e.preventDefault();setTopQuery('');}} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13}/></button>}
            {topFocus&&topQuery.trim()&&(()=>{
              const q=topQuery.trim().toLowerCase();
              const flat=[];
              items.forEach(it=>{
                const lbl=typeof it.label==='string'&&it.label.startsWith('sidebar.')?t(it.label):it.label;
                if(it.type==='link'){flat.push({to:it.to,label:lbl,parent:null});}
                else if(it.children){it.children.forEach(c=>{const cl=typeof c.label==='string'&&c.label.startsWith('sidebar.')?t(c.label):c.label;flat.push({to:c.to,label:cl,parent:lbl});});}
              });
              const matches=flat.filter(x=>(x.label||'').toLowerCase().includes(q)||(x.parent||'').toLowerCase().includes(q)).slice(0,12);
              return(<div className={`absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl shadow-2xl border z-50 ${isDark?'bg-gray-900 border-gray-700':'bg-white border-gray-100'}`}>
                {matches.length===0?<p className="p-4 text-center text-xs text-gray-400">{t('common.noResults','No matches')}</p>:
                matches.map((m,i)=>(
                  <button key={i} onMouseDown={e=>{e.preventDefault();navigate(m.to);setTopQuery('');setTopFocus(false);}} className={`w-full px-4 py-2.5 text-left flex items-center gap-2 border-b last:border-0 ${isDark?'hover:bg-white/5 border-gray-800':'hover:bg-gray-50 border-gray-50'}`}>
                    <Search size={12} className="text-gray-400 shrink-0"/>
                    <div className="flex-1 min-w-0"><p className={`text-sm font-semibold truncate ${isDark?'text-gray-200':'text-gray-800'}`}>{m.label}</p>{m.parent&&<p className="text-[10px] text-gray-500 truncate">{m.parent}</p>}</div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">{m.to}</span>
                  </button>
                ))}
              </div>);
            })()}
          </div>
          {currentStore?.is_live!==false&&<span className="hidden md:inline-flex"><LiveBadge storeId={currentStore?.id}/></span>}
          {/* Header store switcher: shows a "+" when the owner has only one
              store (quick way to create a second), and a dropdown when 2+.
              Staff don't get the "+" (they can't create stores), but if they
              were assigned to multiple stores by their admin they DO get the
              dropdown so they can switch between assigned stores. */}
          {Array.isArray(stores)&&(user?.is_staff?stores.length>1:true)&&(
            <div className="relative">
              {stores.length<=1?(
                <button onClick={()=>navigate('/dashboard?new_store=1')} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${isDark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title={t('sidebar.createStore','Create a store')}>
                  <Plus size={13}/><span className="hidden sm:inline">{t('sidebar.newStore','New store')}</span>
                </button>
              ):(
                <HeaderStoreSwitcher
                  open={storeSwitchOpen}
                  setOpen={setStoreSwitchOpen}
                  stores={stores}
                  currentStore={currentStore}
                  setCurrentStore={setCurrentStore}
                  user={user}
                  navigate={navigate}
                  isDark={isDark}
                  pc={pc}
                  t={t}
                />
              )}
            </div>
          )}
          <Link to={`/s/${currentStore?.slug}`} target="_blank" className={`hidden sm:inline-flex p-2 rounded-lg ${isDark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}><Eye size={18}/></Link>
          <NotifBell/>
          <ThemePanel compact mode={theme.mode} primaryColor={pc} onModeChange={theme.setMode} onColorChange={theme.setPrimaryColor}/>
          <LanguageSwitcher/>
          <div className={`hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 max-w-[260px] ${isDark?'bg-gray-800':'bg-gray-50'}`}><span className={`text-sm font-bold truncate ${isDark?'text-gray-300':'text-gray-700'}`} title={user?.is_staff?(user.staff_role_label||user.staff_role||'Staff'):'Admin'}>{user?.is_staff?(user.staff_role_label||(typeof user.staff_role==='string'&&!user.staff_role.startsWith('tpl_')&&!user.staff_role.startsWith('st_')?user.staff_role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):t('sidebar.staffRole','Staff'))):t('sidebar.adminRole','Admin')}</span><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{backgroundColor:pc}}>{user?.name?.[0]||'A'}</div></div>
          {currentStore?.is_live!==false&&<span className="md:hidden"><LiveBadge storeId={currentStore?.id}/></span>}
        </div>
        </div>
      </header>
      <div className={`p-3 sm:p-4 md:p-6 max-w-full min-w-0 overflow-x-hidden ${isDark?'bg-gray-950 text-gray-100':'bg-gray-50 text-gray-900'}`}>
        {isStaffBlocked(location.pathname)?(
          <div className={`max-w-md mx-auto mt-16 p-8 rounded-3xl text-center ${isDark?'bg-gray-900 border border-gray-800':'bg-white border border-gray-100 shadow-md'}`}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{backgroundColor:pc+'15'}}><Lock size={24} style={{color:pc}}/></div>
            <h2 className={`text-lg font-bold mb-1 ${isDark?'text-white':'text-gray-900'}`}>{t('staff.accessDenied','Access Denied')}</h2>
            <p className={`text-sm ${isDark?'text-gray-400':'text-gray-500'}`}>{t('staff.accessDeniedHelp','Your role does not include permission to view this page. Ask the store admin to grant you access.')}</p>
            <Link to="/dashboard" className="btn-ghost mt-4 inline-block">{t('sidebar.dashboard','Dashboard')}</Link>
          </div>
        ):children}
      </div>
    </main>
  </div>);
}
