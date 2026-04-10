<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * RunComposerController — runs any Composer CLI command via SSE.
 *
 * GET params:
 *   name   — command name, e.g. "require", "update"  (validated by regex)
 *   args   — optional argument string, e.g. "vendor/package --dev"
 */
class RunComposerController extends AbstractController
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

        // Validate: command name must be safe CLI format
        if (!preg_match('/^[a-z][a-z0-9:_\-]*$/', $name)) {
            $this->startSse();
            $this->send('Nome comando non valido', 'error');
            $this->sendDone(1);
        }

        // Block commands that allow arbitrary code execution
        if (in_array($name, self::BLOCKED_COMMANDS, true)) {
            $this->startSse();
            $this->send('Comando bloccato per sicurezza: ' . $name, 'error');
            $this->sendDone(1);
        }

        // Build command — each arg token is individually escaped
        // --no-interaction prevents composer from waiting for input
        // --no-ansi prevents color codes in output
        $cmd = 'cd ' . escapeshellarg(MAGENTO_ROOT)
             . ' && composer ' . escapeshellarg($name)
             . ' --no-interaction --no-ansi';

        if ($args !== '') {
            foreach (preg_split('/\s+/', $args) as $token) {
                if ($token !== '') {
                    $cmd .= ' ' . escapeshellarg($token);
                }
            }
        }

        $cmd .= ' 2>&1';

        $this->startSse();
        $this->send('▶ composer ' . $name . ($args ? ' ' . $args : ''), 'header');

        $proc = proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);

        if (!is_resource($proc)) {
            $this->send('Impossibile avviare il processo', 'error');
            $this->sendDone(1);
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);

        $stopFile = MAGENTO_ROOT . '/var/.panel_stop';
        @unlink($stopFile);

        $buffer = '';
        $timeout = time() + 120;
        while (time() < $timeout) {
            if (file_exists($stopFile)) {
                @unlink($stopFile);
                proc_terminate($proc, 15);
                usleep(200000);
                if (is_resource($proc)) proc_terminate($proc, 9);
                $this->send('Comando interrotto (SIGTERM)', 'warn');
                break;
            }
            if (connection_aborted()) {
                proc_terminate($proc, 15);
                break;
            }
            $chunk = fread($pipes[1], 8192);
            if ($chunk === false || ($chunk === '' && feof($pipes[1]))) break;
            if ($chunk === '') { usleep(50000); continue; }
            $buffer .= $chunk;
            while (($pos = strpos($buffer, "\n")) !== false) {
                $text = rtrim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);
                if ($text === '') continue;
                $this->send($text, $this->classify($text));
            }
        }
        if (($text = rtrim($buffer)) !== '') {
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
