<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * Base controller: authentication and response helpers.
 */
abstract class AbstractController
{
    protected bool $authenticated;

    public function __construct(bool $authenticated)
    {
        $this->authenticated = $authenticated;
    }

    protected function requireAuth(): void
    {
        if (!$this->authenticated) {
            $this->forbidden();
        }
    }

    protected function forbidden(): never
    {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    protected function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Sanitize a stream type string to a safe CSS class suffix.
     */
    protected function safeType(string $type): string
    {
        return preg_replace('/[^a-z\-]/', '', $type) ?: 'output';
    }
}
