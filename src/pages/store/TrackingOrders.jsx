import React,{useState,useEffect,useMemo,useRef} from'react';
import{useTranslation}from'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import api,{ownerApi} from'../../utils/api';
import toast from'react-hot-toast';
import{Search,Truck,Package,MapPin,RefreshCw,ExternalLink,Clock,Check,X,AlertTriangle,Phone,ChevronRight,Box,Home,RotateCcw,Settings as SettingsIcon,Eye,Hash,Power,Save,Monitor,Smartphone,Plus,Trash2,Palette,Loader2,Tag}from'lucide-react';

const STEPS=[
  {key:'awaiting_pickup',labelKey:'storePage.awaitingPickup',labelDefault:'Awaiting Pickup',icon:Box},
  {key:'picked_up',labelKey:'storePage.pickedUp',labelDefault:'Picked Up',icon:Package},
  {key:'at_center',labelKey:'storePage.atCenter',labelDefault:'At Center',icon:Home},
  {key:'in_transit',labelKey:'storePage.inTransit',labelDefault:'In Transit',icon:Truck},
  {key:'out_for_delivery',labelKey:'storePage.outForDelivery',labelDefault:'Out for Delivery',icon:MapPin},
  {key:'delivered',labelKey:'storePage.delivered',labelDefault:'Delivered',icon:Check},
];
const FAIL_STATUSES=['delivery_failed','returned'];
function getStepIndex(status){
  const idx=STEPS.findIndex(s=>s.key===status);
  if(idx>=0)return idx;
  if(status==='preparing'||status==='shipped')return 0;
  if(status==='delivered')return 5;
  return 0;
}

// Inline toggle switch
const Toggle=({label,desc,checked,onChange})=>(
  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
    <div className="flex-1 min-w-0 pr-2">
      <p className="font-medium text-sm">{label}</p>
      {desc&&<p className="text-[11px] text-gray-400">{desc}</p>}
    </div>
    <div className={`w-11 h-6 rounded-full transition-colors ${checked?'bg-brand-500':'bg-gray-300'} relative shrink-0`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </div>
    <input type="checkbox" className="sr-only" checked={checked||false} onChange={onChange}/>
  </label>
);

export default function TrackingOrders(){
  const{t}=useTranslation();
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[tab,setTab]=useState('shipments'); // 'shipments' | 'settings' | 'preview'

  // ── Shipments state ──
  const[orders,setOrders]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState('all');
  const[search,setSearch]=useState('');
  const[selectedOrder,setSelectedOrder]=useState(null);
  const[trackingData,setTrackingData]=useState(null);
  const[trackingLoading,setTrackingLoading]=useState(false);

  const load=()=>{if(!currentStore?.id)return;
    let url=`/manage/stores/${currentStore.id}/tracking-orders`;
    if(filter==='tracked')url+='?status=tracked';
    else if(filter==='untracked')url+='?status=untracked';
    setLoading(true);
    api.get(url).then(r=>setOrders(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[currentStore?.id,filter]);

  const filtered=orders.filter(o=>{if(!search)return true;const s=search.toLowerCase();
    return(o.order_number||'').toLowerCase().includes(s)||(o.customer_name||'').toLowerCase().includes(s)||(o.tracking_number||'').toLowerCase().includes(s);});

  const openOrder=async(order)=>{
    setSelectedOrder(order);setTrackingData(null);
    if(order.tracking_number){
      setTrackingLoading(true);
      try{const{data}=await api.get(`/manage/stores/${currentStore.id}/track/${order.tracking_number}`);setTrackingData(data);}
      catch(e){setTrackingData({error:e.response?.data?.error||e.message});}
      setTrackingLoading(false);
    }
  };
  const refreshTracking=async()=>{
    if(!selectedOrder?.tracking_number)return;
    setTrackingLoading(true);
    try{const{data}=await api.get(`/manage/stores/${currentStore.id}/track/${selectedOrder.tracking_number}`);setTrackingData(data);toast.success(t('storePage.updated','Updated'));}
    catch{toast.error(t('storePage.failed','Failed'));}
    setTrackingLoading(false);
  };

  const tracked=orders.filter(o=>o.tracking_number).length;
  const untracked=orders.filter(o=>!o.tracking_number&&o.status==='shipped').length;
  const delivered=orders.filter(o=>o.status==='delivered').length;

  // ── Settings state (from OrderTracking.jsx) ──
  const[s,setS]=useState({});
  const[saving,setSaving]=useState(false);
  useEffect(()=>{
    if(!currentStore)return;
    setS({
      tracking_enabled:currentStore.tracking_enabled!==false,
      tracking_search_method:currentStore.tracking_search_method||'phone',
      tracking_hero_title:currentStore.tracking_hero_title||t('orderTrack.heroDefault','Track Your Order'),
      tracking_hero_sub:currentStore.tracking_hero_sub||t('orderTrack.subDefault','Enter your phone number or order ID to see the status of your orders.'),
      tracking_show_price:currentStore.tracking_show_price!==false,
      tracking_show_items:currentStore.tracking_show_items!==false,
      tracking_show_timeline:currentStore.tracking_show_timeline!==false,
      tracking_show_address:currentStore.tracking_show_address!==false,
      tracking_show_payment:currentStore.tracking_show_payment!==false,
      tracking_show_tracking_number:currentStore.tracking_show_tracking_number!==false,
    });
  },[currentStore?.id]);
  const setK=(k,v)=>setS(p=>({...p,[k]:v}));
  const save=async()=>{
    setSaving(true);
    try{
      const{data}=await ownerApi.updateStore(currentStore.id,s);
      setCurrentStore(data);
      toast.success(t('orderTrack.saved','Saved!'));
    }catch{toast.error(t('orderTrack.failed','Failed'));}
    setSaving(false);
  };

  // Translate raw status keys (e.g. "in_transit" → "In transit") with a
  // proper i18n entry first, falling back to a humanized key.
  const trStatus = (k) => {
    if (!k) return '';
    const key = String(k).toLowerCase();
    const i18nKey = `statusMgmt.${key}`;
    const looked = t(i18nKey, '');
    if (looked && looked !== i18nKey) return looked;
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // ── Status templates state ──
  // The default_label is shown when the admin hasn't customized this status,
  // and the i18n_key lets the buyer-side track page translate the same row.
  const STATUS_BUILT_IN=[
    {key:'new_order', default_label:t('statusMgmt.new','New'),                color:'#6366f1', is_builtin:true},
    {key:'pending',   default_label:t('statusMgmt.pending','Pending'),        color:'#f59e0b', is_builtin:true},
    {key:'confirmed', default_label:t('statusMgmt.confirmed','Confirmed'),    color:'#3b82f6', is_builtin:true},
    {key:'preparing', default_label:t('statusMgmt.preparing','Preparing'),    color:'#a855f7', is_builtin:true},
    {key:'ready',     default_label:t('statusMgmt.ready','Ready'),            color:'#14b8a6', is_builtin:true},
    {key:'shipped',   default_label:t('statusMgmt.shipped','Shipped'),        color:'#f97316', is_builtin:true},
    {key:'delivered', default_label:t('statusMgmt.delivered','Delivered'),    color:'#10b981', is_builtin:true},
    {key:'cancelled', default_label:t('statusMgmt.cancelled','Cancelled'),    color:'#ef4444', is_builtin:true},
    {key:'returned',  default_label:t('statusMgmt.returned','Returned'),      color:'#6b7280', is_builtin:true},
  ];
  const[statusRows,setStatusRows]=useState([]);
  const[statusLoading,setStatusLoading]=useState(false);
  const[statusSaving,setStatusSaving]=useState(false);
  const loadStatuses=async()=>{
    if(!currentStore?.id)return;
    setStatusLoading(true);
    try{
      const{data}=await api.get(`/manage/stores/${currentStore.id}/status-templates`);
      const existing=Array.isArray(data)?data:(data?.rows||[]);
      const byKey=new Map(existing.map(r=>[r.key,r]));
      const merged=STATUS_BUILT_IN.map(b=>({...b,
        label:byKey.get(b.key)?.label||b.default_label,
        color:byKey.get(b.key)?.color||b.color,
        enabled:byKey.get(b.key)?.enabled!==false,
        notify_customer:byKey.get(b.key)?.notify_customer!==false,
      }));
      const customs=existing.filter(r=>!STATUS_BUILT_IN.find(b=>b.key===r.key));
      setStatusRows([...merged,...customs.map(c=>({...c,is_builtin:false,enabled:c.enabled!==false}))]);
    }catch{
      setStatusRows(STATUS_BUILT_IN.map(b=>({...b,label:b.default_label,enabled:true,notify_customer:true})));
    }
    setStatusLoading(false);
  };
  useEffect(()=>{if(tab==='statuses')loadStatuses();},[tab,currentStore?.id]);
  const statusUpdate=(i,patch)=>setStatusRows(prev=>prev.map((r,idx)=>idx===i?{...r,...patch}:r));
  const statusRemove=(i)=>setStatusRows(prev=>prev.filter((_,idx)=>idx!==i));
  const statusAddCustom=()=>{
    const slug='custom_'+Date.now();
    setStatusRows(prev=>[...prev,{key:slug,label:t('statusMgmt.newStatus','New Status'),color:'#64748b',enabled:true,notify_customer:false,is_builtin:false}]);
  };
  const statusSave=async()=>{
    if(!currentStore?.id)return;
    setStatusSaving(true);
    try{await api.put(`/manage/stores/${currentStore.id}/status-templates`,{statuses:statusRows});toast.success(t('statusMgmt.saved','Status templates saved'));}
    catch(e){toast.error(e?.response?.data?.error||t('statusMgmt.saveFailed','Failed to save'));}
    setStatusSaving(false);
  };

  // ── Preview state ──
  const[previewDevice,setPreviewDevice]=useState('desktop'); // 'desktop' | 'mobile'
  const previewUrl=currentStore?.slug?`${window.location.origin}/s/${currentStore.slug}/track`:null;
  const iframeRef=useRef(null);

  // ═══════════════════ MODAL (shipments) ═══════════════════
  const renderModal=()=>{
    if(!selectedOrder)return null;
    const currentStatus=trackingData?.status||selectedOrder.tracking_status||'in_transit';
    const stepIdx=getStepIndex(currentStatus);
    const isFailed=FAIL_STATUSES.includes(currentStatus);
    return(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>{setSelectedOrder(null);setTrackingData(null);}}>
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><span className="font-mono text-brand-600">{selectedOrder.order_number}</span><span className="text-gray-300">—</span><span>{selectedOrder.customer_name}</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.company_name||t('storePage.noDeliveryCompany','No delivery company')} {selectedOrder.tracking_number&&<span className="font-mono bg-gray-100 px-2 py-0.5 rounded ml-1">#{selectedOrder.tracking_number}</span>}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedOrder.tracking_number&&<button onClick={refreshTracking} disabled={trackingLoading} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={12} className={trackingLoading?'animate-spin':''}/>{t('storePage.refresh','Refresh')}</button>}
              <button onClick={()=>{setSelectedOrder(null);setTrackingData(null);}} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{t('storePage.customer','Customer')}</p><p className="font-bold text-sm text-gray-900">{selectedOrder.customer_name}</p><p className="text-xs text-gray-500">{selectedOrder.customer_phone}</p></div>
              <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{t('storePage.destination','Destination')}</p><p className="text-sm text-gray-700">{selectedOrder.shipping_wilaya||'—'}</p></div>
              <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{t('storePage.partner','Partner')}</p><p className="font-bold text-sm text-gray-900">{selectedOrder.company_name||t('storePage.notAvailable','N/A')}</p>{trackingData?.has_api&&<span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{t('storePage.live','LIVE')}</span>}</div>
            </div>
            {!selectedOrder.tracking_number?(
              <div className="p-8 text-center"><AlertTriangle size={36} className="mx-auto text-amber-400 mb-3"/><p className="font-bold text-gray-700">{t('storePage.noTrackingNumber','No tracking number')}</p><p className="text-xs text-gray-400 mt-1">{t('storePage.assignFromOrders','Assign one from the Orders page')}</p></div>
            ):trackingLoading&&!trackingData?(
              <div className="p-12 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>
            ):(
              <>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6">{t('storePage.deliveryProgress','Delivery Progress')}</h3>
                  {isFailed?(
                    <div className="p-5 bg-red-50 rounded-2xl text-center"><RotateCcw size={32} className="mx-auto text-red-500 mb-2"/><p className="font-bold text-red-700 capitalize">{trStatus(currentStatus)}</p></div>
                  ):(
                    <div className="relative">
                      <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full"/>
                      <div className="absolute top-5 left-5 h-1 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-1000" style={{width:`calc(${Math.max(0,(stepIdx/(STEPS.length-1))*100)}% - 40px)`}}/>
                      <div className="relative flex justify-between">
                        {STEPS.map((step,i)=>{const Icon=step.icon;const done=i<=stepIdx;const active=i===stepIdx;return(
                          <div key={step.key} className="flex flex-col items-center" style={{width:`${100/STEPS.length}%`}}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${active?'bg-brand-500 text-white shadow-lg scale-125 ring-4 ring-brand-100':done?'bg-emerald-500 text-white':'bg-white border-2 border-gray-300 text-gray-400'}`}>{done&&!active?<Check size={16}/>:<Icon size={16}/>}</div>
                            <p className={`text-[10px] font-bold mt-2.5 text-center ${active?'text-brand-600':done?'text-emerald-600':'text-gray-400'}`}>{t(step.labelKey,step.labelDefault)}</p>
                          </div>
                        );})}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isFailed?'bg-red-100':stepIdx>=5?'bg-emerald-100':'bg-brand-100'}`}>
                    {isFailed?<RotateCcw size={18} className="text-red-600"/>:stepIdx>=5?<Check size={18} className="text-emerald-600"/>:<Truck size={18} className="text-brand-600"/>}
                  </div>
                  <div className="flex-1"><p className="font-bold text-sm text-gray-900 capitalize">{trackingData?.raw_status||trStatus(currentStatus)}</p><p className="text-xs text-gray-500">{t('storePage.via','via')} {trackingData?.company||selectedOrder.company_name}</p></div>
                  {trackingData?.last_update&&<p className="text-[10px] text-gray-400">{new Date(trackingData.last_update).toLocaleString()}</p>}
                </div>
                {trackingData?.tracking_url&&!trackingData?.has_api&&(
                  <a href={trackingData.tracking_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <ExternalLink size={16} className="text-blue-500"/><p className="text-sm font-bold text-blue-700 flex-1">{t('storePage.trackOn','Track on')} {selectedOrder.company_name}</p><ChevronRight size={14} className="text-blue-400"/>
                  </a>
                )}
                {trackingData?.history&&trackingData.history.length>0&&(
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-3">{t('storePage.timeline','Timeline')}</h3>
                    <div className="space-y-0 max-h-48 overflow-y-auto">
                      {trackingData.history.map((h,i)=>(
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center"><div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${i===0?'bg-brand-500 ring-3 ring-brand-100':'bg-gray-300'}`}/>{i<trackingData.history.length-1&&<div className="w-0.5 flex-1 bg-gray-200 my-0.5"/>}</div>
                          <div className="pb-3"><p className={`text-xs font-semibold ${i===0?'text-gray-900':'text-gray-500'}`}>{h.status||h.label||h.note||JSON.stringify(h)}</p><div className="flex gap-2 mt-0.5">{h.location&&<p className="text-[10px] text-gray-400">{h.location}</p>}{h.date&&<p className="text-[10px] text-gray-400">{new Date(h.date).toLocaleString()}</p>}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════ TABS CONTENT ═══════════════════
  const shipmentsTab=()=>(<>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.totalShipped','Total Shipped')}</p><p className="text-2xl font-black text-gray-900 mt-1">{orders.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">{t('storePage.withTracking','With Tracking')}</p><p className="text-2xl font-black text-emerald-600 mt-1">{tracked}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-amber-500 uppercase">{t('storePage.noTracking','No Tracking')}</p><p className="text-2xl font-black text-amber-600 mt-1">{untracked}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-brand-500 uppercase">{t('storePage.delivered','Delivered')}</p><p className="text-2xl font-black text-brand-600 mt-1">{delivered}</p></div>
    </div>

    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {[{k:'all',l:t('storePage.all','All')},{k:'tracked',l:t('storePage.withTracking','With Tracking')},{k:'untracked',l:t('storePage.noTracking','No Tracking')}].map(f=>(
        <button key={f.k} onClick={()=>setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter===f.k?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
      ))}
      <div className="relative flex-1 max-w-xs ml-auto"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder={t('storePage.searchOrdersOrTracking','Search orders or tracking...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{t('storePage.noShippedOrders','No shipped orders found')}</p><p className="text-sm text-gray-400 mt-1">{t('storePage.ordersAppearHere','Orders appear here once marked as shipped')}</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(o=>{
          const st=o.tracking_status||'in_transit';
          const stepIdx=getStepIndex(st);
          const isFailed=FAIL_STATUSES.includes(st);
          return(
            <div key={o.id} onClick={()=>openOrder(o)} className="glass-card-solid p-5 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  !o.tracking_number?'bg-gray-100':isFailed?'bg-red-50':st==='delivered'?'bg-emerald-50':'bg-cyan-50'}`}>
                  {!o.tracking_number?<AlertTriangle size={20} className="text-gray-400"/>:isFailed?<RotateCcw size={20} className="text-red-500"/>:st==='delivered'?<Check size={20} className="text-emerald-500"/>:<Truck size={20} className="text-cyan-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-sm text-brand-600">{o.order_number}</span>
                    <span className="font-medium text-sm text-gray-700">{o.customer_name}</span>
                    {o.tracking_number&&<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isFailed?'bg-red-50 text-red-700':st==='delivered'?'bg-emerald-50 text-emerald-700':'bg-cyan-50 text-cyan-700'}`}>{trStatus(st)}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {o.shipping_wilaya&&<span className="flex items-center gap-1"><MapPin size={11}/>{o.shipping_wilaya}</span>}
                    {o.company_name&&<span className="flex items-center gap-1"><Truck size={11}/>{o.company_name}</span>}
                    <span className="flex items-center gap-1"><Clock size={11}/>{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  {o.tracking_number&&!isFailed&&(
                    <div className="flex gap-1 mt-2">{STEPS.map((_,i)=>(<div key={i} className={`h-1 flex-1 rounded-full ${i<=stepIdx?'bg-emerald-400':'bg-gray-200'}`}/>))}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {o.tracking_number?<p className="font-mono text-xs text-gray-500">{o.tracking_number}</p>:<span className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">{t('storePage.noTracking','No tracking')}</span>}
                  <p className="text-sm font-bold text-gray-800 mt-1">{parseFloat(o.total).toLocaleString()} DZD</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0"/>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>);

  const settingsTab=()=>(<>
    <div className="flex items-center justify-end mb-4">
      <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
        <Save size={16}/>{saving?t('orderTrack.saving','Saving...'):t('common.save','Save')}
      </button>
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card-solid p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Power size={16} className="text-brand-500"/>{t('orderTrack.general','General')}</h3>
        <Toggle
          label={t('orderTrack.enable','Enable Order Tracking')}
          desc={t('orderTrack.enableDesc','When off, the Track Order page and the storefront button are hidden from customers')}
          checked={s.tracking_enabled}
          onChange={e=>setK('tracking_enabled',e.target.checked)}/>
        <div>
          <label className="input-label text-xs">{t('orderTrack.heroTitle','Hero Title')}</label>
          <input className="input-field" value={s.tracking_hero_title||''} onChange={e=>setK('tracking_hero_title',e.target.value)}/>
        </div>
        <div>
          <label className="input-label text-xs">{t('orderTrack.subtitleField','Subtitle')}</label>
          <input className="input-field" value={s.tracking_hero_sub||''} onChange={e=>setK('tracking_hero_sub',e.target.value)}/>
        </div>
      </div>
      <div className="glass-card-solid p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Search size={16} className="text-purple-500"/>{t('orderTrack.searchLogic','Search Logic')}</h3>
        <p className="text-xs text-gray-400">{t('orderTrack.searchLogicDesc','Choose how customers look up their orders on the public tracking page.')}</p>
        <div className="space-y-2">
          {[
            {key:'phone',icon:Phone,label:t('orderTrack.searchPhone','By Phone Number'),desc:t('orderTrack.searchPhoneDesc','Lookup by the Algerian mobile number used at checkout')},
            {key:'order_id',icon:Hash,label:t('orderTrack.searchOrder','By Order ID'),desc:t('orderTrack.searchOrderDesc','Customer enters the order number (e.g. ORD-00123)')},
            {key:'both',icon:SettingsIcon,label:t('orderTrack.searchBoth','Both (Phone or Order ID)'),desc:t('orderTrack.searchBothDesc','Customer chooses either method — recommended')},
          ].map(opt=>{
            const Icon=opt.icon;
            const selected=(s.tracking_search_method||'phone')===opt.key;
            return(
              <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="tracking_search_method" value={opt.key} checked={selected} onChange={()=>setK('tracking_search_method',opt.key)} className="sr-only"/>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected?'bg-brand-500 text-white':'bg-gray-100 text-gray-400'}`}><Icon size={16}/></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${selected?'text-brand-600':'text-gray-700'}`}>{opt.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="glass-card-solid p-6 space-y-4 lg:col-span-2">
        <h3 className="font-bold flex items-center gap-2"><Package size={16} className="text-amber-500"/>{t('orderTrack.display','Display Options')}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label={t('orderTrack.showPrice','Show Price')} desc={t('orderTrack.showPriceDesc','Order total is visible on tracking results')} checked={s.tracking_show_price} onChange={e=>setK('tracking_show_price',e.target.checked)}/>
          <Toggle label={t('orderTrack.showItems','Show Items')} desc={t('orderTrack.showItemsDesc','Show product images and quantities')} checked={s.tracking_show_items} onChange={e=>setK('tracking_show_items',e.target.checked)}/>
          <Toggle label={t('orderTrack.showTimeline','Show Timeline')} desc={t('orderTrack.showTimelineDesc','Visual step-by-step status timeline')} checked={s.tracking_show_timeline} onChange={e=>setK('tracking_show_timeline',e.target.checked)}/>
          <Toggle label={t('orderTrack.showAddress','Show Address')} desc={t('orderTrack.showAddressDesc','Display the shipping address')} checked={s.tracking_show_address} onChange={e=>setK('tracking_show_address',e.target.checked)}/>
          <Toggle label={t('orderTrack.showPayment','Show Payment')} desc={t('orderTrack.showPaymentDesc','Display chosen payment method')} checked={s.tracking_show_payment} onChange={e=>setK('tracking_show_payment',e.target.checked)}/>
          <Toggle label={t('orderTrack.showTN','Show Tracking Number')} desc={t('orderTrack.showTNDesc','Display the courier tracking number (if set)')} checked={s.tracking_show_tracking_number} onChange={e=>setK('tracking_show_tracking_number',e.target.checked)}/>
        </div>
      </div>
    </div>
  </>);

  const statusesTab=()=>(<>
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <p className="text-xs text-gray-400">{t('statusMgmt.subtitle','Customize order status labels, colors, and customer notifications. Built-in statuses can be renamed but not deleted.')}</p>
      <div className="flex items-center gap-2">
        <button onClick={statusAddCustom} className="px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center gap-1.5"><Plus size={13}/>{t('statusMgmt.addCustom','Add Custom Status')}</button>
        <button onClick={statusSave} disabled={statusSaving} className="btn-primary text-xs flex items-center gap-2">{statusSaving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}{t('common.save','Save')}</button>
      </div>
    </div>
    {statusLoading?(
      <div className="py-16 text-center"><Loader2 size={24} className="animate-spin mx-auto text-brand-500"/></div>
    ):(
      <div className="glass-card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">{t('statusMgmt.key','Key')}</th>
                <th className="px-4 py-3">{t('statusMgmt.label','Label')}</th>
                <th className="px-4 py-3">{t('statusMgmt.color','Color')}</th>
                <th className="px-4 py-3 text-center">{t('statusMgmt.enabled','Enabled')}</th>
                <th className="px-4 py-3 text-center">{t('statusMgmt.notify','Notify Customer')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions','Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map((r,i)=>(
                <tr key={r.key} className="border-t border-gray-100">
                  <td className="px-4 py-3"><span className="font-mono text-xs text-gray-500">{r.key}</span>{r.is_builtin&&<span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">{t('statusMgmt.builtin','BUILT-IN')}</span>}</td>
                  <td className="px-4 py-3"><input className="input-field !py-1.5 !text-sm" value={r.label||''} onChange={e=>statusUpdate(i,{label:e.target.value})}/></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><input type="color" className="w-8 h-8 rounded border border-gray-200" value={r.color||'#6366f1'} onChange={e=>statusUpdate(i,{color:e.target.value})}/><span className="font-mono text-[10px] text-gray-400">{r.color}</span></div></td>
                  <td className="px-4 py-3 text-center"><button onClick={()=>statusUpdate(i,{enabled:!r.enabled})} className={`w-10 h-5 rounded-full relative transition-colors ${r.enabled?'bg-emerald-500':'bg-gray-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.enabled?'translate-x-5':'translate-x-0.5'}`}/></button></td>
                  <td className="px-4 py-3 text-center"><button onClick={()=>statusUpdate(i,{notify_customer:!r.notify_customer})} className={`w-10 h-5 rounded-full relative transition-colors ${r.notify_customer?'bg-blue-500':'bg-gray-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.notify_customer?'translate-x-5':'translate-x-0.5'}`}/></button></td>
                  <td className="px-4 py-3 text-right">{r.is_builtin?<span className="text-[10px] text-gray-300">—</span>:<button onClick={()=>statusRemove(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14}/></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
      <p className="font-bold mb-1 flex items-center gap-1.5"><Palette size={14}/>{t('statusMgmt.howTitle','How it works')}</p>
      <p className="text-xs">{t('statusMgmt.howDesc','These settings apply to: the storefront profile order history, the public Track Order button, and the tracking details shown on the customer tracking page. Toggling "Notify Customer" off will skip WhatsApp/email messages for that status.')}</p>
    </div>
  </>);

  const previewTab=()=>(<>
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div>
        <p className="text-sm text-gray-500">{t('storePage.previewDesc','This is exactly what customers will see at')} <span className="font-mono text-brand-600 text-xs">{previewUrl||'—'}</span></p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button onClick={()=>setPreviewDevice('desktop')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${previewDevice==='desktop'?'bg-white shadow text-brand-600':'text-gray-500'}`}><Monitor size={13}/>{t('storePage.desktop','Desktop')}</button>
          <button onClick={()=>setPreviewDevice('mobile')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${previewDevice==='mobile'?'bg-white shadow text-brand-600':'text-gray-500'}`}><Smartphone size={13}/>{t('storePage.mobile','Mobile')}</button>
        </div>
        <button onClick={()=>iframeRef.current&&(iframeRef.current.src=iframeRef.current.src)} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={12}/>{t('storePage.refresh','Refresh')}</button>
        {previewUrl&&<a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs flex items-center gap-1"><ExternalLink size={12}/>{t('storePage.openInNewTab','Open')}</a>}
      </div>
    </div>
    {s.tracking_enabled===false&&(
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0"/>
        <p className="text-sm text-amber-700">{t('storePage.trackingDisabledPreview','Tracking is currently disabled. Customers will see a disabled message instead of this page.')}</p>
      </div>
    )}
    <div className="glass-card-solid p-4 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      {previewUrl?(
        <div className={`bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200 transition-all duration-300 ${previewDevice==='mobile'?'w-[390px] max-w-full':'w-full max-w-5xl'}`} style={{height:previewDevice==='mobile'?'700px':'720px'}}>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"/>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
            <p className="text-[10px] font-mono text-gray-400 truncate ml-2 flex-1">{previewUrl}</p>
          </div>
          <iframe ref={iframeRef} src={previewUrl} title="track-preview" className="w-full h-full bg-white" style={{height:'calc(100% - 32px)'}}/>
        </div>
      ):(
        <div className="py-16 text-center"><Eye size={40} className="mx-auto text-gray-300 mb-3"/><p className="text-sm text-gray-500">{t('storePage.noStoreSlug','Store slug not set — save your store first to preview')}</p></div>
      )}
    </div>
  </>);

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold">{t('storePage.trackingOrders','Tracking Orders')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('storePage.trackingUnifiedDesc','Shipments, settings, and buyer preview — all in one place')}</p>
      </div>
      {tab==='shipments'&&<button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>{t('storePage.refresh','Refresh')}</button>}
    </div>

    {/* Tab bar */}
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit max-w-full overflow-x-auto">
      {[
        {k:'shipments',icon:Truck,label:t('storePage.shipmentsTab','Shipments')},
        {k:'settings',icon:SettingsIcon,label:t('storePage.settingsTab','Settings')},
        {k:'statuses',icon:Tag,label:t('storePage.statusesTab','Status Management')},
        {k:'preview',icon:Eye,label:t('storePage.previewTab','Buyer Preview')},
      ].map(x=>{const Icon=x.icon;return(
        <button key={x.k} onClick={()=>setTab(x.k)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap ${tab===x.k?'bg-white shadow text-brand-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={14}/>{x.label}</button>
      );})}
    </div>

    {tab==='shipments'&&shipmentsTab()}
    {tab==='settings'&&settingsTab()}
    {tab==='statuses'&&statusesTab()}
    {tab==='preview'&&previewTab()}

    {renderModal()}
  </DashboardLayout>);
}
