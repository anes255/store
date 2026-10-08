import React from 'react';
import { useTranslation } from 'react-i18next';

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

// Four-segment meter with a label, shown under a password field while the
// user types.
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
  const tips = [];
  if (password.length < 8) tips.push(t('auth.pwTipLength', 'use 8+ characters'));
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) tips.push(t('auth.pwTipCase', 'mix upper and lower case'));
  if (!/\d/.test(password)) tips.push(t('auth.pwTipDigit', 'add a number'));
  if (!/[^A-Za-z0-9]/.test(password)) tips.push(t('auth.pwTipSymbol', 'add a symbol'));
  return (
    <div className={`mt-2 ${className}`} aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: score > i ? '100%' : '0%', backgroundColor: lvl.color }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-start justify-between gap-2 text-[11px]">
        <span className="font-bold shrink-0" style={{ color: lvl.color }}>{t('auth.pwStrength', 'Strength')}: {lvl.label}</span>
        {score < 4 && tips.length > 0 && <span className="text-gray-400 text-right">{t('auth.pwTryTo', 'Tip')}: {tips.slice(0, 2).join(', ')}</span>}
      </div>
    </div>
  );
}
