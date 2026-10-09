// Algerian mobile number: 05/06/07 + 8 digits, or the +213 / 213 form.
export function isValidAlgerianPhone(p) {
  if (!p) return false;
  const cleaned = String(p).replace(/[\s.-]/g, '');
  return /^(0[567]\d{8}|\+?213[567]\d{8})$/.test(cleaned);
}
