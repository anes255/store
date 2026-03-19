import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Search, Filter, Eye, ChevronDown, X, Truck, Check, Clock, Package, Ban } from 'lucide-react';

const statusColors = {
  pending: 'badge-warning', confirmed: 'badge-info', preparing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700', delivered: 'badge-success', cancelled: 'badge-danger', returned: 'badge-neutral',
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
      setOrders(data.orders);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [currentStore?.id, filter, search]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`Order ${status}`);
      loadOrders();
      setSelectedOrder(null);
    } catch { toast.error('Failed to update'); }
  };

  const viewOrder = async (orderId) => {
    try {
      const { data } = await orderApi.getOne(currentStore.id, orderId);
      setSelectedOrder(data);
    } catch { toast.error('Failed to load order'); }
  };

  const filters = ['all', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('orders.title')}</h1>
        <span className="text-sm text-gray-500">{total} orders total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {f === 'all' ? 'All' : t(`orders.${f}`)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !pl-9 !py-2 text-sm" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container bg-white">
        <table>
          <thead>
            <tr><th>{t('orders.orderNumber')}</th><th>{t('orders.customer')}</th><th>{t('orders.paymentMethod')}</th><th>{t('orders.total')}</th><th>{t('orders.status')}</th><th>{t('orders.date')}</th><th>{t('orders.actions')}</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">{loading ? t('common.loading') : t('orders.noOrders')}</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td className="font-semibold text-gray-800 font-mono text-xs">{o.order_number}</td>
                <td><div><p className="font-medium text-gray-800 text-sm">{o.customer_name}</p><p className="text-xs text-gray-400">{o.customer_phone}</p></div></td>
                <td><span className="badge badge-neutral text-[10px] uppercase">{o.payment_method?.replace('_', ' ')}</span></td>
                <td className="font-bold text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</td>
                <td><span className={`badge ${statusColors[o.status]} capitalize`}>{o.status}</span></td>
                <td className="text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => viewOrder(o.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order {selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Customer</p>
                <p className="font-semibold text-gray-800">{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>
                <p className="text-sm text-gray-500">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_wilaya}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Payment</p>
                <p className="font-semibold text-gray-800 uppercase">{selectedOrder.payment_method?.replace('_', ' ')}</p>
                <span className={`badge ${selectedOrder.payment_status === 'paid' ? 'badge-success' : 'badge-warning'} mt-1`}>{selectedOrder.payment_status}</span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {item.product_image && <img src={item.product_image} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                      <div><p className="font-medium text-sm text-gray-800">{item.product_name}</p><p className="text-xs text-gray-400">Qty: {item.quantity}</p></div>
                    </div>
                    <p className="font-bold text-sm">{parseFloat(item.total_price).toLocaleString()} DZD</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{parseFloat(selectedOrder.subtotal).toLocaleString()} DZD</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{parseFloat(selectedOrder.shipping_cost).toLocaleString()} DZD</span></div>
              {selectedOrder.discount_amount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-emerald-600">-{parseFloat(selectedOrder.discount_amount).toLocaleString()} DZD</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{parseFloat(selectedOrder.total).toLocaleString()} DZD</span></div>
            </div>

            {/* Status Actions */}
            <div className="flex flex-wrap gap-2 mt-6">
              {selectedOrder.status === 'pending' && <button onClick={() => updateStatus(selectedOrder.id, 'confirmed')} className="btn-primary text-sm flex items-center gap-1"><Check size={14} />Confirm</button>}
              {selectedOrder.status === 'confirmed' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="btn-primary text-sm flex items-center gap-1"><Package size={14} />Prepare</button>}
              {selectedOrder.status === 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="btn-primary text-sm flex items-center gap-1"><Truck size={14} />Ship</button>}
              {selectedOrder.status === 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="btn-primary text-sm flex items-center gap-1 !bg-emerald-500"><Check size={14} />Delivered</button>}
              {!['delivered', 'cancelled'].includes(selectedOrder.status) && <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="btn-danger text-sm flex items-center gap-1"><Ban size={14} />Cancel</button>}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
