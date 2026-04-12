import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Star, X, Loader2, Check, Shield, Zap, Package, Users, ShoppingCart, Bot, BarChart3, Globe, Layout, Code, MessageSquare, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';

// All canonical feature keys the backend enforces. The super admin checks
// whichever ones apply to a plan — these exact strings are what the middleware
// gate and the store-admin frontend read.
const ALL_FEATURE_KEYS = [
  { key: 'basic_analytics',       label: 'Basic Analytics',         icon: BarChart3,   group: 'Analytics' },
  { key: 'advanced_analytics',    label: 'Advanced Analytics',      icon: BarChart3,   group: 'Analytics' },
  { key: 'ai_chatbot',            label: 'AI Chatbot',              icon: Bot,         group: 'AI' },
  { key: 'ai_descriptions',       label: 'AI Product Descriptions', icon: Bot,         group: 'AI' },
  { key: 'ai_moderation',         label: 'AI Review Moderation',    icon: Shield,      group: 'AI' },
  { key: 'page_builder',          label: 'Page Builder',            icon: Layout,      group: 'Store' },
  { key: 'custom_domain',         label: 'Custom Domain',           icon: Globe,       group: 'Store' },
  { key: 'custom_html',           label: 'Custom HTML Sections',    icon: Code,        group: 'Store' },
  { key: 'abandoned_cart',        label: 'Abandoned Cart Recovery',  icon: ShoppingCart, group: 'Marketing' },
  { key: 'whatsapp_automation',   label: 'WhatsApp Automation',     icon: MessageSquare, group: 'Marketing' },
  { key: 'email_notifications',   label: 'Email Notifications',     icon: MessageSquare, group: 'Marketing' },
  { key: 'priority_support',      label: 'Priority Support',        icon: Zap,         group: 'Support' },
  { key: 'email_support',         label: 'Email Support',           icon: MessageSquare, group: 'Support' },
  { key: 'unlimited_products',    label: 'Unlimited Products',      icon: Package,     group: 'Limits' },
  { key: 'unlimited_orders',      label: 'Unlimited Orders',        icon: ShoppingCart, group: 'Limits' },
  { key: 'unlimited_staff',       label: 'Unlimited Staff',         icon: Users,       group: 'Limits' },
];

const GROUPS = [...new Set(ALL_FEATURE_KEYS.map(f => f.group))];

const EMPTY = {
  slug: '',
  name: { en: '', fr: '', ar: '' },
  tagline: { en: '', fr: '', ar: '' },
  price_monthly: 0,
  price_yearly: 0,
  currency: 'DZD',
  features: { en: [''], fr: [''], ar: [''] },
  feature_keys: [],
  max_products: 0,
  max_orders_month: 0,
  max_staff: 0,
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
  const [tab, setTab] = useState('general');
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
  const toggleFeatureKey = (key) => {
    const p = JSON.parse(JSON.stringify(plan));
    const keys = p.feature_keys || [];
    p.feature_keys = keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key];
    onChange(p);
  };

  const featureKeys = plan.feature_keys || [];

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden ${plan.is_popular ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input className="text-lg font-bold outline-none border-b border-transparent focus:border-brand-400 min-w-0" value={plan.name.en} onChange={e => set('name.en', e.target.value)} placeholder="Plan name (EN)" />
            {plan.is_popular && <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center gap-1 shrink-0"><Star size={10} />POPULAR</span>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" className="rounded" checked={plan.is_popular} onChange={e => set('is_popular', e.target.checked)} />Popular</label>
            <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" className="rounded" checked={plan.is_active} onChange={e => set('is_active', e.target.checked)} />Active</label>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[{id:'general',l:'General'},{id:'features_text',l:'Feature Text'},{id:'feature_keys',l:'Feature Gates'},{id:'limits',l:'Limits'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab===t.id?'bg-brand-50 text-brand-600':'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* GENERAL TAB */}
        {tab==='general'&&<>
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
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">SORT ORDER</label>
            <input type="number" className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.sort_order||0} onChange={e => set('sort_order', parseInt(e.target.value)||0)} />
          </div>
        </>}

        {/* FEATURE TEXT TAB */}
        {tab==='features_text'&&<>
          <p className="text-xs text-gray-500">These are the <b>display labels</b> shown to store owners on the billing page. Translate them in all 3 languages.</p>
          <div className="grid grid-cols-3 gap-3">
            {LANGS.map(l => (
              <div key={l.code} className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400">{l.label}</p>
                {(plan.features[l.code] || []).map((f, i) => (
                  <div key={i} className="flex gap-1">
                    <input className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs" value={f} onChange={e => setFeature(l.code, i, e.target.value)} placeholder={`Feature ${i+1}`} />
                    <button onClick={() => removeFeature(l.code, i)} className="p-1 text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => addFeature(l.code)} className="text-[10px] text-brand-500 font-bold hover:underline">+ Add</button>
              </div>
            ))}
          </div>
        </>}

        {/* FEATURE KEYS TAB — canonical keys that actually gate features */}
        {tab==='feature_keys'&&<>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
            <p className="text-xs text-amber-800 font-medium">
              <Lock size={12} className="inline mr-1"/>
              These keys <b>actually control</b> what store admins can use. Unchecked features will be locked for this plan.
            </p>
          </div>
          <div className="space-y-4">
            {GROUPS.map(group=>(
              <div key={group}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_FEATURE_KEYS.filter(f=>f.group===group).map(f=>{
                    const Icon = f.icon;
                    const active = featureKeys.includes(f.key);
                    return(
                      <button key={f.key} onClick={()=>toggleFeatureKey(f.key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${active?'bg-emerald-50 border border-emerald-300 text-emerald-700':'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        {active?<Unlock size={12} className="text-emerald-500 shrink-0"/>:<Lock size={12} className="text-gray-400 shrink-0"/>}
                        <Icon size={12} className="shrink-0"/>
                        <span className="truncate">{f.label}</span>
                        {active&&<Check size={12} className="ml-auto text-emerald-500 shrink-0"/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <button onClick={()=>{const p=JSON.parse(JSON.stringify(plan));p.feature_keys=ALL_FEATURE_KEYS.map(f=>f.key);onChange(p);}} className="text-[10px] font-bold text-brand-500 hover:underline">Select all</button>
            <button onClick={()=>{const p=JSON.parse(JSON.stringify(plan));p.feature_keys=[];onChange(p);}} className="text-[10px] font-bold text-red-500 hover:underline">Clear all</button>
          </div>
        </>}

        {/* LIMITS TAB */}
        {tab==='limits'&&<>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2">
            <p className="text-xs text-blue-800 font-medium">Set <b>0</b> for unlimited. These quotas are enforced server-side — store owners can't exceed them.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5 flex items-center gap-1"><Package size={10}/>MAX PRODUCTS</label>
              <input type="number" min={0} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.max_products||0} onChange={e => set('max_products', parseInt(e.target.value)||0)} />
              <p className="text-[9px] text-gray-400 mt-0.5">0 = unlimited</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5 flex items-center gap-1"><ShoppingCart size={10}/>MAX ORDERS/MONTH</label>
              <input type="number" min={0} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.max_orders_month||0} onChange={e => set('max_orders_month', parseInt(e.target.value)||0)} />
              <p className="text-[9px] text-gray-400 mt-0.5">0 = unlimited</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5 flex items-center gap-1"><Users size={10}/>MAX STAFF</label>
              <input type="number" min={0} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={plan.max_staff||0} onChange={e => set('max_staff', parseInt(e.target.value)||0)} />
              <p className="text-[9px] text-gray-400 mt-0.5">0 = unlimited</p>
            </div>
          </div>
        </>}
      </div>

      {/* Action row */}
      <div className="flex gap-2 p-5 border-t border-gray-100">
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

  const addNew = () => setPlans([...plans, { ...JSON.parse(JSON.stringify(EMPTY)), _new: true }]);
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
          <p className="text-sm text-gray-500">Create and edit plans. Use the <b>Feature Gates</b> tab to control what each plan actually unlocks for store admins.</p>
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
