import { jwtDecode } from "jwt-decode";
import { useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";
import {
  approveAgreement,
  createAgreement,
  getAgreements,
  getProperties,
  getUsers,
  exportAgreement,
  negotiateAgreement,
  rejectAgreement,
} from "../../services/authService";

const BLANK = { property: "", tenant: "", start_date: "", end_date: "", rent: "", proposed_rent: "", advance_amount: "", tenant_message: "" };

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

const agreementStatus = (agreement) => {
  const status = agreement?.status;
  if (["pending", "rejected", "terminated", "expired", "active"].includes(status)) {
    if (status === "active" && agreement?.end_date) {
      const now = new Date();
      const end = new Date(agreement.end_date);
      if (end < now) {
        return "expired";
      }
    }
    return status;
  }

  if (!agreement?.end_date) return "active";
  const now = new Date();
  const end = new Date(agreement.end_date);
  return end < now ? "expired" : "active";
};

const statusBadge = (status) => {
  if (status === "pending") return <span className="badge badge-orange">Pending</span>;
	if (status === "active") return <span className="badge badge-green">Active</span>;
  if (status === "rejected") return <span className="badge badge-red">Rejected</span>;
  if (status === "expired") return <span className="badge badge-red">Expired</span>;
  return <span className="badge badge-neutral">Unknown</span>;
};

export default function Agreements() {
  const { role } = useContext(AuthContext);
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [negotiateModal, setNegotiateModal] = useState(false);
  const [negotiateAgreementItem, setNegotiateAgreementItem] = useState(null);
  const [negotiateForm, setNegotiateForm] = useState({ proposed_rent: "", advance_amount: "", tenant_message: "" });

  const propertyNameById = useMemo(() => {
    return Object.fromEntries(properties.map((p) => [p.id, p.title]));
  }, [properties]);

  const userById = useMemo(() => {
    return Object.fromEntries(users.map((u) => [u.id, u]));
  }, [users]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [agreementsRes, propertiesRes, usersRes] = await Promise.all([
        getAgreements(),
        getProperties(),
        getUsers(),
      ]);
      setAgreements(Array.isArray(agreementsRes.data) ? agreementsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || "Failed to load agreements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(id);
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

  const pendingCount = agreements.filter((a) => agreementStatus(a) === "pending").length;

  const save = async () => {
    if (role !== "landlord") {
      setError("Only landlords can create agreements.");
      return;
    }

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
        proposed_rent: form.proposed_rent === "" ? Number(form.rent) : Number(form.proposed_rent),
        advance_amount: form.advance_amount === "" ? 0 : Number(form.advance_amount),
        tenant_message: form.tenant_message,
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

  const handleAgreementAction = async (agreementId, action) => {
    setActionLoadingId(agreementId);
    setError("");
    try {
      if (action === "approve") {
        await approveAgreement(agreementId);
      } else {
        await rejectAgreement(agreementId);
      }
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || `Failed to ${action} agreement.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openNegotiateModal = (agreement) => {
    setNegotiateAgreementItem(agreement);
    setNegotiateForm({
      proposed_rent: agreement?.proposed_rent ?? agreement?.rent ?? "",
      advance_amount: agreement?.advance_amount ?? 0,
      tenant_message: agreement?.tenant_message ?? "",
    });
    setError("");
    setNegotiateModal(true);
  };

  const closeNegotiateModal = () => {
    setNegotiateModal(false);
    setNegotiateAgreementItem(null);
    setNegotiateForm({ proposed_rent: "", advance_amount: "", tenant_message: "" });
    setError("");
  };

  const submitNegotiation = async (event) => {
    event.preventDefault();

    if (!negotiateAgreementItem || negotiateForm.proposed_rent === "") {
      setError("Proposed rent is required.");
      return;
    }

    setActionLoadingId(negotiateAgreementItem.id);
    setError("");
    try {
      await negotiateAgreement(negotiateAgreementItem.id, {
        proposed_rent: Number(negotiateForm.proposed_rent),
        advance_amount: negotiateForm.advance_amount === "" ? 0 : Number(negotiateForm.advance_amount),
        tenant_message: negotiateForm.tenant_message,
      });
      await loadData();
      closeNegotiateModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.detail || "Failed to send negotiation.");
    } finally {
      setActionLoadingId(null);
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
              <p className="muted">{pendingCount} pending · {agreements.filter((a) => agreementStatus(a) === "active").length} active · {agreements.length} total</p>
            </div>
            {role === "landlord" && (
              <button className="btn btn-primary" onClick={() => setModal(true)}>+ New Agreement</button>
            )}
          </div>

          {error ? <p className="error-text">⚠ {error}</p> : null}

          {/* Tabs + search */}
          <div className="flex gap-2 items-center mb-3" style={{ flexWrap: "wrap" }}>
            <div className="tabs">
              {["all","pending","active","rejected","expired"].map((t) => (
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
                          {role === "tenant" && ["pending", "rejected"].includes(agreementStatus(a)) && (
                            <button className="btn btn-outline btn-sm" onClick={() => openNegotiateModal(a)} disabled={actionLoadingId === a.id}>
                              Negotiate
                            </button>
                          )}
                          {role === "landlord" && agreementStatus(a) === "pending" && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAgreementAction(a.id, "approve")}
                                disabled={actionLoadingId === a.id}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAgreementAction(a.id, "reject")}
                                disabled={actionLoadingId === a.id}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Create modal */}
          {modal && role === "landlord" && (
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
                      ["Advance",    `₨ ${Number(detail.advance_amount || 0).toLocaleString()}`],
                      ["Proposed Rent", detail.proposed_rent ? `₨ ${Number(detail.proposed_rent).toLocaleString()}` : "—"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="form-label">{k}</div>
                        <div style={{ fontSize: "0.9rem", marginTop: "0.2rem", fontFamily: k === "Rent/mo" || k === "Deposit" ? "DM Mono, monospace" : "inherit" }}>
                          {k === "Status" ? statusBadge(agreementStatus(detail)) : v}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <div className="form-label">Tenant Message</div>
                    <div className="muted" style={{ whiteSpace: "pre-wrap" }}>{detail.tenant_message || "—"}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      setPdfError("");
                      setPdfLoading(true);
                      try {
                        const landlord = userById[detail?.landlord];
                        const tenant = userById[detail?.tenant];
                        const payload = {
                          landlord_name:
                            landlord?.full_name || landlord?.username || "Landlord",
                          landlord_cnic: landlord?.cnic || null,
                          landlord_contact: null,
                          tenant_name:
                            tenant?.full_name || tenant?.username || detail?.tenant_name || `Tenant ${detail?.tenant || "unknown"}`,
                          tenant_cnic: tenant?.cnic || null,
                          tenant_contact: null,
                          property_address: propertyNameById[detail.property] || `Property #${detail.property}`,
                          property_type: "Residential",
                          rent_amount: Number(detail.rent) || 0,
                          security_deposit: detail?.deposit ?? 0,
                          payment_due_day: detail?.payment_due_day || 1,
                          start_date: detail.start_date,
                          end_date: detail.end_date,
                          utilities_included: detail?.utilities || null,
                          special_conditions: detail?.notes || null,
                          witness_1_name: "",
                          witness_1_cnic: null,
                          witness_2_name: "",
                          witness_2_cnic: null,
                        };

                        const res = await exportAgreement(payload);
                        const blob = new Blob([res.data], { type: "application/pdf" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        const safeTenant = (payload?.tenant_name || "tenant").toString().replace(/[^a-z0-9_-]/gi, "_");
                        const filename = `agreement_${safeTenant}_${payload?.start_date || "agreement"}.pdf`;
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error(err);
                        setPdfError("Failed to download PDF.");
                      } finally {
                        setPdfLoading(false);
                      }
                    }}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? "Generating PDF..." : "Download PDF"}
                  </button>
                  {pdfError && <p className="error-text">⚠ {pdfError}</p>}
                </div>
              </div>
            </div>
          )}

          {negotiateModal && negotiateAgreementItem && (
            <div className="overlay" onClick={closeNegotiateModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Negotiate Agreement</h3>
                  <button className="modal-close" onClick={closeNegotiateModal}>✕</button>
                </div>
                <form className="form-stack" onSubmit={submitNegotiation}>
                  <div className="field-row">
                    <div className="form-group">
                      <label className="form-label">Proposed Rent (PKR)</label>
                      <input className="field" type="number" value={negotiateForm.proposed_rent} onChange={(e) => setNegotiateForm({ ...negotiateForm, proposed_rent: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Advance Amount (PKR)</label>
                      <input className="field" type="number" value={negotiateForm.advance_amount} onChange={(e) => setNegotiateForm({ ...negotiateForm, advance_amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="field" rows={3} value={negotiateForm.tenant_message} onChange={(e) => setNegotiateForm({ ...negotiateForm, tenant_message: e.target.value })} />
                  </div>
                  {error ? <p className="error-text">⚠ {error}</p> : null}
                  <div className="modal-footer">
                    <button className="btn btn-outline" type="button" onClick={closeNegotiateModal}>Cancel</button>
                    <button className="btn btn-primary" type="submit" disabled={actionLoadingId === negotiateAgreementItem.id}>{actionLoadingId === negotiateAgreementItem.id ? "Sending..." : "Send Counter Offer"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}