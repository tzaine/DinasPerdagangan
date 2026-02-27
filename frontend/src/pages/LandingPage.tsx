import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Store,
  TrendingUp,
  Users,
  ChevronRight,
  Activity,
} from "lucide-react";
import api from "../lib/api";
import type { DashboardStats, Pasar } from "../types";

export default function LandingPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pasars, setPasars] = useState<Pasar[]>([]);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
    api
      .get("/pasars")
      .then((r) => setPasars(r.data))
      .catch(() => {});
  }, []);

  const summary = stats?.summary;

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Activity size={12} />
              Sistem Informasi Geografis Pasar
            </div>
            <h1>
              Peta Sebaran Pasar
              <br />
              <span>Kota Semarang</span>
            </h1>
            <p>
              Platform digital pengelolaan data pasar dan kios Dinas Perdagangan
              Kota Semarang. Pantau occupancy, distribusi pedagang, dan sebaran
              geografis secara real-time.
            </p>
            <div className="hero-actions">
              <Link to="/peta" className="btn btn-primary">
                <MapPin size={16} />
                Lihat Peta Interaktif
              </Link>
              <Link to="/dashboard" className="btn btn-outline">
                <TrendingUp size={16} />
                Dashboard Statistik
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pasar Cards */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Kawasan Pasar</span>
            <h2 className="section-title">Pasar yang Dikelola</h2>
            <p className="section-subtitle">
              Data real-time persebaran kios di pasar-pasar yang dikelola Dinas
              Perdagangan Kota Semarang.
            </p>
          </div>
          <div className="pasar-grid">
            {pasars.map((p) => (
              <div key={p.id} className="pasar-card">
                <div
                  className="pasar-card-header"
                  style={{
                    background:
                      p.slug === "rejomulyo"
                        ? "linear-gradient(135deg, #0057A8, #003f7a)"
                        : "linear-gradient(135deg, #005BAC, #7c3aed)",
                  }}
                >
                  <span
                    style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
                  >
                    {p.slug === "rejomulyo" ? "🐟" : "🛒"}
                  </span>
                </div>
                <div className="pasar-card-body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="pasar-meta">
                    <span className="pasar-badge">
                      <MapPin size={11} /> {p.address?.split(",")[0]}
                    </span>
                    <span className="pasar-badge">
                      <Store size={11} /> {p.kios_count} Kios
                    </span>
                  </div>
                  <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                    <Link
                      to="/peta"
                      className="btn-sm btn-blue"
                      style={{
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                      }}
                    >
                      Lihat di Peta
                    </Link>
                    <Link
                      to="/dashboard"
                      className="btn-sm btn-gray"
                      style={{
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                      }}
                    >
                      Statistik
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ background: "var(--color-white)" }}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "#eef2ff", color: "#1e3a8a" }} /* Indigo light */
              >
                <Store size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.total_kios ?? "—"}</h3>
                <p>Total Kios</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#fef3c7", color: "#b45309" }} /* Amber light */
                >
                  {summary?.total_pasars ?? 0} Pasar
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "#ecfdf5", color: "#059669" }} /* Emerald light */
              >
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.active_kios ?? "—"}</h3>
                <p>Kios Aktif</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#dcfce7", color: "#15803d" }} /* Green light */
                >
                  {summary?.occupancy_rate ?? 0}% Terisi
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "#fef2f2", color: "#dc2626" }} /* Red light */
              >
                <Activity size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.inactive_kios ?? "—"}</h3>
                <p>Kios Tidak Aktif</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  Non-aktif
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "#fff7ed", color: "#ea580c" }} /* Orange light */
              >
                <MapPin size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.empty_kios ?? "—"}</h3>
                <p>Kios Kosong</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#fef3c7", color: "#b45309" }}
                >
                  Tersedia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section"
        style={{ background: "var(--color-primary)", color: "white" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>
            Kelola Data Kios dengan Mudah
          </h2>
          <p style={{ opacity: 0.8, marginBottom: 24, fontSize: "1.1rem" }}>
            Login sebagai admin untuk mengakses fitur CRUD kios, upload GeoJSON
            layer, dan monitor statistik.
          </p>
          <Link
            to="/admin/login"
            className="btn btn-primary"
            style={{ display: "inline-flex" }}
          >
            Masuk ke Portal Admin
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
