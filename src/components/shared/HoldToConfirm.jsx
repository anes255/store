import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';

// "Hold to confirm" for destructive actions: the action fires only after the
// control is held down for `duration` ms while a ring fills around the icon
// and a live counter runs. Letting go early cancels it — the ring drains back
// and a small "Released — nothing happened" note confirms nothing fired.
// Works with mouse, touch and keyboard (hold Space/Enter).
//   variant="button" — a red button with a small ring (inline use)
//   variant="ring"   — a large ring with the icon and counter in the middle
export default function HoldToConfirm({
  onConfirm,
  label = 'Hold to delete',
  holdingLabel = 'Keep holding…',
  doneLabel = 'Deleting…',
  hint = 'Release early to cancel',
  releasedLabel = 'Released — nothing happened',
  duration = 1500,
  disabled = false,
  icon: Icon = Trash2,
  variant = 'button',
  className = '',
}) {
  const [progress, setProgressState] = useState(0); // 0..1
  const prog = useRef(0);
  const setProgress = (p) => { prog.current = p; setProgressState(p); };
  const [done, setDoneState] = useState(false);
  const doneRef = useRef(false);
  const setDone = (v) => { doneRef.current = v; setDoneState(v); };
  const [released, setReleased] = useState(false);
  const releasedTimer = useRef(0);
  const raf = useRef(0);
  const start = useRef(0);
  const holding = useRef(false);

  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    cancelAnimationFrame(raf.current);
    if (doneRef.current) return;
    if (prog.current > 0.04) {
      setReleased(true);
      clearTimeout(releasedTimer.current);
      releasedTimer.current = setTimeout(() => setReleased(false), 1800);
    }
    // drain back smoothly
    const from = prog.current;
    const t0 = performance.now();
    const drain = (now) => {
      const p = Math.max(0, from - (now - t0) / 300);
      setProgress(p);
      if (p > 0 && !holding.current) raf.current = requestAnimationFrame(drain);
    };
    raf.current = requestAnimationFrame(drain);
  };

  const begin = (e) => {
    if (disabled || doneRef.current) return;
    if (e && e.type === 'keydown') { if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return; e.preventDefault(); }
    cancelAnimationFrame(raf.current);
    setReleased(false);
    holding.current = true;
    start.current = performance.now() - prog.current * duration;
    const tick = (now) => {
      if (!holding.current) return;
      const p = Math.min(1, (now - start.current) / duration);
      setProgress(p);
      if (p >= 1) {
        holding.current = false;
        setDone(true);
        try { navigator.vibrate && navigator.vibrate(40); } catch {}
        Promise.resolve(onConfirm && onConfirm()).finally(() => { setDone(false); setProgress(0); });
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(releasedTimer.current); }, []);

  const active = progress > 0 && !done;
  const ms = Math.round(progress * duration);
  const handlers = {
    onPointerDown: begin, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onKeyDown: begin, onKeyUp: (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); },
    onContextMenu: (e) => e.preventDefault(),
  };
  const note = (
    <span className="text-[11px] min-h-[18px] inline-flex items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {released ? (
          <motion.span key="rel" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold"
            initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
            <Check size={11} strokeWidth={3} />{releasedLabel}
          </motion.span>
        ) : (
          <motion.span key="hint" className="text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{active ? hint : (hint && variant === 'ring' ? hint : ' ')}</motion.span>
        )}
      </AnimatePresence>
    </span>
  );

  if (variant === 'ring') {
    const R = 44, C = 2 * Math.PI * R;
    return (
      <div className={`flex flex-col items-center gap-1.5 ${className}`}>
        <button type="button" disabled={disabled} {...handlers} aria-label={label}
          className="relative w-28 h-28 rounded-full select-none touch-none grid place-items-center bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(220,38,38,0.15)" strokeWidth="6" />
            <circle cx="50" cy="50" r={R} fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ filter: active ? 'drop-shadow(0 0 6px rgba(220,38,38,.55))' : 'none' }} />
          </svg>
          <span className="relative flex flex-col items-center leading-none">
            <span className="text-xl font-black tabular-nums text-gray-900">{ms}<span className="text-[10px] font-bold text-gray-400 ml-0.5">ms</span></span>
            <Icon size={16} className={`mt-1.5 ${active ? 'animate-pulse' : ''}`} />
          </span>
        </button>
        <span className="text-sm font-bold text-red-600">{done ? doneLabel : active ? holdingLabel : label}</span>
        {note}
      </div>
    );
  }

  const R = 14, C = 2 * Math.PI * R;
  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        {...handlers}
        className="relative overflow-hidden select-none touch-none inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-transform active:scale-[0.98]"
        aria-label={label}
      >
        {/* background fill grows with the hold */}
        <span className="absolute inset-y-0 left-0 bg-red-800/60 pointer-events-none" style={{ width: `${progress * 100}%` }} />
        <span className="relative w-8 h-8 shrink-0 grid place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <circle cx="18" cy="18" r={R} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
          <Icon size={14} className={active ? 'animate-pulse' : ''} />
        </span>
        <span className="relative whitespace-nowrap">{done ? doneLabel : active ? holdingLabel : label}</span>
        {active && <span className="relative text-[11px] font-mono tabular-nums opacity-80">{ms} ms</span>}
      </button>
      <span className="pl-1">{note}</span>
    </div>
  );
}
