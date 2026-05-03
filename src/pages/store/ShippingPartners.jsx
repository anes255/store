import React,{useState,useEffect} from'react';import{useTranslation}from'react-i18next';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import api,{shippingApi} from'../../utils/api';import toast from'react-hot-toast';import{Search,Truck,Plus,X,Trash2,Edit,Package,RefreshCw,Check,Wifi,WifiOff,Zap,HelpCircle,CheckCircle,XCircle,AlertCircle,LayoutGrid,LayoutList,ArrowDownUp,Clock,Link2,Copy}from'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Verified carrier presets. Endpoints below have been cross-checked against
// each carrier's public docs / SDKs as of 2026. Auth schemes are the exact
// scheme each carrier requires (not all are Bearer):
//   • bearer            → Authorization: Bearer <token>
//   • token_prefix      → Authorization: Token <token>   (Maystro / Django REST)
//   • custom_headers    → arbitrary header pairs (Yalidine X-API-ID + X-API-TOKEN)
//   • query_params      → credentials appended to every URL (NOEST api_token + user_guid)
// `headers` lists the header NAMES the user needs to fill; `query_params`
// lists the query-string keys when auth_type === 'query_params'. Both are
// rendered as separate input fields in the modal.
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS=[
  {name:'Yalidine',logo:'Y',color:'from-yellow-500 to-orange-500',api_base_url:'https://api.yalidine.app/v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/parcels/{tracking_number}/',api_status_path:'last_status',headers:['X-API-ID','X-API-TOKEN'],query_params:[],help:'yalidine.app → Dashboard → Developers → copy API ID and API Token (both required)',verified:true,
    create_endpoint:'/parcels/',create_method:'POST',create_tracking_path:'',
    create_body_template:'[{"order_id":"{order_id}","firstname":"{customer_firstname}","familyname":"{customer_lastname}","contact_phone":"{customer_phone}","address":"{shipping_address}","to_commune_name":"{shipping_city}","to_wilaya_name":"{shipping_wilaya}","product_list":"{product_list}","price":{total},"do_insurance":false,"declared_value":{total},"freeshipping":false,"is_stopdesk":{is_stopdesk},"has_exchange":0,"product_to_collect":null}]'},
  {name:'ZR Express',logo:'Z',color:'from-blue-500 to-cyan-500',api_base_url:'https://procolis.com/api_v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/lire',api_status_path:'0.Situation',headers:['token','key'],query_params:[],help:'ZR Express runs on Procolis: dashboard → API → copy "token" and "key" (both required)',verified:true,method:'POST',body_template:'{"Colis":[{"Tracking":"{tracking_number}"}]}',
    create_endpoint:'/add_colis',create_method:'POST',create_tracking_path:'Colis.0.Tracking',
    create_body_template:'{"Colis":[{"Tracking":"{order_id}","TypeLivraison":"{is_stopdesk_int}","TypeColis":"0","Confrimee":"","Client":"{customer_name}","MobileA":"{customer_phone}","MobileB":"","Adresse":"{shipping_address}","IDWilaya":"{wilaya_code}","Commune":"{shipping_city}","Total":"{total}","Note":"{notes}","TProduit":"{product_list}","id_Externe":"{order_id}","Source":""}]}'},
  {name:'Procolis',logo:'P',color:'from-indigo-500 to-blue-500',api_base_url:'https://procolis.com/api_v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/lire',api_status_path:'0.Situation',headers:['token','key'],query_params:[],help:'procolis.com → Account → API → copy "token" and "key" headers (both required)',verified:true,method:'POST',body_template:'{"Colis":[{"Tracking":"{tracking_number}"}]}',
    create_endpoint:'/add_colis',create_method:'POST',create_tracking_path:'Colis.0.Tracking',
    create_body_template:'{"Colis":[{"Tracking":"{order_id}","TypeLivraison":"{is_stopdesk_int}","TypeColis":"0","Confrimee":"","Client":"{customer_name}","MobileA":"{customer_phone}","MobileB":"","Adresse":"{shipping_address}","IDWilaya":"{wilaya_code}","Commune":"{shipping_city}","Total":"{total}","Note":"{notes}","TProduit":"{product_list}","id_Externe":"{order_id}","Source":""}]}'},
  {name:'Maystro Delivery',logo:'M',color:'from-purple-500 to-pink-500',api_base_url:'https://backend.maystro-delivery.com/api/stores',api_auth_type:'token_prefix',api_tracking_endpoint:'/orders/?display_id={tracking_number}',api_status_path:'list.0.status_display',headers:[],query_params:[],help:'Maystro dashboard → Settings → API → copy your API Token (sent as "Authorization: Token <token>")',verified:true,
    create_endpoint:'/orders/',create_method:'POST',create_tracking_path:'display_id',
    create_body_template:'{"customer_name":"{customer_name}","customer_phone":"{customer_phone}","destination_text":"{shipping_address}","commune":"{shipping_city}","wilaya":"{shipping_wilaya}","product_price":{total},"products":[{"product_name":"{product_list}","quantity":{item_count},"product_id":""}],"display_id":"{order_id}","note_to_driver":"{notes}","express":false,"source":"api"}'},
  {name:'NOEST Express',logo:'N',color:'from-green-500 to-emerald-500',api_base_url:'https://app.noest-dz.com/api/public/v1',api_auth_type:'query_params',api_tracking_endpoint:'/get/trackings',api_status_path:'0.last_situation',headers:[],query_params:['api_token','user_guid'],help:'NOEST partner portal → API → copy api_token and user_guid (both required)',verified:true,method:'POST',
    create_endpoint:'/create/order',create_method:'POST',create_tracking_path:'tracking',
    create_body_template:''},
  {name:'EcoTrack',logo:'E',color:'from-teal-500 to-green-500',api_base_url:'https://app.ecotrack.dz/api/v1',api_auth_type:'bearer',api_tracking_endpoint:'/get/tracking/{tracking_number}',api_status_path:'data.activity.0.event',headers:[],query_params:[],help:'ecotrack.dz → Dashboard → API → copy your Bearer token (single token)',verified:true,
    create_endpoint:'/create/order',create_method:'POST',create_tracking_path:'tracking',
    create_body_template:'{"reference":"{order_id}","nom_client":"{customer_name}","telephone":"{customer_phone}","adresse":"{shipping_address}","code_wilaya":"{wilaya_code}","commune":"{shipping_city}","montant":"{total}","remarque":"{notes}","produit":"{product_list}","type":1,"stop_desk":{is_stopdesk_int},"quantite":{item_count}}'},
  {name:'Yassir Express',logo:'Y',color:'from-fuchsia-500 to-purple-600',api_base_url:'https://logistics.yassir.com/api/v1',api_auth_type:'custom_headers',api_tracking_endpoint:'/deliveries/{tracking_number}',api_status_path:'data.status',headers:['Authorization','X-Partner-ID'],query_params:[],help:'Yassir Express partner portal → API → copy Authorization (Bearer <token>) and Partner ID',verified:false},
  // ─── DHD (EcoTrack-based) ───────────────────────────────────────────────
  // DHD runs on the EcoTrack platform. Auth is a single Bearer token.
  {name:'DHD Livraison',logo:'D',color:'from-sky-500 to-blue-600',
    api_base_url:'https://dhd.ecotrack.dz/api/v1',
    api_auth_type:'bearer',
    api_tracking_endpoint:'/get/tracking/{tracking_number}',
    api_status_path:'data.activity.0.event',
    headers:[],query_params:[],
    help:'DHD partner portal (dhd.ecotrack.dz) → API → copy your Bearer token (single token)',
    verified:true,
    create_endpoint:'/create/order',
    create_method:'POST',
    create_tracking_path:'tracking',
    create_body_template:'{"reference":"{order_id}","nom_client":"{customer_name}","telephone":"{customer_phone}","adresse":"{shipping_address}","code_wilaya":"{wilaya_code}","commune":"{shipping_city}","montant":"{total}","remarque":"{notes}","produit":"{product_list}","type":1,"stop_desk":{is_stopdesk_int},"quantite":{item_count}}'},
  {name:'Aramex',logo:'A',color:'from-red-600 to-red-500',api_base_url:'https://ws.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc',api_auth_type:'custom_headers',api_tracking_endpoint:'/json/TrackShipments',api_status_path:'TrackingResults.0.Value.0.UpdateDescription',headers:['UserName','Password','AccountNumber','AccountPin','AccountEntity','AccountCountryCode'],query_params:[],help:'aramex.com → MyAramex → Developer → SOAP/JSON credentials (all 6 required)',verified:true,method:'POST',body_template:'{"ClientInfo":{"UserName":"{UserName}","Password":"{Password}","Version":"v1.0","AccountNumber":"{AccountNumber}","AccountPin":"{AccountPin}","AccountEntity":"{AccountEntity}","AccountCountryCode":"{AccountCountryCode}"},"Shipments":["{tracking_number}"]}'},
  {name:'DHL Express',logo:'D',color:'from-yellow-400 to-yellow-600',api_base_url:'https://api-eu.dhl.com/track/shipments',api_auth_type:'custom_headers',api_tracking_endpoint:'?trackingNumber={tracking_number}',api_status_path:'shipments.0.status.description',headers:['DHL-API-Key'],query_params:[],help:'developer.dhl.com → My DHL API → Track and Trace → copy DHL-API-Key',verified:true},
  {name:'FedEx',logo:'F',color:'from-purple-600 to-indigo-600',api_base_url:'https://apis.fedex.com',api_auth_type:'oauth2',api_tracking_endpoint:'/track/v1/trackingnumbers',api_status_path:'output.completeTrackResults.0.trackResults.0.latestStatusDetail.description',headers:[],query_params:[],oauth2_token_url:'https://apis.fedex.com/oauth/token',headers_oauth2:['client_id','client_secret'],help:'developer.fedex.com → My Projects → copy client_id and client_secret (system fetches the OAuth token automatically)',verified:true,method:'POST',body_template:'{"trackingInfo":[{"trackingNumberInfo":{"trackingNumber":"{tracking_number}"}}],"includeDetailedScans":false}'},
  {name:'UPS',logo:'U',color:'from-amber-700 to-yellow-700',api_base_url:'https://onlinetools.ups.com/api',api_auth_type:'oauth2',api_tracking_endpoint:'/track/v1/details/{tracking_number}',api_status_path:'trackResponse.shipment.0.package.0.activity.0.status.description',headers:[],query_params:[],oauth2_token_url:'https://onlinetools.ups.com/security/v1/oauth/token',headers_oauth2:['client_id','client_secret'],help:'developer.ups.com → Apps → copy Client ID and Client Secret (OAuth handled automatically)',verified:true},
  {name:'Boxy DZ',logo:'B',color:'from-lime-500 to-green-600',api_base_url:'',api_auth_type:'bearer',api_tracking_endpoint:'',api_status_path:'',headers:[],query_params:[],help:'Boxy DZ has no documented public API — keep MANUAL or paste tracking URL',verified:false,manual_only:true},
];

const EMPTY={name:'',base_rate:'',phone:'',logo:'',tracking_url:'',api_base_url:'',api_auth_type:'none',api_key:'',api_headers:{},api_query_params:{},api_tracking_endpoint:'',api_status_path:'',api_method:'GET',api_body_template:'',oauth2_token_url:'',oauth2_credentials:{},api_create_endpoint:'',api_create_method:'POST',api_create_body_template:'',api_create_tracking_path:'',use_api:false};

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
  const[syncing,setSyncing]=useState(null);const[togglingSync,setTogglingSync]=useState(null);
  const[viewMode,setViewMode]=useState(()=>{try{return localStorage.getItem('partners_view')||'list';}catch{return'list';}});
  useEffect(()=>{try{localStorage.setItem('partners_view',viewMode);}catch{}},[viewMode]);

  const load=()=>{if(!currentStore?.id)return;api.get(`/manage/stores/${currentStore.id}/delivery-companies`).then(r=>setCompanies(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const save=async()=>{
    if(!form.name)return toast.error(t('storePage.companyNameRequired','Company name required'));
    const payload={
      ...form,
      provider_type:form.api_base_url?'api':'manual',
      api_headers:form.api_headers||{},
      api_query_params:form.api_query_params||{},
      oauth2_credentials:form.oauth2_credentials||{},
    };
    try{
      if(editing){await api.put(`/manage/stores/${currentStore.id}/delivery-companies/${editing.id}`,payload);toast.success(t('storePage.updatedExclaim','Updated!'));}
      else{await api.post(`/manage/stores/${currentStore.id}/delivery-companies`,payload);toast.success(t('storePage.addedExclaim','Added!'));}
      setShowModal(false);setEditing(null);setForm({...EMPTY});setStep('pick');setTestResult(null);load();
    }catch(e){toast.error(e?.response?.data?.error||t('storePage.failed','Failed'));}
  };

  const del=async(id)=>{if(!confirm(t('storePage.removeConfirm','Remove?')))return;try{await api.delete(`/manage/stores/${currentStore.id}/delivery-companies/${id}`);toast.success(t('storePage.removed','Removed'));load();}catch{toast.error(t('storePage.failed','Failed'));}};

  const openEdit=(c)=>{
    const parse=(v)=>typeof v==='string'?(()=>{try{return JSON.parse(v);}catch{return{};}})():(v||{});
    setEditing(c);setForm({name:c.name,base_rate:c.base_rate||'',phone:c.phone||'',logo:c.logo||'',tracking_url:c.tracking_url||'',
      api_base_url:c.api_base_url||'',api_auth_type:c.api_auth_type||'none',api_key:c.api_key||'',
      api_headers:parse(c.api_headers),api_query_params:parse(c.api_query_params),
      oauth2_credentials:parse(c.oauth2_credentials),oauth2_token_url:c.oauth2_token_url||'',
      api_method:c.api_method||'GET',api_body_template:c.api_body_template||'',
      api_tracking_endpoint:c.api_tracking_endpoint||'',api_status_path:c.api_status_path||'',
      api_create_endpoint:c.api_create_endpoint||'',api_create_method:c.api_create_method||'POST',
      api_create_body_template:c.api_create_body_template||'',api_create_tracking_path:c.api_create_tracking_path||'',
      use_api:!!c.api_base_url});
    setStep('form');setTestResult(null);setShowModal(true);
  };

  const pickPreset=(p)=>{
    if(p.manual_only){
      setForm({...EMPTY,name:p.name,use_api:false});
      setStep('form');setTestResult(null);
      toast(t('storePage.manualOnlyHint','This carrier has no public API yet — saving as MANUAL'),{icon:'ℹ️'});
      return;
    }
    const h={};if(p.headers)p.headers.forEach(k=>{h[k]='';});
    const q={};if(p.query_params)p.query_params.forEach(k=>{q[k]='';});
    const oa={};if(p.headers_oauth2)p.headers_oauth2.forEach(k=>{oa[k]='';});
    setForm({...EMPTY,name:p.name,api_base_url:p.api_base_url,api_auth_type:p.api_auth_type,
      api_tracking_endpoint:p.api_tracking_endpoint,api_status_path:p.api_status_path,
      api_headers:h,api_query_params:q,oauth2_credentials:oa,oauth2_token_url:p.oauth2_token_url||'',
      api_method:p.method||'GET',api_body_template:p.body_template||'',
      api_create_endpoint:p.create_endpoint||'',api_create_method:p.create_method||'POST',
      api_create_body_template:p.create_body_template||'',api_create_tracking_path:p.create_tracking_path||'',
      use_api:true});
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
    // Verify required credentials are filled before hitting the network so the
    // user gets a precise error instead of a generic "fetch failed".
    if(form.api_auth_type==='bearer'&&!form.api_key)return toast.error(t('storePage.fillApiToken','Paste the API token first'));
    if(form.api_auth_type==='token_prefix'&&!form.api_key)return toast.error(t('storePage.fillApiToken','Paste the API token first'));
    if(form.api_auth_type==='custom_headers'){
      const empty=Object.entries(form.api_headers||{}).filter(([_,v])=>!String(v||'').trim()).map(([k])=>k);
      if(empty.length)return toast.error(t('storePage.fillAllHeaders','Fill all required header values: ')+empty.join(', '));
    }
    if(form.api_auth_type==='query_params'){
      const empty=Object.entries(form.api_query_params||{}).filter(([_,v])=>!String(v||'').trim()).map(([k])=>k);
      if(empty.length)return toast.error(t('storePage.fillAllParams','Fill all required parameters: ')+empty.join(', '));
    }
    if(form.api_auth_type==='oauth2'){
      const cred=form.oauth2_credentials||{};
      const empty=['client_id','client_secret'].filter(k=>!String(cred[k]||'').trim());
      if(empty.length)return toast.error(t('storePage.fillOauth','Fill OAuth credentials: ')+empty.join(', '));
    }
    setTestingForm(true);setTestResult(null);
    try{
      const{data}=await api.post(`/manage/stores/${currentStore.id}/delivery-companies/test-config`,{
        api_base_url:form.api_base_url,
        api_auth_type:form.api_auth_type,
        api_key:form.api_key,
        api_headers:form.api_headers,
        api_query_params:form.api_query_params,
        oauth2_token_url:form.oauth2_token_url,
        oauth2_credentials:form.oauth2_credentials,
        api_method:form.api_method||'GET',
        api_body_template:form.api_body_template||'',
        api_tracking_endpoint:form.api_tracking_endpoint,
        api_status_path:form.api_status_path,
      });
      setTestResult(data);
    }catch(e){setTestResult({ok:false,error:e.response?.data?.error||e.message,results:{}});}
    setTestingForm(false);
  };

  const syncCarrier=async(id)=>{
    setSyncing(id);
    try{const{data}=await shippingApi.fullSync(currentStore.id,id);
      toast.success(`Synced: ${data.inserted||0} new, ${data.updated||0} updated, ${data.tracking_updated||0} tracking refreshed`);load();
    }catch(e){toast.error(e?.response?.data?.error||'Sync failed');}
    setSyncing(null);
  };

  const toggleAutoSync=async(id,field,val)=>{
    setTogglingSync(id);
    try{await shippingApi.toggleAutoSync(currentStore.id,id,{[field]:val});
      toast.success(val?'Enabled':'Disabled');load();
    }catch(e){toast.error('Failed');}
    setTogglingSync(null);
  };

  const copyWebhookUrl=async(c)=>{
    const base=import.meta.env.VITE_API_URL||'https://test-t2d4.onrender.com/api';
    const url=`${base}/webhook/carrier/${currentStore.id}/${c.id}`;
    try{await navigator.clipboard.writeText(url);toast.success('Webhook URL copied');}catch{toast.error('Copy failed');}
  };

  const addHeader=()=>setForm({...form,api_headers:{...form.api_headers,['']:''}});
  const removeHeader=(k)=>{const h={...form.api_headers};delete h[k];setForm({...form,api_headers:h});};

  const filtered=companies.filter(c=>!search||(c.name||'').toLowerCase().includes(search.toLowerCase()));

  const TestIcon=({ok})=>ok===true?<CheckCircle size={14} className="text-emerald-500"/>:ok===false?<XCircle size={14} className="text-red-500"/>:<AlertCircle size={14} className="text-gray-300"/>;

  return(<DashboardLayout>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div><h1 className="text-xl sm:text-2xl font-bold">{t('storePage.shippingPartners','Shipping Partners')}</h1><p className="text-xs sm:text-sm text-gray-400 mt-1">{t('storePage.addYourDeliveryCompanies','Add your delivery companies')}</p></div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode==='list'?'bg-white shadow-sm':''}`} title="List view"><LayoutList size={14} className={viewMode==='list'?'text-brand-600':'text-gray-400'}/></button>
          <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode==='grid'?'bg-white shadow-sm':''}`} title="Grid view"><LayoutGrid size={14} className={viewMode==='grid'?'text-brand-600':'text-gray-400'}/></button>
        </div>
        <button onClick={()=>{setEditing(null);setForm({...EMPTY});setStep('pick');setTestResult(null);setShowModal(true);}} className="btn-primary flex items-center gap-2 text-xs sm:text-sm"><Plus size={16}/>{t('storePage.addCompany','Add Company')}</button>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
      <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.partners','Partners')}</p><p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{companies.length}</p></div>
      <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-emerald-500 uppercase">{t('storePage.apiConnected','API Connected')}</p><p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{companies.filter(c=>c.api_base_url).length}</p></div>
      <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-blue-500 uppercase">Auto-Syncing</p><p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{companies.filter(c=>c.auto_sync_enabled).length}</p></div>
      <div className="glass-card-solid p-3 sm:p-4"><p className="text-[10px] font-bold text-gray-400 uppercase">{t('storePage.avgRate','Avg Rate')}</p><p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{companies.length?Math.round(companies.reduce((s,c)=>s+parseFloat(c.base_rate||0),0)/companies.length):0} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
    </div>

    {loading?<div className="py-20 text-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin mx-auto"/></div>:filtered.length===0?(
      <div className="glass-card-solid p-16 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">{t('storePage.noDeliveryCompaniesYet','No delivery companies yet')}</p></div>
    ):viewMode==='grid'?(
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-4 sm:p-5 hover:shadow-lg transition-all flex flex-col">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
              {c.api_base_url?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0"><Wifi size={8}/>{t('storePage.liveTracking','LIVE')}</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 shrink-0">{t('storePage.manual','MANUAL')}</span>}
            </div>
            <p className="font-bold text-gray-900 text-base sm:text-lg break-words">{c.name}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-gray-500 flex-1">
              {parseFloat(c.base_rate)>0&&<span><Package size={12} className="inline mr-1"/>{c.base_rate} DZD</span>}
              {c.phone&&<span className="break-all">{c.phone}</span>}
            </div>
            {c.api_base_url&&<div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 flex-wrap">
              <button onClick={()=>toggleAutoSync(c.id,'auto_sync_enabled',!c.auto_sync_enabled)} disabled={togglingSync===c.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${c.auto_sync_enabled?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`} title="Auto-sync orders from carrier"><ArrowDownUp size={10}/>{c.auto_sync_enabled?'SYNC ON':'SYNC OFF'}</button>
              <button onClick={()=>toggleAutoSync(c.id,'auto_dispatch_enabled',!c.auto_dispatch_enabled)} disabled={togglingSync===c.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${c.auto_dispatch_enabled?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`} title="Auto-push orders to carrier"><Zap size={10}/>{c.auto_dispatch_enabled?'AUTO':'MANUAL'}</button>
              {c.last_synced_at&&<span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Clock size={8}/>{new Date(c.last_synced_at).toLocaleTimeString()}</span>}
            </div>}
            <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100 flex-wrap">
              {c.api_base_url&&<button onClick={()=>syncCarrier(c.id)} disabled={syncing===c.id} className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500" title="Sync orders from carrier">{syncing===c.id?<div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>:<ArrowDownUp size={14}/>}</button>}
              {c.api_base_url&&<button onClick={()=>testSaved(c.id)} disabled={testing===c.id} className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-500" title={t('storePage.testApi','Test API')}>{testing===c.id?<div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"/>:<RefreshCw size={14}/>}</button>}
              {c.api_base_url&&<button onClick={()=>copyWebhookUrl(c)} className="p-2 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-500" title="Copy webhook URL"><Link2 size={14}/></button>}
              <button onClick={()=>openEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-500"><Edit size={14}/></button>
              <button onClick={()=>del(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    ):(
      <div className="space-y-3">
        {filtered.map(c=>(
          <div key={c.id} className="glass-card-solid p-3 sm:p-5 hover:shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">{(c.name||'?')[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-gray-900 text-base sm:text-lg break-words min-w-0">{c.name}</p>
                    {c.api_base_url?<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0"><Wifi size={8}/>{t('storePage.liveTracking','LIVE')}</span>:<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 shrink-0">{t('storePage.manual','MANUAL')}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-500">
                    {parseFloat(c.base_rate)>0&&<span><Package size={12} className="inline mr-1"/>{c.base_rate} DZD</span>}
                    {c.phone&&<span className="break-all">{c.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap sm:shrink-0 -mx-1 sm:mx-0 overflow-x-auto sm:overflow-visible">
                {c.api_base_url&&<>
                  <button onClick={()=>toggleAutoSync(c.id,'auto_sync_enabled',!c.auto_sync_enabled)} disabled={togglingSync===c.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 ${c.auto_sync_enabled?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`} title="Auto-sync: pull orders from carrier automatically"><ArrowDownUp size={10}/>{c.auto_sync_enabled?'SYNC':'OFF'}</button>
                  <button onClick={()=>toggleAutoSync(c.id,'auto_dispatch_enabled',!c.auto_dispatch_enabled)} disabled={togglingSync===c.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 ${c.auto_dispatch_enabled?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`} title="Auto-dispatch: push orders to carrier automatically"><Zap size={10}/>{c.auto_dispatch_enabled?'AUTO':'MANUAL'}</button>
                  <button onClick={()=>syncCarrier(c.id)} disabled={syncing===c.id} className="p-2 sm:p-2.5 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-500 shrink-0" title="Sync now">{syncing===c.id?<div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>:<ArrowDownUp size={14}/>}</button>
                  <button onClick={()=>testSaved(c.id)} disabled={testing===c.id} className="p-2 sm:p-2.5 hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-500 shrink-0" title={t('storePage.testApi','Test API')}>{testing===c.id?<div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"/>:<RefreshCw size={14}/>}</button>
                  <button onClick={()=>copyWebhookUrl(c)} className="p-2 sm:p-2.5 hover:bg-purple-50 rounded-xl text-gray-400 hover:text-purple-500 shrink-0" title="Copy webhook URL"><Link2 size={14}/></button>
                </>}
                <button onClick={()=>openEdit(c)} className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-brand-500 shrink-0"><Edit size={14}/></button>
                <button onClick={()=>del(c.id)} className="p-2 sm:p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {showModal&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4" onClick={()=>setShowModal(false)}><div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>

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

      {/* STEP 2: SIMPLIFIED FORM — only essential fields visible */}
      {step==='form'&&<>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{editing?t('storePage.edit','Edit'):t('storePage.add','Add')} {form.name||t('storePage.company','Company')}</h2>
          <button onClick={()=>setShowModal(false)}><X size={20}/></button>
        </div>

        {/* Help tip for preset companies */}
        {PRESETS.filter(p=>p.name===form.name).map(p=>(<div key={p.name} className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4 flex items-start gap-2"><HelpCircle size={14} className="text-blue-500 shrink-0 mt-0.5"/><p className="text-xs text-blue-700">{p.help}</p></div>))}

        <div className="space-y-4">
          <div><label className="input-label">{t('storePage.companyNameRequired2','Company Name *')}</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={t('storePage.anyCompanyName','Any company name')}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">{t('storePage.baseRateDzd','Base Rate (DZD)')}</label><input type="number" className="input-field" value={form.base_rate} onChange={e=>setForm({...form,base_rate:e.target.value})} placeholder="400"/></div>
            <div><label className="input-label">{t('storePage.phone','Phone')}</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0555123456"/></div>
          </div>

          {/* API Credentials — simplified view: only show what user needs to paste */}
          {form.use_api&&(<div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
            <p className="text-sm font-bold text-emerald-800 flex items-center gap-2"><Zap size={14}/>API Credentials</p>

            {form.api_auth_type==='bearer'&&(
              <div><label className="text-xs font-bold text-emerald-700">API Token *</label><input className="input-field font-mono text-sm" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})} placeholder="Paste your API token here"/><p className="text-[10px] text-emerald-700 mt-1">Sent as: Authorization: Bearer &lt;token&gt;</p></div>
            )}

            {form.api_auth_type==='token_prefix'&&(
              <div><label className="text-xs font-bold text-emerald-700">API Token *</label><input className="input-field font-mono text-sm" value={form.api_key} onChange={e=>setForm({...form,api_key:e.target.value})} placeholder="Paste your API token here"/><p className="text-[10px] text-emerald-700 mt-1">Sent as: Authorization: Token &lt;token&gt;</p></div>
            )}

            {form.api_auth_type==='custom_headers'&&Object.keys(form.api_headers).length>0&&(
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Required headers (all must be filled):</p>
                {Object.entries(form.api_headers).map(([key],i)=>(
                  <div key={i}><label className="text-xs font-bold text-emerald-700">{key} *</label><input className="input-field font-mono text-sm" placeholder={`Paste your ${key}`} value={form.api_headers[key]} onChange={e=>setForm({...form,api_headers:{...form.api_headers,[key]:e.target.value}})}/></div>
                ))}
              </div>
            )}

            {form.api_auth_type==='query_params'&&Object.keys(form.api_query_params).length>0&&(
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Required query parameters (all must be filled):</p>
                {Object.entries(form.api_query_params).map(([key],i)=>(
                  <div key={i}><label className="text-xs font-bold text-emerald-700">{key} *</label><input className="input-field font-mono text-sm" placeholder={`Paste your ${key}`} value={form.api_query_params[key]} onChange={e=>setForm({...form,api_query_params:{...form.api_query_params,[key]:e.target.value}})}/></div>
                ))}
                <p className="text-[10px] text-emerald-600">These are appended to every request URL.</p>
              </div>
            )}

            {form.api_auth_type==='oauth2'&&(
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">OAuth2 client credentials (system fetches the token automatically):</p>
                {['client_id','client_secret'].map(k=>(
                  <div key={k}><label className="text-xs font-bold text-emerald-700">{k} *</label><input className="input-field font-mono text-sm" placeholder={`Paste your ${k}`} value={form.oauth2_credentials?.[k]||''} onChange={e=>setForm({...form,oauth2_credentials:{...(form.oauth2_credentials||{}),[k]:e.target.value}})}/></div>
                ))}
                {form.oauth2_token_url&&<p className="text-[10px] text-emerald-600 break-all">Token URL: {form.oauth2_token_url}</p>}
              </div>
            )}

            {/* Test connection */}
            <button onClick={testFormConfig} disabled={testingForm} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
              {testingForm?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<RefreshCw size={14}/>}
              Test Connection
            </button>

            {testResult&&(
              <div className={`p-3 rounded-xl text-sm space-y-2 ${
                testResult.ok && testResult.unverified
                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                  : testResult.ok
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <p className="font-bold">
                  {testResult.ok && testResult.unverified
                    ? '⚠️ ' + (testResult.message || 'Configuration saved — verify by dispatching a real order.')
                    : testResult.ok
                      ? '✅ ' + (testResult.message || 'Connection verified')
                      : '❌ ' + (testResult.error || 'Connection failed')}
                </p>
                {testResult.url && <p className="text-[10px] font-mono opacity-70 break-all">URL: {testResult.url}</p>}
                {testResult.results?.status_extraction?.message && <p className="text-[11px] opacity-80">📍 {testResult.results.status_extraction.message}</p>}
                {testResult.sample && (
                  <details className="text-[11px] opacity-80">
                    <summary className="cursor-pointer">Show carrier response (first 240 chars)</summary>
                    <pre className="mt-1 p-2 bg-white/60 rounded text-[10px] font-mono whitespace-pre-wrap break-all">{testResult.sample}</pre>
                  </details>
                )}
                {testResult.differential && (
                  <details className="text-[11px] opacity-80">
                    <summary className="cursor-pointer">Show differential probe (real vs fake credentials)</summary>
                    <div className="mt-1 p-2 bg-white/60 rounded text-[10px] font-mono whitespace-pre-wrap break-all">
                      <p className="font-bold mb-1">Real creds (HTTP {testResult.differential.real_status}):</p>
                      <p className="mb-2">{testResult.differential.real_sample || '(empty)'}</p>
                      <p className="font-bold mb-1">Fake creds (HTTP {testResult.differential.fake_status}):</p>
                      <p>{testResult.differential.fake_sample || '(empty)'}</p>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>)}

          {!form.use_api&&(
            <div><label className="input-label">Tracking URL (optional)</label><input className="input-field text-sm" value={form.tracking_url} onChange={e=>setForm({...form,tracking_url:e.target.value})} placeholder="https://company.com/track/{tracking_number}"/><p className="text-[10px] text-gray-400 mt-1">Use {'{tracking_number}'} as placeholder</p></div>
          )}

          {/* Advanced toggle — hidden by default */}
          <details className="border-t pt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-medium">Advanced Configuration</summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-sm text-gray-900">Enable API Tracking</label>
                <button onClick={()=>{setForm({...form,use_api:!form.use_api});setTestResult(null);}} className={`w-11 h-6 rounded-full transition-colors relative ${form.use_api?'bg-brand-500':'bg-gray-300'}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.use_api?'translate-x-5':'translate-x-0.5'}`}/></button>
              </div>
              {form.use_api&&<>
                <div><label className="text-xs font-bold text-gray-600">API Base URL</label><input className="input-field font-mono text-sm" value={form.api_base_url} onChange={e=>setForm({...form,api_base_url:e.target.value})} placeholder="https://api.company.com/v1"/></div>
                <div><label className="text-xs font-bold text-gray-600">Auth Type</label>
                  <select className="input-field text-sm" value={form.api_auth_type} onChange={e=>setForm({...form,api_auth_type:e.target.value})}>
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token (Authorization: Bearer …)</option>
                    <option value="token_prefix">Token Prefix (Authorization: Token …)</option>
                    <option value="custom_headers">Custom Headers (multi-key)</option>
                    <option value="query_params">Query Parameters (?api_token=…&user_guid=…)</option>
                    <option value="oauth2">OAuth2 Client Credentials (auto token)</option>
                  </select>
                </div>
                <div><label className="text-xs font-bold text-gray-600">HTTP Method</label>
                  <select className="input-field text-sm" value={form.api_method||'GET'} onChange={e=>setForm({...form,api_method:e.target.value})}>
                    <option value="GET">GET</option><option value="POST">POST</option>
                  </select>
                </div>
                {form.api_method==='POST'&&<div><label className="text-xs font-bold text-gray-600">Request Body Template (JSON)</label><textarea className="input-field font-mono text-xs" rows={3} value={form.api_body_template||''} onChange={e=>setForm({...form,api_body_template:e.target.value})} placeholder='{"Colis":[{"Tracking":"{tracking_number}"}]}'/></div>}
                {form.api_auth_type==='oauth2'&&<div><label className="text-xs font-bold text-gray-600">OAuth2 Token URL</label><input className="input-field font-mono text-sm" value={form.oauth2_token_url||''} onChange={e=>setForm({...form,oauth2_token_url:e.target.value})} placeholder="https://api.example.com/oauth/token"/></div>}
                <div><label className="text-xs font-bold text-gray-600">Tracking Endpoint</label><input className="input-field font-mono text-sm" value={form.api_tracking_endpoint} onChange={e=>setForm({...form,api_tracking_endpoint:e.target.value})} placeholder="/parcels/?tracking={tracking_number}"/></div>
                <div><label className="text-xs font-bold text-gray-600">Status Path</label><input className="input-field font-mono text-sm" value={form.api_status_path} onChange={e=>setForm({...form,api_status_path:e.target.value})} placeholder="data.0.last_status"/></div>
                {form.api_auth_type==='custom_headers'&&<div>
                  <div className="flex items-center justify-between mb-1"><label className="text-xs font-bold text-gray-600">Headers</label><button onClick={addHeader} className="text-xs text-brand-500 font-bold">+ Add</button></div>
                  {Object.entries(form.api_headers).map(([key,val],i)=>(
                    <div key={i} className="flex gap-2 mb-1">
                      <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder="Header-Name" value={key} onChange={e=>{const h={...form.api_headers};delete h[key];h[e.target.value]=val;setForm({...form,api_headers:h});}}/>
                      <input className="input-field text-xs font-mono flex-1 !py-1.5" placeholder="value" value={val} onChange={e=>setForm({...form,api_headers:{...form.api_headers,[key]:e.target.value}})}/>
                      <button onClick={()=>removeHeader(key)} className="p-1 text-red-400"><X size={14}/></button>
                    </div>
                  ))}
                </div>}
              </>}
            </div>
          </details>
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
