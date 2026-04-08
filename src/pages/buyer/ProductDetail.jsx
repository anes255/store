import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeApi } from '../../utils/api';
import { useCartStore, useLangStore, useAuthStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star, Truck, Shield, Package, Check, User, Globe } from 'lucide-react';
import Checkout from './Checkout';

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { addItem, getCount } = useCartStore();
  const { lang } = useLangStore();
  const { token:authToken, role:authRole } = useAuthStore();
  const isLoggedInCustomer = !!authToken && authRole === 'customer';
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sr, pr] = await Promise.all([storeApi.getStore(storeSlug), storeApi.getProduct(storeSlug, productSlug)]);
        setStore(sr.data); setProduct(pr.data);
      } catch {}
      setLoading(false);
    })();
  }, [storeSlug, productSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin"/></div>;
  if (!product || !store) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Product not found</p></div>;

  const getName = (item) => lang==='ar'?(item.name_ar||item.name_en):lang==='fr'?(item.name_fr||item.name_en):item.name_en;
  const getDesc = () => lang==='ar'?(product.description_ar||product.description_en):lang==='fr'?(product.description_fr||product.description_en):product.description_en;
  const pc = store.primary_color || '#7C3AED';

  let variants = product.variants || [];
  if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
  if (!Array.isArray(variants)) variants = [];

  const variantGroups = {};
  variants.forEach((v,i) => { const t = v.type||'option'; if(!variantGroups[t])variantGroups[t]=[]; variantGroups[t].push({...v,_idx:i}); });

  const sv = selectedVariant !== null ? variants[selectedVariant] : null;
  const displayImages = (sv?.images?.length > 0) ? sv.images : (Array.isArray(product.images) ? product.images : [product.thumbnail].filter(Boolean));
  const basePrice = parseFloat(product.price) || 0;
  const priceAdj = sv ? (parseFloat(sv.price_adjustment) || 0) : 0;
  const finalPrice = basePrice + priceAdj;
  const stockCount = sv ? (sv.stock || product.stock_quantity) : product.stock_quantity;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2.5">
            {store.logo ? <img src={store.logo} className="w-9 h-9 rounded-lg object-cover" alt=""/> : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{backgroundColor:pc}}>{store.name?.[0]}</div>}
            <span className="text-lg font-extrabold text-gray-900">{store.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/s/${storeSlug}`} className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft size={14}/>Store</Link>
            <Link to={`/s/${storeSlug}/${isLoggedInCustomer?'profile':'auth'}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><User size={20}/></Link>
            <Link to={`/s/${storeSlug}/favorites`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Heart size={20}/></Link>
            <button onClick={()=>setCartOpen(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative">
              <ShoppingCart size={20}/>
              {getCount()>0&&<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{getCount()}</span>}
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden">
              {displayImages[selectedImage]?<img src={displayImages[selectedImage]} className="w-full h-full object-cover" alt=""/>:<div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-300"/></div>}
            </div>
            {displayImages.length>1&&<div className="flex gap-2 overflow-x-auto pb-1">{displayImages.map((img,i)=><button key={i} onClick={()=>setSelectedImage(i)} className={`w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border-2 ${selectedImage===i?'border-brand-500 shadow-md':'border-transparent hover:border-gray-300'}`}><img src={img} className="w-full h-full object-cover" alt=""/></button>)}</div>}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{getName(product)}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold" style={{color:pc}}>{finalPrice.toLocaleString()} {store.currency||'DZD'}</span>
              {product.compare_at_price&&<span className="text-lg text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()}</span>}
              {priceAdj!==0&&<span className="text-xs text-gray-400">({priceAdj>0?'+':''}{priceAdj})</span>}
            </div>
            {getDesc()&&<p className="mt-4 text-gray-600 leading-relaxed">{getDesc()}</p>}
            {sv?.description&&<p className="mt-2 text-sm text-gray-500 italic">{sv.description}</p>}
            <div className="mt-3">{stockCount>0?<span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold"><span className="w-2 h-2 bg-emerald-500 rounded-full"/>{store.show_stock_storefront?`${stockCount} in stock`:'In stock'}</span>:<span className="text-red-500 text-sm font-semibold">Out of stock</span>}</div>

            {Object.keys(variantGroups).length>0&&<div className="mt-6 space-y-4">{Object.entries(variantGroups).map(([type,items])=><div key={type}><p className="text-xs font-bold text-gray-400 uppercase mb-2">{type==='color'?'Color':type==='size'?'Size':type}</p><div className="flex flex-wrap gap-2">{items.map(v=>{const isSel=selectedVariant===v._idx;return type==='color'?<button key={v._idx} onClick={()=>{setSelectedVariant(isSel?null:v._idx);setSelectedImage(0);}} className={`relative w-10 h-10 rounded-full border-2 transition-all ${isSel?'border-gray-900 scale-110 shadow-md':'border-gray-200 hover:border-gray-400'}`} style={{backgroundColor:v.value||'#ccc'}} title={v.name}>{isSel&&<Check size={14} className="absolute inset-0 m-auto text-white drop-shadow"/>}</button>:<button key={v._idx} onClick={()=>{setSelectedVariant(isSel?null:v._idx);setSelectedImage(0);}} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${isSel?'border-gray-900 bg-gray-900 text-white':'border-gray-200 text-gray-700 hover:border-gray-400'}`}>{v.name}</button>;})}</div></div>)}</div>}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-xl"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} className="p-3 hover:bg-gray-200 rounded-l-xl"><Minus size={16}/></button><span className="w-12 text-center font-bold">{quantity}</span><button onClick={()=>setQuantity(quantity+1)} className="p-3 hover:bg-gray-200 rounded-r-xl"><Plus size={16}/></button></div>
              <button onClick={()=>{addItem({...product,price:finalPrice},quantity,sv?{name:sv.name,type:sv.type,value:sv.value}:null);toast.success('Added!');}} disabled={stockCount<=0} className="flex-1 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50" style={{backgroundColor:pc}}><ShoppingCart size={18}/>{store.btn_add_cart||'Add to Cart'}</button>
              <button className="p-3.5 rounded-xl border-2 border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500"><Heart size={18}/></button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">{[{icon:Truck,label:'Fast Delivery',desc:'All 58 wilayas'},{icon:Shield,label:'Secure',desc:'Multiple options'},{icon:Package,label:'Returns',desc:'30-day policy'}].map((f,i)=>{const I=f.icon;return<div key={i} className="p-3 bg-gray-50 rounded-xl text-center"><I size={18} className="mx-auto text-gray-500 mb-1"/><p className="text-xs font-bold text-gray-700">{f.label}</p><p className="text-[10px] text-gray-400">{f.desc}</p></div>;})}</div>
          </div>
        </div>

        {/* ═══ REVIEWS SECTION ═══ */}
        <ReviewsSection storeSlug={storeSlug} productSlug={productSlug} pc={pc}/>
      </div>
      {cartOpen && <Checkout isModal onClose={()=>setCartOpen(false)} storeSlug={storeSlug}/>}
    </div>
  );
}

function ReviewsSection({storeSlug,productSlug,pc}){
  const[reviews,setReviews]=React.useState([]);const[stats,setStats]=React.useState({});
  const[showForm,setShowForm]=React.useState(false);const[submitting,setSubmitting]=React.useState(false);
  const[form,setForm]=React.useState({customer_name:'',customer_phone:'',rating:5,title:'',content:''});

  React.useEffect(()=>{
    storeApi.getProductReviews(storeSlug,productSlug).then(r=>{setReviews(r.data.reviews||[]);setStats(r.data.stats||{});}).catch(()=>{});
  },[storeSlug,productSlug]);

  const submit=async()=>{
    if(!form.customer_name)return;
    setSubmitting(true);
    try{
      await storeApi.submitReview(storeSlug,productSlug,form);
      toast.success('Review submitted! It will appear after approval.');
      setShowForm(false);setForm({customer_name:'',customer_phone:'',rating:5,title:'',content:''});
      // Reload reviews
      const r=await storeApi.getProductReviews(storeSlug,productSlug);setReviews(r.data.reviews||[]);setStats(r.data.stats||{});
    }catch(e){toast.error(e.response?.data?.error||'Failed to submit review');}
    setSubmitting(false);
  };

  const avgRating=parseFloat(stats.avg_rating)||0;
  const total=parseInt(stats.total)||0;

  return(
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Customer Reviews</h2>
          {total>0&&<div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={16} className={i<=Math.round(avgRating)?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>
            <span className="text-sm font-bold text-gray-700">{avgRating}</span>
            <span className="text-sm text-gray-400">({total} review{total!==1?'s':''})</span>
          </div>}
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{backgroundColor:pc}}>Write a Review</button>
      </div>

      {showForm&&(
        <div className="p-5 bg-gray-50 rounded-2xl mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">Your Rating:</span>
            <div className="flex gap-1">{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setForm({...form,rating:i})}><Star size={24} className={i<=form.rating?'text-amber-400 fill-amber-400':'text-gray-300 hover:text-amber-300'}/></button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Your name *" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/>
            <input className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Phone (optional)" value={form.customer_phone} onChange={e=>setForm({...form,customer_phone:e.target.value})}/>
          </div>
          <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="Review title (optional)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" rows={3} placeholder="Write your review..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
          <div className="flex gap-2">
            <button onClick={()=>setShowForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={submit} disabled={submitting||!form.customer_name} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{backgroundColor:pc}}>
              {submitting?'Submitting...':'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {reviews.length===0?(
        <div className="text-center py-8"><p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p></div>
      ):(
        <div className="space-y-4">
          {reviews.map(r=>(
            <div key={r.id} className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:pc}}>{(r.customer_name||'?')[0].toUpperCase()}</div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{r.customer_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=r.rating?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>
                    <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {r.title&&<p className="font-semibold text-sm text-gray-800 mb-1">{r.title}</p>}
              {r.content&&<p className="text-sm text-gray-600">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
