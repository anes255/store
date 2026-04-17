// Lightweight pixel loader + event firing for Meta / TikTok / GA4 / Snapchat / Google Sheets webhook.
// Guards against double-injection and missing configs.

const loaded = new Set();

function addScript(id, src, inline) {
  if (loaded.has(id)) return;
  loaded.add(id);
  const s = document.createElement('script');
  if (src) { s.async = true; s.src = src; }
  if (inline) s.innerHTML = inline;
  document.head.appendChild(s);
}

export function initPixels(tp) {
  if (!tp || typeof tp !== 'object') return;

  // Facebook (Meta) Pixel
  const fb = tp.facebook_pixel;
  if (fb?.enabled && fb?.value) {
    if (!window.fbq) {
      addScript('fb-pixel-base', null, `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${fb.value}'); fbq('track','PageView');
      `);
    } else {
      try { window.fbq('init', fb.value); window.fbq('track', 'PageView'); } catch {}
    }
  }

  // TikTok Pixel
  const tt = tp.tiktok_pixel;
  if (tt?.enabled && tt?.value) {
    if (!window.ttq) {
      addScript('tt-pixel-base', null, `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${tt.value}'); ttq.page();
        }(window, document, 'ttq');
      `);
    } else {
      try { window.ttq.page(); } catch {}
    }
  }

  // Google Analytics (GA4)
  const ga = tp.google_analytics;
  if (ga?.enabled && ga?.value) {
    addScript('ga-lib', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga.value)}`);
    addScript('ga-init', null, `
      window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
      window.gtag=gtag; gtag('js',new Date()); gtag('config','${ga.value}');
    `);
  }

  // Snapchat Pixel
  const sc = tp.snapchat_pixel;
  if (sc?.enabled && sc?.value) {
    if (!window.snaptr) {
      addScript('snap-pixel-base', null, `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
        snaptr('init','${sc.value}'); snaptr('track','PAGE_VIEW');
      `);
    } else {
      try { window.snaptr('track', 'PAGE_VIEW'); } catch {}
    }
  }
}

function fireGoogleSheet(tp, payload) {
  const gs = tp?.google_sheets;
  if (!gs?.enabled || !gs?.value) return;
  try {
    fetch(gs.value, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
  } catch {}
}

export function trackViewContent(tp, product) {
  if (!tp) return;
  const data = { content_ids: [product?.id || product?.slug], content_name: product?.name, content_type: 'product', value: Number(product?.price || 0), currency: 'DZD' };
  try { window.fbq && window.fbq('track', 'ViewContent', data); } catch {}
  try { window.ttq && window.ttq.track('ViewContent', data); } catch {}
  try { window.gtag && window.gtag('event', 'view_item', { currency: 'DZD', value: data.value, items: [{ item_id: data.content_ids[0], item_name: data.content_name, price: data.value }] }); } catch {}
  try { window.snaptr && window.snaptr('track', 'VIEW_CONTENT', data); } catch {}
}

export function trackAddToCart(tp, product, qty = 1) {
  if (!tp) return;
  const data = { content_ids: [product?.id || product?.slug], content_name: product?.name, content_type: 'product', value: Number(product?.price || 0) * qty, currency: 'DZD', num_items: qty };
  try { window.fbq && window.fbq('track', 'AddToCart', data); } catch {}
  try { window.ttq && window.ttq.track('AddToCart', data); } catch {}
  try { window.gtag && window.gtag('event', 'add_to_cart', { currency: 'DZD', value: data.value, items: [{ item_id: data.content_ids[0], item_name: data.content_name, quantity: qty, price: Number(product?.price || 0) }] }); } catch {}
  try { window.snaptr && window.snaptr('track', 'ADD_CART', data); } catch {}
}

export function trackInitiateCheckout(tp, items, total) {
  if (!tp) return;
  const data = { content_ids: (items || []).map(i => i.product_id || i.id), value: Number(total || 0), currency: 'DZD', num_items: (items || []).length };
  try { window.fbq && window.fbq('track', 'InitiateCheckout', data); } catch {}
  try { window.ttq && window.ttq.track('InitiateCheckout', data); } catch {}
  try { window.gtag && window.gtag('event', 'begin_checkout', { currency: 'DZD', value: data.value }); } catch {}
  try { window.snaptr && window.snaptr('track', 'START_CHECKOUT', data); } catch {}
}

export function trackPurchase(tp, order) {
  if (!tp || !order) return;
  const items = order.items || [];
  const data = {
    content_ids: items.map(i => i.product_id || i.id),
    value: Number(order.total || 0),
    currency: 'DZD',
    num_items: items.length,
    order_id: order.id || order.order_number,
  };
  try { window.fbq && window.fbq('track', 'Purchase', data); } catch {}
  try { window.ttq && window.ttq.track('CompletePayment', data); } catch {}
  try { window.gtag && window.gtag('event', 'purchase', { transaction_id: data.order_id, value: data.value, currency: 'DZD', items: items.map(i => ({ item_id: i.product_id || i.id, item_name: i.name, quantity: i.quantity, price: i.price })) }); } catch {}
  try { window.snaptr && window.snaptr('track', 'PURCHASE', data); } catch {}
  fireGoogleSheet(tp, { event: 'purchase', ...data, customer: { name: order.customer_name, phone: order.customer_phone, email: order.customer_email }, created_at: new Date().toISOString() });
}
