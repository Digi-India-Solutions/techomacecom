import sharp from "sharp";
import env from "../../config/env.js";
import { ApiError } from "./http.js";

/**
 * Converts any uploaded image to WebP for fast page loads:
 *  • auto-rotates from EXIF, then strips ALL metadata (camera, GPS location)
 *  • caps the longest side at IMAGE_MAX_DIMENSION (no upscaling)
 *  • writes extra widths (IMAGE_VARIANT_WIDTHS) for <img srcset> / next/image
 *  • makes a ~150-byte blurred placeholder for instant first paint
 *
 * Encoding (from .env):
 *   IMAGE_WEBP_LOSSLESS=false (default) → lossy WebP at IMAGE_WEBP_QUALITY (85): visually
 *     identical, typically 70–90 % smaller than the JPEG/PNG upload
 *   IMAGE_WEBP_LOSSLESS=true → pixel-perfect WebP, larger files
 */

// SVG is refused on purpose: it can carry scripts. HEIC (iPhone) needs a codec sharp does not ship.
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);
const MAX_INPUT_PIXELS = 50_000_000; // ~ 8660 × 5770; stops decompression bombs

function webpOptions() {
  const { webpLossless, webpQuality, webpEffort } = env.uploads;
  return webpLossless
    ? { lossless: true, effort: webpEffort }
    : { quality: webpQuality, alphaQuality: 90, smartSubsample: true, effort: webpEffort };
}

/**
 * @returns {Promise<{ main: {buffer, width, height}, variants: {width, height, buffer}[],
 *            placeholder: string, sourceFormat: string, animated: boolean }>}
 */
export async function processImage(buffer) {
  let meta;
  try {
    meta = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw ApiError.badRequest("This file is not a readable image.", "INVALID_IMAGE");
  }
  if (!ACCEPTED_FORMATS.has(meta.format)) {
    throw ApiError.badRequest(
      meta.format === "heif"
        ? "iPhone HEIC photos are not supported. Export as JPEG or PNG first."
        : `Unsupported image type (${meta.format || "unknown"}). Use JPEG, PNG, WebP, GIF, AVIF or TIFF.`,
      "UNSUPPORTED_IMAGE"
    );
  }

  const animated = (meta.pages || 1) > 1; // animated GIF / WebP stays animated
  const base = () =>
    sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, animated, failOn: "error" }).rotate();

  const max = env.uploads.maxDimension;
  const mainResult = await base()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp(webpOptions())
    .toBuffer({ resolveWithObject: true });

  const main = { buffer: mainResult.data, width: mainResult.info.width, height: mainResult.info.pageHeight || mainResult.info.height };

  // Smaller sizes (skipped for animations, and for widths ≥ the main image)
  const variants = [];
  if (!animated) {
    for (const width of env.uploads.variantWidths) {
      if (width >= main.width) continue;
      const v = await base()
        .resize({ width, withoutEnlargement: true })
        .webp(webpOptions())
        .toBuffer({ resolveWithObject: true });
      variants.push({ width: v.info.width, height: v.info.height, buffer: v.data });
    }
  }

  const tiny = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: 16, height: 16, fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    main,
    variants,
    placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
    sourceFormat: meta.format,
    animated,
  };
}
