import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Each buyer page mounts its own bar, so remember where the bubble was to
// let it glide from the previous tab after navigation.
let lastActive = { idx: -1, n: 0 };

// Phones: fixed bar along the bottom of the screen. The active tab sits in a
// floating bubble. Switching tabs: the bubble glides over, swelling while it
// travels (empty — the old icon drops back into the bar), and the new icon
// pops into it once it lands. The cart badge pops whenever the count changes.
export function StoreBottomNav({ storeSlug, store, pc = '#7c3aed', dark = false, onCart }) {
  const { pathname } = useLocation();
  const { t, cartCount, favCount, loggedIn, openCart } = useStoreNavData(storeSlug, onCart);
  const base = `/s/${storeSlug}`;
  const accountPath = `${base}/${loggedIn ? 'profile' : 'auth'}`;
  const isOn = (p) => p === base ? pathname === base || pathname === base + '/' : pathname.startsWith(p);
  const tabs = [
    { key: 'shop', to: base, icon: Package, label: t('store.shop', 'Shop'), on: isOn(base) },
    { key: 'favs', to: `${base}/favorites`, icon: Heart, label: t('store.favorites', 'Favs'), on: isOn(`${base}/favorites`), badge: favCount },
    store?.tracking_enabled !== false && { key: 'track', to: `${base}/track`, icon: Truck, label: t('store.track', 'Track'), on: isOn(`${base}/track`) },
    { key: 'cart', onClick: openCart, icon: ShoppingCart, label: t('store.cart', 'Cart'), on: isOn(`${base}/checkout`), badge: cartCount },
    { key: 'account', to: accountPath, icon: User, label: t('store.account', 'Account'), on: isOn(`${base}/profile`) || isOn(`${base}/auth`) },
  ].filter(Boolean);
  const activeIdx = tabs.findIndex(x => x.on);
  const n = tabs.length;
  // previous active tab: from the last render, or from the bar on the page we came from
  const prevRef = useRef(lastActive.n === n ? lastActive.idx : -1);
  const prev = prevRef.current;
  useEffect(() => { prevRef.current = activeIdx; lastActive = { idx: activeIdx, n }; }, [activeIdx, n]);
  const moved = prev >= 0 && prev !== activeIdx;
  const posOf = (i) => `calc(${((i + 0.5) / n) * 100}% - 24px)`;
  const barBg = dark ? '#111827' : '#ffffff';
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${dark ? 'border-t border-white/10' : 'border-t border-gray-100'}`} style={{ backgroundColor: barBg }}>
      <div className="relative flex items-stretch">
        {/* gliding bubble behind the active tab */}
        {activeIdx >= 0 && (
          <motion.div key={`bubble-${activeIdx}`} aria-hidden className="absolute -top-5 w-12 h-12 rounded-full pointer-events-none"
            initial={moved ? { left: posOf(prev), scale: 1 } : false}
            animate={{ left: posOf(activeIdx), scale: moved ? [1, 1.22, 1] : 1 }}
            transition={{ left: { type: 'spring', stiffness: 380, damping: 30 }, scale: { duration: 0.45, times: [0, 0.45, 1], ease: 'easeInOut' } }}
            style={{ backgroundColor: pc, boxShadow: `0 8px 20px ${pc}66, 0 0 0 5px ${barBg}` }} />
        )}
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = i === activeIdx;
          const inner = (
            <>
              <motion.span key={tab.key + (active ? '-on' : '-off')} className="relative z-10 grid place-items-center w-12 h-8"
                initial={!moved ? false : active ? { y: -14, scale: 0.3, opacity: 0 } : i === prev ? { y: -14, scale: 1.08 } : false}
                animate={{ y: active ? -14 : 0, scale: active ? 1.08 : 1, opacity: 1 }}
                transition={active && moved ? { type: 'spring', stiffness: 520, damping: 20, delay: 0.2 } : { type: 'spring', stiffness: 420, damping: 26 }}
                style={{ color: active ? '#fff' : undefined }}>
                <Icon size={20} />
                {tab.badge > 0 && (
                  <motion.span key={tab.badge} className="notif-badge" style={{ right: 4, top: -2 }}
                    initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }}>
                    {tab.badge}
                  </motion.span>
                )}
              </motion.span>
              <span className={`relative z-10 text-[10px] font-bold transition-all duration-300 ${active ? '-mt-1' : ''}`} style={active ? { color: pc } : undefined}>{tab.label}</span>
            </>
          );
          const cls = `flex-1 min-w-0 flex flex-col items-center pt-1.5 pb-0.5 ${active ? '' : (dark ? 'text-gray-500' : 'text-gray-400')}`;
          return tab.to
            ? <Link key={tab.key} to={tab.to} className={cls} aria-current={active ? 'page' : undefined}>{inner}</Link>
            : <button key={tab.key} type="button" onClick={tab.onClick} className={cls} data-cart-target={tab.key === 'cart' ? 'tab' : undefined}>{inner}</button>;
        })}
      </div>
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
      <button type="button" onClick={openCart} className={btn} title={t('store.cart', 'Cart')} data-cart-target="header">
        <ShoppingCart size={20} />{cartCount > 0 && <span className="notif-badge">{cartCount}</span>}
      </button>
    </div>
  );
}

// Floating "View cart" pill: slides up once the cart has something in it,
// shows the last few products as stacked thumbnails, and bounces each time
// an item is added.
export function CartPill({ storeSlug, pc = '#7c3aed', currency = 'DZD', onCart, hidden = false }) {
  const { t, cartCount, openCart } = useStoreNavData(storeSlug, onCart);
  const items = useCartStore(s => s.items);
  const total = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0);
  const thumbs = items.slice(-3).reverse();
  const show = !hidden && cartCount > 0;
  const bodyRef = useRef(null);
  useEffect(() => {
    const onBump = () => { try { bodyRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }); } catch {} };
    window.addEventListener('cart:bump', onBump);
    return () => window.removeEventListener('cart:bump', onBump);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button key="cart-pill" type="button" onClick={openCart} data-cart-target="pill"
          className="fixed z-30 left-1/2 bottom-[calc(84px+env(safe-area-inset-bottom))] md:bottom-6 rounded-full text-white shadow-2xl"
          style={{ backgroundColor: pc, boxShadow: `0 12px 28px ${pc}66` }}
          initial={{ y: 90, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 90, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          aria-label={t('store.viewCart', 'View cart')}>
          <span ref={bodyRef} className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5">
          <span className="flex -space-x-3">
            {thumbs.map((it, i) => (
              <motion.span key={(it.product_id || i) + '-' + i} className="w-9 h-9 rounded-full border-2 overflow-hidden bg-white/90 grid place-items-center"
                style={{ borderColor: pc, zIndex: 3 - i }}
                initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20, delay: i * 0.04 }}>
                {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <ShoppingCart size={14} className="text-gray-500" />}
              </motion.span>
            ))}
          </span>
          <span className="text-left leading-tight pr-1">
            <span className="block text-[13px] font-extrabold">{t('store.viewCart', 'View cart')}</span>
            <span className="block text-[10px] opacity-85">{cartCount} · {Math.round(total).toLocaleString()} {currency}</span>
          </span>
          <motion.span key={cartCount} className="w-7 h-7 rounded-full bg-white/20 grid place-items-center text-xs font-black"
            initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
            {cartCount}
          </motion.span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
