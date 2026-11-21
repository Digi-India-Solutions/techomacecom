import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { GST_STATE_CODES } from "../../lib/money.js";
import { publicUrl, parseStoredPath, deleteImage } from "../../lib/storage.js";
import { saveImage } from "../uploads/service.js";
import { DEFAULTS, IMAGE_SETTINGS, SCHEMAS, SETTING_GROUPS, STATE_OPTIONS, toAdminForm } from "./definitions.js";

/**
 * Reading settings happens on almost every storefront request (fees, contact details),
 * so each group is cached in memory and dropped whenever it is saved.
 */
const CACHE_MS = 60_000;
const cache = new Map(); // group → { values, at }

export function invalidate(group) {
  if (group) cache.delete(group);
  else cache.clear();
}

function assertGroup(group) {
  if (!SETTING_GROUPS.includes(group)) {
    throw ApiError.notFound(`Unknown settings group "${group}". Use one of: ${SETTING_GROUPS.join(", ")}`);
  }
}

/** Stored values merged over defaults (unknown / retired keys are ignored). */
export async function getGroup(group) {
  assertGroup(group);
  const hit = cache.get(group);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.values;

  const rows = await prisma.setting.findMany({ where: { group_key: group } });
  const values = structuredClone(DEFAULTS[group]);
  for (const row of rows) {
    if (Object.hasOwn(values, row.key) && row.value !== null) values[row.key] = row.value;
  }
  cache.set(group, { values, at: Date.now() });
  return values;
}

async function writeValues(group, values, tx = prisma) {
  for (const [key, value] of Object.entries(values)) {
    await tx.setting.upsert({
      where: { group_key_key: { group_key: group, key } },
      create: { group_key: group, key, value },
      update: { value },
    });
  }
}

/**
 * Saves a whole tab. Returns the stored values and a list of what changed (for the audit log).
 * Image paths are not part of the form — they are changed through setImage().
 */
export async function saveGroup(group, input) {
  assertGroup(group);
  const result = SCHEMAS[group].safeParse(input ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) fields[issue.path.join(".") || group] ??= issue.message;
    throw new ApiError(422, "VALIDATION_ERROR", Object.values(fields)[0] || "Please check the highlighted fields", fields);
  }
  const parsed = result.data;
  const before = await getGroup(group);
  const changed = Object.keys(parsed).filter((k) => JSON.stringify(parsed[k]) !== JSON.stringify(before[k]));
  if (changed.length) {
    await prisma.$transaction((tx) => writeValues(group, Object.fromEntries(changed.map((k) => [k, parsed[k]])), tx));
    invalidate(group);
  }
  return { values: await getGroup(group), changed };
}

/** Admin form shape: rupees instead of paise, plus full image URLs. */
export async function adminView() {
  const out = {};
  for (const group of SETTING_GROUPS) {
    const values = await getGroup(group);
    out[group] = toAdminForm(group, values);
  }
  out.images = {
    logo: publicUrl(out.store.logoPath) || null,
    footerLogo: publicUrl(out.store.footerLogoPath) || null,
    favicon: publicUrl(out.store.faviconPath) || null,
    signatory: publicUrl(out.tax.signatoryPath) || null,
  };
  out.options = {
    states: STATE_OPTIONS,
    gstRates: [0, 5, 12, 18, 28],
  };
  return out;
}

// ---------------------------------------------------------------------------
// Logo / favicon / signatory images
// ---------------------------------------------------------------------------

async function discardOld(path) {
  const stored = parseStoredPath(path);
  if (stored?.folder === "misc") await deleteImage(stored).catch(() => 0);
}

export async function setImage(name, file) {
  const def = IMAGE_SETTINGS[name];
  if (!def) throw ApiError.notFound(`Unknown image "${name}". Use one of: ${Object.keys(IMAGE_SETTINGS).join(", ")}`);
  if (!file) throw ApiError.badRequest('Attach an image in the "file" field', "NO_FILE");

  const saved = await saveImage(file, "misc", def.options);
  const old = (await getGroup(def.group))[def.key];
  await writeValues(def.group, { [def.key]: saved.path });
  invalidate(def.group);
  await discardOld(old);
  return { name, path: saved.path, url: saved.url, width: saved.width, height: saved.height, bytes: saved.bytes };
}

export async function removeImage(name) {
  const def = IMAGE_SETTINGS[name];
  if (!def) throw ApiError.notFound(`Unknown image "${name}"`);
  const old = (await getGroup(def.group))[def.key];
  await writeValues(def.group, { [def.key]: "" });
  invalidate(def.group);
  await discardOld(old);
}

// ---------------------------------------------------------------------------
// Public (storefront) view — only what customers may see
// ---------------------------------------------------------------------------

const rupees = (paise) => Math.round(paise) / 100;
const telHref = (phone) => (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");

export async function publicView() {
  const [store, shipping, tax, rental, pincodeCount] = await Promise.all([
    getGroup("store"),
    getGroup("shipping"),
    getGroup("tax"),
    getGroup("rental"),
    countActivePincodes(),
  ]);
  return {
    store: {
      storeName: store.storeName,
      brandName: store.brandName,
      tagline: store.tagline,
      logoUrl: publicUrl(store.logoPath) || null,
      footerLogoUrl: publicUrl(store.footerLogoPath || store.logoPath) || null,
      faviconUrl: publicUrl(store.faviconPath) || null,
      supportPhone: store.supportPhone,
      supportPhoneHref: telHref(store.supportPhone),
      salesPhone: store.salesPhone,
      salesPhoneHref: telHref(store.salesPhone),
      tollFreePhone: store.tollFreePhone,
      tollFreePhoneHref: telHref(store.tollFreePhone),
      supportEmail: store.supportEmail,
      salesEmail: store.salesEmail || store.supportEmail,
      whatsappNumber: store.whatsappNumber ? `+91 ${store.whatsappNumber.slice(0, 5)} ${store.whatsappNumber.slice(5)}` : "",
      whatsappLink: store.whatsappNumber ? `https://wa.me/91${store.whatsappNumber}` : "",
      address: store.address,
      mapUrl: store.mapUrl,
      gstin: store.gstin,
      supportHours: { open: store.supportOpenTime, close: store.supportCloseTime, openOnSunday: store.openOnSunday },
      social: {
        instagram: store.instagramUrl,
        facebook: store.facebookUrl,
        linkedin: store.linkedinUrl,
        youtube: store.youtubeUrl,
        twitter: store.twitterUrl,
      },
    },
    shipping: {
      flatShippingCharge: rupees(shipping.flatShippingChargePaise),
      freeShippingAbove: rupees(shipping.freeShippingAbovePaise),
      codEnabled: shipping.codEnabled,
      codMaxOrderValue: rupees(shipping.codMaxOrderValuePaise),
      codCharge: rupees(shipping.codChargePaise),
      defaultDeliveryDays: shipping.defaultDeliveryDays,
      dispatchCutoffTime: shipping.dispatchCutoffTime,
      restrictedToListedPincodes: pincodeCount > 0,
    },
    tax: {
      gstEnabled: tax.gstEnabled,
      pricesIncludeGst: tax.pricesIncludeGst,
      defaultGstRate: tax.defaultGstRate,
      dispatchStateCode: tax.dispatchStateCode,
      dispatchState: GST_STATE_CODES[tax.dispatchStateCode] || "",
      invoiceFooterTerms: tax.footerTerms,
      signatoryName: tax.signatoryName,
      signatoryUrl: publicUrl(tax.signatoryPath) || null,
    },
    rental: {
      reminderDaysBeforeDue: rental.reminderDaysBeforeDue,
      lateFeePerDay: rupees(rental.lateFeePerDayPaise),
      gracePeriodDays: rental.gracePeriodDays,
      depositRefundDays: rental.depositRefundDays,
    },
  };
}

// ---------------------------------------------------------------------------
// Invoice numbers (for the orders / rentals modules)
// ---------------------------------------------------------------------------

/**
 * Atomically takes the next invoice number, e.g. "BDM/26-27/00042".
 * One SQL statement, so two orders paid at the same moment never get the same number.
 */
export async function allocateInvoiceNumber() {
  const tax = await getGroup("tax");
  // Create the counter row if it was never saved (ON CONFLICT: safe when two requests race here)
  await prisma.$executeRaw`
    INSERT INTO settings (group_key, key, value, updated_at)
    VALUES ('tax', 'nextInvoiceNumber', to_jsonb(${tax.nextInvoiceNumber}::bigint), now())
    ON CONFLICT (group_key, key) DO NOTHING`;
  const [row] = await prisma.$queryRaw`
    UPDATE settings SET value = to_jsonb((value #>> '{}')::bigint + 1)
    WHERE group_key = 'tax' AND key = 'nextInvoiceNumber'
    RETURNING (value #>> '{}')::bigint - 1 AS number`;
  invalidate("tax");
  const number = Number(row.number);
  return `${tax.invoicePrefix}${String(number).padStart(tax.invoiceNumberDigits, "0")}`;
}

// ---------------------------------------------------------------------------
// Serviceable PIN codes
// ---------------------------------------------------------------------------

export function countActivePincodes() {
  return prisma.serviceablePincode.count({ where: { is_active: true } });
}
