import { useContext, useState } from "react";
import { useRouter } from "next/router";

import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/authService";

export default function Login() {
	const [form, setForm] = useState({});
	const { login } = useContext(AuthContext);
	const router = useRouter();

	const submit = async () => {
		const res = await loginUser(form);
		login(res.data.access, "landlord");
		router.push("/dashboard");
	};

	return (
		<div>
			<h2>Login</h2>
			<input
				placeholder="username"
				onChange={(e) => setForm({ ...form, username: e.target.value })}
			/>
			<input
				placeholder="password"
				type="password"
				onChange={(e) => setForm({ ...form, password: e.target.value })}
			/>
			<button onClick={submit}>Login</button>
		</div>
	);
}