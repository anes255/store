import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreManagement } from '../../hooks/useStore';
import { ownerApi, aiApi } from '../../utils/api';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import api, { getPlatformInfo } from '../../utils/api';
import { FileSpreadsheet, ShoppingCart, MessageCircle, Bell, Bot, Shield, Star, Check, X, Send, Sparkles, Zap, Activity, AlertTriangle, Package, Smartphone, Mail, Wifi, WifiOff, QrCode, RefreshCw, LogOut } from 'lucide-react';

function WhatsAppQR({ storeId }) {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [connectError, setConnectError] = React.useState(null);
  const [tab, setTab] = React.useState('connection'); // connection, templates, log
  const [testPhone, setTestPhone] = React.useState('');
  const [testMsg, setTestMsg] = React.useState(t('storePage.waTestMsgDefault','Hello! This is a test from your store.'));
  const [sendResult, setSendResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [log, setLog] = React.useState({ messages: [], stats: { total: '0', sent: '0', failed: '0' } });
  const [templates, setTemplates] = React.useState({
    confirmed: 'Your order {order} from {store} has been confirmed! Total: {total} DZD',
    preparing: 'Your order {order} from {store} is being prepared!',
    shipped: 'Your order {order} from {store} has been shipped! You will receive it soon.',
    delivered: 'Your order {order} from {store} has been delivered! Thank you for shopping with us.',
    cancelled: 'Your order {order} from {store} has been cancelled.',
  });

  const checkStatus = async () => {
    if (!storeId) return;
    try { const { data } = await aiApi.waQrStatus(storeId); setStatus(data); if(data.qr || data.connected) setLoading(false); } catch { setStatus({ status: 'not_started', connected: false }); }
  };

  const loadLog = async () => {
    if (!storeId) return;
    try { const { data } = await aiApi.waQrLog(storeId); setLog(data); } catch {}
  };

  React.useEffect(() => {
    checkStatus();
    const i = setInterval(checkStatus, 2000);
    return () => clearInterval(i);
  }, [storeId]);

  React.useEffect(() => { if (tab === 'log') loadLog(); }, [tab]);

  const startConnection = async () => {
    setLoading(true); setConnectError(null);
    try { 
      const { data } = await aiApi.waQrStart(storeId);
      // Start response may already contain QR
      if (data.qr || data.connected) { setStatus(data); setLoading(false); return; }
      // Otherwise poll for a bit more
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const { data: s } = await aiApi.waQrStatus(storeId);
          setStatus(s);
          if (s.qr || s.connected) { setLoading(false); return; }
        } catch {}
      }
      setConnectError(t('storePage.qrTakingWhile','QR is taking a while. Click Generate QR Code again.'));
    } catch (e) { setConnectError(e.response?.data?.error || e.message); }
    setLoading(false);
  };

  const disconnect = async () => {
    try { await aiApi.waQrDisconnect(storeId); setStatus({ status: 'disconnected', connected: false }); } catch {}
  };

  const testSend = async () => {
    if (!testPhone) return;
    setSending(true); setSendResult(null);
    try {
      await aiApi.waQrSend({ storeId, phone: testPhone, message: testMsg });
      setSendResult({ success: true });
    } catch (e) { setSendResult({ success: false, error: e.response?.data?.reason || e.response?.data?.error || e.message }); }
    setSending(false);
  };

  const rate = log.stats.total > 0 ? Math.round((parseInt(log.stats.sent) / parseInt(log.stats.total)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[{k:'connection',l:t('storePage.connection','Connection')},{k:'templates',l:t('storePage.templates','Templates')},{k:'log',l:t('storePage.messageLog','Message Log')}].map(tb=>(
          <button key={tb.k} onClick={()=>setTab(tb.k)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===tb.k?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{tb.l}</button>
        ))}
      </div>

      {/* Connection Tab */}
      {tab === 'connection' && <>
        <div className={`flex items-center gap-3 p-4 rounded-xl ${status?.connected ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          {status?.connected ? <Wifi size={20} className="text-emerald-500"/> : <WifiOff size={20} className="text-gray-400"/>}
          <div className="flex-1">
            <p className={`font-bold text-sm ${status?.connected ? 'text-emerald-700' : 'text-gray-600'}`}>{status?.connected ? t('storePage.connected','Connected') : status?.status === 'waiting_qr' ? t('storePage.waitingScan','Waiting for scan...') : t('storePage.notConnected','Not Connected')}</p>
            {status?.connected && <p className="text-xs text-emerald-600">+{status.phone} {status.name ? `(${status.name})` : ''}</p>}
          </div>
          {status?.connected && <button onClick={disconnect} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-1"><LogOut size={12}/>{t('storePage.disconnect','Disconnect')}</button>}
        </div>

        {!status?.connected && (
          <>
            {status?.qr ? (
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700 mb-3">{t('storePage.scanWithWhatsApp','Scan with WhatsApp')}</p>
                <div className="inline-block p-3 bg-white rounded-2xl shadow-lg border"><img src={status.qr} alt="QR" className="w-56 h-56"/></div>
                <p className="text-xs text-gray-400 mt-3">{t('storePage.waLinkedDevicesHint','WhatsApp → Settings → Linked Devices → Link a Device')}</p>
                <button onClick={startConnection} className="mt-3 text-xs text-green-600 font-bold hover:underline flex items-center gap-1 mx-auto"><RefreshCw size={12}/>{t('storePage.refreshQr','Refresh QR')}</button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><QrCode size={32} className="text-green-500"/></div>
                <p className="text-sm font-bold text-gray-700 mb-1">{t('storePage.connectYourWhatsApp','Connect your WhatsApp')}</p>
                <p className="text-xs text-gray-400 mb-5">{t('storePage.scanQrToSendUpdates','Scan a QR code to send order updates from your number')}</p>
                <button onClick={startConnection} disabled={loading} className="px-8 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 mx-auto">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('storePage.connecting','Connecting...')}</> : <><QrCode size={16}/>{t('storePage.generateQr','Generate QR Code')}</>}
                </button>
                {connectError && <div className="mt-4 p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-600 font-medium">{connectError}</p></div>}
              </div>
            )}
          </>
        )}

        {status?.connected && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase">{t('storePage.sendTestMessage','Send Test Message')}</p>
            <input className="input-field" value={testPhone} onChange={e => setTestPhone(e.target.value.replace(/[^\d]/g, ''))} placeholder="0555123456"/>
            <textarea className="input-field" rows={2} value={testMsg} onChange={e => setTestMsg(e.target.value)}/>
            <button onClick={testSend} disabled={sending} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2">
              {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={14}/>}{t('storePage.sendTest','Send Test')}
            </button>
            {sendResult && <div className={`p-3 rounded-xl ${sendResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${sendResult.success ? 'text-emerald-700' : 'text-red-700'}`}>{sendResult.success ? t('storePage.messageSent','Message sent!') : sendResult.error}</p>
            </div>}
          </div>
        )}
      </>}

      {/* Templates Tab */}
      {tab === 'templates' && <>
        <p className="text-xs text-gray-500">{t('storePage.customizeMessages','Customize the messages sent to customers. Use')} <span className="font-mono bg-gray-100 px-1 rounded">{'{order}'}</span> <span className="font-mono bg-gray-100 px-1 rounded">{'{store}'}</span> <span className="font-mono bg-gray-100 px-1 rounded">{'{total}'}</span> as placeholders.</p>
        {Object.entries(templates).map(([key, val]) => (
          <div key={key}>
            <label className="input-label text-xs capitalize flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${key==='confirmed'?'bg-blue-500':key==='preparing'?'bg-purple-500':key==='shipped'?'bg-cyan-500':key==='delivered'?'bg-emerald-500':'bg-red-500'}`}/>
              {key}
            </label>
            <textarea className="input-field text-sm" rows={2} value={val} onChange={e => setTemplates({...templates, [key]: e.target.value})}/>
          </div>
        ))}
        <button className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700" onClick={() => { localStorage.setItem('wa_templates_'+storeId, JSON.stringify(templates)); toast.success(t('storePage.templatesSaved','Templates saved!')); }}>{t('storePage.saveTemplates','Save Templates')}</button>
      </>}

      {/* Log Tab */}
      {tab === 'log' && <>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-gray-800">{log.stats.total}</p><p className="text-[10px] text-gray-400 font-bold">{t('storePage.total','TOTAL')}</p></div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-emerald-600">{log.stats.sent}</p><p className="text-[10px] text-emerald-500 font-bold">{t('storePage.sent','SENT')}</p></div>
          <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-red-600">{log.stats.failed}</p><p className="text-[10px] text-red-500 font-bold">{t('storePage.failedUpper','FAILED')}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width:`${rate}%`}}/></div>
          <span className="text-xs font-bold text-gray-500">{rate}% {t('storePage.success','success')}</span>
        </div>
        <button onClick={loadLog} className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={12}/>{t('storePage.refresh','Refresh')}</button>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {log.messages.length === 0 && <p className="text-xs text-gray-400 text-center py-4">{t('storePage.noMessagesYet','No messages sent yet')}</p>}
          {log.messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-xl text-xs ${m.status === 'sent' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-700">{m.recipient}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.status === 'sent' ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>{m.status.toUpperCase()}</span>
              </div>
              <p className="text-gray-500 truncate">{m.message}</p>
              {m.error && <p className="text-red-500 mt-1">{m.error}</p>}
              <p className="text-gray-300 mt-1">{new Date(m.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}


const getAllApps = (t) => [
  { slug:'abandoned-cart', icon:ShoppingCart, name:t('storePage.app.abandonedCart.name','Abandoned Cart Recovery'), desc:t('storePage.app.abandonedCart.desc','Track and recover abandoned carts with AI messages.'), color:'bg-purple-50 text-purple-600', configKey:'ai_cart_recovery', link:'/dashboard/abandoned' },
  { slug:'whatsapp-recovery', icon:MessageCircle, name:t('storePage.app.whatsappRecovery.name','WhatsApp Recovery Messages'), desc:t('storePage.app.whatsappRecovery.desc','Send recovery messages via WhatsApp.'), color:'bg-green-50 text-green-600', configKey:'ai_cart_recovery' },
  { slug:'whatsapp-status', icon:Bell, name:t('storePage.app.whatsappStatus.name','Order Status Notifications'), desc:t('storePage.app.whatsappStatus.desc','Auto-notify customers on status changes.'), color:'bg-blue-50 text-blue-600', configKey:'ai_agent_enabled' },
  { slug:'ai-sales-bot', icon:Bot, name:t('storePage.app.aiSalesBot.name','AI Customer Chatbot'), desc:t('storePage.app.aiSalesBot.desc','AI chatbot on storefront — Arabic, French, English.'), color:'bg-brand-50 text-brand-600', configKey:'ai_chatbot_enabled' },
  { slug:'fake-detection', icon:Shield, name:t('storePage.app.fakeDetection.name','Fake Order Detection'), desc:t('storePage.app.fakeDetection.desc','AI-powered fraud scoring.'), color:'bg-red-50 text-red-600', configKey:'ai_fake_detection' },
  { slug:'smart-reviews', icon:Star, name:t('storePage.app.smartReviews.name','Smart Reviews'), desc:t('storePage.app.smartReviews.desc','AI-moderated product reviews.'), color:'bg-amber-50 text-amber-600', configKey:'smart_reviews' },
  { slug:'google-sheets', icon:FileSpreadsheet, name:t('storePage.app.googleSheets.name','Google Sheets Sync'), desc:t('storePage.app.googleSheets.desc','Export orders to Google Sheets.'), color:'bg-emerald-50 text-emerald-600', configKey:'google_sheets_sync' },
];

export default function StoreApps() {
  const { t } = useTranslation();
  const allApps = getAllApps(t);
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [installedApps, setInstalledApps] = useState([]);
  const [installing, setInstalling] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  
  // Test panels
  const [testPanel, setTestPanel] = useState(null); // 'chatbot' | 'fake' | 'description' | 'recovery' | 'whatsapp'
  
  // Chatbot test
  const [botMessages, setBotMessages] = useState([]);
  const [botInput, setBotInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const botScrollRef = React.useRef(null);
  
  // Auto-scroll bot messages
  React.useEffect(() => { if(botScrollRef.current) botScrollRef.current.scrollTop = botScrollRef.current.scrollHeight; }, [botMessages, botLoading]);
  
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
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState(t('storePage.waTestMsg','Hello! This is a test message from your store.'));
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(t('storePage.emailSubjectDefault','Test from your store'));
  const [emailBody, setEmailBody] = useState(t('storePage.emailBodyDefault','This is a test email from your store dashboard.'));
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (!currentStore?.id) return;
    api.get(`/manage/stores/${currentStore.id}/apps`).then(r => setInstalledApps(r.data)).catch(() => {});
    aiApi.messagingStatus().then(r => setAiStatus(r.data)).catch(() => {});
  }, [currentStore?.id]);

  const isInstalled = (slug) => installedApps.some(a => a.app_slug === slug && a.is_active);

  const handleInstall = async (app) => {
    if (app.comingSoon) return toast(t('storePage.comingSoon','Coming soon!'));
    setInstalling(app.slug);
    try {
      const { data } = await api.post(`/manage/stores/${currentStore.id}/apps/install`, { app_name: app.name, app_slug: app.slug });
      if (app.configKey) {
        const { data: storeData } = await ownerApi.updateStore(currentStore.id, { [app.configKey]: data.is_active });
        setCurrentStore(storeData);
      }
      const r = await api.get(`/manage/stores/${currentStore.id}/apps`);
      setInstalledApps(r.data);
      toast.success(data.is_active ? `${app.name} ${t('storePage.activated','activated!')}` : `${app.name} ${t('storePage.deactivated','deactivated')}`);
    } catch { toast.error(t('storePage.failed','Failed')); }
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
    // Detect language
    const hasArabic = /[\u0600-\u06FF]/.test(msg);
    const hasFrench = /[àâéèêëïîôùûüÿçœæ]|(?:^|\s)(je|tu|il|nous|vous|bonjour|merci|comment)(?:\s|$)/i.test(msg);
    const lang = hasArabic ? 'ar' : hasFrench ? 'fr' : 'en';
    try {
      const { data } = await aiApi.testChat({ message: msg, store_name: currentStore?.name || 'Test Store', history: prev, language: lang });
      setBotMessages(p => [...p, { role: 'bot', text: data.response, model: data.model, debug: data.debug }]);
    } catch (e) {
      setBotMessages(p => [...p, { role: 'bot', text: t('storePage.errorPrefix','Error: ') + (e.response?.data?.error || e.message), model: 'error' }]);
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
    if (!descName.trim()) return toast.error(t('storePage.enterProductName','Enter product name'));
    setDescLoading(true); setDescResult('');
    try {
      const { data } = await aiApi.generateDescription({ product_name: descName, category: '', language: 'en' });
      setDescResult(data.description || t('storePage.noResult','No result'));
    } catch (e) { setDescResult(t('storePage.errorPrefix','Error: ') + (e.response?.data?.error || e.message)); }
    setDescLoading(false);
  };

  const testRecovery = async () => {
    setRecoveryLoading(true); setRecoveryResult('');
    try {
      const { data } = await aiApi.generateRecovery({ store_name: currentStore?.name || 'Store', items: recoveryItems.split(',').map(s => s.trim()), language: 'ar' });
      setRecoveryResult(data.message || t('storePage.noResult','No result'));
    } catch (e) { setRecoveryResult(t('storePage.errorPrefix','Error: ') + (e.response?.data?.error || e.message)); }
    setRecoveryLoading(false);
  };

  const testWhatsApp = async () => {
    if (!waPhone.trim()) return toast.error(t('storePage.enterPhone','Enter a phone number'));
    setWaSending(true); setWaResult(null);
    try {
      const { data } = await aiApi.whatsappTest({ phone: waPhone.trim(), message: waMessage });
      if(data.success) { setWaResult({ success: true, detail: `${t('storePage.sentTo','Sent to')} ${data.sent_to}` }); toast.success(t('storePage.messageSent','Message sent!')); }
      else {
        const err = data.raw_response?.error?.message || t('storePage.unknownError','Unknown error');
        const code = data.raw_response?.error?.code || '';
        setWaResult({ success: false, error: `${err}${code ? ' (code '+code+')' : ''}`, sent_to: data.sent_to });
      }
    } catch (e) { setWaResult({ success: false, error: e.response?.data?.error || e.message }); }
    setWaSending(false);
  };

  const testEmail = async () => {
    if (!emailTo.trim()) return toast.error(t('storePage.enterEmail','Enter an email address'));
    setEmailSending(true); setEmailResult(null);
    try {
      const { data } = await aiApi.testSend({ channel: 'EMAIL', email: emailTo.trim(), message: emailBody, subject: emailSubject });
      const r = data.email || {};
      if (r.success === false) { setEmailResult({ success: false, error: r.reason || t('storePage.failed','Failed') }); }
      else { setEmailResult({ success: true }); toast.success(t('storePage.emailSent','Email sent!')); }
    } catch (e) { setEmailResult({ success: false, error: e.response?.data?.error || e.message }); }
    setEmailSending(false);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">{t('sidebar.apps')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.activateAiFeatures','Activate AI features and integrations')}</p></div>
      </div>

      {/* AI Status Bar */}
      {aiStatus && (
        <div className="glass-card-solid p-4 mb-6 flex items-center gap-4 flex-wrap">
          <Activity size={16} className="text-brand-500"/>
          <span className="text-sm font-medium text-gray-700">{t('storePage.services','Services:')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.ai ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{t('storePage.ai','AI')} {aiStatus.ai ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.whatsapp ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{t('storePage.whatsapp','WhatsApp')} {aiStatus.channels?.whatsapp ? '✓' : '✗'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aiStatus.channels?.email ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{t('storePage.email','Email')} {aiStatus.channels?.email ? '✓' : '✗'}</span>
        </div>
      )}

      {/* Test Buttons Row */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTestPanel('chatbot')} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-600"><Bot size={14}/>{t('storePage.testChatbot','Test Chatbot')}</button>
        <button onClick={() => setTestPanel('fake')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-600"><Shield size={14}/>{t('storePage.testFraud','Test Fraud Detection')}</button>
        <button onClick={() => setTestPanel('description')} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-600"><Sparkles size={14}/>{t('storePage.testAiDesc','Test AI Descriptions')}</button>
        <button onClick={() => setTestPanel('recovery')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600"><MessageCircle size={14}/>{t('storePage.testCartRecovery','Test Cart Recovery')}</button>
        <button onClick={() => setTestPanel('whatsapp')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700"><Smartphone size={14}/>{t('storePage.testWhatsApp','Test WhatsApp')}</button>
        <button onClick={() => setTestPanel('email')} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600"><Mail size={14}/>{t('storePage.testEmail','Test Email')}</button>
        <button onClick={() => setTestPanel('sheets')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700"><FileSpreadsheet size={14}/>{t('storePage.googleSheets','Google Sheets')}</button>
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
                    {installed && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">{t('storePage.active','ACTIVE')}</span>}
                    {app.comingSoon && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">{t('storePage.soon','SOON')}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{app.desc}</p>
                </div>
                <button onClick={() => handleInstall(app)} disabled={installing === app.slug} className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 ${installed ? 'bg-red-50 text-red-600 hover:bg-red-100' : app.comingSoon ? 'bg-gray-100 text-gray-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>
                  {installing === app.slug ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : installed ? t('storePage.disable','Disable') : t('storePage.activate','Activate')}
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
                <div className="flex items-center gap-3"><Bot size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.aiChatbotTest','AI Chatbot Test')}</h3><p className="text-white/60 text-[10px]">{t('storePage.testYourChatbot',"Test your store's chatbot")}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div ref={botScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                {botMessages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">{t('storePage.botTryHint','Try: "مرحبا" or "shipping" or "payment"')}</p>}
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
                <input className="input-field flex-1" placeholder={t('storePage.typeMessage','Type a message...')} value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTestMessage()}/>
                <button onClick={sendTestMessage} className="btn-primary px-4"><Send size={16}/></button>
              </div>
            </>}

            {/* ── FAKE ORDER TEST ── */}
            {testPanel === 'fake' && <>
              <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-3"><Shield size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.fraudDetectionTest','Fraud Detection Test')}</h3><p className="text-white/60 text-[10px]">{t('storePage.testFraudScoring','Test order fraud scoring')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="input-label text-xs">{t('storePage.customerName','Customer Name')}</label><input className="input-field" value={fakeForm.customer_name} onChange={e => setFakeForm({...fakeForm, customer_name: e.target.value})}/></div>
                  <div><label className="input-label text-xs">{t('storePage.phone','Phone')}</label><input className="input-field" value={fakeForm.customer_phone} onChange={e => setFakeForm({...fakeForm, customer_phone: e.target.value})}/></div>
                  <div><label className="input-label text-xs">{t('storePage.totalDzd','Total (DZD)')}</label><input type="number" className="input-field" value={fakeForm.total} onChange={e => setFakeForm({...fakeForm, total: e.target.value})}/></div>
                  <div><label className="input-label text-xs">{t('storePage.payment','Payment')}</label><select className="input-field" value={fakeForm.payment_method} onChange={e => setFakeForm({...fakeForm, payment_method: e.target.value})}><option value="cod">COD</option><option value="ccp">CCP</option><option value="baridimob">BaridiMob</option></select></div>
                </div>
                <button onClick={testFakeDetection} disabled={fakeLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {fakeLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Shield size={16}/>}{t('storePage.analyzeOrder','Analyze Order')}
                </button>
                {fakeResult && !fakeResult.error && (
                  <div className={`p-4 rounded-xl ${fakeResult.level === 'high' ? 'bg-red-50 border border-red-200' : fakeResult.level === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{fakeResult.score}/100</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${fakeResult.level === 'high' ? 'bg-red-500 text-white' : fakeResult.level === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>{fakeResult.level.toUpperCase()} {t('storePage.risk','RISK')}</span>
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
                <div className="flex items-center gap-3"><Sparkles size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.aiProductDescriptions','AI Product Descriptions')}</h3><p className="text-white/60 text-[10px]">{t('storePage.generateDescriptionsInstantly','Generate descriptions instantly')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="input-label text-xs">{t('storePage.productName','Product Name')}</label><input className="input-field" value={descName} onChange={e => setDescName(e.target.value)} placeholder={t('storePage.productNamePlaceholder','e.g. Wireless Bluetooth Headphones')}/></div>
                <button onClick={testDescription} disabled={descLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {descLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Sparkles size={16}/>}{t('storePage.generateDescription','Generate Description')}
                </button>
                {descResult && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-700 leading-relaxed">{descResult}</p></div>}
              </div>
            </>}

            {/* ── CART RECOVERY TEST ── */}
            {testPanel === 'recovery' && <>
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
                <div className="flex items-center gap-3"><MessageCircle size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.cartRecoveryMessages','Cart Recovery Messages')}</h3><p className="text-white/60 text-[10px]">{t('storePage.aiGeneratedRecovery','AI-generated recovery messages')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="input-label text-xs">{t('storePage.abandonedItems','Abandoned Items (comma-separated)')}</label><input className="input-field" value={recoveryItems} onChange={e => setRecoveryItems(e.target.value)} placeholder={t('storePage.abandonedItemsPlaceholder','Shoes, T-Shirt, Watch')}/></div>
                <button onClick={testRecovery} disabled={recoveryLoading} className="btn-primary w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600">
                  {recoveryLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <MessageCircle size={16}/>}{t('storePage.generateRecoveryMessage','Generate Recovery Message')}
                </button>
                {recoveryResult && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{recoveryResult}</p><button onClick={() => {navigator.clipboard.writeText(recoveryResult);toast.success(t('storePage.copied','Copied!'));}} className="mt-3 text-xs text-brand-600 font-bold hover:underline">{t('storePage.copyToClipboard','Copy to clipboard')}</button></div>}
              </div>
            </>}

            {testPanel === 'whatsapp' && <>
              <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-between">
                <div className="flex items-center gap-3"><Smartphone size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.whatsappConnection','WhatsApp Connection')}</h3><p className="text-white/60 text-[10px]">{t('storePage.connectWhatsappDesc','Connect your WhatsApp to send order updates')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <WhatsAppQR storeId={currentStore?.id}/>
              </div>
            </>}

            {testPanel === 'email' && <>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between">
                <div className="flex items-center gap-3"><Mail size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.testEmail','Test Email')}</h3><p className="text-white/60 text-[10px]">{t('storePage.sendTestEmailDesc','Send a test email')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="input-label text-xs">{t('storePage.recipientEmail','Recipient Email')}</label><input type="email" className="input-field" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@example.com"/></div>
                <div><label className="input-label text-xs">{t('storePage.subject','Subject')}</label><input className="input-field" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}/></div>
                <div><label className="input-label text-xs">{t('storePage.message','Message')}</label><textarea className="input-field" rows={3} value={emailBody} onChange={e => setEmailBody(e.target.value)}/></div>
                <button onClick={testEmail} disabled={emailSending} className="btn-primary w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600">
                  {emailSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}{t('storePage.sendTestEmail','Send Test Email')}
                </button>
                {emailResult && <div className={`p-4 rounded-xl ${emailResult.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {emailResult.success ? <p className="text-sm text-emerald-700 font-medium">{t('storePage.emailSent','Email sent!')}</p> : <p className="text-sm text-red-700 font-medium">{emailResult.error}</p>}
                </div>}
              </div>
            </>}

            {testPanel === 'sheets' && <>
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-green-700 flex items-center justify-between">
                <div className="flex items-center gap-3"><FileSpreadsheet size={20} className="text-white"/><div><h3 className="font-bold text-sm text-white">{t('storePage.googleSheets','Google Sheets')}</h3><p className="text-white/60 text-[10px]">{t('storePage.syncOrdersSpreadsheet','Sync orders to your spreadsheet')}</p></div></div>
                <button onClick={() => setTestPanel(null)} className="text-white/60 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Step 1: Sign in with Google */}
                {!sheetsStatus?.token ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t('storePage.connectGoogleDesc','Connect your Google account to sync orders directly to a Google Sheet.')}</p>
                    <button onClick={async()=>{
                      setSheetsLoading(true);
                      try{
                        // Load Google Identity Services
                        if(!window.google?.accounts){
                          await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
                        }
                        // Get client ID from platform
                        let clientId='';
                        try{const{data:pi}=await getPlatformInfo();clientId=pi.google_client_id||'';}catch{}
                        if(!clientId){toast.error(t('storePage.googleClientIdMissing','Google Client ID not set. Ask platform admin.'));setSheetsLoading(false);return;}
                        // Request token
                        const tokenClient=window.google.accounts.oauth2.initTokenClient({
                          client_id:clientId,
                          scope:'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
                          callback:(resp)=>{
                            if(resp.error){toast.error(t('storePage.googleAuthFailed','Google auth failed'));setSheetsLoading(false);return;}
                            setSheetsStatus({token:resp.access_token,expires:Date.now()+resp.expires_in*1000});
                            toast.success(t('storePage.googleConnected','Google connected!'));
                            setSheetsLoading(false);
                          },
                        });
                        tokenClient.requestAccessToken();
                      }catch(e){toast.error(t('storePage.failedLoadGoogle','Failed to load Google: ')+e.message);setSheetsLoading(false);}
                    }} disabled={sheetsLoading} className="w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-50">
                      {sheetsLoading?<div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/>:<><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>{t('storePage.signInWithGoogle','Sign in with Google')}</>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0"/>
                      <p className="text-sm text-emerald-700 font-medium">{t('storePage.googleAccountConnected','Google account connected')}</p>
                    </div>

                    {/* Step 2: Enter sheet URL */}
                    <div>
                      <label className="input-label text-xs">{t('storePage.googleSheetUrl','Google Sheet URL')}</label>
                      <input className="input-field text-sm" value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."/>
                      <p className="text-[10px] text-gray-400 mt-1">{t('storePage.createSheetHint','Create a sheet in Google Sheets, copy its URL and paste it here')}</p>
                    </div>

                    {/* Sync button */}
                    <button onClick={async()=>{
                      if(!sheetUrl)return toast.error(t('storePage.pasteSheetUrl','Paste your Google Sheet URL'));
                      const match=sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                      const sheetId=match?match[1]:sheetUrl.trim();
                      if(!sheetId)return toast.error(t('storePage.invalidSheetUrl','Invalid sheet URL'));
                      setSheetsLoading(true);setSyncResult(null);
                      try{
                        // Fetch orders from backend
                        const{data:exp}=await api.get(`/manage/stores/${currentStore.id}/orders-export`);
                        const values=[exp.header,...exp.rows];
                        // Clear and write via Google Sheets API
                        const token=sheetsStatus.token;
                        const base=`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
                        // Check access
                        const check=await fetch(base,{headers:{Authorization:`Bearer ${token}`}});
                        if(check.status===403||check.status===404){toast.error(check.status===403?t('storePage.noSheetAccess','No access to this sheet. Make sure you own it.'):t('storePage.sheetNotFound','Sheet not found.'));setSheetsLoading(false);return;}
                        // Clear Sheet1
                        await fetch(`${base}/values/Sheet1!A:Z:clear`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
                        // Write data
                        await fetch(`${base}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({values})});
                        // Bold header
                        try{const meta=await(await fetch(base,{headers:{Authorization:`Bearer ${token}`}})).json();const sid=meta.sheets?.[0]?.properties?.sheetId||0;await fetch(`${base}:batchUpdate`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requests:[{repeatCell:{range:{sheetId:sid,startRowIndex:0,endRowIndex:1},cell:{userEnteredFormat:{textFormat:{bold:true},backgroundColor:{red:0.93,green:0.93,blue:0.93}}},fields:'userEnteredFormat(textFormat,backgroundColor)'}}]})});} catch {}
                        // Save sheet ID to store config
                        await ownerApi.updateStore(currentStore.id,{google_sheet_id:sheetId});
                        setSyncResult({synced:exp.rows.length});
                        toast.success(`${exp.rows.length} ${t('storePage.ordersSynced','orders synced!')}`);
                      }catch(e){
                        if(e.message?.includes('401')||sheetsStatus.expires<Date.now()){setSheetsStatus(null);toast.error(t('storePage.sessionExpired','Session expired. Sign in again.'));}
                        else{setSyncResult({error:e.message});toast.error(t('storePage.syncFailed','Sync failed: ')+e.message);}
                      }
                      setSheetsLoading(false);
                    }} disabled={sheetsLoading} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
                      {sheetsLoading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<RefreshCw size={14}/>}{t('storePage.syncOrdersToSheet','Sync Orders to Sheet')}
                    </button>

                    {syncResult&&!syncResult.error&&<p className="text-sm text-emerald-600 text-center font-medium">{syncResult.synced} {t('storePage.ordersSyncedShort','orders synced')}</p>}
                    {syncResult?.error&&<p className="text-sm text-red-600 text-center">{syncResult.error}</p>}

                    <button onClick={()=>{setSheetsStatus(null);toast.success(t('storePage.disconnected','Disconnected'));}} className="w-full py-2 text-red-500 text-xs font-bold hover:underline">{t('storePage.disconnectGoogle','Disconnect Google')}</button>
                  </div>
                )}
              </div>
            </>}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
