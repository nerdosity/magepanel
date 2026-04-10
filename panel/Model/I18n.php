<?php
declare(strict_types=1);

defined('PANEL_ROOT') || exit;

/**
 * Lightweight i18n — .po file parser with auto-detection.
 *
 * Default language is Italian (hardcoded in PHP/JS).
 * Additional languages are loaded from panel/locale/{code}/messages.po
 */
class I18n
{
    private static ?self $instance = null;

    private string $locale;
    private array  $messages = [];
    private array  $available = [];
    private string $localeDir;

    private function __construct(string $localeDir, string $locale)
    {
        $this->localeDir = $localeDir;
        $this->available = $this->detectLocales();
        $this->locale    = isset($this->available[$locale]) ? $locale : 'it_IT';
        $this->loadPo($this->locale);
    }

    public static function init(string $localeDir, string $locale): self
    {
        self::$instance = new self($localeDir, $locale);
        return self::$instance;
    }

    public static function get(): self
    {
        if (!self::$instance) {
            throw new \RuntimeException('I18n not initialized. Call I18n::init() first.');
        }
        return self::$instance;
    }

    /** Translate a string. If no translation found, return original (Italian). */
    public function translate(string $msgid): string
    {
        if ($this->locale === 'it_IT') {
            return $msgid;
        }
        return $this->messages[$msgid] ?? $msgid;
    }

    /** Current locale code */
    public function getLocale(): string
    {
        return $this->locale;
    }

    /** Available locales: ['it_IT' => 'Italiano', 'en_US' => 'English', ...] */
    public function getAvailable(): array
    {
        return $this->available;
    }

    /** Export all translations as JSON for JS-side usage */
    public function toJson(): string
    {
        return json_encode($this->messages, JSON_UNESCAPED_UNICODE);
    }

    // ─── internal ────────────────────────────────────────────

    private function detectLocales(): array
    {
        // Italian is always the default (source language)
        $locales = ['it_IT' => 'Italiano'];

        if (!is_dir($this->localeDir)) {
            return $locales;
        }

        foreach (scandir($this->localeDir) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $poFile = $this->localeDir . '/' . $entry . '/messages.po';
            if (is_file($poFile)) {
                $label = $this->extractLanguageName($poFile, $entry);
                $locales[$entry] = $label;
            }
        }

        return $locales;
    }

    private function extractLanguageName(string $poFile, string $fallback): string
    {
        // Try to read "Language-Name:" header from .po file
        $fp = fopen($poFile, 'r');
        if (!$fp) return $fallback;
        $lines = 0;
        while (($line = fgets($fp)) !== false && $lines < 30) {
            if (preg_match('/^"Language-Name:\s*(.+?)\\\\n"/', $line, $m)) {
                fclose($fp);
                return $m[1];
            }
            $lines++;
        }
        fclose($fp);
        return $fallback;
    }

    private function loadPo(string $locale): void
    {
        $file = $this->localeDir . '/' . $locale . '/messages.po';
        if (!is_file($file)) return;

        $content = file_get_contents($file);
        if ($content === false) return;

        // Simple .po parser: extract msgid/msgstr pairs
        $msgid = null;
        $msgstr = null;
        $current = null;

        foreach (explode("\n", $content) as $line) {
            $line = rtrim($line);

            if (preg_match('/^msgid\s+"(.*)"$/', $line, $m)) {
                // Save previous pair
                if ($msgid !== null && $msgid !== '' && $msgstr !== null && $msgstr !== '') {
                    $this->messages[$msgid] = $msgstr;
                }
                $msgid = $this->unescapePo($m[1]);
                $msgstr = null;
                $current = 'msgid';
            } elseif (preg_match('/^msgstr\s+"(.*)"$/', $line, $m)) {
                $msgstr = $this->unescapePo($m[1]);
                $current = 'msgstr';
            } elseif (preg_match('/^"(.*)"$/', $line, $m)) {
                // Continuation line
                if ($current === 'msgid') {
                    $msgid .= $this->unescapePo($m[1]);
                } elseif ($current === 'msgstr') {
                    $msgstr .= $this->unescapePo($m[1]);
                }
            } elseif (trim($line) === '' || $line[0] === '#') {
                // Empty line or comment — save pending pair
                if ($msgid !== null && $msgid !== '' && $msgstr !== null && $msgstr !== '') {
                    $this->messages[$msgid] = $msgstr;
                }
                $msgid = null;
                $msgstr = null;
                $current = null;
            }
        }

        // Save last pair
        if ($msgid !== null && $msgid !== '' && $msgstr !== null && $msgstr !== '') {
            $this->messages[$msgid] = $msgstr;
        }
    }

    private function unescapePo(string $s): string
    {
        return str_replace(
            ['\\n', '\\"', '\\\\'],
            ["\n",  '"',   '\\'],
            $s
        );
    }
}

/** Global translate shortcut */
function __(string $msgid): string
{
    return I18n::get()->translate($msgid);
}
