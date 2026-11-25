// Turns an Axios error into a message for the top of the form and a
// message per field, e.g. { password: "..." } from the backend's details.
// `code` is the backend's machine-readable name, when it sent one.
export function parseApiError(error) {
  const data = error.response?.data;

  if (!data) {
    return {
      message: "Could not reach the server. Please try again.",
      fields: {},
      code: null,
    };
  }

  const fields = {};

  for (const item of data.details ?? []) {
    fields[item.field] = item.message;
  }

  return {
    message: data.message ?? "Something went wrong.",
    fields,
    code: data.code ?? null,
  };
}
