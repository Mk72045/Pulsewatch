import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
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

  async function register(data) {
    setUser(await registerUser(data));
  }

  async function login(data) {
    setUser(await loginUser(data));
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
