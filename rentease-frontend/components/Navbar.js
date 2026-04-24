import { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";

const NAV = [
  { href: "/dashboard",             icon: "⬛", label: "Overview" },
  { href: "/dashboard/properties",  icon: "🏠", label: "Properties" },
  { href: "/dashboard/agreements",  icon: "📄", label: "Agreements" },
  { href: "/dashboard/payments",    icon: "💳", label: "Payments" },
  { href: "/dashboard/notices",     icon: "🔔", label: "Notices" },
];

export default function Sidebar() {
  const { username, role, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">RentEase</div>
        <div className="sidebar-brand-sub">Property Management</div>
      </div>

      <nav className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {NAV.map((item) => {
          const exact = item.href === "/dashboard";
          const active = exact
            ? router.pathname === "/dashboard"
            : router.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{username || "User"}</div>
            <div className="sidebar-user-role">{role || "—"}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost w-full"
          style={{ justifyContent: "flex-start", marginTop: "0.35rem", gap: "0.6rem" }}
          onClick={handleLogout}
        >
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  );
}

/* Slim top navbar — kept for compatibility if imported as "Navbar" */
export function Navbar() {
  return <Sidebar />;
}