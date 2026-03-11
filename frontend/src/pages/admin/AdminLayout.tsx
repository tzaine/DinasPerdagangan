import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Layers,
  LogOut,
  Map,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import ThemeToggle from "../../components/ThemeToggle";

export default function AdminLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/admin/login", { replace: true });
    return null;
  }

  const handleLogout = async () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src="/image/lambang_kota_semarang.png"
                alt="Lambang Kota Semarang"
                style={{ width: 36, height: 36, objectFit: "contain" }}
              />
            </div>
            <div>
              <h2>Admin Panel</h2>
              <p>Disdag Semarang</p>
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "var(--bg-page)",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              Login sebagai
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
              {user?.name}
            </p>
            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <p className="admin-nav-section">Menu Utama</p>
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `admin-nav-link${isActive ? " active" : ""}`
            }
          >
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink
            to="/admin/kios"
            className={({ isActive }) =>
              `admin-nav-link${isActive ? " active" : ""}`
            }
          >
            <Store size={16} /> Manajemen Kios
          </NavLink>
          <NavLink
            to="/admin/layers"
            className={({ isActive }) =>
              `admin-nav-link${isActive ? " active" : ""}`
            }
          >
            <Layers size={16} /> Layer GIS
          </NavLink>
          <p className="admin-nav-section" style={{ marginTop: 12 }}>
            Publik
          </p>
          <a href="/" className="admin-nav-link" target="_blank">
            <Map size={16} /> Buka Peta Publik
          </a>
        </nav>
        <div
          style={{ padding: 16, borderTop: "1px solid var(--border-color)" }}
        >
        </div>
      </aside>
      <div className="admin-main">
        <header
          style={{
            padding: 16,
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(239,68,68,0.1)",
                color: "var(--color-danger, #ef4444)",
              }}
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
