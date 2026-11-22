/**
 * Reviews API (customer submit/edit, public list + summary, featured, admin moderation)
 * and the new enquiry endpoints (Contact Us, bulk enquiry, admin follow-up).
 *
 *   npm run test:reviews
 *
 * Starts the API on E2E_REV_PORT (default 5096). Creates its own brand, category, product,
 * customers and a delivered order; everything is hard-deleted at the end.
 */
import "dotenv/config";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import prisma from "../../db/db.js";
import { hashPassword } from "../../src/lib/password.js";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.E2E_REV_PORT || 5096);
const API = `http://localhost:${PORT}/api/v1`;
const TAG = `e2erev${Date.now().toString(36)}`;
const PASSWORD = "Secret123";

let server;
let adminCookie = "";
const fx = {}; // fixture ids
const cookies = {}; // customer sessions

async function req(method, url, body, cookie = "") {
  const isForm = body instanceof FormData;
  const res = await fetch(API + url, {
    method,
    headers: { ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  return { status: res.status, setCookie: res.headers.getSetCookie(), ...(await res.json().catch(() => ({}))) };
}
const cookieOf = (res) => res.setCookie.map((c) => c.split(";")[0]).join("; ");
const expectStatus = (res, status) => assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.error || res.data)}`);

async function makeCustomer(key, mobile) {
  const row = await prisma.customer.create({
    data: {
      name: `${TAG} ${key}`,
      email: `${TAG}.${key}@example.test`,
      mobile,
      password_hash: await hashPassword(PASSWORD),
      email_verified_at: new Date(),
    },
  });
  const login = await req("POST", "/auth/login", { email: row.email, password: PASSWORD });
  expectStatus(login, 200);
  cookies[key] = cookieOf(login);
  return row;
}

async function uploadPhoto(cookie) {
  const png = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#3366ff" } }).png().toBuffer();
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "photo.png");
  return req("POST", "/reviews/images", form, cookie);
}

const review = (over = {}) => ({
  productId: fx.productId,
  rating: 5,
  name: "Dr. Test",
  title: "Great device",
  comment: "Works perfectly in our clinic, very quiet and reliable.",
  ...over,
});

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "development",
      ENQUIRY_RATE_LIMIT: "1000",
      REVIEW_RATE_LIMIT: "1000",
      CUSTOMER_AUTH_RATE_LIMIT: "1000",
      EMAIL_USER: "",
      EMAIL_PASS: "",
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/health`)).ok) break;
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const login = await req("POST", "/admin/auth/login", { email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD });
  expectStatus(login, 200);
  adminCookie = cookieOf(login);
  fx.adminId = BigInt(login.data.user?.id ?? login.data.id ?? 0);

  const brand = await prisma.brand.create({ data: { name: `${TAG} Brand`, slug: `${TAG}-brand` } });
  const category = await prisma.category.create({ data: { name: `${TAG} Cat`, slug: `${TAG}-cat` } });
  const product = await prisma.product.create({
    data: { name: `${TAG} CPAP`, slug: `${TAG}-cpap`, sku: `${TAG}-SKU`, brand_id: brand.id, category_id: category.id, status: "active" },
  });
  const variant = await prisma.productVariant.create({
    data: { product_id: product.id, name: "Default", sku: `${TAG}-V1`, price_paise: 100000n, mrp_paise: 120000n, is_default: true },
  });
  Object.assign(fx, { brandId: brand.id, categoryId: category.id, productId: String(product.id), product: product.id, variantId: variant.id });

  fx.buyer = await makeCustomer("buyer", `98${String(Date.now()).slice(-8)}`);
  fx.other = await makeCustomer("other", `97${String(Date.now()).slice(-8)}`);

  // buyer has a delivered order with the product → verified buyer
  const order = await prisma.order.create({
    data: {
      order_number: `T${Date.now().toString(36)}`.slice(0, 20),
      customer_id: fx.buyer.id,
      status: "delivered",
      payment_method: "cod",
      shipping_address: {},
      subtotal_paise: 100000n,
      total_paise: 100000n,
      items: {
        create: {
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          sku: variant.sku,
          quantity: 1,
          unit_price_paise: 100000n,
          mrp_paise: 120000n,
          gst_rate: 18,
          line_total_paise: 100000n,
        },
      },
    },
  });
  fx.orderId = order.id;
});

after(async () => {
  try {
    const customerIds = [fx.buyer?.id, fx.other?.id].filter(Boolean);
    if (fx.product) await prisma.review.deleteMany({ where: { product_id: fx.product } });
    if (fx.orderId) await prisma.order.deleteMany({ where: { id: fx.orderId } });
    await prisma.authSession.deleteMany({ where: { customer_id: { in: customerIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    if (fx.product) await prisma.product.deleteMany({ where: { id: fx.product } });
    if (fx.categoryId) await prisma.category.deleteMany({ where: { id: fx.categoryId } });
    if (fx.brandId) await prisma.brand.deleteMany({ where: { id: fx.brandId } });
    await prisma.enquiry.deleteMany({ where: { name: { startsWith: TAG } } });
  } finally {
    await prisma.$disconnect();
    server?.kill();
  }
});

// ---------------------------------------------------------------------------

describe("Reviews — customer", () => {
  it("writing a review needs a signed-in customer", async () => {
    expectStatus(await req("POST", "/reviews", review()), 401);
    expectStatus(await req("GET", `/reviews/mine?productId=${fx.productId}`), 401);
  });

  it("validates rating, comment length, product, photo paths", async () => {
    const c = cookies.buyer;
    const cases = [
      [{ rating: 0 }, "rating"],
      [{ rating: 6 }, "rating"],
      [{ comment: "too short" }, "comment"],
      [{ comment: "x".repeat(601) }, "comment"],
      [{ name: "" }, "name"],
      [{ images: ["a", "b", "c", "d"] }, "images"],
    ];
    for (const [over, field] of cases) {
      const res = await req("POST", "/reviews", review(over), c);
      expectStatus(res, 422);
      assert.ok(field in res.error.fields, `${field} in ${JSON.stringify(res.error.fields)}`);
    }
    expectStatus(await req("POST", "/reviews", review({ images: ["https://evil.example/x.png"] }), c), 400);
    expectStatus(await req("POST", "/reviews", review({ images: ["/uploads/products/2026/11/abcdefabcdefabcdefab.webp"] }), c), 400);
    expectStatus(await req("POST", "/reviews", review({ productId: "999999999999" }), c), 404);
  });

  it("uploads a photo and creates a pending, verified-buyer review", async () => {
    const up = await uploadPhoto(cookies.buyer);
    expectStatus(up, 201);
    assert.match(up.data.path, /^\/uploads\/reviews\/\d{4}\/\d{2}\/[a-f0-9]{20}\.webp$/);
    fx.photo = up.data.path;

    const res = await req("POST", "/reviews", review({ images: [fx.photo] }), cookies.buyer);
    expectStatus(res, 201);
    assert.equal(res.data.review.status, "pending");
    assert.equal(res.data.review.isVerifiedBuyer, true);
    assert.equal(res.data.review.images.length, 1);
    fx.buyerReview = res.data.review.id;

    // not public yet
    const pub = await req("GET", `/reviews/product/${fx.productId}`);
    expectStatus(pub, 200);
    assert.equal(pub.data.reviews.length, 0);
    assert.equal(pub.data.summary.count, 0);
  });

  it("a customer without a delivered order is not a verified buyer", async () => {
    const res = await req("POST", "/reviews", review({ rating: 2, name: "Other", comment: "Average experience, the mask is not very comfortable." }), cookies.other);
    expectStatus(res, 201);
    assert.equal(res.data.review.isVerifiedBuyer, false);
    fx.otherReview = res.data.review.id;
  });

  it("GET /reviews/mine returns the own review for prefill", async () => {
    const res = await req("GET", `/reviews/mine?productId=${fx.productId}`, null, cookies.buyer);
    expectStatus(res, 200);
    assert.equal(res.data.review.id, fx.buyerReview);
    assert.deepEqual(res.data.review.imagePaths, [fx.photo]);
    assert.equal(res.data.verifiedBuyer, true);
  });
});

describe("Reviews — admin moderation", () => {
  it("needs a staff session", async () => {
    expectStatus(await req("GET", "/admin/reviews"), 401);
    expectStatus(await req("GET", "/admin/reviews", null, cookies.buyer), 401);
  });

  it("lists with filters and summary counts", async () => {
    const res = await req("GET", `/admin/reviews?productId=${fx.productId}&status=pending`, null, adminCookie);
    expectStatus(res, 200);
    assert.equal(res.meta.total, 2);
    const mine = res.data.find((r) => r.id === fx.buyerReview);
    assert.equal(mine.productName, `${TAG} CPAP`);
    assert.match(mine.reviewerMobileMasked, /^X+\d{4}$/);
    assert.equal(mine.reviewerEmail, `${TAG}.buyer@example.test`);

    const verified = await req("GET", `/admin/reviews?productId=${fx.productId}&verified=true`, null, adminCookie);
    assert.deepEqual(verified.data.map((r) => r.id), [fx.buyerReview]);
    const low = await req("GET", `/admin/reviews?productId=${fx.productId}&rating=2`, null, adminCookie);
    assert.deepEqual(low.data.map((r) => r.id), [fx.otherReview]);
    const search = await req("GET", `/admin/reviews?q=${TAG}`, null, adminCookie);
    assert.equal(search.meta.total, 2);

    const summary = await req("GET", "/admin/reviews/summary", null, adminCookie);
    expectStatus(summary, 200);
    assert.ok(summary.data.counts.pending >= 2);
  });

  it("reject needs a reason; cannot feature a pending review", async () => {
    expectStatus(await req("PATCH", `/admin/reviews/${fx.otherReview}/status`, { status: "rejected" }, adminCookie), 422);
    const feat = await req("PATCH", `/admin/reviews/${fx.buyerReview}/feature`, { featured: true }, adminCookie);
    expectStatus(feat, 400);
    assert.equal(feat.error.code, "REVIEW_NOT_APPROVED");
  });

  it("approve → public + product rating recomputed", async () => {
    expectStatus(await req("PATCH", `/admin/reviews/${fx.buyerReview}/status`, { status: "approved" }, adminCookie), 200);
    expectStatus(await req("PATCH", `/admin/reviews/${fx.otherReview}/status`, { status: "approved" }, adminCookie), 200);

    const product = await prisma.product.findUnique({ where: { id: fx.product } });
    assert.equal(Number(product.rating_avg), 3.5);
    assert.equal(product.rating_count, 2);

    const pub = await req("GET", `/reviews/product/${fx.productId}?sort=highest`);
    expectStatus(pub, 200);
    assert.deepEqual(pub.data.reviews.map((r) => r.rating), [5, 2]);
    assert.equal(pub.data.summary.average, 3.5);
    assert.equal(pub.data.summary.breakdown[5], 1);
    assert.equal(pub.data.summary.breakdown[2], 1);
    assert.equal(pub.data.summary.withPhotos, 1);
    assert.equal(pub.data.reviews[0].mobile, undefined, "mobile must never be public");

    const onlyTwo = await req("GET", `/reviews/product/${fx.productId}?rating=2`);
    assert.equal(onlyTwo.data.reviews.length, 1);
  });

  it("reply, edit text, feature, verified badge", async () => {
    const reply = await req("PATCH", `/admin/reviews/${fx.buyerReview}/reply`, { reply: "Thank you, doctor!" }, adminCookie);
    expectStatus(reply, 200);
    assert.equal(reply.data.adminReply, "Thank you, doctor!");

    const edit = await req("PUT", `/admin/reviews/${fx.otherReview}`, { title: "", comment: "Average experience, mask fit could be better." }, adminCookie);
    expectStatus(edit, 200);
    assert.equal(edit.data.comment, "Average experience, mask fit could be better.");

    expectStatus(await req("PATCH", `/admin/reviews/${fx.buyerReview}/feature`, { featured: true }, adminCookie), 200);
    const featured = await req("GET", "/reviews/featured?limit=24");
    expectStatus(featured, 200);
    const f = featured.data.find((r) => r.id === fx.buyerReview);
    assert.ok(f, "featured review is listed");
    assert.equal(f.productName, `${TAG} CPAP`);
    assert.equal(f.adminReply, "Thank you, doctor!");

    const v = await req("PATCH", `/admin/reviews/${fx.otherReview}/verified`, { verified: true }, adminCookie);
    expectStatus(v, 200);
    assert.equal(v.data.verifiedBuyer, true);
  });

  it("customer edit sends it back to pending and un-features it", async () => {
    const res = await req("POST", "/reviews", review({ rating: 4, images: [] }), cookies.buyer);
    expectStatus(res, 200);
    assert.equal(res.data.review.status, "pending");
    const row = await prisma.review.findUnique({ where: { id: BigInt(fx.buyerReview) } });
    assert.equal(row.is_featured, false);
    assert.equal(row.is_verified_buyer, true);
    assert.equal(await prisma.review.count({ where: { product_id: fx.product, customer_id: fx.buyer.id } }), 1, "still one review");
    const product = await prisma.product.findUnique({ where: { id: fx.product } });
    assert.equal(product.rating_count, 1);
    assert.equal(Number(product.rating_avg), 2);
  });

  it("bulk approve, then reject (unpublish) with reason", async () => {
    const ids = [fx.buyerReview, fx.otherReview];
    expectStatus(await req("POST", "/admin/reviews/bulk", { ids, action: "reject" }, adminCookie), 422);
    const ok1 = await req("POST", "/admin/reviews/bulk", { ids, action: "approve" }, adminCookie);
    expectStatus(ok1, 200);
    assert.equal(ok1.data.count, 2);
    let product = await prisma.product.findUnique({ where: { id: fx.product } });
    assert.equal(product.rating_count, 2);
    assert.equal(Number(product.rating_avg), 3);

    const ok2 = await req("POST", "/admin/reviews/bulk", { ids: [fx.otherReview], action: "reject", reason: "Off-topic" }, adminCookie);
    expectStatus(ok2, 200);
    product = await prisma.product.findUnique({ where: { id: fx.product } });
    assert.equal(product.rating_count, 1);
    assert.equal(Number(product.rating_avg), 4);

    const mine = await req("GET", `/reviews/mine?productId=${fx.productId}`, null, cookies.other);
    assert.equal(mine.data.review.status, "rejected");
    assert.equal(mine.data.review.rejectionReason, "Off-topic");
  });

  it("delete single + bulk delete; rating goes back to 0", async () => {
    expectStatus(await req("DELETE", `/admin/reviews/${fx.otherReview}`, null, adminCookie), 200);
    expectStatus(await req("DELETE", `/admin/reviews/${fx.otherReview}`, null, adminCookie), 404);
    const bulk = await req("POST", "/admin/reviews/bulk", { ids: [fx.buyerReview], action: "delete" }, adminCookie);
    expectStatus(bulk, 200);
    const product = await prisma.product.findUnique({ where: { id: fx.product } });
    assert.equal(product.rating_count, 0);
    assert.equal(Number(product.rating_avg), 0);
    assert.equal(await prisma.review.count({ where: { product_id: fx.product } }), 0);
  });
});

// ---------------------------------------------------------------------------

describe("Enquiries — Contact Us + bulk + admin follow-up", () => {
  const contact = (over = {}) => ({
    name: `${TAG} Contact`,
    mobile: "9876543210",
    email: "doc@example.test",
    subject: "Product enquiry",
    message: "Please share the price of the CPAP machine.",
    ...over,
  });
  const bulk = (over = {}) => ({
    name: `${TAG} Bulk`,
    organizationName: "City Hospital",
    email: "buy@example.test",
    mobile: "9876543211",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    equipmentRequired: ["ICU Beds", "Patient Monitors"],
    estimatedBudget: "10-25 lakh",
    timeline: "1 month",
    message: "Need 20 beds",
    ...over,
  });

  it("POST /enquiries/contact saves a contact enquiry", async () => {
    const res = await req("POST", "/enquiries/contact", contact());
    expectStatus(res, 201);
    assert.match(res.data.enquiryId, /^ENQ-CT-\d{6}$/);
    const row = await prisma.enquiry.findFirst({ where: { name: `${TAG} Contact` } });
    assert.equal(row.type, "contact");
    assert.equal(row.details.subject, "Product enquiry");
    fx.contactId = String(row.id);
  });

  it("contact validation + honeypot", async () => {
    for (const [over, field] of [
      [{ email: "nope" }, "email"],
      [{ mobile: "123" }, "mobile"],
      [{ subject: "" }, "subject"],
      [{ message: "hi" }, "message"],
    ]) {
      const res = await req("POST", "/enquiries/contact", contact(over));
      expectStatus(res, 422);
      assert.ok(field in res.error.fields, field);
    }
    const bot = await req("POST", "/enquiries/contact", contact({ name: `${TAG} Bot`, honeypot: "x" }));
    expectStatus(bot, 201);
    assert.equal(await prisma.enquiry.count({ where: { name: `${TAG} Bot` } }), 0);
  });

  it("POST /enquiries/bulk saves a bulk enquiry", async () => {
    const res = await req("POST", "/enquiries/bulk", bulk());
    expectStatus(res, 201);
    assert.match(res.data.enquiryId, /^ENQ-BK-\d{6}$/);
    expectStatus(await req("POST", "/enquiries/bulk", bulk({ pincode: "12" })), 422);
    expectStatus(await req("POST", "/enquiries/bulk", bulk({ organizationName: "" })), 422);
    const list = await req("GET", `/admin/enquiries?type=bulk&q=${TAG}`, null, adminCookie);
    assert.equal(list.meta.total, 1);
    assert.equal(list.data[0].organization, "City Hospital");
    assert.equal(list.data[0].productsSummary, "ICU Beds, Patient Monitors");
  });

  it("admin updates status / assignee / follow-up and adds notes", async () => {
    expectStatus(await req("PATCH", `/admin/enquiries/${fx.contactId}`, { status: "contacted" }), 401);
    expectStatus(await req("PATCH", `/admin/enquiries/${fx.contactId}`, {}, adminCookie), 422);
    expectStatus(await req("PATCH", `/admin/enquiries/${fx.contactId}`, { status: "won" }, adminCookie), 422);
    expectStatus(await req("PATCH", `/admin/enquiries/${fx.contactId}`, { assignedTo: "999999999" }, adminCookie), 400);

    const staff = await prisma.adminUser.findFirst({ where: { status: "active" } });
    const res = await req(
      "PATCH",
      `/admin/enquiries/${fx.contactId}`,
      { status: "contacted", assignedTo: String(staff.id), nextFollowUpDate: "2026-12-05" },
      adminCookie
    );
    expectStatus(res, 200);
    assert.equal(res.data.status, "contacted");
    assert.equal(res.data.assignedStaffId, String(staff.id));
    assert.equal(res.data.assignedStaffName, staff.name);
    assert.equal(res.data.nextFollowUpDate, "2026-12-05");
    assert.equal(res.data.notes.length, 1, "auto note for the change");
    assert.match(res.data.notes[0].text, /Status: New → Contacted/);

    const note = await req("POST", `/admin/enquiries/${fx.contactId}/notes`, { note: "Called, will visit next week" }, adminCookie);
    expectStatus(note, 201);
    assert.equal(note.data.notes[0].text, "Called, will visit next week");
    expectStatus(await req("POST", `/admin/enquiries/${fx.contactId}/notes`, { note: "  " }, adminCookie), 422);

    const clear = await req("PATCH", `/admin/enquiries/${fx.contactId}`, { assignedTo: null, nextFollowUpDate: "" }, adminCookie);
    expectStatus(clear, 200);
    assert.equal(clear.data.assignedStaffId, null);
    assert.equal(clear.data.nextFollowUpDate, null);

    // unchanged values → no extra note
    const same = await req("PATCH", `/admin/enquiries/${fx.contactId}`, { status: "contacted" }, adminCookie);
    assert.equal(same.data.notes.length, clear.data.notes.length);
  });
});
