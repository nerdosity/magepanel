<?php
declare(strict_types=1);

/**
 * RunCommandController — runs any Magento CLI command via SSE.
 *
 * GET params:
 *   name   — command name, e.g. "cache:clean"  (validated by regex)
 *   args   — optional argument string, e.g. "--type full_page"
 *   token  — auth token
 */
class RunCommandController extends AbstractController
{
    public function handle(): never
    {
        $this->requireAuth();

        $name = trim($_GET['name'] ?? '');
        $args = trim($_GET['args'] ?? '');

        // Validate: command name must be safe Magento CLI format
        if (!preg_match('/^[a-z][a-z0-9:_\-]*$/', $name)) {
            $this->startSse();
            $this->send('Nome comando non valido: ' . $name, 'error');
            $this->sendDone(1);
        }

        // Build command — each arg token is individually escaped
        // --no-interaction prevents magento from waiting for input
        // --no-ansi prevents color codes in output
        $cmd = 'cd ' . escapeshellarg(MAGENTO_ROOT)
             . ' && php bin/magento ' . escapeshellarg($name)
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
        $this->send('▶ bin/magento ' . $name . ($args ? ' ' . $args : ''), 'header');

        $proc = proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);

        if (!is_resource($proc)) {
            $this->send('Impossibile avviare il processo', 'error');
            $this->sendDone(1);
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);

        $stopFile = MAGENTO_ROOT . '/var/.panel_stop';
        @unlink($stopFile); // Clear any stale stop flag

        $buffer = '';
        $timeout = time() + 120; // 2 min max
        while (time() < $timeout) {
            // Check for stop signal
            if (file_exists($stopFile)) {
                @unlink($stopFile);
                proc_terminate($proc, 15); // SIGTERM
                usleep(200000);
                if (is_resource($proc)) proc_terminate($proc, 9); // SIGKILL
                $this->send('Comando interrotto (SIGTERM)', 'warn');
                break;
            }
            // Check if client disconnected
            if (connection_aborted()) {
                proc_terminate($proc, 15);
                break;
            }
            $chunk = fread($pipes[1], 8192);
            if ($chunk === false || ($chunk === '' && feof($pipes[1]))) break;
            if ($chunk === '') { usleep(50000); continue; } // 50ms wait
            $buffer .= $chunk;
            // Send complete lines
            while (($pos = strpos($buffer, "\n")) !== false) {
                $text = rtrim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);
                if ($text === '') continue;
                $this->send($text, $this->classify($text));
            }
        }
        // Send remaining buffer
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
