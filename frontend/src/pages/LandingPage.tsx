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
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function LandingPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pasars, setPasars] = useState<Pasar[]>([]);
  const revealRef = useScrollReveal();

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => { });
    api
      .get("/pasars")
      .then((r) => setPasars(r.data))
      .catch(() => { });
  }, []);

  const summary = stats?.summary;

  return (
    <div ref={revealRef}>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge reveal">
              <Activity size={12} />
              Sistem Informasi Geografis Kios Pasar
            </div>
            <h1 className="reveal" style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}>
              Peta Sebaran Kios Pasar
              <br />
              <span>Rejomulyo & Klitikan Kota Semarang</span>
            </h1>
            <p className="reveal" style={{ "--reveal-delay": "0.2s" } as React.CSSProperties}>
              Platform digital pengelolaan data pasar dan kios Dinas Perdagangan
              Kota Semarang. Pantau occupancy, distribusi pedagang, dan sebaran
              geografis secara real-time.
            </p>
            <div className="hero-actions reveal" style={{ "--reveal-delay": "0.3s" } as React.CSSProperties}>
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
          <div className="section-header reveal">
            <span className="section-label">Kawasan Pasar</span>
            <h2 className="section-title">Pasar yang Dikelola</h2>
            <p className="section-subtitle">
              Data real-time persebaran kios di pasar-pasar yang dikelola Dinas
              Perdagangan Kota Semarang.
            </p>
          </div>
          <div className="pasar-grid">
            {pasars.map((p, i) => (
              <div
                key={p.id}
                className="pasar-card reveal"
                style={{ "--reveal-delay": `${i * 0.15}s` } as React.CSSProperties}
              >
                <div
                  className="pasar-card-header"
                  style={{
                    background:
                      p.slug === "rejomulyo"
                        ? "linear-gradient(135deg, #7B1113, #5A0C0E)"
                        : "linear-gradient(135deg, #8B1A1C, #D4A843)",
                  }}
                >
                  <span
                    style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
                  >
                    {p.slug === "rejomulyo" ? "🐟" : "🍊"}
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
            <div className="stat-card reveal">
              <div
                className="stat-card-icon"
                style={{ background: "#fdf2f2", color: "#7B1113" }}
              >
                <Store size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.total_kios ?? "—"}</h3>
                <p>Total Kios</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#fefbf0", color: "#B8912E" }}
                >
                  {summary?.total_pasars ?? 0} Pasar
                </span>
              </div>
            </div>
            <div className="stat-card reveal" style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}>
              <div
                className="stat-card-icon"
                style={{ background: "#ecfdf5", color: "#059669" }}
              >
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.active_kios ?? "—"}</h3>
                <p>Kios Aktif</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  {summary?.occupancy_rate ?? 0}% Terisi
                </span>
              </div>
            </div>
            <div className="stat-card reveal" style={{ "--reveal-delay": "0.2s" } as React.CSSProperties}>
              <div
                className="stat-card-icon"
                style={{ background: "#fdf2f2", color: "#7B1113" }}
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
            <div className="stat-card reveal" style={{ "--reveal-delay": "0.3s" } as React.CSSProperties}>
              <div
                className="stat-card-icon"
                style={{ background: "#fefbf0", color: "#D4A843" }}
              >
                <MapPin size={22} strokeWidth={2.5} />
              </div>
              <div className="stat-card-body">
                <h3>{summary?.empty_kios ?? "—"}</h3>
                <p>Kios Kosong</p>
                <span
                  className="stat-card-badge"
                  style={{ background: "#fefbf0", color: "#B8912E" }}
                >
                  Tersedia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
