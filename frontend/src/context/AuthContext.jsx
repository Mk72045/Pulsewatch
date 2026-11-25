import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  deleteAccount as deleteAccountRequest,
  deleteAccountWithCode as deleteAccountWithCodeRequest,
  fetchCurrentUser,
  loginUser,
  loginWithCode as loginWithCodeRequest,
  logoutUser,
  registerUser,
  signInWithGoogle as signInWithGoogleRequest,
  updatePassword,
  verifyEmail,
} from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";

const AuthContext = createContext(null);

// One session check at a time. React StrictMode mounts the provider twice in
// development, which used to make two identical /auth/me requests. Sharing
// the promise in flight means the second mount waits on the first instead of
// asking the server again. It is cleared as soon as it finishes, so a later
// refresh still makes a fresh request.
let sessionCheck = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the first /auth/me check ends, so a logged-in user
  // does not see a redirect to /login while the check is running.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      sessionCheck ??= handleApi(fetchCurrentUser, { showError: false });

      const result = await sessionCheck;

      sessionCheck = null;

      // Logged out is a normal 200 with user: null, so no error toast.
      setUser(result.ok ? result.data : null);
      setLoading(false);
    }

    checkSession();
  }, []);

  // Asks the server for the user again, for example after Telegram was
  // connected. Returns the new user, or null if the request failed.
  const refreshUser = useCallback(async () => {
    const result = await handleApi(fetchCurrentUser, { showError: false });

    if (result.ok) {
      setUser(result.data);
      return result.data;
    }

    return null;
  }, []);

  // Creating an account does not start a session. This returns
  // { email, emailSent } so the caller can open the verification page.
  async function register(data) {
    return registerUser(data);
  }

  // Called from the verification page once the code is accepted. The cookie
  // is set by the backend, so the user is logged in from here on.
  async function confirmEmail(data) {
    setUser(await verifyEmail(data));
  }

  async function login(data) {
    setUser(await loginUser(data));
  }

  // The backend creates the account on the first sign-in and sets the cookie,
  // so the session starts here. Both pages use this one method.
  async function signInWithGoogle(credential) {
    setUser(await signInWithGoogleRequest(credential));
  }

  // Signing in with a code emailed to the address. No password involved.
  async function loginWithCode(data) {
    setUser(await loginWithCodeRequest(data));
  }

  // Adds a password to a Google account (or changes an existing one) and
  // refreshes the user so `hasPassword` is up to date.
  async function changePassword(data) {
    setUser(await updatePassword(data));
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  // Deletes the account for good. The backend checks the password again and
  // clears the cookie, so on success the local user is simply dropped.
  // It answers { ok } or { ok, error: "message" }, which the confirm dialog
  // shows under the password box when the password was wrong.
  async function deleteAccount(password) {
    const result = await handleApi(() => deleteAccountRequest(password), {
      success: "Your account was deleted",
      showError: false,
    });

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    setUser(null);
    return { ok: true };
  }

  // The same deletion, proven with a code emailed to the address. This is the
  // way in for accounts without a password, such as ones made with Google.
  async function deleteAccountWithCode(code) {
    const result = await handleApi(() => deleteAccountWithCodeRequest(code), {
      success: "Your account was deleted",
      showError: false,
    });

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    setUser(null);
    return { ok: true };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        confirmEmail,
        login,
        logout,
        deleteAccount,
        deleteAccountWithCode,
        loginWithCode,
        signInWithGoogle,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
