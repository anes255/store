import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

// "Hold to confirm" for destructive actions: the action fires only after the
// button is held down for `duration` ms while a ring fills around the icon.
// Letting go early cancels it — nothing fires and the ring drains back.
// Works with mouse, touch and keyboard (hold Space/Enter).
export default function HoldToConfirm({
  onConfirm,
  label = 'Hold to delete',
  holdingLabel = 'Keep holding…',
  doneLabel = 'Deleting…',
  hint = 'Release early to cancel',
  duration = 1500,
  disabled = false,
  icon: Icon = Trash2,
  className = '',
}) {
  const [progress, setProgressState] = useState(0); // 0..1
  const prog = useRef(0);
  const setProgress = (p) => { prog.current = p; setProgressState(p); };
  const [done, setDoneState] = useState(false);
  const doneRef = useRef(false);
  const setDone = (v) => { doneRef.current = v; setDoneState(v); };
  const raf = useRef(0);
  const start = useRef(0);
  const holding = useRef(false);

  const stop = () => {
    holding.current = false;
    cancelAnimationFrame(raf.current);
    if (doneRef.current) return;
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

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 14, C = 2 * Math.PI * R;
  const active = progress > 0 && !done;
  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={begin}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
        onContextMenu={(e) => e.preventDefault()}
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
        {active && <span className="relative text-[11px] font-mono tabular-nums opacity-80">{Math.max(0, Math.ceil((1 - progress) * duration / 100) / 10).toFixed(1)}s</span>}
      </button>
      {hint && <span className="text-[11px] text-gray-400 pl-1">{active ? hint : ''}&nbsp;</span>}
    </div>
  );
}
