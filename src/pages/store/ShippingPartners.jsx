import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Plus,X,Trash2,Edit,Package,RefreshCw,Check,Wifi,WifiOff,ChevronDown}from'lucide-react';

const KNOWN_COMPANIES=[
  {name:'Yalidine',logo:'Y',color:'from-yellow-500 to-orange-500',api_base_url:'https://api.yalidine.app/v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/parcels/?tracking={tracking_number}',api_status_path:'data.0.last_status',headers:['X-API-ID','X-API-TOKEN'],help:'Go to yalidine.app → Dashboard → API → copy your API ID and API Token'},
  {name:'ZR Express',logo:'Z',color:'from-blue-500 to-cyan-500',api_base_url:'https://api.zrexpress.com/api',api_auth_type:'bearer',api_tracking_endpoint:'/shipment/tracking/{tracking_number}',api_status_path:'data.current_status',headers:[],help:'Go to zrexpress.com → Dashboard → Settings → API → copy your token'},
  {name:'Maystro Delivery',logo:'M',color:'from-purple-500 to-pink-500',api_base_url:'https://api.maystro-delivery.com/api/v1',api_auth_type:'bearer',api_tracking_endpoint:'/tracking/{tracking_number}',api_status_path:'data.status',headers:[],help:'Contact Maystro support for API access'},
  {name:'NOEST',logo:'N',color:'from-green-500 to-emerald-500',api_base_url:'https://api.noest.dz/v1',api_auth_type:'bearer',api_tracking_endpoint:'/parcels/track/{tracking_number}',api_status_path:'data.status',headers:[],help:'Contact NOEST for API credentials'},
  {name:'EcoTrack',logo:'E',color:'from-teal-500 to-green-500',api_base_url:'',api_auth_type:'bearer',api_tracking_endpoint:'',api_status_path:'',headers:[],help:'Contact EcoTrack for API details'},
];

const EMPTY={name:'',base_rate:'',phone:'',tracking_url:'',api_base_url:'',api_auth_type:'none',api_key:'',api_headers:{},api_tracking_endpoint:'',api_status_path:''};

export default function ShippingPartners(){
  const{currentStore}=useStoreManagement();
  const[companies,setCompanies]=useState([]);const[loading,setLoading]=useState(true);
  const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({...EMPTY});
  const[search,setSearch]=useState('');const[testing,setTesting]=useState(null);
  const[step,setStep]=useState('pick'); // pick, manual, api
  const[showAdvanced,setShowAdvanced]=useState(false);

  const load=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const save=async()=>{
    if(!form.name)return toast.error('Company name required');
    const payload={...form,provider_type:form.api_base_url?'api':'manual',api_headers:form.api_headers||{}};
    try{
      if(editing){await api.put(`/manage/stores/${currentStore.id}/delivery-companies/${editing.id}`,payload);toast.success('Updated!');}
      else{await api.post(`/manage/stores/${currentStore.id}/delivery-companies`,payload);toast.success('Added!');}
      setShowModal(false);setEditing(null);setForm({...EMPTY});setStep('pick');load();
    }catch{toast.error('Failed');}
  };

  const del=async(id)=>{if(!confirm('Remove this company?'))return;try{await api.delete(`/manage/stores/${currentStore.id}/delivery-companies/${id}`);toast.success('Removed');load();}catch{toast.error('Failed');}};

  const openEdit=(c)=>{
    const headers=typeof c.api_headers==='string'?JSON.parse(c.api_headers||'{}'):(c.api_headers||{});
    setEditing(c);setForm({name:c.name,base_rate:c.base_rate||'',phone:c.phone||'',tracking_url:c.tracking_url||'',
      api_base_url:c.api_base_url||'',api_auth_type:c.api_auth_type||'none',api_key:c.api_key||'',api_headers:headers,
      api_tracking_endpoint:c.api_tracking_endpoint||'',api_status_path:c.api_status_path||''});
    setStep(c.api_base_url?'api':'manual');setShowModal(true);
  };

  const pickKnown=(k)=>{
    const h={};if(k.headers)k.headers.forEach(key=>{h[key]='';});
    setForm({...EMPTY,name:k.name,api_base_url:k.api_base_url,api_auth_type:k.api_auth_type,
      api_tracking_endpoint:k.api_tracking_endpoint,api_status_path:k.api_status_path,api_headers:h});
    setStep('api');
  };

  const testConnection=async(id)=>{
    setTesting(id);
    try{const{data}=await api.post(`/manage/stores/${currentStore.id}/delivery-companies/${id}/test`,{});
      if(data.ok)toast.success(data.message);else toast.error(data.error||'Test failed');
    }catch{toast.error('Connection failed');}
    setTesting(null);
  };

  const filtered=companies.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Shipping Partners</h1><p className="text-sm text-gray-400 mt-1">Add your delivery companies</p></div>
      <button onClick={()=>{setEditing(null);setForm({...EMPTY});setStep('pick');setShowAdvanced(false);setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>Add Company</button>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Partners</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">API Connected</p><p className="text-2xl font-black text-emerald-600 mt-1">{companies.filter(c=>c.api_base_url).length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Avg Rate</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length?Math.round(companies.reduce((s,c)=>s+parseFloat(c.base_rate||0),0)/companies.length):0} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
    </div>

    {search||null&&<div className="relative max-w-sm mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>}

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No delivery companies yet</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg">{c.name}</p>
                  {c.api_base_url?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={8}/>LIVE TRACKING</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">MANUAL</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {parseFloat(c.base_rate)>0&&<span><Package size={12} className="inline mr-1"/>{c.base_rate} DZD</span>}
                  {c.phone&&<span>{c.phone}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {c.api_base_url&&<button onClick={()=>testConnection(c.id)} disabled={testing===c.id} className="p-2.5 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-500" title="Test API">{testing===c.id?<div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"/>:<RefreshCw size={16}/>}</button>}
                <button onClick={()=>openEdit(c)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-500"><Edit size={16}/></button>
                <button onClick={()=>del(c.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ═══ ADD/EDIT MODAL ═══ */}
    {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>

      {/* STEP 1: Pick company type */}
      {step==='pick'&&!editing&&<>
        <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">Add Delivery Company</h2><button onClick={()=>setShowModal(false)}><X size={20}/></button></div>

        <p className="text-sm text-gray-500 mb-4">Choose a company with built-in tracking, or add any company manually.</p>

        <div className="space-y-2 mb-4">
          {KNOWN_COMPANIES.map(k=>(
            <button key={k.name} onClick={()=>pickKnown(k)} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-4 transition-all">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>{k.logo}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-400">Auto-configured live tracking — just paste your credentials</p>
              </div>
              <Wifi size={16} className="text-emerald-500 shrink-0"/>
            </button>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <button onClick={()=>{setForm({...EMPTY});setStep('manual');}} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-4 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg shrink-0"><Truck size={20}/></div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Other Company</p>
              <p className="text-xs text-gray-400">Add any delivery company manually</p>
            </div>
            <WifiOff size={16} className="text-gray-400 shrink-0"/>
          </button>
        </div>
      </>}

      {/* STEP 2a: Known company — just ask for credentials */}
      {step==='api'&&<>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{editing?'Edit':'Setup'} {form.name||'Company'}</h2>
          <button onClick={()=>setShowModal(false)}><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div><label className="input-label">Company Name</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">Base Rate (DZD)</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
            <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0555123456"/></div>
          </div>

          {/* Credentials — simplified based on auth type */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2"><Wifi size={14}/>API Credentials</p>

            {form.api_auth_type==='custom_headers'?(
              <div className="space-y-3">
                {Object.entries(form.api_headers).map(([key],i)=>(
                  <div key={i}>
                    <label className="text-xs font-bold text-emerald-700">{key}</label>
                    <input className="input-field font-mono text-sm" placeholder={`Paste your ${key}`} value={form.api_headers[key]||''} onChange={e=>setForm({...form,api_headers:{...form.api_headers,[key]:e.target.value}})}/>
                  </div>
                ))}
              </div>
            ):(
              <div>
                <label className="text-xs font-bold text-emerald-700">API Token</label>
                <input className="input-field font-mono text-sm" placeholder="Paste your API token here" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})}/>
              </div>
            )}

            {/* Find the matching known company for help text */}
            {KNOWN_COMPANIES.filter(k=>k.name===form.name).map(k=>(
              <p key={k.name} className="text-xs text-emerald-600 mt-2">💡 {k.help}</p>
            ))}
          </div>

          {/* Advanced toggle */}
          <button onClick={()=>setShowAdvanced(!showAdvanced)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
            <ChevronDown size={12} className={showAdvanced?'rotate-180':''}/> Advanced API settings
          </button>

          {showAdvanced&&(
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl text-sm">
              <div><label className="text-[10px] font-bold text-gray-500">API Base URL</label><input className="input-field font-mono text-xs" value={form.api_base_url} onChange={e=>setForm({...form,api_base_url:e.target.value})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Tracking Endpoint</label><input className="input-field font-mono text-xs" value={form.api_tracking_endpoint} onChange={e=>setForm({...form,api_tracking_endpoint:e.target.value})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Status Path</label><input className="input-field font-mono text-xs" value={form.api_status_path} onChange={e=>setForm({...form,api_status_path:e.target.value})}/></div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          {!editing&&<button onClick={()=>setStep('pick')} className="btn-ghost flex-1">Back</button>}
          {editing&&<button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>}
          <button onClick={save} className="btn-primary flex-1">{editing?'Update':'Add'} Company</button>
        </div>
      </>}

      {/* STEP 2b: Manual company */}
      {step==='manual'&&<>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{editing?'Edit':'Add'} Company</h2>
          <button onClick={()=>setShowModal(false)}><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div><label className="input-label">Company Name *</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Company name"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">Base Rate (DZD)</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
            <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0555123456"/></div>
          </div>
          <div><label className="input-label">Tracking URL (optional)</label><input className="input-field text-sm" value={form.tracking_url} onChange={e=>setForm({...form,tracking_url:e.target.value})} placeholder="https://company.com/track/{tracking_number}"/><p className="text-[10px] text-gray-400 mt-1">Use {'{tracking_number}'} where the number goes. Opens in a new tab for your customers.</p></div>
        </div>

        <div className="flex gap-3 mt-5">
          {!editing&&<button onClick={()=>setStep('pick')} className="btn-ghost flex-1">Back</button>}
          {editing&&<button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>}
          <button onClick={save} className="btn-primary flex-1">{editing?'Update':'Add'} Company</button>
        </div>
      </>}

    </div></div>}
  </DashboardLayout>);
}
