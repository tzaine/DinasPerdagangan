import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../lib/api";
import type { Pasar } from "../types";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createCustomIcon(emoji: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 42px; height: 42px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: 18px; line-height: 1;">${emoji}</span>
    </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -48],
  });
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1.5 });
  }, [lat, lng]);
  return null;
}

interface GeoJsonFC {
  type: string;
  features: {
    type: string;
    geometry: { type: string; coordinates: number[][] };
    properties: Record<string, string>;
  }[];
}

export default function MapPage() {
  const [pasars, setPasars] = useState<Pasar[]>([]);
  const [selected, setSelected] = useState<Pasar | null>(null);
  const [geojson, setGeojson] = useState<Record<number, GeoJsonFC>>({});
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    api.get("/pasars").then((r) => {
      setPasars(r.data);
      r.data.forEach((p: Pasar) => {
        api
          .get(`/pasars/${p.id}/geojson`)
          .then((gr) => {
            setGeojson((prev) => ({ ...prev, [p.id]: gr.data }));
          })
          .catch(() => {});
      });
    });
  }, []);

  const PASAR_CONFIG: Record<string, { emoji: string; color: string }> = {
    rejomulyo: { emoji: "🐟", color: "#0057A8" },
    klitikan: { emoji: "🛒", color: "#7c3aed" },
  };

  const getStyle = (feature: any) => {
    const color = feature?.properties?.color ?? "#0057A8";
    const status = feature?.properties?.status;
    const opacity =
      status === "empty" ? 0.25 : status === "inactive" ? 0.5 : 0.75;
    return {
      fillColor: color,
      color: "#fff",
      weight: 1.5,
      fillOpacity: opacity,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const p = feature.properties;
      layer.bindPopup(`
        <div style="min-width:180px; font-family: Inter, sans-serif;">
          <div style="font-weight:700; font-size:14px; color:#0057A8; margin-bottom:6px;">
            Kios ${p.nomor}
          </div>
          ${p.nama_pedagang ? `<p style="margin:2px 0;font-size:13px;"><b>Pedagang:</b> ${p.nama_pedagang}</p>` : ""}
          ${p.komoditas ? `<p style="margin:2px 0;font-size:13px;"><b>Komoditas:</b> ${p.komoditas}</p>` : ""}
          ${p.category ? `<p style="margin:2px 0;font-size:13px;"><b>Kategori:</b> ${p.category}</p>` : ""}
          <span style="
            display:inline-block; margin-top:6px; padding:2px 10px;
            border-radius:999px; font-size:11px; font-weight:600;
            background:${p.status === "active" ? "#dcfce7" : p.status === "inactive" ? "#fee2e2" : "#f1f5f9"};
            color:${p.status === "active" ? "#16a34a" : p.status === "inactive" ? "#dc2626" : "#64748b"};
          ">${p.status === "active" ? "Aktif" : p.status === "inactive" ? "Tidak Aktif" : "Kosong"}</span>
        </div>
      `);
    }
  };

  return (
    <div>
      {/* Map Controls */}
      <div
        style={{
          background: "var(--color-white)",
          borderBottom: "1px solid var(--color-gray-200)",
          padding: "16px 24px",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-gray-900)",
            }}
          >
            🗺️ Peta Interaktif Pasar
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pasars.map((p) => {
              const cfg = PASAR_CONFIG[p.slug] ?? {
                emoji: "🏪",
                color: "#0057A8",
              };
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setFlyTarget({ lat: p.latitude, lng: p.longitude });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background:
                      selected?.id === p.id
                        ? cfg.color
                        : "var(--color-gray-100)",
                    color:
                      selected?.id === p.id ? "white" : "var(--color-gray-700)",
                    transition: "all 0.2s",
                  }}
                >
                  {cfg.emoji} {p.name}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              fontSize: 12,
              color: "var(--color-gray-500)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />{" "}
              Aktif
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: "#ef4444",
                  display: "inline-block",
                }}
              />{" "}
              Tidak Aktif
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: "#94a3b8",
                  display: "inline-block",
                }}
              />{" "}
              Kosong
            </span>
          </div>
        </div>
      </div>

      <div className="map-section" style={{ padding: "24px 24px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="map-container">
            <MapContainer
              center={[-6.9728, 110.415]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}

              {/* Market Markers */}
              {pasars.map((p) => {
                const cfg = PASAR_CONFIG[p.slug] ?? {
                  emoji: "🏪",
                  color: "#0057A8",
                };
                return (
                  <Marker
                    key={p.id}
                    position={[p.latitude, p.longitude]}
                    icon={createCustomIcon(cfg.emoji, cfg.color)}
                  >
                    <Popup>
                      <div
                        style={{
                          minWidth: 200,
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: cfg.color,
                            marginBottom: 6,
                          }}
                        >
                          {cfg.emoji} {p.name}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginBottom: 8,
                          }}
                        >
                          {p.description}
                        </p>
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          📍 {p.address}
                        </p>
                        <p style={{ fontSize: 12, margin: "2px 0" }}>
                          🏪 {p.kios_count} Kios
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* GeoJSON Kiosk Layers */}
              {pasars.map(
                (p) =>
                  geojson[p.id] && (
                    <GeoJSON
                      key={`gj-${p.id}`}
                      data={geojson[p.id] as any}
                      style={getStyle}
                      onEachFeature={onEachFeature}
                    />
                  ),
              )}
            </MapContainer>
          </div>
          <p
            style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            Klik marker pasar untuk terbang ke lokasi. Klik poligon kios untuk
            detail pedagang.
          </p>
        </div>
      </div>
    </div>
  );
}
