import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../hooks/useStore';
import { Check } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', short: 'EN', country: 'gb' },
  { code: 'fr', label: 'Français', short: 'FR', country: 'fr' },
  { code: 'ar', label: 'العربية', short: 'AR', country: 'dz' },
];

const Flag = ({ country, size = 20 }) => (
  <img
    src={`https://flagcdn.com/w40/${country}.png`}
    srcSet={`https://flagcdn.com/w80/${country}.png 2x`}
    width={size}
    height={Math.round(size * 0.75)}
    alt=""
    className="rounded-sm object-cover shrink-0"
    style={{ width: size, height: Math.round(size * 0.75) }}
  />
);

/**
 * Single-button language switcher with dropdown.
 * The dropdown is rendered through a portal so it isn't trapped inside
 * an ancestor with `backdrop-blur` (which creates a containing block for
 * fixed/absolute children — the bug that made the button do nothing on
 * mobile inside the dashboard header).
 */
export default function LanguageSwitcher({ variant }) {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLangStore();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  const current = languages.find(l => l.code === lang) || languages[0];

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setLang(code);
    setOpen(false);
  };

  // Re-measure the button each open / scroll / resize so the popover stays
  // pinned to it even when the page scrolls behind the portal.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect(); if (!r) return;
      setAnchor({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);

  const isHeader = variant === 'header';

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
          isHeader
            ? 'hover:bg-white/20 text-inherit'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Flag country={current.country} size={16}/>
        <span>{current.short}</span>
      </button>

      {open && anchor && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div
            className="fixed rounded-xl shadow-2xl border border-gray-100 bg-white z-[101] overflow-hidden"
            style={{ top: anchor.top, right: anchor.right, width: Math.min(192, window.innerWidth - 16) }}
          >
            {languages.map(l => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => handleChange(l.code)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all ${
                    active ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  <Flag country={l.country} size={24}/>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${active ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{l.label}</p>
                  </div>
                  {active && <Check size={14} className="text-emerald-500 shrink-0"/>}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
