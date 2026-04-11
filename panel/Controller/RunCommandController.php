<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * RunCommandController — runs any Magento CLI command via SSE.
 */
class RunCommandController extends SseController
{
    public function handle(): never
    {
        $this->requireAuth();

        $name = trim($_GET['name'] ?? '');
        $args = trim($_GET['args'] ?? '');

        $this->validateCommandName($name);

        $cmd = $this->cdRoot()
             . 'php bin/magento ' . escapeshellarg($name)
             . ' --no-interaction --no-ansi';
        $cmd = $this->appendEscapedArgs($cmd, $args);

        $this->startSse();
        $this->send('▶ bin/magento ' . $name . ($args ? ' ' . $args : ''), 'header');

        $exitCode = $this->streamProcess($cmd, 120);
        $this->finishStream($exitCode);
    }
}
