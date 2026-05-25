import React,{useState,useEffect,useRef,useCallback}from'react';
import{useParams,Link}from'react-router-dom';
import{useTranslation}from'react-i18next';
import{storeApi}from'../../utils/api';
import{useAuthStore}from'../../hooks/useStore';
import toast from'react-hot-toast';
import{ShoppingBag,Check,Star,Truck,Shield,ChevronDown,Plus,Minus,Phone,MapPin,User,Mail,CreditCard,Lock,Loader2,Package,Clock,Heart,Award,ArrowDown}from'lucide-react';

/* ───── scroll-reveal hook ───── */
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

/* ───── animated counter ───── */
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

/* ───── countdown timer ───── */
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
    <div className="inline-flex items-center gap-1.5 text-sm font-bold" style={{color:accent}}>
      <Clock size={14}/>
      <span className="tabular-nums">{pad(h)}:{pad(m)}:{pad(s)}</span>
    </div>
  );
}

/* ───── reveal wrapper with animation ───── */
function Reveal({children,animation='slide-up',delay=0,className=''}){
  const[ref,visible]=useReveal(0.12);
  const baseStyle={transition:`opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`};
  const hidden={opacity:0,transform:animation==='slide-up'?'translateY(40px)':animation==='zoom'?'scale(0.92)':'translateY(0)'};
  const shown={opacity:1,transform:'translateY(0) scale(1)'};
  if(animation==='none')return <div ref={ref} className={className}>{children}</div>;
  return(
    <div ref={ref} className={className} style={{...baseStyle,...(visible?shown:hidden)}}>
      {children}
    </div>
  );
}

/* ───── trust badges ───── */
function TrustBadges({accent,textColor}){
  const{t}=useTranslation();
  const badges=[
    {icon:<Truck size={20}/>,label:t('lp.fastDelivery','Fast Delivery'),sub:t('lp.fastDeliverySub','48h across Algeria')},
    {icon:<Shield size={20}/>,label:t('lp.securePayment','Secure Payment'),sub:t('lp.securePaymentSub','100% protected')},
    {icon:<Award size={20}/>,label:t('lp.topQuality','Top Quality'),sub:t('lp.topQualitySub','Satisfaction guaranteed')},
  ];
  return(
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
      {badges.map((b,i)=>(
        <div key={i} className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto" style={{backgroundColor:accent+'18',color:accent}}>{b.icon}</div>
          <p className="text-xs font-bold" style={{color:textColor}}>{b.label}</p>
          <p className="text-[10px] opacity-60" style={{color:textColor}}>{b.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ───── social proof ───── */
function SocialProof({accent}){
  const{t}=useTranslation();
  const[ref,visible]=useReveal(0.3);
  return(
    <div ref={ref} className="flex items-center justify-center gap-6 flex-wrap text-sm" style={{opacity:visible?1:0,transition:'opacity 0.6s ease'}}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[...Array(4)].map((_,i)=>(
            <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor:accent,filter:`brightness(${1-i*0.1})`}}>
              {['A','S','M','K'][i]}
            </div>
          ))}
        </div>
        <span className="text-gray-500 text-xs">
          <AnimatedNumber value={127}/> {t('lp.recentOrders','recent orders')}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_,i)=><Star key={i} size={14} fill={accent} color={accent}/>)}
        <span className="text-xs text-gray-500 ml-1">4.9/5</span>
      </div>
    </div>
  );
}

export default function BuyerLandingPage(){
  const{storeSlug,landingSlug}=useParams();
  const{t}=useTranslation();
  const[store,setStore]=useState(null);
  const[page,setPage]=useState(null);
  const[loading,setLoading]=useState(true);
  const[notFound,setNotFound]=useState(false);
  const[cart,setCart]=useState({});
  const[form,setForm]=useState({customer_name:'',customer_phone:'',customer_email:'',shipping_wilaya:'',shipping_city:'',shipping_address:'',shipping_type:'home',payment_method:'cod',notes:'',delivery_company_id:'',notification_preference:'whatsapp'});
  const[wilayas,setWilayas]=useState([]);
  const[communes,setCommunes]=useState([]);
  const[shippingPrice,setShippingPrice]=useState(0);
  const[submitting,setSubmitting]=useState(false);
  const[orderSuccess,setOrderSuccess]=useState(null);
  const[companies,setCompanies]=useState([]);
  const checkoutRef=useRef(null);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  useEffect(()=>{
    try{const s=JSON.parse(localStorage.getItem('checkout.savedInfo'));if(s)setForm(f=>({...f,...s}));}catch{}
  },[]);

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
        try{
          const{data:wData}=await storeApi.getShippingWilayas(storeSlug);
          const w=Array.isArray(wData)?wData:(wData?.wilayas||[]);
          setWilayas(w.filter(x=>x.is_active!==false));
        }catch{}
        try{
          const{data:cData}=await storeApi.getDeliveryCompanies?.(storeSlug)||{data:[]};
          if(Array.isArray(cData))setCompanies(cData);
        }catch{}
      }catch(e){
        setNotFound(true);
      }
      setLoading(false);
    })();
  },[storeSlug,landingSlug]);

  useEffect(()=>{
    if(!form.shipping_wilaya||!wilayas.length)return;
    const w=wilayas.find(x=>String(x.wilaya_code)===String(form.shipping_wilaya)||x.name===form.shipping_wilaya);
    if(w){
      setShippingPrice(form.shipping_type==='desk'?(w.desk_price||w.home_price||400):(w.home_price||400));
      if(w.communes){
        const c=typeof w.communes==='string'?w.communes.split(',').map(s=>s.trim()):Array.isArray(w.communes)?w.communes:[];
        setCommunes(c);
      }else{setCommunes([]);}
    }
  },[form.shipping_wilaya,form.shipping_type,wilayas]);

  const scrollToCheckout=()=>{checkoutRef.current?.scrollIntoView({behavior:'smooth'});};
  const setQty=(pid,delta)=>setCart(c=>{const n=Math.max(0,(c[pid]||0)+delta);return{...c,[pid]:n};});
  const totalQty=Object.values(cart).reduce((s,q)=>s+q,0);
  const cartItems=(page?.items||[]).filter(it=>cart[it.product_id]>0);
  const subtotal=cartItems.reduce((s,it)=>s+(parseFloat(it.price)||0)*(cart[it.product_id]||0),0);
  const total=subtotal+shippingPrice;
  const pc=page?.accent_color||store?.primary_color||'#7C3AED';
  const anim=page?.animation_style||'slide-up';
  const heroStyle=page?.hero_style||'centered';
  const layoutStyle=page?.layout_style||'alternating';
  const showTrust=page?.show_trust_badges!==false;
  const showSocial=page?.show_social_proof!==false;
  const showCountdown=page?.show_countdown&&(page?.countdown_hours||page?.countdown_minutes);

  const isValidPhone=(p)=>/^(0)(5|6|7)\d{8}$/.test((p||'').replace(/\s/g,''));

  const placeOrder=async()=>{
    if(!form.customer_name)return toast.error(t('checkout.errName','Please enter your name'));
    if(!isValidPhone(form.customer_phone))return toast.error(t('checkout.errPhoneAlg','Please enter a valid Algerian phone'));
    if(!form.shipping_wilaya)return toast.error(t('checkout.errWilaya','Please choose your wilaya'));
    if(!form.shipping_city)return toast.error(t('checkout.errCity','Please choose your commune'));
    if(!form.payment_method)return toast.error(t('checkout.errPay','Please choose a payment method'));
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
    }catch(err){toast.error(err.response?.data?.error||t('lp.orderFailed','Order failed'));}
    setSubmitting(false);
  };

  /* ─── Loading ─── */
  if(loading)return(
    <div className="min-h-screen flex items-center justify-center" style={{background:'oklch(0.17 0.01 280)'}}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-[3px] border-white/10 border-t-white/80 animate-spin"/>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-white/30 animate-spin" style={{animationDirection:'reverse',animationDuration:'1.5s'}}/>
      </div>
    </div>
  );

  /* ─── Not Found ─── */
  if(notFound)return(
    <div className="min-h-screen flex flex-col items-center justify-center" style={{background:'oklch(0.17 0.01 280)'}}>
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
          <Package size={36} className="text-white/30"/>
        </div>
        <p className="text-white/60 font-semibold text-lg">{t('lp.pageNotFound','Page not found')}</p>
        <Link to={`/s/${storeSlug}`} className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">{t('lp.goToStore','Go to store')}</Link>
      </div>
    </div>
  );

  /* ─── Order Success ─── */
  if(orderSuccess)return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:`linear-gradient(135deg, ${page.hero_bg||'oklch(0.35 0.15 280)'}, oklch(0.15 0.01 280))`}}>
      <Reveal animation="zoom">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:pc+'18'}}>
            <Check size={28} style={{color:pc}}/>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">{t('lp.orderSuccess','Order Placed Successfully!')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{t('lp.orderSuccessDesc','Thank you for your order. We will contact you shortly to confirm.')}</p>
          <div className="rounded-2xl p-5 space-y-3" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
            <div className="flex justify-between text-sm"><span className="text-gray-400">{t('lp.orderNumber','Order')}</span><span className="font-mono font-bold text-gray-900">#{orderSuccess.order_number||orderSuccess.id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">{t('lp.orderTotal','Total')}</span><span className="font-bold" style={{color:pc}}>{total.toLocaleString()} {store?.currency||'DZD'}</span></div>
          </div>
          <Link to={`/s/${storeSlug}`} className="inline-block mt-7 px-7 py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-[0.97]" style={{backgroundColor:pc}}>{t('lp.continueShopping','Continue Shopping')}</Link>
        </div>
      </Reveal>
    </div>
  );

  /* ─── Hero sections by style ─── */
  const renderHero=()=>{
    const heroBg=page.hero_bg||'oklch(0.22 0.04 280)';
    const heroText=page.hero_text||'#FFFFFF';

    if(heroStyle==='split'){
      return(
        <section className="relative overflow-hidden" style={{backgroundColor:heroBg}}>
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:`radial-gradient(circle at 70% 30%, ${heroText} 0%, transparent 60%)`}}/>
          <div className="relative max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <Reveal animation={anim} className="flex-1 space-y-6">
                <div>
                  {showCountdown&&<div className="mb-4"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={page.cta_bg||'#10B981'}/></div>}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
                  {page.hero_subtitle&&<p className="mt-4 text-base sm:text-lg opacity-75 leading-relaxed max-w-lg" style={{color:heroText}}>{page.hero_subtitle}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={scrollToCheckout} className="px-7 py-3.5 rounded-2xl font-bold text-sm inline-flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.97] shadow-lg" style={{backgroundColor:page.cta_bg||'#10B981',color:page.cta_text_color||'#FFF'}}>
                    <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
                  </button>
                  <button onClick={scrollToCheckout} className="px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:bg-white/10 flex items-center gap-1.5" style={{color:heroText,border:`1px solid ${heroText}30`}}>
                    <ArrowDown size={14}/>{t('lp.seeProducts','See Products')}
                  </button>
                </div>
                {showTrust&&<div className="pt-4"><TrustBadges accent={page.cta_bg||'#10B981'} textColor={heroText}/></div>}
              </Reveal>
              {page.hero_image&&(
                <Reveal animation={anim} delay={200} className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl" style={{backgroundColor:pc}}/>
                    <img src={page.hero_image} alt="" className="relative w-full max-w-md mx-auto rounded-2xl shadow-2xl object-cover aspect-[4/3]"/>
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
        <section className="relative" style={{backgroundColor:heroBg}}>
          <div className="max-w-3xl mx-auto px-5 py-20 sm:py-32 text-center">
            <Reveal animation={anim}>
              {showCountdown&&<div className="mb-5 flex justify-center"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={page.cta_bg||'#10B981'}/></div>}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
              {page.hero_subtitle&&<p className="mt-5 text-base sm:text-lg opacity-60 max-w-xl mx-auto leading-relaxed" style={{color:heroText}}>{page.hero_subtitle}</p>}
              <button onClick={scrollToCheckout} className="mt-8 px-8 py-4 rounded-2xl font-bold text-base inline-flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.97] shadow-lg" style={{backgroundColor:page.cta_bg||'#10B981',color:page.cta_text_color||'#FFF'}}>
                <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
              </button>
            </Reveal>
          </div>
        </section>
      );
    }

    /* centered (default) */
    return(
      <section className="relative overflow-hidden" style={{backgroundColor:heroBg}}>
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:`radial-gradient(circle at 25% 80%, ${heroText} 0%, transparent 50%), radial-gradient(circle at 75% 20%, ${heroText} 0%, transparent 50%)`}}/>
        <div className="relative max-w-4xl mx-auto px-5 py-16 sm:py-28 text-center">
          <Reveal animation={anim}>
            {store?.logo&&<img src={store.logo} alt="" className="w-14 h-14 rounded-2xl mx-auto mb-5 shadow-lg ring-2 ring-white/10"/>}
            {showCountdown&&<div className="mb-5 flex justify-center"><CountdownTimer hours={page.countdown_hours||0} minutes={page.countdown_minutes||0} accent={page.cta_bg||'#10B981'}/></div>}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight" style={{color:heroText}}>{page.hero_title||store?.name}</h1>
            {page.hero_subtitle&&<p className="mt-5 text-base sm:text-lg opacity-75 max-w-2xl mx-auto leading-relaxed" style={{color:heroText}}>{page.hero_subtitle}</p>}
            <button onClick={scrollToCheckout} className="mt-9 px-9 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:brightness-110 active:scale-[0.97] inline-flex items-center gap-2" style={{backgroundColor:page.cta_bg||'#10B981',color:page.cta_text_color||'#FFF'}}>
              <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','Order Now')}
            </button>
            {showTrust&&<div className="mt-10"><TrustBadges accent={page.cta_bg||'#10B981'} textColor={heroText}/></div>}
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Alternating ─── */
  const renderAlternating=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const isEven=idx%2===0;
    const sectionBg=isEven?page.bg_color||'#FAFAFA':'oklch(0.97 0.005 280)';
    return(
      <section key={item.product_id} style={{backgroundColor:sectionBg}}>
        <div className="max-w-5xl mx-auto px-5 py-14 sm:py-24">
          <Reveal animation={anim} delay={100}>
            <div className={`flex flex-col ${isEven?'md:flex-row':'md:flex-row-reverse'} gap-8 md:gap-14 items-center`}>
              {/* Image */}
              <div className="flex-1 w-full">
                <div className="relative group">
                  {item.compare_price&&(
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor:pc}}>
                      -{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%
                    </div>
                  )}
                  {(item.custom_image||item.image)?
                    <img src={item.custom_image||item.image} alt={item.name} className="w-full max-w-lg mx-auto rounded-2xl shadow-xl object-cover aspect-square transition-transform duration-500 group-hover:scale-[1.02]"/>
                    :<div className="w-full max-w-lg mx-auto aspect-square rounded-2xl flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={56} className="opacity-20"/></div>
                  }
                </div>
              </div>
              {/* Info */}
              <div className="flex-1 space-y-5">
                {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.15em]" style={{color:pc}}>{item.headline}</p>}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
                {item.description&&<p className="text-sm leading-relaxed opacity-60" style={{color:page.text_color||'#1F2937'}}>{item.description}</p>}
                {item.features?.length>0&&(
                  <ul className="space-y-2.5">
                    {item.features.filter(f=>f.trim()).map((f,i)=>(
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0" style={{backgroundColor:pc+'18'}}>
                          <Check size={12} style={{color:pc}}/>
                        </div>
                        <span style={{color:page.text_color||'#1F2937'}}>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Price */}
                <div className="flex items-end gap-3 pt-1">
                  <span className="text-3xl font-extrabold tracking-tight" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-base font-bold opacity-70">{store?.currency||'DZD'}</span></span>
                  {item.compare_price&&<span className="text-lg text-gray-400 line-through font-medium">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
                {/* Quantity */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.88 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors active:bg-gray-200"><Minus size={15}/></button>
                    <span className="px-4 py-2.5 font-bold text-lg min-w-[3rem] text-center tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors active:bg-gray-200"><Plus size={15}/></button>
                  </div>
                  {qty===0&&(
                    <button onClick={()=>setQty(item.product_id,1)} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:brightness-110 active:scale-[0.97] flex items-center gap-1.5" style={{backgroundColor:pc}}>
                      <ShoppingBag size={14}/>{t('lp.addToOrder','Add to Order')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Stacked ─── */
  const renderStacked=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const sectionBg=idx%2===0?page.bg_color||'#FAFAFA':'oklch(0.97 0.005 280)';
    return(
      <section key={item.product_id} style={{backgroundColor:sectionBg}}>
        <div className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
          <Reveal animation={anim} delay={80}>
            <div className="space-y-6">
              {/* Image */}
              <div className="relative group">
                {item.compare_price&&(
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor:pc}}>
                    -{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%
                  </div>
                )}
                {(item.custom_image||item.image)?
                  <img src={item.custom_image||item.image} alt={item.name} className="w-full rounded-2xl shadow-xl object-cover aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.01]"/>
                  :<div className="w-full aspect-[16/9] rounded-2xl flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={56} className="opacity-20"/></div>
                }
              </div>
              {/* Content */}
              <div className="space-y-4">
                {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.15em]" style={{color:pc}}>{item.headline}</p>}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
                {item.description&&<p className="text-sm leading-relaxed opacity-60 max-w-2xl" style={{color:page.text_color||'#1F2937'}}>{item.description}</p>}
                {item.features?.length>0&&(
                  <div className="flex flex-wrap gap-2">
                    {item.features.filter(f=>f.trim()).map((f,i)=>(
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{backgroundColor:pc+'12',color:pc}}>
                        <Check size={11}/>{f}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold tracking-tight" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-base font-bold opacity-70">{store?.currency||'DZD'}</span></span>
                    {item.compare_price&&<span className="text-lg text-gray-400 line-through font-medium">{parseFloat(item.compare_price).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.88 0.005 280)'}}>
                      <button onClick={()=>setQty(item.product_id,-1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors"><Minus size={15}/></button>
                      <span className="px-4 py-2.5 font-bold text-lg min-w-[3rem] text-center tabular-nums">{qty}</span>
                      <button onClick={()=>setQty(item.product_id,1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors"><Plus size={15}/></button>
                    </div>
                    {qty===0&&(
                      <button onClick={()=>setQty(item.product_id,1)} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:brightness-110 active:scale-[0.97] flex items-center gap-1.5" style={{backgroundColor:pc}}>
                        <ShoppingBag size={14}/>{t('lp.addToOrder','Add to Order')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Showcase ─── */
  const renderShowcase=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const hasImage=item.custom_image||item.image;
    return(
      <section key={item.product_id} className="relative overflow-hidden" style={{backgroundColor:idx%2===0?'oklch(0.14 0.01 280)':'oklch(0.18 0.015 280)'}}>
        {hasImage&&<div className="absolute inset-0"><img src={item.custom_image||item.image} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-105"/><div className="absolute inset-0" style={{background:'linear-gradient(to top, oklch(0.14 0.01 280) 20%, transparent 80%)'}}/></div>}
        <div className="relative max-w-4xl mx-auto px-5 py-20 sm:py-32 text-center">
          <Reveal animation={anim} delay={100}>
            <div className="space-y-6">
              {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{item.headline}</p>}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">{item.name}</h2>
              {item.description&&<p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-xl mx-auto">{item.description}</p>}
              {hasImage&&(
                <div className="relative max-w-sm mx-auto mt-4">
                  <div className="absolute -inset-3 rounded-3xl blur-xl" style={{backgroundColor:pc,opacity:0.15}}/>
                  <img src={item.custom_image||item.image} alt={item.name} className="relative w-full rounded-2xl shadow-2xl object-cover aspect-square"/>
                </div>
              )}
              {item.features?.length>0&&(
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {item.features.filter(f=>f.trim()).map((f,i)=>(
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80">
                      <Check size={11}/>{f}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-white">{parseFloat(item.price).toLocaleString()} <span className="text-base font-bold text-white/60">{store?.currency||'DZD'}</span></span>
                  {item.compare_price&&<span className="text-lg text-white/40 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex items-center rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm">
                  <button onClick={()=>setQty(item.product_id,-1)} className="px-3.5 py-2.5 text-white hover:bg-white/10 transition-colors"><Minus size={15}/></button>
                  <span className="px-4 py-2.5 font-bold text-lg min-w-[3rem] text-center text-white tabular-nums">{qty}</span>
                  <button onClick={()=>setQty(item.product_id,1)} className="px-3.5 py-2.5 text-white hover:bg-white/10 transition-colors"><Plus size={15}/></button>
                </div>
                {qty===0&&(
                  <button onClick={()=>setQty(item.product_id,1)} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.97] flex items-center gap-1.5" style={{backgroundColor:pc}}>
                    <ShoppingBag size={14}/>{t('lp.addToOrder','Add to Order')}
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Magazine ─── */
  const renderMagazine=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const isHero=idx===0;
    if(isHero){
      return(
        <section key={item.product_id} style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
          <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
            <Reveal animation={anim}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 relative group">
                  {item.compare_price&&<div className="absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-sm font-black text-white" style={{backgroundColor:pc}}>-{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%</div>}
                  {(item.custom_image||item.image)?<img src={item.custom_image||item.image} alt={item.name} className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]"/>:<div className="w-full aspect-[4/3] rounded-3xl flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={72} className="opacity-20"/></div>}
                </div>
                <div className="lg:col-span-2 flex flex-col justify-center space-y-5">
                  {item.headline&&<p className="text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block w-fit" style={{backgroundColor:pc+'15',color:pc}}>{item.headline}</p>}
                  <h2 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
                  {item.description&&<p className="text-sm leading-relaxed opacity-60" style={{color:page.text_color||'#1F2937'}}>{item.description}</p>}
                  {item.features?.length>0&&<ul className="space-y-2">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className="flex items-center gap-2.5 text-sm"><Check size={14} style={{color:pc}}/><span style={{color:page.text_color}}>{f}</span></li>)}</ul>}
                  <div className="flex items-end gap-3 pt-2">
                    <span className="text-4xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()}<span className="text-lg ml-1 opacity-60">{store?.currency||'DZD'}</span></span>
                    {item.compare_price&&<span className="text-xl text-gray-400 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.88 0.005 280)'}}>
                      <button onClick={()=>setQty(item.product_id,-1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors"><Minus size={15}/></button>
                      <span className="px-4 py-2.5 font-bold text-lg min-w-[3rem] text-center tabular-nums">{qty}</span>
                      <button onClick={()=>setQty(item.product_id,1)} className="px-3.5 py-2.5 hover:bg-gray-100 transition-colors"><Plus size={15}/></button>
                    </div>
                    {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2" style={{backgroundColor:pc}}><ShoppingBag size={15}/>{t('lp.addToOrder','Add to Order')}</button>}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      );
    }
    return(
      <section key={item.product_id} style={{backgroundColor:idx%2===0?page.bg_color||'#FAFAFA':'oklch(0.97 0.005 280)'}}>
        <div className="max-w-6xl mx-auto px-5 py-8">
          <Reveal animation={anim} delay={idx*60}>
            <div className="flex flex-col sm:flex-row gap-5 items-center p-5 rounded-2xl hover:shadow-lg transition-shadow" style={{backgroundColor:'white',border:'1px solid oklch(0.93 0.005 280)'}}>
              {(item.custom_image||item.image)?<img src={item.custom_image||item.image} alt={item.name} className="w-32 h-32 rounded-xl object-cover shrink-0"/>:<div className="w-32 h-32 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor:'oklch(0.95 0.005 280)'}}><Package size={28} className="opacity-20"/></div>}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold" style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                {item.description&&<p className="text-xs opacity-50 line-clamp-2" style={{color:page.text_color}}>{item.description}</p>}
                {item.features?.length>0&&<div className="flex flex-wrap gap-1.5">{item.features.filter(f=>f.trim()).slice(0,3).map((f,i)=><span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:pc+'12',color:pc}}>{f}</span>)}</div>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-60">{store?.currency||'DZD'}</span></span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg overflow-hidden" style={{border:'1px solid oklch(0.9 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-sm"><Minus size={12}/></button>
                    <span className="px-3 py-1.5 font-bold text-sm tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-sm"><Plus size={12}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><ShoppingBag size={12}/></button>}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Bento Grid ─── */
  const renderBentoAll=()=>{
    const items=page.items||[];
    if(!items.length)return null;
    const getBentoClass=(idx,total)=>{
      if(total===1)return'col-span-2 row-span-2';
      if(total===2)return'col-span-1 row-span-2';
      if(idx===0)return'col-span-2 row-span-2';
      if(idx===1&&total>3)return'col-span-1 row-span-2';
      return'col-span-1 row-span-1';
    };
    return(
      <section style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
          <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[220px] sm:auto-rows-[280px] gap-4">
            {items.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              const isLarge=idx===0;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*80} className={getBentoClass(idx,items.length)}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden group cursor-pointer" style={{backgroundColor:'oklch(0.15 0.01 280)'}}>
                    {(item.custom_image||item.image)&&<img src={item.custom_image||item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                    {item.compare_price&&<div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor:pc}}>-{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%</div>}
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                      {item.headline&&isLarge&&<p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">{item.headline}</p>}
                      <h3 className={`font-black text-white leading-tight ${isLarge?'text-2xl sm:text-3xl':'text-base sm:text-lg'}`}>{item.name}</h3>
                      {isLarge&&item.description&&<p className="text-xs text-white/60 line-clamp-2 max-w-md">{item.description}</p>}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className={`font-black text-white ${isLarge?'text-2xl':'text-lg'}`}>{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-50">{store?.currency||'DZD'}</span></span>
                        <div className="flex items-center gap-2">
                          {qty>0&&<div className="flex items-center rounded-lg overflow-hidden bg-white/20 backdrop-blur-sm">
                            <button onClick={()=>setQty(item.product_id,-1)} className="px-2 py-1.5 text-white hover:bg-white/10"><Minus size={12}/></button>
                            <span className="px-2 py-1.5 text-white font-bold text-sm tabular-nums">{qty}</span>
                            <button onClick={()=>setQty(item.product_id,1)} className="px-2 py-1.5 text-white hover:bg-white/10"><Plus size={12}/></button>
                          </div>}
                          {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><Plus size={14}/></button>}
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

  /* ─── Product Card: Timeline ─── */
  const renderTimeline=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const isEven=idx%2===0;
    const total=page.items.length;
    return(
      <section key={item.product_id} style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <div className="max-w-5xl mx-auto px-5 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block" style={{backgroundColor:pc+'30'}}/>
          <Reveal animation={anim} delay={idx*100}>
            <div className={`flex flex-col md:flex-row items-center gap-8 py-12 ${isEven?'':'md:flex-row-reverse'}`}>
              <div className={`flex-1 ${isEven?'md:text-right md:pr-12':'md:text-left md:pl-12'}`}>
                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-xs font-bold" style={{backgroundColor:pc+'15',color:pc}}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{backgroundColor:pc}}>{idx+1}</span>
                  {item.headline||`Step ${idx+1}`}
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight mb-2" style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                {item.description&&<p className="text-sm opacity-60 mb-4 max-w-md" style={{color:page.text_color}}>{item.description}</p>}
                {item.features?.length>0&&<ul className="space-y-1.5 mb-4">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className={`text-xs flex items-center gap-2 ${isEven?'md:justify-end':''}`}><Check size={12} style={{color:pc}}/><span style={{color:page.text_color}}>{f}</span></li>)}</ul>}
                <div className={`flex items-center gap-3 ${isEven?'md:justify-end':''}`}>
                  <span className="text-2xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-sm opacity-50">{store?.currency||'DZD'}</span></span>
                  <div className="flex items-center rounded-lg overflow-hidden" style={{border:'1px solid oklch(0.9 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-2.5 py-1.5 hover:bg-gray-100"><Minus size={12}/></button>
                    <span className="px-3 py-1.5 font-bold text-sm tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-2.5 py-1.5 hover:bg-gray-100"><Plus size={12}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><ShoppingBag size={12}/></button>}
                </div>
              </div>
              <div className="hidden md:flex w-4 h-4 rounded-full border-4 shrink-0 z-10" style={{borderColor:pc,backgroundColor:page.bg_color||'#FAFAFA'}}/>
              <div className="flex-1">
                {(item.custom_image||item.image)?<img src={item.custom_image||item.image} alt={item.name} className="w-full max-w-sm mx-auto rounded-2xl shadow-xl object-cover aspect-square"/>:<div className="w-full max-w-sm mx-auto aspect-square rounded-2xl flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={48} className="opacity-20"/></div>}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Cards Gallery ─── */
  const renderCardsAll=()=>{
    const items=page.items||[];
    return(
      <section style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*80}>
                  <div className="rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group" style={{backgroundColor:'white'}}>
                    <div className="relative overflow-hidden aspect-[4/5]">
                      {(item.custom_image||item.image)?<img src={item.custom_image||item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>:<div className="w-full h-full flex items-center justify-center" style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={48} className="opacity-20"/></div>}
                      {item.compare_price&&<div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor:pc}}>-{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%</div>}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"/>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-2xl font-black text-white">{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-60">{store?.currency||'DZD'}</span></span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {item.headline&&<p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{color:pc}}>{item.headline}</p>}
                      <h3 className="text-lg font-extrabold tracking-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                      {item.description&&<p className="text-xs opacity-50 line-clamp-2" style={{color:page.text_color}}>{item.description}</p>}
                      {item.features?.length>0&&<div className="space-y-1">{item.features.filter(f=>f.trim()).slice(0,3).map((f,i)=><div key={i} className="flex items-center gap-1.5 text-xs"><Check size={10} style={{color:pc}}/><span style={{color:page.text_color}}>{f}</span></div>)}</div>}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.9 0.005 280)'}}>
                          <button onClick={()=>setQty(item.product_id,-1)} className="px-3 py-2 hover:bg-gray-100"><Minus size={13}/></button>
                          <span className="px-3 py-2 font-bold tabular-nums">{qty}</span>
                          <button onClick={()=>setQty(item.product_id,1)} className="px-3 py-2 hover:bg-gray-100"><Plus size={13}/></button>
                        </div>
                        {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><ShoppingBag size={14}/></button>}
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

  /* ─── Product Card: Cinematic ─── */
  const renderCinematic=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const hasImage=item.custom_image||item.image;
    return(
      <section key={item.product_id} className="relative min-h-[80vh] flex items-center overflow-hidden" style={{backgroundColor:'oklch(0.08 0.01 280)'}}>
        {hasImage&&<div className="absolute inset-0"><img src={hasImage} alt="" className="w-full h-full object-cover opacity-30 scale-110" style={{filter:'blur(2px) saturate(0.6)'}}/><div className="absolute inset-0" style={{background:`linear-gradient(135deg, oklch(0.06 0.02 280) 0%, transparent 50%), linear-gradient(to top, oklch(0.06 0.01 280) 0%, transparent 60%)`}}/></div>}
        <div className="relative max-w-6xl mx-auto px-5 py-20 w-full">
          <Reveal animation={anim} delay={150}>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                {item.headline&&<p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">{item.headline}</p>}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">{item.name}</h2>
                {item.description&&<p className="text-base text-white/50 leading-relaxed max-w-lg">{item.description}</p>}
                {item.features?.length>0&&<div className="flex flex-wrap gap-3 pt-2">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="px-4 py-2 rounded-full text-xs font-medium text-white/80 border border-white/10 backdrop-blur-sm">{f}</span>)}</div>}
                <div className="flex items-end gap-4 pt-4">
                  <div>
                    <span className="text-5xl font-black text-white tracking-tight">{parseFloat(item.price).toLocaleString()}</span>
                    <span className="text-lg text-white/40 ml-2 font-medium">{store?.currency||'DZD'}</span>
                  </div>
                  {item.compare_price&&<span className="text-2xl text-white/20 line-through font-medium">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10">
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-4 py-3 text-white hover:bg-white/10 transition-colors"><Minus size={16}/></button>
                    <span className="px-5 py-3 text-white font-bold text-lg tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-4 py-3 text-white hover:bg-white/10 transition-colors"><Plus size={16}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-8 py-3.5 rounded-2xl text-white font-bold shadow-2xl hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2" style={{backgroundColor:pc}}><ShoppingBag size={16}/>{t('lp.addToOrder','Add to Order')}</button>}
                </div>
              </div>
              {hasImage&&<div className="flex-1 max-w-lg"><div className="relative"><div className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-30" style={{backgroundColor:pc}}/><img src={hasImage} alt={item.name} className="relative w-full rounded-3xl shadow-2xl object-cover aspect-square ring-1 ring-white/10"/></div></div>}
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Minimal Zen ─── */
  const renderMinimalZen=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    return(
      <section key={item.product_id} style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <div className="max-w-2xl mx-auto px-5 py-20 sm:py-32 text-center">
          <Reveal animation="fade" delay={100}>
            <div className="space-y-8">
              {(item.custom_image||item.image)&&<img src={item.custom_image||item.image} alt={item.name} className="w-48 h-48 sm:w-64 sm:h-64 rounded-full mx-auto object-cover shadow-xl ring-4" style={{ringColor:pc+'20'}}/>}
              <div className="space-y-4">
                {item.headline&&<p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40" style={{color:page.text_color}}>{item.headline}</p>}
                <h2 className="text-3xl sm:text-4xl font-extralight tracking-wide" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
                <div className="w-12 h-px mx-auto" style={{backgroundColor:pc}}/>
                {item.description&&<p className="text-sm leading-loose opacity-50 max-w-md mx-auto" style={{color:page.text_color}}>{item.description}</p>}
              </div>
              {item.features?.length>0&&<div className="flex flex-wrap justify-center gap-4">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="text-xs font-light tracking-wider opacity-60" style={{color:page.text_color}}>— {f}</span>)}</div>}
              <div className="space-y-4 pt-4">
                <span className="text-3xl font-extralight tracking-wider" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} {store?.currency||'DZD'}</span>
                {item.compare_price&&<span className="text-lg text-gray-300 line-through ml-3">{parseFloat(item.compare_price).toLocaleString()}</span>}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex items-center rounded-full overflow-hidden" style={{border:'1px solid oklch(0.9 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-4 py-2.5 hover:bg-gray-50 transition-colors"><Minus size={14}/></button>
                    <span className="px-4 py-2.5 font-medium tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-4 py-2.5 hover:bg-gray-50 transition-colors"><Plus size={14}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-8 py-3 rounded-full font-medium text-sm tracking-wider text-white hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}>{t('lp.addToOrder','Add to Order')}</button>}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        {idx<(page.items||[]).length-1&&<div className="max-w-xs mx-auto h-px" style={{backgroundColor:pc+'15'}}/>}
      </section>
    );
  };

  /* ─── Product Card: Split Screen ─── */
  const renderSplitScreen=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const isEven=idx%2===0;
    const hasImage=item.custom_image||item.image;
    return(
      <section key={item.product_id} className="relative min-h-[70vh] flex">
        <div className={`flex flex-col md:flex-row w-full ${isEven?'':'md:flex-row-reverse'}`}>
          <div className="flex-1 relative overflow-hidden" style={{backgroundColor:'oklch(0.12 0.015 280)'}}>
            {hasImage?<img src={hasImage} alt={item.name} className="absolute inset-0 w-full h-full object-cover"/>:<div className="absolute inset-0 flex items-center justify-center" style={{backgroundColor:'oklch(0.15 0.01 280)'}}><Package size={64} className="text-white/10"/></div>}
            {item.compare_price&&<div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl text-sm font-black text-white" style={{backgroundColor:pc}}>-{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%</div>}
          </div>
          <div className="flex-1 flex items-center" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
            <Reveal animation={anim} delay={100}>
              <div className="p-10 sm:p-16 space-y-6 max-w-xl">
                {item.headline&&<p className="text-xs font-black uppercase tracking-[0.2em]" style={{color:pc}}>{item.headline}</p>}
                <h2 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
                {item.description&&<p className="text-sm leading-relaxed opacity-50" style={{color:page.text_color}}>{item.description}</p>}
                {item.features?.length>0&&<ul className="space-y-2">{item.features.filter(f=>f.trim()).map((f,i)=><li key={i} className="flex items-center gap-2.5 text-sm"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:pc}}/><span style={{color:page.text_color}}>{f}</span></li>)}</ul>}
                <div className="flex items-end gap-3 pt-2">
                  <span className="text-4xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()}</span>
                  <span className="text-base opacity-40 mb-1">{store?.currency||'DZD'}</span>
                  {item.compare_price&&<span className="text-xl text-gray-400 line-through mb-1">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.88 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-3.5 py-2.5 hover:bg-gray-100"><Minus size={15}/></button>
                    <span className="px-4 py-2.5 font-bold text-lg tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-3.5 py-2.5 hover:bg-gray-100"><Plus size={15}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2" style={{backgroundColor:pc}}><ShoppingBag size={15}/>{t('lp.addToOrder','Add to Order')}</button>}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Mosaic ─── */
  const renderMosaicAll=()=>{
    const items=page.items||[];
    return(
      <section style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
        <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
          <div className="space-y-4">
            {items.map((item,idx)=>{
              const qty=cart[item.product_id]||0;
              const isWide=idx%3===0;
              const hasImage=item.custom_image||item.image;
              return(
                <Reveal key={item.product_id} animation={anim} delay={idx*60}>
                  <div className={`rounded-3xl overflow-hidden ${isWide?'':'float-left w-full sm:w-[calc(50%-8px)] mr-4 mb-4'}`} style={{backgroundColor:'white',border:'1px solid oklch(0.93 0.005 280)'}}>
                    <div className={`flex ${isWide?'flex-col sm:flex-row':'flex-col'}`}>
                      <div className={`relative overflow-hidden ${isWide?'sm:w-2/5':'w-full'}`}>
                        {hasImage?<img src={hasImage} alt={item.name} className={`w-full object-cover ${isWide?'h-64 sm:h-full':'aspect-[3/2]'} transition-transform duration-500 hover:scale-105`}/>:<div className={`w-full flex items-center justify-center ${isWide?'h-64 sm:h-full':'aspect-[3/2]'}`} style={{backgroundColor:'oklch(0.93 0.005 280)'}}><Package size={36} className="opacity-20"/></div>}
                        {item.compare_price&&<div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor:pc}}>-{Math.round((1-parseFloat(item.price)/parseFloat(item.compare_price))*100)}%</div>}
                      </div>
                      <div className="flex-1 p-6 space-y-3">
                        {item.headline&&<p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{color:pc}}>{item.headline}</p>}
                        <h3 className={`font-extrabold tracking-tight ${isWide?'text-2xl':'text-lg'}`} style={{color:page.text_color||'#1F2937'}}>{item.name}</h3>
                        {item.description&&<p className="text-xs opacity-50 line-clamp-2" style={{color:page.text_color}}>{item.description}</p>}
                        {isWide&&item.features?.length>0&&<div className="flex flex-wrap gap-1.5">{item.features.filter(f=>f.trim()).map((f,i)=><span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:pc+'12',color:pc}}>{f}</span>)}</div>}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} <span className="text-xs opacity-50">{store?.currency||'DZD'}</span></span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-lg overflow-hidden" style={{border:'1px solid oklch(0.9 0.005 280)'}}>
                              <button onClick={()=>setQty(item.product_id,-1)} className="px-2 py-1.5 hover:bg-gray-100"><Minus size={12}/></button>
                              <span className="px-2 py-1.5 font-bold text-sm tabular-nums">{qty}</span>
                              <button onClick={()=>setQty(item.product_id,1)} className="px-2 py-1.5 hover:bg-gray-100"><Plus size={12}/></button>
                            </div>
                            {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="p-2 rounded-xl text-white shadow hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><ShoppingBag size={14}/></button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
            <div className="clear-both"/>
          </div>
        </div>
      </section>
    );
  };

  /* ─── Product Card: Storytelling ─── */
  const renderStorytelling=(item,idx)=>{
    const qty=cart[item.product_id]||0;
    const hasImage=item.custom_image||item.image;
    const chapterNum=String(idx+1).padStart(2,'0');
    return(
      <section key={item.product_id}>
        {hasImage&&(
          <div className="relative h-[50vh] overflow-hidden">
            <img src={hasImage} alt={item.name} className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{background:`linear-gradient(to bottom, transparent 40%, ${page.bg_color||'#FAFAFA'} 100%)`}}/>
            <div className="absolute top-8 left-8">
              <span className="text-6xl font-black text-white/10">{chapterNum}</span>
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto px-5 -mt-20 relative z-10 pb-16" style={{backgroundColor:'transparent'}}>
          <Reveal animation={anim} delay={100}>
            <div className="rounded-3xl p-8 sm:p-10 shadow-xl space-y-5" style={{backgroundColor:'white'}}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-30" style={{color:page.text_color}}>Chapter {chapterNum}</span>
                <div className="flex-1 h-px" style={{backgroundColor:pc+'20'}}/>
              </div>
              {item.headline&&<p className="text-sm font-bold" style={{color:pc}}>{item.headline}</p>}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight" style={{color:page.text_color||'#1F2937'}}>{item.name}</h2>
              {item.description&&<p className="text-sm leading-relaxed opacity-60" style={{color:page.text_color}}>{item.description}</p>}
              {item.features?.length>0&&<div className="space-y-2 py-2 border-l-2 pl-4" style={{borderColor:pc+'30'}}>
                {item.features.filter(f=>f.trim()).map((f,i)=><p key={i} className="text-sm" style={{color:page.text_color}}>{f}</p>)}
              </div>}
              <div className="flex items-center justify-between pt-4 border-t" style={{borderColor:'oklch(0.93 0.005 280)'}}>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()}</span>
                  <span className="text-sm opacity-40 mb-1">{store?.currency||'DZD'}</span>
                  {item.compare_price&&<span className="text-lg text-gray-400 line-through mb-0.5">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl overflow-hidden" style={{border:'1.5px solid oklch(0.9 0.005 280)'}}>
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-3 py-2 hover:bg-gray-100"><Minus size={13}/></button>
                    <span className="px-3 py-2 font-bold tabular-nums">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-3 py-2 hover:bg-gray-100"><Plus size={13}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:pc}}><ShoppingBag size={14}/></button>}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  };

  const renderProduct=(item,idx)=>{
    if(layoutStyle==='stacked')return renderStacked(item,idx);
    if(layoutStyle==='showcase')return renderShowcase(item,idx);
    if(layoutStyle==='magazine')return renderMagazine(item,idx);
    if(layoutStyle==='timeline')return renderTimeline(item,idx);
    if(layoutStyle==='cinematic')return renderCinematic(item,idx);
    if(layoutStyle==='minimal-zen')return renderMinimalZen(item,idx);
    if(layoutStyle==='split-screen')return renderSplitScreen(item,idx);
    if(layoutStyle==='storytelling')return renderStorytelling(item,idx);
    return renderAlternating(item,idx);
  };

  /* ─── Product-Hero: Landixo-style conversion-focused single-product layout ─── */
  const renderProductHeroAll=()=>{
    const items=page.items||[];
    const heroItem=items[0];
    if(!heroItem)return null;
    const currency=store?.currency||'DZD';
    const heroBg=page.hero_bg||'#1e3a5f';
    const ctaBg=page.cta_bg||'#10B981';
    const ctaTextColor=page.cta_text_color||'#FFF';
    const bgColor=page.bg_color||'#f8f9fa';
    const textColor=page.text_color||'#1F2937';

    // Auto-add first product to cart if nothing selected
    useEffect(()=>{
      if(heroItem&&!cart[heroItem.product_id])setCart(c=>({...c,[heroItem.product_id]:1}));
    },[]);

    return(
      <>
        {/* ── TRUST BAR ── */}
        <div className="w-full py-3 px-4" style={{backgroundColor:bgColor,borderBottom:'1px solid oklch(0.92 0.005 280)'}}>
          <div className="max-w-lg mx-auto flex items-center justify-center gap-5 flex-wrap">
            {[
              {icon:<Truck size={14}/>,label:t('lp.fastDelivery','توصيل سريع')},
              {icon:<CreditCard size={14}/>,label:t('lp.codShort','دفع عند الاستلام')},
              {icon:<Shield size={14}/>,label:t('lp.qualityGuarantee','ضمان الجودة')},
            ].map((b,i)=>(
              <div key={i} className="flex items-center gap-1.5 text-xs font-semibold" style={{color:textColor}}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor:pc+'15',color:pc}}>{b.icon}</div>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RATING BAR ── */}
        <div className="w-full py-2.5 flex items-center justify-center gap-2" style={{backgroundColor:bgColor}}>
          <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} size={14} fill="#FBBF24" color="#FBBF24"/>)}</div>
          <span className="text-sm font-bold" style={{color:textColor}}>4.9/5</span>
          <span className="text-xs opacity-50" style={{color:textColor}}>{t('lp.excellentRating','تقييم ممتاز')}</span>
        </div>

        {/* ── HERO PRODUCT SECTION ── */}
        <section className="relative overflow-hidden" style={{backgroundColor:heroBg}}>
          <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:`radial-gradient(circle at 50% 30%, white 0%, transparent 60%)`}}/>
          <div className="relative max-w-lg mx-auto px-5 py-10 text-center">
            <Reveal animation={anim}>
              {/* Product image */}
              <div className="relative mb-6">
                {heroItem.compare_price&&parseFloat(heroItem.compare_price)>0&&(
                  <div className="absolute top-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-black text-white" style={{backgroundColor:'#EF4444'}}>
                    -{Math.round((1-parseFloat(heroItem.price)/parseFloat(heroItem.compare_price))*100)}%
                  </div>
                )}
                {(heroItem.custom_image||heroItem.image)?
                  <img src={heroItem.custom_image||heroItem.image} alt={heroItem.name} className="w-full max-w-xs mx-auto rounded-2xl shadow-2xl object-cover aspect-square"/>
                  :<div className="w-full max-w-xs mx-auto aspect-square rounded-2xl flex items-center justify-center" style={{backgroundColor:'rgba(255,255,255,0.08)'}}><Package size={64} className="text-white/20"/></div>
                }
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight mb-3" style={{color:page.hero_text||'#FFF'}}>
                {page.hero_title||heroItem.headline||heroItem.name}
              </h1>
              <p className="text-sm opacity-70 mb-5 max-w-sm mx-auto" style={{color:page.hero_text||'#FFF'}}>
                {page.hero_subtitle||heroItem.description||''}
              </p>

              {/* Feature pills */}
              {heroItem.features?.length>0&&(
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  {heroItem.features.filter(f=>f.trim()).map((f,i)=>(
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm" style={{backgroundColor:'rgba(255,255,255,0.12)',color:page.hero_text||'#FFF',border:'1px solid rgba(255,255,255,0.15)'}}>
                      <Check size={11}/>{f}
                    </span>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-3xl font-black" style={{color:page.hero_text||'#FFF'}}>{parseFloat(heroItem.price).toLocaleString()} {currency}</span>
                {heroItem.compare_price&&<span className="text-lg line-through opacity-40" style={{color:page.hero_text||'#FFF'}}>{parseFloat(heroItem.compare_price).toLocaleString()}</span>}
              </div>

              {/* CTA Button */}
              <button onClick={scrollToCheckout} className="w-full max-w-sm mx-auto py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.97] transition-all" style={{backgroundColor:ctaBg,color:ctaTextColor}}>
                <ShoppingBag size={18}/>{page.cta_text||t('lp.orderNow','اطلب الآن')}
              </button>
            </Reveal>
          </div>
        </section>

        {/* ── ADDITIONAL PRODUCTS (if more than 1) ── */}
        {items.length>1&&(
          <section style={{backgroundColor:bgColor}}>
            <div className="max-w-lg mx-auto px-5 py-8">
              <p className="text-xs font-bold uppercase tracking-wider text-center mb-5 opacity-40" style={{color:textColor}}>{t('lp.moreProducts','منتجات أخرى')}</p>
              <div className="space-y-3">
                {items.slice(1).map((item,idx)=>{
                  const qty=cart[item.product_id]||0;
                  return(
                    <Reveal key={item.product_id} animation={anim} delay={idx*60}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm" style={{border:'1px solid oklch(0.93 0.005 280)'}}>
                        {(item.custom_image||item.image)?<img src={item.custom_image||item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0"/>:<div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0" style={{backgroundColor:'oklch(0.95 0.005 280)'}}><Package size={20} className="opacity-20"/></div>}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate" style={{color:textColor}}>{item.name}</h3>
                          {item.description&&<p className="text-[11px] opacity-50 line-clamp-1 mt-0.5" style={{color:textColor}}>{item.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-base font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} {currency}</span>
                            {item.compare_price&&<span className="text-xs text-gray-400 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {qty>0?(
                            <div className="flex items-center rounded-lg overflow-hidden" style={{border:'1px solid oklch(0.9 0.005 280)'}}>
                              <button onClick={()=>setQty(item.product_id,-1)} className="px-2 py-1.5 hover:bg-gray-100"><Minus size={12}/></button>
                              <span className="px-2 py-1.5 font-bold text-sm tabular-nums">{qty}</span>
                              <button onClick={()=>setQty(item.product_id,1)} className="px-2 py-1.5 hover:bg-gray-100"><Plus size={12}/></button>
                            </div>
                          ):(
                            <button onClick={()=>setQty(item.product_id,1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow hover:brightness-110 active:scale-[0.95] transition-all" style={{backgroundColor:pc}}><Plus size={16}/></button>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── INLINE ORDER FORM ── */}
        <section ref={checkoutRef} style={{backgroundColor:bgColor}}>
          <div className="max-w-lg mx-auto px-5 py-8">
            <Reveal animation={anim}>
              <div className="rounded-3xl shadow-xl p-6 space-y-5 bg-white" style={{border:'1px solid oklch(0.93 0.005 280)'}}>
                <h2 className="text-lg font-black text-center" style={{color:textColor}}>{t('lp.completeOrder','أكمل طلبك')}</h2>

                {/* Order summary — compact */}
                <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
                  {cartItems.map(it=>(
                    <div key={it.product_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {it.image&&<img src={it.image} className="w-8 h-8 rounded-lg object-cover"/>}
                        <span className="font-medium">{it.name} <span className="opacity-40">x{cart[it.product_id]}</span></span>
                      </div>
                      <span className="font-bold tabular-nums">{((parseFloat(it.price)||0)*(cart[it.product_id]||0)).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {cartItems.length===0&&<p className="text-xs text-center opacity-40">{t('lp.emptyCart','No products added')}</p>}
                  <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold" style={{borderColor:'oklch(0.9 0.005 280)'}}>
                    <span>{t('lp.total','Total')}</span>
                    <span style={{color:pc}} className="tabular-nums">{total.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <Input icon={User} label={t('lp.fullName','الاسم الكامل')} required value={form.customer_name} onChange={set('customer_name')} placeholder={t('lp.namePh','أدخل اسمك الكامل')}/>
                  <Input icon={Phone} label={t('lp.phone','رقم الهاتف')} required value={form.customer_phone} onChange={set('customer_phone')} placeholder="0555123456"/>
                  <Select icon={MapPin} label={t('lp.wilaya','الولاية')} required value={form.shipping_wilaya} onChange={set('shipping_wilaya')}>
                    <option value="">{t('checkout.selectWilaya','اختر الولاية...')}</option>
                    {wilayas.map(w=><option key={w.wilaya_code} value={w.wilaya_code}>{w.wilaya_code} - {w.name}</option>)}
                  </Select>
                  <div>
                    <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.commune','البلدية')} <span style={{color:pc}}>*</span></label>
                    {communes.length>0?
                      <select className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none bg-no-repeat" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:`oklch(0.99 0.002 280) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") right 12px center/16px no-repeat`}} value={form.shipping_city} onChange={set('shipping_city')}
                        onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
                        onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
                      >
                        <option value="">{t('checkout.selectCity','اختر البلدية...')}</option>
                        {communes.map((c,i)=><option key={i} value={typeof c==='string'?c:c.name}>{typeof c==='string'?c:c.name}</option>)}
                      </select>
                      :<input className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:'oklch(0.99 0.002 280)'}} value={form.shipping_city} onChange={set('shipping_city')} placeholder={form.shipping_wilaya?t('lp.enterCommune','أدخل البلدية'):t('checkout.selectWilayaFirst','اختر الولاية أولاً')} disabled={!form.shipping_wilaya}
                        onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
                        onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
                      />
                    }
                  </div>
                  <Input icon={MapPin} label={t('lp.address','العنوان')} value={form.shipping_address} onChange={set('shipping_address')} placeholder={t('lp.addressPh','الشارع، العمارة، الطابق...')}/>
                </div>

                {/* Delivery type */}
                {wilayas.length>0&&form.shipping_wilaya&&(
                  <div className="grid grid-cols-2 gap-2">
                    {[{type:'home',icon:Truck,label:t('checkout.homeDelivery','توصيل للمنزل')},{type:'desk',icon:Package,label:t('checkout.deskDelivery','مكتب / نقطة استلام')}].map(d=>(
                      <button key={d.type} onClick={()=>setForm(f=>({...f,shipping_type:d.type}))} className="p-3 rounded-xl text-xs font-semibold text-center transition-all flex flex-col items-center gap-1.5" style={{
                        border:`2px solid ${form.shipping_type===d.type?pc:'oklch(0.9 0.005 280)'}`,
                        backgroundColor:form.shipping_type===d.type?pc+'08':'transparent',
                      }}>
                        <d.icon size={16} style={{color:form.shipping_type===d.type?pc:'oklch(0.55 0.01 280)'}}/>{d.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Payment */}
                <div className="flex flex-wrap gap-2">
                  {[
                    store?.enable_cod!==false&&{method:'cod',label:t('lp.cod','الدفع عند الاستلام')},
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

                {/* Submit */}
                <button onClick={placeOrder} disabled={submitting||cartItems.length===0} className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2.5 shadow-xl hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-40" style={{backgroundColor:ctaBg,color:ctaTextColor}}>
                  {submitting?<Loader2 size={20} className="animate-spin"/>:<><ShoppingBag size={18}/>{page.cta_text||t('lp.placeOrder','تأكيد الطلب')} — {total.toLocaleString()} {currency}</>}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] opacity-50" style={{color:textColor}}>
                  <span className="flex items-center gap-1"><Lock size={10}/>{t('lp.secureCheckout','دفع آمن')}</span>
                  <span className="flex items-center gap-1"><Shield size={10}/>{t('lp.moneyBack','ضمان استرجاع')}</span>
                  <span className="flex items-center gap-1"><Truck size={10}/>{t('lp.allWilayas','كل الولايات')}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── TRUST SECTION (bottom) ── */}
        {showTrust&&(
          <section className="py-10" style={{backgroundColor:bgColor}}>
            <TrustBadges accent={pc} textColor={textColor}/>
          </section>
        )}
      </>
    );
  };

  const renderAllProducts=()=>{
    if(layoutStyle==='bento')return renderBentoAll();
    if(layoutStyle==='cards')return renderCardsAll();
    if(layoutStyle==='mosaic')return renderMosaicAll();
    if(layoutStyle==='product-hero')return null; // handled in main render
    return (page.items||[]).map((item,idx)=>renderProduct(item,idx));
  };

  /* ─── Floating cart indicator ─── */
  const FloatingCart=()=>{
    if(totalQty===0)return null;
    return(
      <button onClick={scrollToCheckout} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-5 pr-4 py-3 rounded-2xl text-white font-bold text-sm shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95" style={{backgroundColor:pc}}>
        <ShoppingBag size={18}/>
        <span>{totalQty} {t('lp.items','items')}</span>
        <span className="opacity-70">|</span>
        <span>{subtotal.toLocaleString()} {store?.currency||'DZD'}</span>
      </button>
    );
  };

  /* ─── Input component ─── */
  const Input=({icon:Icon,label,required,...props})=>(
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>
        {Icon&&<Icon size={12}/>}{label}{required&&<span style={{color:pc}}>*</span>}
      </label>
      <input className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:'oklch(0.99 0.002 280)',focusRingColor:pc}} {...props}
        onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
        onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
      />
    </div>
  );

  const Select=({icon:Icon,label,required,children,...props})=>(
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>
        {Icon&&<Icon size={12}/>}{label}{required&&<span style={{color:pc}}>*</span>}
      </label>
      <select className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none bg-no-repeat" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:`oklch(0.99 0.002 280) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") right 12px center/16px no-repeat`}} {...props}
        onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
        onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
      >{children}</select>
    </div>
  );

  /* ─── MAIN RENDER ─── */
  return(
    <div className="min-h-screen" style={{backgroundColor:page.bg_color||'#FAFAFA',color:page.text_color||'#1F2937'}}>
      <FloatingCart/>

      {layoutStyle==='product-hero'?(
        renderProductHeroAll()
      ):(
        <>
          {renderHero()}

          {/* Social proof between hero and products */}
          {showSocial&&(
            <div className="py-8" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
              <SocialProof accent={pc}/>
            </div>
          )}

          {/* Products */}
          {renderAllProducts()}

          {/* CTA divider before checkout */}
          <Reveal animation={anim}>
            <div className="py-12 text-center" style={{backgroundColor:page.bg_color||'#FAFAFA'}}>
              <p className="text-sm font-semibold opacity-50 mb-3" style={{color:page.text_color||'#1F2937'}}>{t('lp.readyToOrder','Ready to order?')}</p>
              <button onClick={scrollToCheckout} className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.97] inline-flex items-center gap-2" style={{backgroundColor:pc}}>
                <ShoppingBag size={16}/>{page.cta_text||t('lp.orderNow','Order Now')}
              </button>
            </div>
          </Reveal>

          {/* ═══ CHECKOUT ═══ */}
          <section ref={checkoutRef} className="relative overflow-hidden" style={{background:`linear-gradient(160deg, ${page.hero_bg||'oklch(0.22 0.04 280)'}, oklch(0.12 0.01 280))`}}>
            <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:`radial-gradient(circle at 30% 70%, white 0%, transparent 50%)`}}/>
            <div className="relative max-w-3xl mx-auto px-5 py-14 sm:py-20">
              <Reveal animation={anim}>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-8" style={{color:page.hero_text||'#FFF'}}>{t('lp.completeOrder','Complete Your Order')}</h2>
              </Reveal>
              <Reveal animation={anim} delay={150}>
                <div className="rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6" style={{backgroundColor:'#FFFFFF',color:'#1F2937'}}>
                  {/* Order summary */}
                  <div className="rounded-2xl p-5 space-y-3" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.yourOrder','Your Order')}</p>
                    {cartItems.length===0&&<p className="text-sm opacity-40 py-2">{t('lp.emptyCart','No products added yet. Scroll up to add products.')}</p>}
                    {cartItems.map(it=>(
                      <div key={it.product_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {it.image&&<img src={it.image} className="w-10 h-10 rounded-lg object-cover shadow-sm"/>}
                          <div>
                            <span className="text-sm font-semibold">{it.name}</span>
                            <span className="text-xs opacity-40 ml-2">x{cart[it.product_id]}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{((parseFloat(it.price)||0)*(cart[it.product_id]||0)).toLocaleString()} {store?.currency||'DZD'}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 space-y-2" style={{borderColor:'oklch(0.9 0.005 280)'}}>
                      <div className="flex justify-between text-sm"><span className="opacity-50">{t('lp.subtotal','Subtotal')}</span><span className="font-semibold tabular-nums">{subtotal.toLocaleString()} {store?.currency||'DZD'}</span></div>
                      <div className="flex justify-between text-sm"><span className="opacity-50">{t('lp.shipping','Shipping')}</span><span className="font-semibold tabular-nums">{form.shipping_wilaya?`${shippingPrice.toLocaleString()} ${store?.currency||'DZD'}`:'—'}</span></div>
                      <div className="flex justify-between text-lg font-extrabold pt-2 border-t" style={{borderColor:'oklch(0.9 0.005 280)'}}><span>{t('lp.total','Total')}</span><span style={{color:pc}} className="tabular-nums">{total.toLocaleString()} {store?.currency||'DZD'}</span></div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input icon={User} label={t('lp.fullName','Full Name')} required value={form.customer_name} onChange={set('customer_name')} placeholder={t('lp.namePh','Your full name')}/>
                    <Input icon={Phone} label={t('lp.phone','Phone')} required value={form.customer_phone} onChange={set('customer_phone')} placeholder="0555123456"/>
                    {store?.checkout_email&&<Input icon={Mail} label={t('lp.email','Email')} value={form.customer_email} onChange={set('customer_email')} placeholder="email@example.com"/>}
                    <Select icon={MapPin} label={t('lp.wilaya','Wilaya')} required value={form.shipping_wilaya} onChange={set('shipping_wilaya')}>
                      <option value="">{t('checkout.selectWilaya','Select wilaya...')}</option>
                      {wilayas.map(w=><option key={w.wilaya_code} value={w.wilaya_code}>{w.wilaya_code} - {w.name}</option>)}
                    </Select>
                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{color:'oklch(0.55 0.01 280)'}}>{t('lp.commune','Commune')} <span style={{color:pc}}>*</span></label>
                      {communes.length>0?
                        <select className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none bg-no-repeat" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:`oklch(0.99 0.002 280) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") right 12px center/16px no-repeat`}} value={form.shipping_city} onChange={set('shipping_city')}
                          onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
                          onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
                        >
                          <option value="">{t('checkout.selectCity','Select commune...')}</option>
                          {communes.map((c,i)=><option key={i} value={typeof c==='string'?c:c.name}>{typeof c==='string'?c:c.name}</option>)}
                        </select>
                        :<input className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2" style={{border:'1.5px solid oklch(0.9 0.005 280)',background:'oklch(0.99 0.002 280)'}} value={form.shipping_city} onChange={set('shipping_city')} placeholder={form.shipping_wilaya?t('lp.enterCommune','Enter commune'):t('checkout.selectWilayaFirst','Select wilaya first')} disabled={!form.shipping_wilaya}
                          onFocus={e=>{e.target.style.borderColor=pc;e.target.style.boxShadow=`0 0 0 3px ${pc}20`;}}
                          onBlur={e=>{e.target.style.borderColor='oklch(0.9 0.005 280)';e.target.style.boxShadow='none';}}
                        />
                      }
                    </div>
                    <div className="sm:col-span-2">
                      <Input icon={MapPin} label={t('lp.address','Address')} value={form.shipping_address} onChange={set('shipping_address')} placeholder={t('lp.addressPh','Street address, building, etc.')}/>
                    </div>
                  </div>

                  {/* Delivery type */}
                  {wilayas.length>0&&form.shipping_wilaya&&(
                    <div>
                      <label className="text-xs font-semibold mb-2.5 block" style={{color:'oklch(0.55 0.01 280)'}}>{t('checkout.deliveryType','Delivery Type')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{type:'home',icon:Truck,label:t('checkout.homeDelivery','Home Delivery')},{type:'desk',icon:Package,label:t('checkout.deskDelivery','Desk / Relay')}].map(d=>(
                          <button key={d.type} onClick={()=>setForm(f=>({...f,shipping_type:d.type}))} className="p-3.5 rounded-xl text-sm font-semibold text-left transition-all flex items-center gap-2.5" style={{
                            border:`2px solid ${form.shipping_type===d.type?pc:'oklch(0.9 0.005 280)'}`,
                            backgroundColor:form.shipping_type===d.type?pc+'08':'transparent',
                          }}>
                            <d.icon size={16} style={{color:form.shipping_type===d.type?pc:'oklch(0.55 0.01 280)'}}/>{d.label}
                          </button>
                        ))}
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

                  {/* Submit */}
                  <button onClick={placeOrder} disabled={submitting||cartItems.length===0} className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none" style={{backgroundColor:page.cta_bg||pc}}>
                    {submitting?<Loader2 size={20} className="animate-spin"/>:<><ShoppingBag size={18}/>{page.cta_text||t('lp.placeOrder','Place Order')} — {total.toLocaleString()} {store?.currency||'DZD'}</>}
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

      {/* Footer */}
      <footer className="py-8 text-center space-y-2" style={{backgroundColor:'oklch(0.97 0.005 280)'}}>
        <p className="text-xs" style={{color:'oklch(0.6 0.01 280)'}}>© {new Date().getFullYear()} {store?.name}. {t('lp.allRights','All rights reserved.')}</p>
        <Link to={`/s/${storeSlug}`} className="text-xs font-semibold hover:underline underline-offset-4 transition-colors" style={{color:pc}}>{t('lp.visitStore','Visit our full store')}</Link>
      </footer>
    </div>
  );
}
