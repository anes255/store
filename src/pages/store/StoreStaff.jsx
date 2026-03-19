import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { UserPlus, X, Shield, Eye, Package, CreditCard, CheckCircle } from 'lucide-react';

const roleConfig = {
  admin: { icon: Shield, color: 'bg-purple-100 text-purple-600', desc: 'Full access to all features' },
  preparer: { icon: Package, color: 'bg-blue-100 text-blue-600', desc: 'Can prepare and manage orders' },
  confirmer: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', desc: 'Can confirm incoming orders' },
  accountant: { icon: CreditCard, color: 'bg-amber-100 text-amber-600', desc: 'Can view payments and finances' },
  viewer: { icon: Eye, color: 'bg-gray-100 text-gray-600', desc: 'Read-only access to dashboard' },
};

export default function StoreStaff() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'viewer' });

  const loadStaff = () => {
    if (!currentStore?.id) return;
    ownerApi.getStaff(currentStore.id).then(r => setStaff(r.data)).catch(() => {});
  };
  useEffect(() => { loadStaff(); }, [currentStore?.id]);

  const handleAdd = async () => {
    try {
      await ownerApi.addStaff(currentStore.id, form);
      toast.success('Staff member added!');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: '', role: 'viewer' });
      loadStaff();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('staff.title')}</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><UserPlus size={16} />{t('staff.addStaff')}</button>
      </div>

      <p className="text-sm text-gray-500 mb-6">Manage who has access to your store dashboard and what they can do.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => {
          const role = roleConfig[s.role] || roleConfig.viewer;
          const Icon = role.icon;
          return (
            <div key={s.id} className="glass-card-solid p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-brand-500">{s.name[0]?.toUpperCase()}</span>
              </div>
              <h3 className="font-bold text-gray-900">{s.name}</h3>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-2 ${role.color}`}>
                <Icon size={12} />{s.role.toUpperCase()}
              </span>
              <p className="text-xs text-gray-400 mt-2">{s.email}</p>
              <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${s.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t('staff.addStaff')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="input-label">Name</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><label className="input-label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><label className="input-label">Password</label><input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              <div><label className="input-label">Role</label>
                <div className="space-y-2">
                  {Object.entries(roleConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <label key={key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${form.role === key ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="role" value={key} checked={form.role === key} onChange={() => setForm({...form, role: key})} className="sr-only" />
                        <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center`}><Icon size={14} /></div>
                        <div><p className="font-semibold text-sm capitalize">{key}</p><p className="text-xs text-gray-400">{cfg.desc}</p></div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleAdd} className="btn-primary flex-1">Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
