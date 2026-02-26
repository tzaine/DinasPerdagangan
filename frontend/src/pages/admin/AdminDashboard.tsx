import { useEffect, useState } from "react";
import { Store, TrendingUp, Activity, Percent } from "lucide-react";
import api from "../../lib/api";
import type { DashboardStats } from "../../types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats").then((r) => setStats(r.data));
  }, []);

  const s = stats?.summary;

  return (
    <>
      <div className="admin-topbar">
        <h1>📊 Dashboard Admin</h1>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          Ringkasan Data Real-time
        </span>
      </div>
      <div className="admin-content">
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            {
              label: "Total Kios",
              value: s?.total_kios,
              icon: <Store size={22} color="#0057A8" />,
              bg: "rgba(0,87,168,0.1)",
            },
            {
              label: "Kios Aktif",
              value: s?.active_kios,
              icon: <TrendingUp size={22} color="#22c55e" />,
              bg: "rgba(34,197,94,0.1)",
            },
            {
              label: "Tingkat Hunian",
              value: `${s?.occupancy_rate ?? 0}%`,
              icon: <Percent size={22} color="#f59e0b" />,
              bg: "rgba(245,158,11,0.1)",
            },
            {
              label: "Kios Kosong",
              value: s?.empty_kios,
              icon: <Activity size={22} color="#ef4444" />,
              bg: "rgba(239,68,68,0.1)",
            },
          ].map((c, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <div className="stat-card-body">
                <h3>{c.value ?? "—"}</h3>
                <p>{c.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="table-card">
          <div className="table-header">
            <h2>📋 Status Per Pasar</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Pasar</th>
                <th>Total</th>
                <th>Aktif</th>
                <th>Tdk Aktif</th>
                <th>Kosong</th>
                <th>Hunian</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.pasars ?? []).map((p) => (
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
                    {p.total > 0 ? Math.round((p.active / p.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
