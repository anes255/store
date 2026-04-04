import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Package,MapPin,RefreshCw,ExternalLink,Clock,Check,X,AlertTriangle,ArrowLeft,Phone,User,ChevronRight,Box,Home,RotateCcw} from'lucide-react';

const STEPS=[
  {key:'awaiting_pickup',label:'Awaiting Pickup',icon:Box},
  {key:'picked_up',label:'Picked Up',icon:Package},
  {key:'at_center',label:'At Center',icon:Home},
  {key:'in_transit',label:'In Transit',icon:Truck},
  {key:'out_for_delivery',label:'Out for Delivery',icon:MapPin},
  {key:'delivered',label:'Delivered',icon:Check},
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
    try{const{data}=await api.get(`/manage/stores/${currentStore.id}/track/${selectedOrder.tracking_number}`);setTrackingData(data);toast.success('Updated');}
    catch{toast.error('Failed');}
    setTrackingLoading(false);
  };

  const tracked=orders.filter(o=>o.tracking_number).length;
  const untracked=orders.filter(o=>!o.tracking_number&&o.status==='shipped').length;
  const delivered=orders.filter(o=>o.status==='delivered').length;

  // ═══════════════════════════════════
  // DETAIL VIEW — delivery step tracker
  // ═══════════════════════════════════
  if(selectedOrder){
    const currentStatus=trackingData?.status||selectedOrder.tracking_status||'in_transit';
    const stepIdx=getStepIndex(currentStatus);
    const isFailed=FAIL_STATUSES.includes(currentStatus);

    return(<DashboardLayout>
      <button onClick={()=>{setSelectedOrder(null);setTrackingData(null);}} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 font-medium"><ArrowLeft size={16}/>Back to Tracking Orders</button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="font-mono text-brand-600">{selectedOrder.order_number}</span>
            <span className="text-gray-300">—</span>
            <span>{selectedOrder.customer_name}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {selectedOrder.company_name||'No delivery company'} {selectedOrder.tracking_number&&<span className="font-mono bg-gray-100 px-2 py-0.5 rounded ml-2">#{selectedOrder.tracking_number}</span>}
          </p>
        </div>
        {selectedOrder.tracking_number&&<button onClick={refreshTracking} disabled={trackingLoading} className="btn-primary text-sm flex items-center gap-2"><RefreshCw size={14} className={trackingLoading?'animate-spin':''}/>Refresh</button>}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Customer</p>
          <p className="font-bold text-gray-900 flex items-center gap-2 text-sm"><User size={14} className="text-gray-400"/>{selectedOrder.customer_name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Phone size={12} className="text-gray-400"/>{selectedOrder.customer_phone}</p>
        </div>
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Destination</p>
          <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/>{selectedOrder.shipping_wilaya||'—'}</p>
          {trackingData?.destination&&<p className="text-sm text-gray-500 mt-1">{trackingData.destination}</p>}
        </div>
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Delivery Partner</p>
          <p className="font-bold text-gray-900 flex items-center gap-2 text-sm"><Truck size={14} className="text-gray-400"/>{selectedOrder.company_name||'Not assigned'}</p>
          {trackingData?.has_api&&<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">LIVE API</span>}
          {!trackingData?.has_api&&selectedOrder.tracking_number&&<span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">MANUAL</span>}
        </div>
      </div>

      {!selectedOrder.tracking_number?(
        <div className="glass-card-solid p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4"/>
          <p className="text-lg font-bold text-gray-700">No tracking number assigned</p>
          <p className="text-sm text-gray-400 mt-2">Go to <span className="font-bold">Orders</span> → click this order → assign a tracking number</p>
        </div>
      ):trackingLoading&&!trackingData?(
        <div className="glass-card-solid p-16 text-center"><div className="w-10 h-10 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/><p className="text-sm text-gray-400 mt-4">Fetching from {selectedOrder.company_name||'delivery partner'}...</p></div>
      ):(
        <>
          {/* ═══ DELIVERY STEP PIPELINE ═══ */}
          <div className="glass-card-solid p-8 mb-6">
            <h3 className="font-bold text-gray-800 mb-8 text-lg">Delivery Progress</h3>

            {isFailed?(
              <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center">
                <RotateCcw size={40} className="mx-auto text-red-500 mb-3"/>
                <p className="text-xl font-bold text-red-700 capitalize">{currentStatus.replace(/_/g,' ')}</p>
                <p className="text-sm text-red-500 mt-2">{trackingData?.raw_status||'The delivery was unsuccessful'}</p>
              </div>
            ):(
              <div className="relative">
                {/* Background line */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full"/>
                {/* Progress fill */}
                <div className="absolute top-5 left-5 h-1 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-1000" style={{width:`calc(${Math.max(0,(stepIdx/(STEPS.length-1))*100)}% - 40px)`}}/>

                <div className="relative flex justify-between">
                  {STEPS.map((step,i)=>{
                    const Icon=step.icon;
                    const done=i<=stepIdx;
                    const active=i===stepIdx;
                    return(
                      <div key={step.key} className="flex flex-col items-center" style={{width:`${100/STEPS.length}%`}}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          active?'bg-brand-500 text-white shadow-lg scale-125 ring-4 ring-brand-100':
                          done?'bg-emerald-500 text-white':'bg-white border-2 border-gray-300 text-gray-400'
                        }`}>
                          {done&&!active?<Check size={16}/>:<Icon size={16}/>}
                        </div>
                        <p className={`text-[11px] font-bold mt-3 text-center ${active?'text-brand-600':done?'text-emerald-600':'text-gray-400'}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current status */}
          <div className="glass-card-solid p-5 mb-6 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isFailed?'bg-red-100':stepIdx>=5?'bg-emerald-100':'bg-brand-100'}`}>
              {isFailed?<RotateCcw size={24} className="text-red-600"/>:stepIdx>=5?<Check size={24} className="text-emerald-600"/>:<Truck size={24} className="text-brand-600"/>}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900 capitalize">{trackingData?.raw_status||currentStatus.replace(/_/g,' ')}</p>
              <p className="text-sm text-gray-500">via {trackingData?.company||selectedOrder.company_name} • {trackingData?.provider||'manual'} tracking</p>
            </div>
            {trackingData?.last_update&&<p className="text-xs text-gray-400 shrink-0">{new Date(trackingData.last_update).toLocaleString()}</p>}
          </div>

          {/* API error */}
          {trackingData?.api_error&&<div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6 flex items-center gap-3"><AlertTriangle size={18} className="text-amber-600 shrink-0"/><p className="text-sm text-amber-700">{trackingData.error}</p></div>}

          {/* External tracking link for manual */}
          {trackingData?.tracking_url&&!trackingData?.has_api&&(
            <a href={trackingData.tracking_url} target="_blank" rel="noopener noreferrer" className="glass-card-solid p-4 mb-6 flex items-center gap-3 hover:shadow-lg transition-all">
              <ExternalLink size={18} className="text-brand-500"/><div className="flex-1"><p className="font-bold text-sm text-gray-800">Track on {selectedOrder.company_name}</p><p className="text-xs text-gray-400 truncate">{trackingData.tracking_url}</p></div><ChevronRight size={16} className="text-gray-400"/>
            </a>
          )}

          {/* History Timeline */}
          {trackingData?.history&&trackingData.history.length>0&&(
            <div className="glass-card-solid p-6">
              <h3 className="font-bold text-gray-800 mb-5">Tracking History</h3>
              <div className="space-y-0">
                {trackingData.history.map((h,i)=>(
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${i===0?'bg-brand-500 ring-4 ring-brand-100':'bg-gray-300'}`}/>
                      {i<trackingData.history.length-1&&<div className="w-0.5 flex-1 bg-gray-200 my-1"/>}
                    </div>
                    <div className="pb-5">
                      <p className={`font-semibold text-sm ${i===0?'text-gray-900':'text-gray-600'}`}>{h.status||h.label||h.note||JSON.stringify(h)}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {h.location&&<p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10}/>{h.location}</p>}
                        {h.date&&<p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/>{new Date(h.date).toLocaleString()}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>);
  }

  // ═══════════════════
  // LIST VIEW
  // ═══════════════════
  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Tracking Orders</h1><p className="text-sm text-gray-400 mt-1">Track shipments with delivery partners</p></div>
      <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>Refresh</button>
    </div>

    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Total Shipped</p><p className="text-2xl font-black text-gray-900 mt-1">{orders.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">With Tracking</p><p className="text-2xl font-black text-emerald-600 mt-1">{tracked}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-amber-500 uppercase">No Tracking</p><p className="text-2xl font-black text-amber-600 mt-1">{untracked}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-brand-500 uppercase">Delivered</p><p className="text-2xl font-black text-brand-600 mt-1">{delivered}</p></div>
    </div>

    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {[{k:'all',l:'All'},{k:'tracked',l:'With Tracking'},{k:'untracked',l:'No Tracking'}].map(f=>(
        <button key={f.k} onClick={()=>setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter===f.k?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
      ))}
      <div className="relative flex-1 max-w-xs ml-auto"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search orders or tracking..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No shipped orders found</p><p className="text-sm text-gray-400 mt-1">Orders appear here once marked as shipped</p></div>
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
                  {o.tracking_number?<p className="font-mono text-xs text-gray-500">{o.tracking_number}</p>:<span className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">No tracking</span>}
                  <p className="text-sm font-bold text-gray-800 mt-1">{parseFloat(o.total).toLocaleString()} DZD</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0"/>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </DashboardLayout>);
}
