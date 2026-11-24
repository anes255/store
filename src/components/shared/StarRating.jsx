import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Stars, for showing a score and for choosing one.
//
// The interactive version is sized for a thumb first: the tap targets stay
// at least 44px on a phone however small the stars are drawn, because a
// rating nobody can tap is a rating nobody gives.

export function Stars({ value = 0, size = 14, className = '' }) {
  const v = Number(value) || 0;
  return (
    <span className={`inline-flex gap-0.5 align-middle ${className}`} aria-label={`${v} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} aria-hidden="true"
          className={i <= Math.round(v) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
    </span>
  );
}

export function StarPicker({ value = 0, onChange, size = 28, label, disabled = false, id }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i}`}
          disabled={disabled}
          id={id ? `${id}-${i}` : undefined}
          onMouseEnter={() => !disabled && setHover(i)}
          onFocus={() => !disabled && setHover(i)}
          onClick={() => !disabled && onChange?.(i)}
          className="p-1.5 -m-0.5 rounded-lg transition-transform disabled:opacity-50 active:scale-90 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minWidth: 40, minHeight: 40, display: 'grid', placeItems: 'center' }}
        >
          <Star
            size={size}
            className={`transition-colors ${i <= shown ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

// One line of the summary: the criterion, a bar, and its score.
export function CriterionBar({ label, value, pc = '#f59e0b' }) {
  const v = Number(value) || 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <span className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-0">
        <span className="block h-full rounded-full transition-all" style={{ width: `${(v / 5) * 100}%`, backgroundColor: pc }} />
      </span>
      <Stars value={v} size={11} />
      <span className="text-xs font-bold text-gray-700 w-8 text-end tabular-nums">{v ? v.toFixed(1) : '—'}</span>
    </div>
  );
}

export default Stars;
