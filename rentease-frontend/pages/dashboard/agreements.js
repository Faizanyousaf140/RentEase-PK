import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
	createAgreement,
	getAgreements,
	getProperties,
} from "../../services/authService";

const BLANK = { property: "", tenant: "", start_date: "", end_date: "", rent: "" };

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

const agreementStatus = (agreement) => {
	if (!agreement?.end_date) return "active";
	const now = new Date();
	const end = new Date(agreement.end_date);
	return end < now ? "expired" : "active";
};

const statusBadge = (status) => {
	if (status === "active") return <span className="badge badge-green">Active</span>;
	return <span className="badge badge-red">Expired</span>;
};

export default function Agreements() {
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const propertyNameById = useMemo(() => {
    return Object.fromEntries(properties.map((p) => [p.id, p.title]));
  }, [properties]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [agreementsRes, propertiesRes] = await Promise.all([
        getAgreements(),
        getProperties(),
      ]);
      setAgreements(Array.isArray(agreementsRes.data) ? agreementsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || "Failed to load agreements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = agreements.filter((a) => {
    const status = agreementStatus(a);
    const name = propertyNameById[a.property] || `Property #${a.property}`;
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      String(a.tenant).includes(search);
    if (tab === "all") return matchesSearch;
    return matchesSearch && status === tab;
  });

  const save = async () => {
    if (!form.property || !form.tenant || !form.start_date || !form.end_date || !form.rent) {
      setError("All fields are required.");
      return;
    }

    const landlordId = getUserIdFromToken();
    if (!landlordId) {
      setError("Unable to detect landlord ID from token.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createAgreement({
        property: Number(form.property),
        landlord: Number(landlordId),
        tenant: Number(form.tenant),
        rent: Number(form.rent),
        start_date: form.start_date,
        end_date: form.end_date,
      });
      setForm(BLANK);
      setModal(false);
      await loadData();
    } catch (apiError) {
      setError(
        apiError?.response?.data?.detail ||
          Object.values(apiError?.response?.data || {}).flat().join(" ") ||
          "Failed to create agreement."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="dashboard-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div className="page-header-text">
              <h1>Agreements</h1>
              <p className="muted">{agreements.filter((a) => agreementStatus(a) === "active").length} active · {agreements.length} total</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ New Agreement</button>
          </div>

          {error ? <p className="error-text">⚠ {error}</p> : null}

          {/* Tabs + search */}
          <div className="flex gap-2 items-center mb-3" style={{ flexWrap: "wrap" }}>
            <div className="tabs">
              {["all","active","expired"].map((t) => (
                <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input className="search-field" style={{ marginLeft: "auto" }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Tenant ID</th>
                  <th>Period</th>
                  <th>Monthly Rent</th>
                  <th>Status</th>
                  <th>Remaining</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="spinner" /></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📄</div><p className="muted">No agreements found.</p></div></td></tr>
                ) : filtered.map((a) => {
                  const remDiff = Math.ceil((new Date(a.end_date) - new Date()) / 86400000);
                  const rem = remDiff < 0
                    ? { text: "Expired", cls: "color-red" }
                    : remDiff < 30
                      ? { text: `${remDiff}d left`, cls: "color-orange" }
                      : { text: `${remDiff}d left`, cls: "color-green" };
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar avatar-blue">{String(a.property)[0]}</div>
                          <div className="td-main truncate" style={{ maxWidth: 180 }}>{propertyNameById[a.property] || `Property #${a.property}`}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>{a.tenant}</td>
                      <td className="mono" style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
                        {a.start_date}<br />{a.end_date}
                      </td>
                      <td className="mono color-gold">₨ {Number(a.rent).toLocaleString()}</td>
                      <td>{statusBadge(agreementStatus(a))}</td>
                      <td className={`mono ${rem.cls}`} style={{ fontSize: "0.8rem" }}>{rem.text}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDetail(a)} title="View">👁️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Create modal */}
          {modal && (
            <div className="overlay" onClick={() => setModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>New Agreement</h3>
                  <button className="modal-close" onClick={() => setModal(false)}>✕</button>
                </div>
                {error ? <p className="error-text">⚠ {error}</p> : null}
                <div className="form-stack">
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Property *</label>
                      <select className="field" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
                        <option value="">Select property</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tenant ID *</label>
                      <input className="field" type="number" placeholder="e.g. 2" value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <input className="field" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <input className="field" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Monthly Rent (PKR) *</label>
                      <input className="field" type="number" placeholder="45000" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Landlord ID</label>
                      <input className="field" value={getUserIdFromToken() || "Unknown"} disabled />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Creating..." : "Create Agreement"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Detail modal */}
          {detail && (
            <div className="overlay" onClick={() => setDetail(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Agreement Detail</h3>
                  <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1.5rem" }}>
                    {[
                      ["Property",   propertyNameById[detail.property] || `Property #${detail.property}`],
                      ["Tenant ID",  detail.tenant],
                      ["Landlord ID",detail.landlord],
                      ["Status",     null],
                      ["Start",      detail.start_date],
                      ["End",        detail.end_date],
                      ["Rent/mo",    `₨ ${Number(detail.rent).toLocaleString()}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="form-label">{k}</div>
                        <div style={{ fontSize: "0.9rem", marginTop: "0.2rem", fontFamily: k === "Rent/mo" || k === "Deposit" ? "DM Mono, monospace" : "inherit" }}>
                          {k === "Status" ? statusBadge(agreementStatus(detail)) : v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
                  <button className="btn btn-primary" onClick={() => alert("PDF generation requires backend")}>Download PDF</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}