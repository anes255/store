// Which boxes the checkout form shows, and which of them the buyer must fill.
// One shared definition so the dashboard switches and the real checkout page
// can never drift apart.
//
// Stored on the store as `checkout_fields`:
//   { name: { on: true, required: true }, email: { on: false }, ... }
// Anything missing falls back to the defaults below, so stores that never
// touched these switches keep the form they already had.

export const CHECKOUT_FIELDS = [
  { key: 'name', label: 'Full name', hint: 'Who the order is for', lockRequired: false },
  { key: 'phone', label: 'Phone number', hint: 'Used to confirm the order', lockRequired: false },
  { key: 'email', label: 'Email', hint: 'For the invoice and order emails', defaultOn: false },
  { key: 'address', label: 'Address', hint: 'Street / house, for home delivery' },
  { key: 'wilaya', label: 'Wilaya', hint: 'Sets the shipping price' },
  { key: 'city', label: 'Commune / city', hint: 'Narrows down the delivery area' },
  { key: 'zip', label: 'ZIP code', hint: 'Filled in automatically from the commune', defaultRequired: false },
  { key: 'notes', label: 'Order notes', hint: 'Anything the buyer wants to add', defaultOn: false, defaultRequired: false },
];

const DEFAULTS = Object.fromEntries(CHECKOUT_FIELDS.map((f) => [f.key, {
  on: f.defaultOn !== false,
  required: f.defaultRequired !== false && f.defaultOn !== false,
}]));

/**
 * Settings for one field, taking the older single toggles into account:
 * `checkout_email` and `order_notes` were the only switches before this, so
 * they still decide email / notes until the store uses the new switches.
 */
export function fieldState(store, key) {
  const saved = store?.checkout_fields?.[key];
  if (saved && typeof saved === 'object') {
    return { on: saved.on !== false, required: saved.on !== false && saved.required === true };
  }
  if (key === 'email') return { on: store?.checkout_email === true, required: store?.checkout_email === true };
  if (key === 'notes') return { on: store?.order_notes === true, required: false };
  return DEFAULTS[key] || { on: true, required: true };
}

export const fieldOn = (store, key) => fieldState(store, key).on;
export const fieldRequired = (store, key) => {
  const s = fieldState(store, key);
  return s.on && s.required;
};
