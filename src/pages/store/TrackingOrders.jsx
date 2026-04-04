import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Package,MapPin,RefreshCw,ExternalLink,Clock,Check,X,AlertTriangle,Eye} from'lucide-react';

const trackingStatusConfig={
  in_transit:{color:'bg-cyan-500',bg:'bg-cyan-50',text:'text-cyan-700',label:'In Transit'},
  at_center:{color:'bg-blue-500',bg:'bg-blue-50',text:'text-blue-700',label:'At Center'},
  out_for_delivery:{color:'bg-purple-500',bg:'bg-purple-50',text:'text-purple-700',label:'Out for Delivery'},
  delivered:{color:'bg-emerald-500',bg:'bg-emerald-50',text:'text-emerald-700',label:'Delivered'},
  delivery_failed:{color:'bg-red-500',bg:'bg-red-50',text:'text-red-700',label:'Failed'},
  returned:{color:'bg-gray-500',bg:'bg-gray-50',text:'text-gray-700',label:'Returned'},
  preparing:{color:'bg-amber-500',bg:'bg-amber-50',text:'text-amber-700',label:'Preparing'},
};

export default function TrackingOrders(){
  const{currentStore}=useStoreManagement();
  const[orders,setOrders]=useState([]);const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState('all');const[search,setSearch]=useState('');
  const[selectedTracking,setSelectedTracking]=useState(null);const[trackingData,setTrackingData]=useState(null);
  const[trackingLoading,setTrackingLoading]=useState(false);

  const load=()=>{if(!currentStore?.id)return;
    let url=`/manage/stores/${currentStore.id}/tracking-orders`;
    if(filter==='tracked')url+='?status=tracked';
    else if(filter==='untracked')url+='?status=untracked';
    api.get(url).then(r=>setOrders(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[currentStore?.id,filter]);

  const filtered=orders.filter(o=>{if(!search)return true;const s=search.toLowerCase();
    return(o.order_number||'').toLowerCase().includes(s)||(o.customer_name||'').toLowerCase().includes(s)||(o.tracking_number||'').toLowerCase().includes(s);});

  const fetchTracking=async(tn)=>{
    setTrackingLoading(true);setTrackingData(null);setSelectedTracking(tn);
    try{const{data}=await api.get(`/manage/stores/${currentStore.id}/track/${tn}`);setTrackingData(data);}
    catch(e){toast.error('Tracking lookup failed');setTrackingData({error:e.response?.data?.error||e.message});}
    setTrackingLoading(false);
  };

  const tracked=orders.filter(o=>o.tracking_number).length;
  const untracked=orders.filter(o=>!o.tracking_number&&o.status==='shipped').length;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Tracking Orders</h1><p className="text-sm text-gray-400 mt-1">Track shipments with delivery partners</p></div>
      <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>Refresh</button>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Total Shipped</p><p className="text-2xl font-black text-gray-900 mt-1">{orders.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">With Tracking</p><p className="text-2xl font-black text-emerald-600 mt-1">{tracked}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-amber-500 uppercase">No Tracking</p><p className="text-2xl font-black text-amber-600 mt-1">{untracked}</p></div>
    </div>

    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {[{k:'all',l:'All'},{k:'tracked',l:'With Tracking'},{k:'untracked',l:'No Tracking'}].map(f=>(
        <button key={f.k} onClick={()=>setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter===f.k?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
      ))}
      <div className="relative flex-1 max-w-xs ml-auto"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search orders or tracking..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No shipped orders found</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(o=>{
          const ts=trackingStatusConfig[o.tracking_status]||trackingStatusConfig.in_transit;
          return(
            <div key={o.id} className="glass-card-solid p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${o.tracking_number?ts.bg:'bg-gray-100'} flex items-center justify-center shrink-0`}>
                  {o.tracking_number?<Truck size={20} className={ts.text}/>:<AlertTriangle size={20} className="text-gray-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-brand-600">{o.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.status==='delivered'?'bg-emerald-50 text-emerald-700':'bg-cyan-50 text-cyan-700'}`}>{o.status}</span>
                    {o.tracking_number&&<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ts.bg} ${ts.text}`}>{ts.label}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{o.customer_name}</span>
                    {o.shipping_wilaya&&<span className="flex items-center gap-1"><MapPin size={12}/>{o.shipping_wilaya}</span>}
                    {o.company_name&&<span className="flex items-center gap-1"><Truck size={12}/>{o.company_name}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {o.tracking_number?(
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-700">{o.tracking_number}</p>
                      <button onClick={()=>fetchTracking(o.tracking_number)} className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1 ml-auto mt-1"><Eye size={12}/>Live Status</button>
                    </div>
                  ):(
                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">No tracking</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Tracking Detail Modal */}
    {selectedTracking&&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>{setSelectedTracking(null);setTrackingData(null);}}>
        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Tracking: {selectedTracking}</h2>
            <button onClick={()=>{setSelectedTracking(null);setTrackingData(null);}} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
          </div>

          {trackingLoading?<div className="py-12 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/><p className="text-sm text-gray-400 mt-3">Fetching from delivery partner...</p></div>:trackingData?.error?(
            <div className="p-4 bg-red-50 rounded-xl"><p className="text-sm text-red-600">{trackingData.error}</p></div>
          ):trackingData?(
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-xl ${(trackingStatusConfig[trackingData.status]||{}).bg||'bg-gray-100'} flex items-center justify-center`}>
                  <Truck size={18} className={(trackingStatusConfig[trackingData.status]||{}).text||'text-gray-500'}/>
                </div>
                <div>
                  <p className="font-bold text-sm capitalize">{(trackingData.raw_status||trackingData.status||'').replace(/_/g,' ')}</p>
                  <p className="text-xs text-gray-400">via {trackingData.company||trackingData.provider}</p>
                </div>
              </div>

              {trackingData.wilaya&&<div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14}/>{trackingData.destination}, {trackingData.wilaya}</div>}

              {trackingData.history&&trackingData.history.length>0&&(
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">History</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trackingData.history.map((h,i)=>(
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center"><div className={`w-2.5 h-2.5 rounded-full ${i===0?'bg-brand-500':'bg-gray-300'}`}/>{i<trackingData.history.length-1&&<div className="w-0.5 flex-1 bg-gray-200 mt-1"/>}</div>
                        <div className="pb-3"><p className="font-medium text-gray-700">{h.status||h.note||h.label||JSON.stringify(h)}</p>{h.date&&<p className="text-xs text-gray-400">{new Date(h.date).toLocaleString()}</p>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trackingData.last_update&&<p className="text-xs text-gray-400">Last updated: {new Date(trackingData.last_update).toLocaleString()}</p>}
            </div>
          ):null}
        </div>
      </div>
    )}
  </DashboardLayout>);
}
