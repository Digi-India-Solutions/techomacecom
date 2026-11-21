import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listDeals(req, res) {
  const deals = await service.listDeals();
  return ok(res, deals);
}

export async function getDeal(req, res) {
  const deal = await service.getDealById(req.params.id);
  if (!deal) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Deal of the day not found" },
    });
  }
  return ok(res, deal);
}

export async function createDeal(req, res) {
  const deals = await service.createDeal(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "create",
      entityType: "deal",
      entityLabel: req.body.productName || "Deal of the Day",
      summary: `Scheduled Deal of the Day for product #${req.body.productId} at ₹${req.body.dealPrice}`,
    });
  } catch (err) {
    console.warn("Could not log deal creation:", err);
  }

  return ok(res, deals, { status: 201 });
}

export async function updateDeal(req, res) {
  const deals = await service.updateDeal(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "deal",
      entityId: req.params.id.match(/^\d+$/) ? BigInt(req.params.id) : undefined,
      entityLabel: req.body.productName || "Deal of the Day",
      summary: `Updated Deal of the Day #${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log deal update:", err);
  }

  return ok(res, deals);
}

export async function deleteDeal(req, res) {
  const deals = await service.deleteDeal(req.params.id, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "delete",
      entityType: "deal",
      entityId: req.params.id.match(/^\d+$/) ? BigInt(req.params.id) : undefined,
      summary: `Deleted Deal of the Day #${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log deal deletion:", err);
  }

  return ok(res, deals);
}

export async function listPublicDeals(req, res) {
  const deals = await service.listPublicDeals();
  return ok(res, deals);
}

