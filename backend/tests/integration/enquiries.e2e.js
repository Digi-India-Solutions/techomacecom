/**
 * Sleep-test enquiry API (public form + STOP-BANG quiz answers, admin list).
 *
 *   npm run test:enquiries
 *
 * Starts the API on E2E_ENQ_PORT (default 5097). Every enquiry it creates has a name
 * starting with the run tag and is hard-deleted at the end.
 */
import "dotenv/config";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../../db/db.js";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.E2E_ENQ_PORT || 5097);
const API = `http://localhost:${PORT}/api/v1`;
const TAG = `E2EENQ${Date.now().toString(36)}`;

let server;
let adminCookie = "";

async function req(method, url, body, cookie = "") {
  const res = await fetch(API + url, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.getSetCookie();
  return { status: res.status, setCookie: set, ...(await res.json().catch(() => ({}))) };
}

const base = (over = {}) => ({
  name: `${TAG} Patient`,
  mobile: "9876543210",
  city: "Delhi",
  testType: "Not sure",
  consent: true,
  ...over,
});
const quiz = (answers, heightCm = 175, weightKg = 70) => ({
  answers: { snoring: false, tired: false, observed: false, pressure: false, age: false, neck: false, male: false, ...answers },
  heightCm,
  weightKg,
  unit: "metric",
});

before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", ENQUIRY_RATE_LIMIT: "1000" },
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
  adminCookie = login.setCookie.map((c) => c.split(";")[0]).join("; ");
});

after(async () => {
  try {
    await prisma.enquiry.deleteMany({ where: { name: { startsWith: TAG } } });
  } finally {
    await prisma.$disconnect();
    server?.kill();
  }
});

describe("POST /enquiries (sleep test)", () => {
  it("saves the header-form enquiry (no quiz)", async () => {
    const res = await req("POST", "/enquiries", base({ preferredDate: "2026-12-01", message: "Snoring", testType: "Level 2" }));
    assert.equal(res.status, 201, JSON.stringify(res.error));
    assert.match(res.data.enquiryId, /^ENQ-ST-\d{6}$/);
    const row = await prisma.enquiry.findFirst({ where: { name: `${TAG} Patient` }, orderBy: { id: "desc" } });
    assert.equal(row.type, "sleep_test");
    assert.equal(row.mobile, "9876543210");
    assert.equal(row.consent, true);
    assert.equal(row.details.testType, "Level 2");
    assert.equal(row.details.preferredDate, "2026-12-01");
    assert.equal(row.details.quiz, undefined);
  });

  it("stores quiz answers with the risk RECOMPUTED on the server", async () => {
    const res = await req("POST", "/enquiries", base({ name: `${TAG} Quiz`, quiz: quiz({ tired: true, male: true }) }));
    assert.equal(res.status, 201);
    assert.equal(res.data.risk, "low");
    assert.equal(res.data.score, 2);
    const row = await prisma.enquiry.findFirst({ where: { name: `${TAG} Quiz` } });
    assert.equal(row.details.quiz.method, "STOP-BANG");
    assert.equal(row.details.quiz.bmi, 22.9);
    assert.deepEqual(row.details.quiz.signs, ["Daytime tiredness", "Born male"]);
    assert.equal(row.source_page, "/sleep-test/quiz");
  });

  it("a client cannot inject its own risk level", async () => {
    const res = await req("POST", "/enquiries", base({ name: `${TAG} Tamper`, quiz: { ...quiz({ snoring: true, tired: true, observed: true, pressure: true, male: true }), risk: "low", score: 0 } }));
    assert.equal(res.status, 201);
    assert.equal(res.data.risk, "high");
    assert.equal(res.data.score, 5);
  });

  it("BMI > 35 counts; moderate band", async () => {
    const res = await req("POST", "/enquiries", base({ name: `${TAG} Mod`, quiz: quiz({ snoring: true, age: true }, 160, 100) }));
    assert.equal(res.data.score, 3);
    assert.equal(res.data.risk, "moderate");
  });

  it("validation: name, mobile, city, consent, date, test type, height/weight", async () => {
    const cases = [
      [{ name: "" }, "name"],
      [{ mobile: "12345" }, "mobile"],
      [{ city: "" }, "city"],
      [{ consent: false }, "consent"],
      [{ preferredDate: "01/12/2026" }, "preferredDate"],
      [{ testType: "Level 9" }, "testType"],
      [{ quiz: quiz({}, 50, 70) }, "quiz.heightCm"],
      [{ quiz: { answers: { snoring: true } , heightCm: 170, weightKg: 70 } }, null],
    ];
    for (const [over, field] of cases) {
      const res = await req("POST", "/enquiries", base(over));
      assert.equal(res.status, 422, `${JSON.stringify(over)} → ${res.status}`);
      if (field) assert.ok(field in res.error.fields, `${field} in ${JSON.stringify(res.error.fields)}`);
    }
  });

  it("honeypot: answers success but stores nothing", async () => {
    const before = await prisma.enquiry.count({ where: { name: `${TAG} Bot` } });
    const res = await req("POST", "/enquiries", base({ name: `${TAG} Bot`, honeypot: "http://spam.example" }));
    assert.equal(res.status, 201);
    assert.equal(await prisma.enquiry.count({ where: { name: `${TAG} Bot` } }), before);
  });
});

describe("GET /admin/enquiries", () => {
  it("needs a staff session", async () => {
    assert.equal((await req("GET", "/admin/enquiries")).status, 401);
  });

  it("lists with search + risk filter, and returns one by id", async () => {
    const all = await req("GET", `/admin/enquiries?q=${TAG}&limit=50`, null, adminCookie);
    assert.equal(all.status, 200);
    assert.equal(all.meta.total, 4);
    const high = await req("GET", `/admin/enquiries?q=${TAG}&risk=high`, null, adminCookie);
    assert.deepEqual(high.data.map((e) => e.name), [`${TAG} Tamper`]);
    assert.equal(high.data[0].quiz.risk, "high");
    const one = await req("GET", `/admin/enquiries/${high.data[0].id}`, null, adminCookie);
    assert.equal(one.status, 200);
    assert.match(one.data.code, /^ENQ-ST-/);
    assert.equal((await req("GET", "/admin/enquiries/999999999999", null, adminCookie)).status, 404);
  });
});
