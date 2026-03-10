import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import {
  MapPin,
  LayoutDashboard,
  Map,
  Settings,
} from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-logo" style={{ background: "transparent", width: 44, height: 44 }}>
            <img 
              src="/image/lambang_kota_semarang.png" 
              alt="Logo Pemkot Semarang" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          </div>
          <span>Sistem Informasi Pemetaan Rejomulyo & Klitikan</span>
        </Link>
        <ul className="navbar-nav">
          <li>
            <NavLink to="/">Beranda</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/peta">Peta Interaktif</NavLink>
          </li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle />
          <Link to="/admin/login" className="navbar-btn">
            <Settings size={14} style={{ display: "inline", marginRight: 6 }} />
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
