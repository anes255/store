import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Package, Image, Link as LinkIcon, Upload, ExternalLink } from 'lucide-react';

export default function StoreProducts() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageInput, setImageInput] = useState('');

  const [form, setForm] = useState({
    name_en: '', name_fr: '', name_ar: '', description_en: '', price: '', compare_at_price: '',
    stock_quantity: '', sku: '', category_id: '', images: [], thumbnail: '', is_featured: false
  });

  const loadProducts = async () => {
    if (!currentStore?.id) return;
    try {
      const { data } = await productApi.getAll(currentStore.id, { search });
      setProducts(data.products);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, [currentStore?.id, search]);

  const handleSave = async () => {
    if (!form.price || !form.name_en) { toast.error('Name and price are required'); return; }
    try {
      const payload = { ...form, images: form.images.length > 0 ? form.images : (form.thumbnail ? [form.thumbnail] : []) };
      if (editing) {
        await productApi.update(currentStore.id, editing.id, payload);
        toast.success('Product updated!');
      } else {
        await productApi.create(currentStore.id, payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const resetForm = () => {
    setForm({ name_en: '', name_fr: '', name_ar: '', description_en: '', price: '', compare_at_price: '', stock_quantity: '', sku: '', category_id: '', images: [], thumbnail: '', is_featured: false });
    setImageInput('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await productApi.delete(currentStore.id, id); toast.success('Deleted'); loadProducts(); } catch { toast.error('Failed'); }
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name_en: p.name_en || p.name || '', name_fr: p.name_fr || '', name_ar: p.name_ar || '',
      description_en: p.description_en || p.description || '',
      price: p.price, compare_at_price: p.compare_at_price || p.compare_price || '',
      stock_quantity: p.stock_quantity, sku: p.sku || '', category_id: p.category_id || '',
      images: Array.isArray(p.images) ? p.images : [], thumbnail: p.thumbnail || '',
      is_featured: p.is_featured
    });
    setShowModal(true);
  };

  const addImage = () => {
    if (!imageInput.trim()) return;
    if (!imageInput.startsWith('http')) { toast.error('Please enter a valid URL starting with http'); return; }
    setForm({ ...form, images: [...form.images, imageInput.trim()], thumbnail: form.images.length === 0 ? imageInput.trim() : form.thumbnail });
    setImageInput('');
  };

  const removeImage = (idx) => {
    const newImages = form.images.filter((_, i) => i !== idx);
    setForm({ ...form, images: newImages, thumbnail: newImages[0] || '' });
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const getThumb = (p) => {
    if (p.thumbnail) return p.thumbnail;
    if (Array.isArray(p.images) && p.images.length > 0) return typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('products.title')}</h1>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />{t('products.addProduct')}
        </button>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field !pl-9 !py-2 text-sm" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card-solid">
          <Package size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-4">{t('products.noProducts')}</p>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary text-sm"><Plus size={16} className="mr-1 inline" />{t('products.addProduct')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => {
            const thumb = getThumb(p);
            return (
              <div key={p.id} className="glass-card-solid overflow-hidden group hover:shadow-glass-lg transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {thumb ? <img src={thumb} className="w-full h-full object-cover" alt="" /> : <div className="flex items-center justify-center h-full"><Image size={32} className="text-gray-300" /></div>}
                  {p.is_featured && <span className="absolute top-2 left-2 badge badge-warning text-[10px]">Featured</span>}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800 text-sm truncate">{p.name_en || p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category_name || 'Uncategorized'}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-gray-900">{parseFloat(p.price).toLocaleString()}</span>
                      <span className="text-xs text-gray-400">DZD</span>
                      {(p.compare_at_price || p.compare_price) && <span className="text-xs text-gray-400 line-through ml-1">{parseFloat(p.compare_at_price || p.compare_price).toLocaleString()}</span>}
                    </div>
                    <span className={`text-xs font-bold ${p.stock_quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Product' : t('products.addProduct')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-3 gap-4">
                <div><label className="input-label">Name (EN) *</label><input className="input-field" value={form.name_en} onChange={set('name_en')} placeholder="Product name" /></div>
                <div><label className="input-label">Name (FR)</label><input className="input-field" value={form.name_fr} onChange={set('name_fr')} /></div>
                <div><label className="input-label">Name (AR)</label><input className="input-field" value={form.name_ar} onChange={set('name_ar')} /></div>
              </div>

              <div><label className="input-label">Description</label><textarea className="input-field" rows={3} value={form.description_en} onChange={set('description_en')} /></div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div><label className="input-label">Price (DZD) *</label><input type="number" className="input-field" value={form.price} onChange={set('price')} /></div>
                <div><label className="input-label">Compare Price</label><input type="number" className="input-field" value={form.compare_at_price} onChange={set('compare_at_price')} /></div>
                <div><label className="input-label">Stock</label><input type="number" className="input-field" value={form.stock_quantity} onChange={set('stock_quantity')} /></div>
              </div>

              <div><label className="input-label">SKU</label><input className="input-field" value={form.sku} onChange={set('sku')} /></div>

              {/* ============ IMAGE UPLOAD SECTION ============ */}
              <div>
                <label className="input-label flex items-center gap-2"><Image size={16} /> Product Images</label>
                
                {/* Current images */}
                {form.images.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Trash2 size={14} className="text-white" />
                        </button>
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-[8px] text-center font-bold py-0.5">MAIN</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add image by URL */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input-field !pl-9 text-sm" placeholder="Paste image URL (https://...)" value={imageInput} onChange={e => setImageInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
                  </div>
                  <button onClick={addImage} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors">
                    Add
                  </button>
                </div>

                {/* Help text */}
                <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1"><Upload size={12} /> How to add product images:</p>
                  <ol className="text-xs text-blue-600 mt-1 space-y-0.5 list-decimal list-inside">
                    <li>Go to <a href="https://imgbb.com" target="_blank" rel="noopener" className="underline font-semibold">imgbb.com</a> or <a href="https://postimages.org" target="_blank" rel="noopener" className="underline font-semibold">postimages.org</a></li>
                    <li>Upload your image (free, no account needed)</li>
                    <li>Copy the direct image link</li>
                    <li>Paste it above and click "Add"</li>
                  </ol>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-brand-500" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? 'Update' : 'Create'} Product</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
