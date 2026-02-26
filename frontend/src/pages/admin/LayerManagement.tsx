import { useEffect, useState } from "react";
import { Plus, Upload, Trash2, X, Eye, EyeOff, FileArchive, FileJson } from "lucide-react";
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
      const res = await api.post(`/admin/layers/${target.id}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(res.data.message || "Upload berhasil!");
      setModal(null);
      setFile(null);
      fetchLayers();
    } catch (e: any) {
      const data = e.response?.data;
      alert(
        data?.detail
          ? `${data.message}\n\nDetail:\n${data.detail}`
          : data?.message ?? "Gagal upload."
      );
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

  const getFileInfo = () => {
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isZip = ext === "zip";
    return {
      ext,
      isZip,
      icon: isZip ? "📦" : "📄",
      label: isZip ? "GDB (ZIP)" : "GeoJSON",
      color: isZip ? "#7c3aed" : "#16a34a",
    };
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>🗺️ Manajemen Layer GIS</h1>
        <button
          className="btn-sm btn-blue"
          style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => {
            setForm({ pasar_id: "", name: "", type: "polygon", color: "#0057A8", opacity: "0.6", is_active: true });
            setModal("create");
          }}
        >
          <Plus size={14} /> Tambah Layer
        </button>
      </div>
      <div className="admin-content">
        {msg && (
          <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{msg}</span>
            <button onClick={() => setMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a" }}>✕</button>
          </div>
        )}

        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#dbeafe", borderRadius: 10, fontSize: 13, color: "#1d4ed8", border: "1px solid #93c5fd" }}>
          💡 <strong>Cara menggunakan:</strong> Tambah layer baru, lalu upload file <strong>.zip berisi folder .gdb</strong> (ArcGIS) atau file <strong>.geojson</strong>.
          Konversi GDB → GeoJSON dilakukan otomatis di server.
        </div>

        <div className="table-card">
          <div className="table-header"><h2>Daftar Layer ({layers.length})</h2></div>
          <table>
            <thead>
              <tr><th>Nama Layer</th><th>Pasar</th><th>Tipe</th><th>Warna</th><th>Status</th><th>GeoJSON</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {layers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>Belum ada layer. Klik "Tambah Layer" untuk mulai.</td></tr>
              ) : layers.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{pasars.find((p) => p.id === l.pasar_id)?.name}</td>
                  <td><span className="badge badge-empty">{l.type}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: l.color, border: "1px solid #e2e8f0" }} />
                      <span style={{ fontSize: 12 }}>{l.color}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${l.is_active ? "badge-active" : "badge-inactive"}`}>{l.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  <td><span style={{ fontSize: 12, color: l.geojson ? "#16a34a" : "#94a3b8" }}>{l.geojson ? "✅ Tersedia" : "⚠️ Belum diupload"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-sm btn-gray" title={l.is_active ? "Nonaktifkan" : "Aktifkan"} onClick={() => toggleActive(l)}>
                        {l.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button className="btn-sm btn-blue" title="Upload File GDB/GeoJSON" onClick={() => { setTarget(l); setFile(null); setModal("upload"); }}>
                        <Upload size={12} />
                      </button>
                      <button className="btn-sm btn-red" title="Hapus" onClick={() => handleDelete(l.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Pasar *</label>
                <select className="form-control" value={form.pasar_id} onChange={(e) => f("pasar_id", e.target.value)}>
                  <option value="">Pilih pasar...</option>
                  {pasars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Layer *</label>
                <input className="form-control" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="Contoh: Denah Kios Rejomulyo" />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tipe</label>
                  <select className="form-control" value={form.type} onChange={(e) => f("type", e.target.value)}>
                    <option value="polygon">Polygon</option>
                    <option value="point">Point</option>
                    <option value="line">Line</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Warna</label>
                  <input type="color" className="form-control" value={form.color} onChange={(e) => f("color", e.target.value)} style={{ height: 42, cursor: "pointer" }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Opacity ({form.opacity})</label>
                <input type="range" min="0" max="1" step="0.05" value={form.opacity} onChange={(e) => f("opacity", e.target.value)} style={{ width: "100%" }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-gray" style={{ padding: "8px 20px", borderRadius: 8 }} onClick={() => setModal(null)}>Batal</button>
              <button className="btn-sm btn-blue" style={{ padding: "8px 20px", borderRadius: 8 }} onClick={handleCreate} disabled={saving}>
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
              <h3>Upload Data GIS – {target.name}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Format info cards */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: "#f5f3ff", borderRadius: 8, border: "1px solid #ddd6fe", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <FileArchive size={14} color="#7c3aed" />
                    <strong style={{ color: "#7c3aed" }}>.zip (GDB)</strong>
                  </div>
                  <span style={{ color: "#6b7280" }}>Zip folder .gdb dari ArcGIS. Konversi otomatis ke GeoJSON di server.</span>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <FileJson size={14} color="#16a34a" />
                    <strong style={{ color: "#16a34a" }}>.geojson / .json</strong>
                  </div>
                  <span style={{ color: "#6b7280" }}>Upload langsung file GeoJSON yang sudah dikonversi.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih File</label>
                <input type="file" accept=".zip,.json,.geojson" className="form-control" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file && (() => {
                  const info = getFileInfo();
                  return (
                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: info?.isZip ? "#f5f3ff" : "#f0fdf4", border: `1px solid ${info?.isZip ? "#ddd6fe" : "#bbf7d0"}`, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{info?.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: info?.color }}>{file.name}</div>
                        <div style={{ color: "#6b7280" }}>
                          {(file.size / 1024).toFixed(1)} KB • {info?.label}
                          {info?.isZip && " — akan dikonversi otomatis ke GeoJSON"}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {saving && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 13, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {file?.name.endsWith(".zip")
                    ? "Mengekstrak dan mengkonversi GDB ke GeoJSON... Ini bisa memakan waktu."
                    : "Mengupload file..."}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-gray" style={{ padding: "8px 20px", borderRadius: 8 }} onClick={() => setModal(null)}>Batal</button>
              <button className="btn-sm btn-blue" style={{ padding: "8px 20px", borderRadius: 8 }} disabled={!file || saving} onClick={handleUpload}>
                {saving ? "Memproses..." : file?.name.endsWith(".zip") ? "Upload & Konversi GDB" : "Upload GeoJSON"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
