import { useStoreManagement } from './useStore';

// The currency picked in Settings → Regional. Most dashboard screens printed
// "DZD" literally, so changing the store currency did nothing outside the
// storefront. Everything that shows store money reads it from here instead.
export default function useCurrency() {
  return useStoreManagement((s) => s.currentStore?.currency) || 'DZD';
}

/** `1 234 DZD` — same formatting the dashboard used before. */
export function money(amount, currency = 'DZD') {
  return `${(parseFloat(amount) || 0).toLocaleString()} ${currency}`;
}
