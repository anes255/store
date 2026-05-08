import React,{useState,useRef,useEffect,useMemo} from 'react';
import {createPortal} from 'react-dom';
import {aiApi} from '../../utils/api';
import {useAdminTheme} from '../../hooks/useStore';
import {MessageCircle,Phone,Send,X,Save,Clock,ShoppingCart,QrCode,RefreshCw,Wifi,WifiOff,Bell,ChevronDown,Eye,CheckCircle2,XCircle,Truck,Package,RotateCcw,Hourglass,PhoneOff,Search,Calendar,Check} from 'lucide-react';

const WA_STATUSES=['new_order','confirmed','under_preparation','ready','shipped','delivered','cancelled','awaiting','failed_call_1','failed_call_2','failed_call_3','returned'];
const WA_STATUS_LABELS={new_order:{en:'New Order',fr:'Nouvelle commande',ar:'طلب جديد'},confirmed:{en:'Confirmed',fr:'Confirmé',ar:'تم التأكيد'},under_preparation:{en:'Under Preparation',fr:'En préparation',ar:'قيد التحضير'},ready:{en:'Ready',fr:'Prêt',ar:'جاهز'},shipped:{en:'Shipped',fr:'Expédié',ar:'تم الشحن'},delivered:{en:'Delivered',fr:'Livré',ar:'تم التسليم'},cancelled:{en:'Cancelled',fr:'Annulé',ar:'ملغي'},awaiting:{en:'Awaiting',fr:'En attente',ar:'في الانتظار'},failed_call_1:{en:'Call Failed 1',fr:'Appel échoué 1',ar:'اتصال فاشل 1'},failed_call_2:{en:'Call Failed 2',fr:'Appel échoué 2',ar:'اتصال فاشل 2'},failed_call_3:{en:'Call Failed 3',fr:'Appel échoué 3',ar:'اتصال فاشل 3'},returned:{en:'Returned',fr:'Retourné',ar:'مرتجع'}};
// Per-status meta: dot color, soft bg, lucide icon for the row leading icon
const WA_STATUS_META={
  new_order:{color:'#3b82f6',bg:'bg-blue-50 text-blue-600',Icon:Bell},
  confirmed:{color:'#10b981',bg:'bg-emerald-50 text-emerald-600',Icon:CheckCircle2},
  under_preparation:{color:'#8b5cf6',bg:'bg-purple-50 text-purple-600',Icon:Package},
  ready:{color:'#14b8a6',bg:'bg-teal-50 text-teal-600',Icon:CheckCircle2},
  shipped:{color:'#f97316',bg:'bg-orange-50 text-orange-600',Icon:Truck},
  delivered:{color:'#10b981',bg:'bg-emerald-50 text-emerald-600',Icon:Check},
  cancelled:{color:'#9ca3af',bg:'bg-gray-100 text-gray-500',Icon:XCircle},
  awaiting:{color:'#9ca3af',bg:'bg-gray-100 text-gray-500',Icon:Hourglass},
  failed_call_1:{color:'#ec4899',bg:'bg-pink-50 text-pink-600',Icon:PhoneOff},
  failed_call_2:{color:'#a855f7',bg:'bg-purple-50 text-purple-600',Icon:PhoneOff},
  failed_call_3:{color:'#ef4444',bg:'bg-red-50 text-red-600',Icon:PhoneOff},
  returned:{color:'#ef4444',bg:'bg-red-50 text-red-600',Icon:RotateCcw},
};
const WA_TIMING_OPTIONS=[{v:'immediately',en:'Immediately',fr:'Immédiatement',ar:'فورا'},{v:'5min',en:'After 5 min',fr:'Après 5 min',ar:'بعد 5 دقائق'},{v:'15min',en:'After 15 min',fr:'Après 15 min',ar:'بعد 15 دقيقة'},{v:'30min',en:'After 30 min',fr:'Après 30 min',ar:'بعد 30 دقيقة'},{v:'1hour',en:'After 1 hour',fr:'Après 1 heure',ar:'بعد ساعة'},{v:'2hours',en:'After 2 hours',fr:'Après 2 heures',ar:'بعد ساعتين'}];
const WA_CART_TIMING=[{v:'1hour',en:'After 1 hour',fr:'Après 1 heure',ar:'بعد ساعة'},{v:'3hours',en:'After 3 hours',fr:'Après 3 heures',ar:'بعد 3 ساعات'},{v:'6hours',en:'After 6 hours',fr:'Après 6 heures',ar:'بعد 6 ساعات'},{v:'12hours',en:'After 12 hours',fr:'Après 12 heures',ar:'بعد 12 ساعة'},{v:'24hours',en:'After 24 hours',fr:'Après 24 heures',ar:'بعد 24 ساعة'}];
const WA_VARS=['{store_name}','{order_number}','{customer_name}','{customer_phone}','{total}','{total_price}','{subtotal}','{shipping_cost}','{shipping_price}','{shipping_method}','{discount}','{currency}','{shipping_address}','{shipping_city}','{shipping_wilaya}','{shipping_zip}','{wilaya_fr}','{wilaya_ar}','{commune_fr}','{commune_ar}','{payment_method}','{tracking_number}','{tracking_link}','{tracking_URL}','{delivery_company}','{shipping_company}','{delivery_office_name}','{delivery_office_map}','{delivery_office_address}','{order_date}','{order_time}','{item_count}','{product_name}','{product_price}','{products_list}','{product_list}','{variant}','{quantity}','{store_phone}','{store_email}'];
const WA_CART_VARS=['{store_name}','{cart_url}','{item_count}','{customer_name}','{customer_phone}','{total}','{currency}','{product_list}'];
const WA_VAR_LABELS={
  '{store_name}':{en:'Store name',fr:'Nom du magasin',ar:'اسم المتجر'},
  '{order_number}':{en:'Order number',fr:'N° de commande',ar:'رقم الطلب'},
  '{customer_name}':{en:'Customer name',fr:'Nom du client',ar:'اسم العميل'},
  '{customer_phone}':{en:'Customer phone',fr:'Téléphone client',ar:'هاتف العميل'},
  '{total}':{en:'Total amount',fr:'Montant total',ar:'المبلغ الإجمالي'},
  '{subtotal}':{en:'Subtotal',fr:'Sous-total',ar:'المجموع الفرعي'},
  '{shipping_cost}':{en:'Shipping cost',fr:'Frais de livraison',ar:'تكلفة التوصيل'},
  '{discount}':{en:'Discount',fr:'Remise',ar:'الخصم'},
  '{currency}':{en:'Currency',fr:'Devise',ar:'العملة'},
  '{shipping_address}':{en:'Address',fr:'Adresse',ar:'العنوان'},
  '{shipping_city}':{en:'City',fr:'Ville',ar:'المدينة'},
  '{shipping_wilaya}':{en:'Wilaya',fr:'Wilaya',ar:'الولاية'},
  '{shipping_zip}':{en:'ZIP code',fr:'Code postal',ar:'الرمز البريدي'},
  '{payment_method}':{en:'Payment method',fr:'Mode de paiement',ar:'طريقة الدفع'},
  '{tracking_number}':{en:'Tracking number',fr:'N° de suivi',ar:'رقم التتبع'},
  '{delivery_company}':{en:'Delivery company',fr:'Transporteur',ar:'شركة التوصيل'},
  '{order_date}':{en:'Order date',fr:'Date de commande',ar:'تاريخ الطلب'},
  '{order_time}':{en:'Order time',fr:'Heure de commande',ar:'وقت الطلب'},
  '{item_count}':{en:'Item count',fr:'Nombre d\'articles',ar:'عدد القطع'},
  '{product_list}':{en:'Product list',fr:'Liste des produits',ar:'قائمة المنتجات'},
  '{store_phone}':{en:'Store phone',fr:'Téléphone du magasin',ar:'هاتف المتجر'},
  '{store_email}':{en:'Store email',fr:'Email du magasin',ar:'بريد المتجر'},
  '{cart_url}':{en:'Cart URL',fr:'Lien du panier',ar:'رابط السلة'},
  '{total_price}':{en:'Total price',fr:'Prix total',ar:'السعر الإجمالي'},
  '{shipping_price}':{en:'Shipping price',fr:'Prix de livraison',ar:'سعر التوصيل'},
  '{shipping_method}':{en:'Shipping method',fr:'Mode de livraison',ar:'طريقة التوصيل'},
  '{wilaya_fr}':{en:'Wilaya (FR)',fr:'Wilaya (FR)',ar:'الولاية (FR)'},
  '{wilaya_ar}':{en:'Wilaya (AR)',fr:'Wilaya (AR)',ar:'الولاية (AR)'},
  '{commune_fr}':{en:'Commune (FR)',fr:'Commune (FR)',ar:'البلدية (FR)'},
  '{commune_ar}':{en:'Commune (AR)',fr:'Commune (AR)',ar:'البلدية (AR)'},
  '{tracking_link}':{en:'Tracking link',fr:'Lien de suivi',ar:'رابط التتبع'},
  '{tracking_URL}':{en:'Tracking URL',fr:'URL de suivi',ar:'رابط التتبع'},
  '{shipping_company}':{en:'Shipping company',fr:'Société de livraison',ar:'شركة الشحن'},
  '{delivery_office_name}':{en:'Delivery office name',fr:'Nom du bureau',ar:'اسم مكتب التسليم'},
  '{delivery_office_map}':{en:'Delivery office map',fr:'Carte du bureau',ar:'خريطة مكتب التسليم'},
  '{delivery_office_address}':{en:'Delivery office address',fr:'Adresse du bureau',ar:'عنوان مكتب التسليم'},
  '{product_name}':{en:'Product name',fr:'Nom du produit',ar:'اسم المنتج'},
  '{product_price}':{en:'Product price',fr:'Prix du produit',ar:'سعر المنتج'},
  '{products_list}':{en:'Products list',fr:'Liste des produits',ar:'قائمة المنتجات'},
  '{variant}':{en:'Variant',fr:'Variante',ar:'المتغير'},
  '{quantity}':{en:'Quantity',fr:'Quantité',ar:'الكمية'}
};
const WA_DEFAULT_TEMPLATES={
  en:{new_order:'Hi {customer_name}! We received your order #{order_number} at {store_name}. Total: {total} {currency}. We will process it shortly!',confirmed:'Hi {customer_name}! Your order #{order_number} from {store_name} has been confirmed. Total: {total} {currency}. We\'ll keep you updated!',under_preparation:'Hello {customer_name}! Your order #{order_number} is now being prepared at {store_name}. We\'ll notify you once it ships!',ready:'Hi {customer_name}! Your order #{order_number} is ready and will be shipped soon. Stay tuned!',shipped:'Great news {customer_name}! Your order #{order_number} has been shipped. Track: {tracking_number}. Delivery by {delivery_company}.',delivered:'Your order #{order_number} has been delivered! Thank you for shopping at {store_name}!',cancelled:'Hi {customer_name}, your order #{order_number} from {store_name} has been cancelled. If this was a mistake, please contact us.',awaiting:'Hi {customer_name}, your order #{order_number} is awaiting confirmation. We will get back to you soon!',failed_call_1:'Hi {customer_name}, we tried to reach you about order #{order_number}. Please call us back at your convenience.',failed_call_2:'Hello {customer_name}, this is our second attempt to reach you about order #{order_number}. Please respond as soon as possible.',failed_call_3:'Dear {customer_name}, we have been unable to reach you about order #{order_number}. Your order may be cancelled if we don\'t hear from you.',returned:'Hi {customer_name}, your order #{order_number} has been returned. Please contact {store_name} for more details.',abandoned_cart:'Hi {customer_name}! You left {item_count} item(s) in your cart at {store_name}. Complete your order here: {cart_url}'},
  fr:{new_order:'Bonjour {customer_name}! Nous avons reçu votre commande #{order_number} chez {store_name}. Total: {total} {currency}.',confirmed:'Bonjour {customer_name}! Votre commande #{order_number} de {store_name} est confirmée. Total: {total} {currency}.',under_preparation:'Bonjour {customer_name}! Votre commande #{order_number} est en cours de préparation chez {store_name}.',ready:'Bonjour {customer_name}! Votre commande #{order_number} est prête et sera expédiée bientôt.',shipped:'Bonne nouvelle {customer_name}! Votre commande #{order_number} a été expédiée. Suivi: {tracking_number}. Livraison par {delivery_company}.',delivered:'Votre commande #{order_number} a été livrée! Merci d\'avoir choisi {store_name}!',cancelled:'Bonjour {customer_name}, votre commande #{order_number} de {store_name} a été annulée. Si c\'est une erreur, contactez-nous.',awaiting:'Bonjour {customer_name}, votre commande #{order_number} est en attente de confirmation.',failed_call_1:'Bonjour {customer_name}, nous avons essayé de vous joindre concernant la commande #{order_number}. Veuillez nous rappeler.',failed_call_2:'Bonjour {customer_name}, ceci est notre deuxième tentative pour la commande #{order_number}. Merci de nous répondre.',failed_call_3:'Cher {customer_name}, nous n\'arrivons pas à vous joindre pour la commande #{order_number}. Elle risque d\'être annulée.',returned:'Bonjour {customer_name}, votre commande #{order_number} a été retournée. Contactez {store_name} pour plus de détails.',abandoned_cart:'Bonjour {customer_name}! Vous avez laissé {item_count} article(s) dans votre panier chez {store_name}. Complétez ici: {cart_url}'},
  ar:{new_order:'مرحبا {customer_name}! استلمنا طلبك #{order_number} من {store_name}. المبلغ: {total} {currency}.',confirmed:'مرحبا {customer_name}! تم تأكيد طلبك #{order_number} من {store_name}. المبلغ: {total} {currency}.',under_preparation:'مرحبا {customer_name}! طلبك #{order_number} قيد التحضير في {store_name}.',ready:'مرحبا {customer_name}! طلبك #{order_number} جاهز وسيتم شحنه قريبا.',shipped:'أخبار سارة {customer_name}! تم شحن طلبك #{order_number}. رقم التتبع: {tracking_number}. التوصيل عبر {delivery_company}.',delivered:'تم تسليم طلبك #{order_number}! شكرا لتسوقك من {store_name}!',cancelled:'مرحبا {customer_name}، تم إلغاء طلبك #{order_number} من {store_name}. إذا كان هذا خطأ، تواصل معنا.',awaiting:'مرحبا {customer_name}، طلبك #{order_number} في انتظار التأكيد.',failed_call_1:'مرحبا {customer_name}، حاولنا الاتصال بك بخصوص الطلب #{order_number}. يرجى معاودة الاتصال.',failed_call_2:'مرحبا {customer_name}، هذه المحاولة الثانية للاتصال بك بخصوص الطلب #{order_number}. يرجى الرد.',failed_call_3:'عزيزي {customer_name}، لم نتمكن من الوصول إليك بخصوص الطلب #{order_number}. قد يتم إلغاء طلبك.',returned:'مرحبا {customer_name}، تم إرجاع طلبك #{order_number}. تواصل مع {store_name} لمزيد من التفاصيل.',abandoned_cart:'مرحبا {customer_name}! تركت {item_count} منتج(ات) في سلتك في {store_name}. أكمل طلبك هنا: {cart_url}'}
};

// ─────────────────────────────────────────────────────────────────────────────
// Localized variable aliases.
// Each English token (e.g. {customer_name}) gets an AR/FR alias built from
// its translated label with spaces → underscores: {اسم_العميل}, {Nom_du_client}
// The textarea stores whichever form the admin clicked, and `resolveAliases`
// rewrites them back to the English token before field substitution. The
// backend does the same, so messages send correctly regardless of language.
// ─────────────────────────────────────────────────────────────────────────────
function localizedToken(englishToken, lang){
  const lbl=WA_VAR_LABELS[englishToken]?.[lang];
  if(!lbl||lang==='en')return englishToken;
  return '{'+lbl.replace(/\s+/g,'_')+'}';
}
function buildAliasMap(){
  const map={};
  for(const[eng,labels]of Object.entries(WA_VAR_LABELS)){
    for(const lg of ['ar','fr']){
      const lbl=labels[lg];
      if(!lbl)continue;
      const alias='{'+lbl.replace(/\s+/g,'_')+'}';
      if(alias!==eng)map[alias]=eng;
    }
  }
  return map;
}
const ALIAS_MAP=buildAliasMap();
function resolveAliases(msg){
  if(!msg)return msg;
  for(const[alias,eng]of Object.entries(ALIAS_MAP)){
    if(msg.includes(alias))msg=msg.split(alias).join(eng);
  }
  return msg;
}

export {WA_STATUSES,WA_STATUS_LABELS,WA_TIMING_OPTIONS,WA_CART_TIMING,WA_VARS,WA_VAR_LABELS,WA_CART_VARS,WA_DEFAULT_TEMPLATES,ALIAS_MAP,resolveAliases,localizedToken};

// ─────────────────────────────────────────────────────────────────────────────
// Single status row — collapsed pill view + inline editor when expanded.
// ─────────────────────────────────────────────────────────────────────────────
function StatusRow({status,lang,enabled,timing,template,onToggle,onTiming,onTemplate,onTest,onPreview,dk,t1,t2,t3,inp,varBtn,expanded,onExpand}){
  const meta=WA_STATUS_META[status]||{color:'#6b7280',bg:'bg-gray-100 text-gray-500',Icon:Bell};
  const Icon=meta.Icon;
  const isRtl=lang==='ar';
  const labelLocal=WA_STATUS_LABELS[status]?.[lang]||status;
  const labelEn=WA_STATUS_LABELS[status]?.en||status;
  const hasTpl=!!(template||'').trim();
  return(
    <div className={`rounded-2xl border ${dk?'border-gray-700 bg-gray-800/40':'border-gray-100 bg-white'} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} shrink-0`}><Icon size={16}/></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${t1}`} dir={isRtl?'rtl':'ltr'}>{lang==='ar'?`${labelLocal} ${labelEn.toUpperCase()}`:labelLocal}</span>
            {!enabled&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase">Disabled</span>}
          </div>
          <p className={`text-[11px] ${t3} truncate`}>{hasTpl?(template.length>60?template.slice(0,60)+'…':template):'No template set'}</p>
        </div>
        <button type="button" onClick={(e)=>{e.stopPropagation();onPreview();}} title="Preview" className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${dk?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Eye size={11}/>Preview</button>
        <button type="button" onClick={(e)=>{e.stopPropagation();onTest();}} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${dk?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Send size={11}/>Test</button>
        {/* On/off pill toggle — fixed dimensions, no overlap with sibling buttons. */}
        <button type="button" onClick={(e)=>{e.stopPropagation();onToggle(!enabled);}} title={enabled?'Click to disable':'Click to enable'} aria-label={enabled?'Disable':'Enable'} className={`relative shrink-0 inline-flex items-center rounded-full transition-colors ${enabled?'':'bg-gray-300'}`} style={{backgroundColor:enabled?meta.color:'#d1d5db',width:'46px',height:'24px',padding:'2px'}}>
          <span className="block bg-white rounded-full shadow" style={{width:'20px',height:'20px',transform:enabled?'translateX(22px)':'translateX(0)',transition:'transform 0.2s ease'}}/>
        </button>
        <button type="button" onClick={onExpand} className={`p-1 rounded-lg ${dk?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`} aria-label="Expand">
          <ChevronDown size={16} className={`transition-transform ${expanded?'rotate-180':''}`}/>
        </button>
      </div>
      {expanded&&(
        <div className={`px-4 pb-4 pt-1 border-t ${dk?'border-gray-700':'border-gray-100'} space-y-3`}>
          {/* Notification message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-bold ${t3} uppercase`}>{lang==='ar'?'رسالة الإشعار':lang==='fr'?'Message de notification':'Notification Message'} ({lang.toUpperCase()})</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onPreview} className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1"><Eye size={11}/>{lang==='ar'?'مثال الرسالة':lang==='fr'?'Exemple':'Example'}</button>
              </div>
            </div>
            <textarea
              className={`w-full ${inp} border rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none transition-all`}
              rows={4}
              value={template||''}
              onChange={e=>onTemplate(e.target.value)}
              placeholder={lang==='ar'?'اكتب نص الإشعار هنا.':lang==='fr'?'Écrivez le texte de notification ici.':'Write the notification text here.'}
              style={{direction:isRtl?'rtl':'ltr'}}
              disabled={!enabled}
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-[10px] ${t3}`}>{(template||'').length} characters</p>
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-1.5 text-[11px] ${t2}`}><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500" checked={enabled} onChange={e=>onToggle(e.target.checked)}/>{lang==='ar'?'مفعّل':lang==='fr'?'Activé':'Enabled'}</label>
              </div>
            </div>
          </div>
          {/* Send time */}
          <div>
            <p className={`text-[10px] font-bold ${t3} uppercase mb-1.5 flex items-center gap-1`}><Clock size={11}/>{lang==='ar'?'وقت الإرسال بعد تغيير الحالة':lang==='fr'?'Envoyer après changement de statut':'Send time after status change'}</p>
            <select className={`text-xs ${inp} rounded-lg px-3 py-2 font-medium border w-full sm:w-auto`} value={timing} onChange={e=>onTiming(e.target.value)}>{WA_TIMING_OPTIONS.map(o=><option key={o.v} value={o.v}>{o[lang]||o.en}</option>)}</select>
          </div>
          {/* Variables — clicking inserts the localized token (e.g. {اسم_العميل}
              in Arabic, {Nom_du_client} in French) so the message reads in the
              admin's language. Backend / preview resolve aliases back to the
              canonical English token before substitution. */}
          <div>
            <p className={`text-[10px] font-bold ${t3} uppercase mb-1.5`}>{lang==='ar'?'إدراج متغير':lang==='fr'?'Insérer une variable':'Insert variable'}</p>
            <div className="flex flex-wrap gap-1">{WA_VARS.map(v=>{const lbl=WA_VAR_LABELS[v]?.[lang]||v;const tok=localizedToken(v,lang);return(<button key={v} type="button" onClick={()=>onTemplate((template||'')+tok)} title={tok+' → '+lbl} className={`px-2 py-1 border rounded-md text-[10px] font-mono transition-colors ${varBtn}`}>{lbl}</button>);})}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function WhatsAppConfigModal({show,onClose,storeId,initialConfig,onSave}){
  const[cfg,setCfg]=useState({});
  const[lang,setLang]=useState('fr');
  const[expanded,setExpanded]=useState(null); // currently expanded status key
  const[waStatus,setWaStatus]=useState(null);
  const[waLoading,setWaLoading]=useState(false);
  const[waError,setWaError]=useState(null);
  const[showQR,setShowQR]=useState(false);
  const[stats,setStats]=useState({sent_today:0,success_rate:100,delivered:0,failed:0});
  const[recent,setRecent]=useState([]);
  const[recentFilter,setRecentFilter]=useState({status:'all',type:'all',from:'',to:'',q:'',pageSize:25});
  const[previewStatus,setPreviewStatus]=useState(null);
  const[savedToast,setSavedToast]=useState(false);
  const dk=useAdminTheme(s=>s.mode==='dark');

  useEffect(()=>{if(show&&initialConfig)setCfg({...initialConfig});if(show){const lg=String(initialConfig?.wa_language||'fr').slice(0,2).toLowerCase();setLang(['en','fr','ar'].includes(lg)?lg:'fr');}},[show,initialConfig]);
  useEffect(()=>{if(!show||!storeId)return;checkStatus();const id=setInterval(checkStatus,1500);return()=>clearInterval(id);},[show,storeId]);
  useEffect(()=>{if(!show||!storeId)return;loadStats();loadRecent();const id=setInterval(loadStats,30000);return()=>clearInterval(id);},[show,storeId]);

  const setV=(k,v)=>setCfg(p=>({...p,[k]:v}));

  // ── Template / status helpers (preserve existing data shape) ───────────────
  const getTemplates=()=>{try{return cfg.wa_templates?JSON.parse(typeof cfg.wa_templates==='string'?cfg.wa_templates:JSON.stringify(cfg.wa_templates)):{};}catch{return{};}};
  // Fall back to the bundled default template when the admin hasn't customised
  // this status yet — keeps the textarea + preview from being blank on first
  // open and matches the message the backend would actually send.
  // Returns the user's saved template (even if empty so the admin can clear it),
  // falling back to the bundled default ONLY when the key has never been set.
  // Bulletproof fallback so the preview is never blank: try active lang →
  // any saved lang → bundled defaults (fr→ar→en).
  const getTpl=(st)=>{
    const t=getTemplates();
    const v=t?.[lang]?.[st];
    if(typeof v==='string'&&v.length)return v;
    return (t?.fr?.[st]||t?.ar?.[st]||t?.en?.[st]
      ||WA_DEFAULT_TEMPLATES[lang]?.[st]
      ||WA_DEFAULT_TEMPLATES.fr?.[st]||WA_DEFAULT_TEMPLATES.ar?.[st]||WA_DEFAULT_TEMPLATES.en?.[st]
      ||'');
  };
  const setTpl=(st,val)=>{const t=getTemplates();if(!t[lang])t[lang]={};t[lang][st]=val;setV('wa_templates',JSON.stringify(t));};
  const getEnabled=(st)=>{try{const e=cfg.wa_enabled_statuses?JSON.parse(typeof cfg.wa_enabled_statuses==='string'?cfg.wa_enabled_statuses:JSON.stringify(cfg.wa_enabled_statuses)):{}; return e[st]!==false;}catch{return true;}};
  const setEnabled=(st,val)=>{try{const e=cfg.wa_enabled_statuses?JSON.parse(typeof cfg.wa_enabled_statuses==='string'?cfg.wa_enabled_statuses:JSON.stringify(cfg.wa_enabled_statuses)):{}; e[st]=val;setV('wa_enabled_statuses',JSON.stringify(e));}catch{}};
  const getTiming=(st)=>{try{const tm=cfg.wa_timing?JSON.parse(typeof cfg.wa_timing==='string'?cfg.wa_timing:JSON.stringify(cfg.wa_timing)):{}; return tm[st]||'immediately';}catch{return 'immediately';}};
  const setTiming=(st,val)=>{try{const tm=cfg.wa_timing?JSON.parse(typeof cfg.wa_timing==='string'?cfg.wa_timing:JSON.stringify(cfg.wa_timing)):{}; tm[st]=val;setV('wa_timing',JSON.stringify(tm));}catch{}};

  // Render the template with example values so the preview looks real.
  // First map any localized variable aliases (Arabic/French) back to their
  // canonical English tokens so the substitution catches them.
  const preview=(tpl)=>{let m=resolveAliases(tpl||'');const now=new Date();
    // Localized example values per chosen language so the preview reads naturally.
    const wilayaName=lang==='ar'?'الجزائر':'Alger';
    const communeName=lang==='ar'?'باب الواد':lang==='fr'?'Bab El Oued':'Bab El Oued';
    const customerName=lang==='ar'?'أحمد بن علي':'Ahmed Benali';
    const productList=lang==='ar'
      ?'• ساعة (أسود / 40-41 / صناعي) × 2\n• حذاء (رمادي / 43-44) × 1'
      :lang==='fr'
        ?'• Montre (Noir / 40-41 / Synthétique) × 2\n• Chaussure (Gris / 43-44) × 1'
        :'• Watch (Black / 40-41 / Synthetic) × 2\n• Shoe (Gray / 43-44) × 1';
    const productName=lang==='ar'?'ساعة كلاسيكية':lang==='fr'?'Montre classique':'Classic Watch';
    const variantStr=lang==='ar'?'أسود / 40-41':lang==='fr'?'Noir / 40-41':'Black / 40-41';
    const paymentLbl=lang==='ar'?'الدفع عند الاستلام':lang==='fr'?'Paiement à la livraison':'Cash on Delivery';
    const shippingMethod=lang==='ar'?'إلى المنزل':lang==='fr'?'À domicile':'Home delivery';
    const officeName=lang==='ar'?'مكتب يلدين باب الواد':lang==='fr'?'Bureau Yalidine Bab El Oued':'Yalidine Office Bab El Oued';
    const officeAddr=lang==='ar'?'شارع ديدوش 12، باب الواد':lang==='fr'?'12 Rue Didouche, Bab El Oued':'12 Rue Didouche, Bab El Oued';
    const subs={
      store_name:cfg.name||cfg.store_name||'My Store',
      order_number:'100254',
      customer_name:customerName,
      customer_phone:'+213 555 12 34 56',
      total:'9,600',
      total_price:'9,600',
      subtotal:'9,000',
      shipping_cost:'600',
      shipping_price:'600',
      shipping_method:shippingMethod,
      discount:'0',
      currency:cfg.currency||(lang==='ar'?'دج':'DZD'),
      shipping_address:lang==='ar'?'شارع ديدوش 12':'12 Rue Didouche',
      shipping_city:communeName,
      shipping_wilaya:wilayaName,
      shipping_zip:'16000',
      wilaya_fr:'Alger',
      wilaya_ar:'الجزائر',
      commune_fr:'Bab El Oued',
      commune_ar:'باب الواد',
      payment_method:paymentLbl,
      tracking_number:'TR-98421',
      tracking_link:'https://track.yalidine.dz/TR-98421',
      tracking_URL:'https://track.yalidine.dz/TR-98421',
      delivery_company:'Yalidine',
      shipping_company:'Yalidine',
      delivery_office_name:officeName,
      delivery_office_map:'https://maps.google.com/?q=36.7755,3.0594',
      delivery_office_address:officeAddr,
      cart_url:'https://store.com/cart/abc',
      item_count:'3',
      product_name:productName,
      product_price:'4,800',
      products_list:productList,
      product_list:productList,
      variant:variantStr,
      quantity:'2',
      order_date:now.toLocaleDateString(lang==='ar'?'ar-DZ':lang==='fr'?'fr-DZ':'en-GB'),
      order_time:now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      store_phone:cfg.phone||cfg.store_phone||'+213 550 00 00 00',
      store_email:cfg.email||cfg.store_email||'contact@store.com',
    };
    for(const[k,v]of Object.entries(subs)){m=m.split('{'+k+'}').join(v);}
    return m;};

  // ── Test send / connection ─────────────────────────────────────────────────
  const[testPhone,setTestPhone]=useState('');
  const[testSending,setTestSending]=useState(false);
  const sendTest=async(forceStatus)=>{
    if(!storeId){alert('Save store first');return;}
    const phone=(testPhone||'').trim();
    if(!phone){alert(lang==='ar'?'أدخل رقم الهاتف للاختبار':lang==='fr'?'Entrez un numéro de test':'Enter a test phone number');return;}
    if(!waStatus?.connected){alert(lang==='ar'?'WhatsApp غير متصل':lang==='fr'?'WhatsApp non connecté':'WhatsApp is not connected — scan the QR first.');return;}
    setTestSending(true);
    try{
      const st=forceStatus||expanded||'confirmed';
      const msg=preview(getTpl(st));
      let ok=false;
      try{await aiApi.waSendTest?.(storeId,{phone,message:msg,language:lang});ok=true;}catch{}
      if(!ok){
        const{api}=await import('../../utils/api');
        await api.post(`/ai/wa/${storeId}/send-test`,{phone,message:msg,language:lang});
      }
      alert((lang==='ar'?'أُرسلت رسالة الاختبار إلى ':lang==='fr'?'Test envoyé à ':'Test sent to ')+phone);
    }catch(e){alert('Test failed: '+(e?.response?.data?.error||e.message||'unknown'));}
    setTestSending(false);
  };

  const startConnection=async()=>{if(!storeId)return;setWaLoading(true);setWaError(null);setShowQR(true);try{const{data}=await aiApi.waQrStart(storeId);if(data.qr||data.connected){setWaStatus(data);setWaLoading(false);return;}for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,2000));try{const{data:st}=await aiApi.waQrStatus(storeId);setWaStatus(st);if(st.qr||st.connected){setWaLoading(false);return;}}catch{}}setWaError('QR is taking a while. Try again.');}catch(e){setWaError(e.response?.data?.error||e.message);}setWaLoading(false);};
  const disconnect=async()=>{if(!storeId)return;try{await aiApi.waQrDisconnect(storeId);setWaStatus({status:'disconnected',connected:false});setShowQR(false);}catch{}};
  const checkStatus=async()=>{if(!storeId)return;try{const{data}=await aiApi.waQrStatus(storeId);setWaStatus(data);}catch{setWaStatus({status:'not_started',connected:false});}};

  // Backend stats / recent activity (best-effort — fall back to zeros if not implemented).
  const loadStats=async()=>{
    try{
      const{api}=await import('../../utils/api');
      const{data}=await api.get(`/ai/wa/${storeId}/stats`);
      if(data)setStats({sent_today:data.sent_today||0,success_rate:data.success_rate??100,delivered:data.delivered||0,failed:data.failed||0});
    }catch{}
  };
  const loadRecent=async()=>{
    try{
      const{api}=await import('../../utils/api');
      const{data}=await api.get(`/ai/wa/${storeId}/recent?limit=50`);
      if(Array.isArray(data?.messages))setRecent(data.messages);
    }catch{}
  };

  const isRtl=lang==='ar';
  const handleSaveAll=()=>{if(onSave)onSave(cfg);setSavedToast(true);setTimeout(()=>setSavedToast(false),2200);};
  const handleSaveAndClose=()=>{if(onSave)onSave(cfg);onClose();};

  const filteredRecent=useMemo(()=>{
    let rows=[...recent];
    if(recentFilter.status!=='all')rows=rows.filter(r=>r.status===recentFilter.status);
    if(recentFilter.type!=='all')rows=rows.filter(r=>r.type===recentFilter.type);
    if(recentFilter.q){const q=recentFilter.q.toLowerCase();rows=rows.filter(r=>(r.recipient||'').toLowerCase().includes(q)||(r.message||'').toLowerCase().includes(q));}
    if(recentFilter.from){const f=new Date(recentFilter.from).getTime();rows=rows.filter(r=>new Date(r.created_at).getTime()>=f);}
    if(recentFilter.to){const tEnd=new Date(recentFilter.to).getTime()+86400000;rows=rows.filter(r=>new Date(r.created_at).getTime()<=tEnd);}
    return rows.slice(0,recentFilter.pageSize);
  },[recent,recentFilter]);

  if(!show)return null;

  // Theme tokens
  const b=dk?'bg-gray-900':'bg-[#fafafa]';
  const card=dk?'bg-gray-800 border-gray-700':'bg-white border-gray-100';
  const t1=dk?'text-white':'text-gray-900';
  const t2=dk?'text-gray-300':'text-gray-700';
  const t3=dk?'text-gray-400':'text-gray-400';
  const inp=dk?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-white border-gray-200 text-gray-900';
  const varBtn=dk?'bg-gray-700 border-gray-600 text-emerald-400 hover:bg-gray-600':'bg-white border-gray-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300';

  return(
    <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className={`${b} w-full sm:rounded-3xl max-w-5xl max-h-[100vh] sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col`} onClick={e=>e.stopPropagation()}>
        {/* ─── Header ─── */}
        <div className={`px-5 py-4 border-b ${dk?'border-gray-800 bg-gray-900':'border-gray-100 bg-white'} flex items-center justify-between gap-3 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><MessageCircle size={18} className="text-white"/></div>
            <div className="min-w-0">
              <h2 className={`font-extrabold text-base sm:text-lg ${t1} truncate`}>WhatsApp Order Notifications</h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <span className={`flex items-center gap-1 font-semibold ${waStatus?.connected?'text-emerald-600':t3}`}><span className={`w-1.5 h-1.5 rounded-full ${waStatus?.connected?'bg-emerald-500':'bg-gray-400'}`}/>{waStatus?.connected?'Active':'Inactive'}</span>
                <span className={t3}>·</span>
                <span className={`font-semibold ${waStatus?.connected?'text-emerald-600':t3}`}>Server {waStatus?.connected?'Connected':'Disconnected'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex ${dk?'bg-gray-800':'bg-gray-100'} rounded-xl p-1 gap-0.5`}>
              {[{c:'ar',l:'العربية'},{c:'fr',l:'Français'},{c:'en',l:'English'}].map(lg=>(
                <button key={lg.c} onClick={()=>{setLang(lg.c);setV('wa_language',lg.c);}} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${lang===lg.c?(dk?'bg-gray-700 text-white shadow':'bg-white text-gray-900 shadow'):(dk?'text-gray-400':'text-gray-500 hover:text-gray-700')}`}>{lg.l}</button>
              ))}
            </div>
            <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dk?'hover:bg-gray-800 text-gray-300':'hover:bg-gray-100 text-gray-500'}`}><X size={18}/></button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* ── Connect WhatsApp Business (QR Code) ── */}
          <div className={`rounded-2xl border ${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-xl ${dk?'bg-gray-700':'bg-gray-50'} flex items-center justify-center`}><QrCode size={16} className="text-gray-500"/></div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${t1}`}>Connect WhatsApp Business (QR Code)</p>
                {waStatus?.connected?(
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5"><Check size={11}/>Connected for automated messages {waStatus.phone&&<span className={`font-mono ${t3}`}>· {waStatus.phone}</span>}</p>
                ):(
                  <p className={`text-[11px] ${t3}`}>Scan the QR with WhatsApp on your phone to connect.</p>
                )}
              </div>
              {waStatus?.connected?(
                <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"><WifiOff size={11}/>Disconnect</button>
              ):(
                <button onClick={startConnection} disabled={waLoading} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1">{waLoading?<RefreshCw size={11} className="animate-spin"/>:<QrCode size={11}/>}Connect</button>
              )}
            </div>
            {/* QR display when starting */}
            {showQR&&waStatus?.qr&&!waStatus?.connected&&(
              <div className="text-center mb-3">
                <img src={waStatus.qr.startsWith('data:')?waStatus.qr:`data:image/png;base64,${waStatus.qr}`} alt="QR" className="w-40 h-40 mx-auto rounded-lg border"/>
                <p className={`text-[10px] ${t3} mt-1`}>Scan with WhatsApp → Settings → Linked Devices</p>
                <button onClick={startConnection} className="mt-1 text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1 mx-auto"><RefreshCw size={11}/>Refresh QR</button>
              </div>
            )}
            {/* Quick send test message bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input className={`flex-1 ${inp} border rounded-xl px-3 py-2 text-sm font-mono`} value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="+213 5XX XX XX XX"/>
              <input readOnly value={lang==='ar'?'رسالة اختبار سريعة':lang==='fr'?'Message test rapide':'Quick send test message'} className={`flex-1 ${inp} border rounded-xl px-3 py-2 text-sm`}/>
              <button onClick={()=>sendTest()} disabled={testSending||!waStatus?.connected} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">
                {testSending?<RefreshCw size={12} className="animate-spin"/>:<Send size={12}/>}Test Send
              </button>
            </div>
            <p className={`text-[10px] ${t3} mt-2`}>Automatically sent to each customer when their order status changes. The session is saved locally and does not require re-linking.</p>
            {waError&&<p className="text-[11px] text-red-500 mt-1">{waError}</p>}
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'SENT TODAY',value:stats.sent_today,color:'#3b82f6'},
              {label:'SUCCESS RATE',value:`${stats.success_rate}%`,color:'#10b981'},
              {label:'DELIVERED',value:stats.delivered,color:'#10b981'},
              {label:'FAILED',value:stats.failed,color:'#ef4444'},
            ].map(s=>(
              <div key={s.label} className={`rounded-2xl border ${card} p-3.5 relative`}>
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{backgroundColor:s.color}}/>
                <p className={`text-[10px] font-bold ${t3} uppercase tracking-wider`}>{s.label}</p>
                <p className={`text-2xl font-extrabold ${t1} mt-1`}>{s.value}</p>
                <p className={`text-[10px] ${t3} mt-0.5`}>{s.label==='SENT TODAY'?'Total messages sent today':s.label==='SUCCESS RATE'?'Delivery success rate':s.label==='DELIVERED'?'Lifetime delivered messages':'Retrying automatically'}</p>
              </div>
            ))}
          </div>

          {/* ── Message Template Settings ── */}
          <div className={`rounded-2xl border ${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-xl ${dk?'bg-gray-700':'bg-gray-50'} flex items-center justify-center`}><Bell size={15} className="text-emerald-500"/></div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${t1}`}>Message Template Settings</p>
                <p className={`text-[11px] ${t3}`}>Sent automatically when order status changes</p>
              </div>
            </div>
            <div className="space-y-2">
              {WA_STATUSES.map(st=>(
                <StatusRow
                  key={st}
                  status={st}
                  lang={lang}
                  enabled={getEnabled(st)}
                  timing={getTiming(st)}
                  template={getTpl(st)}
                  onToggle={(v)=>setEnabled(st,v)}
                  onTiming={(v)=>setTiming(st,v)}
                  onTemplate={(v)=>setTpl(st,v)}
                  onTest={()=>sendTest(st)}
                  onPreview={()=>setPreviewStatus(st)}
                  dk={dk} t1={t1} t2={t2} t3={t3} inp={inp} varBtn={varBtn}
                  expanded={expanded===st}
                  onExpand={()=>setExpanded(expanded===st?null:st)}
                />
              ))}
            </div>
          </div>

          {/* ── Recent activity ── */}
          <div className={`rounded-2xl border ${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${dk?'bg-gray-700':'bg-gray-50'} flex items-center justify-center`}><RefreshCw size={14} className="text-gray-500"/></div>
                <div>
                  <p className={`font-bold text-sm ${t1}`}>Recent Activity</p>
                  <p className={`text-[11px] ${t3}`}>Last 50 messages sent to customers</p>
                </div>
              </div>
              <button onClick={loadRecent} className={`p-1.5 rounded-lg ${dk?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`} title="Refresh"><RefreshCw size={13}/></button>
            </div>
            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3">
              <select className={`text-[11px] ${inp} border rounded-lg px-2 py-1.5`} value={recentFilter.status} onChange={e=>setRecentFilter(p=>({...p,status:e.target.value}))}>
                <option value="all">All statuses</option>
                {WA_STATUSES.map(s=><option key={s} value={s}>{WA_STATUS_LABELS[s]?.en||s}</option>)}
              </select>
              <select className={`text-[11px] ${inp} border rounded-lg px-2 py-1.5`} value={recentFilter.type} onChange={e=>setRecentFilter(p=>({...p,type:e.target.value}))}>
                <option value="all">All types</option>
                <option value="auto">Auto</option>
                <option value="test">Test</option>
                <option value="manual">Manual</option>
              </select>
              <div className="relative col-span-1"><Calendar size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${t3}`}/><input type="date" className={`text-[11px] ${inp} border rounded-lg pl-7 pr-2 py-1.5 w-full`} value={recentFilter.from} onChange={e=>setRecentFilter(p=>({...p,from:e.target.value}))}/></div>
              <div className="relative col-span-1"><Calendar size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${t3}`}/><input type="date" className={`text-[11px] ${inp} border rounded-lg pl-7 pr-2 py-1.5 w-full`} value={recentFilter.to} onChange={e=>setRecentFilter(p=>({...p,to:e.target.value}))}/></div>
              <div className="relative col-span-1"><Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${t3}`}/><input className={`text-[11px] ${inp} border rounded-lg pl-7 pr-2 py-1.5 w-full`} placeholder="Search code…" value={recentFilter.q} onChange={e=>setRecentFilter(p=>({...p,q:e.target.value}))}/></div>
              <select className={`text-[11px] ${inp} border rounded-lg px-2 py-1.5`} value={recentFilter.pageSize} onChange={e=>setRecentFilter(p=>({...p,pageSize:Number(e.target.value)}))}>
                {[10,25,50,100].map(n=><option key={n} value={n}>{n} results</option>)}
              </select>
            </div>
            {filteredRecent.length===0?(
              <div className={`text-center py-8 text-[12px] ${t3}`}>No messages yet — send a test or wait for an order.</div>
            ):(
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead className={`${dk?'text-gray-400':'text-gray-500'} text-[10px] uppercase`}>
                    <tr><th className="text-left px-2 py-2">When</th><th className="text-left px-2 py-2">To</th><th className="text-left px-2 py-2">Status</th><th className="text-left px-2 py-2">Result</th></tr>
                  </thead>
                  <tbody>
                    {filteredRecent.map((m,i)=>(
                      <tr key={i} className={`border-t ${dk?'border-gray-700':'border-gray-100'}`}>
                        <td className={`px-2 py-2 ${t3}`}>{new Date(m.created_at).toLocaleString()}</td>
                        <td className={`px-2 py-2 font-mono ${t2}`}>{m.recipient}</td>
                        <td className="px-2 py-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${WA_STATUS_META[m.status]?.bg||'bg-gray-100 text-gray-500'}`}>{WA_STATUS_LABELS[m.status]?.en||m.status||'—'}</span></td>
                        <td className="px-2 py-2"><span className={`text-[10px] font-bold ${m.status==='sent'||m.delivered?'text-emerald-600':'text-red-500'}`}>{m.delivered||m.status==='sent'?'Delivered':'Failed'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="h-16"/>{/* spacer for fixed footer */}
        </div>

        {/* ─── Footer ─── */}
        <div className={`px-4 sm:px-6 py-3 border-t ${dk?'border-gray-800 bg-gray-900':'border-gray-100 bg-white'} flex items-center justify-end gap-2 shrink-0`}>
          {savedToast&&(
            <span className="mr-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold"><Check size={12}/>{Object.keys(getTemplates()[lang]||{}).length} templates saved</span>
          )}
          <button onClick={handleSaveAll} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 flex items-center gap-1.5"><Save size={13}/>Save All</button>
          <button onClick={handleSaveAndClose} className={`px-4 py-2 rounded-xl text-xs font-bold ${dk?'bg-gray-700 text-white hover:bg-gray-600':'bg-gray-900 text-white hover:bg-black'}`}>Save & Close</button>
        </div>
      </div>

      {/* ─── Preview popup (portal so it sits above the modal stacking ctx) ─── */}
      {previewStatus&&createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>setPreviewStatus(null)}>
          <div className={`${dk?'bg-gray-800':'bg-white'} rounded-3xl p-5 w-full max-w-sm shadow-2xl relative`} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setPreviewStatus(null)} className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${dk?'hover:bg-gray-700 text-gray-300':'hover:bg-gray-100 text-gray-500'}`}><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><MessageCircle size={14} className="text-white"/></div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${t1}`}>{lang==='ar'?'إشعار':lang==='fr'?'Notification':'Notification'} · {WA_STATUS_LABELS[previewStatus]?.[lang]||previewStatus}</p>
                <p className={`text-[10px] ${t3}`}>WhatsApp Preview</p>
              </div>
            </div>
            <div className="flex items-center justify-center mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dk?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600'}`}>SYSTEM PREVIEW</span></div>
            <div className="rounded-2xl p-3 min-h-[180px]" style={{backgroundColor:'#e5ddd5',backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
              <div className={`flex ${lang==='ar'?'flex-row-reverse':''}`}>
                <div className="max-w-[90%] rounded-xl rounded-tl-sm px-3 py-2 shadow-sm" style={{backgroundColor:'#dcf8c6',direction:lang==='ar'?'rtl':'ltr'}}>
                  <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap break-words" style={{color:'#000000'}}>{preview(getTpl(previewStatus))||(lang==='ar'?'(قالب فارغ)':lang==='fr'?'(modèle vide)':'(empty template)')}</p>
                  <div className={`flex items-center gap-1 mt-1 ${lang==='ar'?'justify-start':'justify-end'}`}>
                    <span className="text-[9px] text-gray-500">{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                    <span className="text-emerald-500 text-[10px]">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
            <p className={`text-center text-[10px] ${t3} mt-2`}>Preview generated with sample data</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
