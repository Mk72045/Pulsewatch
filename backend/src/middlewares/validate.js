import { ApiError } from "../utils/ApiError.js";

// Runs a zod schema on req.body. Bad input stops here with a 400.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    next(new ApiError(400, "Validation failed", details));
    return;
  }

  // Replace the body with the cleaned data (trimmed, lowercased, extras removed).
  req.body = result.data;
  next();
};
