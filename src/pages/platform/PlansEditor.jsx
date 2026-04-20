import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Save, Star, X, Loader2, Check, Shield, Zap, Package, Users, ShoppingCart, Bot, BarChart3, Globe, Layout, Code, MessageSquare, Lock, Unlock, Crown, DollarSign, Settings2, Languages, Sparkles, ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { usePlatformTheme } from '../../hooks/useStore';

const ALL_FEATURE_KEYS = [
  { key: 'basic_analytics',       label: 'Basic Analytics',         icon: BarChart3,     group: 'Analytics' },
  { key: 'advanced_analytics',    label: 'Advanced Analytics',      icon: BarChart3,     group: 'Analytics' },
  { key: 'ai_chatbot',            label: 'AI Chatbot',              icon: Bot,           group: 'AI' },
  { key: 'ai_descriptions',       label: 'AI Product Descriptions', icon: Bot,           group: 'AI' },
  { key: 'ai_moderation',         label: 'AI Review Moderation',    icon: Shield,        group: 'AI' },
  { key: 'page_builder',          label: 'Page Builder',            icon: Layout,        group: 'Store' },
  { key: 'custom_domain',         label: 'Custom Domain',           icon: Globe,         group: 'Store' },
  { key: 'custom_html',           label: 'Custom HTML Sections',    icon: Code,          group: 'Store' },
  { key: 'abandoned_cart',        label: 'Abandoned Cart Recovery', icon: ShoppingCart,  group: 'Marketing' },
  { key: 'whatsapp_automation',   label: 'WhatsApp Automation',     icon: MessageSquare, group: 'Marketing' },
  { key: 'email_notifications',   label: 'Email Notifications',     icon: MessageSquare, group: 'Marketing' },
  { key: 'priority_support',      label: 'Priority Support',        icon: Zap,           group: 'Support' },
  { key: 'email_support',         label: 'Email Support',           icon: MessageSquare, group: 'Support' },
  { key: 'unlimited_products',    label: 'Unlimited Products',      icon: Package,       group: 'Limits' },
  { key: 'unlimited_orders',      label: 'Unlimited Orders',        icon: ShoppingCart,  group: 'Limits' },
  { key: 'unlimited_staff',       label: 'Unlimited Staff',         icon: Users,         group: 'Limits' },
];
const GROUPS = [...new Set(ALL_FEATURE_KEYS.map(f => f.group))];

const EMPTY = {
  slug: '', name: { en: '', fr: '', ar: '' }, tagline: { en: '', fr: '', ar: '' },
  price_monthly: 0, price_yearly: 0, currency: 'DZD',
  features: { en: [''], fr: [''], ar: [''] }, feature_keys: [],
  max_products: 0, max_orders_month: 0, max_staff: 0,
  is_popular: false, is_active: true, sort_order: 0,
};
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
    featOn: isDark ? 'bg-emerald-500/15 border-emerald-600/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700',
    featOff: isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100',
    hintWarn: isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800',
    hintInfo: isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800',
    btnGhost: isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    btnDanger: isDark ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'border-red-200 text-red-500 hover:bg-red-50',
    star: isDark ? 'text-amber-400' : 'text-amber-500',
    pillBg: isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600',
  };
}

function PlanCard({ plan, onChange, onSave, onDelete, saving, isDark }) {
  const u = ui(isDark);
  const [tab, setTab] = useState('general');
  const [collapsed, setCollapsed] = useState(false);
  const set = (path, val) => {
    const p = JSON.parse(JSON.stringify(plan));
    const parts = path.split('.'); let cur = p;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = val;
    onChange(p);
  };
  const addFeature = (lang) => { const p = JSON.parse(JSON.stringify(plan)); p.features[lang] = [...(p.features[lang] || []), '']; onChange(p); };
  const removeFeature = (lang, i) => { const p = JSON.parse(JSON.stringify(plan)); p.features[lang] = p.features[lang].filter((_, idx) => idx !== i); onChange(p); };
  const setFeature = (lang, i, val) => { const p = JSON.parse(JSON.stringify(plan)); p.features[lang][i] = val; onChange(p); };
  const toggleFeatureKey = (key) => {
    const p = JSON.parse(JSON.stringify(plan));
    const keys = p.feature_keys || [];
    p.feature_keys = keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key];
    onChange(p);
  };

  const featureKeys = plan.feature_keys || [];
  const gateCount = featureKeys.length;
  const tabs = [
    { id: 'general', l: 'General', I: Settings2 },
    { id: 'features_text', l: 'Feature Text', I: Languages },
    { id: 'feature_keys', l: 'Feature Gates', I: Shield, badge: gateCount },
    { id: 'limits', l: 'Limits', I: Package },
  ];

  const accent = plan.is_popular ? 'from-amber-400 via-brand-500 to-purple-500' : 'from-brand-500 to-purple-600';

  return (
    <div className={`relative rounded-2xl border overflow-hidden shadow-sm ${u.card} ${plan.is_popular ? 'ring-2 ring-amber-400/40' : ''}`}>
      {/* Accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      {/* Header */}
      <div className={`p-5 border-b ${u.divider}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0 shadow-lg`}>
              <Crown size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  className={`text-lg font-extrabold bg-transparent outline-none border-b-2 border-transparent focus:border-brand-400 min-w-0 max-w-full ${u.title}`}
                  value={plan.name.en} onChange={e => set('name.en', e.target.value)} placeholder="Plan name"
                />
                {plan.is_popular && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm`}>
                    <Star size={10} />POPULAR
                  </span>
                )}
                {!plan.is_active && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.pillBg}`}>INACTIVE</span>}
              </div>
              <div className={`flex items-center gap-3 mt-1 text-xs ${u.muted}`}>
                <span className="flex items-center gap-1"><DollarSign size={11} />{(plan.price_monthly||0).toLocaleString()} {plan.currency||'DZD'}/mo</span>
                <span className="opacity-40">·</span>
                <span>{(plan.price_yearly||0).toLocaleString()} /yr</span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1"><Shield size={11} />{gateCount} features</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Toggle isDark={isDark} checked={!!plan.is_popular} onChange={v => set('is_popular', v)} label="Popular" color="amber" />
            <Toggle isDark={isDark} checked={!!plan.is_active} onChange={v => set('is_active', v)} label="Active" color="emerald" />
            <button onClick={() => setCollapsed(c => !c)} className={`p-2 rounded-lg ${u.btnGhost}`} title={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {tabs.map(t => {
              const I = t.I; const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? u.tabActive : u.tabIdle}`}>
                  <I size={12} />{t.l}
                  {t.badge > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${active ? 'bg-brand-500 text-white' : u.pillBg}`}>{t.badge}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* GENERAL */}
          {tab === 'general' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGS.map(l => (
                  <div key={l.code}>
                    <label className={`block text-[10px] font-bold mb-1 ${u.muted}`}>{l.flag} NAME ({l.label})</label>
                    <input className={`w-full px-3 py-2 border rounded-lg text-sm ${u.input}`} value={plan.name[l.code] || ''} onChange={e => set(`name.${l.code}`, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGS.map(l => (
                  <div key={l.code}>
                    <label className={`block text-[10px] font-bold mb-1 ${u.muted}`}>{l.flag} TAGLINE ({l.label})</label>
                    <input className={`w-full px-3 py-2 border rounded-lg text-sm ${u.input}`} value={plan.tagline[l.code] || ''} onChange={e => set(`tagline.${l.code}`, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className={`rounded-xl p-4 border ${u.cardSoft}`}>
                <p className={`text-[10px] font-bold mb-3 ${u.muted}`}>PRICING</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 ${u.subtle}`}>MONTHLY</label>
                    <div className="relative">
                      <input type="number" className={`w-full pl-3 pr-12 py-2 border rounded-lg text-sm font-bold ${u.input}`} value={plan.price_monthly} onChange={e => set('price_monthly', parseFloat(e.target.value) || 0)} />
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${u.subtle}`}>{plan.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 ${u.subtle}`}>YEARLY</label>
                    <div className="relative">
                      <input type="number" className={`w-full pl-3 pr-12 py-2 border rounded-lg text-sm font-bold ${u.input}`} value={plan.price_yearly} onChange={e => set('price_yearly', parseFloat(e.target.value) || 0)} />
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${u.subtle}`}>{plan.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 ${u.subtle}`}>CURRENCY</label>
                    <select className={`w-full px-3 py-2 border rounded-lg text-sm ${u.input}`} value={plan.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="DZD">DZD</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="MAD">MAD</option><option value="TND">TND</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 ${u.subtle}`}>SORT ORDER</label>
                    <input type="number" className={`w-full px-3 py-2 border rounded-lg text-sm ${u.input}`} value={plan.sort_order || 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                {plan.price_monthly > 0 && plan.price_yearly > 0 && (
                  <p className={`text-[10px] mt-2 ${u.muted}`}>
                    Yearly saves <b className="text-emerald-500">{Math.max(0, Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100))}%</b> vs 12× monthly
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-1 ${u.muted}`}>SLUG (URL identifier)</label>
                <input className={`w-full max-w-xs px-3 py-2 border rounded-lg text-sm font-mono ${u.input}`} value={plan.slug || ''} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="e.g. basic" />
              </div>
            </>
          )}

          {/* FEATURE TEXT */}
          {tab === 'features_text' && (
            <>
              <div className={`border rounded-xl p-3 ${u.hintInfo}`}>
                <p className="text-xs font-medium"><Languages size={12} className="inline mr-1" />Display labels shown to store owners on the billing page. Translate in all 3 languages.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {LANGS.map(l => (
                  <div key={l.code} className={`rounded-xl border p-3 space-y-2 ${u.cardSoft}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-2 ${u.muted}`}><span>{l.flag}</span>{l.label}</p>
                    {(plan.features[l.code] || []).map((f, i) => (
                      <div key={i} className="flex gap-1">
                        <input className={`flex-1 px-2 py-1.5 border rounded-lg text-xs ${u.input}`} value={f} onChange={e => setFeature(l.code, i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                        <button onClick={() => removeFeature(l.code, i)} className={`p-1.5 rounded-lg ${u.btnDanger} border`}><X size={12} /></button>
                      </div>
                    ))}
                    <button onClick={() => addFeature(l.code)} className={`w-full py-1.5 rounded-lg border border-dashed text-[11px] font-bold ${u.muted} ${isDark ? 'border-gray-700 hover:border-brand-500 hover:text-brand-400' : 'border-gray-300 hover:border-brand-400 hover:text-brand-500'}`}>+ Add feature</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FEATURE KEYS */}
          {tab === 'feature_keys' && (
            <>
              <div className={`border rounded-xl p-3 ${u.hintWarn}`}>
                <p className="text-xs font-medium"><Lock size={12} className="inline mr-1" />These keys <b>actually control</b> what store admins can use. Unchecked features will be locked for this plan.</p>
              </div>
              <div className="space-y-4">
                {GROUPS.map(group => (
                  <div key={group}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${u.muted}`}>
                      <span>{group}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${u.pillBg} text-[9px]`}>
                        {ALL_FEATURE_KEYS.filter(f => f.group === group && featureKeys.includes(f.key)).length}/{ALL_FEATURE_KEYS.filter(f => f.group === group).length}
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_FEATURE_KEYS.filter(f => f.group === group).map(f => {
                        const Icon = f.icon;
                        const active = featureKeys.includes(f.key);
                        return (
                          <button key={f.key} onClick={() => toggleFeatureKey(f.key)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all border ${active ? u.featOn : u.featOff}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500/20' : isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                              <Icon size={13} />
                            </div>
                            <span className="truncate flex-1">{f.label}</span>
                            {active ? <Unlock size={12} className="text-emerald-500 shrink-0" /> : <Lock size={12} className={`shrink-0 ${u.subtle}`} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`pt-3 border-t flex gap-2 ${u.divider}`}>
                <button onClick={() => { const p = JSON.parse(JSON.stringify(plan)); p.feature_keys = ALL_FEATURE_KEYS.map(f => f.key); onChange(p); }} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${u.btnGhost}`}>
                  <Check size={11} className="inline mr-1" />Select all
                </button>
                <button onClick={() => { const p = JSON.parse(JSON.stringify(plan)); p.feature_keys = []; onChange(p); }} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${u.btnDanger} border`}>
                  <X size={11} className="inline mr-1" />Clear all
                </button>
              </div>
            </>
          )}

          {/* LIMITS */}
          {tab === 'limits' && (
            <>
              <div className={`border rounded-xl p-3 ${u.hintInfo}`}>
                <p className="text-xs font-medium">Set <b>0</b> for unlimited. These quotas are enforced server-side — store owners can't exceed them.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { k: 'max_products', I: Package, l: 'MAX PRODUCTS' },
                  { k: 'max_orders_month', I: ShoppingCart, l: 'MAX ORDERS / MONTH' },
                  { k: 'max_staff', I: Users, l: 'MAX STAFF' },
                ].map(f => {
                  const I = f.I; const v = plan[f.k] || 0;
                  return (
                    <div key={f.k} className={`rounded-xl border p-4 ${u.cardSoft}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} flex items-center justify-center`}><I size={14} className="text-brand-500" /></div>
                        <label className={`text-[10px] font-bold ${u.muted}`}>{f.l}</label>
                      </div>
                      <input type="number" min={0} className={`w-full px-3 py-2 border rounded-lg text-lg font-extrabold ${u.input}`} value={v} onChange={e => set(f.k, parseInt(e.target.value) || 0)} />
                      <p className={`text-[10px] mt-1 ${v === 0 ? 'text-emerald-500 font-bold' : u.subtle}`}>{v === 0 ? '∞ Unlimited' : `Capped at ${v.toLocaleString()}`}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action row */}
      <div className={`flex gap-2 p-4 border-t ${u.divider} ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
        <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-brand-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'Saving...' : 'Save Plan'}
        </button>
        <button onClick={onDelete} className={`px-4 py-2.5 border rounded-lg text-sm font-bold flex items-center gap-1 ${u.btnDanger}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, color = 'brand', isDark }) {
  const colorBg = checked
    ? (color === 'amber' ? 'bg-amber-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-brand-500')
    : (isDark ? 'bg-gray-700' : 'bg-gray-300');
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <div className={`relative w-9 h-5 rounded-full transition-colors ${colorBg}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

export default function PlansEditor() {
  const theme = usePlatformTheme();
  const isDark = theme.mode === 'dark';
  const u = ui(isDark);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | inactive | popular

  const load = async () => {
    try { const { data } = await platformApi.getPlans(); setPlans(data.plans || []); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to load plans'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNew = () => setPlans([...plans, { ...JSON.parse(JSON.stringify(EMPTY)), _new: true, _tmp: Date.now() }]);
  const updateAt = (i, next) => setPlans(plans.map((p, idx) => idx === i ? next : p));
  const save = async (i) => {
    const p = plans[i]; setSavingId(i);
    try {
      if (p._new) { const { data } = await platformApi.createPlan(p); setPlans(plans.map((pp, idx) => idx === i ? data : pp)); toast.success('Plan created'); }
      else { const { data } = await platformApi.updatePlan(p.id, p); setPlans(plans.map((pp, idx) => idx === i ? data : pp)); toast.success('Plan updated'); }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    setSavingId(null);
  };
  const remove = async (i) => {
    const p = plans[i];
    if (!confirm('Delete this plan?')) return;
    if (p._new) { setPlans(plans.filter((_, idx) => idx !== i)); return; }
    try { await platformApi.deletePlan(p.id); setPlans(plans.filter((_, idx) => idx !== i)); toast.success('Deleted'); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return plans
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => {
        if (filter === 'active' && !p.is_active) return false;
        if (filter === 'inactive' && p.is_active) return false;
        if (filter === 'popular' && !p.is_popular) return false;
        if (!s) return true;
        const hay = [p.slug, p.name?.en, p.name?.fr, p.name?.ar, p.tagline?.en].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(s);
      });
  }, [plans, search, filter]);

  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter(p => p.is_active).length,
    popular: plans.filter(p => p.is_popular).length,
    avgMonthly: plans.length ? Math.round(plans.reduce((s, p) => s + (Number(p.price_monthly) || 0), 0) / plans.length) : 0,
  }), [plans]);

  if (loading) return <div className="p-20 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className={`relative rounded-2xl overflow-hidden border ${u.card}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className={`text-xl md:text-2xl font-black ${u.title}`}>Subscription Plans</h1>
                <p className={`text-xs ${u.muted}`}>Design tiers, set prices, and gate features. Changes apply instantly to store owners.</p>
              </div>
            </div>
          </div>
          <button onClick={addNew} className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-brand-500/30 transition-all self-start lg:self-auto">
            <Plus size={16} />New Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Total Plans', v: stats.total, I: Package, c: 'brand' },
          { l: 'Active', v: stats.active, I: Check, c: 'emerald' },
          { l: 'Popular', v: stats.popular, I: Star, c: 'amber' },
          { l: 'Avg. Monthly', v: `${stats.avgMonthly.toLocaleString()} DZD`, I: DollarSign, c: 'purple' },
        ].map((s, i) => {
          const I = s.I;
          const colorMap = { brand: 'text-brand-500', emerald: 'text-emerald-500', amber: 'text-amber-500', purple: 'text-purple-500' };
          return (
            <div key={i} className={`rounded-2xl p-4 border ${u.card}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${u.muted}`}>{s.l}</p>
                <I size={14} className={colorMap[s.c]} />
              </div>
              <p className={`text-xl font-black ${u.title}`}>{s.v}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={`rounded-2xl p-3 border flex flex-col sm:flex-row gap-3 ${u.card}`}>
        <div className="relative flex-1">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${u.subtle}`} />
          <input className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm ${u.input}`} placeholder="Search by name, tagline, or slug..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {[{ k: 'all', l: 'All' }, { k: 'active', l: 'Active' }, { k: 'inactive', l: 'Inactive' }, { k: 'popular', l: 'Popular' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${filter === f.k ? (isDark ? 'bg-gray-900 text-brand-400 shadow-sm' : 'bg-white text-brand-600 shadow-sm') : u.muted}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className={`p-12 text-center rounded-2xl border ${u.card}`}>
          <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}><Package size={24} className={u.subtle} /></div>
          <p className={u.muted}>{plans.length === 0 ? 'No plans yet. Click ' : 'No plans match your filter. Try '}<b>{plans.length === 0 ? 'New Plan' : 'clearing search'}</b>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filtered.map(({ p, i }) => (
          <PlanCard key={p.id || `new-${p._tmp || i}`} plan={p} onChange={(next) => updateAt(i, next)} onSave={() => save(i)} onDelete={() => remove(i)} saving={savingId === i} isDark={isDark} />
        ))}
      </div>
    </div>
  );
}
