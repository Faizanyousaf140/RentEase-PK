import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
	createPayment,
	getAgreements,
	getPayments,
	getProperties,
} from "../../services/authService";

const BLANK = { agreement: "", amount: "", month: "", status: "paid" };

const statusBadge = (s) => {
  if (s === "paid")    return <span className="badge badge-green badge-dot">Paid</span>;
  if (s === "pending") return <span className="badge badge-orange badge-dot">Pending</span>;
  return <span className="badge badge-neutral">Unknown</span>;
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const agreementMap = useMemo(
    () => Object.fromEntries(agreements.map((a) => [a.id, a])),
    [agreements]
  );

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.title])),
    [properties]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentsRes, agreementsRes, propertiesRes] = await Promise.all([
        getPayments(),
        getAgreements(),
        getProperties(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setAgreements(Array.isArray(agreementsRes.data) ? agreementsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = payments.filter((p) => {
    const agreement = agreementMap[p.agreement];
    const propertyName = propertyMap[agreement?.property] || `Property #${agreement?.property || "-"}`;
    const tenantText = String(agreement?.tenant || "");
    const m =
      propertyName.toLowerCase().includes(search.toLowerCase()) ||
      tenantText.includes(search) ||
      String(p.month).toLowerCase().includes(search.toLowerCase());
    return tab === "all" ? m : m && p.status === tab;
  });

  const totalPaid    = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  const save = async () => {
    if (!form.agreement || !form.amount || !form.month) {
      setError("Agreement, amount, and month are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createPayment({
        agreement: Number(form.agreement),
        amount: Number(form.amount),
        month: form.month,
        status: form.status,
      });
      setForm(BLANK);
      setModal(false);
      await loadData();
    } catch (apiError) {
      setError(
        apiError?.response?.data?.detail ||
          Object.values(apiError?.response?.data || {}).flat().join(" ") ||
          "Failed to create payment."
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
              <h1>Payments</h1>
              <p className="muted">Full rent payment history and status.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ Log Payment</button>
          </div>

          {error ? <p className="error-text">⚠ {error}</p> : null}

          {/* Summary cards */}
          <div className="stat-cards mb-3">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--success-dim)" }}>💰</div>
              <div className="stat-card-label">Total Collected</div>
              <div className="stat-card-value" style={{ fontSize: "1.4rem" }}>₨ {(totalPaid / 1000).toFixed(0)}K</div>
              <div className="stat-card-delta up">↑ All time</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--warn-dim)" }}>⏳</div>
              <div className="stat-card-label">Outstanding</div>
              <div className="stat-card-value" style={{ fontSize: "1.4rem" }}>₨ {(totalPending / 1000).toFixed(0)}K</div>
              <div className="stat-card-delta down">↓ Needs attention</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--accent-dim)" }}>📊</div>
              <div className="stat-card-label">Collection Rate</div>
              <div className="stat-card-value" style={{ fontSize: "1.4rem" }}>
                {Math.round((payments.filter(p => p.status === "paid").length / payments.length) * 100)}%
              </div>
              <div className="stat-card-delta">{payments.filter(p => p.status === "paid").length} of {payments.length} paid</div>
            </div>
          </div>

          {/* Tabs + search */}
          <div className="flex gap-2 items-center mb-3" style={{ flexWrap: "wrap" }}>
            <div className="tabs">
              {["all","paid","pending"].map((t) => (
                <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input className="search-field" style={{ marginLeft: "auto" }} placeholder="Search by property or tenant…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>For Month</th>
                  <th>Amount</th>
                  <th>Paid On</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="spinner" /></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">💳</div><p className="muted">No payments found.</p></div></td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar avatar-green">{String(agreementMap[p.agreement]?.property || "-")[0]}</div>
                        <div className="td-main truncate" style={{ maxWidth: 180 }}>
                          {propertyMap[agreementMap[p.agreement]?.property] || `Property #${agreementMap[p.agreement]?.property || "-"}`}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>{agreementMap[p.agreement]?.tenant || "-"}</td>
                    <td className="mono" style={{ fontSize: "0.85rem" }}>{p.month}</td>
                    <td className="mono color-gold">₨ {Number(p.amount).toLocaleString()}</td>
                    <td style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>{p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "—"}</td>
                    <td><span className="badge badge-neutral">Agreement #{p.agreement}</span></td>
                    <td>{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collection progress */}
          <div className="card mt-3">
            <div className="section-header" style={{ marginBottom: "0.75rem" }}>
              <h4>Collection Progress (This Dataset)</h4>
              <span className="muted-sm">{Math.round((payments.filter(p => p.status === "paid").length / payments.length) * 100)}% collected</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill green" style={{ width: `${(payments.filter(p => p.status === "paid").length / payments.length) * 100}%` }} />
            </div>
          </div>

          {/* Log payment modal */}
          {modal && (
            <div className="overlay" onClick={() => setModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Log Payment</h3>
                  <button className="modal-close" onClick={() => setModal(false)}>✕</button>
                </div>
                {error ? <p className="error-text">⚠ {error}</p> : null}
                <div className="form-stack">
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Agreement *</label>
                      <select className="field" value={form.agreement} onChange={(e) => setForm({ ...form, agreement: e.target.value })}>
                        <option value="">Select agreement</option>
                        {agreements.map((a) => (
                          <option key={a.id} value={a.id}>
                            #{a.id} - {propertyMap[a.property] || `Property #${a.property}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Amount (PKR) *</label>
                      <input className="field" type="number" placeholder="45000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">For Month *</label>
                      <input className="field" placeholder="e.g. Mar 2025" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Logging..." : "Log Payment"}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}