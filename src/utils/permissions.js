// Single source of truth for staff permission keys used by both the
// store owner StoreStaff page and the super-admin Role Templates editor.
export const ALL_PERMISSIONS = [
  { key: 'dashboard_view', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'analytics_view', label: 'View Analytics', group: 'Dashboard' },
  { key: 'apps_view', label: 'View Apps', group: 'Dashboard' },
  { key: 'orders_view', label: 'View Orders', group: 'Orders' },
  { key: 'orders_edit', label: 'Edit / Update Orders', group: 'Orders' },
  { key: 'orders_confirm', label: 'Confirm Orders', group: 'Orders' },
  { key: 'orders_prepare', label: 'Prepare Orders', group: 'Orders' },
  { key: 'orders_delete', label: 'Delete Orders', group: 'Orders' },
  { key: 'abandoned_view', label: 'View Abandoned Orders', group: 'Orders' },
  { key: 'products_view', label: 'View Products', group: 'Products' },
  { key: 'products_edit', label: 'Add / Edit Products', group: 'Products' },
  { key: 'products_delete', label: 'Delete Products', group: 'Products' },
  { key: 'stock_manage', label: 'Manage Stock', group: 'Products' },
  { key: 'offers_manage', label: 'Manage Offers', group: 'Products' },
  { key: 'reviews_manage', label: 'Manage Reviews', group: 'Products' },
  { key: 'customers_view', label: 'View Customers', group: 'Customers' },
  { key: 'customers_edit', label: 'Edit Customers', group: 'Customers' },
  { key: 'customers_blacklist', label: 'Manage Blacklist', group: 'Customers' },
  { key: 'content_manage', label: 'Manage Content Pages', group: 'Content' },
  { key: 'faqs_manage', label: 'Manage FAQs', group: 'Content' },
  { key: 'about_manage', label: 'Manage About Page', group: 'Content' },
  { key: 'shipping_manage', label: 'Manage Shipping', group: 'Shipping' },
  { key: 'shipping_partners', label: 'Manage Shipping Partners', group: 'Shipping' },
  { key: 'tracking_view', label: 'View Tracking Orders', group: 'Shipping' },
  { key: 'finances_view', label: 'View Costs & Revenue', group: 'Finances' },
  { key: 'finances_edit', label: 'Add / Edit Expenses', group: 'Finances' },
  { key: 'taxes_view', label: 'View Taxes', group: 'Finances' },
  { key: 'billing_view', label: 'View Billing', group: 'Finances' },
  { key: 'settings_view', label: 'View Settings', group: 'Settings' },
  { key: 'settings_edit', label: 'Edit Store Settings', group: 'Settings' },
  { key: 'staff_manage', label: 'Manage Staff', group: 'Settings' },
  { key: 'builder_edit', label: 'Edit Page Builder', group: 'Settings' },
  { key: 'domains_manage', label: 'Manage Domains', group: 'Settings' },
];

export const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

// Old role templates used different keys — map them onto the current ones
// (same table as the server's middleware/staffAccess.js).
const ALIASES = {
  view_dashboard: ['dashboard_view'], view_orders: ['orders_view'],
  manage_orders: ['orders_view', 'orders_edit', 'orders_confirm', 'orders_prepare'],
  view_products: ['products_view'], manage_products: ['products_view', 'products_edit', 'stock_manage'],
  view_customers: ['customers_view'], manage_customers: ['customers_view', 'customers_edit'],
  view_analytics: ['analytics_view', 'dashboard_view'], manage_settings: ['settings_view', 'settings_edit'],
  manage_staff: ['staff_manage'], confirm_orders: ['orders_confirm'], prepare_orders: ['orders_prepare'],
};
export function normalizePerms(raw) {
  let p = raw;
  if (typeof p === 'string') { try { p = JSON.parse(p || '[]'); } catch { p = []; } }
  if (!Array.isArray(p)) p = [];
  const out = new Set();
  for (const k of p) { out.add(k); (ALIASES[k] || []).forEach((x) => out.add(x)); }
  return out;
}
