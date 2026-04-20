import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
	const { logout } = useContext(AuthContext);

	return (
		<div style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
			<h2>RentEase</h2>
			<button onClick={logout}>Logout</button>
		</div>
	);
}