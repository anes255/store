// Money display for salaries and payroll. Every amount is shown with its own
// currency and never silently converted:
//   30,000 DZD     $500 USD     €450 EUR
// Conversions (when the store set exchange rates) are separate and always
// labelled "approximate" by the caller.
const SYMBOL = { USD: '$', EUR: '€' };

export function formatMoney(amount, currency = 'DZD', { decimals } = {}) {
  const n = Number(amount) || 0;
  const cur = String(currency || 'DZD').toUpperCase();
  const d = decimals ?? (cur === 'DZD' ? (Number.isInteger(n) ? 0 : 2) : (Number.isInteger(n) ? 0 : 2));
  const num = n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return SYMBOL[cur] ? `${SYMBOL[cur]}${num} ${cur}` : `${num} ${cur}`;
}

// fx: { USD: <DZD per 1 USD>, EUR: <DZD per 1 EUR> } — set by the store admin.
// Returns [{ currency, amount }] for the other currencies, or [] without rates.
export function approxConversions(amount, currency, fx) {
  if (!fx) return [];
  const cur = String(currency || 'DZD').toUpperCase();
  const toDzd = cur === 'DZD' ? Number(amount) : (fx[cur] ? Number(amount) * fx[cur] : null);
  if (toDzd == null || !isFinite(toDzd)) return [];
  return ['DZD', 'USD', 'EUR'].filter((c) => c !== cur).map((c) => {
    if (c === 'DZD') return { currency: c, amount: Math.round(toDzd) };
    if (!fx[c]) return null;
    return { currency: c, amount: Math.round((toDzd / fx[c]) * 100) / 100 };
  }).filter(Boolean);
}

// Sum of { [currency]: amount } → "30,000 DZD + $500 USD"
export function formatMulti(byCurrency) {
  const parts = Object.entries(byCurrency || {}).filter(([, v]) => Number(v) !== 0);
  if (!parts.length) return formatMoney(0, 'DZD');
  return parts.map(([c, v]) => formatMoney(v, c)).join(' + ');
}
