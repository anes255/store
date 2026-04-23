import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../hooks/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Check, X, Palette, GripVertical, Loader2 } from 'lucide-react';

// Built-in statuses — always present. The admin can customize labels/colors
// and add extra custom statuses on top.
const BUILT_IN = [
  { key: 'new_order',    default_label: 'New',           color: '#6366f1', is_builtin: true },
  { key: 'pending',      default_label: 'Pending',       color: '#f59e0b', is_builtin: true },
  { key: 'confirmed',    default_label: 'Confirmed',     color: '#3b82f6', is_builtin: true },
  { key: 'preparing',    default_label: 'Preparing',     color: '#a855f7', is_builtin: true },
  { key: 'ready',        default_label: 'Ready',         color: '#14b8a6', is_builtin: true },
  { key: 'shipped',      default_label: 'Shipped',       color: '#f97316', is_builtin: true },
  { key: 'delivered',    default_label: 'Delivered',     color: '#10b981', is_builtin: true },
  { key: 'cancelled',    default_label: 'Cancelled',     color: '#ef4444', is_builtin: true },
  { key: 'returned',     default_label: 'Returned',      color: '#6b7280', is_builtin: true },
];

export default function StatusManagement() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/manage/stores/${currentStore.id}/status-templates`);
      const existing = Array.isArray(data) ? data : (data?.rows || []);
      // Merge built-ins with any saved customizations.
      const byKey = new Map(existing.map(r => [r.key, r]));
      const merged = BUILT_IN.map(b => ({
        ...b,
        label: byKey.get(b.key)?.label || b.default_label,
        color: byKey.get(b.key)?.color || b.color,
        enabled: byKey.get(b.key)?.enabled !== false,
        notify_customer: byKey.get(b.key)?.notify_customer !== false,
      }));
      const customs = existing.filter(r => !BUILT_IN.find(b => b.key === r.key));
      setRows([...merged, ...customs.map(c => ({ ...c, is_builtin: false, enabled: c.enabled !== false }))]);
    } catch {
      setRows(BUILT_IN.map(b => ({ ...b, label: b.default_label, enabled: true, notify_customer: true })));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [currentStore?.id]);

  const update = (i, patch) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const remove = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));
  const addCustom = () => {
    const slug = 'custom_' + Date.now();
    setRows(prev => [...prev, { key: slug, label: t('statusMgmt.newStatus', 'New Status'), color: '#64748b', enabled: true, notify_customer: false, is_builtin: false }]);
  };

  const save = async () => {
    if (!currentStore?.id) return;
    setSaving(true);
    try {
      await api.put(`/manage/stores/${currentStore.id}/status-templates`, { statuses: rows });
      toast.success(t('statusMgmt.saved', 'Status templates saved'));
    } catch (e) { toast.error(e?.response?.data?.error || t('statusMgmt.saveFailed', 'Failed to save')); }
    setSaving(false);
  };

  if (loading) return <DashboardLayout><div className="py-20 text-center"><Loader2 size={28} className="animate-spin mx-auto text-brand-500"/></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <span className="badge bg-brand-100 text-brand-600 text-[10px] mb-2">{t('statusMgmt.badge', 'ORDER FLOW')}</span>
          <h1 className="text-2xl font-bold">{t('statusMgmt.title', 'Status Management')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('statusMgmt.subtitle', 'Customize order status labels, colors, and customer notifications. Built-in statuses can be renamed but not deleted.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addCustom} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center gap-1.5"><Plus size={14}/>{t('statusMgmt.addCustom', 'Add Custom Status')}</button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}{t('common.save', 'Save')}</button>
        </div>
      </div>

      <div className="glass-card-solid overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">{t('statusMgmt.key', 'Key')}</th>
                <th className="px-4 py-3">{t('statusMgmt.label', 'Label')}</th>
                <th className="px-4 py-3">{t('statusMgmt.color', 'Color')}</th>
                <th className="px-4 py-3 text-center">{t('statusMgmt.enabled', 'Enabled')}</th>
                <th className="px-4 py-3 text-center">{t('statusMgmt.notify', 'Notify Customer')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">{r.key}</span>
                    {r.is_builtin && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">{t('statusMgmt.builtin', 'BUILT-IN')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <input className="input-field !py-1.5 !text-sm" value={r.label || ''} onChange={e => update(i, { label: e.target.value })}/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-8 h-8 rounded border border-gray-200" value={r.color || '#6366f1'} onChange={e => update(i, { color: e.target.value })}/>
                      <span className="font-mono text-[10px] text-gray-400">{r.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => update(i, { enabled: !r.enabled })} className={`w-10 h-5 rounded-full relative transition-colors ${r.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => update(i, { notify_customer: !r.notify_customer })} className={`w-10 h-5 rounded-full relative transition-colors ${r.notify_customer ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.notify_customer ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.is_builtin
                      ? <span className="text-[10px] text-gray-300">—</span>
                      : <button onClick={() => remove(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
        <p className="font-bold mb-1 flex items-center gap-1.5"><Palette size={14}/>{t('statusMgmt.howTitle', 'How it works')}</p>
        <p className="text-xs">{t('statusMgmt.howDesc', 'These settings apply to: the storefront profile order history, the public Track Order button, and the tracking details shown on the customer tracking page. Toggling "Notify Customer" off will skip WhatsApp/email messages for that status.')}</p>
      </div>
    </DashboardLayout>
  );
}
