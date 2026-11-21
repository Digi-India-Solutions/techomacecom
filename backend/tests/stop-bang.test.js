import { test } from "node:test";
import assert from "node:assert/strict";
import { bmiFrom, scoreStopBang } from "../src/modules/enquiries/stop-bang.js";

const none = { snoring: false, tired: false, observed: false, pressure: false, age: false, neck: false, male: false };

test("BMI is kg/m², one decimal; implausible input → null", () => {
  assert.equal(bmiFrom(170, 70), 24.2);
  assert.equal(bmiFrom(160, 100), 39.1);
  assert.equal(bmiFrom(0, 70), null);
  assert.equal(bmiFrom(170, 5), null);
  assert.equal(bmiFrom("abc", 70), null);
});

test("0–2 yes → low (e.g. daytime tiredness + born male, as on the reference site)", () => {
  assert.deepEqual(scoreStopBang(none, 22).risk, "low");
  const r = scoreStopBang({ ...none, tired: true, male: true }, 24);
  assert.equal(r.score, 2);
  assert.equal(r.risk, "low");
  assert.deepEqual(r.signs, ["Daytime tiredness", "Born male"]);
});

test("3–4 yes → moderate when the high-risk combination is not met", () => {
  const r = scoreStopBang({ ...none, snoring: true, age: true, neck: false }, 30); // S + A + nothing → 2
  assert.equal(r.risk, "low");
  const m = scoreStopBang({ ...none, snoring: true, age: true, pressure: false }, 36); // S + B + A = 3, STOP=1
  assert.equal(m.score, 3);
  assert.equal(m.risk, "moderate");
});

test("3–4 yes with 2+ STOP items and (male | BMI > 35 | neck) → high", () => {
  assert.equal(scoreStopBang({ ...none, snoring: true, tired: true, male: true }, 24).risk, "high");
  assert.equal(scoreStopBang({ ...none, snoring: true, observed: true }, 36).risk, "high");
  assert.equal(scoreStopBang({ ...none, tired: true, pressure: true, neck: true }, 24).risk, "high");
  assert.equal(scoreStopBang({ ...none, tired: true, pressure: true, age: true }, 24).risk, "moderate");
});

test("5–8 yes → high; BMI exactly 35 does not count", () => {
  assert.equal(scoreStopBang({ ...none, snoring: true, age: true, neck: true, male: true, pressure: true }, 20).risk, "high");
  assert.equal(scoreStopBang(none, 35).score, 0);
  assert.equal(scoreStopBang(none, 35.1).score, 1);
});
