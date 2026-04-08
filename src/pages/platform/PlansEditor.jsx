import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Star, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';

// Super-admin editor for subscription plans. Every field supports EN / FR / AR
// so the landing and billing pages always show text in the active language.
const EMPTY = {
  slug: '',
  name: { en: '', fr: '', ar: '' },
  tagline: { en: '', fr: '', ar: '' },
  price_monthly: 0,
  price_yearly: 0,
  currency: 'DZD',
  features: { en: [''], fr: [''], ar: [''] },
  is_popular: false,
  is_active: true,
  sort_order: 0,
};

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

function PlanCard({ plan, onChange, onSave, onDelete, saving }) {
  const set = (path, val) => {
    const p = JSON.parse(JSON.stringify(plan));
    const parts = path.split('.');
    let cur = p;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
    onChange(p);
  };
  const addFeature = (lang) => {
    const p = JSON.parse(JSON.stringify(plan));
    p.features[lang] = [...(p.features[lang] || []), ''];
    onChange(p);
  };
  const removeFeature = (lang, i) => {
    const p = JSON.parse(JSON.stringify(plan));
    p.features[lang] = p.features[lang].filter((_, idx) => idx !== i);
    onChange(p);
  };
  const setFeature = (lang, i, val) => {
    const p = JSON.parse(JSON.stringify(plan));
    p.features[lang][i] = val;
    onChange(p);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${plan.is_popular ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input className="text-lg font-bold outline-none border-b border-transparent focus:border-brand-400" value={plan.name.en} onChange={e => set('name.en', e.target.value)} placeholder="Plan name (EN)" />
          {plan.is_popular && <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center gap-1"><Star size={10} />POPULAR</span>}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={plan.is_popular} onChange={e => set('is_popular', e.target.checked)} />Popular</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={plan.is_active} onChange={e => set('is_active', e.target.checked)} />Active</label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LANGS.map(l => (
          <div key={l.code}>
            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">NAME ({l.label})</label>
            <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.name[l.code] || ''} onChange={e => set(`name.${l.code}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LANGS.map(l => (
          <div key={l.code}>
            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">TAGLINE ({l.label})</label>
            <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.tagline[l.code] || ''} onChange={e => set(`tagline.${l.code}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">MONTHLY PRICE</label>
          <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.price_monthly} onChange={e => set('price_monthly', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">YEARLY PRICE</label>
          <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.price_yearly} onChange={e => set('price_yearly', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-0.5">CURRENCY</label>
          <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.currency} onChange={e => set('currency', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500">FEATURES</p>
        <div className="grid grid-cols-3 gap-3">
          {LANGS.map(l => (
            <div key={l.code} className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400">{l.label}</p>
              {(plan.features[l.code] || []).map((f, i) => (
                <div key={i} className="flex gap-1">
                  <input className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs" value={f} onChange={e => setFeature(l.code, i, e.target.value)} />
                  <button onClick={() => removeFeature(l.code, i)} className="p-1 text-gray-400 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
              <button onClick={() => addFeature(l.code)} className="text-[10px] text-brand-500 font-bold hover:underline">+ Add feature</button>
            </div>
          ))}
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

export default function PlansEditor() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      const { data } = await platformApi.getPlans();
      setPlans(data.plans || []);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to load plans'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNew = () => setPlans([...plans, { ...EMPTY, _new: true }]);
  const updateAt = (i, next) => setPlans(plans.map((p, idx) => idx === i ? next : p));
  const save = async (i) => {
    const p = plans[i];
    setSavingId(i);
    try {
      if (p._new) {
        const { data } = await platformApi.createPlan(p);
        setPlans(plans.map((pp, idx) => idx === i ? data : pp));
        toast.success('Plan created');
      } else {
        const { data } = await platformApi.updatePlan(p.id, p);
        setPlans(plans.map((pp, idx) => idx === i ? data : pp));
        toast.success('Plan updated');
      }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    setSavingId(null);
  };
  const remove = async (i) => {
    const p = plans[i];
    if (!confirm('Delete this plan?')) return;
    if (p._new) { setPlans(plans.filter((_, idx) => idx !== i)); return; }
    try {
      await platformApi.deletePlan(p.id);
      setPlans(plans.filter((_, idx) => idx !== i));
      toast.success('Deleted');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Create and edit the plans shown on the landing and billing pages. Text is stored in English, French and Arabic.</p>
        </div>
        <button onClick={addNew} className="px-4 py-2 bg-brand-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-600"><Plus size={16} />New Plan</button>
      </div>

      {plans.length === 0 && <div className="p-10 text-center bg-white rounded-2xl border border-gray-100"><p className="text-gray-500">No plans yet. Click <b>New Plan</b> to create one.</p></div>}

      <div className="grid lg:grid-cols-2 gap-5">
        {plans.map((p, i) => (
          <PlanCard key={p.id || `new-${i}`} plan={p} onChange={(next) => updateAt(i, next)} onSave={() => save(i)} onDelete={() => remove(i)} saving={savingId === i} />
        ))}
      </div>
    </div>
  );
}
