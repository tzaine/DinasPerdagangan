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

// Auto-fit map bounds to GIS layer data
function FitToGisLayers({ layers }: { layers: GisLayerData[] }) {
  const map = useMap();
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    if (fitted || layers.length === 0) return;

    try {
      const allCoords: [number, number][] = [];
      layers.forEach(l => {
        if (!l.geojson?.features) return;
        const extractCoords = (coords: any) => {
          if (!Array.isArray(coords)) return;
          if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            allCoords.push([coords[1], coords[0]]); // GeoJSON is [lng, lat], Leaflet is [lat, lng]
            return;
          }
          coords.forEach(extractCoords);
        };
        l.geojson.features.forEach((f: any) => {
          if (f.geometry?.coordinates) extractCoords(f.geometry.coordinates);
        });
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        setFitted(true);
        console.log("[MapPage] Fitted map to GIS layers bounds:", bounds.toBBoxString());
      }
    } catch (e) {
      console.error("[MapPage] Error fitting bounds:", e);
    }
  }, [layers, fitted, map]);

  return null;
}

interface GeoJsonFC {
  type: string;
  features: {
    type: string;
    geometry: { type: string; coordinates: any };
    properties: Record<string, any>;
  }[];
}


interface GisLayerData {
  id: number;
  name: string;
  type: string;
  color: string;
  opacity: number;
  pasar_id: number;
  geojson: GeoJsonFC | null;
}

const BASEMAPS = {
  satellite: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 21,
    label: "🛰️ Satelit",
  },
  hybrid: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 21,
    label: "🌍 Hybrid",
  },
  street: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 21,
    label: "🗺️ Street",
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

export default function MapPage() {
  const [pasars, setPasars] = useState<Pasar[]>([]);
  const [selected, setSelected] = useState<Pasar | null>(null);
  const [geojson, setGeojson] = useState<Record<number, GeoJsonFC>>({});
  const [gisLayers, setGisLayers] = useState<GisLayerData[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<number>>(new Set());
  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    // Fetch pasars and their kiosk GeoJSON
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

    // Fetch active GIS layers uploaded from admin
    api.get("/layers").then((r) => {
      console.log("[MapPage] GIS layers loaded:", r.data.length, "layers");
      r.data.forEach((l: GisLayerData) => {
        console.log(`  Layer ${l.id}: ${l.name}, has geojson: ${!!l.geojson}, features: ${l.geojson?.features?.length ?? 0}`);
        if (l.geojson?.features?.[0]?.geometry?.coordinates) {
          const c = l.geojson.features[0].geometry.coordinates;
          let first: any = c;
          while (Array.isArray(first) && Array.isArray(first[0])) first = first[0];
          console.log(`    First coordinate: [${first}]`);
        }
      });
      setGisLayers(r.data);
      // All active layers visible by default
      const ids = new Set<number>(r.data.filter((l: GisLayerData) => l.geojson).map((l: GisLayerData) => l.id));
      setVisibleLayers(ids);
    }).catch((err) => {
      console.error("[MapPage] Failed to load GIS layers:", err);
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

  const getGisLayerStyle = (layer: GisLayerData) => {
    return (_feature: any) => ({
      fillColor: layer.color ?? "#0057A8",
      color: "#333",
      weight: 1.5,
      fillOpacity: layer.opacity ?? 0.6,
    });
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const p = feature.properties;
      const val = (v: any) => (v != null && v !== "" ? v : "—");
      const statusLabel =
        p.status === "active" ? "Aktif" : p.status === "inactive" ? "Tidak Aktif" : "Kosong";
      const statusColor =
        p.status === "active" ? "#dcfce7" : p.status === "inactive" ? "#fee2e2" : "#f1f5f9";
      const statusTextColor =
        p.status === "active" ? "#16a34a" : p.status === "inactive" ? "#dc2626" : "#64748b";

      const rows = [
        ["No. Kios", val(p.nomor)],
        ["Pedagang", val(p.nama_pedagang)],
        ["Komoditas", val(p.komoditas)],
        ["Kategori", val(p.category)],
      ]
        .map(
          ([label, value]) =>
            `<tr>
              <td style="font-weight:600;padding:4px 12px 4px 0;color:#475569;font-size:12px;white-space:nowrap;">${label}</td>
              <td style="font-size:12px;color:#1e293b;">${value}</td>
            </tr>`,
        )
        .join("");

      layer.bindPopup(`
        <div style="min-width:200px; font-family:Inter,sans-serif;">
          <div style="font-weight:700;font-size:14px;color:#0057A8;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
            🏪 Detail Kios
          </div>
          <table style="border-collapse:collapse;width:100%;">${rows}</table>
          <span style="
            display:inline-block;margin-top:8px;padding:3px 12px;
            border-radius:999px;font-size:11px;font-weight:600;
            background:${statusColor};color:${statusTextColor};
          ">${statusLabel}</span>
        </div>
      `);
    }
  };

  const onEachGisFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const props = feature.properties;
      const labelMap: Record<string, string> = {
        No_Lapak: "No. Lapak",
        Kepemilikan: "Pedagang",
        Komoditi: "Komoditi",
        KategoriKomoditi: "Kategori",
      };
      const hiddenKeys = ["Shape_Length", "Shape_Area", "OBJECTID", "Shape_Leng"];
      const rows = Object.entries(props)
        .filter(([k]) => !hiddenKeys.includes(k))
        .map(([k, v]) => {
          const label = labelMap[k] ?? k;
          const val = v != null && v !== "" ? v : "—";
          return `<tr><td style="font-weight:600;padding:4px 12px 4px 0;color:#475569;font-size:12px;white-space:nowrap;">${label}</td><td style="font-size:12px;color:#1e293b;">${val}</td></tr>`;
        })
        .join("");

      if (rows) {
        layer.bindPopup(`
          <div style="min-width:200px; max-height:300px; overflow-y:auto; font-family:Inter,sans-serif;">
            <table style="border-collapse:collapse;">${rows}</table>
          </div>
        `);
      }
    }
  };

  const toggleLayer = (id: number) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const layersWithData = gisLayers.filter(l => l.geojson);

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
          {/* Layer Toggle Panel */}
          {layersWithData.length > 0 && (
            <div style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                🗂️ Layer GIS ({layersWithData.length})
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {layersWithData.map(l => (
                  <button
                    key={l.id}
                    onClick={() => toggleLayer(l.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `2px solid ${visibleLayers.has(l.id) ? l.color : "#e2e8f0"}`,
                      background: visibleLayers.has(l.id) ? `${l.color}15` : "#f8fafc",
                      color: visibleLayers.has(l.id) ? l.color : "#94a3b8",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: visibleLayers.has(l.id) ? l.color : "#cbd5e1",
                      opacity: visibleLayers.has(l.id) ? l.opacity : 0.3,
                      display: "inline-block",
                    }} />
                    {l.name}
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      ({l.geojson?.features?.length ?? 0} fitur)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="map-container" style={{ position: "relative" }}>
            <MapContainer
              center={[-6.9626, 110.4346]}
              zoom={15}
              maxZoom={21}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                key={basemap}
                url={BASEMAPS[basemap].url}
                attribution={BASEMAPS[basemap].attribution}
                maxZoom={BASEMAPS[basemap].maxZoom}
              />

              {/* Basemap Switcher */}
              <div style={{
                position: "absolute", top: 10, right: 10, zIndex: 1000,
                display: "flex", flexDirection: "column", gap: 4,
                background: "rgba(255,255,255,0.95)", borderRadius: 10,
                padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {(Object.keys(BASEMAPS) as BasemapKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setBasemap(key)}
                    style={{
                      padding: "6px 12px", borderRadius: 6, fontSize: 12,
                      fontWeight: 600, cursor: "pointer", border: "none",
                      background: basemap === key ? "#0057A8" : "transparent",
                      color: basemap === key ? "#fff" : "#374151",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {BASEMAPS[key].label}
                  </button>
                ))}
              </div>

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

              {/* GIS Layers uploaded from Admin - rendered as reference outlines underneath */}
              {layersWithData.map(
                (l) =>
                  visibleLayers.has(l.id) && l.geojson && (
                    <GeoJSON
                      key={`gis-${l.id}-${visibleLayers.has(l.id)}-${l.geojson.features?.length}`}
                      data={l.geojson as any}
                      style={() => ({
                        fillColor: l.color ?? "#0057A8",
                        color: l.color ?? "#0057A8",
                        weight: 1.5,
                        fillOpacity: 0,      // transparent fill — let kios colors show
                        opacity: 0.5,
                      })}
                      onEachFeature={onEachGisFeature}
                    />
                  ),
              )}

              {/* GeoJSON Kiosk Layers from DB - always rendered on top with per-category colors */}
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

              {/* Auto-fit to GIS layers when first loaded */}
              {layersWithData.length > 0 && <FitToGisLayers layers={layersWithData} />}
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
            detail pedagang. Gunakan toggle layer untuk mengatur visibilitas layer GIS.
          </p>
        </div>
      </div>
    </div>
  );
}
