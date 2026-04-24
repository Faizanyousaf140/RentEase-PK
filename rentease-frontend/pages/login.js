import { useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/authService";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(form);
      const accessToken = res.data?.access;
      const decoded = accessToken ? jwtDecode(accessToken) : {};
      const role =
        res.data?.role ||
        res.data?.user?.role ||
        decoded?.role ||
        decoded?.user_role ||
        "tenant";
      const username =
        res.data?.username ||
        res.data?.user?.username ||
        form.username;

      login(accessToken, role, username);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* LEFT */}
      <div className="auth-left">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: 48 }}>
            Rent<span style={{ color: "var(--green-300)" }}>Ease</span>
          </div>
          <p className="auth-welcome">Welcome Back!</p>
          <p className="auth-sub">
            Your properties, agreements, and payments are waiting. Log in to
            manage everything from one place.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Track rent payments", "View active agreements", "Send notices"].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.80)", fontSize: "0.93rem" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(47,191,120,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Sign In</h1>
          <p className="auth-form-sub">Enter your credentials to continue.</p>

          <form className="form-stack" onSubmit={submit}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="field"
                placeholder="your_username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="field"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && <p className="error-text">⚠ {error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}