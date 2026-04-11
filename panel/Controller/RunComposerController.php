<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * RunComposerController — runs any Composer CLI command via SSE.
 */
class RunComposerController extends SseController
{
    /** Commands that can execute arbitrary code — blocked for safety */
    private const BLOCKED_COMMANDS = [
        'exec', 'run-script', 'run', 'global', 'create-project',
    ];

    public function handle(): never
    {
        $this->requireAuth();

        $name = trim($_GET['name'] ?? '');
        $args = trim($_GET['args'] ?? '');

        $this->validateCommandName($name);

        if (in_array($name, self::BLOCKED_COMMANDS, true)) {
            $this->startSse();
            $this->send('Comando bloccato per sicurezza: ' . $name, 'error');
            $this->sendDone(1);
        }

        $cmd = $this->cdRoot()
             . 'composer ' . escapeshellarg($name)
             . ' --no-interaction --no-ansi';
        $cmd = $this->appendEscapedArgs($cmd, $args);

        $this->startSse();
        $this->send('▶ composer ' . $name . ($args ? ' ' . $args : ''), 'header');

        $exitCode = $this->streamProcess($cmd, 120);
        $this->finishStream($exitCode);
    }
}
