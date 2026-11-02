import { useEffect, useRef, useState } from 'react';
import { productApi, orderApi, workersApi } from '../utils/api';

// The dashboard's "Search everything…" box only ever matched sidebar page
// names. It now also searches the store's real data — orders, products,
// customers, workers (and the admins among them) — plus every settings
// section, so typing a customer's name or "currency" finds the thing itself.
//
// Each source is independent: one failing (or one the role may not read)
// never blocks the rest.

/** Settings sections, matched by their own keywords. Mirrors StoreSettings. */
export const SETTINGS_SECTIONS = [
  { id: 'store-details', label: 'Store Details', keywords: 'name logo phone address whatsapp button contact store details' },
  { id: 'customization', label: 'Customization', keywords: 'colors colours theme font background header design scrollbar' },
  { id: 'dashboard-config', label: 'Dashboard', keywords: 'dashboard sidebar admin greeting chart modules' },
  { id: 'users', label: 'Users & Permissions', keywords: 'staff team members roles permissions users admins activity log' },
  { id: 'checkout', label: 'Checkout', keywords: 'checkout form fields coupon order button success page email notes wilaya name phone' },
  { id: 'payments', label: 'Payments', keywords: 'cod ccp baridimob payment bank transfer rib' },
  { id: 'taxes', label: 'Taxes', keywords: 'tax vat tva' },
  { id: 'notifications', label: 'Notifications', keywords: 'alerts push email notifications' },
  { id: 'orders-config', label: 'Orders', keywords: 'order number prefix archive suffix' },
  { id: 'inventory', label: 'Inventory', keywords: 'stock low threshold oversell inventory' },
  { id: 'domains', label: 'Domains', keywords: 'domain dns custom' },
  { id: 'ai', label: 'AI Messaging', keywords: 'chatbot ai assistant' },
  { id: 'tracking-pixels', label: 'Tracking Pixels', keywords: 'pixel facebook tiktok google analytics snapchat' },
  { id: 'subscription', label: 'Subscription', keywords: 'plan billing subscription' },
  { id: 'account', label: 'Account', keywords: 'password profile email delete store currency language regional' },
];

const has = (hay, q) => String(hay || '').toLowerCase().includes(q);

/**
 * @param {string} query raw text from the search box
 * @param {string} storeId current store
 * @param {object} opts { enabled, can } — `can(perm)` gates sources by role
 */
export default function useGlobalSearch(query, storeId, { enabled = true, can = () => true } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!enabled || !storeId || q.length < 2) { setResults([]); setLoading(false); return undefined; }

    const id = ++runId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const out = [];

      // Settings sections are local, so they show instantly.
      SETTINGS_SECTIONS.forEach((s) => {
        if (has(s.label, q) || has(s.keywords, q)) {
          out.push({ group: 'settings', label: s.label, hint: 'Settings', to: `/dashboard/settings?sec=${s.id}` });
        }
      });

      const safe = (p) => p.then((r) => r).catch(() => null);
      const [orders, products, customers, workers] = await Promise.all([
        can('orders_view') ? safe(orderApi.getAll(storeId, { search: q, limit: 6 })) : null,
        can('products_view') ? safe(productApi.getAll(storeId, { search: q })) : null,
        can('customers_view') ? safe(orderApi.getCustomers(storeId, { search: q })) : null,
        can('workers_view') ? safe(workersApi.list(storeId, { q, limit: 6 })) : null,
      ]);
      if (id !== runId.current) return;

      const list = (r, ...keys) => {
        const d = r?.data;
        if (Array.isArray(d)) return d;
        for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
        return [];
      };

      list(orders, 'orders').slice(0, 6).forEach((o) => out.push({
        group: 'orders',
        label: `#${o.order_number || o.id}`,
        hint: [o.customer_name, o.customer_phone].filter(Boolean).join(' · '),
        to: `/dashboard/orders?highlight=${o.id}`,
      }));

      list(products, 'products')
        .filter((p) => has(p.name, q) || has(p.name_en, q) || has(p.sku, q))
        .slice(0, 6)
        .forEach((p) => out.push({
          group: 'products', label: p.name_en || p.name, hint: p.sku || '', to: `/dashboard/products?highlight=${p.id}`,
        }));

      list(customers, 'customers')
        .filter((c) => has(c.name, q) || has(c.full_name, q) || has(c.phone, q) || has(c.email, q))
        .slice(0, 6)
        .forEach((c) => out.push({
          group: 'customers', label: c.name || c.full_name || c.phone, hint: c.phone || c.email || '', to: `/dashboard/customers?highlight=${c.id}`,
        }));

      list(workers, 'workers').slice(0, 6).forEach((w) => out.push({
        group: 'workers',
        label: w.full_name || w.name,
        // Admins and staff live in the same table — show which it is.
        hint: [w.role_name || w.job_type, w.email || w.phone].filter(Boolean).join(' · '),
        to: `/dashboard/workers/${w.id}`,
      }));

      if (id === runId.current) { setResults(out); setLoading(false); }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, storeId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { results, loading };
}
