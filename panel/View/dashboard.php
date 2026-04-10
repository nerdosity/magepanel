<!DOCTYPE html>
<html lang="<?= htmlspecialchars(substr($i18n->getLocale(), 0, 2)) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Deploy Panel — Nerdosity</title>
    <link rel="icon" type="image/svg+xml" href="public/favicon.svg">
    <link rel="stylesheet" href="public/panel.css">
</head>
<body>

<div id="app">

    <!-- ── Left drawer — Drawer (MagePanel3.html riga 2919) ───── -->
    <div id="drawer">

        <!-- ItemLogo -->
        <div class="Item ItemLogo" title="Deploy Panel">
            <svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#111318"/>
                <rect x="1" y="1" width="30" height="30" rx="5" fill="none" stroke="#00d1ca" stroke-width="2"/>
                <!-- Terminal window dots -->
                <circle cx="7" cy="7" r="1.5" fill="#ff4d61"/>
                <circle cx="12" cy="7" r="1.5" fill="#f5a623"/>
                <circle cx="17" cy="7" r="1.5" fill="#00d1ca"/>
                <!-- Terminal prompt: > -->
                <path d="M8 15l4 3.5-4 3.5" stroke="#00d1ca" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <!-- Deploy arrow (upload) -->
                <path d="M20 22v-8m-3 3l3-3 3 3" stroke="#00d1ca" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            <span class="ItemLogo__version">v<?= htmlspecialchars(PANEL_VERSION) ?></span>
        </div>

        <!-- DrawerNavigation (MagePanel3.html riga 2945) -->
        <nav class="DrawerNavigation flex-auto">

            <div class="Item NavButton active" id="nav-tasks">
                <div class="NavButtonIcon" style="width:28px;height:28px">
                    <svg viewBox="0 0 22 22" width="28" height="28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="3" width="4.5" height="4.5" rx="0.5"/>
                        <rect x="8" y="4.5" width="13" height="1.8" rx="0.9"/>
                        <rect x="1" y="9.5" width="4.5" height="4.5" rx="0.5"/>
                        <rect x="8" y="11" width="13" height="1.8" rx="0.9"/>
                        <rect x="1" y="16" width="4.5" height="4.5" rx="0.5"/>
                        <rect x="8" y="17.5" width="10" height="1.8" rx="0.9"/>
                    </svg>
                </div>Tasks
            </div>

            <div class="Item NavButton" id="nav-commands">
                <div class="NavButtonIcon" style="width:28px;height:28px">
                    <svg viewBox="0 0 22 22" width="28" height="28" fill="none" stroke="currentColor"
                         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                         xmlns="http://www.w3.org/2000/svg">
                        <rect x="1.5" y="2" width="19" height="17" rx="2.5"/>
                        <path d="M5.5 8.5l4 3.5-4 3.5"/>
                        <path d="M13 15.5h3.5"/>
                    </svg>
                </div>Mage
            </div>

            <div class="Item NavButton" id="nav-composer">
                <div class="NavButtonIcon" style="width:28px;height:28px">
                    <svg viewBox="0 0 22 22" width="28" height="28" fill="none" stroke="currentColor"
                         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                         xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 6.5l8.5-4.5 8.5 4.5-8.5 4.5-8.5-4.5z"/>
                        <path d="M2.5 6.5v9l8.5 4.5V11"/>
                        <path d="M19.5 6.5v9l-8.5 4.5V11"/>
                    </svg>
                </div>Composer
            </div>

            <div class="flex-auto"></div>

        </nav>

        <!-- Sys info at bottom -->
        <div id="sys-info" class="drawer-sysinfo"></div>

    </div>

    <!-- ── Workspace ──────────────────────────────────────────── -->
    <div id="workspace">

        <!-- ── Header — ClusterViewHeader ── -->
        <div id="workspace-header">

            <!-- ClusterViewHeaderTitle + controls -->
            <div class="workspace-title-row">
                <div class="page-title"><?= __('Deploy Panel') ?></div>
                <div class="header-controls">
                    <div class="Button size-small preset-confirm" data-preset="full_deploy" data-label="<?= htmlspecialchars(__('Full Deploy (manutenzione + pulizia + compile + cache)')) ?>" role="button"><?= __('Full Deploy') ?></div>
                    <div class="Button size-small preset-confirm" data-preset="cache_only" data-label="<?= htmlspecialchars(__('Cache (pulizia cache + flush)')) ?>" role="button"><?= __('Cache') ?></div>
                    <div class="Button size-small preset-confirm" data-preset="compile_cache" data-label="<?= htmlspecialchars(__('Compile (pulizia generated + DI compile + cache flush)')) ?>" role="button"><?= __('Compile') ?></div>
                    <div class="header-sep"></div>
                    <span id="maintenance-badge" class="badge badge-hidden"><?= __('MANUTENZIONE') ?></span>
                    <div id="btn-maintenance" class="Button size-small" data-state="off" role="button">
                        <?= __('Manutenzione') ?>: <strong id="maint-state-label">OFF</strong>
                    </div>
                    <div class="header-sep"></div>
                    <select id="lang-selector" class="lang-selector">
                        <?php foreach ($i18n->getAvailable() as $code => $label): ?>
                        <option value="<?= htmlspecialchars($code) ?>"<?= $code === $i18n->getLocale() ? ' selected' : '' ?>><?= htmlspecialchars($label) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <!-- Tabs — .Tabs .TabsBar (MagePanel3.html riga 7326) -->
            <div class="Tabs" id="group-tabs">
                <div class="TabsBar">
                    <div class="Tab group-tab selected" data-group="__static"><?= __('Static Content') ?></div>
                    <?php foreach ($grouped as $groupName => $tasks): ?>
                    <div class="Tab group-tab" data-group="<?= htmlspecialchars($groupName) ?>"><?= htmlspecialchars(__($groupName)) ?></div>
                    <?php endforeach; ?>
                    <div class="flex-auto"></div>
                </div>
            </div>

        </div><!-- #workspace-header -->

        <!-- ── Task area — ClusterViewContent style (MagePanel3.html riga 8357) ── -->
        <div id="task-area">

            <!-- Task group panels (one visible at a time, selected by tab) -->
            <div id="task-groups">

                <!-- ═══ Static Content panel ═══ -->
                <div class="task-group TabContent" data-id="__static">
                    <div class="ClusterNamespaces">
                        <div class="ClusterNamespacesHeader">
                            <div class="ClusterNamespacesHeaderTitle"><?= __('Static Content Deploy') ?></div>
                            <div class="flex-auto"></div>
                            <button id="btn-static" class="Button green solid size-small"><?= __('Deploy Static') ?></button>
                        </div>

                        <table class="Table ClusterSecretsTable">
                            <thead>
                                <tr>
                                    <th><div class="SortableHeaderCell"><?= __('Area') ?></div></th>
                                    <th><div class="SortableHeaderCell"><?= __('Temi') ?></div></th>
                                    <th><div class="SortableHeaderCell"><?= __('Lingue') ?></div></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="vertical-align:top">
                                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
                                            <input type="checkbox" class="static-area" value="frontend" checked> Frontend
                                        </label>
                                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                                            <input type="checkbox" class="static-area" value="adminhtml"> Adminhtml
                                        </label>
                                    </td>
                                    <td style="vertical-align:top">
                                        <?php foreach ($themes as $theme): ?>
                                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
                                            <input type="checkbox" class="static-theme" value="<?= htmlspecialchars($theme) ?>" checked>
                                            <?= htmlspecialchars($theme) ?>
                                        </label>
                                        <?php endforeach; ?>
                                        <?php if (empty($themes)): ?>
                                        <span style="color:rgb(128,140,169)"><?= __('Nessun tema in app/design/frontend') ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td style="vertical-align:top">
                                        <?php
                                        $defaultLocales = ['it_IT', 'en_US', 'en_GB'];
                                        foreach ($locales as $locale): ?>
                                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
                                            <input type="checkbox" class="static-locale" value="<?= htmlspecialchars($locale) ?>"
                                                <?= in_array($locale, $defaultLocales) ? 'checked' : '' ?>>
                                            <?= htmlspecialchars($locale) ?>
                                        </label>
                                        <?php endforeach; ?>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ═══ Dynamic task group panels ═══ -->
                <?php foreach ($grouped as $groupName => $tasks): ?>
                <div class="task-group TabContent" data-id="<?= htmlspecialchars($groupName) ?>">
                    <div class="ClusterNamespaces">
                        <div class="ClusterNamespacesHeader">
                            <div class="ClusterNamespacesHeaderTitle"><?= htmlspecialchars(__($groupName)) ?></div>
                            <div class="flex-auto"></div>
                            <div class="ClusterNamespacesHeaderTotal">
                                <label>Total:</label><?= count($tasks) ?>
                            </div>
                        </div>

                        <!-- rc-table Table ClusterNamespacesTable (MagePanel3.html riga 8492) -->
                        <div class="rc-table Table ClusterNamespacesTable Table--no-scrollbars rc-table-fixed-header">
                            <div class="rc-table-container">
                                <div class="rc-table-header">
                                    <table style="table-layout:fixed">
                                        <colgroup>
                                            <col>
                                            <col style="width:70px">
                                        </colgroup>
                                        <thead class="rc-table-thead">
                                            <tr>
                                                <th class="rc-table-cell" style="text-align:left">
                                                    <div class="SortableHeaderCell left">Task</div>
                                                </th>
                                                <th class="rc-table-cell" style="text-align:right">
                                                    <div class="SortableHeaderCell right"></div>
                                                </th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>
                                <div class="rc-table-body">
                                    <table style="min-width:100%;table-layout:fixed">
                                        <colgroup>
                                            <col>
                                            <col style="width:70px">
                                        </colgroup>
                                        <tbody class="rc-table-tbody">
                                            <?php foreach ($tasks as $id => $task): ?>
                                            <tr class="rc-table-row rc-table-row-level-0">
                                                <td class="rc-table-cell" style="text-align:left">
                                                    <a class="task-link"><?= htmlspecialchars(__($task['label'])) ?></a>
                                                </td>
                                                <td class="rc-table-cell" style="text-align:right">
                                                    <div class="ClusterNamespacesTableActions">
                                                        <div class="ToolbarButton normal task-run-btn" role="button" tabindex="0"
                                                             data-task="<?= htmlspecialchars($id) ?>"
                                                             data-label="<?= htmlspecialchars(__($task['label'])) ?>">
                                                            <div class="ToolbarButton__icon">
                                                                <div class="Icon layout vertical center-center" style="width:22px;height:22px">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                                                        <path class="colorable" fill="white" d="M8 5v14l11-7z"/>
                                                                    </svg>
                                                                </div>
                                                            </div><?= __('Esegui') ?>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <?php endforeach; ?>

            </div><!-- #task-groups -->

            <!-- Magento commands (lazy loaded, hidden by default) -->
            <div id="mage-commands-container" style="display:none">
                <div id="mage-commands-list" class="mage-commands-loading">
                    <?= __('Caricamento...') ?>
                </div>
                <div style="padding:8px 22px 12px 32px">
                    <span class="group-badge" id="mage-commands-badge"></span>
                </div>
            </div>

            <!-- Composer commands (lazy loaded, hidden by default) -->
            <div id="composer-commands-container" style="display:none">
                <div id="composer-commands-list" class="mage-commands-loading">
                    <?= __('Caricamento...') ?>
                </div>
                <div style="padding:8px 22px 12px 32px">
                    <span class="group-badge" id="composer-commands-badge"></span>
                </div>
            </div>

        </div><!-- #task-area -->

        <!-- ── Terminal resize handle (Tasks mode only) ────── -->
        <div id="terminal-resize-handle"></div>

        <!-- ── Terminal panel ─────────────────────────────── -->
        <div id="terminal-panel">

            <!-- ═══ CLI mode: ResourceDetailsLayout (copiato da MagePanel4.html riga 8550) ═══ -->

            <!-- ResourceDetailsLayout__Header -->
            <div id="detail-header" class="ResourceDetailsLayout__Header" style="display:none">
                <div id="detail-resource" class="ResourceItem">
                    <div class="ResourceItem__Desc">
                        <div id="detail-title" class="ResourceItem__Title"></div>
                        <div id="detail-subtitle" class="ResourceItem__Subtitle"></div>
                    </div>
                </div>
                <!-- ResourceDetailsButtons (MagePanel4.html riga 8567) -->
                <div id="detail-buttons" class="ResourceDetailsButtons">
                    <div id="detail-run" class="ToolbarButton normal" role="button" tabindex="0">
                        <div class="ToolbarButton__icon">
                            <div class="Icon layout vertical center-center" style="width:22px;height:22px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                    <path class="colorable" fill="white" d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </div><?= __('Esegui') ?>
                    </div>
                    <div id="detail-stop" class="ToolbarButton normal disabled" role="button" tabindex="0">
                        <div class="ToolbarButton__icon">
                            <div class="Icon layout vertical center-center" style="width:22px;height:22px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                    <path class="colorable" fill="white" d="M6 6h12v12H6z"/>
                                </svg>
                            </div>
                        </div><?= __('Stop') ?>
                    </div>
                </div>
                <div class="flex-auto"></div>
            </div>

            <!-- ResourceDetailsProperties (MagePanel4.html riga 8608) -->
            <div id="detail-props" class="ResourceDetailsProperties" style="display:none">
                <div class="ResourceProperty">
                    <div class="ResourceProperty__Label"><?= __('Comando:') ?></div>
                    <div id="detail-cmd-full" class="ResourceProperty__Value"></div>
                </div>
                <div class="ResourceProperty" style="flex:1">
                    <div class="ResourceProperty__Label"><?= __('Argomenti:') ?></div>
                    <div class="ResourceProperty__Value">
                        <input type="text" id="detail-args" class="mage-cmd-args-input" placeholder="<?= htmlspecialchars(__('argomenti opzionali...')) ?>">
                    </div>
                </div>
            </div>

            <!-- ResourceDetailsContentBar with Logs/Clear switch (MagePanel4.html riga 8669) -->
            <div id="detail-content-bar" class="ResourceDetailsContentBar" style="display:none">
                <div class="ResourceDetailsContentBar__Switch">
                    <div class="ResourceDetailsContentBar__SwitchOption selected">Logs</div>
                </div>
                <div class="flex-auto"></div>
                <div id="detail-clear" class="ToolbarButton normal" role="button" tabindex="0">
                    <div class="ToolbarButton__icon">
                        <div class="Icon layout vertical center-center" style="width:22px;height:22px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                <path class="colorable" fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </div>
                    </div><?= __('Pulisci') ?>
                </div>
            </div>

            <!-- ═══ Tasks mode: console header ═══ -->
            <div id="terminal-header">
                <div class="console-dots">
                    <span class="console-dot console-dot-red"></span>
                    <span class="console-dot console-dot-yellow"></span>
                    <span class="console-dot console-dot-green"></span>
                </div>
                <span id="console-title">console</span>
                <div id="progress-wrap">
                    <span id="progress-text"></span>
                    <div id="progress-bar-track">
                        <div id="progress-bar"></div>
                    </div>
                </div>
                <div class="terminal-actions">
                    <button id="btn-run"   class="terminal-btn">&#9654; <?= __('Esegui') ?></button>
                    <button id="btn-stop"  class="terminal-btn" disabled>&#9632; <?= __('Stop') ?></button>
                    <button id="btn-clear" class="terminal-btn">&#10005; <?= __('Pulisci') ?></button>
                </div>
            </div>

            <!-- ═══ ResourceDetailsLayout__Content (log output, shared) ═══ -->
            <div id="terminal" class="ResourceDetailsLayout__Content">
            </div>

        </div><!-- #terminal-panel -->

    </div><!-- #workspace -->

    <!-- ── Confirm modal — MagePanel DialogContainer (MagePanel3.html) ── -->
    <div id="confirm-modal" class="DialogOverlay" style="display:none">
        <div class="DialogContainer">
            <div class="ModalSizer">
                <div class="ModalTitle" id="confirm-modal-title"><?= __('Conferma') ?></div>
                <div class="ModalContainer">
                    <div class="ModalContent withTitle">
                        <p id="confirm-modal-text" style="font-size:16px;line-height:1.5;margin-bottom:24px"></p>
                        <div class="DeployButtons">
                            <div id="confirm-modal-ok" class="Button green solid size-small" role="button"><?= __('Conferma') ?></div>
                            <div id="confirm-modal-cancel" class="Button light size-small" role="button"><?= __('Annulla') ?></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div><!-- #app -->

<!-- ── Mobile bottom nav (visible only < 768px, position:fixed) ── -->
<nav id="mobile-nav">
    <div class="mobile-nav-btn active" data-section="tasks">
        <svg viewBox="0 0 22 22" width="20" height="20" fill="currentColor"><rect x="1" y="3" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="4.5" width="13" height="1.8" rx="0.9"/><rect x="1" y="9.5" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="11" width="13" height="1.8" rx="0.9"/><rect x="1" y="16" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="17.5" width="10" height="1.8" rx="0.9"/></svg>
        <span>Tasks</span>
    </div>
    <div class="mobile-nav-btn" data-section="cli">
        <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="19" height="17" rx="2.5"/><path d="M5.5 8.5l4 3.5-4 3.5"/><path d="M13 15.5h3.5"/></svg>
        <span>Mage</span>
    </div>
    <div class="mobile-nav-btn" data-section="composer">
        <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5l8.5-4.5 8.5 4.5-8.5 4.5-8.5-4.5z"/><path d="M2.5 6.5v9l8.5 4.5V11"/><path d="M19.5 6.5v9l-8.5 4.5V11"/></svg>
        <span>Composer</span>
    </div>
</nav>

<script>
    var PANEL_BASE_URL = 'index.php';
    var PANEL_PRESETS  = {
        full_deploy:   ['maintenance_enable','clean_all','module_enable','setup_upgrade','di_compile','cache_flush','maintenance_disable'],
        cache_only:    ['clean_cache_dirs','cache_flush'],
        compile_cache: ['clean_generated','di_compile','cache_flush']
    };
    var PANEL_I18N = <?= $i18n->toJson() ?>;
</script>
<script src="public/panel.js"></script>

</body>
</html>
