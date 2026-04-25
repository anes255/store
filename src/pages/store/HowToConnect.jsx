import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { Shield, Zap, Lock, ArrowRight, FileText, Truck, ExternalLink, Copy, KeyRound, PlugZap, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Step-specific destinations so the workflow cards are also clickable.
const STEP_LINKS = {
  '01': '/dashboard/shipping-partners',
  '02': '/dashboard/shipping-partners',
  '03': '/dashboard/shipping-partners',
  '04': '/dashboard/shipping-wilayas',
};

export default function HowToConnect() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openDocs = () => {
    // Open the developer documentation in a new tab. The link can be moved
    // to a platform-info field later if the super admin wants to override it.
    window.open('https://docs.makretdz.com/integrations', '_blank', 'noopener,noreferrer');
  };

  const goMarketplace = () => navigate('/dashboard/shipping-partners');
  const goWilayas = () => navigate('/dashboard/shipping-wilayas');

  const copyEndpoint = () => {
    try {
      navigator.clipboard.writeText('https://api.makretdz.com/v1/orders');
      toast.success(t('storePage.copied', 'Copied to clipboard'));
    } catch { toast.error(t('storePage.copyFailed', 'Copy failed')); }
  };

  const steps = [
    { n: '01', icon: KeyRound, t: t('storePage.obtainCredentials', 'Obtain Credentials'), d: t('storePage.obtainCredentialsDesc', 'Get API keys from your delivery partner') },
    { n: '02', icon: Truck, t: t('storePage.choosePartner', 'Choose Partner'), d: t('storePage.choosePartnerDesc', 'Select from our marketplace') },
    { n: '03', icon: PlugZap, t: t('storePage.authentication', 'Authentication'), d: t('storePage.authenticationDesc', 'Enter your API ID and Token') },
    { n: '04', icon: CheckCircle2, t: t('storePage.verifyLink', 'Verify Link'), d: t('storePage.verifyLinkDesc', 'Test the connection') },
  ];

  const workflow = [
    { icon: Lock, t: t('storePage.safeDataRelay', 'Safe Data Relay'), d: t('storePage.safeDataRelayDesc', 'All customer data are pushed through encrypted endpoints.'), action: copyEndpoint, label: t('storePage.copyEndpoint', 'Copy endpoint') },
    { icon: Zap, t: t('storePage.instantTracking', 'Instant Tracking'), d: t('storePage.instantTrackingDesc', 'Tracking numbers are returned instantly and saved back.'), action: () => navigate('/dashboard/orders'), label: t('storePage.goToOrders', 'Go to Orders') },
    { icon: Shield, t: t('storePage.bulkActions', 'Bulk Actions'), d: t('storePage.bulkActionsDesc', 'Connect multiple partners and choose the best rate.'), action: goMarketplace, label: t('storePage.openPartners', 'Open Partners') },
  ];

  return (
    <DashboardLayout>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Technical integration */}
        <div className="glass-card-solid p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Shield size={24} className="text-blue-500" /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('storePage.technicalIntegration', 'Technical Integration')}</h2>
              <p className="text-sm text-gray-400">{t('storePage.stepByStepGuide', 'Step-by-step connection guide')}</p>
            </div>
          </div>

          {steps.map(s => {
            const Icon = s.icon;
            const dest = STEP_LINKS[s.n];
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => dest && navigate(dest)}
                className="w-full flex items-center gap-4 mb-3 p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-brand-600 transition-colors">{s.n}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 flex items-center gap-2"><Icon size={14} className="text-brand-500" />{s.t}</p>
                  <p className="text-xs text-gray-400">{s.d}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </button>
            );
          })}

          <button
            type="button"
            onClick={openDocs}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mt-3"
          >
            <FileText size={16} />{t('storePage.developerDocumentation', 'Developer Documentation')}
            <ExternalLink size={14} className="opacity-70" />
          </button>
        </div>

        {/* Shipping workflow */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center"><Truck size={24} className="text-orange-400" /></div>
            <div><h2 className="text-xl font-bold">{t('storePage.shippingWorkflow', 'Shipping Workflow')}</h2></div>
          </div>

          {workflow.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={s.action}
                className="w-full flex items-center gap-4 mb-3 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl p-4 transition-colors text-left group"
              >
                <Icon size={20} className="text-white/60 shrink-0 group-hover:text-orange-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.t}</p>
                  <p className="text-xs text-white/50">{s.d}</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-orange-300 group-hover:text-orange-200 shrink-0">
                  {s.label} <ArrowRight size={12} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-brand-600 to-purple-700 rounded-2xl p-8 mt-6 text-white">
        <p className="text-[10px] text-white/50 uppercase font-bold mb-2">{t('storePage.communityStep', 'COMMUNITY STEP')}</p>
        <h3 className="text-2xl font-bold mb-2">{t('storePage.readyToAutomate', 'Ready to automate? Connection takes less than 2 minutes.')}</h3>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={goMarketplace}
            className="px-6 py-3 bg-white text-brand-600 font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {t('storePage.returnToMarketplace', 'Return to Marketplace')} <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={goWilayas}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center gap-2 border border-white/20 transition-colors"
          >
            <Truck size={16} /> {t('storePage.configureWilayas', 'Configure Wilayas')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
