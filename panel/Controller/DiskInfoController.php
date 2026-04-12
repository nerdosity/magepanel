<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * DiskInfoController — returns disk usage info for the Magento root directory.
 * Lists top-level folders with their sizes, sorted by size desc.
 */
class DiskInfoController extends AbstractController
{
    public function handle(): never
    {
        $this->requireAuth();

        $root = MAGENTO_ROOT;
        $diskFree  = (int) disk_free_space($root);
        $diskTotal = (int) disk_total_space($root);
        $diskUsed  = $diskTotal - $diskFree;
        $diskUsedPct = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        // Scan top-level directories of Magento root
        $folders = [];
        $handle = @opendir($root);
        if ($handle !== false) {
            while (($entry = readdir($handle)) !== false) {
                if ($entry === '.' || $entry === '..') continue;
                $path = $root . DIRECTORY_SEPARATOR . $entry;
                if (!is_dir($path) || is_link($path)) continue;
                $size = $this->getDirSize($path);
                $folders[] = [
                    'name' => $entry,
                    'size' => $size,
                    'size_human' => $this->formatBytes($size),
                ];
            }
            closedir($handle);
        }

        // Sort by size desc
        usort($folders, fn($a, $b) => $b['size'] <=> $a['size']);

        // Magento-specific hot folders (var, generated, pub/static) — breakdown
        $hotFolders = [];
        $hotPaths = [
            'var/cache'            => $root . '/var/cache',
            'var/log'              => $root . '/var/log',
            'var/session'          => $root . '/var/session',
            'var/page_cache'       => $root . '/var/page_cache',
            'var/view_preprocessed'=> $root . '/var/view_preprocessed',
            'generated/code'       => $root . '/generated/code',
            'generated/metadata'   => $root . '/generated/metadata',
            'pub/static'           => $root . '/pub/static',
            'pub/media'            => $root . '/pub/media',
        ];
        foreach ($hotPaths as $label => $path) {
            if (is_dir($path)) {
                $size = $this->getDirSize($path);
                $hotFolders[] = [
                    'name' => $label,
                    'size' => $size,
                    'size_human' => $this->formatBytes($size),
                ];
            }
        }
        usort($hotFolders, fn($a, $b) => $b['size'] <=> $a['size']);

        $totalSize = array_sum(array_column($folders, 'size'));

        $this->json([
            'root_name'     => basename($root),
            'disk_free'     => $this->formatBytes($diskFree),
            'disk_total'    => $this->formatBytes($diskTotal),
            'disk_used'     => $this->formatBytes($diskUsed),
            'disk_used_pct' => $diskUsedPct,
            'magento_size'  => $this->formatBytes($totalSize),
            'folders'       => $folders,
            'hot_folders'   => $hotFolders,
        ]);
    }

    /**
     * Recursively compute directory size. Caps at a reasonable depth
     * to avoid hanging on huge trees.
     */
    private function getDirSize(string $path, int $depth = 0): int
    {
        if ($depth > 12) return 0;
        $size = 0;
        $handle = @opendir($path);
        if ($handle === false) return 0;
        while (($entry = readdir($handle)) !== false) {
            if ($entry === '.' || $entry === '..') continue;
            $full = $path . DIRECTORY_SEPARATOR . $entry;
            if (is_link($full)) continue;
            if (is_dir($full)) {
                $size += $this->getDirSize($full, $depth + 1);
            } elseif (is_file($full)) {
                $size += (int) @filesize($full);
            }
        }
        closedir($handle);
        return $size;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576)    return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024)       return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
