import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FileSpreadsheet, ShoppingCart, MessageCircle, Bell, Bot, Shield, Star, Check } from 'lucide-react';

const allApps = [
  { slug:'google-sheets', icon:FileSpreadsheet, name:'Google Sheets Integration', desc:'Effortlessly sync your orders and business data with Google Sheets.', color:'bg-emerald-50 text-emerald-600' },
  { slug:'abandoned-cart', icon:ShoppingCart, name:'Abandoned Cart', desc:'Manage and view abandoned orders to recover lost sales.', color:'bg-purple-50 text-purple-600' },
  { slug:'whatsapp-recovery', icon:MessageCircle, name:'WhatsApp Recovery', desc:'Automatically send WhatsApp messages to recover abandoned carts.', color:'bg-green-50 text-green-600' },
  { slug:'whatsapp-status', icon:Bell, name:'WhatsApp Order Status', desc:'Send automated WhatsApp notifications for every order status change.', color:'bg-blue-50 text-blue-600' },
  { slug:'ai-sales-bot', icon:Bot, name:'AI WhatsApp Sales Bot', desc:'Automatically reply to customer WhatsApp messages using AI.', color:'bg-brand-50 text-brand-600' },
  { slug:'fake-detection', icon:Shield, name:'AI Fake Order Detection', desc:'Analyze phone repetition, IP duplication, and unusual quantities to score order risk.', color:'bg-red-50 text-red-600' },
  { slug:'smart-reviews', icon:Star, name:'Smart Reviews System', desc:'Collect and display product reviews automatically.', color:'bg-amber-50 text-amber-600' },
];

export default function StoreApps() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [installedApps, setInstalledApps] = useState([]);
  const [installing, setInstalling] = useState(null);

  useEffect(() => {
    if (!currentStore?.id) return;
    api.get(`/manage/stores/${currentStore.id}/apps`).then(r => setInstalledApps(r.data)).catch(() => {});
  }, [currentStore?.id]);

  const handleInstall = async (app) => {
    setInstalling(app.slug);
    try {
      const { data } = await api.post(`/manage/stores/${currentStore.id}/apps/install`, { app_name: app.name, app_slug: app.slug });
      // Refresh installed apps
      const r = await api.get(`/manage/stores/${currentStore.id}/apps`);
      setInstalledApps(r.data);
      toast.success(data.is_active ? `${app.name} installed!` : `${app.name} uninstalled`);
    } catch (err) { toast.error('Failed to install app'); }
    setInstalling(null);
  };

  const isInstalled = (slug) => installedApps.some(a => a.app_slug === slug && a.is_active);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-header">{t('apps.title')}</h1>
        <p className="text-gray-500 mt-1">{t('apps.subtitle')}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {allApps.map((app) => {
          const Icon = app.icon;
          const installed = isInstalled(app.slug);
          return (
            <div key={app.slug} className={`glass-card-solid p-6 flex items-start gap-4 hover:shadow-glass-lg transition-all ${installed ? 'ring-2 ring-brand-200' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shrink-0`}><Icon size={22}/></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{app.name}</h3>
                  {installed && <span className="badge badge-success text-[10px] flex items-center gap-1"><Check size={8}/>ACTIVE</span>}
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mb-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>AVAILABLE NOW</span>
                <p className="text-sm text-gray-500">{app.desc}</p>
              </div>
              <button
                onClick={() => handleInstall(app)}
                disabled={installing === app.slug}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  installed ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'border border-gray-200 text-gray-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200'
                }`}
              >
                {installing === app.slug ? '...' : installed ? 'Uninstall' : 'Install'}
              </button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
