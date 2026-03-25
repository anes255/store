import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreManagement } from '../../hooks/useStore';
import { ownerApi, aiApi } from '../../utils/api';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FileSpreadsheet, ShoppingCart, MessageCircle, Bell, Bot, Shield, Star, Check, X, Send, Sparkles, Zap, Activity } from 'lucide-react';

const allApps = [
  { slug:'abandoned-cart', icon:ShoppingCart, name:'Abandoned Cart Recovery', desc:'Track and recover abandoned carts automatically.', color:'bg-purple-50 text-purple-600', configKey:'ai_cart_recovery', link:'/dashboard/abandoned' },
  { slug:'whatsapp-recovery', icon:MessageCircle, name:'WhatsApp Recovery Messages', desc:'Send recovery messages via WhatsApp to customers who left their cart.', color:'bg-green-50 text-green-600', configKey:'ai_cart_recovery' },
  { slug:'whatsapp-status', icon:Bell, name:'Order Status Notifications', desc:'Automatically notify customers when order status changes (confirmed, shipped, delivered).', color:'bg-blue-50 text-blue-600', configKey:'ai_agent_enabled' },
  { slug:'ai-sales-bot', icon:Bot, name:'AI Customer Chatbot', desc:'AI-powered chatbot on your storefront that answers customer questions in Arabic, French, and English.', color:'bg-brand-50 text-brand-600', configKey:'ai_chatbot_enabled' },
  { slug:'fake-detection', icon:Shield, name:'Fake Order Detection', desc:'AI-powered fraud scoring that analyzes customer history and order patterns.', color:'bg-red-50 text-red-600', configKey:'ai_fake_detection' },
  { slug:'google-sheets', icon:FileSpreadsheet, name:'Google Sheets Sync', desc:'Export orders and customer data to Google Sheets automatically.', color:'bg-emerald-50 text-emerald-600', configKey:'google_sheets_sync', comingSoon:true },
  { slug:'smart-reviews', icon:Star, name:'Smart Reviews', desc:'Collect and display product reviews with AI moderation.', color:'bg-amber-50 text-amber-600', configKey:'smart_reviews', comingSoon:true },
];

export default function StoreApps() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [installedApps, setInstalledApps] = useState([]);
  const [installing, setInstalling] = useState(null);
  const [showTestBot, setShowTestBot] = useState(false);
  const [botMessages, setBotMessages] = useState([]);
  const [botInput, setBotInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    if (!currentStore?.id) return;
    api.get(`/manage/stores/${currentStore.id}/apps`).then(r => setInstalledApps(r.data)).catch(() => {});
    aiApi.messagingStatus().then(r => setAiStatus(r.data)).catch(() => {});
  }, [currentStore?.id]);

  const isInstalled = (slug) => installedApps.some(a => a.app_slug === slug && a.is_active);

  const handleInstall = async (app) => {
    if (app.comingSoon) return toast('Coming soon!');
    setInstalling(app.slug);
    try {
      const { data } = await api.post(`/manage/stores/${currentStore.id}/apps/install`, { app_name: app.name, app_slug: app.slug });
      // Also toggle the config key
      if (app.configKey) {
        const newVal = data.is_active;
        const updateData = { [app.configKey]: newVal };
        const { data: storeData } = await ownerApi.updateStore(currentStore.id, updateData);
        setCurrentStore(storeData);
      }
      const r = await api.get(`/manage/stores/${currentStore.id}/apps`);
      setInstalledApps(r.data);
      toast.success(data.is_active ? `${app.name} activated!` : `${app.name} deactivated`);
    } catch { toast.error('Failed'); }
    setInstalling(null);
  };

  // Test bot
  const sendTestMessage = async () => {
    if (!botInput.trim()) return;
    const msg = botInput;
    setBotMessages(prev => [...prev, { role: 'user', text: msg }]);
    setBotInput('');
    setBotLoading(true);
    try {
      const { data } = await aiApi.testChat({ message: msg, store_name: currentStore?.name || 'Test Store' });
      setBotMessages(prev => [...prev, { role: 'bot', text: data.response, model: data.model }]);
    } catch (e) {
      setBotMessages(prev => [...prev, { role: 'bot', text: 'Error: ' + (e.response?.data?.error || e.message), model: 'error' }]);
    }
    setBotLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">{t('sidebar.apps')}</h1><p className="text-sm text-gray-400 mt-1">Activate features for your store</p></div>
        <button onClick={() => setShowTestBot(true)} className="btn-primary text-sm flex items-center gap-2"><Bot size={16}/>Test AI Bot</button>
      </div>

      {/* AI Status */}
      {aiStatus && (
        <div className="glass-card-solid p-4 mb-6 flex items-center gap-4">
          <Activity size={16} className="text-brand-500"/>
          <span className="text-sm font-medium text-gray-700">Services:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.ai ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>AI {aiStatus.ai ? '✓ Connected' : '✗ Offline'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.whatsapp ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>WhatsApp {aiStatus.channels?.whatsapp ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.sms ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>SMS {aiStatus.channels?.sms ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.email ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>Email {aiStatus.channels?.email ? '✓' : '✗'}</span>
        </div>
      )}

      {/* Apps Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {allApps.map(app => {
          const Icon = app.icon;
          const installed = isInstalled(app.slug);
          return (
            <div key={app.slug} className={`glass-card-solid p-6 transition-all ${installed ? 'ring-2 ring-brand-400 bg-brand-50/30' : ''} ${app.comingSoon ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shrink-0`}><Icon size={22}/></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{app.name}</h3>
                    {installed && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>}
                    {app.comingSoon && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">COMING SOON</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{app.desc}</p>
                </div>
                <button onClick={() => handleInstall(app)} disabled={installing === app.slug} className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all ${installed ? 'bg-red-50 text-red-600 hover:bg-red-100' : app.comingSoon ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>
                  {installing === app.slug ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : installed ? 'Disable' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Bot Modal */}
      {showTestBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowTestBot(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gradient-to-r from-brand-500 to-purple-600 flex items-center justify-between">
              <div className="flex items-center gap-3"><Bot size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">AI Bot Test Panel</h3><p className="text-white/60 text-[10px]">Test your store's chatbot</p></div></div>
              <button onClick={() => setShowTestBot(false)} className="text-white/60 hover:text-white"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {botMessages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Send a message to test the AI bot.<br/>Try: "مرحبا", "shipping rates", "payment methods"</p>}
              {botMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.text}
                    {msg.model && <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>via {msg.model}</p>}
                  </div>
                </div>
              ))}
              {botLoading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div></div></div>}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input className="input-field flex-1" placeholder="Type a test message..." value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTestMessage()}/>
              <button onClick={sendTestMessage} className="btn-primary px-4"><Send size={16}/></button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
