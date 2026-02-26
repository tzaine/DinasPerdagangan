import { Link, NavLink } from "react-router-dom";
import {
  MapPin,
  LayoutDashboard,
  Map,
  Settings,
  Building2,
} from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-logo">
            <Building2 size={20} />
          </div>
          <span>GIS Dindag Semarang</span>
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
        <Link to="/admin/login" className="navbar-btn">
          <Settings size={14} style={{ display: "inline", marginRight: 6 }} />
          Admin
        </Link>
      </div>
    </nav>
  );
}
