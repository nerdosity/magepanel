<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * ListCommandsController — returns a CLI command list as JSON, grouped by namespace.
 * Handles both Magento (bin/magento) and Composer command lists.
 */
class ListCommandsController extends SseController
{
    private string $binary;

    public function __construct(bool $authenticated, string $binary = 'php bin/magento')
    {
        parent::__construct($authenticated);
        $this->binary = $binary;
    }

    public function handle(): never
    {
        $this->requireAuth();

        $cmd = $this->cdRoot() . $this->binary . ' list --format=json 2>&1';
        $output = $this->runSync($cmd);

        $data = json_decode($output, true);

        if (!is_array($data) || empty($data['commands'])) {
            $this->json(['error' => 'Output non valido'], 500);
        }

        $grouped = [];
        foreach ($data['commands'] as $entry) {
            $name = $entry['name'] ?? '';
            if ($name === '' || $name === 'help' || $name === 'list') {
                continue;
            }
            $ns = str_contains($name, ':') ? explode(':', $name, 2)[0] : '_general';
            $grouped[$ns][] = [
                'name' => $name,
                'desc' => $entry['description'] ?? '',
            ];
        }

        ksort($grouped);

        $this->json(['groups' => $grouped]);
    }
}
