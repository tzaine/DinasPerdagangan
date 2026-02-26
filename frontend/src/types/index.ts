export interface Pasar {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  thumbnail: string | null;
  is_active: boolean;
  kios_count?: number;
}

export interface KiosCategory {
  id: number;
  name: string;
  color_hex: string;
  icon: string;
}

export interface Kios {
  id: number;
  pasar_id: number;
  category_id: number | null;
  nomor: string;
  nama_pedagang: string;
  komoditas: string;
  status: 'active' | 'inactive' | 'empty';
  luas: number | null;
  geometry: GeoJsonGeometry | null;
  keterangan: string | null;
  category: KiosCategory | null;
  pasar?: Pasar;
}

export interface GisLayer {
  id: number;
  pasar_id: number;
  name: string;
  type: 'polygon' | 'point' | 'line';
  geojson: string | null;
  color: string;
  opacity: number;
  is_active: boolean;
  sort_order: number;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface PasarStats {
  total: number;
  active: number;
  inactive: number;
  empty: number;
}

export interface DashboardStats {
  summary: {
    total_kios: number;
    active_kios: number;
    inactive_kios: number;
    empty_kios: number;
    occupancy_rate: number;
    total_pasars: number;
  };
  categories: { name: string; count: number; color: string }[];
  pasars: { id: number; name: string; slug: string; total: number; active: number; inactive: number; empty: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}
