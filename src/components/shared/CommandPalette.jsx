import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, ChevronRight, ArrowLeft } from 'lucide-react';

// Fuzzy score: every query letter must appear in order ("stg" → "SeTtinGs").
// Consecutive letters and letters that start a word score higher; returns
// null when it doesn't match at all.
export function fuzzyScore(query, text) {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const s = String(text || '').toLowerCase();
  if (!q) return 0;
  let score = 0, ti = 0, prev = -2;
  const marks = [];
  for (const ch of q) {
    const i = s.indexOf(ch, ti);
    if (i < 0) return null;
    score += i === prev + 1 ? 8 : 1;                  // consecutive run
    if (i === 0 || /[\s\-_/›>]/.test(s[i - 1])) score += 6; // word start
    marks.push(i); prev = i; ti = i + 1;
  }
  if (s.startsWith(q)) score += 20;
  return { score: score - s.length * 0.05, marks };
}

const Highlight = ({ text, marks }) => {
  if (!marks || !marks.length) return <>{text}</>;
  const set = new Set(marks);
  return <>{String(text).split('').map((c, i) => set.has(i) ? <b key={i} className="text-brand-600 dark:text-brand-300">{c}</b> : <span key={i}>{c}</span>)}</>;
};

// Commands run recently, newest first — shown as a "Recent" group when the
// box is empty, so the palette never opens on a blank list.
const RECENT_KEY = 'cmdPaletteRecent';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
const pushRecent = (id) => { if (id === 'logout') return; try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter(x => x !== id)].slice(0, 4))); } catch {} };

// Ctrl/⌘ + K palette. `commands`: [{ id, label, group, icon, hint, run(), children: [...] }]
// A command with `children` opens a nested list (Esc or Backspace on an empty box goes back).
export default function CommandPalette({ open, onClose, commands = [], isDark = false, placeholder = 'Type a command or search…', emptyText = 'No results', emptyHint = 'Try fewer letters — e.g. “ord” for Orders.', recentLabel = 'Recent' }) {
  const [query, setQuery] = useState('');
  const [stack, setStack] = useState([]); // nested command trail
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQuery(''); setStack([]); setActive(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  const level = stack.length ? stack[stack.length - 1].children || [] : commands;
  const results = useMemo(() => {
    if (!query.trim()) {
      const rows = level.map(c => ({ c, marks: null, g: c.group, k: c.id }));
      if (stack.length) return rows;
      // root level with an empty box: recent commands first
      const flat = [];
      commands.forEach(c => { flat.push(c); (c.children || []).forEach(ch => flat.push(ch)); });
      const recent = readRecent().map(id => flat.find(c => c.id === id)).filter(c => c && !c.children);
      return [...recent.map(c => ({ c, marks: null, g: recentLabel, k: 'recent-' + c.id })), ...rows];
    }
    return level.map(c => ({ c, m: fuzzyScore(query, c.label) || fuzzyScore(query, (c.keywords || '') + ' ' + c.label) }))
      .filter(x => x.m).sort((a, b) => b.m.score - a.m.score).map(x => ({ c: x.c, marks: fuzzyScore(query, x.c.label)?.marks, g: x.c.group, k: x.c.id }));
  }, [query, level, stack.length, commands, recentLabel, open]); // eslint-disable-line
  useEffect(() => { setActive(0); }, [query, stack.length]);
  useEffect(() => { listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const choose = (c) => {
    if (!c) return;
    if (c.children && c.children.length) { setStack(s => [...s, c]); setQuery(''); return; }
    pushRecent(c.id);
    onClose();
    setTimeout(() => c.run && c.run(), 0);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]?.c); }
    else if (e.key === 'Escape') { e.preventDefault(); if (stack.length) setStack(s => s.slice(0, -1)); else onClose(); }
    else if (e.key === 'Backspace' && !query && stack.length) { e.preventDefault(); setStack(s => s.slice(0, -1)); }
  };

  // group headers in order of first appearance
  let lastGroup = null;
  const panel = isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[250] flex items-start justify-center px-3 pt-[12vh] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${panel}`}
            initial={{ y: -16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }} onMouseDown={e => e.stopPropagation()}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              {stack.length ? (
                <button type="button" onClick={() => setStack(s => s.slice(0, -1))} className="p-1 rounded-lg hover:bg-black/5"><ArrowLeft size={16} /></button>
              ) : <Search size={16} className="text-gray-400 shrink-0" />}
              <AnimatePresence initial={false}>
                {stack.map(s => (
                  <motion.span key={s.id} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-500/15 text-brand-600 shrink-0"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>{s.label}</motion.span>
                ))}
              </AnimatePresence>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
                placeholder={stack.length ? (stack[stack.length - 1].placeholder || placeholder) : placeholder}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1" />
              <kbd className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'}`}>Esc</kbd>
            </div>
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold">{emptyText}</p>
                  <p className="text-xs text-gray-400 mt-1">{emptyHint}</p>
                </div>
              ) : results.map(({ c, marks, g, k }, i) => {
                const header = !query.trim() && g && g !== lastGroup ? g : null;
                lastGroup = g;
                const Icon = c.icon;
                const on = i === active;
                return (
                  <React.Fragment key={k}>
                    {header && <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{header}</div>}
                    <button type="button" data-idx={i} onMouseMove={() => setActive(i)} onClick={() => choose(c)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${on ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : ''}`}>
                      {/* accent bar that glides to the highlighted row */}
                      {on && <motion.span layoutId="cmd-accent" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-500" transition={{ type: 'spring', stiffness: 600, damping: 40 }} />}
                      {Icon ? <Icon size={16} className={`shrink-0 ${on ? 'text-brand-500' : 'text-gray-400'}`} /> : <span className="w-4" />}
                      <span className="flex-1 min-w-0 truncate"><Highlight text={c.label} marks={marks} /></span>
                      {c.hint && <span className="text-[11px] text-gray-400 truncate max-w-[40%]">{c.hint}</span>}
                      {c.children ? <ChevronRight size={14} className="text-gray-400" /> : i === active && <CornerDownLeft size={13} className="text-gray-400" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className={`hidden sm:flex items-center gap-4 px-4 py-2 border-t text-[10px] text-gray-400 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <span>↑↓ navigate</span><span>↵ open</span><span>⌫ back</span><span className="ml-auto">Ctrl K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
