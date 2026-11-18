import { toast } from "sonner";
import { parseApiError } from "./parseApiError.js";

// Runs an API call so that pages never need their own try/catch.
//   request:   a function that makes the call, e.g. () => login(form)
//   success:   text for a green toast when it works (optional)
//   showError: set false when no error toast is wanted
// It always returns { ok: true, data } or { ok: false, error }.
export async function handleApi(request, { success, showError = true } = {}) {
  try {
    const data = await request();

    if (success) {
      toast.success(success);
    }

    return { ok: true, data };
  } catch (err) {
    const error = parseApiError(err);

    if (showError) {
      // Field problems are also shown under the inputs, so the toast is short.
      const text =
        Object.keys(error.fields).length > 0
          ? "Please fix the highlighted fields."
          : error.message;

      // The text is the id, so the same message does not stack up on repeated clicks.
      toast.error(text, { id: text });
    }

    return { ok: false, error };
  }
}
