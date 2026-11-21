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
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

export async function list({ page, limit, sort, q, type, status, risk }) {
  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(risk && { details: { path: ["quiz", "risk"], equals: risk } }),
    ...searchWhere(q, ["name", "mobile", "email", "city"]),
  };
  const { rows, meta } = await paginate(prisma.enquiry, {
    where,
    orderBy: buildOrderBy(sort, { createdAt: "created_at", name: "name", status: "status" }, "-createdAt"),
    page,
    limit,
  });
  return { rows: rows.map(toAdminDto), meta };
}

export async function getById(id) {
  const row = await prisma.enquiry.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound("Enquiry not found");
  return toAdminDto(row);
}
