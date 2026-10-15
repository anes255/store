import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Clock, X, TrendingUp, ArrowUpRight } from 'lucide-react';

// Store search treated as a system, not just an input:
//  - empty + focused  → recent searches and popular products
//  - typing           → live suggestions (best matches first, match highlighted)
//  - ↑ ↓ Enter Esc    → full keyboard control
//  - nothing found    → says so and offers popular picks instead of a dead end
// The parent still owns `value` (it filters the product grid as before).
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function SmartSearch({ value, onChange, products = [], storeSlug, getName = (p) => p.name, getThumb = () => null, currency = 'DZD', size = 'lg', className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const recentKey = `recentSearch_${storeSlug}`;
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem(recentKey) || '[]'); } catch { return []; } });

  const saveRecent = (q) => {
    const v = String(q || '').trim();
    if (!v) return;
    const next = [v, ...recent.filter(r => r.toLowerCase() !== v.toLowerCase())].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(recentKey, JSON.stringify(next)); } catch {}
  };
  const clearRecent = () => { setRecent([]); try { localStorage.removeItem(recentKey); } catch {} };

  const q = norm(value).trim();
  const suggestions = useMemo(() => {
    if (!q) return [];
    const scored = [];
    for (const p of products) {
      const name = norm(getName(p));
      const hay = name + ' ' + norm(p.sku) + ' ' + norm(p.category_name);
      if (!hay.includes(q)) {
        // loose match: every word of the query appears somewhere
        const words = q.split(/\s+/).filter(Boolean);
        if (!words.length || !words.every(w => hay.includes(w))) continue;
      }
      const score = name.startsWith(q) ? 0 : name.includes(' ' + q) ? 1 : name.includes(q) ? 2 : 3;
      scored.push([score, p]);
    }
    return scored.sort((a, b) => a[0] - b[0]).slice(0, 6).map(x => x[1]);
  }, [q, products]); // eslint-disable-line
  const popular = useMemo(() => {
    const feat = products.filter(p => p.is_featured);
    return (feat.length ? feat : products).slice(0, 4);
  }, [products]);

  // One flat list for keyboard navigation.
  const rows = q
    ? suggestions.map(p => ({ type: 'product', p }))
    : [...recent.map(r => ({ type: 'recent', r })), ...popular.map(p => ({ type: 'popular', p }))];
  useEffect(() => { setActive(-1); }, [q, open]);

  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  const pickProduct = (p) => {
    saveRecent(value || getName(p));
    setOpen(false);
    navigate(`/s/${storeSlug}/product/${p.slug || p.id}`);
  };
  const pickRow = (row) => {
    if (row.type === 'recent') { onChange(row.r); inputRef.current?.focus(); return; }
    pickProduct(row.p);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(-1, a - 1)); }
    else if (e.key === 'Enter') {
      if (active >= 0 && rows[active]) { e.preventDefault(); pickRow(rows[active]); }
      else { saveRecent(value); setOpen(false); inputRef.current?.blur(); }
    } else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const highlight = (text) => {
    const raw = String(text || '');
    if (!q) return raw;
    const i = norm(raw).indexOf(q);
    if (i < 0) return raw;
    return <>{raw.slice(0, i)}<mark className="bg-yellow-200/80 text-inherit rounded px-0.5">{raw.slice(i, i + q.length)}</mark>{raw.slice(i + q.length)}</>;
  };

  const big = size === 'lg';
  const showPanel = open && (q ? true : rows.length > 0);
  let idx = -1;
  const rowCls = (i) => `w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors ${i === active ? 'bg-gray-100' : 'hover:bg-gray-50'}`;
  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <div className="store-search flex items-center bg-white rounded-full shadow-md w-full overflow-hidden">
        <Search size={big ? 20 : 16} className={`${big ? 'ml-5' : 'ml-4'} text-gray-400 shrink-0`} />
        <input ref={inputRef}
          className={`flex-1 bg-transparent ${big ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5 text-sm'} focus:outline-none text-gray-800 rounded-full`}
          placeholder={t('store.searchHint', 'Search by product name or reference…')}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          role="combobox" aria-expanded={showPanel} aria-autocomplete="list" />
        {value && (
          <button type="button" onClick={() => { onChange(''); inputRef.current?.focus(); }} className="mr-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label={t('store.clearSearch', 'Clear search')}>
            <X size={big ? 16 : 14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div role="listbox"
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white text-gray-800 shadow-2xl border border-gray-100 p-2 max-h-[60vh] overflow-y-auto"
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}>
            {!q && recent.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('store.recentSearches', 'Recent searches')}</span>
                  <button type="button" onClick={clearRecent} className="text-[11px] text-gray-400 hover:text-gray-600">{t('store.clear', 'Clear')}</button>
                </div>
                {recent.map((r) => { idx++; const i = idx; return (
                  <button key={'r' + r} type="button" onMouseEnter={() => setActive(i)} onClick={() => pickRow({ type: 'recent', r })} className={rowCls(i)}>
                    <Clock size={14} className="text-gray-400 shrink-0" /><span className="text-sm truncate">{r}</span>
                  </button>
                ); })}
              </div>
            )}
            {!q && popular.length > 0 && (
              <div>
                <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1"><TrendingUp size={11} />{t('store.popularNow', 'Popular right now')}</div>
                {popular.map((p) => { idx++; const i = idx; const th = getThumb(p); return (
                  <button key={'p' + p.id} type="button" onMouseEnter={() => setActive(i)} onClick={() => pickProduct(p)} className={rowCls(i)}>
                    <span className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0">{th && <img src={th} alt="" className="w-full h-full object-cover" />}</span>
                    <span className="text-sm truncate flex-1">{getName(p)}</span>
                    <ArrowUpRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                ); })}
              </div>
            )}
            {q && suggestions.length > 0 && suggestions.map((p) => { idx++; const i = idx; const th = getThumb(p); return (
              <button key={'s' + p.id} type="button" onMouseEnter={() => setActive(i)} onClick={() => pickProduct(p)} className={rowCls(i)}>
                <span className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">{th && <img src={th} alt="" className="w-full h-full object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate">{highlight(getName(p))}</span>
                  <span className="block text-[11px] text-gray-400">{Number(p.price || 0).toLocaleString()} {currency}</span>
                </span>
              </button>
            ); })}
            {q && suggestions.length === 0 && (
              <div className="px-3 py-3">
                <p className="text-sm font-semibold text-gray-700">{t('store.noMatchFor', 'No products match “{{q}}”', { q: value.trim() })}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('store.noMatchHint', 'Check the spelling or try one of these:')}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {popular.map(p => (
                    <button key={'n' + p.id} type="button" onClick={() => pickProduct(p)} className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-semibold">{getName(p)}</button>
                  ))}
                  <button type="button" onClick={() => onChange('')} className="px-2.5 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-500">{t('store.clearSearch', 'Clear search')}</button>
                </div>
              </div>
            )}
            <div className="hidden md:flex items-center gap-3 px-3 pt-2 mt-1 border-t border-gray-100 text-[10px] text-gray-400">
              <span><kbd className="px-1 rounded bg-gray-100">↑</kbd><kbd className="px-1 rounded bg-gray-100 ml-0.5">↓</kbd> {t('store.kbdNavigate', 'navigate')}</span>
              <span><kbd className="px-1 rounded bg-gray-100">Enter</kbd> {t('store.kbdOpen', 'open')}</span>
              <span><kbd className="px-1 rounded bg-gray-100">Esc</kbd> {t('store.kbdClose', 'close')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
