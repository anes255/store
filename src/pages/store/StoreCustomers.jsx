import React,{useState,useEffect,useRef} from'react';import{useTranslation}from'react-i18next';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Users,Download,Upload,Plus,Phone,X,User,ShoppingBag,MapPin,Mail,Calendar,ArrowLeft,Loader2,ChevronDown}from'lucide-react';
import WILAYA_CITIES from'../../data/wilayaCities';
const WILAYAS=Object.keys(WILAYA_CITIES).sort((a,b)=>a.localeCompare(b));

// Build a CSV string from customer rows (RFC-4180 quoting)
const CSV_COLS=['name','phone','email','address','city','wilaya','total_orders','total_spent'];
const csvCell=(v)=>{const s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const toCsv=(rows)=>[CSV_COLS.join(',')].concat(rows.map(c=>CSV_COLS.map(k=>csvCell(k==='name'?(c.name||c.full_name):c[k])).join(','))).join('\n');
// Minimal CSV line parser handling quoted fields
const parseCsvLine=(line)=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}else{if(ch==='"')q=true;else if(ch===',')  {out.push(cur);cur='';}else cur+=ch;}}out.push(cur);return out;};

export default function StoreCustomers(){
  const{t}=useTranslation();const{currentStore}=useStoreManagement();
  const[customers,setCustomers]=useState([]);const[search,setSearch]=useState('');const[filter,setFilter]=useState('all');const[loading,setLoading]=useState(true);
  const[selectedCustomer,setSelectedCustomer]=useState(null);const[customerOrders,setCustomerOrders]=useState([]);const[loadingDetail,setLoadingDetail]=useState(false);
  const[addOpen,setAddOpen]=useState(false);const[addForm,setAddForm]=useState({name:'',phone:'',email:'',address:'',city:'',wilaya:''});const[addSaving,setAddSaving]=useState(false);
  const[selected,setSelected]=useState(()=>new Set());const[importing,setImporting]=useState(false);const fileRef=useRef(null);

  const loadCustomers=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/customers`,{params:{search}}).then(r=>setCustomers(Array.isArray(r.data)?r.data:[])).catch(()=>setCustomers([])).finally(()=>setLoading(false));};
  useEffect(()=>{loadCustomers();},[currentStore?.id,search]);

  const filtered=customers.filter(c=>{if(filter==='vip')return c.total_spent>5000;if(filter==='repeat')return c.total_orders>1;if(filter==='new')return c.total_orders<=1;if(filter==='inactive')return!c.is_active;return true;});

  // ── Selection ──
  const toggleOne=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const allShownSelected=filtered.length>0&&filtered.every(c=>selected.has(c.id));
  const toggleAll=()=>setSelected(s=>{if(allShownSelected)return new Set();return new Set(filtered.map(c=>c.id));});

  const openDetail=async(c)=>{
    setSelectedCustomer(c);setLoadingDetail(true);
    try{const r=await api.get(`/manage/stores/${currentStore.id}/customers/${c.id}/orders`);setCustomerOrders(Array.isArray(r.data)?r.data:[]);}
    catch{setCustomerOrders([]);}
    setLoadingDetail(false);
  };

  // ── Export (selected, or all shown if none selected) ──
  const doExport=()=>{
    const rows=selected.size?filtered.filter(c=>selected.has(c.id)):filtered;
    if(!rows.length){toast.error(t('storePage.nothingToExport','Nothing to export'));return;}
    const blob=new Blob(['﻿'+toCsv(rows)],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`customers-${currentStore?.slug||'store'}.csv`;a.click();URL.revokeObjectURL(url);
    toast.success(t('storePage.exported','Exported {{n}} customers').replace('{{n}}',rows.length));
  };

  // ── Import from CSV ──
  const doImport=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;e.target.value='';
    setImporting(true);
    try{
      const text=await file.text();
      const lines=text.split(/\r?\n/).filter(l=>l.trim());
      if(!lines.length)throw new Error('empty');
      const header=parseCsvLine(lines[0]).map(h=>h.trim().toLowerCase());
      const idx=(name)=>header.indexOf(name);
      const hasHeader=idx('phone')!==-1||idx('name')!==-1;
      const col={name:idx('name'),phone:idx('phone'),email:idx('email'),address:idx('address'),city:idx('city'),wilaya:idx('wilaya')};
      const dataLines=hasHeader?lines.slice(1):lines;
      let ok=0,fail=0;
      for(const line of dataLines){
        const f=parseCsvLine(line);
        const rec=hasHeader
          ?{name:f[col.name]?.trim(),phone:f[col.phone]?.trim(),email:f[col.email]?.trim(),address:f[col.address]?.trim(),city:f[col.city]?.trim(),wilaya:f[col.wilaya]?.trim()}
          :{name:f[0]?.trim(),phone:f[1]?.trim(),email:f[2]?.trim(),address:f[3]?.trim(),city:f[4]?.trim(),wilaya:f[5]?.trim()};
        if(!rec.name||!rec.phone){fail++;continue;}
        try{await api.post(`/manage/stores/${currentStore.id}/customers`,rec);ok++;}catch{fail++;}
      }
      toast.success(t('storePage.imported','Imported {{ok}} customers ({{fail}} skipped)').replace('{{ok}}',ok).replace('{{fail}}',fail));
      loadCustomers();
    }catch(err){toast.error(t('storePage.importFailed','Import failed — check the CSV format'));}
    setImporting(false);
  };

  const addCustomer=async()=>{
    if(!addForm.name.trim()||!addForm.phone.trim()){toast.error(t('storePage.namePhoneRequired','Name and phone are required'));return;}
    setAddSaving(true);
    try{await api.post(`/manage/stores/${currentStore.id}/customers`,addForm);toast.success(t('storePage.customerAdded','Customer added'));setAddOpen(false);setAddForm({name:'',phone:'',email:'',address:'',city:'',wilaya:''});loadCustomers();}
    catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}
    setAddSaving(false);
  };

  return(<DashboardLayout>
<input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={doImport}/>
<div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">{t('storePage.customers','Customers')}</h1><div className="flex gap-2"><button onClick={doExport} className="btn-ghost text-xs flex items-center gap-1"><Download size={14}/>{t('storePage.export','Export')}{selected.size?` (${selected.size})`:''}</button><button onClick={()=>fileRef.current?.click()} disabled={importing} className="btn-ghost text-xs flex items-center gap-1">{importing?<Loader2 size={14} className="animate-spin"/>:<Upload size={14}/>}{t('storePage.import','Import')}</button><button onClick={()=>setAddOpen(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={14}/>{t('storePage.addCustomer','Add customer')}</button></div></div>
<div className="flex items-center gap-4 mb-4"><div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9" placeholder={t('storePage.searchCustomers','Search customers...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
<div className="flex gap-1">{[['all',t('storePage.all','all')],['VIP',t('storePage.vip','VIP')],['Repeat',t('storePage.repeat','Repeat')],['New',t('storePage.new','New')],['Inactive',t('storePage.inactive','Inactive')]].map(([f,label])=>(<button key={f} onClick={()=>setFilter(f.toLowerCase())} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter===f.toLowerCase()?'bg-brand-500 text-white':'text-gray-500 hover:bg-gray-100'}`}>{label}</button>))}</div></div>
{selected.size>0&&<div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold"><span>{t('storePage.nSelected','{{n}} selected').replace('{{n}}',selected.size)}</span><button onClick={doExport} className="flex items-center gap-1 text-xs underline"><Download size={13}/>{t('storePage.exportSelected','Export selected')}</button><button onClick={()=>setSelected(new Set())} className="text-xs underline">{t('storePage.clear','Clear')}</button></div>}
<div className="glass-card-solid overflow-hidden">
{loading?<div className="p-12 text-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?<div className="p-12 text-center"><Users size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500">{t('storePage.noCustomersFound','No customers found')}</p></div>:(
<table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase"><th className="px-4 py-3 w-10"><input type="checkbox" checked={allShownSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-brand-500 cursor-pointer"/></th><th className="px-4 py-3">{t('storePage.customerName','Customer Name')}</th><th className="px-4 py-3">{t('storePage.phone','Phone')}</th><th className="px-4 py-3">{t('storePage.location','Location')}</th><th className="px-4 py-3">{t('storePage.orders','Orders')}</th><th className="px-4 py-3">{t('storePage.totalSpent','Total Spent')}</th></tr></thead>
<tbody>{filtered.map(c=>(<tr key={c.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${selected.has(c.id)?'bg-brand-50/50':''}`}><td className="px-4 py-3" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={()=>toggleOne(c.id)} className="w-4 h-4 rounded accent-brand-500 cursor-pointer"/></td><td className="px-4 py-3 cursor-pointer" onClick={()=>openDetail(c)}><div><p className="font-semibold text-gray-800">{c.name||c.full_name}</p><p className="text-xs text-gray-400">{c.email||'—'}</p></div></td><td className="px-4 py-3 text-gray-600 cursor-pointer" onClick={()=>openDetail(c)}><span className="flex items-center gap-1">{c.phone} <Phone size={12} className="text-green-500"/></span></td><td className="px-4 py-3 text-gray-500 cursor-pointer" onClick={()=>openDetail(c)}>{c.city||c.wilaya||t('storePage.unknown','Unknown')}</td><td className="px-4 py-3 cursor-pointer" onClick={()=>openDetail(c)}>{c.total_orders||0} {t('storePage.orders','orders')}</td><td className="px-4 py-3 font-bold cursor-pointer" onClick={()=>openDetail(c)}>{parseFloat(c.total_spent||0).toLocaleString()} DZD</td></tr>))}</tbody></table>)}
</div>

{/* Customer Detail Modal */}
{selectedCustomer&&(
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>setSelectedCustomer(null)}>
<div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
  <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">{(selectedCustomer.name||selectedCustomer.full_name||'?')[0].toUpperCase()}</div><div><h2 className="font-bold text-gray-900">{selectedCustomer.name||selectedCustomer.full_name}</h2><p className="text-xs text-gray-400">{selectedCustomer.email||t('storePage.noEmail','No email')}</p></div></div>
    <button onClick={()=>setSelectedCustomer(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button>
  </div>
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.phone','Phone')}</p><p className="text-sm font-semibold flex items-center gap-1.5 mt-1"><Phone size={12} className="text-green-500"/>{selectedCustomer.phone}</p></div>
      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.location','Location')}</p><p className="text-sm font-semibold flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-gray-400"/>{selectedCustomer.city||selectedCustomer.wilaya||'—'}</p></div>
      <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-[10px] font-bold text-emerald-600 uppercase">{t('storePage.totalSpent','Total Spent')}</p><p className="text-lg font-black text-emerald-700">{parseFloat(selectedCustomer.total_spent||0).toLocaleString()} DZD</p></div>
      <div className="p-3 bg-blue-50 rounded-xl"><p className="text-[10px] font-bold text-blue-600 uppercase">{t('storePage.orders','Orders')}</p><p className="text-lg font-black text-blue-700">{selectedCustomer.total_orders||0}</p></div>
    </div>
    {selectedCustomer.address&&<div className="p-3 bg-gray-50 rounded-xl"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.address','Address')}</p><p className="text-sm mt-1">{selectedCustomer.address}</p></div>}
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.recentOrders','Recent Orders')}</p>
      {loadingDetail?<div className="py-6 text-center"><Loader2 size={20} className="animate-spin mx-auto text-gray-400"/></div>:customerOrders.length===0?<p className="text-sm text-gray-400 text-center py-4">{t('storePage.noOrdersYet','No orders yet')}</p>:(
      <div className="space-y-2 max-h-72 overflow-y-auto">{customerOrders.slice(0,20).map(o=>(
        <div key={o.id} className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold">{o.order_number||`#${o.id}`}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div>
            <div className="text-right"><p className="text-sm font-bold">{parseFloat(o.total||0).toLocaleString()} DZD</p><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200">{(o.status||'').replace(/_/g,' ')}</span></div>
          </div>
          {Array.isArray(o.items)&&o.items.length>0&&(
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
            {o.items.map((it,i)=>(
            <div key={i} className="flex items-center gap-2">
              {it.image?<img src={it.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-white border border-gray-200"/>:<div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><ShoppingBag size={13} className="text-gray-400"/></div>}
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 truncate">{it.product_name||t('storePage.product','Product')}</p>{it.variant_info&&<p className="text-[10px] text-gray-400 truncate">{typeof it.variant_info==='string'?it.variant_info:Object.values(it.variant_info||{}).join(' / ')}</p>}</div>
              <span className="text-xs text-gray-500 whitespace-nowrap">×{it.quantity||1}</span>
            </div>))}
          </div>)}
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
    <input className="input-field" placeholder={t('storePage.namePlaceholder','Name *')} value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})}/>
    <input className="input-field" placeholder={t('storePage.phonePlaceholder','Phone *')} value={addForm.phone} onChange={e=>setAddForm({...addForm,phone:e.target.value})}/>
    <input className="input-field" placeholder={t('storePage.emailPlaceholder','Email')} value={addForm.email} onChange={e=>setAddForm({...addForm,email:e.target.value})}/>
    <select className="input-field" value={addForm.wilaya} onChange={e=>setAddForm({...addForm,wilaya:e.target.value,city:''})}>
      <option value="">{t('checkout.selectWilaya','Select Wilaya')}</option>
      {WILAYAS.map(w=><option key={w} value={w}>{w}</option>)}
    </select>
    <select className="input-field" value={addForm.city} onChange={e=>setAddForm({...addForm,city:e.target.value})} disabled={!addForm.wilaya}>
      <option value="">{t('checkout.selectCity','Select City')}</option>
      {(WILAYA_CITIES[addForm.wilaya]||[]).map(c=><option key={c} value={c}>{c}</option>)}
    </select>
    <input className="input-field" placeholder={t('storePage.address','Address')} value={addForm.address} onChange={e=>setAddForm({...addForm,address:e.target.value})}/>
  </div>
  <div className="flex gap-2 justify-end mt-4">
    <button onClick={()=>setAddOpen(false)} className="btn-ghost px-4 py-2 text-sm">{t('storePage.cancel','Cancel')}</button>
    <button onClick={addCustomer} disabled={addSaving} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">{addSaving?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>}{t('storePage.add','Add')}</button>
  </div>
</div></div>)}

</DashboardLayout>);}
