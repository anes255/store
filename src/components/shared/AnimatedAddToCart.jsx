import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Package } from 'lucide-react';

// Add-to-cart button with a short, satisfying sequence:
//   1. the cart rolls in from the left while the button fills,
//   2. a product box drops into the cart,
//   3. the button turns green: "✓ Added to cart", then resets.
// `onAdd()` must return true when the item was really added (false = e.g.
// a variant is still missing — then nothing animates).
export default function AnimatedAddToCart({ onAdd, label = 'Add to Cart', addedLabel = 'Added to cart', pc = '#7c3aed', disabled = false, className = '' }) {
  const [phase, setPhase] = useState('idle'); // idle | adding | done
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const click = () => {
    if (disabled || phase !== 'idle') return;
    const ok = onAdd ? onAdd() : true;
    if (ok === false) return;
    setPhase('adding');
    later(() => setPhase('done'), 750);
    later(() => setPhase('idle'), 2200);
  };

  const done = phase === 'done';
  return (
    <button type="button" onClick={click} disabled={disabled}
      className={`relative overflow-hidden flex-1 min-w-0 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 transition-colors duration-300 ${className}`}
      style={{ backgroundColor: done ? '#10b981' : pc }}>
      {/* fill sweep */}
      <motion.span aria-hidden className="absolute inset-y-0 left-0 bg-white/20"
        initial={false} animate={{ width: phase === 'adding' ? '100%' : '0%' }}
        transition={{ duration: phase === 'adding' ? 0.7 : 0.2, ease: 'easeOut' }} />
      {/* All three layers stay mounted and cross-fade, so the label can never
          get stuck half-way (mount/unmount animations proved fragile). */}
      <motion.span className="relative flex items-center gap-1.5 min-w-0" initial={false}
        animate={{ opacity: phase === 'idle' ? 1 : 0, y: phase === 'idle' ? 0 : -8 }} transition={{ duration: 0.15 }}>
        <ShoppingCart size={16} className="shrink-0" /><span className="truncate">{label}</span>
      </motion.span>
      <span className="absolute inset-0 pointer-events-none" aria-hidden>
        {phase === 'adding' && (<>
          <motion.span className="absolute top-1/2 -mt-2.5" initial={{ left: '-10%' }} animate={{ left: 'calc(50% - 10px)' }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <ShoppingCart size={20} />
          </motion.span>
          <motion.span className="absolute" style={{ left: 'calc(50% - 4px)' }} initial={{ top: '-30%', opacity: 0, rotate: -20 }}
            animate={{ top: ['-30%', '-30%', '42%'], opacity: [0, 1, 1], rotate: [-20, -20, 0] }} transition={{ duration: 0.7, times: [0, 0.55, 1], ease: 'easeIn' }}>
            <Package size={11} />
          </motion.span>
        </>)}
      </span>
      <motion.span className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none" initial={false}
        animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.7 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
        <span className="w-5 h-5 rounded-full bg-white/25 grid place-items-center"><Check size={13} strokeWidth={3} /></span>
        <span className="truncate">{addedLabel}</span>
      </motion.span>
    </button>
  );
}
