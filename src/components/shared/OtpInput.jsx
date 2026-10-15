import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// One box per digit: typing moves to the next box, Backspace goes back,
// arrows move, and pasting a whole code fills every box. `status`
// ('error' | 'success') colours the boxes; 'error' also shakes them.
export default function OtpInput({ value = '', onChange, length = 6, status = 'idle', onComplete, autoFocus = true, disabled = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => { if (autoFocus) refs.current[0]?.focus(); }, [autoFocus]);

  const setAt = (i, d) => {
    const arr = digits.slice();
    arr[i] = d;
    const next = arr.join('').replace(/\s/g, '').slice(0, length);
    onChange && onChange(next);
    if (next.length === length && !next.includes('') && onComplete) onComplete(next);
  };
  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) return;
    if (v.length > 1) { // paste or autofill into one box
      const code = (digits.slice(0, i).join('') + v).slice(0, length);
      onChange && onChange(code);
      refs.current[Math.min(code.length, length - 1)]?.focus();
      if (code.length === length && onComplete) onComplete(code);
      return;
    }
    setAt(i, v);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) { const arr = digits.slice(); arr[i] = ''; onChange && onChange(arr.join('')); }
      else if (i > 0) { const arr = digits.slice(); arr[i - 1] = ''; onChange && onChange(arr.join('')); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e) => {
    const v = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!v) return;
    e.preventDefault();
    onChange && onChange(v);
    refs.current[Math.min(v.length, length - 1)]?.focus();
    if (v.length === length && onComplete) onComplete(v);
  };

  const color = status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : null;
  return (
    <motion.div className="flex justify-center gap-2 sm:gap-3" dir="ltr"
      animate={status === 'error' ? { x: [0, -10, 10, -7, 7, -3, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
      {digits.map((d, i) => (
        <motion.input key={i} ref={el => (refs.current[i] = el)}
          type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={length} disabled={disabled}
          value={d} onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste} onFocus={e => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="w-11 h-14 sm:w-12 sm:h-14 rounded-xl border-2 text-center text-2xl font-black font-mono bg-white text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          style={color ? { borderColor: color, backgroundColor: color + '10' } : d ? { borderColor: '#a78bfa' } : undefined}
          animate={d ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.18 }} />
      ))}
    </motion.div>
  );
}
