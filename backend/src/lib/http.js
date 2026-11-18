/**
 * Response helpers — document §12 response format:
 *   { "success": true,  "data": …, "meta": { page, limit, total } }
 *   { "success": false, "error": { code, message, fields } }
 */

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message, code = "BAD_REQUEST", fields) {
    return new ApiError(400, code, message, fields);
  }
  static unauthorized(message = "Please sign in to continue", code = "UNAUTHORIZED") {
    return new ApiError(401, code, message);
  }
  static forbidden(message = "You do not have permission to do this", code = "FORBIDDEN") {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new ApiError(404, code, message);
  }
  static conflict(message, code = "CONFLICT", fields) {
    return new ApiError(409, code, message, fields);
  }
  static tooMany(message, code = "RATE_LIMITED") {
    return new ApiError(429, code, message);
  }
}

export function ok(res, data, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/** Client IP for audit columns (INET). Express sets req.ip; strip IPv6-mapped prefix. */
export function clientIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || null;
  return ip ? ip.replace(/^::ffff:/, "") : null;
}

export function userAgent(req) {
  return (req.get("user-agent") || "").slice(0, 300) || null;
}
