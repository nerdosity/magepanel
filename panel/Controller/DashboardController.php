<?php
declare(strict_types=1);

/**
 * DashboardController — renders the main panel HTML.
 * If not authenticated, renders the login view instead.
 */
class DashboardController extends AbstractController
{
    private TaskRegistry $registry;
    private MagentoInfo  $info;

    public function __construct(string $token, TaskRegistry $registry, MagentoInfo $info)
    {
        parent::__construct($token);
        $this->registry = $registry;
        $this->info     = $info;
    }

    public function handle(): never
    {
        if (!$this->authenticated) {
            require PANEL_ROOT . '/View/login.php';
            exit;
        }

        $grouped = $this->registry->grouped();
        $token   = $this->token;
        $themes  = $this->info->getFrontendThemes();
        $locales = $this->info->getAvailableLocales();
        $i18n    = I18n::get();

        require PANEL_ROOT . '/View/dashboard.php';
        exit;
    }
}
