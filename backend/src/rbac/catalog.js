/**
 * RBAC catalogue — document §4: "staff permissions are a module × action matrix
 * stored in the database, so new roles need no code change".
 *
 * MODULES / ACTIONS seed the `permissions` table (18 × 5 = 90 rows).
 * Keep MODULES in sync with admin/lib/api/admin/staff.ts → MATRIX_MODULES.
 * Adding a module here + running `npm run db:seed` makes it available to every role.
 */

export const ACTIONS = ["view", "create", "edit", "delete", "export"];

export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "brands", label: "Brands" },
  { key: "bulk_import", label: "Bulk Import" },
  { key: "inventory", label: "Inventory Stock" },
  { key: "rental_units", label: "Rental Units" },
  { key: "orders", label: "Orders" },
  { key: "returns", label: "Returns & Refunds" },
  { key: "rentals", label: "Rentals" },
  { key: "enquiries", label: "Enquiries" },
  { key: "reviews", label: "Reviews" },
  { key: "customers", label: "Customers" },
  { key: "marketing", label: "Marketing" },
  { key: "content", label: "Content" },
  { key: "settings", label: "Settings" },
  { key: "staff", label: "Staff & Roles" },
  { key: "activity", label: "Activity Log" },
];

export const ALL_PERMISSION_CODES = MODULES.flatMap((m) => ACTIONS.map((a) => `${m.key}.${a}`));

/** Role whose permissions are always "everything" and cannot be reduced or deleted. */
export const SUPER_ADMIN_SLUG = "super_admin";

/**
 * System roles seeded on first run (document §4 actor table).
 *   Super Admin — everything, incl. settings, roles, payment keys
 *   Manager     — all operations; no settings or staff
 *   Staff       — day-to-day operations (stock, rental units, orders, rentals, enquiries)
 * Admins can edit Manager / Staff and create any number of custom roles.
 */
export const SYSTEM_ROLES = [
  {
    slug: SUPER_ADMIN_SLUG,
    name: "Super Admin",
    description: "Full access to every module, including settings, roles, staff and payment keys.",
    permissions: () => ALL_PERMISSION_CODES,
  },
  {
    slug: "manager",
    name: "Operations Manager",
    description: "All catalog, order, rental and marketing operations. No settings or staff management.",
    permissions: () =>
      MODULES.filter((m) => !["settings", "staff"].includes(m.key)).flatMap((m) =>
        ACTIONS.filter((a) => a !== "delete" || ["products", "marketing", "content"].includes(m.key)).map(
          (a) => `${m.key}.${a}`
        )
      ),
  },
  {
    slug: "staff",
    name: "Warehouse & Rental Staff",
    description: "Stock adjustments, serial-numbered rental units, order packing and enquiries.",
    permissions: () => [
      "dashboard.view",
      "products.view",
      "inventory.view",
      "inventory.edit",
      "rental_units.view",
      "rental_units.create",
      "rental_units.edit",
      "orders.view",
      "orders.edit",
      "rentals.view",
      "rentals.edit",
      "enquiries.view",
      "enquiries.edit",
    ],
  },
];

export function isValidPermissionCode(code) {
  return ALL_PERMISSION_CODES.includes(code);
}
