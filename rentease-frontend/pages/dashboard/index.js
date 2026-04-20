import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Dashboard() {
	return (
		<ProtectedRoute>
			<Navbar />
			<h1>Dashboard</h1>
			<p>Role-based system active</p>
		</ProtectedRoute>
	);
}