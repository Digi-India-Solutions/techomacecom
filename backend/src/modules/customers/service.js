import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function toAdminCustomerDto(c) {
  const defaultAddr = c.addresses?.find((a) => a.is_default) || c.addresses?.[0] || null;
  const orders = c.orders || [];
  const rentals = c.rentals || [];

  const totalSpent = orders.reduce((sum, o) => {
    if (o.status === "cancelled") return sum;
    return sum + Number(o.total_paise || 0n) / 100;
  }, 0);

  let formattedMobile = c.mobile || defaultAddr?.phone || "";
  if (formattedMobile && !formattedMobile.startsWith("+")) {
    if (formattedMobile.length === 10) {
      formattedMobile = `+91 ${formattedMobile}`;
    }
  }

  const addresses = (c.addresses || []).map((a) => ({
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || undefined,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
  }));

  const defaultGst = c.gst_details?.find((g) => g.is_default) || c.gst_details?.[0] || null;

  return {
    id: String(c.id),
    name: c.name || defaultAddr?.name || "Customer",
    mobile: formattedMobile,
    email: c.email || "",
    city: defaultAddr?.city || "New Delhi",
    state: defaultAddr?.state || "Delhi",
    ordersCount: orders.length,
    rentalsCount: rentals.length,
    totalSpent: Math.round(totalSpent),
    joinedAt: (c.created_at || new Date()).toISOString().slice(0, 10),
    status: c.status === "blocked" ? "blocked" : "active",
    addresses,
    gstDetails: defaultGst
      ? {
          companyName: defaultGst.company_name,
          gstin: defaultGst.gstin,
        }
      : undefined,
    notes: [],
  };
}

export async function listCustomers(filters = {}) {
  const where = {
    deleted_at: null,
  };

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      addresses: { orderBy: { is_default: "desc" } },
      gst_details: true,
      orders: { select: { id: true, total_paise: true, status: true } },
      rentals: { select: { id: true, status: true } },
    },
    orderBy: { id: "desc" },
  });

  let list = customers.map(toAdminCustomerDto);

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }

  if (filters.city && filters.city !== "all") {
    list = list.filter((c) => c.city.toLowerCase() === filters.city.toLowerCase());
  }

  return list;
}

export async function getCustomerById(id) {
  let customerId;
  try {
    customerId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid customer ID");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      addresses: { orderBy: { is_default: "desc" } },
      gst_details: true,
      orders: { select: { id: true, total_paise: true, status: true } },
      rentals: { select: { id: true, status: true } },
    },
  });

  if (!customer || customer.deleted_at) {
    throw ApiError.notFound("Customer not found");
  }

  return toAdminCustomerDto(customer);
}

export async function toggleCustomerStatus(id) {
  let customerId;
  try {
    customerId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid customer ID");
  }

  const existing = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.deleted_at) {
    throw ApiError.notFound("Customer not found");
  }

  const nextStatus = existing.status === "active" ? "blocked" : "active";
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { status: nextStatus },
    include: {
      addresses: { orderBy: { is_default: "desc" } },
      gst_details: true,
      orders: { select: { id: true, total_paise: true, status: true } },
      rentals: { select: { id: true, status: true } },
    },
  });

  return toAdminCustomerDto(updated);
}

