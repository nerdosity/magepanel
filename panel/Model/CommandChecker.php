<?php
declare(strict_types=1);

/**
 * CommandChecker — detects binary availability without exec/shell_exec.
 *
 * Uses is_executable() on PATH entries so it never spawns a subprocess.
 * Also detects the host package manager to provide install hints.
 */
class CommandChecker
{
    /**
     * Install hints: binary → [package-manager → command].
     * 'generic' is shown when the host PM cannot be detected.
     */
    private const HINTS = [
        'php'      => [
            'apt'   => 'apt-get install php-cli',
            'dnf'   => 'dnf install php-cli',
            'yum'   => 'yum install php-cli',
            'brew'  => 'brew install php',
            'generic' => 'https://www.php.net/downloads',
        ],
        'find'     => [
            'apt'   => 'apt-get install findutils',
            'dnf'   => 'dnf install findutils',
            'yum'   => 'yum install findutils',
            'brew'  => 'brew install findutils',
        ],
        'grep'     => [
            'apt'   => 'apt-get install grep',
            'dnf'   => 'dnf install grep',
            'yum'   => 'yum install grep',
            'brew'  => 'brew install grep',
        ],
        'df'       => [
            'apt'   => 'apt-get install coreutils',
            'dnf'   => 'dnf install coreutils',
            'yum'   => 'yum install coreutils',
            'brew'  => 'brew install coreutils',
        ],
        'git'      => [
            'apt'   => 'apt-get install git',
            'dnf'   => 'dnf install git',
            'yum'   => 'yum install git',
            'brew'  => 'brew install git',
        ],
        'composer' => [
            'generic' => 'curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer',
        ],
        'node'     => [
            'apt'   => 'apt-get install nodejs',
            'dnf'   => 'dnf install nodejs',
            'yum'   => 'yum install nodejs',
            'brew'  => 'brew install node',
            'generic' => 'https://nodejs.org/en/download/',
        ],
        'npm'      => [
            'apt'   => 'apt-get install npm',
            'dnf'   => 'dnf install npm',
            'yum'   => 'yum install npm',
            'brew'  => 'brew install npm',
        ],
        'rsync'    => [
            'apt'   => 'apt-get install rsync',
            'dnf'   => 'dnf install rsync',
            'yum'   => 'yum install rsync',
            'brew'  => 'brew install rsync',
        ],
        'tar'      => [
            'apt'   => 'apt-get install tar',
            'dnf'   => 'dnf install tar',
            'yum'   => 'yum install tar',
            'brew'  => 'brew install gnu-tar',
        ],
        'unzip'    => [
            'apt'   => 'apt-get install unzip',
            'dnf'   => 'dnf install unzip',
            'yum'   => 'yum install unzip',
            'brew'  => 'brew install unzip',
        ],
        'curl'     => [
            'apt'   => 'apt-get install curl',
            'dnf'   => 'dnf install curl',
            'yum'   => 'yum install curl',
            'brew'  => 'brew install curl',
        ],
        'wget'     => [
            'apt'   => 'apt-get install wget',
            'dnf'   => 'dnf install wget',
            'yum'   => 'yum install wget',
            'brew'  => 'brew install wget',
        ],
    ];

    /** Cache so we scan PATH only once per request. */
    private static array $cache = [];

    /** Detected package manager (lazy). */
    private static ?string $pm = null;

    // ----------------------------------------------------------------

    /**
     * Check if a single binary is available on the system PATH.
     * No subprocess is spawned — pure filesystem stat via is_executable().
     */
    public static function available(string $binary): bool
    {
        if (isset(self::$cache[$binary])) {
            return self::$cache[$binary];
        }

        $pathEnv = getenv('PATH') ?: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';
        $sep     = PHP_OS_FAMILY === 'Windows' ? ';' : ':';

        foreach (explode($sep, $pathEnv) as $dir) {
            $dir = rtrim($dir, '/\\');
            if ($dir === '') continue;
            $full = $dir . DIRECTORY_SEPARATOR . $binary;
            if (is_file($full) && is_executable($full)) {
                return self::$cache[$binary] = true;
            }
        }

        return self::$cache[$binary] = false;
    }

    /**
     * Check multiple binaries at once.
     * Returns an array keyed by binary name:
     *   ['ok' => bool, 'install' => string]
     */
    public static function checkAll(array $binaries): array
    {
        $pm     = self::detectPackageManager();
        $result = [];

        foreach ($binaries as $bin) {
            $ok   = self::available($bin);
            $hint = '';

            if (!$ok) {
                $hints  = self::HINTS[$bin] ?? [];
                $hint   = $hints[$pm] ?? $hints['generic'] ?? '';
                if ($hint === '' && !empty($hints)) {
                    $hint = reset($hints); // first available PM hint
                }
            }

            $result[$bin] = ['ok' => $ok, 'install' => $hint];
        }

        return $result;
    }

    /**
     * Detect the host package manager by checking for known executables.
     */
    public static function detectPackageManager(): string
    {
        if (self::$pm !== null) {
            return self::$pm;
        }

        $candidates = [
            'apt'  => ['/usr/bin/apt-get', '/usr/bin/apt'],
            'dnf'  => ['/usr/bin/dnf'],
            'yum'  => ['/usr/bin/yum'],
            'brew' => ['/usr/local/bin/brew', '/opt/homebrew/bin/brew'],
            'apk'  => ['/sbin/apk'],            // Alpine
            'zypper' => ['/usr/bin/zypper'],    // openSUSE
            'pacman' => ['/usr/bin/pacman'],    // Arch
        ];

        foreach ($candidates as $pm => $paths) {
            foreach ($paths as $path) {
                if (is_executable($path)) {
                    return self::$pm = $pm;
                }
            }
        }

        return self::$pm = 'generic';
    }
}
