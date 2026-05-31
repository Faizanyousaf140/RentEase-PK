import { useContext, useEffect, useState } from "react";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";
import { getAgreements, getNotices, getPayments, getProperties } from "../../services/authService";

export default function Dashboard() {
	const { role } = useContext(AuthContext);
	const [stats, setStats] = useState({ properties: 0, agreements: 0, payments: 0, notices: 0, loading: true, error: "" });

	const sections = role === "landlord" ? [
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
	] : [
		{
			title: "Browse Properties",
			description: "Find available properties to apply for.",
			href: "/dashboard/properties",
			icon: "🏘️",
		},
		{
			title: "My Agreements",
			description: "View your active and expired agreements.",
			href: "/dashboard/agreements",
			icon: "📄",
		},
		{
			title: "Payments",
			description: "Mark payments and view confirmations.",
			href: "/dashboard/payments",
			icon: "💰",
		},
		{
			title: "Notices",
			description: "Read notices related to your agreements.",
			href: "/dashboard/notices",
			icon: "📢",
		},
	];

	useEffect(() => {
		const load = async () => {
			try {
				const [propertiesRes, agreementsRes, paymentsRes, noticesRes] = await Promise.all([
					getProperties(),
					getAgreements(),
					getPayments(),
					getNotices(),
				]);

				setStats({
					properties: Array.isArray(propertiesRes.data) ? propertiesRes.data.length : 0,
					agreements: Array.isArray(agreementsRes.data) ? agreementsRes.data.length : 0,
					payments: Array.isArray(paymentsRes.data) ? paymentsRes.data.length : 0,
					notices: Array.isArray(noticesRes.data) ? noticesRes.data.length : 0,
					loading: false,
					error: "",
				});
			} catch (error) {
				setStats((current) => ({ ...current, loading: false, error: error?.response?.data?.detail || "Failed to load dashboard stats." }));
			}
		};

		load();
	}, []);

	return (
		<ProtectedRoute>
			<main className="page-shell">
				<div className="container">
					<Navbar />

					<div className="dash-layout">
						<section className="dash-welcome">
							<h1>Dashboard</h1>
							<p>{role === "landlord" ? "Landlord overview active and ready." : "Tenant overview active and ready."}</p>
						</section>

						<section className="stat-cards mb-3">
							{[
								[role === "landlord" ? "Properties" : "Available Properties", stats.properties],
								[role === "landlord" ? "Agreements" : "My Agreements", stats.agreements],
								[role === "landlord" ? "Payments" : "My Payments", stats.payments],
								["Notices", stats.notices],
							].map(([label, value]) => (
								<div key={label} className="stat-card">
									<div className="stat-card-label">{label}</div>
									<div className="stat-card-value" style={{ fontSize: "1.4rem" }}>{stats.loading ? "…" : value}</div>
								</div>
							))}
						</section>

						{stats.error ? <p className="error-text">⚠ {stats.error}</p> : null}

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