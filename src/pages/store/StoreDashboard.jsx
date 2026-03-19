import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '../../utils/api';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';
import {
  Eye, DollarSign, ShoppingCart, TrendingUp, Package, Plus, ArrowUpRight,
  Store as StoreIcon, Sparkles
} from 'lucide-react';

function CreateStoreModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const { data } = await ownerApi.createStore({ name, description: desc });
      toast.success('Store created!');
      onCreate(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Create New Store</h2>
        <div className="space-y-4">
          <div><label className="input-label">Store Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome Store" /></div>
          <div><label className="input-label">Description</label><textarea className="input-field" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does your store sell?" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Store'}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your First Store</h2>
            <p className="text-gray-500 mb-6">Start selling in minutes. Set up your store with a beautiful design and powerful features.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus size={18} /> Create Store
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
            <Eye size={16} /> View Store
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
            <span className="text-xs text-gray-400">Last 7 days performance</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesData.length > 0 ? salesData : [{ date: 'Mon', revenue: 0 }, { date: 'Tue', revenue: 0 }]}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={v => v?.substring(5)} stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
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
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products count + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-solid p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Package size={20} className="text-orange-500" /></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wider">Products</p><p className="text-2xl font-extrabold text-gray-900">{stats.totalProducts || 0}</p></div>
          </div>
        </div>

        <div className="glass-card-solid p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('dashboard.recentOrders')}</h3>
          {dashboard?.recentOrders?.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recentOrders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div><p className="text-sm font-semibold text-gray-800">{o.order_number}</p><p className="text-xs text-gray-400">{o.customer_name}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</p><span className={`badge badge-${o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'info'} text-[10px]`}>{o.status}</span></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No orders yet</p>}
        </div>
      </div>

      <CreateStoreModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={(store) => { setStores([...stores, store]); setCurrentStore(store); }} />
    </DashboardLayout>
  );
}
