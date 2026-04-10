<?php
declare(strict_types=1);

/**
 * DetectController — returns JSON system info (PHP, Magento version, disk usage).
 */
class DetectController extends AbstractController
{
    private MagentoInfo $info;

    public function __construct(string $token, MagentoInfo $info)
    {
        parent::__construct($token);
        $this->info = $info;
    }

    public function handle(): never
    {
        $this->requireAuth();

        $root = MAGENTO_ROOT;

        // PHP version
        $phpVersion = PHP_VERSION;

        // Magento version from composer.json
        $magentoVersion = 'N/A';
        $composerFile   = $root . '/composer.json';
        if (is_readable($composerFile)) {
            $composer = json_decode(file_get_contents($composerFile), true);
            $magentoVersion = $composer['require']['magento/product-community-edition']
                ?? $composer['version']
                ?? 'N/A';
        }

        // Disk free space on Magento root
        $diskFree  = disk_free_space($root);
        $diskTotal = disk_total_space($root);
        $diskUsedPct = $diskTotal > 0
            ? round((1 - $diskFree / $diskTotal) * 100, 1)
            : 0;

        // Maintenance mode
        $maintenance = file_exists($root . '/var/.maintenance.flag');

        // Command availability check
        // Check php and composer — both used by the panel
        $commandsToCheck = ['php', 'composer'];
        $commands = CommandChecker::checkAll($commandsToCheck);
        $packageManager = CommandChecker::detectPackageManager();

        $this->json([
            'php'            => $phpVersion,
            'magento'        => $magentoVersion,
            'disk_free'      => $this->formatBytes((int) $diskFree),
            'disk_total'     => $this->formatBytes((int) $diskTotal),
            'disk_used_pct'  => $diskUsedPct,
            'maintenance'    => $maintenance,
            'root'           => $root,
            'version'        => PANEL_VERSION,
            'themes'         => $this->info->getFrontendThemes(),
            'locales'        => $this->info->getAvailableLocales(),
            'commands'       => $commands,
            'package_manager'=> $packageManager,
        ]);
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 1) . ' GB';
        }
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 1) . ' MB';
        }
        return round($bytes / 1024, 1) . ' KB';
    }
}
