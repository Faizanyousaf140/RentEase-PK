import Link from "next/link";

import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function Dashboard() {
	const sections = [
		{
			title: "Properties",
			description: "Manage your listed units and availability.",
			href: "/dashboard/properties",
			icon: "🏘️",
		},
		{
			title: "Agreements",
			description: "Track active and pending agreements.",
			href: "/dashboard/agreements",
			icon: "📄",
		},
		{
			title: "Payments",
			description: "Review rent payments and statuses.",
			href: "/dashboard/payments",
			icon: "💰",
		},
		{
			title: "Notices",
			description: "Send and monitor tenant notices.",
			href: "/dashboard/notices",
			icon: "📢",
		},
	];

	return (
		<ProtectedRoute>
			<main className="page-shell">
				<div className="container">
					<Navbar />

					<div className="dash-layout">
						<section className="dash-welcome">
							<h1>Dashboard</h1>
							<p>Role-based system active and ready.</p>
						</section>

						<section className="tiles">
							{sections.map((item) => (
								<Link key={item.href} href={item.href} className="tile">
									<div className="tile-icon">{item.icon}</div>
									<h3>{item.title}</h3>
									<p>{item.description}</p>
									<div className="tile-arrow">→</div>
								</Link>
							))}
						</section>

						<section className="activity-card card">
							<h2 className="activity-title">Recent Activity</h2>
							<div className="activity-item">
								<span className="activity-dot" />
								<p className="muted">Property listing updated</p>
							</div>
							<div className="activity-item">
								<span className="activity-dot yellow" />
								<p className="muted">Agreement pending approval</p>
							</div>
							<div className="activity-item">
								<span className="activity-dot red" />
								<p className="muted">Payment overdue notice generated</p>
							</div>
						</section>
					</div>
				</div>
			</main>
		</ProtectedRoute>
	);
}