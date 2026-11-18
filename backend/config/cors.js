import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

// Comma-separated list in .env → array of origins (trailing slashes removed)
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

// development → LOCAL_URL, production → PRODUCTION_URL
export const allowedOrigins = parseOrigins(
  isProduction ? process.env.PRODUCTION_URL : process.env.LOCAL_URL
);

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
