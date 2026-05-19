import React,{useState,useEffect} from'react';import{useTranslation}from'react-i18next';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Users,Download,Upload,Plus,Phone,X,User,ShoppingBag,MapPin,Mail,Calendar,ArrowLeft,Loader2}from'lucide-react';

export default function StoreCustomers(){
  const{t}=useTranslation();const{currentStore}=useStoreManagement();
  const[customers,setCustomers]=useState([]);const[search,setSearch]=useState('');const[filter,setFilter]=useState('all');const[loading,setLoading]=useState(true);
  const[selectedCustomer,setSelectedCustomer]=useState(null);const[customerOrders,setCustomerOrders]=useState([]);const[loadingDetail,setLoadingDetail]=useState(false);
  const[addOpen,setAddOpen]=useState(false);const[addForm,setAddForm]=useState({name:'',phone:'',email:'',address:'',city:'',wilaya:''});const[addSaving,setAddSaving]=useState(false);

  const loadCustomers=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/customers`,{params:{search}}).then(r=>setCustomers(Array.isArray(r.data)?r.data:[])).catch(()=>setCustomers([])).finally(()=>setLoading(false));};
  useEffect(()=>{loadCustomers();},[currentStore?.id,search]);

  const filtered=customers.filter(c=>{if(filter==='vip')return c.total_spent>5000;if(filter==='repeat')return c.total_orders>1;if(filter==='new')return c.total_orders<=1;if(filter==='inactive')return!c.is_active;return true;});

  const openDetail=async(c)=>{
    setSelectedCustomer(c);setLoadingDetail(true);
    try{const r=await api.get(`/manage/stores/${currentStore.id}/customers/${c.id}/orders`);setCustomerOrders(Array.isArray(r.data)?r.data:[]);}
    catch{setCustomerOrders([]);}
    setLoadingDetail(false);
  };

  const addCustomer=async()=>{
    if(!addForm.name.trim()||!addForm.phone.trim()){toast.error('Name and phone are required');return;}
    setAddSaving(true);
    try{await api.post(`/manage/stores/${currentStore.id}/customers`,addForm);toast.success('Customer added');setAddOpen(false);setAddForm({name:'',phone:'',email:'',address:'',city:'',wilaya:''});loadCustomers();}
    catch(e){toast.error(e.response?.data?.error||'Failed');}
    setAddSaving(false);
  };

  return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">{t('storePage.customers','Customers')}</h1><div className="flex gap-2"><button className="btn-ghost text-xs flex items-center gap-1"><Download size={14}/>{t('storePage.export','Export')}</button><button className="btn-ghost text-xs flex items-center gap-1"><Upload size={14}/>{t('storePage.import','Import')}</button><button onClick={()=>setAddOpen(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={14}/>{t('storePage.addCustomer','Add customer')}</button></div></div>
<div className="flex items-center gap-4 mb-4"><div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9" placeholder={t('storePage.searchCustomers','Search customers...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
<div className="flex gap-1">{[['all',t('storePage.all','all')],['VIP',t('storePage.vip','VIP')],['Repeat',t('storePage.repeat','Repeat')],['New',t('storePage.new','New')],['Inactive',t('storePage.inactive','Inactive')]].map(([f,label])=>(<button key={f} onClick={()=>setFilter(f.toLowerCase())} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter===f.toLowerCase()?'bg-brand-500 text-white':'text-gray-500 hover:bg-gray-100'}`}>{label}</button>))}</div></div>
<div className="glass-card-solid overflow-hidden">
{loading?<div className="p-12 text-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?<div className="p-12 text-center"><Users size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500">{t('storePage.noCustomersFound','No customers found')}</p></div>:(
<table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase"><th className="px-4 py-3">{t('storePage.customerName','Customer Name')}</th><th className="px-4 py-3">{t('storePage.status','Status')}</th><th className="px-4 py-3">{t('storePage.phone','Phone')}</th><th className="px-4 py-3">{t('storePage.location','Location')}</th><th className="px-4 py-3">{t('storePage.orders','Orders')}</th><th className="px-4 py-3">{t('storePage.totalSpent','Total Spent')}</th></tr></thead>
<tbody>{filtered.map(c=>(<tr key={c.id} onClick={()=>openDetail(c)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"><td className="px-4 py-3"><div><p className="font-semibold text-gray-800">{c.name||c.full_name}</p><p className="text-xs text-gray-400">{c.email||'—'}</p></div></td><td className="px-4 py-3"><span className={`badge text-[10px] ${c.total_orders>3?'badge-warning':c.total_orders>1?'badge-info':'badge-success'}`}>{c.total_orders>3?t('storePage.vip','VIP'):c.total_orders>1?t('storePage.repeat','Repeat'):t('storePage.new','New')}</span></td><td className="px-4 py-3 text-gray-600"><span className="flex items-center gap-1">{c.phone} <Phone size={12} className="text-green-500"/></span></td><td className="px-4 py-3 text-gray-500">{c.city||c.wilaya||t('storePage.unknown','Unknown')}</td><td className="px-4 py-3">{c.total_orders||0} {t('storePage.orders','orders')}</td><td className="px-4 py-3 font-bold">{parseFloat(c.total_spent||0).toLocaleString()} DZD</td></tr>))}</tbody></table>)}
</div>

{/* Customer Detail Modal */}
{selectedCustomer&&(
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>setSelectedCustomer(null)}>
<div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
  <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">{(selectedCustomer.name||selectedCustomer.full_name||'?')[0].toUpperCase()}</div><div><h2 className="font-bold text-gray-900">{selectedCustomer.name||selectedCustomer.full_name}</h2><p className="text-xs text-gray-400">{selectedCustomer.email||'No email'}</p></div></div>
    <button onClick={()=>setSelectedCustomer(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button>
  </div>
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p><p className="text-sm font-semibold flex items-center gap-1.5 mt-1"><Phone size={12} className="text-green-500"/>{selectedCustomer.phone}</p></div>
      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Location</p><p className="text-sm font-semibold flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-gray-400"/>{selectedCustomer.city||selectedCustomer.wilaya||'—'}</p></div>
      <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-[10px] font-bold text-emerald-600 uppercase">Total Spent</p><p className="text-lg font-black text-emerald-700">{parseFloat(selectedCustomer.total_spent||0).toLocaleString()} DZD</p></div>
      <div className="p-3 bg-blue-50 rounded-xl"><p className="text-[10px] font-bold text-blue-600 uppercase">Orders</p><p className="text-lg font-black text-blue-700">{selectedCustomer.total_orders||0}</p></div>
    </div>
    {selectedCustomer.address&&<div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Address</p><p className="text-sm mt-1">{selectedCustomer.address}</p></div>}
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Recent Orders</p>
      {loadingDetail?<div className="py-6 text-center"><Loader2 size={20} className="animate-spin mx-auto text-gray-400"/></div>:customerOrders.length===0?<p className="text-sm text-gray-400 text-center py-4">No orders yet</p>:(
      <div className="space-y-2 max-h-60 overflow-y-auto">{customerOrders.slice(0,20).map(o=>(
        <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div><p className="text-sm font-bold">{o.order_number||`#${o.id}`}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div>
          <div className="text-right"><p className="text-sm font-bold">{parseFloat(o.total||0).toLocaleString()} DZD</p><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200">{(o.status||'').replace(/_/g,' ')}</span></div>
        </div>
      ))}</div>)}
    </div>
  </div>
</div></div>)}

{/* Add Customer Modal */}
{addOpen&&(
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>setAddOpen(false)}>
<div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
  <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{t('storePage.addCustomer','Add Customer')}</h2><button onClick={()=>setAddOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button></div>
  <div className="space-y-3">
    <input className="input-field" placeholder="Name *" value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})}/>
    <input className="input-field" placeholder="Phone *" value={addForm.phone} onChange={e=>setAddForm({...addForm,phone:e.target.value})}/>
    <input className="input-field" placeholder="Email" value={addForm.email} onChange={e=>setAddForm({...addForm,email:e.target.value})}/>
    <input className="input-field" placeholder="Wilaya" value={addForm.wilaya} onChange={e=>setAddForm({...addForm,wilaya:e.target.value})}/>
    <input className="input-field" placeholder="City" value={addForm.city} onChange={e=>setAddForm({...addForm,city:e.target.value})}/>
    <input className="input-field" placeholder="Address" value={addForm.address} onChange={e=>setAddForm({...addForm,address:e.target.value})}/>
  </div>
  <div className="flex gap-2 justify-end mt-4">
    <button onClick={()=>setAddOpen(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
    <button onClick={addCustomer} disabled={addSaving} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">{addSaving?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>}Add</button>
  </div>
</div></div>)}

</DashboardLayout>);}
