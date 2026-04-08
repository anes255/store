import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { ALL_PERMISSIONS, PERM_GROUPS } from '../../utils/permissions';

// Super-admin editor for staff role templates. Store owners can pick any
// template as the starting point for a new custom role on their store and
// then tweak its permissions locally without affecting the template.
const EMPTY = {
  name: { en: '', fr: '', ar: '' },
  description: { en: '', fr: '', ar: '' },
  permissions: [],
  is_active: true,
  sort_order: 0,
};

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

function TemplateCard({ tpl, onChange, onSave, onDelete, saving }) {
  const set = (path, val) => {
    const p = JSON.parse(JSON.stringify(tpl));
    const parts = path.split('.');
    let cur = p;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
    onChange(p);
  };
  const togglePerm = (key) => {
    const p = JSON.parse(JSON.stringify(tpl));
    p.permissions = p.permissions.includes(key)
      ? p.permissions.filter(k => k !== key)
      : [...p.permissions, key];
    onChange(p);
  };
  const toggleGroup = (group) => {
    const groupKeys = ALL_PERMISSIONS.filter(x => x.group === group).map(x => x.key);
    const allOn = groupKeys.every(k => tpl.permissions.includes(k));
    const p = JSON.parse(JSON.stringify(tpl));
    p.permissions = allOn
      ? p.permissions.filter(k => !groupKeys.includes(k))
      : [...new Set([...p.permissions, ...groupKeys])];
    onChange(p);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Shield size={16} className="text-purple-600" /></div>
          <input className="text-lg font-bold outline-none border-b border-transparent focus:border-brand-400" value={tpl.name.en} onChange={e => set('name.en', e.target.value)} placeholder="Template name (EN)" />
        </div>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={tpl.is_active} onChange={e => set('is_active', e.target.checked)} />Active</label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LANGS.map(l => (
          <div key={l.code}>
            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">NAME ({l.label})</label>
            <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={tpl.name[l.code] || ''} onChange={e => set(`name.${l.code}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LANGS.map(l => (
          <div key={l.code}>
            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">DESCRIPTION ({l.label})</label>
            <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={tpl.description[l.code] || ''} onChange={e => set(`description.${l.code}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500">PERMISSIONS</p>
          <span className="text-[10px] text-gray-400">{tpl.permissions.length}/{ALL_PERMISSIONS.length}</span>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-3">
          {PERM_GROUPS.map(group => {
            const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
            const allOn = groupPerms.every(p => tpl.permissions.includes(p.key));
            return (
              <div key={group}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{group}</p>
                  <button onClick={() => toggleGroup(group)} className="text-[10px] text-brand-500 font-bold hover:underline">{allOn ? 'Uncheck all' : 'Check all'}</button>
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {groupPerms.map(p => (
                    <label key={p.key} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={tpl.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} className="w-3.5 h-3.5" />
                      <span className="text-[11px] text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={onSave} disabled={saving} className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-sm font-bold hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}Save
        </button>
        <button onClick={onDelete} className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function RoleTemplatesEditor() {
  const [tpls, setTpls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      const { data } = await platformApi.getRoleTemplates();
      setTpls(data.templates || []);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to load templates'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNew = () => setTpls([...tpls, JSON.parse(JSON.stringify({ ...EMPTY, _new: true, _tmpId: Date.now() }))]);
  const updateAt = (i, next) => setTpls(tpls.map((t, idx) => idx === i ? next : t));
  const save = async (i) => {
    const t = tpls[i];
    setSavingId(i);
    try {
      if (t._new) {
        const { data } = await platformApi.createRoleTemplate(t);
        setTpls(tpls.map((tt, idx) => idx === i ? data : tt));
        toast.success('Template created');
      } else {
        const { data } = await platformApi.updateRoleTemplate(t.id, t);
        setTpls(tpls.map((tt, idx) => idx === i ? data : tt));
        toast.success('Template updated');
      }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    setSavingId(null);
  };
  const remove = async (i) => {
    const t = tpls[i];
    if (!confirm('Delete this template?')) return;
    if (t._new) { setTpls(tpls.filter((_, idx) => idx !== i)); return; }
    try {
      await platformApi.deleteRoleTemplate(t.id);
      setTpls(tpls.filter((_, idx) => idx !== i));
      toast.success('Deleted');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Role Templates</h1>
          <p className="text-sm text-gray-500">Define base staff roles available to every store owner. Store owners can clone a template and tweak its permissions for their own store without affecting other stores.</p>
        </div>
        <button onClick={addNew} className="px-4 py-2 bg-brand-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-600"><Plus size={16} />New Template</button>
      </div>

      {tpls.length === 0 && <div className="p-10 text-center bg-white rounded-2xl border border-gray-100"><p className="text-gray-500">No templates yet. Click <b>New Template</b> to create one.</p></div>}

      <div className="grid lg:grid-cols-2 gap-5">
        {tpls.map((t, i) => (
          <TemplateCard key={t.id || `new-${i}`} tpl={t} onChange={(next) => updateAt(i, next)} onSave={() => save(i)} onDelete={() => remove(i)} saving={savingId === i} />
        ))}
      </div>
    </div>
  );
}
