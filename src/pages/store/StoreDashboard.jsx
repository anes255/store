import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { ownerApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';
import {
  Eye, DollarSign, ShoppingCart, TrendingUp, Package, Plus, ArrowUpRight,
  Store as StoreIcon, Sparkles
} from 'lucide-react';

function CreateStoreModal({ open, onClose, onCreate }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState('');

  const autoSlug = (val) => val.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (val) => {
    setName(val);
    if (!slug || slug === autoSlug(name)) setSlug(autoSlug(val));
  };

  const handleSlugChange = (val) => {
    const clean = autoSlug(val);
    setSlug(clean);
    if (clean.length < 3) setSlugError(t('storePage.slugMinChars', 'At least 3 characters'));
    else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(clean) && clean.length > 2) setSlugError(t('storePage.slugInvalidChars', 'Letters, numbers, and dashes only'));
    else setSlugError('');
  };

  const handleCreate = async () => {
    if (!name) return toast.error(t('storePage.storeNameRequired', 'Store name is required'));
    if (!slug || slug.length < 3) return toast.error(t('storePage.storeUrlRequired', 'Store URL is required (min 3 characters)'));
    if (slugError) return toast.error(slugError);
    setLoading(true);
    try {
      const { data } = await ownerApi.createStore({ name, slug, description: desc });
      toast.success(t('storePage.storeCreated', 'Store created!'));
      onCreate(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || t('storePage.failed', 'Failed')); }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{t('storePage.createNewStore', 'Create New Store')}</h2>
        <div className="space-y-4">
          <div><label className="input-label">{t('storePage.storeNameLabel', 'Store Name *')}</label><input className="input-field" value={name} onChange={e => handleNameChange(e.target.value)} placeholder={t('storePage.storeNamePlaceholder', 'My Awesome Store')} /></div>
          <div>
            <label className="input-label">{t('storePage.storeUrlLabel', 'Store URL *')}</label>
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <span className="px-3 text-sm text-gray-400 shrink-0">kyomarket.com/</span>
              <input className="flex-1 px-2 py-3 bg-transparent text-sm font-bold text-brand-600 focus:outline-none" value={slug} onChange={e => handleSlugChange(e.target.value)} placeholder={t('storePage.storeUrlPlaceholder', 'my-store')} />
            </div>
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
            {slug && !slugError && <p className="text-xs text-emerald-500 mt-1">{t('storePage.storeWillBeAt', 'Your store will be at')} kyomarket.com/{slug}</p>}
          </div>
          <div><label className="input-label">{t('storePage.description', 'Description')}</label><textarea className="input-field" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('storePage.descriptionPlaceholder', 'What does your store sell?')} /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">{t('storePage.cancel', 'Cancel')}</button>
          <button onClick={handleCreate} disabled={loading || !slug || slug.length < 3} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? t('storePage.creating', 'Creating...') : t('storePage.createStore', 'Create Store')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoreDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentStore, setCurrentStore, stores, setStores } = useStoreManagement();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data } = await ownerApi.getStores();
        setStores(data);
        if (data.length > 0 && !currentStore) setCurrentStore(data[0]);
      } catch {} finally { setLoading(false); }
    };
    loadStores();
  }, []);

  useEffect(() => {
    if (currentStore?.id) {
      ownerApi.getDashboard(currentStore.id).then(r => setDashboard(r.data)).catch(() => {});
      api.get(`/manage/stores/${currentStore.id}/products`).then(r => setProducts(r.data?.products || r.data || [])).catch(() => {});
    }
  }, [currentStore?.id]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div></DashboardLayout>;

  if (stores.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mx-auto mb-6">
              <StoreIcon size={36} className="text-brand-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('storePage.createFirstStore', 'Create Your First Store')}</h2>
            <p className="text-gray-500 mb-6">{t('storePage.startSelling', 'Start selling in minutes. Set up your store with a beautiful design and powerful features.')}</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus size={18} /> {t('storePage.createStore', 'Create Store')}
            </button>
          </div>
        </div>
        <CreateStoreModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={(store) => { setStores([...stores, store]); setCurrentStore(store); }} />
      </DashboardLayout>
    );
  }

  const stats = dashboard?.stats || {};
  const salesData = dashboard?.salesData || [];

  const statCards = [
    { icon: Eye, label: t('dashboard.storeVisits'), value: stats.storeVisits?.toLocaleString() || '0', color: 'from-blue-500 to-cyan-500', change: '+8.2%' },
    { icon: DollarSign, label: t('dashboard.totalSales'), value: `${(stats.totalRevenue || 0).toLocaleString()} DZD`, color: 'from-emerald-500 to-teal-500', change: '+12.5%' },
    { icon: ShoppingCart, label: t('dashboard.totalOrders'), value: stats.totalOrders || 0, color: 'from-purple-500 to-pink-500', change: '+8.2%' },
    { icon: TrendingUp, label: t('dashboard.avgOrderValue'), value: `${stats.avgOrderValue || '0'} DZD`, color: 'from-amber-500 to-orange-500', change: '+5.1%' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-500 via-purple-500 to-brand-600 rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1.22676%200C1.91374%200%202.45351%200.539773%202.45351%201.22676C2.45351%201.91374%201.91374%202.45351%201.22676%202.45351C0.539773%202.45351%200%201.91374%200%201.22676C0%200.539773%200.539773%200%201.22676%200Z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.06)%22%2F%3E%3C%2Fsvg%3E')]" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('dashboard.welcome')} 👋</h2>
            <p className="text-white/70 mt-1">{currentStore?.name}</p>
            <p className="text-white/50 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link to={`/s/${currentStore?.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-all">
            <Eye size={16} /> {t('storePage.viewStore', 'View Store')}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('dashboard.addProduct'), icon: Plus, path: '/dashboard/products', color: 'bg-blue-500' },
          { label: t('dashboard.viewOrders'), icon: ShoppingCart, path: '/dashboard/orders', color: 'bg-purple-500' },
          { label: t('dashboard.customers'), icon: Eye, path: '/dashboard/customers', color: 'bg-emerald-500' },
          { label: t('dashboard.settings'), icon: Sparkles, path: '/dashboard/settings', color: 'bg-orange-500' },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.path} className={`${action.color} rounded-2xl p-5 text-white hover:opacity-90 transition-all group shadow-lg`}>
              <Icon size={24} className="mb-2" />
              <span className="font-bold text-sm">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card-solid p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={12} />{s.change}
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts + Products */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card-solid p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{t('dashboard.salesOverview')}</h3>
            <span className="text-xs text-gray-400">{t('storePage.last7DaysPerformance', 'Last 7 days performance')}</span>
          </div>
          {(()=>{
            const fallback=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return{date:d.toISOString().split('T')[0],revenue:0,orders:0};});
            const chartData=salesData.length>=2?salesData.map(d=>({...d,revenue:parseFloat(d.revenue||d.total||0),orders:parseInt(d.orders||d.count||0)})):fallback;
            return(
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={v => {try{const p=(v||'').split('-');return p.length>=3?`${p[1]}/${p[2]}`:v;}catch{return v;}}} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={(v,name)=>[`${parseFloat(v).toLocaleString()}${name==='revenue'?' DZD':''}`,name==='revenue'?t('storePage.revenue','Revenue'):t('storePage.orders','Orders')]} />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#colorRev)" name="revenue" />
                <Area type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} fill="url(#colorOrd)" name="orders" />
              </AreaChart>
            </ResponsiveContainer>);
          })()}
        </div>

        <div className="glass-card-solid p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('dashboard.orderStatus')}</h3>
          <div className="space-y-3">
            {['pending', 'confirmed', 'preparing', 'shipped', 'delivered'].map((status, i) => {
              const count = dashboard?.recentOrders?.filter(o => o.status === status).length || 0;
              const colors = { pending: 'bg-amber-500', confirmed: 'bg-blue-500', preparing: 'bg-purple-500', shipped: 'bg-cyan-500', delivered: 'bg-emerald-500' };
              return (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">{t(`storePage.status_${status}`, status)}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-solid p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Package size={20} className="text-orange-500" /></div>
              <div><p className="text-xs text-gray-400 uppercase tracking-wider">{t('storePage.products', 'Products')}</p><p className="text-xl font-extrabold text-gray-900">{stats.totalProducts || products.length || 0}</p></div>
            </div>
            <Link to="/dashboard/products" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">{t('dashboard.viewAll','View All')} <ArrowUpRight size={12}/></Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {products.slice(0, 8).map(p => {
                const img = p.image || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : null);
                return (
                  <Link key={p.id} to="/dashboard/products" className="group">
                    <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-1">
                      {img ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-gray-300"/></div>}
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 truncate">{p.name}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('dashboard.noProducts','No products yet')}</p>
          )}
        </div>

        <div className="glass-card-solid p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('dashboard.recentOrders')}</h3>
          {dashboard?.recentOrders?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recentOrders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    {o.first_image ? <img src={o.first_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"/> : <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-gray-400"/></div>}
                    <div className="min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{o.order_number}</p><p className="text-xs text-gray-400 truncate">{o.customer_name}{o.items?.length>1?` · +${o.items.length-1} more`:''}</p></div>
                  </div>
                  <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</p><span className={`badge badge-${o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'info'} text-[10px]`}>{t(`storePage.status_${o.status}`, o.status)}</span></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('storePage.noOrdersYet', 'No orders yet')}</p>}
        </div>
      </div>

      {/* Top Products */}
      {products.length > 0 && (
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">{t('dashboard.topProducts', 'Top Products')}</h3>
            <Link to="/dashboard/products" className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              {t('dashboard.viewAll', 'View All')} <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((p) => (
              <div key={p.id} className="glass-card-solid p-4 group hover:shadow-lg transition-all">
                <div className="w-full aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
                  {p.image || p.images?.[0] ? (
                    <img
                      src={p.image || p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 truncate">{p.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-brand-600">{parseFloat(p.price || 0).toLocaleString()} DZD</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (p.stock ?? p.quantity ?? 0) > 10
                      ? 'bg-emerald-100 text-emerald-700'
                      : (p.stock ?? p.quantity ?? 0) > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {(p.stock ?? p.quantity ?? 0) > 0
                      ? `${p.stock ?? p.quantity} ${t('dashboard.inStock', 'in stock')}`
                      : t('dashboard.outOfStock', 'Out of stock')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateStoreModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={(store) => { setStores([...stores, store]); setCurrentStore(store); }} />
    </DashboardLayout>
  );
}
