import { saveImage } from "../modules/uploads/service.js";
import { parseStoredPath, deleteImage } from "../lib/storage.js";
import { ApiError } from "../lib/http.js";

/**
 * Profile photos for staff and customers: square-cropped (on the face / most
 * detailed area), 256 × 256 WebP, ~10–20 KB. Stored under uploads/avatars/.
 */
export const AVATAR_FOLDER = "avatars";
const AVATAR_SIZE = 256;

/** Converts and saves the uploaded photo; returns its stored path. */
export async function storeAvatar(file) {
  if (!file) throw ApiError.badRequest('Choose a photo to upload (form field "file")', "NO_FILE");
  const saved = await saveImage(file, AVATAR_FOLDER, { maxDimension: AVATAR_SIZE, variantWidths: [], square: true });
  return saved.path;
}

/** Deletes an old photo if it is one of ours (a Google profile picture URL is left alone). */
export async function discardAvatar(value) {
  const stored = parseStoredPath(value);
  if (stored?.folder === AVATAR_FOLDER) await deleteImage(stored).catch(() => 0);
}
