import { ApiError } from "../lib/http.js";
import env from "../../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  // Prisma: unique constraint
  if (err?.code === "P2002") {
    const target = [].concat(err.meta?.target || err.meta?.driverAdapterError?.cause?.constraint?.fields || []).join(", ");
    error = ApiError.conflict(target ? `A record with this ${target} already exists` : "This record already exists", "DUPLICATE");
  }
  // Prisma: record not found for update/delete
  else if (err?.code === "P2025") {
    error = ApiError.notFound("Record not found");
  }
  // Multer (file uploads)
  else if (err?.name === "MulterError") {
    error =
      err.code === "LIMIT_FILE_SIZE"
        ? new ApiError(413, "FILE_TOO_LARGE", `Each image must be under ${env.uploads.maxFileMb} MB`)
        : err.code === "LIMIT_FILE_COUNT"
          ? ApiError.badRequest(`Upload at most ${env.uploads.maxFiles} images at once`, "TOO_MANY_FILES")
          : ApiError.badRequest(`Upload error: ${err.message} (use the "file" or "files" field)`, "UPLOAD_ERROR");
  }
  // Bad JSON body
  else if (err?.type === "entity.parse.failed") {
    error = ApiError.badRequest("Request body is not valid JSON", "INVALID_JSON");
  }
  // CORS rejection from config/cors.js
  else if (err?.status === 403 && err.message?.startsWith("CORS")) {
    error = ApiError.forbidden(err.message, "CORS_REJECTED");
  }

  if (!(error instanceof ApiError)) {
    console.error(err);
    const status = err?.status && err.status < 500 ? err.status : 500;
    return res.status(status).json({
      success: false,
      error: {
        code: status === 500 ? "INTERNAL_ERROR" : "ERROR",
        message: status === 500 && env.isProduction ? "Something went wrong. Please try again." : err?.message || "Internal Server Error",
      },
    });
  }

  if (error.status >= 500) console.error(err);
  res.status(error.status).json({
    success: false,
    error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) },
  });
}
