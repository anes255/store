import React,{useState,useEffect,useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import DashboardLayout from '../../components/shared/DashboardLayout';
import {useStoreManagement} from '../../hooks/useStore';
import {ownerApi,orderApi} from '../../utils/api';
import toast from 'react-hot-toast';
import {Percent,TrendingUp,Calculator,Save,RefreshCw,FileText,Calendar,DollarSign} from 'lucide-react';

export default function StoreTaxes(){
  const {t}=useTranslation();
  const PRESETS=[
    {label:t('taxes.presetStandard','TVA Standard (19%)'),value:19},
    {label:t('taxes.presetReduced','TVA Reduced (9%)'),value:9},
    {label:t('taxes.presetTap','TAP (2%)'),value:2},
    {label:t('taxes.presetZero','Zero Rated (0%)'),value:0},
  ];
  const {currentStore,setCurrentStore}=useStoreManagement();
  const [rate,setRate]=useState(0);
  const [inclusive,setInclusive]=useState(false);
  const [label,setLabel]=useState('TVA');
  const [enabled,setEnabled]=useState(false);
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [period,setPeriod]=useState('month'); // month | quarter | year | all
  const [customRevenue,setCustomRevenue]=useState('');

  // Sync tax config whenever store data refreshes (e.g. after DashboardLayout
  // re-fetches from the API on page reload).
  const cfgTaxEnabled=currentStore?.config?.tax_enabled;
  const cfgTaxRate=currentStore?.config?.tax_rate;
  const cfgTaxInclusive=currentStore?.config?.tax_inclusive;
  const cfgTaxLabel=currentStore?.config?.tax_label;
  useEffect(()=>{
    const cfg=currentStore?.config||{};
    setRate(parseFloat(cfg.tax_rate)||0);
    setInclusive(cfg.tax_inclusive===true);
    setLabel(cfg.tax_label||'TVA');
    setEnabled(cfg.tax_enabled===true);
  },[cfgTaxEnabled,cfgTaxRate,cfgTaxInclusive,cfgTaxLabel]);
  useEffect(()=>{
    if(!currentStore?.id)return;
    setLoading(true);
    orderApi.getAll(currentStore.id,{limit:1000}).then(r=>setOrders(r.data?.orders||r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[currentStore?.id]);

  const save=async()=>{
    setSaving(true);
    try{
      const {data}=await ownerApi.updateStore(currentStore.id,{tax_rate:rate,tax_inclusive:inclusive,tax_label:label,tax_enabled:enabled});
      setCurrentStore(data);
      toast.success(t('storePage.taxSettingsSaved','Tax settings saved'));
    }catch{toast.error(t('store.failedToSave','Failed to save'));}
    setSaving(false);
  };

  // Filter orders by period
  const filteredOrders=useMemo(()=>{
    if(period==='all')return orders;
    const now=new Date();
    return orders.filter(o=>{
      const d=new Date(o.created_at||o.createdAt||o.date);
      if(isNaN(d))return false;
      if(period==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      if(period==='quarter'){const q=Math.floor(now.getMonth()/3);const oq=Math.floor(d.getMonth()/3);return q===oq&&d.getFullYear()===now.getFullYear();}
      if(period==='year')return d.getFullYear()===now.getFullYear();
      return true;
    });
  },[orders,period]);

  const revenue=useMemo(()=>{
    const ok=filteredOrders.filter(o=>{const s=(o.status||'').toLowerCase();return s!=='cancelled'&&s!=='canceled'&&s!=='refunded';});
    return ok.reduce((s,o)=>s+parseFloat(o.total||o.total_amount||0),0);
  },[filteredOrders]);

  // Calculator math
  const base=customRevenue?parseFloat(customRevenue)||0:revenue;
  const r=parseFloat(rate)||0;
  const taxable=inclusive?(base/(1+r/100)):base;
  const taxAmount=inclusive?(base-taxable):(base*r/100);
  const grandTotal=inclusive?base:(base+taxAmount);

  // Monthly breakdown (last 6 months)
  const monthly=useMemo(()=>{
    const buckets={};
    orders.filter(o=>{const s=(o.status||'').toLowerCase();return s!=='cancelled'&&s!=='canceled'&&s!=='refunded';}).forEach(o=>{
      const d=new Date(o.created_at||o.createdAt||o.date);
      if(isNaN(d))return;
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      buckets[key]=(buckets[key]||0)+parseFloat(o.total||o.total_amount||0);
    });
    return Object.entries(buckets).sort().slice(-6).map(([k,v])=>({month:k,revenue:v,tax:inclusive?(v-v/(1+r/100)):(v*r/100)}));
  },[orders,r,inclusive]);

  const currency=currentStore?.currency||'DZD';
  const fmt=(n)=>parseFloat(n||0).toLocaleString(undefined,{maximumFractionDigits:2});

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Percent size={22} className="text-brand-500"/>{t('taxes.title','Taxes')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('taxes.subtitle','Set your tax rate and see how much tax you owe on your revenue')}</p>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{saving?t('common.saving','Saving...'):t('taxes.saveSettings','Save Settings')}</button>
    </div>

    {/* Settings card */}
    <div className="glass-card-solid p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-bold text-lg">Tax Configuration</h2><p className="text-xs text-gray-400 mt-0.5">Applied storewide on checkout & invoices</p></div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="w-4 h-4"/>
          <span className="text-sm font-semibold text-gray-700">Enable tax</span>
        </label>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="input-label">Tax Rate (%)</label>
          <div className="relative">
            <input type="number" step="0.01" min="0" max="100" className="input-field pr-10" value={rate} onChange={e=>setRate(parseFloat(e.target.value)||0)}/>
            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"/>
          </div>
        </div>
        <div>
          <label className="input-label">Label</label>
          <input className="input-field" value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. TVA, VAT, GST"/>
        </div>
        <div>
          <label className="input-label">Price mode</label>
          <select className="input-field" value={inclusive?'inclusive':'exclusive'} onChange={e=>setInclusive(e.target.value==='inclusive')}>
            <option value="exclusive">Tax-exclusive (added at checkout)</option>
            <option value="inclusive">Tax-inclusive (included in price)</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Presets:</span>
        {PRESETS.map(p=>(
          <button key={p.label} onClick={()=>setRate(p.value)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${rate===p.value?'bg-brand-500 text-white border-brand-500':'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>{p.label}</button>
        ))}
      </div>
    </div>

    {/* Revenue-based calculator */}
    <div className="glass-card-solid p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2"><Calculator size={20} className="text-brand-500"/><h2 className="font-bold text-lg">Tax on Revenue</h2></div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
          {[['month','This Month'],['quarter','Quarter'],['year','Year'],['all','All Time']].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} className={`px-3 py-1.5 rounded-md font-semibold ${period===k?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-5">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-blue-500"/><p className="text-[10px] font-bold text-blue-500 uppercase">Revenue</p></div>
          <p className="text-2xl font-black text-gray-900">{fmt(base)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{currency} {customRevenue?'(custom)':`· ${filteredOrders.length} orders`}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-emerald-500"/><p className="text-[10px] font-bold text-emerald-500 uppercase">Taxable Base</p></div>
          <p className="text-2xl font-black text-gray-900">{fmt(taxable)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{currency} {inclusive?'(extracted)':'(pre-tax)'}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1"><Percent size={14} className="text-violet-500"/><p className="text-[10px] font-bold text-violet-500 uppercase">{label} @ {r}%</p></div>
          <p className="text-2xl font-black text-violet-600">{fmt(taxAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{currency} owed</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-amber-500"/><p className="text-[10px] font-bold text-amber-500 uppercase">Grand Total</p></div>
          <p className="text-2xl font-black text-gray-900">{fmt(grandTotal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{currency}</p>
        </div>
      </div>

      <div>
        <label className="input-label">Or calculate on a custom revenue amount</label>
        <div className="flex gap-2">
          <input type="number" className="input-field flex-1" placeholder="Enter custom revenue..." value={customRevenue} onChange={e=>setCustomRevenue(e.target.value)}/>
          {customRevenue&&<button onClick={()=>setCustomRevenue('')} className="btn-ghost text-xs">Reset</button>}
        </div>
      </div>
    </div>

    {/* Monthly breakdown */}
    {monthly.length>0&&(
      <div className="glass-card-solid p-6">
        <div className="flex items-center gap-2 mb-5"><Calendar size={18} className="text-brand-500"/><h2 className="font-bold text-lg">Last 6 Months — Tax Owed</h2></div>
        {loading?<div className="py-6 text-center"><RefreshCw size={20} className="animate-spin mx-auto text-gray-300"/></div>:
        <div className="space-y-2">
          {monthly.map(m=>{
            const max=Math.max(...monthly.map(x=>x.revenue),1);
            const pct=(m.revenue/max)*100;
            return(
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-20 shrink-0">{m.month}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-lg transition-all" style={{width:`${pct}%`}}/>
                  <span className="absolute inset-0 flex items-center px-3 text-[11px] font-bold text-white mix-blend-difference">{fmt(m.revenue)} {currency}</span>
                </div>
                <span className="text-xs font-bold text-violet-600 w-28 text-right shrink-0">{fmt(m.tax)} tax</span>
              </div>
            );
          })}
        </div>}
      </div>
    )}
  </DashboardLayout>);
}
