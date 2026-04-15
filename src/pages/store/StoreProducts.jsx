import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { productApi, aiApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Package, Image, Upload, Palette, Sparkles, CheckSquare, Square, Download } from 'lucide-react';

export default function StoreProducts() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef(null);
  const variantFileRef = useRef(null);
  const [activeVarIdx, setActiveVarIdx] = useState(null);

  const [selectedItems, setSelectedItems] = useState(new Set());

  const toggleSelect = (id) => setSelectedItems(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedItems(prev => prev.size === products.length ? new Set() : new Set(products.map(p => p.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const empty = {name_en:'',name_fr:'',name_ar:'',description_en:'',price:'',compare_at_price:'',stock_quantity:'',sku:'',category_id:'',images:[],is_featured:false,allow_oversell:false,variants:[]};
  const [form, setForm] = useState({...empty});

  const loadProducts = async () => {
    if (!currentStore?.id) return;
    try { const{data}=await productApi.getAll(currentStore.id,{search}); setProducts(data.products); } catch{} finally{setLoading(false);}
  };
  useEffect(()=>{loadProducts();},[currentStore?.id,search]);

  const toB64 = (file) => new Promise((res, rej) => { const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
  const compress = (b64, w=500, q=0.4) => new Promise((res) => { const img=new window.Image(); img.onload=()=>{ const c=document.createElement('canvas'); const ratio=Math.min(w/img.width,w/img.height,1); c.width=img.width*ratio; c.height=img.height*ratio; c.getContext('2d').drawImage(img,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',q)); }; img.src=b64; });

  const handleFiles = async (e) => {
    const files = Array.from(e.target?.files || []); if (!files.length) return;
    setUploading(true);
    try {
      const imgs = [];
      for (const f of files) { if (f.size>10*1024*1024) continue; imgs.push(await compress(await toB64(f))); }
      setForm(p => ({...p, images: [...p.images, ...imgs]}));
      if (imgs.length) toast.success(`${imgs.length} ${t('storePage.imagesAdded','image(s) added')}`);
    } catch { toast.error(t('storePage.failed','Failed')); }
    setUploading(false);
    if(fileInputRef.current) fileInputRef.current.value='';
  };

  const handleVarFiles = async (e) => {
    if (activeVarIdx === null) return;
    const files = Array.from(e.target?.files || []); if (!files.length) return;
    try {
      const imgs = [];
      for (const f of files) { if (f.size>10*1024*1024) continue; imgs.push(await compress(await toB64(f))); }
      const v = [...form.variants];
      v[activeVarIdx] = {...v[activeVarIdx], images: [...(v[activeVarIdx].images||[]), ...imgs]};
      setForm({...form, variants:v});
      toast.success(`${imgs.length} ${t('storePage.variantImagesAdded','variant image(s) added')}`);
    } catch {}
    if(variantFileRef.current) variantFileRef.current.value='';
  };

  const rmImg = (i) => setForm(p => ({...p, images: p.images.filter((_,j)=>j!==i)}));
  const addVar = () => setForm({...form, variants: [...form.variants, {name:'',type:'color',value:'',price_adjustment:0,stock:0,images:[],description:''}]});
  const setVar = (i,k,v) => { const vs=[...form.variants]; vs[i]={...vs[i],[k]:v}; setForm({...form,variants:vs}); };
  const rmVar = (i) => setForm({...form, variants: form.variants.filter((_,j)=>j!==i)});
  const rmVarImg = (vi,ii) => { const vs=[...form.variants]; vs[vi]={...vs[vi],images:vs[vi].images.filter((_,j)=>j!==ii)}; setForm({...form,variants:vs}); };

  const [descLang, setDescLang] = useState('en');

  const generateDesc = async () => {
    if (!form.name_en && !form.name_fr) return toast.error(t('storePage.enterProductNameFirst','Enter product name first'));
    setAiLoading(true);
    try {
      const{data}=await aiApi.generateDescription({product_name:form.name_en||form.name_fr,category:'',language:descLang});
      setForm({...form, description_en: data.description});
      toast.success(t('storePage.aiDescGenerated','AI description generated!'));
    } catch { toast.error(t('storePage.aiGenFailed','AI generation failed')); }
    setAiLoading(false);
  };

  const generateDescAll = async () => {
    if (!form.name_en && !form.name_fr) return toast.error(t('storePage.enterProductNameFirst','Enter product name first'));
    setAiLoading(true);
    try {
      const{data}=await aiApi.generateDescriptionMulti({product_name:form.name_en||form.name_fr,category:''});
      const combined = [data.en, data.fr ? `\n\n🇫🇷 ${data.fr}` : '', data.ar ? `\n\n🇩🇿 ${data.ar}` : ''].join('');
      setForm({...form, description_en: combined.trim()});
      toast.success(t('storePage.aiDescGenerated3Lang','AI descriptions generated in 3 languages!'));
    } catch { toast.error(t('storePage.aiGenFailed','AI generation failed')); }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (!form.price||!form.name_en) { toast.error(t('storePage.nameAndPriceRequired','Name and price required')); return; }
    try {
      if (editing) { await productApi.update(currentStore.id,editing.id,form); toast.success(t('storePage.updated','Updated!')); }
      else { await productApi.create(currentStore.id,form); toast.success(t('storePage.created','Created!')); }
      setShowModal(false); setEditing(null); setForm({...empty}); loadProducts();
    } catch(err) { toast.error(err.response?.data?.error||t('storePage.failed','Failed')); }
  };

  const handleDelete = async (id) => { if(!confirm(t('storePage.deleteConfirm','Delete?'))) return; try{await productApi.delete(currentStore.id,id);toast.success(t('storePage.deleted','Deleted'));loadProducts();}catch{toast.error(t('storePage.failed','Failed'));} };

  const openEdit = (p) => {
    setEditing(p);
    let vars = p.variants||[]; if(typeof vars==='string')try{vars=JSON.parse(vars);}catch{vars=[];} if(!Array.isArray(vars))vars=[];
    setForm({name_en:p.name_en||p.name||'',name_fr:p.name_fr||'',name_ar:p.name_ar||'',description_en:p.description_en||p.description||'',price:p.price,compare_at_price:p.compare_at_price||p.compare_price||'',stock_quantity:p.stock_quantity,sku:p.sku||'',category_id:p.category_id||'',images:Array.isArray(p.images)?p.images:[],is_featured:p.is_featured,allow_oversell:!!p.allow_oversell,variants:vars});
    setShowModal(true);
  };

  const set = (k) => (e) => setForm({...form,[k]:e.target.value});
  const getThumb = (p) => { if(p.thumbnail)return p.thumbnail; if(Array.isArray(p.images)&&p.images.length)return typeof p.images[0]==='string'?p.images[0]:null; return null; };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('sidebar.products')}</h1>
        <button onClick={()=>{setEditing(null);setForm({...empty});setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>{t('products.addProduct')}</button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={toggleAll} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" title={selectedItems.size === products.length ? 'Deselect All' : 'Select All'}>
          {selectedItems.size > 0 && selectedItems.size === products.length ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
          <span className="text-xs font-bold text-gray-500">{selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select All'}</span>
        </button>
        <div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder={t('storePage.searchPlaceholder','Search...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>

      {products.length===0?(
        <div className="flex flex-col items-center py-20 glass-card-solid"><Package size={48} className="text-gray-300 mb-4"/><p className="text-gray-500 mb-4">{t('products.noProducts')}</p><button onClick={()=>{setForm({...empty});setShowModal(true);}} className="btn-primary text-sm"><Plus size={16} className="mr-1 inline"/>{t('products.addProduct')}</button></div>
      ):(
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p=>{const thumb=getThumb(p);let vars=p.variants;if(typeof vars==='string')try{vars=JSON.parse(vars);}catch{vars=[];}const vc=Array.isArray(vars)?vars.length:0;return(
            <div key={p.id} className={`glass-card-solid rounded-2xl overflow-hidden group hover:shadow-glass-lg transition-all ${selectedItems.has(p.id) ? 'ring-2 ring-brand-400' : ''}`}>
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {thumb?<img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>:<div className="flex items-center justify-center h-full"><Image size={32} className="text-gray-300"/></div>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>openEdit(p)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"><Edit size={14}/></button>
                  <button onClick={()=>handleDelete(p.id)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                </div>
                {/* Selection checkbox */}
                <button onClick={(e)=>{e.stopPropagation();toggleSelect(p.id);}} className="absolute top-2 left-2 z-10">
                  {selectedItems.has(p.id) ? <CheckSquare size={20} className="text-brand-600 bg-white rounded" /> : <Square size={20} className="text-gray-400 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
                {p.is_featured&&<span className="absolute top-9 left-2 badge bg-brand-500 text-white text-[9px]">{t('storePage.featured','FEATURED')}</span>}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{p.name_en||p.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-brand-600 font-bold text-sm">{parseFloat(p.price).toLocaleString()} DZD</span>
                  <span className="text-xs text-gray-400">{t('storePage.stock','Stock')}: {p.stock_quantity||0}</span>
                </div>
                {vc>0&&<div className="flex items-center gap-1 mt-1.5">{vars.slice(0,4).map((v,i)=>v.type==='color'?<div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{backgroundColor:v.value}}/>:<span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500">{v.name}</span>)}{vc>4&&<span className="text-[9px] text-gray-400">+{vc-4}</span>}</div>}
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl z-50">
          <span className="text-sm font-bold">{selectedItems.size} selected</span>
          <div className="w-px h-6 bg-gray-600" />
          <button onClick={() => { const selectedData = products.filter(p => selectedItems.has(p.id)); const csv = ['Name,Price,Stock,SKU', ...selectedData.map(p => `"${p.name_en||p.name}",${p.price},${p.stock_quantity||0},"${p.sku||''}"`)].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'products-export.csv'; a.click(); URL.revokeObjectURL(url); toast.success(`Exported ${selectedItems.size} products`); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors">
            <Download size={13} />Export Selected
          </button>
          <button onClick={async () => { if(!confirm(`Delete ${selectedItems.size} selected products?`)) return; for (const id of selectedItems) { try { await productApi.delete(currentStore.id, id); } catch {} } clearSelection(); loadProducts(); toast.success('Deleted selected products'); }} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold transition-colors">
            <Trash2 size={13} />Delete Selected
          </button>
          <button onClick={clearSelection} className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-700 rounded-lg text-xs transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing?t('storePage.editProduct','Edit Product'):t('products.addProduct')}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="input-label text-xs">{t('storePage.nameEn','Name (EN)')} *</label><input className="input-field" value={form.name_en} onChange={set('name_en')}/></div>
                <div><label className="input-label text-xs">{t('storePage.nameFr','Name (FR)')}</label><input className="input-field" value={form.name_fr} onChange={set('name_fr')}/></div>
                <div><label className="input-label text-xs">{t('storePage.nameAr','Name (AR)')}</label><input className="input-field" value={form.name_ar} onChange={set('name_ar')}/></div>
              </div>

              {/* Description with AI generate */}
              <div>
                <div className="flex items-center justify-between"><label className="input-label text-xs">{t('storePage.description','Description')}</label>
                  <div className="flex items-center gap-2">
                    <select className="text-[10px] border rounded-lg px-2 py-1 text-gray-500" value={descLang} onChange={e=>setDescLang(e.target.value)}><option value="en">EN</option><option value="fr">FR</option><option value="ar">AR</option></select>
                    <button onClick={generateDesc} disabled={aiLoading} className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-50">{aiLoading?<div className="w-3 h-3 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"/>:<Sparkles size={12}/>}{t('storePage.aiGenerate','AI Generate')}</button>
                    <button onClick={generateDescAll} disabled={aiLoading} className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"><Sparkles size={12}/>{t('storePage.all3Languages','All 3 Languages')}</button>
                  </div>
                </div>
                <textarea className="input-field" rows={3} value={form.description_en} onChange={set('description_en')} placeholder={t('storePage.productDescriptionPlaceholder','Product description...')}/>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div><label className="input-label text-xs">{t('storePage.price','Price')} *</label><input type="number" className="input-field" value={form.price} onChange={set('price')}/></div>
                <div><label className="input-label text-xs">{t('storePage.comparePrice','Compare Price')}</label><input type="number" className="input-field" value={form.compare_at_price} onChange={set('compare_at_price')}/></div>
                <div><label className="input-label text-xs">{t('storePage.stock','Stock')}</label><input type="number" className="input-field" value={form.stock_quantity} onChange={set('stock_quantity')}/></div>
                <div><label className="input-label text-xs">{t('storePage.sku','SKU')}</label><input className="input-field" value={form.sku} onChange={set('sku')}/></div>
              </div>

              {/* Allow Oversell Toggle */}
              <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                <input type="checkbox" checked={form.allow_oversell} onChange={e=>setForm({...form,allow_oversell:e.target.checked})} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"/>
                <div>
                  <p className="text-sm font-bold text-amber-800">{t('storePage.allowOversell','Allow selling when out of stock')}</p>
                  <p className="text-[11px] text-amber-600">{t('storePage.allowOversellDesc','Customers can still buy this product even if stock reaches 0')}</p>
                </div>
              </label>

              {/* Images */}
              <div>
                <label className="input-label text-xs flex items-center gap-1"><Image size={14}/>{t('storePage.mainImages','Main Images')}</label>
                {form.images.length>0&&<div className="grid grid-cols-5 gap-2 mb-2">{form.images.map((img,i)=>(<div key={i} className="relative aspect-square rounded-xl overflow-hidden border group"><img src={img} className="w-full h-full object-cover" alt=""/><button onClick={()=>rmImg(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 size={14} className="text-white"/></button>{i===0&&<span className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-[7px] text-center font-bold py-0.5">{t('storePage.main','MAIN')}</span>}</div>))}</div>}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400" onClick={()=>fileInputRef.current?.click()} onDrop={e=>{e.preventDefault();handleFiles({target:{files:Array.from(e.dataTransfer.files)}});}} onDragOver={e=>e.preventDefault()}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles}/>
                  {uploading?<div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto"/>:<div><Upload size={18} className="mx-auto text-gray-400 mb-1"/><p className="text-xs text-gray-500">{t('storePage.uploadImages','Upload images')}</p></div>}
                </div>
              </div>

              {/* ═══════ VARIANTS ═══════ */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label text-xs flex items-center gap-1 mb-0"><Palette size={14}/>{t('storePage.variantsLabel','Variants (Colors, Sizes, Types)')}</label>
                  <button onClick={addVar} className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"><Plus size={12}/>{t('storePage.addVariant','Add Variant')}</button>
                </div>
                {form.variants.length===0&&<p className="text-xs text-gray-400 text-center py-3">{t('storePage.noVariants','No variants. Add colors, sizes, or types for this product.')}</p>}
                <div className="space-y-3">
                  {form.variants.map((v,vi)=>(
                    <div key={vi} className="p-4 bg-gray-50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">{t('storePage.variant','Variant')} #{vi+1}</span><button onClick={()=>rmVar(vi)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>
                      <div className="grid grid-cols-4 gap-2">
                        <div><label className="text-[10px] text-gray-400">{t('storePage.type','Type')}</label><select className="input-field !py-1.5 text-xs" value={v.type} onChange={e=>setVar(vi,'type',e.target.value)}><option value="color">{t('storePage.color','Color')}</option><option value="size">{t('storePage.size','Size')}</option><option value="material">{t('storePage.material','Material')}</option><option value="style">{t('storePage.style','Style')}</option><option value="custom">{t('storePage.custom','Custom')}</option></select></div>
                        <div><label className="text-[10px] text-gray-400">{t('storePage.name','Name')} *</label><input className="input-field !py-1.5 text-xs" placeholder={v.type==='color'?t('storePage.redPlaceholder','Red'):t('storePage.xlPlaceholder','XL')} value={v.name} onChange={e=>setVar(vi,'name',e.target.value)}/></div>
                        <div><label className="text-[10px] text-gray-400">{v.type==='color'?t('storePage.color','Color'):t('storePage.value','Value')}</label>{v.type==='color'?<div className="flex gap-1"><input type="color" className="w-8 h-8 rounded" value={v.value||'#000000'} onChange={e=>setVar(vi,'value',e.target.value)}/><input className="input-field !py-1.5 text-xs flex-1" value={v.value||''} onChange={e=>setVar(vi,'value',e.target.value)}/></div>:<input className="input-field !py-1.5 text-xs" value={v.value||''} onChange={e=>setVar(vi,'value',e.target.value)}/>}</div>
                        <div><label className="text-[10px] text-gray-400">{t('storePage.stock','Stock')}</label><input type="number" className="input-field !py-1.5 text-xs" value={v.stock||0} onChange={e=>setVar(vi,'stock',parseInt(e.target.value)||0)}/></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] text-gray-400">{t('storePage.priceAdjust','Price +/-')}</label><input type="number" className="input-field !py-1.5 text-xs" placeholder="0" value={v.price_adjustment||''} onChange={e=>setVar(vi,'price_adjustment',parseFloat(e.target.value)||0)}/></div>
                        <div><label className="text-[10px] text-gray-400">{t('storePage.description','Description')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('storePage.variantDetailsPlaceholder','Variant details...')} value={v.description||''} onChange={e=>setVar(vi,'description',e.target.value)}/></div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">{t('storePage.variantImages','Variant Images')}</label>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {(v.images||[]).map((img,ii)=>(<div key={ii} className="relative w-14 h-14 rounded-lg overflow-hidden border group"><img src={img} className="w-full h-full object-cover" alt=""/><button onClick={()=>rmVarImg(vi,ii)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><X size={10} className="text-white"/></button></div>))}
                          <button onClick={()=>{setActiveVarIdx(vi);variantFileRef.current?.click();}} className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-brand-400"><Plus size={14} className="text-gray-400"/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <input ref={variantFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleVarFiles}/>
              </div>

              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/><span className="text-sm font-medium text-gray-700">{t('storePage.featuredProduct','Featured Product')}</span></label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">{t('storePage.cancel','Cancel')}</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editing?t('storePage.updateProduct','Update Product'):t('storePage.createProduct','Create Product')}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
