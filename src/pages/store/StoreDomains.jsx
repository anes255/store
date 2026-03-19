import React, { useState, useEffect } from 'react';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Globe, Plus, X, Search, CheckCircle, Clock, AlertCircle, Shield, ArrowRight } from 'lucide-react';

export default function StoreDomains() {
  const { currentStore } = useStoreManagement();
  const [domains, setDomains] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    if (!currentStore?.id) return;
    ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data)).catch(() => {});
  }, [currentStore?.id]);

  const searchDomain = () => {
    if (!domainName) return;
    const clean = domainName.replace(/[^a-zA-Z0-9.-]/g, '').toLowerCase();
    setSearchResult({ domain: clean.includes('.') ? clean : `${clean}.dz`, available: Math.random() > 0.3, price: 3500 });
  };

  const requestDomain = async () => {
    try {
      await ownerApi.requestDomain(currentStore.id, { domain_name: searchResult.domain });
      toast.success('Domain requested!');
      setShowModal(false);
      setDomainName('');
      setSearchResult(null);
      ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data));
    } catch (err) { toast.error('Failed'); }
  };

  const statusIcons = { pending: Clock, active: CheckCircle, failed: AlertCircle };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Custom Domains</h1>
          <p className="text-sm text-gray-500 mt-1">Connect a custom domain to your store for a professional look.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Add Domain</button>
      </div>

      {/* Current store URL */}
      <div className="glass-card-solid p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={20} className="text-brand-500" />
          <h3 className="font-bold text-gray-900">Current Store URL</h3>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-500">https://kyomarket.com/s/</span>
          <span className="font-bold text-brand-600">{currentStore?.slug}</span>
          <span className="badge badge-success ml-2">Active</span>
        </div>
      </div>

      {/* Custom domains */}
      {domains.length > 0 && (
        <div className="space-y-3 mb-6">
          {domains.map(d => {
            const StatusIcon = statusIcons[d.status] || Clock;
            return (
              <div key={d.id} className="glass-card-solid p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><Globe size={18} className="text-brand-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900">{d.domain_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`badge ${d.status === 'active' ? 'badge-success' : d.status === 'pending' ? 'badge-warning' : 'badge-danger'} flex items-center gap-1`}>
                        <StatusIcon size={10} />{d.status}
                      </span>
                      <span className="text-xs text-gray-400">SSL: {d.ssl_status}</span>
                    </div>
                  </div>
                </div>
                <span className="font-bold text-gray-900">{parseFloat(d.price || 0).toLocaleString()} DZD</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Domain Search Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Search Domain</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-6">
              <input className="input-field flex-1" placeholder="Enter domain name..." value={domainName} onChange={e => setDomainName(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchDomain()} />
              <button onClick={searchDomain} className="btn-primary"><Search size={16} /></button>
            </div>
            {searchResult && (
              <div className={`p-5 rounded-2xl border-2 ${searchResult.available ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{searchResult.domain}</p>
                    <p className={`text-sm font-semibold ${searchResult.available ? 'text-emerald-600' : 'text-red-600'}`}>
                      {searchResult.available ? '✓ Available!' : '✗ Not available'}
                    </p>
                  </div>
                  {searchResult.available && (
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-gray-900">{searchResult.price.toLocaleString()} DZD</p>
                      <p className="text-xs text-gray-400">/year</p>
                    </div>
                  )}
                </div>
                {searchResult.available && (
                  <button onClick={requestDomain} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                    Purchase Domain <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Shield size={14} /> How it works</p>
              <ol className="space-y-1 text-xs text-gray-500">
                <li>1. Search for your desired domain name</li>
                <li>2. Purchase the domain through our platform</li>
                <li>3. We'll automatically configure DNS and SSL</li>
                <li>4. Your store will be live on your custom domain!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
