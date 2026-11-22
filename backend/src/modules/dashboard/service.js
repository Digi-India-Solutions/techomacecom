import prisma from "../../../db/db.js";

function parseDateRange(preset, from, to) {
  const now = new Date();
  let start;
  let end;

  if (preset === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (preset === "7d") {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "30d") {
    start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (from && to) {
    start = new Date(from + "T00:00:00Z");
    end = new Date(to + "T23:59:59.999Z");
  } else {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
}

function formatINR(val) {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

export async function getDashboardOverview({ preset = "7d", from, to }) {
  const { start, end, prevStart, prevEnd } = parseDateRange(preset, from, to);

  // 1. Current Period Orders & Sales
  const currentOrders = await prisma.order.findMany({
    where: {
      created_at: { gte: start, lte: end },
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      total_paise: true,
      created_at: true,
      status: true,
      shipping_address: true,
    },
  });

  const prevOrders = await prisma.order.findMany({
    where: {
      created_at: { gte: prevStart, lte: prevEnd },
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      total_paise: true,
    },
  });

  const totalSalesPaise = currentOrders.reduce((sum, o) => sum + BigInt(o.total_paise || 0n), 0n);
  const totalSales = Number(totalSalesPaise) / 100;
  const prevSalesPaise = prevOrders.reduce((sum, o) => sum + BigInt(o.total_paise || 0n), 0n);
  const prevSales = Number(prevSalesPaise) / 100;

  const totalOrdersCount = currentOrders.length;
  const prevOrdersCount = prevOrders.length;

  const aov = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;
  const prevAov = prevOrdersCount > 0 ? Math.round(prevSales / prevOrdersCount) : 0;

  const calcDelta = (curr, prev) => {
    if (prev <= 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  // 2. Rentals
  const activeRentalsCount = await prisma.rental.count({
    where: { status: { in: ["active", "dispatched", "approved"] } },
  });

  const currentRentals = await prisma.rental.findMany({
    where: {
      created_at: { gte: start, lte: end },
      status: { not: "cancelled" },
    },
    select: {
      total_paid_paise: true,
      rent_paise: true,
      delivery_address: true,
      status: true,
    },
  });

  const prevRentals = await prisma.rental.findMany({
    where: {
      created_at: { gte: prevStart, lte: prevEnd },
      status: { not: "cancelled" },
    },
    select: {
      total_paid_paise: true,
      rent_paise: true,
      delivery_address: true,
      status: true,
    },
  });

  const rentalRevPaise = currentRentals.reduce(
    (sum, r) => sum + BigInt(r.total_paid_paise || r.rent_paise || 0n),
    0n
  );
  const rentalRevenue = Number(rentalRevPaise) / 100;
  const prevRentalRevPaise = prevRentals.reduce(
    (sum, r) => sum + BigInt(r.total_paid_paise || r.rent_paise || 0n),
    0n
  );
  const prevRentalRev = Number(prevRentalRevPaise) / 100;

  // 3. Enquiries, Reviews, Low Stock
  const newEnquiriesCount = await prisma.enquiry.count({
    where: { status: "new" },
  });

  const pendingReviewsCount = await prisma.review.count({
    where: { status: "pending" },
  });

  let lowStockCount = 0;
  try {
    const [invRow] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS n FROM inventory WHERE quantity - reserved <= low_stock_threshold
    `;
    lowStockCount = invRow?.n || 0;
  } catch (err) {
    console.error("[dashboard] inventory count failed:", err.message);
  }

  // 4. KPIs Array
  const kpis = [
    {
      key: "total_sales",
      label: "Total Sales",
      value: totalSales,
      formattedValue: formatINR(totalSales),
      deltaPercent: calcDelta(totalSales, prevSales),
      deltaLabel: "vs prev. period",
      href: "/admin/orders",
    },
    {
      key: "orders",
      label: "Orders",
      value: totalOrdersCount,
      formattedValue: totalOrdersCount.toLocaleString("en-IN"),
      deltaPercent: calcDelta(totalOrdersCount, prevOrdersCount),
      deltaLabel: "vs prev. period",
      href: "/admin/orders",
    },
    {
      key: "aov",
      label: "Average Order Value",
      value: aov,
      formattedValue: formatINR(aov),
      deltaPercent: calcDelta(aov, prevAov),
      deltaLabel: "vs prev. period",
      href: "/admin/orders",
    },
    {
      key: "active_rentals",
      label: "Active Rentals",
      value: activeRentalsCount,
      formattedValue: activeRentalsCount.toString(),
      deltaPercent: 0,
      deltaLabel: "units deployed",
      href: "/admin/rentals",
    },
    {
      key: "rental_revenue",
      label: "Rental Revenue",
      value: rentalRevenue,
      formattedValue: formatINR(rentalRevenue),
      deltaPercent: calcDelta(rentalRevenue, prevRentalRev),
      deltaLabel: "recurring revenue",
      href: "/admin/rentals",
    },
    {
      key: "new_enquiries",
      label: "New Enquiries",
      value: newEnquiriesCount,
      formattedValue: String(newEnquiriesCount),
      deltaPercent: 0,
      deltaLabel: "B2B & rental leads",
      href: "/admin/enquiries?status=new",
    },
    {
      key: "pending_reviews",
      label: "Pending Reviews",
      value: pendingReviewsCount,
      formattedValue: String(pendingReviewsCount),
      deltaPercent: 0,
      deltaLabel: "awaiting moderation",
      href: "/admin/reviews?status=pending",
    },
    {
      key: "low_stock",
      label: "Low Stock Items",
      value: lowStockCount,
      formattedValue: lowStockCount.toString(),
      deltaPercent: 0,
      deltaLabel: "below threshold",
      href: "/admin/inventory?filter=low_stock",
      isAlert: lowStockCount > 0,
    },
  ];

  // 5. Sales & Rental Trend Chart Points
  const trendPoints = [];
  if (preset === "today") {
    // 2-hour intervals from 08:00 to 20:00
    const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
    for (const t of times) {
      const [h] = t.split(":").map(Number);
      const ordersInBucket = currentOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getHours() >= h && d.getHours() < h + 2;
      });
      const s = ordersInBucket.reduce((acc, o) => acc + Number(o.total_paise || 0n) / 100, 0);
      trendPoints.push({
        date: t,
        label: t,
        sales: Math.round(s),
        rentalRevenue: 0,
        orders: ordersInBucket.length,
      });
    }
  } else {
    // Days breakdown
    const dayCount = preset === "30d" ? 30 : Math.max(1, Math.round((end - start) / (24 * 3600 * 1000)));
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Interval step if 30 days: step by 4-5 days or day-by-day
    const step = dayCount > 14 ? Math.ceil(dayCount / 7) : 1;
    for (let i = 0; i < dayCount; i += step) {
      const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
      const nextD = new Date(start.getTime() + (i + step) * 24 * 3600 * 1000);
      const label = `${d.getDate()} ${months[d.getMonth()]}`;
      const isoDate = d.toISOString().slice(0, 10);

      const bucketOrders = currentOrders.filter((o) => {
        const ot = new Date(o.created_at).getTime();
        return ot >= d.getTime() && ot < nextD.getTime();
      });

      const s = bucketOrders.reduce((acc, o) => acc + Number(o.total_paise || 0n) / 100, 0);

      trendPoints.push({
        date: isoDate,
        label,
        sales: Math.round(s),
        rentalRevenue: 0,
        orders: bucketOrders.length,
      });
    }
  }

  // 6. Orders by Status
  const allOrdersForStatus = await prisma.order.findMany({
    select: { status: true },
  });
  const statusCounts = allOrdersForStatus.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const deliveredCount = statusCounts["delivered"] || 0;
  const shippedCount = statusCounts["shipped"] || 0;
  const toShipCount = (statusCounts["confirmed"] || 0) + (statusCounts["packed"] || 0) + (statusCounts["to_ship"] || 0);
  const pendingCount = statusCounts["pending_payment"] || 0;
  const cancelledCount = statusCounts["cancelled"] || 0;

  const ordersByStatus = [
    { status: "delivered", label: "Delivered", count: deliveredCount, color: "#16A34A" },
    { status: "shipped", label: "Shipped", count: shippedCount, color: "#1D5FAF" },
    { status: "to_ship", label: "To Ship", count: toShipCount, color: "#F28C38" },
    { status: "confirmed", label: "Pending", count: pendingCount, color: "#0B2545" },
    { status: "cancelled", label: "Cancelled", count: cancelledCount, color: "#94A3B8" },
  ];

  // 6b. Orders by State
  const stateMap = new Map();
  let ordersForState = currentOrders;

  // Fall back to all uncancelled orders if current range has 0 orders
  if (ordersForState.length === 0) {
    ordersForState = await prisma.order.findMany({
      where: { status: { not: "cancelled" } },
      select: { shipping_address: true, total_paise: true },
    });
  }

  const totalCountForState = ordersForState.length || 1;

  for (const o of ordersForState) {
    const ship = o.shipping_address || {};
    let state = String(ship.state || "Other").trim();
    if (!state) state = "Other";

    const prev = stateMap.get(state) || { count: 0, revenue: 0 };
    prev.count += 1;
    prev.revenue += Number(o.total_paise || 0n) / 100;
    stateMap.set(state, prev);
  }

  const ordersByState = Array.from(stateMap.entries())
    .map(([state, data]) => ({
      state,
      ordersCount: data.count,
      revenue: Math.round(data.revenue),
      percentage: Math.round((data.count / totalCountForState) * 100),
    }))
    .sort((a, b) => b.ordersCount - a.ordersCount);

  // 6c. Rentals by State
  const rentalStateMap = new Map();
  let rentalsForState = currentRentals;

  if (rentalsForState.length === 0) {
    rentalsForState = await prisma.rental.findMany({
      where: { status: { not: "cancelled" } },
      select: { delivery_address: true, total_paid_paise: true, rent_paise: true },
    });
  }

  const totalCountForRentalState = rentalsForState.length || 1;

  for (const r of rentalsForState) {
    const addr = r.delivery_address || {};
    let state = String(addr.state || "Other").trim();
    if (!state) state = "Other";

    const prev = rentalStateMap.get(state) || { count: 0, revenue: 0 };
    prev.count += 1;
    prev.revenue += Number(r.total_paid_paise || r.rent_paise || 0n) / 100;
    rentalStateMap.set(state, prev);
  }

  const rentalsByState = Array.from(rentalStateMap.entries())
    .map(([state, data]) => ({
      state,
      ordersCount: data.count,
      revenue: Math.round(data.revenue),
      percentage: Math.round((data.count / totalCountForRentalState) * 100),
    }))
    .sort((a, b) => b.ordersCount - a.ordersCount);

  // 7. Top Selling Products
  const orderItemsGrouped = await prisma.orderItem.groupBy({
    by: ["product_id"],
    _sum: {
      quantity: true,
      line_total_paise: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  let topProducts = [];
  if (orderItemsGrouped.length > 0) {
    const prodIds = orderItemsGrouped.map((g) => g.product_id);
    const prodDetails = await prisma.product.findMany({
      where: { id: { in: prodIds } },
      include: { images: { take: 1, orderBy: { sort_order: "asc" } }, brand: true },
    });
    const map = new Map(prodDetails.map((p) => [String(p.id), p]));

    topProducts = orderItemsGrouped.map((g) => {
      const p = map.get(String(g.product_id));
      return {
        id: String(g.product_id),
        name: p?.name || "Product",
        sku: p?.sku || "SKU",
        unitsSold: g._sum?.quantity || 0,
        revenue: Math.round(Number(g._sum?.line_total_paise || 0n) / 100),
        imageUrl: p?.images?.[0]?.url || "",
        brandName: p?.brand?.name || "",
      };
    });
  }

  // If fewer than 5 sold items, supplement with top products from DB
  if (topProducts.length < 5) {
    const existingIds = new Set(topProducts.map((p) => p.id));
    const extraProds = await prisma.product.findMany({
      where: { id: { notIn: Array.from(existingIds).map(BigInt) } },
      take: 5 - topProducts.length,
      include: { images: { take: 1, orderBy: { sort_order: "asc" } }, brand: true },
      orderBy: { sold_count: "desc" },
    });
    for (const p of extraProds) {
      topProducts.push({
        id: String(p.id),
        name: p.name,
        sku: p.sku,
        unitsSold: p.sold_count || 0,
        revenue: 0,
        imageUrl: p.images?.[0]?.url || "",
        brandName: p.brand?.name || "",
      });
    }
  }

  // 8. Action Needed Live Queues
  const nowUtc = new Date();
  const in7Days = new Date(nowUtc.getTime() + 7 * 86_400_000);

  const [
    rentalsApprovalCount,
    rentalsDueCount,
    overdueRentalsCount,
    ordersToShipCount,
  ] = await Promise.all([
    prisma.rental.count({ where: { status: "pending_approval" } }),
    prisma.rental.count({ where: { status: "active", end_date: { lte: in7Days } } }),
    prisma.rental.count({ where: { OR: [{ status: "overdue" }, { status: "active", end_date: { lt: nowUtc } }] } }),
    prisma.order.count({ where: { status: { in: ["confirmed", "packed"] } } }),
  ]);

  const actionNeeded = [
    {
      id: "act-approval",
      key: "pending_approval",
      title: "Rentals Awaiting Approval",
      description: "Confirm availability and assign a serial-numbered unit before dispatch",
      count: rentalsApprovalCount,
      severity: "urgent",
      href: "/admin/rentals?status=pending_approval",
    },
    {
      id: "act-due-7d",
      key: "due_7_days",
      title: "Rentals Due for Return in 7 Days",
      description: "Send renewal reminders or schedule doorstep pickup slots",
      count: rentalsDueCount,
      severity: "warning",
      href: "/admin/rentals?filter=due_7d",
    },
    {
      id: "act-overdue",
      key: "overdue_rentals",
      title: "Overdue Rentals",
      description: "Immediate customer follow-up and late fee / extension billing required",
      count: overdueRentalsCount,
      severity: "urgent",
      href: "/admin/rentals?status=overdue",
    },
    {
      id: "act-to-ship",
      key: "orders_to_ship",
      title: "Orders to Ship",
      description: "Confirmed purchase orders awaiting AWB generation & pickup",
      count: ordersToShipCount,
      severity: "warning",
      href: "/admin/orders?status=to_ship",
    },
    {
      id: "act-reviews",
      key: "pending_reviews",
      title: "Pending Product Reviews",
      description: "Verified buyer & clinic reviews queued for moderation",
      count: pendingReviewsCount,
      severity: "info",
      href: "/admin/reviews?status=pending",
    },
    {
      id: "act-enquiries",
      key: "new_enquiries",
      title: "New B2B & Rental Enquiries",
      description: "Unassigned clinic quotes and urgent home ICU requests",
      count: newEnquiriesCount,
      severity: "info",
      href: "/admin/enquiries?status=new",
    },
  ];

  // 9. Recent Orders
  const rawRecentOrders = await prisma.order.findMany({
    take: 6,
    orderBy: { created_at: "desc" },
    include: { customer: true, items: true },
  });

  const recentOrders = rawRecentOrders.map((o) => {
    const ship = o.shipping_address || {};
    return {
      id: String(o.id),
      orderNumber: o.order_number,
      customerName: ship.name || o.customer?.name || "Customer",
      customerCity: ship.city || "—",
      itemsCount: o.items?.length || 1,
      total: Number(o.total_paise || 0n) / 100,
      paymentMethod: o.payment_method?.toLowerCase() === "cod" ? "COD" : "Card",
      status: o.status,
      createdAt: o.created_at.toISOString(),
    };
  });

  // 10. Recent Enquiries
  const rawRecentEnquiries = await prisma.enquiry.findMany({
    take: 5,
    orderBy: { created_at: "desc" },
  });

  const recentEnquiries = rawRecentEnquiries.map((e) => ({
    id: String(e.id),
    enquiryNumber: `ENQ-${String(e.id).padStart(4, "0")}`,
    customerName: e.name || "Customer",
    organization: e.city || "—",
    phone: e.mobile || "—",
    subject: e.subject || e.message || "Customer Enquiry",
    productInterest: e.type || "General",
    type: e.type === "bulk" ? "bulk_quote" : e.type === "sleep_test" ? "rental" : "bulk_quote",
    status: e.status === "contacted" ? "in_progress" : e.status === "converted" ? "quoted" : e.status === "closed" ? "closed" : "new",
    createdAt: e.created_at.toISOString(),
  }));

  return {
    kpis,
    salesTrend: trendPoints,
    ordersByStatus,
    ordersByState,
    rentalsByState,
    topProducts,
    actionNeeded,
    recentOrders,
    recentEnquiries,
  };
}

export async function searchGlobalAdmin(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  const [products, orders, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      include: { brand: true, variants: { where: { is_default: true }, take: 1 } },
    }),
    prisma.order.findMany({
      where: {
        order_number: { contains: q, mode: "insensitive" },
      },
      take: 4,
      include: { customer: true },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q } },
        ],
      },
      take: 4,
    }),
  ]);

  const results = [];

  for (const p of products) {
    const price = Number(p.variants?.[0]?.price_paise || 0n) / 100;
    results.push({
      id: String(p.id),
      type: "product",
      title: p.name,
      subtitle: `${p.sku} · ${p.brand?.name || "Brand"}`,
      meta: formatINR(price),
      href: `/admin/products/${p.id}`,
    });
  }

  for (const o of orders) {
    const total = Number(o.total_paise || 0n) / 100;
    const ship = o.shipping_address || {};
    results.push({
      id: String(o.id),
      type: "order",
      title: o.order_number,
      subtitle: `${ship.name || o.customer?.name || "Customer"} · ${ship.city || "India"}`,
      meta: formatINR(total),
      href: `/admin/orders?search=${encodeURIComponent(o.order_number)}`,
    });
  }

  for (const c of customers) {
    results.push({
      id: String(c.id),
      type: "customer",
      title: c.name || "Customer",
      subtitle: `${c.email || c.mobile || "—"}`,
      meta: "Customer",
      href: `/admin/customers/${c.id}`,
    });
  }

  return results;
}
