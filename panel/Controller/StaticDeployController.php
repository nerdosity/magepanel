<?php
declare(strict_types=1);

/**
 * StaticDeployController — streams setup:static-content:deploy with
 * user-selected themes, locales and areas.
 *
 * GET params:
 *   themes[]  — e.g. Smartwave/porto  (only themes returned by MagentoInfo)
 *   locales[] — e.g. it_IT, en_US     (validated against /^[a-z]{2}_[A-Z]{2}$/)
 *   areas[]   — frontend | adminhtml
 *   token     — auth token
 */
class StaticDeployController extends AbstractController
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

        $themes  = $this->filterThemes($_GET['themes']  ?? []);
        $locales = $this->filterLocales($_GET['locales'] ?? []);
        $areas   = $this->filterAreas($_GET['areas']    ?? []);

        $this->startSse();

        if (empty($themes) && !in_array('adminhtml', $areas, true)) {
            $this->send('Nessun tema selezionato', 'error');
            $this->sendDone(1);
        }
        if (empty($locales)) {
            $this->send('Nessuna lingua selezionata', 'error');
            $this->sendDone(1);
        }

        // Build command
        $cmd = 'cd ' . escapeshellarg(MAGENTO_ROOT) . ' && php bin/magento setup:static-content:deploy -f';

        foreach ($areas as $area) {
            $cmd .= ' --area ' . escapeshellarg($area);
        }
        foreach ($themes as $theme) {
            $cmd .= ' --theme ' . escapeshellarg($theme);
        }
        foreach ($locales as $locale) {
            $cmd .= ' --language ' . escapeshellarg($locale);
        }
        $cmd .= ' 2>&1';

        $label = 'Static content deploy'
            . ' [' . implode(', ', $areas) . ']'
            . ' — temi: ' . implode(', ', $themes ?: ['(admin)'])
            . ' — lingue: ' . implode(', ', $locales);

        $this->send('▶ ' . $label, 'header');
        $this->send($cmd, 'info');

        $proc = proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);

        if (!is_resource($proc)) {
            $this->send('Impossibile avviare il processo', 'error');
            $this->sendDone(1);
        }

        fclose($pipes[0]);

        while (($line = fgets($pipes[1])) !== false) {
            $text = rtrim($line);
            if ($text === '') continue;
            $this->send($text, $this->classify($text));
        }

        fclose($pipes[1]);
        $exitCode = proc_close($proc);

        $this->send(
            $exitCode === 0 ? '[OK] Completato (exit 0)' : '[ERRORE] Exit ' . $exitCode,
            $exitCode === 0 ? 'ok' : 'error'
        );
        $this->sendDone($exitCode);
    }

    // ----------------------------------------------------------------

    private function filterThemes(mixed $input): array
    {
        if (!is_array($input)) return [];
        $allowed = $this->info->getFrontendThemes();
        return array_values(array_filter(
            $input,
            fn($t) => is_string($t) && in_array($t, $allowed, true)
        ));
    }

    private function filterLocales(mixed $input): array
    {
        if (!is_array($input)) return [];
        return array_values(array_filter(
            $input,
            fn($l) => is_string($l) && preg_match('/^[a-z]{2}_[A-Z]{2}$/', $l)
        ));
    }

    private function filterAreas(mixed $input): array
    {
        if (!is_array($input)) return ['frontend'];
        $valid = array_filter($input, fn($a) => in_array($a, ['frontend', 'adminhtml'], true));
        return empty($valid) ? ['frontend'] : array_values($valid);
    }

    private function startSse(): void
    {
        while (ob_get_level() > 0) ob_end_clean();
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('X-Accel-Buffering: no');
    }

    private function send(string $text, string $type): void
    {
        echo 'data: ' . json_encode(['line' => $text, 'type' => $this->safeType($type)]) . "\n\n";
        flush();
    }

    private function sendDone(int $exitCode): never
    {
        echo "event: done\ndata: {$exitCode}\n\n";
        flush();
        exit;
    }

    private function classify(string $text): string
    {
        $l = strtolower($text);
        if (str_contains($l, 'error') || str_contains($l, 'fatal') || str_contains($l, 'failed')) return 'error';
        if (str_contains($l, 'warning') || str_contains($l, 'warn')) return 'warn';
        if (str_contains($l, '[ok]') || str_contains($l, 'success') || str_contains($l, 'done')) return 'ok';
        if (str_starts_with($text, '[') || str_starts_with($text, '>>')) return 'info';
        return 'output';
    }
}
