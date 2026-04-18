import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, aiApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { RefreshCw, ShoppingCart, CheckCircle, TrendingUp, DollarSign, Clock, Zap, Send, Sparkles, MessageCircle, Phone, X, Calendar, Edit3, Languages } from 'lucide-react';

export default function CartRecovery() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [data, setData] = useState({ carts: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [showCompose, setShowCompose] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [msgMode, setMsgMode] = useState('ai'); // 'ai' | 'custom'
  const [msgLang, setMsgLang] = useState('en');
  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'in_30m' | 'in_6h' | 'in_24h' | 'custom'
  const [scheduleAt, setScheduleAt] = useState('');

  const load = () => {
    if (!currentStore?.id) return;
    setLoading(true);
    orderApi.getAbandoned(currentStore.id).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [currentStore?.id]);

  const computeSendAt = () => {
    const now = Date.now();
    if (scheduleMode === 'now') return null;
    if (scheduleMode === 'in_30m') return new Date(now + 30*60*1000).toISOString();
    if (scheduleMode === 'in_6h') return new Date(now + 6*60*60*1000).toISOString();
    if (scheduleMode === 'in_24h') return new Date(now + 24*60*60*1000).toISOString();
    if (scheduleMode === 'custom' && scheduleAt) return new Date(scheduleAt).toISOString();
    return null;
  };

  const sendRecovery = async (cart, message) => {
    setSending(cart.id);
    try {
      const send_at = computeSendAt();
      await aiApi.cartRecoverySend({
        store_id: currentStore.id,
        customer_phone: cart.customer_phone,
        customer_email: cart.customer_email,
        message: message || customMsg || t('storePage.defaultRecoveryMessage', `You left items in your cart at ${currentStore.name}! Complete your order now.`),
        ...(send_at ? { send_at } : {}),
      });
      toast.success(send_at ? `Scheduled for ${new Date(send_at).toLocaleString()}` : t('storePage.recoveryMessageSent','Recovery message sent!'));
      setShowCompose(null);
    } catch { toast.error(t('storePage.failedToSend','Failed to send')); }
    setSending(null);
  };

  const generateAiMessage = async (cart, lang) => {
    setAiGenerating(true);
    const useLang = lang || msgLang;
    setMsgLang(useLang);
    try {
      const items = cart.items ? JSON.parse(typeof cart.items === 'string' ? cart.items : JSON.stringify(cart.items)) : [];
      const itemNames = items.map(i => i.product_name || i.name || 'Product');
      const { data } = await aiApi.generateRecovery({ store_name: currentStore.name, items: itemNames, language: useLang });
      setCustomMsg(data.message);
      toast.success('AI message generated!');
    } catch {
      const fallback = {
        en: `Hi! You left items in your cart at ${currentStore?.name}. Complete your order now and we'll get it shipped right away!`,
        fr: `Bonjour! Vous avez laissé des articles dans votre panier chez ${currentStore?.name}. Complétez votre commande maintenant!`,
        ar: `مرحباً! تركت منتجات في سلة التسوق في ${currentStore?.name}. أكمل طلبك الآن!`,
      };
      toast.error('AI generation failed');
      setCustomMsg(fallback[useLang] || fallback.en);
    }
    setAiGenerating(false);
  };

  const stats = data.stats || {};

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold flex items-center gap-2">Cart Recovery <span className="text-brand-500 text-lg font-bold">AI</span></h1><p className="text-gray-400 text-sm mt-1">Recover abandoned carts with AI-powered messages</p></div>
        <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card-solid p-5"><div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mb-3"><ShoppingCart size={18} className="text-white"/></div><p className="text-xs text-gray-400 uppercase">Abandoned Carts</p><p className="text-xl font-black mt-1">{stats.total_carts || 0}</p></div>
        <div className="glass-card-solid p-5"><div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-3"><CheckCircle size={18} className="text-white"/></div><p className="text-xs text-gray-400 uppercase">Recovered</p><p className="text-xl font-black mt-1">{stats.recovered || 0}</p></div>
        <div className="glass-card-solid p-5"><div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3"><TrendingUp size={18} className="text-white"/></div><p className="text-xs text-gray-400 uppercase">Recovered Revenue</p><p className="text-xl font-black mt-1">{parseFloat(stats.recovered_revenue || 0).toLocaleString()} DZD</p></div>
        <div className="glass-card-solid p-5"><div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center mb-3"><DollarSign size={18} className="text-white"/></div><p className="text-xs text-gray-400 uppercase">Lost Revenue</p><p className="text-xl font-black mt-1">{parseFloat(stats.lost_revenue || 0).toLocaleString()} DZD</p></div>
      </div>

      {/* Automation sequences info */}
      <div className="glass-card-solid p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap size={16} className="text-brand-500"/>Automated Sequences</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { time: '30 min', label: 'First Reminder', desc: 'Gentle nudge via preferred channel', icon: Clock, color: 'bg-blue-100 text-blue-600' },
            { time: '6 hours', label: 'Follow Up', desc: 'Limited time urgency hook', icon: Zap, color: 'bg-purple-100 text-purple-600' },
            { time: '24 hours', label: 'Final Chance', desc: 'Discount code incentive', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
          ].map((seq, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${seq.color} flex items-center justify-center shrink-0`}><seq.icon size={16}/></div>
              <div><p className="font-bold text-sm text-gray-800">{seq.label}</p><p className="text-[10px] text-gray-400">After {seq.time}</p><p className="text-xs text-gray-500 mt-1">{seq.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Abandoned carts list */}
      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-4">Abandoned Carts ({data.carts?.length || 0})</h3>
        {loading ? (
          <div className="py-12 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>
        ) : !data.carts?.length ? (
          <div className="py-12 text-center"><ShoppingCart size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500">No abandoned carts found</p><p className="text-sm text-gray-400 mt-1">When customers leave items in their cart, they'll appear here</p></div>
        ) : (
          <div className="space-y-3">
            {data.carts.map(cart => (
              <div key={cart.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><ShoppingCart size={16} className="text-orange-600"/></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">{cart.customer_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {cart.customer_phone && <span className="flex items-center gap-1"><Phone size={10}/>{cart.customer_phone}</span>}
                    <span>{new Date(cart.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-gray-900">{parseFloat(cart.total || 0).toLocaleString()} DZD</p>
                  {cart.is_recovered && <span className="text-[10px] font-bold text-emerald-600">RECOVERED</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!cart.is_recovered && cart.customer_phone && (
                    <button onClick={() => { setShowCompose(cart); setCustomMsg(''); setMsgMode('ai'); setMsgLang('en'); setScheduleMode('now'); setScheduleAt(''); }} className="px-3 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-brand-600"><Send size={12}/>Send</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose message modal */}
      {showCompose && (() => {
        const isRtl = msgLang === 'ar';
        const previewText = customMsg || 'Configure a message template...';
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCompose(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><MessageCircle size={18} className="text-emerald-500"/>Send Recovery Message</h3>
                <p className="text-xs text-gray-400 mt-0.5">{showCompose.customer_name || 'Customer'} · {showCompose.customer_phone} · {parseFloat(showCompose.total || 0).toLocaleString()} DZD</p>
              </div>
              <button onClick={() => setShowCompose(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
              {/* LEFT: WhatsApp Preview */}
              <div className="lg:w-[340px] shrink-0 p-5 bg-gray-50 border-b lg:border-b-0 lg:border-r">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">WhatsApp Preview</p>
                <div className="bg-[#0b141a] rounded-2xl overflow-hidden shadow-xl max-w-[300px] mx-auto">
                  <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{(currentStore?.name||'S')[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{currentStore?.name||'My Store'}</p><p className="text-[10px] text-emerald-400">online</p></div>
                    <Phone size={16} className="text-gray-400"/>
                  </div>
                  <div className="p-3 min-h-[280px] max-h-[350px] overflow-y-auto" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
                    <div className={`flex ${isRtl?'flex-row-reverse':''} mb-2`}>
                      <div className="max-w-[85%]">
                        <div className="bg-[#005c4b] rounded-xl rounded-tl-sm px-3 py-2 shadow-sm" style={{direction:isRtl?'rtl':'ltr'}}>
                          <p className="text-white text-[13px] leading-relaxed whitespace-pre-wrap break-words">{previewText}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isRtl?'justify-start':'justify-end'}`}>
                            <span className="text-[10px] text-emerald-200">{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                            <span className="text-emerald-300 text-[10px]">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2"><div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5"><span className="text-gray-500 text-xs">Type a message</span></div><div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center"><Send size={14} className="text-white"/></div></div>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">Live preview updates as you type</p>
              </div>
              {/* RIGHT: Configuration */}
              <div className="flex-1 min-w-0 p-5 space-y-4">
                {/* Mode tabs */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Message Source</label>
                  <div className="flex gap-2">
                    <button onClick={() => setMsgMode('ai')} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${msgMode==='ai'?'bg-brand-500 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Sparkles size={14}/>AI Generated</button>
                    <button onClick={() => setMsgMode('custom')} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${msgMode==='custom'?'bg-brand-500 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Edit3 size={14}/>Custom Message</button>
                  </div>
                </div>
                {msgMode==='ai' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Languages size={12}/>Language</label>
                    <div className="flex gap-2">
                      {[{c:'en',l:'English',f:'🇬🇧'},{c:'fr',l:'Français',f:'🇫🇷'},{c:'ar',l:'العربية',f:'🇩🇿'}].map(lg => (
                        <button key={lg.c} onClick={() => generateAiMessage(showCompose, lg.c)} disabled={aiGenerating} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${msgLang===lg.c?'bg-emerald-500 text-white shadow':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                          <span>{lg.f}</span>{lg.l}
                        </button>
                      ))}
                    </div>
                    {aiGenerating && <p className="text-[11px] text-brand-500 mt-2 flex items-center gap-1"><div className="w-3 h-3 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"/>Generating AI message...</p>}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Message</label>
                  <textarea className="input-field" rows={5} value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder={msgMode==='ai'?'Click a language above to generate...':'Type your custom recovery message...'} dir={isRtl?'rtl':'ltr'}/>
                </div>
                {/* Schedule */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Calendar size={12}/>When to Send</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{k:'now',l:'Send Now'},{k:'in_30m',l:'In 30 min'},{k:'in_6h',l:'In 6 hours'},{k:'in_24h',l:'In 24 hours'},{k:'custom',l:'Pick date & time'}].map(o => (
                      <button key={o.k} onClick={() => setScheduleMode(o.k)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${scheduleMode===o.k?'bg-purple-500 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{o.l}</button>
                    ))}
                  </div>
                  {scheduleMode==='custom' && (
                    <input type="datetime-local" className="input-field mt-2" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} min={new Date().toISOString().slice(0,16)}/>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 border-t bg-gray-50">
              <button onClick={() => sendRecovery(showCompose, customMsg)} disabled={sending === showCompose.id || !customMsg || (scheduleMode==='custom' && !scheduleAt)} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {sending === showCompose.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (scheduleMode==='now' ? <Send size={16}/> : <Calendar size={16}/>)}
                {scheduleMode==='now' ? `Send via ${currentStore?.ai_channel || 'WhatsApp'}` : 'Schedule Message'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </DashboardLayout>
  );
}
