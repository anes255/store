import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useStoreManagement } from '../../hooks/useStore';
import LanguageSwitcher from './LanguageSwitcher';
import { LayoutDashboard, ShoppingCart, Package, Settings, Users, ChevronDown, ChevronLeft, Globe, Zap, UserPlus, LogOut, Search, Bell, Menu, X, Eye } from 'lucide-react';

const menuItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'orders', icon: ShoppingCart, path: '/dashboard/orders', children: [{ key: 'orders', path: '/dashboard/orders' }, { key: 'abandonedOrders', path: '/dashboard/abandoned' }] },
  { key: 'products', icon: Package, path: '/dashboard/products' },
  { key: 'customers', icon: Users, path: '/dashboard/customers' },
  { key: 'apps', icon: Zap, path: '/dashboard/apps' },
  { key: 'staff', icon: UserPlus, path: '/dashboard/staff' },
  { key: 'domains', icon: Globe, path: '/dashboard/domains' },
  { key: 'settings', icon: Settings, path: '/dashboard/settings' },
];

export default function DashboardLayout({ children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentStore } = useStoreManagement();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  const isActive = (path) => location.pathname === path;
  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/30">
            {currentStore?.name?.[0] || 'S'}
          </div>
          {sidebarOpen && (<div className="flex-1 min-w-0"><h3 className="font-bold text-sm text-gray-900 truncate">{currentStore?.name || 'My Store'}</h3><p className="text-xs text-gray-400 truncate">STORE DASHBOARD</p></div>)}
        </div>
      </div>
      {sidebarOpen && (<div className="px-4 pt-4"><div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-gray-400 text-sm"><Search size={14} /><span>Search...</span></div></div>)}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sidebarOpen ? 'MAIN MENU' : '•••'}</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path) || item.children?.some(c => isActive(c.path));
          const expanded = expandedMenus[item.key];
          return (
            <div key={item.key}>
              <Link to={item.children ? '#' : item.path} onClick={item.children ? (e) => { e.preventDefault(); toggleMenu(item.key); } : undefined} className={active ? 'sidebar-link-active' : 'sidebar-link'}>
                <Icon size={18} />
                {sidebarOpen && (<><span className="flex-1">{t(`sidebar.${item.key}`)}</span>{item.children && (<ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />)}</>)}
              </Link>
              {item.children && expanded && sidebarOpen && (
                <div className="ml-9 mt-1 space-y-0.5">
                  {item.children.map((child) => (<Link key={child.key} to={child.path} className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive(child.path) ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>{t(`sidebar.${child.key}`)}</Link>))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center"><span className="text-sm font-bold text-brand-600">{user?.name?.[0] || 'U'}</span></div>{sidebarOpen && (<div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p><p className="text-xs text-gray-400">Admin</p></div>)}</div>
        <button onClick={handleLogout} className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"><LogOut size={16} />{sidebarOpen && <span>Logout</span>}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} fixed h-full z-30`}><SidebarContent /><button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-7 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"><ChevronLeft size={12} className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} /></button></aside>
      {mobileOpen && (<div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl"><SidebarContent /></aside></div>)}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-4"><button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div><p className="text-xs text-gray-400 font-medium">STORE DASHBOARD</p><h1 className="text-lg font-bold text-gray-900 font-display">{currentStore?.name || 'Dashboard'}</h1></div></div>
            <div className="flex items-center gap-3">
              {currentStore?.is_live && (<span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />1 Live</span>)}
              <Link to={`/s/${currentStore?.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Eye size={18} /></Link>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
              <LanguageSwitcher compact />
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
