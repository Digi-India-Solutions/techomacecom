/**
 * Storefront customer auth — end-to-end API tests (email OTP sign-up + password sign-in).
 *
 *   npm run test:auth
 *
 * Starts this API on E2E_PORT (default 5098) with email sending switched OFF, so no real
 * mail goes to the fake test addresses — in development the API then returns the code
 * as `devOtp`. Every customer / code it creates uses "@e2e.test" and is hard-deleted at the end.
 */
import "dotenv/config";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../../db/db.js";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.E2E_AUTH_PORT || 5098);
const API = `http://localhost:${PORT}/api/v1`;
const RUN = Date.now().toString(36);
const DOMAIN = "e2e.test";
const mail = (s) => `${s}-${RUN}@${DOMAIN}`;
// A mobile no real customer has: 9 + 9 digits derived from the run id
const mobileFor = (n) => `9${String(Date.now()).slice(-8)}${n}`.slice(0, 10);

class Client {
  cookie = "";
  async req(method, url, body) {
    const res = await fetch(API + url, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie();
    if (set.length) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
    return { status: res.status, setCookie: set, ...(await res.json().catch(() => ({}))) };
  }
  post = (u, b) => this.req("POST", u, b);
  get = (u) => this.req("GET", u);
  put = (u, b) => this.req("PUT", u, b);
}

function expectError(res, status, code, field) {
  assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.error || res.data)}`);
  if (code) assert.equal(res.error.code, code, JSON.stringify(res.error));
  if (field) assert.ok(res.error.fields && field in res.error.fields, `field ${field} in ${JSON.stringify(res.error.fields)}`);
}
function expectOk(res, status = 200) {
  assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${JSON.stringify(res.error)}`);
  return res.data;
}

let server;
before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: BACKEND_DIR,
    // EMAIL_* empty → no real email; OTP_DEV_ECHO → code returned as devOtp
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", EMAIL_USER: "", EMAIL_PASS: "", OTP_DEV_ECHO: "true", CUSTOMER_AUTH_RATE_LIMIT: "1000", CUSTOMER_RESET_RATE_LIMIT: "1000" },
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/health`)).ok) return;
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("API did not start");
});

after(async () => {
  try {
    const customers = await prisma.customer.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } });
    const ids = customers.map((c) => c.id);
    await prisma.authSession.deleteMany({ where: { customer_id: { in: ids } } });
    await prisma.customer.deleteMany({ where: { id: { in: ids } } });
    await prisma.emailOtp.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
  } finally {
    await prisma.$disconnect();
    server?.kill();
  }
});

/** Full happy-path helper: code → verify → token */
async function verifiedToken(client, email) {
  const sent = expectOk(await client.post("/auth/signup/email/send-otp", { email }));
  const verified = expectOk(await client.post("/auth/signup/email/verify-otp", { email, otp: sent.devOtp }));
  return verified.verificationToken;
}

const A = { email: mail("alice"), mobile: mobileFor(1), password: "Secret123", name: "Alice Doctor" };

describe("1. mobile OTP sign-in is switched off", () => {
  it("POST /auth/otp/send and /auth/otp/verify no longer exist (404)", async () => {
    const c = new Client();
    expectError(await c.post("/auth/otp/send", { mobile: "9876543210" }), 404);
    expectError(await c.post("/auth/otp/verify", { mobile: "9876543210", otp: "123456" }), 404);
  });
  it("/auth/config reports email + password", async () => {
    const cfg = expectOk(await new Client().get("/auth/config"));
    assert.deepEqual(cfg.signInMethods, ["email_password"]);
    assert.equal(cfg.otpLoginEnabled, false);
  });
});

describe("2. email OTP", () => {
  it("sends a code (stored only as a hash) and normalises the email", async () => {
    const c = new Client();
    const res = expectOk(await c.post("/auth/signup/email/send-otp", { email: `  ${mail("Case").toUpperCase()}  ` }));
    assert.match(res.devOtp, /^\d{6}$/);
    assert.equal(res.emailSent, false);
    assert.equal(res.expiresInSeconds, 600);
    const row = await prisma.emailOtp.findFirst({ where: { email: mail("case") }, orderBy: { id: "desc" } });
    assert.ok(row, "stored lower-cased");
    assert.notEqual(row.otp_hash, res.devOtp);
    assert.equal(row.otp_hash.length, 64);
  });

  it("rejects a bad email / missing email", async () => {
    const c = new Client();
    expectError(await c.post("/auth/signup/email/send-otp", { email: "not-an-email" }), 422, "VALIDATION_ERROR", "email");
    expectError(await c.post("/auth/signup/email/send-otp", {}), 422, "VALIDATION_ERROR", "email");
  });

  it("enforces the 30 s resend cooldown", async () => {
    const c = new Client();
    const email = mail("cool");
    expectOk(await c.post("/auth/signup/email/send-otp", { email }));
    expectError(await c.post("/auth/signup/email/send-otp", { email }), 429, "OTP_COOLDOWN");
  });

  it("wrong code → attempts left; 5 wrong → locked; correct code after lock refused", async () => {
    const c = new Client();
    const email = mail("wrong");
    const { devOtp } = expectOk(await c.post("/auth/signup/email/send-otp", { email }));
    const wrong = devOtp === "000000" ? "111111" : "000000";
    const first = await c.post("/auth/signup/email/verify-otp", { email, otp: wrong });
    expectError(first, 400, "OTP_INVALID", "otp");
    assert.match(first.error.message, /4 attempts left/);
    for (let i = 0; i < 4; i++) await c.post("/auth/signup/email/verify-otp", { email, otp: wrong });
    expectError(await c.post("/auth/signup/email/verify-otp", { email, otp: devOtp }), 429, "OTP_LOCKED");
  });

  it("code format is checked; unknown email → expired", async () => {
    const c = new Client();
    expectError(await c.post("/auth/signup/email/verify-otp", { email: mail("x"), otp: "12ab" }), 422);
    expectError(await c.post("/auth/signup/email/verify-otp", { email: mail("never-sent"), otp: "123456" }), 400, "OTP_EXPIRED");
  });

  it("expired code is refused", async () => {
    const c = new Client();
    const email = mail("expired");
    const { devOtp } = expectOk(await c.post("/auth/signup/email/send-otp", { email }));
    await prisma.emailOtp.updateMany({ where: { email }, data: { expires_at: new Date(Date.now() - 1000) } });
    expectError(await c.post("/auth/signup/email/verify-otp", { email, otp: devOtp }), 400, "OTP_EXPIRED");
  });

  it("a code only works for the email it was sent to", async () => {
    const c = new Client();
    const { devOtp } = expectOk(await c.post("/auth/signup/email/send-otp", { email: mail("owner") }));
    expectOk(await c.post("/auth/signup/email/send-otp", { email: mail("other") }));
    expectError(await c.post("/auth/signup/email/verify-otp", { email: mail("other"), otp: devOtp === "999999" ? "999998" : devOtp }), 400);
  });
});

describe("3. sign-up", () => {
  it("validates every field", async () => {
    const c = new Client();
    const base = { name: "Bob", email: mail("val"), emailVerificationToken: "x".repeat(43), mobile: mobileFor(2), password: "Secret123", confirmPassword: "Secret123" };
    expectError(await c.post("/auth/signup", { ...base, name: "B" }), 422, "VALIDATION_ERROR", "name");
    expectError(await c.post("/auth/signup", { ...base, mobile: "12345" }), 422, "VALIDATION_ERROR", "mobile");
    expectError(await c.post("/auth/signup", { ...base, password: "short1", confirmPassword: "short1" }), 422, "VALIDATION_ERROR", "password");
    expectError(await c.post("/auth/signup", { ...base, password: "onlyletters", confirmPassword: "onlyletters" }), 422, "VALIDATION_ERROR", "password");
    expectError(await c.post("/auth/signup", { ...base, confirmPassword: "Different1" }), 422, "VALIDATION_ERROR", "confirmPassword");
    expectError(await c.post("/auth/signup", { ...base, emailVerificationToken: undefined }), 422, "VALIDATION_ERROR", "emailVerificationToken");
  });

  it("refuses an unverified email / a forged token", async () => {
    const c = new Client();
    expectError(
      await c.post("/auth/signup", { name: "Bob", email: mail("forged"), emailVerificationToken: "f".repeat(43), mobile: mobileFor(3), password: "Secret123", confirmPassword: "Secret123" }),
      400,
      "EMAIL_NOT_VERIFIED",
      "email"
    );
  });

  it("refuses a token verified for a DIFFERENT email", async () => {
    const c = new Client();
    const token = await verifiedToken(c, mail("tokenowner"));
    expectError(
      await c.post("/auth/signup", { name: "Eve", email: mail("thief"), emailVerificationToken: token, mobile: mobileFor(4), password: "Secret123", confirmPassword: "Secret123" }),
      400,
      "EMAIL_NOT_VERIFIED"
    );
  });

  it("creates the account, stores an argon2id hash, and signs in immediately", async () => {
    const c = new Client();
    const token = await verifiedToken(c, A.email);
    const res = await c.post("/auth/signup", { ...A, emailVerificationToken: token, confirmPassword: A.password });
    const data = expectOk(res, 201);
    assert.equal(data.isNewUser, true);
    assert.equal(data.user.email, A.email);
    assert.equal(data.user.mobile, A.mobile);
    assert.equal(data.user.name, A.name);
    assert.equal(data.user.emailVerified, true);
    assert.equal(data.user.profileComplete, true);
    assert.ok(!("password_hash" in data.user) && !("passwordHash" in data.user), "hash never leaves the server");
    assert.ok(res.setCookie.some((c) => c.startsWith("bd_at=")) && res.setCookie.some((c) => c.startsWith("bd_rt=")), "access + refresh cookies set");
    assert.ok(res.setCookie.every((c) => /HttpOnly/i.test(c)), "cookies are httpOnly");

    // already signed in — no second login needed
    const me = expectOk(await c.get("/auth/me"));
    assert.equal(me.user.email, A.email);

    const row = await prisma.customer.findUnique({ where: { email: A.email } });
    assert.match(row.password_hash, /^\$argon2id\$/);
    assert.ok(!row.password_hash.includes(A.password));
    assert.ok(row.email_verified_at && row.password_changed_at && row.last_login_at);
    A.id = row.id;
  });

  it("a verification token works only once", async () => {
    const c = new Client();
    const email = mail("once");
    const token = await verifiedToken(c, email);
    expectOk(await c.post("/auth/signup", { name: "Once", email, emailVerificationToken: token, mobile: mobileFor(5), password: "Secret123", confirmPassword: "Secret123" }), 201);
    await prisma.customer.delete({ where: { email } }); // free the email again
    expectError(
      await new Client().post("/auth/signup", { name: "Twice", email, emailVerificationToken: token, mobile: mobileFor(6), password: "Secret123", confirmPassword: "Secret123" }),
      400,
      "EMAIL_NOT_VERIFIED"
    );
  });

  it("refuses an email or mobile that already has an account (409)", async () => {
    const c = new Client();
    expectError(await c.post("/auth/signup/email/send-otp", { email: A.email.toUpperCase() }), 409, "EMAIL_TAKEN", "email");
    const token = await verifiedToken(c, mail("dupmobile"));
    expectError(
      await c.post("/auth/signup", { name: "Dup", email: mail("dupmobile"), emailVerificationToken: token, mobile: A.mobile, password: "Secret123", confirmPassword: "Secret123" }),
      409,
      "MOBILE_IN_USE",
      "mobile"
    );
  });

  it("accepts +91 / spaces in the mobile and stores 10 digits", async () => {
    const c = new Client();
    const email = mail("plus91");
    const token = await verifiedToken(c, email);
    const digits = mobileFor(7);
    const data = expectOk(
      await c.post("/auth/signup", { name: "Plus", email, emailVerificationToken: token, mobile: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, password: "Secret123", confirmPassword: "Secret123" }),
      201
    );
    assert.equal(data.user.mobile, digits);
  });
});

describe("4. sign-in", () => {
  it("signs in with email + password (email case-insensitive)", async () => {
    const c = new Client();
    const data = expectOk(await c.post("/auth/login", { email: A.email.toUpperCase(), password: A.password }));
    assert.equal(data.user.email, A.email);
    assert.equal(data.isNewUser, false);
    assert.equal(expectOk(await c.get("/auth/me")).user.id, String(A.id));
  });

  it("same error for wrong password and unknown email (no account enumeration)", async () => {
    const c = new Client();
    const wrong = await c.post("/auth/login", { email: A.email, password: "Wrong1234" });
    const unknown = await c.post("/auth/login", { email: mail("nobody"), password: "Wrong1234" });
    expectError(wrong, 401, "INVALID_CREDENTIALS");
    expectError(unknown, 401, "INVALID_CREDENTIALS");
    assert.equal(wrong.error.message, unknown.error.message);
  });

  it("validates input", async () => {
    const c = new Client();
    expectError(await c.post("/auth/login", { email: "bad", password: "x" }), 422, "VALIDATION_ERROR", "email");
    expectError(await c.post("/auth/login", { email: A.email, password: "" }), 422, "VALIDATION_ERROR", "password");
  });

  it("account without a password (old OTP / Google account) gets the generic error", async () => {
    const email = mail("nopass");
    await prisma.customer.create({ data: { email, name: "No Pass", mobile: mobileFor(8) } });
    expectError(await new Client().post("/auth/login", { email, password: "Secret123" }), 401, "INVALID_CREDENTIALS");
  });

  it("5 wrong passwords lock the account; the right one is refused while locked", async () => {
    await prisma.customer.update({ where: { id: A.id }, data: { failed_login_attempts: 0 } }); // earlier test made 1 wrong try
    const c = new Client();
    for (let i = 0; i < 4; i++) expectError(await c.post("/auth/login", { email: A.email, password: `Wrong${i}xyz` }), 401);
    expectError(await c.post("/auth/login", { email: A.email, password: "Wrong5xyz" }), 423, "ACCOUNT_LOCKED");
    expectError(await c.post("/auth/login", { email: A.email, password: A.password }), 423, "ACCOUNT_LOCKED");
    await prisma.customer.update({ where: { id: A.id }, data: { locked_until: null } });
    expectOk(await c.post("/auth/login", { email: A.email, password: A.password }));
    assert.equal((await prisma.customer.findUnique({ where: { id: A.id } })).failed_login_attempts, 0, "counter reset");
  });

  it("blocked account cannot sign in", async () => {
    await prisma.customer.update({ where: { id: A.id }, data: { status: "blocked" } });
    expectError(await new Client().post("/auth/login", { email: A.email, password: A.password }), 403, "ACCOUNT_BLOCKED");
    await prisma.customer.update({ where: { id: A.id }, data: { status: "active" } });
  });

  it("logout ends the session", async () => {
    const c = new Client();
    expectOk(await c.post("/auth/login", { email: A.email, password: A.password }));
    expectOk(await c.post("/auth/logout"));
    expectError(await c.get("/auth/me"), 401);
  });

  it("profile: name can change, the sign-in email cannot", async () => {
    const c = new Client();
    expectOk(await c.post("/auth/login", { email: A.email, password: A.password }));
    assert.equal(expectOk(await c.put("/auth/me", { name: "Alice Updated" })).user.name, "Alice Updated");
    expectError(await c.put("/auth/me", { email: mail("hijack") }), 400, "EMAIL_LOCKED");
  });
});

describe("5. forgot / reset password", () => {
  const GENERIC = /If an account exists for this email/;
  const tokenFrom = (url) => new URL(url).searchParams.get("token");
  const clearCooldown = (id) => prisma.customer.update({ where: { id }, data: { password_reset_requested_at: null } });
  const NEW_PASSWORD = "BrandNew456";

  it("unknown email gets the SAME answer and no link (no account enumeration)", async () => {
    const res = expectOk(await new Client().post("/auth/forgot-password", { email: mail("ghost") }));
    assert.match(res.message, GENERIC);
    assert.equal(res.devResetUrl, undefined);
  });

  it("validates the email", async () => {
    expectError(await new Client().post("/auth/forgot-password", { email: "nope" }), 422, "VALIDATION_ERROR", "email");
  });

  it("registered email: link to /reset-password, only the SHA-256 stored, 30 min expiry", async () => {
    await clearCooldown(A.id);
    const res = expectOk(await new Client().post("/auth/forgot-password", { email: A.email.toUpperCase() }));
    assert.match(res.message, GENERIC);
    assert.match(res.devResetUrl, /\/reset-password\?token=[a-f0-9]{64}$/);
    const token = tokenFrom(res.devResetUrl);
    const row = await prisma.customer.findUnique({ where: { id: A.id } });
    assert.notEqual(row.password_reset_token_hash, token);
    assert.equal(row.password_reset_token_hash.length, 64);
    const minutes = (row.password_reset_expires_at - Date.now()) / 60_000;
    assert.ok(minutes > 29 && minutes <= 30, `expires in ~30 min (${minutes})`);
    A.resetToken = token;
  });

  it("asking again within 60 s sends nothing new (inbox protection) but answers the same", async () => {
    const before = (await prisma.customer.findUnique({ where: { id: A.id } })).password_reset_token_hash;
    const res = expectOk(await new Client().post("/auth/forgot-password", { email: A.email }));
    assert.match(res.message, GENERIC);
    assert.equal(res.devResetUrl, undefined);
    assert.equal((await prisma.customer.findUnique({ where: { id: A.id } })).password_reset_token_hash, before);
  });

  it("check link: valid → masked email; bad shape → 422; unknown → RESET_LINK_INVALID", async () => {
    const ok = expectOk(await new Client().get(`/auth/reset-password/check?token=${A.resetToken}`));
    assert.ok(ok.email.endsWith(`@${DOMAIN}`) && ok.email.includes("•"), ok.email);
    assert.ok(!ok.email.startsWith(A.email.split("@")[0]), "local part is masked");
    expectError(await new Client().get("/auth/reset-password/check?token=short"), 422);
    expectError(await new Client().get(`/auth/reset-password/check?token=${"a".repeat(64)}`), 400, "RESET_LINK_INVALID");
    expectError(await new Client().get("/auth/reset-password/check"), 422);
  });

  it("new password is validated (strength + match)", async () => {
    const c = new Client();
    expectError(await c.post("/auth/reset-password", { token: A.resetToken, password: "weak", confirmPassword: "weak" }), 422, "VALIDATION_ERROR", "password");
    expectError(await c.post("/auth/reset-password", { token: A.resetToken, password: NEW_PASSWORD, confirmPassword: "Other1234" }), 422, "VALIDATION_ERROR", "confirmPassword");
  });

  it("a newer request replaces the older link", async () => {
    await clearCooldown(A.id);
    const fresh = expectOk(await new Client().post("/auth/forgot-password", { email: A.email }));
    expectError(await new Client().get(`/auth/reset-password/check?token=${A.resetToken}`), 400, "RESET_LINK_INVALID");
    A.resetToken = tokenFrom(fresh.devResetUrl);
  });

  it("reset: password changed, lock cleared, other devices signed out, signed in here", async () => {
    // an existing session on another device + a locked account
    const otherDevice = new Client();
    expectOk(await otherDevice.post("/auth/login", { email: A.email, password: A.password }));
    await prisma.customer.update({ where: { id: A.id }, data: { locked_until: new Date(Date.now() + 10 * 60_000), failed_login_attempts: 3 } });

    const thisDevice = new Client();
    const res = await thisDevice.post("/auth/reset-password", { token: A.resetToken, password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
    const data = expectOk(res);
    assert.equal(data.user.email, A.email);
    assert.ok(res.setCookie.some((c) => c.startsWith("bd_at=")), "signed in on this device");
    assert.equal(expectOk(await thisDevice.get("/auth/me")).user.email, A.email);

    const row = await prisma.customer.findUnique({ where: { id: A.id } });
    assert.match(row.password_hash, /^\$argon2id\$/);
    assert.equal(row.password_reset_token_hash, null);
    assert.equal(row.locked_until, null);
    assert.equal(row.failed_login_attempts, 0);

    // the other device's session was revoked → it can no longer refresh
    expectError(await otherDevice.post("/auth/refresh"), 401);
  });

  it("old password no longer works, the new one does", async () => {
    expectError(await new Client().post("/auth/login", { email: A.email, password: A.password }), 401, "INVALID_CREDENTIALS");
    expectOk(await new Client().post("/auth/login", { email: A.email, password: NEW_PASSWORD }));
    A.password = NEW_PASSWORD;
  });

  it("a link works only once", async () => {
    expectError(
      await new Client().post("/auth/reset-password", { token: A.resetToken, password: "Another789", confirmPassword: "Another789" }),
      400,
      "RESET_LINK_INVALID"
    );
  });

  it("an expired link is refused", async () => {
    await clearCooldown(A.id);
    const res = expectOk(await new Client().post("/auth/forgot-password", { email: A.email }));
    const token = tokenFrom(res.devResetUrl);
    await prisma.customer.update({ where: { id: A.id }, data: { password_reset_expires_at: new Date(Date.now() - 1000) } });
    expectError(await new Client().get(`/auth/reset-password/check?token=${token}`), 400, "RESET_LINK_INVALID");
    expectError(await new Client().post("/auth/reset-password", { token, password: "Another789", confirmPassword: "Another789" }), 400, "RESET_LINK_INVALID");
  });

  it("blocked account: same answer, no link", async () => {
    await clearCooldown(A.id);
    await prisma.customer.update({ where: { id: A.id }, data: { status: "blocked" } });
    const res = expectOk(await new Client().post("/auth/forgot-password", { email: A.email }));
    assert.match(res.message, GENERIC);
    assert.equal(res.devResetUrl, undefined);
    await prisma.customer.update({ where: { id: A.id }, data: { status: "active" } });
  });

  it("an account that never had a password (old OTP / Google) can set one this way", async () => {
    const email = mail("nopass");
    const res = expectOk(await new Client().post("/auth/forgot-password", { email }));
    const token = tokenFrom(res.devResetUrl);
    expectOk(await new Client().post("/auth/reset-password", { token, password: "FirstPass1", confirmPassword: "FirstPass1" }));
    expectOk(await new Client().post("/auth/login", { email, password: "FirstPass1" }));
    assert.ok((await prisma.customer.findUnique({ where: { email } })).email_verified_at, "link click verifies the email");
  });
});
