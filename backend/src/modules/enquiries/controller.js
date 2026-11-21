import { ok, clientIp } from "../../lib/http.js";
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

/** GET /admin/enquiries/:id */
export async function getOne(req, res) {
  return ok(res, await service.getById(BigInt(req.validatedParams.id)));
}
