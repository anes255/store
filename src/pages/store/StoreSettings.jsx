import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Save, Store, Palette, CreditCard, Truck, Bot, Upload, Image, X } from 'lucide-react';

export default function StoreSettings() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [settings, setSettings] = useState({});
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef(null);

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

  // Image upload for logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Not an image'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 400);
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setSettings({ ...settings, logo: base64 });
        toast.success('Logo uploaded!');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { key:'general', icon:Store, label:'General' },
    { key:'design', icon:Palette, label:'Design' },
    { key:'payment', icon:CreditCard, label:'Payment' },
    { key:'shipping', icon:Truck, label:'Shipping' },
    { key:'ai', icon:Bot, label:'AI Features' },
  ];

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
      <span className="font-medium text-sm text-gray-700">{label}</span>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200'} relative`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}/>
      </div>
      <input type="checkbox" className="sr-only" checked={checked || false} onChange={onChange}/>
    </label>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header">{t('sidebar.settings')}</h1>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16}/>} {t('common.save')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tb => { const Icon=tb.icon; return (
          <button key={tb.key} onClick={()=>setTab(tb.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===tb.key?'bg-brand-500 text-white shadow-lg shadow-brand-500/25':'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}><Icon size={16}/>{tb.label}</button>
        );})}
      </div>

      <div className="glass-card-solid p-6 space-y-5">
        {tab==='general' && (
          <>
            {/* Logo upload */}
            <div>
              <label className="input-label">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 transition-colors" onClick={()=>logoInputRef.current?.click()}>
                  {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover"/> : <Upload size={24} className="text-gray-400"/>}
                </div>
                <div>
                  <button onClick={()=>logoInputRef.current?.click()} className="text-sm font-semibold text-brand-600 hover:underline">Upload logo from device</button>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB. Will be resized to 400x400.</p>
                  {settings.logo && <button onClick={()=>setSettings({...settings, logo:null})} className="text-xs text-red-500 hover:underline mt-1">Remove</button>}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload}/>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Store Name</label><input className="input-field" value={settings.name || settings.store_name || ''} onChange={e=>setSettings({...settings, name:e.target.value})}/></div>
              <div><label className="input-label">Store URL (slug)</label><input className="input-field bg-gray-100" value={settings.slug||''} disabled/></div>
            </div>
            <div><label className="input-label">Description</label><textarea className="input-field" rows={3} value={settings.description||''} onChange={set('description')}/></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="input-label">Contact Phone / WhatsApp</label><input className="input-field" value={settings.contact_phone||settings.whatsapp_number||''} onChange={e=>setSettings({...settings, contact_phone:e.target.value})}/></div>
              <div><label className="input-label">Contact Email</label><input className="input-field" value={settings.contact_email||''} onChange={set('contact_email')}/></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="input-label">Facebook</label><input className="input-field" value={settings.social_facebook||''} onChange={set('social_facebook')}/></div>
              <div><label className="input-label">Instagram</label><input className="input-field" value={settings.social_instagram||''} onChange={set('social_instagram')}/></div>
              <div><label className="input-label">TikTok</label><input className="input-field" value={settings.social_tiktok||''} onChange={set('social_tiktok')}/></div>
            </div>
            <div><label className="input-label">Currency</label><input className="input-field" value={settings.currency||'DZD'} onChange={set('currency')}/></div>
            <Toggle label="Store is Live (Published)" checked={settings.is_live || settings.is_published} onChange={e=>setSettings({...settings, is_live:e.target.checked})}/>
          </>
        )}

        {tab==='design' && (
          <>
            <div className="grid grid-cols-4 gap-4">
              {['primary_color','secondary_color','accent_color','bg_color'].map(c=>(
                <div key={c}><label className="input-label text-xs capitalize">{c.replace(/_/g,' ')}</label><input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={settings[c]||'#7C3AED'} onChange={set(c)}/></div>
              ))}
            </div>
            <div><label className="input-label">Hero Title</label><input className="input-field" value={settings.hero_title||''} onChange={set('hero_title')} placeholder="Welcome to our store"/></div>
            <div><label className="input-label">Hero Subtitle</label><textarea className="input-field" rows={2} value={settings.hero_subtitle||''} onChange={set('hero_subtitle')} placeholder="See why our products stand out..."/></div>
            <div><label className="input-label">Meta Title (SEO)</label><input className="input-field" value={settings.meta_title||''} onChange={set('meta_title')}/></div>
            <div><label className="input-label">Meta Description (SEO)</label><textarea className="input-field" rows={2} value={settings.meta_description||''} onChange={set('meta_description')}/></div>
          </>
        )}

        {tab==='payment' && (
          <div className="space-y-4">
            <Toggle label="Cash on Delivery (COD)" checked={settings.enable_cod} onChange={set('enable_cod')}/>
            <Toggle label="CCP Direct Transfer" checked={settings.enable_ccp} onChange={set('enable_ccp')}/>
            {settings.enable_ccp && (
              <div className="grid md:grid-cols-2 gap-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">CCP Account</label><input className="input-field" value={settings.ccp_account||''} onChange={set('ccp_account')}/></div>
                <div><label className="input-label">CCP Name</label><input className="input-field" value={settings.ccp_name||''} onChange={set('ccp_name')}/></div>
              </div>
            )}
            <Toggle label="BaridiMob QR" checked={settings.enable_baridimob} onChange={set('enable_baridimob')}/>
            {settings.enable_baridimob && (
              <div className="pl-4 border-l-2 border-brand-200"><label className="input-label">BaridiMob RIP</label><input className="input-field" value={settings.baridimob_rip||''} onChange={set('baridimob_rip')}/></div>
            )}
            <Toggle label="Bank Transfer" checked={settings.enable_bank_transfer} onChange={set('enable_bank_transfer')}/>
            {settings.enable_bank_transfer && (
              <div className="grid md:grid-cols-3 gap-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">Bank Name</label><input className="input-field" value={settings.bank_name||''} onChange={set('bank_name')}/></div>
                <div><label className="input-label">Account</label><input className="input-field" value={settings.bank_account||''} onChange={set('bank_account')}/></div>
                <div><label className="input-label">RIB</label><input className="input-field" value={settings.bank_rib||''} onChange={set('bank_rib')}/></div>
              </div>
            )}
          </div>
        )}

        {tab==='shipping' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Default shipping cost: <strong>400 DZD</strong>. Manage per-wilaya rates in the Shipping Wilayas section.</p>
          </div>
        )}

        {tab==='ai' && (
          <div className="space-y-4">
            <Toggle label="AI Chatbot" checked={settings.ai_chatbot_enabled} onChange={set('ai_chatbot_enabled')}/>
            {settings.ai_chatbot_enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-brand-200">
                <div><label className="input-label">Bot Name</label><input className="input-field" value={settings.ai_chatbot_name||''} onChange={set('ai_chatbot_name')}/></div>
                <div><label className="input-label">Greeting</label><textarea className="input-field" rows={2} value={settings.ai_chatbot_greeting||''} onChange={set('ai_chatbot_greeting')}/></div>
              </div>
            )}
            <Toggle label="AI Fake Order Detection" checked={settings.ai_fake_detection} onChange={set('ai_fake_detection')}/>
            <Toggle label="AI Cart Recovery" checked={settings.ai_cart_recovery} onChange={set('ai_cart_recovery')}/>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
