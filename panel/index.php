<?php
declare(strict_types=1);

// ================================================================
//  Nerdosity Deploy Panel — Front Controller / Router
// ================================================================

define('PANEL_ROOT', __DIR__);

// config.php defines constants (PANEL_TOKEN, MAGENTO_ROOT, PANEL_VERSION)
// and returns the task definitions array.
$taskDefs = require PANEL_ROOT . '/config.php';

require_once PANEL_ROOT . '/Model/TaskRegistry.php';
require_once PANEL_ROOT . '/Model/MagentoInfo.php';
require_once PANEL_ROOT . '/Model/CommandChecker.php';
require_once PANEL_ROOT . '/Model/I18n.php';
require_once PANEL_ROOT . '/Controller/AbstractController.php';

// i18n: detect locale from ?lang= parameter or cookie
$requestedLocale = $_GET['lang'] ?? $_COOKIE['panel_lang'] ?? 'it_IT';
$i18n = I18n::init(PANEL_ROOT . '/locale', $requestedLocale);
// Persist locale choice in cookie (1 year)
if (isset($_GET['lang']) && !headers_sent()) {
    setcookie('panel_lang', $i18n->getLocale(), time() + 86400 * 365, '/');
}

$registry = new TaskRegistry($taskDefs);
$magentoInfo = new MagentoInfo(MAGENTO_ROOT);

$action = $_GET['action'] ?? 'dashboard';
$token  = $_GET['token'] ?? $_POST['token'] ?? '';

switch ($action) {

    case 'stream':
        require_once PANEL_ROOT . '/Controller/StreamController.php';
        (new StreamController($token, $registry))->handle($_GET['task'] ?? '');
        break;

    case 'detect':
        require_once PANEL_ROOT . '/Controller/DetectController.php';
        (new DetectController($token, $magentoInfo))->handle();
        break;

    case 'static':
        require_once PANEL_ROOT . '/Controller/StaticDeployController.php';
        (new StaticDeployController($token, $magentoInfo))->handle();
        break;

    case 'commands':
        require_once PANEL_ROOT . '/Controller/CommandsController.php';
        (new CommandsController($token))->handle();
        break;

    case 'run':
        require_once PANEL_ROOT . '/Controller/RunCommandController.php';
        (new RunCommandController($token))->handle();
        break;

    case 'composer_commands':
        require_once PANEL_ROOT . '/Controller/ComposerCommandsController.php';
        (new ComposerCommandsController($token))->handle();
        break;

    case 'run_composer':
        require_once PANEL_ROOT . '/Controller/RunComposerController.php';
        (new RunComposerController($token))->handle();
        break;

    case 'stop_cmd':
        // Write stop flag — the running command checks for this file
        require_once PANEL_ROOT . '/Controller/AbstractController.php';
        $ctrl = new class($token) extends AbstractController {
            public function handle(): never {
                $this->requireAuth();
                file_put_contents(MAGENTO_ROOT . '/var/.panel_stop', '1');
                $this->json(['ok' => true]);
            }
        };
        $ctrl->handle();
        break;

    default:
        require_once PANEL_ROOT . '/Controller/DashboardController.php';
        (new DashboardController($token, $registry, $magentoInfo))->handle();
        break;
}
