import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, Hash, ChevronRight, User, Mail, FileText, RefreshCw, Download } from 'lucide-react';

const statusConfig = {
  pending: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: Check, label: 'Confirmed' },
  preparing: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', icon: Package, label: 'Preparing' },
  shipped: { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Check, label: 'Delivered' },
  cancelled: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: Ban, label: 'Cancelled' },
  returned: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', icon: RefreshCw, label: 'Returned' },
};

export default function StoreOrders() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!currentStore?.id) return;
    try {
      const { data } = await orderApi.getAll(currentStore.id, { status: filter, search });
      setOrders(data.orders); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadOrders(); }, [currentStore?.id, filter, search]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`Order ${status}`); loadOrders(); setSelectedOrder(null);
    } catch { toast.error('Failed'); }
  };

  const viewOrder = async (orderId) => {
    try { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    catch { toast.error('Failed'); }
  };

  const filters = [
    { key: 'all', label: 'All Orders', count: total },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Quick stats
  const pending = orders.filter(o => o.status === 'pending').length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const todayRevenue = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + parseFloat(o.total || 0), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1><p className="text-sm text-gray-400 mt-1">{total} orders total</p></div>
        <button onClick={loadOrders} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>Refresh</button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Today's Orders</p><p className="text-2xl font-black text-gray-900 mt-1">{todayOrders}</p></div>
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Today's Revenue</p><p className="text-2xl font-black text-emerald-600 mt-1">{todayRevenue.toLocaleString()} <span className="text-sm font-normal text-gray-400">DZD</span></p></div>
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Awaiting Action</p><p className="text-2xl font-black text-amber-500 mt-1">{pending}</p></div>
        <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">Total Orders</p><p className="text-2xl font-black text-brand-600 mt-1">{total}</p></div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !pl-9 !py-2 text-sm" placeholder="Search by name, phone, or order #..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>
      ) : orders.length === 0 ? (
        <div className="glass-card-solid p-16 text-center"><Package size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-semibold">No orders found</p><p className="text-sm text-gray-400 mt-1">{filter !== 'all' ? 'Try a different filter' : 'Orders will appear here once customers place them'}</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const sc = statusConfig[o.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <div key={o.id} onClick={() => viewOrder(o.id)} className="glass-card-solid p-5 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div className={`w-12 h-12 rounded-2xl ${sc.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon size={20} className={sc.text} />
                  </div>
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-sm text-brand-600">{o.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} uppercase`}>{sc.label}</span>
                      {o.payment_status === 'paid' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">PAID</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium"><User size={13} className="text-gray-400"/>{o.customer_name}</span>
                      <span className="flex items-center gap-1.5 text-gray-400"><Phone size={13}/>{o.customer_phone}</span>
                      <span className="flex items-center gap-1.5 text-gray-400"><Calendar size={13}/>{new Date(o.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {/* Price + method */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-gray-900">{parseFloat(o.total).toLocaleString()} <span className="text-xs font-normal text-gray-400">DZD</span></p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{o.payment_method?.replace('_', ' ')}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0"/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with status color */}
            <div className={`p-6 ${statusConfig[selectedOrder.status]?.bg || 'bg-gray-50'} rounded-t-3xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-gray-900">{selectedOrder.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[selectedOrder.status]?.bg} ${statusConfig[selectedOrder.status]?.text} uppercase`}>{selectedOrder.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12}/>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center shadow-sm"><X size={18}/></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer + Shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Customer</p>
                  <p className="font-bold text-gray-900 flex items-center gap-2"><User size={14} className="text-gray-400"/>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Phone size={14} className="text-gray-400"/>{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-gray-400"/>{selectedOrder.customer_email}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Delivery</p>
                  <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/>{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-gray-500 mt-1">{[selectedOrder.shipping_city, selectedOrder.shipping_wilaya].filter(Boolean).join(', ')}</p>
                  <p className="text-sm font-medium mt-2 flex items-center gap-2"><CreditCard size={14} className="text-gray-400"/><span className="uppercase">{selectedOrder.payment_method?.replace('_', ' ')}</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedOrder.payment_status}</span>
                  </p>
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="flex items-center justify-between px-2">
                {['pending', 'confirmed', 'preparing', 'shipped', 'delivered'].map((st, i) => {
                  const steps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
                  const currentIdx = steps.indexOf(selectedOrder.status);
                  const thisIdx = i;
                  const done = thisIdx <= currentIdx && selectedOrder.status !== 'cancelled';
                  const sc2 = statusConfig[st];
                  return (
                    <React.Fragment key={st}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${done ? sc2.color : 'bg-gray-200'}`}>
                          {done ? <Check size={14}/> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold ${done ? 'text-gray-700' : 'text-gray-400'}`}>{sc2.label}</span>
                      </div>
                      {i < 4 && <div className={`flex-1 h-0.5 ${thisIdx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'} mx-1`}/>}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Items ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.product_image ? <img src={item.product_image} className="w-14 h-14 rounded-xl object-cover bg-gray-100" alt=""/> : <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center"><Package size={20} className="text-gray-400"/></div>}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.quantity} × {parseFloat(item.unit_price).toLocaleString()} DZD</p>
                      </div>
                      <p className="font-bold text-sm">{parseFloat(item.total_price).toLocaleString()} DZD</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{parseFloat(selectedOrder.subtotal).toLocaleString()} DZD</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="font-medium">{parseFloat(selectedOrder.shipping_cost).toLocaleString()} DZD</span></div>
                {parseFloat(selectedOrder.discount_amount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-emerald-600 font-medium">-{parseFloat(selectedOrder.discount_amount).toLocaleString()} DZD</span></div>}
                <div className="flex justify-between font-black text-xl pt-2 border-t border-gray-200"><span>Total</span><span className="text-brand-600">{parseFloat(selectedOrder.total).toLocaleString()} DZD</span></div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && <div className="p-4 bg-blue-50 rounded-2xl"><p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Customer Notes</p><p className="text-sm text-blue-700">{selectedOrder.notes}</p></div>}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedOrder.status === 'pending' && <button onClick={() => updateStatus(selectedOrder.id, 'confirmed')} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"><Check size={16}/>Confirm Order</button>}
                {selectedOrder.status === 'confirmed' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600"><Package size={16}/>Start Preparing</button>}
                {selectedOrder.status === 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600"><Truck size={16}/>Mark Shipped</button>}
                {selectedOrder.status === 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600"><Check size={16}/>Mark Delivered</button>}
                {!['delivered', 'cancelled'].includes(selectedOrder.status) && <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="px-6 py-3 rounded-xl text-red-600 font-bold text-sm flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100"><Ban size={16}/>Cancel</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
