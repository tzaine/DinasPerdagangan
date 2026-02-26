import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, Mail } from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@dinsemarang.go.id");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.token, res.data.user);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.email?.[0] ??
          "Login gagal. Periksa email dan password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Building2 size={28} />
          </div>
          <h1>Portal Admin</h1>
          <p>Dinas Perdagangan Kota Semarang</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 36 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dinsemarang.go.id"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: 36 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-accent"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 20,
          }}
        >
          Demo: admin@dinsemarang.go.id / password
        </p>
      </div>
    </div>
  );
}
