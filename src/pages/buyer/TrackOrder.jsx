import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { Truck, Search, ArrowLeft, Package, Check, Clock, Ban } from 'lucide-react';
import { isValidAlgerianPhone } from './Checkout';

// Public order-lookup page so unregistered customers can track an order by
// the Algerian phone number they used at checkout.
export default function TrackOrder() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!isValidAlgerianPhone(phone)) {
      return toast.error(t('track.invalidPhone', 'Enter a valid Algerian phone (e.g. 0555123456)'));
    }
    setLoading(true);
    try {
      const { data } = await storeApi.trackOrders(storeSlug, encodeURIComponent(phone));
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch {
      toast.error(t('track.notFound', 'No orders found for that phone'));
      setOrders([]);
    }
    setLoading(false);
  };

  const statusIcon = (s) => {
    if (s === 'delivered') return <Check className="text-emerald-600" size={16} />;
    if (s === 'shipped') return <Truck className="text-cyan-600" size={16} />;
    if (s === 'cancelled' || s === 'returned') return <Ban className="text-red-500" size={16} />;
    return <Clock className="text-amber-500" size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={`/s/${storeSlug}`} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={18} /></Link>
          <h1 className="text-lg font-extrabold text-gray-900">{t('track.title', 'Track your order')}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-4">
            {t('track.desc', 'Enter the Algerian phone number you used at checkout to see your orders.')}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookup()}
                placeholder="0555 12 34 56"
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-gray-300"
                inputMode="tel"
              />
            </div>
            <button onClick={lookup} disabled={loading} className="px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-50">
              {loading ? '…' : t('track.lookup', 'Track')}
            </button>
          </div>
        </div>

        {orders && orders.length === 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">{t('track.noResults', 'No orders found for that phone number.')}</div>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-gray-900">{o.order_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                    {statusIcon(o.status)}{o.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('track.total', 'Total')}</span>
                  <span className="font-extrabold text-gray-900">{parseFloat(o.total).toLocaleString()} DZD</span>
                </div>
                {o.tracking_number && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Package size={12} className="text-cyan-600" />
                    <span className="text-gray-500">{t('track.tracking', 'Tracking')}:</span>
                    <span className="font-mono font-bold text-gray-800">{o.tracking_number}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
