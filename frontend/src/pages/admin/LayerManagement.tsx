import { useEffect, useState } from "react";
import { Plus, Upload, Trash2, X, Eye, EyeOff } from "lucide-react";
import api from "../../lib/api";
import type { GisLayer, Pasar } from "../../types";

export default function LayerManagement() {
  const [layers, setLayers] = useState<GisLayer[]>([]);
  const [pasars, setPasars] = useState<Pasar[]>([]);
  const [modal, setModal] = useState<"create" | "upload" | null>(null);
  const [target, setTarget] = useState<GisLayer | null>(null);
  const [form, setForm] = useState({
    pasar_id: "",
    name: "",
    type: "polygon",
    color: "#0057A8",
    opacity: "0.6",
    is_active: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchLayers = () =>
    api.get<GisLayer[]>("/admin/layers").then((r) => setLayers(r.data));

  useEffect(() => {
    fetchLayers();
    api.get("/pasars").then((r) => setPasars(r.data));
  }, []);

  const toggleActive = async (layer: GisLayer) => {
    await api.put(`/admin/layers/${layer.id}`, { is_active: !layer.is_active });
    fetchLayers();
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/admin/layers", {
        ...form,
        opacity: parseFloat(form.opacity),
      });
      setModal(null);
      fetchLayers();
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Gagal menyimpan layer.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !target) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/admin/layers/${target.id}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("GeoJSON berhasil diupload!");
      setModal(null);
      setFile(null);
      fetchLayers();
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Gagal upload.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus layer ini?")) return;
    await api.delete(`/admin/layers/${id}`);
    fetchLayers();
  };

  const f = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div className="admin-topbar">
        <h1>🗺️ Manajemen Layer GIS</h1>
        <button
          className="btn-sm btn-blue"
          style={{
            padding: "8px 18px",
            borderRadius: 10,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => {
            setForm({
              pasar_id: "",
              name: "",
              type: "polygon",
              color: "#0057A8",
              opacity: "0.6",
              is_active: true,
            });
            setModal("create");
          }}
        >
          <Plus size={14} /> Tambah Layer
        </button>
      </div>
      <div className="admin-content">
        {msg && <div className="alert alert-success">{msg}</div>}

        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "#dbeafe",
            borderRadius: 10,
            fontSize: 13,
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
          }}
        >
          💡 <strong>Cara menggunakan:</strong> Tambah layer baru, lalu upload
          file GeoJSON dari tool konversi GDB. Layer aktif akan tampil di peta
          publik.
        </div>

        <div className="table-card">
          <div className="table-header">
            <h2>Daftar Layer ({layers.length})</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nama Layer</th>
                <th>Pasar</th>
                <th>Tipe</th>
                <th>Warna</th>
                <th>Status</th>
                <th>GeoJSON</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {layers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#94a3b8",
                    }}
                  >
                    Belum ada layer. Klik "Tambah Layer" untuk mulai.
                  </td>
                </tr>
              ) : (
                layers.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.name}</strong>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>
                      {pasars.find((p) => p.id === l.pasar_id)?.name}
                    </td>
                    <td>
                      <span className="badge badge-empty">{l.type}</span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: l.color,
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <span style={{ fontSize: 12 }}>{l.color}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${l.is_active ? "badge-active" : "badge-inactive"}`}
                      >
                        {l.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: l.geojson ? "#16a34a" : "#94a3b8",
                        }}
                      >
                        {l.geojson ? "✅ Tersedia" : "⚠️ Belum diupload"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-sm btn-gray"
                          title={l.is_active ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => toggleActive(l)}
                        >
                          {l.is_active ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                        <button
                          className="btn-sm btn-blue"
                          title="Upload GeoJSON"
                          onClick={() => {
                            setTarget(l);
                            setFile(null);
                            setModal("upload");
                          }}
                        >
                          <Upload size={12} />
                        </button>
                        <button
                          className="btn-sm btn-red"
                          title="Hapus"
                          onClick={() => handleDelete(l.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modal === "create" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Layer GIS</h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Pasar *</label>
                <select
                  className="form-control"
                  value={form.pasar_id}
                  onChange={(e) => f("pasar_id", e.target.value)}
                >
                  <option value="">Pilih pasar...</option>
                  {pasars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Layer *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => f("name", e.target.value)}
                  placeholder="Contoh: Denah Kios Rejomulyo"
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tipe</label>
                  <select
                    className="form-control"
                    value={form.type}
                    onChange={(e) => f("type", e.target.value)}
                  >
                    <option value="polygon">Polygon</option>
                    <option value="point">Point</option>
                    <option value="line">Line</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Warna</label>
                  <input
                    type="color"
                    className="form-control"
                    value={form.color}
                    onChange={(e) => f("color", e.target.value)}
                    style={{ height: 42, cursor: "pointer" }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Opacity ({form.opacity})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.opacity}
                  onChange={(e) => f("opacity", e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-sm btn-gray"
                style={{ padding: "8px 20px", borderRadius: 8 }}
                onClick={() => setModal(null)}
              >
                Batal
              </button>
              <button
                className="btn-sm btn-blue"
                style={{ padding: "8px 20px", borderRadius: 8 }}
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Buat Layer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {modal === "upload" && target && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload GeoJSON – {target.name}</h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div
                className="alert alert-info"
                style={{ marginBottom: 16, fontSize: 13 }}
              >
                Upload file <strong>.geojson</strong> atau{" "}
                <strong>.json</strong> hasil konversi dari GDB menggunakan tool
                konversi Python.
              </div>
              <div className="form-group">
                <label className="form-label">Pilih File GeoJSON</label>
                <input
                  type="file"
                  accept=".json,.geojson"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p style={{ marginTop: 6, fontSize: 12, color: "#16a34a" }}>
                    ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-sm btn-gray"
                style={{ padding: "8px 20px", borderRadius: 8 }}
                onClick={() => setModal(null)}
              >
                Batal
              </button>
              <button
                className="btn-sm btn-blue"
                style={{ padding: "8px 20px", borderRadius: 8 }}
                disabled={!file || saving}
                onClick={handleUpload}
              >
                {saving ? "Mengupload..." : "Upload GeoJSON"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
