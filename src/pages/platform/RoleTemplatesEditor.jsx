import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X, Loader2, Shield, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { ALL_PERMISSIONS, PERM_GROUPS } from '../../utils/permissions';

// Super-admin editor for staff role templates.
// Shows all existing roles with their authorities and allows:
//  - Editing any role (name/description in EN/FR/AR + permissions)
//  - Creating a new role via a modal
// Templates saved here appear to all store owners, who can clone one and
// tweak its permissions locally for their own store without affecting others.

const EMPTY_ROLE = () => ({
  name: { en: '', fr: '', ar: '' },
  description: { en: '', fr: '', ar: '' },
  permissions: [],
  is_active: true,
  sort_order: 0,
});

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

function RoleForm({ value, onChange }) {
  const set = (path, val) => {
    const next = JSON.parse(JSON.stringify(value));
    const parts = path.split('.');
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
    onChange(next);
  };
  const togglePerm = (key) => {
    const next = JSON.parse(JSON.stringify(value));
    next.permissions = next.permissions.includes(key)
      ? next.permissions.filter(k => k !== key)
      : [...next.permissions, key];
    onChange(next);
  };
  const toggleGroup = (group) => {
    const groupKeys = ALL_PERMISSIONS.filter(x => x.group === group).map(x => x.key);
    const allOn = groupKeys.every(k => value.permissions.includes(k));
    const next = JSON.parse(JSON.stringify(value));
    next.permissions = allOn
      ? next.permissions.filter(k => !groupKeys.includes(k))
      : [...new Set([...next.permissions, ...groupKeys])];
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {/* Name in 3 langs */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Role Name</p>
        <div className="grid md:grid-cols-3 gap-2">
          {LANGS.map(l => (
            <div key={l.code}>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">{l.label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={value.name[l.code] || ''}
                onChange={e => set(`name.${l.code}`, e.target.value)}
                placeholder={l.code === 'en' ? 'e.g. Store Manager' : ''}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Description in 3 langs */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Description</p>
        <div className="grid md:grid-cols-3 gap-2">
          {LANGS.map(l => (
            <div key={l.code}>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">{l.label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                value={value.description[l.code] || ''}
                onChange={e => set(`description.${l.code}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase">Authorities / Permissions</p>
          <span className="text-[11px] text-gray-400">{value.permissions.length} / {ALL_PERMISSIONS.length} selected</span>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 max-h-[380px] overflow-y-auto space-y-4">
          {PERM_GROUPS.map(group => {
            const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
            const allOn = groupPerms.every(p => value.permissions.includes(p.key));
            const anyOn = groupPerms.some(p => value.permissions.includes(p.key));
            return (
              <div key={group}>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGroup(group)}
                      className={`w-4 h-4 rounded flex items-center justify-center border-2 ${allOn ? 'bg-brand-500 border-brand-500 text-white' : anyOn ? 'bg-brand-100 border-brand-400' : 'border-gray-300'}`}
                    >
                      {allOn && <Check size={12} />}
                      {anyOn && !allOn && <div className="w-1.5 h-1.5 bg-brand-500 rounded-sm" />}
                    </button>
                    <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">{group}</p>
                  </div>
                  <button onClick={() => toggleGroup(group)} className="text-[10px] text-brand-500 font-bold hover:underline">
                    {allOn ? 'Uncheck all' : 'Check all'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 pl-6">
                  {groupPerms.map(p => (
                    <label key={p.key} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value.permissions.includes(p.key)}
                        onChange={() => togglePerm(p.key)}
                        className="w-4 h-4 accent-brand-500"
                      />
                      <span className="text-xs text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.is_active}
          onChange={e => set('is_active', e.target.checked)}
          className="w-4 h-4 accent-brand-500"
        />
        <span className="text-gray-700">Role is active (visible to store owners)</span>
      </label>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield size={20} className="text-purple-500" />{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function RoleTemplatesEditor() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // role object being edited (or null)
  const [creating, setCreating] = useState(null); // new-role draft (or null)

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await platformApi.getRoleTemplates();
      setRoles(data.templates || []);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load roles');
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => setCreating(EMPTY_ROLE());
  const openEdit = (r) => setEditing(JSON.parse(JSON.stringify(r)));

  const saveCreate = async () => {
    if (!creating.name.en.trim()) return toast.error('English name is required');
    setSaving(true);
    try {
      await platformApi.createRoleTemplate(creating);
      toast.success('Role created');
      setCreating(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create role');
    }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editing.name.en.trim()) return toast.error('English name is required');
    setSaving(true);
    try {
      await platformApi.updateRoleTemplate(editing.id, editing);
      toast.success('Role updated');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update role');
    }
    setSaving(false);
  };

  const remove = async (r) => {
    if (!confirm(`Delete role "${r.name?.en || ''}"?`)) return;
    try {
      await platformApi.deleteRoleTemplate(r.id);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Shield className="text-purple-500" size={24} />Staff Role Templates</h1>
          <p className="text-sm text-gray-500 max-w-2xl mt-1">
            Define base staff roles available to every store owner. Store owners will see these roles and can clone any of them as the starting point for a custom role on their store, adjusting permissions without affecting other stores.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />Create New Role
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-500" size={24} />
        </div>
      ) : roles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <Shield size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No roles yet</p>
          <p className="text-xs text-gray-400 mt-1">Click <b>Create New Role</b> to add your first template.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {roles.map(r => {
            const perms = r.permissions || [];
            const grouped = PERM_GROUPS.map(g => ({
              group: g,
              count: ALL_PERMISSIONS.filter(p => p.group === g && perms.includes(p.key)).length,
              total: ALL_PERMISSIONS.filter(p => p.group === g).length,
            })).filter(g => g.count > 0);
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <Shield size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{r.name?.en || 'Untitled'}</h3>
                      {r.description?.en && <p className="text-xs text-gray-500 mt-0.5">{r.description.en}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span className="text-[10px] text-gray-400">{perms.length} permissions</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700" title="Edit"><Edit3 size={14} /></button>
                    <button onClick={() => remove(r)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                {grouped.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
                    {grouped.map(g => (
                      <span key={g.group} className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                        {g.group} <span className="text-gray-400">{g.count}/{g.total}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <Modal title="Create New Role" onClose={() => setCreating(null)}>
          <RoleForm value={creating} onChange={setCreating} />
          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setCreating(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveCreate} disabled={saving} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create Role
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit: ${editing.name?.en || 'Role'}`} onClose={() => setEditing(null)}>
          <RoleForm value={editing} onChange={setEditing} />
          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setEditing(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
