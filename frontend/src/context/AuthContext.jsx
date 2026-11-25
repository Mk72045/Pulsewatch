import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  deleteAccount as deleteAccountRequest,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the first /auth/me check ends, so a logged-in user
  // does not see a redirect to /login while the check is running.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Being logged out gives a normal 401 here, so no error toast is wanted.
    async function checkSession() {
      const result = await handleApi(fetchCurrentUser, { showError: false });

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
