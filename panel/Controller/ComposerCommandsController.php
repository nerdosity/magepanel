<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * ComposerCommandsController — returns the Composer command list as JSON,
 * grouped by namespace.
 *
 * Uses: composer list --format=json
 */
class ComposerCommandsController extends AbstractController
{
    public function handle(): never
    {
        $this->requireAuth();

        $cmd = 'cd ' . escapeshellarg(MAGENTO_ROOT)
             . ' && composer list --format=json 2>&1';

        $proc = proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);

        if (!is_resource($proc)) {
            $this->json(['error' => 'Impossibile avviare composer'], 500);
        }

        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        proc_close($proc);

        $data = json_decode($output, true);

        if (!is_array($data) || empty($data['commands'])) {
            $this->json(['error' => 'Output non valido'], 500);
        }

        // Group by namespace (first segment before ':')
        $grouped = [];
        foreach ($data['commands'] as $cmd) {
            $name = $cmd['name'] ?? '';
            if ($name === '' || $name === 'help' || $name === 'list') {
                continue;
            }
            $ns = str_contains($name, ':') ? explode(':', $name, 2)[0] : '_generale';
            $grouped[$ns][] = [
                'name' => $name,
                'desc' => $cmd['description'] ?? '',
            ];
        }

        ksort($grouped);

        $this->json(['groups' => $grouped]);
    }
}
