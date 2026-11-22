import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { GST_STATE_CODES, stateCode } from "../../lib/money.js";
import { paginate, searchWhere } from "../../lib/list.js";
import { getGroup } from "./service.js";

/**
 * Serviceable PIN codes (Settings → Shipping). Uploaded as CSV:
 *
 *   pincode,city,state,cod,delivery_days
 *   110020,New Delhi,Delhi,yes,1-2
 *   560001,Bengaluru,Karnataka,no,3-5
 *
 * Only `pincode` is required. While the list is empty every Indian PIN code is
 * deliverable (with the default delivery time); once it has rows, only those are.
 */

const MAX_ROWS = 50_000;
// Vehicle-registration style abbreviations people often use in courier sheets
const STATE_ABBR = {
  AN: "35", AP: "37", AR: "12", AS: "18", BR: "10", CH: "04", CG: "22", CT: "22", DD: "26", DN: "26", DL: "07", GA: "30",
  GJ: "24", HR: "06", HP: "02", JK: "01", JH: "20", KA: "29", KL: "32", LA: "38", LD: "31", MP: "23", MH: "27", MN: "14",
  ML: "17", MZ: "15", NL: "13", OD: "21", OR: "21", PY: "34", PB: "03", RJ: "08", SK: "11", TN: "33", TS: "36", TG: "36",
  TR: "16", UP: "09", UK: "05", UA: "05", WB: "19",
};
const CHUNK = 2_000;
const TRUE = new Set(["1", "y", "yes", "true", "available", "cod"]);
const FALSE = new Set(["0", "n", "no", "false", "unavailable", "prepaid"]);

/** Minimal RFC-4180 CSV parser (quoted fields, "" escapes, CRLF). */
export function parseCsv(textInput) {
  const text = textInput.replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const HEADER_ALIASES = {
  pincode: ["pincode", "pin", "pin_code", "pin code", "postal_code", "zip"],
  city: ["city", "district", "town"],
  state: ["state", "state_name"],
  cod: ["cod", "cod_available", "cash_on_delivery"],
  active: ["active", "is_active", "status", "serviceable"],
  delivery_days: ["delivery_days", "delivery", "days", "tat", "eta"],
};

/** CSV text → validated rows + per-line errors (nothing is written here). */
export function readPincodeCsv(text) {
  const table = parseCsv(text);
  if (!table.length) throw ApiError.badRequest("The CSV file is empty.", "EMPTY_CSV");

  const header = table[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.some((h) => HEADER_ALIASES.pincode.includes(h));
  const col = (name) => (hasHeader ? header.findIndex((h) => HEADER_ALIASES[name].includes(h)) : { pincode: 0, city: 1, state: 2, cod: 3, delivery_days: 4, active: 5 }[name]);
  const idx = { pincode: col("pincode"), city: col("city"), state: col("state"), cod: col("cod"), active: col("active"), delivery_days: col("delivery_days") };
  if (idx.pincode < 0) throw ApiError.badRequest('The CSV needs a "pincode" column.', "CSV_NO_PINCODE");

  const body = hasHeader ? table.slice(1) : table;
  if (body.length > MAX_ROWS) throw ApiError.badRequest(`At most ${MAX_ROWS.toLocaleString("en-IN")} rows per upload.`, "CSV_TOO_LARGE");

  const rows = new Map(); // last one wins for duplicates
  const errors = [];
  body.forEach((cells, i) => {
    const line = i + (hasHeader ? 2 : 1);
    const get = (name) => (idx[name] >= 0 ? String(cells[idx[name]] ?? "").trim() : "");
    const pincode = get("pincode").replace(/\s/g, "");
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      if (errors.length < 50) errors.push({ line, message: `"${pincode || "(blank)"}" is not a valid 6-digit PIN code` });
      return;
    }
    const codRaw = get("cod").toLowerCase();
    if (codRaw && !TRUE.has(codRaw) && !FALSE.has(codRaw) && errors.length < 50) {
      errors.push({ line, message: `COD "${codRaw}" not understood — use yes or no (row kept with COD allowed)` });
    }
    const activeRaw = get("active").toLowerCase();
    const isActive = activeRaw ? !FALSE.has(activeRaw) : true;
    const days = get("delivery_days");
    const stateRaw = get("state");
    const code = stateRaw ? STATE_ABBR[stateRaw.toUpperCase()] || stateCode(stateRaw) : null;
    rows.set(pincode, {
      pincode,
      city: get("city").slice(0, 80) || null,
      state: (code ? GST_STATE_CODES[code] : stateRaw).slice(0, 80) || null,
      cod_available: !FALSE.has(codRaw),
      delivery_days: /^\d{1,2}(-\d{1,2})?$/.test(days) ? days : null,
      is_active: isActive,
    });
  });
  return { rows: [...rows.values()], errors, totalLines: body.length };
}

function getModel(type = "ecommerce") {
  return type === "rental" ? prisma.rentalServiceablePincode : prisma.serviceablePincode;
}

/**
 * mode "replace": the uploaded list becomes the whole list.
 * mode "merge":   adds new PIN codes and updates existing ones.
 */
export async function importPincodes(text, mode = "merge", type = "ecommerce") {
  const model = getModel(type);
  const { rows, errors, totalLines } = readPincodeCsv(text);
  if (!rows.length) {
    throw ApiError.badRequest("No valid PIN codes found in the file.", "CSV_NO_ROWS", { file: errors[0]?.message || "No rows" });
  }

  const before = await model.count();
  await prisma.$transaction(
    async (tx) => {
      const txModel = type === "rental" ? tx.rentalServiceablePincode : tx.serviceablePincode;
      if (mode === "replace") await txModel.deleteMany({});
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        if (mode !== "replace") await txModel.deleteMany({ where: { pincode: { in: chunk.map((r) => r.pincode) } } });
        await txModel.createMany({ data: chunk });
      }
    },
    { timeout: 60_000 }
  );
  const after = await model.count();
  return { mode, imported: rows.length, skipped: totalLines - rows.length, errors, before, after };
}

export async function summary(type = "ecommerce") {
  const model = getModel(type);
  const [total, active, cod, latest] = await Promise.all([
    model.count(),
    model.count({ where: { is_active: true } }),
    model.count({ where: { is_active: true, cod_available: true } }),
    model.findFirst({ orderBy: { updated_at: "desc" }, select: { updated_at: true } }),
  ]);
  return { total, active, codAvailable: cod, lastUpdatedAt: latest?.updated_at || null, restricted: active > 0 };
}

export async function list({ page, limit, q, type = "ecommerce" }) {
  const model = getModel(type);
  const { rows, meta } = await paginate(model, {
    where: q ? (/^\d+$/.test(q) ? { pincode: { startsWith: q } } : searchWhere(q, ["city", "state"])) : {},
    orderBy: [{ pincode: "asc" }],
    page,
    limit,
  });
  return {
    rows: rows.map((r) => ({
      pincode: r.pincode,
      city: r.city || "",
      state: r.state || "",
      codAvailable: r.cod_available,
      deliveryDays: r.delivery_days || "",
      active: r.is_active,
    })),
    meta,
  };
}

export async function clearAll(type = "ecommerce") {
  const model = getModel(type);
  const { count } = await model.deleteMany({});
  return count;
}

export async function toggleCod(pincode, type = "ecommerce") {
  const model = getModel(type);
  const existing = await model.findUnique({ where: { pincode } });
  if (!existing) throw ApiError.notFound(`PIN code ${pincode} not found`);

  const updated = await model.update({
    where: { pincode },
    data: { cod_available: !existing.cod_available },
  });

  const sum = await summary(type);

  return {
    pincode: updated.pincode,
    city: updated.city || "",
    state: updated.state || "",
    codAvailable: updated.cod_available,
    deliveryDays: updated.delivery_days || "",
    active: updated.is_active,
    summary: sum,
  };
}

export async function toggleActive(pincode, type = "rental") {
  const model = getModel(type);
  const existing = await model.findUnique({ where: { pincode } });
  if (!existing) throw ApiError.notFound(`PIN code ${pincode} not found`);

  const updated = await model.update({
    where: { pincode },
    data: { is_active: !existing.is_active },
  });

  const sum = await summary(type);

  return {
    pincode: updated.pincode,
    city: updated.city || "",
    state: updated.state || "",
    codAvailable: updated.cod_available,
    deliveryDays: updated.delivery_days || "",
    active: updated.is_active,
    summary: sum,
  };
}

export async function deletePincode(pincode, type = "ecommerce") {
  const model = getModel(type);
  const existing = await model.findUnique({ where: { pincode } });
  if (!existing) throw ApiError.notFound(`PIN code ${pincode} not found`);

  await model.delete({ where: { pincode } });
  return { pincode, removed: true };
}

export async function exportCsv(type = "ecommerce") {
  const model = getModel(type);
  const rows = await model.findMany({ orderBy: { pincode: "asc" } });
  const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  if (type === "rental") {
    return [
      "pincode,city,state,active,delivery_days",
      ...rows.map((r) => [r.pincode, r.city || "", r.state || "", r.is_active ? "yes" : "no", r.delivery_days || ""].map(esc).join(",")),
    ].join("\n");
  }
  return [
    "pincode,city,state,cod,delivery_days",
    ...rows.map((r) => [r.pincode, r.city || "", r.state || "", r.cod_available ? "yes" : "no", r.delivery_days || ""].map(esc).join(",")),
  ].join("\n");
}

/** Storefront rental delivery check: GET /pincodes/:pincode?type=rental or GET /rentals/pincodes/:pincode */
export async function checkRental(pincode) {
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return { pincode, serviceable: false, codAvailable: false, city: "", state: "", deliveryDays: "", message: "Enter a valid 6-digit PIN code" };
  }
  const [rentalSettings, restricted, row] = await Promise.all([
    getGroup("rental"),
    prisma.rentalServiceablePincode.count({ where: { is_active: true } }).then((n) => n > 0),
    prisma.rentalServiceablePincode.findUnique({ where: { pincode } }),
  ]);

  if (restricted && (!row || !row.is_active)) {
    return { pincode, serviceable: false, codAvailable: false, city: "", state: "", deliveryDays: "", message: "Doorstep biomedical setup is currently not available for this pincode." };
  }
  const minLead = rentalSettings?.minLeadDays != null ? String(rentalSettings.minLeadDays) : "1-2";
  const deliveryDays = row?.delivery_days || minLead;
  return {
    pincode,
    serviceable: true,
    codAvailable: false,
    city: row?.city || "",
    state: row?.state || "",
    deliveryDays,
    message: row?.city ? `Available in ${row.city}` : `Available for rental delivery`,
  };
}

/** Storefront delivery check: GET /pincodes/:pincode */
export async function check(pincode, type = "ecommerce") {
  if (type === "rental") return checkRental(pincode);

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return { pincode, serviceable: false, codAvailable: false, city: "", state: "", deliveryDays: "", message: "Enter a valid 6-digit PIN code" };
  }
  const [shipping, restricted, row] = await Promise.all([
    getGroup("shipping"),
    prisma.serviceablePincode.count({ where: { is_active: true } }).then((n) => n > 0),
    prisma.serviceablePincode.findUnique({ where: { pincode } }),
  ]);

  if (restricted && (!row || !row.is_active)) {
    return { pincode, serviceable: false, codAvailable: false, city: "", state: "", deliveryDays: "", message: "We don't deliver to this PIN code yet" };
  }
  const deliveryDays = row?.delivery_days || shipping.defaultDeliveryDays;
  return {
    pincode,
    serviceable: true,
    codAvailable: shipping.codEnabled && (row ? row.cod_available : true),
    city: row?.city || "",
    state: row?.state || "",
    deliveryDays,
    message: `Delivery in ${deliveryDays} business day${deliveryDays === "1" ? "" : "s"}`,
  };
}
