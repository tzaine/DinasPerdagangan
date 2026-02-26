import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { Store, TrendingUp, MapPin, Activity, Percent } from "lucide-react";
import api from "../lib/api";
import type { DashboardStats } from "../types";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/stats")
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Memuat data statistik...</p>
      </div>
    );
  }

  const s = stats?.summary;
  const cats = stats?.categories ?? [];
  const pasars = stats?.pasars ?? [];

  const occupancyData = {
    labels: ["Aktif", "Tidak Aktif", "Kosong"],
    datasets: [
      {
        data: [s?.active_kios ?? 0, s?.inactive_kios ?? 0, s?.empty_kios ?? 0],
        backgroundColor: ["#22c55e", "#ef4444", "#94a3b8"],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const categoryData = {
    labels: cats.map((c) =>
      c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
    ),
    datasets: [
      {
        label: "Jumlah Kios Aktif",
        data: cats.map((c) => c.count),
        backgroundColor: cats.map((c) => c.color + "cc"),
        borderColor: cats.map((c) => c.color),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const pasarData = {
    labels: pasars.map((p) => p.name),
    datasets: [
      {
        label: "Aktif",
        data: pasars.map((p) => p.active),
        backgroundColor: "#22c55e",
        borderRadius: 6,
        borderWidth: 0,
      },
      {
        label: "Tdk Aktif",
        data: pasars.map((p) => p.inactive),
        backgroundColor: "#ef4444",
        borderRadius: 6,
        borderWidth: 0,
      },
      {
        label: "Kosong",
        data: pasars.map((p) => p.empty),
        backgroundColor: "#94a3b8",
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="section">
      <div className="container">
        <div
          className="section-header"
          style={{ textAlign: "left", marginBottom: 32 }}
        >
          <span className="section-label">Statistik Real-time</span>
          <h1 className="section-title">Dashboard Publik</h1>
          <p className="section-subtitle" style={{ margin: 0 }}>
            Data persebaran dan occupancy kios di pasar-pasar Kota Semarang.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="stats-grid" style={{ marginBottom: 40 }}>
          {[
            {
              label: "Total Kios",
              value: s?.total_kios,
              icon: <Store size={24} color="#0057A8" />,
              bg: "rgba(0,87,168,0.1)",
              badge: `${s?.total_pasars} Pasar`,
              badgeBg: "#dbeafe",
              badgeColor: "#1d4ed8",
            },
            {
              label: "Kios Aktif",
              value: s?.active_kios,
              icon: <TrendingUp size={24} color="#22c55e" />,
              bg: "rgba(34,197,94,0.1)",
              badge: "Terisi",
              badgeBg: "#dcfce7",
              badgeColor: "#16a34a",
            },
            {
              label: "Tingkat Hunian",
              value: `${s?.occupancy_rate ?? 0}%`,
              icon: <Percent size={24} color="#f59e0b" />,
              bg: "rgba(245,158,11,0.1)",
              badge: "Occupancy",
              badgeBg: "#fef3c7",
              badgeColor: "#d97706",
            },
            {
              label: "Kios Kosong",
              value: s?.empty_kios,
              icon: <Activity size={24} color="#ef4444" />,
              bg: "rgba(239,68,68,0.1)",
              badge: "Tersedia",
              badgeBg: "#fee2e2",
              badgeColor: "#dc2626",
            },
          ].map((c, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <div className="stat-card-body">
                <h3>{c.value ?? "—"}</h3>
                <p>{c.label}</p>
                <span
                  className="stat-card-badge"
                  style={{ background: c.badgeBg, color: c.badgeColor }}
                >
                  {c.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="charts-grid" style={{ marginBottom: 32 }}>
          <div className="chart-card">
            <h3>🏪 Status Occupancy Kios</h3>
            <p>Distribusi status seluruh kios</p>
            <div style={{ maxWidth: 280, margin: "0 auto" }}>
              <Doughnut
                data={occupancyData}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 16,
                        font: { size: 12, family: "Inter" },
                      },
                    },
                  },
                  cutout: "65%",
                }}
              />
            </div>
          </div>
          <div className="chart-card">
            <h3>📊 Occupancy Per Pasar</h3>
            <p>Perbandingan status kios antar pasar</p>
            <Bar
              data={pasarData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { font: { size: 12, family: "Inter" } },
                  },
                },
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="chart-card" style={{ marginBottom: 32 }}>
          <h3>🗂️ Distribusi Kategori Kios Aktif</h3>
          <p>Jumlah kios aktif berdasarkan jenis komoditas</p>
          <Bar
            data={categoryData}
            options={{
              responsive: true,
              indexAxis: "y" as const,
              plugins: { legend: { display: false } },
              scales: { x: { beginAtZero: true } },
            }}
          />
        </div>

        {/* Pasar Detail Table */}
        <div className="table-card">
          <div className="table-header">
            <h2>📋 Ringkasan Per Pasar</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Pasar</th>
                <th>Total</th>
                <th>Aktif</th>
                <th>Tidak Aktif</th>
                <th>Kosong</th>
                <th>Hunian</th>
              </tr>
            </thead>
            <tbody>
              {pasars.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.total}</td>
                  <td>
                    <span className="badge badge-active">{p.active}</span>
                  </td>
                  <td>
                    <span className="badge badge-inactive">{p.inactive}</span>
                  </td>
                  <td>
                    <span className="badge badge-empty">{p.empty}</span>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "#e2e8f0",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${p.total > 0 ? Math.round((p.active / p.total) * 100) : 0}%`,
                            height: "100%",
                            background: "#22c55e",
                            borderRadius: 4,
                            transition: "width 0.5s",
                          }}
                        />
                      </div>
                      <span
                        style={{ fontSize: 12, color: "#64748b", minWidth: 36 }}
                      >
                        {p.total > 0
                          ? Math.round((p.active / p.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
