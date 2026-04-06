import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { UserPlus, X, Shield, Eye, Package, CreditCard, CheckCircle, Edit, Trash2, ToggleLeft, ToggleRight, Plus, Settings, ChevronDown } from 'lucide-react';

// All granular permissions available in the system
const ALL_PERMISSIONS = [
  { key: 'dashboard_view', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'analytics_view', label: 'View Analytics', group: 'Dashboard' },
  { key: 'orders_view', label: 'View Orders', group: 'Orders' },
  { key: 'orders_edit', label: 'Edit / Update Orders', group: 'Orders' },
  { key: 'orders_confirm', label: 'Confirm Orders', group: 'Orders' },
  { key: 'orders_prepare', label: 'Prepare Orders', group: 'Orders' },
  { key: 'orders_delete', label: 'Delete Orders', group: 'Orders' },
  { key: 'products_view', label: 'View Products', group: 'Products' },
  { key: 'products_edit', label: 'Add / Edit Products', group: 'Products' },
  { key: 'products_delete', label: 'Delete Products', group: 'Products' },
  { key: 'stock_manage', label: 'Manage Stock', group: 'Products' },
  { key: 'customers_view', label: 'View Customers', group: 'Customers' },
  { key: 'customers_edit', label: 'Edit Customers', group: 'Customers' },
  { key: 'customers_blacklist', label: 'Manage Blacklist', group: 'Customers' },
  { key: 'finances_view', label: 'View Costs & Revenue', group: 'Finances' },
  { key: 'finances_edit', label: 'Add / Edit Expenses', group: 'Finances' },
  { key: 'taxes_view', label: 'View Taxes', group: 'Finances' },
  { key: 'settings_view', label: 'View Settings', group: 'Settings' },
  { key: 'settings_edit', label: 'Edit Store Settings', group: 'Settings' },
  { key: 'staff_manage', label: 'Manage Staff', group: 'Settings' },
  { key: 'builder_edit', label: 'Edit Page Builder', group: 'Settings' },
  { key: 'shipping_manage', label: 'Manage Shipping', group: 'Shipping' },
  { key: 'reviews_manage', label: 'Manage Reviews', group: 'Content' },
  { key: 'domains_manage', label: 'Manage Domains', group: 'Settings' },
];

const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

// Built-in role presets
const ROLE_PRESETS = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-600', desc: 'Full access to all features', permissions: ALL_PERMISSIONS.map(p => p.key) },
  preparer: { label: 'Preparer', icon: Package, color: 'bg-blue-100 text-blue-600', desc: 'Can prepare and manage orders', permissions: ['dashboard_view', 'orders_view', 'orders_edit', 'orders_prepare', 'products_view', 'stock_manage'] },
  confirmer: { label: 'Confirmer', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', desc: 'Can confirm incoming orders', permissions: ['dashboard_view', 'orders_view', 'orders_confirm', 'customers_view'] },
  accountant: { label: 'Accountant', icon: CreditCard, color: 'bg-amber-100 text-amber-600', desc: 'Can view payments and finances', permissions: ['dashboard_view', 'analytics_view', 'orders_view', 'finances_view', 'finances_edit', 'taxes_view'] },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-gray-100 text-gray-600', desc: 'Read-only access to dashboard', permissions: ['dashboard_view', 'analytics_view', 'orders_view', 'products_view', 'customers_view'] },
};

export default function StoreStaff() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showRoleCreator, setShowRoleCreator] = useState(false);
  const [customRoles, setCustomRoles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('custom_roles_' + (currentStore?.id || '')) || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'viewer', permissions: [...ROLE_PRESETS.viewer.permissions] });
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });
  const [expandedGroups, setExpandedGroups] = useState({});

  const loadStaff = () => {
    if (!currentStore?.id) return;
    setLoading(true);
    ownerApi.getStaff(currentStore.id).then(r => setStaff(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { loadStaff(); }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore?.id) {
      try { setCustomRoles(JSON.parse(localStorage.getItem('custom_roles_' + currentStore.id) || '[]')); } catch { setCustomRoles([]); }
    }
  }, [currentStore?.id]);

  const saveCustomRoles = (roles) => {
    setCustomRoles(roles);
    if (currentStore?.id) localStorage.setItem('custom_roles_' + currentStore.id, JSON.stringify(roles));
  };

  const allRoles = { ...ROLE_PRESETS };
  customRoles.forEach(r => { allRoles[r.key] = { label: r.name, icon: Settings, color: 'bg-indigo-100 text-indigo-600', desc: `Custom role · ${r.permissions.length} permissions`, permissions: r.permissions }; });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'viewer', permissions: [...ROLE_PRESETS.viewer.permissions] });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    const perms = s.permissions ? (typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions) : (allRoles[s.role]?.permissions || []);
    setForm({ name: s.name, email: s.email, phone: s.phone || '', password: '', role: s.role, permissions: [...perms] });
    setShowModal(true);
  };

  const selectRole = (key) => {
    const preset = allRoles[key];
    setForm({ ...form, role: key, permissions: preset ? [...preset.permissions] : [] });
  };

  const togglePerm = (key) => {
    setForm(prev => ({ ...prev, permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key] }));
  };

  const toggleGroup = (group) => {
    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    const allChecked = groupPerms.every(k => form.permissions.includes(k));
    if (allChecked) setForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => !groupPerms.includes(p)) }));
    else setForm(prev => ({ ...prev, permissions: [...new Set([...prev.permissions, ...groupPerms])] }));
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    if (!editing && !form.password) return toast.error('Password is required for new staff');
    try {
      const payload = { ...form, permissions: JSON.stringify(form.permissions) };
      if (!payload.password) delete payload.password;
      if (editing) {
        await ownerApi.updateStaff(currentStore.id, editing.id, payload);
        toast.success('Staff updated!');
      } else {
        await ownerApi.addStaff(currentStore.id, payload);
        toast.success('Staff member added!');
      }
      setShowModal(false);
      loadStaff();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await ownerApi.deleteStaff(currentStore.id, id);
      toast.success('Staff removed');
      loadStaff();
    } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (s) => {
    try {
      await ownerApi.updateStaff(currentStore.id, s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? 'Staff deactivated' : 'Staff activated');
      loadStaff();
    } catch { toast.error('Failed'); }
  };

  const addCustomRole = () => {
    if (!roleForm.name) return toast.error('Role name required');
    if (roleForm.permissions.length === 0) return toast.error('Select at least one permission');
    const key = roleForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (allRoles[key]) return toast.error('Role name already exists');
    saveCustomRoles([...customRoles, { key, name: roleForm.name, permissions: roleForm.permissions }]);
    setShowRoleCreator(false);
    setRoleForm({ name: '', permissions: [] });
    toast.success('Custom role created!');
  };

  const deleteCustomRole = (key) => {
    saveCustomRoles(customRoles.filter(r => r.key !== key));
    toast.success('Role deleted');
  };

  const toggleRolePerm = (key) => {
    setRoleForm(prev => ({ ...prev, permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key] }));
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield size={22} className="text-brand-500" />{t('staff.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">Manage who has access to your store dashboard and what they can do</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRoleCreator(true)} className="btn-ghost text-sm flex items-center gap-2"><Plus size={14} />New Role</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><UserPlus size={16} />{t('staff.addStaff')}</button>
        </div>
      </div>

      {/* Custom roles bar */}
      {customRoles.length > 0 && (
        <div className="glass-card-solid p-4 mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Custom Roles</p>
          <div className="flex flex-wrap gap-2">
            {customRoles.map(r => (
              <div key={r.key} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
                <Settings size={12} className="text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700">{r.name}</span>
                <span className="text-[9px] text-indigo-400">{r.permissions.length} perms</span>
                <button onClick={() => deleteCustomRole(r.key)} className="text-red-400 hover:text-red-600 ml-1"><X size={10} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : staff.length === 0 ? (
        <div className="glass-card-solid p-16 text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">No staff members yet</p>
          <p className="text-xs text-gray-400 mb-4">Add team members and control exactly what they can access</p>
          <button onClick={openAdd} className="btn-primary text-sm mx-auto"><UserPlus size={14} className="inline mr-1" />Add First Member</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => {
            const role = allRoles[s.role] || allRoles.viewer;
            const Icon = role.icon;
            const perms = s.permissions ? (typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions) : role.permissions;
            return (
              <div key={s.id} className={`glass-card-solid p-6 relative ${!s.is_active ? 'opacity-50' : ''}`}>
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <button onClick={() => handleToggleActive(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={s.is_active ? 'Deactivate' : 'Activate'}>
                    {s.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                </div>

                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-brand-500">{s.name[0]?.toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-1 ${role.color}`}>
                    <Icon size={12} />{(role.label || s.role).toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{s.email}</p>
                  {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                </div>

                {/* Permission summary */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Permissions ({perms.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {perms.slice(0, 6).map(p => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">{p.replace(/_/g, ' ')}</span>
                    ))}
                    {perms.length > 6 && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">+{perms.length - 6} more</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit staff modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Staff Member' : t('staff.addStaff')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="input-label">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="input-label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="input-label">{editing ? 'New Password (leave empty to keep)' : 'Password *'}</label><input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              </div>

              {/* Role selection */}
              <div>
                <label className="input-label">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(allRoles).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => selectRole(key)} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${form.role === key ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}><Icon size={14} /></div>
                        <div><p className="font-semibold text-sm capitalize">{cfg.label || key}</p><p className="text-[10px] text-gray-400 line-clamp-1">{cfg.desc}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label !mb-0">Permissions</label>
                  <span className="text-[10px] text-gray-400 font-bold">{form.permissions.length}/{ALL_PERMISSIONS.length} enabled</span>
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {PERM_GROUPS.map(group => {
                    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                    const checkedCount = groupPerms.filter(p => form.permissions.includes(p.key)).length;
                    const allChecked = checkedCount === groupPerms.length;
                    const expanded = expandedGroups[group] !== false;
                    return (
                      <div key={group}>
                        <button onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !expanded }))} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                            <span className="text-sm font-bold text-gray-700">{group}</span>
                            <span className="text-[10px] text-gray-400">{checkedCount}/{groupPerms.length}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); toggleGroup(group); }} className={`text-[10px] font-bold px-2 py-0.5 rounded ${allChecked ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                            {allChecked ? 'Uncheck all' : 'Check all'}
                          </button>
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                            {groupPerms.map(p => (
                              <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                                <span className="text-xs text-gray-700">{p.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? 'Update Staff' : 'Add Staff'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom role creator modal */}
      {showRoleCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowRoleCreator(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Custom Role</h2>
              <button onClick={() => setShowRoleCreator(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="input-label">Role Name *</label><input className="input-field" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Warehouse Manager" /></div>
              <div>
                <label className="input-label">Permissions *</label>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {PERM_GROUPS.map(group => {
                    const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group);
                    return (
                      <div key={group} className="p-3">
                        <p className="text-xs font-bold text-gray-500 mb-2">{group}</p>
                        <div className="grid grid-cols-2 gap-1">
                          {groupPerms.map(p => (
                            <label key={p.key} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={roleForm.permissions.includes(p.key)} onChange={() => toggleRolePerm(p.key)} className="w-3.5 h-3.5 rounded border-gray-300 text-brand-500" />
                              <span className="text-[11px] text-gray-700">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{roleForm.permissions.length} permissions selected</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRoleCreator(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={addCustomRole} className="btn-primary flex-1">Create Role</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
