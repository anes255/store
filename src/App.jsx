import React,{Suspense,lazy,useEffect,useState}from'react';import{Routes,Route,Navigate,useNavigate,useParams}from'react-router-dom';import{Toaster}from'react-hot-toast';import{useAuthStore}from'./hooks/useStore';import{getPlatformInfo,storeApi}from'./utils/api';

// The platform brand name is permanently "KyoMarket". The document title is
// hard-locked and never overridden by the API, even if platform_settings
// still contains the legacy "MultiStorePlatform" value. Only the favicon is
// allowed to be customised through the admin settings.
function PlatformMeta(){
  useEffect(()=>{
    document.title='KyoMarket';
    getPlatformInfo().then(r=>{
      const d=r.data||{};
      document.title='KyoMarket';
      if(d.favicon){let l=document.querySelector("link[rel~='icon']");if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l);}l.href=d.favicon;}
    }).catch(()=>{document.title='KyoMarket';});
  },[]);
  return null;
}

// Detect custom domain → redirect to correct store
const PLATFORM_HOSTS=['localhost','127.0.0.1','kyomarket.com','www.kyomarket.com'];
function CustomDomainRedirect(){
  const nav=useNavigate();
  const[checked,setChecked]=useState(false);
  useEffect(()=>{
    const host=window.location.hostname;
    // Skip if on platform domain or already on a store path
    if(PLATFORM_HOSTS.some(h=>host===h||host.endsWith('.'+h))||host.endsWith('.vercel.app')||host.endsWith('.onrender.com')){setChecked(true);return;}
    // Custom domain detected — lookup which store it belongs to
    storeApi.lookupDomain(host).then(r=>{
      if(r.data?.slug){
        const path=window.location.pathname;
        if(!path.startsWith('/'+r.data.slug)&&!path.startsWith('/s/'+r.data.slug)){
          nav('/'+r.data.slug+path,{replace:true});
        }
      }
      setChecked(true);
    }).catch(()=>setChecked(true));
  },[]);
  if(!checked)return<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-500 animate-spin"/></div>;
  return null;
}

// Platform
const LandingPage=lazy(()=>import('./pages/platform/LandingPage'));
const OwnerLogin=lazy(()=>import('./pages/platform/OwnerLogin'));
const OwnerRegister=lazy(()=>import('./pages/platform/OwnerRegister'));
const PlatformAdminLogin=lazy(()=>import('./pages/platform/PlatformAdminLogin'));
const PlatformAdminDashboard=lazy(()=>import('./pages/platform/PlatformAdminDashboard'));
// Store Owner
const StoreDashboard=lazy(()=>import('./pages/store/StoreDashboard'));
const StoreOrders=lazy(()=>import('./pages/store/StoreOrders'));
const StoreProducts=lazy(()=>import('./pages/store/StoreProducts'));
const StoreSettings=lazy(()=>import('./pages/store/StoreSettings'));
const StoreApps=lazy(()=>import('./pages/store/StoreApps'));
const StoreStaff=lazy(()=>import('./pages/store/StoreStaff'));
const StoreCustomers=lazy(()=>import('./pages/store/StoreCustomers'));
const CartRecovery=lazy(()=>import('./pages/store/CartRecovery'));
const StoreDomains=lazy(()=>import('./pages/store/StoreDomains'));
const StoreAnalytics=lazy(()=>import('./pages/store/StoreAnalytics'));
const StoreCosts=lazy(()=>import('./pages/store/StoreCosts'));
const StoreTaxes=lazy(()=>import('./pages/store/StoreTaxes'));
const StoreBilling=lazy(()=>import('./pages/store/StoreBilling'));
const StockManager=lazy(()=>import('./pages/store/StockManager'));
const ShippingWilayas=lazy(()=>import('./pages/store/ShippingWilayas'));
const ShippingPartners=lazy(()=>import('./pages/store/ShippingPartners'));
const HowToConnect=lazy(()=>import('./pages/store/HowToConnect'));
const Blacklist=lazy(()=>import('./pages/store/Blacklist'));
const AboutUs=lazy(()=>import('./pages/store/AboutUs'));
const FAQs=lazy(()=>import('./pages/store/FAQs'));
const ContactInfo=lazy(()=>import('./pages/store/ContactInfo'));
const OrderTracking=lazy(()=>import('./pages/store/OrderTracking'));
const TrackingOrders=lazy(()=>import('./pages/store/TrackingOrders'));
const SmartReviews=lazy(()=>import('./pages/store/SmartReviews'));
const TrackingPixels=lazy(()=>import('./pages/store/TrackingPixels'));
// Buyer
const Storefront=lazy(()=>import('./pages/buyer/Storefront'));
const ProductDetail=lazy(()=>import('./pages/buyer/ProductDetail'));
const Checkout=lazy(()=>import('./pages/buyer/Checkout'));
import CustomerAuth from'./pages/buyer/CustomerAuth';
const CustomerProfile=lazy(()=>import('./pages/buyer/CustomerProfile'));
const Favorites=lazy(()=>import('./pages/buyer/Favorites'));
const TrackOrder=lazy(()=>import('./pages/buyer/TrackOrder'));

const Loading=()=>(<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-500 animate-spin"/></div>);
const ProtectedRoute=({children,allowedRoles})=>{const{token,role}=useAuthStore();const isAdminArea=(allowedRoles&&allowedRoles.includes('platform_admin'))||(typeof window!=='undefined'&&window.location.pathname.startsWith('/admin'));const loginPath=isAdminArea?'/admin/login':'/login';if(!token)return<Navigate to={loginPath} replace/>;if(allowedRoles&&!allowedRoles.includes(role))return<Navigate to={loginPath} replace/>;return children;};
const RESERVED_SLUGS=new Set(['admin','dashboard','login','register','s','api','platform','owner','profile','favorites','checkout','auth','product']);
const SlugGuard=({children})=>{const{storeSlug}=useParams();if(RESERVED_SLUGS.has((storeSlug||'').toLowerCase()))return null;return children;};
const P=({children})=>(<ProtectedRoute allowedRoles={['store_owner']}>{children}</ProtectedRoute>);

export default function App(){return(<><PlatformMeta/><CustomDomainRedirect/><Toaster position="top-center" toastOptions={{style:{borderRadius:'12px',background:'#1f2937',color:'#fff',fontSize:'14px',fontWeight:500},success:{iconTheme:{primary:'#10b981',secondary:'#fff'}},error:{iconTheme:{primary:'#ef4444',secondary:'#fff'}}}}/><Suspense fallback={<Loading/>}><Routes>
<Route path="/" element={<LandingPage/>}/>
<Route path="/login" element={<OwnerLogin/>}/>
<Route path="/register" element={<OwnerRegister/>}/>
<Route path="/admin/login" element={<OwnerLogin/>}/>
<Route path="/admin/*" element={<ProtectedRoute allowedRoles={['platform_admin']}><PlatformAdminDashboard/></ProtectedRoute>}/>
{/* Store owner dashboard */}
<Route path="/dashboard" element={<P><StoreDashboard/></P>}/>
<Route path="/dashboard/orders" element={<P><StoreOrders/></P>}/>
<Route path="/dashboard/abandoned" element={<P><CartRecovery/></P>}/>
<Route path="/dashboard/preparing" element={<P><StoreOrders/></P>}/>
<Route path="/dashboard/orders-archive" element={<P><StoreOrders/></P>}/>
<Route path="/dashboard/products" element={<P><StoreProducts/></P>}/>
<Route path="/dashboard/stock" element={<P><StockManager/></P>}/>
<Route path="/dashboard/settings" element={<P><StoreSettings/></P>}/>
<Route path="/dashboard/store-settings" element={<P><StoreSettings/></P>}/>
<Route path="/dashboard/apps" element={<P><StoreApps/></P>}/>
<Route path="/dashboard/staff" element={<P><StoreStaff/></P>}/>
<Route path="/dashboard/customers" element={<P><StoreCustomers/></P>}/>
<Route path="/dashboard/blacklist" element={<P><Blacklist/></P>}/>
<Route path="/dashboard/domains" element={<P><StoreDomains/></P>}/>
<Route path="/dashboard/analytics" element={<P><StoreAnalytics/></P>}/>
<Route path="/dashboard/costs" element={<P><StoreCosts/></P>}/>
<Route path="/dashboard/taxes" element={<P><StoreTaxes/></P>}/>
<Route path="/dashboard/billing" element={<P><StoreBilling/></P>}/>
<Route path="/dashboard/shipping-wilayas" element={<P><ShippingWilayas/></P>}/>
<Route path="/dashboard/shipping-partners" element={<P><ShippingPartners/></P>}/>
<Route path="/dashboard/how-to-connect" element={<P><HowToConnect/></P>}/>
<Route path="/dashboard/about" element={<P><AboutUs/></P>}/>
<Route path="/dashboard/faqs" element={<P><FAQs/></P>}/>
<Route path="/dashboard/contact" element={<P><ContactInfo/></P>}/>
<Route path="/dashboard/order-tracking" element={<P><OrderTracking/></P>}/>
<Route path="/dashboard/tracking-orders" element={<P><TrackingOrders/></P>}/>
<Route path="/dashboard/smart-reviews" element={<P><SmartReviews/></P>}/>
<Route path="/dashboard/tracking-pixels" element={<P><TrackingPixels/></P>}/>
<Route path="/dashboard/form-settings" element={<P><StoreSettings/></P>}/>
<Route path="/dashboard/logo" element={<P><StoreSettings/></P>}/>
<Route path="/dashboard/themes" element={<P><StoreSettings/></P>}/>
<Route path="/dashboard/landing-pages" element={<P><StoreProducts/></P>}/>
<Route path="/dashboard/ai-intelligence" element={<P><StoreApps/></P>}/>
{/* Buyer - classic /s/ paths */}
<Route path="/s/:storeSlug" element={<Storefront/>}/>
<Route path="/s/:storeSlug/product/:productSlug" element={<ProductDetail/>}/>
<Route path="/s/:storeSlug/checkout" element={<Checkout/>}/>
<Route path="/s/:storeSlug/auth" element={<CustomerAuth/>}/>
<Route path="/s/:storeSlug/profile" element={<CustomerProfile/>}/>
<Route path="/s/:storeSlug/favorites" element={<Favorites/>}/>
<Route path="/s/:storeSlug/track" element={<TrackOrder/>}/>
{/* Buyer - clean slug homepage only. Subpages use /s/:storeSlug/... to
    avoid conflicting with reserved top-level paths like /admin/profile. */}
<Route path="/:storeSlug" element={<SlugGuard><Storefront/></SlugGuard>}/>
</Routes></Suspense></>);}
