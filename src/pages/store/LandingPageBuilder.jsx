import React,{useState,useEffect,useRef}from'react';
import{useTranslation}from'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi,ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Rocket,Plus,Trash2,ChevronDown,ChevronUp,Eye,Copy,Settings,Type,Palette,Save,ExternalLink,Package,Wand2,GripVertical,Image,Layout,Zap,ToggleLeft,ToggleRight,Timer,Star,Sparkles,Globe,MousePointer,Layers}from'lucide-react';

const EMPTY_LP={
  name:'',slug:'',enabled:true,
  hero_title:'',hero_subtitle:'',hero_bg:'#1e1b4b',hero_text:'#FFFFFF',hero_image:null,
  items:[],
  cta_text:'Order Now',cta_bg:'#10B981',cta_text_color:'#FFFFFF',
  bg_color:'#FAFAFA',text_color:'#1F2937',accent_color:'#7C3AED',
  show_reviews:true,show_countdown:false,countdown_hours:0,countdown_minutes:0,
  show_trust_badges:true,show_social_proof:true,
  layout_style:'alternating', // alternating, stacked, showcase
  animation_style:'slide-up', // none, fade, slide-up, zoom
  hero_style:'centered', // centered, split, minimal
  ai_generated:false,
};

const LAYOUT_STYLES=[
  {value:'alternating',label:'Alternating',desc:'Products alternate left/right'},
  {value:'stacked',label:'Stacked',desc:'Full-width product sections'},
  {value:'showcase',label:'Showcase',desc:'Large hero image with overlay text'},
];

const HERO_STYLES=[
  {value:'centered',label:'Centered',desc:'Classic centered hero'},
  {value:'split',label:'Split',desc:'Text left, image right'},
  {value:'minimal',label:'Minimal',desc:'Clean text-only hero'},
];

const ANIMATION_STYLES=[
  {value:'none',label:'None'},
  {value:'fade',label:'Fade In'},
  {value:'slide-up',label:'Slide Up'},
  {value:'zoom',label:'Zoom'},
];

export default function LandingPageBuilder(){
  const{t}=useTranslation();
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[pages,setPages]=useState([]);
  const[editing,setEditing]=useState(null);
  const[saving,setSaving]=useState(false);
  const[prodSearch,setProdSearch]=useState('');
  const[generating,setGenerating]=useState(false);
  const[showAdvanced,setShowAdvanced]=useState(false);
  const[dragIdx,setDragIdx]=useState(null);

  useEffect(()=>{
    if(!currentStore?.id)return;
    productApi.getAll(currentStore.id,{}).then(r=>setProducts(r.data.products||[])).catch(()=>{});
    const cfg=currentStore.config||currentStore;
    setPages(Array.isArray(cfg.landing_pages)?cfg.landing_pages:[]);
  },[currentStore?.id]);

  const save=async(updatedPages)=>{
    setSaving(true);
    try{
      const{data}=await ownerApi.updateStore(currentStore.id,{landing_pages:updatedPages});
      setCurrentStore(data);
      setPages(updatedPages);
      toast.success(t('lp.saved','Landing page saved'));
    }catch{toast.error(t('lp.saveFailed','Failed to save'));}
    setSaving(false);
  };

  const addPage=()=>{
    const n=[...pages,{...EMPTY_LP,name:`Landing Page ${pages.length+1}`,slug:`lp-${Date.now().toString(36)}`,accent_color:currentStore?.primary_color||'#7C3AED'}];
    setPages(n);
    setEditing(n.length-1);
  };

  const duplicatePage=(idx)=>{
    const src=pages[idx];
    const n=[...pages,{...src,name:`${src.name} (copy)`,slug:`${src.slug}-${Date.now().toString(36).slice(-4)}`}];
    setPages(n);
    setEditing(n.length-1);
    toast.success(t('lp.duplicated','Page duplicated'));
  };

  const removePage=(idx)=>{
    const n=pages.filter((_,i)=>i!==idx);
    setPages(n);
    if(editing===idx)setEditing(null);
    else if(editing>idx)setEditing(editing-1);
    save(n);
  };

  const updatePage=(idx,patch)=>{
    const n=pages.map((p,i)=>i===idx?{...p,...patch}:p);
    setPages(n);
  };

  const addProduct=(pageIdx,product)=>{
    const page=pages[pageIdx];
    if(page.items.find(it=>it.product_id===product.id))return;
    const item={
      product_id:product.id,
      name:product.name_en||product.name||'',
      name_fr:product.name_fr||'',
      name_ar:product.name_ar||'',
      price:product.price,
      compare_price:product.compare_at_price||product.compare_price||null,
      image:product.thumbnail||product.images?.[0]||null,
      description:product.description_en||product.description||'',
      headline:'',
      features:[],
      custom_image:null,
    };
    updatePage(pageIdx,{items:[...page.items,item]});
  };

  const addAllProducts=(pageIdx)=>{
    const page=pages[pageIdx];
    const existing=new Set(page.items.map(it=>it.product_id));
    const newItems=products.filter(p=>!existing.has(p.id)).map(p=>({
      product_id:p.id,name:p.name_en||p.name||'',name_fr:p.name_fr||'',name_ar:p.name_ar||'',
      price:p.price,compare_price:p.compare_at_price||p.compare_price||null,
      image:p.thumbnail||p.images?.[0]||null,description:p.description_en||p.description||'',
      headline:'',features:[],custom_image:null,
    }));
    if(!newItems.length){toast.error(t('lp.allAdded','All products already added'));return;}
    updatePage(pageIdx,{items:[...page.items,...newItems]});
    toast.success(`${newItems.length} ${t('lp.productsAdded','products added')}`);
  };

  const removeProduct=(pageIdx,productId)=>{
    const page=pages[pageIdx];
    updatePage(pageIdx,{items:page.items.filter(it=>it.product_id!==productId)});
  };

  const updateItem=(pageIdx,itemIdx,patch)=>{
    const page=pages[pageIdx];
    const items=page.items.map((it,i)=>i===itemIdx?{...it,...patch}:it);
    updatePage(pageIdx,{items});
  };

  const moveItem=(pageIdx,from,dir)=>{
    const page=pages[pageIdx];
    const to=from+dir;
    if(to<0||to>=page.items.length)return;
    const items=[...page.items];
    [items[from],items[to]]=[items[to],items[from]];
    updatePage(pageIdx,{items});
  };

  const generateAI=async(pageIdx)=>{
    const page=pages[pageIdx];
    if(!page.items.length){toast.error(t('lp.addProductsFirst','Add products first'));return;}
    setGenerating(true);
    try{
      const updatedItems=page.items.map(item=>{
        const name=item.name;
        return{
          ...item,
          headline:item.headline||`${name} — ${t('lp.aiExclusive','Exclusive Offer')}`,
          features:item.features.length?item.features:[
            t('lp.aiFeature1','Premium quality materials'),
            t('lp.aiFeature2','Fast shipping to all 58 wilayas'),
            t('lp.aiFeature3','100% satisfaction guaranteed'),
          ],
          description:item.description||`${t('lp.aiDesc1','Discover')} ${name} — ${t('lp.aiDesc2','designed to exceed your expectations. Order now and experience the difference.')}`,
        };
      });
      const patch={items:updatedItems,ai_generated:true};
      if(!page.hero_title){
        const storeName=currentStore?.store_name||currentStore?.name||'Store';
        patch.hero_title=`${storeName} — ${t('lp.aiHeroTitle','Special Collection')}`;
        patch.hero_subtitle=t('lp.aiHeroSub','Handpicked products at unbeatable prices. Scroll down to discover our exclusive offers.');
      }
      updatePage(pageIdx,patch);
      toast.success(t('lp.aiGenerated','AI content generated! Review and customize.'));
    }catch{toast.error(t('lp.aiFailed','AI generation failed'));}
    setGenerating(false);
  };

  const filteredProducts=products.filter(p=>!prodSearch||(p.name_en||p.name||'').toLowerCase().includes(prodSearch.toLowerCase()));
  const storeSlug=currentStore?.slug;
  const baseUrl=typeof window!=='undefined'?window.location.origin:'';
  const form=editing!==null?pages[editing]:null;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket size={22} className="text-violet-500"/>{t('lp.title','Landing Pages')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('lp.subtitle','Create scroll-to-checkout landing pages for your products')}</p>
      </div>
      <button onClick={addPage} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/>{t('lp.newPage','New Landing Page')}</button>
    </div>

    {/* Page list */}
    {!form&&<div className="space-y-3">
      {pages.length===0&&<div className="glass-card-solid p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4"><Rocket size={28} className="text-violet-500"/></div>
        <p className="text-gray-700 font-bold text-lg">{t('lp.noPages','No landing pages yet')}</p>
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{t('lp.noPagesDesc','Create a landing page to showcase your products with a scroll-to-checkout experience')}</p>
        <button onClick={addPage} className="btn-primary mt-5 text-sm"><Plus size={14} className="inline mr-1"/>{t('lp.createFirst','Create Your First Landing Page')}</button>
      </div>}
      {pages.map((pg,i)=>(
        <div key={i} className="glass-card-solid p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{backgroundColor:pg.hero_bg||'#1e1b4b'}}><Rocket size={18} className="text-white"/></div>
            <div>
              <p className="font-bold text-sm">{pg.name||`Landing Page ${i+1}`}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-gray-400">{pg.items?.length||0} {t('lp.products','products')}</span>
                {pg.enabled?<span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>{t('lp.live','LIVE')}</span>:<span className="text-[10px] text-gray-400">{t('lp.draft','DRAFT')}</span>}
                {pg.layout_style&&<span className="text-[10px] text-gray-400 capitalize">{pg.layout_style}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {pg.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${pg.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-violet-50 transition-colors" title={t('lp.preview','Preview')}><ExternalLink size={14}/></a>}
            <button onClick={()=>duplicatePage(i)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors" title={t('lp.duplicate','Duplicate')}><Copy size={14}/></button>
            <button onClick={()=>setEditing(i)} className="btn-ghost text-xs">{t('lp.edit','Edit')}</button>
            <button onClick={()=>removePage(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
          </div>
        </div>
      ))}
    </div>}

    {/* ═══ EDITOR ═══ */}
    {form&&<div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-xs flex items-center gap-1"><ChevronDown size={12} className="rotate-90"/>{t('lp.backToList','Back to List')}</button>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>generateAI(editing)} disabled={generating} className="btn-ghost text-xs flex items-center gap-1.5 text-violet-600 hover:bg-violet-50"><Wand2 size={13}/>{generating?t('lp.generating','Generating...'):t('lp.aiGenerate','AI Generate')}</button>
          {form.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${form.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs flex items-center gap-1"><Eye size={12}/>{t('lp.preview','Preview')}</a>}
          <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5"><Save size={12}/>{saving?t('lp.saving','Saving...'):t('lp.save','Save')}</button>
        </div>
      </div>

      {/* ─── PAGE NAME + STATUS ─── */}
      <div className="glass-card-solid p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.pageName','Page Name')}</label><input className="input-field !py-2 text-sm" value={form.name} onChange={e=>updatePage(editing,{name:e.target.value})}/></div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.urlSlug','URL Slug')}</label><input className="input-field !py-2 text-sm font-mono" value={form.slug} onChange={e=>updatePage(editing,{slug:e.target.value.replace(/[^a-z0-9-]/g,'')})}/></div>
          <div className="flex items-center gap-3">
            <button onClick={()=>updatePage(editing,{enabled:!form.enabled})} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.enabled?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-gray-50 text-gray-500 border border-gray-200'}`}>
              {form.enabled?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}
              {form.enabled?t('lp.enabled','Enabled'):t('lp.disabled','Disabled')}
            </button>
          </div>
        </div>
        {storeSlug&&form.slug&&<div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mt-3">
          <Globe size={12} className="text-gray-400 shrink-0"/>
          <code className="text-[11px] font-mono text-violet-600 flex-1 truncate">{baseUrl}/s/{storeSlug}/lp/{form.slug}</code>
          <button onClick={()=>{navigator.clipboard.writeText(`${baseUrl}/s/${storeSlug}/lp/${form.slug}`);toast.success(t('lp.copied','Copied!'));}} className="p-1 text-gray-400 hover:text-violet-500 shrink-0"><Copy size={12}/></button>
        </div>}
      </div>

      {/* ─── PRODUCTS ─── */}
      <div className="glass-card-solid p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Package size={15} className="text-violet-500"/>{t('lp.productsSection','Products')} <span className="text-gray-400 font-normal">({form.items.length})</span></h3>
          <button onClick={()=>addAllProducts(editing)} className="btn-ghost text-[11px] flex items-center gap-1"><Plus size={11}/>{t('lp.addAll','Add All')}</button>
        </div>

        {/* Product picker */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <input className="input-field !py-2 text-sm" placeholder={t('lp.searchToAdd','Search products to add...')} value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {filteredProducts.filter(p=>!form.items.find(it=>it.product_id===p.id)).slice(0,12).map(p=>(
              <button key={p.id} onClick={()=>addProduct(editing,p)} className="w-full flex items-center gap-2.5 p-2 hover:bg-white rounded-lg text-left transition-colors group">
                {p.thumbnail?<img src={p.thumbnail} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><Package size={11} className="text-gray-400"/></div>}
                <span className="text-xs font-medium flex-1 truncate">{p.name_en||p.name}</span>
                <span className="text-[10px] font-bold text-gray-400">{parseFloat(p.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                <Plus size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
              </button>
            ))}
            {filteredProducts.filter(p=>!form.items.find(it=>it.product_id===p.id)).length===0&&<p className="text-xs text-gray-400 py-3 text-center">{t('lp.noMoreProducts','All products added')}</p>}
          </div>
        </div>

        {/* Product list */}
        <div className="space-y-3">
          {form.items.map((item,idx)=>(
            <div key={item.product_id} className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={()=>moveItem(editing,idx,-1)} disabled={idx===0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={12}/></button>
                    <button onClick={()=>moveItem(editing,idx,1)} disabled={idx===form.items.length-1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={12}/></button>
                  </div>
                  {item.image?<img src={item.custom_image||item.image} className="w-14 h-14 rounded-xl object-cover shadow-sm"/>:<div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><Package size={18} className="text-gray-300"/></div>}
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.compare_price&&parseFloat(item.compare_price)>0&&<span className="text-[10px] line-through text-gray-400">{parseFloat(item.compare_price).toLocaleString()}</span>}
                      <span className="text-xs font-bold text-emerald-600">{parseFloat(item.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={()=>removeProduct(editing,item.product_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.headline','Headline')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('lp.headlinePh','e.g. Limited Time Offer!')} value={item.headline} onChange={e=>updateItem(editing,idx,{headline:e.target.value})}/></div>
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.description','Description')}</label><textarea className="input-field !py-1.5 text-xs" rows={1} placeholder={t('lp.descPh','Product selling points...')} value={item.description} onChange={e=>updateItem(editing,idx,{description:e.target.value})}/></div>
              </div>
              <div className="mt-2"><label className="text-[10px] text-gray-400 font-bold">{t('lp.features','Key Features')} <span className="font-normal text-gray-300">({t('lp.featuresHint','one per line')})</span></label><textarea className="input-field !py-1.5 text-xs" rows={2} placeholder={t('lp.featuresPh','Premium quality\nFast delivery\n30-day guarantee')} value={(item.features||[]).join('\n')} onChange={e=>updateItem(editing,idx,{features:e.target.value.split('\n')})}/></div>
            </div>
          ))}
          {form.items.length===0&&<div className="text-center py-8 text-gray-400"><Package size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">{t('lp.noProductsYet','Add products from the picker above')}</p></div>}
        </div>
      </div>

      {/* ─── ADVANCED SETTINGS (toggle) ─── */}
      <button onClick={()=>setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-5 py-3 glass-card-solid hover:shadow-sm transition-shadow rounded-xl">
        <span className="font-bold text-sm flex items-center gap-2"><Settings size={15} className="text-gray-400"/>{t('lp.advancedSettings','Advanced Settings')}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAdvanced?'rotate-180':''}`}/>
      </button>

      {showAdvanced&&<div className="space-y-4">
        {/* Hero section */}
        <div className="glass-card-solid p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Type size={14} className="text-indigo-500"/>{t('lp.heroSection','Hero Section')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroTitle','Title')}</label><input className="input-field !py-2 text-sm" placeholder={t('lp.heroTitlePh','Your Amazing Products')} value={form.hero_title} onChange={e=>updatePage(editing,{hero_title:e.target.value})}/></div>
            <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroSubtitle','Subtitle')}</label><input className="input-field !py-2 text-sm" placeholder={t('lp.heroSubPh','Scroll down to discover our exclusive offers')} value={form.hero_subtitle} onChange={e=>updatePage(editing,{hero_subtitle:e.target.value})}/></div>
          </div>
          {/* Hero style */}
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.heroStyle','Hero Style')}</label>
            <div className="flex gap-2">
              {HERO_STYLES.map(s=>(
                <button key={s.value} onClick={()=>updatePage(editing,{hero_style:s.value})} className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${form.hero_style===s.value?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.ctaText','CTA Button Text')}</label><input className="input-field !py-2 text-sm" value={form.cta_text} onChange={e=>updatePage(editing,{cta_text:e.target.value})}/></div>
          {/* Hero preview */}
          <div className="rounded-xl overflow-hidden shadow-lg" style={{backgroundColor:form.hero_bg}}>
            <div className="p-8 text-center">
              <h2 className="text-xl font-black tracking-tight" style={{color:form.hero_text}}>{form.hero_title||t('lp.heroTitlePh','Your Amazing Products')}</h2>
              <p className="text-sm mt-2 opacity-80" style={{color:form.hero_text}}>{form.hero_subtitle||t('lp.heroSubPh','Scroll down to discover')}</p>
              <button className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg" style={{backgroundColor:form.cta_bg,color:form.cta_text_color}}>{form.cta_text||'Order Now'}</button>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="glass-card-solid p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Palette size={14} className="text-pink-500"/>{t('lp.colors','Colors & Theme')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {key:'hero_bg',label:t('lp.heroBg','Hero BG'),def:'#1e1b4b'},
              {key:'hero_text',label:t('lp.heroTextColor','Hero Text'),def:'#FFFFFF'},
              {key:'cta_bg',label:t('lp.ctaColor','Button'),def:'#10B981'},
              {key:'cta_text_color',label:t('lp.ctaTextColor','Button Text'),def:'#FFFFFF'},
              {key:'bg_color',label:t('lp.pageBg','Page BG'),def:'#FAFAFA'},
              {key:'accent_color',label:t('lp.accent','Accent'),def:'#7C3AED'},
            ].map(c=>(
              <div key={c.key}>
                <label className="text-[10px] text-gray-400 font-bold">{c.label}</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input type="color" value={form[c.key]||c.def} onChange={e=>updatePage(editing,{[c.key]:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"/>
                  <input className="input-field !py-1 text-[10px] flex-1 font-mono" value={form[c.key]||c.def} onChange={e=>updatePage(editing,{[c.key]:e.target.value})}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout & Animation */}
        <div className="glass-card-solid p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Layout size={14} className="text-blue-500"/>{t('lp.layoutAnimation','Layout & Animation')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.productLayout','Product Layout')}</label>
              <div className="space-y-1.5">
                {LAYOUT_STYLES.map(s=>(
                  <button key={s.value} onClick={()=>updatePage(editing,{layout_style:s.value})} className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${form.layout_style===s.value?'border-violet-400 bg-violet-50 font-bold':'border-gray-200 hover:border-gray-300'}`}>
                    <Layers size={12} className={form.layout_style===s.value?'text-violet-500':'text-gray-400'}/>{s.label} <span className="text-gray-400 font-normal ml-auto">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.animationStyle','Animation Style')}</label>
              <div className="space-y-1.5">
                {ANIMATION_STYLES.map(s=>(
                  <button key={s.value} onClick={()=>updatePage(editing,{animation_style:s.value})} className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${form.animation_style===s.value?'border-violet-400 bg-violet-50 font-bold':'border-gray-200 hover:border-gray-300'}`}>
                    <MousePointer size={12} className={form.animation_style===s.value?'text-violet-500':'text-gray-400'}/>{s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Extra toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            {[
              {key:'show_trust_badges',label:t('lp.trustBadges','Trust Badges'),icon:Shield},
              {key:'show_social_proof',label:t('lp.socialProof','Social Proof'),icon:Star},
              {key:'show_reviews',label:t('lp.reviews','Reviews'),icon:Star},
              {key:'show_countdown',label:t('lp.countdown','Countdown'),icon:Timer},
            ].map(({key,label,icon:Icon})=>(
              <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" checked={form[key]!==false} onChange={e=>updatePage(editing,{[key]:e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600"/>
                <Icon size={12} className="text-gray-400"/>
                <span className="text-[11px] font-bold text-gray-600">{label}</span>
              </label>
            ))}
          </div>

          {form.show_countdown&&<div className="grid grid-cols-2 gap-3 pt-2">
            <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.countdownHours','Hours')}</label><input type="number" min="0" className="input-field !py-1.5 text-xs" value={form.countdown_hours||''} onChange={e=>updatePage(editing,{countdown_hours:parseInt(e.target.value)||0})}/></div>
            <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.countdownMinutes','Minutes')}</label><input type="number" min="0" className="input-field !py-1.5 text-xs" value={form.countdown_minutes||''} onChange={e=>updatePage(editing,{countdown_minutes:parseInt(e.target.value)||0})}/></div>
          </div>}
        </div>
      </div>}

      {/* Save */}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-sm">{t('lp.cancel','Cancel')}</button>
        <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-sm flex items-center gap-2"><Save size={14}/>{saving?t('lp.saving','Saving...'):t('lp.savePage','Save Landing Page')}</button>
      </div>
    </div>}
  </DashboardLayout>);
}
