import React, { useState, useEffect } from 'react';
import { ownerApi } from '../../utils/api';
import { useStoreManagement } from '../../hooks/useStore';
import DashboardLayout from '../../components/shared/DashboardLayout';
import toast from 'react-hot-toast';
import { Globe, Plus, X, CheckCircle, Clock, AlertCircle, Shield, Check, Copy, Trash2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StoreDomains() {
  const { t } = useTranslation();
  const { currentStore, setCurrentStore } = useStoreManagement();
  const [domains, setDomains] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [activeUrl, setActiveUrl] = useState('platform');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentStore?.id) return;
    ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data)).catch(() => {});
    const cfg = currentStore.config || {};
    if (cfg.active_domain) setActiveUrl(cfg.active_domain);
  }, [currentStore?.id]);

  const addDomain = async () => {
    if (!domainName) return toast.error(t('storePage.enterDomain','Enter your domain'));
    const clean = domainName.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim().toLowerCase();
    if (!clean.includes('.')) return toast.error(t('storePage.enterValidDomain','Enter a valid domain (e.g. mystore.com)'));
    setAdding(true);
    try {
      await ownerApi.requestDomain(currentStore.id, { domain_name: clean });
      toast.success(t('storePage.domainAdded','Domain added! Configure your DNS to connect it.'));
      setShowModal(false); setDomainName('');
      ownerApi.getDomains(currentStore.id).then(r => setDomains(r.data));
    } catch (e) { toast.error(e.response?.data?.error || t('storePage.failed','Failed')); }
    setAdding(false);
  };

  const setActiveDomain = async (value) => {
    try {
      const { data } = await ownerApi.updateStore(currentStore.id, { active_domain: value });
      setCurrentStore(data);
      setActiveUrl(value);
      toast.success(t('storePage.activeUrlUpdated','Active URL updated'));
    } catch { toast.error(t('storePage.failed','Failed')); }
  };

  const copy = (txt) => { navigator.clipboard.writeText(txt); toast.success(t('storePage.copied','Copied!')); };
  const platformUrl = `${window.location.origin}/${currentStore?.slug}`;
  const statusIcons = { pending: Clock, active: CheckCircle, failed: AlertCircle };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-header">{t('storePage.domainsTitle','Domains & URLs')}</h1><p className="text-sm text-gray-500 mt-1">{t('storePage.domainsSubtitle','Connect your own domain or use the platform URL')}</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} />{t('storePage.connectDomain','Connect Domain')}</button>
      </div>

      {/* Active URL Selection */}
      <div className="glass-card-solid p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('storePage.activeStoreUrl','Active Store URL')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('storePage.chooseUrl','Choose which URL your customers will use')}</p>

        <div onClick={() => setActiveDomain('platform')}
          className={`p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${activeUrl === 'platform' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeUrl === 'platform' ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
              {activeUrl === 'platform' && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{t('storePage.platformUrl','Platform URL')}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-brand-600 font-mono">{platformUrl}</span>
                <button onClick={(e) => { e.stopPropagation(); copy(platformUrl); }} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{t('storePage.freeBadge','FREE')}</span>
          </div>
        </div>

        {domains.filter(d => d.status === 'active').map(d => (
          <div key={d.id} onClick={() => setActiveDomain(d.domain_name)}
            className={`p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${activeUrl === d.domain_name ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeUrl === d.domain_name ? 'border-brand-500 bg-brand-500' : 'border-gray-300'}`}>
                {activeUrl === d.domain_name && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">{d.domain_name}</p>
                <span className="text-sm text-brand-600 font-mono">https://{d.domain_name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{t('storePage.customBadge','CUSTOM')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Connected Domains */}
      {domains.length > 0 && (
        <div className="glass-card-solid p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('storePage.connectedDomains','Connected Domains')}</h3>
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
                        <StatusIcon size={10} />{d.status === 'pending' ? t('storePage.dnsNotVerified','DNS not verified') : d.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DNS Setup */}
      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-brand-500" />{t('storePage.howToConnect','How to connect your domain')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('storePage.dnsInstructions','Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records:')}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-600"><span className="w-16">{t('storePage.type','Type')}</span><span className="w-24">{t('storePage.name','Name')}</span><span className="flex-1">{t('storePage.value','Value')}</span></div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm"><span className="font-mono w-16">CNAME</span><span className="font-mono w-24">www</span><div className="flex items-center gap-2 flex-1"><span className="font-mono text-brand-600">cname.vercel-dns.com</span><button onClick={() => copy('cname.vercel-dns.com')} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button></div></div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm"><span className="font-mono w-16">A</span><span className="font-mono w-24">@</span><div className="flex items-center gap-2 flex-1"><span className="font-mono text-brand-600">76.76.21.21</span><button onClick={() => copy('76.76.21.21')} className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button></div></div>
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('storePage.dnsPropagationNote','DNS changes can take up to 48 hours to propagate.')}</p>
      </div>

      {/* Add Domain Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">{t('storePage.connectYourDomain','Connect Your Domain')}</h2><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <p className="text-sm text-gray-500 mb-4">{t('storePage.enterDomainOwn',"Enter the domain you already own. You'll need to update its DNS records to point to our servers.")}</p>
            <div><label className="input-label">{t('storePage.yourDomain','Your Domain')}</label><input className="input-field" value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="mystore.com" onKeyDown={e => e.key === 'Enter' && addDomain()} /></div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">{t('storePage.cancel','Cancel')}</button>
              <button onClick={addDomain} disabled={adding} className="btn-primary flex-1 disabled:opacity-50">{adding ? t('storePage.adding','Adding...') : t('storePage.connectDomain','Connect Domain')}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
