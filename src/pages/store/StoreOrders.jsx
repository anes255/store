import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import api from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { getEnAr } from '../../data/wilayaTranslations';
import { Search, Eye, X, Truck, Check, Clock, Package, Ban, Phone, MapPin, CreditCard, Calendar, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, User, Mail, RefreshCw, Download, MessageSquare, PhoneMissed, PhoneOff, RotateCcw, Hourglass, ShoppingBag, Loader2, CheckSquare, Square, Trash2, Columns, GripVertical, BarChart3, Plus, Send, Home, Hash, DollarSign, Percent, Tag, Globe, Building2, FileText, Copy, ExternalLink, MessageCircle, Image as ImgIcon, Printer } from 'lucide-react';

// All columns available to toggle / reorder.
const ALL_COLUMNS = [
  { key: 'photo',            label: 'Photo' },
  { key: 'order',            label: 'Order N' },
  { key: 'products',         label: 'Products' },
  { key: 'wilaya',           label: 'Wilaya' },
  { key: 'wilaya_number',    label: 'N° Wilaya' },
  { key: 'commune',          label: 'Commune' },
  { key: 'customer_name',    label: 'Name' },

  { key: 'phone',            label: 'Phone N' },
  { key: 'transfer',         label: 'Transfer' },

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
  { key: 'preferred_company', label: 'Preferred Delivery' },
  { key: 'notes',            label: 'Notes' },
  { key: 'payment_method',   label: 'Payment' },
];
const DEFAULT_COLUMNS = ['order','products','wilaya','commune','transfer','phone','status','preferred_company','shipping_method','total','financial_status','notes','tracking_number'];
const PREPARING_COLUMNS = ['order','products','customer_name','phone','wilaya','commune','status','notes'];

const statusConfig = {
  new_order:      { color: 'bg-violet-500',  bg: 'bg-violet-500',  text: 'text-white', label: 'NEW' },
  pending:        { color: 'bg-violet-500',  bg: 'bg-violet-500',  text: 'text-white', label: 'NEW' },
  confirmed:      { color: 'bg-blue-500',    bg: 'bg-blue-500',    text: 'text-white', label: 'CONFIRMED' },
  preparing:      { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-500', text: 'text-white', label: 'PREPARING' },
  under_preparation: { color: 'bg-fuchsia-500', bg: 'bg-fuchsia-500', text: 'text-white', label: 'PREPARING' },
  ready:          { color: 'bg-teal-500',    bg: 'bg-teal-500',    text: 'text-white', label: 'READY' },
  shipped:        { color: 'bg-blue-600',    bg: 'bg-blue-600',    text: 'text-white', label: 'SHIPPED' },
  delivered:      { color: 'bg-emerald-500', bg: 'bg-emerald-500', text: 'text-white', label: 'DELIVERED' },
  cancelled:      { color: 'bg-red-500',     bg: 'bg-red-500',     text: 'text-white', label: 'CANCELLED' },
  failed_call_1:  { color: 'bg-yellow-500',  bg: 'bg-yellow-500',  text: 'text-white', label: 'CALL FAILED 1' },
  failed_call_2:  { color: 'bg-orange-400',  bg: 'bg-orange-400',  text: 'text-white', label: 'CALL FAILED 2' },
  failed_call_3:  { color: 'bg-rose-400',    bg: 'bg-rose-400',    text: 'text-white', label: 'CALL FAILED 3' },
  returned:       { color: 'bg-gray-500',    bg: 'bg-gray-500',    text: 'text-white', label: 'RETURNED' },
  archived:       { color: 'bg-slate-500',   bg: 'bg-slate-500',   text: 'text-white', label: 'ARCHIVED' },
};
const allStatuses = ['new_order','confirmed','preparing','ready','shipped','delivered','cancelled','failed_call_1','failed_call_2','failed_call_3','returned','archived'];

const TRANSFER_COMPANY_COLORS = { noest: '#3b82f6', dhd: '#f97316', yalidine: '#22c55e', yalid: '#22c55e', 'zr express': '#6366f1', procolis: '#8b5cf6', maystro: '#ec4899', ecotrack: '#14b8a6', yassir: '#eab308', aramex: '#dc2626', dhl: '#fbbf24', fedex: '#7c3aed', ups: '#92400e', boxy: '#64748b' };
function transferBadge(o) {
  if (!o.delivery_company_name) return null;
  const name = (o.delivery_company_name || '').toLowerCase();
  let color = '#6366f1';
  for (const [k,v] of Object.entries(TRANSFER_COMPANY_COLORS)) { if (name.includes(k)) { color = v; break; } }
  return { label: o.delivery_company_name, color };
}

function fmtMoney(v, cur) { return `${parseFloat(v||0).toLocaleString()} ${cur||'DZD'}`; }

// Wilaya name → 2-digit code lookup. Used by both the cell renderer and the
// quick-action drawer so an order with only `shipping_wilaya` (name) still
// shows N° Wilaya in the table.
const WILAYA_NAME_TO_CODE = { 'adrar':'01','chlef':'02','laghouat':'03','oum el bouaghi':'04','batna':'05','béjaïa':'06','bejaia':'06','biskra':'07','béchar':'08','bechar':'08','blida':'09','bouira':'10','tamanrasset':'11','tébessa':'12','tebessa':'12','tlemcen':'13','tiaret':'14','tizi ouzou':'15','alger':'16','algiers':'16','djelfa':'17','jijel':'18','sétif':'19','setif':'19','saïda':'20','saida':'20','skikda':'21','sidi bel abbès':'22','sidi bel abbes':'22','annaba':'23','guelma':'24','constantine':'25','médéa':'26','medea':'26','mostaganem':'27','msila':'28','m’sila':'28','mascara':'29','ouargla':'30','oran':'31','el bayadh':'32','illizi':'33','bordj bou arréridj':'34','boumerdès':'35','boumerdes':'35','el tarf':'36','tindouf':'37','tissemsilt':'38','el oued':'39','khenchela':'40','souk ahras':'41','tipaza':'42','mila':'43','aïn defla':'44','ain defla':'44','naâma':'45','naama':'45','aïn témouchent':'46','ain temouchent':'46','ghardaïa':'47','ghardaia':'47','relizane':'48','timimoun':'49','bordj badji mokhtar':'50','ouled djellal':'51','béni abbès':'52','beni abbes':'52','in salah':'53','in guezzam':'54','touggourt':'55','djanet':'56','el m\'ghair':'57','el meghaier':'57','el menia':'58' };
function wilayaCodeFor(o) {
  if (!o) return '';
  if (o.shipping_wilaya_code) return o.shipping_wilaya_code;
  const n = String(o.shipping_wilaya || '').trim().toLowerCase();
  if (n && WILAYA_NAME_TO_CODE[n]) return WILAYA_NAME_TO_CODE[n];
  if (o.shipping_zip && /^\d{2}/.test(o.shipping_zip)) return o.shipping_zip.slice(0,2);
  return '';
}
function waLink(phone) { if (!phone) return null; const clean = String(phone).replace(/[^\d+]/g,''); return `https://wa.me/${clean.replace(/^\+/,'')}`; }
function copy(text) { try { navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Copy failed'); } }

export default function StoreOrders() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const location = useLocation();

  // When this page is mounted at /dashboard/preparing, lock the filter to
  // "preparing" so only orders currently being prepared are visible. The
  // archive page is similarly locked to "archived".
  const isPreparingPage = location.pathname === '/dashboard/preparing';
  const isArchivePage = location.pathname === '/dashboard/orders-archive';

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(isPreparingPage ? 'preparing' : isArchivePage ? 'archived' : 'all');
  useEffect(() => {
    if (isPreparingPage && filter !== 'preparing') setFilter('preparing');
    else if (isArchivePage && filter !== 'archived') setFilter('archived');
    else if (!isPreparingPage && !isArchivePage && (filter === 'preparing' || filter === 'archived')) setFilter('all');
  }, [isPreparingPage, isArchivePage, filter]);
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {ids:[]}
  // Quick action drawer: { type: string, order: {...} } — null when closed.
  const [quickAction, setQuickAction] = useState(null);
  // Horizontal scroll container ref — users scroll by touch-drag / pointer-drag / trackpad / wheel.
  const hscrollRef = React.useRef(null);
  // Pointer-drag to scroll: lets mouse users grab-and-pan the wide table like on touch.
  React.useEffect(() => {
    const el = hscrollRef.current; if (!el) return;
    let isDown = false, startX = 0, startLeft = 0, pointerId = null, moved = false;
    const onDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Don't hijack clicks on interactive controls — only start drag on empty space / cells.
      const tgt = e.target;
      if (tgt.closest && tgt.closest('button,a,input,select,textarea,[role="button"]')) return;
      isDown = true; moved = false; pointerId = e.pointerId;
      startX = e.clientX; startLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => { isDown = false; el.style.cursor = ''; };
    const onClickCapture = (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);
  const [activeColumns, setActiveColumns] = useState(() => {
    if (isPreparingPage) return PREPARING_COLUMNS;
    try { const s = JSON.parse(localStorage.getItem('orders.columns.v5') || 'null'); return Array.isArray(s) && s.length ? s : DEFAULT_COLUMNS; }
    catch { return DEFAULT_COLUMNS; }
  });
  useEffect(() => { if (!isPreparingPage) localStorage.setItem('orders.columns.v5', JSON.stringify(activeColumns)); }, [activeColumns, isPreparingPage]);
  useEffect(() => { localStorage.setItem('orders.pageSize', String(pageSize)); }, [pageSize]);
  // View mode: 'cards' (responsive, fits any screen) or 'table' (old wide scroll table).
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('orders.viewMode') || 'table');
  useEffect(() => { localStorage.setItem('orders.viewMode', viewMode); }, [viewMode]);
  // Row density — admin-controlled box size. 'compact' | 'normal' | 'large'
  const [density, setDensity] = useState(() => localStorage.getItem('orders.density') || 'normal');
  useEffect(() => { localStorage.setItem('orders.density', density); }, [density]);
  // Admin column width / font-size multiplier.
  const [colScale, setColScale] = useState(() => parseFloat(localStorage.getItem('orders.colScale') || '1'));
  useEffect(() => { localStorage.setItem('orders.colScale', String(colScale)); }, [colScale]);
  // Persisted per-column widths (px). Drag the right edge of any header cell
  // to resize that column. Stored across reloads.
  const [colWidths, setColWidths] = useState(() => { try { return JSON.parse(localStorage.getItem('orders.colWidths.v1') || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem('orders.colWidths.v1', JSON.stringify(colWidths)); } catch {} }, [colWidths]);
  const [draggedCol, setDraggedCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  // Reorder helper used by the drag handlers — moves "key" so it lands at "before".
  const reorderColumns = (key, before) => setActiveColumns(prev => {
    const i = prev.indexOf(key); if (i < 0) return prev;
    const next = [...prev]; next.splice(i, 1);
    let j = next.indexOf(before); if (j < 0) j = next.length;
    next.splice(j, 0, key); return next;
  });
  const densityRowCls = density === 'compact' ? 'orders-row-compact' : density === 'large' ? 'orders-row-large' : 'orders-row-normal';

  const toggleColumn = (key) => setActiveColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const moveColumn = (key, dir) => setActiveColumns(prev => {
    const i = prev.indexOf(key); if (i < 0) return prev;
    const j = i + dir; if (j < 0 || j >= prev.length) return prev;
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });

  const toggleSelect = (id) => setSelectedItems(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelectedItems(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const loadOrders = async (overrideFilter) => {
    if (!currentStore?.id) return;
    const effectiveFilter = overrideFilter || filter;
    try {
      const wantPreparingBucket = effectiveFilter === 'preparing';
      const wantArchive = effectiveFilter === 'archived';
      const params = { search };
      if (wantArchive) { params.archived = 'only'; }
      else if (!wantPreparingBucket && effectiveFilter !== 'all') { params.status = effectiveFilter; }
      const { data } = await orderApi.getAll(currentStore.id, params);
      let rows = data.orders || [];
      if (wantPreparingBucket) {
        rows = rows.filter(o => ['confirmed','preparing','under_preparation'].includes(o.status));
      }
      setOrders(rows); setTotal(wantPreparingBucket || wantArchive ? rows.length : data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    const pathFilter = location.pathname === '/dashboard/preparing' ? 'preparing' : location.pathname === '/dashboard/orders-archive' ? 'archived' : null;
    if (pathFilter && filter !== pathFilter) { setFilter(pathFilter); setLoading(true); loadOrders(pathFilter); }
    else if (!pathFilter && (filter === 'preparing' || filter === 'archived')) { setFilter('all'); setLoading(true); loadOrders('all'); }
    else { setLoading(true); loadOrders(); }
  }, [currentStore?.id, filter, search, location.pathname]);
  useEffect(() => { if (currentStore?.id) api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r => setCompanies(r.data || [])).catch(() => {}); }, [currentStore?.id]);

  const highlightId = useMemo(() => { const p = new URLSearchParams(location.search); return p.get('highlight') || null; }, [location.search]);
  useEffect(() => {
    if (!highlightId) return;
    const el = document.querySelector(`[data-order-id="${highlightId}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2','ring-amber-400'); const tm = setTimeout(() => el.classList.remove('ring-2','ring-amber-400'), 3500); return () => clearTimeout(tm); }
  }, [highlightId, orders]);

  const updateStatus = async (orderId, status) => {
    setUpdatingStatus(orderId + status);
    // Optimistic UI: update the row in-place AND drop it from the current
    // view if it no longer belongs to the active filter, so the admin sees
    // the change reflected without reloading the page.
    const fitsCurrentFilter = (s) => {
      if (filter === 'all') return true;
      if (filter === 'preparing') return ['confirmed','preparing','under_preparation'].includes(s);
      return s === filter;
    };
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o).filter(o => o.id !== orderId || fitsCurrentFilter(status)));
    try {
      await orderApi.updateStatus(currentStore.id, orderId, { status });
      toast.success(`Order → ${statusConfig[status]?.label || status}`);
      if (selectedOrder?.id === orderId) { const { data } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(data); }
    } catch { toast.error('Failed'); loadOrders(); /* roll back from server on failure */ }
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

  // Dispatch order: create the parcel on the carrier's platform via API and
  // save the returned tracking number. Status auto-flips to shipped server-side.
  const [lastDispatchDebug, setLastDispatchDebug] = useState(null);

  const dispatchOrder = async (orderId, deliveryCompanyId) => {
    const tid = toast.loading(t('orders.pushingToCarrier','Pushing order to carrier…'));
    try {
      const { data } = await api.post(`/manage/stores/${currentStore.id}/orders/${orderId}/dispatch`, { delivery_company_id: deliveryCompanyId });
      toast.dismiss(tid);
      if (data?.ok === false) {
        toast.error(`❌ ${data.error || 'Carrier rejected'}`, { duration: 8000 });
        setLastDispatchDebug(data);
      } else if (data?.tracking_number) {
        toast.success(`✅ ${data.message || 'Order pushed'} · TN: ${data.tracking_number}`, { duration: 6000 });
        setLastDispatchDebug(data);
      } else {
        toast.success(data?.message || t('orders.transferred','Order transferred'));
        setLastDispatchDebug(data);
      }
      const dcName = companies.find(c => String(c.id) === String(deliveryCompanyId))?.name || null;
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        delivery_company_id: deliveryCompanyId,
        delivery_company_name: dcName,
        status: data?.ok !== false ? 'shipped' : o.status,
        tracking_number: data?.tracking_number || o.tracking_number,
      } : o));
      if (selectedOrder?.id === orderId) { const { data: o } = await orderApi.getOne(currentStore.id, orderId); setSelectedOrder(o); }
    } catch (e) {
      toast.dismiss(tid);
      const respData = e?.response?.data;
      const carrier = respData?.carrier_response;
      const msg = respData?.error || 'Carrier push failed';
      const detail = carrier ? ' · ' + (typeof carrier === 'string' ? carrier.slice(0,80) : (carrier.message || carrier.error || JSON.stringify(carrier).slice(0,80))) : '';
      toast.error(msg + detail, { duration: 7000 });
      setLastDispatchDebug(respData || { error: msg });
      loadOrders();
    }
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
    { key: 'delivered',     label: 'Delivered' },
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

  // Open a print-friendly window with one ticket per selected order so the
  // user can hand them to the warehouse / delivery driver. Uses window.print()
  // after the document has rendered.
  // Each row may not have its line-items pre-loaded (the list endpoint omits
  // them), so we fetch the full detail for any missing order before rendering.
  const printOrders = async (rows) => {
    if (!rows.length) return;
    // Hydrate missing items by fetching the full order.
    const hydrated = await Promise.all(rows.map(async o => {
      let items = o.items;
      if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
      if (!Array.isArray(items) || items.length === 0) {
        try { const { data } = await orderApi.getOne(currentStore.id, o.id); items = data.items || []; o = { ...o, ...data, items }; }
        catch {}
      }
      return { ...o, items: Array.isArray(items) ? items : [] };
    }));
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const variantText = (i) => {
      // Variant info can be stored many ways: variant_name string,
      // variant_info JSON (string or jsonb-as-object), legacy `variant`,
      // or a plain map like {color:'Black',size:'40-41'}.
      if (i.variant_name) return i.variant_name;
      let v = i.variant_info ?? i.variant;
      if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return v; } }
      if (!v) return '';
      const cap = (s) => typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s;
      if (Array.isArray(v)) return v.map(x => typeof x === 'string' ? x : (x?.name || x?.value || '')).filter(Boolean).join(' · ');
      if (Array.isArray(v.selections)) return v.selections.map(s => `${s.type ? cap(s.type) + ': ' : ''}${s.label || s.name || s.value || ''}`).filter(Boolean).join(' · ');
      if (v.name || v.value || v.label) return `${v.type ? cap(v.type) + ': ' : ''}${v.label || v.name || v.value}`;
      if (typeof v === 'object') {
        const out = [];
        for (const [k, val] of Object.entries(v)) {
          if (val == null || typeof val === 'object') continue;
          if (k === 'type' || k === 'sku' || k === 'price') continue;
          out.push(`${cap(k)}: ${val}`);
        }
        return out.join(' · ');
      }
      return '';
    };
    const ticket = (o, idx, total) => {
      const items = o.items || [];
      const itemsHtml = items.map(i => {
        const vt = variantText(i);
        const qty = parseInt(i.quantity) || 1;
        const unit = parseFloat(i.unit_price ?? i.price) || 0;
        return `<tr>
          <td><div class="pname">${esc(i.product_name || i.name || '')}</div>${vt ? `<div class="pvar">${esc(vt)}</div>` : ''}${i.sku ? `<div class="psku">SKU: ${esc(i.sku)}</div>` : ''}</td>
          <td style="text-align:center">${qty}</td>
          <td style="text-align:right">${fmtMoney(unit, o.currency)}</td>
          <td style="text-align:right"><b>${fmtMoney(unit * qty, o.currency)}</b></td>
        </tr>`;
      }).join('');
      const wn = o.shipping_wilaya_code ? ` (${esc(o.shipping_wilaya_code)})` : '';
      return `
        <section class="ticket">
          <header class="hdr">
            <div>
              <div class="store">${esc(currentStore?.name || '')}</div>
              <div class="meta">Order <b>${esc(o.order_number)}</b> · ${esc(new Date(o.created_at).toLocaleString())} · ${idx + 1}/${total}</div>
            </div>
            <div class="status">${esc(statusConfig[o.status]?.label || o.status)}</div>
          </header>
          <div class="cols">
            <div class="cust">
              <p class="lbl">Buyer</p>
              <div><b>${esc(o.customer_name || '')}</b></div>
              <div>${esc(o.customer_phone || '')}</div>
              ${o.customer_email ? `<div>${esc(o.customer_email)}</div>` : ''}
            </div>
            <div class="ship">
              <p class="lbl">Shipping</p>
              <div>${esc(o.shipping_wilaya || '')}${wn}${o.shipping_city ? ', ' + esc(o.shipping_city) : ''}</div>
              ${o.shipping_address ? `<div>${esc(o.shipping_address)}</div>` : ''}
              ${o.shipping_zip ? `<div class="meta">Zip: ${esc(o.shipping_zip)}</div>` : ''}
              <div class="meta">${esc(o.shipping_type || 'home')} delivery${o.delivery_company_name ? ' · ' + esc(o.delivery_company_name) : ''}</div>
            </div>
          </div>
          <table class="items">
            <thead><tr><th>Product / Variant</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
            <tbody>${itemsHtml || '<tr><td colspan="4" style="text-align:center;color:#999">No items</td></tr>'}</tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><b>${fmtMoney(o.subtotal ?? (o.total - (o.shipping_cost || 0)), o.currency)}</b></div>
            <div><span>Shipping</span><b>${fmtMoney(o.shipping_cost, o.currency)}</b></div>
            ${o.discount > 0 ? `<div><span>Discount</span><b>-${fmtMoney(o.discount, o.currency)}</b></div>` : ''}
            <div class="total"><span>TOTAL</span><b>${fmtMoney(o.total, o.currency)}</b></div>
            <div class="meta">Payment: ${esc((o.payment_method || 'cod').toUpperCase())}</div>
          </div>
          ${o.tracking_number ? `<div class="track">Tracking: <b>${esc(o.tracking_number)}</b>${o.delivery_company_name ? ` · ${esc(o.delivery_company_name)}` : ''}</div>` : ''}
          ${o.notes ? `<div class="notes">Notes: ${esc(o.notes)}</div>` : ''}
        </section>`;
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Orders — Print (${hydrated.length})</title>
      <style>
        *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111}
        body{margin:0;padding:16px;background:#fff}
        h1.title{font-size:14px;font-weight:800;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;color:#555}
        /* Single-page layout: tickets stack normally with no forced page-breaks
           so the browser fits as many on one printed page as it can. */
        .ticket{border:1px solid #ddd;border-radius:8px;padding:14px;margin-bottom:12px;page-break-inside:avoid}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px dashed #ccc;padding-bottom:8px;margin-bottom:8px}
        .store{font-size:16px;font-weight:800}
        .meta{font-size:10px;color:#666;margin-top:2px}
        .status{font-size:10px;font-weight:800;background:#111;color:#fff;padding:3px 8px;border-radius:999px;letter-spacing:.5px}
        .lbl{font-size:9px;font-weight:800;text-transform:uppercase;color:#888;letter-spacing:.5px;margin:0 0 3px}
        .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11.5px;line-height:1.45;margin-bottom:8px}
        .cust b,.ship b{font-size:12.5px}
        table.items{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
        table.items th{background:#f5f5f5;text-align:left;padding:5px;border-bottom:1px solid #ddd;font-size:9px;text-transform:uppercase;color:#555}
        table.items td{padding:5px;border-bottom:1px solid #f0f0f0;vertical-align:top}
        .pname{font-weight:600}
        .pvar{font-size:10px;color:#666;margin-top:1px}
        .psku{font-size:9px;color:#999;font-family:monospace}
        .totals{font-size:11px;border-top:1px dashed #ccc;padding-top:6px}
        .totals div{display:flex;justify-content:space-between;padding:1px 0}
        .totals .total{font-size:13px;font-weight:800;border-top:1px solid #111;margin-top:3px;padding-top:5px}
        .track{margin-top:6px;font-size:10px;color:#444}
        .notes{margin-top:5px;font-size:10px;color:#666;font-style:italic}
        @media print{body{padding:6mm}.ticket{border:1px solid #999}h1.title{display:none}}
      </style>
      </head><body>
        <h1 class="title">${hydrated.length} order${hydrated.length === 1 ? '' : 's'} · ${esc(currentStore?.name || '')} · ${esc(new Date().toLocaleString())}</h1>
        ${hydrated.map((o, i) => ticket(o, i, hydrated.length)).join('')}
        <script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Allow pop-ups to print orders'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

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
        const img = o.first_image || first?.product_image;
        return (
          <td className="px-3 py-3">{cellBtn(o, 'products',
            <div className="flex items-center gap-2">
              {img ? <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"/> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Package size={14} className="text-gray-400"/></div>}
              {first ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">{first.quantity}x</span>
                    <span className="text-xs font-semibold truncate max-w-[120px]">{first.product_name || first.name}</span>
                  </div>
                  {items.length > 1 && <p className="text-[9px] text-gray-400 mt-0.5">+{items.length-1} more</p>}
                </div>
              ) : <span className="text-xs text-gray-400">—</span>}
            </div>
          )}</td>
        );
      }

      case 'wilaya': {
        const wn = o.shipping_wilaya_code || o.shipping_zip?.slice(0,2) || '';
        return <td className="px-3 py-3">{cellBtn(o, 'address',
          <><p className="text-xs font-semibold">{wn && <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px]">{wn}</span>}{wilayaBi.en || '—'}</p>{wilayaBi.ar && wilayaBi.ar !== wilayaBi.en && <p className="text-[10px] text-gray-400" dir="rtl">{wilayaBi.ar}</p>}</>
        )}</td>;
      }

      case 'wilaya_number': {
        const code = wilayaCodeFor(o);
        return <td className="px-3 py-3">{cellBtn(o, 'address', <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${code?'bg-emerald-50 text-emerald-700':'text-gray-400'}`}>{code || '—'}</span>)}</td>;
      }

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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold leading-tight text-white" style={{backgroundColor: transfer.color}}>{transfer.label}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600"><Send size={10}/>{t('orders.transfer','Transfer')}</span>
            )
          )}</td>
        );

      case 'status':
        return <td className="px-3 py-3">{cellBtn(o, 'status',
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${sc.bg} ${sc.text}`}>{sc.label} <ChevronDown size={10} className="ml-1 opacity-60"/></span>
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

      case 'company_name': {
        const dcName = o.delivery_company_name || o.preferred_delivery_company_name;
        return <td className="px-3 py-3">
          {dcName
            ? <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${o.delivery_company_name ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}><Building2 size={10}/>{dcName}{!o.delivery_company_name && o.preferred_delivery_company_name ? ' (buyer)' : ''}</span>
            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500">—</span>}
        </td>;
      }

      case 'preferred_company':
        return <td className="px-3 py-3">
          {o.preferred_delivery_company_name
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Truck size={10}/>{o.preferred_delivery_company_name}</span>
            : <span className="text-[10px] text-gray-400">—</span>}
        </td>;

      case 'notes':
        return <td className="px-3 py-3">{cellBtn(o, 'notes',
          o.notes
            ? <span className="text-xs text-gray-700 truncate block max-w-[180px]">{o.notes}</span>
            : <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><FileText size={10}/>Add note</span>
        )}</td>;

      case 'payment_method':
        return <td className="px-3 py-3">{cellBtn(o, 'payment_method',
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
              o.payment_method === 'cod' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              o.payment_method === 'ccp' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              o.payment_method === 'baridimob' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-gray-50 text-gray-700 border border-gray-200'
            }`}><CreditCard size={10}/>{(o.payment_method || 'cod').replace(/_/g, ' ')}</span>
            {o.receipt_image && (o.payment_method === 'ccp' || o.payment_method === 'baridimob') && (
              <img src={o.receipt_image} alt="Receipt" className="w-8 h-8 rounded object-cover border border-gray-200 cursor-pointer" title="View receipt"/>
            )}
          </div>
        )}</td>;

      default: return <td className="px-3 py-3">—</td>;
    }
  };

  return (
    <DashboardLayout>
      {/* Status tabs row */}
      {isPreparingPage ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-purple-500 text-white shadow flex items-center gap-1.5">
            <Hourglass size={11} /> Preparing
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/25">({orders.length})</span>
          </span>
          <span className="text-[11px] text-gray-400">Showing only orders currently being prepared.</span>
        </div>
      ) : (
        <div className="mb-3 overflow-x-auto -mx-1 px-1">
          <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap">
            {filters.map(f => {
              const isActive = filter === f.key;
              const sc = statusConfig[f.key];
              const count = f.key === 'all' ? total : orders.filter(o => f.key === 'preparing' ? (o.status === 'preparing' || o.status === 'under_preparation') : o.status === f.key).length;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${isActive ? (sc ? `${sc.bg} text-white border-transparent shadow-md` : 'bg-gray-700 text-white border-transparent shadow-md') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {f.label}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters card */}
      {!isPreparingPage && <div className="glass-card-solid p-4 mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">All statuses</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} disabled={isPreparingPage} title={isPreparingPage ? 'Locked to Preparing on this page' : ''} className={`input-field !py-2 text-sm w-full ${isPreparingPage ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <option value="all">All statuses</option>
              {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date: Oldest</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field !py-2 text-sm w-full box-border min-w-0" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date: Newest</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field !py-2 text-sm w-full box-border min-w-0" />
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
      </div>}

      {/* Orders header */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 shrink-0">Orders</h1>
        <div className="overflow-x-auto -mx-1 px-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 w-max">
          <button onClick={() => exportCsv(filteredOrders)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            <Download size={13}/>Export
          </button>
          <button onClick={() => setAdminStatsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            <BarChart3 size={13}/>Admin Stats
          </button>
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1" title="Order row size">
            {[['compact','S'],['normal','M'],['large','L']].map(([k,lbl]) => (
              <button key={k} onClick={() => setDensity(k)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase ${density===k?'bg-gray-900 text-white':'text-gray-600 hover:bg-white'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1" title="Column width">
            <button onClick={() => setColScale(Math.max(0.75, +(colScale-0.1).toFixed(2)))} className="px-2 py-1 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-white">−</button>
            <span className="px-1 text-[10px] font-bold text-gray-500 tabular-nums">{Math.round(colScale*100)}%</span>
            <button onClick={() => setColScale(Math.min(1.5, +(colScale+0.1).toFixed(2)))} className="px-2 py-1 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-white">+</button>
          </div>
          <ColumnsPicker
            open={columnPickerOpen}
            setOpen={setColumnPickerOpen}
            activeColumns={activeColumns}
            ALL_COLUMNS={ALL_COLUMNS}
            toggleColumn={toggleColumn}
            moveColumn={moveColumn}
          />
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
            <Plus size={13}/>Create Order
          </button>
        </div>
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
          <div
            ref={hscrollRef}
            className={`orders-hscroll orders-hscroll-clean ${densityRowCls}`}
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              width: '100%',
              maxWidth: '100%',
              display: 'block',
              overscrollBehaviorX: 'contain',
              cursor: 'grab',
              fontSize: `${colScale}em`,
            }}
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollWidth <= el.clientWidth) return;
              // Only convert vertical wheel to horizontal when shift is held
              if (e.shiftKey && e.deltaY !== 0) {
                el.scrollLeft += e.deltaY;
                e.preventDefault();
              }
              // Native horizontal scroll (trackpad / shift+wheel)
              if (e.deltaX !== 0) {
                e.stopPropagation();
              }
            }}
          >
            <table className="" style={{ width: '100%', minWidth: `${Math.max(1200, (activeColumns.length + 1) * 140 * colScale)}px`, tableLayout: 'auto', whiteSpace: 'nowrap' }}>
              {/* colgroup so user-set column widths actually apply to body cells. */}
              <colgroup>
                <col style={{ width: 40 }} />
                {activeColumns.map(k => <col key={k} style={colWidths[k] ? { width: `${colWidths[k]}px` } : undefined} />)}
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="px-3 py-3 w-10 sticky left-0 bg-gray-50 z-10"><button onClick={toggleAll}>{selectedItems.size>0 && selectedItems.size===orders.length ? <CheckSquare size={16} className="text-brand-600"/> : <Square size={16} className="text-gray-400"/>}</button></th>
                  {activeColumns.map(key => {
                    const col = ALL_COLUMNS.find(c => c.key === key); if (!col) return null;
                    const w = colWidths[key];
                    const isOver = dragOverCol === key;
                    const isDragging = draggedCol === key;
                    // Drag-resize: pointer-down on the right edge starts a width drag
                    // tracked at window level so we don't lose it past the cell bounds.
                    const startResize = (ev) => {
                      ev.preventDefault(); ev.stopPropagation();
                      const startX = ev.clientX;
                      const th = ev.currentTarget.parentElement;
                      const startW = th.getBoundingClientRect().width;
                      const onMove = (e) => {
                        const next = Math.max(60, Math.min(800, startW + (e.clientX - startX)));
                        setColWidths(prev => ({ ...prev, [key]: Math.round(next) }));
                      };
                      const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; };
                      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                      document.body.style.cursor = 'col-resize';
                    };
                    return (
                      <th
                        key={key}
                        draggable
                        onDragStart={(e) => { setDraggedCol(key); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', key); } catch {} }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverCol !== key) setDragOverCol(key); }}
                        onDragLeave={() => { if (dragOverCol === key) setDragOverCol(null); }}
                        onDrop={(e) => { e.preventDefault(); const src = draggedCol || (() => { try { return e.dataTransfer.getData('text/plain'); } catch { return null; } })(); if (src && src !== key) reorderColumns(src, key); setDraggedCol(null); setDragOverCol(null); }}
                        onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                        className={`relative px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap select-none cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'opacity-40' : ''} ${isOver ? 'bg-brand-50 border-l-2 border-brand-500' : ''}`}
                        style={w ? { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` } : undefined}
                        title="Drag header to reorder · drag right edge to resize"
                      >
                        <span className="flex items-center gap-1.5">
                          <GripVertical size={10} className="text-gray-300 group-hover:text-gray-500"/>
                          {col.label}
                        </span>
                        {/* Right-edge resize handle */}
                        <span
                          onMouseDown={startResize}
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => e.stopPropagation()}
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-brand-300/40"
                          style={{ touchAction: 'none' }}
                        />
                      </th>
                    );
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl z-50 flex-wrap max-w-[95vw]">
          <span className="text-sm font-bold">{selectedItems.size} selected</span>
          <div className="w-px h-5 bg-gray-600"/>
          {/* Bulk status change */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold"><RefreshCw size={12}/>Status <ChevronDown size={10}/></button>
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-2xl border p-2 hidden group-hover:block min-w-[160px] max-h-64 overflow-y-auto z-50">
              {allStatuses.filter(s=>s!=='archived').map(s=>{const sc2=statusConfig[s];return(
                <button key={s} onClick={async()=>{const ids=Array.from(selectedItems);const tid=toast.loading(`Updating ${ids.length} orders...`);let ok=0;for(const id of ids){try{await orderApi.updateStatus(currentStore.id,id,{status:s});ok++;}catch{}}toast.dismiss(tid);toast.success(`${ok}/${ids.length} → ${sc2.label}`);clearSelection();loadOrders();}}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-gray-50 text-gray-700`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${sc2.color}`}/>{sc2.label}
                </button>
              );})}
            </div>
          </div>
          {/* Bulk financial status change */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold"><DollarSign size={12}/>Payment <ChevronDown size={10}/></button>
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-2xl border p-2 hidden group-hover:block min-w-[140px] z-50">
              {['pending','paid','refunded','failed'].map(ps=>{
                const cls=ps==='paid'?'text-emerald-700':ps==='refunded'?'text-orange-700':ps==='failed'?'text-red-700':'text-amber-700';
                return(
                <button key={ps} onClick={async()=>{const ids=Array.from(selectedItems);const tid=toast.loading(`Updating payment...`);let ok=0;for(const id of ids){try{await api.patch(`/manage/stores/${currentStore.id}/orders/${id}`,{payment_status:ps});ok++;}catch{}}toast.dismiss(tid);toast.success(`${ok}/${ids.length} → ${ps.toUpperCase()}`);clearSelection();loadOrders();}}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold ${cls} hover:bg-gray-50 uppercase`}>{ps}
                </button>
              );})}
            </div>
          </div>
          {/* Bulk transfer to delivery company */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold"><Truck size={12}/>{t('orders.bulkTransfer','Transfer')} <ChevronDown size={10}/></button>
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-2xl border p-2 hidden group-hover:block min-w-[180px] max-h-64 overflow-y-auto z-50">
              {companies.length?companies.map(c=>(
                <button key={c.id} onClick={async()=>{const ids=Array.from(selectedItems);const tid=toast.loading(`Transferring ${ids.length} order(s) to ${c.name}...`);let ok=0;for(const id of ids){try{await api.post(`/manage/stores/${currentStore.id}/orders/${id}/dispatch`,{delivery_company_id:c.id});ok++;}catch{}}toast.dismiss(tid);toast.success(`${ok}/${ids.length} → ${c.name}`);clearSelection();loadOrders();}}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-gray-50 text-gray-700">
                  <Truck size={10} className="text-emerald-500"/>{c.name}
                </button>
              )):<p className="text-[11px] text-gray-400 px-3 py-2">No delivery companies</p>}
            </div>
          </div>
          <button onClick={() => exportCsv(orders.filter(o => selectedItems.has(o.id)))} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold"><Download size={12}/>Export</button>
          <button onClick={() => printOrders(orders.filter(o => selectedItems.has(o.id)))} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold"><Printer size={12}/>Print</button>
          <button onClick={() => setDeleteConfirm({ ids: Array.from(selectedItems) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold"><Trash2 size={12}/>Delete</button>
          <button onClick={clearSelection} className="p-1.5 hover:bg-gray-700 rounded-lg"><X size={14}/></button>
        </div>
      )}

      {/* Archive-before-delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Trash2 size={18}/></div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Delete {deleteConfirm.ids.length} order{deleteConfirm.ids.length>1?'s':''}?</h2>
                <p className="text-sm text-gray-500 mt-1">Do you want to archive {deleteConfirm.ids.length>1?'them':'it'} before deleting? Archived orders can be restored from the vault.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={async () => {
                  const ids = deleteConfirm.ids;
                  try { await orderApi.bulkArchive(currentStore.id, ids, true); } catch {}
                  try { await orderApi.bulkDelete(currentStore.id, ids); } catch {}
                  setDeleteConfirm(null); clearSelection(); loadOrders();
                }}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                Archive & Delete
              </button>
              <button
                onClick={async () => {
                  const ids = deleteConfirm.ids;
                  try { await orderApi.bulkDelete(currentStore.id, ids); } catch {}
                  setDeleteConfirm(null); clearSelection(); loadOrders();
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm"
              >
                Delete without archiving
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm">Cancel</button>
            </div>
          </div>
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

      {/* Create Order modal — actually create an order inline */}
      {createOpen && (
        <CreateOrderModal
          storeId={currentStore?.id}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadOrders(); toast.success('Order created'); }}
        />
      )}

      {/* Quick action drawer — dispatches by column type */}
      {quickAction && (
        <QuickActionDrawer
          action={quickAction}
          onClose={() => setQuickAction(null)}
          onOpenFullDetail={() => { const id = quickAction.order.id; setQuickAction(null); viewOrder(id); }}
          onUpdateStatus={(status) => updateStatus(quickAction.order.id, status)}
          onSaveField={(patch) => saveOrderField(quickAction.order.id, patch)}
          onDispatch={(dcId) => dispatchOrder(quickAction.order.id, dcId)}
          companies={companies}
          statusConfig={statusConfig}
          allStatuses={allStatuses}
          isPreparingPage={isPreparingPage}
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
                  {selectedOrder.items?.map((it,i) => {
                    // Pull every variant detail the order stored: variant_info
                    // (legacy JSON), variant (cart-side object), variant_name string,
                    // or a plain map like {color:'Black',size:'40-41'}.
                    let v = it.variant_info ?? it.variant;
                    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = { name: v }; } }
                    const cap = (s) => typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s;
                    const variantBits = (() => {
                      if (it.variant_name) return String(it.variant_name).split(/\s*[·,/]\s*/).filter(Boolean);
                      if (!v) return [];
                      if (Array.isArray(v)) return v.map(x => typeof x === 'string' ? x : (x?.name || x?.value || JSON.stringify(x))).filter(Boolean);
                      if (Array.isArray(v?.selections)) return v.selections.map(s => `${s.type ? cap(s.type) + ': ' : ''}${s.label || s.name || s.value || ''}`).filter(Boolean);
                      if (v.name || v.value || v.label) return [`${v.type ? cap(v.type) + ': ' : ''}${v.label || v.name || v.value}`];
                      // Plain map like {color:'Black',size:'40-41',material:'Synthetic'}
                      if (typeof v === 'object') {
                        const out = [];
                        for (const [k, val] of Object.entries(v)) {
                          if (val == null || typeof val === 'object') continue;
                          if (k === 'type' || k === 'sku' || k === 'price') continue;
                          out.push(`${cap(k)}: ${val}`);
                        }
                        return out;
                      }
                      return [];
                    })();
                    const colorSwatch = (() => {
                      if (!v) return null;
                      if (v.type === 'color' && v.value) return v.value;
                      if (Array.isArray(v?.selections)) { const c = v.selections.find(s => s.type === 'color'); return c?.value || null; }
                      return null;
                    })();
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        {it.product_image ? <img src={it.product_image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt=""/> : <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0"><Package size={20} className="text-gray-400"/></div>}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{it.product_name || it.name}</p>
                          {variantBits.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {colorSwatch && <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{backgroundColor: colorSwatch}}/>}
                              {variantBits.map((b, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded font-medium text-gray-700">{b}</span>)}
                            </div>
                          )}
                          {it.sku && <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {it.sku}</p>}
                          <p className="text-xs text-gray-400 mt-1">{it.quantity} × {parseFloat(it.unit_price||it.price||0).toLocaleString()} {selectedOrder.currency || 'DZD'}</p>
                        </div>
                        <p className="font-bold text-sm shrink-0">{parseFloat(it.total_price||((it.unit_price||it.price||0)*(it.quantity||1))).toLocaleString()} {selectedOrder.currency || 'DZD'}</p>
                      </div>
                    );
                  })}
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
                  {(isPreparingPage ? ['preparing','ready','cancelled'] : allStatuses).filter(s => s !== selectedOrder.status && s !== 'archived').map(s => {

                    const sc2 = statusConfig[s];
                    return (
                      <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                        className={`py-2.5 rounded-xl font-bold text-xs ${sc2.color} text-white hover:opacity-90 flex items-center justify-center gap-1.5`}>
                        {sc2.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </>
            ); })()}
          </div>
        </div>
      )}
      {lastDispatchDebug&&<div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4" onClick={()=>setLastDispatchDebug(null)}><div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full sm:max-w-xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">{lastDispatchDebug.ok?'✅ Dispatch Result':'❌ Dispatch Failed'}</h3>
          <button onClick={()=>setLastDispatchDebug(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        {lastDispatchDebug.message&&<p className="text-sm font-medium text-gray-700 mb-2">{lastDispatchDebug.message}</p>}
        {lastDispatchDebug.error&&<p className="text-sm font-bold text-red-600 mb-2">{lastDispatchDebug.error}</p>}
        {lastDispatchDebug.tracking_number&&<p className="text-sm mb-2">Tracking: <span className="font-mono font-bold text-emerald-700">{lastDispatchDebug.tracking_number}</span></p>}
        {lastDispatchDebug.carrier_response&&<details open><summary className="text-[10px] text-gray-500 cursor-pointer mb-1">Carrier response</summary><pre className="p-2 bg-gray-50 rounded-lg text-[10px] font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">{typeof lastDispatchDebug.carrier_response==='string'?lastDispatchDebug.carrier_response:JSON.stringify(lastDispatchDebug.carrier_response,null,2)}</pre></details>}
        {lastDispatchDebug.debug&&<>
          {lastDispatchDebug.debug.request_url&&<p className="text-[10px] text-gray-500 mt-2 break-all">URL: <span className="font-mono">{lastDispatchDebug.debug.request_url}</span></p>}
          {lastDispatchDebug.debug.request_body&&<details className="mt-1"><summary className="text-[10px] text-gray-500 cursor-pointer">Request body sent</summary><pre className="p-2 bg-gray-50 rounded-lg text-[10px] font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">{(() => { try { return JSON.stringify(JSON.parse(lastDispatchDebug.debug.request_body), null, 2); } catch { return lastDispatchDebug.debug.request_body; } })()}</pre></details>}
          {lastDispatchDebug.debug.tried&&lastDispatchDebug.debug.tried.length>0&&<details className="mt-1"><summary className="text-[10px] text-gray-500 cursor-pointer">URLs tried ({lastDispatchDebug.debug.tried.length})</summary><pre className="p-2 bg-gray-50 rounded-lg text-[10px] font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">{JSON.stringify(lastDispatchDebug.debug.tried,null,2)}</pre></details>}
        </>}
      </div></div>}
    </DashboardLayout>
  );
}

// ==========================================================================
// Quick Action Drawer — one modal that switches on column type.
// ==========================================================================
function QuickActionDrawer({ action, onClose, onOpenFullDetail, onUpdateStatus, onSaveField, onDispatch, companies, statusConfig, allStatuses, isPreparingPage }) {
  const { t } = useTranslation();
  const { type, order: o } = action;
  const [localPatch, setLocalPatch] = useState({});
  const cur = o.currency || 'DZD';

  const set = (k) => (e) => setLocalPatch(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => { if (Object.keys(localPatch).length) onSaveField(localPatch); onClose(); };

  const title = {
    photo: t('orders.qa.photo','Order Photo'),
    order: t('orders.qa.order','Order') + ' #' + o.order_number,
    products: t('orders.qa.products','Products') + ` (${(o.items||[]).length})`,
    address: t('orders.qa.address','Shipping Address'),
    customer: t('orders.qa.customer','Customer'),
    phone: t('orders.qa.phone','Phone'),
    transfer: t('orders.qa.transfer','Transfer / Delivery Company'),
    status: t('orders.qa.status','Order Status'),
    shipping_method: t('orders.qa.shippingMethod','Shipping Method'),
    totals: t('orders.qa.totals','Totals Breakdown'),
    processed_at: t('orders.qa.processedAt','Processed At'),
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
    const cap = (s) => typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s;
    return wrap(
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No items.</p>}
        {items.map((it,i) => {
          const img = it.product_image || it.image || (o.first_image && i === 0 ? o.first_image : null);
          let v = it.variant_info ?? it.variant;
          if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = { name: v }; } }
          const variantBits = (() => {
            if (it.variant_label) return [it.variant_label];
            if (it.variant_name) return String(it.variant_name).split(/\s*[·,/]\s*/).filter(Boolean);
            if (!v) return [];
            if (Array.isArray(v)) return v.map(x => typeof x === 'string' ? x : (x?.name || x?.value || '')).filter(Boolean);
            if (Array.isArray(v?.selections)) return v.selections.map(s => `${s.type ? cap(s.type) + ': ' : ''}${s.label || s.name || s.value || ''}`).filter(Boolean);
            if (v.name || v.value || v.label) return [`${v.type ? cap(v.type) + ': ' : ''}${v.label || v.name || v.value}`];
            if (typeof v === 'object') { const out = []; for (const [k, val] of Object.entries(v)) { if (val == null || typeof val === 'object' || k === 'type' || k === 'sku' || k === 'price') continue; out.push(`${cap(k)}: ${val}`); } return out; }
            return [];
          })();
          const colorSwatch = (() => {
            if (!v) return null;
            if (v.type === 'color' && v.value) return v.value;
            if (Array.isArray(v?.selections)) { const c = v.selections.find(s => s.type === 'color'); return c?.value || null; }
            return null;
          })();
          return (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            {img ? <img src={img} className="w-14 h-14 rounded-xl object-cover shrink-0" alt=""/> : <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0"><Package size={18} className="text-gray-400"/></div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{it.product_name || it.name}</p>
              {variantBits.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {colorSwatch && <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{backgroundColor: colorSwatch}}/>}
                  {variantBits.map((b, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded font-medium text-gray-700">{b}</span>)}
                </div>
              )}
              {it.sku && <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {it.sku}</p>}
              <p className="text-[11px] text-gray-400 mt-1">{it.quantity} × {fmtMoney(it.unit_price || it.price, cur)}</p>
            </div>
            <p className="font-bold text-sm whitespace-nowrap shrink-0">{fmtMoney(it.total_price || (it.quantity * (it.unit_price || it.price || 0)), cur)}</p>
          </div>
          );
        })}
      </div>
    );
  }

  if (type === 'status') {
    const statusList = isPreparingPage ? ['preparing','ready','cancelled'] : allStatuses;
    return wrap(
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {statusList.map(s => {
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
        {/* Archive toggle — moves the order in/out of the archive vault */}
        <button onClick={async () => {
          try {
            const{orderApi}=await import('../../utils/api');
            const storeId=o.store_id||o.shop_id||'';
            await orderApi.archive(storeId, o.id, !o.is_archived);
            toast.success(o.is_archived?'Restored from archive':'Archived');
            onClose();
          } catch { toast.error('Failed'); }
        }} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${o.is_archived?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
          {o.is_archived?'📤 Restore from archive':'📦 Archive order'}
        </button>
      </div>
    );
  }

  if (type === 'transfer') {
    const COMPANY_COLORS = { noest: '#3b82f6', dhd: '#f97316', yalidine: '#22c55e', 'yalid': '#22c55e', 'zr express': '#6366f1', procolis: '#8b5cf6', maystro: '#ec4899', ecotrack: '#14b8a6', yassir: '#eab308', aramex: '#dc2626', dhl: '#fbbf24', fedex: '#7c3aed', ups: '#92400e', boxy: '#64748b' };
    const companyColor = (name) => { const n = (name||'').toLowerCase(); for (const [k,v] of Object.entries(COMPANY_COLORS)) { if (n.includes(k)) return v; } return '#6366f1'; };
    const currentCompanyId = o.delivery_company_id || '';
    return wrap(
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase">{t('orders.deliveryCompany','Delivery Company')}</label>
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {companies.map(c => {
            const isSelected = String(c.id) === String(currentCompanyId);
            const color = companyColor(c.name);
            return (
              <button key={c.id} onClick={() => { onDispatch?.(c.id); onClose(); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${isSelected ? 'shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                style={isSelected ? {borderColor: color, backgroundColor: color + '10'} : {}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{backgroundColor: color}}>
                  {c.logo ? <img src={c.logo} className="w-full h-full rounded-xl object-cover" alt=""/> : (c.name||'?')[0].toUpperCase()}
                </div>
                <p className="font-bold text-xs text-gray-900 truncate w-full">{c.name}</p>
                {isSelected && <Check size={14} style={{color}}/>}
              </button>
            );
          })}
        </div>
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
    // Best-effort wilaya-number lookup from the wilaya name when the column
    // wasn't filled in (older orders had the name only).
    const wnFromName = (() => {
      try {
        const n = String(o.shipping_wilaya || '').trim().toLowerCase();
        if (!n) return '';
        // 58 wilayas — minimal map; expand as needed.
        const M = { 'adrar':'01','chlef':'02','laghouat':'03','oum el bouaghi':'04','batna':'05','béjaïa':'06','bejaia':'06','biskra':'07','béchar':'08','bechar':'08','blida':'09','bouira':'10','tamanrasset':'11','tébessa':'12','tebessa':'12','tlemcen':'13','tiaret':'14','tizi ouzou':'15','alger':'16','algiers':'16','djelfa':'17','jijel':'18','sétif':'19','setif':'19','saïda':'20','saida':'20','skikda':'21','sidi bel abbès':'22','sidi bel abbes':'22','annaba':'23','guelma':'24','constantine':'25','médéa':'26','medea':'26','mostaganem':'27','msila':'28','m’sila':'28','mascara':'29','ouargla':'30','oran':'31','el bayadh':'32','illizi':'33','bordj bou arréridj':'34','boumerdès':'35','boumerdes':'35','el tarf':'36','tindouf':'37','tissemsilt':'38','el oued':'39','khenchela':'40','souk ahras':'41','tipaza':'42','mila':'43','aïn defla':'44','ain defla':'44','naâma':'45','naama':'45','aïn témouchent':'46','ain temouchent':'46','ghardaïa':'47','ghardaia':'47','relizane':'48','timimoun':'49','bordj badji mokhtar':'50','ouled djellal':'51','béni abbès':'52','beni abbes':'52','in salah':'53','in guezzam':'54','touggourt':'55','djanet':'56','el m\'ghair':'57','el meghaier':'57','el menia':'58' };
        return M[n] || '';
      } catch { return ''; }
    })();
    return wrap(
      <div className="space-y-3">
        {!o.shipping_city && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">Commune is required for carrier dispatch. Please fill in the City (Commune) field.</div>}
        <label className="text-[10px] font-bold text-gray-400 uppercase">Street</label>
        <input defaultValue={o.shipping_address || ''} onChange={set('shipping_address')} className="input-field w-full"/>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">City (Commune) *</label><input defaultValue={o.shipping_city || ''} onChange={set('shipping_city')} className={`input-field w-full ${!o.shipping_city ? 'border-amber-400 ring-1 ring-amber-300' : ''}`} placeholder="Required for dispatch"/></div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase">Wilaya</label>
            <input defaultValue={o.shipping_wilaya || ''} onChange={set('shipping_wilaya')} className="input-field w-full"/>
            {(o.shipping_wilaya_code || wnFromName) && (
              <p className="text-[10px] text-gray-400 mt-1">N°: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{o.shipping_wilaya_code || wnFromName}</span></p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Zip</label><input defaultValue={o.shipping_zip || ''} onChange={set('shipping_zip')} className="input-field w-full font-mono"/></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">N° Wilaya</label><input defaultValue={o.shipping_wilaya_code || wnFromName || ''} onChange={set('shipping_wilaya_code')} className="input-field w-full font-mono" placeholder="01-58"/></div>
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

  if (type === 'payment_method') {
    const method = (o.payment_method || 'cod').toUpperCase().replace(/_/g, ' ');
    return wrap(
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-gray-50 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Payment Method</p>
          <p className="text-xl font-black text-gray-900">{method}</p>
        </div>
        {o.receipt_image && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Payment Receipt</p>
            <img src={o.receipt_image} alt="Receipt" className="w-full rounded-2xl border border-gray-200 max-h-96 object-contain bg-white"/>
          </div>
        )}
        {o.payment_reference && row('Reference', o.payment_reference)}
        {row('Status', (o.payment_status || 'pending').toUpperCase())}
        {row('Total', fmtMoney(o.total, cur))}
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

// ─────────────────────────────────────────────────────────────────────────────
// CreateOrderModal — inline manual order creation (admin-side).
// Lets the admin add a customer + pick products + set status without leaving
// the orders page. POSTs to /manage/stores/:sid/orders.
// ─────────────────────────────────────────────────────────────────────────────
function CreateOrderModal({ storeId, onClose, onCreated }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [searchP, setSearchP] = useState('');
  const [items, setItems] = useState([]); // {product_id, name, price, quantity}
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    shipping_address: '', shipping_city: '', shipping_wilaya: '',
    shipping_type: 'home', shipping_cost: 0, payment_method: 'cod',
    notes: '', status: 'new_order',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    import('../../utils/api').then(m => {
      m.productApi.getAll(storeId, { search: searchP }).then(r => setProducts(r.data?.products || [])).catch(() => {});
    });
  }, [storeId, searchP]);

  const addItem = (p) => {
    setItems(prev => {
      const existing = prev.find(x => x.product_id === p.id);
      if (existing) return prev.map(x => x.product_id === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { product_id: p.id, name: p.name_en || p.name, price: parseFloat(p.price) || 0, quantity: 1 }];
    });
  };
  const removeItem = (pid) => setItems(prev => prev.filter(x => x.product_id !== pid));
  const setQty = (pid, q) => setItems(prev => prev.map(x => x.product_id === pid ? { ...x, quantity: Math.max(1, q) } : x));

  const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0);
  const total = subtotal + (parseFloat(form.shipping_cost) || 0);

  const save = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) { toast.error(t('orders.fillCustomer', 'Customer name and phone are required')); return; }
    if (items.length === 0) { toast.error(t('orders.addAtLeastOneItem', 'Add at least one product')); return; }
    setSaving(true);
    try {
      await api.post(`/manage/stores/${storeId}/orders`, {
        ...form,
        items: items.map(x => ({ product_id: x.product_id, name: x.name, price: x.price, quantity: x.quantity })),
        subtotal, total,
      });
      onCreated && onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || t('orders.createFailed', 'Failed to create order'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-y-auto p-5 sm:p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">{t('orders.createOrder', 'Create Order')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-300"><X size={16} /></button>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input className="input-field" placeholder={t('orders.customerName', 'Customer name *')} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          <input className="input-field" placeholder={t('orders.customerPhone', 'Phone *')} value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} />
          <input className="input-field" placeholder={t('orders.customerEmail', 'Email (optional)')} value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
          <input className="input-field" placeholder={t('orders.wilaya', 'Wilaya')} value={form.shipping_wilaya} onChange={e => setForm({ ...form, shipping_wilaya: e.target.value })} />
          <input className="input-field" placeholder={t('orders.commune', 'Commune')} value={form.shipping_city} onChange={e => setForm({ ...form, shipping_city: e.target.value })} />
          <input className="input-field" placeholder={t('orders.address', 'Address')} value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} />
        </div>

        {/* Product picker */}
        <div className="mb-3">
          <input className="input-field" placeholder={t('orders.searchProducts', 'Search products to add…')} value={searchP} onChange={e => setSearchP(e.target.value)} />
          {searchP && (
            <div className="mt-1.5 max-h-40 overflow-y-auto border rounded-xl divide-y border-gray-100 dark:border-gray-700">
              {products.slice(0, 10).map(p => (
                <button key={p.id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                  <span className="text-sm text-gray-800 dark:text-gray-100 truncate">{p.name_en || p.name}</span>
                  <span className="text-xs text-brand-500 font-bold">{parseFloat(p.price || 0).toLocaleString()} DZD</span>
                </button>
              ))}
              {products.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">{t('orders.noProducts', 'No products')}</p>}
            </div>
          )}
        </div>

        {/* Cart items */}
        {items.length > 0 && (
          <div className="border rounded-xl divide-y mb-4 border-gray-100 dark:border-gray-700">
            {items.map(it => (
              <div key={it.product_id} className="flex items-center gap-3 px-3 py-2">
                <p className="flex-1 text-sm text-gray-800 dark:text-gray-100 truncate">{it.name}</p>
                <input type="number" min={1} className="w-16 text-sm text-center border rounded-lg py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={it.quantity} onChange={e => setQty(it.product_id, parseInt(e.target.value) || 1)} />
                <span className="text-xs text-brand-500 font-bold w-24 text-right">{(it.price * it.quantity).toLocaleString()} DZD</span>
                <button onClick={() => removeItem(it.product_id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Shipping + status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <select className="input-field" value={form.shipping_type} onChange={e => setForm({ ...form, shipping_type: e.target.value })}>
            <option value="home">{t('orders.homeDelivery', 'Home delivery')}</option>
            <option value="desk">{t('orders.deskDelivery', 'Desk pickup')}</option>
          </select>
          <input type="number" className="input-field" placeholder={t('orders.shippingCost', 'Shipping cost')} value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: e.target.value })} />
          <select className="input-field" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            <option value="cod">COD</option>
            <option value="ccp">CCP</option>
            <option value="baridimob">BaridiPay</option>
          </select>
        </div>
        <textarea className="input-field mb-3" rows={2} placeholder={t('orders.notes', 'Notes (optional)')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500 dark:text-gray-400">{t('orders.total', 'Total')}</span>
          <span className="text-xl font-black text-brand-500">{total.toLocaleString()} DZD</span>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">{t('orders.cancel', 'Cancel')}</button>
          <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{t('orders.create', 'Create Order')}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Columns picker — portal-rendered so it works inside parents that create
// containing blocks (header backdrop-blur, transformed wrappers, etc.).
// ─────────────────────────────────────────────────────────────────────────────
function ColumnsPicker({ open, setOpen, activeColumns, ALL_COLUMNS, toggleColumn, moveColumn }) {
  const btnRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect(); if (!r) return;
      setAnchor({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);
  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-[11px] font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
        <Columns size={13} />Columns<span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-white">{activeColumns.length}</span>
      </button>
      {open && anchor && createPortal(
        <>
          <div className="fixed inset-0 z-[100] bg-black/40 sm:bg-transparent" onClick={() => setOpen(false)} />
          {/* On mobile: bottom-sheet layout (full width, fixed at bottom, ~85vh)
              so the user can comfortably scroll through every available column.
              On sm+: anchored dropdown next to the Columns button. */}
          <div
            className="fixed bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 z-[101] flex flex-col
              inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto
              rounded-t-3xl sm:rounded-2xl
              max-h-[80dvh] sm:max-h-[70vh]"
            style={
              window.innerWidth >= 640
                ? { top: anchor.top, right: anchor.right, width: Math.min(288, window.innerWidth - 16) }
                : undefined
            }
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              {/* Drag-handle on mobile to indicate it's a bottom sheet */}
              <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden"/>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-1 sm:mt-0">Customize Columns</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={16} /></button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Active ({activeColumns.length})</p>
              {activeColumns.map((key, idx) => {
                const col = ALL_COLUMNS.find(c => c.key === key); if (!col) return null;
                return (
                  <div key={key} className="flex items-center gap-2 px-2 py-2 mb-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <GripVertical size={12} className="text-gray-300 dark:text-gray-500" />
                    <button onClick={() => moveColumn(key, -1)} disabled={idx === 0} className="w-7 h-7 rounded bg-white dark:bg-gray-900 disabled:opacity-30 flex items-center justify-center border border-gray-200 dark:border-gray-700 dark:text-gray-300"><ChevronUp size={12} /></button>
                    <button onClick={() => moveColumn(key, 1)} disabled={idx === activeColumns.length - 1} className="w-7 h-7 rounded bg-white dark:bg-gray-900 disabled:opacity-30 flex items-center justify-center border border-gray-200 dark:border-gray-700 dark:text-gray-300"><ChevronDown size={12} /></button>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 truncate">{col.label}</span>
                    <button onClick={() => toggleColumn(key)} title="Hide" className="w-7 h-7 flex items-center justify-center rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"><Eye size={13} /></button>
                  </div>
                );
              })}
              <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
              <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Available</p>
              {ALL_COLUMNS.filter(c => !activeColumns.includes(c.key)).map(col => (
                <button key={col.key} onClick={() => toggleColumn(col.key)} className="w-full flex items-center gap-2 px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-left">
                  <Square size={14} className="text-gray-300 dark:text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{col.label}</span>
                  <Plus size={13} className="text-brand-500"/>
                </button>
              ))}
              {ALL_COLUMNS.filter(c => !activeColumns.includes(c.key)).length === 0 && (
                <p className="px-2 py-3 text-[11px] text-gray-400 text-center">All columns are visible.</p>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
