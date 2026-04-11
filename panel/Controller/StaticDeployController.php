<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * StaticDeployController — streams setup:static-content:deploy with
 * user-selected themes, locales and areas.
 */
class StaticDeployController extends SseController
{
    private MagentoInfo $info;

    public function __construct(bool $authenticated, MagentoInfo $info)
    {
        parent::__construct($authenticated);
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

        $cmd = $this->cdRoot() . 'php bin/magento setup:static-content:deploy -f';

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

        $exitCode = $this->streamProcess($cmd, 1800);
        $this->finishStream($exitCode);
    }

    // ── Input filters ────────────────────────────────────────

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
}
