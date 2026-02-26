# GDB to GeoJSON Conversion Tool

## Requirements

Install **ONE** of the following:

```bash
# Option A – GDAL (recommended, full ArcGIS support)
pip install gdal

# Option B – Geopandas + Fiona (easier on Windows)
pip install geopandas fiona pyproj shapely
```

## Usage

```bash
# Step 1: List all layers inside your GDB
python convert_gdb_to_geojson.py --input "D:\Data\PasarRejomulyo.gdb" --list

# Step 2a: Convert a specific layer
python convert_gdb_to_geojson.py \
  --input  "D:\Data\PasarRejomulyo.gdb" \
  --output "./geojson" \
  --layer  "KiosRejomulyo"

# Step 2b: Convert all layers at once
python convert_gdb_to_geojson.py \
  --input  "D:\Data\PasarRejomulyo.gdb" \
  --output "./geojson"

# Alternative: use ogr2ogr CLI directly
ogr2ogr -f GeoJSON geojson/kios.geojson input.gdb KiosLayer -t_srs EPSG:4326
```

## Output

- GeoJSON files are saved to the `--output` directory (default: `./geojson/`).
- All geometries are reprojected to **WGS84 (EPSG:4326)** automatically.

## Upload to GIS Portal

1. Open **Admin Panel** → `http://localhost:5173/admin/layers`
2. Click **Tambah Layer** → create a new layer entry
3. Click **Upload GeoJSON** (📤 icon) → select your `.geojson` file
4. The layer will immediately appear on the public map at `http://localhost:5173/peta`
