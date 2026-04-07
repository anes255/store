import React,{useState,useEffect,useRef} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{ownerApi}from'../../utils/api';import toast from'react-hot-toast';import{Zap,Check,X,CreditCard,Upload,Clock,AlertTriangle,Copy,Star}from'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StoreBilling(){
  const { t } = useTranslation();
  const[data,setData]=useState(null);const[loading,setLoading]=useState(true);
  const[selectedPlan,setSelectedPlan]=useState(null);const[period,setPeriod]=useState('monthly');
  const[showPay,setShowPay]=useState(false);const[receipt,setReceipt]=useState('');const[submitting,setSubmitting]=useState(false);
  const fileRef=useRef(null);

  const load=()=>{setLoading(true);ownerApi.getSubscription().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);

  const uploadReceipt=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setReceipt(r.result);r.readAsDataURL(f);};

  const submitPayment=async()=>{
    if(!receipt)return toast.error(t('storePage.uploadReceiptError','Upload your payment receipt'));
    if(!selectedPlan)return toast.error(t('storePage.selectPlanError','Select a plan'));
    setSubmitting(true);
    try{
      const plan=selectedPlan;const price=period==='yearly'?data.plans[plan].yearly:data.plans[plan].monthly;
      await ownerApi.paySubscription({plan,period,amount:price,payment_method:'ccp',receipt_image:receipt});
      toast.success(t('storePage.paymentSubmitted','Payment submitted! Waiting for admin approval.'));
      setShowPay(false);setReceipt('');setSelectedPlan(null);load();
    }catch(e){toast.error(e.response?.data?.error||t('storePage.failed','Failed'));}
    setSubmitting(false);
  };

  const copy=(txt)=>{navigator.clipboard.writeText(txt);toast.success(t('storePage.copied','Copied!'));};

  if(loading)return<DashboardLayout><div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div></DashboardLayout>;

  const plans=data?.plans||{};const isActive=data?.status==='active';const isSuspended=data?.status==='suspended';
  const expDate=data?.expires_at?new Date(data.expires_at).toLocaleDateString():null;

  return(<DashboardLayout>
    <div className="mb-6"><h1 className="text-2xl font-bold">{t('storePage.billingTitle','Billing & Subscription')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.billingSubtitle','Manage your plan and payment history')}</p></div>

    {/* Current Status */}
    <div className={`glass-card-solid p-6 mb-6 ${isSuspended?'border-2 border-red-300 bg-red-50':''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isSuspended?'bg-red-500':'isActive'?'bg-brand-500':'bg-gray-400'} text-white`}><Zap size={24}/></div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{t('storePage.currentPlan','Current Plan')}</p>
            <p className="text-xl font-black text-gray-900 capitalize">{data?.plan||t('storePage.free','Free')}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSuspended?'bg-red-500 text-white':isActive?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{isSuspended?t('storePage.suspended','SUSPENDED'):isActive?t('storePage.active','ACTIVE'):t('storePage.freeStatus','FREE')}</span>
          {expDate&&<p className="text-xs text-gray-400 mt-1">{t('storePage.expires','Expires')}: {expDate}</p>}
        </div>
      </div>
      {isSuspended&&<div className="mt-4 p-3 bg-red-100 rounded-xl flex items-center gap-2"><AlertTriangle size={16} className="text-red-600"/><p className="text-sm text-red-700 font-medium">{t('storePage.suspendedMessage','Your subscription is suspended. Please renew to restore access.')}</p></div>}
    </div>

    {/* Period Toggle */}
    <div className="flex items-center justify-center gap-3 mb-6">
      <button onClick={()=>setPeriod('monthly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period==='monthly'?'bg-brand-500 text-white':'bg-gray-100 text-gray-500'}`}>{t('storePage.monthly','Monthly')}</button>
      <button onClick={()=>setPeriod('yearly')} className={`px-6 py-2 rounded-xl text-sm font-bold ${period==='yearly'?'bg-brand-500 text-white':'bg-gray-100 text-gray-500'}`}>{t('storePage.yearly','Yearly')} <span className="text-[10px] ml-1 opacity-70">{t('storePage.save20','Save 20%')}</span></button>
    </div>

    {/* Plan */}
    <div className="max-w-md mx-auto mb-8">
      {Object.entries(plans).map(([key,plan])=>{const price=period==='yearly'?plan.yearly:plan.monthly;const isCurrent=data?.plan===key&&isActive;return(
        <div key={key} className="glass-card-solid p-8 ring-2 ring-brand-400">
          <div className="text-center mb-4"><h3 className="text-2xl font-black text-gray-900">{plan.name}</h3></div>
          <div className="text-center mb-6"><span className="text-4xl font-black text-brand-600">{price.toLocaleString()}</span><span className="text-gray-400 text-sm ml-1">{t('storePage.dzd','DZD')} / {period==='yearly'?t('storePage.year','year'):t('storePage.month','month')}</span></div>
          <div className="space-y-2 mb-6">{plan.features.map((f,i)=><div key={i} className="flex items-center gap-2 text-sm"><Check size={14} className="text-emerald-500 shrink-0"/><span className="text-gray-600">{f}</span></div>)}</div>
          <button onClick={()=>{if(!isCurrent){setSelectedPlan(key);setShowPay(true);}}} disabled={isCurrent} className={`w-full py-3.5 rounded-xl font-bold text-sm ${isCurrent?'bg-emerald-100 text-emerald-700':'bg-brand-500 text-white hover:bg-brand-600'}`}>{isCurrent?t('storePage.currentPlanBtn','Current Plan'):t('storePage.subscribe','Subscribe')}</button>
        </div>
      );})}
    </div>

    {/* Payment History */}
    <div className="glass-card-solid p-6">
      <h3 className="font-bold text-gray-900 mb-4">{t('storePage.paymentHistory','Payment History')}</h3>
      {!data?.payments?.length?<p className="text-center py-8 text-gray-400 text-sm">{t('storePage.noPaymentsYet','No payments yet')}</p>:
      <div className="space-y-2">{data.payments.map(p=>(
        <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.status==='approved'?'bg-emerald-100 text-emerald-600':p.status==='rejected'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-600'}`}><CreditCard size={16}/></div>
          <div className="flex-1"><p className="font-medium text-sm text-gray-800 capitalize">{p.plan} — {p.period}</p><p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()} · {p.payment_method?.toUpperCase()}</p></div>
          <div className="text-right"><p className="font-bold text-sm">{parseFloat(p.amount).toLocaleString()} {t('storePage.dzd','DZD')}</p><span className={`text-[10px] font-bold ${p.status==='approved'?'text-emerald-600':p.status==='rejected'?'text-red-600':'text-amber-600'}`}>{p.status?.toUpperCase()}</span></div>
        </div>
      ))}</div>}
    </div>

    {/* Payment Modal */}
    {showPay&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowPay(false)}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{t('storePage.subscribeTo','Subscribe to')} {plans[selectedPlan]?.name}</h2><button onClick={()=>setShowPay(false)}><X size={20}/></button></div>

        <div className="p-4 bg-brand-50 rounded-xl mb-4 text-center">
          <p className="text-xs text-gray-400">{t('storePage.amountToPay','Amount to pay')}</p>
          <p className="text-3xl font-black text-brand-600">{(period==='yearly'?plans[selectedPlan]?.yearly:plans[selectedPlan]?.monthly)?.toLocaleString()} {t('storePage.dzd','DZD')}</p>
          <p className="text-xs text-gray-400 capitalize">{period}</p>
        </div>

        {/* Payment methods */}
        <div className="space-y-3 mb-4">
          {data?.billing_ccp&&<div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.ccpTransfer','CCP Transfer')}</p><div className="flex items-center justify-between"><div><p className="font-mono font-bold">{data.billing_ccp}</p><p className="text-xs text-gray-400">{data.billing_ccp_name}</p></div><button onClick={()=>copy(data.billing_ccp)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div></div>}

          {data?.billing_baridimob_rip&&<div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.baridiMob','BaridiMob')}</p><div className="flex items-center justify-between"><div><p className="font-mono font-bold">{data.billing_baridimob_rip}</p></div><button onClick={()=>copy(data.billing_baridimob_rip)} className="p-1.5 hover:bg-gray-200 rounded"><Copy size={14}/></button></div>{data.billing_baridimob_qr&&<img src={data.billing_baridimob_qr} className="w-40 h-40 mx-auto mt-3 rounded-xl border" alt="QR"/>}</div>}

          {!data?.billing_ccp&&!data?.billing_baridimob_rip&&<div className="p-4 bg-amber-50 rounded-xl text-center"><AlertTriangle size={20} className="mx-auto text-amber-500 mb-2"/><p className="text-sm text-amber-700">{t('storePage.paymentNotConfigured','Payment details not configured yet. Contact the platform admin.')}</p></div>}
        </div>

        {/* Receipt upload */}
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('storePage.uploadReceipt','Upload Payment Receipt')}</p>
          {receipt?<div className="relative"><img src={receipt} className="w-full rounded-xl border" alt="Receipt"/><button onClick={()=>setReceipt('')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14}/></button></div>:
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400" onClick={()=>fileRef.current?.click()}><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">{t('storePage.clickUploadReceipt','Click to upload receipt screenshot')}</p></div>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadReceipt}/>
        </div>

        <button onClick={submitPayment} disabled={submitting||!receipt} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<CreditCard size={16}/>}
          {t('storePage.submitPayment','Submit Payment')}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-3">{t('storePage.paymentReviewNote','Payment will be reviewed and approved within 24 hours')}</p>
      </div>
    </div>}
  </DashboardLayout>);
}
