import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { bumpCart } from './flyToCart';

// Add-to-cart button with a short, satisfying sequence:
//   1. the label fades away and the cart (resting at the left edge) rolls to
//      the middle of the button,
//   2. it fills up with a little bounce as the item drops in,
//   3. the button turns green: a ✓ pops in on the left, "Added to cart"
//      fades in and the cart slides off to the right with a few sparkles,
//   4. after a moment it settles back to the normal button.
// `onAdd()` must return true when the item was really added (false = e.g.
// a variant is still missing — then nothing animates).
const ROLL = 450, FILL = 950, RESET = 2600;
const SPARKS = [[-14, -12], [12, -14], [16, 6], [-10, 12]];

export default function AnimatedAddToCart({ onAdd, label = 'Add to Cart', addedLabel = 'Added to cart', pc = '#7c3aed', disabled = false, className = '' }) {
  const [phase, setPhase] = useState('idle'); // idle | rolling | filled | done
  const [w, setW] = useState(0);
  const btnRef = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const click = () => {
    if (disabled || phase !== 'idle') return;
    const ok = onAdd ? onAdd() : true;
    if (ok === false) return;
    setW(btnRef.current?.offsetWidth || 0);
    setPhase('rolling');
    later(() => setPhase('filled'), ROLL);
    later(() => { setPhase('done'); bumpCart(); }, FILL);
    later(() => setPhase('idle'), RESET);
  };

  const idle = phase === 'idle';
  const done = phase === 'done';
  const filled = phase === 'filled' || done;
  // cart position (px from its resting spot at the left edge)
  const CART = 18, EDGE = 14;
  const cartX = idle || !w ? 0 : done ? w - EDGE * 2 - CART : w / 2 - EDGE - CART / 2;
  return (
    <button ref={btnRef} type="button" onClick={click} disabled={disabled} aria-live="polite"
      className={`relative overflow-hidden flex-1 min-w-0 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center shadow-lg disabled:opacity-50 transition-colors duration-300 ${className}`}
      style={{ backgroundColor: done ? '#10b981' : pc, backgroundImage: done ? 'none' : `linear-gradient(110deg, ${pc}, ${pc}cc)` }}>
      {/* the cart: rests at the left, rolls to the middle, then off to the right */}
      <motion.span aria-hidden className="absolute top-1/2 -mt-[9px] pointer-events-none" style={{ left: EDGE }}
        initial={false} animate={{ x: cartX, scale: phase === 'filled' ? [1, 1.3, 1] : 1, rotate: phase === 'rolling' ? [0, -8, 0] : 0 }}
        transition={{ x: { type: 'spring', stiffness: 260, damping: 26 }, scale: { duration: 0.4 }, rotate: { duration: ROLL / 1000 } }}>
        <ShoppingCart size={CART} fill={filled ? 'currentColor' : 'none'} fillOpacity={0.35} />
        {/* the item dropping in */}
        <motion.span className="absolute left-1/2 -ml-1 w-2 h-2 rounded-[2px] bg-white" initial={false}
          animate={phase === 'rolling' ? { y: [-22, -22, 2], opacity: [0, 1, 1] } : { y: 2, opacity: 0 }}
          transition={{ duration: ROLL / 1000 + 0.15, times: [0, 0.5, 1], ease: 'easeIn' }} />
        {/* sparkles as it leaves */}
        {SPARKS.map(([sx, sy], i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-white" initial={false}
            animate={done ? { x: [0, sx], y: [0, sy], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.4] } : { x: 0, y: 0, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.04 }} />
        ))}
      </motion.span>
      {/* resting label */}
      <motion.span className="relative min-w-0 truncate pl-8 pr-3" initial={false}
        animate={{ opacity: idle ? 1 : 0, x: idle ? 0 : 10 }} transition={{ duration: 0.2 }}>{label}</motion.span>
      {/* ✓ on the left */}
      <motion.span aria-hidden className="absolute left-2.5 top-1/2 -mt-3 w-6 h-6 rounded-full bg-white/25 grid place-items-center pointer-events-none" initial={false}
        animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ type: 'spring', stiffness: 520, damping: 18 }}>
        <Check size={14} strokeWidth={3} />
      </motion.span>
      {/* "Added to cart" */}
      <motion.span className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none" initial={false}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 6 }} transition={{ duration: 0.25, delay: done ? 0.08 : 0 }}>
        <span className="truncate">{addedLabel}</span>
      </motion.span>
    </button>
  );
}
