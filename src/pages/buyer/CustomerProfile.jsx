import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useAuthStore } from '../../hooks/useStore';
import { ArrowLeft, User, ShoppingCart, Package, LogOut, Clock, Check, Truck } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};

export default function CustomerProfile() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate(`/s/${storeSlug}/auth`); return; }
    storeApi.getCustomerProfile(storeSlug).then(r => setProfile(r.data)).catch(() => navigate(`/s/${storeSlug}/auth`));
    setLoading(false);
  }, [storeSlug, user]);

  const handleLogout = () => { logout(); navigate(`/s/${storeSlug}`); };

  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${storeSlug}`} className="flex items-center gap-2 text-gray-600"><ArrowLeft size={18} /><span className="font-semibold text-sm">Back to Store</span></Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 text-sm font-medium"><LogOut size={16} />Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="glass-card-solid p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
              <User size={28} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">{profile.phone} {profile.email && `· ${profile.email}`}</p>
              <p className="text-xs text-gray-400 mt-0.5">{profile.city}, {profile.wilaya}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <ShoppingCart size={20} className="mx-auto text-brand-500 mb-1" />
              <p className="text-2xl font-extrabold text-gray-900">{profile.total_orders || 0}</p>
              <p className="text-xs text-gray-400">Total Orders</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <Package size={20} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-2xl font-extrabold text-gray-900">{parseFloat(profile.total_spent || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Total Spent (DZD)</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <h3 className="font-bold text-gray-900 text-lg mb-4">Order History</h3>
        {profile.orders?.length === 0 ? (
          <div className="glass-card-solid p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <Link to={`/s/${storeSlug}`} className="btn-primary mt-4 inline-flex text-sm">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.orders?.map(order => (
              <div key={order.id} className="glass-card-solid p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 font-mono text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${statusColors[order.status]} capitalize`}>{order.status}</span>
                    <p className="text-lg font-extrabold text-gray-900 mt-1">{parseFloat(order.total).toLocaleString()} DZD</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Payment: {order.payment_method?.replace('_', ' ').toUpperCase()}</span>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'} text-[10px]`}>{order.payment_status}</span>
                  {order.tracking_number && <span>Tracking: {order.tracking_number}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
