// "Fly to cart": a copy of the product photo lifts off the card, arcs up and
// over, shrinks and spins into the cart (the floating cart pill, or the cart
// icon in the header / bottom bar), and the card's own photo dims while it is
// in flight and fades back afterwards. The cart then gets a small bump.
// Any element marked `data-cart-target` can receive the item; the first one
// that is actually visible wins, in DOM order of priority below.
const TARGETS = ['[data-cart-target="pill"]', '[data-cart-target="header"]', '[data-cart-target="tab"]'];

function findTarget() {
  for (const sel of TARGETS) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return el;
    }
  }
  return null;
}

export function bumpCart() {
  window.dispatchEvent(new CustomEvent('cart:bump'));
}

export default function flyToCart(imgEl) {
  try {
    if (!imgEl || typeof imgEl.animate !== 'function') return bumpCart();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return bumpCart();
    const from = imgEl.getBoundingClientRect();
    if (!from.width) return bumpCart();
    // Wait a beat so a cart pill that is just appearing has a position.
    setTimeout(() => {
      const target = findTarget();
      const to = target ? target.getBoundingClientRect() : { left: window.innerWidth / 2 - 20, top: window.innerHeight - 70, width: 40, height: 40 };
      const size = Math.min(from.width, from.height);
      const ghost = document.createElement('img');
      ghost.src = imgEl.currentSrc || imgEl.src;
      ghost.alt = '';
      Object.assign(ghost.style, {
        position: 'fixed', left: `${from.left + (from.width - size) / 2}px`, top: `${from.top + (from.height - size) / 2}px`,
        width: `${size}px`, height: `${size}px`, objectFit: 'cover', borderRadius: '16px', zIndex: 9999,
        pointerEvents: 'none', boxShadow: '0 18px 40px rgba(0,0,0,.28)', willChange: 'transform, opacity',
      });
      document.body.appendChild(ghost);
      const sx = from.left + from.width / 2, sy = from.top + from.height / 2;
      const ex = to.left + to.width / 2, ey = to.top + to.height / 2;
      const dx = ex - sx, dy = ey - sy;
      const lift = Math.min(dy * 0.35, -90); // arc above the straight line
      const endScale = Math.max(0.12, 28 / size);
      const anim = ghost.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.18}px,${lift * 0.7}px) scale(0.86) rotate(-6deg)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx * 0.55}px,${lift}px) scale(0.55) rotate(14deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) scale(${endScale}) rotate(28deg)`, opacity: 0.35, offset: 1 },
      ], { duration: 820, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
      imgEl.animate([{ opacity: 1 }, { opacity: 0.12, offset: 0.15 }, { opacity: 0.12, offset: 0.7 }, { opacity: 1 }], { duration: 1300, easing: 'ease-out' });
      // finish on the animation's end — or on a timer, in case the tab was
      // backgrounded mid-flight and frames stopped, so the copy never lingers
      let finished = false;
      const finish = () => { if (finished) return; finished = true; ghost.remove(); bumpCart(); };
      anim.onfinish = finish;
      anim.oncancel = finish;
      setTimeout(finish, 1100);
    }, 40);
  } catch {
    bumpCart();
  }
}
