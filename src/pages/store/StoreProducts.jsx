import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Package, Image, Upload, GripVertical } from 'lucide-react';

export default function StoreProducts() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name_en:'', name_fr:'', name_ar:'', description_en:'', price:'', compare_at_price:'',
    stock_quantity:'', sku:'', category_id:'', images:[], is_featured:false
  });

  const loadProducts = async () => {
    if (!currentStore?.id) return;
    try { const{data}=await productApi.getAll(currentStore.id,{search}); setProducts(data.products); } catch{} finally{setLoading(false);}
  };
  useEffect(()=>{loadProducts();},[currentStore?.id,search]);

  // Convert file to base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Compress image before storing
  const compressImage = (base64, maxWidth=800, quality=0.7) => new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth/img.width, maxWidth/img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });

  // Handle file selection from gallery
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const newImages = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue; }
        if (file.size > 10*1024*1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64);
        newImages.push(compressed);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
      toast.success(`${newImages.length} image(s) added!`);
    } catch(err) { toast.error('Failed to process images'); }
    setUploading(false);
    if(fileInputRef.current) fileInputRef.current.value='';
  };

  // Handle drag & drop
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
    if (!files.length) return;
    const fakeEvent = { target: { files } };
    await handleFileSelect(fakeEvent);
  };

  const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_,i)=>i!==idx) }));

  const handleSave = async () => {
    if (!form.price||!form.name_en) { toast.error('Name and price are required'); return; }
    try {
      if (editing) { await productApi.update(currentStore.id,editing.id,form); toast.success('Product updated!'); }
      else { await productApi.create(currentStore.id,form); toast.success('Product created!'); }
      setShowModal(false); setEditing(null); resetForm(); loadProducts();
    } catch(err) { toast.error(err.response?.data?.error||'Failed'); }
  };

  const resetForm = () => setForm({name_en:'',name_fr:'',name_ar:'',description_en:'',price:'',compare_at_price:'',stock_quantity:'',sku:'',category_id:'',images:[],is_featured:false});

  const handleDelete = async (id) => {
    if(!confirm('Delete this product?')) return;
    try{await productApi.delete(currentStore.id,id);toast.success('Deleted');loadProducts();}catch{toast.error('Failed');}
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name_en:p.name_en||p.name||'', name_fr:p.name_fr||'', name_ar:p.name_ar||'', description_en:p.description_en||p.description||'',
      price:p.price, compare_at_price:p.compare_at_price||p.compare_price||'', stock_quantity:p.stock_quantity, sku:p.sku||'',
      category_id:p.category_id||'', images:Array.isArray(p.images)?p.images:[], is_featured:p.is_featured });
    setShowModal(true);
  };

  const set = (k) => (e) => setForm({...form,[k]:e.target.value});

  const getThumb = (p) => {
    if(p.thumbnail) return p.thumbnail;
    if(Array.isArray(p.images)&&p.images.length) return typeof p.images[0]==='string'?p.images[0]:p.images[0]?.url;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('products.title')}</h1>
        <button onClick={()=>{setEditing(null);resetForm();setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>{t('products.addProduct')}</button>
      </div>
      <div className="relative max-w-sm mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      {products.length===0?(
        <div className="flex flex-col items-center justify-center py-20 glass-card-solid"><Package size={48} className="text-gray-300 mb-4"/><p className="text-gray-500 font-medium mb-4">{t('products.noProducts')}</p><button onClick={()=>{resetForm();setShowModal(true);}} className="btn-primary text-sm"><Plus size={16} className="mr-1 inline"/>{t('products.addProduct')}</button></div>
      ):(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p=>{const thumb=getThumb(p);return(
            <div key={p.id} className="glass-card-solid overflow-hidden group hover:shadow-glass-lg transition-all">
              <div className="h-48 bg-gray-100 relative">
                {thumb?<img src={thumb} className="w-full h-full object-cover" alt=""/>:<div className="flex items-center justify-center h-full"><Image size={32} className="text-gray-300"/></div>}
                {p.is_featured&&<span className="absolute top-2 left-2 badge badge-warning text-[10px]">Featured</span>}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={()=>openEdit(p)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"><Edit size={14}/></button>
                  <button onClick={()=>handleDelete(p.id)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-800 text-sm truncate">{p.name_en||p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.category_name||'Uncategorized'}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-baseline gap-1.5"><span className="text-lg font-extrabold text-gray-900">{parseFloat(p.price).toLocaleString()}</span><span className="text-xs text-gray-400">DZD</span></div>
                  <span className={`text-xs font-bold ${p.stock_quantity>0?'text-emerald-600':'text-red-500'}`}>{p.stock_quantity>0?`${p.stock_quantity} in stock`:'Out of stock'}</span>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* ============ PRODUCT MODAL ============ */}
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing?'Edit Product':t('products.addProduct')}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><label className="input-label">Name (EN) *</label><input className="input-field" value={form.name_en} onChange={set('name_en')} placeholder="Product name"/></div>
                <div><label className="input-label">Name (FR)</label><input className="input-field" value={form.name_fr} onChange={set('name_fr')}/></div>
                <div><label className="input-label">Name (AR)</label><input className="input-field" value={form.name_ar} onChange={set('name_ar')}/></div>
              </div>
              <div><label className="input-label">Description</label><textarea className="input-field" rows={3} value={form.description_en} onChange={set('description_en')}/></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="input-label">Price (DZD) *</label><input type="number" className="input-field" value={form.price} onChange={set('price')}/></div>
                <div><label className="input-label">Compare Price</label><input type="number" className="input-field" value={form.compare_at_price} onChange={set('compare_at_price')}/></div>
                <div><label className="input-label">Stock</label><input type="number" className="input-field" value={form.stock_quantity} onChange={set('stock_quantity')}/></div>
              </div>
              <div><label className="input-label">SKU</label><input className="input-field" value={form.sku} onChange={set('sku')}/></div>

              {/* ============ IMAGE UPLOAD ============ */}
              <div>
                <label className="input-label flex items-center gap-2"><Image size={16}/> Product Images</label>

                {/* Image grid */}
                {form.images.length>0&&(
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {form.images.map((img,i)=>(
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group">
                        <img src={img} className="w-full h-full object-cover" alt=""/>
                        <button onClick={()=>removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 size={16} className="text-white"/></button>
                        {i===0&&<span className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-[8px] text-center font-bold py-0.5">MAIN</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload zone */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all"
                  onClick={()=>fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e=>{e.preventDefault();e.stopPropagation();}}
                  onDragEnter={e=>{e.preventDefault();e.stopPropagation();}}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect}/>
                  {uploading?(
                    <div className="flex flex-col items-center gap-2"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin"/><p className="text-sm text-gray-500">Processing images...</p></div>
                  ):(
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center"><Upload size={22} className="text-brand-500"/></div>
                      <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB each</p>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-500" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/>
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editing?'Update':'Create'} Product</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
