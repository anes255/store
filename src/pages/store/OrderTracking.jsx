import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { useStoreManagement } from '../../hooks/useStore';
import { ownerApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { Save, Search, Clock, Package, Phone, Hash, Settings as SettingsIcon, Power } from 'lucide-react';

// Inline toggle switch for a single boolean setting.
const Toggle = ({ label, desc, checked, onChange }) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
    <div>
      <p className="font-medium text-sm">{label}</p>
      {desc && <p className="text-xs text-gray-400">{desc}</p>}
    </div>
    <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-300'} relative shrink-0`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}/>
    </div>
    <input type="checkbox" className="sr-only" checked={checked || false} onChange={onChange}/>
  </label>
);

export default function OrderTracking() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [s, setS] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    setS({
      tracking_enabled: currentStore.tracking_enabled !== false,
      tracking_search_method: currentStore.tracking_search_method || 'phone', // 'phone' | 'order_id' | 'both'
      tracking_hero_title: currentStore.tracking_hero_title || t('orderTrack.heroDefault', 'Track Your Order'),
      tracking_hero_sub: currentStore.tracking_hero_sub || t('orderTrack.subDefault', 'Enter your phone number or order ID to see the status of your orders.'),
      tracking_show_price: currentStore.tracking_show_price !== false,
      tracking_show_items: currentStore.tracking_show_items !== false,
      tracking_show_timeline: currentStore.tracking_show_timeline !== false,
      tracking_show_address: currentStore.tracking_show_address !== false,
      tracking_show_payment: currentStore.tracking_show_payment !== false,
      tracking_show_tracking_number: currentStore.tracking_show_tracking_number !== false,
    });
  }, [currentStore?.id]);

  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await ownerApi.updateStore(currentStore.id, s);
      setCurrentStore(data);
      toast.success(t('orderTrack.saved', 'Saved!'));
    } catch {
      toast.error(t('orderTrack.failed', 'Failed'));
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <span className="badge bg-brand-100 text-brand-600 text-[10px] mb-2">{t('orderTrack.badge', 'STOREFRONT')}</span>
          <h1 className="text-2xl font-bold">{t('orderTrack.title', 'Order Tracking Settings')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('orderTrack.subtitle', 'Configure the public order-tracking experience for your customers')}</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
          <Save size={16}/>{saving ? t('orderTrack.saving', 'Saving...') : t('common.save', 'Save')}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Power size={16} className="text-brand-500"/>{t('orderTrack.general', 'General')}</h3>
          <Toggle
            label={t('orderTrack.enable', 'Enable Order Tracking')}
            desc={t('orderTrack.enableDesc', 'When off, the Track Order page and the storefront button are hidden from customers')}
            checked={s.tracking_enabled}
            onChange={e => set('tracking_enabled', e.target.checked)}
          />
          <div>
            <label className="input-label text-xs">{t('orderTrack.heroTitle', 'Hero Title')}</label>
            <input className="input-field" value={s.tracking_hero_title || ''} onChange={e => set('tracking_hero_title', e.target.value)}/>
          </div>
          <div>
            <label className="input-label text-xs">{t('orderTrack.subtitleField', 'Subtitle')}</label>
            <input className="input-field" value={s.tracking_hero_sub || ''} onChange={e => set('tracking_hero_sub', e.target.value)}/>
          </div>
        </div>

        {/* Search logic */}
        <div className="glass-card-solid p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Search size={16} className="text-purple-500"/>{t('orderTrack.searchLogic', 'Search Logic')}</h3>
          <p className="text-xs text-gray-400">{t('orderTrack.searchLogicDesc', 'Choose how customers look up their orders on the public tracking page.')}</p>
          <div className="space-y-2">
            {[
              { key: 'phone',    icon: Phone, label: t('orderTrack.searchPhone',  'By Phone Number'), desc: t('orderTrack.searchPhoneDesc',  'Lookup by the Algerian mobile number used at checkout') },
              { key: 'order_id', icon: Hash,  label: t('orderTrack.searchOrder',  'By Order ID'),     desc: t('orderTrack.searchOrderDesc',  'Customer enters the order number (e.g. ORD-00123)') },
              { key: 'both',     icon: SettingsIcon, label: t('orderTrack.searchBoth', 'Both (Phone or Order ID)'), desc: t('orderTrack.searchBothDesc', 'Customer chooses either method — recommended') },
            ].map(opt => {
              const Icon = opt.icon;
              const selected = (s.tracking_search_method || 'phone') === opt.key;
              return (
                <label key={opt.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="tracking_search_method" value={opt.key} checked={selected} onChange={() => set('tracking_search_method', opt.key)} className="sr-only"/>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Icon size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${selected ? 'text-brand-600' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Display */}
        <div className="glass-card-solid p-6 space-y-4 lg:col-span-2">
          <h3 className="font-bold flex items-center gap-2"><Package size={16} className="text-amber-500"/>{t('orderTrack.display', 'Display Options')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Toggle label={t('orderTrack.showPrice','Show Price')}        desc={t('orderTrack.showPriceDesc','Order total is visible on tracking results')}   checked={s.tracking_show_price}           onChange={e => set('tracking_show_price', e.target.checked)}/>
            <Toggle label={t('orderTrack.showItems','Show Items')}        desc={t('orderTrack.showItemsDesc','Show product images and quantities')}        checked={s.tracking_show_items}           onChange={e => set('tracking_show_items', e.target.checked)}/>
            <Toggle label={t('orderTrack.showTimeline','Show Timeline')}  desc={t('orderTrack.showTimelineDesc','Visual step-by-step status timeline')}    checked={s.tracking_show_timeline}        onChange={e => set('tracking_show_timeline', e.target.checked)}/>
            <Toggle label={t('orderTrack.showAddress','Show Address')}    desc={t('orderTrack.showAddressDesc','Display the shipping address')}            checked={s.tracking_show_address}         onChange={e => set('tracking_show_address', e.target.checked)}/>
            <Toggle label={t('orderTrack.showPayment','Show Payment')}    desc={t('orderTrack.showPaymentDesc','Display chosen payment method')}           checked={s.tracking_show_payment}         onChange={e => set('tracking_show_payment', e.target.checked)}/>
            <Toggle label={t('orderTrack.showTN','Show Tracking Number')} desc={t('orderTrack.showTNDesc','Display the courier tracking number (if set)')} checked={s.tracking_show_tracking_number} onChange={e => set('tracking_show_tracking_number', e.target.checked)}/>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
