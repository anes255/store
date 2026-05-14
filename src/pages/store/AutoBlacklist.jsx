import React,{useState,useEffect} from'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{orderApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Shield,Phone,Trash2,X,RefreshCw,Search,Zap}from'lucide-react';
export default function AutoBlacklist(){
  const { t } = useTranslation();
  const{currentStore}=useStoreManagement();
  const[list,setList]=useState([]);const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');
  const load=()=>{if(!currentStore?.id)return;setLoading(true);orderApi.getBlacklist(currentStore.id).then(r=>{
    // Filter only auto-blacklisted entries
    const auto=(r.data||[]).filter(b=>b.reason&&/auto|threshold|exceeded/i.test(b.reason));
    setList(auto);
  }).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);
  const remove=async(id)=>{if(!confirm(t('storePage.unblockConfirm','Unblock?')))return;try{await orderApi.removeBlacklist(currentStore.id,id);toast.success(t('storePage.unblocked','Unblocked'));load();}catch{toast.error(t('storePage.failed','Failed'));}};
  const filtered=list.filter(b=>!search||b.phone.includes(search)||(b.name||'').toLowerCase().includes(search.toLowerCase()));
  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold flex items-center gap-2"><Zap size={24} className="text-amber-500"/>{t('storePage.autoBlacklistTitle','Automatic Blacklist')}</h1><p className="text-sm text-gray-400 mt-1">{list.length} {t('storePage.autoBlockedNumbers','auto-blocked numbers')}</p><p className="text-xs text-gray-400 mt-1">{t('storePage.autoBlacklistDesc','Customers automatically blocked after exceeding the cancellation threshold. Configure in Settings → Customers.')}</p></div><div className="flex gap-2"><button onClick={load} className="btn-ghost text-xs"><RefreshCw size={14}/></button></div></div>
    <div className="relative max-w-sm mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9 !py-2 text-sm" placeholder={t('storePage.searchPlaceholder','Search...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?<div className="glass-card-solid p-16 text-center"><Shield size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500">{search?t('storePage.noMatches','No matches'):t('storePage.noAutoBlocked','No auto-blocked numbers. Enable auto-blacklist in Settings → Customers.')}</p></div>:
    <div className="space-y-2">{filtered.map(b=><div key={b.id} className="glass-card-solid p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Phone size={16} className="text-amber-600"/></div><div className="flex-1"><p className="font-bold text-gray-900">{b.phone}</p><p className="text-xs text-gray-400">{b.name||t('storePage.unknown','Unknown')} · {b.reason||'Auto-blocked'}</p>{b.cancelled_count>0&&<p className="text-[10px] text-red-500 font-bold">{b.cancelled_count} {t('storePage.cancellations','cancellations')}</p>}</div><div className="text-xs text-gray-400 shrink-0">{new Date(b.created_at).toLocaleDateString()}</div><button onClick={()=>remove(b.id)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></div>)}</div>}
  </DashboardLayout>);
}
