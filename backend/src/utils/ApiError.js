export class ApiError extends Error {
  // `code` is a short machine-readable name, such as EMAIL_UNVERIFIED, that
  // the frontend can act on when the message alone is not enough.
  constructor(statusCode, message, details, code) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}
