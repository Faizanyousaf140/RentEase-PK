import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken]   = useState(null);
  const [role, setRole]     = useState(null);
  const [username, setUsername] = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("re_token");
    const r = localStorage.getItem("re_role");
    const u = localStorage.getItem("re_username");
    if (t) { setToken(t); setRole(r); setUsername(u); }
    setReady(true);
  }, []);

  const login = (accessToken, userRole, user) => {
    localStorage.setItem("re_token", accessToken);
    localStorage.setItem("re_role", userRole);
    localStorage.setItem("re_username", user || "User");
    setToken(accessToken);
    setRole(userRole);
    setUsername(user || "User");
  };

  const logout = () => {
    localStorage.removeItem("re_token");
    localStorage.removeItem("re_role");
    localStorage.removeItem("re_username");
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout, ready, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}