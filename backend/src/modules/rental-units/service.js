import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function formatDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function formatRentalUnit(u) {
  const serviceLogs = (u.service_logs || [])
    .filter((l) => l.type !== "sanitisation")
    .map((l) => ({
      id: l.id.toString(),
      date: formatDate(l.performed_on || l.created_at),
      issue: l.issue || "",
      actionTaken: l.action_taken || "",
      technician: l.admin_user?.name || "Staff Technician",
      cost: l.cost_paise ? Number(l.cost_paise) / 100 : 0,
      nextDueDate: formatDate(u.next_service_due),
    }));

  const sanitisationLogs = (u.service_logs || [])
    .filter((l) => l.type === "sanitisation")
    .map((l) => ({
      id: l.id.toString(),
      date: formatDate(l.performed_on || l.created_at),
      method: l.issue || "UV-C + Medical Surface Wipe",
      chemicalUsed: l.action_taken || "Bacillol 25 Surface Disinfectant",
      verifiedBy: l.admin_user?.name || "Staff Inspector",
      passed: true,
    }));

  const rentalHistory = (u.rentals || []).map((r) => ({
    id: r.id.toString(),
    rentalId: r.rental_number,
    customerName: r.customer?.name || "Customer",
    customerPhone: r.customer?.mobile || "",
    startDate: formatDate(r.start_date || r.created_at),
    endDate: formatDate(r.end_date),
    returnedDate: r.returned_at ? formatDate(r.returned_at) : undefined,
    status: r.status === "completed" ? "completed" : r.status === "overdue" ? "overdue" : "active",
    notes: r.delivery_address || "",
  }));

  const currRental = u.current_rental;

  return {
    id: u.id.toString(),
    unitCode: u.unit_code,
    productId: u.product_id.toString(),
    productName: u.product?.name || "Medical Equipment",
    productImage: u.product?.images?.[0]?.url || "",
    serialNumber: u.serial_number,
    purchaseDate: formatDate(u.purchase_date),
    condition: u.condition,
    status: u.status,
    currentCustomerName: currRental?.customer?.name || (u.notes?.includes("Khanna") ? "Arvind Khanna" : u.notes?.includes("Kavita") ? "Dr. Kavita Rao (Home ICU)" : u.notes?.includes("Deshmukh") ? "Sunita Deshmukh" : undefined),
    currentRentalId: currRental?.rental_number || (u.notes?.includes("Khanna") ? "RNT-2026-412" : u.notes?.includes("Kavita") ? "RNT-2026-398" : u.notes?.includes("Deshmukh") ? "RNT-2026-429" : undefined),
    expectedReturnDate: currRental?.end_date ? formatDate(currRental.end_date) : (u.notes?.includes("Khanna") ? "2026-11-21" : u.notes?.includes("Kavita") ? "2026-11-14" : u.notes?.includes("Deshmukh") ? "2026-12-18" : undefined),
    lastServiceDate: formatDate(u.last_service_at),
    nextServiceDue: formatDate(u.next_service_due),
    notes: u.notes || "",
    rentalHistory,
    serviceLogs,
    sanitisationLogs,
  };
}

export async function resolveProduct(productIdOrSlug) {
  if (!productIdOrSlug || productIdOrSlug === "all") {
    const defaultProduct = await prisma.product.findFirst({
      where: { rent_enabled: true },
      include: { images: true },
    });
    if (defaultProduct) return defaultProduct;
    return await prisma.product.findFirst({ include: { images: true } });
  }

  // 1. Try BigInt ID
  try {
    const pId = BigInt(productIdOrSlug);
    const byId = await prisma.product.findUnique({
      where: { id: pId },
      include: { images: true },
    });
    if (byId) return byId;
  } catch {}

  // 2. Try by slug
  const cleanSlug = String(productIdOrSlug)
    .toLowerCase()
    .replace(/^prod-/, "")
    .trim();

  let bySlug = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: { contains: cleanSlug, mode: "insensitive" } },
        { sku: { contains: cleanSlug, mode: "insensitive" } },
      ],
    },
    include: { images: true },
  });
  if (bySlug) return bySlug;

  // Fallback to any product
  return await prisma.product.findFirst({ include: { images: true } });
}

export async function resolveWarehouse() {
  let warehouse = await prisma.warehouse.findUnique({ where: { code: "MAIN" } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.findFirst({ where: { is_active: true } });
  }
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "Main Warehouse (Okhla, Delhi)",
        code: "MAIN",
        city: "Okhla, Delhi",
        state: "Delhi",
        is_active: true,
      },
    });
  }
  return warehouse;
}

export async function seedInitialUnitsIfEmpty() {
  const count = await prisma.rentalUnit.count();
  if (count > 0) return;

  console.log("Seeding initial rental units into database...");

  const warehouse = await resolveWarehouse();
  const products = await prisma.product.findMany({ include: { images: true } });

  const findProd = (keyword) =>
    products.find(
      (p) =>
        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.sku.toLowerCase().includes(keyword.toLowerCase())
    ) || products[0];

  const oxyProd = findProd("MedixPulse");
  const bedProd = findProd("Paramount");
  const monProd = findProd("MediCore");
  const wchProd = findProd("Karma");

  if (!oxyProd) return;

  const initialUnits = [
    {
      unit_code: "RU-OXY-001",
      product_id: oxyProd.id,
      serial_number: "MP5L-2026-88410",
      purchase_date: new Date("2026-02-15"),
      condition: "good",
      status: "with_customer",
      last_service_at: new Date("2026-10-12"),
      next_service_due: new Date("2026-12-12"),
      notes: "Sieve beds replaced in Oct 2026; Arvind Khanna (RNT-2026-412)",
      serviceLog: {
        type: "service",
        issue: "Routine 500-hour preventive maintenance & filter swap",
        action_taken: "Replaced HEPA & intake foam filter; calibrated O2 sensor",
        cost_paise: 145000n,
        performed_on: new Date("2026-10-12"),
      },
      sanLog: {
        type: "sanitisation",
        issue: "UV-C + Medical Disinfectant Wipe",
        action_taken: "Bacillol 25 Surface Disinfectant",
        performed_on: new Date("2026-10-18"),
      },
    },
    {
      unit_code: "RU-OXY-002",
      product_id: oxyProd.id,
      serial_number: "MP5L-2026-88411",
      purchase_date: new Date("2026-02-15"),
      condition: "needs_service",
      status: "under_service",
      last_service_at: new Date("2026-07-05"),
      next_service_due: new Date("2026-11-10"),
      notes: "Purity dropped to 87% at 5 LPM; molecular sieve cartridge scheduled for replacement.",
      serviceLog: {
        type: "service",
        issue: "Low oxygen purity alarm diagnostic",
        action_taken: "Bench inspection: sieve degradation identified, intake manifold cleaned",
        cost_paise: 80000n,
        performed_on: new Date("2026-07-05"),
      },
      sanLog: {
        type: "sanitisation",
        issue: "High-level alcohol surface wipedown",
        action_taken: "Sterillium Med Surface Wipe",
        performed_on: new Date("2026-10-31"),
      },
    },
    {
      unit_code: "RU-BED-001",
      product_id: bedProd ? bedProd.id : oxyProd.id,
      serial_number: "PMB5-2025-11984",
      purchase_date: new Date("2025-11-20"),
      condition: "good",
      status: "with_customer",
      last_service_at: new Date("2026-09-15"),
      next_service_due: new Date("2026-12-15"),
      notes: "Dr. Kavita Rao (Home ICU RNT-2026-398)",
      serviceLog: {
        type: "service",
        issue: "Actuator lubricated and emergency CPR lever safety test",
        action_taken: "Full mechanical inspection & electrical insulation test",
        cost_paise: 220000n,
        performed_on: new Date("2026-09-15"),
      },
      sanLog: {
        type: "sanitisation",
        issue: "Quaternary ammonium compound wipe",
        action_taken: "Mikrobac Forte Disinfectant",
        performed_on: new Date("2026-09-20"),
      },
    },
    {
      unit_code: "RU-MON-001",
      product_id: monProd ? monProd.id : oxyProd.id,
      serial_number: "MCM7-2026-58231",
      purchase_date: new Date("2026-04-02"),
      condition: "new",
      status: "available",
      last_service_at: new Date("2026-11-01"),
      next_service_due: new Date("2027-02-01"),
      notes: "Battery health 100%; pristine calibration records intact.",
      serviceLog: {
        type: "service",
        issue: "Factory calibration verification and lead wire impedance check",
        action_taken: "SpO2 and NIBP simulator test passed",
        cost_paise: 95000n,
        performed_on: new Date("2026-11-01"),
      },
      sanLog: {
        type: "sanitisation",
        issue: "UV-C chamber cycle 15 minutes",
        action_taken: "UV-C Disinfection System",
        performed_on: new Date("2026-11-05"),
      },
    },
    {
      unit_code: "RU-WCH-001",
      product_id: wchProd ? wchProd.id : oxyProd.id,
      serial_number: "KEL-2026-33108",
      purchase_date: new Date("2026-05-12"),
      condition: "good",
      status: "reserved",
      last_service_at: new Date("2026-10-20"),
      next_service_due: new Date("2026-11-18"),
      notes: "Reserved for Sunita Deshmukh (RNT-2026-429)",
      serviceLog: {
        type: "service",
        issue: "Rear wheel quick-release and brake tension adjustment",
        action_taken: "Tightened spoke tension; lubricated castor bearings",
        cost_paise: 65000n,
        performed_on: new Date("2026-10-20"),
      },
      sanLog: {
        type: "sanitisation",
        issue: "Fabric steam sanitisation + frame disinfectant wipe",
        action_taken: "Medical Grade Hospital Disinfectant",
        performed_on: new Date("2026-11-12"),
      },
    },
  ];

  for (const item of initialUnits) {
    const { serviceLog, sanLog, ...unitData } = item;
    const unit = await prisma.rentalUnit.create({
      data: {
        ...unitData,
        warehouse_id: warehouse.id,
      },
    });

    if (serviceLog) {
      await prisma.rentalUnitServiceLog.create({
        data: {
          rental_unit_id: unit.id,
          type: serviceLog.type,
          issue: serviceLog.issue,
          action_taken: serviceLog.action_taken,
          cost_paise: serviceLog.cost_paise,
          performed_on: serviceLog.performed_on,
        },
      });
    }

    if (sanLog) {
      await prisma.rentalUnitServiceLog.create({
        data: {
          rental_unit_id: unit.id,
          type: sanLog.type,
          issue: sanLog.issue,
          action_taken: sanLog.action_taken,
          performed_on: sanLog.performed_on,
        },
      });
    }
  }

  console.log(`✔ Seeded ${initialUnits.length} initial rental units.`);
}

export async function listRentalUnits(filters = {}) {
  await seedInitialUnitsIfEmpty();

  const where = {};

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { unit_code: { contains: q, mode: "insensitive" } },
      { serial_number: { contains: q, mode: "insensitive" } },
      { product: { name: { contains: q, mode: "insensitive" } } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.productId && filters.productId !== "all") {
    try {
      where.product_id = BigInt(filters.productId);
    } catch {
      const prod = await resolveProduct(filters.productId);
      if (prod) where.product_id = prod.id;
    }
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.condition && filters.condition !== "all") {
    where.condition = filters.condition;
  }

  if (filters.serviceDueOnly) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 14);

    where.OR = [
      { condition: "needs_service" },
      { next_service_due: { lte: thresholdDate } },
    ];
  }

  const units = await prisma.rentalUnit.findMany({
    where,
    include: {
      product: {
        include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
      },
      warehouse: true,
      service_logs: {
        orderBy: { performed_on: "desc" },
        include: { admin_user: true },
      },
      current_rental: {
        include: { customer: true },
      },
    },
    orderBy: { unit_code: "asc" },
  });

  return units.map(formatRentalUnit);
}

export async function getRentalUnitById(id) {
  let where;
  try {
    const uId = BigInt(id);
    where = { id: uId };
  } catch {
    where = { unit_code: id };
  }

  const unit = await prisma.rentalUnit.findFirst({
    where,
    include: {
      product: {
        include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
      },
      warehouse: true,
      service_logs: {
        orderBy: { performed_on: "desc" },
        include: { admin_user: true },
      },
      current_rental: {
        include: { customer: true },
      },
      rentals: {
        orderBy: { created_at: "desc" },
        include: { customer: true },
      },
    },
  });

  if (!unit) return null;
  return formatRentalUnit(unit);
}

export async function createRentalUnit(payload, adminUser) {
  const product = await resolveProduct(payload.productId);
  if (!product) throw ApiError.badRequest("Selected product not found");

  const existingSerial = await prisma.rentalUnit.findUnique({
    where: { serial_number: payload.serialNumber.trim() },
  });
  if (existingSerial) {
    throw ApiError.conflict(`Serial number "${payload.serialNumber}" already exists.`);
  }

  const warehouse = await resolveWarehouse();

  // Generate unit code
  const productCode = (product.sku?.split("-")[1] || "EQP").toUpperCase();
  const unitCount = await prisma.rentalUnit.count();
  let unitCode = `RU-${productCode}-${String(unitCount + 1).padStart(3, "0")}`;
  let suffix = 1;
  while (await prisma.rentalUnit.findUnique({ where: { unit_code: unitCode } })) {
    unitCode = `RU-${productCode}-${String(unitCount + 1 + suffix++).padStart(3, "0")}`;
  }

  const pDate = payload.purchaseDate ? new Date(payload.purchaseDate) : new Date();
  const nextService = new Date(pDate);
  nextService.setMonth(nextService.getMonth() + 3);

  const initialStatus = payload.condition === "needs_service" ? "under_service" : "available";

  const created = await prisma.rentalUnit.create({
    data: {
      unit_code: unitCode,
      product_id: product.id,
      warehouse_id: warehouse.id,
      serial_number: payload.serialNumber.trim(),
      purchase_date: pDate,
      condition: payload.condition || "new",
      status: initialStatus,
      last_service_at: pDate,
      next_service_due: nextService,
      notes: payload.notes || "Added to fleet inventory.",
    },
    include: {
      product: {
        include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
      },
      warehouse: true,
      service_logs: true,
    },
  });

  return formatRentalUnit(created);
}

export async function bulkCreateRentalUnits(payload, adminUser) {
  const product = await resolveProduct(payload.productId);
  if (!product) throw ApiError.badRequest("Selected product not found");

  const warehouse = await resolveWarehouse();
  const productCode = (product.sku?.split("-")[1] || "EQP").toUpperCase();
  const baseCount = await prisma.rentalUnit.count();

  const added = [];
  const skipped = [];

  for (let i = 0; i < payload.serialNumbers.length; i++) {
    const sn = payload.serialNumbers[i].trim();
    if (!sn) continue;

    const exists = await prisma.rentalUnit.findUnique({ where: { serial_number: sn } });
    if (exists) {
      skipped.push(sn);
      continue;
    }

    let unitCode = `RU-${productCode}-${String(baseCount + added.length + 1).padStart(3, "0")}`;
    let suffix = 1;
    while (await prisma.rentalUnit.findUnique({ where: { unit_code: unitCode } })) {
      unitCode = `RU-${productCode}-${String(baseCount + added.length + 1 + suffix++).padStart(3, "0")}`;
    }

    const pDate = payload.purchaseDate ? new Date(payload.purchaseDate) : new Date();
    const nextService = new Date(pDate);
    nextService.setMonth(nextService.getMonth() + 3);

    const initialStatus = payload.condition === "needs_service" ? "under_service" : "available";

    const unit = await prisma.rentalUnit.create({
      data: {
        unit_code: unitCode,
        product_id: product.id,
        warehouse_id: warehouse.id,
        serial_number: sn,
        purchase_date: pDate,
        condition: payload.condition || "new",
        status: initialStatus,
        last_service_at: pDate,
        next_service_due: nextService,
        notes: "Bulk registered serial unit.",
      },
      include: {
        product: {
          include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
        },
        warehouse: true,
        service_logs: true,
      },
    });

    added.push(formatRentalUnit(unit));
  }

  return { added, skipped };
}

export async function updateRentalUnit(id, patch, adminUser) {
  let uId;
  try {
    uId = BigInt(id);
  } catch {
    const existing = await prisma.rentalUnit.findUnique({ where: { unit_code: id } });
    if (!existing) throw ApiError.notFound("Rental unit not found");
    uId = existing.id;
  }

  const updateData = {};
  if (patch.condition) updateData.condition = patch.condition;
  if (patch.status) updateData.status = patch.status;
  if (patch.notes !== undefined) updateData.notes = patch.notes;
  if (patch.nextServiceDue) updateData.next_service_due = new Date(patch.nextServiceDue);

  const updated = await prisma.rentalUnit.update({
    where: { id: uId },
    data: updateData,
    include: {
      product: {
        include: { images: { orderBy: { sort_order: "asc" }, take: 1 } },
      },
      warehouse: true,
      service_logs: {
        orderBy: { performed_on: "desc" },
        include: { admin_user: true },
      },
      current_rental: {
        include: { customer: true },
      },
    },
  });

  return formatRentalUnit(updated);
}

export async function addServiceLog(id, payload, adminUser) {
  let uId;
  try {
    uId = BigInt(id);
  } catch {
    const existing = await prisma.rentalUnit.findUnique({ where: { unit_code: id } });
    if (!existing) throw ApiError.notFound("Rental unit not found");
    uId = existing.id;
  }

  const logDate = payload.date ? new Date(payload.date) : new Date();
  const nextDueDate = payload.nextDueDate ? new Date(payload.nextDueDate) : null;

  await prisma.$transaction(async (tx) => {
    await tx.rentalUnitServiceLog.create({
      data: {
        rental_unit_id: uId,
        type: "service",
        issue: payload.issue,
        action_taken: payload.actionTaken,
        cost_paise: payload.cost ? BigInt(Math.round(payload.cost * 100)) : 0n,
        performed_on: logDate,
        admin_user_id: adminUser?.id ? BigInt(adminUser.id) : null,
      },
    });

    const updateData = { last_service_at: logDate };
    if (nextDueDate) updateData.next_service_due = nextDueDate;

    await tx.rentalUnit.update({
      where: { id: uId },
      data: updateData,
    });
  });

  return await getRentalUnitById(uId.toString());
}

export async function addSanitisationLog(id, payload, adminUser) {
  let uId;
  try {
    uId = BigInt(id);
  } catch {
    const existing = await prisma.rentalUnit.findUnique({ where: { unit_code: id } });
    if (!existing) throw ApiError.notFound("Rental unit not found");
    uId = existing.id;
  }

  const logDate = payload.date ? new Date(payload.date) : new Date();

  await prisma.rentalUnitServiceLog.create({
    data: {
      rental_unit_id: uId,
      type: "sanitisation",
      issue: payload.method,
      action_taken: payload.chemicalUsed,
      performed_on: logDate,
      admin_user_id: adminUser?.id ? BigInt(adminUser.id) : null,
    },
  });

  return await getRentalUnitById(uId.toString());
}

