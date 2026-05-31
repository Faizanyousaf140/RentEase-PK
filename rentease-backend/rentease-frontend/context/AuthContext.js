import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState({ token: null, role: null, username: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window === "undefined" || !window.localStorage) {
        setReady(true);
        return;
      }

      const t = localStorage.getItem("re_token");
      const r = localStorage.getItem("re_role");
      const u = localStorage.getItem("re_username");

      if (t) {
        setSession({ token: t, role: r, username: u || "User" });
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const login = (accessToken, userRole, user) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("re_token", accessToken);
      localStorage.setItem("re_role", userRole);
      localStorage.setItem("re_username", user || "User");
    }
    setSession({ token: accessToken, role: userRole, username: user || "User" });
  };

  const logout = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("re_token");
      localStorage.removeItem("re_role");
      localStorage.removeItem("re_username");
    }
    setSession({ token: null, role: null, username: null });
  };

  return (
    <AuthContext.Provider
      value={{
        token: session.token,
        role: session.role,
        username: session.username,
        login,
        logout,
        ready,
        isAuth: !!session.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}