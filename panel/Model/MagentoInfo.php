<?php
declare(strict_types=1);

/**
 * MagentoInfo — scans the Magento filesystem for installed themes and locales.
 */
class MagentoInfo
{
    private string $root;

    /** Locales always offered as options even if no pack is installed */
    private const COMMON_LOCALES = [
        'it_IT', 'en_US', 'en_GB', 'de_DE', 'fr_FR', 'es_ES',
    ];

    public function __construct(string $root)
    {
        $this->root = $root;
    }

    /**
     * Return frontend themes found in app/design/frontend/Vendor/Theme/theme.xml
     * Result: ['Smartwave/porto', 'Magento/luma', ...]
     */
    public function getFrontendThemes(): array
    {
        $themes = [];
        $base   = $this->root . '/app/design/frontend';

        if (!is_dir($base)) {
            return $themes;
        }

        foreach (glob($base . '/*/*/theme.xml') ?: [] as $xml) {
            $rel   = ltrim(str_replace($base, '', $xml), '/');
            $parts = explode('/', $rel);
            if (count($parts) >= 3) {
                $themes[] = $parts[0] . '/' . $parts[1];
            }
        }

        return array_unique($themes);
    }

    /**
     * Return locales found in app/i18n/Vendor/locale.csv files,
     * merged with COMMON_LOCALES.
     */
    public function getAvailableLocales(): array
    {
        $locales = self::COMMON_LOCALES;
        $i18n    = $this->root . '/app/i18n';

        if (is_dir($i18n)) {
            foreach (glob($i18n . '/*/*.csv') ?: [] as $csv) {
                $locale = basename($csv, '.csv');
                if (preg_match('/^[a-z]{2}_[A-Z]{2}$/', $locale)) {
                    $locales[] = $locale;
                }
            }
        }

        $locales = array_unique($locales);
        sort($locales);

        return $locales;
    }
}
