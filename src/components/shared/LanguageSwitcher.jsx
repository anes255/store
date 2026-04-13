import React, { useState, useRef, useEffect } from 'react';
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
 * @param {Object} props
 * @param {string} [props.variant] - 'header' for storefront header (white/transparent style), default for admin pages
 */
export default function LanguageSwitcher({ variant }) {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLangStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = languages.find(l => l.code === lang) || languages[0];

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setLang(code);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isHeader = variant === 'header';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
          isHeader
            ? 'hover:bg-white/20 text-inherit'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Flag country={current.country} size={20}/>
        <span>{current.short}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border border-gray-100 bg-white z-50 overflow-hidden">
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
      )}
    </div>
  );
}
