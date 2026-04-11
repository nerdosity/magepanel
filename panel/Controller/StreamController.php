<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * StreamController — runs a predefined task by ID and streams output as SSE.
 */
class StreamController extends SseController
{
    private TaskRegistry $registry;

    public function __construct(bool $authenticated, TaskRegistry $registry)
    {
        parent::__construct($authenticated);
        $this->registry = $registry;
    }

    public function handle(string $taskId): never
    {
        $this->requireAuth();

        if (!$this->registry->isValid($taskId)) {
            $this->startSse();
            $this->send('Task non trovato', 'error');
            $this->sendDone(1);
        }

        $task = $this->registry->get($taskId);
        $cmd  = $this->cdRoot() . $task['cmd'] . ' 2>&1';

        $this->startSse();
        $this->send('▶ ' . $task['label'], 'header');

        $exitCode = $this->streamProcess($cmd, 900);
        $this->finishStream($exitCode);
    }
}
