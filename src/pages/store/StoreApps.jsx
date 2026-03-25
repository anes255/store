import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreManagement } from '../../hooks/useStore';
import { ownerApi, aiApi } from '../../utils/api';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FileSpreadsheet, ShoppingCart, MessageCircle, Bell, Bot, Shield, Star, Check, X, Send, Sparkles, Zap, Activity, AlertTriangle, Package } from 'lucide-react';

const allApps = [
  { slug:'abandoned-cart', icon:ShoppingCart, name:'Abandoned Cart Recovery', desc:'Track and recover abandoned carts with AI messages.', color:'bg-purple-50 text-purple-600', configKey:'ai_cart_recovery', link:'/dashboard/abandoned' },
  { slug:'whatsapp-recovery', icon:MessageCircle, name:'WhatsApp Recovery Messages', desc:'Send recovery messages via WhatsApp.', color:'bg-green-50 text-green-600', configKey:'ai_cart_recovery' },
  { slug:'whatsapp-status', icon:Bell, name:'Order Status Notifications', desc:'Auto-notify customers on status changes.', color:'bg-blue-50 text-blue-600', configKey:'ai_agent_enabled' },
  { slug:'ai-sales-bot', icon:Bot, name:'AI Customer Chatbot', desc:'AI chatbot on storefront — Arabic, French, English.', color:'bg-brand-50 text-brand-600', configKey:'ai_chatbot_enabled' },
  { slug:'fake-detection', icon:Shield, name:'Fake Order Detection', desc:'AI-powered fraud scoring.', color:'bg-red-50 text-red-600', configKey:'ai_fake_detection' },
  { slug:'smart-reviews', icon:Star, name:'Smart Reviews', desc:'AI-moderated product reviews.', color:'bg-amber-50 text-amber-600', configKey:'smart_reviews' },
  { slug:'google-sheets', icon:FileSpreadsheet, name:'Google Sheets Sync', desc:'Export orders to Google Sheets.', color:'bg-emerald-50 text-emerald-600', configKey:'google_sheets_sync', comingSoon:true },
];

export default function StoreApps() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [installedApps, setInstalledApps] = useState([]);
  const [installing, setInstalling] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  
  // Test panels
  const [testPanel, setTestPanel] = useState(null); // 'chatbot' | 'fake' | 'description' | 'recovery'
  
  // Chatbot test
  const [botMessages, setBotMessages] = useState([]);
  const [botInput, setBotInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  
  // Fake detection test
  const [fakeForm, setFakeForm] = useState({customer_name:'Test Customer',customer_phone:'0555123456',total:'5000',payment_method:'cod'});
  const [fakeResult, setFakeResult] = useState(null);
  const [fakeLoading, setFakeLoading] = useState(false);
  
  // Description test
  const [descName, setDescName] = useState('');
  const [descResult, setDescResult] = useState('');
  const [descLoading, setDescLoading] = useState(false);
  
  // Recovery test
  const [recoveryItems, setRecoveryItems] = useState('Shoes, T-Shirt');
  const [recoveryResult, setRecoveryResult] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

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
      if (app.configKey) {
        const { data: storeData } = await ownerApi.updateStore(currentStore.id, { [app.configKey]: data.is_active });
        setCurrentStore(storeData);
      }
      const r = await api.get(`/manage/stores/${currentStore.id}/apps`);
      setInstalledApps(r.data);
      toast.success(data.is_active ? `${app.name} activated!` : `${app.name} deactivated`);
    } catch { toast.error('Failed'); }
    setInstalling(null);
  };

  // ═══ TEST FUNCTIONS ═══
  const sendTestMessage = async () => {
    if (!botInput.trim()) return;
    const msg = botInput;
    const prev = [...botMessages];
    setBotMessages(p => [...p, { role: 'user', text: msg }]);
    setBotInput('');
    setBotLoading(true);
    try {
      const { data } = await aiApi.testChat({ message: msg, store_name: currentStore?.name || 'Test Store', history: prev });
      setBotMessages(p => [...p, { role: 'bot', text: data.response, model: data.model, debug: data.debug }]);
    } catch (e) {
      setBotMessages(p => [...p, { role: 'bot', text: 'Error: ' + (e.response?.data?.error || e.message), model: 'error' }]);
    }
    setBotLoading(false);
  };

  const testFakeDetection = async () => {
    setFakeLoading(true); setFakeResult(null);
    try {
      const { data } = await aiApi.detectFake({ order: fakeForm, store_id: currentStore?.id });
      setFakeResult(data);
    } catch (e) { setFakeResult({ error: e.response?.data?.error || e.message }); }
    setFakeLoading(false);
  };

  const testDescription = async () => {
    if (!descName.trim()) return toast.error('Enter product name');
    setDescLoading(true); setDescResult('');
    try {
      const { data } = await aiApi.generateDescription({ product_name: descName, category: '', language: 'en' });
      setDescResult(data.description || 'No result');
    } catch (e) { setDescResult('Error: ' + (e.response?.data?.error || e.message)); }
    setDescLoading(false);
  };

  const testRecovery = async () => {
    setRecoveryLoading(true); setRecoveryResult('');
    try {
      const { data } = await aiApi.generateRecovery({ store_name: currentStore?.name || 'Store', items: recoveryItems.split(',').map(s => s.trim()), language: 'ar' });
      setRecoveryResult(data.message || 'No result');
    } catch (e) { setRecoveryResult('Error: ' + (e.response?.data?.error || e.message)); }
    setRecoveryLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">{t('sidebar.apps')}</h1><p className="text-sm text-gray-400 mt-1">Activate AI features and integrations</p></div>
      </div>

      {/* AI Status Bar */}
      {aiStatus && (
        <div className="glass-card-solid p-4 mb-6 flex items-center gap-4 flex-wrap">
          <Activity size={16} className="text-brand-500"/>
          <span className="text-sm font-medium text-gray-700">Services:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.ai ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>AI {aiStatus.ai ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.whatsapp ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>WhatsApp {aiStatus.channels?.whatsapp ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.email ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>Email {aiStatus.channels?.email ? '✓' : '✗'}</span>
        </div>
      )}

      {/* Test Buttons Row */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTestPanel('chatbot')} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-600"><Bot size={14}/>Test Chatbot</button>
        <button onClick={() => setTestPanel('fake')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-600"><Shield size={14}/>Test Fraud Detection</button>
        <button onClick={() => setTestPanel('description')} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-600"><Sparkles size={14}/>Test AI Descriptions</button>
        <button onClick={() => setTestPanel('recovery')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600"><MessageCircle size={14}/>Test Cart Recovery</button>
      </div>

      {/* Apps Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {allApps.map(app => {
          const Icon = app.icon; const installed = isInstalled(app.slug);
          return (
            <div key={app.slug} className={`glass-card-solid p-6 transition-all ${installed ? 'ring-2 ring-brand-400 bg-brand-50/30' : ''} ${app.comingSoon ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shrink-0`}><Icon size={22}/></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{app.name}</h3>
                    {installed && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>}
                    {app.comingSoon && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">SOON</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{app.desc}</p>
                </div>
                <button onClick={() => handleInstall(app)} disabled={installing === app.slug} className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 ${installed ? 'bg-red-50 text-red-600 hover:bg-red-100' : app.comingSoon ? 'bg-gray-100 text-gray-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>
                  {installing === app.slug ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : installed ? 'Disable' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ TEST PANELS ═══ */}
      {testPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setTestPanel(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* ── CHATBOT TEST ── */}
            {testPanel === 'chatbot' && <>
              <div className="p-4 bg-gradient-to-r from-brand-500 to-purple-600 flex items-center justify-between">
                <div className="flex items-center gap-3"><Bot size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">AI Chatbot Test</h3><p className="text-white/60 text-[10px]">Test your store's chatbot</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                {botMessages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Try: "مرحبا" or "shipping" or "payment"</p>}
                {botMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.text}
                      {msg.model && <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>via {msg.model}</p>}
                      {msg.debug && <p className="text-[9px] mt-1 text-red-400">⚠ {msg.debug}</p>}
                    </div>
                  </div>
                ))}
                {botLoading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div></div></div>}
              </div>
              <div className="p-4 border-t flex gap-2">
                <input className="input-field flex-1" placeholder="Type a message..." value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTestMessage()}/>
                <button onClick={sendTestMessage} className="btn-primary px-4"><Send size={16}/></button>
              </div>
            </>}

            {/* ── FAKE ORDER TEST ── */}
            {testPanel === 'fake' && <>
              <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-3"><Shield size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">Fraud Detection Test</h3><p className="text-white/60 text-[10px]">Test order fraud scoring</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="input-label text-xs">Customer Name</label><input className="input-field" value={fakeForm.customer_name} onChange={e => setFakeForm({...fakeForm, customer_name: e.target.value})}/></div>
                  <div><label className="input-label text-xs">Phone</label><input className="input-field" value={fakeForm.customer_phone} onChange={e => setFakeForm({...fakeForm, customer_phone: e.target.value})}/></div>
                  <div><label className="input-label text-xs">Total (DZD)</label><input type="number" className="input-field" value={fakeForm.total} onChange={e => setFakeForm({...fakeForm, total: e.target.value})}/></div>
                  <div><label className="input-label text-xs">Payment</label><select className="input-field" value={fakeForm.payment_method} onChange={e => setFakeForm({...fakeForm, payment_method: e.target.value})}><option value="cod">COD</option><option value="ccp">CCP</option><option value="baridimob">BaridiMob</option></select></div>
                </div>
                <button onClick={testFakeDetection} disabled={fakeLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {fakeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Shield size={16}/>}Analyze Order
                </button>
                {fakeResult && !fakeResult.error && (
                  <div className={`p-4 rounded-xl ${fakeResult.level === 'high' ? 'bg-red-50 border border-red-200' : fakeResult.level === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{fakeResult.score}/100</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${fakeResult.level === 'high' ? 'bg-red-500 text-white' : fakeResult.level === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>{fakeResult.level.toUpperCase()} RISK</span>
                    </div>
                    {fakeResult.flags?.length > 0 && <div className="space-y-1">{fakeResult.flags.map((f, i) => <p key={i} className="text-xs text-gray-600 flex items-center gap-1"><AlertTriangle size={10}/>{f}</p>)}</div>}
                  </div>
                )}
                {fakeResult?.error && <p className="text-sm text-red-500">{fakeResult.error}</p>}
              </div>
            </>}

            {/* ── DESCRIPTION TEST ── */}
            {testPanel === 'description' && <>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-between">
                <div className="flex items-center gap-3"><Sparkles size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">AI Product Descriptions</h3><p className="text-white/60 text-[10px]">Generate descriptions instantly</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="input-label text-xs">Product Name</label><input className="input-field" value={descName} onChange={e => setDescName(e.target.value)} placeholder="e.g. Wireless Bluetooth Headphones"/></div>
                <button onClick={testDescription} disabled={descLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {descLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Sparkles size={16}/>}Generate Description
                </button>
                {descResult && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-700 leading-relaxed">{descResult}</p></div>}
              </div>
            </>}

            {/* ── CART RECOVERY TEST ── */}
            {testPanel === 'recovery' && <>
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
                <div className="flex items-center gap-3"><MessageCircle size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">Cart Recovery Messages</h3><p className="text-white/60 text-[10px]">AI-generated recovery messages</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="input-label text-xs">Abandoned Items (comma-separated)</label><input className="input-field" value={recoveryItems} onChange={e => setRecoveryItems(e.target.value)} placeholder="Shoes, T-Shirt, Watch"/></div>
                <button onClick={testRecovery} disabled={recoveryLoading} className="btn-primary w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600">
                  {recoveryLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <MessageCircle size={16}/>}Generate Recovery Message
                </button>
                {recoveryResult && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{recoveryResult}</p><button onClick={() => {navigator.clipboard.writeText(recoveryResult);toast.success('Copied!');}} className="mt-3 text-xs text-brand-600 font-bold hover:underline">Copy to clipboard</button></div>}
              </div>
            </>}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
