import { useState } from "react";
import Link from "next/link";

import { registerUser } from "../services/authService";

export default function Register() {
	const [form, setForm] = useState({ username: "", password: "", role: "tenant" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const submit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);
		try {
			await registerUser(form);
			setSuccess("Registered successfully. You can login now.");
		} catch (err) {
			setError(err?.response?.data?.detail || "Registration failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-shell">
			<div className="auth-left">
				<div style={{ position: "relative", zIndex: 1 }}>
					<div
						style={{
							fontFamily: "'Playfair Display', serif",
							fontSize: "1.5rem",
							fontWeight: 900,
							color: "#fff",
							marginBottom: 48,
						}}
					>
						Rent<span style={{ color: "var(--green-300)" }}>Ease</span>
					</div>
					<p className="auth-welcome">Create Your Account</p>
					<p className="auth-sub">
						Sign up to manage properties, agreements, payments, and notices in one
						clean dashboard.
					</p>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{[
							"Register as tenant or landlord",
							"Access role-based dashboard",
							"Start managing your rentals",
						].map((t) => (
							<div
								key={t}
								style={{
									display: "flex",
									gap: 10,
									alignItems: "center",
									color: "rgba(255,255,255,0.80)",
									fontSize: "0.93rem",
								}}
							>
								<span
									style={{
										width: 20,
										height: 20,
										borderRadius: "50%",
										background: "rgba(47,191,120,0.3)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "0.7rem",
									}}
								>
									✓
								</span>
								{t}
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="auth-right">
				<div className="auth-form-wrap">
					<h1 className="auth-form-title">Create Account</h1>
					<p className="auth-form-sub">Fill details to get started with RentEase.</p>

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

						<div className="form-group">
							<label>Role</label>
							<select
								className="field"
								value={form.role}
								onChange={(e) => setForm({ ...form, role: e.target.value })}
							>
								<option value="tenant">Tenant</option>
								<option value="landlord">Landlord</option>
							</select>
						</div>

						{error && <p className="error-text">⚠ {error}</p>}
						{success && <p className="success-text">✓ {success}</p>}

						<button
							className="btn btn-primary"
							type="submit"
							disabled={loading}
							style={{ width: "100%", justifyContent: "center", padding: "14px" }}
						>
							{loading ? "Creating account..." : "Create Account →"}
						</button>
					</form>

					<p className="auth-footer">
						Already have an account? <Link href="/login">Sign in</Link>
					</p>
				</div>
			</div>
		</div>
	);
}