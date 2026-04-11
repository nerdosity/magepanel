<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * SseController — base class for controllers that stream output via SSE.
 *
 * Provides: startSse(), send(), sendDone(), classify(), streamProcess(),
 * validateCommandName(), appendEscapedArgs().
 */
abstract class SseController extends AbstractController
{
    protected const STOP_FILE = '/var/.panel_stop';
    protected const CMD_NAME_REGEX = '/^[a-z][a-z0-9:_\-]*$/';

    // ── SSE protocol ─────────────────────────────────────────

    protected function startSse(): void
    {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('X-Accel-Buffering: no');
        header('Connection: keep-alive');
    }

    protected function send(string $text, string $type): void
    {
        echo 'data: ' . json_encode(['line' => $text, 'type' => $this->safeType($type)]) . "\n\n";
        flush();
    }

    protected function sendDone(int $exitCode): never
    {
        echo "event: done\ndata: {$exitCode}\n\n";
        flush();
        exit;
    }

    // ── Output classification ────────────────────────────────

    protected function classify(string $text): string
    {
        $lower = strtolower($text);

        if (str_contains($lower, 'error')    ||
            str_contains($lower, 'fatal')    ||
            str_contains($lower, 'failed')   ||
            str_contains($lower, 'exception')
        ) {
            return 'error';
        }

        if (str_contains($lower, 'warning') || str_contains($lower, 'warn')) {
            return 'warn';
        }

        if (str_contains($lower, '[ok]')     ||
            str_contains($lower, 'success')  ||
            str_contains($lower, 'done')     ||
            str_contains($lower, 'generated')
        ) {
            return 'ok';
        }

        if (str_starts_with($text, '[') || str_starts_with($text, '>>') || str_starts_with($text, '**')) {
            return 'info';
        }

        return 'output';
    }

    // ── Process streaming ────────────────────────────────────

    /**
     * Run a shell command via proc_open and stream output as SSE.
     * Handles non-blocking reads, stop-file, timeout, and client disconnect.
     * Returns the exit code.
     */
    protected function streamProcess(string $cmd, int $timeoutSeconds = 120): int
    {
        $proc = proc_open(
            $cmd,
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes
        );

        if (!is_resource($proc)) {
            $this->send('Impossibile avviare il processo', 'error');
            $this->sendDone(1);
        }

        fclose($pipes[0]);
        fclose($pipes[2]); // stderr merged via 2>&1

        stream_set_blocking($pipes[1], false);

        $stopFile = MAGENTO_ROOT . self::STOP_FILE;
        @unlink($stopFile);

        $buffer  = '';
        $timeout = time() + $timeoutSeconds;

        while (time() < $timeout) {
            // Stop signal
            if (file_exists($stopFile)) {
                @unlink($stopFile);
                proc_terminate($proc, 15);
                usleep(200000);
                if (is_resource($proc)) proc_terminate($proc, 9);
                $this->send('Comando interrotto (SIGTERM)', 'warn');
                break;
            }

            // Client disconnect
            if (connection_aborted()) {
                proc_terminate($proc, 15);
                break;
            }

            $status = proc_get_status($proc);

            $chunk = fread($pipes[1], 8192);
            if ($chunk !== false && $chunk !== '') {
                $buffer .= $chunk;
                while (($nl = strpos($buffer, "\n")) !== false) {
                    $text = rtrim(substr($buffer, 0, $nl));
                    $buffer = substr($buffer, $nl + 1);
                    if ($text !== '') {
                        $this->send($text, $this->classify($text));
                    }
                }
            }

            if (!$status['running']) {
                break;
            }

            usleep(50000); // 50ms polling
        }

        // Flush remaining buffer
        $remainder = stream_get_contents($pipes[1]);
        if ($remainder !== false && $remainder !== '') {
            $buffer .= $remainder;
        }
        foreach (explode("\n", $buffer) as $line) {
            $text = rtrim($line);
            if ($text !== '') {
                $this->send($text, $this->classify($text));
            }
        }

        fclose($pipes[1]);
        return proc_close($proc);
    }

    /**
     * Send the exit-code summary and done event.
     */
    protected function finishStream(int $exitCode): never
    {
        $this->send(
            $exitCode === 0
                ? '✓ completed (exit 0)'
                : '✗ failed (exit ' . $exitCode . ')',
            $exitCode === 0 ? 'ok' : 'error'
        );
        $this->sendDone($exitCode);
    }

    // ── Input validation helpers ─────────────────────────────

    /**
     * Validate a CLI command name. Sends SSE error and exits if invalid.
     */
    protected function validateCommandName(string $name): void
    {
        if (!preg_match(self::CMD_NAME_REGEX, $name)) {
            $this->startSse();
            $this->send('Nome comando non valido', 'error');
            $this->sendDone(1);
        }
    }

    /**
     * Append space-separated args to a command string, individually escaped.
     */
    protected function appendEscapedArgs(string $cmd, string $args): string
    {
        if ($args !== '') {
            foreach (preg_split('/\s+/', $args) as $token) {
                if ($token !== '') {
                    $cmd .= ' ' . escapeshellarg($token);
                }
            }
        }
        return $cmd . ' 2>&1';
    }

    /**
     * Build a command prefixed with cd to MAGENTO_ROOT.
     */
    protected function cdRoot(): string
    {
        return 'cd ' . escapeshellarg(MAGENTO_ROOT) . ' && ';
    }

    /**
     * Run a command synchronously and return the full stdout.
     */
    protected function runSync(string $cmd): string
    {
        $proc = proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w']], $pipes);

        if (!is_resource($proc)) {
            return '';
        }

        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        proc_close($proc);

        return $output ?: '';
    }
}
