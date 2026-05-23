import React,{useState,useEffect,useRef}from'react';
import{useParams,Link}from'react-router-dom';
import{useTranslation}from'react-i18next';
import{storeApi}from'../../utils/api';
import{useAuthStore}from'../../hooks/useStore';
import toast from'react-hot-toast';
import{ShoppingBag,Check,Star,Truck,Shield,ChevronDown,Plus,Minus,Phone,MapPin,User,Mail,CreditCard,Lock,Loader2,Package}from'lucide-react';

export default function BuyerLandingPage(){
  const{storeSlug,landingSlug}=useParams();
  const{t}=useTranslation();
  const[store,setStore]=useState(null);
  const[page,setPage]=useState(null);
  const[loading,setLoading]=useState(true);
  const[notFound,setNotFound]=useState(false);
  // Cart: each item can have quantity
  const[cart,setCart]=useState({});
  // Checkout form
  const[form,setForm]=useState({customer_name:'',customer_phone:'',customer_email:'',shipping_wilaya:'',shipping_city:'',shipping_address:'',shipping_type:'home',payment_method:'cod',notes:'',delivery_company_id:'',notification_preference:'whatsapp'});
  const[wilayas,setWilayas]=useState([]);
  const[communes,setCommunes]=useState([]);
  const[shippingPrice,setShippingPrice]=useState(0);
  const[submitting,setSubmitting]=useState(false);
  const[orderSuccess,setOrderSuccess]=useState(null);
  const[companies,setCompanies]=useState([]);
  const checkoutRef=useRef(null);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  // Load saved info
  useEffect(()=>{
    try{const s=JSON.parse(localStorage.getItem('checkout.savedInfo'));if(s)setForm(f=>({...f,...s}));}catch{}
  },[]);

  useEffect(()=>{
    if(!storeSlug)return;
    (async()=>{
      try{
        const{data:storeData}=await storeApi.getStore(storeSlug);
        setStore(storeData);
        // Find landing page — check both top-level and config
        const lps=Array.isArray(storeData.landing_pages)?storeData.landing_pages:
                  Array.isArray(storeData.config?.landing_pages)?storeData.config.landing_pages.filter(p=>p.enabled):[];
        const lp=lps.find(p=>p.slug===landingSlug&&p.enabled);
        if(!lp){setNotFound(true);setLoading(false);return;}
        setPage(lp);
        // Init cart with qty 1 for first product
        const initCart={};
        lp.items.forEach((it,i)=>{initCart[it.product_id]=i===0?1:0;});
        setCart(initCart);
        // Load shipping
        try{
          const{data:wData}=await storeApi.getShippingWilayas(storeSlug);
          const w=Array.isArray(wData)?wData:(wData?.wilayas||[]);
          setWilayas(w.filter(x=>x.is_active!==false));
        }catch{}
        // Load delivery companies
        try{
          const{data:cData}=await storeApi.getDeliveryCompanies?.(storeSlug)||{data:[]};
          if(Array.isArray(cData))setCompanies(cData);
        }catch{}
      }catch(e){
        if(e.response?.status===403)setNotFound(true);
        else setNotFound(true);
      }
      setLoading(false);
    })();
  },[storeSlug,landingSlug]);

  // Update shipping when wilaya changes
  useEffect(()=>{
    if(!form.shipping_wilaya||!wilayas.length)return;
    const w=wilayas.find(x=>String(x.wilaya_code)===String(form.shipping_wilaya)||x.name===form.shipping_wilaya);
    if(w){
      setShippingPrice(form.shipping_type==='desk'?(w.desk_price||w.home_price||400):(w.home_price||400));
      // Get communes
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

  const isValidPhone=(p)=>/^(0)(5|6|7)\d{8}$/.test((p||'').replace(/\s/g,''));

  const placeOrder=async()=>{
    if(!form.customer_name)return toast.error(t('checkout.errName','Please enter your name'));
    if(!isValidPhone(form.customer_phone))return toast.error(t('checkout.errPhoneAlg','Please enter a valid Algerian phone'));
    if(!form.shipping_wilaya)return toast.error(t('checkout.errWilaya','Please choose your wilaya'));
    if(!form.shipping_city)return toast.error(t('checkout.errCity','Please choose your commune'));
    if(!form.payment_method)return toast.error(t('checkout.errPay','Please choose a payment method'));
    if(!cartItems.length)return toast.error(t('lp.noItemsInCart','Add at least one product'));
    // Save info
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

  if(loading)return(<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-violet-500 animate-spin"/></div>);
  if(notFound)return(<div className="min-h-screen flex flex-col items-center justify-center bg-white"><Package size={48} className="text-gray-300 mb-3"/><p className="text-gray-500 font-bold">{t('lp.pageNotFound','Page not found')}</p><Link to={`/s/${storeSlug}`} className="text-violet-500 text-sm mt-2 hover:underline">{t('lp.goToStore','Go to store')}</Link></div>);
  if(orderSuccess)return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor:page.hero_bg||'#7C3AED'}}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-emerald-600"/></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{t('lp.orderSuccess','Order Placed Successfully!')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('lp.orderSuccessDesc','Thank you for your order. We will contact you shortly to confirm.')}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">{t('lp.orderNumber','Order')}</span><span className="font-mono font-bold">#{orderSuccess.order_number||orderSuccess.id}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">{t('lp.orderTotal','Total')}</span><span className="font-bold">{total.toLocaleString()} {store?.currency||'DZD'}</span></div>
        </div>
        <Link to={`/s/${storeSlug}`} className="inline-block mt-6 px-6 py-3 rounded-xl text-white font-bold text-sm" style={{backgroundColor:pc}}>{t('lp.continueShopping','Continue Shopping')}</Link>
      </div>
    </div>
  );

  return(
    <div className="min-h-screen" style={{backgroundColor:page.bg_color||'#FFFFFF',color:page.text_color||'#1F2937'}}>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{backgroundColor:page.hero_bg||'#7C3AED'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)'}}/>
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          {store?.logo&&<img src={store.logo} alt="" className="w-14 h-14 rounded-xl mx-auto mb-4 shadow-lg"/>}
          <h1 className="text-3xl sm:text-5xl font-black leading-tight" style={{color:page.hero_text||'#FFF'}}>{page.hero_title||store?.name}</h1>
          <p className="mt-4 text-base sm:text-lg opacity-90 max-w-2xl mx-auto" style={{color:page.hero_text||'#FFF'}}>{page.hero_subtitle}</p>
          <button onClick={scrollToCheckout} className="mt-8 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-2" style={{backgroundColor:page.cta_bg||'#10B981',color:page.cta_text_color||'#FFF'}}>
            <ShoppingBag size={20}/>{page.cta_text||t('lp.orderNow','Order Now')}
          </button>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm opacity-80" style={{color:page.hero_text||'#FFF'}}>
            <span className="flex items-center gap-1"><Truck size={14}/>{t('lp.freeDelivery','Fast Delivery')}</span>
            <span className="flex items-center gap-1"><Shield size={14}/>{t('lp.secure','Secure Payment')}</span>
            <span className="flex items-center gap-1"><Check size={14}/>{t('lp.guarantee','Guaranteed')}</span>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS — each is a full-screen section ═══ */}
      {page.items.map((item,idx)=>{
        const qty=cart[item.product_id]||0;
        const isEven=idx%2===0;
        return(
        <section key={item.product_id} className={`py-12 sm:py-20 ${isEven?'':'bg-gray-50'}`}>
          <div className="max-w-5xl mx-auto px-4">
            {item.headline&&<p className="text-sm font-bold uppercase tracking-wider mb-2" style={{color:pc}}>{item.headline}</p>}
            <div className={`flex flex-col ${isEven?'md:flex-row':'md:flex-row-reverse'} gap-8 items-center`}>
              {/* Image */}
              <div className="flex-1 w-full">
                {(item.custom_image||item.image)?
                  <img src={item.custom_image||item.image} alt={item.name} className="w-full max-w-md mx-auto rounded-2xl shadow-xl object-cover aspect-square"/>
                  :<div className="w-full max-w-md mx-auto aspect-square rounded-2xl bg-gray-200 flex items-center justify-center"><Package size={64} className="text-gray-300"/></div>
                }
              </div>
              {/* Info */}
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black">{item.name}</h2>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
                {/* Features */}
                {item.features?.length>0&&<ul className="space-y-2">
                  {item.features.filter(f=>f.trim()).map((f,i)=>(
                    <li key={i} className="flex items-start gap-2 text-sm"><Check size={16} className="shrink-0 mt-0.5" style={{color:pc}}/><span>{f}</span></li>
                  ))}
                </ul>}
                {/* Price */}
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black" style={{color:pc}}>{parseFloat(item.price).toLocaleString()} {store?.currency||'DZD'}</span>
                  {item.compare_price&&<span className="text-lg text-gray-400 line-through">{parseFloat(item.compare_price).toLocaleString()}</span>}
                </div>
                {/* Quantity + Add */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={()=>setQty(item.product_id,-1)} className="px-3 py-2 hover:bg-gray-100 transition-colors"><Minus size={16}/></button>
                    <span className="px-4 py-2 font-bold text-lg min-w-[3rem] text-center">{qty}</span>
                    <button onClick={()=>setQty(item.product_id,1)} className="px-3 py-2 hover:bg-gray-100 transition-colors"><Plus size={16}/></button>
                  </div>
                  {qty===0&&<button onClick={()=>setQty(item.product_id,1)} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all" style={{backgroundColor:pc}}>
                    <ShoppingBag size={14} className="inline mr-1"/>{t('lp.addToOrder','Add to Order')}
                  </button>}
                </div>
              </div>
            </div>
          </div>
        </section>
        );
      })}

      {/* ═══ CHECKOUT SECTION ═══ */}
      <section ref={checkoutRef} className="py-12 sm:py-20" style={{backgroundColor:page.hero_bg||'#7C3AED'}}>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-8" style={{color:page.hero_text||'#FFF'}}>{t('lp.completeOrder','Complete Your Order')}</h2>
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6" style={{color:'#1F2937'}}>
            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('lp.yourOrder','Your Order')}</p>
              {cartItems.length===0&&<p className="text-sm text-gray-400 py-2">{t('lp.emptyCart','No products added yet. Scroll up to add products.')}</p>}
              {cartItems.map(it=>(
                <div key={it.product_id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    {it.image&&<img src={it.image} className="w-8 h-8 rounded object-cover"/>}
                    <span className="text-sm font-medium">{it.name} × {cart[it.product_id]}</span>
                  </div>
                  <span className="text-sm font-bold">{((parseFloat(it.price)||0)*(cart[it.product_id]||0)).toLocaleString()} {store?.currency||'DZD'}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('lp.subtotal','Subtotal')}</span><span className="font-bold">{subtotal.toLocaleString()} {store?.currency||'DZD'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('lp.shipping','Shipping')}</span><span className="font-bold">{form.shipping_wilaya?`${shippingPrice.toLocaleString()} ${store?.currency||'DZD'}`:'—'}</span></div>
                <div className="flex justify-between text-lg font-black pt-1 border-t border-gray-200"><span>{t('lp.total','Total')}</span><span style={{color:pc}}>{total.toLocaleString()} {store?.currency||'DZD'}</span></div>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><User size={12}/>{t('lp.fullName','Full Name')} *</label><input className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" value={form.customer_name} onChange={set('customer_name')} placeholder={t('lp.namePh','Your full name')}/></div>
              <div><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Phone size={12}/>{t('lp.phone','Phone')} *</label><input className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" value={form.customer_phone} onChange={set('customer_phone')} placeholder="0555123456"/></div>
              {store?.checkout_email&&<div><label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Mail size={12}/>{t('lp.email','Email')}</label><input className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" value={form.customer_email} onChange={set('customer_email')} placeholder="email@example.com"/></div>}
              <div>
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><MapPin size={12}/>{t('lp.wilaya','Wilaya')} *</label>
                <select className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white" value={form.shipping_wilaya} onChange={set('shipping_wilaya')}>
                  <option value="">{t('checkout.selectWilaya','Select wilaya...')}</option>
                  {wilayas.map(w=><option key={w.wilaya_code} value={w.wilaya_code}>{w.wilaya_code} - {w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">{t('lp.commune','Commune')} *</label>
                {communes.length>0?
                  <select className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white" value={form.shipping_city} onChange={set('shipping_city')}>
                    <option value="">{t('checkout.selectCity','Select commune...')}</option>
                    {communes.map((c,i)=><option key={i} value={typeof c==='string'?c:c.name}>{typeof c==='string'?c:c.name}</option>)}
                  </select>
                  :<input className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" value={form.shipping_city} onChange={set('shipping_city')} placeholder={form.shipping_wilaya?t('lp.enterCommune','Enter commune'):t('checkout.selectWilayaFirst','Select wilaya first')} disabled={!form.shipping_wilaya}/>
                }
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500">{t('lp.address','Address')}</label><input className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" value={form.shipping_address} onChange={set('shipping_address')} placeholder={t('lp.addressPh','Street address, building, etc.')}/></div>
            </div>

            {/* Delivery type */}
            {wilayas.length>0&&form.shipping_wilaya&&<div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">{t('checkout.deliveryType','Delivery Type')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>setForm(f=>({...f,shipping_type:'home'}))} className={`p-3 rounded-xl border-2 text-sm font-bold text-left transition-all ${form.shipping_type==='home'?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}>
                  <Truck size={16} className="mb-1"/>{t('checkout.homeDelivery','Home Delivery')}
                </button>
                <button onClick={()=>setForm(f=>({...f,shipping_type:'desk'}))} className={`p-3 rounded-xl border-2 text-sm font-bold text-left transition-all ${form.shipping_type==='desk'?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}>
                  <Package size={16} className="mb-1"/>{t('checkout.deskDelivery','Desk / Relay')}
                </button>
              </div>
            </div>}

            {/* Payment */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">{t('checkout.paymentMethod','Payment Method')}</label>
              <div className="space-y-2">
                {store?.enable_cod!==false&&<button onClick={()=>setForm(f=>({...f,payment_method:'cod'}))} className={`w-full p-3 rounded-xl border-2 text-sm font-bold text-left flex items-center gap-3 transition-all ${form.payment_method==='cod'?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}><CreditCard size={16}/>{t('lp.cod','Cash on Delivery')}</button>}
                {store?.enable_ccp&&<button onClick={()=>setForm(f=>({...f,payment_method:'ccp'}))} className={`w-full p-3 rounded-xl border-2 text-sm font-bold text-left flex items-center gap-3 transition-all ${form.payment_method==='ccp'?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}><CreditCard size={16}/>CCP</button>}
                {store?.enable_baridimob&&<button onClick={()=>setForm(f=>({...f,payment_method:'baridimob'}))} className={`w-full p-3 rounded-xl border-2 text-sm font-bold text-left flex items-center gap-3 transition-all ${form.payment_method==='baridimob'?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}><CreditCard size={16}/>BaridiPay</button>}
              </div>
            </div>

            {/* Submit */}
            <button onClick={placeOrder} disabled={submitting||cartItems.length===0} className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50" style={{backgroundColor:page.cta_bg||pc}}>
              {submitting?<Loader2 size={20} className="animate-spin"/>:<><ShoppingBag size={20}/>{page.cta_text||t('lp.placeOrder','Place Order')} — {total.toLocaleString()} {store?.currency||'DZD'}</>}
            </button>
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><Lock size={10}/>{t('lp.secureCheckout','Secure checkout')}</span>
              <span className="flex items-center gap-1"><Shield size={10}/>{t('lp.moneyBack','Money-back guarantee')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 bg-gray-50">
        <p>© {new Date().getFullYear()} {store?.name}. {t('lp.allRights','All rights reserved.')}</p>
        <Link to={`/s/${storeSlug}`} className="text-violet-500 hover:underline mt-1 inline-block">{t('lp.visitStore','Visit our full store')}</Link>
      </footer>
    </div>
  );
}
