import React,{useState,useEffect} from'react';import{useTranslation}from'react-i18next';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Package,MapPin,RefreshCw,ExternalLink,Clock,Check,X,AlertTriangle,ArrowLeft,Phone,User,ChevronRight,Box,Home,RotateCcw} from'lucide-react';

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

export default function TrackingOrders(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[orders,setOrders]=useState([]);const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState('all');const[search,setSearch]=useState('');
  const[selectedOrder,setSelectedOrder]=useState(null);
  const[trackingData,setTrackingData]=useState(null);const[trackingLoading,setTrackingLoading]=useState(false);

  const load=()=>{if(!currentStore?.id)return;
    let url=`/manage/stores/${currentStore.id}/tracking-orders`;
    if(filter==='tracked')url+='?status=tracked';
    else if(filter==='untracked')url+='?status=untracked';
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

  // ═══════════════════
  // LIST VIEW + MODAL
  // ═══════════════════
  const renderModal=()=>{
    if(!selectedOrder)return null;
    const currentStatus=trackingData?.status||selectedOrder.tracking_status||'in_transit';
    const stepIdx=getStepIndex(currentStatus);
    const isFailed=FAIL_STATUSES.includes(currentStatus);
    return(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>{setSelectedOrder(null);setTrackingData(null);}}>
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
          {/* Header */}
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
            {/* Info row */}
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
                {/* AliExpress-style step pipeline */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6">{t('storePage.deliveryProgress','Delivery Progress')}</h3>
                  {isFailed?(
                    <div className="p-5 bg-red-50 rounded-2xl text-center"><RotateCcw size={32} className="mx-auto text-red-500 mb-2"/><p className="font-bold text-red-700 capitalize">{currentStatus.replace(/_/g,' ')}</p></div>
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

                {/* Current status bar */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isFailed?'bg-red-100':stepIdx>=5?'bg-emerald-100':'bg-brand-100'}`}>
                    {isFailed?<RotateCcw size={18} className="text-red-600"/>:stepIdx>=5?<Check size={18} className="text-emerald-600"/>:<Truck size={18} className="text-brand-600"/>}
                  </div>
                  <div className="flex-1"><p className="font-bold text-sm text-gray-900 capitalize">{trackingData?.raw_status||currentStatus.replace(/_/g,' ')}</p><p className="text-xs text-gray-500">{t('storePage.via','via')} {trackingData?.company||selectedOrder.company_name}</p></div>
                  {trackingData?.last_update&&<p className="text-[10px] text-gray-400">{new Date(trackingData.last_update).toLocaleString()}</p>}
                </div>

                {trackingData?.tracking_url&&!trackingData?.has_api&&(
                  <a href={trackingData.tracking_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <ExternalLink size={16} className="text-blue-500"/><p className="text-sm font-bold text-blue-700 flex-1">{t('storePage.trackOn','Track on')} {selectedOrder.company_name}</p><ChevronRight size={14} className="text-blue-400"/>
                  </a>
                )}

                {/* Timeline */}
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

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">{t('storePage.trackingOrders','Tracking Orders')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.trackShipmentsDesc','Track shipments with delivery partners')}</p></div>
      <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>{t('storePage.refresh','Refresh')}</button>
    </div>

    <div className="grid grid-cols-4 gap-4 mb-6">
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
                      isFailed?'bg-red-50 text-red-700':st==='delivered'?'bg-emerald-50 text-emerald-700':'bg-cyan-50 text-cyan-700'}`}>{st.replace(/_/g,' ')}</span>}
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
    {renderModal()}
  </DashboardLayout>);
}
