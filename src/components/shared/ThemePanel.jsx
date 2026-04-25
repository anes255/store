import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Palette, Check, X, ChevronDown } from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#7C3AED', name: 'Purple' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#8B5CF6', name: 'Violet' },
];

/**
 * Reusable theme configuration panel.
 * @param {Object} props
 * @param {'light'|'dark'} props.mode - Current theme mode
 * @param {string} props.primaryColor - Current primary color hex
 * @param {Function} props.onModeChange - (mode) => void
 * @param {Function} props.onColorChange - (hex) => void
 * @param {boolean} [props.compact] - Render as a compact dropdown button
 */
export default function ThemePanel({ mode, primaryColor, onModeChange, onColorChange, compact = false, modeOnly = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(primaryColor);
  const isDark = mode === 'dark';

  const content = (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          {t('theme.mode', 'Theme Mode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'light', label: t('theme.light', 'Light'), icon: Sun, desc: 'Clean & bright' },
            { key: 'dark', label: t('theme.dark', 'Dark'), icon: Moon, desc: 'Easy on the eyes' },
          ].map(m => {
            const Icon = m.icon;
            const sel = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => onModeChange(m.key)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  sel
                    ? 'shadow-md'
                    : isDark
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={sel ? { borderColor: primaryColor, backgroundColor: primaryColor + '12' } : {}}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} style={sel ? { color: primaryColor } : { color: '#9ca3af' }} />
                  <span className={`text-sm font-bold ${sel ? '' : isDark ? 'text-gray-300' : 'text-gray-600'}`} style={sel ? { color: primaryColor } : {}}>
                    {m.label}
                  </span>
                </div>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.desc}</p>
                {sel && (
                  <div className="mt-1.5 flex justify-end">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Check size={10} className="text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Presets */}
      {!modeOnly && <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          {t('theme.primaryColor', 'Primary Color')}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => {
            const sel = primaryColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                onClick={() => { onColorChange(c.hex); setCustomColor(c.hex); }}
                className={`relative group transition-all ${sel ? 'scale-110' : 'hover:scale-105'}`}
                title={c.name}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    sel ? 'border-gray-900 dark:border-white ring-2 shadow-lg' : isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c.hex, ringColor: sel ? c.hex + '40' : undefined }}
                >
                  {sel && <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow-md" />}
                </div>
                <span className={`block text-[8px] text-center mt-0.5 font-medium ${sel ? 'font-bold' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom color picker */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={e => { setCustomColor(e.target.value); onColorChange(e.target.value); }}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
              style={{ appearance: 'none' }}
            />
          </div>
          <input
            type="text"
            value={customColor}
            onChange={e => {
              const v = e.target.value;
              setCustomColor(v);
              if (/^#[0-9A-Fa-f]{6}$/.test(v)) onColorChange(v);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
              isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            } w-24 focus:outline-none`}
            placeholder="#7C3AED"
          />
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('theme.custom', 'Custom')}</span>
        </div>
      </div>}

      {/* Preview */}
      {!modeOnly && <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          {t('theme.preview', 'Preview')}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: primaryColor + '30' }}>
            <div className="h-2 rounded-full w-2/3" style={{ backgroundColor: primaryColor }} />
          </div>
          <button className="px-3 py-1.5 rounded-lg text-white text-[10px] font-bold" style={{ backgroundColor: primaryColor }}>
            {t('theme.button', 'Button')}
          </button>
          <span className="text-xs font-bold" style={{ color: primaryColor }}>Text</span>
        </div>
      </div>}
    </div>
  );

  // Render the compact dropdown via a portal so the `fixed` backdrop isn't
  // trapped inside an ancestor that creates a containing block (e.g. the
  // header's `backdrop-blur`). Without this, outside-clicks on the page
  // never reach the close handler.
  const btnRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => { const r = btnRef.current?.getBoundingClientRect(); if (r) setAnchor({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) }); };
    update();
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open]);

  if (compact) {
    return (
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: primaryColor }} />
          <Palette size={13} />
          <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && anchor && createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div
              className={`fixed rounded-2xl shadow-2xl border z-[101] p-4 max-h-[80vh] overflow-y-auto ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
              }`}
              style={{ top: anchor.top, right: anchor.right, width: Math.min(320, window.innerWidth - 16) }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Palette size={14} className="inline mr-1.5" style={{ color: primaryColor }} />
                  {t('theme.title', 'Theme')}
                </p>
                <button onClick={() => setOpen(false)} className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <X size={14} />
                </button>
              </div>
              {content}
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  return content;
}
