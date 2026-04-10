#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * panel/bin/clean.php — PHP-native directory cleaner.
 *
 * Usage (from MAGENTO_ROOT):
 *   php panel/bin/clean.php <rel/path1> [rel/path2] ...
 *
 * For each path:
 *  - If it exists and is a directory: deletes all contents recursively,
 *    then recreates the empty directory.
 *  - If it does not exist: creates it (mkdir -p equivalent).
 *
 * Requires zero external binaries — pure PHP file operations.
 * Exit code: 0 on full success, 1 if any error occurred.
 */

$root = getcwd(); // StreamController runs "cd MAGENTO_ROOT && php panel/bin/clean.php ..."
$args = array_slice($argv, 1);

if (empty($args)) {
    fwrite(STDERR, "Uso: php panel/bin/clean.php <percorso1> [percorso2] ...\n");
    exit(1);
}

$errors = 0;

foreach ($args as $rel) {
    $abs = $root . DIRECTORY_SEPARATOR . ltrim($rel, '/\\');
    echo "  Pulizia: $rel\n";

    if (is_dir($abs)) {
        $errors += deleteContents($abs) ? 0 : 1;
    }

    // (Re)create the directory
    if (!is_dir($abs)) {
        if (!mkdir($abs, 0755, true)) {
            echo "[ERRORE] Impossibile creare $rel\n";
            $errors++;
            continue;
        }
    }

    echo "  [OK] $rel\n";
}

exit($errors > 0 ? 1 : 0);

// ────────────────────────────────────────────────────────────────────

/**
 * Delete all contents of a directory without removing the directory itself.
 * Uses RecursiveDirectoryIterator — no shell commands required.
 */
function deleteContents(string $dir): bool
{
    try {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        $ok = true;
        foreach ($it as $entry) {
            /** @var SplFileInfo $entry */
            $path = $entry->getRealPath();
            if (!$path) continue;

            if ($entry->isDir()) {
                if (!rmdir($path)) {
                    fwrite(STDERR, "  Impossibile rimuovere dir: $path\n");
                    $ok = false;
                }
            } else {
                if (!unlink($path)) {
                    fwrite(STDERR, "  Impossibile rimuovere file: $path\n");
                    $ok = false;
                }
            }
        }

        return $ok;
    } catch (Throwable $e) {
        fwrite(STDERR, "  Errore: " . $e->getMessage() . "\n");
        return false;
    }
}
