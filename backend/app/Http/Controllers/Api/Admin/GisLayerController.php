<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GisLayer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GisLayerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $layers = GisLayer::with('pasar')
            ->when($request->pasar_id, fn($q) => $q->where('pasar_id', $request->pasar_id))
            ->orderBy('sort_order')
            ->get();

        return response()->json($layers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pasar_id'   => 'required|exists:pasars,id',
            'name'       => 'required|string|max:255',
            'type'       => 'required|in:polygon,point,line',
            'geojson'    => 'nullable|string',
            'color'      => 'nullable|string|max:7',
            'opacity'    => 'nullable|numeric|min:0|max:1',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ]);

        $layer = GisLayer::create($data);
        return response()->json($layer, 201);
    }

    public function update(Request $request, GisLayer $gisLayer): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'type'       => 'sometimes|in:polygon,point,line',
            'geojson'    => 'nullable|string',
            'color'      => 'nullable|string|max:7',
            'opacity'    => 'nullable|numeric|min:0|max:1',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ]);

        $gisLayer->update($data);
        return response()->json($gisLayer);
    }

    public function uploadGeojson(Request $request, GisLayer $gisLayer): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200', // max 50MB for GDB zips
        ]);

        $uploadedFile = $request->file('file');
        $extension = strtolower($uploadedFile->getClientOriginalExtension());

        // Route based on file type
        if (in_array($extension, ['json', 'geojson'])) {
            return $this->processGeojsonFile($uploadedFile, $gisLayer);
        } elseif ($extension === 'zip') {
            return $this->processGdbZip($uploadedFile, $gisLayer, $request->input('layer_name'));
        } else {
            return response()->json([
                'message' => 'Format file tidak didukung. Gunakan .zip (berisi .gdb), .json, atau .geojson.',
            ], 422);
        }
    }

    /**
     * Process a direct GeoJSON file upload.
     */
    private function processGeojsonFile($file, GisLayer $gisLayer): JsonResponse
    {
        $content = file_get_contents($file->getRealPath());
        $decoded = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['message' => 'File GeoJSON tidak valid.'], 422);
        }

        // Auto-detect and reproject from EPSG:3857 to WGS84 if needed
        $reprojected = false;
        if ($this->needsReprojection($decoded)) {
            $decoded = $this->reprojectGeoJson($decoded);
            $reprojected = true;
        }

        $gisLayer->update(['geojson' => json_encode($decoded, JSON_UNESCAPED_UNICODE)]);

        // Auto-update Pasar coordinates based on GeoJSON centroid
        $centroid = $this->calculateGeoJsonCentroid($decoded);
        if ($centroid) {
            $gisLayer->pasar()->update([
                'longitude' => $centroid[0],
                'latitude'  => $centroid[1],
            ]);
        }

        return response()->json([
            'message' => $reprojected
                ? 'GeoJSON berhasil diupload dan dikonversi ke WGS84. Koordinat Pasar diperbarui.'
                : 'GeoJSON berhasil diupload. Koordinat Pasar diperbarui.',
            'layer'        => $gisLayer->fresh(),
            'reprojected'  => $reprojected,
            'centroid'     => $centroid,
        ]);
    }

    /**
     * Process a .zip containing a .gdb folder → convert to GeoJSON via Python.
     */
    private function processGdbZip($file, GisLayer $gisLayer, ?string $layerName = null): JsonResponse
    {
        $tempDir = storage_path('app/temp_gdb_' . uniqid());
        $outputDir = $tempDir . DIRECTORY_SEPARATOR . 'output';

        try {
            // Create temp directories
            if (!is_dir($tempDir)) mkdir($tempDir, 0755, true);
            if (!is_dir($outputDir)) mkdir($outputDir, 0755, true);

            // First, scan ZIP entries to find .gdb path patterns
            $zip = new \ZipArchive();
            $zipPath = $file->getRealPath();

            if ($zip->open($zipPath) !== true) {
                return response()->json(['message' => 'Gagal membuka file ZIP.'], 422);
            }

            // Scan ZIP entries for .gdb folder paths
            $gdbEntryPath = null;
            $zipEntries = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->getNameIndex($i);
                $zipEntries[] = $entry;

                // Look for entries containing .gdb in the path
                if (preg_match('/([^\/\\\\]*\.gdb)/i', $entry, $matches)) {
                    $gdbEntryPath = $matches[1];
                }
            }

            $zip->extractTo($tempDir);
            $zip->close();

            // Strategy 1: Use the .gdb path found in ZIP entries
            $gdbPath = null;
            if ($gdbEntryPath) {
                $candidate = $tempDir . DIRECTORY_SEPARATOR . $gdbEntryPath;
                if (is_dir($candidate)) {
                    $gdbPath = $candidate;
                }
            }

            // Strategy 2: Recursive directory scan for .gdb folders
            if (!$gdbPath) {
                $gdbPath = $this->findGdbFolder($tempDir);
            }

            // Strategy 3: Look for GDB signature files (.gdbtable, .gdbtablx)
            // This handles cases where the .gdb folder name is not preserved
            if (!$gdbPath) {
                $gdbPath = $this->findGdbByContents($tempDir);
            }

            if (!$gdbPath) {
                // Build debug info: list what we actually extracted
                $extractedItems = $this->listDirectoryRecursive($tempDir, $tempDir);

                return response()->json([
                    'message' => 'Folder .gdb tidak ditemukan di dalam file ZIP.',
                    'help'    => 'Pastikan ZIP berisi folder .gdb (mis: PasarRejomulyo.gdb/). Folder .gdb harus berisi file .gdbtable.',
                    'zip_entries'     => array_slice($zipEntries, 0, 30),
                    'extracted_items' => array_slice($extractedItems, 0, 30),
                ], 422);
            }

            // Build python command
            $scriptPath = base_path('../gis-tools/convert_gdb_to_geojson.py');

            if (!file_exists($scriptPath)) {
                return response()->json([
                    'message' => 'Script konversi Python tidak ditemukan. Pastikan gis-tools/convert_gdb_to_geojson.py ada.',
                ], 500);
            }

            // Run the conversion script
            $cmd = sprintf(
                'python "%s" --input "%s" --output "%s"',
                $scriptPath,
                $gdbPath,
                $outputDir
            );

            if ($layerName) {
                $cmd .= sprintf(' --layer "%s"', $layerName);
            }

            exec($cmd . ' 2>&1', $output, $exitCode);

            if ($exitCode !== 0) {
                $errorMsg = implode("\n", $output);

                // Check if it's a dependency issue
                if (str_contains($errorMsg, 'No module named') || str_contains($errorMsg, 'ImportError')) {
                    return response()->json([
                        'message' => 'Python dependency tidak tersedia. Install: pip install geopandas fiona pyproj shapely',
                        'detail'  => $errorMsg,
                    ], 500);
                }

                return response()->json([
                    'message' => 'Konversi GDB gagal.',
                    'detail'  => $errorMsg,
                ], 500);
            }

            // Find the output GeoJSON file(s)
            $geojsonFiles = glob($outputDir . DIRECTORY_SEPARATOR . '*.geojson');

            if (empty($geojsonFiles)) {
                return response()->json([
                    'message' => 'Konversi berhasil tapi tidak ada file GeoJSON yang dihasilkan.',
                    'output'  => implode("\n", $output),
                ], 500);
            }

            // Use the first (or specified) GeoJSON file
            $geojsonContent = file_get_contents($geojsonFiles[0]);
            $decoded = json_decode($geojsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['message' => 'Hasil konversi bukan GeoJSON valid.'], 500);
            }

            // Auto-detect and reproject if still in projected CRS
            if ($this->needsReprojection($decoded)) {
                $decoded = $this->reprojectGeoJson($decoded);
            }

            $gisLayer->update(['geojson' => json_encode($decoded, JSON_UNESCAPED_UNICODE)]);

            // Auto-update Pasar coordinates based on GeoJSON centroid
            $centroid = $this->calculateGeoJsonCentroid($decoded);
            if ($centroid) {
                $gisLayer->pasar()->update([
                    'longitude' => $centroid[0],
                    'latitude'  => $centroid[1],
                ]);
            }

            // Get list of available layers for response
            $availableLayers = array_map(
                fn($f) => pathinfo($f, PATHINFO_FILENAME),
                $geojsonFiles
            );

            return response()->json([
                'message'          => 'File GDB berhasil dikonversi dan diupload! Koordinat Pasar diperbarui.',
                'layer'            => $gisLayer->fresh(),
                'features_count'   => count($decoded['features'] ?? []),
                'available_layers' => $availableLayers,
                'converted_file'   => basename($geojsonFiles[0]),
                'centroid'         => $centroid,
            ]);

        } finally {
            // Cleanup temp directory
            $this->removeDirectory($tempDir);
        }
    }

    /**
     * Recursively find a .gdb folder in extracted contents.
     */
    private function findGdbFolder(string $dir): ?string
    {
        // Check if current dir IS a .gdb
        if (str_ends_with(strtolower($dir), '.gdb') && is_dir($dir)) {
            return $dir;
        }

        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                if (str_ends_with(strtolower($item), '.gdb')) {
                    return $path;
                }
                // Recurse one level deeper
                $found = $this->findGdbFolder($path);
                if ($found) return $found;
            }
        }

        return null;
    }

    /**
     * Detect a GDB folder by looking for characteristic .gdbtable files.
     * This handles cases where the .gdb extension is not on the folder name.
     */
    private function findGdbByContents(string $dir, int $depth = 0): ?string
    {
        if ($depth > 5) return null; // prevent deep recursion

        $items = is_dir($dir) ? scandir($dir) : [];
        $hasGdbFiles = false;

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;

            // Check for GDB signature files
            if (preg_match('/\.(gdbtable|gdbtablx|gdbindexes|atx|freelist|lock|spx)$/i', $item)) {
                $hasGdbFiles = true;
                break;
            }
        }

        if ($hasGdbFiles) {
            return $dir;
        }

        // Recurse into subdirectories
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $found = $this->findGdbByContents($path, $depth + 1);
                if ($found) return $found;
            }
        }

        return null;
    }

    /**
     * List directory contents recursively (for debug output).
     */
    private function listDirectoryRecursive(string $dir, string $baseDir, int $depth = 0): array
    {
        $result = [];
        if ($depth > 3 || !is_dir($dir)) return $result;

        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            $relative = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $path);
            $type = is_dir($path) ? '[DIR]' : '[FILE]';
            $result[] = "$type $relative";

            if (is_dir($path) && $depth < 3) {
                $result = array_merge($result, $this->listDirectoryRecursive($path, $baseDir, $depth + 1));
            }
        }

        return $result;
    }

    /**
     * Check if GeoJSON coordinates need reprojection (are in projected CRS, not WGS84).
     * WGS84 coordinates: longitude [-180, 180], latitude [-90, 90]
     * Projected (e.g. EPSG:3857): values in millions of meters
     */
    private function needsReprojection(array $geojson): bool
    {
        $features = $geojson['features'] ?? [];
        foreach ($features as $feature) {
            $coords = $this->getFirstCoordinate($feature['geometry'] ?? []);
            if ($coords !== null) {
                // If X or Y > 180 degrees, it's definitely projected
                return abs($coords[0]) > 180 || abs($coords[1]) > 90;
            }
        }
        return false;
    }

    /**
     * Get the first coordinate pair from a geometry (digs into nested arrays).
     */
    private function getFirstCoordinate(array $geometry): ?array
    {
        $coords = $geometry['coordinates'] ?? null;
        if (!$coords) return null;

        // Dig down until we find a [number, number] pair
        $current = $coords;
        while (is_array($current) && isset($current[0]) && is_array($current[0])) {
            $current = $current[0];
        }

        if (is_array($current) && count($current) >= 2 && is_numeric($current[0])) {
            return $current;
        }

        return null;
    }

    /**
     * Reproject entire GeoJSON from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS84).
     */
    private function reprojectGeoJson(array $geojson): array
    {
        if (isset($geojson['features'])) {
            foreach ($geojson['features'] as &$feature) {
                if (isset($feature['geometry']['coordinates'])) {
                    $feature['geometry']['coordinates'] = $this->reprojectCoordinates(
                        $feature['geometry']['coordinates'],
                        $feature['geometry']['type'] ?? ''
                    );
                }
            }
        }

        // Update CRS to WGS84
        $geojson['crs'] = [
            'type' => 'name',
            'properties' => ['name' => 'urn:ogc:def:crs:OGC:1.3:CRS84'],
        ];

        return $geojson;
    }

    /**
     * Calculate centroid (average center) of a GeoJSON FeatureCollection.
     * Returns [longitude, latitude] or null.
     */
    private function calculateGeoJsonCentroid(array $geojson): ?array
    {
        $features = $geojson['features'] ?? [];
        if (empty($features)) return null;

        $sumLon = 0;
        $sumLat = 0;
        $count = 0;

        foreach ($features as $feature) {
            $coords = $feature['geometry']['coordinates'] ?? null;
            if (!$coords) continue;

            // Flatten all coordinates recursively
            $flatCoords = [];
            array_walk_recursive($coords, function($a) use (&$flatCoords) { $flatCoords[] = $a; });

            // Each pair is [lon, lat]
            $len = count($flatCoords);
            for ($i = 0; $i < $len - 1; $i += 2) {
                if (is_numeric($flatCoords[$i]) && is_numeric($flatCoords[$i+1])) {
                    $sumLon += $flatCoords[$i];
                    $sumLat += $flatCoords[$i+1];
                    $count++;
                }
            }
        }

        if ($count === 0) return null;

        return [
            round($sumLon / $count, 8),
            round($sumLat / $count, 8),
        ];
    }

    /**
     * Recursively reproject coordinates from EPSG:3857 to EPSG:4326.
     * Handles Point, LineString, Polygon, Multi* geometry types.
     */
    private function reprojectCoordinates($coords, string $geomType = '')
    {
        if (!is_array($coords)) return $coords;

        // Check if this is a coordinate pair [x, y] or [x, y, z]
        if (isset($coords[0]) && is_numeric($coords[0]) && isset($coords[1]) && is_numeric($coords[1])) {
            // This is a single coordinate — convert from EPSG:3857 to EPSG:4326
            $x = (float) $coords[0]; // meters east
            $y = (float) $coords[1]; // meters north

            // Inverse Web Mercator projection
            $lon = ($x / 20037508.342789244) * 180.0;
            $lat = ($y / 20037508.342789244) * 180.0;
            $lat = 180.0 / M_PI * (2.0 * atan(exp($lat * M_PI / 180.0)) - M_PI / 2.0);

            $result = [round($lon, 8), round($lat, 8)];
            // Preserve Z coordinate if exists
            if (isset($coords[2]) && is_numeric($coords[2])) {
                $result[] = $coords[2];
            }
            return $result;
        }

        // Otherwise, recurse into nested arrays
        return array_map(function ($c) use ($geomType) {
            return $this->reprojectCoordinates($c, $geomType);
        }, $coords);
    }

    /**
     * Recursively remove a directory.
     */
    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    public function destroy(GisLayer $gisLayer): JsonResponse
    {
        $pasarId = $gisLayer->pasar_id;
        $gisLayer->delete();
        
        // Hapus juga data Kios (titik/polygon) pada pasar tersebut agar hilang dari peta interaktif
        \App\Models\Kios::where('pasar_id', $pasarId)->forceDelete();

        return response()->json(['message' => 'Layer dan data Kios di peta berhasil dihapus.']);
    }

    /**
     * List available layers inside a GDB zip (for layer selection UI).
     */
    public function listGdbLayers(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|max:51200']);

        $file = $request->file('file');
        if (strtolower($file->getClientOriginalExtension()) !== 'zip') {
            return response()->json(['message' => 'File harus berformat .zip berisi folder .gdb'], 422);
        }

        $tempDir = storage_path('app/temp_gdb_list_' . uniqid());

        try {
            mkdir($tempDir, 0755, true);

            $zip = new \ZipArchive();
            if ($zip->open($file->getRealPath()) !== true) {
                return response()->json(['message' => 'Gagal membuka file ZIP.'], 422);
            }
            $zip->extractTo($tempDir);
            $zip->close();

            $gdbPath = $this->findGdbFolder($tempDir);
            if (!$gdbPath) {
                return response()->json(['message' => 'Folder .gdb tidak ditemukan dalam ZIP.'], 422);
            }

            $scriptPath = base_path('../gis-tools/convert_gdb_to_geojson.py');
            $cmd = sprintf('python "%s" --input "%s" --list 2>&1', $scriptPath, $gdbPath);
            exec($cmd, $output, $exitCode);

            // Parse layer names from output
            $layers = [];
            foreach ($output as $line) {
                if (preg_match('/^\s*\d+\.\s+(.+)$/', trim($line), $m)) {
                    $layers[] = trim($m[1]);
                }
            }

            return response()->json(['layers' => $layers, 'gdb_name' => basename($gdbPath)]);

        } finally {
            $this->removeDirectory($tempDir);
        }
    }

    /**
     * Sync GeoJSON features to the Kios table
     */
    public function syncKios(Request $request, GisLayer $gisLayer): JsonResponse
    {
        if (!$gisLayer->geojson) {
            return response()->json(['message' => 'Layer ini tidak memiliki data GeoJSON.'], 400);
        }

        $decoded = is_string($gisLayer->geojson) ? json_decode($gisLayer->geojson, true) : $gisLayer->geojson;
        $features = $decoded['features'] ?? [];

        if (empty($features)) {
            return response()->json(['message' => 'Tidak ada fitur di dalam GeoJSON.'], 400);
        }

        $pasarId = $gisLayer->pasar_id;
        $count = 0;

        foreach ($features as $f) {
            $props = $f['properties'] ?? [];
            if (empty($props)) continue;

            // Try to figure out the Kios Number from common fields
            $nomor = $props['NomorKios'] ?? $props['No_Lapak'] ?? $props['no_kios'] ?? $props['nomor'] ?? null;
            if (!$nomor) {
                // Autogenerate if missing, but it's risky. Let's try OBJECTID.
                $nomor = $props['OBJECTID'] ?? uniqid('K-');
            }

            // Figure out Pedagang
            $pedagang = $props['NamaPemilik'] ?? $props['Kepemilikan'] ?? $props['nama_pedagang'] ?? null;

            // Figure out Komoditas and Category
            $komoditas = $props['Komoditi'] ?? $props['komoditas'] ?? null;
            $catName = $props['KategoriKomoditi'] ?? $props['kategori'] ?? null;
            
            $catId = null;
            if ($catName) {
                $category = \App\Models\KiosCategory::firstOrCreate(
                    ['name' => $catName],
                    ['color_hex' => '#0057A8', 'icon' => 'store']
                );
                $catId = $category->id;
            }

            // Figure out Luas
            $luas = $props['Luas'] ?? $props['luas'] ?? $props['Ukuran'] ?? null;
            if (is_string($luas)) {
                $luas = preg_replace('/[^0-9.]/', '', str_replace(',', '.', $luas));
                $luas = floatval($luas) ?: null;
            }

            $keterangan = $props['Keterangan'] ?? $props['keterangan'] ?? null;

            // Status logic
            $status = 'active';
            if (empty($pedagang) || strtolower($pedagang) === 'kosong') {
                $status = 'empty';
            }

            \App\Models\Kios::updateOrCreate(
                ['pasar_id' => $pasarId, 'nomor' => (string) $nomor],
                [
                    'category_id'   => $catId,
                    'nama_pedagang' => $pedagang ? (string) $pedagang : null,
                    'komoditas'     => $komoditas ? (string) $komoditas : null,
                    'status'        => $status,
                    'luas'          => $luas,
                    'keterangan'    => $keterangan,
                    'geometry'      => $f['geometry'] ?? null,
                ]
            );

            $count++;
        }

        return response()->json([
            'message' => "Berhasil menyinkronkan $count kios ke database.",
            'synced'  => $count
        ]);
    }
}

