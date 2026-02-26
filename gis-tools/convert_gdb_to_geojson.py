#!/usr/bin/env python3
"""
GDB to GeoJSON Converter for Semarang Trade Office GIS
=======================================================
Converts ArcGIS FileGDB (.gdb) feature classes to GeoJSON files.

Requirements (install ONE of options below):
  Option A - GDAL/OGR (recommended, full support):
    pip install gdal
    # or via conda: conda install -c conda-forge gdal

  Option B - Geopandas + Fiona (easier install on Windows):
    pip install geopandas fiona pyproj

Usage:
    python convert_gdb_to_geojson.py --input path/to/file.gdb --output ./geojson/
    python convert_gdb_to_geojson.py --input path/to/file.gdb --output ./geojson/ --layer KiosRejomulyo
    python convert_gdb_to_geojson.py --list   path/to/file.gdb

    # Or via ogr2ogr CLI (if GDAL CLI is installed):
    ogr2ogr -f GeoJSON output/rejomulyo.geojson input.gdb KiosRejomulyo -t_srs EPSG:4326
"""

import os
import sys
import json
import argparse


def list_layers_gdal(gdb_path: str):
    """List all feature classes in the GDB using GDAL."""
    try:
        from osgeo import ogr
        ds = ogr.Open(gdb_path)
        if not ds:
            print(f"ERROR: Cannot open {gdb_path}")
            return []
        layers = [ds.GetLayerByIndex(i).GetName() for i in range(ds.GetLayerCount())]
        ds = None
        return layers
    except ImportError:
        print("GDAL not found. Trying geopandas...")
        return list_layers_geopandas(gdb_path)


def list_layers_geopandas(gdb_path: str):
    """List layers using fiona."""
    import fiona
    return fiona.listlayers(gdb_path)


def convert_layer_gdal(gdb_path: str, layer_name: str, output_path: str, crs: str = "EPSG:4326"):
    """Convert a single layer using GDAL."""
    from osgeo import ogr, osr

    ds = ogr.Open(gdb_path)
    if not ds:
        raise FileNotFoundError(f"Cannot open {gdb_path}")

    layer = ds.GetLayerByName(layer_name)
    if not layer:
        raise ValueError(f"Layer '{layer_name}' not found in GDB.")

    # Set up coordinate transformation to WGS84
    source_srs = layer.GetSpatialRef()
    target_srs = osr.SpatialReference()
    target_srs.ImportFromEPSG(4326)
    transform = None
    if source_srs and not source_srs.IsSame(target_srs):
        from osgeo import osr
        transform = osr.CoordinateTransformation(source_srs, target_srs)

    features = []
    layer.ResetReading()
    for feat in layer:
        geom = feat.GetGeometryRef()
        if geom and transform:
            geom.Transform(transform)

        geom_json = json.loads(geom.ExportToJson()) if geom else None

        # Collect attributes
        props = {}
        for i in range(feat.GetFieldCount()):
            field_name = feat.GetFieldDefnRef(i).GetName()
            props[field_name] = feat.GetField(i)

        features.append({
            "type": "Feature",
            "geometry": geom_json,
            "properties": props,
        })

    geojson = {
        "type": "FeatureCollection",
        "name": layer_name,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features,
    }

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)

    print(f"✅ Converted '{layer_name}' → {output_path} ({len(features)} features)")
    ds = None


def convert_layer_geopandas(gdb_path: str, layer_name: str, output_path: str):
    """Convert a single layer using geopandas (fallback)."""
    import geopandas as gpd

    gdf = gpd.read_file(gdb_path, layer=layer_name)

    # Reproject to WGS84 if needed
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    gdf.to_file(output_path, driver="GeoJSON")
    print(f"✅ Converted '{layer_name}' → {output_path} ({len(gdf)} features)")


def convert_layer(gdb_path: str, layer_name: str, output_path: str):
    """Try GDAL first, fall back to geopandas."""
    try:
        from osgeo import ogr
        convert_layer_gdal(gdb_path, layer_name, output_path)
    except ImportError:
        try:
            import geopandas
            convert_layer_geopandas(gdb_path, layer_name, output_path)
        except ImportError:
            print("ERROR: Neither GDAL nor geopandas is installed.")
            print("Install: pip install gdal   OR   pip install geopandas fiona")
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Convert ArcGIS GDB to GeoJSON for Semarang GIS Portal")
    parser.add_argument("--input",  "-i", help="Path to .gdb file or directory")
    parser.add_argument("--output", "-o", help="Output directory for GeoJSON files", default="./geojson")
    parser.add_argument("--layer",  "-l", help="Specific layer name to convert (converts all if omitted)")
    parser.add_argument("--list",         help="List layers in GDB then exit", action="store_true")
    args = parser.parse_args()

    if not args.input:
        parser.print_help()
        sys.exit(0)

    gdb_path = args.input
    if not os.path.exists(gdb_path):
        print(f"ERROR: File not found: {gdb_path}")
        sys.exit(1)

    # List mode
    if args.list:
        layers = list_layers_gdal(gdb_path)
        print(f"\nLayers in {gdb_path}:")
        for i, l in enumerate(layers, 1):
            print(f"  {i:2d}. {l}")
        return

    # Convert specific layer
    if args.layer:
        out = os.path.join(args.output, f"{args.layer}.geojson")
        convert_layer(gdb_path, args.layer, out)
    else:
        # Convert all layers
        layers = list_layers_gdal(gdb_path)
        print(f"Found {len(layers)} layers. Converting all...")
        for lyr in layers:
            out = os.path.join(args.output, f"{lyr}.geojson")
            try:
                convert_layer(gdb_path, lyr, out)
            except Exception as e:
                print(f"⚠️  Skipped '{lyr}': {e}")
        print(f"\n✅ Done! GeoJSON files saved to: {args.output}/")
        print("📤 Upload the .geojson files via Admin Panel → Layer GIS → Upload GeoJSON")


if __name__ == "__main__":
    main()
