/* ================================================================
   Nerdosity Deploy Panel — Frontend JS
   ================================================================ */
(function () {
    'use strict';

    var BASE_URL = window.PANEL_BASE_URL || 'index.php';
    var PRESETS  = window.PANEL_PRESETS  || {};
    var I18N     = window.PANEL_I18N     || {};

    /** Translate a string using the i18n dictionary loaded from .po */
    function __(s) { return I18N[s] || s; }

    // DOM refs
    var term              = document.getElementById('terminal');
    var btnRun            = document.getElementById('btn-run');
    var btnStop           = document.getElementById('btn-stop');
    var btnClear          = document.getElementById('btn-clear');
    var btnStatic         = document.getElementById('btn-static');
    var btnMaintenance      = document.getElementById('btn-maintenance');
    var maintStateLabel     = document.getElementById('maint-state-label');
    var mainBadge           = document.getElementById('maintenance-badge');
    var confirmModal        = document.getElementById('confirm-modal');
    var confirmModalTitle   = document.getElementById('confirm-modal-title');
    var confirmModalText    = document.getElementById('confirm-modal-text');
    var confirmModalOk      = document.getElementById('confirm-modal-ok');
    var confirmModalCancel  = document.getElementById('confirm-modal-cancel');
    var pendingConfirmAction = null;
    var progressBar       = document.getElementById('progress-bar');
    var progressText      = document.getElementById('progress-text');
    var sysInfo           = document.getElementById('sys-info');
    var mageCommandsList      = document.getElementById('mage-commands-list');
    var mageCommandsBadge     = document.getElementById('mage-commands-badge');
    var composerCommandsList  = document.getElementById('composer-commands-list');
    var composerCommandsBadge = document.getElementById('composer-commands-badge');
    var navTasks              = document.getElementById('nav-tasks');
    var navCommands           = document.getElementById('nav-commands');
    var navComposer           = document.getElementById('nav-composer');

    var currentEs            = null;
    var stopRequested        = false;
    var maintenanceOn        = false;
    var commandsLoaded       = false;
    var composerCommandsLoaded = false;

    // ================================================================
    //  Terminal
    // ================================================================

    function clearOutput() {
        while (term.firstChild) term.removeChild(term.firstChild);
        var ph = document.createElement('div');
        ph.className = 'term-placeholder';
        ph.textContent = __("L'output apparirà qui...");
        term.appendChild(ph);
        setProgress(0, '');
    }

    var activeLogLines = null; // current LogStageSectionLines container

    function addLine(text, type) {
        // Skip the "▶ bin/magento ..." header line in CLI mode — already shown in stage header
        if (type === 'header' && activeLogLines) return;

        var ph = term.querySelector('.term-placeholder');
        if (ph) term.removeChild(ph);

        var safeType = /^[a-z\-]+$/.test(type) ? type : 'output';

        if (activeLogLines) {
            // CLI mode: LogLine structure <code class="line"><span>text</span></code>
            var code = document.createElement('code');
            code.className = 'line line-' + safeType;
            var span = document.createElement('span');
            span.textContent = text;
            code.appendChild(span);
            activeLogLines.appendChild(code);
        } else {
            // Tasks mode: simple <div class="line">text</div>
            var div = document.createElement('div');
            div.className = 'line line-' + safeType;
            div.textContent = text;
            term.appendChild(div);
        }
        term.scrollTop = term.scrollHeight;
    }

    function addSeparator(label) {
        var div = document.createElement('div');
        div.className = 'line line-separator';
        var dashes = '─'.repeat(Math.max(0, 50 - label.length));
        div.textContent = '─── ' + label + ' ' + dashes;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
    }

    function setProgress(pct, label) {
        if (progressBar)  progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = label;
    }

    // ================================================================
    //  SSE helpers
    // ================================================================

    function openSse(url, onDone) {
        var es = new EventSource(url);
        currentEs = es;

        es.onmessage = function (e) {
            try { var d = JSON.parse(e.data); addLine(d.line, d.type); }
            catch (ex) { addLine(e.data, 'output'); }
        };

        es.addEventListener('done', function (e) {
            es.close(); currentEs = null;
            onDone(parseInt(e.data, 10) === 0);
        });

        es.onerror = function () {
            es.close(); currentEs = null;
            addLine(__('Errore di connessione SSE'), 'error');
            onDone(false);
        };

        return es;
    }

    function runTask(taskId) {
        return new Promise(function (resolve) {
            var url = BASE_URL
                + '?action=stream'
                + '&task='  + encodeURIComponent(taskId)
;
            openSse(url, resolve);
        });
    }

    // ================================================================
    //  Running state
    // ================================================================

    function setRunning(isRunning) {
        btnRun.disabled  = isRunning;
        btnStop.disabled = !isRunning;
        if (btnStatic) btnStatic.disabled = isRunning;

        document.querySelectorAll('.Button[data-preset], .task-run-btn').forEach(function (el) {
            if (isRunning) el.setAttribute('disabled', ''); else el.removeAttribute('disabled');
        });
    }


    // ================================================================
    //  Static content deploy
    // ================================================================

    if (btnStatic) {
        btnStatic.addEventListener('click', function () {
            var themes  = Array.from(document.querySelectorAll('.static-theme:checked')).map(function (c) { return c.value; });
            var locales = Array.from(document.querySelectorAll('.static-locale:checked')).map(function (c) { return c.value; });
            var areas   = Array.from(document.querySelectorAll('.static-area:checked')).map(function (c) { return c.value; });

            if (!locales.length) { alert(__('Seleziona almeno una lingua')); return; }
            if (!areas.length)   { alert(__("Seleziona almeno un'area")); return; }

            var qs = 'action=static';
            themes.forEach(function (t)  { qs += '&themes[]='  + encodeURIComponent(t); });
            locales.forEach(function (l) { qs += '&locales[]=' + encodeURIComponent(l); });
            areas.forEach(function (a)   { qs += '&areas[]='   + encodeURIComponent(a); });

            clearOutput();
            setRunning(true);
            stopRequested = false;
            setProgress(0, __('Static content deploy...'));

            openSse(BASE_URL + '?' + qs, function (ok) {
                setProgress(100, ok ? __('Completato') : __('Errori'));
                setRunning(false);
            });
        });
    }

    // ================================================================
    //  Generic confirm modal
    // ================================================================

    function showConfirm(title, text, onConfirm) {
        if (confirmModalTitle) confirmModalTitle.textContent = title;
        if (confirmModalText)  confirmModalText.textContent = text;
        pendingConfirmAction = onConfirm;
        if (confirmModal) confirmModal.style.display = 'flex';
    }

    function hideConfirm() {
        if (confirmModal) confirmModal.style.display = 'none';
        pendingConfirmAction = null;
    }

    if (confirmModalOk) {
        confirmModalOk.addEventListener('click', function () {
            var action = pendingConfirmAction;
            hideConfirm();
            if (action) action();
        });
    }

    if (confirmModalCancel) {
        confirmModalCancel.addEventListener('click', hideConfirm);
    }

    // ================================================================
    //  Maintenance
    // ================================================================

    function updateMaintenanceUI() {
        if (mainBadge) mainBadge.className = maintenanceOn ? 'badge badge-maintenance' : 'badge badge-hidden';
        if (btnMaintenance) {
            btnMaintenance.dataset.state = maintenanceOn ? 'on' : 'off';
        }
        if (maintStateLabel) maintStateLabel.textContent = maintenanceOn ? 'ON' : 'OFF';
    }

    function runMaintenanceTask(taskId) {
        clearOutput();
        setRunning(true);
        openSse(
            BASE_URL + '?action=stream&task=' + encodeURIComponent(taskId),
            function () { setRunning(false); loadSysInfo(); }
        );
    }

    if (btnMaintenance) {
        btnMaintenance.addEventListener('click', function () {
            var msg = maintenanceOn
                ? __('Disattivare la modalità manutenzione? Il sito tornerà online.')
                : __('Attivare la modalità manutenzione? Il sito sarà irraggiungibile.');
            showConfirm(__('Manutenzione'), msg, function () {
                runMaintenanceTask(maintenanceOn ? 'maintenance_disable' : 'maintenance_enable');
            });
        });
    }

    // ================================================================
    //  System info + command availability
    // ================================================================

    function loadSysInfo() {
        fetch(BASE_URL + '?action=detect')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (sysInfo) {
                    sysInfo.textContent = '';
                    sysInfo.appendChild(document.createTextNode('PHP ' + data.php));
                    sysInfo.appendChild(document.createElement('br'));
                    sysInfo.appendChild(document.createTextNode('Mage ' + data.magento));
                    sysInfo.appendChild(document.createElement('br'));
                    sysInfo.appendChild(document.createTextNode(data.disk_free));
                }
                maintenanceOn = !!data.maintenance;
                updateMaintenanceUI();

                // No command warnings — all tasks use php natively
            })
            .catch(function () {
                if (sysInfo) sysInfo.textContent = __('Info non disponibili');
            });
    }

    // ================================================================
    //  Magento commands (lazy load)
    // ================================================================

    function loadMagentoCommands() {
        if (commandsLoaded) return;
        commandsLoaded = true;

        fetch(BASE_URL + '?action=commands')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) {
                    mageCommandsList.textContent = __('Errore') + ': ' + data.error;
                    return;
                }

                while (mageCommandsList.firstChild) mageCommandsList.removeChild(mageCommandsList.firstChild);
                mageCommandsList.className = 'SpaceSidebarContainer';

                var total = 0;
                Object.keys(data.groups).forEach(function (ns) {
                    var cmds = data.groups[ns];
                    total += cmds.length;
                    mageCommandsList.appendChild(buildNsGroup(ns, cmds, 'run'));
                });

                if (mageCommandsBadge) mageCommandsBadge.textContent = total + ' ' + (total === 1 ? __('comando') : __('comandi'));

                // Auto-expand first group and select first command
                var firstGroup = mageCommandsList.querySelector('.ns-group');
                if (firstGroup) firstGroup.classList.add('expanded');
                var firstCmd = mageCommandsList.querySelector('.ResourceListItemChildren .ResourceSidebarItem');
                if (firstCmd) firstCmd.click();
            })
            .catch(function (err) {
                console.error('loadMagentoCommands error:', err);
                mageCommandsList.textContent = __('Impossibile caricare i comandi');
            });
    }

    function buildNsGroup(ns, cmds, runAction) {
        var svgNs = 'http://www.w3.org/2000/svg';

        // ResourceListItem
        var group = document.createElement('div');
        group.className = 'ResourceListItem ns-group';

        // ResourceListItemParent
        var parent = document.createElement('div');
        parent.className = 'ResourceListItemParent';

        // ResourceSidebarItem (parent row)
        var sidebar = document.createElement('div');
        sidebar.className = 'ResourceSidebarItem selected';

        // ResourceItem
        var resItem = document.createElement('div');
        resItem.className = 'ResourceItem';

        // ResourceItem__Icon > ResourceIcon > ns-icon (nostra icona custom)
        var iconWrap = document.createElement('div');
        iconWrap.className = 'ResourceItem__Icon';
        var resIcon = document.createElement('div');
        resIcon.className = 'ResourceIcon';
        resIcon.style.cssText = 'width:28px;height:28px';
        var nsIcon = document.createElement('div');
        nsIcon.className = 'ns-icon';
        nsIcon.textContent = '>';
        resIcon.appendChild(nsIcon);
        iconWrap.appendChild(resIcon);

        // ResourceItem__Desc
        var desc = document.createElement('div');
        desc.className = 'ResourceItem__Desc';
        var title = document.createElement('div');
        title.className = 'ResourceItem__Title';
        title.textContent = ns;
        var subtitle = document.createElement('div');
        subtitle.className = 'ResourceItem__Subtitle';
        subtitle.textContent = cmds.length + ' ' + (cmds.length === 1 ? __('comando') : __('comandi'));
        desc.appendChild(title);
        desc.appendChild(subtitle);

        resItem.appendChild(iconWrap);
        resItem.appendChild(desc);

        // flex-auto
        var spacer = document.createElement('div');
        spacer.className = 'flex-auto';

        // ResourceSidebarItemInfo > ResourceChildrenInfo > count
        var info = document.createElement('div');
        info.className = 'ResourceSidebarItemInfo';
        var childInfo = document.createElement('div');
        childInfo.className = 'ResourceChildrenInfo';
        var infoItem = document.createElement('div');
        infoItem.className = 'ResourceChildrenInfoItem';
        // Teal check circle icon (14×14, nostra versione)
        var checkIcon = document.createElement('div');
        checkIcon.className = 'Icon layout vertical center-center';
        checkIcon.style.cssText = 'width:14px;height:14px';
        var checkSvg = document.createElementNS(svgNs, 'svg');
        checkSvg.setAttribute('width', '14');
        checkSvg.setAttribute('height', '14');
        checkSvg.setAttribute('viewBox', '0 0 24 24');
        var checkPath = document.createElementNS(svgNs, 'path');
        checkPath.setAttribute('fill', '#00d1ca');
        checkPath.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z');
        checkSvg.appendChild(checkPath);
        checkIcon.appendChild(checkSvg);
        var countVal = document.createElement('div');
        countVal.className = 'ResourceChildrenInfoItemValue';
        countVal.textContent = cmds.length;
        infoItem.appendChild(checkIcon);
        infoItem.appendChild(countVal);
        childInfo.appendChild(infoItem);
        info.appendChild(childInfo);

        // ResourceSidebarItemButtons (empty for parent)
        var buttons = document.createElement('div');
        buttons.className = 'ResourceSidebarItemButtons';

        sidebar.appendChild(resItem);
        sidebar.appendChild(spacer);
        sidebar.appendChild(info);
        sidebar.appendChild(buttons);

        // ResourceListItemParentArrow
        var arrow = document.createElement('div');
        arrow.className = 'ResourceListItemParentArrow';
        var arrowIcon = document.createElement('div');
        arrowIcon.className = 'Icon layout vertical center-center';
        arrowIcon.style.cssText = 'width:20px;height:20px';
        var arrowSvg = document.createElementNS(svgNs, 'svg');
        arrowSvg.setAttribute('width', '20');
        arrowSvg.setAttribute('height', '20');
        arrowSvg.setAttribute('viewBox', '0 0 24 24');
        var arrowG = document.createElementNS(svgNs, 'g');
        arrowG.setAttribute('transform', 'rotate(-90, 12, 12)');
        var arrowPath = document.createElementNS(svgNs, 'path');
        arrowPath.setAttribute('fill', 'white');
        arrowPath.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
        arrowG.appendChild(arrowPath);
        arrowSvg.appendChild(arrowG);
        arrowIcon.appendChild(arrowSvg);
        arrow.appendChild(arrowIcon);

        parent.appendChild(sidebar);
        parent.appendChild(arrow);

        // ReactCollapse--collapse > ReactCollapse--content > ResourceListItemChildren
        var collapse = document.createElement('div');
        collapse.className = 'ReactCollapse--collapse';
        var content = document.createElement('div');
        content.className = 'ReactCollapse--content';
        var children = document.createElement('div');
        children.className = 'ResourceListItemChildren';

        cmds.forEach(function (cmd) {
            children.appendChild(buildCmdItem(cmd, runAction));
        });
        content.appendChild(children);
        collapse.appendChild(content);

        parent.addEventListener('click', function () {
            group.classList.toggle('expanded');
        });

        group.appendChild(parent);
        group.appendChild(collapse);
        return group;
    }

    // ── Detail panel (right side in CLI mode) ──────────────────
    var detailHeader     = document.getElementById('detail-header');
    var detailTitle      = document.getElementById('detail-title');
    var detailSubtitle   = document.getElementById('detail-subtitle');
    var detailProps      = document.getElementById('detail-props');
    var detailArgs       = document.getElementById('detail-args');
    var detailRun        = document.getElementById('detail-run');
    var detailStop       = document.getElementById('detail-stop');
    var detailContentBar = document.getElementById('detail-content-bar');
    var detailClear      = document.getElementById('detail-clear');
    var termHeader       = document.getElementById('terminal-header');
    var selectedCmd      = null; // { action, name, desc }

    var detailCmdFull = document.getElementById('detail-cmd-full');

    function selectCommand(action, name, desc) {
        selectedCmd = { action: action, name: name };
        var prefix = action === 'run_composer' ? 'composer ' : 'php bin/magento ';

        // Populate detail header
        if (detailTitle)    detailTitle.textContent = name;
        if (detailSubtitle) detailSubtitle.textContent = desc || '';
        if (detailCmdFull)  detailCmdFull.textContent = prefix + name;
        if (detailHeader)     detailHeader.style.display = '';
        if (detailProps)      detailProps.style.display = '';
        if (detailContentBar) detailContentBar.style.display = '';
        if (detailArgs)       detailArgs.value = '';

        // Hide the console header (Tasks mode), show detail header instead
        if (termHeader) termHeader.style.display = 'none';

        // Mark selected in sidebar
        document.querySelectorAll('.ResourceSidebarItem').forEach(function (el) {
            el.classList.remove('selected');
        });
        // Find and select the clicked item (by title text)
        document.querySelectorAll('.ResourceListItemChildren .ResourceSidebarItem').forEach(function (el) {
            var t = el.querySelector('.ResourceItem__Title');
            if (t && t.textContent === name) el.classList.add('selected');
        });

        clearOutput();
    }

    // Copiato da index4.html riga 8683-8716 (LogStageSection)
    function addLogStageHeader(name, success) {
        var ph = term.querySelector('.term-placeholder');
        if (ph) term.removeChild(ph);

        var svgNs = 'http://www.w3.org/2000/svg';

        // LogStageSection (index4.html riga 6166)
        var section = document.createElement('div');
        section.className = 'LogStageSection LogStageSection--opened';

        // LogStageSectionHeader (index4.html riga 8685)
        var header = document.createElement('div');
        header.className = 'LogStageSectionHeader';

        // Chevron icon 16×16 (index4.html riga 8686)
        var chevron = document.createElement('div');
        chevron.className = 'Icon layout vertical center-center chevronDown';
        chevron.style.cssText = 'width:16px;height:16px';
        var chevSvg = document.createElementNS(svgNs, 'svg');
        chevSvg.setAttribute('width', '16');
        chevSvg.setAttribute('height', '16');
        chevSvg.setAttribute('viewBox', '0 0 24 24');
        var chevPath = document.createElementNS(svgNs, 'path');
        chevPath.setAttribute('fill', 'white');
        chevPath.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
        chevSvg.appendChild(chevPath);
        var chevPath2 = document.createElementNS(svgNs, 'path');
        chevPath2.setAttribute('fill', 'none');
        chevPath2.setAttribute('d', 'M0 0h24v24H0V0z');
        chevSvg.appendChild(chevPath2);
        chevron.appendChild(chevSvg);

        // Status icon 22×22 (index4.html riga 8697)
        var statusIcon = document.createElement('div');
        statusIcon.className = 'Icon layout vertical center-center checkCircle status';
        statusIcon.style.cssText = 'width:22px;height:22px';
        var icon = document.createElementNS(svgNs, 'svg');
        icon.setAttribute('width', '22');
        icon.setAttribute('height', '22');
        icon.setAttribute('viewBox', '0 0 24 24');
        var iconPath = document.createElementNS(svgNs, 'path');
        iconPath.setAttribute('fill-rule', 'nonzero');
        if (success === true) {
            iconPath.setAttribute('fill', '#00d1ca');
            iconPath.setAttribute('d', 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0zM17.24141 7l-6.965641 6.6359475L6.75859 10.271895 5 11.9539213l3.517179 3.3640525L10.275769 17l1.75859-1.6820262L19 8.6820262 17.24141 7z');
        } else if (success === false) {
            iconPath.setAttribute('fill', '#ff4d61');
            iconPath.setAttribute('d', 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z');
        } else {
            iconPath.setAttribute('fill', '#629ada');
            iconPath.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z');
            statusIcon.classList.add('progress-pulse');
        }
        icon.appendChild(iconPath);
        statusIcon.appendChild(icon);

        // Title (index4.html riga 8707)
        var titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.textContent = name;

        // Elapsed (index4.html riga 8708)
        var elapsed = document.createElement('div');
        elapsed.className = 'elapsed';
        elapsed.textContent = 'just now';

        header.appendChild(chevron);
        header.appendChild(statusIcon);
        header.appendChild(titleEl);
        header.appendChild(elapsed);

        // LogStageSectionLines (index4.html riga 8716)
        var lines = document.createElement('div');
        lines.className = 'LogStageSectionLines';

        // Chevron click toggles LogStageSectionLines visibility
        chevron.addEventListener('click', function (e) {
            e.stopPropagation();
            section.classList.toggle('LogStageSection--opened');
            lines.style.display = section.classList.contains('LogStageSection--opened') ? '' : 'none';
        });

        section.appendChild(header);
        section.appendChild(lines);
        term.appendChild(section);
        term.scrollTop = term.scrollHeight;
        return { section: section, iconPath: iconPath, lines: lines };
    }

    function runSelectedCommand() {
        if (!selectedCmd) return;
        var args = detailArgs ? detailArgs.value.trim() : '';
        clearOutput();
        setRunning(true);
        if (detailRun)  detailRun.classList.add('disabled');
        if (detailStop) detailStop.classList.remove('disabled');

        // Add MagePanel-style stage header (blue = running)
        var prefix = selectedCmd.action === 'run_composer' ? 'composer ' : 'bin/magento ';
        var stage = addLogStageHeader(prefix + selectedCmd.name + (args ? ' ' + args : ''), null);
        activeLogLines = stage.lines;

        var url = BASE_URL
            + '?action=' + encodeURIComponent(selectedCmd.action)
            + '&name='  + encodeURIComponent(selectedCmd.name)
            + '&args='  + encodeURIComponent(args);
        openSse(url, function (ok) {
            setRunning(false);
            if (detailRun)  detailRun.classList.remove('disabled');
            if (detailStop) detailStop.classList.add('disabled');

            // Update stage header: stop pulsing, set check (teal) or X (red)
            var pulser = stage.section.querySelector('.progress-pulse');
            if (pulser) pulser.classList.remove('progress-pulse');
            if (stage.iconPath) {
                stage.iconPath.setAttribute('fill', ok ? '#00d1ca' : '#ff4d61');
                stage.iconPath.setAttribute('d', ok
                    ? 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0zM17.24141 7l-6.965641 6.6359475L6.75859 10.271895 5 11.9539213l3.517179 3.3640525L10.275769 17l1.75859-1.6820262L19 8.6820262 17.24141 7z'
                    : 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'
                );
            }

            activeLogLines = null;
            loadSysInfo();
        });
    }

    if (detailRun) {
        detailRun.addEventListener('click', function () {
            if (!detailRun.classList.contains('disabled')) runSelectedCommand();
        });
    }

    if (detailStop) {
        detailStop.addEventListener('click', function () {
            stopRequested = true;
            // Send SIGTERM to the running process via server
            fetch(BASE_URL + '?action=stop_cmd');
            if (currentEs) {
                currentEs.close(); currentEs = null;
                addLine(__('Comando interrotto'), 'warn');
                setRunning(false);
                if (detailRun)  detailRun.classList.remove('disabled');
                if (detailStop) detailStop.classList.add('disabled');
            }
        });
    }

    if (detailArgs) {
        detailArgs.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') runSelectedCommand();
        });
    }

    if (detailClear) {
        detailClear.addEventListener('click', function () { clearOutput(); });
    }

    function buildCmdItem(cmd, runAction) {
        runAction = runAction || 'run';
        var svgNs = 'http://www.w3.org/2000/svg';

        // ResourceSidebarItem (child row)
        var item = document.createElement('div');
        item.className = 'ResourceSidebarItem';

        // ResourceItem (icon + desc)
        var resItem = document.createElement('div');
        resItem.className = 'ResourceItem';

        // ResourceItem__Icon > ResourceIcon (28×28 — nostra icona, esagono con >)
        var iconWrap = document.createElement('div');
        iconWrap.className = 'ResourceItem__Icon';
        var resIcon = document.createElement('div');
        resIcon.className = 'ResourceIcon';
        resIcon.style.cssText = 'width:28px;height:28px';
        var iconInner = document.createElement('div');
        iconInner.className = 'Icon layout vertical center-center';
        iconInner.style.cssText = 'width:28px;height:28px';
        // Hex outline SVG (nostra icona — non copiata da MagePanel)
        var svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('width', '28');
        svg.setAttribute('height', '28');
        svg.setAttribute('viewBox', '0 0 36 36');
        // Hex background (grigio come MagePanel, non bianco)
        var hexBg = document.createElementNS(svgNs, 'path');
        hexBg.setAttribute('fill', 'rgba(128,140,169,0.25)');
        hexBg.setAttribute('d', 'M28.055 32.557A2.871 2.871 0 0125.552 34H10.443a2.886 2.886 0 01-2.503-1.448l-7.552-13.1a2.915 2.915 0 010-2.906L7.94 3.448A2.892 2.892 0 0110.443 2h15.11c1.033 0 1.986.55 2.502 1.448l7.557 13.104a2.915 2.915 0 010 2.906l-7.557 13.099z');
        // Terminal prompt icon (> _) inside hex
        var promptPath = document.createElementNS(svgNs, 'path');
        promptPath.setAttribute('d', 'M12 14l4 4-4 4');
        promptPath.setAttribute('stroke', 'rgba(255,255,255,0.7)');
        promptPath.setAttribute('stroke-width', '2');
        promptPath.setAttribute('stroke-linecap', 'round');
        promptPath.setAttribute('stroke-linejoin', 'round');
        promptPath.setAttribute('fill', 'none');
        var underline = document.createElementNS(svgNs, 'line');
        underline.setAttribute('x1', '19');
        underline.setAttribute('y1', '22');
        underline.setAttribute('x2', '24');
        underline.setAttribute('y2', '22');
        underline.setAttribute('stroke', 'rgba(255,255,255,0.7)');
        underline.setAttribute('stroke-width', '2');
        underline.setAttribute('stroke-linecap', 'round');
        svg.appendChild(hexBg);
        svg.appendChild(promptPath);
        svg.appendChild(underline);
        iconInner.appendChild(svg);
        resIcon.appendChild(iconInner);
        iconWrap.appendChild(resIcon);

        // ResourceItem__Desc
        var desc = document.createElement('div');
        desc.className = 'ResourceItem__Desc';
        var title = document.createElement('div');
        title.className = 'ResourceItem__Title';
        title.textContent = cmd.name;
        var subtitle = document.createElement('div');
        subtitle.className = 'ResourceItem__Subtitle';
        subtitle.textContent = cmd.desc;
        desc.appendChild(title);
        desc.appendChild(subtitle);

        resItem.appendChild(iconWrap);
        resItem.appendChild(desc);

        // flex-auto
        var spacer = document.createElement('div');
        spacer.className = 'flex-auto';

        // ResourceSidebarItemButtons (empty, like MagePanel children)
        var buttons = document.createElement('div');
        buttons.className = 'ResourceSidebarItemButtons';

        // Click row → select command, show detail panel on the right
        item.addEventListener('click', function () {
            selectCommand(runAction, cmd.name, cmd.desc);
        });

        // Assemble (same order as index4.html line 7899-7957)
        item.appendChild(resItem);
        item.appendChild(spacer);
        item.appendChild(buttons);
        return item;
    }

    // ================================================================
    //  Composer commands (lazy load)
    // ================================================================

    function loadComposerCommands() {
        if (composerCommandsLoaded) return;
        composerCommandsLoaded = true;

        fetch(BASE_URL + '?action=composer_commands')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) {
                    composerCommandsList.textContent = __('Errore') + ': ' + data.error;
                    return;
                }

                while (composerCommandsList.firstChild) composerCommandsList.removeChild(composerCommandsList.firstChild);
                composerCommandsList.className = 'SpaceSidebarContainer';

                var total = 0;
                Object.keys(data.groups).forEach(function (ns) {
                    var cmds = data.groups[ns];
                    total += cmds.length;
                    composerCommandsList.appendChild(buildNsGroup(ns, cmds, 'run_composer'));
                });

                if (composerCommandsBadge) composerCommandsBadge.textContent = total + ' ' + (total === 1 ? __('comando') : __('comandi'));

                var firstGroup = composerCommandsList.querySelector('.ns-group');
                if (firstGroup) firstGroup.classList.add('expanded');
                var firstCmd = composerCommandsList.querySelector('.ResourceListItemChildren .ResourceSidebarItem');
                if (firstCmd) firstCmd.click();
            })
            .catch(function (err) {
                console.error('loadComposerCommands error:', err);
                composerCommandsList.textContent = __('Impossibile caricare i comandi composer');
            });
    }

    // ================================================================
    //  Group tab activation
    // ================================================================

    function activateGroupTab(groupId) {
        document.querySelectorAll('.group-tab').forEach(function (t) {
            t.classList.toggle('selected', t.dataset.group === groupId);
        });
        document.querySelectorAll('.task-group').forEach(function (g) {
            g.classList.toggle('active-group', g.dataset.id === groupId);
        });
        try { localStorage.setItem('panel_active_group', groupId); } catch (e) {}
    }

    document.querySelectorAll('.group-tab').forEach(function (tab) {
        tab.addEventListener('click', function () { activateGroupTab(this.dataset.group); });
    });

    // ================================================================
    //  Terminal resize handle
    // ================================================================

    (function () {
        var handle = document.getElementById('terminal-resize-handle');
        var panel  = document.getElementById('terminal-panel');
        if (!handle || !panel) return;
        var startY, startH;
        handle.addEventListener('mousedown', function (e) {
            startY = e.clientY;
            startH = panel.offsetHeight;
            handle.classList.add('dragging');
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });
        function onMove(e) {
            var delta = startY - e.clientY; // drag up = bigger terminal
            var newH  = Math.max(80, Math.min(window.innerHeight * 0.8, startH + delta));
            panel.style.height = newH + 'px';
        }
        function onUp() {
            handle.classList.remove('dragging');
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
    })();

    // ================================================================
    //  Section switching (Tasks / Magento CLI / Composer) — drawer nav
    // ================================================================

    function switchSection(section) {
        var isTasks    = section === 'tasks';
        var isCli      = section === 'cli';
        var isComposer = section === 'composer';
        var isCmdMode  = isCli || isComposer;

        // Drawer active states
        if (navTasks)    navTasks.classList.toggle('active',    isTasks);
        if (navCommands) navCommands.classList.toggle('active', isCli);
        if (navComposer) navComposer.classList.toggle('active', isComposer);

        // Mobile nav sync
        document.querySelectorAll('.mobile-nav-btn').forEach(function (b) {
            b.classList.toggle('active', b.dataset.section === section);
        });

        // CLI layout: grid (sidebar commands | terminal right)
        var workspace = document.getElementById('workspace');
        if (workspace) workspace.classList.toggle('cli-layout', isCmdMode);

        // Containers
        var taskGroups        = document.getElementById('task-groups');
        var mageContainer     = document.getElementById('mage-commands-container');
        var composerContainer = document.getElementById('composer-commands-container');
        var groupTabs         = document.getElementById('group-tabs');

        if (taskGroups)        taskGroups.style.display        = isTasks ? '' : 'none';
        if (mageContainer)     mageContainer.style.display     = isCli ? '' : 'none';
        if (composerContainer) composerContainer.style.display = isComposer ? '' : 'none';
        if (groupTabs)         groupTabs.style.display         = isTasks ? '' : 'none';

        // Hide/show header preset buttons (only in Tasks section)
        document.querySelectorAll('.header-controls .Button[data-preset]').forEach(function (btn) {
            btn.style.display = isTasks ? '' : 'none';
        });
        var headerSep = document.querySelector('.header-sep');
        if (headerSep) headerSep.style.display = isTasks ? '' : 'none';

        // Toggle detail panel vs console header based on mode
        if (detailHeader)     detailHeader.style.display     = 'none'; // hidden until a cmd is selected
        if (detailProps)      detailProps.style.display       = 'none';
        if (detailContentBar) detailContentBar.style.display = 'none';
        if (termHeader)       termHeader.style.display       = isTasks ? '' : 'none';

        // Reset selection when switching sections
        selectedCmd = null;

        if (isCli) loadMagentoCommands();
        if (isComposer) loadComposerCommands();
    }

    if (navTasks)    navTasks.addEventListener('click',    function () { switchSection('tasks'); });
    if (navCommands) navCommands.addEventListener('click', function () { switchSection('cli'); });
    if (navComposer) navComposer.addEventListener('click', function () { switchSection('composer'); });

    // Mobile bottom nav
    document.querySelectorAll('.mobile-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var section = this.dataset.section;
            switchSection(section);
            document.querySelectorAll('.mobile-nav-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.section === section);
            });
            // Also sync drawer nav
            if (navTasks)    navTasks.classList.toggle('active',    section === 'tasks');
            if (navCommands) navCommands.classList.toggle('active', section === 'cli');
            if (navComposer) navComposer.classList.toggle('active', section === 'composer');
        });
    });

    // ================================================================
    //  Event listeners
    // ================================================================

    // Task table: click "Esegui" → confirm modal → run single task
    document.querySelectorAll('.task-run-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var taskId = this.dataset.task;
            var taskLabel = this.dataset.label;
            showConfirm(__('Esegui Task'), __('Eseguire') + ' "' + taskLabel + '"?', function () {
                clearOutput();
                setRunning(true);
                stopRequested = false;
                addSeparator(taskLabel);
                setProgress(0, taskLabel);
                runTask(taskId).then(function (ok) {
                    setProgress(100, ok ? __('Completato') : __('Errore'));
                    setRunning(false);
                    loadSysInfo();
                });
            });
        });
    });

    // Terminal buttons
    btnStop.addEventListener('click', function () {
        stopRequested = true;
        fetch(BASE_URL + '?action=stop_cmd');
        if (currentEs) {
            currentEs.close(); currentEs = null;
            addLine(__("Operazione interrotta"), 'warn');
            setRunning(false);
        }
    });

    btnClear.addEventListener('click', clearOutput);

    // Presets: confirm modal → run multiple tasks in sequence
    document.querySelectorAll('.preset-confirm').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var presetKey = this.dataset.preset;
            var presetLabel = this.dataset.label || presetKey;
            var ids = PRESETS[presetKey] || [];
            if (!ids.length) return;
            showConfirm(__('Esegui Preset'), presetLabel + '\n\n' + __('Eseguire') + ' ' + ids.length + ' ' + __('operazioni') + '?', function () {
                clearOutput();
                setRunning(true);
                stopRequested = false;
                (async function () {
                    var allOk = true;
                    for (var i = 0; i < ids.length; i++) {
                        if (stopRequested) { addLine(__("Interrotto"), 'warn'); break; }
                        setProgress(Math.round((i / ids.length) * 100), '[' + (i + 1) + '/' + ids.length + ']');
                        var ok = await runTask(ids[i]);
                        if (!ok) allOk = false;
                    }
                    setProgress(100, allOk ? __('Completato') : __('Errori'));
                    setRunning(false);
                    loadSysInfo();
                })();
            });
        });
    });

    // ================================================================
    //  Init
    // ================================================================

    // Activate group tab (restore last or fall back to first)
    (function () {
        var saved = null;
        try { saved = localStorage.getItem('panel_active_group'); } catch (e) {}
        var target = saved && document.querySelector('.group-tab[data-group="' + CSS.escape(saved) + '"]')
            ? saved
            : (document.querySelector('.group-tab') || {}).dataset.group || '__static';
        activateGroupTab(target);
    })();

    clearOutput();
    loadSysInfo();

    // ================================================================
    //  Language selector
    // ================================================================
    var langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.addEventListener('change', function () {
            var url = new URL(window.location.href);
            url.searchParams.set('lang', this.value);
            window.location.href = url.toString();
        });
    }

})();
