import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import api from "../../lib/api";
import type { Kios, KiosCategory, Pasar, PaginatedResponse } from "../../types";

const EMPTY_FORM = {
  pasar_id: "",
  category_id: "",
  nomor: "",
  nama_pedagang: "",
  komoditas: "",
  status: "empty",
  luas: "",
  keterangan: "",
};

export default function KiosManagement() {
  const [kiosList, setKiosList] = useState<Kios[]>([]);
  const [pasars, setPasars] = useState<Pasar[]>([]);
  const [cats, setCats] = useState<KiosCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPasar, setFilterPasar] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchKios = useCallback(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<Kios>>("/admin/kios", {
        params: {
          page,
          search,
          status: filterStatus,
          pasar_id: filterPasar,
          per_page: 15,
        },
      })
      .then((r) => {
        setKiosList(r.data.data);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, filterStatus, filterPasar]);

  useEffect(() => {
    fetchKios();
  }, [fetchKios]);
  useEffect(() => {
    api.get("/pasars").then((r) => setPasars(r.data));
    api
      .get("/admin/kios?per_page=1")
      .then(() => {})
      .catch(() => {});
    // Fetch categories via kios list
    api
      .get<PaginatedResponse<Kios>>("/admin/kios", { params: { per_page: 1 } })
      .then(() => {})
      .catch(() => {});
    // inline fetch categories
    fetch("http://localhost:8000/api/admin/kios?with_categories=1", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
      },
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setModal("create");
  };
  const openEdit = (k: Kios) => {
    setForm({
      pasar_id: String(k.pasar_id),
      category_id: String(k.category_id ?? ""),
      nomor: k.nomor,
      nama_pedagang: k.nama_pedagang ?? "",
      komoditas: k.komoditas ?? "",
      status: k.status,
      luas: String(k.luas ?? ""),
      keterangan: k.keterangan ?? "",
    });
    setEditId(k.id);
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        luas: form.luas ? parseFloat(form.luas) : null,
        category_id: form.category_id || null,
      };
      if (modal === "create") await api.post("/admin/kios", payload);
      else await api.put(`/admin/kios/${editId}`, payload);
      setModal(null);
      fetchKios();
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus kios ini?")) return;
    await api.delete(`/admin/kios/${id}`);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    fetchKios();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedIds.size} kios yang dipilih?`)) return;
    setBulkDeleting(true);
    try {
      await api.post("/admin/kios/bulk-delete", { ids: Array.from(selectedIds) });
      setSelectedIds(new Set());
      fetchKios();
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Gagal menghapus.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === kiosList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(kiosList.map((k) => k.id)));
    }
  };

  const allSelected = kiosList.length > 0 && selectedIds.size === kiosList.length;

  const f = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div className="admin-topbar">
        <h1>🏪 Manajemen Kios</h1>
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
          onClick={openCreate}
        >
          <Plus size={14} /> Tambah Kios
        </button>
      </div>
      <div className="admin-content">
        <div className="table-card">
          <div className="table-header">
            <h2>Daftar Kios ({total})</h2>
            <div className="table-controls">
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  className="search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Cari nomor, pedagang..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <select
                className="select-input"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="empty">Kosong</option>
              </select>
              <select
                className="select-input"
                value={filterPasar}
                onChange={(e) => {
                  setFilterPasar(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Pasar</option>
                {pasars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div style={{
              padding: "10px 24px", display: "flex", alignItems: "center",
              gap: 12, background: "#eff6ff", borderBottom: "1px solid #bfdbfe",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
                ✅ {selectedIds.size} kios dipilih
              </span>
              <button
                className="btn-sm btn-red"
                style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <Trash2 size={12} /> {bulkDeleting ? "Menghapus..." : "Hapus yang dipilih"}
              </button>
              <button
                className="btn-sm btn-gray"
                style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12 }}
                onClick={() => setSelectedIds(new Set())}
              >
                Batal pilih
              </button>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", accentColor: "#0057A8" }}
                    title="Pilih semua"
                  />
                </th>
                <th>No. Kios</th>
                <th>Pasar</th>
                <th>Pedagang</th>
                <th>Komoditas</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#94a3b8",
                    }}
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : kiosList.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#94a3b8",
                    }}
                  >
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                kiosList.map((k) => (
                  <tr key={k.id} style={{
                    background: selectedIds.has(k.id) ? "#eff6ff" : undefined,
                  }}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(k.id)}
                        onChange={() => toggleSelect(k.id)}
                        style={{ cursor: "pointer", accentColor: "#0057A8" }}
                      />
                    </td>
                    <td>
                      <strong>{k.nomor}</strong>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>
                      {k.pasar?.name}
                    </td>
                    <td>
                      {k.nama_pedagang || (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td>
                      {k.komoditas || (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td>
                      {k.category ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: k.category.color_hex,
                              display: "inline-block",
                            }}
                          />
                          {k.category.name}
                        </span>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${k.status}`}>
                        {k.status === "active"
                          ? "Aktif"
                          : k.status === "inactive"
                            ? "Tdk Aktif"
                            : "Kosong"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-sm btn-blue"
                          onClick={() => openEdit(k)}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-sm btn-red"
                          onClick={() => handleDelete(k.id)}
                          title="Hapus"
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
          {/* Pagination */}
          <div
            style={{
              padding: "12px 24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              className="btn-sm btn-gray"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span
              style={{ padding: "6px 12px", fontSize: 13, color: "#64748b" }}
            >
              Hal. {page}
            </span>
            <button
              className="btn-sm btn-gray"
              disabled={kiosList.length < 15}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modal === "create" ? "Tambah Kios Baru" : "Edit Data Kios"}
              </h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  color: "#94a3b8",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Pasar *</label>
                  <select
                    className="form-control"
                    value={form.pasar_id}
                    onChange={(e) => f("pasar_id", e.target.value)}
                    required
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
                  <label className="form-label">Nomor Kios *</label>
                  <input
                    className="form-control"
                    value={form.nomor}
                    onChange={(e) => f("nomor", e.target.value)}
                    placeholder="A-01"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Pedagang</label>
                <input
                  className="form-control"
                  value={form.nama_pedagang}
                  onChange={(e) => f("nama_pedagang", e.target.value)}
                  placeholder="Nama pedagang..."
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Komoditas</label>
                  <input
                    className="form-control"
                    value={form.komoditas}
                    onChange={(e) => f("komoditas", e.target.value)}
                    placeholder="Ikan segar, sayur, dll."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Luas (m²)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.luas}
                    onChange={(e) => f("luas", e.target.value)}
                    placeholder="12.5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={(e) => f("status", e.target.value)}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="empty">Kosong</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.keterangan}
                  onChange={(e) => f("keterangan", e.target.value)}
                  placeholder="Catatan tambahan..."
                  style={{ resize: "vertical" }}
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
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : modal === "create"
                    ? "Simpan"
                    : "Perbarui"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
