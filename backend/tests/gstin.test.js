import { test } from "node:test";
import assert from "node:assert/strict";
import { checkGstin, gstinCheckChar } from "../src/lib/gstin.js";

test("accepts real GSTINs and reports their state and PAN", () => {
  const r = checkGstin(" 27aapfu0939f1zv ");
  assert.equal(r.valid, true);
  assert.equal(r.gstin, "27AAPFU0939F1ZV");
  assert.equal(r.stateName, "Maharashtra");
  assert.equal(r.pan, "AAPFU0939F");
  assert.equal(checkGstin("29AAGCB7383J1Z4").stateName, "Karnataka");
});

test("rejects a GSTIN with one mistyped character (check digit)", () => {
  const r = checkGstin("27AAPFU0939F1ZW");
  assert.equal(r.valid, false);
  assert.equal(r.reason, "checksum");
  assert.equal(gstinCheckChar("27AAPFU0939F1Z"), "V");
});

test("rejects wrong length, format and state code", () => {
  assert.equal(checkGstin("27AAPFU0939F1Z").reason, "length");
  assert.equal(checkGstin("27AAPFU0939F1AV").reason, "format");
  assert.equal(checkGstin("99AAPFU0939F1ZV").reason, "state");
});
