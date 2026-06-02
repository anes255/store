import React,{useState,useEffect} from'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi,ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Tag,Search,Package,Plus,Trash2,Check,X,ChevronDown,ChevronUp,Edit2,Percent,Ticket,Hash,Palette,Eye,Layers,GripVertical,Sparkles,TrendingUp,Zap,Gift,Crown,Star}from'lucide-react';

const EMPTY_OFFER={name:'',is_on_sale:true,sale_badge_text:'SALE',offer_title:'',offer_discount:'',discount_type:'percent',discount_value:'',offer_hours:'',offer_minutes:'',quantity_offers:[],mode:'all',selectedIds:new Set(),expanded:true,
  // Appearance
  badge_bg:'#EF4444',badge_text_color:'#FFFFFF',badge_style:'rounded',banner_bg:'#FEF2F2',banner_text_color:'#991B1B',banner_border_color:'#FECACA',show_timer:true,timer_bg:'#1F2937',timer_text_color:'#FFFFFF'};

export default function StoreOffers(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const[offers,setOffers]=useState([{...EMPTY_OFFER,name:t('offers.offer','Offer')+' 1'}]);
  const[saving,setSaving]=useState(false);
  const[coupons,setCoupons]=useState([{active:false,code:'',discount:'',discount_type:'percent'}]);
  const[couponSaving,setCouponSaving]=useState(false);

  const reconstructOffers=(prods)=>{
    const parseQo=(p)=>{let qo=p.quantity_offers;if(typeof qo==='string'){try{qo=JSON.parse(qo);}catch{qo=[];}}return Array.isArray(qo)?qo:[];};
    const withOffer=prods.filter(p=>p.is_on_sale||parseQo(p).length>0);
    if(!withOffer.length)return;
    // Group products that share the same offer configuration into one card.
    const groups=new Map();
    withOffer.forEach(p=>{
      const qo=parseQo(p);
      const cfg={
        is_on_sale:!!p.is_on_sale,sale_badge_text:p.sale_badge_text||'SALE',offer_title:p.offer_title||'',
        offer_discount:p.offer_discount||'',discount_type:p.discount_type||'percent',discount_value:p.discount_value||'',
        offer_hours:p.offer_hours||'',offer_minutes:p.offer_minutes||'',quantity_offers:qo,
        badge_bg:p.badge_bg||'#EF4444',badge_text_color:p.badge_text_color||'#FFFFFF',badge_style:p.badge_style||'rounded',
        banner_bg:p.banner_bg||'#FEF2F2',banner_text_color:p.banner_text_color||'#991B1B',banner_border_color:p.banner_border_color||'#FECACA',
        show_timer:p.show_timer!==false,timer_bg:p.timer_bg||'#1F2937',timer_text_color:p.timer_text_color||'#FFFFFF',
      };
      const sig=JSON.stringify(cfg);
      if(!groups.has(sig))groups.set(sig,{cfg,ids:[]});
      groups.get(sig).ids.push(p.id);
    });
    const rebuilt=[...groups.values()].map((g,i)=>({
      ...EMPTY_OFFER,...g.cfg,
      name:`${t('offers.offer','Offer')} ${i+1}`,
      discount_value:g.cfg.discount_value===0?'':g.cfg.discount_value,
      mode:g.ids.length===prods.length?'all':'specific',
      selectedIds:new Set(g.ids),
      expanded:false,
    }));
    if(rebuilt.length)setOffers(rebuilt);
  };
  const load=()=>{if(!currentStore?.id)return;setLoading(true);productApi.getAll(currentStore.id,{}).then(r=>{const prods=r.data.products||[];setProducts(prods);reconstructOffers(prods);}).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);
  useEffect(()=>{
    if(!currentStore?.id)return;
    const cfg=currentStore.config||currentStore;
    const c=[{active:!!cfg.store_coupon_active,code:cfg.store_coupon_code||'',discount:cfg.store_coupon_discount_percent||'',discount_type:cfg.store_coupon_discount_type||'percent'}];
    const extra=cfg.extra_coupons;
    if(Array.isArray(extra))extra.forEach(x=>c.push({active:!!x.active,code:x.code||'',discount:x.discount||'',discount_type:x.discount_type||'percent'}));
    setCoupons(c.length?c:[{active:false,code:'',discount:'',discount_type:'percent'}]);
  },[currentStore?.id]);
  const updateCoupon=(idx,patch)=>setCoupons(prev=>prev.map((c,i)=>i===idx?{...c,...patch}:c));
  const addCoupon=()=>setCoupons(prev=>[...prev,{active:false,code:'',discount:'',discount_type:'percent'}]);
  const removeCoupon=(idx)=>setCoupons(prev=>prev.filter((_,i)=>i!==idx));
  const saveCoupons=async()=>{
    if(!currentStore?.id)return;setCouponSaving(true);
    try{
      const first=coupons[0]||{};
      const extra=coupons.slice(1).filter(c=>c.code.trim());
      await ownerApi.updateStore(currentStore.id,{
        store_coupon_active:!!first.active,
        store_coupon_code:(first.code||'').toUpperCase(),
        store_coupon_discount_percent:parseFloat(first.discount)||0,
        store_coupon_discount_type:first.discount_type||'percent',
        extra_coupons:extra.map(c=>({active:!!c.active,code:(c.code||'').toUpperCase(),discount:parseFloat(c.discount)||0,discount_type:c.discount_type||'percent'}))
      });
      toast.success(t('offers.couponsSaved','Coupons saved'));
    }catch{toast.error(t('offers.couponsFailed','Failed to save coupons'));}
    setCouponSaving(false);
  };

  const filtered=products.filter(p=>!search||(p.name_en||p.name||'').toLowerCase().includes(search.toLowerCase()));

  const updateOffer=(idx,patch)=>setOffers(prev=>prev.map((o,i)=>i===idx?{...o,...patch}:o));
  const toggleSelect=(offerIdx,productId)=>setOffers(prev=>prev.map((o,i)=>{if(i!==offerIdx)return o;const n=new Set(o.selectedIds);if(n.has(productId))n.delete(productId);else n.add(productId);return{...o,selectedIds:n};}));
  const selectAll=(offerIdx)=>setOffers(prev=>prev.map((o,i)=>i===offerIdx?{...o,selectedIds:new Set(filtered.map(p=>p.id))}:o));
  const clearSel=(offerIdx)=>setOffers(prev=>prev.map((o,i)=>i===offerIdx?{...o,selectedIds:new Set()}:o));
  const addOffer=()=>setOffers(prev=>[...prev,{...EMPTY_OFFER,name:`${t('offers.offer','Offer')} ${prev.length+1}`,selectedIds:new Set()}]);
  const removeOffer=async(idx)=>{
    // Clear offer from products via API before removing from local state
    await clearOffer(idx);
    setOffers(prev=>prev.filter((_,i)=>i!==idx));
  };

  const computeDiscountText=(form)=>{
    if(form.offer_discount)return form.offer_discount;
    if(!form.discount_value)return'';
    return form.discount_type==='fixed'?`-${form.discount_value} ${currentStore?.currency||'DZD'}`:`-${form.discount_value}%`;
  };

  const applyOffer=async(offerIdx)=>{
    const form=offers[offerIdx];
    const targets=form.mode==='all'?products:products.filter(p=>form.selectedIds.has(p.id));
    if(!targets.length){toast.error(t('offers.noProducts','No products selected'));return;}
    setSaving(true);
    let ok=0;
    for(const p of targets){
      try{
        const payload={
          is_on_sale:form.is_on_sale,
          sale_badge_text:form.sale_badge_text,
          offer_title:form.offer_title,
          offer_discount:computeDiscountText(form),
          offer_hours:form.offer_hours,
          offer_minutes:form.offer_minutes,
          quantity_offers:(form.quantity_offers||[]).map(qo=>({
            quantity:qo.quantity,
            label:qo.label||(()=>{const p=[];if(qo.discount_value)p.push(qo.discount_type==='fixed'?`-${qo.discount_value} ${currentStore?.currency||'DZD'}`:`${qo.discount_value}% OFF`);if(qo.free_shipping)p.push('Free shipping');return p.join(' + ')})(),
            discount_type:qo.discount_type||'percent',
            discount_value:qo.discount_value||'',
            free_shipping:!!qo.free_shipping,
            highlight:!!qo.highlight,
          })),
          discount_type:form.discount_type||'percent',
          discount_value:parseFloat(form.discount_value)||0,
          // Appearance
          badge_bg:form.badge_bg,badge_text_color:form.badge_text_color,badge_style:form.badge_style,
          banner_bg:form.banner_bg,banner_text_color:form.banner_text_color,banner_border_color:form.banner_border_color,
          show_timer:form.show_timer,timer_bg:form.timer_bg,timer_text_color:form.timer_text_color,
        };
        await productApi.update(currentStore.id,p.id,payload);
        ok++;
      }catch{}
    }
    setSaving(false);
    toast.success(`${form.name}: ${t('offers.appliedTo','applied to')} ${ok}/${targets.length} ${t('offers.products','products')}`);
    load();
  };

  const clearOffer=async(offerIdx)=>{
    const form=offers[offerIdx];
    const targets=form.mode==='all'?products:products.filter(p=>form.selectedIds.has(p.id));
    if(!targets.length){toast.error(t('offers.noProducts','No products selected'));return;}
    setSaving(true);
    let ok=0;
    for(const p of targets){
      try{
        await productApi.update(currentStore.id,p.id,{is_on_sale:false,sale_badge_text:'',offer_title:'',offer_discount:'',offer_hours:'',offer_minutes:'',quantity_offers:[],discount_type:'percent',discount_value:0});
        ok++;
      }catch{}
    }
    setSaving(false);
    toast.success(`${t('offers.removedFrom','Offer removed from')} ${ok} ${t('offers.products','products')}`);
    load();
  };

  const onSaleCount=products.filter(p=>p.is_on_sale).length;

  const BADGE_STYLES=[
    {value:'rounded',label:t('offers.badgeRounded','Rounded')},
    {value:'pill',label:t('offers.badgePill','Pill')},
    {value:'square',label:t('offers.badgeSquare','Square')},
    {value:'ribbon',label:t('offers.badgeRibbon','Ribbon')},
  ];

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Tag size={22} className="text-red-500"/>{t('storePage.offersTitle','Offers & Sales')}</h1>
      <p className="text-sm text-gray-400 mt-1">{t('storePage.offersSubtitle','Create multiple offers and apply them to all or specific products')}</p></div>
      <button onClick={addOffer} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/>{t('offers.newOffer','New Offer')}</button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">{t('offers.totalProducts','Total Products')}</p><p className="text-2xl font-black">{products.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-red-500 font-bold">{t('offers.onSale','On Sale')}</p><p className="text-2xl font-black text-red-600">{onSaleCount}</p></div>
      <div className="glass-card-solid p-4"><p className="text-xs text-gray-400">{t('offers.notOnSale','Not on Sale')}</p><p className="text-2xl font-black text-gray-600">{products.length-onSaleCount}</p></div>
    </div>

    {/* ═══ COUPON CONFIGURATION ═══ */}
    <div className="glass-card-solid p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><Ticket size={18} className="text-amber-500"/>{t('offers.coupons','Coupons')}</h3>
        <div className="flex items-center gap-2">
          <button onClick={addCoupon} className="btn-ghost text-xs flex items-center gap-1"><Plus size={12}/>{t('offers.addCoupon','Add Coupon')}</button>
          <button onClick={saveCoupons} disabled={couponSaving} className="btn-primary text-xs">{couponSaving?t('offers.saving','Saving...'):t('offers.saveCoupons','Save Coupons')}</button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">{t('offers.couponDesc','Store-wide coupons apply a discount to the cart subtotal. Buyer enters the code at checkout.')}</p>
      <div className="space-y-3">
        {coupons.map((c,ci)=>(
          <div key={ci} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input type="checkbox" checked={!!c.active} onChange={e=>updateCoupon(ci,{active:e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-amber-600"/>
              <span className="text-[10px] font-bold text-gray-500">{c.active?t('offers.on','ON'):t('offers.off','OFF')}</span>
            </label>
            <input className="input-field !py-1.5 text-xs uppercase font-mono flex-1 min-w-[100px]" placeholder={t('offers.codePlaceholder','CODE')} value={c.code} onChange={e=>updateCoupon(ci,{code:e.target.value.toUpperCase()})}/>
            {/* Discount type toggle */}
            <div className="flex items-center gap-1 shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={()=>updateCoupon(ci,{discount_type:'percent'})} className={`px-2 py-1.5 text-[10px] font-bold transition-colors ${c.discount_type!=='fixed'?'bg-amber-100 text-amber-700':'text-gray-400 hover:text-gray-600'}`}><Percent size={12}/></button>
              <button onClick={()=>updateCoupon(ci,{discount_type:'fixed'})} className={`px-2 py-1.5 text-[10px] font-bold transition-colors ${c.discount_type==='fixed'?'bg-amber-100 text-amber-700':'text-gray-400 hover:text-gray-600'}`}><Hash size={12}/></button>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input type="number" min="0" step="0.5" className="input-field !py-1.5 text-xs !w-20 text-center" placeholder={c.discount_type==='fixed'?t('offers.amount','Amount'):'%'} value={c.discount} onChange={e=>updateCoupon(ci,{discount:e.target.value})}/>
              <span className="text-[10px] font-bold text-gray-400">{c.discount_type==='fixed'?(currentStore?.currency||'DZD'):'%'}</span>
            </div>
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
              <span className="text-sm font-black uppercase text-gray-700">{form.name||`${t('offers.offer','Offer')} ${oi+1}`}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{form.mode==='all'?t('offers.allProducts','All products'):`${form.selectedIds.size} ${t('offers.selected','selected')}`}</span>
            </div>
            <div className="flex items-center gap-2">
              {offers.length>1&&<button onClick={(e)=>{e.stopPropagation();if(saving)return;removeOffer(oi);}} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" disabled={saving}><Trash2 size={14}/></button>}
              {form.expanded?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
            </div>
          </button>

          {form.expanded&&<div className="p-5 space-y-4">
            {/* Offer name */}
            <div className="flex items-center gap-3">
              <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.offerName','Offer Name')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('offers.offerNamePlaceholder','e.g. Summer Sale')} value={form.name} onChange={e=>updateOffer(oi,{name:e.target.value})}/></div>
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`mode-${oi}`} checked={form.mode==='all'} onChange={()=>updateOffer(oi,{mode:'all'})} className="w-4 h-4"/><span className="text-sm font-bold">{t('offers.allProducts','All products')}</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`mode-${oi}`} checked={form.mode==='specific'} onChange={()=>updateOffer(oi,{mode:'specific'})} className="w-4 h-4"/><span className="text-sm font-bold">{t('offers.specificProducts','Specific products')}</span></label>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.saleBadge','Sale Badge')}</label><input className="input-field !py-1.5 text-xs" placeholder="SALE" value={form.sale_badge_text} onChange={e=>updateOffer(oi,{sale_badge_text:e.target.value})}/></div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.discountType','Discount Type')}</label>
                <div className="flex items-center gap-1 mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={()=>updateOffer(oi,{discount_type:'percent'})} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${form.discount_type!=='fixed'?'bg-red-100 text-red-700':'text-gray-400 hover:text-gray-600'}`}><Percent size={12}/>{t('offers.percentage','Percentage')}</button>
                  <button onClick={()=>updateOffer(oi,{discount_type:'fixed'})} className={`flex-1 px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${form.discount_type==='fixed'?'bg-red-100 text-red-700':'text-gray-400 hover:text-gray-600'}`}><Hash size={12}/>{t('offers.fixedAmount','Fixed')}</button>
                </div>
              </div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{form.discount_type==='fixed'?t('offers.discountAmount','Discount Amount'):t('offers.discountPercent','Discount %')}</label><input type="number" min="0" step={form.discount_type==='fixed'?'1':'0.5'} className="input-field !py-1.5 text-xs" placeholder={form.discount_type==='fixed'?'500':'40'} value={form.discount_value} onChange={e=>updateOffer(oi,{discount_value:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.discountTextOverride','Display Text (override)')}</label><input className="input-field !py-1.5 text-xs" placeholder={form.discount_type==='fixed'?`-500 ${currentStore?.currency||'DZD'}`:'-40%'} value={form.offer_discount} onChange={e=>updateOffer(oi,{offer_discount:e.target.value})}/></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.offerTitle','Offer Title')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('offers.offerTitlePlaceholder','Limited Offer')} value={form.offer_title} onChange={e=>updateOffer(oi,{offer_title:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.timerHours','Timer Hours')}</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="15" value={form.offer_hours} onChange={e=>updateOffer(oi,{offer_hours:e.target.value})}/></div>
              <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('offers.timerMinutes','Timer Minutes')}</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="33" value={form.offer_minutes} onChange={e=>updateOffer(oi,{offer_minutes:e.target.value})}/></div>
            </div>

            {/* ═══ APPEARANCE & COLOR CUSTOMIZATION ═══ */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-black uppercase text-gray-500 flex items-center gap-2 mb-3"><Palette size={14} className="text-violet-500"/>{t('offers.appearance','Appearance & Colors')}</h4>

              {/* Badge appearance */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('offers.badgeAppearance','Sale Badge Appearance')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.badgeStyle','Badge Style')}</label>
                    <select className="input-field !py-1.5 text-xs mt-1" value={form.badge_style||'rounded'} onChange={e=>updateOffer(oi,{badge_style:e.target.value})}>
                      {BADGE_STYLES.map(bs=>(<option key={bs.value} value={bs.value}>{bs.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.badgeBg','Badge Color')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.badge_bg||'#EF4444'} onChange={e=>updateOffer(oi,{badge_bg:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                      <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.badge_bg||'#EF4444'} onChange={e=>updateOffer(oi,{badge_bg:e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.badgeTextColor','Badge Text')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.badge_text_color||'#FFFFFF'} onChange={e=>updateOffer(oi,{badge_text_color:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                      <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.badge_text_color||'#FFFFFF'} onChange={e=>updateOffer(oi,{badge_text_color:e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.preview','Preview')}</label>
                    <div className="flex items-center mt-2">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase ${form.badge_style==='pill'?'rounded-full':form.badge_style==='square'?'rounded-none':'rounded-lg'}`} style={{backgroundColor:form.badge_bg||'#EF4444',color:form.badge_text_color||'#FFF'}}>
                        {form.sale_badge_text||'SALE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner / offer bar appearance */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('offers.bannerAppearance','Offer Banner Appearance')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.bannerBg','Background')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.banner_bg||'#FEF2F2'} onChange={e=>updateOffer(oi,{banner_bg:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                      <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.banner_bg||'#FEF2F2'} onChange={e=>updateOffer(oi,{banner_bg:e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.bannerTextColor','Text Color')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.banner_text_color||'#991B1B'} onChange={e=>updateOffer(oi,{banner_text_color:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                      <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.banner_text_color||'#991B1B'} onChange={e=>updateOffer(oi,{banner_text_color:e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold">{t('offers.bannerBorder','Border Color')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.banner_border_color||'#FECACA'} onChange={e=>updateOffer(oi,{banner_border_color:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                      <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.banner_border_color||'#FECACA'} onChange={e=>updateOffer(oi,{banner_border_color:e.target.value})}/>
                    </div>
                  </div>
                </div>
                {/* Banner preview */}
                <div className="rounded-xl border-2 p-3" style={{backgroundColor:form.banner_bg||'#FEF2F2',borderColor:form.banner_border_color||'#FECACA'}}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black" style={{color:form.banner_text_color||'#991B1B'}}>{form.offer_title||t('offers.offerTitlePlaceholder','Limited Offer')}</p>
                      <p className="text-[10px] font-bold mt-0.5" style={{color:form.banner_text_color||'#991B1B',opacity:0.7}}>{computeDiscountText(form)||'-40%'}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${form.badge_style==='pill'?'rounded-full':form.badge_style==='square'?'rounded-none':'rounded-lg'}`} style={{backgroundColor:form.badge_bg||'#EF4444',color:form.badge_text_color||'#FFF'}}>
                      {form.sale_badge_text||'SALE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timer appearance */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{t('offers.timerAppearance','Timer Appearance')}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.show_timer!==false} onChange={e=>updateOffer(oi,{show_timer:e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600"/>
                    <span className="text-[10px] font-bold text-gray-500">{t('offers.showTimer','Show Timer')}</span>
                  </label>
                </div>
                {form.show_timer!==false&&<>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold">{t('offers.timerBg','Timer Background')}</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={form.timer_bg||'#1F2937'} onChange={e=>updateOffer(oi,{timer_bg:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                        <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.timer_bg||'#1F2937'} onChange={e=>updateOffer(oi,{timer_bg:e.target.value})}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold">{t('offers.timerTextColor','Timer Text')}</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={form.timer_text_color||'#FFFFFF'} onChange={e=>updateOffer(oi,{timer_text_color:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"/>
                        <input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.timer_text_color||'#FFFFFF'} onChange={e=>updateOffer(oi,{timer_text_color:e.target.value})}/>
                      </div>
                    </div>
                  </div>
                  {/* Timer preview — uses the actual hours/minutes set for this offer */}
                  {(()=>{
                    const totalSec=((parseInt(form.offer_hours)||0)*3600)+((parseInt(form.offer_minutes)||0)*60);
                    const h=Math.floor(totalSec/3600);
                    const m=Math.floor((totalSec%3600)/60);
                    const s=totalSec%60;
                    const pad=v=>String(v).padStart(2,'0');
                    const labels=[t('offers.timerHoursLabel','HRS'),t('offers.timerMinLabel','MIN'),t('offers.timerSecLabel','SEC')];
                    const vals=totalSec>0?[pad(h),pad(m),pad(s)]:['00','00','00'];
                    return(
                      <div className="flex items-center justify-center gap-3">
                        {vals.map((v,i)=>(
                          <div key={i} className="flex flex-col items-center gap-0.5">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black" style={{backgroundColor:form.timer_bg||'#1F2937',color:form.timer_text_color||'#FFF'}}>{v}</div>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{labels[i]}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>}
              </div>
            </div>

            {/* ═══ QUANTITY OFFERS — TIER PRICING ═══ */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm"><Layers size={14} className="text-white"/></div>
                  <div>
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">{t('offers.quantityOffers','Quantity Offers')}</h4>
                    <p className="text-[10px] text-gray-400">{t('offers.qtyOffersDesc','Buy more, save more — set tiered pricing')}</p>
                  </div>
                </div>
                <button type="button" onClick={()=>{const qo=[...(form.quantity_offers||[]),{quantity:'',label:'',discount_type:'percent',discount_value:'',free_shipping:false,highlight:false}];updateOffer(oi,{quantity_offers:qo});}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"><Plus size={12}/>{t('offers.addTier','Add Tier')}</button>
              </div>

              {(form.quantity_offers||[]).length===0?(
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-8 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><TrendingUp size={20} className="text-amber-400"/></div>
                  <p className="text-xs font-bold text-gray-400">{t('offers.noTiersYet','No quantity tiers yet')}</p>
                  <p className="text-[10px] text-gray-300 max-w-xs text-center">{t('offers.noTiersDesc','Add tiers to encourage larger orders with progressive discounts')}</p>
                </div>
              ):(
                <div className="space-y-2.5">
                  {(form.quantity_offers||[]).map((qo,qi)=>{
                    const TIER_ICONS=[Zap,Gift,Crown,Star,Sparkles];
                    const TIER_COLORS=['from-blue-500 to-indigo-500','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-pink-500 to-rose-500','from-violet-500 to-purple-500'];
                    const tierColor=TIER_COLORS[qi%TIER_COLORS.length];
                    const TierIcon=TIER_ICONS[qi%TIER_ICONS.length];
                    const autoLabel=(()=>{
                      if(qo.label)return qo.label;
                      const parts=[];
                      if(qo.discount_value){parts.push(qo.discount_type==='fixed'?`-${qo.discount_value} ${currentStore?.currency||'DZD'}`:`-${qo.discount_value}%`);}
                      if(qo.free_shipping)parts.push(t('offers.freeShipShort','Free shipping'));
                      return parts.join(' + ')||'';
                    })();
                    return(
                      <div key={qi} className={`group relative rounded-xl border transition-all ${qo.highlight?'border-amber-300 bg-gradient-to-r from-amber-50/80 to-orange-50/60 shadow-sm':'border-gray-200 bg-white hover:border-gray-300'}`}>
                        {qo.highlight&&<div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">{t('offers.bestValue','Best Value')}</div>}

                        <div className="p-3.5">
                          <div className="flex items-start gap-3">
                            {/* Tier badge */}
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tierColor} flex items-center justify-center shadow-sm shrink-0 mt-0.5`}>
                              <TierIcon size={16} className="text-white"/>
                            </div>

                            {/* Main config */}
                            <div className="flex-1 min-w-0 space-y-2.5">
                              {/* Row 1: Quantity + Discount type/value */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">{t('offers.buyQty','Buy')}</span>
                                  <input type="number" min="1" value={qo.quantity||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],quantity:e.target.value};updateOffer(oi,{quantity_offers:n});}} className="w-14 bg-white rounded-md border border-gray-200 px-2 py-1 text-xs font-black text-center focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all" placeholder="3"/>
                                </div>

                                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                                  <button type="button" onClick={()=>{const n=[...form.quantity_offers];n[qi]={...n[qi],discount_type:'percent'};updateOffer(oi,{quantity_offers:n});}} className={`px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1 ${(qo.discount_type||'percent')!=='fixed'?'bg-amber-100 text-amber-700':'text-gray-400 hover:text-gray-600'}`}><Percent size={10}/></button>
                                  <button type="button" onClick={()=>{const n=[...form.quantity_offers];n[qi]={...n[qi],discount_type:'fixed'};updateOffer(oi,{quantity_offers:n});}} className={`px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1 ${qo.discount_type==='fixed'?'bg-amber-100 text-amber-700':'text-gray-400 hover:text-gray-600'}`}><Hash size={10}/></button>
                                </div>

                                <input type="number" min="0" step={qo.discount_type==='fixed'?'1':'0.5'} value={qo.discount_value||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],discount_value:e.target.value};updateOffer(oi,{quantity_offers:n});}} className="w-20 bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-center focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all" placeholder={qo.discount_type==='fixed'?'500':'20'}/>
                                <span className="text-[10px] font-bold text-gray-400">{qo.discount_type==='fixed'?(currentStore?.currency||'DZD'):'%'}</span>
                              </div>

                              {/* Row 2: Label override + toggles */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <input value={qo.label||''} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],label:e.target.value};updateOffer(oi,{quantity_offers:n});}} className="flex-1 min-w-[140px] bg-gray-50 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all" placeholder={t('offers.qtyLabelOverride','Custom label (auto-generated if empty)')}/>

                                <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors bg-white">
                                  <input type="checkbox" checked={!!qo.free_shipping} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],free_shipping:e.target.checked};updateOffer(oi,{quantity_offers:n});}} className="w-3 h-3 rounded border-gray-300 text-emerald-500"/>
                                  <span className="text-[10px] font-bold text-gray-500">🚚 {t('offers.freeShipShort','Free shipping')}</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors bg-white">
                                  <input type="checkbox" checked={!!qo.highlight} onChange={e=>{const n=[...form.quantity_offers];n[qi]={...n[qi],highlight:e.target.checked};updateOffer(oi,{quantity_offers:n});}} className="w-3 h-3 rounded border-gray-300 text-amber-500"/>
                                  <span className="text-[10px] font-bold text-gray-500">⭐ {t('offers.highlightTier','Highlight')}</span>
                                </label>
                              </div>

                              {/* Preview chip */}
                              {(qo.quantity||autoLabel)&&(
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-gray-300 uppercase">{t('offers.preview','Preview')}:</span>
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs ${qo.highlight?'border-amber-400 bg-amber-50':'border-gray-200 bg-gray-50'}`}>
                                    <span className="font-black text-gray-700">×{qo.quantity||'?'}</span>
                                    <span className={`font-bold ${qo.highlight?'text-amber-700':'text-gray-500'}`}>{autoLabel||'...'}</span>
                                    {qo.free_shipping&&<span className="text-[10px]">🚚</span>}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Delete button */}
                            <button type="button" onClick={()=>updateOffer(oi,{quantity_offers:form.quantity_offers.filter((_,i)=>i!==qi)})} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Visual pricing ladder */}
                  {(form.quantity_offers||[]).filter(q=>q.quantity).length>=2&&(
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-amber-50/30 border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={10}/>{t('offers.pricingLadder','Pricing Ladder')}</p>
                      <div className="flex items-end gap-1.5">
                        {(form.quantity_offers||[]).filter(q=>q.quantity).sort((a,b)=>(parseInt(a.quantity)||0)-(parseInt(b.quantity)||0)).map((qo,qi,arr)=>{
                          const maxDisc=Math.max(...arr.map(q=>parseFloat(q.discount_value)||0),1);
                          const disc=parseFloat(qo.discount_value)||0;
                          const h=Math.max(16,Math.round((disc/maxDisc)*48));
                          const isHighlighted=qo.highlight;
                          return(
                            <div key={qi} className="flex flex-col items-center gap-1 flex-1">
                              <span className="text-[9px] font-black text-gray-500">{qo.discount_type==='fixed'?qo.discount_value:qo.discount_value+'%'}</span>
                              <div className={`w-full rounded-t-lg transition-all ${isHighlighted?'bg-gradient-to-t from-amber-500 to-amber-400':'bg-gradient-to-t from-gray-400 to-gray-300'}`} style={{height:h+'px'}}/>
                              <span className="text-[9px] font-bold text-gray-400">×{qo.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product selection table */}
            {form.mode==='specific'&&<div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder={t('offers.searchProducts','Search products...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <button onClick={()=>selectAll(oi)} className="btn-ghost text-xs">{t('offers.selectAll','Select All')}</button>
                {form.selectedIds.size>0&&<button onClick={()=>clearSel(oi)} className="btn-ghost text-xs text-red-600">{t('offers.clear','Clear')} ({form.selectedIds.size})</button>}
              </div>

              {loading?<div className="py-10 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase sticky top-0"><th className="p-2 w-8"></th><th className="p-2">{t('offers.product','Product')}</th><th className="p-2">{t('offers.price','Price')}</th><th className="p-2">{t('offers.sale','Sale')}</th></tr></thead><tbody>{filtered.map(p=>(
                <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50 cursor-pointer ${form.selectedIds.has(p.id)?'bg-brand-50/50':''}`} onClick={()=>toggleSelect(oi,p.id)}>
                  <td className="p-2"><button onClick={(e)=>{e.stopPropagation();toggleSelect(oi,p.id);}}>{form.selectedIds.has(p.id)?<Check size={14} className="text-brand-600"/>:<div className="w-3.5 h-3.5 rounded border border-gray-300"/>}</button></td>
                  <td className="p-2"><div className="flex items-center gap-2">{p.thumbnail?<img src={p.thumbnail} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={12} className="text-gray-300"/></div>}<span className="font-medium text-gray-800 text-xs truncate max-w-[150px]">{p.name_en||p.name}</span></div></td>
                  <td className="p-2 font-bold text-xs">{parseFloat(p.price).toLocaleString()} {currentStore?.currency||'DZD'}</td>
                  <td className="p-2">{p.is_on_sale?<span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{t('offers.onSale','ON SALE')}</span>:<span className="text-[10px] text-gray-400">{t('offers.no','No')}</span>}</td>
                </tr>
              ))}</tbody></table></div>}
            </div>}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={()=>applyOffer(oi)} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"><Tag size={14}/>{saving?t('offers.applying','Applying...'):t('offers.applyOffer','Apply Offer')}</button>
              <button onClick={()=>clearOffer(oi)} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm text-red-600 disabled:opacity-50"><X size={14}/>{t('offers.removeOffer','Remove Offer')}</button>
            </div>
          </div>}
        </div>
      ))}
    </div>
  </DashboardLayout>);
}
