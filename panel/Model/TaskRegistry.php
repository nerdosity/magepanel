<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * Task Registry — loads task definitions and groups them.
 */
class TaskRegistry
{
    /** @var array<string, array{label: string, cmd: string, group: string}> */
    private array $tasks;

    public function __construct(array $tasks)
    {
        $this->tasks = $tasks;
    }

    /**
     * Get a single task by ID. Returns null if not found.
     */
    public function get(string $id): ?array
    {
        return $this->tasks[$id] ?? null;
    }

    /**
     * Return all tasks.
     */
    public function all(): array
    {
        return $this->tasks;
    }

    /**
     * Return tasks grouped by 'group' key.
     * Groups starting with '_' are internal (not shown as checkboxes).
     */
    public function grouped(): array
    {
        $groups = [];
        foreach ($this->tasks as $id => $task) {
            $group = $task['group'] ?? 'Altro';
            if (str_starts_with($group, '_')) continue; // internal tasks
            $groups[$group][$id] = $task;
        }
        return $groups;
    }

    /**
     * Check that a task ID is valid (prevents arbitrary command injection via task param).
     */
    public function isValid(string $id): bool
    {
        return isset($this->tasks[$id]);
    }
}
