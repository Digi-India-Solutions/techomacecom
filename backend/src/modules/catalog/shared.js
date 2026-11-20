import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import env from "../../../config/env.js";
import { parseStoredPath, publicUrl } from "../../lib/storage.js";

/**
 * Helpers shared by the catalog modules (categories, brands, products, storefront).
 * Keeping them in one place means every module validates slugs, images and
 * rich text the same way.
 */

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

/** "Oxygen Concentrators (5L)" → "oxygen-concentrators-5l" */
export function slugify(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Optional slug field: blank → generated from the name by the service. */
export const slugField = (max) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .max(max, `Slug must be at most ${max} characters`)
    .optional()
    .default("")
    .transform((v) => slugify(v))
    .refine((v) => v === "" || SLUG_RE.test(v), "Use lowercase letters, numbers and hyphens only");

/**
 * Returns `base`, or `base-2`, `base-3`… — the first slug no other row uses.
 * @param exists async (slug) => boolean
 */
export async function uniqueSlug(base, exists, max) {
  const root = (base || "item").slice(0, max);
  if (!(await exists(root))) return root;
  for (let i = 2; i < 1000; i++) {
    const suffix = `-${i}`;
    const candidate = `${root.slice(0, max - suffix.length)}${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

/**
 * Soft-deleted rows keep their data for history (orders reference products),
 * but must free their unique values so the same slug / SKU can be reused.
 *   tombstone("oxygen-5l", 42n, 140) → "oxygen-5l~deleted-42"
 */
export function tombstone(value, id, max) {
  const suffix = `~deleted-${id}`;
  return `${String(value).slice(0, max - suffix.length)}${suffix}`;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Image fields accept what the admin UI can send:
 *   ""                                   → no image (stored as NULL)
 *   "/uploads/products/2026/11/ab….webp" → an image from POST /admin/uploads (stored as is)
 *   "http://localhost:5001/uploads/…"     → same, but the full URL (converted to the path)
 *   "https://cdn.example.com/x.jpg"      → an external https image (stored as is)
 * Rejected: blob:/data:/javascript: URLs (a browser-only preview must be uploaded first).
 * Storing the relative path means moving to a CDN later needs no data migration.
 */
export const imageField = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .default("")
  .transform((value, ctx) => {
    if (!value) return null;
    const stored = parseStoredPath(value);
    if (stored) return stored.path;
    if (/^https:\/\/[^\s"'<>]+$/i.test(value) || (!env.isProduction && /^http:\/\/[^\s"'<>]+$/i.test(value))) {
      return value;
    }
    ctx.addIssue({ code: "custom", message: "Upload the image first (only uploaded or https images are allowed)" });
    return z.NEVER;
  });

/** Stored path → absolute URL for API responses ("" when there is no image). */
export const imageOut = (path) => (path ? publicUrl(path) : "");

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** Optional trimmed text; blank → null so the DB stores NULL, not "". */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .default("")
    .transform((v) => v || null);

/**
 * Product descriptions come from the admin rich-text editor and are rendered
 * as HTML on the storefront, so they are sanitised on the way IN (document:
 * "sanitised HTML"). Scripts, event handlers, iframes and javascript: links are removed.
 */
export function sanitizeRichText(html) {
  if (!html) return null;
  const clean = sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr", "h2", "h3", "h4", "h5", "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "ul", "ol", "li", "blockquote", "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"] },
    // Every link opens safely in a new tab
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }) },
  }).trim();
  return clean || null;
}

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

/** A database id sent by a client (string), or null. */
export const idString = z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id");
export const idParamSchema = z.object({ id: idString });

/** True when a client-side id is a real DB id (new rows carry temp ids like "var-1731…"). */
export const isDbId = (value) => typeof value === "string" && /^[1-9][0-9]{0,18}$/.test(value);
