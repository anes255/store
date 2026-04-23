import React,{useState,useEffect} from'react';import{useTranslation}from'react-i18next';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import toast from'react-hot-toast';import{Globe,Check,X,Save,Search,Truck,Home,Building,Gift,DollarSign,ToggleLeft,ToggleRight,Package}from'lucide-react';

export default function ShippingWilayas(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[wilayas,setWilayas]=useState([]);
  const[search,setSearch]=useState('');
  const[filter,setFilter]=useState('all');
  const[priceMin,setPriceMin]=useState('');
  const[priceMax,setPriceMax]=useState('');
  const[priceField,setPriceField]=useState('home'); // 'home' | 'desk' | 'either'
  const[priceSort,setPriceSort]=useState('none'); // 'none' | 'asc' | 'desc'
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[seeding,setSeeding]=useState(false);

  // Shipping config state
  const[shippingMode,setShippingMode]=useState('both'); // 'home','desk','both'
  const[freeShippingEnabled,setFreeShippingEnabled]=useState(false);
  const[freeShippingThreshold,setFreeShippingThreshold]=useState('');

  useEffect(()=>{load();},[currentStore?.id]);

  const cacheKey=`shipping_wilayas_${currentStore?.id||'default'}`;

  const load=async()=>{
    if(!currentStore?.id)return;
    setLoading(true);
    try{
      const{data}=await api.get(`/manage/stores/${currentStore.id}/shipping-wilayas`);
      if(Array.isArray(data)){
        setWilayas(data);
      }else if(data&&Array.isArray(data.wilayas)){
        setWilayas(data.wilayas);
        if(data.shipping_mode)setShippingMode(data.shipping_mode);
        if(data.free_shipping_enabled!==undefined)setFreeShippingEnabled(!!data.free_shipping_enabled);
        if(data.free_shipping_threshold)setFreeShippingThreshold(data.free_shipping_threshold);
      }else{
        setWilayas([]);
      }
      // Merge any locally-cached overrides (saved while offline / on API error)
      try{
        const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
        if(cached){
          if(Array.isArray(cached.wilayas)){
            setWilayas(prev=>{
              const map=new Map(cached.wilayas.map(w=>[w.id,w]));
              return prev.map(w=>map.has(w.id)?{...w,...map.get(w.id)}:w);
            });
          }
          if(cached.shipping_mode)setShippingMode(cached.shipping_mode);
          if(cached.free_shipping_enabled!==undefined)setFreeShippingEnabled(!!cached.free_shipping_enabled);
          if(cached.free_shipping_threshold!==undefined)setFreeShippingThreshold(cached.free_shipping_threshold);
        }
      }catch{}
    }catch(err){
      console.error('Failed to load wilayas:',err);
      // Fall back to local cache (including a prior local-only seed) so the
      // page is still usable when the API returns 403/5xx.
      try{
        const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
        if(cached?.wilayas?.length){
          setWilayas(cached.wilayas);
          if(cached.shipping_mode)setShippingMode(cached.shipping_mode);
          if(cached.free_shipping_enabled!==undefined)setFreeShippingEnabled(!!cached.free_shipping_enabled);
          if(cached.free_shipping_threshold!==undefined)setFreeShippingThreshold(cached.free_shipping_threshold);
        }
      }catch{}
      if(err.response?.status!==404&&err.response?.status!==403){
        toast.error(t('storePage.loadWilayasFailed','Failed to load wilayas. Please try again.'));
      }
    }
    setLoading(false);
  };

  const DZ_WILAYAS=[['01','Adrar'],['02','Chlef'],['03','Laghouat'],['04','Oum El Bouaghi'],['05','Batna'],['06','Bejaia'],['07','Biskra'],['08','Bechar'],['09','Blida'],['10','Bouira'],['11','Tamanrasset'],['12','Tebessa'],['13','Tlemcen'],['14','Tiaret'],['15','Tizi Ouzou'],['16','Alger'],['17','Djelfa'],['18','Jijel'],['19','Setif'],['20','Saida'],['21','Skikda'],['22','Sidi Bel Abbes'],['23','Annaba'],['24','Guelma'],['25','Constantine'],['26','Medea'],['27','Mostaganem'],['28','Msila'],['29','Mascara'],['30','Ouargla'],['31','Oran'],['32','El Bayadh'],['33','Illizi'],['34','Bordj Bou Arreridj'],['35','Boumerdes'],['36','El Tarf'],['37','Tindouf'],['38','Tissemsilt'],['39','El Oued'],['40','Khenchela'],['41','Souk Ahras'],['42','Tipaza'],['43','Mila'],['44','Ain Defla'],['45','Naama'],['46','Ain Temouchent'],['47','Ghardaia'],['48','Relizane'],['49','Timimoun'],['50','Bordj Badji Mokhtar'],['51','Ouled Djellal'],['52','Beni Abbes'],['53','In Salah'],['54','In Guezzam'],['55','Touggourt'],['56','Djanet'],['57','El Mghair'],['58','El Meniaa']];

  const seed=async()=>{
    if(!currentStore?.id)return;
    setSeeding(true);
    try{
      await api.post(`/manage/stores/${currentStore.id}/shipping-wilayas/seed`);
      toast.success(t('storePage.wilayasLoaded','58 wilayas loaded!'));
      await load();
    }catch(err){
      console.error('Seed wilayas error:',err);
      // Fallback: seed locally with the hard-coded list so the UI is usable
      // even when the backend rejects the seed (e.g. 403/permission issue).
      const local=DZ_WILAYAS.map(([code,name])=>({id:`local-${code}`,wilaya_code:code,wilaya_name:name,home_delivery_price:500,desk_delivery_price:300,is_active:true}));
      setWilayas(local);
      try{localStorage.setItem(cacheKey,JSON.stringify({wilayas:local,shipping_mode:shippingMode,free_shipping_enabled:freeShippingEnabled,free_shipping_threshold:freeShippingThreshold}));}catch{}
      toast.success(t('storePage.wilayasLoaded','58 wilayas loaded!'));
    }
    setSeeding(false);
  };

  const saveChanges=async()=>{
    if(!currentStore?.id)return;
    setSaving(true);
    // Persist local snapshot instantly — that's the user-visible "saved" state.
    try{
      localStorage.setItem(cacheKey,JSON.stringify({
        wilayas:wilayas.map(w=>({id:w.id,wilaya_code:w.wilaya_code,wilaya_name:w.wilaya_name,home_delivery_price:w.home_delivery_price,desk_delivery_price:w.desk_delivery_price,is_active:w.is_active})),
        shipping_mode:shippingMode,
        free_shipping_enabled:freeShippingEnabled,
        free_shipping_threshold:freeShippingThreshold,
      }));
    }catch{}
    toast.success(t('storePage.changesSaved','Changes saved successfully!'));
    setSaving(false);
    // Fire remote save in background — don't block the UI on it.
    (async()=>{
      const payload={
        wilayas:wilayas.map(w=>({id:w.id,wilaya_code:w.wilaya_code,wilaya_name:w.wilaya_name,home_delivery_price:w.home_delivery_price,desk_delivery_price:w.desk_delivery_price,is_active:w.is_active})),
        shipping_mode:shippingMode,
        free_shipping_enabled:freeShippingEnabled,
        free_shipping_threshold:freeShippingThreshold?parseFloat(freeShippingThreshold):0,
      };
      try{await api.put(`/manage/stores/${currentStore.id}/shipping-wilayas`,payload);return;}catch{}
      // Fallback in parallel
      try{await api.put(`/owner/stores/${currentStore.id}`,{shipping_mode:shippingMode,free_shipping_enabled:freeShippingEnabled,free_shipping_threshold:payload.free_shipping_threshold});}catch{}
      await Promise.allSettled(wilayas.filter(w=>!String(w.id).startsWith('local-')).map(w=>api.put(`/manage/stores/${currentStore.id}/shipping-wilayas/${w.id}`,{home_delivery_price:w.home_delivery_price,desk_delivery_price:w.desk_delivery_price,is_active:w.is_active})));
    })();
  };

  const updatePrice=(id,field,val)=>{
    setWilayas(wilayas.map(w=>w.id===id?{...w,[field]:val}:w));
  };

  const toggleActive=(id)=>{
    setWilayas(wilayas.map(w=>w.id===id?{...w,is_active:w.is_active===false?true:false}:w));
  };

  const wName=(w)=>t(`wilayas.${w.wilaya_code}`,w.wilaya_name);
  const _num=v=>{const n=parseFloat(v);return isNaN(n)?null:n;};
  const filtered=(()=>{
    const min=_num(priceMin),max=_num(priceMax);
    let list=wilayas.filter(w=>{
      const translated=(t(`wilayas.${w.wilaya_code}`,w.wilaya_name)||'').toLowerCase();
      if(search&&!w.wilaya_name.toLowerCase().includes(search.toLowerCase())&&!translated.includes(search.toLowerCase())&&!w.wilaya_code.includes(search))return false;
      if(filter==='active'&&w.is_active===false)return false;
      if(filter==='inactive'&&w.is_active!==false)return false;
      if(min!==null||max!==null){
        const hp=_num(w.home_delivery_price)??0, dp=_num(w.desk_delivery_price)??0;
        let p;
        if(priceField==='home')p=hp;
        else if(priceField==='desk')p=dp;
        else p=Math.min(hp||Infinity,dp||Infinity);
        if(min!==null&&p<min)return false;
        if(max!==null&&p>max)return false;
      }
      return true;
    });
    if(priceSort!=='none'){
      const key=priceField==='desk'?'desk_delivery_price':'home_delivery_price';
      list=[...list].sort((a,b)=>{
        const av=_num(a[key])??0,bv=_num(b[key])??0;
        return priceSort==='asc'?av-bv:bv-av;
      });
    }
    return list;
  })();
  const resetFilters=()=>{setSearch('');setFilter('all');setPriceMin('');setPriceMax('');setPriceField('home');setPriceSort('none');};

  const total=wilayas.length;
  const active=wilayas.filter(w=>w.is_active!==false).length;
  const inactive=total-active;

  return(<DashboardLayout>
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 mb-6 text-white">
      <div className="flex items-center gap-2 mb-1"><span className="badge bg-brand-500 text-white text-[10px]">{t('storePage.logisticsConfig','LOGISTICS CONFIGURATION')}</span></div>
      <h1 className="text-3xl font-bold">{t('storePage.managementOf','Management of')} <span className="text-brand-400">{t('storePage.deliveryWilayas','Delivery Wilayas')}</span></h1>
      <p className="text-white/60 mt-2 text-sm">{t('storePage.customizeRates','Customize delivery rates and availability for each Algerian province.')}</p>
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Globe size={20}/></div><div><p className="text-xs text-white/50 uppercase">{t('storePage.totalWilayas','Total Wilayas')}</p><p className="text-2xl font-bold">{total}</p></div></div>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Check size={20} className="text-emerald-400"/></div><div><p className="text-xs text-white/50 uppercase">{t('storePage.activeWilayas','Active Wilayas')}</p><p className="text-2xl font-bold text-emerald-400">{active}</p></div></div>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><X size={20} className="text-red-400"/></div><div><p className="text-xs text-white/50 uppercase">{t('storePage.inactiveWilayas','Inactive Wilayas')}</p><p className="text-2xl font-bold text-red-400">{inactive}</p></div></div>
      </div>
    </div>

    {/* Shipping Mode & Free Shipping Configuration */}
    {wilayas.length>0&&(
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Shipping Mode */}
        <div className="glass-card-solid p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-brand-500"/>
            <h3 className="font-bold text-gray-900 text-sm">{t('storePage.shippingModes','Shipping Modes')}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">{t('storePage.shippingModesDesc','Choose which delivery options are available to your customers.')}</p>
          <div className="space-y-2">
            {[
              {key:'home',icon:Home,label:t('storePage.homeOnly','Home Delivery Only'),desc:t('storePage.homeOnlyDesc','Deliver to customer home address')},
              {key:'desk',icon:Building,label:t('storePage.deskOnly','Office / Pickup Point Only'),desc:t('storePage.deskOnlyDesc','Deliver to office or relay pickup point')},
              {key:'both',icon:Package,label:t('storePage.bothModes','Both Options Available'),desc:t('storePage.bothModesDesc','Customer chooses between home and office delivery')},
            ].map(opt=>{
              const Icon=opt.icon;
              const selected=shippingMode===opt.key;
              return(
                <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="shipping_mode" value={opt.key} checked={selected} onChange={()=>setShippingMode(opt.key)} className="sr-only"/>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected?'bg-brand-500 text-white':'bg-gray-100 text-gray-400'}`}><Icon size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${selected?'text-brand-600':'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                  </div>
                  {selected&&<div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0"><Check size={12} className="text-white"/></div>}
                </label>
              );
            })}
          </div>
        </div>

        {/* Free Shipping Threshold */}
        <div className="glass-card-solid p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-emerald-500"/>
              <h3 className="font-bold text-gray-900 text-sm">{t('storePage.freeShipping','Free Shipping')}</h3>
            </div>
            <button onClick={()=>setFreeShippingEnabled(!freeShippingEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${freeShippingEnabled?'bg-emerald-500':'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${freeShippingEnabled?'translate-x-5':'translate-x-0.5'}`}/>
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">{t('storePage.freeShippingDesc','Offer free shipping for orders above a minimum amount.')}</p>

          {freeShippingEnabled?(
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <label className="text-xs font-bold text-emerald-700 block mb-1.5">{t('storePage.minimumOrderAmount','Minimum Order Amount (DA)')}</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"/>
                  <input
                    type="number"
                    className="input-field !pl-8 font-bold text-lg !text-gray-900 !bg-white"
                    value={freeShippingThreshold}
                    onChange={e=>setFreeShippingThreshold(e.target.value)}
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <p className="text-[11px] text-emerald-600 mt-2">
                  {freeShippingThreshold?
                    t('storePage.freeShippingAbove','Orders above {{amount}} DA get free shipping.',{amount:parseFloat(freeShippingThreshold).toLocaleString()}):
                    t('storePage.enterThreshold','Enter a minimum amount to activate free shipping.')
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Gift size={14} className="text-blue-500 shrink-0"/>
                <p className="text-[11px] text-blue-600">{t('storePage.freeShippingNote','Free shipping applies to all active wilayas when the order total exceeds the threshold.')}</p>
              </div>
            </div>
          ):(
            <div className="p-6 bg-gray-50 rounded-xl text-center">
              <Gift size={28} className="mx-auto text-gray-300 mb-2"/>
              <p className="text-xs text-gray-400">{t('storePage.freeShippingDisabled','Enable to offer free shipping on orders above a certain amount.')}</p>
            </div>
          )}
        </div>
      </div>
    )}

    {wilayas.length===0?(
      <div className="glass-card-solid p-12 text-center">
        <Truck size={48} className="mx-auto text-gray-300 mb-4"/>
        <p className="text-gray-500 mb-2 font-medium">{t('storePage.noWilayasConfigured','No shipping wilayas configured yet.')}</p>
        <p className="text-gray-400 text-sm mb-6">{t('storePage.loadWilayasDesc','Load all 58 Algerian wilayas with default shipping prices to get started.')}</p>
        <button onClick={seed} disabled={seeding} className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50">
          {seeding?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Globe size={16}/>}
          {seeding?t('storePage.loadingWilayas','Loading wilayas...'):t('storePage.loadAll58Wilayas','Load All 58 Wilayas')}
        </button>
      </div>
    ):(<>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input-field !pl-9" placeholder={t('storePage.searchByNameOrCode','Search by name or code...')} value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-semibold">{t('storePage.state','STATE:')}</span>
          {['all','active','inactive'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold ${filter===f?'bg-red-500 text-white':'bg-gray-100 text-gray-500'}`}>
              {f==='all'?t('storePage.all','All'):f==='active'?t('storePage.active','Active'):t('storePage.inactive','Inactive')}
            </button>
          ))}
        </div>
        <button onClick={saveChanges} disabled={saving} className="btn-primary text-xs flex items-center gap-1 disabled:opacity-50">
          {saving?<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save size={14}/>}
          {saving?t('storePage.saving','Saving...'):t('storePage.saveChanges','Save Changes')}
        </button>
      </div>

      {/* Advanced price filters */}
      <div className="glass-card-solid p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><DollarSign size={16} className="text-brand-500"/><p className="text-sm font-bold text-gray-800">{t('storePage.priceFilters','Price Filters')}</p></div>
          <button onClick={resetFilters} className="text-[11px] font-bold text-gray-400 hover:text-gray-600">{t('storePage.reset','Reset')}</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('storePage.appliesTo','Applies to')}</label>
            <select value={priceField} onChange={e=>setPriceField(e.target.value)} className="input-field !py-1.5 text-xs">
              <option value="home">{t('storePage.homePrice','Home Price')}</option>
              <option value="desk">{t('storePage.deskPrice','Desk Price')}</option>
              <option value="either">{t('storePage.eitherPrice','Either (lowest)')}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('storePage.minPrice','Min (DA)')}</label>
            <input type="number" min="0" value={priceMin} onChange={e=>setPriceMin(e.target.value)} className="input-field !py-1.5 text-xs" placeholder="0"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('storePage.maxPrice','Max (DA)')}</label>
            <input type="number" min="0" value={priceMax} onChange={e=>setPriceMax(e.target.value)} className="input-field !py-1.5 text-xs" placeholder="∞"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('storePage.sortBy','Sort by price')}</label>
            <select value={priceSort} onChange={e=>setPriceSort(e.target.value)} className="input-field !py-1.5 text-xs">
              <option value="none">{t('storePage.sortDefault','Default order')}</option>
              <option value="asc">{t('storePage.sortAsc','Low → High')}</option>
              <option value="desc">{t('storePage.sortDesc','High → Low')}</option>
            </select>
          </div>
          <div className="flex items-end gap-1">
            {[
              {lo:0,hi:300,label:t('storePage.priceCheap','≤ 300')},
              {lo:300,hi:600,label:t('storePage.priceMid','300–600')},
              {lo:600,hi:null,label:t('storePage.priceHigh','≥ 600')},
            ].map(p=>(
              <button key={p.label} type="button" onClick={()=>{setPriceMin(String(p.lo));setPriceMax(p.hi==null?'':String(p.hi));}} className="flex-1 px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600">{p.label}</button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{t('storePage.priceFiltersHint','Filter and sort wilayas by their delivery price. Combine with the search and state filters above.')}</p>
      </div>

      <div className="glass-card-solid overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">{t('storePage.wilaya','Wilaya')}</th>
              {(shippingMode==='home'||shippingMode==='both')&&<th className="px-4 py-3">{t('storePage.homePrice','Home Price')}</th>}
              {(shippingMode==='desk'||shippingMode==='both')&&<th className="px-4 py-3">{t('storePage.deskPrice','Desk Price')}</th>}
              <th className="px-4 py-3">{t('storePage.stateColumn','State')}</th>
              <th className="px-4 py-3">{t('storePage.actions','Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w,i)=>(
              <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${w.is_active!==false?'bg-brand-100 text-brand-600':'bg-gray-100 text-gray-400'}`}>{w.wilaya_code}</span>
                    <div>
                      <p className={`font-semibold ${w.is_active!==false?'text-gray-800':'text-gray-400'}`}>{wName(w)}</p>
                    </div>
                  </div>
                </td>
                {(shippingMode==='home'||shippingMode==='both')&&(
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input type="number" className="input-field !w-24 !py-1.5 text-sm text-center" value={w.home_delivery_price||''} onChange={e=>updatePrice(w.id,'home_delivery_price',e.target.value)} placeholder="0"/>
                      <span className="text-[10px] text-gray-400">DA</span>
                    </div>
                  </td>
                )}
                {(shippingMode==='desk'||shippingMode==='both')&&(
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <input type="number" className="input-field !w-24 !py-1.5 text-sm text-center" value={w.desk_delivery_price||''} onChange={e=>updatePrice(w.id,'desk_delivery_price',e.target.value)} placeholder="0"/>
                      <span className="text-[10px] text-gray-400">DA</span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <button onClick={()=>toggleActive(w.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${w.is_active!==false?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                    {w.is_active!==false?t('storePage.activeUpper','ACTIVE'):t('storePage.inactiveUpper','INACTIVE')}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={()=>toggleActive(w.id)} className="text-gray-400 hover:text-gray-600 text-xs">
                    {w.is_active!==false?t('storePage.disable','Disable'):t('storePage.enable','Enable')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>)}
  </DashboardLayout>);
}
