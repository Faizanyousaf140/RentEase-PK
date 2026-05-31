import { jwtDecode } from "jwt-decode";
import { useContext, useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";
import {
	createProperty,
	deleteProperty,
	getProperties,
	requestAgreement,
	updateProperty,
} from "../../services/authService";

const emptyForm = {
	title: "",
	address: "",
	rent_amount: "",
	is_occupied: false,
};

const getUserIdFromToken = () => {
	if (typeof window === "undefined" || !window.localStorage) return null;
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
	const { role } = useContext(AuthContext);
	const [properties, setProperties] = useState([]);
	const [query, setQuery] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [requestModal, setRequestModal] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [requestProperty, setRequestProperty] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [requestForm, setRequestForm] = useState({ start_date: "", end_date: "", proposed_rent: "", advance_amount: "", tenant_message: "" });
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
		 const id = setTimeout(() => {
		   loadProperties();
		 }, 0);
		 return () => clearTimeout(id);
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
				String(item.owner).toLowerCase().includes(normalizedQuery) ||
				String(item.rent_amount || "").toLowerCase().includes(normalizedQuery) ||
				String(item.is_occupied).toLowerCase().includes(normalizedQuery)
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

	const openRequestModal = (item) => {
		setRequestProperty(item);
		setRequestForm({ start_date: "", end_date: "", proposed_rent: "", advance_amount: "", tenant_message: "" });
		setError("");
		setRequestModal(true);
	};

	const openEditModal = (item) => {
		setEditingId(item.id);
		setForm({
			title: item.title,
			address: item.address,
			rent_amount: item.rent_amount ?? "",
			is_occupied: !!item.is_occupied,
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

	const closeRequestModal = () => {
		setRequestModal(false);
		setRequestProperty(null);
		setRequestForm({ start_date: "", end_date: "", proposed_rent: "", advance_amount: "", tenant_message: "" });
		setError("");
	};

	const submitForm = async (event) => {
		event.preventDefault();

		if (!form.title.trim() || !form.address.trim() || form.rent_amount === "") {
			setError("Title, address, and rent amount are required.");
			return;
		}

		setSaving(true);
		setError("");
		try {
			const payload = {
				title: form.title.trim(),
				address: form.address.trim(),
				rent_amount: Number(form.rent_amount),
				is_occupied: form.is_occupied,
			};

			if (editingId) {
				await updateProperty(editingId, payload);
			} else {
				await createProperty(payload);
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

	const submitRequest = async (event) => {
		event.preventDefault();

		if (!requestProperty) {
			setError("Invalid property selected.");
			return;
		}

		if (!requestForm.start_date || !requestForm.end_date) {
			setError("Start date and end date are required.");
			return;
		}

		const start = new Date(requestForm.start_date);
		const end = new Date(requestForm.end_date);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			setError("Start date and end date must be valid dates.");
			return;
		}

		if (end <= start) {
			setError("End date must be after the start date.");
			return;
		}

		if (requestForm.proposed_rent !== "" && Number(requestForm.proposed_rent) < 0) {
			setError("Proposed rent must be a positive number.");
			return;
		}

		if (requestForm.advance_amount !== "" && Number(requestForm.advance_amount) < 0) {
			setError("Advance amount must be a positive number.");
			return;
		}

		setSaving(true);
		setError("");
		try {
			await requestAgreement({
				property: requestProperty.id,
				start_date: requestForm.start_date,
				end_date: requestForm.end_date,
				proposed_rent: requestForm.proposed_rent === "" ? Number(requestProperty.rent_amount || 0) : Number(requestForm.proposed_rent),
				advance_amount: requestForm.advance_amount === "" ? 0 : Number(requestForm.advance_amount),
				tenant_message: requestForm.tenant_message,
			});
			await loadProperties();
			closeRequestModal();
		} catch (apiError) {
			setError(
				apiError?.response?.data?.detail ||
				Object.values(apiError?.response?.data || {}).flat().join(" ") ||
				apiError?.message ||
				"Failed to request agreement."
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
									{role === "landlord"
										? "Manage units, status, and rent details in one responsive view."
										: "Browse available properties in one responsive view."}
								</p>
							</div>
							{role === "landlord" && (
								<button className="btn btn-primary" type="button" onClick={openCreateModal}>
									+ Add Property
								</button>
							)}
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

						<div className="form-row" style={{ marginBottom: 18 }}>
							<div className="payment-stat">
								<div className="payment-stat-val">₨ {properties.reduce((sum, item) => sum + Number(item.rent_amount || 0), 0).toLocaleString()}</div>
								<div className="payment-stat-lbl">Total Listed Rent</div>
							</div>
							<div className="payment-stat">
								<div className="payment-stat-val">{properties.filter((item) => item.is_occupied).length}</div>
								<div className="payment-stat-lbl">Occupied Units</div>
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
											<th>Rent</th>
											<th>Status</th>
											{role === "landlord" && <th>Owner ID</th>}
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{filteredProperties.map((item) => (
											<tr key={item.id}>
												<td className="font-bold">{item.title}</td>
												<td>{item.address}</td>
												<td>₨ {Number(item.rent_amount || 0).toLocaleString()}</td>
												<td>{item.is_occupied ? "Occupied" : "Vacant"}</td>
												{role === "landlord" && <td>{item.owner}</td>}
												<td>
													{role === "landlord" ? (
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
													) : role === "tenant" ? (
														<button className="btn btn-primary" type="button" onClick={() => openRequestModal(item)}>
															Request Agreement
														</button>
													) : (
														<span className="badge badge-neutral">Browse only</span>
													)}
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

								<div className="field-row">
									<div className="form-group">
										<label>Monthly Rent (PKR)</label>
										<input
											className="field"
											type="number"
											placeholder="45000"
											value={form.rent_amount}
											onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
											required
										/>
									</div>
									<div className="form-group">
										<label>Occupancy</label>
										<select
											className="field"
											value={form.is_occupied ? "occupied" : "vacant"}
											onChange={(e) => setForm({ ...form, is_occupied: e.target.value === "occupied" })}
										>
											<option value="vacant">Vacant</option>
											<option value="occupied">Occupied</option>
										</select>
									</div>
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

				{requestModal && requestProperty ? (
					<div className="modal-overlay" onClick={closeRequestModal}>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<div className="modal-head">
								<h2 className="modal-title">Request Agreement</h2>
								<button className="modal-close" type="button" onClick={closeRequestModal}>
									×
								</button>
							</div>

							<form className="form-stack" onSubmit={submitRequest}>
								<div className="form-group">
									<label>Property</label>
									<input className="field" value={requestProperty.title} disabled />
								</div>

								<div className="form-row">
									<div className="form-group">
										<label>Monthly Rent</label>
										<input className="field" value={`₨ ${Number(requestProperty.rent_amount || 0).toLocaleString()}`} disabled />
									</div>
									<div className="form-group">
										<label>Current Status</label>
										<input className="field" value={requestProperty.is_occupied ? "Occupied" : "Vacant"} disabled />
									</div>
								</div>

								<div className="field-row">
									<div className="form-group">
										<label>Start Date</label>
										<input
											className="field"
											type="date"
											value={requestForm.start_date}
											onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
										/>
									</div>
									<div className="form-group">
										<label>End Date</label>
										<input
											className="field"
											type="date"
											value={requestForm.end_date}
											onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
										/>
									</div>
								</div>

								<div className="field-row">
									<div className="form-group">
										<label>Proposed Rent (PKR)</label>
										<input
											className="field"
											type="number"
											placeholder={String(requestProperty.rent_amount || 0)}
											value={requestForm.proposed_rent}
											onChange={(e) => setRequestForm({ ...requestForm, proposed_rent: e.target.value })}
										/>
									</div>
									<div className="form-group">
										<label>Advance Amount (PKR)</label>
										<input
											className="field"
											type="number"
											placeholder="0"
											value={requestForm.advance_amount}
											onChange={(e) => setRequestForm({ ...requestForm, advance_amount: e.target.value })}
										/>
									</div>
								</div>

								<div className="form-group">
									<label>Message</label>
									<textarea
										className="field"
										rows={3}
										placeholder="Tell the landlord what you'd like to negotiate."
										value={requestForm.tenant_message}
										onChange={(e) => setRequestForm({ ...requestForm, tenant_message: e.target.value })}
									/>
								</div>

								{error ? <p className="error-text">⚠ {error}</p> : null}

								<div className="modal-actions">
									<button className="btn btn-outline" type="button" onClick={closeRequestModal}>
										Cancel
									</button>
									<button className="btn btn-primary" type="submit" disabled={saving}>
										{saving ? "Sending..." : "Send Request"}
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