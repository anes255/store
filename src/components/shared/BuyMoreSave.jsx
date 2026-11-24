import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Check } from 'lucide-react';
import { savingsLadder, toUnits } from '../../utils/offerPricing';

// "Buy More & Save More": the price ladder under a product.
//
// Tapping a row sets the quantity, and the price above the fold follows it,
// so what the buyer reads here is what the cart and the checkout will say —
// all three ask the same module, and the server re-does the same sum before
// charging anything.
export default function BuyMoreSave({ product, offers, unitPrice, variant, quantity, onPick, currency = 'DZD', pc = '#111827' }) {
  const { t, i18n } = useTranslation();
  const unitUnits = toUnits(unitPrice);
  const rows = savingsLadder({ product, offers, unitUnits, variant });
  if (rows.length < 2) return null;

  const lang = (i18n.language || 'en').slice(0, 2);
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
  const money = (v) => `${Number(v || 0).toLocaleString(locale)} ${currency}`;

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <Layers size={15} style={{ color: pc }} />
        <p className="text-sm font-extrabold text-gray-900">{t('store.buyMoreSave', 'Buy More & Save More')}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((row) => {
          const on = quantity === row.quantity;
          return (
            <button
              key={row.quantity}
              type="button"
              onClick={() => onPick?.(row.quantity)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${on ? '' : 'hover:bg-gray-50'}`}
              style={on ? { backgroundColor: `${pc}14`, boxShadow: `inset 3px 0 0 ${pc}` } : undefined}
            >
              <span
                className="w-5 h-5 rounded-full border-2 grid place-items-center shrink-0"
                style={{ borderColor: on ? pc : '#d1d5db', backgroundColor: on ? pc : 'transparent' }}
              >
                {on && <Check size={11} strokeWidth={3} className="text-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-900">
                  {t('store.buyN', 'Buy {{n}}', { n: row.quantity })}
                  {row.best && (
                    <span className="ms-2 align-middle text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: pc }}>
                      {t('store.bestValue', 'Best value')}
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-gray-400">{t('store.perItem', '{{v}} each', { v: money(row.unit) })}</span>
              </span>
              <span className="text-end shrink-0">
                <span className="block text-sm font-black" style={{ color: pc }}>{money(row.total)}</span>
                {row.save > 0 && (
                  <span className="block text-[11px] font-bold text-emerald-600">{t('store.saveX', 'Save {{v}}', { v: money(row.save) })}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
