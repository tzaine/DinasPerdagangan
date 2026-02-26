import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🏛️ Dinas Perdagangan Kota Semarang</h3>
            <p>
              Sistem Informasi Geografis Persebaran Pasar dan Kios di Kota
              Semarang. Mewujudkan pengelolaan pasar yang modern, transparan,
              dan berbasis data.
            </p>
          </div>
          <div className="footer-links">
            <h4>Tautan</h4>
            <ul>
              <li>
                <Link to="/">Beranda</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard Publik</Link>
              </li>
              <li>
                <Link to="/peta">Peta Interaktif</Link>
              </li>
              <li>
                <Link to="/admin/login">Portal Admin</Link>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Kontak</h4>
            <ul>
              <li>
                <a href="#">📍 Kota Semarang, Jawa Tengah</a>
              </li>
              <li>
                <a href="#">📞 (024) 8311111</a>
              </li>
              <li>
                <a href="#">✉️ dindag@semarangkota.go.id</a>
              </li>
            </ul>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>
            © 2025 Dinas Perdagangan Kota Semarang. All rights reserved.
          </span>
          <span>GIS Peta Sebaran v1.0</span>
        </div>
      </div>
    </footer>
  );
}
