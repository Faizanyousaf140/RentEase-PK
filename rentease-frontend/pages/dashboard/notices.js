import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
	createNotice,
	getAgreements,
	getNotices,
	getProperties,
} from "../../services/authService";

const BLANK = { agreement: "", type: "maintenance", message: "" };

const TYPE_CONFIG = {
  eviction:    { label: "Eviction",    icon: "⚠️", badgeClass: "badge-red",    noticeClass: "eviction" },
  maintenance: { label: "Maintenance", icon: "🔧", badgeClass: "badge-orange", noticeClass: "maintenance" },
};

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
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
      const [noticesRes, agreementsRes, propertiesRes] = await Promise.all([
        getNotices(),
        getAgreements(),
        getProperties(),
      ]);
      setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : []);
      setAgreements(Array.isArray(agreementsRes.data) ? agreementsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = notices.filter((n) => {
    const agreement = agreementMap[n.agreement];
    const propertyName = propertyMap[agreement?.property] || `Property #${agreement?.property || "-"}`;
    const m =
      n.message.toLowerCase().includes(search.toLowerCase()) ||
      n.type.toLowerCase().includes(search.toLowerCase()) ||
      propertyName.toLowerCase().includes(search.toLowerCase());
    return tab === "all" ? m : m && n.type === tab;
  });

  const save = async () => {
    if (!form.agreement || !form.type || !form.message.trim()) {
      setError("Agreement, type, and message are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createNotice({
        agreement: Number(form.agreement),
        type: form.type,
        message: form.message.trim(),
      });
      setForm(BLANK);
      setModal(false);
      await loadData();
    } catch (apiError) {
      setError(
        apiError?.response?.data?.detail ||
          Object.values(apiError?.response?.data || {}).flat().join(" ") ||
          "Failed to create notice."
      );
    } finally {
      setSaving(false);
    }
  };

  const evictionCount = notices.filter((n) => n.type === "eviction").length;

  return (
    <ProtectedRoute>
      <div className="dashboard-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div className="page-header-text">
              <h1>Notice Board</h1>
              <p className="muted">
                {notices.length} notices &nbsp;
                {evictionCount > 0 && <span className="badge badge-red">{evictionCount} eviction</span>}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ Send Notice</button>
          </div>

          {error ? <p className="error-text">⚠ {error}</p> : null}

          {/* Tabs */}
          <div className="flex gap-2 items-center mb-3" style={{ flexWrap: "wrap" }}>
            <div className="tabs">
              {[
                { key: "all",         label: "All" },
                { key: "eviction",    label: "Eviction" },
                { key: "maintenance", label: "Maintenance" },
              ].map((t) => (
                <button key={t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            <input className="search-field" style={{ marginLeft: "auto" }} placeholder="Search notices…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Notice list */}
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔔</div><p className="muted">No notices found.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filtered.map((n) => {
                const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.maintenance;
                const agreement = agreementMap[n.agreement];
                const propertyName = propertyMap[agreement?.property] || `Property #${agreement?.property || "-"}`;
                return (
                  <div
                    key={n.id}
                    className={`notice-card ${tc.noticeClass}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => { setDetail(n); }}
                  >
                    <div className="notice-icon" style={{ background: n.type === "eviction" ? "var(--danger-dim)" : "var(--warn-dim)" }}>
                      {tc.icon}
                    </div>
                    <div className="notice-body">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.2rem" }}>
                        <div className="notice-title">
                          {tc.label} notice
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                          <span className={`badge ${tc.badgeClass}`}>{tc.label}</span>
                        </div>
                      </div>
                      <p className="notice-text" style={{ WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.message}
                      </p>
                      <div className="notice-meta">
                        <span>Agreement #{n.agreement}</span>
                        <span>·</span>
                        <span>{propertyName}</span>
                        <span>·</span>
                        <span>{n.created_at ? new Date(n.created_at).toISOString().slice(0, 10) : "-"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Send modal */}
          {modal && (
            <div className="overlay" onClick={() => setModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Send Notice</h3>
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
                      <label className="form-label">Type</label>
                      <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="eviction">Eviction</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea className="field" rows={4} placeholder="Notice details…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ resize: "vertical" }} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Sending..." : "Send Notice"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Detail modal */}
          {detail && (
            <div className="overlay" onClick={() => setDetail(null)}>
              <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className={`badge ${TYPE_CONFIG[detail.type]?.badgeClass}`}>{TYPE_CONFIG[detail.type]?.label}</span>
                  </div>
                  <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
                </div>
                <h3 style={{ marginBottom: "1rem" }}>Agreement #{detail.agreement}</h3>
                <p style={{ color: "var(--text-2)", lineHeight: 1.7, fontSize: "0.9rem", marginBottom: "1.25rem" }}>{detail.message}</p>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {[["Property", propertyMap[agreementMap[detail.agreement]?.property] || `Property #${agreementMap[detail.agreement]?.property || "-"}`], ["Tenant ID", agreementMap[detail.agreement]?.tenant || "-"], ["Date", detail.created_at ? new Date(detail.created_at).toISOString().slice(0, 10) : "-"]].map(([k, v]) => (
                    <div key={k}>
                      <div className="form-label">{k}</div>
                      <div style={{ fontSize: "0.875rem", marginTop: "0.15rem" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}