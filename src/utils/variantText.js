// Readable variant text for an order line.
//
// variant_info travels as a JSON string or an object in several shapes
// ({label, per_unit}, {selections}, a single {name,type,value}, or a plain
// map). Printed raw it came out as `per_unit: [object Object]`.
const one = (x) => {
  if (x == null) return '';
  if (typeof x !== 'object') return String(x);
  return String(x.label || x.name || x.value || '');
};

export function variantText(v) {
  if (v == null || v === '') return '';
  let o = v;
  if (typeof o === 'string') { try { o = JSON.parse(o); } catch { return o; } }
  if (o == null) return '';
  if (typeof o !== 'object') return String(o);
  if (o.label) return String(o.label);
  if (Array.isArray(o.per_unit)) {
    return o.per_unit.map((u) => (Array.isArray(u?.selections) ? u.selections.map(one).filter(Boolean).join(' / ') : one(u))).filter(Boolean).join(', ');
  }
  if (Array.isArray(o.selections)) return o.selections.map(one).filter(Boolean).join(' / ');
  if (Array.isArray(o)) return o.map(one).filter(Boolean).join(' / ');
  if (o.name || o.value) return one(o);
  return Object.entries(o)
    .filter(([, val]) => val != null && val !== '' && typeof val !== 'object')
    .map(([, val]) => String(val)).join(' / ');
}

export default variantText;
