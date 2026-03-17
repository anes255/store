import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { Search, Users } from 'lucide-react';

export default function StoreCustomers() {
  const { t } = useTranslation();
  const { currentStore } = useStoreManagement();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentStore?.id) return;
    orderApi.getCustomers(currentStore.id, { search }).then(r => setCustomers(r.data)).catch(() => {});
  }, [currentStore?.id, search]);

  return (
    <DashboardLayout>
      <h1 className="page-header mb-6">{t('dashboard.customers')}</h1>
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field !pl-9 !py-2 text-sm" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card-solid">
          <Users size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500">No customers yet</p>
        </div>
      ) : (
        <div className="table-container bg-white">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Orders</th><th>Total Spent</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="font-semibold text-gray-800">{c.name}</td>
                  <td className="text-gray-500">{c.phone}</td>
                  <td className="text-gray-500">{c.email || '—'}</td>
                  <td className="text-gray-400">{c.city}, {c.wilaya}</td>
                  <td>{c.total_orders}</td>
                  <td className="font-bold">{parseFloat(c.total_spent || 0).toLocaleString()} DZD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
