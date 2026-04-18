import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, X, Loader2, Shield, Edit3, Check, Search, Users, Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { ALL_PERMISSIONS, PERM_GROUPS } from '../../utils/permissions';
import { usePlatformTheme } from '../../hooks/useStore';

const EMPTY_ROLE = () => ({
  name: { en: '', fr: '', ar: '' },
  description: { en: '', fr: '', ar: '' },
  permissions: [],
  is_active: true,
  sort_order: 0,
});

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

function ui(isDark) {
  return {
    card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    cardSoft: isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200',
    input: isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-brand-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-400',
    title: isDark ? 'text-gray-100' : 'text-gray-900',
    text: isDark ? 'text-gray-200' : 'text-gray-800',
    muted: isDark ? 'text-gray-400' : 'text-gray-500',
    subtle: isDark ? 'text-gray-500' : 'text-gray-400',
    divider: isDark ? 'border-gray-800' : 'border-gray-100',
    tabActive: isDark ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40' : 'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
    tabIdle: isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
    permOn: isDark ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'bg-brand-50 border-brand-300 text-brand-700',
    permOff: isDark ? 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
    btnGhost: isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
    btnDanger: isDark ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100',
    btnEdit: isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    modalBg: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    modalHeader: isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-100',
    chip: isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200',
    chipActive: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    chipInactive: isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200',
    groupHead: isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200',
    checkbox: isDark ? 'accent-brand-500' : 'accent-brand-500',
    heroGrad: isDark
      ? 'from-purple-600/20 via-indigo-600/20 to-blue-600/20 border-gray-800'
      : 'from-purple-100 via-indigo-50 to-blue-50 border-gray-200',
    statBox: isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200',
  };
}

function RoleForm({ value, onChange, isDark }) {
  const u = ui(isDark);
  const [activeLang, setActiveLang] = useState('en');
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(PERM_GROUPS.map(g => [g, true])));

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
  const selectAll = () => onChange({ ...value, permissions: ALL_PERMISSIONS.map(p => p.key) });
  const clearAll = () => onChange({ ...value, permissions: [] });

  return (
    <div className="space-y-5">
      {/* Language tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-xl ${u.cardSoft} border`}>
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => setActiveLang(l.code)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeLang === l.code ? u.tabActive : u.tabIdle}`}
          >
            <span>{l.flag}</span>{l.label}
          </button>
        ))}
      </div>

      {/* Name + description per lang */}
      <div className={`rounded-2xl border p-4 space-y-3 ${u.cardSoft}`}>
        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-wide mb-1.5 ${u.muted}`}>Role Name ({activeLang.toUpperCase()})</label>
          <input
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${u.input}`}
            value={value.name[activeLang] || ''}
            onChange={e => set(`name.${activeLang}`, e.target.value)}
            placeholder={activeLang === 'en' ? 'e.g. Store Manager' : activeLang === 'fr' ? 'ex. Gérant de magasin' : 'مثال: مدير المتجر'}
          />
        </div>
        <div>
          <label className={`block text-[11px] font-extrabold uppercase tracking-wide mb-1.5 ${u.muted}`}>Description ({activeLang.toUpperCase()})</label>
          <textarea
            dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            rows={2}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none ${u.input}`}
            value={value.description[activeLang] || ''}
            onChange={e => set(`description.${activeLang}`, e.target.value)}
            placeholder={activeLang === 'en' ? 'Short summary of what this role can do' : ''}
          />
        </div>
      </div>

      {/* Permissions */}
      <div className={`rounded-2xl border ${u.card}`}>
        <div className={`flex items-center justify-between gap-3 p-4 border-b ${u.divider}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Lock size={14} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-extrabold ${u.title}`}>Permissions</p>
              <p className={`text-[11px] ${u.muted}`}>{value.permissions.length} / {ALL_PERMISSIONS.length} granted</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={selectAll} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${u.btnGhost}`}>All</button>
            <button onClick={clearAll} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${u.btnGhost}`}>Clear</button>
          </div>
        </div>
        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
          {PERM_GROUPS.map(group => {
            const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
            const checkedCount = groupPerms.filter(p => value.permissions.includes(p.key)).length;
            const allOn = checkedCount === groupPerms.length;
            const anyOn = checkedCount > 0;
            const isOpen = openGroups[group];
            return (
              <div key={group} className={`rounded-xl border ${u.groupHead}`}>
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    onClick={() => setOpenGroups({ ...openGroups, [group]: !isOpen })}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    {isOpen ? <ChevronUp size={14} className={u.muted} /> : <ChevronDown size={14} className={u.muted} />}
                    <p className={`text-xs font-extrabold uppercase tracking-wide ${u.title}`}>{group}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${anyOn ? u.chipActive : u.chip}`}>
                      {checkedCount}/{groupPerms.length}
                    </span>
                  </button>
                  <button onClick={() => toggleGroup(group)} className={`text-[10px] font-extrabold px-2 py-1 rounded-md ${allOn ? 'text-red-500 hover:underline' : 'text-brand-500 hover:underline'}`}>
                    {allOn ? 'Uncheck' : 'Check all'}
                  </button>
                </div>
                {isOpen && (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 pt-0 border-t ${u.divider}`}>
                    {groupPerms.map(p => {
                      const on = value.permissions.includes(p.key);
                      return (
                        <button
                          key={p.key}
                          onClick={() => togglePerm(p.key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs font-medium transition-all ${on ? u.permOn : u.permOff}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${on ? 'bg-brand-500 border-brand-500' : isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {on && <Check size={11} className="text-white" />}
                          </div>
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${u.cardSoft}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${u.title}`}>Active template</p>
            <p className={`text-[11px] ${u.muted}`}>When on, store owners can see and clone this role.</p>
          </div>
        </div>
        <button
          onClick={() => set('is_active', !value.is_active)}
          className={`relative w-12 h-7 rounded-full transition-all ${value.is_active ? 'bg-brand-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-all ${value.is_active ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Sort order */}
      <div className={`rounded-2xl border p-4 ${u.cardSoft}`}>
        <label className={`block text-[11px] font-extrabold uppercase tracking-wide mb-1.5 ${u.muted}`}>Sort order</label>
        <input
          type="number"
          className={`w-32 px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${u.input}`}
          value={value.sort_order || 0}
          onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
        />
        <p className={`text-[10px] mt-1 ${u.subtle}`}>Lower numbers appear first in the list.</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, isDark, children, footer }) {
  const u = ui(isDark);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`rounded-3xl shadow-2xl border w-full max-w-3xl max-h-[92vh] flex flex-col ${u.modalBg}`} onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 px-6 py-4 flex items-center justify-between border-b ${u.modalHeader} rounded-t-3xl`}>
          <h2 className={`text-lg font-extrabold flex items-center gap-2 ${u.title}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            {title}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full ${u.btnEdit}`}><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className={`px-6 py-4 border-t ${u.divider}`}>{footer}</div>}
      </div>
    </div>
  );
}

export default function RoleTemplatesEditor() {
  const { isDark } = usePlatformTheme();
  const u = ui(isDark);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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

  const toggleActive = async (r) => {
    try {
      await platformApi.updateRoleTemplate(r.id, { ...r, is_active: !r.is_active });
      toast.success(r.is_active ? 'Hidden from store owners' : 'Published');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const filtered = useMemo(() => {
    return roles.filter(r => {
      if (filter === 'active' && !r.is_active) return false;
      if (filter === 'inactive' && r.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.name?.en, r.name?.fr, r.name?.ar, r.description?.en].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [roles, filter, search]);

  const stats = useMemo(() => ({
    total: roles.length,
    active: roles.filter(r => r.is_active).length,
    inactive: roles.filter(r => !r.is_active).length,
    avgPerms: roles.length ? Math.round(roles.reduce((a, r) => a + (r.permissions?.length || 0), 0) / roles.length) : 0,
  }), [roles]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${u.heroGrad} p-6 md:p-8`}>
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Shield size={20} className="text-white" />
              </div>
              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${u.title}`}>Staff Role Templates</h1>
            </div>
            <p className={`text-sm leading-relaxed ${u.muted}`}>
              Define reusable role templates available to every store owner. Owners can assign them directly or clone one as a starting point and tweak permissions for their store.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl font-extrabold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
          >
            <Plus size={18} />Create Role
          </button>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total', value: stats.total, icon: Shield, c: 'from-purple-500 to-indigo-500' },
            { label: 'Active', value: stats.active, icon: Check, c: 'from-emerald-500 to-teal-500' },
            { label: 'Inactive', value: stats.inactive, icon: Lock, c: 'from-gray-500 to-gray-600' },
            { label: 'Avg Perms', value: stats.avgPerms, icon: Users, c: 'from-amber-500 to-orange-500' },
          ].map(s => {
            const Ic = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl border p-3 flex items-center gap-3 ${u.statBox}`}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                  <Ic size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-extrabold uppercase tracking-wide ${u.muted}`}>{s.label}</p>
                  <p className={`text-xl font-extrabold ${u.title}`}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className={`rounded-2xl border p-3 flex flex-wrap items-center gap-2 ${u.card}`}>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${u.muted}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search roles…"
            className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${u.input}`}
          />
        </div>
        <div className={`flex items-center gap-1 p-1 rounded-xl ${u.cardSoft} border`}>
          {[
            { k: 'all', l: 'All' },
            { k: 'active', l: 'Active' },
            { k: 'inactive', l: 'Inactive' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.k ? u.tabActive : u.tabIdle}`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`p-16 flex items-center justify-center rounded-2xl border ${u.card}`}>
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-16 text-center rounded-2xl border ${u.card}`}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Shield size={28} className="text-purple-500" />
          </div>
          <p className={`font-bold ${u.title}`}>{search || filter !== 'all' ? 'No roles match' : 'No roles yet'}</p>
          <p className={`text-xs mt-1 ${u.muted}`}>
            {search || filter !== 'all' ? 'Try adjusting search or filter.' : 'Click Create Role to add your first template.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => {
            const perms = r.permissions || [];
            const grouped = PERM_GROUPS.map(g => ({
              group: g,
              count: ALL_PERMISSIONS.filter(p => p.group === g && perms.includes(p.key)).length,
              total: ALL_PERMISSIONS.filter(p => p.group === g).length,
            })).filter(g => g.count > 0);
            const pct = Math.round((perms.length / ALL_PERMISSIONS.length) * 100);
            return (
              <div key={r.id} className={`group relative rounded-2xl border p-5 transition-all hover:shadow-xl ${isDark ? 'hover:shadow-purple-500/10' : 'hover:shadow-purple-500/5'} ${u.card} ${!r.is_active ? 'opacity-70' : ''}`}>
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                      <Shield size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-extrabold truncate ${u.title}`}>{r.name?.en || 'Untitled'}</h3>
                      {r.description?.en && <p className={`text-xs mt-0.5 line-clamp-2 ${u.muted}`}>{r.description.en}</p>}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${r.is_active ? u.chipActive : u.chipInactive}`}>
                          {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.chip}`}>
                          {perms.length} perms
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEdit(r)} className={`p-2 rounded-lg transition-all ${u.btnEdit}`} title="Edit"><Edit3 size={14} /></button>
                    <button onClick={() => toggleActive(r)} className={`p-2 rounded-lg transition-all ${u.btnEdit}`} title={r.is_active ? 'Deactivate' : 'Activate'}>
                      {r.is_active ? <Lock size={14} /> : <Check size={14} />}
                    </button>
                    <button onClick={() => remove(r)} className={`p-2 rounded-lg border transition-all ${u.btnDanger}`} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Coverage bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[10px] font-extrabold uppercase tracking-wide ${u.muted}`}>Coverage</p>
                    <p className={`text-[10px] font-extrabold ${u.title}`}>{pct}%</p>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {grouped.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 pt-3 border-t ${u.divider}`}>
                    {grouped.map(g => (
                      <span key={g.group} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${u.chip}`}>
                        {g.group} <span className={u.subtle}>{g.count}/{g.total}</span>
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
        <Modal
          title="Create New Role"
          isDark={isDark}
          onClose={() => setCreating(null)}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setCreating(null)} className={`flex-1 py-3 border rounded-xl font-bold ${u.btnGhost}`}>Cancel</button>
              <button onClick={saveCreate} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Create Role
              </button>
            </div>
          }
        >
          <RoleForm value={creating} onChange={setCreating} isDark={isDark} />
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Edit: ${editing.name?.en || 'Role'}`}
          isDark={isDark}
          onClose={() => setEditing(null)}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className={`flex-1 py-3 border rounded-xl font-bold ${u.btnGhost}`}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          }
        >
          <RoleForm value={editing} onChange={setEditing} isDark={isDark} />
        </Modal>
      )}
    </div>
  );
}
