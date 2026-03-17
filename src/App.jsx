import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './hooks/useStore';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/platform/LandingPage'));
const OwnerLogin = lazy(() => import('./pages/platform/OwnerLogin'));
const OwnerRegister = lazy(() => import('./pages/platform/OwnerRegister'));
const PlatformAdminLogin = lazy(() => import('./pages/platform/PlatformAdminLogin'));
const PlatformAdminDashboard = lazy(() => import('./pages/platform/PlatformAdminDashboard'));
const StoreDashboard = lazy(() => import('./pages/store/StoreDashboard'));
const StoreOrders = lazy(() => import('./pages/store/StoreOrders'));
const StoreProducts = lazy(() => import('./pages/store/StoreProducts'));
const StoreSettings = lazy(() => import('./pages/store/StoreSettings'));
const StoreApps = lazy(() => import('./pages/store/StoreApps'));
const StoreStaff = lazy(() => import('./pages/store/StoreStaff'));
const StoreCustomers = lazy(() => import('./pages/store/StoreCustomers'));
const CartRecovery = lazy(() => import('./pages/store/CartRecovery'));
const StoreDomains = lazy(() => import('./pages/store/StoreDomains'));
const Storefront = lazy(() => import('./pages/buyer/Storefront'));
const ProductDetail = lazy(() => import('./pages/buyer/ProductDetail'));
const Checkout = lazy(() => import('./pages/buyer/Checkout'));
const CustomerProfile = lazy(() => import('./pages/buyer/CustomerProfile'));
const CustomerAuth = lazy(() => import('./pages/buyer/CustomerAuth'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
      <p className="text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: { borderRadius: '12px', background: '#1f2937', color: '#fff', fontSize: '14px', fontWeight: 500 },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
      
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Platform / Landing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<OwnerLogin />} />
          <Route path="/register" element={<OwnerRegister />} />
          
          {/* Platform Admin */}
          <Route path="/admin/login" element={<PlatformAdminLogin />} />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['platform_admin']}>
              <PlatformAdminDashboard />
            </ProtectedRoute>
          } />

          {/* Store Owner Dashboard */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute allowedRoles={['store_owner']}>
              <StoreDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orders" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreOrders /></ProtectedRoute>} />
          <Route path="/dashboard/products" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreProducts /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreSettings /></ProtectedRoute>} />
          <Route path="/dashboard/apps" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreApps /></ProtectedRoute>} />
          <Route path="/dashboard/staff" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreStaff /></ProtectedRoute>} />
          <Route path="/dashboard/customers" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreCustomers /></ProtectedRoute>} />
          <Route path="/dashboard/abandoned" element={<ProtectedRoute allowedRoles={['store_owner']}><CartRecovery /></ProtectedRoute>} />
          <Route path="/dashboard/domains" element={<ProtectedRoute allowedRoles={['store_owner']}><StoreDomains /></ProtectedRoute>} />

          {/* Buyer / Storefront */}
          <Route path="/s/:storeSlug" element={<Storefront />} />
          <Route path="/s/:storeSlug/product/:productSlug" element={<ProductDetail />} />
          <Route path="/s/:storeSlug/checkout" element={<Checkout />} />
          <Route path="/s/:storeSlug/auth" element={<CustomerAuth />} />
          <Route path="/s/:storeSlug/profile" element={<CustomerProfile />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
