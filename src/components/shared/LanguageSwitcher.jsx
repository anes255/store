import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '../../hooks/useStore';

const languages = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇩🇿' },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const { lang, setLang } = useLangStore();

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setLang(code);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
            lang === l.code
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          {compact ? l.label : `${l.flag} ${l.label}`}
        </button>
      ))}
    </div>
  );
}
