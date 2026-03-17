import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Save, Store, Palette, CreditCard, Truck, Bot, Globe, Image } from 'lucide-react';

export default function StoreSettings() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [settings, setSettings] = useState({});
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (currentStore) setSettings(currentStore); }, [currentStore]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await ownerApi.updateStore(currentStore.id, settings);
      setCurrentStore(data);
      toast.success('Settings saved!');
    } catch (err) { toast.error('Failed to save'); }
    setLoading(false);
  };

  const set = (key) => (e) => setSettings({ ...settings, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const tabs = [
    { key: 'general', icon: Store, label: 'General' },
    { key: 'design', icon: Palette, label: 'Design' },
    { key: 'payment', icon: CreditCard, label: 'Payment' },
    { key: 'shipping', icon: Truck, label: 'Shipping' },
    { key: 'ai', icon: Bot, label: 'AI Features' },
  ];

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
      <span className="font-medium text-sm text-gray-700">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200'} relative`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <input type="checkbox" className="sr-only" checked={checked || false} onChange={onChange} />
    </label>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('sidebar.settings')}</h1>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {t('common.save')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tb => {
          const Icon = tb.icon;
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === tb.key ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              <Icon size={16} />{tb.label}
            </button>
          );
        })}
      </div>

      <div className="glass-card-solid p-6 space-y-5">
        {tab === 'general' && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Store Name</label><input className="input-field" value={settings.name || ''} onChange={set('name')} /></div>
              <div><label className="input-label">Store URL (slug)</label><input className="input-field bg-gray-100" value={settings.slug || ''} disabled /></div>
            </div>
            <div><label className="input-label">Description</label><textarea className="input-field" rows={3} value={settings.description || ''} onChange={set('description')} /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Logo URL</label><input className="input-field" value={settings.logo || ''} onChange={set('logo')} placeholder="https://..." /></div>
              <div><label className="input-label">WhatsApp Number</label><input className="input-field" value={settings.whatsapp_number || ''} onChange={set('whatsapp_number')} placeholder="213XXXXXXXX" /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="input-label">Facebook</label><input className="input-field" value={settings.social_facebook || ''} onChange={set('social_facebook')} /></div>
              <div><label className="input-label">Instagram</label><input className="input-field" value={settings.social_instagram || ''} onChange={set('social_instagram')} /></div>
              <div><label className="input-label">TikTok</label><input className="input-field" value={settings.social_tiktok || ''} onChange={set('social_tiktok')} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Default Language</label>
                <select className="input-field" value={settings.default_language || 'en'} onChange={set('default_language')}>
                  <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
                </select>
              </div>
              <div><label className="input-label">Currency</label><input className="input-field" value={settings.currency || 'DZD'} onChange={set('currency')} /></div>
            </div>
            <Toggle label="Store is Live" checked={settings.is_live} onChange={set('is_live')} />
          </>
        )}

        {tab === 'design' && (
          <>
            <div className="grid grid-cols-5 gap-4">
              {['primary_color', 'secondary_color', 'accent_color', 'bg_color', 'text_color'].map(c => (
                <div key={c}><label className="input-label text-xs">{c.replace(/_/g, ' ')}</label><input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={settings[c] || '#7C3AED'} onChange={set(c)} /></div>
              ))}
            </div>
            <div><label className="input-label">Font Family</label>
              <select className="input-field" value={settings.font_family || ''} onChange={set('font_family')}>
                {['Plus Jakarta Sans', 'DM Sans', 'Inter', 'Poppins', 'Nunito', 'Cairo', 'Tajawal'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div><label className="input-label">Header Style</label>
              <select className="input-field" value={settings.header_style || 'modern'} onChange={set('header_style')}>
                <option value="modern">Modern</option><option value="classic">Classic</option><option value="minimal">Minimal</option>
              </select>
            </div>
            <div><label className="input-label">Footer Text</label><textarea className="input-field" rows={2} value={settings.footer_text || ''} onChange={set('footer_text')} /></div>
          </>
        )}

        {tab === 'payment' && (
          <div className="space-y-4">
            <Toggle label="Cash on Delivery (COD)" checked={settings.enable_cod} onChange={set('enable_cod')} />
            {settings.enable_cod && <Toggle label="COD Available in All 58 Wilayas" checked={settings.cod_all_wilayas} onChange={set('cod_all_wilayas')} />}
            <Toggle label="CCP Direct Transfer" checked={settings.enable_ccp} onChange={set('enable_ccp')} />
            {settings.enable_ccp && (
              <div className="grid md:grid-cols-2 gap-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">CCP Account Number</label><input className="input-field" value={settings.ccp_account || ''} onChange={set('ccp_account')} /></div>
                <div><label className="input-label">CCP Account Name</label><input className="input-field" value={settings.ccp_name || ''} onChange={set('ccp_name')} /></div>
              </div>
            )}
            <Toggle label="BaridiMob QR Payment" checked={settings.enable_baridimob} onChange={set('enable_baridimob')} />
            {settings.enable_baridimob && (
              <div className="pl-4 border-l-2 border-brand-200"><label className="input-label">BaridiMob RIP</label><input className="input-field" value={settings.baridimob_rip || ''} onChange={set('baridimob_rip')} /></div>
            )}
            <Toggle label="Bank Transfer" checked={settings.enable_bank_transfer} onChange={set('enable_bank_transfer')} />
            {settings.enable_bank_transfer && (
              <div className="grid md:grid-cols-3 gap-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">Bank Name</label><input className="input-field" value={settings.bank_name || ''} onChange={set('bank_name')} /></div>
                <div><label className="input-label">Account Number</label><input className="input-field" value={settings.bank_account || ''} onChange={set('bank_account')} /></div>
                <div><label className="input-label">RIB</label><input className="input-field" value={settings.bank_rib || ''} onChange={set('bank_rib')} /></div>
              </div>
            )}
          </div>
        )}

        {tab === 'shipping' && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Default Shipping Price (DZD)</label><input type="number" className="input-field" value={settings.shipping_default_price || ''} onChange={set('shipping_default_price')} /></div>
              <div><label className="input-label">Free Shipping Threshold (DZD)</label><input type="number" className="input-field" value={settings.free_shipping_threshold || ''} onChange={set('free_shipping_threshold')} placeholder="Leave empty to disable" /></div>
            </div>
          </>
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <Toggle label="AI Chatbot" checked={settings.ai_chatbot_enabled} onChange={set('ai_chatbot_enabled')} />
            {settings.ai_chatbot_enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">Bot Name</label><input className="input-field" value={settings.ai_chatbot_name || ''} onChange={set('ai_chatbot_name')} /></div>
                <div><label className="input-label">Greeting Message</label><textarea className="input-field" rows={2} value={settings.ai_chatbot_greeting || ''} onChange={set('ai_chatbot_greeting')} /></div>
                <div><label className="input-label">Bot Personality</label>
                  <select className="input-field" value={settings.ai_chatbot_personality || ''} onChange={set('ai_chatbot_personality')}>
                    <option value="friendly and helpful">Friendly & Helpful</option>
                    <option value="professional and concise">Professional & Concise</option>
                    <option value="robotic and system-like">Robotic / System</option>
                    <option value="casual and fun">Casual & Fun</option>
                  </select>
                </div>
              </div>
            )}
            <Toggle label="AI Fake Order Detection" checked={settings.ai_fake_detection} onChange={set('ai_fake_detection')} />
            <Toggle label="AI Cart Recovery" checked={settings.ai_cart_recovery} onChange={set('ai_cart_recovery')} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
