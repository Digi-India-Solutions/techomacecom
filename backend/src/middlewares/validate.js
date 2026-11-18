import { ApiError } from "../lib/http.js";

/**
 * validate({ body: zodSchema, query: zodSchema, params: zodSchema })
 * Replaces req.body / req.validatedQuery / req.validatedParams with the parsed values.
 * (Express 5 makes req.query read-only, so parsed query/params get their own keys.)
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const fields = {};
        for (const issue of result.error.issues) {
          const key = issue.path.join(".") || part;
          fields[key] ??= issue.message;
        }
        const first = Object.values(fields)[0];
        return next(new ApiError(422, "VALIDATION_ERROR", first || "Please check the highlighted fields", fields));
      }
      if (part === "body") req.body = result.data;
      else if (part === "query") req.validatedQuery = result.data;
      else if (part === "params") req.validatedParams = result.data;
    }
    next();
  };
}
