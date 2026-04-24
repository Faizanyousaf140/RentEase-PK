import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
	createProperty,
	deleteProperty,
	getProperties,
	updateProperty,
} from "../../services/authService";

const emptyForm = {
	title: "",
	address: "",
};

const getUserIdFromToken = () => {
	const token = localStorage.getItem("re_token");
	if (!token) return null;

	try {
		const decoded = jwtDecode(token);
		return decoded?.user_id || decoded?.userId || decoded?.id || null;
	} catch {
		return null;
	}
};

export default function Properties() {
	const [properties, setProperties] = useState([]);
	const [query, setQuery] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const loadProperties = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await getProperties();
			setProperties(Array.isArray(res.data) ? res.data : []);
		} catch (apiError) {
			setError(apiError?.response?.data?.detail || "Failed to load properties.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProperties();
	}, []);

	const filteredProperties = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) {
			return properties;
		}

		return properties.filter((item) => {
			return (
				item.title.toLowerCase().includes(normalizedQuery) ||
				item.address.toLowerCase().includes(normalizedQuery) ||
				String(item.owner).toLowerCase().includes(normalizedQuery)
			);
		});
	}, [properties, query]);

	const totalUnits = properties.length;
	const myUnits = properties.filter((p) => p.owner === getUserIdFromToken()).length;
	const otherUnits = totalUnits - myUnits;

	const openCreateModal = () => {
		setEditingId(null);
		setForm(emptyForm);
		setError("");
		setShowModal(true);
	};

	const openEditModal = (item) => {
		setEditingId(item.id);
		setForm({
			title: item.title,
			address: item.address,
		});
		setError("");
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingId(null);
		setForm(emptyForm);
		setError("");
	};

	const submitForm = async (event) => {
		event.preventDefault();

		if (!form.title.trim() || !form.address.trim()) {
			setError("Title and address are required.");
			return;
		}

		setSaving(true);
		setError("");
		try {
			const payload = {
				title: form.title.trim(),
				address: form.address.trim(),
			};

			if (editingId) {
				await updateProperty(editingId, payload);
			} else {
				const ownerId = getUserIdFromToken();
				if (!ownerId) {
					throw new Error("Unable to detect current user ID from token.");
				}
				await createProperty({ ...payload, owner: ownerId });
			}

			await loadProperties();
			closeModal();
		} catch (apiError) {
			setError(
				apiError?.response?.data?.detail ||
				Object.values(apiError?.response?.data || {}).flat().join(" ") ||
				apiError?.message ||
				"Failed to save property."
			);
		} finally {
			setSaving(false);
		}
	};

	const removeProperty = async (id) => {
		setError("");
		try {
			await deleteProperty(id);
			await loadProperties();
		} catch (apiError) {
			setError(apiError?.response?.data?.detail || "Failed to delete property.");
		}
	};

	return (
		<ProtectedRoute>
			<main className="page-shell">
				<div className="container">
					<Navbar />

					<section className="section-card card" style={{ marginBottom: 16 }}>
						<div className="section-head">
							<div>
								<h1 className="page-title">Properties</h1>
								<p className="muted text-sm">
									Manage units, status, and rent details in one responsive view.
								</p>
							</div>
							<button className="btn btn-primary" type="button" onClick={openCreateModal}>
								+ Add Property
							</button>
						</div>

						<div className="form-row" style={{ marginBottom: 18 }}>
							<div className="payment-stat">
								<div className="payment-stat-val">{totalUnits}</div>
								<div className="payment-stat-lbl">Total Units</div>
							</div>
							<div className="payment-stat">
								<div className="payment-stat-val">{myUnits}</div>
								<div className="payment-stat-lbl">My Units</div>
							</div>
						</div>

						<div className="form-row" style={{ marginBottom: 18 }}>
							<div className="payment-stat">
								<div className="payment-stat-val">{otherUnits}</div>
								<div className="payment-stat-lbl">Other Owners</div>
							</div>
						</div>

						<div className="form-group" style={{ marginBottom: 18 }}>
							<label>Search</label>
							<input
								className="field"
								placeholder="Search by title, city, or owner id"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>

						{error ? <p className="error-text">⚠ {error}</p> : null}

						{loading ? (
							<div className="empty-state">
								<div className="spinner" />
							</div>
						) : null}

						{!loading && filteredProperties.length === 0 ? (
							<div className="empty-state">
								<div className="empty-icon">🏠</div>
								<p>No properties found for this filter.</p>
							</div>
						) : (
							<div className="table-wrap">
								<table>
									<thead>
										<tr>
											<th>Title</th>
											<th>Address</th>
											<th>Owner ID</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{filteredProperties.map((item) => (
											<tr key={item.id}>
												<td className="font-bold">{item.title}</td>
												<td>{item.address}</td>
												<td>{item.owner}</td>
												<td>
													<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
														<button
															className="btn btn-ghost"
															type="button"
															onClick={() => openEditModal(item)}
														>
															Edit
														</button>
														<button
															className="btn btn-danger"
															type="button"
															onClick={() => removeProperty(item.id)}
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						<p className="muted text-sm" style={{ marginTop: 16 }}>
							Live API mode enabled. Results are fetched from backend.
						</p>
					</section>
				</div>

				{showModal ? (
					<div className="modal-overlay" onClick={closeModal}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<div className="modal-head">
								<h2 className="modal-title">
									{editingId ? "Edit Property" : "Add Property"}
								</h2>
								<button className="modal-close" type="button" onClick={closeModal}>
									×
								</button>
							</div>

							<form className="form-stack" onSubmit={submitForm}>
								<div className="form-group">
									<label>Title</label>
									<input
										className="field"
										placeholder="e.g., Maple Villas - 7B"
										value={form.title}
										onChange={(e) => setForm({ ...form, title: e.target.value })}
										required
									/>
								</div>

								<div className="form-row">
									<div className="form-group">
										<label>Owner</label>
										<input
											className="field"
											value={editingId ? "Kept as existing" : `Current user: ${getUserIdFromToken() || "Unknown"}`}
											disabled
										/>
									</div>
								</div>

								<div className="form-group">
									<label>Address</label>
									<input
										className="field"
										placeholder="Street, Area, City"
										value={form.address}
										onChange={(e) => setForm({ ...form, address: e.target.value })}
										required
									/>
								</div>

								{error ? <p className="error-text">⚠ {error}</p> : null}

								<div className="modal-actions">
									<button className="btn btn-outline" type="button" onClick={closeModal}>
										Cancel
									</button>
									<button className="btn btn-primary" type="submit" disabled={saving}>
										{saving
											? "Saving..."
											: editingId
												? "Save Changes"
												: "Add Property"}
									</button>
								</div>
							</form>
						</div>
					</div>
				) : null}
			</main>
		</ProtectedRoute>
	);
}