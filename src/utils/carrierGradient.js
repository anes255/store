// Per-carrier brand gradient. Kept in one module so the same coloured
// initial-letter tile shows up consistently in:
//   - ShippingPartners list (Add Company / pre-configured cards)
//   - ShippingPartners cards/grid for saved companies
//   - Checkout delivery-company picker
//   - ShippingWilayas per-company price editor
//   - StoreOrders order detail
// Add new carriers here and they'll pick up the right gradient everywhere.
const COMPANY_GRADIENTS = {
  'yalidine': 'from-yellow-500 to-orange-500',
  'zr express': 'from-blue-500 to-cyan-500',
  'procolis': 'from-indigo-500 to-blue-500',
  'maystro delivery': 'from-purple-500 to-pink-500',
  'maystro': 'from-purple-500 to-pink-500',
  'noest express': 'from-green-500 to-emerald-500',
  'noest': 'from-green-500 to-emerald-500',
  'ecotrack': 'from-teal-500 to-green-500',
  'yassir express': 'from-fuchsia-500 to-purple-600',
  'yassir': 'from-fuchsia-500 to-purple-600',
  'dhd livraison': 'from-sky-500 to-blue-600',
  'dhd': 'from-sky-500 to-blue-600',
  'aramex': 'from-red-600 to-red-500',
  'dhl express': 'from-yellow-400 to-yellow-600',
  'dhl': 'from-yellow-400 to-yellow-600',
  'fedex': 'from-purple-600 to-indigo-600',
  'ups': 'from-amber-700 to-yellow-700',
  'boxy dz': 'from-lime-500 to-green-600',
  'boxy': 'from-lime-500 to-green-600',
};

export function gradientForCompany(name) {
  if (!name) return 'from-brand-500 to-purple-500';
  const k = String(name).toLowerCase().trim();
  if (COMPANY_GRADIENTS[k]) return COMPANY_GRADIENTS[k];
  // Loose match: try first word alone (e.g. "Yalidine Pro" → "yalidine").
  for (const key of Object.keys(COMPANY_GRADIENTS)) {
    if (k.startsWith(key) || key.startsWith(k.split(/\s+/)[0])) return COMPANY_GRADIENTS[key];
  }
  return 'from-brand-500 to-purple-500';
}

export function initialFor(name) {
  return (name || '?').trim()[0]?.toUpperCase() || '?';
}
