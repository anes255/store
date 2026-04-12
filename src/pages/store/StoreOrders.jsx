import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import api from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, Hash, ChevronRight, User, Mail, FileText, RefreshCw, Download, MessageSquare, Bell } from 'lucide-react';

const statusConfig = {
  pending: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, labelKey: 'storePage.statusPending', labelDefault: 'Pending' },
  confirmed: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: Check, labelKey: 'storePage.statusConfirmed', labelDefault: 'Confirmed' },
  preparing: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', icon: Package, labelKey: 'storePage.statusPreparing', labelDefault: 'Preparing' },
  shipped: { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', icon: Truck, labelKey: 'storePage.statusShipped', labelDefault: 'Shipped' },
  delivered: { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Check, labelKey: 'storePage.statusDelivered', labelDefault: 'Delivered' },
  cancelled: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: Ban, labelKey: 'storePage.statusCancelled', labelDefault: 'Cancelled' },
  returned: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', icon: RefreshCw, labelKey: 'storePage.statusReturned', labelDefault: 'Returned' },
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
  const [companies, setCompanies] = useState([]);
  const [trackingForm, setTrackingForm] = useState({tracking_number:'',delivery_company_id:''});
  const [savingTracking, setSavingTracking] = useState(false);

  const loadOrders = async () => {
    if (!currentStore?.id) return;
    try {
      const { data } = await orderApi.getAll(currentStore.id, { status: filter, search });
      setOrders(data.orders); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadOrders(); }, [currentStore?.id, filter, search]);
  useEffect(() => { if(currentStore?.id) api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}); }, [currentStore?.id]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`${t('storePage.order', 'Order')} ${t(`storePage.status_${status}`, status)}`); loadOrders(); setSelectedOrder(null);
    } catch { toast.error(t('storePage.failed', 'Failed')); }
  };

  const viewOrder = async (orderId) => {
    try { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    catch { toast.error(t('storePage.failed', 'Failed')); }
  };

  const filters = [
    { key: 'all', label: t('storePage.allOrders', 'All Orders'), count: total },
    { key: 'pending', label: t('storePage.statusPending', 'Pending') },
    { key: 'confirmed', label: t('storePage.statusConfirmed', 'Confirmed') },
    { key: 'preparing', label: t('storePage.statusPreparing', 'Preparing') },
    { key: 'shipped', label: t('storePage.statusShipped', 'Shipped') },
    { key: 'delivered', label: t('storePage.statusDelivered', 'Delivered') },
    { key: 'cancelled', label: t('storePage.statusCancelled', 'Cancelled') },
  ];

  // Quick stats
  const pending = orders.filter(o => o.status === 'pending').length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const todayRevenue = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + parseFloat(o.total || 0), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{t('orders.title')}</h1><p className="text-xs sm:text-sm text-gray-400 mt-1">{total} {t('storePage.ordersTotal', 'orders total')}</p></div>
        <button onClick={loadOrders} className="btn-ghost text-xs sm:text-sm flex items-center gap-2 shrink-0"><RefreshCw size={14}/><span className="hidden sm:inline">{t('storePage.refresh', 'Refresh')}</span></button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.todaysOrders', "Today's Orders")}</p><p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{todayOrders}</p></div>
        <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.todaysRevenue', "Today's Revenue")}</p><p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{todayRevenue.toLocaleString()} <span className="text-xs sm:text-sm font-normal text-gray-400">DZD</span></p></div>
        <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.awaitingAction', 'Awaiting Action')}</p><p className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{pending}</p></div>
        <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.totalOrders', 'Total Orders')}</p><p className="text-xl sm:text-2xl font-black text-brand-600 mt-1">{total}</p></div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-visible">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max sm:w-auto">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field !pl-9 !py-2 text-sm w-full" placeholder={t('storePage.searchOrdersPlaceholder', 'Search by name, phone, or order #...')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>
      ) : orders.length === 0 ? (
        <div className="glass-card-solid p-16 text-center"><Package size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-semibold">{t('storePage.noOrdersFound', 'No orders found')}</p><p className="text-sm text-gray-400 mt-1">{filter !== 'all' ? t('storePage.tryDifferentFilter', 'Try a different filter') : t('storePage.ordersWillAppear', 'Orders will appear here once customers place them')}</p></div>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} uppercase`}>{t(sc.labelKey, sc.labelDefault)}</span>
                      {o.payment_status === 'paid' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">{t('storePage.paid', 'PAID')}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium"><User size={13} className="text-gray-400"/>{o.customer_name}</span>
                      <span className="flex items-center gap-1.5 text-gray-400"><Phone size={13}/>{o.customer_phone}</span>
                      <span className="flex items-center gap-1.5 text-gray-400"><Calendar size={13}/>{new Date(o.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {o.notification_preference && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.notification_preference==='whatsapp'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{o.notification_preference==='whatsapp'?'WA':'Email'}</span>}
                      {o.shipping_type && <span className="text-[9px] text-gray-400">{o.shipping_type==='home'?'🏠':'🏢'}</span>}
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
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header with status color */}
            <div className={`p-4 sm:p-6 ${statusConfig[selectedOrder.status]?.bg || 'bg-gray-50'} rounded-t-3xl sticky top-0 z-10`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-lg sm:text-xl font-black text-gray-900 break-all">{selectedOrder.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${statusConfig[selectedOrder.status]?.bg} ${statusConfig[selectedOrder.status]?.text} uppercase`}>{t(`storePage.status_${selectedOrder.status}`, selectedOrder.status)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12}/>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center shadow-sm shrink-0"><X size={18}/></button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Customer + Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('storePage.customer', 'Customer')}</p>
                  <p className="font-bold text-gray-900 flex items-center gap-2"><User size={14} className="text-gray-400"/>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Phone size={14} className="text-gray-400"/>{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-gray-400"/>{selectedOrder.customer_email}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('storePage.delivery', 'Delivery')}</p>
                  <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/>{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-gray-500 mt-1">{[selectedOrder.shipping_city, selectedOrder.shipping_wilaya].filter(Boolean).join(', ')}</p>
                  <p className="text-sm font-medium mt-2 flex items-center gap-2"><CreditCard size={14} className="text-gray-400"/><span className="uppercase">{selectedOrder.payment_method?.replace('_', ' ')}</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedOrder.payment_status}</span>
                  </p>
                  {selectedOrder.shipping_type && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2"><Truck size={14} className="text-gray-400"/>{selectedOrder.shipping_type === 'home' ? '🏠 Home Delivery' : '🏢 Desk / Relay Point'}</p>
                  )}
                  {selectedOrder.notification_preference && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Bell size={14} className="text-gray-400"/>
                      {selectedOrder.notification_preference === 'whatsapp'
                        ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700"><svg viewBox="0 0 24 24" width="12" height="12" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>WhatsApp</span>
                        : <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700"><Mail size={12}/>Email</span>
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="flex items-center justify-between px-2 overflow-x-auto -mx-2 pb-1">
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
                        <span className={`text-[10px] font-bold ${done ? 'text-gray-700' : 'text-gray-400'}`}>{t(sc2.labelKey, sc2.labelDefault)}</span>
                      </div>
                      {i < 4 && <div className={`flex-1 h-0.5 ${thisIdx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'} mx-1`}/>}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">{t('storePage.items', 'Items')} ({selectedOrder.items?.length || 0})</p>
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
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('storePage.subtotal', 'Subtotal')}</span><span className="font-medium">{parseFloat(selectedOrder.subtotal).toLocaleString()} DZD</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('storePage.shipping', 'Shipping')}</span><span className="font-medium">{parseFloat(selectedOrder.shipping_cost).toLocaleString()} DZD</span></div>
                {parseFloat(selectedOrder.discount_amount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{t('storePage.discount', 'Discount')}</span><span className="text-emerald-600 font-medium">-{parseFloat(selectedOrder.discount_amount).toLocaleString()} DZD</span></div>}
                <div className="flex justify-between font-black text-xl pt-2 border-t border-gray-200"><span>{t('storePage.total', 'Total')}</span><span className="text-brand-600">{parseFloat(selectedOrder.total).toLocaleString()} DZD</span></div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && <div className="p-4 bg-blue-50 rounded-2xl"><p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Customer Notes</p><p className="text-sm text-blue-700">{selectedOrder.notes}</p></div>}

              {/* Tracking Assignment */}
              {(selectedOrder.status==='shipped'||selectedOrder.status==='confirmed'||selectedOrder.status==='preparing') && (
                <div className="p-4 bg-cyan-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-bold text-cyan-600 uppercase">Tracking Information</p>
                  {selectedOrder.tracking_number ? (
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-cyan-600"/>
                      <div className="flex-1">
                        <p className="font-mono font-bold text-sm text-gray-800">{selectedOrder.tracking_number}</p>
                        {selectedOrder.tracking_status && <p className="text-xs text-cyan-600 capitalize">{selectedOrder.tracking_status.replace(/_/g,' ')}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select className="input-field !py-2 text-sm" value={trackingForm.delivery_company_id} onChange={e=>setTrackingForm({...trackingForm,delivery_company_id:e.target.value})}>
                        <option value="">Select delivery company</option>
                        {companies.map(c=><option key={c.id} value={c.id}>{c.name}{c.provider_type!=='manual'?` (${c.provider_type})`:''}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input className="input-field !py-2 text-sm flex-1" placeholder="Tracking number" value={trackingForm.tracking_number} onChange={e=>setTrackingForm({...trackingForm,tracking_number:e.target.value})}/>
                        <button disabled={!trackingForm.tracking_number||savingTracking} onClick={async()=>{
                          setSavingTracking(true);
                          try{
                            await api.patch(`/manage/stores/${currentStore.id}/orders/${selectedOrder.id}/tracking`,trackingForm);
                            toast.success('Tracking saved!');setTrackingForm({tracking_number:'',delivery_company_id:''});
                            const{data}=await orderApi.getOne(currentStore.id,selectedOrder.id);setSelectedOrder(data);loadOrders();
                          }catch{toast.error('Failed');}
                          setSavingTracking(false);
                        }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-1 shrink-0">
                          {savingTracking?<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Truck size={12}/>}Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div className="space-y-2 w-full">
                    <p className="text-xs font-bold text-gray-400 uppercase">Update Status</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedOrder.status !== 'confirmed' && <button onClick={() => updateStatus(selectedOrder.id, 'confirmed')} className="py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"><Check size={18}/>Confirm Order</button>}
                      {selectedOrder.status !== 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600"><Package size={18}/>Preparing</button>}
                      {selectedOrder.status !== 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600"><Truck size={18}/>Shipped</button>}
                      {selectedOrder.status !== 'delivered' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600"><Check size={18}/>Delivered</button>}
                    </div>
                    <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="w-full py-3 rounded-xl text-red-600 font-bold text-sm flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200"><Ban size={16}/>Cancel Order</button>
                  </div>
                )}

                {/* Send Email */}
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs font-bold text-blue-600 mb-2">Send Email Update</p>
                  {selectedOrder.customer_email ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 flex-1 truncate">{selectedOrder.customer_email}</span>
                      <button onClick={async()=>{try{const{data}=await orderApi.sendOrderEmail(currentStore.id,selectedOrder.id,{});if(data.success)toast.success('Email sent!');else toast.error(data.reason||'Failed');}catch(e){toast.error(e.response?.data?.error||'Failed');}}} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center gap-1"><Mail size={12}/>Send</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">No email on this order. Enter one manually:</p>
                      <div className="flex gap-2">
                        <input id="manual-email" type="email" className="input-field flex-1 !py-2 text-sm" placeholder="customer@email.com"/>
                        <button onClick={async()=>{const email=document.getElementById('manual-email')?.value;if(!email)return toast.error('Enter email');try{const{data}=await orderApi.sendOrderEmail(currentStore.id,selectedOrder.id,{email});if(data.success)toast.success('Email sent!');else toast.error(data.reason||'Failed');}catch(e){toast.error(e.response?.data?.error||'Failed');}}} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 shrink-0 flex items-center gap-1"><Mail size={12}/>Send</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
