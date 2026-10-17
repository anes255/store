import { gradientForCompany, initialFor } from '../../utils/carrierGradient';

// A shipping company's avatar: the owner's uploaded logo when there is one,
// otherwise the company's built-in logo (public/carriers) when we know it,
// otherwise the brand-coloured initial tile. Older rows store a single letter
// in `logo` (from the presets), so only URLs / data URIs count as images.
export const isLogoImage = (v) => typeof v === 'string' && /^(data:image\/|https?:\/\/|\/)/.test(v);

// name keywords → built-in logo file (checked in order, first match wins)
const DEFAULT_LOGOS = [
  [/48\s*h/, '48hr'],
  [/zimou/, 'zimou'],
  [/\bups\b/, 'ups'],
  [/speed\s*mail/, 'speedmail'],
  [/yalitec/, 'yalitec'],
  [/we\s*can/, 'wecan'],
  [/rj\s*360/, 'rj360'],
  [/maystro/, 'maystro'],
  [/e-?\s*com\s*deliv/, 'ecom-delivery'],
  [/easy\s*(&|and|et)?\s*speed/, 'easy-speed'],
  [/\bzr\b|zr\s*express/, 'zr-express'],
  [/msm/, 'msm-go'],
  [/\bdhd\b/, 'dhd'],
  [/world\s*express/, 'world-express'],
  [/noest/, 'noest'],
  [/swift/, 'swift-express'],
  [/yalidine/, 'yalidine'],
];

export function defaultCarrierLogo(name) {
  const k = String(name || '').toLowerCase();
  if (!k) return null;
  for (const [re, file] of DEFAULT_LOGOS) if (re.test(k)) return `/carriers/${file}.jpg`;
  return null;
}

export default function CarrierLogo({ name, logo, className = '' }) {
  const src = isLogoImage(logo) ? logo : defaultCarrierLogo(name);
  if (src) {
    return (
      <div className={`${className} bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0`}>
        <img src={src} alt={name || ''} className="w-full h-full object-contain" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`${className} bg-gradient-to-br ${gradientForCompany(name)} flex items-center justify-center text-white font-bold shrink-0`}>
      {initialFor(name)}
    </div>
  );
}
