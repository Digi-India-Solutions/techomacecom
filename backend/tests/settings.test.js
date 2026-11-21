import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEMAS, toAdminForm, DEFAULTS } from "../src/modules/settings/definitions.js";
import { readPincodeCsv, parseCsv } from "../src/modules/settings/pincodes.service.js";
import { render } from "../src/services/notification.service.js";

test("shipping form: rupees in, paise stored, and back", () => {
  const stored = SCHEMAS.shipping.parse({
    flatShippingCharge: 149.5, freeShippingAbove: 1999, codEnabled: true, codMaxOrderValue: 50000, codCharge: 0,
    defaultDeliveryDays: "3-7", dispatchCutoffTime: "14:00",
  });
  assert.equal(stored.flatShippingChargePaise, 14950);
  assert.equal(toAdminForm("shipping", stored).flatShippingCharge, 149.5);
});

test("store form rejects a mistyped GSTIN and a bad WhatsApp number", () => {
  const base = { ...DEFAULTS.store };
  const r = SCHEMAS.store.safeParse({ ...base, gstin: "27AAPFU0939F1ZW", whatsappNumber: "12345" });
  assert.equal(r.success, false);
  const fields = r.error.issues.map((i) => i.path[0]);
  assert.ok(fields.includes("gstin") && fields.includes("whatsappNumber"));
  assert.equal(SCHEMAS.store.parse({ ...base, whatsappNumber: "+91 98112 34567" }).whatsappNumber, "9811234567");
});

test("PIN code CSV: header aliases, quotes, state abbreviations, bad rows reported", () => {
  assert.deepEqual(parseCsv('a,"b, c"\n1,"say ""hi"""'), [["a", "b, c"], ["1", 'say "hi"']]);
  const { rows, errors } = readPincodeCsv("PIN,City,State,COD,Days\n110020,New Delhi,DL,yes,1-2\n560001,Bengaluru,Karnataka,no,\n99,x,,,\n");
  assert.deepEqual(rows.map((r) => [r.pincode, r.state, r.cod_available, r.delivery_days]), [
    ["110020", "Delhi", true, "1-2"],
    ["560001", "Karnataka", false, null],
  ]);
  assert.equal(errors.length, 1);
});

test("notification templates fill {{variables}}", () => {
  assert.equal(render("Hi {{customer_name}}, order {{ order_number }} {{missing}}!", { customer_name: "A", order_number: "B-1" }), "Hi A, order B-1 !");
});
