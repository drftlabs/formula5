// Admin tabs a staff member can be given access to. Safe to import anywhere (middleware, server, client).
export const PERMS = [
  ["dashboard", "Dashboard", "/admin", "Overview"],
  ["analytics", "Traffic & analytics", "/admin/analytics", "Overview"],
  ["orders", "Orders", "/admin/orders", "Sales"],
  ["customers", "Customers", "/admin/customers", "Sales"],
  ["abandoned", "Abandoned carts", "/admin/abandoned", "Sales"],
  ["discounts", "Discount codes", "/admin/discounts", "Sales"],
  ["messages", "Messages & complaints", "/admin/messages", "Sales"],
  ["products", "Products", "/admin/products", "Catalogue"],
  ["inventory", "Inventory", "/admin/inventory", "Catalogue"],
  ["media", "Bulk photos", "/admin/media", "Catalogue"],
  ["collections", "Collections", "/admin/collections", "Catalogue"],
  ["tags", "Tags", "/admin/tags", "Catalogue"],
  ["colors", "Colours", "/admin/colors", "Catalogue"],
  ["blocks", "Block placement", "/admin/blocks", "Homepage"],
  ["slides", "Hero slides", "/admin/slides", "Homepage"],
  ["pages", "Legal pages", "/admin/pages", "Site"],
  ["settings", "Settings", "/admin/settings", "Site"],
];
// extra things inside a tab
export const EXTRA_PERMS = [["orders_delete", "Delete orders permanently", "Orders"]];
export const ALL_PERMS = [...PERMS.map((p) => p[0]), ...EXTRA_PERMS.map((p) => p[0])];
export const STAFF_DOMAIN = "staff.taeken.in";     // staff sign in with a User ID; behind the scenes it is userid@staff.taeken.in (no mail is ever sent)
export const staffEmail = (id) => `${String(id).trim().toLowerCase()}@${STAFF_DOMAIN}`;

/** Which permission a /admin URL needs (null = no tab needed, e.g. login). */
export function permForPath(p) {
  if (p === "/admin" || p === "/admin/") return "dashboard";
  const hit = PERMS.filter((x) => x[2] !== "/admin" && (p === x[2] || p.startsWith(x[2] + "/"))).sort((a, b) => b[2].length - a[2].length)[0];
  return hit ? hit[0] : null;
}
/** What a row of the `admins` table is allowed to do. Rows from before migration_7 (no is_owner column) are owners. */
export function permsOf(row) {
  if (!row || row.active === false) return { owner: false, perms: [] };
  const owner = !("is_owner" in row) || row.is_owner === true;
  return { owner, perms: owner ? ALL_PERMS : Array.isArray(row.permissions) ? row.permissions : [] };
}
export const firstAllowed = (perms) => (PERMS.find((x) => perms.includes(x[0])) || [])[2] || null;
