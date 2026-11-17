import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the first /auth/me check ends, so a logged-in user
  // does not see a redirect to /login while the check is running.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function register(data) {
    setUser(await registerUser(data));
  }

  async function login(data) {
    setUser(await loginUser(data));
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // The cookie may still be there. The next /auth/me check shows the truth.
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
