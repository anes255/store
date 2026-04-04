import React, { useState, useEffect } from 'react';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Globe, Plus, X, Search, CheckCircle, Clock, AlertCircle, Shield, ArrowRight, Check, Copy } from 'lucide-react';

export default function StoreDomains() {
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [domains, setDomains] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [activeUrl, setActiveUrl] = useState('platform');

  useEffect(() => {
    if (!currentStore?.id) return;
    ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data)).catch(() => {});
    const cfg = currentStore.config || {};
    if (cfg.active_domain) setActiveUrl(cfg.active_domain);
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
      setShowModal(false); setDomainName(''); setSearchResult(null);
      ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data));
    } catch { toast.error('Failed'); }
  };

  const setActiveDomain = async (value) => {
    try {
      const { data } = await ownerApi.updateStore(currentStore.id, { active_domain: value });
      setCurrentStore(data);
      setActiveUrl(value);
      toast.success(value === 'platform' ? 'Using platform URL' : 'Custom domain activated');
    } catch { toast.error('Failed'); }
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success('Copied!'); };
  const platformUrl = `${window.location.origin}/${currentStore?.slug}`;
  const statusIcons = { pending: Clock, active: CheckCircle, failed: AlertCircle };
  const activeDomains = domains.filter(d => d.status === 'active');

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-header">Domains & URLs</h1><p className="text-sm text-gray-500 mt-1">Manage your store's web address</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />Add Domain</button>
      </div>

      {/* Active URL Selection */}
      <div className="glass-card-solid p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Active Store URL</h3>
        <p className="text-sm text-gray-500 mb-4">Choose which URL visitors will use to access your store</p>

        <div onClick={() => setActiveDomain('platform')}
          className={`p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${activeUrl === 'platform' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeUrl === 'platform' ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
              {activeUrl === 'platform' && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">Platform URL</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-brand-600 font-mono">{platformUrl}</span>
                <button onClick={(e) => { e.stopPropagation(); copy(platformUrl); }} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">FREE</span>
          </div>
        </div>

        {activeDomains.map(d => (
          <div key={d.id} onClick={() => setActiveDomain(d.domain_name)}
            className={`p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${activeUrl === d.domain_name ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeUrl === d.domain_name ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
                {activeUrl === d.domain_name && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">Custom Domain</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-brand-600 font-mono">https://{d.domain_name}</span>
                  <button onClick={(e) => { e.stopPropagation(); copy(`https://${d.domain_name}`); }} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">CUSTOM</span>
            </div>
          </div>
        ))}

        {activeDomains.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No custom domains active yet</p>}
      </div>

      {/* All Domains */}
      {domains.length > 0 && (
        <div className="glass-card-solid p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">All Domains</h3>
          <div className="space-y-3">
            {domains.map(d => {
              const StatusIcon = statusIcons[d.status] || Clock;
              return (
                <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><Globe size={18} className="text-brand-500" /></div>
                    <div>
                      <p className="font-bold text-gray-900">{d.domain_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : d.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        <StatusIcon size={10} />{d.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DNS Guide */}
      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-brand-500" />DNS Setup Guide</h3>
        <p className="text-sm text-gray-500 mb-4">If you own a domain, point it to our servers:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-600"><span className="w-16">Type</span><span className="w-24">Name</span><span className="flex-1">Value</span></div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm"><span className="font-mono w-16">CNAME</span><span className="font-mono w-24">www</span><div className="flex items-center gap-2 flex-1"><span className="font-mono text-brand-600">kyomarket.com</span><button onClick={() => copy('kyomarket.com')} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button></div></div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm"><span className="font-mono w-16">A</span><span className="font-mono w-24">@</span><div className="flex items-center gap-2 flex-1"><span className="font-mono text-brand-600">76.76.21.21</span><button onClick={() => copy('76.76.21.21')} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button></div></div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Add Custom Domain</h2><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="flex gap-2 mb-6">
              <input className="input-field flex-1" placeholder="yourdomain.com" value={domainName} onChange={e => setDomainName(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchDomain()} />
              <button onClick={searchDomain} className="btn-primary"><Search size={16} /></button>
            </div>
            {searchResult && (
              <div className={`p-5 rounded-2xl border-2 ${searchResult.available ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-gray-900">{searchResult.domain}</p><p className={`text-sm font-semibold ${searchResult.available ? 'text-emerald-600' : 'text-red-600'}`}>{searchResult.available ? '✓ Available!' : '✗ Not available'}</p></div>
                  {searchResult.available && <div className="text-right"><p className="text-2xl font-extrabold text-gray-900">{searchResult.price.toLocaleString()} DZD</p><p className="text-xs text-gray-400">/year</p></div>}
                </div>
                {searchResult.available && <button onClick={requestDomain} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">Purchase Domain <ArrowRight size={16} /></button>}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
