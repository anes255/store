import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Plus,X,Trash2,Edit,Phone,Globe,Package,RefreshCw,Check}from'lucide-react';

export default function ShippingPartners(){
  const{currentStore}=useStoreManagement();
  const[companies,setCompanies]=useState([]);const[loading,setLoading]=useState(true);
  const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({name:'',api_key:'',base_rate:''});
  const[search,setSearch]=useState('');

  const load=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const save=async()=>{
    if(!form.name)return toast.error('Company name required');
    try{
      if(editing){
        await api.put(`/manage/stores/${currentStore.id}/delivery-companies/${editing.id}`,form);
        toast.success('Updated!');
      }else{
        await api.post(`/manage/stores/${currentStore.id}/delivery-companies`,form);
        toast.success('Added!');
      }
      setShowModal(false);setEditing(null);setForm({name:'',api_key:'',base_rate:''});load();
    }catch{toast.error('Failed');}
  };

  const del=async(id)=>{if(!confirm('Remove this company?'))return;try{await api.delete(`/manage/stores/${currentStore.id}/delivery-companies/${id}`);toast.success('Removed');load();}catch{toast.error('Failed');}};

  const openEdit=(c)=>{setEditing(c);setForm({name:c.name,api_key:c.api_key||'',base_rate:c.base_rate||''});setShowModal(true);};

  const filtered=companies.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));
  const totalActive=companies.length;
  const avgRate=companies.length?Math.round(companies.reduce((s,c)=>s+parseFloat(c.base_rate||0),0)/companies.length):0;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">Shipping Partners</h1><p className="text-sm text-gray-400 mt-1">Manage your delivery companies</p></div>
      <button onClick={()=>{setEditing(null);setForm({name:'',api_key:'',base_rate:''});setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>Add Company</button>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Partners</p><p className="text-2xl font-black text-gray-900 mt-1">{totalActive}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Avg Base Rate</p><p className="text-2xl font-black text-gray-900 mt-1">{avgRate} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Coverage</p><p className="text-2xl font-black text-emerald-600 mt-1">58 <span className="text-xs font-normal text-gray-400">Wilayas</span></p></div>
    </div>

    <div className="relative max-w-sm mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{search?'No matching companies':'No delivery companies yet'}</p><p className="text-sm text-gray-400 mt-1">Click "Add Company" to register your shipping partners</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg">{c.name}</p>
                  {c.api_key?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check size={8}/>API LINKED</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">MANUAL</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {c.base_rate>0&&<span className="flex items-center gap-1"><Package size={12}/>{c.base_rate} DZD base rate</span>}
                  <span className="text-xs text-gray-400">Added {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={()=>openEdit(c)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-500"><Edit size={16}/></button>
                <button onClick={()=>del(c.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}><div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">{editing?'Edit Company':'Add Delivery Company'}</h2><button onClick={()=>setShowModal(false)}><X size={20}/></button></div>
      <div className="space-y-4">
        <div><label className="input-label">Company Name *</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Yalidine, NOEST, ZR Express"/></div>
        <div><label className="input-label">API Key (optional)</label><input className="input-field font-mono text-sm" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})} placeholder="Enter API key if available"/><p className="text-[10px] text-gray-400 mt-1">Leave empty for manual management</p></div>
        <div><label className="input-label">Base Rate (DZD)</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
      </div>
      <div className="flex gap-3 mt-6"><button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button><button onClick={save} className="btn-primary flex-1">{editing?'Update':'Add'} Company</button></div>
    </div></div>}
  </DashboardLayout>);
}
