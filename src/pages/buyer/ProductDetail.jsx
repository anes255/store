import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeApi } from '../../utils/api';
import { useCartStore, useLangStore } from '../../hooks/useStore';
import toast from 'react-hot-toast';
import { ShoppingCart, Heart, Minus, Plus, ArrowLeft, Star, Truck, Shield, Package } from 'lucide-react';

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { addItem } = useCartStore();
  const { lang } = useLangStore();
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storeRes, productRes] = await Promise.all([
          storeApi.getStore(storeSlug),
          storeApi.getProduct(storeSlug, productSlug),
        ]);
        setStore(storeRes.data);
        setProduct(productRes.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [storeSlug, productSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!product || !store) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Product not found</p></div>;

  const getName = (item) => lang === 'ar' ? (item.name_ar || item.name_en) : lang === 'fr' ? (item.name_fr || item.name_en) : item.name_en;
  const getDesc = () => lang === 'ar' ? (product.description_ar || product.description_en) : lang === 'fr' ? (product.description_fr || product.description_en) : product.description_en;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={18} /><span className="font-semibold text-sm">Back to Store</span>
          </Link>
          <span className="font-extrabold font-display" style={{ color: store.primary_color }}>{store.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden">
              {product.thumbnail ? <img src={product.thumbnail} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-300" /></div>}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border-2 border-transparent hover:border-brand-500 cursor-pointer">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 font-display">{getName(product)}</h1>
            {product.reviews?.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}</div>
                <span className="text-sm text-gray-400">({product.reviews.length} reviews)</span>
              </div>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold" style={{ color: store.primary_color }}>{parseFloat(product.price).toLocaleString()} {store.currency || 'DZD'}</span>
              {product.compare_at_price && (
                <span className="text-lg text-gray-400 line-through">{parseFloat(product.compare_at_price).toLocaleString()} {store.currency || 'DZD'}</span>
              )}
            </div>

            {getDesc() && <p className="mt-4 text-gray-600 leading-relaxed">{getDesc()}</p>}

            {/* Stock */}
            <div className="mt-4">
              {product.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold"><span className="w-2 h-2 bg-emerald-500 rounded-full" />{product.stock_quantity} in stock</span>
              ) : (
                <span className="text-red-500 text-sm font-semibold">Out of stock</span>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-0 bg-gray-100 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-200 rounded-l-xl"><Minus size={16} /></button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-200 rounded-r-xl"><Plus size={16} /></button>
              </div>
              <button onClick={() => { addItem(product, quantity); toast.success('Added to cart!'); }}
                className="flex-1 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: store.primary_color }}>
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button className="p-3.5 rounded-xl border-2 border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                <Heart size={18} />
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Fast Delivery', desc: 'All 58 wilayas' },
                { icon: Shield, label: 'Secure Payment', desc: 'Multiple options' },
                { icon: Package, label: 'Easy Returns', desc: '30-day policy' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                    <Icon size={18} className="mx-auto text-gray-500 mb-1" />
                    <p className="text-xs font-bold text-gray-700">{f.label}</p>
                    <p className="text-[10px] text-gray-400">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
