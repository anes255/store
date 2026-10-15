import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

// Score 0-4 from length and character variety.
export function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  if (kinds >= 2) score++;
  if (kinds >= 3 && pw.length >= 8) score++;
  // Very common / repetitive passwords never rate above "weak".
  if (/^(.)\1+$/.test(pw) || /^(123456|password|azerty|qwerty|000000|111111)/i.test(pw)) score = Math.min(score, 1);
  return Math.min(score, 4);
}

// Strength meter shown under a password field while the user types:
// an animated bar, a label, and requirement chips that tick green one by one.
export default function PasswordStrength({ password, className = '' }) {
  const { t } = useTranslation();
  if (!password) return null;
  const score = passwordScore(password);
  const levels = [
    { label: t('auth.pwVeryWeak', 'Very weak'), color: '#ef4444' },
    { label: t('auth.pwWeak', 'Weak'), color: '#f97316' },
    { label: t('auth.pwFair', 'Fair'), color: '#eab308' },
    { label: t('auth.pwGood', 'Good'), color: '#22c55e' },
    { label: t('auth.pwStrong', 'Strong'), color: '#16a34a' },
  ];
  const lvl = levels[score];
  const rules = [
    { ok: password.length >= 8, label: t('auth.pwRuleLength', '8+ chars') },
    { ok: /[A-Z]/.test(password), label: 'A-Z' },
    { ok: /[a-z]/.test(password), label: 'a-z' },
    { ok: /\d/.test(password), label: '123' },
    { ok: /[^A-Za-z0-9]/.test(password), label: '@#$' },
  ];
  return (
    <div className={`mt-2 ${className}`} aria-live="polite">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="font-semibold text-gray-500">{t('auth.pwStrength', 'Strength')}</span>
        <span className="font-bold transition-colors duration-300" style={{ color: lvl.color }}>{lvl.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.max(8, (score / 4) * 100)}%`, backgroundColor: lvl.color }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rules.map((r) => (
          <span key={r.label}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${r.ok ? 'bg-emerald-50 border-emerald-300 text-emerald-700 scale-100' : 'bg-gray-50 border-gray-200 text-gray-400 scale-95'}`}>
            <span className={`w-3 h-3 rounded-full grid place-items-center transition-all duration-300 ${r.ok ? 'bg-emerald-500 text-white scale-110' : 'border-[1.5px] border-gray-300 bg-transparent'}`}>
              {r.ok && <Check size={8} strokeWidth={4} />}
            </span>
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
