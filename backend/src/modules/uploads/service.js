import { processImage } from "../../lib/image.js";
import { datedDir, newFileId, writeFile, publicUrl, deleteImage, parseStoredPath } from "../../lib/storage.js";
import { ApiError } from "../../lib/http.js";

/**
 * Saves one uploaded image as WebP (+ responsive sizes) and describes it.
 * Store `path` in the database; `url` / `srcSet` are for immediate display.
 */
export async function saveImage(file, folder) {
  const processed = await processImage(file.buffer);
  const dir = datedDir(folder);
  const id = newFileId();

  const mainPath = `${dir}/${id}.webp`;
  await writeFile(mainPath, processed.main.buffer);

  const variants = [];
  for (const v of processed.variants) {
    const vPath = `${dir}/${id}-w${v.width}.webp`;
    await writeFile(vPath, v.buffer);
    variants.push({ width: v.width, height: v.height, path: vPath, url: publicUrl(vPath), bytes: v.buffer.length });
  }

  const all = [...variants, { width: processed.main.width, path: mainPath }];
  const savedPercent = Math.max(0, Math.round((1 - processed.main.buffer.length / file.size) * 100));

  return {
    path: mainPath,
    url: publicUrl(mainPath),
    width: processed.main.width,
    height: processed.main.height,
    bytes: processed.main.buffer.length,
    originalName: file.originalname,
    originalFormat: processed.sourceFormat,
    originalBytes: file.size,
    savedPercent,
    animated: processed.animated,
    variants,
    srcSet: all.map((v) => `${publicUrl(v.path)} ${v.width}w`).join(", "),
    placeholder: processed.placeholder,
  };
}

export async function removeImage(value, allowedFolders) {
  const stored = parseStoredPath(value);
  if (!stored) throw ApiError.badRequest("Not an uploaded image path", "INVALID_PATH");
  if (!allowedFolders.includes(stored.folder)) {
    throw ApiError.forbidden(`You cannot delete images in "${stored.folder}"`, "PERMISSION_DENIED");
  }
  const removed = await deleteImage(stored);
  if (!removed) throw ApiError.notFound("Image not found (already deleted?)");
  return { path: stored.path, filesRemoved: removed };
}
