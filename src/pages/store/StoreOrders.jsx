import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import api from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { getEnAr } from '../../data/wilayaTranslations';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, User, Mail, RefreshCw, Download, MessageSquare, PhoneMissed, PhoneOff, RotateCcw, Hourglass, ShoppingBag, Loader2, CheckSquare, Square, Trash2, Columns, GripVertical, BarChart3, Plus, Send, Home } from 'lucide-react';

// Columns the admin can toggle / reorder — mirrors the design in the screenshots.
const ALL_COLUMNS = [
  { key: 'photo', label: 'Photo' },
  { key: 'order', label: 'Order N' },
  { key: 'products', label: 'Products' },
  { key: 'wilaya', label: 'Wilaya' },
  { key: 'wilaya_number', label: 'N° Wilaya' },
  { key: 'commune', label: 'Commune' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'phone', label: 'Phone N' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'status', label: 'Status' },
  { key: 'shipping_method', label: 'Shipping Method' },
  { key: 'total', label: 'Total' },
];
const DEFAULT_COLUMNS = ['order','photo','products','wilaya','commune','customer_name','phone','transfer','status','shipping_method','total'];

const statusConfig = {
  new_order:      { color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'NEW' },
  pending:        { color: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'PENDING' },
  confirmed:      { color: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'CONFIRMED' },
  preparing:      { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'PREPARING' },
  under_preparation: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'PREPARING' },
  ready:          { color: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700',   label: 'READY' },
  shipped:        { color: 'bg-orange-500', bg: 'bg-orange-100',text: 'text-orange-700', label: 'SHIPPED' },
  delivered:      { color: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700',label: 'DELIVERED' },
  cancelled:      { color: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    label: 'CANCELLED' },
  failed_call_1:  { color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'CALL FAILED 1' },
  failed_call_2:  { color: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', label: 'CALL FAILED 2' },
  failed_call_3:  { color: 'bg-red-400',    bg: 'bg-red-50',    text: 'text-red-700',    label: 'CALL FAILED 3' },
  returned:       { color: 'bg-gray-500',   bg: 'bg-gray-50',   text: 'text-gray-700',   label: 'RETURNED' },
};
const allStatuses = ['new_order','pending','confirmed','preparing','ready','shipped','delivered','cancelled','failed_call_1','failed_call_2','failed_call_3','returned'];

function formatDateTime(date) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

// Small helper: pretty delivery-company label based on company name.
function transferBadge(o) {
  const name = (o.delivery_company_name || '').toLowerCase();
  if (name.includes('noest')) return { label: 'NOEST Express', className: 'bg-blue-500 text-white' };
  if (name.includes('dhd'))   return { label: 'DHD Livraison', className: 'bg-orange-500 text-white' };
  if (name.includes('yalid')) return { label: 'Yalidine',      className: 'bg-green-500 text-white' };
  if (o.delivery_company_name) return { label: o.delivery_company_name, className: 'bg-indigo-500 text-white' };
  return null;
}

export default function StoreOrders() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageSize, setPageSize] = useState(() => Number(localStorage.getItem('orders.pageSize') || 25));
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [companies, setCompanies] = useState([]);
  const [trackingForm, setTrackingForm] = useState({ tracking_number: '', delivery_company_id: '' });
  const [savingTracking, setSavingTracking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [adminStatsOpen, setAdminStatsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeColumns, setActiveColumns] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('orders.columns.v2') || 'null'); return Array.isArray(s) && s.length ? s : DEFAULT_COLUMNS; }
    catch { return DEFAULT_COLUMNS; }
  });
  useEffect(() => { localStorage.setItem('orders.columns.v2', JSON.stringify(activeColumns)); }, [activeColumns]);
  useEffect(() => { localStorage.setItem('orders.pageSize', String(pageSize)); }, [pageSize]);

  const toggleColumn = (key) => setActiveColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const moveColumn = (key, dir) => setActiveColumns(prev => {
    const i = prev.indexOf(key); if (i < 0) return prev;
    const j = i + dir; if (j < 0 || j >= prev.length) return prev;
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });

  const toggleSelect = (id) => setSelectedItems(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelectedItems(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const loadOrders = async () => {
    if (!currentStore?.id) return;
    try {
      const { data } = await orderApi.getAll(currentStore.id, { status: filter === 'all' ? undefined : filter, search });
      setOrders(data.orders); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [currentStore?.id, filter, search]);
  useEffect(() => { if (currentStore?.id) api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r => setCompanies(r.data || [])).catch(() => {}); }, [currentStore?.id]);

  // Highlight target order via ?highlight=<id>
  const highlightId = useMemo(() => { const p = new URLSearchParams(location.search); return p.get('highlight') || null; }, [location.search]);
  useEffect(() => {
    if (!highlightId) return;
    const el = document.querySelector(`[data-order-id="${highlightId}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2','ring-amber-400'); const tm = setTimeout(() => el.classList.remove('ring-2','ring-amber-400'), 3500); return () => clearTimeout(tm); }
  }, [highlightId, orders]);

  const updateStatus = async (orderId, status) => {
    setUpdatingStatus(orderId + status);
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`Order → ${statusConfig[status]?.label || status}`);
      loadOrders();
      if (selectedOrder?.id === orderId) { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    } catch { toast.error('Failed'); }
    setUpdatingStatus(null);
  };

  const viewOrder = async (orderId) => {
    try { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    catch { toast.error('Failed'); }
  };

  const filters = [
    { key: 'all',           label: 'All' },
    { key: 'new_order',     label: 'New' },
    { key: 'pending',       label: 'Pending' },
    { key: 'failed_call_1', label: 'Call Failed 1' },
    { key: 'failed_call_2', label: 'Call Failed 2' },
    { key: 'failed_call_3', label: 'Call Failed 3' },
    { key: 'confirmed',     label: 'Confirmed' },
    { key: 'preparing',     label: 'Preparing' },
    { key: 'ready',         label: 'Ready' },
    { key: 'shipped',       label: 'Shipped' },
  ];

  // Client-side filtered list (date range) + pagination
  const filteredOrders = useMemo(() => {
    let rows = [...orders];
    if (dateFrom) { const f = new Date(dateFrom).getTime(); rows = rows.filter(o => new Date(o.created_at).getTime() >= f); }
    if (dateTo) { const tEnd = new Date(dateTo).getTime() + 24*60*60*1000; rows = rows.filter(o => new Date(o.created_at).getTime() <= tEnd); }
    rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return rows;
  }, [orders, dateFrom, dateTo]);
  const totalShown = filteredOrders.length;
  const ps = pageSize || totalShown || 1;
  const pageCount = Math.max(1, Math.ceil(totalShown / ps));
  const pageOrders = pageSize === 0 ? filteredOrders : filteredOrders.slice((page-1)*ps, page*ps);
  useEffect(() => { if (page > pageCount) setPage(1); }, [pageCount, page]);

  const exportCsv = (rows) => {
    const csv = ['Order,Customer,Phone,Wilaya,Commune,Status,Shipping,Total,Date',
      ...rows.map(o => `${o.order_number},"${o.customer_name||''}",${o.customer_phone||''},${o.shipping_wilaya||''},${o.shipping_city||''},${o.status},${o.shipping_type||''},${o.total},${o.created_at}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url); toast.success('Exported');
  };

  const stats = useMemo(() => {
    const revenue = orders.reduce((s,o) => s + parseFloat(o.total||0), 0);
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const pending = orders.filter(o => ['new_order','pending'].includes(o.status)).length;
    return { total: orders.length, revenue, delivered, shipped, cancelled, pending };
  }, [orders]);

  // ---- Dynamic cell renderer for the orders table ----
  const renderCell = (key, o) => {
    const sc = statusConfig[o.status] || statusConfig.pending;
    const wilayaBi = getEnAr(o.shipping_wilaya || '');
    const communeBi = getEnAr(o.shipping_city || '');
    const transfer = transferBadge(o);
    switch (key) {
      case 'photo':
        return <td className="px-3 py-3">{o.first_image ? <img src={o.first_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={14} className="text-gray-400"/></div>}</td>;
      case 'order':
        return (
          <td className="px-3 py-3">
            <p className="font-mono font-bold text-sm text-emerald-400">{o.order_number}</p>
            {o.delivery_company_name && <p className="text-[10px] font-bold text-emerald-300/80 uppercase mt-0.5">{o.delivery_company_name}</p>}
            {o.tracking_number ? <p className="text-[9px] text-gray-400 font-mono mt-0.5">{o.tracking_number}</p> : <p className="text-[9px] text-gray-400 mt-0.5">N/A</p>}
          </td>
        );
      case 'products': {
        const items = o.items || [];
        const first = items[0];
        return (
          <td className="px-3 py-3">
            {first ? (
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">{first.quantity}x</span>
                <span className="text-xs font-semibold truncate max-w-[120px]">{first.product_name}</span>
                <span className="text-[10px] text-gray-400">{parseFloat(first.price||first.unit_price||0).toLocaleString()}DZD</span>
              </div>
            ) : '—'}
            {items.length > 1 && <p className="text-[9px] text-gray-400 mt-0.5">+{items.length-1} more</p>}
          </td>
        );
      }
      case 'wilaya':
        return (
          <td className="px-3 py-3">
            <p className="text-xs font-semibold">{wilayaBi.en || '—'}</p>
            {wilayaBi.ar && wilayaBi.ar !== wilayaBi.en && <p className="text-[10px] text-gray-400" dir="rtl">{wilayaBi.ar}</p>}
          </td>
        );
      case 'wilaya_number':
        return <td className="px-3 py-3"><span className="font-mono text-xs text-gray-500">{o.shipping_wilaya_code || o.shipping_zip?.slice(0,2) || '—'}</span></td>;
      case 'commune':
        return (
          <td className="px-3 py-3">
            <p className="text-xs">{communeBi.en || '—'}</p>
            {communeBi.ar && communeBi.ar !== communeBi.en && <p className="text-[10px] text-gray-400" dir="rtl">{communeBi.ar}</p>}
          </td>
        );
      case 'customer_name':
        return <td className="px-3 py-3"><span className="text-xs">{o.customer_name}</span></td>;
      case 'phone':
        return <td className="px-3 py-3"><span className="font-mono text-xs">{o.customer_phone}</span></td>;
      case 'transfer':
        return (
          <td className="px-3 py-3">
            {transfer ? (
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold leading-tight ${transfer.className}`}>{transfer.label}</span>
            ) : (
              <button onClick={() => viewOrder(o.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"><Send size={10}/>Transfer</button>
            )}
          </td>
        );
      case 'status':
        return <td className="px-3 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label} <ChevronDown size={10} className="ml-1 opacity-60"/></span></td>;
      case 'shipping_method':
        return (
          <td className="px-3 py-3">
            {o.shipping_type === 'home'
              ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Home size={10}/> HOME</span>
              : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Package size={10}/> STOP DESK</span>}
          </td>
        );
      case 'total':
        return (
          <td className="px-3 py-3 text-right whitespace-nowrap">
            <p className="text-xs font-black">{parseFloat(o.total).toLocaleString()}{o.currency||'DZD'}</p>
            {o.shipping_cost ? <p className="text-[9px] text-gray-400">+ {parseFloat(o.shipping_cost).toLocaleString()}DZD Livrai..</p> : null}
          </td>
        );
      default: return <td className="px-3 py-3">—</td>;
    }
  };

  return (
    <DashboardLayout>
      {/* Status tabs row */}
      <div className="mb-3 overflow-x-auto -mx-1 px-1">
        <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap">
          {filters.map(f => {
            const isActive = filter === f.key;
            const sc = statusConfig[f.key];
            const count = f.key === 'all' ? total : orders.filter(o => f.key === 'preparing' ? (o.status === 'preparing' || o.status === 'under_preparation') : o.status === f.key).length;
            const base = sc ? sc.color : 'bg-gray-200';
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${isActive ? `${base} text-white border-transparent shadow` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {f.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters card */}
      <div className="glass-card-solid p-4 mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">All statuses</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field !py-2 text-sm w-full">
              <option value="all">All statuses</option>
              {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date: Oldest</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field !py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date: Newest</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field !py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input-field !pl-9 !py-2 text-sm w-full" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rows per page</label>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="input-field !py-2 text-sm w-full">
              {[10,20,25,50,100].map(n => <option key={n} value={n}>{n} results</option>)}
              <option value={0}>All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Orders</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCsv(filteredOrders)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            <Download size={13}/>Export
          </button>
          <button onClick={() => setAdminStatsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            <BarChart3 size={13}/>Admin Stats
          </button>
          <div className="relative">
            <button onClick={() => setColumnPickerOpen(v => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-[11px] font-bold text-yellow-700 uppercase tracking-wider">
              <Columns size={13}/>Columns<span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-white">{activeColumns.length}</span>
            </button>
            {columnPickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 max-h-[70vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-3 border-b flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700">Customize Columns</p>
                  <button onClick={() => setColumnPickerOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={14}/></button>
                </div>
                <div className="p-2">
                  {activeColumns.map((key, idx) => {
                    const col = ALL_COLUMNS.find(c => c.key === key); if (!col) return null;
                    return (
                      <div key={key} className="flex items-center gap-2 px-2 py-2 mb-1 bg-gray-50 rounded-lg">
                        <GripVertical size={12} className="text-gray-300"/>
                        <button onClick={() => moveColumn(key,-1)} disabled={idx===0} className="w-5 h-5 rounded bg-white disabled:opacity-30 flex items-center justify-center border border-gray-200"><ChevronUp size={10}/></button>
                        <button onClick={() => moveColumn(key, 1)} disabled={idx===activeColumns.length-1} className="w-5 h-5 rounded bg-white disabled:opacity-30 flex items-center justify-center border border-gray-200"><ChevronDown size={10}/></button>
                        <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{col.label}</span>
                        <span className="text-[9px] text-gray-400">{col.key === 'products' ? '112px' : col.key === 'customer_name' ? '60px' : col.key === 'wilaya_number' ? '40px' : '40px'}</span>
                        <button onClick={() => toggleColumn(key)} className="text-emerald-500 hover:text-emerald-700"><Eye size={12}/></button>
                      </div>
                    );
                  })}
                  <div className="border-t my-2"/>
                  {ALL_COLUMNS.filter(c => !activeColumns.includes(c.key)).map(col => (
                    <button key={col.key} onClick={() => toggleColumn(col.key)} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-left">
                      <Square size={12} className="text-gray-300"/>
                      <span className="text-xs text-gray-600 flex-1 truncate">{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
            <Plus size={13}/>Create Order
          </button>
        </div>
      </div>

      {/* Orders table */}
      <div className="glass-card-solid w-full max-w-full overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-end gap-2 text-[11px] font-bold text-gray-500">
          <span>{totalShown===0?'0':`${(page-1)*ps+1}-${Math.min(page*ps,totalShown)}`} / {totalShown}</span>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page<=1} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={12}/></button>
          <button onClick={() => setPage(p => Math.min(pageCount,p+1))} disabled={page>=pageCount} className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center disabled:opacity-30"><ChevronRight size={12}/></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-[3px] border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>
        ) : pageOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4"><ShoppingBag size={28} className="text-purple-400"/></div>
            <p className="text-gray-700 font-bold">No orders found</p>
            <p className="text-xs text-gray-400 mt-1">When your customers place orders, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden scroll-smooth" style={{WebkitOverflowScrolling:'touch'}}>
            <table className="min-w-max w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="px-3 py-3 w-10 sticky left-0 bg-gray-50 z-10"><button onClick={toggleAll}>{selectedItems.size>0 && selectedItems.size===orders.length ? <CheckSquare size={16} className="text-brand-600"/> : <Square size={16} className="text-gray-400"/>}</button></th>
                  {activeColumns.map(key => {
                    const col = ALL_COLUMNS.find(c => c.key === key); if (!col) return null;
                    return <th key={key} className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col.label}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {pageOrders.map(o => (
                  <tr key={o.id} data-order-id={o.id} onClick={() => viewOrder(o.id)} className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedItems.has(o.id) ? 'bg-brand-50/40' : ''}`}>
                    <td className="px-3 py-3 sticky left-0 bg-white z-10" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(o.id)}>{selectedItems.has(o.id) ? <CheckSquare size={16} className="text-brand-600"/> : <Square size={16} className="text-gray-300"/>}</button>
                    </td>
                    {activeColumns.map(key => <React.Fragment key={key}>{renderCell(key, o)}</React.Fragment>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating bulk bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl z-50">
          <span className="text-sm font-bold">{selectedItems.size} selected</span>
          <div className="w-px h-5 bg-gray-600"/>
          <button onClick={() => exportCsv(orders.filter(o => selectedItems.has(o.id)))} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold"><Download size={12}/>Export</button>
          <button onClick={async () => { if (!confirm(`Delete ${selectedItems.size} orders?`)) return; try { await orderApi.bulkDelete(currentStore.id, Array.from(selectedItems)); } catch {} clearSelection(); loadOrders(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold"><Trash2 size={12}/>Delete</button>
          <button onClick={clearSelection} className="p-1.5 hover:bg-gray-700 rounded-lg"><X size={14}/></button>
        </div>
      )}

      {/* Admin Stats modal */}
      {adminStatsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAdminStatsOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black">Admin Stats</h2><button onClick={() => setAdminStatsOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Total</p><p className="text-2xl font-black">{stats.total}</p></div>
              <div className="p-4 bg-emerald-50 rounded-2xl"><p className="text-[10px] font-bold text-emerald-600 uppercase">Revenue</p><p className="text-2xl font-black text-emerald-700">{stats.revenue.toLocaleString()} <span className="text-xs">DZD</span></p></div>
              <div className="p-4 bg-amber-50 rounded-2xl"><p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p><p className="text-2xl font-black text-amber-700">{stats.pending}</p></div>
              <div className="p-4 bg-cyan-50 rounded-2xl"><p className="text-[10px] font-bold text-cyan-600 uppercase">Shipped</p><p className="text-2xl font-black text-cyan-700">{stats.shipped}</p></div>
              <div className="p-4 bg-emerald-50 rounded-2xl"><p className="text-[10px] font-bold text-emerald-600 uppercase">Delivered</p><p className="text-2xl font-black text-emerald-700">{stats.delivered}</p></div>
              <div className="p-4 bg-red-50 rounded-2xl"><p className="text-[10px] font-bold text-red-600 uppercase">Cancelled</p><p className="text-2xl font-black text-red-700">{stats.cancelled}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order modal (simple) */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black">Create Order</h2><button onClick={() => setCreateOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button></div>
            <p className="text-sm text-gray-500 mb-4">Manually create an order for a customer who contacted you outside the store.</p>
            <button onClick={() => { setCreateOpen(false); window.location.href = '/dashboard/products'; }} className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600">Open Products → Add to Cart</button>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {(() => { const sc = statusConfig[selectedOrder.status] || statusConfig.pending; return (
            <>
            <div className={`p-5 ${sc.bg} rounded-t-3xl sticky top-0 z-10`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-black">{selectedOrder.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text} uppercase`}>{sc.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar size={12}/>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center shadow-sm shrink-0"><X size={18}/></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Customer</p>
                  <p className="font-bold flex items-center gap-2"><User size={14} className="text-gray-400"/>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Phone size={14} className="text-gray-400"/>{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Mail size={14} className="text-gray-400"/>{selectedOrder.customer_email}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Delivery</p>
                  <p className="text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} className="text-gray-400"/>{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-gray-500 mt-1">{[selectedOrder.shipping_city, selectedOrder.shipping_wilaya].filter(Boolean).join(', ')}</p>
                  <p className="text-sm mt-2 flex items-center gap-2"><CreditCard size={14} className="text-gray-400"/><span className="uppercase text-xs font-bold">{selectedOrder.payment_method?.replace('_',' ')}</span></p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Items ({selectedOrder.items?.length || 0})</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((it,i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      {it.product_image ? <img src={it.product_image} className="w-14 h-14 rounded-xl object-cover" alt=""/> : <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center"><Package size={20} className="text-gray-400"/></div>}
                      <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{it.product_name}</p><p className="text-xs text-gray-400">{it.quantity} x {parseFloat(it.unit_price||it.price||0).toLocaleString()} DZD</p></div>
                      <p className="font-bold text-sm">{parseFloat(it.total_price||0).toLocaleString()} DZD</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{parseFloat(selectedOrder.subtotal).toLocaleString()} DZD</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{parseFloat(selectedOrder.shipping_cost).toLocaleString()} DZD</span></div>
                <div className="flex justify-between font-black text-xl pt-2 border-t"><span>Total</span><span className="text-brand-600">{parseFloat(selectedOrder.total).toLocaleString()} DZD</span></div>
              </div>

              {(selectedOrder.status === 'shipped' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'under_preparation') && (
                <div className="p-4 bg-cyan-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-bold text-cyan-600 uppercase">Tracking</p>
                  {selectedOrder.tracking_number ? (
                    <div className="flex items-center gap-3"><Truck size={16} className="text-cyan-600"/><div className="flex-1"><p className="font-mono font-bold text-sm">{selectedOrder.tracking_number}</p>{selectedOrder.tracking_status && <p className="text-xs text-cyan-600 capitalize">{selectedOrder.tracking_status.replace(/_/g,' ')}</p>}</div></div>
                  ) : (
                    <div className="space-y-2">
                      <select className="input-field !py-2 text-sm" value={trackingForm.delivery_company_id} onChange={e => setTrackingForm({...trackingForm, delivery_company_id: e.target.value})}>
                        <option value="">Select delivery company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input className="input-field !py-2 text-sm flex-1" placeholder="Tracking number" value={trackingForm.tracking_number} onChange={e => setTrackingForm({...trackingForm, tracking_number: e.target.value})}/>
                        <button disabled={!trackingForm.tracking_number || savingTracking} onClick={async () => {
                          setSavingTracking(true);
                          try { await api.patch(`/manage/stores/${currentStore.id}/orders/${selectedOrder.id}/tracking`, trackingForm); toast.success('Saved'); setTrackingForm({tracking_number:'',delivery_company_id:''}); const { data } = await orderApi.getOne(currentStore.id, selectedOrder.id); setSelectedOrder(data); loadOrders(); }
                          catch { toast.error('Failed'); }
                          setSavingTracking(false);
                        }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1 shrink-0">{savingTracking ? <Loader2 size={12} className="animate-spin"/> : <Truck size={12}/>}Save</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Update Status</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedOrder.status !== 'confirmed' && <button onClick={() => updateStatus(selectedOrder.id, 'confirmed')} className="py-2.5 rounded-xl text-white font-bold text-xs bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-1.5"><Check size={12}/>Confirm</button>}
                  {selectedOrder.status !== 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="py-2.5 rounded-xl text-white font-bold text-xs bg-purple-500 hover:bg-purple-600 flex items-center justify-center gap-1.5"><Package size={12}/>Prepare</button>}
                  {selectedOrder.status !== 'ready' && <button onClick={() => updateStatus(selectedOrder.id, 'ready')} className="py-2.5 rounded-xl text-white font-bold text-xs bg-teal-500 hover:bg-teal-600 flex items-center justify-center gap-1.5"><Check size={12}/>Ready</button>}
                  {selectedOrder.status !== 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="py-2.5 rounded-xl text-white font-bold text-xs bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-1.5"><Truck size={12}/>Ship</button>}
                  {selectedOrder.status !== 'delivered' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="py-2.5 rounded-xl text-white font-bold text-xs bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-1.5"><Check size={12}/>Deliver</button>}
                  <button onClick={() => updateStatus(selectedOrder.id, 'cancelled')} className="py-2.5 rounded-xl font-bold text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center justify-center gap-1.5"><Ban size={12}/>Cancel</button>
                </div>
              </div>
            </div>
            </>
            ); })()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
