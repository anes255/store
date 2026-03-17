import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { FileSpreadsheet, ShoppingCart, MessageCircle, Bell, Bot, Shield, Star, ExternalLink } from 'lucide-react';

const apps = [
  { icon: FileSpreadsheet, name: 'Google Sheets Integration', desc: 'Effortlessly sync your orders and business data with Google Sheets.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: ShoppingCart, name: 'Abandoned Cart', desc: 'Manage and view abandoned orders to recover lost sales.', color: 'bg-purple-50 text-purple-600' },
  { icon: MessageCircle, name: 'WhatsApp Recovery', desc: 'Automatically send WhatsApp messages to recover abandoned carts.', color: 'bg-green-50 text-green-600' },
  { icon: Bell, name: 'WhatsApp Order Status', desc: 'Send automated WhatsApp notifications for every order status change.', color: 'bg-blue-50 text-blue-600' },
  { icon: Bot, name: 'AI WhatsApp Sales Bot', desc: 'Automatically reply to customer WhatsApp messages using AI to handle pricing, products, and shipping queries.', color: 'bg-brand-50 text-brand-600' },
  { icon: Shield, name: 'AI Fake Order Detection', desc: 'Analyze phone repetition, IP duplication, and unusual quantities to score order risk.', color: 'bg-red-50 text-red-600' },
  { icon: Star, name: 'Smart Reviews System', desc: 'Collect and display product reviews automatically.', color: 'bg-amber-50 text-amber-600' },
];

export default function StoreApps() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-header">{t('apps.title')}</h1>
        <p className="text-gray-500 mt-1">{t('apps.subtitle')}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {apps.map((app, i) => {
          const Icon = app.icon;
          return (
            <div key={i} className="glass-card-solid p-6 flex items-start gap-4 hover:shadow-glass-lg transition-all">
              <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">{app.name}</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />AVAILABLE NOW</span>
                </div>
                <p className="text-sm text-gray-500">{app.desc}</p>
              </div>
              <button className="shrink-0 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Install
              </button>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
