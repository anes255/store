// Single source of truth for staff permission keys used by both the
// store owner StoreStaff page and the super-admin Role Templates editor.
export const ALL_PERMISSIONS = [
  { key: 'dashboard_view', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'analytics_view', label: 'View Analytics', group: 'Dashboard' },
  { key: 'orders_view', label: 'View Orders', group: 'Orders' },
  { key: 'orders_edit', label: 'Edit / Update Orders', group: 'Orders' },
  { key: 'orders_confirm', label: 'Confirm Orders', group: 'Orders' },
  { key: 'orders_prepare', label: 'Prepare Orders', group: 'Orders' },
  { key: 'orders_delete', label: 'Delete Orders', group: 'Orders' },
  { key: 'products_view', label: 'View Products', group: 'Products' },
  { key: 'products_edit', label: 'Add / Edit Products', group: 'Products' },
  { key: 'products_delete', label: 'Delete Products', group: 'Products' },
  { key: 'stock_manage', label: 'Manage Stock', group: 'Products' },
  { key: 'customers_view', label: 'View Customers', group: 'Customers' },
  { key: 'customers_edit', label: 'Edit Customers', group: 'Customers' },
  { key: 'customers_blacklist', label: 'Manage Blacklist', group: 'Customers' },
  { key: 'finances_view', label: 'View Costs & Revenue', group: 'Finances' },
  { key: 'finances_edit', label: 'Add / Edit Expenses', group: 'Finances' },
  { key: 'taxes_view', label: 'View Taxes', group: 'Finances' },
  { key: 'settings_view', label: 'View Settings', group: 'Settings' },
  { key: 'settings_edit', label: 'Edit Store Settings', group: 'Settings' },
  { key: 'staff_manage', label: 'Manage Staff', group: 'Settings' },
  { key: 'builder_edit', label: 'Edit Page Builder', group: 'Settings' },
  { key: 'shipping_manage', label: 'Manage Shipping', group: 'Shipping' },
  { key: 'reviews_manage', label: 'Manage Reviews', group: 'Content' },
  { key: 'domains_manage', label: 'Manage Domains', group: 'Settings' },
];

export const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];
