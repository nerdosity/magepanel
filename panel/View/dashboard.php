<!DOCTYPE html>
<html lang="<?= htmlspecialchars(substr($i18n->getLocale(), 0, 2)) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Deploy Panel — Nerdosity</title>
    <link rel="icon" type="image/svg+xml" href="public/favicon.svg">
    <link rel="stylesheet" href="public/panel.css?v=<?= filemtime(PANEL_ROOT . '/public/panel.css') ?>">
</head>
<body>

<div id="app">

    <!-- ── Drawer (Komodor layout) ───────────────────────────── -->
    <div id="drawer" class="Drawer">

        <div class="Icon layout vertical center-center Item ItemLogo" style="width:32px;height:32px">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <rect width="32" height="32" rx="6" fill="#111318"/>
                <rect x="1" y="1" width="30" height="30" rx="5" fill="none" stroke="#00d1ca" stroke-width="2"/>
                <circle cx="7" cy="7" r="1.5" fill="#ff4d61"/><circle cx="12" cy="7" r="1.5" fill="#f5a623"/><circle cx="17" cy="7" r="1.5" fill="#00d1ca"/>
                <path d="M8 15l4 3.5-4 3.5" stroke="#00d1ca" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M20 22v-8m-3 3l3-3 3 3" stroke="#00d1ca" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
        </div>

        <nav class="DrawerNavigation flex-auto">

            <div class="Item NavButton active" id="nav-tasks">
                <div class="Icon layout vertical center-center NavButtonIcon" style="width:28px;height:28px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 22 22">
                        <rect x="1" y="3" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="4.5" width="13" height="1.8" rx="0.9"/>
                        <rect x="1" y="9.5" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="11" width="13" height="1.8" rx="0.9"/>
                        <rect x="1" y="16" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="17.5" width="10" height="1.8" rx="0.9"/>
                    </svg>
                </div>Tasks
            </div>

            <div class="Item NavButton" id="nav-commands">
                <div class="Icon layout vertical center-center NavButtonIcon" style="width:28px;height:28px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 22 22">
                        <rect x="1.5" y="2" width="19" height="17" rx="2.5"/><path d="M5.5 8.5l4 3.5-4 3.5"/><path d="M13 15.5h3.5"/>
                    </svg>
                </div>Mage
            </div>

            <div class="Item NavButton" id="nav-composer">
                <div class="Icon layout vertical center-center NavButtonIcon" style="width:28px;height:28px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 22 22">
                        <path d="M2.5 6.5l8.5-4.5 8.5 4.5-8.5 4.5-8.5-4.5z"/><path d="M2.5 6.5v9l8.5 4.5V11"/><path d="M19.5 6.5v9l-8.5 4.5V11"/>
                    </svg>
                </div>Composer
            </div>

            <div class="flex-auto"></div>

            <div class="Item NavButton HelpNavButton" id="nav-help" role="button" tabindex="0">
                <div class="Icon layout vertical center-center questionCircle NavButtonIcon" style="width:28px;height:28px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path class="colorable" fill="white" fill-rule="nonzero" d="M24 12c0 6.624-5.376 12-12 12S0 18.624 0 12 5.376 0 12 0s12 5.376 12 12zm-13.028 1.902h2.13v-.26c0-.195.016-.368.048-.52.033-.152.084-.295.155-.43.07-.136.168-.275.293-.416.124-.14.279-.298.463-.471.195-.184.38-.371.553-.561.173-.19.325-.393.455-.61.13-.217.233-.45.309-.699.076-.25.114-.531.114-.846 0-.433-.087-.84-.26-1.22a2.953 2.953 0 00-.724-.983 3.373 3.373 0 00-1.114-.65A4.171 4.171 0 0011.964 6a3.61 3.61 0 00-1.318.228c-.39.151-.729.35-1.016.593a3.528 3.528 0 00-.715.821c-.19.304-.328.607-.415.91l1.87.781c.043-.173.111-.341.203-.504.092-.162.209-.309.35-.439.14-.13.303-.233.488-.309.184-.076.39-.114.617-.114.423 0 .757.125 1 .374.244.25.366.537.366.862 0 .315-.081.58-.244.797-.162.217-.39.455-.683.715-.281.239-.517.461-.707.667a3.22 3.22 0 00-.455.618c-.114.206-.198.42-.252.642a3.05 3.05 0 00-.081.724v.536zM12.012 18c.39 0 .724-.138 1-.415.277-.276.415-.61.415-1s-.138-.72-.415-.992a1.377 1.377 0 00-1-.406c-.39 0-.72.135-.992.406a1.35 1.35 0 00-.406.992c0 .39.135.724.406 1 .271.277.602.415.992.415z"/></svg></div>
                <?= __('Guida') ?>
            </div>
        </nav>

    </div>

    <!-- ── Workspace ──────────────────────────────────────────── -->
    <div id="workspace">

        <!-- ── Header — ClusterViewHeader ── -->
        <div id="workspace-header">

            <!-- Title row -->
            <div class="workspace-title-row">
                <div class="page-title"><?php
                    $words = preg_split('/(?<=\p{Ll})(?=\p{Lu})|\s+/u', PANEL_TITLE, 2);
                    echo htmlspecialchars($words[0]);
                    if (isset($words[1])) echo '<span class="title-accent">' . htmlspecialchars($words[1]) . '</span>';
                ?></div>

                <?php
                // ── Header toolbar icon (DRY helper) ──
                // All icons: white circle 22x22 viewBox 0 0 24 24, dark path inside
                $toolbarIcon = function(string $pathD, string $id = ''): string {
                    $pathId = $id ? ' id="' . $id . '"' : '';
                    return '<div class="ToolbarButton__icon"><div class="Icon layout vertical center-center">'
                         . '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
                         . '<circle class="colorable" cx="12" cy="12" r="12" fill="white"/>'
                         . '<path' . $pathId . ' fill="#181b22" d="' . $pathD . '"/>'
                         . '</svg></div></div>';
                };
                // All paths designed to fill ~5-19 area inside viewBox 0 0 24 24
                $iconCheck  = 'M9.5 15.5L6 12l-1 1 4.5 4.5 9-9-1-1z';
                $iconDots   = 'M7.5 11a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4.5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4.5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z';
                $iconLang   = 'M6.5 8h4.5V6.5H6.5V8zm5.7 6.5l-1.7-1.6.01-.01c.7-.78 1.24-1.66 1.59-2.62h1.4V9h-3.5V7.8H9.5V9H6v1.16h5.06c-.33.84-.83 1.63-1.49 2.3-.43-.47-.79-.99-1.07-1.54H7.33c.34.72.8 1.38 1.38 1.96L5.9 15.7l.82.82 2.78-2.78 1.24 1.24.46-.98zM15.25 10h-1.17L11.2 18.5h1.16l.78-2.1h3.18l.78 2.1h1.16L15.25 10zm-1.67 4.88l1.28-3.5 1.28 3.5h-2.56z';
                ?>
                <div class="header-toolbar">
                    <div id="btn-maintenance" class="ToolbarButton normal" role="button" tabindex="0">
                        <?= $toolbarIcon($iconCheck, 'maint-icon-path') ?><?= __('Manutenzione') ?>
                    </div>
                    <div class="preset-dropdown" id="preset-dropdown">
                        <div role="button" tabindex="0" title="<?= htmlspecialchars(__('Preset')) ?>" class="ToolbarButton iconOnly" id="preset-trigger">
                            <?= $toolbarIcon($iconDots) ?>
                        </div>
                        <div class="preset-dropdown-menu" id="preset-menu">
                            <div class="preset-dropdown-item preset-confirm" data-preset="full_deploy" data-label="<?= htmlspecialchars(__('Full deploy (manutenzione + pulizia + compile + cache)')) ?>">
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
                                <?= __('Full deploy') ?>
                            </div>
                            <div class="preset-dropdown-item preset-confirm" data-preset="cache_only" data-label="<?= htmlspecialchars(__('Cache (pulizia cache + flush)')) ?>">
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
                                <?= __('Cache') ?>
                            </div>
                            <div class="preset-dropdown-item preset-confirm" data-preset="compile_cache" data-label="<?= htmlspecialchars(__('Compile (pulizia generated + DI compile + cache flush)')) ?>">
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z" fill="currentColor"/></svg>
                                <?= __('Compile') ?>
                            </div>
                        </div>
                    </div>
                    <div class="preset-dropdown" id="lang-dropdown">
                        <div role="button" tabindex="0" class="ToolbarButton iconOnly" id="lang-trigger">
                            <?= $toolbarIcon($iconLang) ?>
                        </div>
                    <div class="preset-dropdown-menu" id="lang-menu">
                        <?php foreach ($i18n->getAvailable() as $code => $label): ?>
                        <div class="preset-dropdown-item lang-option<?= $code === $i18n->getLocale() ? ' selected' : '' ?>" data-lang="<?= htmlspecialchars($code) ?>"><?= htmlspecialchars($label) ?></div>
                        <?php endforeach; ?>
                    </div>
                    </div>
                </div>

                <div class="flex-auto"></div>

                <!-- SpaceQuotas — system info -->
                <div id="header-sysinfo" class="SpaceQuotas">
                        <div class="Quota  theme-dark"><label class="QuotaLabel">PHP</label><div class="QuotaValues"><div class="QuotaValuesLabel" id="sysinfo-php">—</div></div></div>
                        <div class="Quota  theme-dark"><label class="QuotaLabel">Magento</label><div class="QuotaValues"><div class="QuotaValuesLabel" id="sysinfo-mage">—</div></div></div>
                        <div class="Quota  theme-dark"><label class="QuotaLabel">Storage</label><div class="QuotaValues"><div class="QuotaValuesLabel"><span class="Used" id="sysinfo-disk-used">—</span><span class="Total" id="sysinfo-disk-total">&nbsp;/&nbsp;—</span></div><div class="Percentage  theme-dark"><svg class="rc-progress-line" viewBox="0 0 100 1" preserveAspectRatio="none"><path class="rc-progress-line-trail" d="M 0,0.5
         L 100,0.5" stroke-linecap="square" stroke="#2b3343" stroke-width="1" fill-opacity="0"></path><path class="rc-progress-line-path" id="sysinfo-disk-bar" d="M 0,0.5
         L 100,0.5" stroke-linecap="square" stroke="#00d1ca" stroke-width="1" fill-opacity="0" style="stroke-dasharray: 0px, 100px; stroke-dashoffset: 0px; transition: stroke-dashoffset 0.3s, stroke-dasharray 0.3s, stroke, 0.3s linear;"></path></svg></div></div></div>
                    </div>
            </div>

            <!-- Tabs — .Tabs .TabsBar (MagePanel3.html riga 7326) -->
            <div class="Tabs" id="group-tabs">
                <div class="TabsBar">
                    <div class="Tab group-tab selected" data-group="__static"><?= __('Static content') ?></div>
                    <?php foreach ($grouped as $groupName => $tasks): ?>
                    <div class="Tab group-tab" data-group="<?= htmlspecialchars($groupName) ?>"><?= htmlspecialchars(__($groupName)) ?></div>
                    <?php endforeach; ?>
                    <div class="flex-auto"></div>
                    <div id="tab-indicator" class="tab-indicator"></div>
                </div>
            </div>

        </div><!-- #workspace-header -->

        <!-- ── Task area — ClusterViewContent style (MagePanel3.html riga 8357) ── -->
        <div id="task-area">

            <!-- Task group panels (one visible at a time, selected by tab) -->
            <div id="task-groups">

                <!-- ═══ Static content panel ═══ -->
                <div class="task-group TabContent" data-id="__static">
                    <div class="ClusterNamespaces">
                        <div class="ClusterNamespacesHeader">
                            <div class="ClusterNamespacesHeaderTitle"><?= __('Static content deploy') ?></div>
                            <div class="flex-auto"></div>
                            <span id="static-count" class="static-count"></span>
                            <div id="btn-static" class="ToolbarButton normal disabled" role="button" tabindex="0">
                                <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M9 7v10l8.5-5z"/></svg></div></div><?= __('Deploy static') ?>
                            </div>
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
                                    <td>
                                        <label class="check-label">
                                            <input type="checkbox" class="static-opt static-area" value="frontend"> Frontend
                                        </label>
                                        <label class="check-label">
                                            <input type="checkbox" class="static-opt static-area" value="adminhtml"> Adminhtml
                                        </label>
                                    </td>
                                    <td>
                                        <?php foreach ($themes as $theme): ?>
                                        <label class="check-label">
                                            <input type="checkbox" class="static-opt static-theme" value="<?= htmlspecialchars($theme) ?>">
                                            <?= htmlspecialchars($theme) ?>
                                        </label>
                                        <?php endforeach; ?>
                                        <?php if (empty($themes)): ?>
                                        <span class="text-meta"><?= __('Nessun tema in app/design/frontend') ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php foreach ($locales as $locale): ?>
                                        <label class="check-label">
                                            <input type="checkbox" class="static-opt static-locale" value="<?= htmlspecialchars($locale) ?>">
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
                                                            <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M9 7v10l8.5-5z"/></svg></div></div><?= __('Esegui') ?>
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
                <div class="commands-badge-wrap">
                    <span class="group-badge" id="mage-commands-badge"></span>
                    <div class="ToolbarButton normal iconOnly cmd-reload" id="mage-reload" role="button" tabindex="0" title="<?= htmlspecialchars(__('Ricarica')) ?>">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center arrowLoopCircle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M16.5 7.5A5.97 5.97 0 0012 5.5a6.5 6.5 0 106.16 4.4h-1.78A4.98 4.98 0 0112 17a5 5 0 010-10c1.38 0 2.62.56 3.5 1.5L13 11h5.5V5.5l-2 2z"/></svg></div></div>
                    </div>
                </div>
            </div>

            <!-- Composer commands (lazy loaded, hidden by default) -->
            <div id="composer-commands-container" style="display:none">
                <div id="composer-commands-list" class="mage-commands-loading">
                    <?= __('Caricamento...') ?>
                </div>
                <div class="commands-badge-wrap">
                    <span class="group-badge" id="composer-commands-badge"></span>
                    <div class="ToolbarButton normal iconOnly cmd-reload" id="composer-reload" role="button" tabindex="0" title="<?= htmlspecialchars(__('Ricarica')) ?>">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center arrowLoopCircle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M16.5 7.5A5.97 5.97 0 0012 5.5a6.5 6.5 0 106.16 4.4h-1.78A4.98 4.98 0 0112 17a5 5 0 010-10c1.38 0 2.62.56 3.5 1.5L13 11h5.5V5.5l-2 2z"/></svg></div></div>
                    </div>
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
                    <div id="detail-run" class="ToolbarButton normal disabled" role="button" tabindex="0">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M9 7v10l8.5-5z"/></svg></div></div><?= __('Esegui') ?>
                    </div>
                    <div id="detail-stop" class="ToolbarButton normal disabled" role="button" tabindex="0">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M8 8h8v8H8z"/></svg></div></div><?= __('Stop') ?>
                    </div>
                    <div id="detail-help" class="ToolbarButton normal" role="button" tabindex="0">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M11 17h2v2h-2v-2zm1-12a5 5 0 00-5 5h2a3 3 0 116 0c0 3-4.5 2.62-4.5 7h2c0-3.5 4.5-3.12 4.5-7a5 5 0 00-5-5z"/></svg></div></div>Help
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
                <div class="ResourceProperty flex-auto">
                    <div class="ResourceProperty__Label"><?= __('Argomenti:') ?></div>
                    <div class="ResourceProperty__Value">
                        <input type="text" id="detail-args" class="mage-cmd-args-input" placeholder="<?= htmlspecialchars(__('argomenti opzionali...')) ?>">
                    </div>
                </div>
            </div>

            <!-- ═══ Tasks mode: console header ═══ -->
            <div id="terminal-header">
                <div class="console-controls">
                    <button type="button" class="console-ctrl console-ctrl-red" id="console-minimize" title="<?= htmlspecialchars(__('Minimizza')) ?>"><svg width="12" height="12" viewBox="0 0 24 24"><path fill="white" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>
                    <button type="button" class="console-ctrl console-ctrl-yellow" id="console-default" title="<?= htmlspecialchars(__('Dimensione standard')) ?>"><svg width="12" height="12" viewBox="0 0 24 24"><path fill="white" d="M4 18h6v2H2v-8h2v6zm14-12h-6V4h8v8h-2V6z"/></svg></button>
                    <button type="button" class="console-ctrl console-ctrl-green" id="console-maximize" title="<?= htmlspecialchars(__('Massimizza')) ?>"><svg width="12" height="12" viewBox="0 0 24 24"><path fill="white" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg></button>
                </div>
                <span id="console-title">console</span>
                <div id="progress-wrap">
                    <span id="progress-text"></span>
                    <div id="progress-bar-track">
                        <div id="progress-bar"></div>
                    </div>
                </div>
                <div class="terminal-actions">
                    <div id="btn-stop" class="ToolbarButton normal disabled" role="button" tabindex="0">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M8 8h8v8H8z"/></svg></div></div><?= __('Stop') ?>
                    </div>
                </div>
            </div>

            <!-- ═══ ResourceDetailsLayout__Content ═══ -->
            <div class="ResourceDetailsLayout__Content">
                <div id="detail-content-bar" class="ResourceDetailsContentBar" style="display:none">
                    <div class="ResourceDetailsContentBar__Switch">
                        <div class="ResourceDetailsContentBar__SwitchOption selected">Logs</div>
                    </div>
                    <div class="flex-auto"></div>
                    <div id="btn-clear" class="ToolbarButton normal" role="button" tabindex="0">
                        <div class="ToolbarButton__icon"><div class="Icon layout vertical center-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle class="colorable" cx="12" cy="12" r="12" fill="white"/><path fill="#181b22" d="M15.5 8.5l-1-1L12 10l-2.5-2.5-1 1L11 11l-2.5 2.5 1 1L12 12l2.5 2.5 1-1L13 11z"/></svg></div></div><?= __('Pulisci') ?>
                    </div>
                </div>
                <div id="terminal"></div>
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
                        <p id="confirm-modal-text" class="modal-text"></p>
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
    var PANEL_TOUR = <?= file_get_contents(PANEL_ROOT . '/tour.json') ?>;
</script>
<script src="public/panel.js?v=<?= filemtime(PANEL_ROOT . '/public/panel.js') ?>"></script>

</body>
</html>
