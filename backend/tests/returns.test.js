import { test } from "node:test";
import assert from "node:assert/strict";
import "../config/load-env.js";
import { estimateRefund, returnPolicy, returnedQtyByItem } from "../src/modules/returns/policy.js";
import { paidAmountPaise, refundedAmountPaise } from "../src/modules/refunds/service.js";
import { buildSteps } from "../src/modules/returns/dto.js";

const DAY = 24 * 60 * 60 * 1000;
const settings = {
  returnsEnabled: true,
  returnWindowDays: 7,
  refundEnabled: true,
  replacementEnabled: true,
  nonReturnableCategoryIds: [],
};
const ctx = (over = {}, blocked = []) => ({
  settings: { ...settings, ...over },
  parents: new Map([
    ["10", null],
    ["11", "10"],
  ]),
  blocked: new Set(blocked),
});

// ₹5,000 × 2 + ₹2,500 × 1 = ₹12,500 goods, ₹149 shipping
const order = (over = {}) => ({
  id: 1n,
  status: "delivered",
  delivered_at: new Date(Date.now() - DAY),
  total_paise: 1264900n,
  shipping_paise: 14900n,
  cod_charge_paise: 0n,
  items: [
    { id: 101n, quantity: 2, line_total_paise: 1000000n, product: { category_id: 11n } },
    { id: 102n, quantity: 1, line_total_paise: 250000n, product: { category_id: 20n } },
  ],
  returns: [],
  ...over,
});

test("partial return refunds the item's share of goods (no shipping)", () => {
  const o = order();
  const { total, perLine } = estimateRefund(o, [{ item: o.items[0], quantity: 1 }]);
  assert.equal(total, 500000n);
  assert.deepEqual(perLine, [500000n]);
});

test("returning every unit refunds the full order total, shipping included", () => {
  const o = order();
  const { total, perLine } = estimateRefund(o, [
    { item: o.items[0], quantity: 2 },
    { item: o.items[1], quantity: 1 },
  ]);
  assert.equal(total, 1264900n);
  assert.equal(perLine.reduce((a, b) => a + b, 0n), 1264900n);
});

test("coupon discounts are shared out in proportion to what was paid", () => {
  // ₹1,250 coupon on ₹12,500 goods → customer paid ₹11,250 for goods
  const o = order({ total_paise: 1125000n, shipping_paise: 0n });
  const { total } = estimateRefund(o, [{ item: o.items[1], quantity: 1 }]);
  assert.equal(total, 225000n); // ₹2,500 × 0.9
});

test("window: open within 7 days, closed after", () => {
  assert.equal(returnPolicy(order(), ctx()).canReturn, true);
  const late = returnPolicy(order({ delivered_at: new Date(Date.now() - 8 * DAY) }), ctx());
  assert.equal(late.canReturn, false);
  assert.match(late.blockReason, /7-day return window/);
  assert.ok(late.items.every((i) => i.returnableQty === 0));
});

test("not delivered yet → not returnable and no message", () => {
  const p = returnPolicy(order({ status: "shipped", delivered_at: null }), ctx());
  assert.equal(p.canReturn, false);
  assert.equal(p.blockReason, null);
});

test("non-returnable parent category blocks its sub-categories", () => {
  const p = returnPolicy(order(), ctx({}, ["10"]));
  assert.equal(p.items[0].nonReturnable, true);
  assert.equal(p.items[0].returnableQty, 0);
  assert.equal(p.items[1].returnableQty, 1);
  assert.equal(p.canReturn, true);
});

test("units in a live return are not returnable again; rejected ones are released", () => {
  const returns = [
    { status: "requested", items: [{ order_item_id: 101n, quantity: 1 }] },
    { status: "rejected", items: [{ order_item_id: 102n, quantity: 1 }] },
  ];
  const used = returnedQtyByItem(returns);
  assert.equal(used.get("101"), 1);
  assert.equal(used.get("102"), undefined);
  const p = returnPolicy(order({ returns }), ctx());
  assert.equal(p.items[0].returnableQty, 1);
  assert.equal(p.items[1].returnableQty, 1);
});

test("returns switched off in settings", () => {
  const p = returnPolicy(order(), ctx({ returnsEnabled: false }));
  assert.equal(p.canReturn, false);
  assert.match(p.blockReason, /not available/);
});

test("paid amount: captured payments, COD after delivery, nothing before", () => {
  assert.equal(paidAmountPaise(order({ payment_method: "cod", payment_status: "pending" })), 1264900n);
  assert.equal(paidAmountPaise(order({ status: "confirmed", payment_method: "cod", payment_status: "pending" })), 0n);
  assert.equal(
    paidAmountPaise(order({ payment_method: "razorpay", payment_status: "paid" }), [
      { status: "captured", purpose: "order", amount_paise: 1000000n },
      { status: "failed", purpose: "order", amount_paise: 999n },
    ]),
    1000000n
  );
  assert.equal(
    refundedAmountPaise([
      { status: "processed", amount_paise: 100n },
      { status: "processing", amount_paise: 50n },
      { status: "failed", amount_paise: 999n },
    ]),
    150n
  );
});

test("progress steps follow the resolution actually used", () => {
  const steps = buildSteps({ status: "refunded", type: "replacement", created_at: new Date(), status_history: [] });
  assert.deepEqual(steps.map((s) => s.key), ["requested", "approved", "pickup_scheduled", "received", "refunded"]);
  assert.ok(steps.every((s) => s.done));
  const rejected = buildSteps({ status: "rejected", type: "refund", created_at: new Date(), status_history: [] });
  assert.deepEqual(rejected.map((s) => s.key), ["requested", "rejected"]);
});
