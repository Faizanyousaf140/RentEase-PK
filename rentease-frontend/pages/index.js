import Link from "next/link";

const features = [
  {
    icon: "🔐",
    title: "Role-Based Access",
    desc: "Separate landlord & tenant dashboards with JWT-protected routes.",
  },
  {
    icon: "📄",
    title: "Digital Agreements",
    desc: "Create rent contracts and export professional PDFs instantly.",
  },
  {
    icon: "💰",
    title: "Payment Tracking",
    desc: "Log monthly rent, mark status, and maintain a full audit trail.",
  },
  {
    icon: "📢",
    title: "Notice Board",
    desc: "Send eviction, maintenance, or general notices with timestamps.",
  },
];

export default function Home() {
  return (
    <div className="landing-hero">
      {/* LEFT — dark green panel */}
      <div className="hero-left">
        <p className="hero-tagline">Pakistan's rental management platform</p>

        <h1 className="hero-title">
          Smart Renting,<br />
          <em>Better Living.</em>
        </h1>

        <p className="hero-desc">
          Stop managing properties on WhatsApp. RentEase gives landlords and
          tenants one secure platform for agreements, payments, and notices.
        </p>

        <div className="hero-cta">
          <Link href="/register" className="btn btn-white">
            Get Started Free
          </Link>
          <Link href="/login" className="btn btn-ghost-white">
            Sign In →
          </Link>
        </div>

        <div className="hero-stats">
          <div>
            <div className="stat-val">100%</div>
            <div className="stat-lbl">Digital</div>
          </div>
          <div>
            <div className="stat-val">2</div>
            <div className="stat-lbl">Roles Supported</div>
          </div>
          <div>
            <div className="stat-val">PDF</div>
            <div className="stat-lbl">Agreement Export</div>
          </div>
        </div>
      </div>

      {/* RIGHT — white features panel */}
      <div className="hero-right">
        <div>
          <h2 className="features-title">Everything you need</h2>
          <p className="muted text-sm" style={{ marginBottom: 24 }}>
            Built for the Pakistani rental market — where paperwork is broken
            and disputes happen daily.
          </p>
        </div>

        {features.map((f) => (
          <div key={f.title} className="feature-item">
            <div className="feature-icon">{f.icon}</div>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: "16px 18px", background: "var(--green-100)", borderRadius: 12, fontSize: "0.88rem", color: "var(--muted)" }}>
          🇵🇰 Made for Pakistan — Urdu-ready, no jargon, no complexity.
        </div>
      </div>
    </div>
  );
}