import React,{useState,useEffect} from'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import api,{aiApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Star,Check,X,Trash2,RefreshCw,Shield,MessageCircle,ThumbsUp,ThumbsDown,Sparkles,Search} from'lucide-react';

const Stars=({rating,size=14})=>(<div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={size} className={i<=rating?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>);

export default function SmartReviews(){
  const { t } = useTranslation();
  const{currentStore}=useStoreManagement();
  const[reviews,setReviews]=useState([]);const[stats,setStats]=useState({});
  const[loading,setLoading]=useState(true);const[filter,setFilter]=useState('pending');

  const load=()=>{if(!currentStore?.id)return;
    api.get(`/manage/stores/${currentStore.id}/reviews?filter=${filter}`).then(r=>{setReviews(r.data.reviews||[]);setStats(r.data.stats||{});}).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[currentStore?.id,filter]);

  const approve=async(id)=>{try{await api.patch(`/manage/stores/${currentStore.id}/reviews/${id}/approve`,{});toast.success(t('storePage.approved','Approved'));load();}catch{toast.error(t('storePage.failed','Failed'));}};
  const reject=async(id)=>{try{await api.patch(`/manage/stores/${currentStore.id}/reviews/${id}/reject`,{});toast.success(t('storePage.rejected','Rejected'));load();}catch{toast.error(t('storePage.failed','Failed'));}};
  const del=async(id)=>{if(!confirm(t('storePage.deleteReviewConfirm','Delete this review?')))return;try{await api.delete(`/manage/stores/${currentStore.id}/reviews/${id}`);toast.success(t('storePage.deleted','Deleted'));load();}catch{toast.error(t('storePage.failed','Failed'));}};

  const aiModerate=async(review)=>{
    try{
      const{data}=await aiApi.moderateReview({content:review.content,rating:review.rating});
      toast.success(`${t('storePage.aiScore','AI Score')}: ${data.score}/100 — ${data.reason}`);
      if(data.score>=70)approve(review.id);else reject(review.id);
    }catch{toast.error(t('storePage.aiModerationFailed','AI moderation failed'));}
  };

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">{t('storePage.smartReviewsTitle','Smart Reviews')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.smartReviewsSubtitle','AI-powered review moderation')}</p></div>
      <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>{t('storePage.refresh','Refresh')}</button>
    </div>

    <div className="grid grid-cols-5 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.total','Total')}</p><p className="text-2xl font-black text-gray-900 mt-1">{stats.total||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-amber-500 uppercase">{t('storePage.pending','Pending')}</p><p className="text-2xl font-black text-amber-600 mt-1">{stats.pending||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">{t('storePage.approvedLabel','Approved')}</p><p className="text-2xl font-black text-emerald-600 mt-1">{stats.approved||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-red-500 uppercase">{t('storePage.rejectedLabel','Rejected')}</p><p className="text-2xl font-black text-red-600 mt-1">{stats.rejected||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-brand-500 uppercase">{t('storePage.avgRating','Avg Rating')}</p><p className="text-2xl font-black text-brand-600 mt-1">{stats.avg_rating||'—'}</p></div>
    </div>

    <div className="flex gap-2 mb-6">
      {[{k:'pending',l:t('storePage.pending','Pending'),c:'amber'},{k:'approved',l:t('storePage.approvedLabel','Approved'),c:'emerald'},{k:'rejected',l:t('storePage.rejectedLabel','Rejected'),c:'red'},{k:'all',l:t('storePage.all','All')}].map(f=>(
        <button key={f.k} onClick={()=>setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter===f.k?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
      ))}
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:reviews.length===0?(
      <div className="glass-card-solid p-16 text-center"><MessageCircle size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{filter==='pending'?t('storePage.noPendingReviews','No pending reviews'):t('storePage.noReviewsFound','No reviews found')}</p></div>
    ):(
      <div className="space-y-3">
        {reviews.map(r=>(
          <div key={r.id} className={`glass-card-solid p-5 ${r.is_approved?'ring-1 ring-emerald-200':r.is_rejected?'ring-1 ring-red-200 opacity-60':''}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">{(r.customer_name||'?')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-gray-900">{r.customer_name}</span>
                  <Stars rating={r.rating}/>
                  {r.is_approved&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{t('storePage.badgeApproved','APPROVED')}</span>}
                  {r.is_rejected&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{t('storePage.badgeRejected','REJECTED')}</span>}
                  {!r.is_approved&&!r.is_rejected&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{t('storePage.badgePending','PENDING')}</span>}
                </div>
                {r.product_name&&<p className="text-xs text-gray-400 mb-1">{t('storePage.product','Product')}: {r.product_name}</p>}
                {r.title&&<p className="font-semibold text-sm text-gray-800">{r.title}</p>}
                {r.content&&<p className="text-sm text-gray-600 mt-1">{r.content}</p>}

                {r.ai_moderation_score!=null&&(
                  <div className="flex items-center gap-2 mt-2">
                    <Shield size={12} className="text-brand-500"/>
                    <span className={`text-xs font-bold ${r.ai_moderation_score>=70?'text-emerald-600':r.ai_moderation_score>=40?'text-amber-600':'text-red-600'}`}>{t('storePage.aiScore','AI Score')}: {r.ai_moderation_score}/100</span>
                    {r.ai_moderation_reason&&<span className="text-xs text-gray-400">— {r.ai_moderation_reason}</span>}
                  </div>
                )}

                <p className="text-[10px] text-gray-300 mt-2">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!r.is_approved&&<button onClick={()=>approve(r.id)} className="p-2.5 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-500" title={t('storePage.approve','Approve')}><ThumbsUp size={16}/></button>}
                {!r.is_rejected&&<button onClick={()=>reject(r.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500" title={t('storePage.reject','Reject')}><ThumbsDown size={16}/></button>}
                {!r.ai_moderation_score&&<button onClick={()=>aiModerate(r)} className="p-2.5 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-500" title={t('storePage.aiModerate','AI Moderate')}><Sparkles size={16}/></button>}
                <button onClick={()=>del(r.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500" title={t('storePage.delete','Delete')}><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </DashboardLayout>);
}
