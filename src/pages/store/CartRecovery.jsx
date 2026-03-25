import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi, aiApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { RefreshCw, ShoppingCart, CheckCircle, TrendingUp, DollarSign, Clock, Zap, Send, Sparkles, MessageCircle, Phone, X } from 'lucide-react';

export default function CartRecovery() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [data, setData] = useState({ carts: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [showCompose, setShowCompose] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const load = () => {
    if (!currentStore?.id) return;
    setLoading(true);
    orderApi.getAbandoned(currentStore.id).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [currentStore?.id]);

  const sendRecovery = async (cart, message) => {
    setSending(cart.id);
    try {
      await aiApi.cartRecoverySend({
        store_id: currentStore.id,
        customer_phone: cart.customer_phone,
        customer_email: cart.customer_email,
        message: message || customMsg || `You left items in your cart at ${currentStore.name}! Complete your order now.`,
      });
      toast.success('Recovery message sent!');
      setShowCompose(null);
    } catch { toast.error('Failed to send'); }
    setSending(null);
  };

  const generateAiMessage = async (cart) => {
    setAiGenerating(true);
    try {
      const items = cart.items ? JSON.parse(typeof cart.items === 'string' ? cart.items : JSON.stringify(cart.items)) : [];
      const itemNames = items.map(i => i.product_name || i.name || 'Product');
      const { data } = await aiApi.generateRecovery({ store_name: currentStore.name, items: itemNames, language: 'ar' });
      setCustomMsg(data.message);
      toast.success('AI message generated!');
    } catch { toast.error('AI generation failed'); setCustomMsg(`مرحباً! تركت منتجات في سلة التسوق في ${currentStore.name}. أكمل طلبك الآن!`); }
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
                    <button onClick={() => { setShowCompose(cart); setCustomMsg(''); }} className="px-3 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-brand-600"><Send size={12}/>Send</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose message modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCompose(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Send Recovery Message</h3>
              <button onClick={() => setShowCompose(null)}><X size={18}/></button>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl mb-4">
              <p className="text-sm font-medium text-gray-700">{showCompose.customer_name || 'Customer'}</p>
              <p className="text-xs text-gray-400">{showCompose.customer_phone} · {parseFloat(showCompose.total || 0).toLocaleString()} DZD</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Message</label>
                <button onClick={() => generateAiMessage(showCompose)} disabled={aiGenerating} className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline disabled:opacity-50">
                  {aiGenerating ? <div className="w-3 h-3 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"/> : <Sparkles size={12}/>}
                  AI Generate
                </button>
              </div>
              <textarea className="input-field" rows={4} value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Type your recovery message or click AI Generate..."/>
            </div>
            <button onClick={() => sendRecovery(showCompose, customMsg)} disabled={sending === showCompose.id || !customMsg} className="btn-primary w-full flex items-center justify-center gap-2">
              {sending === showCompose.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
              Send via {currentStore?.ai_channel || 'WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
