import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuth, role, ready } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuth) { router.replace("/login"); return; }
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace("/dashboard");
    }
  }, [isAuth, role, ready, router, allowedRoles]);

  if (!ready) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-2)" }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "0.5rem" }}>
            RentEase
          </div>
          <p style={{ fontSize: "0.85rem" }}>Loading session…</p>
        </div>
      </main>
    );
  }

  if (!isAuth) return null;
  return children;
}