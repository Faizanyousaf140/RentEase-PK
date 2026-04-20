import { useState } from "react";

import { registerUser } from "../services/authService";

export default function Register() {
	const [form, setForm] = useState({ role: "tenant" });

	const submit = async () => {
		await registerUser(form);
		alert("Registered!");
	};

	return (
		<div>
			<h2>Register</h2>
			<input
				placeholder="username"
				onChange={(e) => setForm({ ...form, username: e.target.value })}
			/>
			<input
				placeholder="password"
				type="password"
				onChange={(e) => setForm({ ...form, password: e.target.value })}
			/>

			<select onChange={(e) => setForm({ ...form, role: e.target.value })}>
				<option value="tenant">Tenant</option>
				<option value="landlord">Landlord</option>
			</select>

			<button onClick={submit}>Register</button>
		</div>
	);
}