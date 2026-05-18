import React,{useState,useEffect} from'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi,ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Tag,Search,Package,Plus,Trash2,Check,X,ChevronDown,ChevronUp,Edit2,Percent,Ticket}from'lucide-react';

const EMPTY_OFFER={name:'',is_on_sale:true,sale_badge_text:'SALE',offer_title:'',offer_discount:'',offer_hours:'',offer_minutes:'',quantity_offers:[],mode:'all',selectedIds:new Set(),expanded:true};

export default function StoreOffers(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const[offers,setOffers]=useState([{...EMPTY_OFFER,name:'Offer 1'}]);
  const[saving,setSaving]=useState(false);
  const[coupons,setCoupons]=useState([{active:false,code:'',discount:''}]);
  const[couponSaving,setCouponSaving]=useState(false);

  const load=()=>{if(!currentStore?.id)return;setLoading(true);productApi.getAll(currentStore.id,{}).then(r=>setProducts(r.data.products||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);
  useEffect(()=>{
    if(!currentStore?.id)return;
    const cfg=currentStore.config||currentStore;
    const c=[{active:!!cfg.store_coupon_active,code:cfg.store_coupon_code||'',discount:cfg.store_coupon_discount_percent||''}];
    const extra=cfg.extra_coupons;
    if(Array.isArray(extra))extra.forEach(x=>c.push({active:!!x.active,code:x.code||'',discount:x.discount||''}));
    setCoupons(c.length?c:[{active:false,code:'',discount:''}]);
  },[currentStore?.id]);
  const updateCoupon=(idx,patch)=>setCoupons(prev=>prev.map((c,i)=>i===idx?{...c,...patch}:c));
  const addCoupon=()=>setCoupons(prev=>[...prev,{active:false,code:'',discount:''}]);
  const removeCoupon=(idx)=>setCoupons(prev=>prev.filter((_,i)=>i!==idx));
  const saveCoupons=async()=>{
    if(!currentStore?.id)return;setCouponSaving(true);
    try{
      const first=coupons[0]||{};
      const extra=coupons.slice(1).filter(c=>c.code.trim());
      await ownerApi.updateStore(currentStore.id,{store_coupon_active:!!first.active,store_coupon_code:(first.code||'').toUpperCase(),store_coupon_discount_percent:parseFloat(first.discount)||0,extra_coupons:extra.map(c=>({active:!!c.active,code:(c.code||'').toUpperCase(),discount:parseFloat(c.discount)||0}))});
      toast.success('Coupons saved');
    }catch{toast.error('Failed to save coupons');}
    setCouponSaving(false);
  };

  const filtered=products.filter(p=>!search||(p.name_en||p.name||'').toLowerCase().includes(search.toLowerCase()));

  const updateOffer=(idx,patch)=>setOffers(prev=>prev.map((o,i)=>i===idx?{...o,...patch}:o));
  const toggleSelect=(offerIdx,productId)=>setOffers(prev=>prev.map((o,i)=>{if(i!==offerIdx)return o;const n=new Set(o.selectedIds);if(n.has(productId))n.delete(productId);else n.add(productId);return{...o,selectedIds:n};}));
  const selectAll=(offerIdx)=>setOffers(prev=>prev.map((o,i)=>i===offerIdx?{...o,selectedIds:new Set(filtered.map(p=>p.id))}:o));
  const clearSel=(offerIdx)=>setOffers(prev=>prev.map((o,i)=>i===offerIdx?{...o,selectedIds:new Set()}:o));
  const addOffer=()=>setOffers(prev=>[...prev,{...EMPTY_OFFER,name:`Offer ${prev.length+1}`,selectedIds:new Set()}]);
  const removeOffer=(idx)=>setOffers(prev=>prev.filter((_,i)=>i!==idx));

  const applyOffer=async(offerIdx)=>{
    const form=offers[offerIdx];
    const targets=form.mode==='all'?products:products.filter(p=>form.selectedIds.has(p.id));
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
    toast.success(`${form.name}: applied to ${ok}/${targets.length} products`);
    load();
  };

  const clearOffer=async(offerIdx)=>{
    const form=offers[offerIdx];
    const targets=form.mode==='all'?products:products.filter(p=>form.selectedIds.has(p.id));
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
      <p className="text-sm text-gray-400 mt-1">{t('storePage.offersSubtitle','Create multiple offers and apply them to all or specific products')}</p></div>
      <button onClick={addOffer} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/>New Offer</button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">Total Products</p><p className="text-2xl font-black">{products.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-red-500 font-bold">On Sale</p><p className="text-2xl font-black text-red-600">{onSaleCount}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">Not on Sale</p><p className="text-2xl font-black text-gray-600">{products.length-onSaleCount}</p></div>
    </div>

    {/* ═══ COUPON CONFIGURATION ═══ */}
    <div className="glass-card-solid p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><Ticket size={18} className="text-amber-500"/>Coupons</h3>
        <div className="flex items-center gap-2">
          <button onClick={addCoupon} className="btn-ghost text-xs flex items-center gap-1"><Plus size={12}/>Add Coupon</button>
          <button onClick={saveCoupons} disabled={couponSaving} className="btn-primary text-xs">{couponSaving?'Saving...':'Save Coupons'}</button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">Store-wide coupons apply a percentage discount to the cart subtotal. Buyer enters the code at checkout.</p>
      <div className="space-y-3">
        {coupons.map((c,ci)=>(
          <div key={ci} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input type="checkbox" checked={!!c.active} onChange={e=>updateCoupon(ci,{active:e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-amber-600"/>
              <span className="text-[10px] font-bold text-gray-500">{c.active?'ON':'OFF'}</span>
            </label>
            <input className="input-field !py-1.5 text-xs uppercase font-mono flex-1" placeholder="CODE" value={c.code} onChange={e=>updateCoupon(ci,{code:e.target.value.toUpperCase()})}/>
            <div className="flex items-center gap-1 shrink-0"><input type="number" min="0" max="100" step="0.5" className="input-field !py-1.5 text-xs !w-20 text-center" placeholder="%" value={c.discount} onChange={e=>updateCoupon(ci,{discount:e.target.value})}/><Percent size={12} className="text-gray-400"/></div>
            {coupons.length>1&&<button onClick={()=>removeCoupon(ci)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-4">
      {offers.map((form,oi)=>(
        <div key={oi} className="glass-card-solid overflow-hidden">
          {/* Offer header — collapsible */}
          <button onClick={()=>updateOffer(oi,{expanded:!form.expanded})} className="w-full px-5 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-red-500"/>
              <span className="text-sm font-black uppercase text-gray-700">{form.name||`Offer ${oi+1}`}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{form.mode==='all'?'All products':`${form.selectedIds.size} selected`}</span>
            </div>
            <div className="flex items-center gap-2">
              {offers.length>1&&<button onClick={(e)=>{e.stopPropagation();removeOffer(oi);}} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}
              {form.expanded?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
            </div>
          </button>

          {form.expanded&&<div className="p-5 space-y-4">
            {/* Offer name */}
            <div className="flex items-center gap-3">
              <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold uppercase">Offer Name</label><input className="input-field !py-1.5 text-xs" placeholder="e.g. Summer Sale" value={form.name} onChange={e=>updateOffer(oi,{name:e.target.value})}/></div>
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`mode-${oi}`} checked={form.mode==='all'} onChange={()=>updateOffer(oi,{mode:'all'})} className="w-4 h-4"/><span className="text-sm font-bold">All products</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`mode-${oi}`} checked={form.mode==='specific'} onChange={()=>updateOffer(oi,{mode:'specific'})} className="w-4 h-4"/><span className="text-sm font-bold">Specific products</span></label>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">Sale Badge</label><input className="input-field !py-1.5 text-xs" placeholder="SALE" value={form.sale_badge_text} onChange={e=>updateOffer(oi,{sale_badge_text:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">Discount Text</label><input className="input-field !py-1.5 text-xs" placeholder="40% OFF" value={form.offer_discount} onChange={e=>updateOffer(oi,{offer_discount:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">Timer Hours</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="15" value={form.offer_hours} onChange={e=>updateOffer(oi,{offer_hours:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">Timer Minutes</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="33" value={form.offer_minutes} onChange={e=>updateOffer(oi,{offer_minutes:e.target.value})}/></div>
            </div>
            <div><label className="text-[10px] text-gray-400 font-bold uppercase">Offer Title</label><input className="input-field !py-1.5 text-xs" placeholder="Limited Offer" value={form.offer_title} onChange={e=>updateOffer(oi,{offer_title:e.target.value})}/></div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity Offers</label>
                <button type="button" onClick={()=>{const qo=[...(form.quantity_offers||[]),{quantity:'',label:''}];updateOffer(oi,{quantity_offers:qo});}} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Plus size={12}/>Add</button>
              </div>
              <div className="space-y-2">
                {(form.quantity_offers||[]).map((qo,qi)=>(
                  <div key={qi} className="grid grid-cols-[80px,1fr,32px] gap-2 items-center">
                    <input type="number" min="1" placeholder="Qty" value={qo.quantity||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],quantity:e.target.value};updateOffer(oi,{quantity_offers:n});}} className="input-field !py-1.5 text-xs text-center"/>
                    <input placeholder="e.g. 20% OFF, Free shipping" value={qo.label||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],label:e.target.value};updateOffer(oi,{quantity_offers:n});}} className="input-field !py-1.5 text-xs"/>
                    <button type="button" onClick={()=>updateOffer(oi,{quantity_offers:form.quantity_offers.filter((_,i)=>i!==qi)})} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product selection table */}
            {form.mode==='specific'&&<div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <button onClick={()=>selectAll(oi)} className="btn-ghost text-xs">Select All</button>
                {form.selectedIds.size>0&&<button onClick={()=>clearSel(oi)} className="btn-ghost text-xs text-red-600">Clear ({form.selectedIds.size})</button>}
              </div>

              {loading?<div className="py-10 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase sticky top-0"><th className="p-2 w-8"></th><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">Sale</th></tr></thead><tbody>{filtered.map(p=>(
                <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50 cursor-pointer ${form.selectedIds.has(p.id)?'bg-brand-50/50':''}`} onClick={()=>toggleSelect(oi,p.id)}>
                  <td className="p-2"><button onClick={(e)=>{e.stopPropagation();toggleSelect(oi,p.id);}}>{form.selectedIds.has(p.id)?<Check size={14} className="text-brand-600"/>:<div className="w-3.5 h-3.5 rounded border border-gray-300"/>}</button></td>
                  <td className="p-2"><div className="flex items-center gap-2">{p.thumbnail?<img src={p.thumbnail} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={12} className="text-gray-300"/></div>}<span className="font-medium text-gray-800 text-xs truncate max-w-[150px]">{p.name_en||p.name}</span></div></td>
                  <td className="p-2 font-bold text-xs">{parseFloat(p.price).toLocaleString()} DZD</td>
                  <td className="p-2">{p.is_on_sale?<span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ON SALE</span>:<span className="text-[10px] text-gray-400">No</span>}</td>
                </tr>
              ))}</tbody></table></div>}
            </div>}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={()=>applyOffer(oi)} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"><Tag size={14}/>{saving?'Applying...':'Apply Offer'}</button>
              <button onClick={()=>clearOffer(oi)} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm text-red-600 disabled:opacity-50"><X size={14}/>Remove Offer</button>
            </div>
          </div>}
        </div>
      ))}
    </div>
  </DashboardLayout>);
}
