import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { platformApi } from '../../utils/api';
import { MessageCircle, Smartphone, CheckCircle2, XCircle, RefreshCw, LogOut, Send } from 'lucide-react';

export default function AdminWhatsApp() {
  const [status, setStatus] = useState({ status: 'loading', connected: false, qr: null });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    try { const { data } = await platformApi.waStatus(); setStatus(data); }
    catch (e) { setStatus({ status: 'error', connected: false, error: e.message }); }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try { await platformApi.waStart(); toast.success('Starting — scan the QR code with WhatsApp'); refresh(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to start'); }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect the platform WhatsApp? Users will no longer be able to register until you reconnect.')) return;
    setLoading(true);
    try { await platformApi.waDisconnect(); toast.success('Disconnected'); refresh(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!testPhone) { toast.error('Enter a phone number'); return; }
    setSending(true);
    try {
      const { data } = await platformApi.waTestSend({ phone: testPhone, message: '✅ Platform WhatsApp test — this number will send registration verification codes to new store owners.' });
      if (data.success) toast.success('Test message sent'); else toast.error(data.reason || data.error || 'Send failed');
    } catch (e) { toast.error(e.response?.data?.error || 'Send failed'); }
    setSending(false);
  };

  const connected = status.connected;
  const qr = status.qr;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <MessageCircle size={24} className="text-white"/>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Platform WhatsApp</h1>
          <p className="text-sm text-gray-500">This is the number used to send registration verification codes to new store owners.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {connected ? (
              <><CheckCircle2 size={22} className="text-emerald-600"/><span className="font-semibold text-emerald-700">Connected</span></>
            ) : status.status === 'qr' || qr ? (
              <><Smartphone size={22} className="text-amber-600"/><span className="font-semibold text-amber-700">Waiting for scan</span></>
            ) : (
              <><XCircle size={22} className="text-gray-400"/><span className="font-semibold text-gray-600">Not connected</span></>
            )}
            {status.phone && <span className="text-sm text-gray-500">({status.phone})</span>}
          </div>
          <button onClick={refresh} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh"><RefreshCw size={16}/></button>
        </div>

        {connected ? (
          <button onClick={handleDisconnect} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-semibold">
            <LogOut size={16}/> Disconnect
          </button>
        ) : qr ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
              <img src={qr} alt="WhatsApp QR" className="w-64 h-64"/>
            </div>
            <p className="text-sm text-gray-600 text-center max-w-sm">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this code.</p>
          </div>
        ) : (
          <button onClick={handleConnect} disabled={loading} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 disabled:opacity-60">
            {loading ? <RefreshCw size={16} className="animate-spin"/> : <MessageCircle size={16}/>}
            Connect WhatsApp
          </button>
        )}

        {status.error && <p className="mt-3 text-sm text-red-600">{status.error}</p>}
      </div>

      {connected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold mb-3">Send a test message</h2>
          <div className="flex gap-2">
            <input
              type="tel"
              value={testPhone}
              onChange={(e)=>setTestPhone(e.target.value)}
              placeholder="+213... or 0XXXXXXXXX"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={handleTest} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-semibold disabled:opacity-60">
              {sending ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>} Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
