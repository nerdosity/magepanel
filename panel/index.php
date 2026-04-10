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

// ── Security headers (applied to every response) ────────────────
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()");

// ── Session-based authentication ────────────────────────────────
session_name('panel_sid');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    'httponly'  => true,
    'samesite'  => 'Strict',
]);
session_start();

// Login via POST: validate token, set session, redirect to clean URL
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['token'])) {
    if ($_POST['token'] !== '' && hash_equals(PANEL_TOKEN, $_POST['token'])) {
        $_SESSION['authenticated'] = true;
        $_SESSION['auth_time']     = time();
        $redirect = strtok($_SERVER['REQUEST_URI'], '?');
        header('Location: ' . $redirect);
        exit;
    }
}

$authenticated = !empty($_SESSION['authenticated']);

// i18n: detect locale from ?lang= parameter or cookie
$requestedLocale = $_GET['lang'] ?? $_COOKIE['panel_lang'] ?? 'it_IT';
$i18n = I18n::init(PANEL_ROOT . '/locale', $requestedLocale);
// Persist locale choice in cookie (1 year)
if (isset($_GET['lang']) && !headers_sent()) {
    setcookie('panel_lang', $i18n->getLocale(), [
        'expires'  => time() + 86400 * 365,
        'path'     => '/',
        'secure'   => (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
        'httponly'  => true,
        'samesite'  => 'Lax',
    ]);
}

$registry = new TaskRegistry($taskDefs);
$magentoInfo = new MagentoInfo(MAGENTO_ROOT);

$action = $_GET['action'] ?? 'dashboard';

switch ($action) {

    case 'stream':
        require_once PANEL_ROOT . '/Controller/StreamController.php';
        (new StreamController($authenticated, $registry))->handle($_GET['task'] ?? '');
        break;

    case 'detect':
        require_once PANEL_ROOT . '/Controller/DetectController.php';
        (new DetectController($authenticated, $magentoInfo))->handle();
        break;

    case 'static':
        require_once PANEL_ROOT . '/Controller/StaticDeployController.php';
        (new StaticDeployController($authenticated, $magentoInfo))->handle();
        break;

    case 'commands':
        require_once PANEL_ROOT . '/Controller/CommandsController.php';
        (new CommandsController($authenticated))->handle();
        break;

    case 'run':
        require_once PANEL_ROOT . '/Controller/RunCommandController.php';
        (new RunCommandController($authenticated))->handle();
        break;

    case 'composer_commands':
        require_once PANEL_ROOT . '/Controller/ComposerCommandsController.php';
        (new ComposerCommandsController($authenticated))->handle();
        break;

    case 'run_composer':
        require_once PANEL_ROOT . '/Controller/RunComposerController.php';
        (new RunComposerController($authenticated))->handle();
        break;

    case 'stop_cmd':
        // Write stop flag — the running command checks for this file
        $ctrl = new class($authenticated) extends AbstractController {
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
        (new DashboardController($authenticated, $registry, $magentoInfo))->handle();
        break;
}
