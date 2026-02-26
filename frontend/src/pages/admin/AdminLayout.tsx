import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Layers,
  LogOut,
  Building2,
  Map,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

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
                width: 32,
                height: 32,
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <h2>Admin Panel</h2>
              <p>Dindag Semarang</p>
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 2,
              }}
            >
              Login sebagai
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
              {user?.name}
            </p>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
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
          style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <button
            onClick={handleLogout}
            className="admin-nav-link"
            style={{
              width: "100%",
              cursor: "pointer",
              background: "none",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
            }}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
