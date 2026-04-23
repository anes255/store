import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import api from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { getEnAr } from '../../data/wilayaTranslations';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, User, Mail, RefreshCw, Download, MessageSquare, PhoneMissed, PhoneOff, RotateCcw, Hourglass, ShoppingBag, Loader2, CheckSquare, Square, Trash2, Columns, GripVertical, BarChart3, Plus, Send, Home, Hash, DollarSign, Percent, Tag, Globe, Building2, FileText, Copy, ExternalLink, MessageCircle, Image as ImgIcon } from 'lucide-react';

// All columns available to toggle / reorder.
const ALL_COLUMNS = [
  { key: 'photo',            label: 'Photo' },
  { key: 'order',            label: 'Order N' },
  { key: 'products',         label: 'Products' },
  { key: 'wilaya',           label: 'Wilaya' },
  { key: 'wilaya_number',    label: 'N° Wilaya' },
  { key: 'commune',          label: 'Commune' },
  { key: 'customer_name',    label: 'Customer Name' },
  { key: 'phone',            label: 'Phone N' },
  { key: 'transfer',         label: 'Transfer Status' },
  { key: 'status',           label: 'Status' },
  { key: 'shipping_method',  label: 'Shipping Method' },
  { key: 'shipping_cost',    label: 'Shipping Cost' },
  { key: 'total',            label: 'Total' },
  { key: 'processed_at',     label: 'Processed At' },
  { key: 'financial_status', label: 'Financial Status' },
  { key: 'currency',         label: 'Currency' },
  { key: 'whatsapp',         label: 'WhatsApp' },
  { key: 'subtotal',         label: 'Sub Total' },
  { key: 'taxes',            label: 'Taxes' },
  { key: 'discount_code',    label: 'Discount Code' },
  { key: 'created_via',      label: 'Created Via' },
  { key: 'email',            label: 'Email' },
  { key: 'billing_name',     label: 'Billing Name' },
  { key: 'billing_street',   label: 'Billing Street' },
  { key: 'billing_city',     label: 'Billing City' },
  { key: 'billing_zip',      label: 'Billing Zip' },
  { key: 'billing_country',  label: 'Billing Country' },
  { key: 'shipping_street',  label: 'Shipping Street' },
  { key: 'shipping_city',    label: 'Shipping City' },
  { key: 'shipping_zip',     label: 'Shipping Zip' },
  { key: 'tracking_number',  label: 'Tracking Number' },
  { key: 'company_name',     label: 'Company Name' },
  { key: 'notes',            label: 'Notes' },
];
const DEFAULT_COLUMNS = ['order','photo','products','wilaya','commune','customer_name','phone','whatsapp','transfer','status','shipping_method','shipping_cost','total','financial_status','tracking_number','notes'];

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

function transferBadge(o) {
  const name = (o.delivery_company_name || '').toLowerCase();
  if (name.includes('noest')) return { label: 'NOEST Express', className: 'bg-blue-500 text-white' };
  if (name.includes('dhd'))   return { label: 'DHD Livraison', className: 'bg-orange-500 text-white' };
  if (name.includes('yalid')) return { label: 'Yalidine',      className: 'bg-green-500 text-white' };
  if (o.delivery_company_name) return { label: o.delivery_company_name, className: 'bg-indigo-500 text-white' };
  return null;
}

function fmtMoney(v, cur) { return `${parseFloat(v||0).toLocaleString()} ${cur||'DZD'}`; }
function waLink(phone) { if (!phone) return null; const clean = String(phone).replace(/[^\d+]/g,''); return `https://wa.me/${clean.replace(/^\+/,'')}`; }
function copy(text) { try { navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Copy failed'); } }

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
  // Quick action drawer: { type: string, order: {...} } — null when closed.
  const [quickAction, setQuickAction] = useState(null);
  // Horizontal scroll container ref — used by the on-screen scroll buttons.
  const hscrollRef = React.useRef(null);
  const scrollTableBy = (dx) => { const el = hscrollRef.current; if (el) el.scrollBy({ left: dx, behavior: 'smooth' }); };
  const [activeColumns, setActiveColumns] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('orders.columns.v3') || 'null'); return Array.isArray(s) && s.length ? s : DEFAULT_COLUMNS; }
    catch { return DEFAULT_COLUMNS; }
  });
  useEffect(() => { localStorage.setItem('orders.columns.v3', JSON.stringify(activeColumns)); }, [activeColumns]);
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

  // Save any field of an order via PATCH.
  const saveOrderField = async (orderId, patch) => {
    try {
      await api.patch(`/manage/stores/${currentStore.id}/orders/${orderId}`, patch);
      toast.success('Saved');
      loadOrders();
      if (selectedOrder?.id === orderId) { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    } catch { toast.error('Failed to save'); }
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

  // Helper for clickable cells. `act` opens a quick-action drawer; falls back to opening full order detail.
  const cellBtn = (o, act, children, className = '') => (
    <button type="button" onClick={e => { e.stopPropagation(); setQuickAction({ type: act, order: o }); }}
      className={`text-left w-full hover:bg-brand-50/60 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors ${className}`}>
      {children}
    </button>
  );

  // ---- Cell renderer ----
  const renderCell = (key, o) => {
    const sc = statusConfig[o.status] || statusConfig.pending;
    const wilayaBi = getEnAr(o.shipping_wilaya || '');
    const communeBi = getEnAr(o.shipping_city || '');
    const transfer = transferBadge(o);

    switch (key) {
      case 'photo':
        return <td className="px-3 py-3">{cellBtn(o, 'photo', o.first_image ? <img src={o.first_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={14} className="text-gray-400"/></div>)}</td>;

      case 'order':
        return (
          <td className="px-3 py-3">{cellBtn(o, 'order',
            <>
              <p className="font-mono font-bold text-sm text-emerald-600">{o.order_number}</p>
              {o.delivery_company_name && <p className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5">{o.delivery_company_name}</p>}
              {o.tracking_number ? <p className="text-[9px] text-gray-400 font-mono mt-0.5">{o.tracking_number}</p> : <p className="text-[9px] text-gray-400 mt-0.5">N/A</p>}
            </>
          )}</td>
        );

      case 'products': {
        const items = o.items || [];
        const first = items[0];
        return (
          <td className="px-3 py-3">{cellBtn(o, 'products',
            first ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">{first.quantity}x</span>
                  <span className="text-xs font-semibold truncate max-w-[120px]">{first.product_name || first.name}</span>
                </div>
                {items.length > 1 && <p className="text-[9px] text-gray-400 mt-0.5">+{items.length-1} more</p>}
              </>
            ) : <span className="text-xs text-gray-400">—</span>
          )}</td>
        );
      }

      case 'wilaya':
        return <td className="px-3 py-3">{cellBtn(o, 'address',
          <><p className="text-xs font-semibold">{wilayaBi.en || '—'}</p>{wilayaBi.ar && wilayaBi.ar !== wilayaBi.en && <p className="text-[10px] text-gray-400" dir="rtl">{wilayaBi.ar}</p>}</>
        )}</td>;

      case 'wilaya_number':
        return <td className="px-3 py-3">{cellBtn(o, 'address', <span className="font-mono text-xs text-gray-500">{o.shipping_wilaya_code || o.shipping_zip?.slice(0,2) || '—'}</span>)}</td>;

      case 'commune':
        return <td className="px-3 py-3">{cellBtn(o, 'address',
          <><p className="text-xs">{communeBi.en || '—'}</p>{communeBi.ar && communeBi.ar !== communeBi.en && <p className="text-[10px] text-gray-400" dir="rtl">{communeBi.ar}</p>}</>
        )}</td>;

      case 'customer_name':
        return <td className="px-3 py-3">{cellBtn(o, 'customer', <span className="text-xs font-semibold">{o.customer_name || '—'}</span>)}</td>;

      case 'phone':
        return <td className="px-3 py-3">{cellBtn(o, 'phone', <span className="font-mono text-xs">{o.customer_phone || '—'}</span>)}</td>;

      case 'transfer':
        return (
          <td className="px-3 py-3">{cellBtn(o, 'transfer',
            transfer ? (
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold leading-tight ${transfer.className}`}>{transfer.label}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600"><Send size={10}/>Assign</span>
            )
          )}</td>
        );

      case 'status':
        return <td className="px-3 py-3">{cellBtn(o, 'status',
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label} <ChevronDown size={10} className="ml-1 opacity-60"/></span>
        )}</td>;

      case 'shipping_method':
        return <td className="px-3 py-3">{cellBtn(o, 'shipping_method',
          o.shipping_type === 'home'
            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Home size={10}/> HOME</span>
            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Package size={10}/> STOP DESK</span>
        )}</td>;

      case 'shipping_cost':
        return <td className="px-3 py-3 text-right whitespace-nowrap">{cellBtn(o, 'totals', <span className="text-xs font-bold">{fmtMoney(o.shipping_cost, o.currency)}</span>)}</td>;

      case 'total':
        return <td className="px-3 py-3 text-right whitespace-nowrap">{cellBtn(o, 'totals',
          <>
            <p className="text-xs font-black">{fmtMoney(o.total, o.currency)}</p>
            {o.shipping_cost ? <p className="text-[9px] text-gray-400">+ {fmtMoney(o.shipping_cost, o.currency)} shipping</p> : null}
          </>
        )}</td>;

      case 'processed_at': {
        const d = o.processed_at || o.updated_at;
        return <td className="px-3 py-3 whitespace-nowrap">{cellBtn(o, 'processed_at',
          <span className="text-xs text-gray-600">{d ? new Date(d).toLocaleString() : 'Not processed'}</span>
        )}</td>;
      }

      case 'financial_status': {
        const ps = (o.payment_status || 'pending').toLowerCase();
        const cls = ps === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ps === 'refunded' ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : ps === 'failed' ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';
        return <td className="px-3 py-3">{cellBtn(o, 'financial',
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${cls}`}>{ps}</span>
        )}</td>;
      }

      case 'currency':
        return <td className="px-3 py-3">{cellBtn(o, 'currency', <span className="text-xs font-bold text-gray-600">{o.currency || 'DZD'}</span>)}</td>;

      case 'whatsapp': {
        const link = waLink(o.customer_phone);
        return (
          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
            {link ? (
              <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white">
                <MessageCircle size={11}/>WhatsApp
              </a>
            ) : <span className="text-[10px] text-gray-400">No phone</span>}
          </td>
        );
      }

      case 'subtotal':
        return <td className="px-3 py-3 text-right whitespace-nowrap">{cellBtn(o, 'totals', <span className="text-xs text-gray-700">{fmtMoney(o.subtotal, o.currency)}</span>)}</td>;

      case 'taxes':
        return <td className="px-3 py-3 text-right whitespace-nowrap">{cellBtn(o, 'totals', <span className="text-xs text-gray-700">{fmtMoney(o.tax_total || o.taxes || 0, o.currency)}</span>)}</td>;

      case 'discount_code':
        return <td className="px-3 py-3">{cellBtn(o, 'discount',
          o.discount_code
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200"><Tag size={10}/>{o.discount_code}</span>
            : <span className="text-[10px] text-gray-400">None</span>
        )}</td>;

      case 'created_via':
        return <td className="px-3 py-3">{cellBtn(o, 'source', <span className="text-[10px] uppercase font-bold text-gray-600">{o.source || o.created_via || 'Storefront'}</span>)}</td>;

      case 'email':
        return (
          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
            {o.customer_email ? <a href={`mailto:${o.customer_email}`} className="text-xs text-blue-600 hover:underline truncate block max-w-[180px]">{o.customer_email}</a> : <span className="text-[10px] text-gray-400">—</span>}
          </td>
        );

      case 'billing_name':
        return <td className="px-3 py-3">{cellBtn(o, 'billing', <span className="text-xs">{o.billing_name || o.customer_name || '—'}</span>)}</td>;
      case 'billing_street':
        return <td className="px-3 py-3">{cellBtn(o, 'billing', <span className="text-xs truncate block max-w-[160px]">{o.billing_street || o.billing_address || '—'}</span>)}</td>;
      case 'billing_city':
        return <td className="px-3 py-3">{cellBtn(o, 'billing', <span className="text-xs">{o.billing_city || '—'}</span>)}</td>;
      case 'billing_zip':
        return <td className="px-3 py-3">{cellBtn(o, 'billing', <span className="text-xs font-mono">{o.billing_zip || '—'}</span>)}</td>;
      case 'billing_country':
        return <td className="px-3 py-3">{cellBtn(o, 'billing', <span className="text-xs">{o.billing_country || 'DZ'}</span>)}</td>;

      case 'shipping_street':
        return <td className="px-3 py-3">{cellBtn(o, 'address', <span className="text-xs truncate block max-w-[160px]">{o.shipping_address || o.shipping_street || '—'}</span>)}</td>;
      case 'shipping_city':
        return <td className="px-3 py-3">{cellBtn(o, 'address', <span className="text-xs">{communeBi.en || o.shipping_city || '—'}</span>)}</td>;
      case 'shipping_zip':
        return <td className="px-3 py-3">{cellBtn(o, 'address', <span className="text-xs font-mono">{o.shipping_zip || '—'}</span>)}</td>;

      case 'tracking_number':
        return <td className="px-3 py-3">{cellBtn(o, 'tracking',
          o.tracking_number
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono"><Truck size={10}/>{o.tracking_number}</span>
            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500"><Plus size={10}/>Add</span>
        )}</td>;

      case 'company_name':
        return <td className="px-3 py-3">{cellBtn(o, 'transfer',
          o.delivery_company_name
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Building2 size={10}/>{o.delivery_company_name}</span>
            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500"><Plus size={10}/>Set</span>
        )}</td>;

      case 'notes':
        return <td className="px-3 py-3">{cellBtn(o, 'notes',
          o.notes
            ? <span className="text-xs text-gray-700 truncate block max-w-[180px]">{o.notes}</span>
            : <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><FileText size={10}/>Add note</span>
        )}</td>;

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

      {/* Orders table with horizontal scroll */}
      <div className="glass-card-solid w-full max-w-full">
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
          <div className="relative">
          {/* Floating scroll buttons — always visible so you can pan the wide table on PC. */}
          <button type="button" aria-label="Scroll left" onClick={() => scrollTableBy(-400)}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-900/85 hover:bg-gray-900 text-white items-center justify-center shadow-xl ring-2 ring-white/40">
            <ChevronLeft size={18}/>
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scrollTableBy(400)}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-900/85 hover:bg-gray-900 text-white items-center justify-center shadow-xl ring-2 ring-white/40">
            <ChevronRight size={18}/>
          </button>
          {/* Mobile fallback — inline pair below the table. */}
          <div className="md:hidden flex items-center justify-between gap-2 px-3 pt-2">
            <button type="button" onClick={() => scrollTableBy(-300)} className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1"><ChevronLeft size={14}/>Scroll Left</button>
            <button type="button" onClick={() => scrollTableBy(300)} className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1">Scroll Right<ChevronRight size={14}/></button>
          </div>
          <div
            ref={hscrollRef}
            className="orders-hscroll scroll-smooth"
            style={{
              overflowX: 'scroll',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              maxWidth: '100%',
              display: 'block',
              scrollbarWidth: 'auto',
              scrollbarColor: '#9ca3af #f3f4f6',
            }}
            onWheel={(e) => {
              if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                const el = e.currentTarget;
                if (el.scrollWidth > el.clientWidth) {
                  el.scrollLeft += e.deltaY;
                  e.preventDefault();
                }
              }
            }}
          >
            <table className="" style={{ width: 'auto', minWidth: `${Math.max(1600, (activeColumns.length + 1) * 160)}px`, tableLayout: 'auto', whiteSpace: 'nowrap' }}>
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
                  <tr key={o.id} data-order-id={o.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedItems.has(o.id) ? 'bg-brand-50/40' : ''}`}>
                    <td className="px-3 py-3 sticky left-0 bg-white z-10">
                      <button onClick={() => toggleSelect(o.id)}>{selectedItems.has(o.id) ? <CheckSquare size={16} className="text-brand-600"/> : <Square size={16} className="text-gray-300"/>}</button>
                    </td>
                    {activeColumns.map(key => <React.Fragment key={key}>{renderCell(key, o)}</React.Fragment>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Create Order modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black">Create Order</h2><button onClick={() => setCreateOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16}/></button></div>
            <p className="text-sm text-gray-500 mb-4">Manually create an order for a customer who contacted you outside the store.</p>
            <button onClick={() => { setCreateOpen(false); window.location.href = '/dashboard/products'; }} className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600">Open Products → Add to Cart</button>
          </div>
        </div>
      )}

      {/* Quick action drawer — dispatches by column type */}
      {quickAction && (
        <QuickActionDrawer
          action={quickAction}
          onClose={() => setQuickAction(null)}
          onOpenFullDetail={() => { const id = quickAction.order.id; setQuickAction(null); viewOrder(id); }}
          onUpdateStatus={(status) => updateStatus(quickAction.order.id, status)}
          onSaveField={(patch) => saveOrderField(quickAction.order.id, patch)}
          companies={companies}
          statusConfig={statusConfig}
          allStatuses={allStatuses}
        />
      )}

      {/* Full Order detail modal */}
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
                      <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{it.product_name || it.name}</p><p className="text-xs text-gray-400">{it.quantity} x {parseFloat(it.unit_price||it.price||0).toLocaleString()} DZD</p></div>
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

// ==========================================================================
// Quick Action Drawer — one modal that switches on column type.
// ==========================================================================
function QuickActionDrawer({ action, onClose, onOpenFullDetail, onUpdateStatus, onSaveField, companies, statusConfig, allStatuses }) {
  const { type, order: o } = action;
  const [localPatch, setLocalPatch] = useState({});
  const cur = o.currency || 'DZD';

  const set = (k) => (e) => setLocalPatch(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => { if (Object.keys(localPatch).length) onSaveField(localPatch); onClose(); };

  const title = {
    photo: 'Order Photo',
    order: 'Order #' + o.order_number,
    products: `Products (${(o.items||[]).length})`,
    address: 'Shipping Address',
    customer: 'Customer',
    phone: 'Phone',
    transfer: 'Transfer / Delivery Company',
    status: 'Order Status',
    shipping_method: 'Shipping Method',
    totals: 'Totals Breakdown',
    processed_at: 'Processed At',
    financial: 'Financial Status',
    currency: 'Currency',
    discount: 'Discount Code',
    source: 'Created Via',
    billing: 'Billing Address',
    tracking: 'Tracking Number',
    notes: 'Notes',
  }[type] || 'Details';

  const wrap = (body) => (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order {o.order_number}</p>
            <h3 className="text-lg font-black text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4">
          {body}
          <div className="pt-3 border-t">
            <button onClick={onOpenFullDetail} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5">
              <ExternalLink size={12}/>Open full order detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const row = (k, v) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase">{k}</span>
      <span className="text-sm text-gray-800 text-right break-all">{v || '—'}</span>
    </div>
  );

  // ---- body by type ----
  if (type === 'photo') {
    return wrap(
      <div className="space-y-3">
        {o.first_image ? <img src={o.first_image} alt="" className="w-full rounded-2xl object-cover max-h-80 border border-gray-200"/> : <div className="w-full h-64 rounded-2xl bg-gray-100 flex items-center justify-center"><ImgIcon size={48} className="text-gray-300"/></div>}
        <p className="text-xs text-gray-500 text-center">First product image for this order.</p>
      </div>
    );
  }

  if (type === 'products') {
    const items = o.items || [];
    return wrap(
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No items.</p>}
        {items.map((it,i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {it.product_image ? <img src={it.product_image} className="w-12 h-12 rounded-xl object-cover" alt=""/> : <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center"><Package size={18} className="text-gray-400"/></div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{it.product_name || it.name}</p>
              {it.variant_label && <p className="text-[10px] text-purple-600">{it.variant_label}</p>}
              <p className="text-[11px] text-gray-400">{it.quantity} × {fmtMoney(it.unit_price || it.price, cur)}</p>
            </div>
            <p className="font-bold text-sm whitespace-nowrap">{fmtMoney(it.total_price || (it.quantity * (it.unit_price || it.price || 0)), cur)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'status') {
    return wrap(
      <div className="grid grid-cols-2 gap-2">
        {allStatuses.map(s => {
          const sc = statusConfig[s];
          const active = o.status === s;
          return (
            <button key={s} onClick={() => { onUpdateStatus(s); onClose(); }}
              className={`py-2.5 rounded-xl text-xs font-bold ${active ? `${sc.color} text-white ring-2 ring-offset-2 ring-gray-300` : `${sc.bg} ${sc.text} hover:opacity-80`}`}>
              {sc.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'transfer') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Delivery Company</label>
        <select defaultValue={o.delivery_company_id || ''} onChange={set('delivery_company_id')} className="input-field w-full">
          <option value="">— None —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm">Save</button>
      </div>
    );
  }

  if (type === 'tracking') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Tracking Number</label>
        <input defaultValue={o.tracking_number || ''} onChange={set('tracking_number')} className="input-field w-full font-mono" placeholder="Enter tracking number"/>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Delivery Company</label>
        <select defaultValue={o.delivery_company_id || ''} onChange={set('delivery_company_id')} className="input-field w-full">
          <option value="">— None —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm">Save</button>
      </div>
    );
  }

  if (type === 'notes') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Order Notes</label>
        <textarea defaultValue={o.notes || ''} onChange={set('notes')} rows={6} className="input-field w-full" placeholder="Private note about this order..."/>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm">Save Note</button>
      </div>
    );
  }

  if (type === 'customer') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</label>
        <input defaultValue={o.customer_name || ''} onChange={set('customer_name')} className="input-field w-full"/>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
        <input defaultValue={o.customer_phone || ''} onChange={set('customer_phone')} className="input-field w-full font-mono"/>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
        <input defaultValue={o.customer_email || ''} onChange={set('customer_email')} className="input-field w-full"/>
        <div className="flex gap-2 pt-2">
          {o.customer_phone && <a href={`tel:${o.customer_phone}`} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"><Phone size={12}/>Call</a>}
          {waLink(o.customer_phone) && <a href={waLink(o.customer_phone)} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"><MessageCircle size={12}/>WhatsApp</a>}
        </div>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-black text-white font-bold text-sm">Save</button>
      </div>
    );
  }

  if (type === 'phone') {
    const link = waLink(o.customer_phone);
    return wrap(
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-gray-50 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Customer Phone</p>
          <p className="font-mono text-2xl font-black">{o.customer_phone || '—'}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href={`tel:${o.customer_phone}`} className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex flex-col items-center gap-1"><Phone size={14}/>Call</a>
          {link && <a href={link} target="_blank" rel="noreferrer" className="py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs flex flex-col items-center gap-1"><MessageCircle size={14}/>WhatsApp</a>}
          <button onClick={() => copy(o.customer_phone || '')} className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex flex-col items-center gap-1"><Copy size={14}/>Copy</button>
        </div>
      </div>
    );
  }

  if (type === 'address') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Street</label>
        <input defaultValue={o.shipping_address || ''} onChange={set('shipping_address')} className="input-field w-full"/>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">City (Commune)</label><input defaultValue={o.shipping_city || ''} onChange={set('shipping_city')} className="input-field w-full"/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Wilaya</label><input defaultValue={o.shipping_wilaya || ''} onChange={set('shipping_wilaya')} className="input-field w-full"/></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Zip</label><input defaultValue={o.shipping_zip || ''} onChange={set('shipping_zip')} className="input-field w-full font-mono"/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">N° Wilaya</label><input defaultValue={o.shipping_wilaya_code || ''} onChange={set('shipping_wilaya_code')} className="input-field w-full font-mono"/></div>
        </div>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">Save Address</button>
      </div>
    );
  }

  if (type === 'billing') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Billing Name</label>
        <input defaultValue={o.billing_name || o.customer_name || ''} onChange={set('billing_name')} className="input-field w-full"/>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Street</label>
        <input defaultValue={o.billing_street || o.billing_address || ''} onChange={set('billing_street')} className="input-field w-full"/>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">City</label><input defaultValue={o.billing_city || ''} onChange={set('billing_city')} className="input-field w-full"/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Zip</label><input defaultValue={o.billing_zip || ''} onChange={set('billing_zip')} className="input-field w-full font-mono"/></div>
        </div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Country</label>
        <input defaultValue={o.billing_country || 'DZ'} onChange={set('billing_country')} className="input-field w-full"/>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm">Save Billing</button>
      </div>
    );
  }

  if (type === 'shipping_method') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Shipping Method</label>
        <div className="grid grid-cols-2 gap-2">
          {['home','stop_desk'].map(m => {
            const active = (o.shipping_type || 'home') === m;
            return (
              <button key={m} onClick={() => { onSaveField({ shipping_type: m }); onClose(); }}
                className={`py-4 rounded-xl font-bold text-xs flex flex-col items-center gap-1 ${active ? 'bg-emerald-500 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {m === 'home' ? <Home size={18}/> : <Package size={18}/>}
                {m === 'home' ? 'Home Delivery' : 'Stop Desk'}
              </button>
            );
          })}
        </div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Shipping Cost ({cur})</label>
        <input type="number" defaultValue={o.shipping_cost || 0} onChange={set('shipping_cost')} className="input-field w-full"/>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-black text-white font-bold text-sm">Save</button>
      </div>
    );
  }

  if (type === 'totals') {
    return wrap(
      <div className="space-y-1">
        {row('Subtotal', fmtMoney(o.subtotal, cur))}
        {row('Taxes', fmtMoney(o.tax_total || o.taxes || 0, cur))}
        {row('Shipping Cost', fmtMoney(o.shipping_cost, cur))}
        {row('Discount', fmtMoney(o.discount_total || 0, cur))}
        {row('Total', <span className="font-black text-lg text-emerald-600">{fmtMoney(o.total, cur)}</span>)}
        {row('Currency', o.currency || 'DZD')}
      </div>
    );
  }

  if (type === 'processed_at') {
    const d = o.processed_at || o.updated_at;
    return wrap(
      <div className="space-y-3">
        {row('Created', new Date(o.created_at).toLocaleString())}
        {row('Last Updated', o.updated_at ? new Date(o.updated_at).toLocaleString() : '—')}
        {row('Processed', d ? new Date(d).toLocaleString() : 'Not processed')}
        {!o.processed_at && <button onClick={() => { onSaveField({ processed_at: new Date().toISOString() }); onClose(); }} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">Mark as Processed Now</button>}
      </div>
    );
  }

  if (type === 'financial') {
    const opts = ['pending','paid','refunded','failed','partially_refunded'];
    return wrap(
      <div className="grid grid-cols-2 gap-2">
        {opts.map(s => {
          const active = (o.payment_status || 'pending') === s;
          const cls = s === 'paid' ? 'bg-emerald-500' : s === 'refunded' ? 'bg-orange-500' : s === 'failed' ? 'bg-red-500' : s === 'partially_refunded' ? 'bg-purple-500' : 'bg-amber-500';
          return (
            <button key={s} onClick={() => { onSaveField({ payment_status: s }); onClose(); }}
              className={`py-3 rounded-xl text-xs font-bold uppercase ${active ? `${cls} text-white ring-2 ring-offset-2 ring-gray-300` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s.replace('_',' ')}</button>
          );
        })}
      </div>
    );
  }

  if (type === 'currency') {
    return wrap(
      <div className="grid grid-cols-3 gap-2">
        {['DZD','USD','EUR','MAD','TND','GBP'].map(c => {
          const active = (o.currency || 'DZD') === c;
          return (
            <button key={c} onClick={() => { onSaveField({ currency: c }); onClose(); }}
              className={`py-3 rounded-xl font-bold text-sm ${active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
          );
        })}
      </div>
    );
  }

  if (type === 'discount') {
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Code</label>
        <input defaultValue={o.discount_code || ''} onChange={set('discount_code')} className="input-field w-full uppercase font-mono" placeholder="SUMMER10"/>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Amount ({cur})</label>
        <input type="number" defaultValue={o.discount_total || 0} onChange={set('discount_total')} className="input-field w-full"/>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm">Save Discount</button>
      </div>
    );
  }

  if (type === 'source') {
    const opts = ['storefront','manual','whatsapp','instagram','facebook','tiktok','pos','api'];
    return wrap(
      <div className="grid grid-cols-2 gap-2">
        {opts.map(s => {
          const active = (o.source || o.created_via || 'storefront') === s;
          return (
            <button key={s} onClick={() => { onSaveField({ source: s }); onClose(); }}
              className={`py-3 rounded-xl text-xs font-bold uppercase ${active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
          );
        })}
      </div>
    );
  }

  // Default: generic order summary fallback.
  return wrap(
    <div>
      {row('Order N', o.order_number)}
      {row('Customer', o.customer_name)}
      {row('Phone', o.customer_phone)}
      {row('Total', fmtMoney(o.total, cur))}
    </div>
  );
}
