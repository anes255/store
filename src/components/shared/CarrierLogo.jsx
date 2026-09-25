import { gradientForCompany, initialFor } from '../../utils/carrierGradient';

// A shipping company's avatar: the owner's uploaded logo when there is one,
// otherwise the brand-coloured initial tile. Older rows store a single letter
// in `logo` (from the presets), so only URLs / data URIs count as images.
export const isLogoImage = (v) => typeof v === 'string' && /^(data:image\/|https?:\/\/|\/)/.test(v);

export default function CarrierLogo({ name, logo, className = '' }) {
  if (isLogoImage(logo)) {
    return (
      <div className={`${className} bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0`}>
        <img src={logo} alt={name || ''} className="w-full h-full object-contain" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`${className} bg-gradient-to-br ${gradientForCompany(name)} flex items-center justify-center text-white font-bold shrink-0`}>
      {initialFor(name)}
    </div>
  );
}
