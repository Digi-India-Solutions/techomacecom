import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listAdminFaqs(req, res, next) {
  try {
    const faqs = await service.listAdminFaqs();
    return ok(res, faqs);
  } catch (err) {
    next(err);
  }
}

export async function createFaq(req, res, next) {
  try {
    const faq = await service.createFaq(req.body);

    try {
      await logActivity(req, {
        module: "content",
        action: "create",
        entityType: "faq",
        entityId: BigInt(faq.id),
        entityLabel: faq.question.slice(0, 50),
        summary: `Created FAQ in "${faq.group}": "${faq.question.slice(0, 40)}..."`,
      });
    } catch (logErr) {
      console.warn("Could not log FAQ creation:", logErr.message);
    }

    return ok(res, faq, { status: 201 });
  } catch (err) {
    next(err);
  }
}

export async function updateFaq(req, res, next) {
  try {
    const faq = await service.updateFaq(req.params.id, req.body);

    try {
      await logActivity(req, {
        module: "content",
        action: "edit",
        entityType: "faq",
        entityId: BigInt(faq.id),
        entityLabel: faq.question.slice(0, 50),
        summary: `Updated FAQ #${faq.id}: "${faq.question.slice(0, 40)}..."`,
      });
    } catch (logErr) {
      console.warn("Could not log FAQ update:", logErr.message);
    }

    return ok(res, faq);
  } catch (err) {
    next(err);
  }
}

export async function reorderFaqs(req, res, next) {
  try {
    const items = req.body.items || req.body;
    const faqs = await service.reorderFaqs(items);
    return ok(res, faqs);
  } catch (err) {
    next(err);
  }
}

export async function deleteFaq(req, res, next) {
  try {
    const result = await service.deleteFaq(req.params.id);

    try {
      await logActivity(req, {
        module: "content",
        action: "delete",
        entityType: "faq",
        entityId: BigInt(req.params.id),
        summary: `Deleted FAQ #${req.params.id}`,
      });
    } catch (logErr) {
      console.warn("Could not log FAQ deletion:", logErr.message);
    }

    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listPublicFaqs(req, res, next) {
  try {
    const faqs = await service.listPublicFaqs(req.query.group);
    return ok(res, faqs);
  } catch (err) {
    next(err);
  }
}

