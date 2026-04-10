<?php
declare(strict_types=1);

/**
 * StreamController — runs a task and streams output as Server-Sent Events.
 *
 * SSE protocol:
 *   data: {"line":"...", "type":"output|ok|error|warn|header"}\n\n
 *   event: done\ndata: <exit_code>\n\n
 */
class StreamController extends AbstractController
{
    private TaskRegistry $registry;

    public function __construct(string $token, TaskRegistry $registry)
    {
        parent::__construct($token);
        $this->registry = $registry;
    }

    public function handle(string $taskId): never
    {
        $this->requireAuth();

        if (!$this->registry->isValid($taskId)) {
            $this->startSse();
            $this->send('Task non trovato: ' . $taskId, 'error');
            $this->sendDone(1);
        }

        $task = $this->registry->get($taskId);
        // 2>&1: unifica stderr → stdout (causa principale dell'output mancante)
        $cmd  = 'cd ' . escapeshellarg(MAGENTO_ROOT) . ' && ' . $task['cmd'] . ' 2>&1';

        $this->startSse();
        $this->send('▶ ' . $task['label'], 'header');

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
        // stderr è già unito a stdout via 2>&1; chiudiamo il descrittore separato
        fclose($pipes[2]);

        // Lettura non-bloccante: evita freeze se il processo è silenzioso
        stream_set_blocking($pipes[1], false);

        $buf = '';
        while (true) {
            $status = proc_get_status($proc);

            // Leggi tutto ciò che è disponibile
            $chunk = fread($pipes[1], 8192);
            if ($chunk !== false && $chunk !== '') {
                $buf .= $chunk;
                // Emetti righe complete
                while (($nl = strpos($buf, "\n")) !== false) {
                    $text = rtrim(substr($buf, 0, $nl));
                    $buf  = substr($buf, $nl + 1);
                    if ($text !== '') {
                        $this->send($text, $this->classify($text));
                    }
                }
            }

            if (!$status['running']) {
                break;
            }

            usleep(50000); // 50 ms polling
        }

        // Svuota buffer residuo
        $remainder = stream_get_contents($pipes[1]);
        if ($remainder !== false && $remainder !== '') {
            $buf .= $remainder;
        }
        foreach (explode("\n", $buf) as $line) {
            $text = rtrim($line);
            if ($text !== '') {
                $this->send($text, $this->classify($text));
            }
        }

        fclose($pipes[1]);
        $exitCode = proc_close($proc);

        $this->send(
            $exitCode === 0 ? '[OK] Completato (exit 0)' : '[ERRORE] Processo terminato con exit ' . $exitCode,
            $exitCode === 0 ? 'ok' : 'error'
        );
        $this->sendDone($exitCode);
    }

    // ----------------------------------------------------------------

    private function startSse(): void
    {
        // Disable output buffering
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('X-Accel-Buffering: no');
        header('Connection: keep-alive');
    }

    private function send(string $text, string $type): void
    {
        $payload = json_encode(['line' => $text, 'type' => $this->safeType($type)]);
        echo 'data: ' . $payload . "\n\n";
        flush();
    }

    private function sendDone(int $exitCode): never
    {
        echo 'event: done' . "\n";
        echo 'data: ' . $exitCode . "\n\n";
        flush();
        exit;
    }

    /**
     * Classify a line of output to a display type.
     */
    private function classify(string $text): string
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
}
