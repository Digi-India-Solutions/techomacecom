import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listCoupons(req, res) {
  const coupons = await service.listCoupons();
  return ok(res, coupons);
}

export async function getCoupon(req, res) {
  const coupon = await service.getCouponById(req.params.id);
  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Coupon not found" },
    });
  }
  return ok(res, coupon);
}

export async function createCoupon(req, res) {
  const coupons = await service.createCoupon(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "create",
      entityType: "coupon",
      entityLabel: req.body.code,
      summary: `Created coupon "${req.body.code}" (${req.body.type === 'percentage' ? `${req.body.value}% off` : `₹${req.body.value} off`})`,
    });
  } catch (err) {
    console.warn("Could not log coupon creation:", err);
  }

  return ok(res, coupons, { status: 201 });
}

export async function updateCoupon(req, res) {
  const coupons = await service.updateCoupon(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "coupon",
      entityId: req.params.id.match(/^\d+$/) ? BigInt(req.params.id) : undefined,
      entityLabel: req.body.code || "Coupon",
      summary: `Updated coupon #${req.params.id} (${req.body.code || ''})`,
    });
  } catch (err) {
    console.warn("Could not log coupon update:", err);
  }

  return ok(res, coupons);
}

export async function deleteCoupon(req, res) {
  const coupons = await service.deleteCoupon(req.params.id, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "delete",
      entityType: "coupon",
      entityId: req.params.id.match(/^\d+$/) ? BigInt(req.params.id) : undefined,
      summary: `Deleted coupon #${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log coupon deletion:", err);
  }

  return ok(res, coupons);
}

export async function applyCoupon(req, res) {
  const result = await service.validateAndApplyCoupon({
    code: req.body.code,
    orderTotalPaise: req.body.orderTotalPaise,
    customerId: req.user?.id,
  });
  return ok(res, result);
}

