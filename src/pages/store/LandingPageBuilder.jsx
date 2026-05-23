import React,{useState,useEffect,useRef}from'react';
import{useTranslation}from'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi,ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Rocket,Plus,Trash2,GripVertical,Image,Sparkles,Eye,Copy,ChevronDown,ChevronUp,Settings,Type,Palette,Save,ExternalLink,Package,Wand2}from'lucide-react';

const EMPTY_LP={
  name:'',slug:'',enabled:true,
  // Hero
  hero_title:'',hero_subtitle:'',hero_bg:'#7C3AED',hero_text:'#FFFFFF',hero_image:null,
  // Products on the page
  items:[],
  // CTA / Checkout
  cta_text:'Order Now',cta_bg:'#10B981',cta_text_color:'#FFFFFF',
  // Style
  bg_color:'#FFFFFF',text_color:'#1F2937',accent_color:'#7C3AED',
  show_reviews:true,show_countdown:false,countdown_hours:0,countdown_minutes:0,
  // AI
  ai_generated:false,
};

export default function LandingPageBuilder(){
  const{t}=useTranslation();
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[pages,setPages]=useState([]);
  const[editing,setEditing]=useState(null); // index
  const[saving,setSaving]=useState(false);
  const[prodSearch,setProdSearch]=useState('');
  const[generating,setGenerating]=useState(false);

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
    const n=[...pages,{...EMPTY_LP,name:`Landing Page ${pages.length+1}`,slug:`lp-${Date.now().toString(36)}`}];
    setPages(n);
    setEditing(n.length-1);
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
      compare_price:product.compare_price||null,
      image:product.thumbnail||product.images?.[0]||null,
      description:product.description||'',
      headline:'',
      features:[],
      // Per-product overrides
      custom_image:null,
    };
    updatePage(pageIdx,{items:[...page.items,item]});
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

  // AI generation: auto-fill headlines, features, descriptions
  const generateAI=async(pageIdx)=>{
    const page=pages[pageIdx];
    if(!page.items.length){toast.error(t('lp.addProductsFirst','Add products first'));return;}
    setGenerating(true);
    try{
      // Build AI-generated content for each product
      const updatedItems=page.items.map(item=>{
        const name=item.name;
        const price=item.price;
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
      // Also generate hero content if empty
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
      {pages.length===0&&<div className="glass-card-solid p-10 text-center">
        <Rocket size={40} className="mx-auto text-gray-300 mb-3"/>
        <p className="text-gray-500 font-bold">{t('lp.noPages','No landing pages yet')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('lp.noPagesDesc','Create a landing page to showcase your products with a scroll-to-checkout experience')}</p>
        <button onClick={addPage} className="btn-primary mt-4 text-sm"><Plus size={14} className="inline mr-1"/>{t('lp.createFirst','Create Your First Landing Page')}</button>
      </div>}
      {pages.map((pg,i)=>(
        <div key={i} className="glass-card-solid p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:pg.hero_bg||'#7C3AED'}}><Rocket size={18} className="text-white"/></div>
            <div>
              <p className="font-bold text-sm">{pg.name||`Landing Page ${i+1}`}</p>
              <p className="text-[10px] text-gray-400">{pg.items?.length||0} {t('lp.products','products')} · {pg.enabled?<span className="text-emerald-500">{t('lp.live','LIVE')}</span>:<span className="text-gray-400">{t('lp.draft','DRAFT')}</span>}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pg.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${pg.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-violet-50"><ExternalLink size={14}/></a>}
            <button onClick={()=>setEditing(i)} className="btn-ghost text-xs">{t('lp.edit','Edit')}</button>
            <button onClick={()=>removePage(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
          </div>
        </div>
      ))}
    </div>}

    {/* Editor */}
    {form&&<div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-xs">← {t('lp.backToList','Back to List')}</button>
        <div className="flex items-center gap-2">
          <button onClick={()=>generateAI(editing)} disabled={generating} className="btn-ghost text-xs flex items-center gap-1 text-violet-600"><Wand2 size={12}/>{generating?t('lp.generating','Generating...'):t('lp.aiGenerate','AI Generate Content')}</button>
          {form.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${form.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs flex items-center gap-1"><Eye size={12}/>{t('lp.preview','Preview')}</a>}
          <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-xs flex items-center gap-1"><Save size={12}/>{saving?t('lp.saving','Saving...'):t('lp.save','Save')}</button>
        </div>
      </div>

      {/* General settings */}
      <div className="glass-card-solid p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Settings size={14}/>{t('lp.generalSettings','General Settings')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.pageName','Page Name')}</label><input className="input-field !py-1.5 text-xs" value={form.name} onChange={e=>updatePage(editing,{name:e.target.value})}/></div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.urlSlug','URL Slug')}</label><input className="input-field !py-1.5 text-xs font-mono" value={form.slug} onChange={e=>updatePage(editing,{slug:e.target.value.replace(/[^a-z0-9-]/g,'')})}/></div>
          <div className="flex items-center gap-2 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.enabled} onChange={e=>updatePage(editing,{enabled:e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-emerald-600"/>
              <span className="text-xs font-bold">{t('lp.enabled','Enabled')}</span>
            </label>
          </div>
        </div>
        {storeSlug&&form.slug&&<div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-400">{t('lp.url','URL')}:</span>
          <code className="text-[10px] font-mono text-violet-600 flex-1">{baseUrl}/s/{storeSlug}/lp/{form.slug}</code>
          <button onClick={()=>{navigator.clipboard.writeText(`${baseUrl}/s/${storeSlug}/lp/${form.slug}`);toast.success(t('lp.copied','Copied!'));}} className="p-1 text-gray-400 hover:text-violet-500"><Copy size={12}/></button>
        </div>}
      </div>

      {/* Hero section */}
      <div className="glass-card-solid p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Type size={14}/>{t('lp.heroSection','Hero Section')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroTitle','Title')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('lp.heroTitlePh','Your Amazing Products')} value={form.hero_title} onChange={e=>updatePage(editing,{hero_title:e.target.value})}/></div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroSubtitle','Subtitle')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('lp.heroSubPh','Scroll down to discover our exclusive offers')} value={form.hero_subtitle} onChange={e=>updatePage(editing,{hero_subtitle:e.target.value})}/></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.heroBg','Background')}</label><div className="flex items-center gap-2 mt-1"><input type="color" value={form.hero_bg} onChange={e=>updatePage(editing,{hero_bg:e.target.value})} className="w-8 h-8 rounded border border-gray-200 cursor-pointer"/><input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.hero_bg} onChange={e=>updatePage(editing,{hero_bg:e.target.value})}/></div></div>
          <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.heroTextColor','Text Color')}</label><div className="flex items-center gap-2 mt-1"><input type="color" value={form.hero_text} onChange={e=>updatePage(editing,{hero_text:e.target.value})} className="w-8 h-8 rounded border border-gray-200 cursor-pointer"/><input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.hero_text} onChange={e=>updatePage(editing,{hero_text:e.target.value})}/></div></div>
          <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.ctaColor','Button Color')}</label><div className="flex items-center gap-2 mt-1"><input type="color" value={form.cta_bg} onChange={e=>updatePage(editing,{cta_bg:e.target.value})} className="w-8 h-8 rounded border border-gray-200 cursor-pointer"/><input className="input-field !py-1.5 text-xs flex-1 font-mono" value={form.cta_bg} onChange={e=>updatePage(editing,{cta_bg:e.target.value})}/></div></div>
        </div>
        <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.ctaText','CTA Button Text')}</label><input className="input-field !py-1.5 text-xs" value={form.cta_text} onChange={e=>updatePage(editing,{cta_text:e.target.value})}/></div>
        {/* Hero preview */}
        <div className="rounded-xl overflow-hidden" style={{backgroundColor:form.hero_bg}}>
          <div className="p-6 text-center">
            <h2 className="text-xl font-black" style={{color:form.hero_text}}>{form.hero_title||t('lp.heroTitlePh','Your Amazing Products')}</h2>
            <p className="text-sm mt-1 opacity-80" style={{color:form.hero_text}}>{form.hero_subtitle||t('lp.heroSubPh','Scroll down to discover')}</p>
            <button className="mt-3 px-6 py-2 rounded-xl text-sm font-bold" style={{backgroundColor:form.cta_bg,color:form.cta_text_color}}>{form.cta_text||'Order Now'}</button>
          </div>
        </div>
      </div>

      {/* Products on this landing page */}
      <div className="glass-card-solid p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Package size={14}/>{t('lp.productsSection','Products')} ({form.items.length})</h3>
        </div>

        {/* Add product picker */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <input className="input-field !py-1.5 text-xs" placeholder={t('lp.searchToAdd','Search products to add...')} value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredProducts.filter(p=>!form.items.find(it=>it.product_id===p.id)).slice(0,10).map(p=>(
              <button key={p.id} onClick={()=>addProduct(editing,p)} className="w-full flex items-center gap-2 p-2 hover:bg-white rounded-lg text-left transition-colors">
                {p.thumbnail?<img src={p.thumbnail} className="w-7 h-7 rounded object-cover"/>:<div className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center"><Package size={10} className="text-gray-400"/></div>}
                <span className="text-xs font-medium flex-1 truncate">{p.name_en||p.name}</span>
                <span className="text-[10px] font-bold text-gray-400">{parseFloat(p.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                <Plus size={12} className="text-emerald-500"/>
              </button>
            ))}
          </div>
        </div>

        {/* Sortable product list */}
        <div className="space-y-3">
          {form.items.map((item,idx)=>(
            <div key={item.product_id} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={()=>moveItem(editing,idx,-1)} disabled={idx===0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronUp size={12}/></button>
                    <button onClick={()=>moveItem(editing,idx,1)} disabled={idx===form.items.length-1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronDown size={12}/></button>
                  </div>
                  {item.image?<img src={item.custom_image||item.image} className="w-12 h-12 rounded-lg object-cover"/>:<div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-300"/></div>}
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <div className="flex items-center gap-2">
                      {item.compare_price&&<span className="text-[10px] line-through text-gray-400">{parseFloat(item.compare_price).toLocaleString()}</span>}
                      <span className="text-xs font-bold text-emerald-600">{parseFloat(item.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={()=>removeProduct(editing,item.product_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
              </div>
              {/* Per-product customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.headline','Headline')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('lp.headlinePh','e.g. Limited Time Offer!')} value={item.headline} onChange={e=>updateItem(editing,idx,{headline:e.target.value})}/></div>
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.description','Description')}</label><textarea className="input-field !py-1 text-xs" rows={1} placeholder={t('lp.descPh','Product selling points...')} value={item.description} onChange={e=>updateItem(editing,idx,{description:e.target.value})}/></div>
              </div>
              <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.features','Key Features')} ({t('lp.featuresHint','one per line')})</label><textarea className="input-field !py-1 text-xs" rows={2} placeholder={t('lp.featuresPh','Premium quality\nFast delivery\n30-day guarantee')} value={(item.features||[]).join('\n')} onChange={e=>updateItem(editing,idx,{features:e.target.value.split('\n')})}/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-sm">{t('lp.cancel','Cancel')}</button>
        <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-sm flex items-center gap-2"><Save size={14}/>{saving?t('lp.saving','Saving...'):t('lp.savePage','Save Landing Page')}</button>
      </div>
    </div>}
  </DashboardLayout>);
}
