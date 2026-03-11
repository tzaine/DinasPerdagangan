import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Dinas Perdagangan Kota Semarang</h3>
            <p>
              Sistem Informasi Geografis Persebaran Pasar dan Kios Rejomulyo & Klitikan di Kota
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
                <a href="#">✉️ disdag@semarangkota.go.id</a>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Lokasi Kantor</h4>
            <div style={{ borderRadius: "8px", overflow: "hidden", marginTop: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <iframe
                src="https://maps.google.com/maps?q=Jl.%20Aloon-Aloon%20Bar.%20Selatan%20No.4a,%20Kauman,%20Semarang%20Tengah,%20Semarang%20City,%20Central%20Java%2050188,%20Indonesia&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="140"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Kantor Dinas Perdagangan"
              />
            </div>
            <p style={{ fontSize: "0.85rem", marginTop: "12px", lineHeight: 1.5, color: "var(--color-gray-400)" }}>
              Jl. Aloon-Aloon Bar. Selatan No.4a, Kauman, Semarang Tengah, Kota Semarang, Jawa Tengah 50188, Indonesia
            </p>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>
            © 2025 Dinas Perdagangan Kota Semarang. All rights reserved.
          </span>
          <span>SIPERTIK</span>
        </div>
      </div>
    </footer>
  );
}
