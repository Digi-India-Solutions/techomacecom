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

All settings are in ONE `.env` for both local and production — see `.env.example`.
Any key can have `_LOCAL` and `_PRODUCTION` versions (e.g. `DB_PASSWORD_LOCAL`, `DB_PASSWORD_PRODUCTION`);
`config/load-env.js` copies the right one to the plain name based on `NODE_ENV`, which the npm scripts set:
`dev`, `db:migrate`, `db:seed` → local · `start`, `db:deploy`, `db:seed:prod`, `admin:set-password:prod` → production.

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
The access token carries `sid` (its session), and every authenticated request checks that the
session is still active — so logout, "sign out this device", a password change or deactivation
take effect immediately, not when the access token expires.
Customer and staff tokens have different audiences and cookie names, so neither works on the
other's routes. `Authorization: Bearer <access token>` is also accepted.

**Customers (storefront)** — `/api/v1/auth`
| | |
|---|---|
| `GET /config` | Whether Google sign-in is on (+ client id) |
| `POST /otp/send` `{ mobile }` | 6-digit OTP, 5 min, max 3 per mobile / 10 min, 30 s resend cooldown |
| `POST /otp/verify` `{ mobile, otp, customerType? }` | Signs in — or signs up a new mobile |
| `POST /google` `{ credential }` | Google ID token verified server-side; links by email or signs up |
| `POST /refresh`, `POST /logout` | |
| `GET /me`, `PUT /me` | Profile: name, email, customer type, qualification, council registration no. |
| `POST /me/mobile/send`, `/me/mobile/verify` | Add or change the mobile (OTP to the new number) |
| `GET /sessions`, `DELETE /sessions/:id`, `POST /sessions/revoke-others` | Signed-in devices |

**Customer account** — `/api/v1/account` (signed-in customers; every write returns `{ user }`)
| | |
|---|---|
| `GET/POST /addresses`, `PUT/DELETE /addresses/:id`, `POST /addresses/:id/default` | Up to 20; state normalised to the official name (GST place of supply) |
| `GET/POST /gst`, `PUT/DELETE /gst/:id`, `POST /gst/:id/default` | Up to 10 GSTINs; format, state code and check digit validated |
| `PUT /avatar` (multipart `file`), `DELETE /avatar` | Profile photo |

The first address / GSTIN becomes the default; choosing a new default clears the old one, and
deleting the default promotes another. A customer can only ever see or change their own rows.

In development (`SMS_PROVIDER=console`) the OTP is printed in this terminal and returned as
`devOtp`. For production set `SMS_PROVIDER=msg91` with a DLT-approved template.

**Staff (admin)** — `/api/v1/admin/auth`
| | |
|---|---|
| `POST /login` `{ email, password, rememberMe }` | argon2; 5 wrong passwords → locked 15 min |
| `POST /refresh`, `POST /logout` | |
| `POST /forgot-password`, `POST /reset-password` | Emailed one-time link (also used for staff invites) |
| `GET /me`, `PUT /me`, `PUT /me/password` | `/me` returns the user **and their permission codes**; `PUT /me`: name, mobile, department |
| `PUT /me/avatar` (multipart `file`), `DELETE /me/avatar` | Profile photo |
| `GET /me/activity?page=&limit=` | Your own activity log (no `activity.view` needed) |
| `GET /sessions`, `DELETE /sessions/:id`, `POST /sessions/revoke-others` | Signed-in devices |

Profile photos (staff and customers) are square-cropped on the most detailed area, saved as
256 × 256 WebP in `uploads/avatars/`, and the previous photo file is deleted when replaced.

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

`npm test` runs the unit tests for money, lists, GSTIN checks, device names and image conversion (`tests/`).

## Layout

```
config/        env.js (every variable, validated) · cors.js
db/            Prisma client with the pg driver adapter
prisma/        schema, migrations, seed.js
src/lib/       tokens (JWT + cookies), password, OTP SMS, mailer, http, list, money, gstin, device, image (WebP), storage
src/middlewares/ auth (requireCustomer / requireAdmin / requirePermission), validate (zod), rate limits, errors
src/rbac/      permission catalogue + per-role permission cache
src/services/  sessions (+ signed-in devices), OTPs, activity log, avatars
src/modules/   auth (customers) · account (addresses, GST, photo) · admin-auth · staff · uploads
               — each: routes → controller → service → validator
uploads/       stored images (git-ignored)
tests/         node --test unit tests
```
