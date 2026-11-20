# Buy Denmed API

Express 5 + Prisma 6 + PostgreSQL. The only service that talks to the database
(see "Buy Denmed — Technical Documentation" §2).

## Run it

```bash
cd backend
npm install
npm run db:deploy   # apply migrations (or npm run db:migrate while developing)
npm run db:seed     # permissions, default roles, first Super Admin, Main Warehouse
npm run dev         # http://localhost:5001  ·  API base /api/v1  ·  GET /health
```

| App | Port | Talks to |
|---|---|---|
| Storefront (`frontend/`, Next.js) | 3000 | `NEXT_PUBLIC_BACKEND_API_URL` |
| Admin (`admin/`, Vite) | 3001 | `VITE_API_URL` |
| API (`backend/`) | 5001 (`PORT`) | PostgreSQL |

All settings are in `.env` — see `.env.example` for every variable.

## Database

- `prisma/schema.prisma` — the 57 tables from the document (§10–11) plus `auth_sessions`
  (refresh-token rotation). Column names are snake_case, matching the document.
- `prisma/migrations/*_init_schema/migration.sql` also contains what Prisma cannot model:
  `citext` / `pg_trgm` extensions, 78 `CHECK` constraints, 4 partial unique indexes
  (`*_partial_uq`) and an `updated_at` trigger on every table.
- New migration: edit the schema → `npm run db:migrate -- --name what_changed`.
  Prisma leaves the hand-written SQL above alone (verified: it produces an empty diff).
  For new CHECKs or partial indexes, use `--create-only` and add the SQL by hand.

## Auth

**Tokens.** Access JWT (`ACCESS_TOKEN_EXPIRY`) + refresh JWT (`REFRESH_TOKEN_EXPIRY`), both in
httpOnly `SameSite=Lax` cookies. Each refresh token is one `auth_sessions` row; every refresh
rotates it, and replaying an old refresh token signs that user out everywhere.
Customer and staff tokens have different audiences and cookie names, so neither works on the
other's routes. `Authorization: Bearer <access token>` is also accepted.

**Customers (storefront)** — `/api/v1/auth`
| | |
|---|---|
| `GET /config` | Sign-in methods (`email_password`), Google on/off (+ client id) |
| `POST /signup/email/send-otp` `{ email }` | 6-digit code **emailed** (10 min, 30 s resend, max 3 / email / 10 min). 409 if the email has an account |
| `POST /signup/email/verify-otp` `{ email, otp }` | Max 5 wrong tries → `{ verificationToken }` (one use, 30 min) |
| `POST /signup` `{ name, email, emailVerificationToken, mobile, password, confirmPassword }` | Creates the account (argon2id hash) **and signs in** (cookies) — 201 |
| `POST /login` `{ email, password }` | Generic "Incorrect email or password"; 5 wrong → locked 15 min (`CUSTOMER_LOCK_MINUTES`) |
| `POST /forgot-password` `{ email }` | Same reply for every email (no enumeration); emails `FRONTEND_URL/reset-password?token=…` in the background. Link valid 30 min (`CUSTOMER_RESET_EXPIRY_MINUTES`), 60 s per-account cooldown, 5 / 15 min per IP |
| `GET /reset-password/check?token=` | `{ email (masked), expiresAt }` or 400 `RESET_LINK_INVALID` |
| `POST /reset-password` `{ token, password, confirmPassword }` | One use; clears lockout; **signs out every other device**; emails a "password changed" notice; signs in here |
| `POST /google` `{ credential }` | Google ID token verified server-side (not shown on the storefront form now) |
| `POST /refresh`, `POST /logout` | |
| `GET /me`, `PUT /me` | Profile (name, customer type). The sign-in email of a password account cannot be changed |
| `POST /me/mobile/send`, `/me/mobile/verify` | Verify / change the mobile with an SMS OTP (signed in) |
| ~~`POST /otp/send`, `/otp/verify`~~ | **Mobile OTP sign-in is disabled** — routes commented out in `src/modules/auth/routes.js` |

Email codes are stored only as HMAC hashes (`email_otps`); the browser never decides an email
is verified — `/signup` must present the server-issued token for that exact email.
Emails go through Gmail SMTP (`EMAIL_USER` / `EMAIL_PASS`). In development, if email is not
configured the code is returned as `devOtp`; in production a failed send returns 503.
All these routes share an IP limit of 20 / 10 min (`CUSTOMER_AUTH_RATE_LIMIT`).
Tests: `npm run test:auth` (37 API tests incl. forgot / reset password; no real email is sent).
Emails that hit a network error (ECONNRESET, timeouts) are retried twice before giving up.

**Staff (admin)** — `/api/v1/admin/auth`
| | |
|---|---|
| `POST /login` `{ email, password, rememberMe }` | argon2; 5 wrong passwords → locked 15 min |
| `POST /refresh`, `POST /logout` | |
| `POST /forgot-password`, `POST /reset-password` | Emailed one-time link (also used for staff invites) |
| `GET /me`, `PUT /me`, `PUT /me/password` | `/me` returns the user **and their permission codes** |

## RBAC

Permissions are a module × action matrix in the database (`permissions`, `role_permissions`):
18 modules × `view / create / edit / delete / export` = 90 codes such as `orders.edit`.
The list lives in `src/rbac/catalog.js` (keep it in sync with `admin/lib/api/admin/staff.ts`).

- Every admin route uses `requirePermission('module.action')` — hiding a button is not security.
- The staff member and their role are re-read on every request, so deactivating someone or
  changing a role takes effect immediately.
- **Super Admin** always has every permission (including future modules); it cannot be deleted
  or reduced. Only a Super Admin can create, edit or promote Super Admins, and the last active
  Super Admin cannot be demoted or deactivated.
- Admins with `staff.*` can create any number of custom roles and tick exactly what each can do.

| Endpoint (`/api/v1/admin`) | Permission |
|---|---|
| `GET /permissions`, `GET /roles`, `GET /staff` | `staff.view` |
| `POST /roles`, `POST /staff` (emails an invite link) | `staff.create` |
| `PUT /roles/:id`, `PUT /staff/:id`, `PATCH /staff/:id/status`, `POST /staff/:id/reset-password` | `staff.edit` |
| `DELETE /roles/:id` (custom roles with no staff only) | `staff.delete` |
| `GET /activity-logs` | `activity.view` |

New admin modules: add a router in `src/modules/<name>/` and mount it in `src/routes.js`
after `admin.use(requireAdmin)`.

## Images (uploads)

Images are stored on this server's disk — no Cloudinary / S3.

`POST /api/v1/admin/uploads?folder=products` (multipart field `file`, or `files` for up to 10)
→ each image is converted to **WebP**, EXIF/GPS stripped, longest side capped at 2560 px,
and saved with smaller copies for `srcset`:

```
uploads/products/2026/11/0b3ca3d1824472aedf15.webp         ← original size
uploads/products/2026/11/0b3ca3d1824472aedf15-w640.webp    ← 320 / 640 / 1024 / 1600 px
```

The response gives `path` (store this in the DB), `url`, `srcSet`, `width`/`height` and a tiny
blurred `placeholder`. Files are served at `/uploads/…` with `Cache-Control: immutable, 1 year`.
Folders and the permission each needs: products, categories, brands, banners (`marketing.*`),
content, misc (`settings.edit`). `DELETE /api/v1/admin/uploads { path }` removes an image and its sizes.

- Lossy WebP at quality 85 by default (looks identical, typically 50–95 % smaller than the upload).
  Set `IMAGE_WEBP_LOSSLESS=true` for pixel-perfect files (much larger).
- SVG is rejected (can contain scripts); iPhone HEIC must be exported as JPEG/PNG first.
- `backend/uploads/` is git-ignored: **back it up** with the database. In production let Nginx serve it:
  `location /uploads/ { alias /var/www/buydenmed/backend/uploads/; expires 1y; add_header Cache-Control "public, immutable"; }`

## Catalog (categories → brands → products)

`src/modules/catalog/` — admin CRUD + the public storefront catalog, all from the database.

| Admin (`/api/v1/admin`, staff + permission) | |
|---|---|
| `GET/POST /categories`, `GET/PUT/DELETE /categories/:id` | 3-level tree with product counts (`categories.*`) |
| `PUT /categories/tree` `{ tree: [{ id, children }] }` | Drag-and-drop order; server re-checks depth (`categories.edit`) |
| `GET/POST /brands`, `GET/PUT/DELETE /brands/:id` | (`brands.*`) |
| `GET /products?q=&categoryId=&brandId=&status=&stockLevel=&emi=&rent=&cod=&page=&limit=` | Paginated list (`products.view`) |
| `GET/POST /products`, `GET/PUT/DELETE /products/:id` | Full editor payload, one transaction (`products.*`) |
| `POST /products/:id/duplicate`, `POST /products/bulk`, `GET /products/sku-check?sku=` | |

| Storefront (`/api/v1`, public, read-only) | |
|---|---|
| `GET /categories`, `GET /categories/:slug` | Visible tree / any level + breadcrumbs |
| `GET /brands?featured=`, `GET /brands/:slug` | Active brands with product counts |
| `GET /products?category=&sub=&brand=&brandIds=&q=&minPrice=&maxPrice=&minDiscount=&inStock=&rent=&emi=&featured=&bestSeller=&newArrival=&deal=&sort=&page=&limit=` | `sort`: popularity · price-asc · price-desc · newest · discount · rating |
| `GET /products/:slug`, `GET /products/:id/related` | Product page, related products |
| `GET /search/suggestions?q=` | Header autocomplete (rate limited) |

Rules:
- **Visible on the storefront** = product `active` + brand `active` + its category **and every parent** `active`
  (`category-index.js`). Drafts / inactive / deleted never leave the storefront service.
- **Price + stock live on variants.** A product without variants gets one hidden `option_type = "default"` variant.
  Stock is set on the Main Warehouse `inventory` row; every change writes a `stock_movements` row (reason `correction`).
- **Deletes are soft** (`deleted_at`) and free the slug / SKU / brand name (`…~deleted-<id>`) so they can be reused.
  Categories with products (incl. subcategories) and brands with products cannot be deleted.
  Variants removed in the editor are deleted, or retired if orders / stock history reference them.
- **Deal of the Day** toggle starts a 24 h deal on the default variant at its current price
  (Marketing → Deals can change the price / window); switching it off ends running deals.
- Product descriptions are **sanitised HTML** (`sanitize-html`); image fields accept only uploaded paths or https URLs.
- Product search / filters / sorts run as one parameterised SQL query (`products/query.js`), using the pg_trgm indexes.

## Shared helpers

**Lists** — `src/lib/list.js`: `listQuery({...filters})` (zod: `page`, `limit` ≤ 100, `sort`, `q`),
`buildOrderBy(sort, whitelist, "-createdAt")`, `searchWhere(q, ["name", "brand.name"])`,
`paginate(prisma.model, {...})` → `{ rows, meta: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }`.

**Money** — `src/lib/money.js` (all BigInt paise, half-up rounding):
`toPaise("₹48,999.50")`, `formatINR(4899950n)` → `₹48,999.50`, `moneyJson(p)` → `{ paise, rupees, display }`,
`percentOf`, `percentDiscount(amount, 10, { maxDiscountPaise })`, `discountPercent(mrp, price)`,
`gstInclusive` / `gstExclusive`, `splitGst(gst, intraState)` → CGST+SGST or IGST,
`stateCode("Uttar Pradesh" | GSTIN)`, `isIntraState(seller, placeOfSupply)`,
and zod fields `rupeesField({ min })` (form rupees → paise) and `gstRateField`.

`npm test` runs the unit tests for money, lists and image conversion (`tests/`).

## Layout

```
config/        env.js (every variable, validated) · cors.js
db/            Prisma client with the pg driver adapter
prisma/        schema, migrations, seed.js
src/lib/       tokens (JWT + cookies), password, OTP SMS, mailer, http, list, money, image (WebP), storage
src/middlewares/ auth (requireCustomer / requireAdmin / requirePermission), validate (zod), rate limits, errors
src/rbac/      permission catalogue + per-role permission cache
src/services/  sessions, OTPs, activity log
src/modules/   auth (customers) · admin-auth · staff · uploads · catalog/{categories,brands,products,storefront}
               — each: routes → controller → service → validator
uploads/       stored images (git-ignored)
tests/         node --test unit tests
```
