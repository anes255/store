import React,{useState,useEffect} from'react';
import useHighlight from'../../utils/useHighlight';
import { useTranslation } from 'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import api,{aiApi,API_URL}from'../../utils/api';
import toast from'react-hot-toast';
import{Star,Check,X,Trash2,RefreshCw,Shield,MessageCircle,ThumbsUp,ThumbsDown,Sparkles,Search,EyeOff,Eye,Flag,Reply,Camera,Video,ShieldCheck,BarChart3} from'lucide-react';
import{Link}from'react-router-dom';
import{CRITERIA}from'../../components/shared/ReviewForm';
import ReviewInsights from'./ReviewInsights';

const Stars=({rating,size=14})=>(<div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={size} className={i<=rating?'text-amber-400 fill-amber-400':'text-gray-300'}/>)}</div>);

export default function SmartReviews(){
  const { t } = useTranslation();
  const{currentStore}=useStoreManagement();
  const[reviews,setReviews]=useState([]);const[stats,setStats]=useState({});
  useHighlight(reviews);
  const[loading,setLoading]=useState(true);const[filter,setFilter]=useState('pending');

  const load=()=>{if(!currentStore?.id)return;
    api.get(`/manage/stores/${currentStore.id}/reviews?filter=${filter}`).then(r=>{setReviews(r.data.reviews||[]);setStats(r.data.stats||{});}).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[currentStore?.id,filter]);

  // hide / restore / mark reported. The old approve and reject calls stay
  // as they are; this covers the statuses they never had.
  const setStatus=async(id,status,action)=>{
    try{
      await api.patch(`/manage/stores/${currentStore.id}/reviews/${id}/status`,{status,action});
      toast.success(t('storePage.reviewUpdated','Review updated'));
      load();
    }catch(e){toast.error(e?.response?.data?.error||t('storePage.failed','Failed'));}
  };

  // One official reply per review, editable afterwards.
  const[replyTo,setReplyTo]=useState(null);
  const[replyText,setReplyText]=useState('');
  const sendReply=async()=>{
    if(!replyText.trim())return;
    try{
      await api.put(`/manage/stores/${currentStore.id}/reviews/${replyTo.id}/response`,{response:replyText});
      toast.success(t('storePage.replySent','Reply published'));
      setReplyTo(null);setReplyText('');load();
    }catch(e){toast.error(e?.response?.data?.error||t('storePage.failed','Failed'));}
  };
  const removeReply=async(id)=>{
    try{await api.delete(`/manage/stores/${currentStore.id}/reviews/${id}/response`);load();}
    catch(e){toast.error(e?.response?.data?.error||t('storePage.failed','Failed'));}
  };

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

  // Bulk auto-moderate every pending review without admin clicks.
  const[autoRunning,setAutoRunning]=useState(false);
  const[autoMode,setAutoMode]=useState(()=>localStorage.getItem('smartReviews.autoMode')==='1');
  useEffect(()=>{localStorage.setItem('smartReviews.autoMode',autoMode?'1':'0');},[autoMode]);

  const aiModerateAll=async()=>{
    const pending=reviews.filter(r=>!r.is_approved&&!r.is_rejected);
    if(!pending.length){toast(t('storePage.nothingToModerate','Nothing to moderate'));return;}
    if(!confirm(t('storePage.confirmAutoModerate','Auto-moderate {{n}} pending reviews with AI? Reviews scoring 70+ will be approved, others rejected.',{n:pending.length}).replace('{{n}}',pending.length)))return;
    setAutoRunning(true);
    let ok=0,fail=0;
    for(const r of pending){
      try{
        const{data}=await aiApi.moderateReview({content:r.content||'',rating:r.rating||5});
        if(data.score>=70)await api.patch(`/manage/stores/${currentStore.id}/reviews/${r.id}/approve`,{ai_moderation_score:data.score,ai_moderation_reason:data.reason});
        else await api.patch(`/manage/stores/${currentStore.id}/reviews/${r.id}/reject`,{ai_moderation_score:data.score,ai_moderation_reason:data.reason});
        ok++;
      }catch{fail++;}
    }
    setAutoRunning(false);
    toast.success(t('storePage.autoModerateDone','Done: {{ok}} processed, {{fail}} failed').replace('{{ok}}',ok).replace('{{fail}}',fail));
    load();
  };

  // Background auto-mode: when admin enables it, every new pending review is
  // moderated automatically the next time the page polls or refreshes.
  useEffect(()=>{
    if(!autoMode||loading||autoRunning)return;
    const pending=reviews.filter(r=>!r.is_approved&&!r.is_rejected&&r.ai_moderation_score==null);
    if(!pending.length)return;
    (async()=>{
      setAutoRunning(true);
      for(const r of pending){
        try{
          const{data}=await aiApi.moderateReview({content:r.content||'',rating:r.rating||5});
          if(data.score>=70)await api.patch(`/manage/stores/${currentStore.id}/reviews/${r.id}/approve`,{ai_moderation_score:data.score,ai_moderation_reason:data.reason});
          else await api.patch(`/manage/stores/${currentStore.id}/reviews/${r.id}/reject`,{ai_moderation_score:data.score,ai_moderation_reason:data.reason});
        }catch{}
      }
      setAutoRunning(false);
      load();
    })();
  },[autoMode,reviews,loading]);

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div><h1 className="text-2xl font-bold">{t('storePage.smartReviewsTitle','Smart Reviews')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.smartReviewsSubtitle','AI-powered review moderation')}</p></div>
      <div className="flex items-center gap-2 flex-wrap">
        <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-xs font-bold ${autoMode?'border-emerald-500 bg-emerald-50 text-emerald-700':'border-gray-200 bg-white text-gray-600'}`}>
          <input type="checkbox" checked={autoMode} onChange={e=>setAutoMode(e.target.checked)} className="w-4 h-4 rounded text-emerald-600"/>
          <Sparkles size={14}/>{t('storePage.autoModerate','Auto-moderate new reviews')}
        </label>
        <button onClick={aiModerateAll} disabled={autoRunning} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-brand-500 text-white text-xs font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
          {autoRunning?<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Sparkles size={14}/>}
          {autoRunning?t('storePage.aiRunning','Running…'):t('storePage.aiModerateAll','AI Moderate All Pending')}
        </button>
        <button onClick={load} className="btn-ghost text-sm flex items-center gap-2"><RefreshCw size={14}/>{t('storePage.refresh','Refresh')}</button>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.total','Total')}</p><p className="text-2xl font-black text-gray-900 mt-1">{stats.total||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-amber-500 uppercase">{t('storePage.pending','Pending')}</p><p className="text-2xl font-black text-amber-600 mt-1">{stats.pending||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">{t('storePage.approvedLabel','Approved')}</p><p className="text-2xl font-black text-emerald-600 mt-1">{stats.approved||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-red-500 uppercase">{t('storePage.rejectedLabel','Rejected')}</p><p className="text-2xl font-black text-red-600 mt-1">{stats.rejected||0}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-brand-500 uppercase">{t('storePage.avgRating','Avg Rating')}</p><p className="text-2xl font-black text-brand-600 mt-1">{stats.avg_rating||'—'}</p></div>
    </div>

    <ReviewInsights storeId={currentStore?.id}/>

    <div className="flex gap-2 mb-6 flex-wrap">
      {[{k:'pending',l:t('storePage.pending','Pending'),c:'amber'},{k:'approved',l:t('storePage.approvedLabel','Approved'),c:'emerald'},{k:'reported',l:t('storePage.reportedLabel','Reported'),c:'orange'},{k:'hidden',l:t('storePage.hiddenLabel','Hidden'),c:'gray'},{k:'rejected',l:t('storePage.rejectedLabel','Rejected'),c:'red'},{k:'all',l:t('storePage.all','All')}].map(f=>(
        <button key={f.k} onClick={()=>setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-bold ${filter===f.k?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.l}</button>
      ))}
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:reviews.length===0?(
      <div className="glass-card-solid p-16 text-center"><MessageCircle size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{filter==='pending'?t('storePage.noPendingReviews','No pending reviews'):t('storePage.noReviewsFound','No reviews found')}</p></div>
    ):(
      <div className="space-y-3">
        {reviews.map(r=>(
          <div key={r.id} data-hl-id={r.id} className={`glass-card-solid p-5 ${r.is_approved?'ring-1 ring-emerald-200':r.is_rejected?'ring-1 ring-red-200 opacity-60':''}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">{(r.customer_name||'?')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-gray-900">{r.customer_name}</span>
                  <Stars rating={r.rating}/>
                  {r.verified_purchase&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"><ShieldCheck size={9}/>{t('storePage.badgeVerified','VERIFIED')}</span>}
                  {(r.status==='reported')&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 inline-flex items-center gap-1"><Flag size={9}/>{t('storePage.badgeReported','REPORTED')} {r.report_count>0?`(${r.report_count})`:''}</span>}
                  {(r.status==='hidden')&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">{t('storePage.badgeHidden','HIDDEN')}</span>}
                  {r.is_approved&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{t('storePage.badgeApproved','APPROVED')}</span>}
                  {r.is_rejected&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{t('storePage.badgeRejected','REJECTED')}</span>}
                  {!r.is_approved&&!r.is_rejected&&<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{t('storePage.badgePending','PENDING')}</span>}
                </div>
                {r.product_name&&<p className="text-xs text-gray-400 mb-1">{t('storePage.product','Product')}: {r.product_name}</p>}
                {r.title&&<p className="font-semibold text-sm text-gray-800">{r.title}</p>}
                {r.content&&<p className="text-sm text-gray-600 mt-1">{r.content}</p>}

                {CRITERIA.some(c=>r[`${c.key}_rating`])&&(
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {CRITERIA.filter(c=>r[`${c.key}_rating`]).map(c=>(
                      <span key={c.key} className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                        {t(`store.criteria.${c.key}`,c.label)}
                        <Stars rating={r[`${c.key}_rating`]} size={10}/>
                      </span>
                    ))}
                  </div>
                )}

                {Array.isArray(r.media)&&r.media.length>0&&(
                  <div className="flex gap-2 mt-2">
                    {r.media.map(m=>(
                      <a key={m.id} href={`${API_URL}/store/${currentStore?.slug}/review-media/${m.id}`} target="_blank" rel="noreferrer"
                         className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 grid place-items-center shrink-0">
                        {m.kind==='video'
                          ? <Video size={16} className="text-gray-500"/>
                          : <img src={`${API_URL}/store/${currentStore?.slug}/review-media/${m.id}`} alt="" loading="lazy" className="w-full h-full object-cover"/>}
                      </a>
                    ))}
                  </div>
                )}

                {Array.isArray(r.reports)&&r.reports.length>0&&(
                  <div className="mt-2 p-2 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[11px] font-bold text-orange-700 flex items-center gap-1"><Flag size={10}/>{t('storePage.reportedFor','Reported for')}: {[...new Set(r.reports.map(x=>x.reason))].join(', ')}</p>
                  </div>
                )}

                {r.seller_response&&(
                  <div className="mt-2 p-3 rounded-xl bg-brand-50 border-s-2 border-brand-400">
                    <p className="text-[11px] font-bold text-brand-700 flex items-center gap-1.5"><Reply size={11}/>{t('storePage.yourReply','Your reply')}</p>
                    <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{r.seller_response}</p>
                    <div className="flex gap-3 mt-1">
                      <button onClick={()=>{setReplyTo(r);setReplyText(r.seller_response);}} className="text-[11px] font-bold text-brand-600 hover:underline">{t('storePage.edit','Edit')}</button>
                      <button onClick={()=>removeReply(r.id)} className="text-[11px] font-bold text-gray-400 hover:underline">{t('storePage.remove','Remove')}</button>
                    </div>
                  </div>
                )}

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
                {!r.seller_response&&<button onClick={()=>{setReplyTo(r);setReplyText('');}} className="p-2.5 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-500" title={t('storePage.reply','Reply')}><Reply size={16}/></button>}
                {r.status!=='hidden'
                  ? <button onClick={()=>setStatus(r.id,'hidden','hide')} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700" title={t('storePage.hide','Hide')}><EyeOff size={16}/></button>
                  : <button onClick={()=>setStatus(r.id,'approved','restore')} className="p-2.5 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-600" title={t('storePage.restore','Restore')}><Eye size={16}/></button>}
                {!r.ai_moderation_score&&<button onClick={()=>aiModerate(r)} className="p-2.5 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-500" title={t('storePage.aiModerate','AI Moderate')}><Sparkles size={16}/></button>}
                <button onClick={()=>del(r.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500" title={t('storePage.delete','Delete')}><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {replyTo&&(
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={()=>setReplyTo(null)}>
        <div className="bg-white rounded-3xl w-full max-w-lg p-5" onClick={e=>e.stopPropagation()}>
          <p className="font-black text-gray-900">{t('storePage.replyTo','Reply to {{n}}',{n:replyTo.customer_name})}</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">{t('storePage.replyHint','Your reply is shown under the review, marked as coming from the store.')}</p>
          {replyTo.content&&<p className="text-sm text-gray-500 italic bg-gray-50 rounded-xl p-3 mb-3">“{replyTo.content}”</p>}
          <textarea rows={4} maxLength={1000} className="input-field w-full text-sm" value={replyText}
            onChange={e=>setReplyText(e.target.value)} placeholder={t('storePage.replyPlaceholder','Thank you for your feedback…')}/>
          <div className="flex gap-2 mt-3">
            <button onClick={()=>setReplyTo(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm">{t('storePage.cancel','Cancel')}</button>
            <button onClick={sendReply} disabled={!replyText.trim()} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm disabled:opacity-50">{t('storePage.publishReply','Publish reply')}</button>
          </div>
        </div>
      </div>
    )}
  </DashboardLayout>);
}
