import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Package, Heart, Truck, ShoppingCart, User } from 'lucide-react';
import { useCartStore, useWishlistStore, useAuthStore } from '../../hooks/useStore';

// The store's navigation icons (shop, favourites, tracking, cart, account),
// shared by every buyer page so they stay put when the buyer leaves the
// storefront. Before this they only existed on the storefront itself and
// vanished on the favourites, tracking, profile and sign-in pages.

function useStoreNavData(storeSlug, onCart) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cartCount = useCartStore(s => s.items.reduce((n, i) => n + (i.quantity || 0), 0));
  const wishlist = useWishlistStore();
  useEffect(() => { if (storeSlug) wishlist.init(storeSlug); }, [storeSlug]); // eslint-disable-line
  const favCount = wishlist.items.length;
  const { token, role } = useAuthStore();
  const loggedIn = !!token && role === 'customer';
  const openCart = () => {
    if (onCart) return onCart();
    if (!cartCount) { toast(t('store.cartEmpty', 'Your cart is empty'), { icon: '🛒' }); return; }
    navigate(`/s/${storeSlug}/checkout`);
  };
  return { t, cartCount, favCount, loggedIn, openCart };
}

// Phones: fixed bar along the bottom of the screen.
export function StoreBottomNav({ storeSlug, store, pc = '#7c3aed', dark = false, onCart }) {
  const { pathname } = useLocation();
  const { t, cartCount, favCount, loggedIn, openCart } = useStoreNavData(storeSlug, onCart);
  const base = `/s/${storeSlug}`;
  const accountPath = `${base}/${loggedIn ? 'profile' : 'auth'}`;
  const isOn = (p) => p === base ? pathname === base || pathname === base + '/' : pathname.startsWith(p);
  const item = (active) => `flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-xl relative ${active ? '' : (dark ? 'text-gray-500' : 'text-gray-400')} ${dark ? 'active:bg-white/10' : 'active:bg-gray-100'}`;
  const tint = (active) => (active ? { color: pc } : undefined);
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-stretch justify-around gap-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${dark ? 'bg-gray-900 border-t border-white/10' : 'bg-white border-t border-gray-100'}`}>
      <Link to={base} className={item(isOn(base))} style={tint(isOn(base))}><Package size={20} /><span className="text-[10px] font-bold">{t('store.shop', 'Shop')}</span></Link>
      <Link to={`${base}/favorites`} className={item(isOn(`${base}/favorites`))} style={tint(isOn(`${base}/favorites`))}>
        <Heart size={20} />
        {favCount > 0 && <span className="notif-badge" style={{ right: '25%' }}>{favCount}</span>}
        <span className="text-[10px] font-bold">{t('store.favorites', 'Favs')}</span>
      </Link>
      {store?.tracking_enabled !== false && (
        <Link to={`${base}/track`} className={item(isOn(`${base}/track`))} style={tint(isOn(`${base}/track`))}><Truck size={20} /><span className="text-[10px] font-bold">{t('store.track', 'Track')}</span></Link>
      )}
      <button type="button" onClick={openCart} className={item(isOn(`${base}/checkout`))} style={tint(isOn(`${base}/checkout`))}>
        <ShoppingCart size={20} />
        {cartCount > 0 && <span className="notif-badge" style={{ right: '25%' }}>{cartCount}</span>}
        <span className="text-[10px] font-bold">{t('store.cart', 'Cart')}</span>
      </button>
      <Link to={accountPath} className={item(isOn(`${base}/profile`) || isOn(`${base}/auth`))} style={tint(isOn(`${base}/profile`) || isOn(`${base}/auth`))}><User size={20} /><span className="text-[10px] font-bold">{t('store.account', 'Account')}</span></Link>
    </div>
  );
}

// Computers: the same icons inside a page header (hidden on phones, which
// use the bottom bar instead).
export function StoreHeaderIcons({ storeSlug, store, onCart, className = '' }) {
  const { t, cartCount, favCount, loggedIn, openCart } = useStoreNavData(storeSlug, onCart);
  const base = `/s/${storeSlug}`;
  const btn = 'p-2 hover:bg-white/20 rounded-full relative shrink-0';
  return (
    <div className={`hidden md:flex items-center gap-1 shrink-0 ${className}`}>
      <Link to={base} className={btn} title={t('store.shop', 'Shop')}><Package size={20} /></Link>
      <Link to={`${base}/${loggedIn ? 'profile' : 'auth'}`} className={btn} title={t('store.account', 'Account')}><User size={20} /></Link>
      {store?.tracking_enabled !== false && <Link to={`${base}/track`} className={btn} title={t('track.title', 'Track your order')}><Truck size={20} /></Link>}
      <Link to={`${base}/favorites`} className={btn} title={t('store.favoritesWord', 'Favorites')}>
        <Heart size={20} />{favCount > 0 && <span className="notif-badge">{favCount}</span>}
      </Link>
      <button type="button" onClick={openCart} className={btn} title={t('store.cart', 'Cart')}>
        <ShoppingCart size={20} />{cartCount > 0 && <span className="notif-badge">{cartCount}</span>}
      </button>
    </div>
  );
}
