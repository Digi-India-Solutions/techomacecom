import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

export function toDbGroupKey(group) {
  const g = String(group || "").toLowerCase().replace(/[\s-]+/g, "_").trim();
  if (g === "sleep_test" || g === "sleep" || g === "sleep_diagnostics") return "sleep_test";
  if (g === "rental" || g === "rentals" || g === "equipment_rentals") return "rental";
  if (g === "product" || g === "products") return "product";
  return "general";
}

export function toUiGroup(groupKey) {
  const g = String(groupKey || "").toLowerCase().trim();
  if (g === "sleep_test") return "Sleep Test";
  if (g === "rental") return "Rental";
  if (g === "product") return "Product";
  return "General";
}

export const DEFAULT_FAQS = [
  {
    group_key: "general",
    question: "Do you provide GST tax invoices for clinics and hospitals?",
    answer:
      "Yes. Enter your company name and 15-digit GSTIN at checkout to automatically receive a B2B tax invoice eligible for 100% Input Tax Credit.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "general",
    question: "How do I know the products on Buy Denmed are 100% genuine?",
    answer:
      "Buy Denmed is an authorized distribution partner for global brands including Philips Respironics, ResMed, 3M ESPE, Dentsply Sirona, Omron, W&H, and Woodpecker. Every product arrives in tamper-evident manufacturer packaging with verifiable batch codes and holographic seals.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "general",
    question: "Is installation included for dental chairs and ICU beds?",
    answer:
      "Yes, a certified Buy Denmed biomedical technician installs and calibrates heavy equipment at your clinic or home at no extra charge.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "general",
    question: "What are the delivery timelines across India?",
    answer:
      "Delhi NCR and major metro locations typically receive deliveries within 24-48 hours. Tier 2 and Tier 3 cities are serviced within 2-4 business days via BlueDart Air Cargo and Delhivery. Fragile items like dental chairs and autoclaves are shipped in reinforced wooden crates.",
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "rental",
    question: "What documents are required to rent an oxygen concentrator or ICU bed?",
    answer:
      "We require Aadhaar/Address Proof for all rentals, plus a doctor prescription for oxygen concentrators and BiPAP machines.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "rental",
    question: "When is the security deposit refunded?",
    answer:
      "Once the unit is picked up and passes physical inspection at our warehouse, the deposit is refunded within 24–48 business hours.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "rental",
    question: "How does the Medical Equipment Rental program work?",
    answer:
      "We provide monthly rentals on 5L/10L oxygen concentrators, CPAP/BiPAP units, and motorized ICU beds. A refundable security deposit is collected, and our certified technician sets up the device at your clinic or residence with zero maintenance charges. You can return the equipment or convert to ownership anytime.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "sleep_test",
    question: "How does the Home Level-3 Sleep Apnea Study work?",
    answer:
      "Our sleep technician delivers and demonstrates a compact respiratory polygraphy kit at your home, collects it the next morning, and delivers a pulmonologist-signed report within 48 hours.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "sleep_test",
    question: "What is included in the Level 3 Home Sleep Test?",
    answer:
      "Our technician brings a sanitized 7-channel diagnostic device to your residence, fits the sensors, and picks up the device the following morning. A senior Pulmonologist analyzes your respiratory channels, AHI, and desaturation index, followed by a tele-consultation.",
    sort_order: 2,
    is_active: true,
  },
];

export function formatFaq(f) {
  if (!f) return null;
  return {
    id: f.id.toString(),
    group: toUiGroup(f.group_key),
    question: f.question,
    answer: f.answer,
    sortOrder: f.sort_order ?? 0,
    active: Boolean(f.is_active),
    createdAt: f.created_at ? f.created_at.toISOString() : null,
    updatedAt: f.updated_at ? f.updated_at.toISOString() : null,
  };
}

let faqsSeeded = false;

export async function ensureDefaultFaqs() {
  if (faqsSeeded) return;
  try {
    const count = await prisma.faq.count();
    if (count === 0) {
      for (const def of DEFAULT_FAQS) {
        await prisma.faq.create({
          data: {
            group_key: def.group_key,
            question: def.question,
            answer: def.answer,
            sort_order: def.sort_order,
            is_active: def.is_active,
          },
        });
      }
    }
    faqsSeeded = true;
  } catch (err) {
    console.error("[faqs] ensureDefaultFaqs error:", err.message);
  }
}

export async function listAdminFaqs() {
  await ensureDefaultFaqs();
  const rows = await prisma.faq.findMany({
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  return rows.map(formatFaq);
}

export async function createFaq(data) {
  if (!data.question || !data.answer) {
    throw ApiError.badRequest("Question and answer are required");
  }

  const groupKey = toDbGroupKey(data.group || data.group_key);
  const maxSort = await prisma.faq.aggregate({
    _max: { sort_order: true },
    where: { group_key: groupKey },
  });
  const nextOrder = (maxSort._max.sort_order ?? 0) + 1;

  const created = await prisma.faq.create({
    data: {
      group_key: groupKey,
      question: String(data.question).trim(),
      answer: String(data.answer).trim(),
      sort_order: data.sortOrder ?? data.sort_order ?? nextOrder,
      is_active:
        data.active !== undefined
          ? Boolean(data.active)
          : data.is_active !== undefined
          ? Boolean(data.is_active)
          : true,
    },
  });

  return formatFaq(created);
}

export async function updateFaq(id, data) {
  const cleanId = String(id).replace(/^[^\d]+/, "");
  if (!cleanId) {
    throw ApiError.badRequest("Invalid FAQ ID");
  }
  const numericId = BigInt(cleanId);
  const existing = await prisma.faq.findUnique({ where: { id: numericId } });
  if (!existing) {
    throw ApiError.notFound("FAQ not found");
  }

  const updateData = {};
  if (data.question !== undefined) updateData.question = String(data.question).trim();
  if (data.answer !== undefined) updateData.answer = String(data.answer).trim();
  if (data.group !== undefined || data.group_key !== undefined) {
    updateData.group_key = toDbGroupKey(data.group || data.group_key);
  }
  if (data.sortOrder !== undefined) updateData.sort_order = Number(data.sortOrder);
  if (data.sort_order !== undefined) updateData.sort_order = Number(data.sort_order);
  if (data.active !== undefined) updateData.is_active = Boolean(data.active);
  if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

  const updated = await prisma.faq.update({
    where: { id: numericId },
    data: updateData,
  });

  return formatFaq(updated);
}

export async function reorderFaqs(items) {
  if (!Array.isArray(items)) {
    throw ApiError.badRequest("Items array is required");
  }

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (item && item.id) {
      const cleanId = String(item.id).replace(/^[^\d]+/, "");
      if (cleanId) {
        await prisma.faq.update({
          where: { id: BigInt(cleanId) },
          data: { sort_order: idx + 1 },
        });
      }
    }
  }

  return listAdminFaqs();
}

export async function deleteFaq(id) {
  const cleanId = String(id).replace(/^[^\d]+/, "");
  if (!cleanId) {
    throw ApiError.badRequest("Invalid FAQ ID");
  }
  const numericId = BigInt(cleanId);
  const existing = await prisma.faq.findUnique({ where: { id: numericId } });
  if (!existing) {
    throw ApiError.notFound("FAQ not found");
  }

  await prisma.faq.delete({ where: { id: numericId } });
  return { success: true, id: id.toString() };
}

export async function listPublicFaqs(group) {
  await ensureDefaultFaqs();
  const where = { is_active: true };

  if (group && group !== "All") {
    where.group_key = toDbGroupKey(group);
  }

  const rows = await prisma.faq.findMany({
    where,
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  return rows.map(formatFaq);
}
