// The Google OAuth Web client id, as given by Google Cloud Console. It is a
// public value, not a secret. When it is missing the Google buttons are not
// drawn at all, the same way the app turns off other optional features.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const googleEnabled = Boolean(GOOGLE_CLIENT_ID);
