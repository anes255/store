import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../hooks/useStore';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', short: 'AR', flag: '🇸🇦' },
];

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
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
          isHeader
            ? 'hover:bg-white/20 text-inherit'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.short}</span>
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl border z-50 overflow-hidden ${
          isHeader ? 'bg-white border-gray-100' : 'bg-white border-gray-100'
        }`}>
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
                <span className="text-xl leading-none">{l.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${active ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{l.label}</p>
                  <p className="text-[10px] text-gray-400 uppercase">{l.short}</p>
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
