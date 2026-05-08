import React,{useState,useEffect} from'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi}from'../../utils/api';
import api from'../../utils/api';
import toast from'react-hot-toast';
import{Tag,Search,Save,Package,Plus,Trash2,Check,X,Percent}from'lucide-react';

export default function StoreOffers(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const[selectedIds,setSelectedIds]=useState(new Set());
  const[mode,setMode]=useState('all');
  const[form,setForm]=useState({is_on_sale:true,sale_badge_text:'SALE',offer_title:'',offer_discount:'',offer_hours:'',offer_minutes:'',quantity_offers:[]});
  const[saving,setSaving]=useState(false);

  const load=()=>{if(!currentStore?.id)return;setLoading(true);productApi.getAll(currentStore.id,{}).then(r=>setProducts(r.data.products||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const filtered=products.filter(p=>!search||(p.name_en||p.name||'').toLowerCase().includes(search.toLowerCase()));
  const toggleSelect=(id)=>setSelectedIds(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});
  const selectAll=()=>setSelectedIds(new Set(filtered.map(p=>p.id)));
  const clearSelection=()=>setSelectedIds(new Set());

  const applyOffer=async()=>{
    const targets=mode==='all'?products:products.filter(p=>selectedIds.has(p.id));
    if(!targets.length){toast.error('No products selected');return;}
    setSaving(true);
    let ok=0;
    for(const p of targets){
      try{
        await productApi.update(currentStore.id,p.id,{
          is_on_sale:form.is_on_sale,
          sale_badge_text:form.sale_badge_text,
          offer_title:form.offer_title,
          offer_discount:form.offer_discount,
          offer_hours:form.offer_hours,
          offer_minutes:form.offer_minutes,
          quantity_offers:form.quantity_offers,
        });
        ok++;
      }catch{}
    }
    setSaving(false);
    toast.success(`Offer applied to ${ok}/${targets.length} products`);
    load();
  };

  const removeOffer=async()=>{
    const targets=mode==='all'?products:products.filter(p=>selectedIds.has(p.id));
    if(!targets.length){toast.error('No products selected');return;}
    setSaving(true);
    let ok=0;
    for(const p of targets){
      try{
        await productApi.update(currentStore.id,p.id,{is_on_sale:false,sale_badge_text:'',offer_title:'',offer_discount:'',offer_hours:'',offer_minutes:'',quantity_offers:[]});
        ok++;
      }catch{}
    }
    setSaving(false);
    toast.success(`Offer removed from ${ok} products`);
    load();
  };

  const onSaleCount=products.filter(p=>p.is_on_sale).length;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Tag size={22} className="text-red-500"/>{t('storePage.offersTitle','Offers & Sales')}</h1>
      <p className="text-sm text-gray-400 mt-1">{t('storePage.offersSubtitle','Apply sale badges, countdown timers, and quantity offers to products')}</p></div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">Total Products</p><p className="text-2xl font-black">{products.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-red-500 font-bold">On Sale</p><p className="text-2xl font-black text-red-600">{onSaleCount}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">Not on Sale</p><p className="text-2xl font-black text-gray-600">{products.length-onSaleCount}</p></div>
    </div>

    <div className="glass-card-solid p-5 mb-6 space-y-4">
      <h2 className="text-sm font-black uppercase text-gray-500 tracking-wider">Configure Offer</h2>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mode" checked={mode==='all'} onChange={()=>setMode('all')} className="w-4 h-4"/><span className="text-sm font-bold">All products</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mode" checked={mode==='specific'} onChange={()=>setMode('specific')} className="w-4 h-4"/><span className="text-sm font-bold">Specific products</span></label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className="text-[10px] text-gray-400 font-bold uppercase">Sale Badge</label><input className="input-field !py-1.5 text-xs" placeholder="SALE" value={form.sale_badge_text} onChange={e=>setForm({...form,sale_badge_text:e.target.value})}/></div>
        <div><label className="text-[10px] text-gray-400 font-bold uppercase">Discount Text</label><input className="input-field !py-1.5 text-xs" placeholder="40% OFF" value={form.offer_discount} onChange={e=>setForm({...form,offer_discount:e.target.value})}/></div>
        <div><label className="text-[10px] text-gray-400 font-bold uppercase">Timer Hours</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="15" value={form.offer_hours} onChange={e=>setForm({...form,offer_hours:e.target.value})}/></div>
        <div><label className="text-[10px] text-gray-400 font-bold uppercase">Timer Minutes</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="33" value={form.offer_minutes} onChange={e=>setForm({...form,offer_minutes:e.target.value})}/></div>
      </div>
      <div><label className="text-[10px] text-gray-400 font-bold uppercase">Offer Title</label><input className="input-field !py-1.5 text-xs" placeholder="Limited Offer" value={form.offer_title} onChange={e=>setForm({...form,offer_title:e.target.value})}/></div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity Offers</label>
          <button type="button" onClick={()=>setForm({...form,quantity_offers:[...(form.quantity_offers||[]),{quantity:'',label:''}]})} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Plus size={12}/>Add</button>
        </div>
        <div className="space-y-2">
          {(form.quantity_offers||[]).map((qo,qi)=>(
            <div key={qi} className="grid grid-cols-[80px,1fr,32px] gap-2 items-center">
              <input type="number" min="1" placeholder="Qty" value={qo.quantity||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],quantity:e.target.value};setForm({...form,quantity_offers:n});}} className="input-field !py-1.5 text-xs text-center"/>
              <input placeholder="e.g. 20% OFF, Free shipping" value={qo.label||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],label:e.target.value};setForm({...form,quantity_offers:n});}} className="input-field !py-1.5 text-xs"/>
              <button type="button" onClick={()=>setForm({...form,quantity_offers:form.quantity_offers.filter((_,i)=>i!==qi)})} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={applyOffer} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"><Tag size={14}/>{saving?'Applying...':'Apply Offer'}</button>
        <button onClick={removeOffer} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm text-red-600 disabled:opacity-50"><X size={14}/>Remove Offer</button>
      </div>
    </div>

    {mode==='specific'&&<>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={selectAll} className="btn-ghost text-xs">Select All</button>
        {selectedIds.size>0&&<button onClick={clearSelection} className="btn-ghost text-xs text-red-600">Clear ({selectedIds.size})</button>}
      </div>

      {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:
      <div className="glass-card-solid overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase"><th className="p-3 w-8"></th><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">On Sale</th><th className="p-3">Badge</th></tr></thead><tbody>{filtered.map(p=>(
        <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50 ${selectedIds.has(p.id)?'bg-brand-50/50':''}`}>
          <td className="p-3"><button onClick={()=>toggleSelect(p.id)}>{selectedIds.has(p.id)?<Check size={16} className="text-brand-600"/>:<div className="w-4 h-4 rounded border border-gray-300"/>}</button></td>
          <td className="p-3"><div className="flex items-center gap-3">{p.thumbnail?<img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover"/>:<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-300"/></div>}<p className="font-medium text-gray-800">{p.name_en||p.name}</p></div></td>
          <td className="p-3 font-bold">{parseFloat(p.price).toLocaleString()} DZD</td>
          <td className="p-3">{p.is_on_sale?<span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">ON SALE</span>:<span className="text-xs text-gray-400">No</span>}</td>
          <td className="p-3"><span className="text-xs text-gray-500">{p.sale_badge_text||'—'}</span></td>
        </tr>
      ))}</tbody></table></div>}
    </>}
  </DashboardLayout>);
}
