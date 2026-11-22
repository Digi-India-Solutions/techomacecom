import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { buildOrderBy, paginate, searchWhere } from "../../lib/list.js";
import { bmiFrom, scoreStopBang } from "./stop-bang.js";

/**
 * Enquiries (document §11: enquiries) — leads from public forms.
 * Sleep test: the callback form on /sleep-test and on the risk-quiz result page.
 * The quiz answers ride along in details.quiz; the risk level is recomputed here.
 */

/** "ENQ-ST-000042" — friendly reference shown to the customer and staff. */
export const enquiryCode = (id, type = "sleep_test") => {
  const prefix = type === "sleep_test" ? "ST" : type === "bulk" ? "BK" : type === "seller" ? "VN" : "CT";
  return `ENQ-${prefix}-${String(id).padStart(6, "0")}`;
};

/** Server-side STOP-BANG result for the stored details. */
export function assessQuiz(quiz) {
  const bmi = bmiFrom(quiz.heightCm, quiz.weightKg);
  if (bmi === null) {
    throw ApiError.badRequest("Height and weight look incorrect. Please check them in the quiz.", "INVALID_BMI", {
      quiz: "Invalid height / weight",
    });
  }
  const { score, stopScore, risk, signs } = scoreStopBang(quiz.answers, bmi);
  return {
    method: "STOP-BANG",
    answers: quiz.answers,
    heightCm: quiz.heightCm,
    weightKg: quiz.weightKg,
    unit: quiz.unit,
    bmi,
    score,
    stopScore,
    risk,
    signs,
  };
}

export async function createSleepTestEnquiry(data, { customerId, ip } = {}) {
  const quiz = data.quiz ? assessQuiz(data.quiz) : null;
  const row = await prisma.enquiry.create({
    data: {
      type: "sleep_test",
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
      message: data.message,
      consent: true,
      source_page: data.sourcePage || (quiz ? "/sleep-test/quiz" : "/sleep-test"),
      customer_id: customerId ?? null,
      details: {
        testType: data.testType,
        preferredDate: data.preferredDate,
        ...(quiz ? { quiz } : {}),
        ...(ip ? { ip } : {}),
      },
    },
  });
  return { row, quiz };
}

export async function createSellerRegistration(data, { customerId, ip } = {}) {
  const brandList = (data.brands || []).map((b) => `${b.name} (${b.country || "India"})`).join(", ");
  const row = await prisma.enquiry.create({
    data: {
      type: "contact", // safe against enquiries_type_chk constraint ('sleep_test', 'bulk', 'contact')
      name: data.companyName,
      mobile: data.mobile,
      email: data.email,
      city: data.city || data.originCountry || "India",
      message: `Seller Registration — Vendor: ${data.vendorType} | Reg: ${data.registeredAs} | GST: ${data.gstNumber || "N/A"}${
        brandList ? ` | Brands: ${brandList}` : ""
      }${data.message ? ` | Notes: ${data.message}` : ""}`,
      consent: true,
      source_page: data.sourcePage || "/sell",
      customer_id: customerId ?? null,
      details: {
        category: "seller_registration",
        companyName: data.companyName,
        registeredAs: data.registeredAs,
        email: data.email,
        mobile: data.mobile,
        originCountry: data.originCountry || "India",
        vendorType: data.vendorType,
        gstNumber: data.gstNumber || "",
        brands: data.brands || [],
        contactPerson: data.contactPerson || null,
        categories: data.categories || [],
        ...(ip ? { ip } : {}),
      },
    },
  });
  return { row };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function toAdminDto(e) {
  const details = e.details || {};
  const isSeller = details.category === "seller_registration";
  return {
    id: String(e.id),
    code: isSeller ? `VND-${String(e.id).padStart(6, "0")}` : enquiryCode(e.id, e.type),
    type: isSeller ? "seller_registration" : e.type,
    name: e.name,
    mobile: e.mobile,
    email: e.email || "",
    city: e.city || "",
    message: e.message || "",
    status: e.status,
    sourcePage: e.source_page || "",
    testType: details.testType || null,
    preferredDate: details.preferredDate || null,
    sellerDetails: isSeller
      ? {
          companyName: details.companyName,
          registeredAs: details.registeredAs,
          vendorType: details.vendorType,
          originCountry: details.originCountry,
          gstNumber: details.gstNumber,
          brands: details.brands,
          contactPerson: details.contactPerson,
          categories: details.categories,
        }
      : null,
    quiz: details.quiz
      ? {
          risk: details.quiz.risk,
          score: details.quiz.score,
          bmi: details.quiz.bmi,
          signs: details.quiz.signs,
          answers: details.quiz.answers,
        }
      : null,
    customerId: e.customer_id ? String(e.customer_id) : null,
    // Contact Us / bulk forms
    subject: details.subject || (isSeller ? "Seller registration" : null),
    organization: details.organizationName || (isSeller ? details.companyName : null) || null,
    gstin: details.gstNumber || null,
    productsSummary: (details.equipmentRequired || []).join(", ") || null,
    estimatedBudget: details.estimatedBudget || null,
    timeline: details.timeline || null,
    state: details.state || null,
    pincode: details.pincode || null,
    // Follow-up
    assignedStaffId: e.assigned_to ? String(e.assigned_to) : null,
    assignedStaffName: e.assignee?.name || null,
    nextFollowUpDate: e.next_follow_up_at ? e.next_follow_up_at.toISOString().slice(0, 10) : null,
    notes: (e.notes || []).map((n) => ({
      id: String(n.id),
      author: n.admin_user?.name || "System",
      text: n.note,
      statusAfter: n.status_after || null,
      createdAt: n.created_at,
    })),
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

/** Relations every admin view needs (assignee + notes, newest first). */
const adminInclude = {
  assignee: { select: { id: true, name: true } },
  notes: { orderBy: { created_at: "desc" }, include: { admin_user: { select: { name: true } } } },
};

/** "ENQ-CT-000042" / "VND-000042" / "42" typed in the search box → id 42 */
function idFromSearch(q) {
  const m = /^(?:ENQ-[A-Z]{2}-|VND-)?0*([1-9][0-9]{0,17})$/i.exec(String(q || "").trim());
  return m ? BigInt(m[1]) : null;
}

const SELLER_WHERE = { type: "contact", details: { path: ["category"], equals: "seller_registration" } };

async function customerFilter(customerId) {
  if (!customerId) return null;
  const id = BigInt(customerId);
  const c = await prisma.customer.findUnique({ where: { id }, select: { mobile: true, email: true } });
  return {
    OR: [
      { customer_id: id },
      ...(c?.mobile ? [{ mobile: c.mobile }] : []),
      ...(c?.email ? [{ email: { equals: c.email, mode: "insensitive" } }] : []),
    ],
  };
}

export async function list({ page, limit, sort, q, type, status, risk, kind, customerId }) {
  const search = searchWhere(q, ["name", "mobile", "email", "city", "message"]);
  const codeId = idFromSearch(q);
  if (codeId && search.OR) search.OR.push({ id: codeId });
  // "NOT details.category = seller" would also drop rows without a category (SQL NULL), so exclude by id
  const notSeller =
    kind === "contact_us"
      ? { id: { notIn: (await prisma.enquiry.findMany({ where: SELLER_WHERE, select: { id: true } })).map((r) => r.id) } }
      : null;
  const and = [search, await customerFilter(customerId), notSeller].filter((w) => w && Object.keys(w).length);
  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(risk && { details: { path: ["quiz", "risk"], equals: risk } }),
    ...(kind === "seller_registration" && SELLER_WHERE),
    ...(and.length && { AND: and }),
  };
  const { rows, meta } = await paginate(prisma.enquiry, {
    where,
    include: adminInclude,
    orderBy: buildOrderBy(sort, { createdAt: "created_at", name: "name", status: "status" }, "-createdAt"),
    page,
    limit,
  });
  return { rows: rows.map(toAdminDto), meta };
}

export async function getById(id) {
  const row = await prisma.enquiry.findUnique({ where: { id }, include: adminInclude });
  if (!row) throw ApiError.notFound("Enquiry not found");
  return toAdminDto(row);
}

// ---------------------------------------------------------------------------
// Contact Us + Bulk enquiry (public)
// ---------------------------------------------------------------------------

export async function createContactEnquiry(data, { customerId, ip } = {}) {
  return prisma.enquiry.create({
    data: {
      type: "contact",
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      message: data.message,
      consent: true, // the visitor sent the form to be contacted
      source_page: data.sourcePage || "/contact",
      customer_id: customerId ?? null,
      details: { category: "contact_us", subject: data.subject, ...(ip ? { ip } : {}) },
    },
  });
}

export async function createBulkEnquiry(data, { customerId, ip } = {}) {
  return prisma.enquiry.create({
    data: {
      type: "bulk",
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
      message: data.message,
      consent: true,
      source_page: data.sourcePage || "/bulk-enquiry",
      customer_id: customerId ?? null,
      details: {
        organizationName: data.organizationName,
        state: data.state,
        pincode: data.pincode,
        equipmentRequired: data.equipmentRequired,
        estimatedBudget: data.estimatedBudget,
        timeline: data.timeline,
        ...(ip ? { ip } : {}),
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Admin follow-up: status, assigned staff, next follow-up date, notes
// ---------------------------------------------------------------------------

const STATUS_LABEL = { new: "New", contacted: "Contacted", follow_up: "Follow-up", converted: "Converted", closed: "Closed" };

/**
 * Updates status / assignee / follow-up date. Every change is also written as a note
 * (e.g. "Status: New → Contacted"), so the timeline shows who did what.
 */
export async function updateEnquiry(id, patch, actor) {
  const current = await prisma.enquiry.findUnique({ where: { id }, include: { assignee: { select: { name: true } } } });
  if (!current) throw ApiError.notFound("Enquiry not found");

  const data = {};
  const changes = [];
  if (patch.status !== undefined && patch.status !== current.status) {
    data.status = patch.status;
    changes.push(`Status: ${STATUS_LABEL[current.status]} → ${STATUS_LABEL[patch.status]}`);
  }
  if (patch.assignedTo !== undefined) {
    const next = patch.assignedTo ? BigInt(patch.assignedTo) : null;
    if (String(next ?? "") !== String(current.assigned_to ?? "")) {
      let staffName = "Unassigned";
      if (next) {
        const staff = await prisma.adminUser.findUnique({ where: { id: next }, select: { name: true, status: true } });
        if (!staff || staff.status !== "active") {
          throw ApiError.badRequest("Choose an active staff member", "INVALID_ASSIGNEE", { assignedTo: "Not found" });
        }
        staffName = staff.name;
      }
      data.assigned_to = next;
      changes.push(`Assigned to ${staffName}`);
    }
  }
  if (patch.nextFollowUpDate !== undefined) {
    const next = patch.nextFollowUpDate ? new Date(`${patch.nextFollowUpDate}T00:00:00.000Z`) : null;
    const before = current.next_follow_up_at?.toISOString().slice(0, 10) ?? null;
    if ((patch.nextFollowUpDate || null) !== before) {
      data.next_follow_up_at = next;
      changes.push(next ? `Follow-up on ${patch.nextFollowUpDate}` : "Follow-up date cleared");
    }
  }

  if (changes.length) {
    await prisma.$transaction([
      prisma.enquiry.update({ where: { id }, data }),
      prisma.enquiryNote.create({
        data: { enquiry_id: id, admin_user_id: actor?.id ?? null, note: changes.join(" · "), status_after: data.status ?? null },
      }),
    ]);
  }
  return { enquiry: await getById(id), changes };
}

/** Active staff an enquiry can be assigned to (needs only enquiries.view, not staff.view). */
export async function assignees() {
  const rows = await prisma.adminUser.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: String(r.id), name: r.name }));
}

export async function addNote(id, note, actor) {
  const exists = await prisma.enquiry.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw ApiError.notFound("Enquiry not found");
  await prisma.enquiryNote.create({ data: { enquiry_id: id, admin_user_id: actor?.id ?? null, note } });
  return getById(id);
}
