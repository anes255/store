import React,{useState,useEffect} from'react';import{useTranslation}from'react-i18next';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Plus,X,Trash2,Edit,Package,RefreshCw,Check,Wifi,WifiOff,Zap,HelpCircle,CheckCircle,XCircle,AlertCircle}from'lucide-react';

const PRESETS=[
  {name:'Yalidine',logo:'Y',color:'from-yellow-500 to-orange-500',api_base_url:'https://api.yalidine.app/v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/parcels/?tracking={tracking_number}',api_status_path:'data.0.last_status',headers:['X-API-ID','X-API-TOKEN'],help:'yalidine.app → Dashboard → API → copy API ID and API Token'},
  {name:'ZR Express',logo:'Z',color:'from-blue-500 to-cyan-500',api_base_url:'https://api.zrexpress.com/api',api_auth_type:'bearer',api_tracking_endpoint:'/shipment/tracking/{tracking_number}',api_status_path:'data.current_status',headers:[],help:'zrexpress.com → Dashboard → Settings → API → copy token'},
  {name:'Maystro Delivery',logo:'M',color:'from-purple-500 to-pink-500',api_base_url:'https://api.maystro-delivery.com/api/v1',api_auth_type:'bearer',api_tracking_endpoint:'/tracking/{tracking_number}',api_status_path:'data.status',headers:[],help:'Contact Maystro support for API access'},
  {name:'NOEST',logo:'N',color:'from-green-500 to-emerald-500',api_base_url:'https://api.noest.dz/v1',api_auth_type:'bearer',api_tracking_endpoint:'/parcels/track/{tracking_number}',api_status_path:'data.status',headers:[],help:'Contact NOEST for API credentials'},
];

const EMPTY={name:'',base_rate:'',phone:'',tracking_url:'',api_base_url:'',api_auth_type:'none',api_key:'',api_headers:{},api_tracking_endpoint:'',api_status_path:'',use_api:false};

export default function ShippingPartners(){
  const{t}=useTranslation();
  const{currentStore}=useStoreManagement();
  const[companies,setCompanies]=useState([]);const[loading,setLoading]=useState(true);
  const[showModal,setShowModal]=useState(false);const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({...EMPTY});
  const[search,setSearch]=useState('');const[testing,setTesting]=useState(null);
  const[step,setStep]=useState('pick');
  const[showHelp,setShowHelp]=useState(false);
  const[testResult,setTestResult]=useState(null);const[testingForm,setTestingForm]=useState(false);

  const load=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const save=async()=>{
    if(!form.name)return toast.error(t('storePage.companyNameRequired','Company name required'));
    const payload={...form,provider_type:form.api_base_url?'api':'manual',api_headers:form.api_headers||{}};
    try{
      if(editing){await api.put(`/manage/stores/${currentStore.id}/delivery-companies/${editing.id}`,payload);toast.success(t('storePage.updatedExclaim','Updated!'));}
      else{await api.post(`/manage/stores/${currentStore.id}/delivery-companies`,payload);toast.success(t('storePage.addedExclaim','Added!'));}
      setShowModal(false);setEditing(null);setForm({...EMPTY});setStep('pick');setTestResult(null);load();
    }catch{toast.error(t('storePage.failed','Failed'));}
  };

  const del=async(id)=>{if(!confirm(t('storePage.removeConfirm','Remove?')))return;try{await api.delete(`/manage/stores/${currentStore.id}/delivery-companies/${id}`);toast.success(t('storePage.removed','Removed'));load();}catch{toast.error(t('storePage.failed','Failed'));}};

  const openEdit=(c)=>{
    const headers=typeof c.api_headers==='string'?JSON.parse(c.api_headers||'{}'):(c.api_headers||{});
    setEditing(c);setForm({name:c.name,base_rate:c.base_rate||'',phone:c.phone||'',tracking_url:c.tracking_url||'',
      api_base_url:c.api_base_url||'',api_auth_type:c.api_auth_type||'none',api_key:c.api_key||'',api_headers:headers,
      api_tracking_endpoint:c.api_tracking_endpoint||'',api_status_path:c.api_status_path||'',use_api:!!c.api_base_url});
    setStep('form');setTestResult(null);setShowModal(true);
  };

  const pickPreset=(p)=>{
    const h={};if(p.headers)p.headers.forEach(k=>{h[k]='';});
    setForm({...EMPTY,name:p.name,api_base_url:p.api_base_url,api_auth_type:p.api_auth_type,
      api_tracking_endpoint:p.api_tracking_endpoint,api_status_path:p.api_status_path,api_headers:h,use_api:true});
    setStep('form');setTestResult(null);
  };

  const testSaved=async(id)=>{
    setTesting(id);
    try{const{data}=await api.post(`/manage/stores/${currentStore.id}/delivery-companies/${id}/test`,{});
      if(data.ok)toast.success(data.message);else toast.error(data.error||t('storePage.failed','Failed'));
    }catch{toast.error(t('storePage.failed','Failed'));}
    setTesting(null);
  };

  const testFormConfig=async()=>{
    if(!form.api_base_url)return toast.error(t('storePage.enterApiBaseUrlFirst','Enter API Base URL first'));
    setTestingForm(true);setTestResult(null);
    try{
      const{data}=await api.post(`/manage/stores/${currentStore.id}/delivery-companies/test-config`,{
        api_base_url:form.api_base_url,api_auth_type:form.api_auth_type,api_key:form.api_key,
        api_headers:form.api_headers,api_tracking_endpoint:form.api_tracking_endpoint,api_status_path:form.api_status_path
      });
      setTestResult(data);
    }catch(e){setTestResult({ok:false,error:e.response?.data?.error||e.message,results:{}});}
    setTestingForm(false);
  };

  const addHeader=()=>setForm({...form,api_headers:{...form.api_headers,['']:''}});
  const removeHeader=(k)=>{const h={...form.api_headers};delete h[k];setForm({...form,api_headers:h});};

  const filtered=companies.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));

  const TestIcon=({ok})=>ok===true?<CheckCircle size={14} className="text-emerald-500"/>:ok===false?<XCircle size={14} className="text-red-500"/>:<AlertCircle size={14} className="text-gray-300"/>;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold">{t('storePage.shippingPartners','Shipping Partners')}</h1><p className="text-sm text-gray-400 mt-1">{t('storePage.addYourDeliveryCompanies','Add your delivery companies')}</p></div>
      <button onClick={()=>{setEditing(null);setForm({...EMPTY});setStep('pick');setTestResult(null);setShowModal(true);}} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/>{t('storePage.addCompany','Add Company')}</button>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.partners','Partners')}</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">{t('storePage.apiConnected','API Connected')}</p><p className="text-2xl font-black text-emerald-600 mt-1">{companies.filter(c=>c.api_base_url).length}</p></div>
      <div className="glass-card-solid p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.avgRate','Avg Rate')}</p><p className="text-2xl font-black text-gray-900 mt-1">{companies.length?Math.round(companies.reduce((s,c)=>s+parseFloat(c.base_rate||0),0)/companies.length):0} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{t('storePage.noDeliveryCompaniesYet','No delivery companies yet')}</p></div>
    ):(
      <div className="space-y-3">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><p className="font-bold text-gray-900 text-lg">{c.name}</p>
                  {c.api_base_url?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Wifi size={8}/>{t('storePage.liveTracking','LIVE TRACKING')}</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">{t('storePage.manual','MANUAL')}</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {parseFloat(c.base_rate)>0&&<span><Package size={12} className="inline mr-1"/>{c.base_rate} DZD</span>}
                  {c.phone&&<span>{c.phone}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {c.api_base_url&&<button onClick={()=>testSaved(c.id)} disabled={testing===c.id} className="p-2.5 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-500" title={t('storePage.testApi','Test API')}>{testing===c.id?<div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"/>:<RefreshCw size={16}/>}</button>}
                <button onClick={()=>openEdit(c)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-500"><Edit size={16}/></button>
                <button onClick={()=>del(c.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowModal(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>

      {/* STEP 1 */}
      {step==='pick'&&!editing&&<>
        <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">{t('storePage.addDeliveryCompany','Add Delivery Company')}</h2><button onClick={()=>setShowModal(false)}><X size={20}/></button></div>
        <p className="text-sm text-gray-500 mb-4">{t('storePage.quickSetup','Quick setup or add any company you want.')}</p>
        <div className="space-y-2 mb-4">
          {PRESETS.map(p=>(
            <button key={p.name} onClick={()=>pickPreset(p)} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-4 transition-all">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>{p.logo}</div>
              <div className="flex-1"><p className="font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{t('storePage.preConfigured','Pre-configured — just paste credentials')}</p></div>
              <Wifi size={16} className="text-emerald-500 shrink-0"/>
            </button>
          ))}
        </div>
        <div className="border-t pt-4">
          <button onClick={()=>{setForm({...EMPTY});setStep('form');}} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-4 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0"><Plus size={20}/></div>
            <div className="flex-1"><p className="font-bold text-gray-900">{t('storePage.anyOtherCompany','Any Other Company')}</p><p className="text-xs text-gray-400">{t('storePage.anyOtherCompanyDesc','Add any company — with or without API')}</p></div>
          </button>
          <button onClick={()=>{setForm({...EMPTY,use_api:true,api_auth_type:'bearer'});setStep('form');}} className="w-full mt-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 text-left flex items-center gap-4 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0"><Zap size={20}/></div>
            <div className="flex-1"><p className="font-bold text-gray-900">{t('storePage.customApiOnly','Custom company (API key only)')}</p><p className="text-xs text-gray-500">{t('storePage.customApiOnlyDesc','Just paste a bearer token to enable live tracking')}</p></div>
          </button>
        </div>
      </>}

      {/* STEP 2 */}
      {step==='form'&&<>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{editing?t('storePage.edit','Edit'):t('storePage.add','Add')} {form.name||t('storePage.company','Company')}</h2>
          <button onClick={()=>setShowModal(false)}><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div><label className="input-label">{t('storePage.companyNameRequired2','Company Name *')}</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={t('storePage.anyCompanyName','Any company name')}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">{t('storePage.baseRateDzd','Base Rate (DZD)')}</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
            <div><label className="input-label">{t('storePage.phone','Phone')}</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0555123456"/></div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="font-bold text-sm text-gray-900">{t('storePage.enableApiTracking','Enable API Tracking')}</label>
              <button onClick={()=>{setForm({...form,use_api:!form.use_api});setTestResult(null);}} className={`w-11 h-6 rounded-full transition-colors relative ${form.use_api?'bg-brand-500':'bg-gray-300'}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.use_api?'translate-x-5':'translate-x-0.5'}`}/></button>
            </div>
          </div>

          {!form.use_api&&(
            <div><label className="input-label">{t('storePage.trackingUrlOptional','Tracking URL (optional)')}</label><input className="input-field text-sm" value={form.tracking_url} onChange={e=>setForm({...form,tracking_url:e.target.value})} placeholder="https://company.com/track/{tracking_number}"/><p className="text-[10px] text-gray-400 mt-1">{t('storePage.useTrackingPlaceholder','Use {tracking_number} as placeholder')}</p></div>
          )}

          {form.use_api&&(<div className="space-y-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-2"><Zap size={14}/>{t('storePage.apiConfiguration','API Configuration')}</p>
              <button onClick={()=>setShowHelp(!showHelp)} className="text-xs text-emerald-600 flex items-center gap-1 hover:underline"><HelpCircle size={12}/>{t('storePage.help','Help')}</button>
            </div>

            {showHelp&&<div className="p-3 bg-white rounded-lg text-xs text-gray-600 space-y-2">
              <p><b>{t('storePage.apiBaseUrlLabel','API Base URL:')}</b> {t('storePage.apiBaseUrlHelp','Root URL of the API. Example:')} <code className="bg-gray-100 px-1 rounded">https://api.company.com/v1</code></p>
              <p><b>{t('storePage.authTypeLabel','Auth Type:')}</b> {t('storePage.authTypeHelp','"Bearer Token" = one token. "Custom Headers" = key-value pairs like Yalidine uses.')}</p>
              <p><b>{t('storePage.trackingEndpointLabel','Tracking Endpoint:')}</b> {t('storePage.trackingEndpointHelp','Path to check parcel status. Use')} <code className="bg-gray-100 px-1 rounded">{'{tracking_number}'}</code> {t('storePage.asPlaceholder','as placeholder.')}</p>
              <p><b>{t('storePage.statusPathLabel','Status Path:')}</b> {t('storePage.statusPathHelp','Dot-path to status in JSON response. Example:')} <code className="bg-gray-100 px-1 rounded">data.0.last_status</code></p>
              <p>{t('storePage.getFromDocs',"Get these from your delivery company's API documentation.")}</p>
            </div>}

            {PRESETS.filter(p=>p.name===form.name).map(p=>(<p key={p.name} className="text-xs text-emerald-600">💡 {p.help}</p>))}

            <div><label className="text-xs font-bold text-emerald-700">{t('storePage.apiBaseUrlRequired','API Base URL *')}</label><input className="input-field font-mono text-sm" value={form.api_base_url} onChange={e=>setForm({...form,api_base_url:e.target.value})} placeholder="https://api.company.com/v1"/></div>

            <div><label className="text-xs font-bold text-emerald-700">{t('storePage.authenticationType','Authentication Type')}</label>
              <select className="input-field text-sm" value={form.api_auth_type} onChange={e=>setForm({...form,api_auth_type:e.target.value,api_headers:e.target.value==='custom_headers'?form.api_headers:{}})}>
                <option value="none">{t('storePage.noAuthentication','No Authentication')}</option>
                <option value="bearer">{t('storePage.bearerToken','Bearer Token')}</option>
                <option value="custom_headers">{t('storePage.customHeaders','Custom Headers')}</option>
              </select>
            </div>

            {form.api_auth_type==='bearer'&&(
              <div><label className="text-xs font-bold text-emerald-700">{t('storePage.apiTokenRequired','API Token *')}</label><input className="input-field font-mono text-sm" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})} placeholder={t('storePage.pasteYourToken','Paste your token')}/></div>
            )}

            {form.api_auth_type==='custom_headers'&&(
              <div>
                <div className="flex items-center justify-between mb-1"><label className="text-xs font-bold text-emerald-700">{t('storePage.headers','Headers')}</label><button onClick={addHeader} className="text-xs text-emerald-600 font-bold hover:underline">{t('storePage.plusAdd','+ Add')}</button></div>
                {Object.entries(form.api_headers).map(([key,val],i)=>(
                  <div key={i} className="flex gap-2 mb-1">
                    <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder={t('storePage.headerName','Header-Name')} value={key} onChange={e=>{const h={...form.api_headers};delete h[key];h[e.target.value]=val;setForm({...form,api_headers:h});}}/>
                    <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder={t('storePage.value','value')} value={val} onChange={e=>setForm({...form,api_headers:{...form.api_headers,[key]:e.target.value}})}/>
                    <button onClick={()=>removeHeader(key)} className="p-1 text-red-400 hover:text-red-600"><X size={14}/></button>
                  </div>
                ))}
                {Object.keys(form.api_headers).length===0&&<p className="text-xs text-emerald-500">{t('storePage.clickAddHeaders','Click "+ Add" to add headers')}</p>}
              </div>
            )}

            <div><label className="text-xs font-bold text-emerald-700">{t('storePage.trackingEndpointRequired','Tracking Endpoint *')}</label><input className="input-field font-mono text-sm" value={form.api_tracking_endpoint} onChange={e=>setForm({...form,api_tracking_endpoint:e.target.value})} placeholder="/parcels/?tracking={tracking_number}"/><p className="text-[10px] text-emerald-500 mt-1">{t('storePage.useTrackingPlaceholder','Use {tracking_number} as placeholder')}</p></div>

            <div><label className="text-xs font-bold text-emerald-700">{t('storePage.statusFieldPath','Status Field Path')}</label><input className="input-field font-mono text-sm" value={form.api_status_path} onChange={e=>setForm({...form,api_status_path:e.target.value})} placeholder="data.0.last_status"/></div>

            {/* TEST BUTTON */}
            <button onClick={testFormConfig} disabled={testingForm} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
              {testingForm?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<RefreshCw size={14}/>}
              {t('storePage.testConnection','Test Connection')}
            </button>

            {/* TEST RESULTS */}
            {testResult&&(
              <div className={`p-4 rounded-xl ${testResult.ok?'bg-emerald-100 border border-emerald-300':'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-bold mb-3 ${testResult.ok?'text-emerald-800':'text-red-700'}`}>{testResult.ok?t('storePage.allTestsPassed','✅ All tests passed'):'❌ '+testResult.error}</p>
                <div className="space-y-2">
                  {testResult.results?.connection&&(
                    <div className="flex items-center gap-2 text-xs">
                      <TestIcon ok={testResult.results.connection.ok}/>
                      <span className="font-bold text-gray-700">{t('storePage.serverConnection','Server Connection:')}</span>
                      <span className="text-gray-500">{testResult.results.connection.message}</span>
                    </div>
                  )}
                  {testResult.results?.tracking&&(
                    <div className="flex items-center gap-2 text-xs">
                      <TestIcon ok={testResult.results.tracking.ok}/>
                      <span className="font-bold text-gray-700">{t('storePage.trackingEndpointColon','Tracking Endpoint:')}</span>
                      <span className="text-gray-500">{testResult.results.tracking.message}</span>
                    </div>
                  )}
                  {testResult.results?.status_extraction&&(
                    <div className="flex items-center gap-2 text-xs">
                      <TestIcon ok={testResult.results.status_extraction.ok}/>
                      <span className="font-bold text-gray-700">{t('storePage.statusExtraction','Status Extraction:')}</span>
                      <span className="text-gray-500">{testResult.results.status_extraction.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>)}
        </div>

        <div className="flex gap-3 mt-5">
          {!editing&&<button onClick={()=>{setStep('pick');setTestResult(null);}} className="btn-ghost flex-1">{t('storePage.back','Back')}</button>}
          {editing&&<button onClick={()=>setShowModal(false)} className="btn-ghost flex-1">{t('storePage.cancel','Cancel')}</button>}
          <button onClick={save} className="btn-primary flex-1">{editing?t('storePage.update','Update'):t('storePage.add','Add')} {t('storePage.company','Company')}</button>
        </div>
      </>}

    </div></div>}
  </DashboardLayout>);
}
