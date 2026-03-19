import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RefreshCw, Settings, ShoppingCart, CheckCircle, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';

export default function CartRecovery() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [data, setData] = useState({ carts: [], stats: {} });

  useEffect(() => {
    if (!currentStore?.id) return;
    orderApi.getAbandoned(currentStore.id).then(r => setData(r.data)).catch(() => {});
  }, [currentStore?.id]);

  const stats = [
    { icon: ShoppingCart, label: t('recovery.totalCarts'), value: data.stats.total_carts || 0, color: 'bg-orange-500' },
    { icon: CheckCircle, label: t('recovery.recovered'), value: data.stats.recovered || 0, color: 'bg-emerald-500' },
    { icon: TrendingUp, label: t('recovery.recoveredRevenue'), value: `${parseFloat(data.stats.recovered_revenue || 0).toLocaleString()} DZD`, color: 'bg-blue-500' },
    { icon: DollarSign, label: t('recovery.lostRevenue'), value: `${parseFloat(data.stats.lost_revenue || 0).toLocaleString()} DZD`, color: 'bg-red-500' },
  ];

  const mockChart = [
    { name: 'Mon', abandoned: 5, recovered: 2 }, { name: 'Tue', abandoned: 8, recovered: 3 },
    { name: 'Wed', abandoned: 6, recovered: 4 }, { name: 'Thu', abandoned: 12, recovered: 5 },
    { name: 'Fri', abandoned: 9, recovered: 6 }, { name: 'Sat', abandoned: 15, recovered: 7 },
    { name: 'Sun', abandoned: 10, recovered: 5 },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header flex items-center gap-2">Cart Recovery <span className="text-brand-500 text-lg font-bold">AI</span></h1>
          <p className="text-gray-500 text-sm mt-1">{t('recovery.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm flex items-center gap-2"><RefreshCw size={14} />{t('recovery.syncData')}</button>
          <button className="btn-primary text-sm flex items-center gap-2"><Settings size={14} />{t('recovery.automationSettings')}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card-solid p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3 shadow-md`}><Icon size={18} className="text-white" /></div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card-solid p-6">
          <h3 className="font-bold text-gray-900 mb-4">Recovery Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockChart}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="abandoned" stroke="#f97316" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-solid p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Automation</h3>
            <div className="w-11 h-6 rounded-full bg-emerald-500 relative"><div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow" /></div>
          </div>
          <div className="space-y-4">
            {[
              { time: '30m', label: 'Sequence 1', desc: 'First reminder sent via WhatsApp Cloud API.', icon: Clock, color: 'bg-blue-100 text-blue-600' },
              { time: '6h', label: 'Sequence 2', desc: 'Follow up with limited time reservation hook.', icon: Zap, color: 'bg-purple-100 text-purple-600' },
              { time: '24h', label: 'Sequence 3', desc: 'Final chance with dynamic discount code generation.', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
            ].map((seq, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg ${seq.color} flex items-center justify-center shrink-0`}><seq.icon size={14} /></div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{seq.label} ({seq.time})</p>
                  <p className="text-xs text-gray-400">{seq.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
