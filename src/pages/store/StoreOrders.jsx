import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import api from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, Hash, ChevronRight, ChevronDown, ChevronUp, User, Mail, FileText, RefreshCw, Download, MessageSquare, Bell, PhoneOff, PhoneMissed, RotateCcw, Hourglass, AlertTriangle, ShoppingBag, Loader2, ArrowUpDown, LayoutGrid, LayoutList, Zap, Timer, TrendingUp, Filter, CheckSquare, Square, Trash2, Archive, ArchiveRestore } from 'lucide-react';

const statusConfig = {
  new_order:      { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: ShoppingBag, label: 'New Order', labelFr: 'Nouvelle commande', labelAr: 'طلب جديد' },
  pending:        { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending', labelFr: 'En attente', labelAr: 'قيد الانتظار' },
  confirmed:      { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Check, label: 'Confirmed', labelFr: 'Confirmée', labelAr: 'مؤكد' },
  under_preparation: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Package, label: 'Under Preparation', labelFr: 'En préparation', labelAr: 'قيد التحضير' },
  preparing:      { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Package, label: 'Preparing', labelFr: 'En préparation', labelAr: 'قيد التحضير' },
  shipped:        { color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Truck, label: 'Shipped', labelFr: 'Expédiée', labelAr: 'تم الشحن' },
  delivered:      { color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Check, label: 'Delivered', labelFr: 'Livrée', labelAr: 'تم التسليم' },
  cancelled:      { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: Ban, label: 'Cancelled', labelFr: 'Annulée', labelAr: 'ملغاة' },
  awaiting:       { color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Hourglass, label: 'Awaiting', labelFr: 'En attente de réponse', labelAr: 'في انتظار الرد' },
  failed_call_1:  { color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: PhoneMissed, label: 'Failed Call 1', labelFr: 'Appel échoué 1', labelAr: 'فشل الاتصال 1' },
  failed_call_2:  { color: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: PhoneMissed, label: 'Failed Call 2', labelFr: 'Appel échoué 2', labelAr: 'فشل الاتصال 2' },
  failed_call_3:  { color: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: PhoneOff, label: 'Failed Call 3', labelFr: 'Appel échoué 3', labelAr: 'فشل الاتصال 3' },
  returned:       { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: RotateCcw, label: 'Returned', labelFr: 'Retournée', labelAr: 'مرتجعة' },
};

const allStatuses = ['new_order','pending','confirmed','under_preparation','shipped','delivered','cancelled','awaiting','failed_call_1','failed_call_2','failed_call_3','returned'];
const mainPipeline = ['new_order','confirmed','under_preparation','shipped','delivered'];

// Status category groupings for section headers
const statusCategories = {
  needs_action: { label: 'Needs Action', labelFr: 'Action requise', labelAr: 'يتطلب اجراء', statuses: ['new_order', 'pending'], color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Zap },
  in_progress: { label: 'In Progress', labelFr: 'En cours', labelAr: 'قيد التنفيذ', statuses: ['confirmed', 'under_preparation', 'preparing'], color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Package },
  in_transit: { label: 'In Transit', labelFr: 'En transit', labelAr: 'في الطريق', statuses: ['shipped'], color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Truck },
  follow_up: { label: 'Needs Follow-up', labelFr: 'Suivi requis', labelAr: 'يتطلب متابعة', statuses: ['awaiting', 'failed_call_1', 'failed_call_2', 'failed_call_3'], color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  completed: { label: 'Completed', labelFr: 'Terminee', labelAr: 'مكتمل', statuses: ['delivered'], color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Check },
  closed: { label: 'Closed', labelFr: 'Fermee', labelAr: 'مغلق', statuses: ['cancelled', 'returned'], color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: Ban },
};

function getStatusLabel(status, t) {
  const sc = statusConfig[status] || statusConfig.pending;
  return t(`storePage.status_${status}`, sc.label);
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getOrderAge(date) {
  const hours = (new Date() - new Date(date)) / (1000 * 60 * 60);
  if (hours < 1) return { label: 'New', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', urgency: 0 };
  if (hours < 24) return { label: 'Recent', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', urgency: 1 };
  if (hours < 72) return { label: 'Aging', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', urgency: 2 };
  return { label: 'Old', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', urgency: 3 };
}

function needsUrgentAttention(order) {
  const age = getOrderAge(order.created_at);
  const activeStatuses = ['new_order', 'pending', 'awaiting', 'failed_call_1', 'failed_call_2', 'failed_call_3'];
  return activeStatuses.includes(order.status) && age.urgency >= 2;
}

function formatDateTime(date) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

export default function StoreOrders() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const isArchiveRoute = typeof window !== 'undefined' && window.location.pathname.includes('orders-archive');
  const [archivedView, setArchivedView] = useState(isArchiveRoute ? 'vault' : 'active'); // 'active' | 'archived' | 'all' | 'vault'
  useEffect(() => { if (isArchiveRoute) setArchivedView('vault'); }, [isArchiveRoute]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [trackingForm, setTrackingForm] = useState({ tracking_number: '', delivery_company_id: '' });
  const [savingTracking, setSavingTracking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'grouped'
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'age'
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);

  const toggleSelect = (id) => setSelectedItems(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelectedItems(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const loadOrders = async () => {
    if (!currentStore?.id) return;
    try {
      const archivedParam = archivedView==='archived'?'only':(archivedView==='all'?'all':(archivedView==='vault'?'vault':undefined));
      const { data } = await orderApi.getAll(currentStore.id, { status: filter === 'all' ? undefined : filter, search, archived: archivedParam });
      setOrders(data.orders); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  const archiveOne = async (id, archived=true) => {
    try { await orderApi.archive(currentStore.id, id, archived); toast.success(archived?'Archived':'Restored'); loadOrders(); }
    catch { toast.error('Failed'); }
  };
  const bulkArchive = async (archived=true) => {
    if (!selectedItems.size) return;
    try { await orderApi.bulkArchive(currentStore.id, Array.from(selectedItems), archived); toast.success(`${archived?'Archived':'Restored'} ${selectedItems.size} orders`); clearSelection(); loadOrders(); }
    catch { toast.error('Failed'); }
  };

  useEffect(() => { loadOrders(); }, [currentStore?.id, filter, search, archivedView]);
  useEffect(() => { if (currentStore?.id) api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r => setCompanies(r.data || [])).catch(() => {}); }, [currentStore?.id]);

  const updateStatus = async (orderId, status) => {
    setUpdatingStatus(orderId + status);
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`Order → ${getStatusLabel(status, t)}`);
      loadOrders();
      if (selectedOrder?.id === orderId) {
        const { data } = await orderApi.getOne(currentStore.id, orderId);
        setSelectedOrder(data);
      }
    } catch { toast.error(t('storePage.failed', 'Failed')); }
    setUpdatingStatus(null);
  };

  const viewOrder = async (orderId) => {
    try { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    catch { toast.error(t('storePage.failed', 'Failed')); }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filters = [
    { key: 'all', label: t('storePage.allOrders', 'All'), icon: null },
    { key: 'new_order', label: 'New' },
    { key: 'pending', label: t('storePage.statusPending', 'Pending') },
    { key: 'confirmed', label: t('storePage.statusConfirmed', 'Confirmed') },
    { key: 'under_preparation', label: 'Preparing' },
    { key: 'shipped', label: t('storePage.statusShipped', 'Shipped') },
    { key: 'delivered', label: t('storePage.statusDelivered', 'Delivered') },
    { key: 'cancelled', label: t('storePage.statusCancelled', 'Cancelled') },
    { key: 'awaiting', label: 'Awaiting' },
    { key: 'failed_call_1', label: 'Call Fail' },
    { key: 'returned', label: t('storePage.statusReturned', 'Returned') },
  ];

  // Quick stats
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'new_order').length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const todayRevenue = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const failedCallsCount = orders.filter(o => o.status?.startsWith('failed_call')).length;
  const urgentCount = orders.filter(o => needsUrgentAttention(o)).length;

  // Sorted orders
  const sortedOrders = useMemo(() => {
    const sorted = [...orders];
    switch (sortBy) {
      case 'date_asc': sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'date_desc': sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'total_desc': sorted.sort((a, b) => parseFloat(b.total || 0) - parseFloat(a.total || 0)); break;
      case 'total_asc': sorted.sort((a, b) => parseFloat(a.total || 0) - parseFloat(b.total || 0)); break;
      case 'age': sorted.sort((a, b) => getOrderAge(b.created_at).urgency - getOrderAge(a.created_at).urgency || new Date(a.created_at) - new Date(b.created_at)); break;
      default: break;
    }
    return sorted;
  }, [orders, sortBy]);

  // Grouped orders by status category
  const groupedOrders = useMemo(() => {
    const groups = {};
    Object.entries(statusCategories).forEach(([key, cat]) => {
      const matching = sortedOrders.filter(o => cat.statuses.includes(o.status));
      if (matching.length > 0) {
        groups[key] = { ...cat, orders: matching };
      }
    });
    return groups;
  }, [sortedOrders]);

  // ---- Inline Order Card (comprehensive info bar) ----
  const OrderCard = ({ o }) => {
    const sc = statusConfig[o.status] || statusConfig.pending;
    const StatusIcon = sc.icon;
    const isExpanded = expandedOrder === o.id;
    const age = getOrderAge(o.created_at);
    const isUrgent = needsUrgentAttention(o);
    const lastChange = o.updated_at && o.updated_at !== o.created_at ? o.updated_at : o.created_at;

    return (
      <div className={`glass-card-solid overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-brand-200' : ''} ${isUrgent ? 'ring-1 ring-amber-300 shadow-amber-100' : ''}`}>
        {/* Urgency bar */}
        {isUrgent && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 flex items-center gap-2">
            <AlertTriangle size={11} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Needs Attention - {age.label} order ({timeSince(o.created_at)})</span>
          </div>
        )}

        {/* Main info bar - everything visible at a glance */}
        <div className="p-3 sm:p-4">
          {/* Row 1: Order identity + Status + Age + Price */}
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            <button onClick={(e) => { e.stopPropagation(); toggleSelect(o.id); }} className="mt-1 shrink-0">
              {selectedItems.has(o.id) ? <CheckSquare size={20} className="text-brand-600" /> : <Square size={20} className="text-gray-300 hover:text-gray-400" />}
            </button>
            {/* Product image (falls back to status icon) */}
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 relative border border-gray-200 ${o.first_image?'bg-gray-100':sc.bg} flex items-center justify-center`}>
              {o.first_image
                ? <img src={o.first_image} alt="" className="w-full h-full object-cover"/>
                : <StatusIcon size={18} className={sc.text} />}
              {o.items && o.items.length>1 && <span className="absolute -bottom-1 -left-1 px-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold bg-gray-900 text-white flex items-center justify-center ring-2 ring-white">+{o.items.length-1}</span>}
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${age.dot} ring-2 ring-white`} />
            </div>

            {/* Order # and all badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-bold text-sm text-brand-600">{o.order_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text} uppercase tracking-wide`}>{getStatusLabel(o.status, t)}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${age.color}`}>{age.label}</span>
                {o.payment_status === 'paid' && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">PAID</span>}
                {o.payment_status && o.payment_status !== 'paid' && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase">{o.payment_status}</span>}
                {o.notification_preference && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.notification_preference === 'whatsapp' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {o.notification_preference === 'whatsapp' ? 'WA' : 'Email'}
                  </span>
                )}
                {o.shipping_type && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                    {o.shipping_type === 'home' ? 'Home' : 'Desk'}
                  </span>
                )}
              </div>

              {/* Row 2: Comprehensive inline info grid */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1.5">
                {/* Customer */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <User size={12} className="text-gray-400 shrink-0" />
                  <span className="text-xs font-semibold text-gray-800 truncate">{o.customer_name}</span>
                </div>
                {/* Phone */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 truncate font-mono">{o.customer_phone}</span>
                </div>
                {/* Location */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 truncate">{[o.shipping_wilaya, o.shipping_city].filter(Boolean).join(' / ') || 'N/A'}</span>
                </div>
                {/* Payment */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <CreditCard size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 uppercase truncate">{o.payment_method?.replace('_', ' ') || 'N/A'}</span>
                </div>
                {/* Date/Time */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{formatDateTime(o.created_at)}</span>
                </div>
                {/* Last status change */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Timer size={11} className="text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-400 truncate">Updated {timeSince(lastChange)}</span>
                </div>
              </div>

              {/* Row 3: Mini status timeline - always visible */}
              <div className="mt-2.5 flex items-center gap-0.5">
                {mainPipeline.map((st, i) => {
                  const currentIdx = mainPipeline.indexOf(o.status);
                  const done = i <= currentIdx && !['cancelled', 'returned'].includes(o.status);
                  const isCurrent = st === o.status;
                  const sc2 = statusConfig[st];
                  return (
                    <React.Fragment key={st}>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${isCurrent ? `${sc2.bg} ${sc2.text} ring-1 ${sc2.border}` : done ? 'text-gray-500 bg-gray-50' : 'text-gray-300'}`}>
                        {done ? <Check size={9} className={isCurrent ? sc2.text : 'text-gray-400'} /> : <sc2.icon size={9} />}
                        <span className="hidden sm:inline">{sc2.label.split(' ')[0]}</span>
                      </div>
                      {i < mainPipeline.length - 1 && (
                        <div className={`w-3 sm:w-5 h-0.5 ${i < currentIdx && !['cancelled', 'returned'].includes(o.status) ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
                {!mainPipeline.includes(o.status) && (
                  <div className={`ml-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.border}`}>
                    <AlertTriangle size={9} />
                    {getStatusLabel(o.status, t)}
                  </div>
                )}
              </div>
            </div>

            {/* Price + expand */}
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <p className="text-base sm:text-lg font-black text-gray-900">{parseFloat(o.total).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">DZD</span></p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); viewOrder(o.id); }}
                  className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors"
                  title="Full Details"
                >
                  <Eye size={13} className="text-brand-600" />
                </button>
                {o.is_deleted ? (
                  <button
                    onClick={async (e) => { e.stopPropagation(); try { await orderApi.restore(currentStore.id, o.id); toast.success('Restored from vault'); loadOrders(); } catch { toast.error('Restore failed'); } }}
                    className="w-7 h-7 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors"
                    title="Restore from vault"
                  ><ArchiveRestore size={13} className="text-purple-600"/></button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveOne(o.id, !o.is_archived); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${o.is_archived?'bg-amber-100 hover:bg-amber-200':'bg-gray-100 hover:bg-gray-200'}`}
                    title={o.is_archived?'Unarchive':'Archive'}
                  >
                    {o.is_archived?<ArchiveRestore size={13} className="text-amber-600"/>:<Archive size={13} className="text-gray-500"/>}
                  </button>
                )}
                <button
                  onClick={() => toggleExpand(o.id)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp size={14} className="text-brand-500" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Notes preview if present */}
          {o.notes && !isExpanded && (
            <div className="mt-2 ml-13 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[10px] text-blue-600 truncate"><FileText size={10} className="inline mr-1" />{o.notes}</p>
            </div>
          )}
        </div>

        {/* Expanded Section - Extra details (items, tracking, email, actions) */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 animate-fade-in">
            <div className="p-4 sm:p-5 space-y-4">
              {/* Detailed info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Full Customer Card */}
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Customer Details</p>
                  <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><User size={13} className="text-gray-400" />{o.customer_name}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{o.customer_phone}</p>
                  {o.customer_email && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Mail size={12} className="text-gray-400" />{o.customer_email}</p>}
                  {o.notification_preference && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <Bell size={12} className="text-gray-400" />
                      Notif: <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.notification_preference === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{o.notification_preference === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
                    </p>
                  )}
                </div>

                {/* Full Delivery Card */}
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Delivery</p>
                  <p className="text-xs text-gray-700 flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" />{o.shipping_address || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">{[o.shipping_city, o.shipping_wilaya].filter(Boolean).join(', ')}</p>
                  {o.shipping_zip && <p className="text-xs text-gray-400 mt-0.5">ZIP: {o.shipping_zip}</p>}
                  {o.shipping_type && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <Truck size={12} className="text-gray-400" />
                      {o.shipping_type === 'home' ? 'Home Delivery' : 'Desk/Office Delivery'}
                    </p>
                  )}
                  {/* Tracking number moved out of the list row — shown only in the order detail modal. */}
                </div>

                {/* Full Payment Card */}
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Payment</p>
                  <p className="text-xs text-gray-700 flex items-center gap-1.5">
                    <CreditCard size={12} className="text-gray-400" />
                    <span className="uppercase font-medium">{o.payment_method?.replace('_', ' ')}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.payment_status || 'unpaid'}</span>
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Subtotal</span><span className="font-medium">{parseFloat(o.subtotal || o.total).toLocaleString()} DZD</span></div>
                    {o.shipping_cost && parseFloat(o.shipping_cost) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-400">Shipping</span><span className="font-medium">{parseFloat(o.shipping_cost).toLocaleString()} DZD</span></div>}
                    <div className="flex justify-between text-xs font-bold border-t border-gray-100 pt-1"><span>Total</span><span className="text-brand-600">{parseFloat(o.total).toLocaleString()} DZD</span></div>
                  </div>
                </div>
              </div>

              {/* Products list */}
              {Array.isArray(o.items) && o.items.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Products ({o.items.length})</p>
                  <div className="space-y-2">
                    {o.items.map((it, idx) => {
                      const v = it.variant_info;
                      let vLabel = '';
                      try { const vv = typeof v === 'string' ? JSON.parse(v) : v; if (vv) vLabel = vv.label || vv.name || (Array.isArray(vv.selections) ? vv.selections.map(s=>s.name).filter(Boolean).join(' / ') : ''); } catch {}
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          {it.image ? <img src={it.image} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-gray-200"/> : <div className="w-10 h-10 rounded-md bg-gray-200 shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{it.product_name}</p>
                            {vLabel && <p className="text-[10px] text-gray-500 truncate">{vLabel}</p>}
                            <p className="text-[10px] text-gray-400 mt-0.5">{parseFloat(it.price || 0).toLocaleString()} × {it.quantity}</p>
                          </div>
                          <p className="text-xs font-bold text-gray-900 shrink-0">{parseFloat(it.total_price || (it.price*it.quantity) || 0).toLocaleString()} DZD</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes full */}
              {o.notes && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Customer Notes</p>
                  <p className="text-xs text-blue-700">{o.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned' && (
                  <>
                    <p className="text-[9px] font-bold text-gray-400 uppercase w-full mb-1">Quick Status Update</p>
                    <div className="flex flex-wrap gap-1.5">
                      {o.status !== 'confirmed' && (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'confirmed'); }}
                          disabled={updatingStatus === o.id + 'confirmed'}
                          className="px-3 py-1.5 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
                          {updatingStatus === o.id + 'confirmed' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}Confirm
                        </button>
                      )}
                      {o.status !== 'under_preparation' && o.status !== 'preparing' && (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'preparing'); }}
                          disabled={updatingStatus === o.id + 'preparing'}
                          className="px-3 py-1.5 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-50">
                          {updatingStatus === o.id + 'preparing' ? <Loader2 size={10} className="animate-spin" /> : <Package size={10} />}Prepare
                        </button>
                      )}
                      {o.status !== 'shipped' && (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'shipped'); }}
                          disabled={updatingStatus === o.id + 'shipped'}
                          className="px-3 py-1.5 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50">
                          {updatingStatus === o.id + 'shipped' ? <Loader2 size={10} className="animate-spin" /> : <Truck size={10} />}Ship
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'delivered'); }}
                        disabled={updatingStatus === o.id + 'delivered'}
                        className="px-3 py-1.5 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">
                        {updatingStatus === o.id + 'delivered' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}Deliver
                      </button>

                      <div className="w-px h-6 bg-gray-200 mx-1" />

                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'awaiting'); }}
                        className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200">
                        <Hourglass size={10} />Awaiting
                      </button>
                      {!o.status?.startsWith('failed_call') ? (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'failed_call_1'); }}
                          className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200">
                          <PhoneMissed size={10} />No Answer
                        </button>
                      ) : o.status === 'failed_call_1' ? (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'failed_call_2'); }}
                          className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                          <PhoneMissed size={10} />Fail 2
                        </button>
                      ) : o.status === 'failed_call_2' ? (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'failed_call_3'); }}
                          className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                          <PhoneOff size={10} />Fail 3
                        </button>
                      ) : null}

                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'cancelled'); }}
                        className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                        <Ban size={10} />Cancel
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, 'returned'); }}
                        className="px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200">
                        <RotateCcw size={10} />Return
                      </button>
                    </div>
                  </>
                )}

                <button onClick={(e) => { e.stopPropagation(); viewOrder(o.id); }}
                  className="ml-auto px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-brand-600">
                  <Eye size={13} />Full Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Table View Row ----
  const TableRow = ({ o }) => {
    const sc = statusConfig[o.status] || statusConfig.pending;
    const StatusIcon = sc.icon;
    const age = getOrderAge(o.created_at);
    const isUrgent = needsUrgentAttention(o);

    return (
      <tr className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${isUrgent ? 'bg-amber-50/30' : ''} ${selectedItems.has(o.id) ? 'bg-brand-50/40' : ''}`}>
        <td className="px-3 py-3">
          <button onClick={(e) => { e.stopPropagation(); toggleSelect(o.id); }}>
            {selectedItems.has(o.id) ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} className="text-gray-300 hover:text-gray-400" />}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
            <span className="font-mono font-bold text-xs text-brand-600">{o.order_number}</span>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg ${sc.bg} flex items-center justify-center`}>
              <StatusIcon size={12} className={sc.text} />
            </div>
            <span className={`text-[10px] font-bold ${sc.text}`}>{getStatusLabel(o.status, t)}</span>
          </div>
        </td>
        <td className="px-3 py-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${age.color}`}>{age.label}</span></td>
        <td className="px-3 py-3">
          <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{o.customer_name}</p>
          <p className="text-[10px] text-gray-400 font-mono">{o.customer_phone}</p>
        </td>
        <td className="px-3 py-3 hidden lg:table-cell">
          <span className="text-xs text-gray-600 truncate block max-w-[100px]">{o.shipping_wilaya || 'N/A'}</span>
        </td>
        <td className="px-3 py-3 hidden md:table-cell">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 uppercase">{o.payment_method?.replace('_', ' ') || 'N/A'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${o.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
        </td>
        <td className="px-3 py-3">
          <span className="text-xs font-black text-gray-900">{parseFloat(o.total).toLocaleString()}</span>
          <span className="text-[9px] text-gray-400 ml-0.5">DZD</span>
        </td>
        <td className="px-3 py-3 hidden sm:table-cell">
          <span className="text-[10px] text-gray-500">{formatDateTime(o.created_at)}</span>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => viewOrder(o.id)} className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center" title="View Details">
              <Eye size={12} className="text-brand-600" />
            </button>
            <button onClick={() => toggleExpand(o.id)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center" title="Quick Actions">
              <ChevronRight size={12} className="text-gray-500" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{t('orders.title', 'Orders')}</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">{total} {t('storePage.ordersTotal', 'orders total')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} title="Card View">
              <LayoutGrid size={14} className={viewMode === 'cards' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} title="Table View">
              <LayoutList size={14} className={viewMode === 'table' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
            <button onClick={() => setViewMode('grouped')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grouped' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} title="Grouped View">
              <Filter size={14} className={viewMode === 'grouped' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
          </div>
          {/* Archive view toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0" title="Archive view">
            <button onClick={()=>setArchivedView('active')} className={`px-2 py-1 rounded-md text-[11px] font-bold ${archivedView==='active'?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>Active</button>
            <button onClick={()=>setArchivedView('archived')} className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 ${archivedView==='archived'?'bg-white shadow-sm text-amber-700':'text-gray-500 hover:text-gray-700'}`}><Archive size={11}/>Archived</button>
            <button onClick={()=>setArchivedView('all')} className={`px-2 py-1 rounded-md text-[11px] font-bold ${archivedView==='all'?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>All</button>
            <button onClick={()=>setArchivedView('vault')} className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 ${archivedView==='vault'?'bg-white shadow-sm text-purple-700':'text-gray-500 hover:text-gray-700'}`} title="All-time archive — includes orders deleted by admins"><Archive size={11}/>Vault</button>
          </div>
          <button onClick={loadOrders} className="btn-ghost text-xs sm:text-sm flex items-center gap-2 shrink-0">
            <RefreshCw size={14} /><span className="hidden sm:inline">{t('storePage.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Today</p><p className="text-xl font-black text-gray-900 mt-1">{todayOrders}</p></div>
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Revenue</p><p className="text-xl font-black text-emerald-600 mt-1">{todayRevenue.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">DZD</span></p></div>
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Action</p><p className="text-xl font-black text-amber-500 mt-1">{pendingCount}</p></div>
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Shipped</p><p className="text-xl font-black text-cyan-500 mt-1">{shippedCount}</p></div>
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Delivered</p><p className="text-xl font-black text-emerald-500 mt-1">{deliveredCount}</p></div>
        <div className="glass-card-solid p-3"><p className="text-[10px] font-bold text-gray-400 uppercase">Failed</p><p className="text-xl font-black text-red-500 mt-1">{failedCallsCount}</p></div>
        <div className={`glass-card-solid p-3 ${urgentCount > 0 ? 'ring-1 ring-amber-300' : ''}`}><p className="text-[10px] font-bold text-gray-400 uppercase">Urgent</p><p className={`text-xl font-black mt-1 ${urgentCount > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{urgentCount}</p></div>
      </div>

      {/* Filters + Search + Sort */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="overflow-x-auto -mx-1 px-1 sm:overflow-visible">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max sm:w-auto">
            {filters.map(f => {
              const sc = statusConfig[f.key];
              const count = f.key === 'all' ? total : orders.filter(o => f.key === 'failed_call_1' ? o.status?.startsWith('failed_call') : o.status === f.key).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${filter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {sc && <span className={`w-2 h-2 rounded-full ${sc.color}`} />}
                  {f.label}
                  {count > 0 && <span className="text-[9px] text-gray-400">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Select All checkbox */}
          <button onClick={toggleAll} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" title={selectedItems.size === orders.length ? 'Deselect All' : 'Select All'}>
            {selectedItems.size > 0 && selectedItems.size === orders.length ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
            <span className="text-xs font-bold text-gray-500 hidden sm:inline">{selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select All'}</span>
          </button>
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field !pl-9 !py-2 text-sm w-full" placeholder={t('storePage.searchOrdersPlaceholder', 'Search by name, phone, or order #...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Sort selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-gray-100 rounded-lg px-3 py-2 pr-8 text-[11px] font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="total_desc">Highest Total</option>
              <option value="total_asc">Lowest Total</option>
              <option value="age">By Urgency</option>
            </select>
            <ArrowUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Mobile view toggle */}
          <div className="flex sm:hidden items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`}>
              <LayoutGrid size={14} className={viewMode === 'cards' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}>
              <LayoutList size={14} className={viewMode === 'table' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
            <button onClick={() => setViewMode('grouped')} className={`p-1.5 rounded-md ${viewMode === 'grouped' ? 'bg-white shadow-sm' : ''}`}>
              <Filter size={14} className={viewMode === 'grouped' ? 'text-brand-600' : 'text-gray-400'} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="glass-card-solid p-16 text-center"><Package size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 font-semibold">{t('storePage.noOrdersFound', 'No orders found')}</p></div>
      ) : viewMode === 'table' ? (
        /* ===== TABLE VIEW ===== */
        <div className="glass-card-solid overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 w-10"><button onClick={toggleAll}>{selectedItems.size > 0 && selectedItems.size === orders.length ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} className="text-gray-400" />}</button></th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Wilaya</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Payment</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(o => <TableRow key={o.id} o={o} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ===== GROUPED VIEW ===== */
        <div className="space-y-6">
          {Object.entries(groupedOrders).map(([key, group]) => {
            const GroupIcon = group.icon;
            return (
              <div key={key}>
                {/* Section Header */}
                <div className={`flex items-center gap-3 mb-3 px-1`}>
                  <div className={`w-8 h-8 rounded-xl ${group.bg} flex items-center justify-center`}>
                    <GroupIcon size={16} className={group.color} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-bold ${group.color}`}>{group.label}</h3>
                    <p className="text-[10px] text-gray-400">{group.orders.length} order{group.orders.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${group.bg} ${group.color} border ${group.border}`}>
                    {group.orders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toLocaleString()} DZD
                  </div>
                </div>
                {/* Orders in this group */}
                <div className="space-y-2">
                  {group.orders.map(o => <OrderCard key={o.id} o={o} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== CARD VIEW (default) ===== */
        <div className="space-y-2">
          {sortedOrders.map(o => <OrderCard key={o.id} o={o} />)}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl z-50">
          <span className="text-sm font-bold">{selectedItems.size} selected</span>
          <div className="w-px h-6 bg-gray-600" />
          {/* Change Status dropdown */}
          <div className="relative">
            <button onClick={() => setBulkStatusOpen(!bulkStatusOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors">
              <RefreshCw size={13} />Change Status
              <ChevronDown size={12} />
            </button>
            {bulkStatusOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 py-1 w-48 max-h-64 overflow-y-auto">
                {allStatuses.map(st => {
                  const sc = statusConfig[st];
                  const StIcon = sc.icon;
                  return (
                    <button key={st} onClick={async () => {
                      for (const id of selectedItems) { await updateStatus(id, st); }
                      clearSelection(); setBulkStatusOpen(false);
                    }} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                      <StIcon size={12} className={sc.text} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={() => { const selectedData = orders.filter(o => selectedItems.has(o.id)); const csv = ['Order,Customer,Phone,Status,Total,Date', ...selectedData.map(o => `${o.order_number},${o.customer_name},${o.customer_phone},${o.status},${o.total},${o.created_at}`)].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'orders-export.csv'; a.click(); URL.revokeObjectURL(url); toast.success(`Exported ${selectedItems.size} orders`); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors">
            <Download size={13} />Export Selected
          </button>
          <button onClick={()=>bulkArchive(archivedView!=='archived')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition-colors">
            {archivedView==='archived'?<><ArchiveRestore size={13}/>Restore</>:<><Archive size={13}/>Archive</>}
          </button>
          <button onClick={async () => { if (!confirm(`Delete ${selectedItems.size} selected orders? They will remain available in the Vault archive.`)) return; try { await orderApi.bulkDelete(currentStore.id, Array.from(selectedItems)); } catch {} clearSelection(); loadOrders(); toast.success('Moved to vault archive'); }} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold transition-colors">
            <Trash2 size={13} />Delete Selected
          </button>
          <button onClick={clearSelection} className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-700 rounded-lg text-xs transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Full Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`p-4 sm:p-6 ${(statusConfig[selectedOrder.status] || statusConfig.pending).bg} rounded-t-3xl sticky top-0 z-10`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-lg sm:text-xl font-black text-gray-900 break-all">{selectedOrder.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${(statusConfig[selectedOrder.status] || statusConfig.pending).bg} ${(statusConfig[selectedOrder.status] || statusConfig.pending).text} uppercase`}>{getStatusLabel(selectedOrder.status, t)}</span>
                    {(() => { const a = getOrderAge(selectedOrder.created_at); return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${a.color}`}>{a.label}</span>; })()}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12} />{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center shadow-sm shrink-0"><X size={18} /></button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Customer + Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Customer</p>
                  <p className="font-bold text-gray-900 flex items-center gap-2"><User size={14} className="text-gray-400" />{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Phone size={14} className="text-gray-400" />{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-gray-400" />{selectedOrder.customer_email}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Delivery</p>
                  <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-gray-500 mt-1">{[selectedOrder.shipping_city, selectedOrder.shipping_wilaya].filter(Boolean).join(', ')}</p>
                  <p className="text-sm font-medium mt-2 flex items-center gap-2"><CreditCard size={14} className="text-gray-400" /><span className="uppercase">{selectedOrder.payment_method?.replace('_', ' ')}</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedOrder.payment_status}</span>
                  </p>
                  {selectedOrder.notification_preference && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Bell size={14} className="text-gray-400" />
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.notification_preference === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {selectedOrder.notification_preference === 'whatsapp' ? 'WhatsApp' : 'Email'}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="flex items-center justify-between px-2 overflow-x-auto -mx-2 pb-1">
                {mainPipeline.map((st, i) => {
                  const currentIdx = mainPipeline.indexOf(selectedOrder.status);
                  const done = i <= currentIdx && !['cancelled', 'returned'].includes(selectedOrder.status);
                  const sc2 = statusConfig[st];
                  return (
                    <React.Fragment key={st}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${done ? sc2.color : 'bg-gray-200'}`}>
                          {done ? <Check size={14} /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold ${done ? 'text-gray-700' : 'text-gray-400'}`}>{sc2.label.split(' ')[0]}</span>
                      </div>
                      {i < mainPipeline.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIdx && !['cancelled', 'returned'].includes(selectedOrder.status) ? 'bg-emerald-400' : 'bg-gray-200'} mx-1`} />}
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
                      {item.product_image ? <img src={item.product_image} className="w-14 h-14 rounded-xl object-cover bg-gray-100" alt="" /> : <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.quantity} x {parseFloat(item.unit_price).toLocaleString()} DZD</p>
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

              {/* Tracking */}
              {(selectedOrder.status === 'shipped' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'under_preparation') && (
                <div className="p-4 bg-cyan-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-bold text-cyan-600 uppercase">Tracking Information</p>
                  {selectedOrder.tracking_number ? (
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-cyan-600" />
                      <div className="flex-1">
                        <p className="font-mono font-bold text-sm text-gray-800">{selectedOrder.tracking_number}</p>
                        {selectedOrder.tracking_status && <p className="text-xs text-cyan-600 capitalize">{selectedOrder.tracking_status.replace(/_/g, ' ')}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select className="input-field !py-2 text-sm" value={trackingForm.delivery_company_id} onChange={e => setTrackingForm({ ...trackingForm, delivery_company_id: e.target.value })}>
                        <option value="">Select delivery company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}{c.provider_type !== 'manual' ? ` (${c.provider_type})` : ''}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input className="input-field !py-2 text-sm flex-1" placeholder="Tracking number" value={trackingForm.tracking_number} onChange={e => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })} />
                        <button disabled={!trackingForm.tracking_number || savingTracking} onClick={async () => {
                          setSavingTracking(true);
                          try {
                            await api.patch(`/manage/stores/${currentStore.id}/orders/${selectedOrder.id}/tracking`, trackingForm);
                            toast.success('Tracking saved!'); setTrackingForm({ tracking_number: '', delivery_company_id: '' });
                            const { data } = await orderApi.getOne(currentStore.id, selectedOrder.id); setSelectedOrder(data); loadOrders();
                          } catch { toast.error('Failed'); }
                          setSavingTracking(false);
                        }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-1 shrink-0">
                          {savingTracking ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Truck size={12} />}Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'returned' && (
                  <div className="space-y-2 w-full">
                    <p className="text-xs font-bold text-gray-400 uppercase">Update Status</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedOrder.status !== 'confirmed' && <button onClick={() => updateStatus(selectedOrder.id, 'confirmed')} className="py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"><Check size={14} />Confirm</button>}
                      {selectedOrder.status !== 'under_preparation' && selectedOrder.status !== 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600"><Package size={14} />Prepare</button>}
                      {selectedOrder.status !== 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600"><Truck size={14} />Ship</button>}
                      {selectedOrder.status !== 'delivered' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600"><Check size={14} />Deliver</button>}
                      <button onClick={() => updateStatus(selectedOrder.id, 'awaiting')} className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"><Hourglass size={14} />Awaiting</button>
                      {!selectedOrder.status?.startsWith('failed_call') ? (
                        <button onClick={() => updateStatus(selectedOrder.id, 'failed_call_1')} className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"><PhoneMissed size={14} />No Answer</button>
                      ) : selectedOrder.status === 'failed_call_1' ? (
                        <button onClick={() => updateStatus(selectedOrder.id, 'failed_call_2')} className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"><PhoneMissed size={14} />Fail 2</button>
                      ) : selectedOrder.status === 'failed_call_2' ? (
                        <button onClick={() => updateStatus(selectedOrder.id, 'failed_call_3')} className="py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"><PhoneOff size={14} />Fail 3</button>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="flex-1 py-3 rounded-xl text-red-600 font-bold text-xs flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200"><Ban size={14} />Cancel</button>
                      <button onClick={() => updateStatus(selectedOrder.id, 'returned')} className="flex-1 py-3 rounded-xl text-gray-600 font-bold text-xs flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-200"><RotateCcw size={14} />Return</button>
                    </div>
                  </div>
                )}

                {/* Send Email */}
                <div className="mt-2 p-4 bg-blue-50 rounded-xl w-full">
                  <p className="text-xs font-bold text-blue-600 mb-2">Send Email Update</p>
                  {selectedOrder.customer_email ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 flex-1 truncate">{selectedOrder.customer_email}</span>
                      <button onClick={async () => { try { const { data } = await orderApi.sendOrderEmail(currentStore.id, selectedOrder.id, {}); if (data.success) toast.success('Email sent!'); else toast.error(data.reason || 'Failed'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center gap-1"><Mail size={12} />Send</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">No email on this order. Enter one manually:</p>
                      <div className="flex gap-2">
                        <input id="manual-email" type="email" className="input-field flex-1 !py-2 text-sm" placeholder="customer@email.com" />
                        <button onClick={async () => { const email = document.getElementById('manual-email')?.value; if (!email) return toast.error('Enter email'); try { const { data } = await orderApi.sendOrderEmail(currentStore.id, selectedOrder.id, { email }); if (data.success) toast.success('Email sent!'); else toast.error(data.reason || 'Failed'); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); } }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 shrink-0 flex items-center gap-1"><Mail size={12} />Send</button>
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
