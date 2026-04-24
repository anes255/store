import React,{useState,useEffect}from'react';import{useTranslation}from'react-i18next';import{useStoreManagement,useAdminTheme}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import{ownerApi}from'../../utils/api';import toast from'react-hot-toast';import{Save,ToggleLeft,ToggleRight,Zap,Eye,BarChart3,FileSpreadsheet,Check,Send,Loader2}from'lucide-react';

const PIXELS=[
  {id:'facebook_pixel',name:'Facebook Pixel',desc:'Track conversions, build audiences, and optimize ads on Facebook & Instagram.',color:'#1877F2',
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    field:'Pixel ID',placeholder:'123456789012345'},
  {id:'tiktok_pixel',name:'TikTok Pixel',desc:'Measure ad performance and build audiences on TikTok.',color:'#000000',
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.96a8.27 8.27 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.37z"/></svg>,
    field:'Pixel ID',placeholder:'CXXXXXXXXXXXXXXXXX'},
  {id:'google_analytics',name:'Google Analytics',desc:'Track website traffic, user behavior, and conversions with GA4.',color:'#F9AB00',
    icon:<BarChart3 size={20}/>,
    field:'Measurement ID',placeholder:'G-XXXXXXXXXX'},
  {id:'google_sheets',name:'Google Sheets',desc:'Auto-export order data to a Google Sheet via webhook.',color:'#0F9D58',
    icon:<FileSpreadsheet size={20}/>,
    field:'Webhook URL',placeholder:'https://script.google.com/macros/s/...'},
  {id:'snapchat_pixel',name:'Snapchat Pixel',desc:'Track conversions and build audiences on Snapchat.',color:'#FFFC00',
    icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.105-.012.21 0 .39.09.51.24.075.09.135.21.135.36 0 .36-.27.585-.525.66-.795.24-1.26.39-1.26.585 0 .105.015.18.09.3.63 1.005 1.59 1.83 2.58 2.295.225.105.42.285.42.555 0 .315-.315.585-.63.66-.42.09-.84.15-1.245.24-.15.03-.285.18-.36.33-.06.12-.075.27-.015.42.015.06.03.12.06.18.045.075.06.15.06.24 0 .18-.135.39-.39.45-.06.015-.135.015-.21.015-.27 0-.555-.06-.855-.18a4.39 4.39 0 00-.555-.18c-.12-.03-.225-.045-.33-.045-.285 0-.555.12-.765.27-.315.21-.705.525-1.17.72-.42.195-.87.3-1.365.3-2.295 0-3.6-1.8-3.84-2.25-.075-.15-.06-.315 0-.45.045-.105.135-.195.3-.24.42-.12.87-.195 1.305-.27.3-.06.555-.345.555-.66 0-.27-.195-.45-.42-.555-.99-.465-1.95-1.29-2.58-2.295-.075-.12-.09-.195-.09-.3 0-.195.465-.345 1.26-.585.255-.075.525-.3.525-.66 0-.15-.06-.27-.135-.36a.63.63 0 00-.51-.24c-.045 0-.075 0-.105.012-.263.094-.622.23-.922.214-.198 0-.326-.045-.401-.09.008-.165.018-.33.03-.51l.003-.06c.104-1.628.23-3.654-.299-4.847C3.455 1.07 6.803.793 7.794.793h4.412z"/></svg>,
    field:'Pixel ID',placeholder:'xxxxxxxx-xxxx-xxxx-xxxx'},
];

export default function TrackingPixels(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const dk=useAdminTheme(s=>s.mode==='dark');
  const[config,setConfig]=useState({});
  const[saving,setSaving]=useState(false);
  const[testing,setTesting]=useState(null);

  // Dynamically load a script and resolve when ready
  const loadScript=(src,id)=>new Promise((resolve,reject)=>{
    if(id&&document.getElementById(id))return resolve();
    const s=document.createElement('script');s.async=true;s.src=src;if(id)s.id=id;
    s.onload=()=>resolve();s.onerror=()=>reject(new Error('Failed to load '+src));
    document.head.appendChild(s);
  });

  const testPixel=async(px)=>{
    const c=config[px.id]||{};
    const val=(c.value||'').trim();
    if(!val){toast.error('Enter a value first');return;}
    setTesting(px.id);
    try{
      if(px.id==='facebook_pixel'){
        if(!window.fbq){
          /* eslint-disable */
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          /* eslint-enable */
        }
        window.fbq('init',val);
        window.fbq('track','PageView');
        window.fbq('trackCustom','TestEvent',{source:'store-admin-test',ts:Date.now()});
        toast.success('Facebook test event fired! Check Events Manager → Test Events.');
      }else if(px.id==='tiktok_pixel'){
        if(!window.ttq){
          /* eslint-disable */
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}}(window,document,'ttq');
          /* eslint-enable */
        }
        window.ttq.load(val);
        window.ttq.page();
        window.ttq.track('ViewContent',{content_id:'test-'+Date.now()});
        toast.success('TikTok test event fired! Check Events Debugger.');
      }else if(px.id==='google_analytics'){
        await loadScript('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(val),'gtag-'+val);
        window.dataLayer=window.dataLayer||[];
        window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
        window.gtag('js',new Date());
        window.gtag('config',val,{debug_mode:true});
        window.gtag('event','test_event',{event_category:'admin_test',event_label:'TrackingPixels',value:1});
        toast.success('GA4 test event sent! Check Realtime → DebugView.');
      }else if(px.id==='google_sheets'){
        const res=await fetch(val,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({test:true,timestamp:new Date().toISOString(),source:'admin-test-button',order_id:'TEST-'+Date.now()})});
        toast.success('Test row sent to Google Sheets webhook!');
      }else if(px.id==='snapchat_pixel'){
        if(!window.snaptr){
          /* eslint-disable */
          (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
          /* eslint-enable */
        }
        window.snaptr('init',val,{});
        window.snaptr('track','PAGE_VIEW');
        window.snaptr('track','VIEW_CONTENT',{item_ids:['test-'+Date.now()]});
        toast.success('Snapchat test event fired! Check Events Manager.');
      }
    }catch(e){toast.error('Test failed: '+(e?.message||'unknown error'));}
    finally{setTesting(null);}
  };

  useEffect(()=>{
    if(!currentStore)return;
    // Load tracking config from store settings
    const tc=currentStore.tracking_pixels||{};
    setConfig(tc);
  },[currentStore]);

  const toggle=(id)=>{
    setConfig(p=>({...p,[id]:{...p[id],enabled:!p[id]?.enabled}}));
  };
  const setValue=(id,val)=>{
    setConfig(p=>({...p,[id]:{...p[id],value:val}}));
  };

  const save=async()=>{
    if(!currentStore?.id)return;
    setSaving(true);
    try{
      await ownerApi.updateStore(currentStore.id,{tracking_pixels:config});
      toast.success('Tracking pixels saved!');
    }catch{toast.error('Failed to save');}
    setSaving(false);
  };

  const bg=dk?'bg-gray-800 border-gray-700':'bg-white border-gray-200';
  const t1=dk?'text-white':'text-gray-900';
  const t2=dk?'text-gray-400':'text-gray-500';
  const inp=dk?'bg-gray-900 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  return(<DashboardLayout>
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 mb-6 text-white">
      <div className="flex items-center gap-2 mb-1"><span className="badge bg-brand-500 text-white text-[10px]">MARKETING</span></div>
      <h1 className="text-3xl font-bold">Tracking <span className="text-brand-400">Pixels</span></h1>
      <p className="text-white/60 mt-2 text-sm">Configure tracking pixels to measure ad performance and export data.</p>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Zap size={16}/></div><div><p className="text-xs text-white/50">Active Pixels</p><p className="text-lg font-bold">{Object.values(config).filter(c=>c?.enabled).length}</p></div></div>
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Eye size={16}/></div><div><p className="text-xs text-white/50">Platforms</p><p className="text-lg font-bold">{PIXELS.length}</p></div></div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {PIXELS.map(px=>{
        const c=config[px.id]||{};
        const on=!!c.enabled;
        return(
          <div key={px.id} className={`rounded-2xl border p-5 transition-all ${on?'ring-2 ring-offset-2':''} ${bg}`} style={on?{ringColor:px.color}:{}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{backgroundColor:px.color}}>
                {px.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm ${t1}`}>{px.name}</h3>
                <p className={`text-xs ${t2} line-clamp-1`}>{px.desc}</p>
              </div>
              <button onClick={()=>toggle(px.id)} className="shrink-0">
                {on?<ToggleRight size={28} style={{color:px.color}}/>:<ToggleLeft size={28} className="text-gray-400"/>}
              </button>
            </div>
            {on&&(
              <div className="mt-3">
                <label className={`text-xs font-bold ${t2} uppercase tracking-wider`}>{px.field}</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-mono ${inp}`}
                    placeholder={px.placeholder}
                    value={c.value||''}
                    onChange={e=>setValue(px.id,e.target.value)}
                  />
                  {c.value&&<div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:px.color+'22'}}><Check size={14} style={{color:px.color}}/></div>}
                </div>
                {c.value&&<button onClick={()=>testPixel(px)} disabled={testing===px.id} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{backgroundColor:px.color}}>
                  {testing===px.id?<Loader2 size={12} className="animate-spin"/>:<Send size={12}/>}
                  {testing===px.id?'Testing...':'Send Test Event'}
                </button>}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div className="flex justify-end">
      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3">
        {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={16}/>}
        {saving?'Saving...':'Save Tracking Pixels'}
      </button>
    </div>
  </DashboardLayout>);
}
