# MagePanel — Nerdosity Deploy Panel

**The Magento 2 deploy panel you didn't know you needed.**

A standalone web interface to manage a Magento 2 installation straight from the browser: cache cleanup, DI compilation, static asset deploy, reindex, module management, Magento and Composer commands — all with real-time output and zero SSH required.

---

## What it does

If you manage a Magento 2 site and you're tired of:

- SSH-ing in every time you need to flush the cache
- remembering the exact sequence of commands for a full deploy
- explaining to a colleague how to run `setup:di:compile` without breaking things
- having no visibility into what's happening during a deploy

...MagePanel fixes all of that. Drop it into your Magento root, open it in the browser, and you've got a full operations panel.

## What it actually does

### Predefined tasks (Tasks tab)

Operations grouped by category, one click to run:

| Group | Operations |
|---|---|
| **Cleanup** | Wipe var/cache, pub/static, generated — individually or all at once |
| **Modules & DB** | Enable Nerdosity modules, setup:upgrade |
| **Compilation** | setup:di:compile |
| **Cache** | flush, clean, enable, selective disable (block_html + full_page for dev) |
| **Indexes** | Full reindex, indexer status |
| **Mode** | Switch production/developer, show current mode |
| **Info** | Module status, cron:run, system info |

### One-click presets (header)

Three buttons for the most common workflows:

- **Full Deploy** — maintenance ON > clean all > enable modules > setup:upgrade > DI compile > cache flush > maintenance OFF
- **Cache** — clean cache dirs + cache flush
- **Compile** — clean generated + DI compile + cache flush

### Static Content Deploy (first tab)

Dedicated form for `setup:static-content:deploy` with selection of:
- **Area**: frontend, adminhtml
- **Themes**: auto-detected from `app/design/frontend/`
- **Locales**: detected from `app/i18n/` + common defaults (it_IT, en_US, en_GB, de_DE, fr_FR, es_ES)

### Magento command browser (Mage nav)

Loads the full list of `bin/magento` commands, grouped by namespace. Pick a command, add optional arguments, run it. Streamed output.

### Composer command browser (Composer nav)

Same thing, for Composer. `require`, `update`, `dump-autoload` — all from the browser.

### Maintenance mode

Maintenance toggle with confirmation modal. The button icon shows a green check when the site is online, a red warning triangle when in maintenance.

### System info in the header (SpaceQuotas)

In the header, next to the language selector:

- **PHP** — major.minor (e.g. 8.3)
- **Magento** — version from `composer.json`
- **Storage** — used/total disk space with a progress bar (teal < 70%, yellow 70-90%, red > 90%)

Clicking the Storage block opens an **interactive modal** with:

- Disk summary (total, used, free) + Magento size
- **Magento hot folders**: var/cache, var/log, var/session, var/page_cache, var/view_preprocessed, generated/code, generated/metadata, pub/static, pub/media — with proportional bars
- **Magento root folders**: all top-level folders (app, vendor, pub, var, etc.) sorted by size

Useful to quickly figure out where disk space is going.

### Console with macOS-style controls

Console header with three colored dots (red/yellow/green):

- **Red** (chevron down) — minimize the console
- **Yellow** (1/3 screen) — default size
- **Green** (chevron up) — maximize to full screen

The active state is automatically disabled. Animated transition between states. Alternatively, drag the resize bar for a custom size.

### Logs / Help switch in the command panel

In the Mage/Composer detail panel, a tab-style switch toggles between:

- **Logs** — streamed output of the executed command
- **Help** — output of `help <command>` (cached)

Help is fetched on demand and cached in memory, switching is instant. Clicking Run automatically returns to the Logs view. If you switch commands while in Help view, the new command's help is loaded automatically.

### Interactive guide mode

**Guide** button (?) in the bottom-left of the drawer. Activates an exploration mode where:

- **Single click** on Guide: explore mode. Help cursor on everything. Click on any documented element to see its explanation tooltip. Click Guide again to exit.
- **Double click** on Guide: step-by-step guided tour with progress bar, "1 of N" counter, Next/Done button, dark overlay with spotlight on the current element.

Guide contents live in `panel/tour.json`, with text translated via `.po` keys. Each step has a CSS selector, a translation key, and a placement (top/bottom/left/right). Support for `each: true` for dynamic expansion (e.g. one tooltip per tab, per task group, per Run button).

Non-documentable elements stay dim, documented ones highlight on mouse hover with an animated teal border.

## How it works

- **Zero external dependencies**: pure PHP, no framework, no npm, no build step. Vanilla JS + CSS on the frontend.
- **Real-time output**: commands run via `proc_open()` and stdout is streamed to the browser using Server-Sent Events (SSE).
- **Session-based authentication**: login with token via POST, then PHP session with secure cookie (HttpOnly, SameSite=Strict). The token never appears in URLs.
- **Cleanup without `rm`**: the cleaner (`panel/bin/clean.php`) uses pure PHP to empty directories — works even on hosting where shell `rm` isn't available.
- **Command interruption**: you can stop a running command. The panel sends SIGTERM to the process.
- **i18n**: Italian UI by default, English translation included. Adding a language = creating a `.po` file.

## Installation

1. Copy the `panel/` folder into the root of your Magento 2 installation:
   ```
   magento-root/
     app/
     bin/
     pub/
     panel/        <-- here
       index.php
       config.php
       ...
   ```

2. Copy `panel/config.php.sample` to `panel/config.php` and set your token:
   ```php
   define('PANEL_TOKEN', getenv('DEPLOY_PANEL_TOKEN') ?: 'YOUR_SECRET_TOKEN');
   ```
   Or set the `DEPLOY_PANEL_TOKEN` environment variable.

3. Configure your web server (see below).

4. Open `https://yoursite.com/panel/index.php` in the browser.

5. Enter the token and you're in.

### Requirements

- PHP 8.1+ with `proc_open()` enabled (must not be in `disable_functions`)
- A working Magento 2 installation
- The web server must be able to execute `panel/index.php`

## Web Server Configuration

### Apache

The panel ships with an `.htaccess` file that protects source files. If you're using Apache with `AllowOverride All` (standard Magento configuration), it works out of the box.

To restrict access to specific IPs, add to your vhost or the panel's `.htaccess`:

```apache
<Directory "/var/www/magento/panel">
    # Authorized IPs only
    <IfModule mod_authz_core.c>
        Require ip 203.0.113.0/24
        Require ip 198.51.100.42
    </IfModule>
</Directory>
```

After changes:
```bash
sudo apachectl configtest && sudo systemctl reload apache2
```

### Nginx

Nginx does not support `.htaccess`. Add this block to your vhost (inside the `server` block):

```nginx
# ── MagePanel ────────────────────────────────────────────
location /panel/ {
    # Optional: restrict to specific IPs
    # allow 203.0.113.0/24;
    # allow 198.51.100.42;
    # deny all;

    # Only index.php and public assets
    location = /panel/index.php {
        fastcgi_pass unix:/run/php/php-fpm.sock;  # adjust to your socket
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /panel/public/ {
        # Serve static CSS/JS
        try_files $uri =404;

        # Block PHP execution in public/
        location ~ \.php$ { deny all; }
    }

    # Block everything else (config, controller, model, view, bin, locale)
    location ~ ^/panel/ {
        deny all;
    }
}
```

After changes:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Alternative: install in `pub/panel/`

If you prefer to place the panel inside Magento's public document root (`pub/`), the panel works just the same. You only need to update `MAGENTO_ROOT` in `config.php`:

```php
// If the panel is in pub/panel/ instead of panel/
define('MAGENTO_ROOT', dirname(__DIR__, 2));  // go up two levels instead of one
```

Resulting structure:
```
magento-root/
  pub/
    panel/          <-- the panel
      index.php
      config.php
      ...
```

This option can be simpler on hosting where the document root is `pub/` and you can't serve content from the Magento root.

## Security

- **Do not expose the panel in production without protection**. Ideally:
  - Restrict access by IP (see configurations above)
  - Use a long, random token (minimum 32 characters)
  - Put `panel/` behind additional HTTP authentication if needed
- `config.php` is in `.gitignore` to avoid committing the token
- Authentication uses PHP sessions — the token never travels in URLs
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are included in every response
- Dangerous Composer commands (`exec`, `run-script`, `global`) are blocked
- The PHP cleaner validates paths to prevent path traversal
- All PHP files (except `index.php`) reject direct access

## Structure

```
panel/
  index.php                  # Front controller + router
  config.php                 # Token, task definitions, PANEL_TITLE (gitignored)
  tour.json                  # Interactive guide definitions
  .htaccess                  # Apache access protection
  bin/clean.php              # PHP-native cleaner
  Controller/
    AbstractController.php   # Auth + response helpers
    SseController.php        # Base class for SSE streaming (DRY)
    DashboardController.php  # UI rendering
    StreamController.php     # SSE for predefined tasks
    StaticDeployController.php
    RunCommandController.php # SSE for arbitrary Magento commands
    RunComposerController.php
    ListCommandsController.php # Magento/Composer command list (JSON)
    DetectController.php     # System info (JSON)
    DiskInfoController.php   # Detailed storage info (JSON)
  Model/
    TaskRegistry.php         # Task registry from config.php
    MagentoInfo.php          # Theme and locale scanner
    CommandChecker.php       # Binary availability checker on PATH
    I18n.php                 # .po parser + __() function
  View/
    dashboard.php            # Main HTML
    login.php                # Login page
  public/
    panel.js                 # Frontend JS (vanilla)
    panel.css                # Styles (Komodor/Okteto dark theme)
    .htaccess                # Allows serving CSS/JS, blocks PHP
  locale/
    it_IT/messages.po        # Italian (source language)
    en_US/messages.po        # English
```

## Adding a task

Add an entry to the array in `config.php`:

```php
'my_task' => [
    'label'    => 'My task',
    'cmd'      => 'php bin/magento my:custom:command',
    'group'    => 'My group',
    'requires' => ['php'],
],
```

Then add the label translation in each `.po` file under `locale/`.

## Adding a language

1. Create `panel/locale/{code}/messages.po` (e.g. `fr_FR/messages.po`)
2. Add the header `"Language-Name: Francais\n"` in the file
3. Translate the `msgstr` values — the `msgid` keys are the original Italian strings
4. The language automatically shows up in the selector

## Customizing the title

The panel title (default `MagePanel`) is configured in `config.php`:

```php
define('PANEL_TITLE', getenv('DEPLOY_PANEL_TITLE') ?: 'MagePanel');
```

PHP automatically splits words (camelCase or space) and colors the first white and the second teal. Examples: `MagePanel` becomes `Mage`+`Panel`, `Deploy Panel` becomes `Deploy`+`Panel`.

## Adding a guide step

Edit `panel/tour.json`, add an entry:

```json
{
    "target": "#my-element",
    "text": "tour_my_step",
    "placement": "bottom"
}
```

Then add the `tour_my_step` translation in each `.po` file. If the selector matches multiple elements at once, add `"each": true` and each match will get its own tooltip.

---

Made with mass amounts of caffeine by **Nerdosity**.

## Liked my work?

Buy me a coffee: [paypal.me/giovafedele](https://paypal.me/giovafedele)

[![Donate](https://img.shields.io/badge/PayPal-Buy%20me%20a%20coffee-00457C?logo=paypal&logoColor=white)](https://paypal.me/giovafedele)
