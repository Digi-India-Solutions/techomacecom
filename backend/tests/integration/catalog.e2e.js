/**
 * Catalog end-to-end API tests (categories → brands → products → storefront).
 *
 *   npm run test:catalog
 *
 * What it does:
 *   1. starts this API on a spare port (E2E_PORT, default 5099) against the DB in .env
 *   2. signs in as SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD from .env, plus a temporary
 *      limited "editor" staff account (products.view + products.edit only)
 *   3. exercises every catalog endpoint and its edge cases over real HTTP
 *   4. HARD-deletes everything it created (rows are tagged "E2E<run>"), its uploaded
 *      image, the temporary staff/role and the activity-log rows it wrote
 *
 * Needs: PostgreSQL running, `npm run db:seed` done. Safe on a dev DB with real data —
 * it only touches rows it created (the category drag-and-drop test re-sends the existing
 * tree unchanged around its own rows).
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
const PORT = Number(process.env.E2E_PORT || 5099);
const ORIGIN = `http://localhost:${PORT}`;
const API = `${ORIGIN}/api/v1`;
const RUN = Date.now().toString(36).toUpperCase();
const TAG = `E2E${RUN}`; // in every name / SKU this run creates
const tag = (s) => `${TAG} ${s}`;
const sku = (s) => `${TAG}-${s}`;
const STARTED_AT = new Date();

// ---------------------------------------------------------------------------
// HTTP client with a cookie jar (one per signed-in user)
// ---------------------------------------------------------------------------

class Client {
  cookie = "";
  async req(method, url, body) {
    const isForm = body instanceof FormData;
    const res = await fetch(API + url, {
      method,
      headers: { ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
    const set = res.headers.getSetCookie();
    if (set.length) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, ...json };
  }
  get = (u) => this.req("GET", u);
  post = (u, b) => this.req("POST", u, b);
  put = (u, b) => this.req("PUT", u, b);
  del = (u, b) => this.req("DELETE", u, b);
}

const admin = new Client();
const editor = new Client(); // products.view + products.edit only
const anon = new Client();

/** Asserts an error response: status + (optional) code + (optional) field key. */
function expectError(res, status, code, field) {
  assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.error || res.data)}`);
  assert.equal(res.success, false);
  if (code) assert.equal(res.error.code, code, JSON.stringify(res.error));
  if (field) assert.ok(res.error.fields && field in res.error.fields, `field "${field}" in ${JSON.stringify(res.error.fields)}`);
}
function expectOk(res, status = 200) {
  assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.error)}`);
  assert.equal(res.success, true);
  return res.data;
}

// ---------------------------------------------------------------------------
// Server + users
// ---------------------------------------------------------------------------

let server;
let editorRole;
let editorUser;
let uploadedPath;

async function waitForHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${ORIGIN}/health`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API did not start on port ${PORT}`);
}

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", ASSET_BASE_URL: ORIGIN },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  server.stderr.on("data", (d) => (stderr += d));
  server.on("exit", (code) => code && console.error(`API exited (${code}):\n${stderr}`));
  await waitForHealth();

  // Temporary limited role + staff account
  const perms = await prisma.permission.findMany({ where: { code: { in: ["products.view", "products.edit"] } } });
  editorRole = await prisma.role.create({
    data: {
      name: `${TAG} Editor`,
      slug: `e2e_${RUN.toLowerCase()}_editor`,
      role_permissions: { create: perms.map((p) => ({ permission_id: p.id })) },
    },
  });
  const password = `E2e-${RUN}-pass9`;
  editorUser = await prisma.adminUser.create({
    data: {
      name: `${TAG} Editor`,
      email: `e2e-${RUN.toLowerCase()}@example.test`,
      role_id: editorRole.id,
      password_hash: await hashPassword(password),
      status: "active",
    },
  });

  expectOk(await admin.post("/admin/auth/login", { email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD }));
  expectOk(await editor.post("/admin/auth/login", { email: editorUser.email, password }));
});

after(async () => {
  try {
    if (uploadedPath) await admin.del("/admin/uploads", { path: uploadedPath });

    // Hard delete everything tagged with this run (soft-deleted rows included — names/SKUs keep the tag)
    await prisma.product.deleteMany({ where: { OR: [{ sku: { startsWith: TAG } }, { name: { startsWith: TAG } }] } });
    const cats = await prisma.category.findMany({ where: { name: { startsWith: TAG } }, orderBy: { level: "desc" } });
    for (const c of cats) await prisma.category.delete({ where: { id: c.id } }).catch(() => {});
    await prisma.brand.deleteMany({ where: { name: { startsWith: TAG } } });

    const superAdmin = await prisma.adminUser.findUnique({ where: { email: process.env.SUPER_ADMIN_EMAIL } });
    await prisma.activityLog.deleteMany({
      where: {
        created_at: { gte: STARTED_AT },
        module: { in: ["categories", "brands", "products"] },
        admin_user_id: { in: [superAdmin?.id, editorUser?.id].filter(Boolean) },
      },
    });
    if (editorUser) {
      await prisma.authSession.deleteMany({ where: { admin_user_id: editorUser.id } });
      await prisma.adminUser.delete({ where: { id: editorUser.id } });
    }
    if (editorRole) {
      await prisma.rolePermission.deleteMany({ where: { role_id: editorRole.id } });
      await prisma.role.delete({ where: { id: editorRole.id } });
    }
  } finally {
    await prisma.$disconnect();
    server?.kill();
  }
});

// ---------------------------------------------------------------------------
// Shared fixtures (filled in as the tests run)
// ---------------------------------------------------------------------------

const C = {}; // categories
const B = {}; // brands
const P = {}; // products

const categoryBody = (over = {}) => ({
  name: tag("Category"),
  slug: "",
  parentId: null,
  iconUrl: "",
  imageUrl: "",
  desktopBannerUrl: "",
  mobileBannerUrl: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  showInMenu: true,
  showOnHomepage: false,
  status: "active",
  ...over,
});

const productBody = (over = {}) => ({
  name: tag("Product"),
  sku: sku("P"),
  brandId: B.main?.id,
  categoryId: C.l3?.id,
  status: "active",
  price: 1000,
  mrp: 1500,
  stock: 10,
  gstPercent: 12,
  variants: [],
  images: [],
  specifications: [],
  ...over,
});

// ===========================================================================
// 1. Authentication & permissions
// ===========================================================================

describe("1. auth & permissions", () => {
  it("rejects every admin catalog route without a session (401)", async () => {
    for (const [m, u] of [
      ["get", "/admin/categories"],
      ["post", "/admin/categories"],
      ["put", "/admin/categories/tree"],
      ["get", "/admin/brands"],
      ["post", "/admin/brands"],
      ["get", "/admin/products"],
      ["post", "/admin/products"],
      ["post", "/admin/products/bulk"],
      ["get", "/admin/products/sku-check?sku=X"],
    ]) {
      expectError(await anon[m](u, m === "get" ? undefined : {}), 401, "UNAUTHORIZED");
    }
  });

  it("editor (products.view + edit) can READ categories/brands for the pickers", async () => {
    expectOk(await editor.get("/admin/categories"));
    expectOk(await editor.get("/admin/brands"));
    expectOk(await editor.get("/admin/products"));
  });

  it("editor cannot create / delete (403)", async () => {
    expectError(await editor.post("/admin/categories", categoryBody()), 403, "PERMISSION_DENIED");
    expectError(await editor.put("/admin/categories/tree", { tree: [] }), 403, "PERMISSION_DENIED");
    expectError(await editor.post("/admin/brands", { name: tag("Nope") }), 403, "PERMISSION_DENIED");
    expectError(await editor.post("/admin/products", productBody()), 403, "PERMISSION_DENIED");
    expectError(await editor.del("/admin/products/1"), 403, "PERMISSION_DENIED");
  });

  it("public storefront needs no login", async () => {
    expectOk(await anon.get("/categories"));
    expectOk(await anon.get("/brands"));
    expectOk(await anon.get("/products"));
  });
});

// ===========================================================================
// 2. Categories
// ===========================================================================

describe("2. categories", () => {
  it("creates a 3-level tree with levels, paths and an auto slug", async () => {
    C.l1 = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Respiratory"), showOnHomepage: true, description: "Top" })), 201);
    C.l2 = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Oxygen"), parentId: C.l1.id })), 201);
    C.l3 = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Concentrators"), parentId: C.l2.id })), 201);
    assert.deepEqual([C.l1.level, C.l2.level, C.l3.level], [1, 2, 3]);
    assert.equal(C.l1.slug, `${TAG.toLowerCase()}-respiratory`);
    assert.equal(C.l3.pathLabel, `${tag("Respiratory")} > ${tag("Oxygen")} > ${tag("Concentrators")}`);
    const row = await prisma.category.findUnique({ where: { id: BigInt(C.l3.id) } });
    assert.equal(row.path, `/${C.l1.id}/${C.l2.id}/${C.l3.id}/`);
  });

  it("rejects a 4th level (MAX_DEPTH)", async () => {
    expectError(await admin.post("/admin/categories", categoryBody({ name: tag("Deep"), parentId: C.l3.id })), 400, "MAX_DEPTH", "parentId");
  });

  it("normalises a typed slug and rejects a duplicate one", async () => {
    const typed = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Slug Test"), slug: `${TAG} My Slug!!` })), 201);
    assert.equal(typed.slug, `${TAG.toLowerCase()}-my-slug`);
    expectError(await admin.post("/admin/categories", categoryBody({ name: tag("X"), slug: typed.slug })), 409, "SLUG_TAKEN", "slug");
    expectOk(await admin.del(`/admin/categories/${typed.id}`));
  });

  it("auto slug gets -2 when the name repeats", async () => {
    C.other = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Dental") })), 201);
    assert.equal(C.other.slug, `${TAG.toLowerCase()}-dental`);
    const twin = expectOk(await admin.post("/admin/categories", categoryBody({ name: tag("Dental"), parentId: C.other.id })), 201);
    assert.equal(twin.slug, `${TAG.toLowerCase()}-dental-2`);
    C.otherChild = twin;
  });

  it("validates name, parent id and parent existence", async () => {
    expectError(await admin.post("/admin/categories", categoryBody({ name: "A" })), 422, "VALIDATION_ERROR", "name");
    expectError(await admin.post("/admin/categories", categoryBody({ parentId: "abc" })), 422, "VALIDATION_ERROR");
    expectError(await admin.post("/admin/categories", categoryBody({ parentId: "999999999999" })), 400, "PARENT_NOT_FOUND");
    expectError(await admin.post("/admin/categories", categoryBody({ status: "deleted" })), 422, "VALIDATION_ERROR", "status");
  });

  it("image fields: accepts uploaded paths / full URLs / https, rejects blob:, data:, javascript:", async () => {
    const stored = "/uploads/categories/2026/11/0123456789abcdef0123.webp";
    const c = expectOk(
      await admin.post("/admin/categories", categoryBody({ name: tag("Images"), iconUrl: `${ORIGIN}${stored}`, imageUrl: "https://cdn.example.com/a.jpg" })),
      201
    );
    assert.equal(c.iconUrl, `${ORIGIN}${stored}`);
    assert.equal((await prisma.category.findUnique({ where: { id: BigInt(c.id) } })).icon_url, stored); // stored as relative path
    for (const bad of ["blob:http://localhost/1", "data:image/png;base64,AAAA", "javascript:alert(1)"]) {
      expectError(await admin.post("/admin/categories", categoryBody({ iconUrl: bad })), 422, "VALIDATION_ERROR", "iconUrl");
    }
    expectOk(await admin.del(`/admin/categories/${c.id}`));
  });

  it("GET one: 422 for a bad id, 404 for a missing one", async () => {
    expectError(await admin.get("/admin/categories/abc"), 422);
    expectError(await admin.get("/admin/categories/999999999999"), 404);
    assert.equal(expectOk(await admin.get(`/admin/categories/${C.l2.id}`)).name, tag("Oxygen"));
  });

  it("move: into itself / own child is refused", async () => {
    expectError(await admin.put(`/admin/categories/${C.l1.id}`, categoryBody({ name: C.l1.name, parentId: C.l1.id })), 400, "INVALID_PARENT");
    expectError(await admin.put(`/admin/categories/${C.l1.id}`, categoryBody({ name: C.l1.name, parentId: C.l3.id })), 400, "INVALID_PARENT");
  });

  it("move: a 3-deep subtree cannot go under another category (MAX_DEPTH)", async () => {
    expectError(await admin.put(`/admin/categories/${C.l1.id}`, categoryBody({ name: C.l1.name, parentId: C.other.id })), 400, "MAX_DEPTH");
  });

  it("move: a 2-deep subtree moves and its descendants' level + path are rebuilt", async () => {
    // Oxygen (L2, with Concentrators) → under Dental
    const moved = expectOk(await admin.put(`/admin/categories/${C.l2.id}`, categoryBody({ name: C.l2.name, parentId: C.other.id })));
    assert.equal(moved.parentId, C.other.id);
    const child = await prisma.category.findUnique({ where: { id: BigInt(C.l3.id) } });
    assert.equal(child.path, `/${C.other.id}/${C.l2.id}/${C.l3.id}/`);
    // …and back
    expectOk(await admin.put(`/admin/categories/${C.l2.id}`, categoryBody({ name: C.l2.name, parentId: C.l1.id })));
    const back = await prisma.category.findUnique({ where: { id: BigInt(C.l3.id) } });
    assert.equal(back.path, `/${C.l1.id}/${C.l2.id}/${C.l3.id}/`);
    assert.equal(back.level, 3);
  });

  it("drag-and-drop tree: saves order, rejects duplicates / unknown ids / partial trees / 4 levels", async () => {
    const strip = (n) => ({ id: n.id, children: (n.children || []).map(strip) });
    const tree = expectOk(await admin.get("/admin/categories")).map(strip);

    // move "Dental-2" (child of Dental) to be the FIRST child of Respiratory
    const without = tree.map((n) => (n.id === C.other.id ? { ...n, children: n.children.filter((c) => c.id !== C.otherChild.id) } : n));
    const moved = without.map((n) => (n.id === C.l1.id ? { ...n, children: [{ id: C.otherChild.id, children: [] }, ...n.children] } : n));
    const saved = expectOk(await admin.put("/admin/categories/tree", { tree: moved }));
    const l1 = saved.find((n) => n.id === C.l1.id);
    assert.equal(l1.children[0].id, C.otherChild.id);
    assert.equal(l1.children[0].level, 2);

    expectError(await admin.put("/admin/categories/tree", { tree: [...moved, { id: C.l1.id, children: [] }] }), 400, "INVALID_TREE");
    expectError(await admin.put("/admin/categories/tree", { tree: [...moved, { id: "999999999999", children: [] }] }), 400, "INVALID_TREE");
    expectError(await admin.put("/admin/categories/tree", { tree: moved.filter((n) => n.id !== C.other.id) }), 409, "STALE_TREE");
    const fourLevels = [{ id: C.l1.id, children: [{ id: C.l2.id, children: [{ id: C.l3.id, children: [{ id: C.other.id, children: [] }] }] }] }];
    expectError(await admin.put("/admin/categories/tree", { tree: fourLevels }), 422, "VALIDATION_ERROR");

    // put it back under Dental (keeps later tests simple)
    expectOk(await admin.put(`/admin/categories/${C.otherChild.id}`, categoryBody({ name: C.otherChild.name, parentId: C.other.id })));
  });
});

// ===========================================================================
// 3. Brands
// ===========================================================================

describe("3. brands", () => {
  it("creates brands with all fields", async () => {
    B.main = expectOk(
      await admin.post("/admin/brands", {
        name: tag("MedBrand"),
        description: "Desc",
        originCountry: "Germany",
        authorizedDistributor: true,
        featuredOnHomepage: true,
        seoTitle: "SEO",
      }),
      201
    );
    assert.equal(B.main.originCountry, "Germany");
    assert.equal(B.main.authorizedDistributor, true);
    assert.equal(B.main.featuredOnHomepage, true);
    assert.equal(B.main.productCount, 0);
    B.second = expectOk(await admin.post("/admin/brands", { name: tag("Second") }), 201);
    assert.equal(B.second.logoUrl, "");
  });

  it("name is unique ignoring case; slug is unique", async () => {
    expectError(await admin.post("/admin/brands", { name: tag("MEDBRAND") }), 409, "NAME_TAKEN", "name");
    expectError(await admin.post("/admin/brands", { name: tag("Third"), slug: B.main.slug }), 409, "SLUG_TAKEN", "slug");
    expectError(await admin.put(`/admin/brands/${B.second.id}`, { name: tag("medbrand") }), 409, "NAME_TAKEN");
    // renaming to its own name (different case) is fine
    expectOk(await admin.put(`/admin/brands/${B.second.id}`, { name: tag("SECOND") }));
    expectOk(await admin.put(`/admin/brands/${B.second.id}`, { name: tag("Second") }));
  });

  it("validates input", async () => {
    expectError(await admin.post("/admin/brands", { name: "" }), 422, "VALIDATION_ERROR", "name");
    expectError(await admin.post("/admin/brands", { name: tag("Bad"), logoUrl: "blob:x" }), 422, "VALIDATION_ERROR", "logoUrl");
    expectError(await admin.post("/admin/brands", { name: tag("Bad"), originCountry: "x".repeat(81) }), 422, "VALIDATION_ERROR");
    expectError(await admin.get("/admin/brands?status=deleted"), 422);
    expectError(await admin.get("/admin/brands/abc"), 422);
    expectError(await admin.get("/admin/brands/999999999999"), 404);
  });

  it("list supports ?q= and ?status=", async () => {
    const found = expectOk(await admin.get(`/admin/brands?q=${encodeURIComponent(tag("Med"))}`));
    assert.deepEqual(found.map((b) => b.id), [B.main.id]);
    const inactive = expectOk(await admin.get("/admin/brands?status=inactive"));
    assert.ok(!inactive.some((b) => b.id === B.main.id));
  });
});

// ===========================================================================
// 4. Products — validation
// ===========================================================================

describe("4. products: validation", () => {
  const cases = [
    ["missing brand", { brandId: undefined }, 422, "brandId"],
    ["price 0", { price: 0 }, 422, "price"],
    ["price text", { price: "abc" }, 422, "price"],
    ["MRP below price", { mrp: 500 }, 422, "mrp"],
    ["negative stock", { stock: -1 }, 422, "stock"],
    ["fractional stock", { stock: 1.5 }, 422, "stock"],
    ["GST 13%", { gstPercent: 13 }, 422, "gstPercent"],
    ["HSN letters", { hsnCode: "12ab" }, 422, "hsnCode"],
    ["SKU with space", { sku: "AB C" }, 422, "sku"],
    ["status out_of_stock", { status: "out_of_stock" }, 422, "status"],
    ["Buy 2+ price ≥ price", { buyTwoPlusPrice: 1000 }, 422, "buyTwoPlusPrice"],
    ["image still uploading", { images: [{ url: "blob:x", uploading: true }] }, 422],
    ["blob image", { images: [{ url: "blob:http://x/1" }] }, 422],
    ["31 images", { images: Array.from({ length: 31 }, () => ({ url: "https://x.example/a.jpg" })) }, 422, "images"],
    ["spec without value", { specifications: [{ key: "Flow", value: "" }] }, 422],
    ["rent on without plans", { showAvailableOnRent: true, rental: { enabled: true, plans: [] } }, 422, "rental.plans"],
    [
      "two monthly plans",
      { rental: { enabled: true, plans: [{ durationType: "monthly", price: 1, minDuration: 1, maxDuration: 2 }, { durationType: "monthly", price: 2, minDuration: 1, maxDuration: 2 }] } },
      422,
    ],
    ["plan min > max", { rental: { enabled: true, plans: [{ durationType: "daily", price: 1, minDuration: 5, maxDuration: 2 }] } }, 422],
  ];
  for (const [label, over, status, field] of cases) {
    it(`rejects: ${label}`, async () => {
      expectError(await admin.post("/admin/products", productBody(over)), status, "VALIDATION_ERROR", field);
    });
  }

  it("rejects variants with duplicate SKUs, MRP < price, or none active", async () => {
    const v = (o) => ({ optionType: "Model", name: "A", sku: sku("V1"), price: 10, mrp: 20, stock: 1, isDefault: false, isActive: true, ...o });
    expectError(await admin.post("/admin/products", productBody({ variants: [v(), v({ name: "B" })] })), 422, "VALIDATION_ERROR", "variants.1.sku");
    expectError(await admin.post("/admin/products", productBody({ variants: [v({ mrp: 5 })] })), 422, "VALIDATION_ERROR", "variants.0.mrp");
    expectError(await admin.post("/admin/products", productBody({ variants: [v({ isActive: false })] })), 422, "VALIDATION_ERROR", "variants");
    expectError(await admin.post("/admin/products", productBody({ variants: [v({ optionType: "Colour" })] })), 422);
  });

  it("rejects a brand / category that does not exist (INVALID_LINK)", async () => {
    expectError(await admin.post("/admin/products", productBody({ brandId: "999999999999" })), 400, "INVALID_LINK", "brandId");
    expectError(await admin.post("/admin/products", productBody({ categoryId: "999999999999" })), 400, "INVALID_LINK", "categoryId");
  });
});

// ===========================================================================
// 5. Products — create / read / update
// ===========================================================================

describe("5. products: create & update", () => {
  it("uploads an image through the upload API", async () => {
    const png = await sharp({ create: { width: 400, height: 400, channels: 3, background: { r: 20, g: 90, b: 170 } } }).png().toBuffer();
    const form = new FormData();
    form.append("files", new Blob([png], { type: "image/png" }), "e2e.png");
    const [img] = expectOk(await admin.post("/admin/uploads?folder=products", form), 201);
    assert.match(img.path, /^\/uploads\/products\/\d{4}\/\d{2}\/[a-f0-9]{20}\.webp$/);
    uploadedPath = img.path;
  });

  it("creates a full product (no variants) and stores every field", async () => {
    P.main = expectOk(
      await admin.post(
        "/admin/products",
        productBody({
          name: tag("Oxygen Concentrator 5L"),
          sku: sku("oxy-5l"), // lowercase → stored uppercase
          shortDescription: "Short",
          fullDescription: '<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:alert(1)">l</a><img src="https://x.example/i.png" onerror="y()"><strong>ok</strong></p>',
          price: 32000,
          mrp: 45000,
          stock: 3,
          lowStockThreshold: 5,
          buyTwoPlusPrice: 31000,
          hsnCode: "90192010",
          emiEnabled: true,
          codEnabled: false,
          featured: true,
          bestSeller: true,
          newArrival: true,
          dealOfTheDay: true,
          images: [
            { id: "tmp1", url: `${ORIGIN}${uploadedPath}`, path: uploadedPath, type: "angle", altText: "Front", sortOrder: 0 },
            { id: "tmp2", url: "https://images.example.com/b.jpg", type: "detail", sortOrder: 1 },
          ],
          specifications: [
            { key: "Flow", value: "0.5–5 LPM" },
            { key: "", value: "" }, // blank row is dropped
          ],
          features: ["93% purity", "", "93% purity", "Low noise"],
          warranty: "2 years",
          certifications: ["CE", " ISO 13485 "],
          weightKg: 16.5,
          lengthCm: 40,
          widthCm: 30,
          heightCm: 60,
          showAvailableOnRent: true,
          rental: {
            enabled: true,
            plans: [
              { durationType: "monthly", price: 3500, minDuration: 1, maxDuration: 12 },
              { durationType: "weekly", price: 1200, minDuration: 1, maxDuration: 8 },
            ],
            securityDeposit: 10000,
            deliveryPickupCharge: 500,
            kycRequired: true,
            prescriptionRequired: true,
          },
          seoTitle: "SEO title",
        })
      ),
      201
    );
    const p = P.main;
    assert.equal(p.sku, sku("OXY-5L"));
    assert.deepEqual([p.price, p.mrp, p.stock, p.buyTwoPlusPrice, p.lowStockThreshold], [32000, 45000, 3, 31000, 5]);
    assert.equal(p.status, "active");
    assert.ok(p.publishedAt, "publishedAt set when created active");
    assert.equal(p.variants.length, 0, "hidden default variant is not exposed");
    assert.equal(p.images[0].type, "main", "first image is always the main image");
    assert.equal(p.images[0].path, uploadedPath);
    assert.equal(p.specifications.length, 1);
    assert.deepEqual(p.features, ["93% purity", "Low noise"], "blank + duplicate features removed");
    assert.deepEqual(p.certifications, ["CE", "ISO 13485"]);
    assert.equal(p.weightKg, 16.5);
    assert.equal(p.dealOfTheDay, true);
    assert.equal(p.codEnabled, false);
    assert.deepEqual(p.rental.plans.map((x) => x.durationType).sort(), ["monthly", "weekly"]);
    assert.equal(p.rental.securityDeposit, 10000);
    assert.equal(p.categoryPath, `${tag("Respiratory")} > ${tag("Oxygen")} > ${tag("Concentrators")}`);
    // sanitised HTML
    assert.ok(!/script|onclick|onerror|javascript:/i.test(p.fullDescription), p.fullDescription);
    assert.ok(p.fullDescription.includes("<strong>ok</strong>"));
    // DB: money in paise, one stock movement
    const v = await prisma.productVariant.findFirst({ where: { product_id: BigInt(p.id), is_default: true } });
    assert.equal(v.price_paise, 3200000n);
    assert.equal(v.option_type, "default");
    assert.equal(await prisma.stockMovement.count({ where: { variant_id: v.id } }), 1);
  });

  it("rejects duplicate product SKU and slug (409)", async () => {
    expectError(await admin.post("/admin/products", productBody({ sku: P.main.sku })), 409, "SKU_TAKEN", "sku");
    expectError(await admin.post("/admin/products", productBody({ sku: sku("NEW"), slug: P.main.slug })), 409, "SLUG_TAKEN", "slug");
  });

  it("GET one: 422 bad id, 404 missing", async () => {
    expectError(await admin.get("/admin/products/abc"), 422);
    expectError(await admin.get("/admin/products/999999999999"), 404);
    assert.equal(expectOk(await admin.get(`/admin/products/${P.main.id}`)).id, P.main.id);
  });

  it("sku-check reports taken / free / own SKU", async () => {
    assert.equal(expectOk(await admin.get(`/admin/products/sku-check?sku=${P.main.sku}`)).available, false);
    assert.equal(expectOk(await admin.get(`/admin/products/sku-check?sku=${sku("free")}`)).available, true);
    assert.equal(expectOk(await admin.get(`/admin/products/sku-check?sku=${P.main.sku}&excludeProductId=${P.main.id}`)).available, true);
  });

  it("stock change writes a movement; stock cannot go below reserved units", async () => {
    const updated = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, stock: 8 }));
    assert.equal(updated.stock, 8);
    const v = await prisma.productVariant.findFirst({ where: { product_id: BigInt(P.main.id), is_default: true } });
    const moves = await prisma.stockMovement.findMany({ where: { variant_id: v.id }, orderBy: { id: "asc" } });
    assert.deepEqual(moves.map((m) => m.change_qty), [3, 5]);
    assert.equal(moves[1].balance_after, 8);

    await prisma.inventory.updateMany({ where: { variant_id: v.id }, data: { reserved: 6 } });
    expectError(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, stock: 5 }), 400, "STOCK_BELOW_RESERVED", "stock");
    assert.equal(expectOk(await admin.get(`/admin/products/${P.main.id}`)).reservedStock, 6);
    await prisma.inventory.updateMany({ where: { variant_id: v.id }, data: { reserved: 0 } });
    P.main = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, stock: 3 }));
  });

  it("variants: one default only, first becomes default, default forced active", async () => {
    const v = (o) => ({ optionType: "Size", name: "S", sku: sku("S"), price: 900, mrp: 1000, stock: 2, isDefault: false, isActive: true, ...o });
    P.main = { ...P.main, buyTwoPlusPrice: null }; // must stay below the (new) ₹900 default price
    const two = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [v({ isDefault: true }), v({ name: "M", sku: sku("M"), isDefault: true })] }));
    assert.deepEqual(two.variants.map((x) => x.isDefault), [true, false]);
    const none = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [v(), v({ name: "M", sku: sku("M") })] }));
    assert.deepEqual(none.variants.map((x) => x.isDefault), [true, false]);
    const inactiveDefault = expectOk(
      await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [v({ isDefault: true, isActive: false }), v({ name: "M", sku: sku("M") })] })
    );
    assert.equal(inactiveDefault.variants[0].isDefault, true);
    assert.equal(inactiveDefault.variants[0].isActive, true);
    assert.equal(inactiveDefault.price, 900, "product price comes from the default variant");
    assert.equal(inactiveDefault.stock, 4, "stock = sum of active variants");
    P.main = inactiveDefault;
  });

  it("variants: SKUs can be swapped between existing variants", async () => {
    const [a, b] = P.main.variants;
    const swapped = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [{ ...a, sku: b.sku }, { ...b, sku: a.sku }] }));
    assert.deepEqual(swapped.variants.map((x) => x.id), [a.id, b.id], "same rows updated, not recreated");
    assert.deepEqual(swapped.variants.map((x) => x.sku), [b.sku, a.sku]);
    P.main = swapped;
  });

  it("variants: a SKU used by ANOTHER product is refused with the exact field", async () => {
    P.other = expectOk(await admin.post("/admin/products", productBody({ name: tag("Other"), sku: sku("OTHER"), categoryId: C.otherChild.id, brandId: B.second.id, price: 50000, mrp: 50000, stock: 0 })), 201);
    const clash = await admin.put(`/admin/products/${P.other.id}`, {
      ...P.other,
      variants: [{ optionType: "Model", name: "X", sku: P.main.variants[0].sku, price: 1, mrp: 1, stock: 0, isDefault: true, isActive: true }],
    });
    expectError(clash, 409, "SKU_TAKEN", "variants.0.sku");
  });

  it("variants: removing one keeps the other; removing all brings back the hidden default", async () => {
    const one = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [{ ...P.main.variants[1], isDefault: true }] }));
    assert.equal(one.variants.length, 1);
    assert.equal(one.variants[0].isDefault, true);
    const removed = await prisma.productVariant.findUnique({ where: { id: BigInt(P.main.variants[0].id) } });
    assert.ok(removed.sku.includes("~deleted-") && !removed.is_active, "variant with stock history is retired, SKU freed");

    const none = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, variants: [], price: 32000, mrp: 45000, stock: 7 }));
    assert.equal(none.variants.length, 0);
    assert.deepEqual([none.price, none.stock], [32000, 7]);
    P.main = none;
  });

  it("rental: switching rent off keeps the plans but deactivates them", async () => {
    const off = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, showAvailableOnRent: false, rental: { ...P.main.rental, enabled: false } }));
    assert.equal(off.rental.enabled, false);
    assert.equal(off.rental.plans.length, 2);
    const plans = await prisma.rentalPlan.findMany({ where: { product_id: BigInt(P.main.id) } });
    assert.ok(plans.every((x) => !x.is_active));
    // drop the weekly plan, rent back on
    const on = expectOk(
      await admin.put(`/admin/products/${P.main.id}`, {
        ...P.main,
        showAvailableOnRent: true,
        rental: { ...P.main.rental, enabled: true, plans: P.main.rental.plans.filter((x) => x.durationType === "monthly") },
      })
    );
    assert.deepEqual(on.rental.plans.map((x) => x.durationType), ["monthly"]);
    P.main = on;
  });

  it("deal of the day: off ends the deal, on starts a new one", async () => {
    const off = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, dealOfTheDay: false }));
    assert.equal(off.dealOfTheDay, false);
    const on = expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, dealOfTheDay: true }));
    assert.equal(on.dealOfTheDay, true);
    const running = await prisma.deal.count({ where: { variant: { product_id: BigInt(P.main.id) }, is_active: true, ends_at: { gt: new Date() } } });
    assert.equal(running, 1, "never two running deals");
    P.main = on;
  });

  it("draft product has no publishedAt; going active sets it once", async () => {
    P.draft = expectOk(await admin.post("/admin/products", productBody({ name: tag("Draft"), sku: sku("DRAFT"), status: "draft", stock: 0 })), 201);
    assert.equal(P.draft.publishedAt, null);
    const active = expectOk(await admin.put(`/admin/products/${P.draft.id}`, { ...P.draft, status: "active" }));
    assert.ok(active.publishedAt);
    const again = expectOk(await admin.put(`/admin/products/${P.draft.id}`, { ...active, status: "inactive" }));
    const back = expectOk(await admin.put(`/admin/products/${P.draft.id}`, { ...again, status: "active" }));
    assert.equal(back.publishedAt, active.publishedAt, "publishedAt is not reset");
    P.draft = back;
  });
});

// ===========================================================================
// 6. Products — list, filters, duplicate, bulk, delete
// ===========================================================================

describe("6. products: list / duplicate / bulk / delete", () => {
  const q = `q=${encodeURIComponent(TAG)}`;

  it("list: search, pagination meta and past-the-end pages", async () => {
    const all = await admin.get(`/admin/products?${q}&limit=100`);
    expectOk(all);
    assert.equal(all.meta.total, 3);
    const page2 = await admin.get(`/admin/products?${q}&limit=2&page=2`);
    assert.equal(page2.data.length, 1);
    assert.equal(page2.meta.hasPrevPage, true);
    const beyond = await admin.get(`/admin/products?${q}&limit=2&page=99`);
    assert.equal(beyond.data.length, 0);
    assert.equal(beyond.meta.total, 3, "total still correct past the last page");
  });

  it("list: filters by category subtree, brand, status, stock level, emi / rent / cod", async () => {
    const ids = async (extra) => expectOk(await admin.get(`/admin/products?${q}&limit=100&${extra}`)).map((p) => p.id).sort();
    assert.deepEqual(await ids(`categoryId=${C.l1.id}`), [P.main.id, P.draft.id].sort(), "Level 1 includes Level 3 products");
    assert.deepEqual(await ids(`brandId=${B.second.id}`), [P.other.id]);
    assert.deepEqual(await ids("status=draft"), []);
    assert.deepEqual(await ids("stockLevel=out_of_stock"), [P.draft.id, P.other.id].sort());
    assert.deepEqual(await ids("stockLevel=in_stock"), [P.main.id], "7 units > threshold 5");
    expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, stock: 4 }));
    assert.deepEqual(await ids("stockLevel=low_stock"), [P.main.id], "4 units ≤ threshold 5");
    assert.deepEqual(await ids("emi=true"), [P.main.id]);
    assert.deepEqual(await ids("rent=true"), [P.main.id]);
    assert.ok(!(await ids("cod=true")).includes(P.main.id), "COD switched off");
  });

  it("list: rejects bad query values", async () => {
    expectError(await admin.get("/admin/products?limit=101"), 422);
    expectError(await admin.get("/admin/products?sort=hack"), 422);
    expectError(await admin.get("/admin/products?stockLevel=some"), 422);
    expectError(await admin.get("/admin/products?categoryId=abc"), 422);
    expectError(await admin.get("/admin/products?emi=maybe"), 422);
  });

  it("duplicate: draft copy with stock 0 and free SKUs (-COPY, -COPY2)", async () => {
    const one = expectOk(await admin.post(`/admin/products/${P.main.id}/duplicate`), 201);
    const two = expectOk(await admin.post(`/admin/products/${P.main.id}/duplicate`), 201);
    assert.equal(one.sku, `${P.main.sku}-COPY`);
    assert.equal(two.sku, `${P.main.sku}-COPY2`);
    assert.deepEqual([one.status, one.stock, one.dealOfTheDay], ["draft", 0, false]);
    assert.equal(one.images.length, P.main.images.length);
    assert.equal(one.specifications.length, 1);
    assert.notEqual(one.slug, P.main.slug);
    P.copies = [one, two];
    expectError(await admin.post("/admin/products/999999999999/duplicate"), 404);
  });

  it("bulk: validates input", async () => {
    expectError(await admin.post("/admin/products/bulk", { action: "activate", ids: [] }), 422);
    expectError(await admin.post("/admin/products/bulk", { action: "activate", ids: ["x"] }), 422);
    expectError(await admin.post("/admin/products/bulk", { action: "explode", ids: [P.main.id] }), 422);
    expectError(await admin.post("/admin/products/bulk", { action: "activate", ids: Array.from({ length: 501 }, (_, i) => String(i + 1)) }), 422);
    expectError(await admin.post("/admin/products/bulk", { action: "change_category", ids: [P.main.id] }), 422, "VALIDATION_ERROR", "categoryId");
    expectError(
      await admin.post("/admin/products/bulk", { action: "change_category", ids: [P.main.id], categoryId: "999999999999" }),
      400,
      "INVALID_LINK"
    );
  });

  it("bulk: editor may activate but not delete", async () => {
    const ids = P.copies.map((c) => c.id);
    const res = expectOk(await editor.post("/admin/products/bulk", { action: "activate", ids }));
    assert.equal(res.count, 2);
    expectError(await editor.post("/admin/products/bulk", { action: "delete", ids }), 403, "PERMISSION_DENIED");
  });

  it("bulk: deactivate, change category, delete", async () => {
    const ids = P.copies.map((c) => c.id);
    assert.equal(expectOk(await admin.post("/admin/products/bulk", { action: "deactivate", ids })).count, 2);
    assert.equal(expectOk(await admin.get(`/admin/products/${ids[0]}`)).status, "inactive");
    expectOk(await admin.post("/admin/products/bulk", { action: "change_category", ids, categoryId: C.l2.id }));
    assert.equal(expectOk(await admin.get(`/admin/products/${ids[0]}`)).categoryId, C.l2.id);
    assert.equal(expectOk(await admin.post("/admin/products/bulk", { action: "delete", ids })).count, 2);
    expectError(await admin.get(`/admin/products/${ids[0]}`), 404);
  });

  it("delete: product disappears and its SKU + slug can be reused", async () => {
    const tmp = expectOk(await admin.post("/admin/products", productBody({ name: tag("Temp"), sku: sku("TEMP") })), 201);
    expectOk(await admin.del(`/admin/products/${tmp.id}`));
    expectError(await admin.get(`/admin/products/${tmp.id}`), 404);
    expectError(await admin.del(`/admin/products/${tmp.id}`), 404);
    const reused = expectOk(await admin.post("/admin/products", productBody({ name: tag("Temp"), sku: sku("TEMP"), slug: tmp.slug })), 201);
    assert.equal(reused.slug, tmp.slug);
    expectOk(await admin.del(`/admin/products/${reused.id}`));
  });
});

// ===========================================================================
// 7. Storefront (public)
// ===========================================================================

describe("7. storefront", () => {
  const mine = (list) => list.filter((p) => p.name.startsWith(TAG));

  it("category tree: visible categories with live product counts + Level 3 items", async () => {
    const res = await anon.get("/categories");
    const tree = expectOk(res);
    assert.match(res.headers.get("cache-control"), /max-age=30/);
    const l1 = tree.find((c) => c.id === C.l1.id);
    assert.ok(l1, "visible Level 1 present");
    assert.equal(l1.itemCount, 2, "main + draft-made-active product");
    const l2 = l1.subCategories.find((s) => s.id === C.l2.id);
    assert.deepEqual(l2.items, [C.l3.name]);
    assert.equal(l2.children[0].slug, C.l3.slug);
  });

  it("category by slug: any level, breadcrumbs, bad / unknown slug", async () => {
    const l3 = expectOk(await anon.get(`/categories/${C.l3.slug}`));
    assert.deepEqual(l3.breadcrumbs.map((b) => b.id), [C.l1.id, C.l2.id, C.l3.id]);
    expectError(await anon.get("/categories/bad%20slug!"), 422);
    expectError(await anon.get(`/categories/${TAG.toLowerCase()}-nope`), 404);
  });

  it("brands: active only, counts, featured filter, top categories", async () => {
    const brands = expectOk(await anon.get("/brands"));
    const main = brands.find((b) => b.id === B.main.id);
    assert.equal(main.productCount, 2);
    assert.deepEqual(main.featuredCategories, [C.l1.name]);
    assert.equal(main.originCountry, "Germany");
    const featured = expectOk(await anon.get("/brands?featured=true"));
    assert.ok(featured.some((b) => b.id === B.main.id) && !featured.some((b) => b.id === B.second.id));
    expectOk(await anon.get(`/brands/${B.main.slug}`));
    expectError(await anon.get(`/brands/${TAG.toLowerCase()}-nope`), 404);
  });

  it("product page: full data, no admin-only fields", async () => {
    const p = expectOk(await anon.get(`/products/${P.main.slug}`));
    assert.equal(p.price, 32000);
    assert.equal(p.discountPercentage, 28);
    assert.equal(p.stockCount, 4);
    assert.equal(p.inStock, true);
    assert.equal(p.categoryId, C.l1.id, "categoryId = Level 1 (storefront convention)");
    assert.equal(p.subCategorySlug, C.l2.slug);
    assert.equal(p.leafCategoryId, C.l3.id);
    assert.deepEqual(p.specifications, { Flow: "0.5–5 LPM" });
    assert.equal(p.rentEnabled, true);
    assert.equal(p.rentPricePerMonth, 3500);
    assert.equal(p.isDealOfDay, true);
    assert.ok(p.images[0].url.endsWith(uploadedPath));
    assert.equal(p.emiStartingFrom, Math.ceil(32000 / 12));
    for (const secret of ["status", "reservedStock", "lowStockThreshold", "fullDescription"]) {
      assert.ok(!(secret in p), `storefront must not expose ${secret}`);
    }
    expectError(await anon.get("/products/bad%20slug"), 422);
  });

  it("listing filters: category, sub (inside / outside), brand slug / ids, price, discount, flags, search", async () => {
    const ids = async (qs) => mine(expectOk(await anon.get(`/products?limit=100&${qs}`))).map((p) => p.id).sort();
    const both = [P.main.id, P.draft.id].sort();
    assert.deepEqual(await ids(`category=${C.l1.slug}`), both);
    assert.deepEqual(await ids(`categoryId=${C.l1.id}`), both);
    assert.deepEqual(await ids(`category=${C.l1.slug}&sub=${C.l2.slug}`), both);
    assert.deepEqual(await ids(`category=${C.l1.slug}&sub=${C.otherChild.slug}`), [], "sub outside the category → nothing");
    assert.deepEqual(await ids(`brand=${B.second.slug}`), [P.other.id]);
    assert.deepEqual(await ids(`brand=${TAG.toLowerCase()}-no-such-brand`), []);
    assert.deepEqual(await ids(`brandIds=${B.main.id},${B.second.id}&q=${TAG}`), [...both, P.other.id].sort());
    assert.deepEqual(await ids(`q=${TAG}&minPrice=40000`), [P.other.id]);
    assert.deepEqual(await ids(`q=${TAG}&maxPrice=1000`), [P.draft.id]);
    assert.deepEqual(await ids(`q=${TAG}&minDiscount=25`), [P.main.id, P.draft.id].sort(), "28% and 33% off");
    assert.deepEqual(await ids(`q=${TAG}&inStock=true`), [P.main.id]);
    for (const flag of ["rent", "emi", "featured", "bestSeller", "newArrival", "deal"]) {
      assert.deepEqual(await ids(`q=${TAG}&${flag}=true`), [P.main.id], flag);
    }
    assert.deepEqual(await ids(`q=${encodeURIComponent(P.main.sku)}`), [P.main.id], "search by SKU");
    expectError(await anon.get(`/products?category=${TAG.toLowerCase()}-nope`), 404);
  });

  it("listing sorts + pagination", async () => {
    const names = async (sort) => mine(expectOk(await anon.get(`/products?q=${TAG}&sort=${sort}`))).map((p) => p.price);
    assert.deepEqual(await names("price-asc"), [1000, 32000, 50000]);
    assert.deepEqual(await names("price-desc"), [50000, 32000, 1000]);
    const disc = mine(expectOk(await anon.get(`/products?q=${TAG}&sort=discount`))).map((p) => p.discountPercentage);
    assert.deepEqual(disc, [...disc].sort((a, b) => b - a));
    const page = await anon.get(`/products?q=${TAG}&limit=1&page=2&sort=price-asc`);
    assert.equal(page.data[0].price, 32000);
    assert.equal(page.meta.total, 3);
    expectError(await anon.get("/products?sort=hack"), 422);
    expectError(await anon.get("/products?limit=101"), 422);
    expectError(await anon.get("/products?minPrice=-5"), 422);
    expectError(await anon.get("/products?brandIds=1,abc"), 422);
  });

  it("related products: same subcategory first, never itself", async () => {
    const related = expectOk(await anon.get(`/products/${P.main.id}/related?limit=4`));
    assert.ok(related.some((p) => p.id === P.draft.id));
    assert.ok(!related.some((p) => p.id === P.main.id));
    expectError(await anon.get("/products/abc/related"), 422);
    expectError(await anon.get("/products/999999999999/related"), 404);
  });

  it("search suggestions: products, categories, brands; empty q rejected", async () => {
    const s = expectOk(await anon.get(`/search/suggestions?q=${encodeURIComponent(TAG)}`));
    assert.ok(s.products.some((p) => p.id === P.main.id));
    assert.ok(s.categories.some((c) => c.id === C.l1.id));
    assert.ok(s.brands.some((b) => b.id === B.main.id));
    expectError(await anon.get("/search/suggestions"), 422);
    expectError(await anon.get(`/search/suggestions?q=${"x".repeat(101)}`), 422);
  });
});

// ===========================================================================
// 8. Visibility rules (admin change → storefront)
// ===========================================================================

describe("8. visibility rules", () => {
  it("draft / inactive product → 404 on the storefront, hidden from lists", async () => {
    expectOk(await admin.put(`/admin/products/${P.draft.id}`, { ...P.draft, status: "draft" }));
    expectError(await anon.get(`/products/${P.draft.slug}`), 404);
    const list = expectOk(await anon.get(`/products?q=${TAG}`));
    assert.ok(!list.some((p) => p.id === P.draft.id));
    expectOk(await admin.put(`/admin/products/${P.draft.id}`, { ...P.draft, status: "active" }));
    expectOk(await anon.get(`/products/${P.draft.slug}`));
  });

  it("inactive PARENT category hides its subcategories and their products", async () => {
    expectOk(await admin.put(`/admin/categories/${C.l1.id}`, categoryBody({ name: C.l1.name, status: "inactive" })));
    expectError(await anon.get(`/products/${P.main.slug}`), 404);
    expectError(await anon.get(`/categories/${C.l3.slug}`), 404);
    assert.ok(!expectOk(await anon.get("/categories")).some((c) => c.id === C.l1.id));
    assert.equal(expectOk(await anon.get(`/brands/${B.main.slug}`)).productCount, 0);
    expectOk(await admin.put(`/admin/categories/${C.l1.id}`, categoryBody({ name: C.l1.name, status: "active", showOnHomepage: true })));
    expectOk(await anon.get(`/products/${P.main.slug}`));
  });

  it("inactive brand hides the brand page and its products", async () => {
    expectOk(await admin.put(`/admin/brands/${B.second.id}`, { name: B.second.name, status: "inactive" }));
    expectError(await anon.get(`/brands/${B.second.slug}`), 404);
    expectError(await anon.get(`/products/${P.other.slug}`), 404);
    assert.ok(!expectOk(await anon.get("/brands")).some((b) => b.id === B.second.id));
    expectOk(await admin.put(`/admin/brands/${B.second.id}`, { name: B.second.name, status: "active" }));
    expectOk(await anon.get(`/products/${P.other.slug}`));
  });

  it("rent switched off → product no longer rentable on the storefront", async () => {
    expectOk(await admin.put(`/admin/products/${P.main.id}`, { ...P.main, stock: 4, showAvailableOnRent: false, rental: { ...P.main.rental, enabled: false } }));
    const p = expectOk(await anon.get(`/products/${P.main.slug}`));
    assert.equal(p.rentEnabled, false);
    assert.equal(p.rentalPlans.length, 0);
    assert.ok(!mineIds(expectOk(await anon.get(`/products?q=${TAG}&rent=true`))).includes(P.main.id));
  });
});

const mineIds = (list) => list.filter((p) => p.name.startsWith(TAG)).map((p) => p.id);

// ===========================================================================
// 9. Delete rules
// ===========================================================================

describe("9. delete rules", () => {
  it("category with products (in a SUBcategory) cannot be deleted", async () => {
    expectError(await admin.del(`/admin/categories/${C.l1.id}`), 409, "CATEGORY_IN_USE");
    expectError(await admin.del(`/admin/categories/${C.l3.id}`), 409, "CATEGORY_IN_USE");
  });

  it("brand with products cannot be deleted", async () => {
    expectError(await admin.del(`/admin/brands/${B.main.id}`), 409, "BRAND_IN_USE");
  });

  it("after the products go, the tree + brand delete and their slugs / names are reusable", async () => {
    expectOk(await admin.post("/admin/products/bulk", { action: "delete", ids: [P.main.id, P.draft.id] }));
    const res = expectOk(await admin.del(`/admin/categories/${C.l1.id}`));
    assert.ok(!res.tree.some((c) => c.id === C.l1.id));
    for (const id of [C.l1.id, C.l2.id, C.l3.id]) expectError(await admin.get(`/admin/categories/${id}`), 404);
    const again = expectOk(await admin.post("/admin/categories", categoryBody({ name: C.l1.name, slug: C.l1.slug })), 201);
    assert.equal(again.slug, C.l1.slug);
    expectOk(await admin.del(`/admin/categories/${again.id}`));

    expectOk(await admin.del(`/admin/brands/${B.main.id}`));
    expectError(await admin.get(`/admin/brands/${B.main.id}`), 404);
    expectError(await admin.del(`/admin/brands/${B.main.id}`), 404);
    const reused = expectOk(await admin.post("/admin/brands", { name: B.main.name, slug: B.main.slug }), 201);
    expectOk(await admin.del(`/admin/brands/${reused.id}`));
  });

  it("every write was recorded in the activity log", async () => {
    const superAdmin = await prisma.adminUser.findUnique({ where: { email: process.env.SUPER_ADMIN_EMAIL } });
    const logs = await prisma.activityLog.groupBy({
      by: ["module", "action"],
      where: { created_at: { gte: STARTED_AT }, admin_user_id: superAdmin.id, module: { in: ["categories", "brands", "products"] } },
      _count: { _all: true },
    });
    const has = (m, a) => logs.some((l) => l.module === m && l.action === a);
    for (const [m, a] of [
      ["categories", "create"], ["categories", "update"], ["categories", "delete"],
      ["brands", "create"], ["brands", "delete"],
      ["products", "create"], ["products", "update"], ["products", "delete"], ["products", "status_change"],
    ]) {
      assert.ok(has(m, a), `activity log has ${m}.${a}`);
    }
  });
});
