import ProtectedRoute from "../../components/ProtectedRoute";

export default function Notices() {
	return (
		<ProtectedRoute>
			<h1>Notices</h1>
		</ProtectedRoute>
	);
}