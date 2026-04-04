import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Plus,X,Trash2,Edit,Package,RefreshCw,Check,Zap,Globe,Wifi,WifiOff,Link2}from'lucide-react';

const EMPTY_FORM={name:'',base_rate:'',phone:'',provider_type:'manual',api_base_url:'',api_auth_type:'none',api_key:'',api_headers:{},api_tracking_endpoint:'',api_status_path:'',tracking_url:''};

const PRESETS=[
  {name:'Yalidine',api_base_url:'https://api.yalidine.app/v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/parcels/?tracking={tracking_number}',api_status_path:'data.0.last_status',headerKeys:['X-API-ID','X-API-TOKEN'],hint:'Get your API ID and Token from your Yalidine dashboard → API section'},
  {name:'ZR Express',api_base_url:'https://api.zrexpress.com/api',api_auth_type:'bearer',api_tracking_endpoint:'/shipment/tracking/{tracking_number}',api_status_path:'data.current_status',hint:'Get your API token from ZR Express dashboard'},
  {name:'Maystro Delivery',api_base_url:'https://api.maystro-delivery.com/api/v1',api_auth_type:'bearer',api_tracking_endpoint:'/tracking/{tracking_number}',api_status_path:'data.status',hint:'Get your token from Maystro dashboard'},
  {name:'NOEST',api_base_url:'https://api.noest.dz/v1',api_auth_type:'bearer',api_tracking_endpoint:'/parcels/track/{tracking_number}',api_status_path:'data.status',hint:'Contact NOEST for API access'},
];

export default function ShippingPartners(){
  const{currentStore}=useStoreManagement();
  const[companies,setCompanies]=useState([]);const[loading,setLoading]=useState(true);
  const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({...EMPTY_FORM});
  const[search,setSearch]=useState('');const[testing,setTesting]=useState(null);

  const load=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const save=async()=>{
    if(!form.name)return toast.error('Company name required');
    const payload={...form,api_headers:form.api_headers||{}};
    if(form.provider_type==='manual'){payload.api_base_url='';payload.api_tracking_endpoint='';payload.api_auth_type='none';}
    try{
      if(editing){await api.put(`/manage/stores/${currentStore.id}/delivery-companies/${editing.id}`,payload);toast.success('Updated!');}
      else{await api.post(`/manage/stores/${currentStore.id}/delivery-companies`,payload);toast.success('Added!');}
      setShowModal(false);setEditing(null);setForm({...EMPTY_FORM});load();
    }catch{toast.error('Failed');}
  };

  const del=async(id)=>{if(!confirm('Remove this company?'))return;try{await api.delete(`/manage/stores/${currentStore.id}/delivery-companies/${id}`);toast.success('Removed');load();}catch{toast.error('Failed');}};

  const openEdit=(c)=>{
    const headers=typeof c.api_headers==='string'?JSON.parse(c.api_headers||'{}'):(c.api_headers||{});
    setEditing(c);setForm({name:c.name,base_rate:c.base_rate||'',phone:c.phone||'',provider_type:c.api_base_url?'api':'manual',
      api_base_url:c.api_base_url||'',api_auth_type:c.api_auth_type||'none',api_key:c.api_key||'',api_headers:headers,
      api_tracking_endpoint:c.api_tracking_endpoint||'',api_status_path:c.api_status_path||'',tracking_url:c.tracking_url||''});
    setShowModal(true);
  };

  const applyPreset=(p)=>{
    const headers={};
    if(p.headerKeys)p.headerKeys.forEach(k=>{headers[k]='';});
    setForm({...form,name:form.name||p.name,provider_type:'api',api_base_url:p.api_base_url,api_auth_type:p.api_auth_type,
      api_tracking_endpoint:p.api_tracking_endpoint,api_status_path:p.api_status_path,api_headers:headers});
    toast.success(`${p.name} config loaded — fill in your credentials`);
  };

  const testConnection=async(id)=>{
    setTesting(id);
    try{const{data}=await api.post(`/manage/stores/${currentStore.id}/delivery-companies/${id}/test`,{});
      if(data.ok)toast.success(data.message);else toast.error(data.error||'Test failed');
    }catch{toast.error('Connection test failed');}
    setTesting(null);
  };

  const setHeader=(key,val)=>{setForm({...form,api_headers:{...form.api_headers,[key]:val}});};
  const addHeader=()=>{setForm({...form,api_headers:{...form.api_headers,['']:''}}); };
  const removeHeader=(key)=>{const h={...form.api_headers};delete h[key];setForm({...form,api_headers:h});};

  const filtered=companies.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));
  const withApi=companies.filter(c=>c.api_base_url).length;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Shipping Partners</h1><p className="text-sm text-gray-400 mt-1">Add any delivery company and connect their API for live tracking</p></div>
      <button onClick={()=>{setEditing(null);setForm({...EMPTY_FORM});setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>Add Company</button>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Partners</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">API Connected</p><p className="text-2xl font-black text-emerald-600 mt-1">{withApi}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Avg Base Rate</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length?Math.round(companies.reduce((s,c)=>s+parseFloat(c.base_rate||0),0)/companies.length):0} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
    </div>

    <div className="relative max-w-sm mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{search?'No matching companies':'No delivery companies yet'}</p><p className="text-sm text-gray-400 mt-1">Add any delivery company — Yalidine, ZR Express, EcoTrack, or your own</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg">{c.name}</p>
                  {c.api_base_url?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={8}/>API</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">MANUAL</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {parseFloat(c.base_rate)>0&&<span className="flex items-center gap-1"><Package size={12}/>{c.base_rate} DZD</span>}
                  {c.phone&&<span>{c.phone}</span>}
                  {c.api_base_url&&<span className="text-xs text-gray-400 truncate max-w-[200px]">{c.api_base_url}</span>}
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
      <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">{editing?'Edit Company':'Add Delivery Company'}</h2><button onClick={()=>setShowModal(false)}><X size={20}/></button></div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div><label className="input-label">Company Name *</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Any company name..."/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="input-label">Base Rate (DZD)</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
          <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0555123456"/></div>
        </div>

        {/* Integration Type */}
        <div className="border-t pt-4">
          <label className="input-label">Tracking Integration</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button onClick={()=>setForm({...form,provider_type:'manual'})} className={`p-3 rounded-xl border-2 text-left ${form.provider_type==='manual'?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-2"><WifiOff size={16} className={form.provider_type==='manual'?'text-brand-500':'text-gray-400'}/><span className="font-bold text-sm">Manual</span></div>
              <p className="text-[10px] text-gray-400 mt-1">Track via external link or manually</p>
            </button>
            <button onClick={()=>setForm({...form,provider_type:'api'})} className={`p-3 rounded-xl border-2 text-left ${form.provider_type==='api'?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-2"><Zap size={16} className={form.provider_type==='api'?'text-brand-500':'text-gray-400'}/><span className="font-bold text-sm">Connect API</span></div>
              <p className="text-[10px] text-gray-400 mt-1">Live tracking via company's API</p>
            </button>
          </div>
        </div>

        {/* Manual — just tracking URL */}
        {form.provider_type==='manual'&&(
          <div><label className="input-label">Tracking URL (optional)</label><input className="input-field text-sm" value={form.tracking_url} onChange={e=>setForm({...form,tracking_url:e.target.value})} placeholder="https://tracking.company.com/track/{tracking_number}"/><p className="text-[10px] text-gray-400 mt-1">Use {'{tracking_number}'} as placeholder. Opens in new tab.</p></div>
        )}

        {/* API Configuration */}
        {form.provider_type==='api'&&(
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            {/* Quick presets */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Quick Setup (auto-fills config)</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p=><button key={p.name} onClick={()=>applyPreset(p)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-brand-400 hover:text-brand-600">{p.name}</button>)}
              </div>
            </div>

            <div><label className="text-[10px] font-bold text-gray-500">API Base URL *</label><input className="input-field text-sm font-mono" value={form.api_base_url} onChange={e=>setForm({...form,api_base_url:e.target.value})} placeholder="https://api.example.com/v1"/></div>

            <div><label className="text-[10px] font-bold text-gray-500">Auth Type</label>
              <select className="input-field text-sm" value={form.api_auth_type} onChange={e=>setForm({...form,api_auth_type:e.target.value})}>
                <option value="none">No Authentication</option>
                <option value="bearer">Bearer Token</option>
                <option value="custom_headers">Custom Headers</option>
              </select>
            </div>

            {form.api_auth_type==='bearer'&&(
              <div><label className="text-[10px] font-bold text-gray-500">API Token</label><input className="input-field text-sm font-mono" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})} placeholder="your-api-token-here"/></div>
            )}

            {form.api_auth_type==='custom_headers'&&(
              <div>
                <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-gray-500">Custom Headers</label><button onClick={addHeader} className="text-[10px] text-brand-600 font-bold hover:underline">+ Add Header</button></div>
                {Object.entries(form.api_headers).map(([key,val],i)=>(
                  <div key={i} className="flex gap-2 mt-1">
                    <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder="Header-Name" value={key} onChange={e=>{const h={...form.api_headers};delete h[key];h[e.target.value]=val;setForm({...form,api_headers:h});}}/>
                    <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder="value" value={val} onChange={e=>setHeader(key,e.target.value)}/>
                    <button onClick={()=>removeHeader(key)} className="p-1 text-red-400 hover:text-red-600"><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            <div><label className="text-[10px] font-bold text-gray-500">Tracking Endpoint *</label><input className="input-field text-sm font-mono" value={form.api_tracking_endpoint} onChange={e=>setForm({...form,api_tracking_endpoint:e.target.value})} placeholder="/parcels/?tracking={tracking_number}"/><p className="text-[10px] text-gray-400 mt-1">Use {'{tracking_number}'} as placeholder</p></div>

            <div><label className="text-[10px] font-bold text-gray-500">Status Path in Response (optional)</label><input className="input-field text-sm font-mono" value={form.api_status_path} onChange={e=>setForm({...form,api_status_path:e.target.value})} placeholder="data.0.last_status"/><p className="text-[10px] text-gray-400 mt-1">Dot-notation path to the status field in the JSON response</p></div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5"><button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button><button onClick={save} className="btn-primary flex-1">{editing?'Update':'Add'} Company</button></div>
    </div></div>}
  </DashboardLayout>);
}
