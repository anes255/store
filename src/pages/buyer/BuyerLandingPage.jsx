import React,{useState,useEffect,useRef,useCallback}from'react';
import{useParams,Link}from'react-router-dom';
import{useTranslation}from'react-i18next';
import{storeApi,paymentApi}from'../../utils/api';
import{useAuthStore}from'../../hooks/useStore';
import toast from'react-hot-toast';
import{ShoppingBag,Check,Star,Truck,Shield,ChevronDown,Plus,Minus,Phone,MapPin,User,Mail,CreditCard,Lock,Loader2,Package,Clock,Heart,Award,ArrowDown,Zap,Flame,Eye,ThumbsUp,Gift,Globe,Upload,Copy,ArrowRight,X,Tag,Smartphone}from'lucide-react';
import WILAYA_CITIES from'../../data/wilayaCities';

const WILAYA_CODES={'Adrar':'01','Chlef':'02','Laghouat':'03','Oum El Bouaghi':'04','Batna':'05','Béjaïa':'06','Biskra':'07','Béchar':'08','Blida':'09','Bouira':'10','Tamanrasset':'11','Tébessa':'12','Tlemcen':'13','Tiaret':'14','Tizi Ouzou':'15','Alger':'16','Djelfa':'17','Jijel':'18','Sétif':'19','Saïda':'20','Skikda':'21','Sidi Bel Abbès':'22','Annaba':'23','Guelma':'24','Constantine':'25','Médéa':'26','Mostaganem':'27',"M'Sila":'28','Mascara':'29','Ouargla':'30','Oran':'31','El Bayadh':'32','Illizi':'33','Bordj Bou Arréridj':'34','Boumerdès':'35','El Tarf':'36','Tindouf':'37','Tissemsilt':'38','El Oued':'39','Khenchela':'40','Souk Ahras':'41','Tipaza':'42','Mila':'43','Aïn Defla':'44','Naâma':'45','Aïn Témouchent':'46','Ghardaïa':'47','Relizane':'48'};
const ALL_WILAYAS=Object.entries(WILAYA_CODES).map(([name,code])=>({name,code})).sort((a,b)=>parseInt(a.code)-parseInt(b.code));

/* ═══════════════════════════════════════════════════════════════
   VISUAL UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function useReveal(threshold=0.15){
  const ref=useRef(null);
  const[visible,setVisible]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect();}},{threshold});
    obs.observe(el);
    return()=>obs.disconnect();
  },[threshold]);
  return[ref,visible];
}

function AnimatedNumber({value,duration=1200}){
  const[display,setDisplay]=useState(0);
  const ref=useRef(null);
  const[started,setStarted]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setStarted(true);obs.disconnect();}},{threshold:0.5});
    obs.observe(el);
    return()=>obs.disconnect();
  },[]);
  useEffect(()=>{
    if(!started)return;
    const start=performance.now();
    const tick=(now)=>{
      const p=Math.min((now-start)/duration,1);
      const eased=1-Math.pow(1-p,4);
      setDisplay(Math.round(eased*value));
      if(p<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },[started,value,duration]);
  return <span ref={ref}>{display.toLocaleString()}</span>;
}

function CountdownTimer({hours=0,minutes=0,accent}){
  const endTime=useRef(Date.now()+(hours*3600+minutes*60)*1000);
  const[left,setLeft]=useState(()=>{const d=endTime.current-Date.now();return d>0?d:0;});
  useEffect(()=>{
    const iv=setInterval(()=>{const d=endTime.current-Date.now();setLeft(d>0?d:0);},1000);
    return()=>clearInterval(iv);
  },[]);
  const h=Math.floor(left/3600000);
  const m=Math.floor((left%3600000)/60000);
  const s=Math.floor((left%60000)/1000);
  const pad=n=>String(n).padStart(2,'0');
  if(left<=0)return null;
  return(
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md" style={{backgroundColor:accent+'20',border:`1px solid ${accent}40`}}>
      <Flame size={14} style={{color:accent}}/>
      <span className="text-sm font-black tabular-nums" style={{color:accent}}>{pad(h)}:{pad(m)}:{pad(s)}</span>
    </div>
  );
}

function Reveal({children,animation='slide-up',delay=0,className=''}){
  const[ref,visible]=useReveal(0.12);
  const baseStyle={transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`};
  const hidden={opacity:0,transform:animation==='slide-up'?'translateY(50px)':animation==='zoom'?'scale(0.88)':animation==='slide-left'?'translateX(-40px)':animation==='slide-right'?'translateX(40px)':'translateY(0)'};
  const shown={opacity:1,transform:'translateY(0) scale(1) translateX(0)'};
  if(animation==='none')return <div ref={ref} className={className}>{children}</div>;
  return(
    <div ref={ref} className={className} style={{...baseStyle,...(visible?shown:hidden)}}>
      {children}
    </div>
  );
}

/* ── Decorative mesh gradient background ── */
function MeshGradient({color1,color2,color3,opacity=0.15,className=''}){
  return(
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[120px] animate-pulse" style={{backgroundColor:color1,opacity}}/>
      <div className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full blur-[100px]" style={{backgroundColor:color2,opacity:opacity*0.8,animation:'pulse 4s ease-in-out infinite alternate'}}/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full blur-[80px]" style={{backgroundColor:color3||color1,opacity:opacity*0.5,animation:'pulse 6s ease-in-out infinite alternate-reverse'}}/>
    </div>
  );
}

/* ── Product image collage as background ── */
function ProductImageMosaic({items,overlay='rgba(0,0,0,0.7)'}){
  const images=items.filter(it=>it.custom_image||it.image).slice(0,6);
  if(!images.length)return null;
  const cols=images.length>=4?3:images.length>=2?2:1;
  return(
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid gap-1" style={{gridTemplateColumns:`repeat(${cols}, 1fr)`,opacity:0.35}}>
        {images.map((it,i)=>(
          <div key={i} className="relative overflow-hidden">
            <img src={it.custom_image||it.image} alt="" className="w-full h-full object-cover scale-110" style={{filter:'saturate(0.6)'}}/>
          </div>
        ))}
      </div>
      <div className="absolute inset-0" style={{background:overlay}}/>
    </div>
  );
}

/* ── Collect every image for a landing item (gallery support) ── */
function itemImages(item){
  if(!item)return[];
  let imgs=Array.isArray(item.images)?item.images.filter(Boolean):[];
  if(item.custom_image)imgs=[item.custom_image,...imgs.filter(s=>s!==item.custom_image)];
  if(!imgs.length&&item.image)imgs=[item.image];
  return[...new Set(imgs)];
}

/* ── Product gallery: main image + thumbnail strip when multiple ── */
function ProductGallery({item,accent,imgClass='',aspect='aspect-square'}){
  const imgs=itemImages(item);
  const[active,setActive]=useState(0);
  useEffect(()=>{setActive(0);},[item?.product_id]);
  if(!imgs.length)return(<div className={`w-full ${aspect} rounded-3xl flex items-center justify-center`} style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={56} className="opacity-20"/></div>);
  const src=imgs[Math.min(active,imgs.length-1)];
  return(
    <div className="space-y-3">
      <img src={src} alt={item.name||''} className={`w-full ${aspect} object-cover ${imgClass}`}/>
      {imgs.length>1&&(
        <div className="flex flex-wrap items-center justify-center gap-2">
          {imgs.map((s,i)=>(
            <button key={i} type="button" onClick={()=>setActive(i)} className="w-14 h-14 rounded-xl overflow-hidden transition-all" style={{boxShadow:i===active?`0 0 0 2px ${accent||'#000'}`:'0 0 0 1px rgba(0,0,0,0.08)',opacity:i===active?1:0.6}}>
              <img src={s} alt="" className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Floating product thumbnails strip ── */
function ProductStrip({items,accent}){
  const images=items.filter(it=>it.custom_image||it.image).slice(0,5);
  if(images.length<2)return null;
  return(
    <div className="flex items-center justify-center gap-3 mt-8">
      {images.map((it,i)=>(
        <div key={i} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-xl transition-transform hover:scale-110 hover:ring-white/50" style={{transform:`rotate(${(i-Math.floor(images.length/2))*5}deg)`}}>
          <img src={it.custom_image||it.image} alt="" className="w-full h-full object-cover"/>
        </div>
      ))}
      {items.length>5&&(
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xs font-bold text-white/70 backdrop-blur-md" style={{backgroundColor:accent+'30',border:'2px solid rgba(255,255,255,0.15)'}}>
          +{items.length-5}
        </div>
      )}
    </div>
  );
}

/* ── Inline CSS keyframes + visual polish ── */
function AnimationStyles({accent}){
  return(
    <style>{`
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
      @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      @keyframes glow-pulse{0%,100%{box-shadow:0 0 20px var(--glow-color,rgba(124,58,237,0.3))}50%{box-shadow:0 0 40px var(--glow-color,rgba(124,58,237,0.5))}}
      @keyframes gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes subtle-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      .float-slow{animation:float 6s ease-in-out infinite}
      .float-med{animation:float 4s ease-in-out infinite}
      .shimmer-bg{background:linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.08) 50%,transparent 75%);background-size:200% 100%;animation:shimmer 3s linear infinite}
      .gradient-animate{background-size:200% 200%;animation:gradient-shift 8s ease infinite}
      .subtle-bounce{animation:subtle-bounce 2s ease-in-out infinite}
      /* Polished scrollbar */
      .lp-root::-webkit-scrollbar{width:6px}
      .lp-root::-webkit-scrollbar-track{background:transparent}
      .lp-root::-webkit-scrollbar-thumb{background:${accent||'#7C3AED'}30;border-radius:3px}
      .lp-root::-webkit-scrollbar-thumb:hover{background:${accent||'#7C3AED'}60}
      /* Selection color */
      .lp-root ::selection{background:${accent||'#7C3AED'}30;color:inherit}
      /* Form input focus — pure CSS, no JS DOM mutation */
      .lp-root .lp-input{border:1.5px solid oklch(0.9 0.005 280);background:oklch(0.99 0.002 280);transition:border-color 0.2s,box-shadow 0.2s}
      .lp-root .lp-input:focus{border-color:${accent||'#7C3AED'} !important;box-shadow:0 0 0 3px ${accent||'#7C3AED'}20 !important;outline:none}
    `}</style>
  );
}

/* ── Trust badges (enhanced) ── */
function TrustBadges({accent,textColor,variant='light'}){
  const{t}=useTranslation();
  const isDark=variant==='dark';
  const badges=[
    {icon:<Truck size={20}/>,label:t('lp.fastDelivery','Fast Delivery'),sub:t('lp.fastDeliverySub','48h across Algeria')},
    {icon:<Shield size={20}/>,label:t('lp.securePayment','Secure Payment'),sub:t('lp.securePaymentSub','100% protected')},
    {icon:<Award size={20}/>,label:t('lp.topQuality','Top Quality'),sub:t('lp.topQualitySub','Satisfaction guaranteed')},
  ];
  return(
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
      {badges.map((b,i)=>(
        <div key={i} className="text-center space-y-2 p-4 rounded-2xl transition-transform hover:scale-105" style={{backgroundColor:isDark?'rgba(255,255,255,0.06)':accent+'08'}}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-lg" style={{backgroundColor:isDark?'rgba(255,255,255,0.1)':accent+'18',color:accent}}>{b.icon}</div>
          <p className="text-xs font-bold" style={{color:textColor}}>{b.label}</p>
          <p className="text-[10px] opacity-50" style={{color:textColor}}>{b.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Social proof (no hardcoded data) ── */
function SocialProof({accent,textColor,showReviews}){
  const{t}=useTranslation();
  const[ref,visible]=useReveal(0.3);
  return(
    <div ref={ref} className="flex items-center justify-center gap-6 flex-wrap" style={{opacity:visible?1:0,transition:'opacity 0.6s ease'}}>
      <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl" style={{backgroundColor:accent+'08',border:`1px solid ${accent}15`}}>
        <div className="flex -space-x-2.5">
          {[...Array(4)].map((_,i)=>(
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md" style={{backgroundColor:accent,filter:`hue-rotate(${i*30}deg)`}}>
              {['A','S','M','K'][i]}
            </div>
          ))}
        </div>
        <div>
          <span className="text-[10px] opacity-50" style={{color:textColor}}>{t('lp.trustedBuyers','Trusted by buyers')}</span>
        </div>
      </div>
      {showReviews&&(
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl" style={{backgroundColor:accent+'08',border:`1px solid ${accent}15`}}>
          <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="#FBBF24" color="#FBBF24"/>)}</div>
          <span className="text-[10px] opacity-50" style={{color:textColor}}>{t('lp.topRated','Top Rated')}</span>
        </div>
      )}
    </div>
  );
}

/* ── Quantity control ── */
function QtyControl({qty,onMinus,onPlus,onAdd,accent,variant='light',t}){
  const isDark=variant==='dark';
  if(qty>0)return(
    <div className="flex items-center rounded-xl overflow-hidden backdrop-blur-sm" style={{border:`1.5px solid ${isDark?'rgba(255,255,255,0.15)':'oklch(0.88 0.005 280)'}`,backgroundColor:isDark?'rgba(255,255,255,0.06)':'transparent'}}>
      <button onClick={onMinus} className="px-3.5 py-2.5 transition-colors hover:bg-white/10" style={{color:isDark?'#FFF':undefined}}><Minus size={14}/></button>
      <span className="px-4 py-2.5 font-bold text-base min-w-[2.5rem] text-center tabular-nums" style={{color:isDark?'#FFF':undefined}}>{qty}</span>
      <button onClick={onPlus} className="px-3.5 py-2.5 transition-colors hover:bg-white/10" style={{color:isDark?'#FFF':undefined}}><Plus size={14}/></button>
    </div>
  );
  return(
    <button onClick={onAdd} className="px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.96] flex items-center gap-2" style={{backgroundColor:accent,color:'#FFF','--glow-color':accent+'60'}}>
      <ShoppingBag size={15}/>{t('lp.addToOrder','Add to Order')}
    </button>
  );
}

/* ── Price display ── */
function PriceTag({price,comparePrice,currency,accent,size='lg',variant='light'}){
  const isDark=variant==='dark';
  const sizes={sm:'text-lg',md:'text-2xl',lg:'text-3xl',xl:'text-4xl'};
  return(
    <div className="flex items-end gap-2.5">
      <span className={`${sizes[size]} font-black tracking-tight`} style={{color:isDark?'#FFF':accent}}>{parseFloat(price).toLocaleString()} <span className="text-sm font-bold opacity-60">{currency}</span></span>
      {comparePrice&&parseFloat(comparePrice)>0&&<span className="text-base opacity-40 line-through font-medium mb-0.5" style={{color:isDark?'#FFF':undefined}}>{parseFloat(comparePrice).toLocaleString()}</span>}
    </div>
  );
}

/* ── Discount badge ── */
function DiscountBadge({price,comparePrice,accent}){
  if(!comparePrice||!parseFloat(comparePrice))return null;
  const pct=Math.round((1-parseFloat(price)/parseFloat(comparePrice))*100);
  if(pct<=0)return null;
  return <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-lg" style={{backgroundColor:'#EF4444',boxShadow:'0 4px 15px rgba(239,68,68,0.4)'}}>-{pct}%</div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

/* ── Form components (outside component to prevent remount on re-render) ── */
function FormInput({icon:Icon,label,required,accent,...props}){
  return(
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>
        {Icon&&<Icon size={12}/>}{label}{required&&<span style={{color:accent}}>*</span>}
      </label>
      <input className="lp-input w-full px-4 py-3 rounded-xl text-sm" {...props}/>
    </div>
  );
}
function FormSelect({icon:Icon,label,required,accent,children,...props}){
  return(
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>
        {Icon&&<Icon size={12}/>}{label}{required&&<span style={{color:accent}}>*</span>}
      </label>
      <select className="lp-input w-full px-4 py-3 rounded-xl text-sm appearance-none" {...props}>{children}</select>
    </div>
  );
}
function FloatingCartButton({totalQty,subtotal,currency,accent,onClick}){
  if(totalQty===0)return null;
  return(
    <button onClick={onClick} className="fixed bottom-5 z-50 flex items-center gap-2.5 pl-5 pr-5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 backdrop-blur-md" style={{backgroundColor:accent+'ee',boxShadow:`0 8px 32px ${accent}50, 0 0 0 1px ${accent}30`,right:'20px'}}>
      <div className="relative">
        <ShoppingBag size={18}/>
        <span className="absolute -top-2 -right-2 rounded-full bg-white text-[10px] font-black flex items-center justify-center leading-none" style={{color:accent,width:'18px',height:'18px'}}>{totalQty}</span>
      </div>
      <span className="opacity-80">|</span>
      <span className="tabular-nums">{subtotal.toLocaleString()} {currency}</span>
    </button>
  );
}

const BUYER_LANGS=[
  {code:'en',label:'EN',flag:'🇬🇧',name:'English'},
  {code:'fr',label:'FR',flag:'🇫🇷',name:'Français'},
  {code:'ar',label:'AR',flag:'🇩🇿',name:'العربية'},
];

function BuyerLangSwitcher({accent}){
  const{i18n}=useTranslation();
  const[open,setOpen]=useState(false);
  const cur=BUYER_LANGS.find(l=>l.code===i18n.language)||BUYER_LANGS[0];
  const change=(code)=>{
    i18n.changeLanguage(code);
    document.documentElement.dir=code==='ar'?'rtl':'ltr';
    document.documentElement.lang=code;
    setOpen(false);
  };
  return(
    <div className="fixed top-4 z-50" style={{right:document.documentElement.dir==='rtl'?'auto':'16px',left:document.documentElement.dir==='rtl'?'16px':'auto'}}>
      {open&&<div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>}
      <button onClick={()=>setOpen(!open)} className="relative z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-xl shadow-lg transition-all hover:scale-105 active:scale-95" style={{backgroundColor:'rgba(255,255,255,0.85)',color:'#333',border:'1px solid rgba(0,0,0,0.08)'}}>
        <Globe size={14} style={{color:accent||'#7C3AED'}}/><span>{cur.flag} {cur.label}</span><ChevronDown size={12} className={`transition-transform ${open?'rotate-180':''}`}/>
      </button>
      {open&&(
        <div className="absolute top-full mt-1.5 rounded-xl shadow-2xl border border-gray-100 bg-white overflow-hidden z-50" style={{right:0,minWidth:'140px'}}>
          {BUYER_LANGS.map(l=>(
            <button key={l.code} onClick={()=>change(l.code)} className={`w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-sm transition-all ${i18n.language===l.code?'bg-gray-50 font-bold':'hover:bg-gray-50'}`}>
              <span className="text-base">{l.flag}</span>
              <span className={i18n.language===l.code?'text-gray-900':'text-gray-600'}>{l.name}</span>
              {i18n.language===l.code&&<Check size={13} className="text-emerald-500 ml-auto"/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerLandingPage(){
  const{storeSlug,landingSlug}=useParams();
  const{t,i18n}=useTranslation();
  const[store,setStore]=useState(null);
  const[page,setPage]=useState(null);
  const[loading,setLoading]=useState(true);
  const[notFound,setNotFound]=useState(false);
  const[cart,setCart]=useState({});
  const[form,setForm]=useState({customer_name:'',customer_phone:'',customer_email:'',shipping_wilaya:'',shipping_city:'',shipping_address:'',shipping_zip:'',shipping_type:'home',payment_method:'cod',notes:'',delivery_company_id:'',notification_preference:'whatsapp',coupon_code:''});
  const[wilayas,setWilayas]=useState([]);
  const[communes,setCommunes]=useState([]);
  const[shippingPrice,setShippingPrice]=useState(0);
  const[submitting,setSubmitting]=useState(false);
  const[orderSuccess,setOrderSuccess]=useState(null);
  const[companies,setCompanies]=useState([]);
  const[companiesLoaded,setCompaniesLoaded]=useState(false);
  const[couponDiscount,setCouponDiscount]=useState(0);
  const[paymentStep,setPaymentStep]=useState(null);
  const[receiptImage,setReceiptImage]=useState(null);
  const[receiptRef,setReceiptRef]=useState('');
  const checkoutRef=useRef(null);
  const set=useCallback(k=>e=>setForm(f=>({...f,[k]:e.target.value})),[]);

  useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('checkout.savedInfo'));if(s)setForm(f=>({...f,...s}));}catch{}},[]);

  useEffect(()=>{
    if(!storeSlug)return;
    (async()=>{
      try{
        const{data:storeData}=await storeApi.getStore(storeSlug);
        setStore(storeData);
        const lps=Array.isArray(storeData.landing_pages)?storeData.landing_pages:
                  Array.isArray(storeData.config?.landing_pages)?storeData.config.landing_pages.filter(p=>p.enabled):[];
        const lp=lps.find(p=>p.slug===landingSlug&&p.enabled);
        if(!lp){setNotFound(true);setLoading(false);return;}
        setPage(lp);
        const initCart={};
        lp.items.forEach((it,i)=>{initCart[it.product_id]=i===0?1:0;});
        setCart(initCart);
        try{const{data:wData}=await storeApi.getShippingWilayas(storeSlug);const w=Array.isArray(wData)?wData:(wData?.wilayas||[]);setWilayas(w.filter(x=>x.is_active!==false));}catch{}
        try{const{data:cData}=await storeApi.getDeliveryCompanies?.(storeSlug)||{data:[]};if(Array.isArray(cData))setCompanies(cData);}catch{}finally{setCompaniesLoaded(true);}
      }catch(e){setNotFound(true);}
      setLoading(false);
    })();
  },[storeSlug,landingSlug]);

  // Keep the browser tab title in sync so it never stays stuck on "Loading…"
  useEffect(()=>{
    const title=page?.title||page?.name||store?.name||store?.store_name;
    if(title)document.title=title;
  },[page,store]);

  // Switch language based on page setting
  useEffect(()=>{
    if(!page?.language)return;
    const lang=page.language;
    if(i18n.language!==lang)i18n.changeLanguage(lang);
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    document.documentElement.lang=lang;
    return()=>{document.documentElement.dir='ltr';};
  },[page?.language]);

  useEffect(()=>{
    if(!form.shipping_wilaya){setShippingPrice(0);return;}
    // shipping_wilaya is the wilaya name (e.g. "Alger")
    const wName=form.shipping_wilaya;
    const w=wilayas.find(x=>x.wilaya_name===wName);
    if(w){
      // Mirror store checkout: prefer per-delivery-company override, then
      // fall back to the wilaya's home/desk price exactly as admin configured.
      let cp=w.company_prices;
      if(typeof cp==='string'){try{cp=JSON.parse(cp);}catch{cp=null;}}
      const perCo=cp&&form.delivery_company_id?cp[form.delivery_company_id]:null;
      let price;
      if(perCo){
        price=parseFloat(form.shipping_type==='home'?(perCo.home||perCo.home_price||w.home_delivery_price):(perCo.desk||perCo.desk_price||w.desk_delivery_price))||0;
      }else{
        price=parseFloat(form.shipping_type==='home'?w.home_delivery_price:w.desk_delivery_price)||0;
      }
      setShippingPrice(price);
    }else{
      setShippingPrice(parseFloat(store?.shipping_default_price||0)||0);
    }
    // Always use WILAYA_CITIES for communes (canonical list)
    setCommunes(WILAYA_CITIES[wName]||[]);
  },[form.shipping_wilaya,form.shipping_type,form.delivery_company_id,wilayas,store]);

  // Compute delivery price for a given shipping type (home/desk)
  const getDeliveryPrice=useCallback((type)=>{
    if(!form.shipping_wilaya)return null;
    const w=wilayas.find(x=>x.wilaya_name===form.shipping_wilaya);
    if(!w)return null;
    let cp=w.company_prices;
    if(typeof cp==='string'){try{cp=JSON.parse(cp);}catch{cp=null;}}
    const perCo=cp&&form.delivery_company_id?cp[form.delivery_company_id]:null;
    if(perCo){return parseFloat(type==='home'?(perCo.home||perCo.home_price||w.home_delivery_price):(perCo.desk||perCo.desk_price||w.desk_delivery_price))||0;}
    return parseFloat(type==='home'?w.home_delivery_price:w.desk_delivery_price)||0;
  },[form.shipping_wilaya,form.delivery_company_id,wilayas]);

  const scrollToCheckout=useCallback(()=>{checkoutRef.current?.scrollIntoView({behavior:'smooth'});},[]);

  // Render AI images by placement
  const renderAIImages=(placement)=>{
    const imgs=(page?.ai_images||[]).filter(img=>img.src&&img.placement===placement);
    if(!imgs.length)return null;
    return imgs.map(img=>(
      <div key={img.id} className="w-full overflow-hidden">
        <img src={img.src} alt={img.description||''} className="w-full h-48 sm:h-64 object-cover" loading="lazy"/>
      </div>
    ));
  };
  const setQty=useCallback((pid,delta)=>setCart(c=>{const n=Math.max(0,(c[pid]||0)+delta);return{...c,[pid]:n};}),[]);
  const totalQty=Object.values(cart).reduce((s,q)=>s+q,0);
  const cartItems=(page?.items||[]).filter(it=>cart[it.product_id]>0);
  const subtotal=cartItems.reduce((s,it)=>s+(parseFloat(it.price)||0)*(cart[it.product_id]||0),0);
  const total=Math.max(0,subtotal+shippingPrice-couponDiscount);
  const pc=page?.accent_color||store?.primary_color||'#7C3AED';
  const anim=page?.animation_style||'slide-up';
  const heroStyle=page?.hero_style||'centered';
  const layoutStyle=page?.layout_style||'alternating';
  const showTrust=page?.show_trust_badges!==false;
  const showSocial=page?.show_social_proof!==false;
  const showCountdown=page?.show_countdown&&(page?.countdown_hours||page?.countdown_minutes);
  const allItems=page?.items||[];
  const currency=store?.currency||'DZD';

  // Auto-add first product for product-hero
  useEffect(()=>{
    if(layoutStyle==='product-hero'){
      const heroItem=allItems[0];
      if(heroItem&&!cart[heroItem.product_id])setCart(c=>({...c,[heroItem.product_id]:1}));
    }
  },[layoutStyle,page?.items]);

  const isValidPhone=(p)=>/^(0)(5|6|7)\d{8}$/.test((p||'').replace(/\s/g,''));

  // Coupon — mirrors store Checkout: per-product code, then store-wide code, then API.
  const validateCoupon=async()=>{
    if(!form.coupon_code)return;
    const code=String(form.coupon_code).trim().toUpperCase();
    let off=0;
    for(const it of cartItems){
      const pCode=(it.coupon_code||'').toString().trim().toUpperCase();
      const pPct=parseFloat(it.coupon_discount_percent)||0;
      if(it.coupon_active&&pCode&&pCode===code&&pPct>0){
        off+=((parseFloat(it.price)||0)*(cart[it.product_id]||1))*(pPct/100);
      }
    }
    if(off>0){setCouponDiscount(Math.round(off));toast.success(`-${Math.round(off).toLocaleString()} ${currency}`);return;}
    if(store?.store_coupon_active&&(store?.store_coupon_code||'').toString().trim().toUpperCase()===code){
      const pct=parseFloat(store.store_coupon_discount_percent)||0;
      if(pct>0){const o=Math.round(subtotal*(pct/100));setCouponDiscount(o);toast.success(`-${o.toLocaleString()} ${currency}`);return;}
    }
    try{const{data}=await storeApi.validateCoupon(storeSlug,{code,subtotal});setCouponDiscount(data.discount);toast.success(`-${data.discount.toLocaleString()} ${currency}`);}
    catch{toast.error(t('checkout.invalidCoupon','Invalid coupon'));setCouponDiscount(0);}
  };

  const handleReceiptUpload=(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{setReceiptImage(r.result);toast.success(t('checkout.receiptUploaded','Receipt uploaded!'));};
    r.readAsDataURL(f);
  };
  const submitReceipt=async()=>{
    if(!receiptImage)return toast.error(t('checkout.uploadBaridiReceipt','Please upload your receipt'));
    if(!orderSuccess?.id)return;
    try{
      await paymentApi.uploadReceipt({store_slug:storeSlug,order_id:orderSuccess.id,receipt_image:receiptImage,payment_method:form.payment_method,reference_number:receiptRef});
      toast.success(t('checkout.receiptSubmitted','Receipt submitted! Will be verified within 24 hours.'));
      setPaymentStep(null);
    }catch{toast.error(t('checkout.uploadFailed','Upload failed'));}
  };
  const copyToClipboard=(txt)=>{navigator.clipboard.writeText(txt);toast.success(t('storePage.copied','Copied!'));};

  const placeOrder=async()=>{
    if(!form.customer_name)return toast.error(t('checkout.errName','Please enter your name'));
    if(!isValidPhone(form.customer_phone))return toast.error(t('checkout.errPhoneAlg','Please enter a valid Algerian phone'));
    if(!form.shipping_wilaya)return toast.error(t('checkout.errWilaya','Please choose your wilaya'));
    if(!form.shipping_city)return toast.error(t('checkout.errCity','Please choose your commune'));
    if(!form.payment_method)return toast.error(t('checkout.errPay','Please choose a payment method'));
    if(!companiesLoaded)return toast.error(t('checkout.errDeliveryLoading','Loading delivery companies, please wait...'));
    if(companies.length>0&&!form.delivery_company_id)return toast.error(t('checkout.errDeliveryCompany','Please choose a delivery company'));
    if(!cartItems.length)return toast.error(t('lp.noItemsInCart','Add at least one product'));
    try{localStorage.setItem('checkout.savedInfo',JSON.stringify({customer_name:form.customer_name,customer_phone:form.customer_phone,customer_email:form.customer_email,shipping_wilaya:form.shipping_wilaya,shipping_city:form.shipping_city,shipping_address:form.shipping_address}));}catch{}
    setSubmitting(true);
    try{
      const authUser=useAuthStore.getState().user;
      const authRole=useAuthStore.getState().role;
      const customer_id=authRole==='customer'&&authUser?.id?authUser.id:undefined;
      const{data}=await storeApi.placeOrder(storeSlug,{
        ...form,customer_id,
        items:cartItems.map(it=>({product_id:it.product_id,quantity:cart[it.product_id]||1})),
        source:'landing_page',
        landing_page:page.slug,
      });
      setOrderSuccess(data);
      // Non-COD methods need the receipt-upload step, exactly like the store checkout.
      if(form.payment_method!=='cod')setPaymentStep(form.payment_method);
    }catch(err){toast.error(err.response?.data?.error||t('lp.orderFailed','Order failed'));}
    setSubmitting(false);
  };

  /* ─── Loading ─── */
  if(loading)return(
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-[3px] border-white/10 border-t-white/80 animate-spin"/>
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent border-b-white/30 animate-spin" style={{animationDirection:'reverse',animationDuration:'1.5s'}}/>
      </div>
    </div>
  );

  /* ─── Not Found ─── */
  if(notFound)return(
    <div className="min-h-screen flex flex-col items-center justify-center" style={{background:'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto backdrop-blur-sm">
          <Package size={36} className="text-white/30"/>
        </div>
        <p className="text-white/60 font-bold text-lg">{t('lp.pageNotFound','Page not found')}</p>
        <Link to={`/s/${storeSlug}`} className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">{t('lp.goToStore','Go to store')}</Link>
      </div>
    </div>
  );

  /* ─── Payment step (CCP / BaridiPay) — mirrors store checkout ─── */
  if(orderSuccess&&paymentStep)return(
    <div className="min-h-screen py-10 px-4" style={{background:`linear-gradient(135deg, ${page.hero_bg||'oklch(0.2 0.06 280)'}, oklch(0.1 0.01 280))`}}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-sm text-white/80">{t('checkout.completePayment','Complete Payment')}</span>
          <button onClick={()=>{setPaymentStep(null);}} className="text-white/50 hover:text-white"><X size={18}/></button>
        </div>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{backgroundColor:pc+'30'}}><CreditCard size={28} style={{color:'#fff'}}/></div>
          <h2 className="text-xl font-black text-white">{t('lp.orderPlaced','Order')} #{orderSuccess.order_number||orderSuccess.id}</h2>
          <p className="text-3xl font-black mt-2 text-white">{parseFloat(orderSuccess.total||total).toLocaleString()} {currency}</p>
        </div>
        {paymentStep==='ccp'&&(
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CreditCard size={20} className="text-amber-600"/></div><div><h3 className="font-bold text-gray-900">{t('checkout.ccpTransfer','CCP Transfer')}</h3><p className="text-xs text-gray-400">{t('checkout.ccpTransferDesc','Transfer to our CCP account')}</p></div></div>
            <div className="bg-amber-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t('checkout.ccpAccount','CCP Account')}</span><div className="flex items-center gap-2"><span className="font-mono font-bold text-lg">{store.ccp_account||'N/A'}</span><button onClick={()=>copyToClipboard(store.ccp_account||'')} className="p-1 hover:bg-amber-100 rounded"><Copy size={14}/></button></div></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t('checkout.accountName','Account Name')}</span><span className="font-bold">{store.ccp_name||'N/A'}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t('checkout.amount','Amount to Transfer')}</span><span className="font-black text-lg" style={{color:pc}}>{parseFloat(orderSuccess.subtotal||(orderSuccess.total-(orderSuccess.shipping_cost||0))||subtotal).toLocaleString()} {currency}</span></div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-700">{t('checkout.ccpUploadHint','After transferring, upload your CCP receipt below to confirm your payment.')}</p></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t('checkout.refNumberOptional','Reference Number (optional)')}</label><input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" value={receiptRef} onChange={e=>setReceiptRef(e.target.value)} placeholder={t('checkout.ccpRefPh','CCP transfer reference')}/></div>
            <div className="border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer transition-colors" onClick={()=>document.getElementById('lp-receipt-upload').click()}>
              {receiptImage?<div><img src={receiptImage} className="max-h-40 mx-auto rounded-lg mb-2" alt=""/><p className="text-xs text-emerald-600 font-bold">✓ {t('checkout.receiptUploaded','Receipt uploaded')}</p></div>:<div><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">{t('checkout.clickUploadReceipt','Click to upload receipt photo')}</p></div>}
            </div>
            <input id="lp-receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
            <button onClick={submitReceipt} className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{backgroundColor:pc}}>{t('checkout.submitReceipt','Submit Receipt')} <ArrowRight size={16}/></button>
          </div>
        )}
        {paymentStep==='baridimob'&&(
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Smartphone size={20} className="text-emerald-600"/></div><div><h3 className="font-bold text-gray-900">{t('checkout.baridiPayTitle','BaridiPay Payment')}</h3><p className="text-xs text-gray-400">{t('checkout.baridiPaySubtitle','Pay via BaridiPay app')}</p></div></div>
            <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t('checkout.ripNumber','RIP Number')}</span><div className="flex items-center gap-2"><span className="font-mono font-bold">{store.baridimob_rip||t('checkout.notAvailable','N/A')}</span><button onClick={()=>copyToClipboard(store.baridimob_rip||'')} className="p-1 hover:bg-emerald-100 rounded"><Copy size={14}/></button></div></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t('checkout.amount','Amount to Transfer')}</span><span className="font-black text-lg" style={{color:pc}}>{parseFloat(orderSuccess.subtotal||(orderSuccess.total-(orderSuccess.shipping_cost||0))||subtotal).toLocaleString()} {currency}</span></div>
            </div>
            {store.baridimob_qr&&<div className="text-center p-4 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('checkout.scanToPay','Scan to Pay')}</p><img src={store.baridimob_qr} className="max-w-[200px] mx-auto rounded-xl border" alt="BaridiPay QR"/></div>}
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">{t('checkout.txnRef','Transaction Reference')}</label><input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" value={receiptRef} onChange={e=>setReceiptRef(e.target.value)} placeholder={t('checkout.baridiTxnPh','BaridiPay transaction ID')}/></div>
            <div className="border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl p-6 text-center cursor-pointer transition-colors" onClick={()=>document.getElementById('lp-receipt-upload').click()}>
              {receiptImage?<div><img src={receiptImage} className="max-h-40 mx-auto rounded-lg mb-2" alt=""/><p className="text-xs text-emerald-600 font-bold">✓ {t('checkout.receiptUploaded','Receipt uploaded')}</p></div>:<div><Upload size={24} className="mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-500">{t('checkout.uploadBaridiReceipt','Upload your BaridiPay receipt')}</p></div>}
            </div>
            <input id="lp-receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
            <button onClick={submitReceipt} className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{backgroundColor:pc}}>{t('checkout.submitReceipt','Submit Receipt')} <ArrowRight size={16}/></button>
          </div>
        )}
        <button onClick={()=>{setPaymentStep(null);}} className="w-full mt-4 py-3 rounded-xl font-bold text-sm bg-white/10 text-white/70 hover:bg-white/20">{t('checkout.payLater','Pay later / Skip')}</button>
      </div>
    </div>
  );

  /* ─── Order Success ─── */
  if(orderSuccess)return(
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background:`linear-gradient(135deg, ${page.hero_bg||'oklch(0.35 0.15 280)'}, oklch(0.15 0.01 280))`}}>
      <MeshGradient color1={pc} color2={page.hero_bg||'#7C3AED'} color3="#10B981" opacity={0.2}/>
      <Reveal animation="zoom" className="relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center" style={{border:'1px solid rgba(255,255,255,0.2)'}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{backgroundColor:'#10B981',boxShadow:'0 8px 30px rgba(16,185,129,0.3)'}}>
            <Check size={28} className="text-white"/>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">{t('lp.orderSuccess','Order Placed Successfully!')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{t('lp.orderSuccessDesc','Thank you for your order. We will contact you shortly to confirm.')}</p>
          <div className="rounded-2xl p-5 space-y-3" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
            <div className="flex justify-between text-sm"><span className="text-gray-400">{t('lp.orderNumber','Order')}</span><span className="font-mono font-bold text-gray-900">#{orderSuccess.order_number||orderSuccess.id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">{t('lp.orderTotal','Total')}</span><span className="font-bold" style={{color:pc}}>{total.toLocaleString()} {currency}</span></div>
          </div>
          <button onClick={()=>{setOrderSuccess(null);setCart({});window.scrollTo({top:0,behavior:'smooth'});}} className="inline-block mt-7 px-7 py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-[0.97] shadow-xl cursor-pointer" style={{backgroundColor:pc}}>{t('lp.continueShopping','Continue Shopping')}</button>
        </div>
      </Reveal>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     HERO SECTIONS — with product imagery backgrounds
     ═══════════════════════════════════════════════════════════ */

  const renderHero=()=>{
    const heroBg=page.hero_bg||'oklch(0.15 0.04 280)';
    const heroText=page.hero_text||'#FFFFFF';
    const ctaBg=page.cta_bg||'#10B981';
    const ctaText=page.cta_text_color||'#FFF';

    const aiImg=page.ai_hero_image;

    if(heroStyle==='split'){
      return(
        <section className="relative overflow-hidden min-h-[70vh] flex items-center" style={{backgroundColor:heroBg}}>
          {aiImg?<img src={aiImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
            :<ProductImageMosaic items={allItems} overlay={`linear-gradient(135deg, ${heroBg}ee 0%, ${heroBg}99 50%, transparent 100%)`}/>}
          <MeshGradient color1={pc} color2={heroBg} opacity={0.12}/>
          <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24 w-full">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <Reveal animation={anim} className="flex-1 space-y-6">
                <div>
                  {showCountdown&&<div className="mb-4"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={ctaBg}/></div>}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
                  {page.hero_subtitle&&<p className="mt-4 text-base sm:text-lg opacity-75 leading-relaxed max-w-lg" style={{color:heroText}}>{page.hero_subtitle}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={scrollToCheckout} className="px-8 py-4 rounded-2xl font-black text-sm inline-flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.96] shadow-xl" style={{backgroundColor:ctaBg,color:ctaText,boxShadow:`0 8px 30px ${ctaBg}50`}}>
                    <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
                  </button>
                  <button onClick={scrollToCheckout} className="px-5 py-4 rounded-2xl font-semibold text-sm transition-all hover:bg-white/10 flex items-center gap-1.5 backdrop-blur-sm" style={{color:heroText,border:`1px solid ${heroText}30`}}>
                    <ArrowDown size={14}/>{t('lp.seeProducts','See Products')}
                  </button>
                </div>
                <ProductStrip items={allItems} accent={pc}/>
              </Reveal>
              {allItems.length>0&&(
                <Reveal animation={anim} delay={200} className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <div className="absolute -inset-6 rounded-[2rem] blur-3xl" style={{backgroundColor:pc,opacity:0.25}}/>
                    <div className="relative grid grid-cols-2 gap-3">
                      {allItems.slice(0,4).map((it,i)=>(
                        <div key={i} className={`rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 ${i===0?'col-span-2 aspect-[16/10]':'aspect-square'}`}>
                          {(it.custom_image||it.image)?<img src={it.custom_image||it.image} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center bg-white/5"><Package size={32} className="text-white/20"/></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      );
    }

    if(heroStyle==='minimal'){
      return(
        <section className="relative overflow-hidden" style={{backgroundColor:heroBg}}>
          {aiImg&&<img src={aiImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20"/>}
          <MeshGradient color1={pc} color2={heroBg} color3={ctaBg} opacity={0.1}/>
          <div className="relative max-w-3xl mx-auto px-5 py-24 sm:py-36 text-center">
            <Reveal animation={anim}>
              {showCountdown&&<div className="mb-6 flex justify-center"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={ctaBg}/></div>}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
              {page.hero_subtitle&&<p className="mt-5 text-base sm:text-lg opacity-60 max-w-xl mx-auto leading-relaxed" style={{color:heroText}}>{page.hero_subtitle}</p>}
              <button onClick={scrollToCheckout} className="mt-8 px-9 py-4 rounded-2xl font-black text-base inline-flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.96] shadow-xl" style={{backgroundColor:ctaBg,color:ctaText,boxShadow:`0 8px 30px ${ctaBg}50`}}>
                <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
              </button>
              <ProductStrip items={allItems} accent={pc}/>
            </Reveal>
          </div>
        </section>
      );
    }

    /* centered (default) — immersive with product image mosaic */
    return(
      <section className="relative overflow-hidden min-h-[75vh] flex items-center" style={{backgroundColor:heroBg}}>
        {aiImg?<><img src={aiImg} alt="" className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0" style={{background:`linear-gradient(180deg, ${heroBg}bb 0%, ${heroBg}e0 50%, ${heroBg} 100%)`}}/></>
          :<ProductImageMosaic items={allItems} overlay={`linear-gradient(180deg, ${heroBg}dd 0%, ${heroBg}f0 40%, ${heroBg} 100%)`}/>}
        <MeshGradient color1={pc} color2={heroBg} color3={ctaBg} opacity={0.15}/>
        <div className="relative max-w-4xl mx-auto px-5 py-16 sm:py-28 text-center w-full">
          <Reveal animation={anim}>
            {store?.logo&&<img src={store.logo} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-6 shadow-xl ring-2 ring-white/10"/>}
            {showCountdown&&<div className="mb-6 flex justify-center"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={ctaBg}/></div>}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
            {page.hero_subtitle&&<p className="mt-5 text-base sm:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed" style={{color:heroText}}>{page.hero_subtitle}</p>}
            <button onClick={scrollToCheckout} className="mt-9 px-10 py-4 rounded-2xl font-black text-base shadow-2xl transition-all hover:brightness-110 active:scale-[0.96] inline-flex items-center gap-2" style={{backgroundColor:ctaBg,color:ctaText,boxShadow:`0 10px 40px ${ctaBg}60`}}>
              <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
            </button>
            <ProductStrip items={allItems} accent={pc}/>
            {showTrust&&<div className="mt-12"><TrustBadges accent={ctaBg} textColor={heroText} variant="dark"/></div>}
          </Reveal>
        </div>
      </section>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     PRODUCT CARD — shared per-product renderer
     ═══════════════════════════════════════════════════════════ */
  const ProductCard=({item,idx,layout})=>{
    const qty=cart[item.product_id]||0;
    const hasImage=item.custom_image||item.image;
    const bgColor=page.bg_color||'#FAFAFA';
    const textColor=page.text_color||'#1F2937';

    /* ── Alternating ── */
    if(layout==='alternating'){
      const isEven=idx%2===0;
      return(
        <section key={item.product_id} className="relative overflow-hidden" style={{backgroundColor:isEven?bgColor:'oklch(0.97 0.005 280)'}}>
          {hasImage&&<div className="absolute inset-0 opacity-[0.03]"><img src={hasImage} alt="" className="w-full h-full object-cover" style={{filter:'blur(60px) saturate(2)'}}/></div>}
          <div className="relative max-w-5xl mx-auto px-5 py-16 sm:py-24">
            <Reveal animation={anim} delay={100}>
              <div className={`flex flex-col ${isEven?'md:flex-row':'md:flex-row-reverse'} gap-8 md:gap-14 items-center`}>
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20 transition-opacity group-hover:opacity-30" style={{backgroundColor:pc}}/>
                    <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                    <div className="relative max-w-lg mx-auto"><ProductGallery item={item} accent={pc} imgClass="rounded-3xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.03] ring-1 ring-black/5"/></div>
                  </div>
                </div>
                <div className="flex-1 space-y-5">
                  {item.headline&&<p className="text-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block" style={{backgroundColor:pc+'12',color:pc}}>{item.headline}</p>}
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{color:textColor}}>{item.name}</h2>
                  {item.description&&<p className="text-sm leading-relaxed opacity-60" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&(
                    <ul className="space-y-2.5">
                      {item.features.filter(f=>f.trim()).map((f,i)=>(
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <div className="w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 shadow-sm" style={{backgroundColor:pc+'18'}}><Check size={12} style={{color:pc}}/></div>
                          <span style={{color:textColor}}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc}/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Stacked ── */
    if(layout==='stacked'){
      return(
        <section key={item.product_id} className="relative overflow-hidden" style={{backgroundColor:idx%2===0?bgColor:'oklch(0.97 0.005 280)'}}>
          {hasImage&&<div className="absolute inset-0 opacity-[0.04]"><img src={hasImage} alt="" className="w-full h-full object-cover" style={{filter:'blur(50px) saturate(1.5)'}}/></div>}
          <div className="relative max-w-3xl mx-auto px-5 py-16 sm:py-24">
            <Reveal animation={anim} delay={80}>
              <div className="space-y-6">
                <div className="relative group">
                  <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                  <ProductGallery item={item} accent={pc} aspect="aspect-[16/9]" imgClass="rounded-3xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"/>
                </div>
                <div className="space-y-4">
                  {item.headline&&<p className="text-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block" style={{backgroundColor:pc+'12',color:pc}}>{item.headline}</p>}
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{color:textColor}}>{item.name}</h2>
                  {item.description&&<p className="text-sm leading-relaxed opacity-60 max-w-2xl" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&(
                    <div className="flex flex-wrap gap-2">{item.features.filter(f=>f.trim()).map((f,i)=>(
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm" style={{backgroundColor:pc+'10',color:pc,border:`1px solid ${pc}20`}}><Check size={11}/>{f}</span>
                    ))}</div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc}/>
                    <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Showcase ── */
    if(layout==='showcase'){
      return(
        <section key={item.product_id} className="relative overflow-hidden min-h-[80vh] flex items-center" style={{backgroundColor:'oklch(0.08 0.015 280)'}}>
          {hasImage&&<div className="absolute inset-0"><img src={hasImage} alt="" className="w-full h-full object-cover opacity-25 scale-105" style={{filter:'blur(3px) saturate(0.5)'}}/><div className="absolute inset-0" style={{background:'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)'}}/></div>}
          <MeshGradient color1={pc} color2="#000" opacity={0.08}/>
          <div className="relative max-w-4xl mx-auto px-5 py-20 sm:py-32 text-center w-full">
            <Reveal animation={anim} delay={100}>
              <div className="space-y-6">
                {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">{item.headline}</p>}
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">{item.name}</h2>
                {item.description&&<p className="text-base text-white/50 leading-relaxed max-w-xl mx-auto">{item.description}</p>}
                {hasImage&&(
                  <div className="relative max-w-sm mx-auto mt-6">
                    <div className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-30" style={{backgroundColor:pc}}/>
                    <div className="relative"><ProductGallery item={item} accent={pc} imgClass="rounded-3xl shadow-2xl ring-1 ring-white/10"/></div>
                  </div>
                )}
                {item.features?.length>0&&(
                  <div className="flex flex-wrap justify-center gap-2 pt-2">{item.features.filter(f=>f.trim()).map((f,i)=>(
                    <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white/80 backdrop-blur-md" style={{backgroundColor:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)'}}><Check size={11}/>{f}</span>
                  ))}</div>
                )}
                <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="xl" variant="dark"/>
                <div className="flex items-center justify-center">
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} variant="dark" t={t}/>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Cinematic ── */
    if(layout==='cinematic'){
      return(
        <section key={item.product_id} className="relative min-h-[85vh] flex items-center overflow-hidden" style={{backgroundColor:'oklch(0.06 0.015 280)'}}>
          {hasImage&&<div className="absolute inset-0"><img src={hasImage} alt="" className="w-full h-full object-cover opacity-30 scale-110" style={{filter:'blur(2px) saturate(0.5)'}}/><div className="absolute inset-0" style={{background:`linear-gradient(135deg, oklch(0.04 0.02 280) 0%, transparent 50%), linear-gradient(to top, oklch(0.04 0.01 280) 0%, transparent 60%)`}}/></div>}
          <MeshGradient color1={pc} color2="#1a0030" opacity={0.1}/>
          <div className="relative max-w-6xl mx-auto px-5 py-20 w-full">
            <Reveal animation={anim} delay={150}>
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.3em] text-white/25">{item.headline}</p>}
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">{item.name}</h2>
                  {item.description&&<p className="text-base text-white/45 leading-relaxed max-w-lg">{item.description}</p>}
                  {item.features?.length>0&&<div className="flex flex-wrap gap-3 pt-2">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 backdrop-blur-sm" style={{border:'1px solid rgba(255,255,255,0.08)',backgroundColor:'rgba(255,255,255,0.04)'}}>{f}</span>)}</div>}
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="xl" variant="dark"/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} variant="dark" t={t}/>
                </div>
                {hasImage&&<div className="flex-1 max-w-lg"><div className="relative"><div className="absolute -inset-8 rounded-[2rem] blur-[60px] opacity-25" style={{backgroundColor:pc}}/><div className="relative"><ProductGallery item={item} accent={pc} imgClass="rounded-3xl shadow-2xl ring-1 ring-white/10"/></div></div></div>}
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Magazine ── */
    if(layout==='magazine'){
      const isHero=idx===0;
      if(isHero)return(
        <section key={item.product_id} className="relative overflow-hidden" style={{backgroundColor:bgColor}}>
          {hasImage&&<div className="absolute inset-0 opacity-[0.03]"><img src={hasImage} alt="" className="w-full h-full object-cover" style={{filter:'blur(50px) saturate(2)'}}/></div>}
          <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <Reveal animation={anim}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 relative group">
                  <div className="absolute -inset-3 rounded-[2rem] blur-2xl opacity-15" style={{backgroundColor:pc}}/>
                  <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                  <div className="relative"><ProductGallery item={item} accent={pc} aspect="aspect-[4/3]" imgClass="rounded-3xl shadow-2xl ring-1 ring-black/5"/></div>
                </div>
                <div className="lg:col-span-2 flex flex-col justify-center space-y-5">
                  {item.headline&&<p className="text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block w-fit" style={{backgroundColor:pc+'15',color:pc}}>{item.headline}</p>}
                  <h2 className="text-3xl sm:text-4xl font-black leading-[1.08] tracking-tight" style={{color:textColor}}>{item.name}</h2>
                  {item.description&&<p className="text-sm leading-relaxed opacity-55" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&<ul className="space-y-2">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className="flex items-center gap-2.5 text-sm"><Check size={14} style={{color:pc}}/><span style={{color:textColor}}>{f}</span></li>)}</ul>}
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="lg"/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
      return(
        <section key={item.product_id} style={{backgroundColor:idx%2===0?bgColor:'oklch(0.97 0.005 280)'}}>
          <div className="max-w-6xl mx-auto px-5 py-8">
            <Reveal animation={anim} delay={idx*60}>
              <div className="flex flex-col sm:flex-row gap-5 items-center p-5 rounded-3xl hover:shadow-xl transition-all duration-300 group" style={{backgroundColor:'white',border:'1px solid oklch(0.93 0.005 280)'}}>
                <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg ring-1 ring-black/5">
                  {hasImage?<img src={hasImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>:<div className="w-full h-full flex items-center justify-center" style={{backgroundColor:'oklch(0.95 0.005 280)'}}><Package size={28} className="opacity-20"/></div>}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold" style={{color:textColor}}>{item.name}</h3>
                  {item.description&&<p className="text-xs opacity-50 line-clamp-2" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&<div className="flex flex-wrap gap-1.5">{item.features.filter(f=>f.trim()).slice(0,3).map((f,i)=><span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:pc+'12',color:pc}}>{f}</span>)}</div>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="md"/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Timeline ── */
    if(layout==='timeline'){
      const isEven=idx%2===0;
      return(
        <section key={item.product_id} className="relative" style={{backgroundColor:bgColor}}>
          {hasImage&&<div className="absolute inset-0 opacity-[0.02]"><img src={hasImage} alt="" className="w-full h-full object-cover" style={{filter:'blur(40px)'}}/></div>}
          <div className="relative max-w-5xl mx-auto px-5">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 hidden md:block" style={{background:`linear-gradient(to bottom, transparent, ${pc}40, transparent)`}}/>
            <Reveal animation={anim} delay={idx*100}>
              <div className={`flex flex-col md:flex-row items-center gap-8 py-14 ${isEven?'':'md:flex-row-reverse'}`}>
                <div className={`flex-1 ${isEven?'md:text-right md:pr-12':'md:text-left md:pl-12'}`}>
                  <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm" style={{backgroundColor:pc+'12',color:pc,border:`1px solid ${pc}20`}}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-md" style={{backgroundColor:pc}}>{idx+1}</span>
                    {item.headline||`Step ${idx+1}`}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-2" style={{color:textColor}}>{item.name}</h3>
                  {item.description&&<p className="text-sm opacity-55 mb-4 max-w-md" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&<ul className="space-y-1.5 mb-4">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className={`text-xs flex items-center gap-2 ${isEven?'md:justify-end':''}`}><Check size={12} style={{color:pc}}/><span style={{color:textColor}}>{f}</span></li>)}</ul>}
                  <div className={`flex items-center gap-3 ${isEven?'md:justify-end':''}`}>
                    <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="md"/>
                  </div>
                  <div className={`flex items-center gap-3 mt-3 ${isEven?'md:justify-end':''}`}>
                    <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                  </div>
                </div>
                <div className="hidden md:flex w-5 h-5 rounded-full shrink-0 z-10 shadow-lg" style={{backgroundColor:pc,border:`3px solid ${bgColor}`}}/>
                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute -inset-3 rounded-3xl blur-xl opacity-15 transition-opacity group-hover:opacity-25" style={{backgroundColor:pc}}/>
                    {hasImage?<img src={hasImage} alt={item.name} className="relative w-full max-w-sm mx-auto rounded-3xl shadow-2xl object-cover aspect-square ring-1 ring-black/5"/>:<div className="w-full max-w-sm mx-auto aspect-square rounded-3xl flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={48} className="opacity-20"/></div>}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    /* ── Minimal Zen ── */
    if(layout==='minimal-zen'){
      return(
        <section key={item.product_id} style={{backgroundColor:bgColor}}>
          <div className="max-w-2xl mx-auto px-5 py-24 sm:py-36 text-center">
            <Reveal animation="fade" delay={100}>
              <div className="space-y-8">
                {hasImage&&(
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 rounded-full blur-2xl opacity-15" style={{backgroundColor:pc}}/>
                    <img src={hasImage} alt={item.name} className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full mx-auto object-cover shadow-2xl ring-4" style={{ringColor:pc+'25'}}/>
                  </div>
                )}
                <div className="space-y-4">
                  {item.headline&&<p className="text-[10px] font-bold uppercase tracking-[0.35em] opacity-35" style={{color:textColor}}>{item.headline}</p>}
                  <h2 className="text-3xl sm:text-4xl font-extralight tracking-wide" style={{color:textColor}}>{item.name}</h2>
                  <div className="w-12 h-0.5 mx-auto rounded-full" style={{backgroundColor:pc}}/>
                  {item.description&&<p className="text-sm leading-loose opacity-45 max-w-md mx-auto" style={{color:textColor}}>{item.description}</p>}
                </div>
                {item.features?.length>0&&<div className="flex flex-wrap justify-center gap-4">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="text-xs font-light tracking-wider opacity-50" style={{color:textColor}}>— {f}</span>)}</div>}
                <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="lg"/>
                <div className="flex justify-center"><QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/></div>
              </div>
            </Reveal>
          </div>
          {idx<allItems.length-1&&<div className="max-w-xs mx-auto h-px" style={{backgroundColor:pc+'15'}}/>}
        </section>
      );
    }

    /* ── Split Screen ── */
    if(layout==='split-screen'){
      const isEven=idx%2===0;
      return(
        <section key={item.product_id} className="relative min-h-[70vh] flex">
          <div className={`flex flex-col md:flex-row w-full ${isEven?'':'md:flex-row-reverse'}`}>
            <div className="flex-1 relative overflow-hidden" style={{backgroundColor:'oklch(0.1 0.02 280)'}}>
              {hasImage?<img src={hasImage} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"/>:<div className="absolute inset-0 flex items-center justify-center" style={{backgroundColor:'oklch(0.15 0.01 280)'}}><Package size={64} className="text-white/10"/></div>}
              <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden"/>
            </div>
            <div className="flex-1 flex items-center relative" style={{backgroundColor:bgColor}}>
              {hasImage&&<div className="absolute inset-0 opacity-[0.03]"><img src={hasImage} alt="" className="w-full h-full object-cover" style={{filter:'blur(40px) saturate(2)'}}/></div>}
              <Reveal animation={anim} delay={100}>
                <div className="relative p-10 sm:p-16 space-y-6 max-w-xl">
                  {item.headline&&<p className="text-xs font-black uppercase tracking-[0.2em]" style={{color:pc}}>{item.headline}</p>}
                  <h2 className="text-3xl sm:text-4xl font-black leading-[1.08] tracking-tight" style={{color:textColor}}>{item.name}</h2>
                  {item.description&&<p className="text-sm leading-relaxed opacity-50" style={{color:textColor}}>{item.description}</p>}
                  {item.features?.length>0&&<ul className="space-y-2">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className="flex items-center gap-2.5 text-sm"><div className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor:pc}}/><span style={{color:textColor}}>{f}</span></li>)}</ul>}
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="lg"/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      );
    }

    /* ── Storytelling ── */
    if(layout==='storytelling'){
      const chapterNum=String(idx+1).padStart(2,'0');
      return(
        <section key={item.product_id}>
          {hasImage&&(
            <div className="relative h-[55vh] overflow-hidden">
              <img src={hasImage} alt={item.name} className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0" style={{background:`linear-gradient(to bottom, transparent 30%, ${bgColor} 100%)`}}/>
              <div className="absolute top-8 left-8"><span className="text-7xl font-black text-white/8">{chapterNum}</span></div>
            </div>
          )}
          <div className="max-w-2xl mx-auto px-5 -mt-24 relative z-10 pb-16">
            <Reveal animation={anim} delay={100}>
              <div className="rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5 backdrop-blur-sm" style={{backgroundColor:'rgba(255,255,255,0.95)',border:'1px solid rgba(0,0,0,0.05)'}}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-25" style={{color:textColor}}>Chapter {chapterNum}</span>
                  <div className="flex-1 h-px" style={{background:`linear-gradient(to right, ${pc}30, transparent)`}}/>
                </div>
                {item.headline&&<p className="text-sm font-bold" style={{color:pc}}>{item.headline}</p>}
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{color:textColor}}>{item.name}</h2>
                {item.description&&<p className="text-sm leading-relaxed opacity-55" style={{color:textColor}}>{item.description}</p>}
                {item.features?.length>0&&<div className="space-y-2 py-2 border-l-2 pl-4" style={{borderColor:pc+'30'}}>{item.features.filter(f=>f.trim()).map((f,i)=><p key={i} className="text-sm" style={{color:textColor}}>{f}</p>)}</div>}
                <div className="flex items-center justify-between pt-4 border-t" style={{borderColor:'oklch(0.93 0.005 280)'}}>
                  <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="md"/>
                  <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }

    return null;
  };

  /* ── Bento Grid ── all products at once */
  const renderBentoAll=()=>{
    if(!allItems.length)return null;
    const getBentoClass=(idx,total)=>{
      if(total===1)return'col-span-2 row-span-2';
      if(total===2)return'col-span-1 row-span-2';
      if(idx===0)return'col-span-2 row-span-2';
      if(idx===1&&total>3)return'col-span-1 row-span-2';
      return'col-span-1 row-span-1';
    };
    return(
      <section className="relative overflow-hidden" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <MeshGradient color1={pc} color2={page.bg_color||'#FAFAFA'} opacity={0.06}/>
        <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24">
          <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[220px] sm:auto-rows-[300px] gap-4">
            {allItems.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              const isLarge=idx===0;
              const hasImage=item.custom_image||item.image;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*80} className={getBentoClass(idx,allItems.length)}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden group cursor-pointer shadow-xl" style={{backgroundColor:'oklch(0.12 0.015 280)'}}>
                    {hasImage&&<img src={hasImage} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5"/>
                    <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 space-y-2">
                      {item.headline&&isLarge&&<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{item.headline}</p>}
                      <h3 className={`font-black text-white leading-tight ${isLarge?'text-2xl sm:text-3xl':'text-base sm:text-lg'}`}>{item.name}</h3>
                      {isLarge&&item.description&&<p className="text-xs text-white/50 line-clamp-2 max-w-md">{item.description}</p>}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className={`font-black text-white ${isLarge?'text-2xl':'text-lg'}`}>{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-40">{currency}</span></span>
                        <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} variant="dark" t={t}/>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  /* ── Cards Gallery ── all products at once */
  const renderCardsAll=()=>{
    return(
      <section className="relative overflow-hidden" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <MeshGradient color1={pc} color2={page.bg_color||'#FAFAFA'} opacity={0.05}/>
        <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allItems.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              const hasImage=item.custom_image||item.image;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*80}>
                  <div className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group" style={{backgroundColor:'white',border:'1px solid rgba(0,0,0,0.05)'}}>
                    <div className="relative overflow-hidden aspect-[4/5]">
                      {hasImage?<img src={hasImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>:<div className="w-full h-full flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={48} className="opacity-20"/></div>}
                      <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent"/>
                      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                        <span className="text-2xl font-black text-white">{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-50">{currency}</span></span>
                        {item.compare_price&&<span className="text-sm text-white/40 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {item.headline&&<p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{color:pc}}>{item.headline}</p>}
                      <h3 className="text-lg font-black tracking-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                      {item.description&&<p className="text-xs opacity-45 line-clamp-2" style={{color:page.text_color}}>{item.description}</p>}
                      {item.features?.length>0&&<div className="space-y-1">{item.features.filter(f=>f.trim()).slice(0,3).map((f,i)=><div key={i} className="flex items-center gap-1.5 text-xs"><Check size={10} style={{color:pc}}/><span style={{color:page.text_color}}>{f}</span></div>)}</div>}
                      <div className="pt-2"><QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/></div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  /* ── Mosaic ── all products at once */
  const renderMosaicAll=()=>{
    return(
      <section className="relative overflow-hidden" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <MeshGradient color1={pc} color2={page.bg_color||'#FAFAFA'} opacity={0.04}/>
        <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {allItems.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              const isWide=idx%3===0;
              const hasImage=item.custom_image||item.image;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*60} className={isWide?'sm:col-span-2':''}>
                  <div className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group" style={{backgroundColor:'white',border:'1px solid rgba(0,0,0,0.05)'}}>
                    <div className={`flex ${isWide?'flex-col sm:flex-row':'flex-col'}`}>
                      <div className={`relative overflow-hidden ${isWide?'sm:w-2/5':''}`}>
                        {hasImage?<img src={hasImage} alt={item.name} className={`w-full object-cover ${isWide?'h-64 sm:h-full':'aspect-[3/2]'} transition-transform duration-700 group-hover:scale-105`}/>:<div className={`w-full flex items-center justify-center ${isWide?'h-64 sm:h-full':'aspect-[3/2]'}`} style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={36} className="opacity-20"/></div>}
                        <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                      </div>
                      <div className="flex-1 p-6 space-y-3">
                        {item.headline&&<p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{color:pc}}>{item.headline}</p>}
                        <h3 className={`font-black tracking-tight ${isWide?'text-2xl':'text-lg'}`} style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                        {item.description&&<p className="text-xs opacity-45 line-clamp-2" style={{color:page.text_color}}>{item.description}</p>}
                        {isWide&&item.features?.length>0&&<div className="flex flex-wrap gap-1.5">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{backgroundColor:pc+'10',color:pc,border:`1px solid ${pc}15`}}>{f}</span>)}</div>}
                        <div className="flex items-center justify-between pt-2">
                          <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="md"/>
                          <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  /* ── Per-product dispatcher (called as function, NOT as <Component/>, to avoid remount on re-render) ── */
  const renderProduct=(item,idx)=>ProductCard({item,idx,layout:layoutStyle});

  const renderAllProducts=()=>{
    if(layoutStyle==='bento')return renderBentoAll();
    if(layoutStyle==='cards')return renderCardsAll();
    if(layoutStyle==='mosaic')return renderMosaicAll();
    if(layoutStyle==='product-hero')return null;
    return allItems.map((item,idx)=>renderProduct(item,idx));
  };

  /* ═══════════════════════════════════════════════════════════
     PRODUCT-HERO — Multi-product conversion layout
     All products showcased equally with inline order form
     ═══════════════════════════════════════════════════════════ */
  const renderProductHeroAll=()=>{
    if(!allItems.length)return null;
    const heroBg=page.hero_bg||'#0f172a';
    const ctaBg=page.cta_bg||'#10B981';
    const ctaTextColor=page.cta_text_color||'#FFF';
    const bgColor=page.bg_color||'#f8f9fa';
    const textColor=page.text_color||'#1F2937';

    return(
      <>
        {/* ── TRUST BAR ── */}
        <div className="w-full py-3.5 px-4" style={{backgroundColor:bgColor,borderBottom:'1px solid oklch(0.92 0.005 280)'}}>
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-6 flex-wrap">
            {[
              {icon:<Truck size={14}/>,label:t('lp.fastDelivery','Fast Delivery')},
              {icon:<CreditCard size={14}/>,label:t('lp.codShort','Cash on Delivery')},
              {icon:<Shield size={14}/>,label:t('lp.qualityGuarantee','Quality Guarantee')},
            ].map((b,i)=>(
              <div key={i} className="flex items-center gap-2 text-xs font-bold" style={{color:textColor}}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm" style={{backgroundColor:pc+'12',color:pc}}>{b.icon}</div>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── SOCIAL PROOF BAR ── */}
        {page.show_social_proof!==false&&(
          <div className="w-full py-3 flex items-center justify-center gap-4" style={{backgroundColor:bgColor}}>
            <div className="flex -space-x-1.5">
              {[...Array(3)].map((_,i)=><div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{backgroundColor:pc,filter:`hue-rotate(${i*40}deg)`}}>{['A','M','S'][i]}</div>)}
            </div>
            {page.show_reviews!==false&&(
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} size={12} fill="#FBBF24" color="#FBBF24"/>)}</div>
                <span className="text-xs font-semibold opacity-50" style={{color:textColor}}>{t('lp.topRated','Top Rated')}</span>
              </div>
            )}
          </div>
        )}

        {/* ── HERO SECTION — product image mosaic background ── */}
        <section className="relative overflow-hidden" style={{backgroundColor:heroBg}}>
          {page.ai_hero_image?<><img src={page.ai_hero_image} alt="" className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0" style={{background:`linear-gradient(180deg, ${heroBg}cc 0%, ${heroBg}f0 50%, ${heroBg} 100%)`}}/></>
            :<ProductImageMosaic items={allItems} overlay={`linear-gradient(180deg, ${heroBg}e0 0%, ${heroBg}f5 50%, ${heroBg} 100%)`}/>}
          <MeshGradient color1={pc} color2={heroBg} color3={ctaBg} opacity={0.12}/>
          <div className="relative max-w-2xl mx-auto px-5 py-14 text-center">
            <Reveal animation={anim}>
              {showCountdown&&<div className="mb-5 flex justify-center"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={ctaBg}/></div>}
              <h1 className="text-3xl sm:text-4xl font-black leading-[1.08] tracking-tight mb-3" style={{color:page.hero_text||'#FFF'}}>{page.hero_title||store?.name}</h1>
              {page.hero_subtitle&&<p className="text-sm opacity-60 mb-6 max-w-md mx-auto" style={{color:page.hero_text||'#FFF'}}>{page.hero_subtitle}</p>}
              <button onClick={scrollToCheckout} className="px-10 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-[0.96] transition-all mx-auto" style={{backgroundColor:ctaBg,color:ctaTextColor,boxShadow:`0 10px 40px ${ctaBg}60`}}>
                <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
              </button>
            </Reveal>
          </div>
        </section>

        {/* ── ALL PRODUCTS GRID ── */}
        <section className="relative overflow-hidden" style={{backgroundColor:bgColor}}>
          <MeshGradient color1={pc} color2={bgColor} opacity={0.04}/>
          <div className="relative max-w-2xl mx-auto px-5 py-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-center mb-6 opacity-35" style={{color:textColor}}>{t('lp.ourProducts','Our Products')}</p>
            <div className="space-y-4">
              {allItems.map((item,idx)=>{
                const qty=cart[item.product_id]||0;
                const hasImage=item.custom_image||item.image;
                const isFirst=idx===0;
                return(
                  <Reveal key={item.product_id} animation={anim} delay={idx*80}>
                    {isFirst?(
                      /* First product — large featured card */
                      <div className="rounded-3xl overflow-hidden shadow-2xl" style={{backgroundColor:'white',border:'1px solid rgba(0,0,0,0.05)'}}>
                        <div className="relative aspect-[16/10] overflow-hidden group">
                          {hasImage?<img src={hasImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>:<div className="w-full h-full flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={56} className="opacity-20"/></div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                          <DiscountBadge price={item.price} comparePrice={item.compare_price} accent={pc}/>
                          <div className="absolute bottom-4 left-5 right-5">
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.name}</h3>
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          {item.description&&<p className="text-xs opacity-50 line-clamp-2" style={{color:textColor}}>{item.description}</p>}
                          {item.features?.length>0&&(
                            <div className="flex flex-wrap gap-2">{item.features.filter(f=>f.trim()).slice(0,4).map((f,i)=>(
                              <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{backgroundColor:pc+'10',color:pc,border:`1px solid ${pc}15`}}><Check size={10}/>{f}</span>
                            ))}</div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <PriceTag price={item.price} comparePrice={item.compare_price} currency={currency} accent={pc} size="lg"/>
                            <QtyControl qty={qty} onMinus={()=>setQty(item.product_id,-1)} onPlus={()=>setQty(item.product_id,1)} onAdd={()=>setQty(item.product_id,1)} accent={pc} t={t}/>
                          </div>
                        </div>
                      </div>
                    ):(
                      /* Other products — compact cards */
                      <div className="flex items-center gap-4 p-4 rounded-2xl shadow-lg transition-all hover:shadow-xl group" style={{backgroundColor:'white',border:'1px solid rgba(0,0,0,0.05)'}}>
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-md ring-1 ring-black/5">
                          {hasImage?<img src={hasImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>:<div className="w-full h-full flex items-center justify-center" style={{backgroundColor:'oklch(0.95 0.005 280)'}}><Package size={20} className="opacity-20"/></div>}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-sm font-bold truncate" style={{color:textColor}}>{item.name}</h3>
                          {item.description&&<p className="text-[11px] opacity-40 line-clamp-1" style={{color:textColor}}>{item.description}</p>}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-lg font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-[10px] opacity-50">{currency}</span></span>
                            {item.compare_price&&parseFloat(item.compare_price)>0&&<span className="text-xs text-gray-400 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {qty>0?(
                            <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.9 0.005 280)'}}>
                              <button onClick={()=>setQty(item.product_id,-1)} className="px-2.5 py-2 hover:bg-gray-100"><Minus size={12}/></button>
                              <span className="px-2.5 py-2 font-bold text-sm tabular-nums">{qty}</span>
                              <button onClick={()=>setQty(item.product_id,1)} className="px-2.5 py-2 hover:bg-gray-100"><Plus size={12}/></button>
                            </div>
                          ):(
                            <button onClick={()=>setQty(item.product_id,1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg hover:brightness-110 active:scale-[0.95] transition-all" style={{backgroundColor:pc}}><Plus size={16}/></button>
                          )}
                        </div>
                      </div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── INLINE ORDER FORM ── */}
        <section ref={checkoutRef} style={{backgroundColor:bgColor}}>
          <div className="max-w-2xl mx-auto px-5 py-10">
            <Reveal animation={anim}>
              <div className="rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 bg-white" style={{border:'1px solid rgba(0,0,0,0.05)'}}>
                <h2 className="text-lg font-black text-center" style={{color:textColor}}>{t('lp.completeOrder','Complete Your Order')}</h2>

                {/* Form */}
                <div className="space-y-3">
                  <FormInput icon={User} label={t('lp.fullName','Full Name')} required value={form.customer_name} onChange={set('customer_name')} placeholder={t('lp.namePh','Your full name')} accent={pc}/>
                  <FormInput icon={Phone} label={t('lp.phone','Phone')} required value={form.customer_phone} onChange={set('customer_phone')} placeholder="0555123456" accent={pc}/>
                  <FormSelect icon={MapPin} label={t('lp.wilaya','Wilaya')} required value={form.shipping_wilaya} onChange={e=>setForm(f=>({...f,shipping_wilaya:e.target.value,shipping_city:'',shipping_zip:''}))} accent={pc}>
                    <option value="">{t('checkout.selectWilaya','Select wilaya...')}</option>
                    {ALL_WILAYAS.map(w=><option key={w.code} value={w.name}>{w.code} - {w.name}</option>)}
                  </FormSelect>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.commune','Commune')} <span style={{color:pc}}>*</span></label>
                    <select className="lp-input w-full px-4 py-3 rounded-xl text-sm appearance-none" value={form.shipping_city} onChange={e=>{const city=e.target.value;const wCode=WILAYA_CODES[form.shipping_wilaya]||'';const cities=WILAYA_CITIES[form.shipping_wilaya]||[];const idx=Math.max(0,cities.indexOf(city));const cCode=String((idx+1)*50).padStart(3,'0');setForm(f=>({...f,shipping_city:city,shipping_zip:wCode?wCode.padStart(2,'0')+cCode:''}))}} disabled={!form.shipping_wilaya}>
                      <option value="">{form.shipping_wilaya?t('checkout.selectCity','Select commune...'):t('checkout.selectWilayaFirst','Select wilaya first')}</option>
                      {communes.map((c,i)=><option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>ZIP</label>
                    <input className="lp-input w-full px-4 py-3 rounded-xl text-sm bg-gray-50" value={form.shipping_zip} readOnly placeholder={t('lp.autoFilled','Auto-filled')}/>
                  </div>
                  <FormInput icon={MapPin} label={t('lp.address','Address')} value={form.shipping_address} onChange={set('shipping_address')} placeholder={t('lp.addressPh','Street, building, floor...')} accent={pc}/>
                </div>

                {/* Delivery company */}
                {!companiesLoaded&&(
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{color:'oklch(0.55 0.01 280)'}}><Truck size={12}/>{t('checkout.deliveryCompany','Preferred Delivery Company')} <span style={{color:pc}}>*</span></label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-400"><div className="w-3 h-3 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"/>{t('checkout.loadingCompanies','Loading...')}</div>
                  </div>
                )}
                {companiesLoaded&&companies.length>0&&(
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{color:'oklch(0.55 0.01 280)'}}><Truck size={12}/>{t('checkout.deliveryCompany','Preferred Delivery Company')} <span style={{color:pc}}>*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {companies.map(dc=>{
                        const sel=form.delivery_company_id===dc.id;
                        return(
                          <button key={dc.id} onClick={()=>setForm(f=>({...f,delivery_company_id:dc.id}))} className="p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2" style={{
                            border:`2px solid ${sel?pc:'oklch(0.9 0.005 280)'}`,
                            backgroundColor:sel?pc+'08':'transparent',
                          }}>
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">{(dc.name||'?')[0].toUpperCase()}</div>
                            <span style={{color:sel?pc:'oklch(0.45 0.01 280)'}}>{dc.name}</span>
                            {sel&&<Check size={12} className="ml-auto" style={{color:pc}}/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery type */}
                {wilayas.length>0&&form.shipping_wilaya&&(
                  <div className="grid grid-cols-2 gap-2">
                    {[{type:'home',icon:Truck,label:t('checkout.homeDelivery','Home Delivery')},{type:'desk',icon:Package,label:t('checkout.deskDelivery','Desk / Relay')}].map(d=>{const dp=getDeliveryPrice(d.type);return(
                      <button key={d.type} onClick={()=>setForm(f=>({...f,shipping_type:d.type}))} className="p-3 rounded-xl text-xs font-semibold text-center transition-all flex flex-col items-center gap-1.5" style={{
                        border:`2px solid ${form.shipping_type===d.type?pc:'oklch(0.9 0.005 280)'}`,
                        backgroundColor:form.shipping_type===d.type?pc+'08':'transparent',
                      }}>
                        <d.icon size={16} style={{color:form.shipping_type===d.type?pc:'oklch(0.55 0.01 280)'}}/>{d.label}
                        {dp!=null&&<span className="text-[10px] font-bold opacity-60">{dp.toLocaleString()} {currency}</span>}
                      </button>
                    );})}
                  </div>
                )}

                {/* Payment */}
                <div className="flex flex-wrap gap-2">
                  {[
                    store?.enable_cod!==false&&{method:'cod',label:t('lp.cod','Cash on Delivery')},
                    store?.enable_ccp&&{method:'ccp',label:'CCP'},
                    store?.enable_baridimob&&{method:'baridimob',label:'BaridiPay'},
                  ].filter(Boolean).map(p=>(
                    <button key={p.method} onClick={()=>setForm(f=>({...f,payment_method:p.method}))} className="flex-1 p-3 rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5" style={{
                      border:`2px solid ${form.payment_method===p.method?pc:'oklch(0.9 0.005 280)'}`,
                      backgroundColor:form.payment_method===p.method?pc+'08':'transparent',
                    }}>
                      <CreditCard size={13} style={{color:form.payment_method===p.method?pc:'oklch(0.55 0.01 280)'}}/>{p.label}
                    </button>
                  ))}
                </div>

                {/* Coupon */}
                <div className="flex gap-2">
                  <input className="lp-input flex-1 px-4 py-3 rounded-xl text-sm" placeholder={t('checkout.couponCode','Coupon code')} value={form.coupon_code} onChange={set('coupon_code')}/>
                  <button type="button" onClick={validateCoupon} className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-1.5" style={{backgroundColor:pc+'12',color:pc}}><Tag size={14}/>{t('checkout.apply','Apply')}</button>
                </div>

                {/* Order note */}
                <textarea className="lp-input w-full px-4 py-3 rounded-xl text-sm resize-none" rows={2} placeholder={t('checkout.notePlaceholder','Add a note to your order (optional)')} value={form.notes} onChange={set('notes')}/>

                {/* Order summary — bottom */}
                <div className="rounded-2xl p-4 space-y-2" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
                  {cartItems.map(it=>(
                    <div key={it.product_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {(it.custom_image||it.image)&&<img src={it.custom_image||it.image} className="w-8 h-8 rounded-lg object-cover shadow-sm"/>}
                        <span className="font-medium">{it.name} <span className="opacity-35">x{cart[it.product_id]}</span></span>
                      </div>
                      <span className="font-bold tabular-nums">{((parseFloat(it.price)||0)*(cart[it.product_id]||0)).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {cartItems.length===0&&<p className="text-xs text-center opacity-35">{t('lp.emptyCart','No products added')}</p>}
                  <div className="border-t pt-2 mt-2 space-y-1.5" style={{borderColor:'oklch(0.9 0.005 280)'}}>
                    <div className="flex justify-between text-sm"><span className="opacity-45">{t('lp.subtotal','Subtotal')}</span><span className="font-semibold tabular-nums">{subtotal.toLocaleString()} {currency}</span></div>
                    <div className="flex justify-between text-sm"><span className="opacity-45">{t('lp.shipping','Shipping')}</span><span className="font-semibold tabular-nums">{form.shipping_wilaya?`${shippingPrice.toLocaleString()} ${currency}`:'—'}</span></div>
                    {couponDiscount>0&&<div className="flex justify-between text-sm"><span className="opacity-45">{t('checkout.discount','Discount')}</span><span className="font-semibold tabular-nums text-emerald-600">-{couponDiscount.toLocaleString()} {currency}</span></div>}
                    <div className="flex justify-between text-base font-black pt-1.5 border-t" style={{borderColor:'oklch(0.9 0.005 280)'}}><span>{t('lp.total','Total')}</span><span style={{color:pc}} className="tabular-nums">{total.toLocaleString()} {currency}</span></div>
                  </div>
                </div>

                {/* Submit */}
                <button onClick={placeOrder} disabled={submitting||cartItems.length===0} className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2.5 shadow-2xl hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-40" style={{backgroundColor:ctaBg,color:ctaTextColor,boxShadow:`0 8px 30px ${ctaBg}50`}}>
                  {submitting?<Loader2 size={20} className="animate-spin"/>:<><ShoppingBag size={18}/>{page.cta_text||t('lp.placeOrder','Place Order')} — {total.toLocaleString()} {currency}</>}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] opacity-40" style={{color:textColor}}>
                  <span className="flex items-center gap-1"><Lock size={10}/>{t('lp.secureCheckout','Secure checkout')}</span>
                  <span className="flex items-center gap-1"><Shield size={10}/>{t('lp.moneyBack','Money-back guarantee')}</span>
                  <span className="flex items-center gap-1"><Truck size={10}/>{t('lp.allWilayas','All wilayas')}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── TRUST SECTION ── */}
        {showTrust&&(
          <section className="py-12" style={{backgroundColor:bgColor}}>
            <TrustBadges accent={pc} textColor={textColor}/>
          </section>
        )}
      </>
    );
  };


  /* ═══════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════ */
  return(
    <div className="min-h-screen lp-root" dir={i18n.language==='ar'?'rtl':'ltr'} style={{backgroundColor:page.bg_color||'#FAFAFA',color:page.text_color||'#1F2937',fontFeatureSettings:'"ss01","cv11"'}}>
      {i18n.language==='ar'&&<style>{`.lp-root[dir="rtl"] *{letter-spacing:normal!important;text-transform:none!important;word-break:normal!important;font-family:'Noto Sans Arabic','Outfit',sans-serif!important;}`}</style>}
      <AnimationStyles accent={pc}/>
      <BuyerLangSwitcher accent={pc}/>
      <FloatingCartButton totalQty={totalQty} subtotal={subtotal} currency={currency} accent={pc} onClick={scrollToCheckout}/>

      {layoutStyle==='product-hero'?(
        renderProductHeroAll()
      ):(
        <>
          {renderHero()}
          {renderAIImages('after_hero')}

          {showSocial&&(
            <div className="py-10 relative overflow-hidden" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
              <MeshGradient color1={pc} color2={page.bg_color||'#FAFAFA'} opacity={0.03}/>
              <div className="relative"><SocialProof accent={pc} textColor={page.text_color||'#1F2937'} showReviews={page.show_reviews!==false}/></div>
            </div>
          )}

          {renderAllProducts()}
          {renderAIImages('between_products')}

          {/* CTA divider */}
          <Reveal animation={anim}>
            <div className="relative py-16 text-center overflow-hidden" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
              <MeshGradient color1={pc} color2={page.bg_color||'#FAFAFA'} opacity={0.04}/>
              <div className="relative">
                <p className="text-sm font-semibold opacity-45 mb-4" style={{color:page.text_color||'#1F2937'}}>{t('lp.readyToOrder','Ready to order?')}</p>
                <button onClick={scrollToCheckout} className="px-10 py-4 rounded-2xl text-white font-black text-sm shadow-2xl transition-all hover:brightness-110 active:scale-[0.96] inline-flex items-center gap-2" style={{backgroundColor:pc,boxShadow:`0 8px 30px ${pc}40`}}>
                  <ShoppingBag size={16}/>{page.cta_text||t('lp.orderNow','Order Now')}
                </button>
              </div>
            </div>
          </Reveal>

          {renderAIImages('before_checkout')}
          {/* ═══ CHECKOUT ═══ */}
          <section ref={checkoutRef} className="relative overflow-hidden" style={{background:`linear-gradient(160deg, ${page.hero_bg||'oklch(0.15 0.04 280)'}, oklch(0.08 0.01 280))`}}>
            <ProductImageMosaic items={allItems} overlay={`linear-gradient(180deg, ${page.hero_bg||'oklch(0.15 0.04 280)'}e0 0%, oklch(0.08 0.01 280) 100%)`}/>
            <MeshGradient color1={pc} color2={page.hero_bg||'#1a0030'} opacity={0.08}/>
            <div className="relative max-w-3xl mx-auto px-5 py-16 sm:py-24">
              <Reveal animation={anim}>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-8" style={{color:page.hero_text||'#FFF'}}>{t('lp.completeOrder','Complete Your Order')}</h2>
              </Reveal>
              <Reveal animation={anim} delay={150}>
                <div className="rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-sm" style={{backgroundColor:'rgba(255,255,255,0.97)',color:'#1F2937',border:'1px solid rgba(255,255,255,0.2)'}}>
                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput icon={User} label={t('lp.fullName','Full Name')} required value={form.customer_name} onChange={set('customer_name')} placeholder={t('lp.namePh','Your full name')} accent={pc}/>
                    <FormInput icon={Phone} label={t('lp.phone','Phone')} required value={form.customer_phone} onChange={set('customer_phone')} placeholder="0555123456" accent={pc}/>
                    {store?.checkout_email&&<FormInput icon={Mail} label={t('lp.email','Email')} value={form.customer_email} onChange={set('customer_email')} placeholder="email@example.com" accent={pc}/>}
                    <FormSelect icon={MapPin} label={t('lp.wilaya','Wilaya')} required value={form.shipping_wilaya} onChange={e=>setForm(f=>({...f,shipping_wilaya:e.target.value,shipping_city:'',shipping_zip:''}))} accent={pc}>
                      <option value="">{t('checkout.selectWilaya','Select wilaya...')}</option>
                      {ALL_WILAYAS.map(w=><option key={w.code} value={w.name}>{w.code} - {w.name}</option>)}
                    </FormSelect>
                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.commune','Commune')} <span style={{color:pc}}>*</span></label>
                      <select className="lp-input w-full px-4 py-3 rounded-xl text-sm appearance-none" value={form.shipping_city} onChange={e=>{const city=e.target.value;const wCode=WILAYA_CODES[form.shipping_wilaya]||'';const cities=WILAYA_CITIES[form.shipping_wilaya]||[];const idx=Math.max(0,cities.indexOf(city));const cCode=String((idx+1)*50).padStart(3,'0');setForm(f=>({...f,shipping_city:city,shipping_zip:wCode?wCode.padStart(2,'0')+cCode:''}))}} disabled={!form.shipping_wilaya}>
                        <option value="">{form.shipping_wilaya?t('checkout.selectCity','Select commune...'):t('checkout.selectWilayaFirst','Select wilaya first')}</option>
                        {communes.map((c,i)=><option key={i} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>ZIP</label>
                      <input className="lp-input w-full px-4 py-3 rounded-xl text-sm bg-gray-50" value={form.shipping_zip} readOnly placeholder={t('lp.autoFilled','Auto-filled')}/>
                    </div>
                    <div className="sm:col-span-2"><FormInput icon={MapPin} label={t('lp.address','Address')} value={form.shipping_address} onChange={set('shipping_address')} placeholder={t('lp.addressPh','Street address, building, etc.')} accent={pc}/></div>
                  </div>

                  {/* Delivery company */}
                  {!companiesLoaded&&(
                    <div>
                      <label className="text-xs font-semibold mb-2.5 block flex items-center gap-1.5" style={{color:'oklch(0.55 0.01 280)'}}><Truck size={13}/>{t('checkout.deliveryCompany','Preferred Delivery Company')} <span style={{color:pc}}>*</span></label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-400"><div className="w-3 h-3 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"/>{t('checkout.loadingCompanies','Loading...')}</div>
                    </div>
                  )}
                  {companiesLoaded&&companies.length>0&&(
                    <div>
                      <label className="text-xs font-semibold mb-2.5 block flex items-center gap-1.5" style={{color:'oklch(0.55 0.01 280)'}}><Truck size={13}/>{t('checkout.deliveryCompany','Preferred Delivery Company')} <span style={{color:pc}}>*</span></label>
                      <div className="space-y-2">
                        {companies.map(dc=>{
                          const sel=form.delivery_company_id===dc.id;
                          return(
                            <button key={dc.id} onClick={()=>setForm(f=>({...f,delivery_company_id:dc.id}))} className="w-full p-3.5 rounded-xl text-sm font-semibold text-left flex items-center gap-3 transition-all" style={{
                              border:`2px solid ${sel?pc:'oklch(0.9 0.005 280)'}`,
                              backgroundColor:sel?pc+'08':'transparent',
                            }}>
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0">{(dc.name||'?')[0].toUpperCase()}</div>
                              <span style={{color:sel?pc:'oklch(0.4 0.01 280)'}}>{dc.name}</span>
                              {sel&&<Check size={14} className="ml-auto" style={{color:pc}}/>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery type */}
                  {wilayas.length>0&&form.shipping_wilaya&&(
                    <div>
                      <label className="text-xs font-semibold mb-2.5 block" style={{color:'oklch(0.55 0.01 280)'}}>{t('checkout.deliveryType','Delivery Type')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{type:'home',icon:Truck,label:t('checkout.homeDelivery','Home Delivery')},{type:'desk',icon:Package,label:t('checkout.deskDelivery','Desk / Relay')}].map(d=>{const dp=getDeliveryPrice(d.type);return(
                          <button key={d.type} onClick={()=>setForm(f=>({...f,shipping_type:d.type}))} className="p-3.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1.5" style={{
                            border:`2px solid ${form.shipping_type===d.type?pc:'oklch(0.9 0.005 280)'}`,
                            backgroundColor:form.shipping_type===d.type?pc+'08':'transparent',
                          }}>
                            <div className="flex items-center gap-2"><d.icon size={16} style={{color:form.shipping_type===d.type?pc:'oklch(0.55 0.01 280)'}}/>{d.label}</div>
                            {dp!=null&&<span className="text-xs font-bold opacity-60">{dp.toLocaleString()} {currency}</span>}
                          </button>
                        );})}
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  <div>
                    <label className="text-xs font-semibold mb-2.5 block" style={{color:'oklch(0.55 0.01 280)'}}>{t('checkout.paymentMethod','Payment Method')}</label>
                    <div className="space-y-2">
                      {[
                        store?.enable_cod!==false&&{method:'cod',label:t('lp.cod','Cash on Delivery')},
                        store?.enable_ccp&&{method:'ccp',label:'CCP'},
                        store?.enable_baridimob&&{method:'baridimob',label:'BaridiPay'},
                      ].filter(Boolean).map(p=>(
                        <button key={p.method} onClick={()=>setForm(f=>({...f,payment_method:p.method}))} className="w-full p-3.5 rounded-xl text-sm font-semibold text-left flex items-center gap-3 transition-all" style={{
                          border:`2px solid ${form.payment_method===p.method?pc:'oklch(0.9 0.005 280)'}`,
                          backgroundColor:form.payment_method===p.method?pc+'08':'transparent',
                        }}>
                          <CreditCard size={16} style={{color:form.payment_method===p.method?pc:'oklch(0.55 0.01 280)'}}/>{p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2">
                    <input className="lp-input flex-1 px-4 py-3 rounded-xl text-sm" placeholder={t('checkout.couponCode','Coupon code')} value={form.coupon_code} onChange={set('coupon_code')}/>
                    <button type="button" onClick={validateCoupon} className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-1.5" style={{backgroundColor:pc+'12',color:pc}}><Tag size={14}/>{t('checkout.apply','Apply')}</button>
                  </div>

                  {/* Order note */}
                  <div>
                    <label className="text-xs font-semibold mb-2.5 block" style={{color:'oklch(0.55 0.01 280)'}}>{t('checkout.orderNote','Order Note')}</label>
                    <textarea className="lp-input w-full px-4 py-3 rounded-xl text-sm resize-none" rows={3} placeholder={t('checkout.notePlaceholder','Add a note to your order (optional)')} value={form.notes} onChange={set('notes')}/>
                  </div>

                  {/* Order summary — bottom */}
                  <div className="rounded-2xl p-5 space-y-3" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
                    <p className="text-xs font-black uppercase tracking-wider" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.yourOrder','Your Order')}</p>
                    {cartItems.length===0&&<p className="text-sm opacity-35 py-2">{t('lp.emptyCart','No products added yet. Scroll up to add products.')}</p>}
                    {cartItems.map(it=>(
                      <div key={it.product_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {(it.custom_image||it.image)&&<img src={it.custom_image||it.image} className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-black/5"/>}
                          <div><span className="text-sm font-semibold">{it.name}</span><span className="text-xs opacity-35 ml-2">x{cart[it.product_id]}</span></div>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{((parseFloat(it.price)||0)*(cart[it.product_id]||0)).toLocaleString()} {currency}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 space-y-2" style={{borderColor:'oklch(0.9 0.005 280)'}}>
                      <div className="flex justify-between text-sm"><span className="opacity-45">{t('lp.subtotal','Subtotal')}</span><span className="font-semibold tabular-nums">{subtotal.toLocaleString()} {currency}</span></div>
                      <div className="flex justify-between text-sm"><span className="opacity-45">{t('lp.shipping','Shipping')}</span><span className="font-semibold tabular-nums">{form.shipping_wilaya?`${shippingPrice.toLocaleString()} ${currency}`:'—'}</span></div>
                      {couponDiscount>0&&<div className="flex justify-between text-sm"><span className="opacity-45">{t('checkout.discount','Discount')}</span><span className="font-semibold tabular-nums text-emerald-600">-{couponDiscount.toLocaleString()} {currency}</span></div>}
                      <div className="flex justify-between text-lg font-black pt-2 border-t" style={{borderColor:'oklch(0.9 0.005 280)'}}><span>{t('lp.total','Total')}</span><span style={{color:pc}} className="tabular-nums">{total.toLocaleString()} {currency}</span></div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={placeOrder} disabled={submitting||cartItems.length===0} className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2.5 shadow-2xl transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none" style={{backgroundColor:page.cta_bg||pc,boxShadow:`0 8px 30px ${page.cta_bg||pc}40`}}>
                    {submitting?<Loader2 size={20} className="animate-spin"/>:<><ShoppingBag size={18}/>{page.cta_text||t('lp.placeOrder','Place Order')} — {total.toLocaleString()} {currency}</>}
                  </button>
                  <div className="flex items-center justify-center gap-5 text-[11px]" style={{color:'oklch(0.65 0.01 280)'}}>
                    <span className="flex items-center gap-1.5"><Lock size={11}/>{t('lp.secureCheckout','Secure checkout')}</span>
                    <span className="flex items-center gap-1.5"><Shield size={11}/>{t('lp.moneyBack','Money-back guarantee')}</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </>
      )}

      {renderAIImages('footer')}
      {/* Footer */}
      <footer className="py-8 text-center space-y-2 relative overflow-hidden" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
        <p className="text-xs relative" style={{color:'oklch(0.6 0.01 280)'}}>© {new Date().getFullYear()} {store?.name}. {t('lp.allRights','All rights reserved.')}</p>
        <Link to={`/s/${storeSlug}`} className="text-xs font-semibold hover:underline underline-offset-4 transition-colors relative" style={{color:pc}}>{t('lp.visitStore','Visit our full store')}</Link>
      </footer>
    </div>
  );
}
