# MagePanel — Nerdosity Deploy Panel

**Il pannello di deploy per Magento 2 che non sapevi di volere.**

Un'interfaccia web standalone che ti permette di gestire un'installazione Magento 2 direttamente dal browser: pulizia cache, compilazione DI, deploy degli asset statici, reindex, gestione moduli, comandi Magento e Composer — tutto con output in tempo reale e senza toccare il terminale del server.

---

## A che serve

Se gestisci un sito Magento 2 e sei stanco di:

- connetterti in SSH ogni volta che devi flushare la cache
- ricordarti la sequenza esatta di comandi per un deploy completo
- spiegare a un collega come si fa `setup:di:compile` senza fare danni
- non avere visibilita su cosa sta succedendo durante un deploy

...MagePanel risolve tutto questo. Lo butti nella root di Magento, lo apri nel browser, e hai un pannello operativo completo.

## Cosa fa in concreto

### Task predefiniti (tab "Tasks")

Operazioni raggruppate per categoria, eseguibili con un click:

| Gruppo | Operazioni |
|---|---|
| **Pulizia** | Svuota var/cache, pub/static, generated — singolarmente o tutto insieme |
| **Moduli & DB** | Abilita i moduli Nerdosity, setup:upgrade |
| **Compilazione** | setup:di:compile |
| **Cache** | flush, clean, enable, disable selettivo (block_html + full_page per dev) |
| **Indici** | Reindex completo, stato indici |
| **Modalita** | Switch production/developer, mostra modalita attuale |
| **Info** | Stato moduli, cron:run, info sistema |

### Preset one-click (header)

Tre bottoni per le operazioni piu comuni:

- **Full Deploy** — manutenzione ON > pulisci tutto > abilita moduli > setup:upgrade > DI compile > cache flush > manutenzione OFF
- **Cache** — pulisci cache dirs + cache flush
- **Compile** — pulisci generated + DI compile + cache flush

### Static Content Deploy (primo tab)

Form dedicato per `setup:static-content:deploy` con selezione di:
- **Area**: frontend, adminhtml
- **Temi**: rilevati automaticamente da `app/design/frontend/`
- **Lingue**: rilevate da `app/i18n/` + le piu comuni (it_IT, en_US, en_GB, de_DE, fr_FR, es_ES)

### Browser comandi Magento (nav "Mage")

Carica l'elenco completo dei comandi `bin/magento`, raggruppati per namespace. Selezioni un comando, aggiungi argomenti opzionali, lo esegui. Output in streaming.

### Browser comandi Composer (nav "Composer")

Stessa cosa, per Composer. `require`, `update`, `dump-autoload` — tutto dal browser.

### Manutenzione

Toggle manutenzione con conferma modale. Badge visivo nell'header quando il sito e in manutenzione.

### Pannello info

Nella sidebar: versione PHP, versione Magento, spazio disco disponibile. Aggiornato automaticamente.

## Come funziona

- **Zero dipendenze esterne**: PHP puro, niente framework, niente npm, niente build. Vanilla JS + CSS per il frontend.
- **Output in tempo reale**: i comandi vengono eseguiti con `proc_open()` e lo stdout viene streammato al browser via Server-Sent Events (SSE).
- **Autenticazione a sessione**: login con token via POST, poi sessione PHP con cookie sicuro (HttpOnly, SameSite=Strict). Il token non appare mai nell'URL.
- **Pulizia senza `rm`**: il cleaner (`panel/bin/clean.php`) usa PHP puro per svuotare le directory, funziona anche su hosting dove `rm` non e disponibile.
- **Stop dei comandi**: puoi interrompere un comando in esecuzione. Il pannello invia SIGTERM al processo.
- **i18n**: interfaccia in italiano di default, traduzione in inglese inclusa. Aggiungere una lingua = creare un file `.po`.

## Installazione

1. Copia la cartella `panel/` nella root della tua installazione Magento 2:
   ```
   magento-root/
     app/
     bin/
     pub/
     panel/        <-- qui
       index.php
       config.php
       ...
   ```

2. Copia `panel/config.php.sample` in `panel/config.php` e imposta il token:
   ```php
   define('PANEL_TOKEN', getenv('DEPLOY_PANEL_TOKEN') ?: 'IL_TUO_TOKEN_SEGRETO');
   ```
   Oppure imposta la variabile d'ambiente `DEPLOY_PANEL_TOKEN`.

3. Configura il web server (vedi sotto).

4. Apri `https://tuosito.com/panel/index.php` nel browser.

5. Inserisci il token e sei dentro.

### Requisiti

- PHP 8.1+ con `proc_open()` abilitato (non deve essere in `disable_functions`)
- Un'installazione Magento 2 funzionante
- Il web server deve poter eseguire `panel/index.php`

## Configurazione Web Server

### Apache

Il pannello include gia un `.htaccess` che protegge i file sorgente. Se usi Apache con `AllowOverride All` (configurazione standard di Magento), funziona out-of-the-box.

Per limitare l'accesso a IP specifici, aggiungi nel tuo vhost o nel `.htaccess` del pannello:

```apache
<Directory "/var/www/magento/panel">
    # Solo IP autorizzati
    <IfModule mod_authz_core.c>
        Require ip 203.0.113.0/24
        Require ip 198.51.100.42
    </IfModule>
</Directory>
```

Dopo le modifiche:
```bash
sudo apachectl configtest && sudo systemctl reload apache2
```

### Nginx

Nginx non supporta `.htaccess`. Aggiungi questo blocco nel tuo vhost (dentro il blocco `server`):

```nginx
# ── MagePanel ────────────────────────────────────────────
location /panel/ {
    # Opzionale: limita a IP specifici
    # allow 203.0.113.0/24;
    # allow 198.51.100.42;
    # deny all;

    # Solo index.php e assets pubblici
    location = /panel/index.php {
        fastcgi_pass unix:/run/php/php-fpm.sock;  # adatta al tuo socket
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /panel/public/ {
        # Serve CSS/JS statici
        try_files $uri =404;

        # Blocca PHP in public/
        location ~ \.php$ { deny all; }
    }

    # Blocca tutto il resto (config, controller, model, view, bin, locale)
    location ~ ^/panel/ {
        deny all;
    }
}
```

Dopo le modifiche:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Alternativa: installazione in `pub/panel/`

Se preferisci mettere il pannello dentro la document root pubblica di Magento (`pub/`), il pannello funziona ugualmente. Serve solo aggiornare `MAGENTO_ROOT` in `config.php`:

```php
// Se il pannello e in pub/panel/ invece che panel/
define('MAGENTO_ROOT', dirname(__DIR__, 2));  // risale due livelli invece di uno
```

Struttura risultante:
```
magento-root/
  pub/
    panel/          <-- il pannello
      index.php
      config.php
      ...
```

Questa opzione puo essere piu semplice su hosting dove la document root e `pub/` e non si puo servire contenuto dalla root di Magento.

## Sicurezza

- **Non esporre il pannello in produzione senza protezione**. Idealmente:
  - Limita l'accesso via IP (vedi configurazioni sopra)
  - Usa un token lungo e casuale (minimo 32 caratteri)
  - Metti `panel/` dietro autenticazione HTTP aggiuntiva se necessario
- Il file `config.php` e nel `.gitignore` per evitare di committare il token
- L'autenticazione usa sessioni PHP — il token non transita mai nell'URL
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) inclusi in ogni risposta
- I comandi Composer pericolosi (`exec`, `run-script`, `global`) sono bloccati
- Il cleaner PHP valida i percorsi per prevenire path traversal
- Tutti i file PHP (tranne `index.php`) rifiutano l'accesso diretto

## Struttura

```
panel/
  index.php                  # Front controller + router
  config.php                 # Token, task definitions (gitignored)
  .htaccess                  # Protezione accesso Apache
  bin/clean.php              # Cleaner PHP-native
  Controller/
    AbstractController.php   # Auth + response helpers
    DashboardController.php  # Render della UI
    StreamController.php     # SSE per task predefiniti
    StaticDeployController.php
    RunCommandController.php # SSE per comandi Magento arbitrari
    RunComposerController.php
    CommandsController.php   # Lista comandi Magento (JSON)
    ComposerCommandsController.php
    DetectController.php     # Info sistema (JSON)
  Model/
    TaskRegistry.php         # Registro task da config.php
    MagentoInfo.php          # Scan temi e lingue
    CommandChecker.php       # Verifica binari su PATH
    I18n.php                 # Parser .po + funzione __()
  View/
    dashboard.php            # HTML principale
    login.php                # Pagina di login
  public/
    panel.js                 # Frontend JS (vanilla)
    panel.css                # Stili (dark theme stile DevOps)
    .htaccess                # Permette servire CSS/JS, blocca PHP
  locale/
    it_IT/messages.po        # Italiano (lingua sorgente)
    en_US/messages.po        # Inglese
```

## Aggiungere un task

Aggiungi un'entry nell'array di `config.php`:

```php
'mio_task' => [
    'label'    => 'Il mio task',
    'cmd'      => 'php bin/magento il:mio:comando',
    'group'    => 'Il mio gruppo',
    'requires' => ['php'],
],
```

Poi aggiungi la traduzione del label in ogni file `.po` sotto `locale/`.

## Aggiungere una lingua

1. Crea `panel/locale/{codice}/messages.po` (es. `fr_FR/messages.po`)
2. Aggiungi l'header `"Language-Name: Francais\n"` nel file
3. Traduci i `msgstr` — i `msgid` sono le stringhe italiane originali
4. La lingua appare automaticamente nel selettore

---

Made with mass amounts of caffeine by **Nerdosity**.
