import env from "./env.js";

// Storefront + admin URLs for the current NODE_ENV (see config/env.js corsOrigins)
export const allowedOrigins = env.corsOrigins;

export const corsOptions = {
  origin(origin, callback) {
    // Allow tools without an Origin header (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error(`CORS: origin ${origin} is not allowed`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
