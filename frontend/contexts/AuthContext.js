import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem("sf_token") : null);
  const [user, setUser] = useState(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem("sf_user") : null;
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("sf_token", token); else localStorage.removeItem("sf_token");
    if (user) localStorage.setItem("sf_user", JSON.stringify(user)); else localStorage.removeItem("sf_user");
  }, [token, user]);

  function login(tokenValue, userObj) {
    setToken(tokenValue);
    setUser(userObj);
  }
  function logout() {
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}