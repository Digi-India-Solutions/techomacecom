import { ok, clientIp } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

/**
 * POST /enquiries — public sleep-test callback form.
 * A filled honeypot gets the same success answer (bots learn nothing) but is never stored.
 */
export async function createSleepTest(req, res) {
  if (req.body.honeypot) {
    return ok(res, { enquiryId: service.enquiryCode(Date.now() % 1_000_000), message: "Thank you! We will call you shortly." }, { status: 201 });
  }
  const { row, quiz } = await service.createSleepTestEnquiry(req.body, {
    customerId: req.customer?.id,
    ip: clientIp(req),
  });
  return ok(
    res,
    {
      enquiryId: service.enquiryCode(row.id, row.type),
      message: "Thank you! Our clinical sleep advisor will call you shortly.",
      // Server-side STOP-BANG result (the storefront shows the same)
      ...(quiz ? { risk: quiz.risk, score: quiz.score, bmi: quiz.bmi } : {}),
    },
    { status: 201 }
  );
}

/**
 * POST /enquiries/seller — public seller registration application.
 */
export async function createSeller(req, res) {
  if (req.body.honeypot) {
    const dummyId = `VND-${String(Date.now() % 1_000_000).padStart(6, "0")}`;
    return ok(res, { enquiryId: dummyId, message: "Thank you! Our vendor onboarding team will contact you shortly." }, { status: 201 });
  }
  const { row } = await service.createSellerRegistration(req.body, {
    customerId: req.customer?.id,
    ip: clientIp(req),
  });
  return ok(
    res,
    {
      enquiryId: `VND-${String(row.id).padStart(6, "0")}`,
      message: "Application submitted successfully! Our vendor onboarding team will verify your details and reach out within 24–48 hours.",
    },
    { status: 201 }
  );
}

/** GET /admin/enquiries */
export async function list(req, res) {
  const { rows, meta } = await service.list(req.validatedQuery);
  return ok(res, rows, { meta });
}

/** GET /admin/enquiries/assignees */
export async function assignees(req, res) {
  return ok(res, await service.assignees());
}

/** GET /admin/enquiries/:id */
export async function getOne(req, res) {
  return ok(res, await service.getById(BigInt(req.validatedParams.id)));
}

/**
 * POST /enquiries/contact — Contact Us page.
 * POST /enquiries/bulk    — hospital / clinic bulk-order enquiry.
 * Same honeypot rule as above: bots get a believable answer, nothing is stored.
 */
export async function createContact(req, res) {
  if (req.body.honeypot) {
    return ok(res, { enquiryId: service.enquiryCode(Date.now() % 1_000_000, "contact"), message: "Thank you! We will get back to you shortly." }, { status: 201 });
  }
  const row = await service.createContactEnquiry(req.body, { customerId: req.customer?.id, ip: clientIp(req) });
  return ok(
    res,
    { enquiryId: service.enquiryCode(row.id, row.type), message: "Thank you! Our team will get back to you within 24 hours." },
    { status: 201 }
  );
}

export async function createBulk(req, res) {
  if (req.body.honeypot) {
    return ok(res, { enquiryId: service.enquiryCode(Date.now() % 1_000_000, "bulk"), message: "Thank you! Our B2B team will contact you shortly." }, { status: 201 });
  }
  const row = await service.createBulkEnquiry(req.body, { customerId: req.customer?.id, ip: clientIp(req) });
  return ok(
    res,
    { enquiryId: service.enquiryCode(row.id, row.type), message: "Thank you! Our B2B team will share a quotation within 24–48 hours." },
    { status: 201 }
  );
}

/** PATCH /admin/enquiries/:id — status / assigned staff / next follow-up date. */
export async function update(req, res) {
  const { enquiry, changes } = await service.updateEnquiry(BigInt(req.validatedParams.id), req.body, req.admin);
  if (changes.length) {
    await logActivity(req, {
      module: "enquiries",
      action: req.body.status !== undefined && changes.some((c) => c.startsWith("Status")) ? "status_change" : "update",
      entityType: "enquiry",
      entityId: BigInt(enquiry.id),
      entityLabel: `${enquiry.code} · ${enquiry.name}`,
      summary: changes.join(" · "),
    });
  }
  return ok(res, enquiry);
}

/** POST /admin/enquiries/:id/notes */
export async function addNote(req, res) {
  const enquiry = await service.addNote(BigInt(req.validatedParams.id), req.body.note, req.admin);
  await logActivity(req, {
    module: "enquiries",
    action: "note",
    entityType: "enquiry",
    entityId: BigInt(enquiry.id),
    entityLabel: `${enquiry.code} · ${enquiry.name}`,
    summary: "Added a follow-up note",
  });
  return ok(res, enquiry, { status: 201 });
}
