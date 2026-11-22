import prisma from "../../db/db.js";
import { SUPER_ADMIN_SLUG } from "../rbac/catalog.js";

/**
 * Admin bell ("Operational alerts").
 *
 *  1. Events — alertStaff() writes one admin_notifications row per staff member who can act on it
 *     (role has `permission`, or is Super Admin), so read / unread is personal.
 *  2. Needs attention — live counts computed on every read (overdue rentals, KYC queue, low stock…),
 *     so they can never go stale.
 *
 * alertStaff() never throws: a failed alert must not fail the order / booking that raised it.
 */

const SEVERITIES = ["info", "warning", "urgent"];

export async function alertStaff({ type, title, message = null, severity = "info", link = null, entityType = null, entityId = null, permission }) {
  try {
    const staff = await prisma.adminUser.findMany({
      where: {
        status: "active",
        OR: [
          { role: { slug: SUPER_ADMIN_SLUG } },
          ...(permission ? [{ role: { role_permissions: { some: { permission: { code: permission } } } } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!staff.length) return 0;
    await prisma.adminNotification.createMany({
      data: staff.map((s) => ({
        admin_user_id: s.id,
        type: String(type).slice(0, 40),
        title: String(title).slice(0, 200),
        message: message ? String(message).slice(0, 1000) : null,
        severity: SEVERITIES.includes(severity) ? severity : "info",
        link: link ? String(link).slice(0, 300) : null,
        entity_type: entityType,
        entity_id: entityId != null ? BigInt(entityId) : null,
      })),
    });
    return staff.length;
  } catch (err) {
    console.error("[admin-alerts] could not save alert:", err.message);
    return 0;
  }
}

const toDto = (n) => ({
  id: String(n.id),
  type: n.type,
  title: n.title,
  message: n.message || "",
  severity: n.severity,
  href: n.link || "/admin",
  read: Boolean(n.read_at),
  createdAt: n.created_at.toISOString(),
});

const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const dateOnly = (ymd) => new Date(`${ymd}T00:00:00Z`);

/** Live "needs attention" counts — only for modules this staff member can open. */
async function attention(permissions) {
  const can = (code) => permissions.has(code);
  const today = dateOnly(todayIST());
  const in3 = new Date(today.getTime() + 3 * 86_400_000);
  const q = [];
  const add = (perm, key, run, build) => {
    if (can(perm)) q.push(run().then((n) => (n > 0 ? { key, ...build(n) } : null)).catch(() => null));
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Rentals
  add("rentals.view", "rentals_overdue", () => prisma.rental.count({ where: { OR: [{ status: "overdue" }, { status: "active", end_date: { lt: today } }] } }), (n) => ({
    severity: "urgent",
    title: `${plural(n, "rental is", "rentals are")} overdue`,
    message: "Send a reminder or schedule the pickup.",
    href: "/admin/rentals?status=overdue",
    count: n,
  }));
  add("rentals.view", "rentals_kyc", () => prisma.rental.count({ where: { kyc_status: "submitted", status: { notIn: ["pending_payment", "cancelled", "deposit_refunded"] } } }), (n) => ({
    severity: "warning",
    title: `${plural(n, "rental needs", "rentals need")} KYC verification`,
    message: "Customers are waiting for their documents to be checked.",
    href: "/admin/rentals?filter=kyc",
    count: n,
  }));
  add("rentals.view", "rentals_approval", () => prisma.rental.count({ where: { status: "pending_approval" } }), (n) => ({
    severity: "warning",
    title: `${plural(n, "booking", "bookings")} awaiting approval`,
    message: "Paid rental bookings to confirm.",
    href: "/admin/rentals?status=pending_approval",
    count: n,
  }));
  add("rentals.view", "rentals_dispatch", () => prisma.rental.count({ where: { status: "approved" } }), (n) => ({
    severity: "info",
    title: `${plural(n, "rental", "rentals")} to dispatch`,
    message: "Assign a unit and hand it to delivery.",
    href: "/admin/rentals?status=approved",
    count: n,
  }));
  add("rentals.view", "rentals_due", () => prisma.rental.count({ where: { status: "active", end_date: { gte: today, lte: in3 } } }), (n) => ({
    severity: "info",
    title: `${plural(n, "rental ends", "rentals end")} within 3 days`,
    message: "Remind customers to extend or book a pickup.",
    href: "/admin/rentals?filter=due_7d",
    count: n,
  }));
  add("rentals.view", "rentals_deposit", () => prisma.rental.count({ where: { status: "returned" } }), (n) => ({
    severity: "warning",
    title: `${plural(n, "deposit", "deposits")} to refund`,
    message: "Equipment is back and inspected.",
    href: "/admin/rentals?status=returned",
    count: n,
  }));

  // Returns & refunds
  add("returns.view", "returns_review", () => prisma.return.count({ where: { status: "requested" } }), (n) => ({
    severity: "warning",
    title: `${plural(n, "return request", "return requests")} to review`,
    message: "Approve or reject from Returns & Refunds.",
    href: "/admin/returns",
    count: n,
  }));
  add("returns.view", "returns_resolve", () => prisma.return.count({ where: { status: "received" } }), (n) => ({
    severity: "warning",
    title: `${plural(n, "returned item awaits", "returned items await")} a refund or replacement`,
    message: "Inspected and ready to resolve.",
    href: "/admin/returns",
    count: n,
  }));
  add("returns.view", "refunds_failed", () => prisma.refund.count({ where: { status: "failed", created_at: { gte: new Date(Date.now() - 30 * 86_400_000) } } }), (n) => ({
    severity: "urgent",
    title: `${plural(n, "refund", "refunds")} failed in the last 30 days`,
    message: "Retry or pay by bank transfer / UPI.",
    href: "/admin/orders",
    count: n,
  }));

  // Orders
  add("orders.view", "orders_to_pack", () => prisma.order.count({ where: { status: "confirmed" } }), (n) => ({
    severity: "info",
    title: `${plural(n, "order", "orders")} to pack`,
    message: "Confirmed and waiting for fulfilment.",
    href: "/admin/orders?status=confirmed",
    count: n,
  }));
  add("orders.view", "orders_to_ship", () => prisma.order.count({ where: { status: "packed" } }), (n) => ({
    severity: "info",
    title: `${plural(n, "order", "orders")} packed, not shipped`,
    message: "Create the shipment.",
    href: "/admin/orders?status=packed",
    count: n,
  }));

  // Inventory
  add(
    "inventory.view",
    "low_stock",
    async () => {
      const [row] = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM inventory WHERE quantity - reserved <= low_stock_threshold`;
      return Number(row?.n || 0);
    },
    (n) => ({ severity: "warning", title: `${plural(n, "SKU is", "SKUs are")} low on stock`, message: "At or below the low-stock threshold.", href: "/admin/inventory", count: n })
  );

  // Leads & reviews
  add("enquiries.view", "enquiries_new", () => prisma.enquiry.count({ where: { status: "new" } }), (n) => ({
    severity: "info",
    title: `${plural(n, "new enquiry", "new enquiries")}`,
    message: "Not contacted yet.",
    href: "/admin/enquiries",
    count: n,
  }));
  add("reviews.view", "reviews_pending", () => prisma.review.count({ where: { status: "pending" } }), (n) => ({
    severity: "info",
    title: `${plural(n, "review", "reviews")} awaiting moderation`,
    message: "Approve or reject before they go live.",
    href: "/admin/reviews",
    count: n,
  }));

  const order = { urgent: 0, warning: 1, info: 2 };
  return (await Promise.all(q)).filter(Boolean).sort((a, b) => order[a.severity] - order[b.severity]);
}

export async function listForAdmin(admin, permissions) {
  const mine = { OR: [{ admin_user_id: admin.id }, { admin_user_id: null }] };
  const [items, unread, needsAttention] = await Promise.all([
    prisma.adminNotification.findMany({ where: mine, orderBy: { created_at: "desc" }, take: 40 }),
    prisma.adminNotification.count({ where: { ...mine, read_at: null } }),
    attention(permissions),
  ]);
  return { items: items.map(toDto), unread, attention: needsAttention, serverTime: new Date().toISOString() };
}

export async function markRead(admin, id) {
  await prisma.adminNotification.updateMany({ where: { id, admin_user_id: admin.id, read_at: null }, data: { read_at: new Date() } });
}

export async function markAllRead(admin) {
  await prisma.adminNotification.updateMany({ where: { admin_user_id: admin.id, read_at: null }, data: { read_at: new Date() } });
}

/** Keep the table small: read alerts older than 60 days are removed when anyone opens the bell (cheap, indexed). */
export async function prune() {
  await prisma.adminNotification.deleteMany({ where: { read_at: { not: null }, created_at: { lt: new Date(Date.now() - 60 * 86_400_000) } } }).catch(() => undefined);
}
