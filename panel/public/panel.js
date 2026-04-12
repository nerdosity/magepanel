/* ================================================================
   Nerdosity Deploy Panel — Frontend JS
   ================================================================ */
(function () {
    'use strict';

    var BASE_URL = window.PANEL_BASE_URL || 'index.php';
    var PRESETS  = window.PANEL_PRESETS  || {};
    var I18N     = window.PANEL_I18N     || {};
    var TASK_LABELS = {};

    // ── Helpers ──────────────────────────────────────────────

    function __(s) { return I18N[s] || s; }

    function clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    function pluralize(n, singular, plural) { return n === 1 ? __(singular) : __(plural); }

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var SVG_PATH_CHECK   = 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0zM17.24141 7l-6.965641 6.6359475L6.75859 10.271895 5 11.9539213l3.517179 3.3640525L10.275769 17l1.75859-1.6820262L19 8.6820262 17.24141 7z';
    var SVG_PATH_ERROR_X = 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0zM16.23 8.45l-1.56-1.56L12.06 9.5 9.45 6.89 7.89 8.45l2.61 2.61-2.61 2.61 1.56 1.56 2.61-2.61 2.61 2.61 1.56-1.56-2.61-2.61 2.61-2.61z';
    var SVG_PATH_CIRCLE  = 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0z';
    var SVG_PATH_CHEVRON = 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z';
    var SVG_PATH_CHECK_SM = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';

    function createSvg(w, h, viewBox, children) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', viewBox);
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var el = document.createElementNS(SVG_NS, c.tag || 'path');
            var attrs = c.attrs || {};
            for (var k in attrs) { if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]); }
            svg.appendChild(el);
        }
        return svg;
    }

    function wrapIcon(svg, size, extraClass) {
        var w = document.createElement('div');
        w.className = 'Icon layout vertical center-center' + (extraClass ? ' ' + extraClass : '');
        w.style.cssText = 'width:' + size + 'px;height:' + size + 'px';
        w.appendChild(svg);
        return w;
    }

    function buildEmptyState(iconContent, titleText, subtitleText) {
        var el = document.createElement('div');
        el.className = 'term-empty-state';
        var icon = document.createElement('div');
        icon.className = 'detail-empty-icon';
        if (typeof iconContent === 'string') {
            icon.textContent = iconContent;
            icon.style.fontSize = '28px';
        } else {
            icon.appendChild(iconContent);
        }
        el.appendChild(icon);
        var t = document.createElement('div');
        t.className = 'detail-empty-title';
        t.textContent = titleText;
        el.appendChild(t);
        var s = document.createElement('div');
        s.className = 'detail-empty-sub';
        s.textContent = subtitleText;
        el.appendChild(s);
        return el;
    }

    function animateExpand(el, onDone) {
        el.style.height = '0px';
        el.style.overflow = 'hidden';
        el.style.transition = 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        requestAnimationFrame(function () { el.style.height = el.scrollHeight + 'px'; });
        var done = function () {
            el.style.height = ''; el.style.overflow = ''; el.style.transition = '';
            el.removeEventListener('transitionend', done);
            if (onDone) onDone();
        };
        el.addEventListener('transitionend', done);
    }

    function animateCollapse(el, onDone) {
        el.style.height = el.scrollHeight + 'px';
        el.style.overflow = 'hidden';
        el.style.transition = 'height 0.2s ease-out';
        requestAnimationFrame(function () { el.style.height = '0px'; });
        var done = function () {
            el.style.height = ''; el.style.overflow = ''; el.style.transition = '';
            el.removeEventListener('transitionend', done);
            if (onDone) onDone();
        };
        el.addEventListener('transitionend', done);
    }

    // ── DOM refs ─────────────────────────────────────────────

    var term              = document.getElementById('terminal');
    var btnStop           = document.getElementById('btn-stop');
    var btnClear          = document.getElementById('btn-clear');
    var btnStatic         = document.getElementById('btn-static');
    var btnMaintenance    = document.getElementById('btn-maintenance');
    var maintStateLabel   = document.getElementById('maint-state-label');
    var mainBadge         = document.getElementById('maintenance-badge');
    var confirmModal      = document.getElementById('confirm-modal');
    var confirmModalTitle = document.getElementById('confirm-modal-title');
    var confirmModalText  = document.getElementById('confirm-modal-text');
    var confirmModalOk    = document.getElementById('confirm-modal-ok');
    var confirmModalCancel= document.getElementById('confirm-modal-cancel');
    var pendingConfirmAction = null;
    var progressBar       = document.getElementById('progress-bar');
    var progressText      = document.getElementById('progress-text');
    var mageCommandsList  = document.getElementById('mage-commands-list');
    var mageCommandsBadge = document.getElementById('mage-commands-badge');
    var composerCommandsList  = document.getElementById('composer-commands-list');
    var composerCommandsBadge = document.getElementById('composer-commands-badge');
    var navTasks          = document.getElementById('nav-tasks');
    var navCommands       = document.getElementById('nav-commands');
    var navComposer       = document.getElementById('nav-composer');
    var detailHeader      = document.getElementById('detail-header');
    var detailTitle       = document.getElementById('detail-title');
    var detailSubtitle    = document.getElementById('detail-subtitle');
    var detailProps       = document.getElementById('detail-props');
    var detailArgs        = document.getElementById('detail-args');
    var detailRun         = document.getElementById('detail-run');
    var detailStop        = document.getElementById('detail-stop');
    var detailContentBar  = document.getElementById('detail-content-bar');
    var detailClear       = null; // merged into btn-clear inside content bar
    var detailCmdFull     = document.getElementById('detail-cmd-full');
    var termHeader        = document.getElementById('terminal-header');

    var currentEs          = null;
    var stopRequested      = false;
    var maintenanceOn      = false;
    var commandsLoaded     = false;
    var composerCommandsLoaded = false;
    var activeLogLines     = null;
    var selectedCmd        = null;
    var runStartTime       = null;

    // ── Operation helpers ────────────────────────────────────

    function formatElapsed(ms) {
        var secs = Math.round(ms / 1000);
        if (secs < 60) return secs + 's';
        var mins = Math.floor(secs / 60);
        var s = secs % 60;
        return mins + 'm ' + (s < 10 ? '0' : '') + s + 's';
    }

    function getElapsedLabel() {
        if (!runStartTime) return '';
        return ' (' + formatElapsed(Date.now() - runStartTime) + ')';
    }

    function setDetailButtons(running) {
        if (detailRun)  { if (running || !selectedCmd) detailRun.classList.add('disabled'); else detailRun.classList.remove('disabled'); }
        if (detailStop) { if (!running) detailStop.classList.add('disabled'); else detailStop.classList.remove('disabled'); }
    }

    function beginOperation() {
        var es = term.querySelector('.term-empty-state');
        if (es) term.removeChild(es);
        setRunning(true);
        stopRequested = false;
    }

    function finishOperation(ok) {
        setProgress(100, (ok ? __('Completato') : __('Errori')) + getElapsedLabel());
        setRunning(false);
        loadSysInfo();
    }

    function stopExecution(warnMsg) {
        stopRequested = true;
        fetch(BASE_URL + '?action=stop_cmd');
        if (currentEs) {
            currentEs.close(); currentEs = null;
            addLine(warnMsg, 'warn');
            setRunning(false);
        }
    }

    function setRunning(isRunning) {
        if (isRunning) runStartTime = Date.now();
        if (!isRunning) btnStop.classList.add('disabled'); else btnStop.classList.remove('disabled');
        if (btnStatic) { if (isRunning) btnStatic.classList.add('disabled'); else btnStatic.classList.remove('disabled'); }
        document.querySelectorAll('.preset-dropdown-item, .task-run-btn').forEach(function (el) {
            if (isRunning) el.setAttribute('disabled', ''); else el.removeAttribute('disabled');
        });
    }

    function setProgress(pct, label) {
        if (progressBar)  progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = label;
    }

    function updateClearBtn() {
        var hasOutput = term.querySelector('.line') || term.querySelector('.LogStageSection');
        if (!hasOutput) btnClear.classList.add('disabled'); else btnClear.classList.remove('disabled');
        if (detailClear) {
            if (hasOutput) detailClear.classList.remove('disabled');
            else detailClear.classList.add('disabled');
        }
    }

    // ── Terminal ─────────────────────────────────────────────

    function showTasksPlaceholder() {
        if (term.querySelector('.line') || term.querySelector('.LogStageSection')) return;
        clearChildren(term);
        term.appendChild(buildEmptyState('\u25B8', __('Seleziona un task e premi Esegui'), __('Oppure usa i preset in alto per operazioni rapide.')));
    }

    function showCliPlaceholder() {
        clearChildren(term);
        if (selectedCmd) {
            var prefix = selectedCmd.action === 'run_composer' ? 'composer ' : 'php bin/magento ';
            term.appendChild(buildEmptyState('\u25B6', prefix + selectedCmd.name, __('Premi Esegui per avviare il comando')));
        }
    }

    function clearOutput() {
        clearChildren(term);
        setProgress(0, '');
        var workspace = document.getElementById('workspace');
        if (workspace && workspace.classList.contains('cli-layout')) {
            showCliPlaceholder();
        } else {
            showTasksPlaceholder();
        }
        updateClearBtn();
    }

    // ── ANSI handling + line rendering ───────────────────────

    var ansiStripRe = /\x1b\[[0-9;]*[A-Za-z]|\[\d*[AHJKm]|\[\d*;\d*[Hf]/g;
    var cursorUpCountRe = /\x1b\[(\d*)A|\[(\d*)A/g;

    function addLine(text, type) {
        if (type === 'header' && activeLogLines) return;

        var ups = 0, match;
        var re = new RegExp(cursorUpCountRe.source, 'g');
        while ((match = re.exec(text)) !== null) {
            ups += parseInt(match[1] || match[2] || '1', 10);
        }

        var clean = text.replace(ansiStripRe, '').trim();
        if (clean === '') return;

        if (ups > 0) {
            var container = activeLogLines || term;
            var subLines = clean.split('\n');
            var existingLines = container.querySelectorAll('.line');
            var toRemove = Math.min(ups, existingLines.length);
            for (var i = 0; i < toRemove; i++) {
                var el = existingLines[existingLines.length - 1 - i];
                if (el) el.parentNode.removeChild(el);
            }
            for (var j = 0; j < subLines.length; j++) {
                var sl = subLines[j].trim();
                if (sl !== '') appendLineEl(sl, type);
            }
            term.scrollTop = term.scrollHeight;
            return;
        }

        appendLineEl(clean, type);
        term.scrollTop = term.scrollHeight;
    }

    function appendLineEl(text, type) {
        if (/^[✓✗] .*(exit \d)/.test(text) || /^\[OK\]/.test(text) || /^\[ERRORE\]/.test(text)) type = 'exit';
        var safeType = /^[a-z\-]+$/.test(type) ? type : 'output';

        var es = term.querySelector('.term-empty-state');
        if (es) term.removeChild(es);

        if (activeLogLines) {
            var code = document.createElement('code');
            code.className = 'line line-' + safeType;
            var span = document.createElement('span');
            span.textContent = text;
            code.appendChild(span);
            activeLogLines.appendChild(code);
        } else {
            var div = document.createElement('div');
            div.className = 'line line-' + safeType;
            div.textContent = text;
            term.appendChild(div);
        }
        updateClearBtn();
    }

    // ── SSE ──────────────────────────────────────────────────

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

    function runTask(taskId, label) {
        var stage = addLogStageHeader(label || taskId, null);
        activeLogLines = stage.lines;
        return new Promise(function (resolve) {
            openSse(BASE_URL + '?action=stream&task=' + encodeURIComponent(taskId), function (ok) {
                finishStage(stage, ok);
                resolve(ok);
            });
        });
    }

    // ── Static content deploy ────────────────────────────────

    var staticCount = document.getElementById('static-count');

    function updateStaticCount() {
        var total = document.querySelectorAll('.static-opt:checked').length;
        if (staticCount) staticCount.textContent = total > 0 ? (total + ' ' + pluralize(total, 'selezionato', 'selezionati')) : '';
        if (btnStatic) { if (total === 0) btnStatic.classList.add('disabled'); else btnStatic.classList.remove('disabled'); }
    }

    document.querySelectorAll('.static-opt').forEach(function (cb) { cb.addEventListener('change', updateStaticCount); });
    updateStaticCount();

    if (btnStatic) {
        btnStatic.addEventListener('click', function () {
            if (btnStatic.classList.contains('disabled')) return;
            var themes  = Array.from(document.querySelectorAll('.static-theme:checked')).map(function (c) { return c.value; });
            var locales = Array.from(document.querySelectorAll('.static-locale:checked')).map(function (c) { return c.value; });
            var areas   = Array.from(document.querySelectorAll('.static-area:checked')).map(function (c) { return c.value; });
            if (!areas.length) { alert(__("Seleziona almeno un'area")); return; }

            var summary = __('Area') + ': ' + (areas.join(', ') || '\u2014') + '\n'
                + __('Temi') + ': ' + (themes.join(', ') || '\u2014') + '\n'
                + __('Lingue') + ': ' + (locales.join(', ') || '\u2014');

            showConfirm(__('Deploy static'), summary, function () {
                var qs = 'action=static';
                themes.forEach(function (t) { qs += '&themes[]=' + encodeURIComponent(t); });
                locales.forEach(function (l) { qs += '&locales[]=' + encodeURIComponent(l); });
                areas.forEach(function (a) { qs += '&areas[]=' + encodeURIComponent(a); });
                beginOperation();
                setProgress(0, __('Static content deploy...'));
                var stage = addLogStageHeader(__('Static content deploy'), null);
                activeLogLines = stage.lines;
                openSse(BASE_URL + '?' + qs, function (ok) {
                    finishStage(stage, ok);
                    finishOperation(ok);
                });
            });
        });
    }

    // ── Confirm modal ────────────────────────────────────────

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
    if (confirmModalCancel) confirmModalCancel.addEventListener('click', hideConfirm);

    // ── Maintenance ──────────────────────────────────────────

    var MAINT_PATH_CHECK = 'M9.5 15.5L6 12l-1 1 4.5 4.5 9-9-1-1z';
    var MAINT_PATH_WARN  = 'M12 6L18.5 18.5h-13L12 6zm0-2L3 20h18L12 4zm1 12h-2v2h2v-2zm0-6h-2v4h2v-4z';

    function updateMaintenanceUI() {
        if (btnMaintenance) {
            var iconPath = document.getElementById('maint-icon-path');
            if (iconPath) iconPath.setAttribute('d', maintenanceOn ? MAINT_PATH_WARN : MAINT_PATH_CHECK);
        }
    }

    if (btnMaintenance) {
        btnMaintenance.addEventListener('click', function () {
            var msg = maintenanceOn
                ? __('Disattivare la modalità manutenzione? Il sito tornerà online.')
                : __('Attivare la modalità manutenzione? Il sito sarà irraggiungibile.');
            showConfirm(__('Manutenzione'), msg, function () {
                var taskId = maintenanceOn ? 'maintenance_disable' : 'maintenance_enable';
                var taskLabel = TASK_LABELS[taskId] || __('Manutenzione');
                beginOperation();
                var stage = addLogStageHeader(taskLabel, null);
                activeLogLines = stage.lines;
                openSse(BASE_URL + '?action=stream&task=' + encodeURIComponent(taskId), function (ok) {
                    finishStage(stage, ok);
                    setRunning(false);
                    loadSysInfo();
                });
            });
        });
    }

    // ── System info ──────────────────────────────────────────

    var sysinfoPhp      = document.getElementById('sysinfo-php');
    var sysinfoMage     = document.getElementById('sysinfo-mage');
    var sysinfoDiskUsed = document.getElementById('sysinfo-disk-used');
    var sysinfoDiskTotal= document.getElementById('sysinfo-disk-total');
    var sysinfoDiskBar  = document.getElementById('sysinfo-disk-bar');

    function loadSysInfo() {
        fetch(BASE_URL + '?action=detect')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (sysinfoPhp)       sysinfoPhp.textContent       = data.php;
                if (sysinfoMage)      sysinfoMage.textContent      = data.magento;
                if (sysinfoDiskUsed)  sysinfoDiskUsed.textContent  = data.disk_free;
                if (sysinfoDiskTotal) sysinfoDiskTotal.textContent = '\u00a0/\u00a0' + data.disk_total;
                if (sysinfoDiskBar) {
                    var pct = parseFloat(data.disk_used_pct) || 0;
                    sysinfoDiskBar.style.strokeDasharray = pct + 'px, 100px';
                    sysinfoDiskBar.setAttribute('stroke', pct > 90 ? '#ff4d61' : pct > 70 ? '#febc2e' : '#00d1ca');
                }
                maintenanceOn = !!data.maintenance;
                updateMaintenanceUI();
            })
            .catch(function () {
                if (sysinfoPhp)      sysinfoPhp.textContent      = '—';
                if (sysinfoMage)     sysinfoMage.textContent     = '—';
                if (sysinfoDiskUsed) sysinfoDiskUsed.textContent = '—';
            });
    }

    // ── Command list loading (shared for Mage + Composer) ────

    function showLoader(container) {
        clearChildren(container);
        container.className = 'SpaceSidebarContainer';
        var counts = [4, 3, 5, 3];
        for (var g = 0; g < counts.length; g++) {
            var group = document.createElement('div');
            group.className = 'skel-group';
            group.appendChild(buildSkelRow('skel-header', 'skel-circle', 60 + Math.round(Math.random() * 60), 48));
            for (var c = 0; c < counts[g]; c++) {
                group.appendChild(buildSkelRow('skel-child', 'skel-hex', 80 + Math.round(Math.random() * 100), 100 + Math.round(Math.random() * 80)));
            }
            container.appendChild(group);
        }
    }

    function buildSkelRow(rowClass, shapeClass, bar1W, bar2W) {
        var row = document.createElement('div');
        row.className = 'skel-row ' + rowClass;
        var shape = document.createElement('div');
        shape.className = 'skel-bone ' + shapeClass;
        var col = document.createElement('div');
        col.className = 'skel-col';
        var b1 = document.createElement('div');
        b1.className = 'skel-bone skel-bar';
        b1.style.width = bar1W + 'px';
        var b2 = document.createElement('div');
        b2.className = 'skel-bone skel-bar skel-bar-sm';
        b2.style.width = bar2W + 'px';
        col.appendChild(b1);
        col.appendChild(b2);
        row.appendChild(shape);
        row.appendChild(col);
        return row;
    }

    function loadCommandList(opts) {
        if (opts.loaded) return;
        opts.loaded = true;
        showLoader(opts.container);

        fetch(BASE_URL + '?action=' + opts.fetchAction)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) { opts.container.textContent = __('Errore') + ': ' + data.error; return; }
                clearChildren(opts.container);
                opts.container.className = 'SpaceSidebarContainer';
                var total = 0;
                Object.keys(data.groups).forEach(function (ns) {
                    var cmds = data.groups[ns];
                    total += cmds.length;
                    opts.container.appendChild(buildNsGroup(ns, cmds, opts.runAction));
                });
                if (opts.badge) opts.badge.textContent = total + ' ' + pluralize(total, 'comando', 'comandi');
                var firstGroup = opts.container.querySelector('.ns-group');
            })
            .catch(function () { opts.container.textContent = opts.errorMsg; });
    }

    var mageOpts = { container: mageCommandsList, badge: mageCommandsBadge, fetchAction: 'commands', runAction: 'run', loaded: false, errorMsg: __('Impossibile caricare i comandi') };
    var composerOpts = { container: composerCommandsList, badge: composerCommandsBadge, fetchAction: 'composer_commands', runAction: 'run_composer', loaded: false, errorMsg: __('Impossibile caricare i comandi composer') };

    // Reload buttons
    var mageReload = document.getElementById('mage-reload');
    var composerReload = document.getElementById('composer-reload');
    if (mageReload) mageReload.addEventListener('click', function () { mageOpts.loaded = false; loadCommandList(mageOpts); });
    if (composerReload) composerReload.addEventListener('click', function () { composerOpts.loaded = false; loadCommandList(composerOpts); });

    // ── Build command list UI ────────────────────────────────

    function buildNsGroup(ns, cmds, runAction) {
        var displayNs = ns === '_general' ? __('Generale') : ns;
        var group = document.createElement('div');
        group.className = 'ResourceListItem ns-group';

        var parent = document.createElement('div');
        parent.className = 'ResourceListItemParent';

        // Parent sidebar item
        var sidebar = document.createElement('div');
        sidebar.className = 'ResourceSidebarItem';

        var groupIcon = document.createElement('div');
        groupIcon.className = 'cmd-icon-group';
        groupIcon.appendChild(createSvg(16, 16, '0 0 24 24', [
            {attrs: {d: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z', fill: '#fff'}}
        ]));
        var resItem = buildResourceItem(groupIcon, displayNs, cmds.length + ' ' + pluralize(cmds.length, 'comando', 'comandi'));
        sidebar.appendChild(resItem);

        var spacer = document.createElement('div');
        spacer.className = 'flex-auto';
        sidebar.appendChild(spacer);

        // Status placeholder (empty, updated when commands run)
        var groupStatus = document.createElement('div');
        groupStatus.className = 'Status group-status';
        sidebar.appendChild(groupStatus);

        sidebar.appendChild(document.createElement('div')).className = 'ResourceSidebarItemButtons';

        // Arrow
        var arrow = document.createElement('div');
        arrow.className = 'ResourceListItemParentArrow';
        var arrowSvg = createSvg(20, 20, '0 0 24 24', [{tag: 'g', attrs: {transform: 'rotate(-90, 12, 12)'}}, {attrs: {fill: 'white', d: SVG_PATH_CHEVRON}}]);
        // Move the path inside the g
        var gEl = arrowSvg.querySelector('g');
        var pEl = arrowSvg.querySelector('path');
        if (gEl && pEl) { arrowSvg.removeChild(pEl); gEl.appendChild(pEl); }
        arrow.appendChild(wrapIcon(arrowSvg, 20));

        parent.appendChild(sidebar);
        parent.appendChild(arrow);

        // Collapse container
        var collapse = document.createElement('div');
        collapse.className = 'ReactCollapse--collapse';
        var content = document.createElement('div');
        content.className = 'ReactCollapse--content';
        var children = document.createElement('div');
        children.className = 'ResourceListItemChildren';
        cmds.forEach(function (cmd) { children.appendChild(buildCmdItem(cmd, runAction)); });
        content.appendChild(children);
        collapse.appendChild(content);

        // Expand/collapse animation
        parent.addEventListener('click', function () {
            if (!group.classList.contains('expanded')) {
                group.classList.add('expanded');
                sidebar.classList.add('selected');
                animateExpand(collapse);
            } else {
                animateCollapse(collapse, function () {
                    group.classList.remove('expanded');
                    sidebar.classList.remove('selected');
                });
            }
            // Deselect current command but keep terminal content
            selectedCmd = null;
            updateDetailSwitchState();
        });

        group.appendChild(parent);
        group.appendChild(collapse);
        return group;
    }

    function buildResourceItem(iconEl, titleText, subtitleText) {
        var resItem = document.createElement('div');
        resItem.className = 'ResourceItem';
        var iconWrap = document.createElement('div');
        iconWrap.className = 'ResourceItem__Icon';
        var resIcon = document.createElement('div');
        resIcon.className = 'ResourceIcon';
        resIcon.style.cssText = 'width:28px;height:28px';
        resIcon.appendChild(iconEl);
        iconWrap.appendChild(resIcon);
        var desc = document.createElement('div');
        desc.className = 'ResourceItem__Desc';
        var title = document.createElement('div');
        title.className = 'ResourceItem__Title';
        title.textContent = titleText;
        var subtitle = document.createElement('div');
        subtitle.className = 'ResourceItem__Subtitle';
        subtitle.textContent = subtitleText;
        desc.appendChild(title);
        desc.appendChild(subtitle);
        resItem.appendChild(iconWrap);
        resItem.appendChild(desc);
        return resItem;
    }

    function buildCmdItem(cmd, runAction) {
        runAction = runAction || 'run';
        var item = document.createElement('div');
        item.className = 'ResourceSidebarItem';

        // Command item icon: white bg, dark terminal prompt
        var cmdIcon = document.createElement('div');
        cmdIcon.className = 'cmd-icon-item';
        cmdIcon.appendChild(createSvg(16, 16, '0 0 24 24', [
            {attrs: {d: 'M7 10l4 3.5-4 3.5', fill: 'none', stroke: '#111318', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}},
            {tag: 'line', attrs: {x1: '14', y1: '17', x2: '18', y2: '17', stroke: '#111318', 'stroke-width': '2.2', 'stroke-linecap': 'round'}}
        ]));

        var resItem = buildResourceItem(cmdIcon, cmd.name, cmd.desc);
        item.appendChild(resItem);
        item.appendChild(document.createElement('div')).className = 'flex-auto';
        // Status — hidden until command runs, then shows label + circle like Komodor
        var cmdStatus = document.createElement('div');
        cmdStatus.className = 'Status sidebar-cmd-status';
        cmdStatus.style.display = 'none';
        var cmdStatusLabel = document.createElement('div');
        cmdStatusLabel.className = 'StatusLabel';
        cmdStatus.appendChild(cmdStatusLabel);
        var cmdStatusCircle = document.createElement('div');
        cmdStatusCircle.className = 'StatusCircle';
        cmdStatus.appendChild(cmdStatusCircle);
        item.appendChild(cmdStatus);
        item.appendChild(document.createElement('div')).className = 'ResourceSidebarItemButtons';

        item.addEventListener('click', function () { selectCommand(runAction, cmd.name, cmd.desc); });
        return item;
    }

    // ── Detail panel (CLI mode) ──────────────────────────────

    function showDetailEmptyState() {
        removeDetailEmptyState();
        if (detailHeader)     detailHeader.style.display = '';
        if (detailProps)      detailProps.style.display = '';
        if (detailContentBar) detailContentBar.style.display = '';
        if (termHeader)       termHeader.style.display = 'none';

        if (detailTitle)    detailTitle.textContent = '\u2014';
        if (detailSubtitle) detailSubtitle.textContent = __('Seleziona un comando dalla lista');
        if (detailCmdFull)  detailCmdFull.textContent = '\u2014';
        if (detailArgs)     { detailArgs.value = ''; detailArgs.disabled = true; }
        setDetailButtons(false);
        if (detailStop) detailStop.setAttribute('disabled', '');
        if (detailHeader) detailHeader.dataset.emptyState = '1';

        clearChildren(term);
        var termSvg = createSvg(48, 48, '0 0 24 24', [
            {tag: 'rect', attrs: {x: '2', y: '3', width: '20', height: '18', rx: '3', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}},
            {attrs: {d: 'M7 10l3 3-3 3', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}},
            {tag: 'line', attrs: {x1: '14', y1: '16', x2: '17', y2: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}}
        ]);
        term.appendChild(buildEmptyState(termSvg, __('Seleziona un comando'), __('Scegli un comando dalla lista a sinistra per visualizzare i dettagli ed eseguirlo.')));
    }

    function removeDetailEmptyState() {
        if (detailHeader && detailHeader.dataset.emptyState) delete detailHeader.dataset.emptyState;
        if (detailArgs) detailArgs.disabled = false;
        setDetailButtons(false);
    }

    function selectCommand(action, name, desc) {
        removeDetailEmptyState();
        selectedCmd = { action: action, name: name };
        var prefix = action === 'run_composer' ? 'composer ' : 'php bin/magento ';

        if (detailTitle)      detailTitle.textContent = name;
        if (detailSubtitle)   detailSubtitle.textContent = desc || '';
        if (detailCmdFull)    detailCmdFull.textContent = prefix + name;
        if (detailHeader)     detailHeader.style.display = '';
        if (detailProps)      detailProps.style.display = '';
        if (detailContentBar) detailContentBar.style.display = '';
        if (detailArgs)       detailArgs.value = '';
        if (termHeader)       termHeader.style.display = 'none';

        // Deselect only children, keep parent selected state
        // Deselect all sidebar items (children AND parents)
        document.querySelectorAll('.ResourceSidebarItem').forEach(function (el) { el.classList.remove('selected'); });
        // Select the clicked child AND its parent
        document.querySelectorAll('.ResourceListItemChildren .ResourceSidebarItem').forEach(function (el) {
            var t = el.querySelector('.ResourceItem__Title');
            if (t && t.textContent === name) {
                el.classList.add('selected');
                // Also select the parent group
                var group = el.closest('.ResourceListItem');
                if (group) {
                    var parentSidebar = group.querySelector('.ResourceListItemParent .ResourceSidebarItem');
                    if (parentSidebar) parentSidebar.classList.add('selected');
                }
            }
        });
        // Keep existing terminal content; only show placeholder if empty
        var hasContent = term.querySelector('.line') || term.querySelector('.LogStageSection');
        if (!hasContent) {
            showCliPlaceholder();
        }
        updateClearBtn();
        if (detailRun) detailRun.classList.remove('disabled');
        updateDetailSwitchState();
        // If currently in Help view, refresh the help for the new command
        if (currentView === 'help') runHelpForCurrent();
    }

    // ── Log stage header ────────────────────────────────────

    function addLogStageHeader(name, success) {
        var es = term.querySelector('.term-empty-state');
        if (es) term.removeChild(es);

        var section = document.createElement('div');
        section.className = 'LogStageSection LogStageSection--opened';
        var header = document.createElement('div');
        header.className = 'LogStageSectionHeader';

        // Chevron
        var chevSvg = createSvg(16, 16, '0 0 24 24', [
            {attrs: {fill: 'white', d: SVG_PATH_CHEVRON}},
            {attrs: {fill: 'none', d: 'M0 0h24v24H0V0z'}}
        ]);
        var chevron = wrapIcon(chevSvg, 16, 'chevronDown');

        // Status icon
        var statusColor = success === true ? '#00d1ca' : success === false ? '#ff4d61' : '#629ada';
        var statusPath = success === true ? SVG_PATH_CHECK : success === false ? SVG_PATH_ERROR_X : SVG_PATH_CIRCLE;
        var statusSvg = createSvg(22, 22, '0 0 24 24', [{attrs: {'fill-rule': 'nonzero', fill: statusColor, d: statusPath}}]);
        var statusIcon = wrapIcon(statusSvg, 22, 'checkCircle status');
        if (success === null) statusIcon.classList.add('progress-pulse');
        var iconPath = statusSvg.querySelector('path');

        var titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.textContent = name;
        var elapsed = document.createElement('div');
        elapsed.className = 'elapsed';

        elapsed.textContent = 'just now';

        header.appendChild(chevron);
        header.appendChild(statusIcon);
        header.appendChild(titleEl);
        header.appendChild(elapsed);

        var lines = document.createElement('div');
        lines.className = 'LogStageSectionLines';

        chevron.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!section.classList.contains('LogStageSection--opened')) {
                section.classList.add('LogStageSection--opened');
                lines.style.display = '';
                animateExpand(lines);
            } else {
                animateCollapse(lines, function () {
                    section.classList.remove('LogStageSection--opened');
                    lines.style.display = 'none';
                });
            }
        });

        section.appendChild(header);
        section.appendChild(lines);
        term.appendChild(section);
        term.scrollTop = term.scrollHeight;
        return { section: section, iconPath: iconPath, lines: lines };
    }

    function finishStage(stage, ok) {
        var pulser = stage.section.querySelector('.progress-pulse');
        if (pulser) pulser.classList.remove('progress-pulse');
        if (stage.iconPath) {
            stage.iconPath.setAttribute('fill', ok ? '#00d1ca' : '#ff4d61');
            stage.iconPath.setAttribute('d', ok ? SVG_PATH_CHECK : SVG_PATH_ERROR_X);
        }
        activeLogLines = null;
    }

    // ── Run selected command (CLI mode) ──────────────────────

    function runSelectedCommand() {
        if (!selectedCmd) return;
        var args = detailArgs ? detailArgs.value.trim() : '';
        setDetailView('logs');
        // Remove empty state placeholder if present, but keep existing output
        var es = term.querySelector('.term-empty-state');
        if (es) term.removeChild(es);
        setRunning(true);
        setDetailButtons(true);

        var prefix = selectedCmd.action === 'run_composer' ? 'composer ' : 'bin/magento ';
        var stage = addLogStageHeader(prefix + selectedCmd.name + (args ? ' ' + args : ''), null);
        activeLogLines = stage.lines;

        // Show sidebar command status as progressing
        var sidebarItem = document.querySelector('.ResourceListItemChildren .ResourceSidebarItem.selected');
        var parentGroup = sidebarItem ? sidebarItem.closest('.ResourceListItem') : null;
        if (sidebarItem) {
            var cmdSt = sidebarItem.querySelector('.sidebar-cmd-status');
            if (cmdSt) {
                cmdSt.style.display = '';
                cmdSt.className = 'Status Status--progress sidebar-cmd-status';
                var lbl = cmdSt.querySelector('.StatusLabel');
                if (lbl) lbl.textContent = __('In esecuzione');
                sidebarItem.classList.add('has-status');
            }
        }
        // Parent: running count icon + progressing label
        if (parentGroup) {
            // Add/update running count badge
            var countBadge = parentGroup.querySelector('.running-count');
            if (!countBadge) {
                countBadge = document.createElement('div');
                countBadge.className = 'ResourceSidebarItemInfo running-count';
                var ci = document.createElement('div');
                ci.className = 'ResourceChildrenInfo';
                var cii = document.createElement('div');
                cii.className = 'ResourceChildrenInfoItem ResourceChildrenInfoItemProgressing';
                // doubleArrowLoopCircle icon from Komodor
                cii.appendChild(wrapIcon(createSvg(14, 14, '0 0 24 24', [{attrs: {fill: '#629ada', 'fill-rule': 'nonzero', d: 'M12 0c6.624 0 12 5.376 12 12s-5.376 12-12 12S0 18.624 0 12 5.376 0 12 0zM6.881922 8.7483047L3.552316 12.525652l1.565987 1.2772945 1.180374-1.3839833c-.067318 2.8930479 2.680608 5.8398385 5.812511 5.7474854 1.764309-.0520257 3.345086-.8855417 4.392954-2.1701659l-1.665199-1.3496978c-.864323 1.3057431-2.39414 1.5564957-3.884853 1.1071323-1.429552-.4309271-2.74373-1.8402105-2.808391-3.4012631l1.351158 1.0244448 1.234877-1.5362861-3.849812-3.0923081zm5.345214-2.6741539l-.212915.0016237c-1.764309.0520257-3.345086.8855417-4.392954 2.1701659l1.671754 1.3345882c.864323-1.3057431 2.387585-1.5413861 3.878297-1.0920227 1.429553.4309271 2.743731 1.8402105 2.808392 3.4012631l-1.351158-1.0244448-1.234877 1.5362861 3.849812 3.0923081 3.329606-3.7773473-1.565987-1.2772945-1.180374 1.3839833c.067318-2.8930479-2.680609-5.8398385-5.812511-5.7474854z'}}]), 14));
                var cv = document.createElement('div');
                cv.className = 'ResourceChildrenInfoItemValue';
                cv.textContent = '1';
                cii.appendChild(cv);
                ci.appendChild(cii);
                countBadge.appendChild(ci);
                // Insert before group-status
                var gs = parentGroup.querySelector('.group-status');
                if (gs) gs.parentNode.insertBefore(countBadge, gs);
            } else {
                var cv = countBadge.querySelector('.ResourceChildrenInfoItemValue');
                if (cv) cv.textContent = String(parseInt(cv.textContent || '0', 10) + 1);
            }
            // Update group status
            var gs = parentGroup.querySelector('.group-status');
            if (gs) {
                gs.style.display = '';
                gs.className = 'Status Status--progress group-status';
                if (!gs.querySelector('.StatusLabel')) {
                    var gl = document.createElement('div');
                    gl.className = 'StatusLabel';
                    gl.textContent = __('In esecuzione');
                    gs.insertBefore(gl, gs.firstChild);
                }
                if (!gs.querySelector('.StatusCircle')) {
                    var gsc = document.createElement('div');
                    gsc.className = 'StatusCircle';
                    gs.appendChild(gsc);
                }
            }
        }

        var url = BASE_URL
            + '?action=' + encodeURIComponent(selectedCmd.action)
            + '&name=' + encodeURIComponent(selectedCmd.name)
            + '&args=' + encodeURIComponent(args);

        openSse(url, function (ok) {
            setRunning(false);
            setDetailButtons(false);
            finishStage(stage, ok);
            // Update sidebar command status: progress → good/bad
            var cmdSt = sidebarItem ? sidebarItem.querySelector('.sidebar-cmd-status') : null;
            if (cmdSt) {
                cmdSt.className = 'Status ' + (ok ? 'Status--good' : 'Status--bad') + ' sidebar-cmd-status';
                var lbl = cmdSt.querySelector('.StatusLabel');
                if (lbl) lbl.textContent = ok ? __('Completato') : __('Errore');
            }
            // Update parent: decrement running count, update status
            if (parentGroup) {
                var cb = parentGroup.querySelector('.running-count');
                if (cb) {
                    var cv = cb.querySelector('.ResourceChildrenInfoItemValue');
                    var count = cv ? parseInt(cv.textContent || '1', 10) - 1 : 0;
                    if (count <= 0) {
                        cb.parentNode.removeChild(cb);
                        // No more running → hide group status
                        var gs = parentGroup.querySelector('.group-status');
                        if (gs) {
                            gs.className = 'Status group-status';
                            gs.style.display = 'none';
                            var gl = gs.querySelector('.StatusLabel');
                            if (gl) gl.parentNode.removeChild(gl);
                            var gc = gs.querySelector('.StatusCircle');
                            if (gc) gc.parentNode.removeChild(gc);
                        }
                    } else {
                        cv.textContent = String(count);
                    }
                }
            }
            activeLogLines = null;
            loadSysInfo();
        });
    }

    if (detailRun)  detailRun.addEventListener('click', function () { if (!detailRun.classList.contains('disabled')) runSelectedCommand(); });
    if (detailStop) detailStop.addEventListener('click', function () { stopExecution(__('Comando interrotto')); setDetailButtons(false); });
    if (detailArgs) detailArgs.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSelectedCommand(); });
    if (detailClear) detailClear.addEventListener('click', function () { clearOutput(); });

    // Logs/Help switch in detail content bar
    var helpCache = {};
    var currentView = 'logs';

    function runHelpForCurrent() {
        if (!selectedCmd) return;
        var key = selectedCmd.action + ':' + selectedCmd.name;
        if (helpCache[key]) {
            showHelpContent(helpCache[key]);
            return;
        }
        showHelpContent(__('Caricamento...'));
        fetch(BASE_URL + '?action=' + encodeURIComponent(selectedCmd.action)
            + '&name=help&args=' + encodeURIComponent(selectedCmd.name) + '&sync=1')
            .then(function (r) { return r.text(); })
            .then(function (txt) {
                // SSE response: parse 'data: {"line":"..."}' lines
                var lines = [];
                txt.split('\n').forEach(function (l) {
                    var m = l.match(/^data: (.*)$/);
                    if (!m) return;
                    try { var d = JSON.parse(m[1]); if (d.line) lines.push(d.line); }
                    catch (e) {}
                });
                var content = lines.join('\n');
                helpCache[key] = content;
                showHelpContent(content);
            })
            .catch(function () { showHelpContent(__('Info non disponibili')); });
    }

    function showHelpContent(text) {
        var helpBox = document.getElementById('terminal-help-view');
        if (!helpBox) {
            helpBox = document.createElement('pre');
            helpBox.id = 'terminal-help-view';
            helpBox.className = 'help-view';
            term.parentNode.insertBefore(helpBox, term);
        }
        helpBox.textContent = text;
    }

    function setDetailView(view) {
        if (!selectedCmd) return;
        currentView = view;
        document.querySelectorAll('.ResourceDetailsContentBar__SwitchOption').forEach(function (el) {
            el.classList.toggle('selected', el.dataset.view === view);
        });
        var helpBox = document.getElementById('terminal-help-view');
        if (view === 'help') {
            term.style.display = 'none';
            if (helpBox) helpBox.style.display = '';
            runHelpForCurrent();
        } else {
            term.style.display = '';
            if (helpBox) helpBox.style.display = 'none';
        }
    }

    function updateDetailSwitchState() {
        var bar = document.getElementById('detail-content-bar');
        if (!bar) return;
        bar.classList.toggle('disabled', !selectedCmd);
    }

    document.querySelectorAll('.ResourceDetailsContentBar__SwitchOption').forEach(function (el) {
        el.addEventListener('click', function () {
            if (!selectedCmd) return;
            setDetailView(this.dataset.view);
        });
    });

    // ── Group tabs ───────────────────────────────────────────

    var tabIndicator = document.getElementById('tab-indicator');

    function moveTabIndicator(tab) {
        if (!tabIndicator || !tab) return;
        var bar = tab.parentNode;
        var barRect = bar.getBoundingClientRect();
        var tabRect = tab.getBoundingClientRect();
        tabIndicator.style.left = (tabRect.left - barRect.left) + 'px';
        tabIndicator.style.width = tabRect.width + 'px';
    }

    function activateGroupTab(groupId) {
        var activeTab = null;
        document.querySelectorAll('.group-tab').forEach(function (t) {
            var isActive = t.dataset.group === groupId;
            t.classList.toggle('selected', isActive);
            if (isActive) activeTab = t;
        });
        document.querySelectorAll('.task-group').forEach(function (g) { g.classList.toggle('active-group', g.dataset.id === groupId); });
        moveTabIndicator(activeTab);
        try { localStorage.setItem('panel_active_group', groupId); } catch (e) {}
    }

    document.querySelectorAll('.group-tab').forEach(function (tab) {
        tab.addEventListener('click', function () { activateGroupTab(this.dataset.group); });
    });
    window.addEventListener('resize', function () {
        var active = document.querySelector('.group-tab.selected');
        if (active) moveTabIndicator(active);
    });

    // ── Terminal resize handle ────────────────────────────────

    (function () {
        var handle = document.getElementById('terminal-resize-handle');
        var panel  = document.getElementById('terminal-panel');
        if (!handle || !panel) return;
        var startY, startH;
        handle.addEventListener('mousedown', function (e) {
            startY = e.clientY; startH = panel.offsetHeight;
            handle.classList.add('dragging');
            panel.style.transition = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });
        function onMove(e) { panel.style.height = Math.max(80, Math.min(window.innerHeight * 0.8, startH + (startY - e.clientY))) + 'px'; }
        function onUp() {
            handle.classList.remove('dragging');
            panel.style.transition = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            // Reset all console buttons to enabled after manual drag
            var btns = document.querySelectorAll('.console-ctrl');
            btns.forEach(function (b) { b.classList.remove('disabled'); });
            consoleState = 'custom';
        }
    })();

    // ── Section switching ────────────────────────────────────

    function switchSection(section) {
        var isTasks = section === 'tasks', isCli = section === 'cli', isComposer = section === 'composer';
        var isCmdMode = isCli || isComposer;

        if (navTasks)    navTasks.classList.toggle('active', isTasks);
        if (navCommands) navCommands.classList.toggle('active', isCli);
        if (navComposer) navComposer.classList.toggle('active', isComposer);
        document.querySelectorAll('.mobile-nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.section === section); });

        var workspace = document.getElementById('workspace');
        if (workspace) workspace.classList.toggle('cli-layout', isCmdMode);
        var termPanel = document.getElementById('terminal-panel');
        if (termPanel) termPanel.style.height = '';

        var taskGroups        = document.getElementById('task-groups');
        var mageContainer     = document.getElementById('mage-commands-container');
        var composerContainer = document.getElementById('composer-commands-container');
        var groupTabs         = document.getElementById('group-tabs');

        if (taskGroups)        taskGroups.style.display        = isTasks ? '' : 'none';
        if (mageContainer)     mageContainer.style.display     = isCli ? '' : 'none';
        if (composerContainer) composerContainer.style.display = isComposer ? '' : 'none';
        if (groupTabs)         groupTabs.style.display         = isTasks ? '' : 'none';

        var pd = document.getElementById('preset-dropdown');
        if (pd) pd.style.display = isTasks ? '' : 'none';
        if (btnMaintenance) btnMaintenance.style.display = isTasks ? '' : 'none';
        var sysinfo = document.getElementById('header-sysinfo');

        if (detailHeader)     detailHeader.style.display     = 'none';
        if (detailProps)      detailProps.style.display       = 'none';
        if (detailContentBar) detailContentBar.style.display = 'none';
        if (termHeader)       termHeader.style.display       = isTasks ? '' : 'none';

        if (isCmdMode) { showDetailEmptyState(); } else { removeDetailEmptyState(); showTasksPlaceholder(); }

        selectedCmd = null;
        if (isCli)      loadCommandList(mageOpts);
        if (isComposer) loadCommandList(composerOpts);
    }

    if (navTasks)    navTasks.addEventListener('click',    function () { switchSection('tasks'); });
    if (navCommands) navCommands.addEventListener('click', function () { switchSection('cli'); });
    if (navComposer) navComposer.addEventListener('click', function () { switchSection('composer'); });

    // Mobile nav — switchSection already syncs everything
    document.querySelectorAll('.mobile-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { switchSection(this.dataset.section); });
    });

    // ── Event listeners ──────────────────────────────────────

    document.querySelectorAll('.task-run-btn').forEach(function (btn) {
        TASK_LABELS[btn.dataset.task] = btn.dataset.label;
        btn.addEventListener('click', function () {
            var taskId = this.dataset.task;
            var taskLabel = this.dataset.label;
            showConfirm(__('Esegui task'), __('Eseguire') + ' "' + taskLabel + '"?', function () {
                beginOperation();
                setProgress(0, taskLabel);
                runTask(taskId, taskLabel).then(function (ok) { finishOperation(ok); });
            });
        });
    });

    // Dropdown menus — only one open at a time
    function closeAllDropdowns() {
        document.querySelectorAll('.preset-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
    }
    function initDropdown(triggerId, dropdownId) {
        var trigger = document.getElementById(triggerId);
        var dropdown = document.getElementById(dropdownId);
        if (!trigger || !dropdown) return;
        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = dropdown.classList.contains('open');
            closeAllDropdowns();
            if (!wasOpen) dropdown.classList.add('open');
        });
    }
    document.addEventListener('click', closeAllDropdowns);

    initDropdown('preset-trigger', 'preset-dropdown');
    initDropdown('lang-trigger', 'lang-dropdown');

    btnStop.addEventListener('click', function () { stopExecution(__('Operazione interrotta')); });
    btnClear.addEventListener('click', clearOutput);

    // Console dots: red=minimize, yellow=default(260px), green=maximize
    var termPanelEl = document.getElementById('terminal-panel');
    var consoleMin = document.getElementById('console-minimize');
    var consoleDef = document.getElementById('console-default');
    var consoleMax = document.getElementById('console-maximize');

    var consoleState = 'default';

    function setConsoleState(state) {
        if (!termPanelEl) return;
        consoleState = state;
        var headerH = document.getElementById('terminal-header');
        headerH = headerH ? headerH.offsetHeight : 36;
        if (state === 'min') {
            termPanelEl.style.height = headerH + 'px';
        } else if (state === 'max') {
            var available = termPanelEl.parentNode ? termPanelEl.parentNode.offsetHeight : window.innerHeight;
            termPanelEl.style.height = available + 'px';
        } else {
            termPanelEl.style.height = '260px';
        }
        if (consoleMin) consoleMin.classList.toggle('disabled', state === 'min');
        if (consoleDef) consoleDef.classList.toggle('disabled', state === 'default');
        if (consoleMax) consoleMax.classList.toggle('disabled', state === 'max');
    }

    if (consoleMin) consoleMin.addEventListener('click', function () { setConsoleState('min'); });
    if (consoleDef) consoleDef.addEventListener('click', function () { setConsoleState('default'); });
    if (consoleMax) consoleMax.addEventListener('click', function () { setConsoleState('max'); });
    setConsoleState('default');

    document.querySelectorAll('.preset-confirm').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllDropdowns();
            var presetKey = this.dataset.preset;
            var presetLabel = this.dataset.label || presetKey;
            var ids = PRESETS[presetKey] || [];
            if (!ids.length) return;
            showConfirm(__('Esegui preset'), presetLabel + '\n\n' + __('Eseguire') + ' ' + ids.length + ' ' + __('operazioni') + '?', function () {
                beginOperation();
                (async function () {
                    var allOk = true;
                    for (var i = 0; i < ids.length; i++) {
                        if (stopRequested) { addLine(__('Interrotto'), 'warn'); break; }
                        var stepLabel = TASK_LABELS[ids[i]] || ids[i];
                        setProgress(Math.round((i / ids.length) * 100), '[' + (i + 1) + '/' + ids.length + '] ' + stepLabel);
                        var ok = await runTask(ids[i], stepLabel);
                        if (!ok) allOk = false;
                    }
                    finishOperation(allOk);
                })();
            });
        });
    });

    // ── Init ─────────────────────────────────────────────────

    (function () {
        if (tabIndicator) tabIndicator.style.transition = 'none';
        var saved = null;
        try { saved = localStorage.getItem('panel_active_group'); } catch (e) {}
        var target = saved && document.querySelector('.group-tab[data-group="' + CSS.escape(saved) + '"]')
            ? saved : (document.querySelector('.group-tab') || {}).dataset.group || '__static';
        activateGroupTab(target);
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (tabIndicator) tabIndicator.style.transition = ''; }); });
    })();

    clearOutput();
    loadSysInfo();
    updateDetailSwitchState();

    document.querySelectorAll('.lang-option').forEach(function (el) {
        el.addEventListener('click', function () {
            var url = new URL(window.location.href);
            url.searchParams.set('lang', this.dataset.lang);
            window.location.href = url.toString();
        });
    });

    // ── Storage modal ────────────────────────────────────────
    var sysinfoEl = document.getElementById('header-sysinfo');
    if (sysinfoEl) {
        sysinfoEl.addEventListener('click', function (e) {
            if (tourMode) return; // explore/guided tour handles its own clicks
            openStorageModal();
        });
    }

    function openStorageModal() {
        var modal = document.getElementById('storage-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'storage-modal';
            modal.className = 'Modal';
            modal.innerHTML =
                '<div class="DialogContainer">'
              +   '<a role="button" class="DialogCloseButton" aria-label="close">×</a>'
              +   '<div class="ModalSizer">'
              +     '<div class="ModalTitle">' + __('Storage') + '</div>'
              +     '<div class="ModalContainer">'
              +       '<div class="ModalContent withTitle" id="storage-modal-body">'
              +         '<div class="storage-loading">' + __('Caricamento...') + '</div>'
              +       '</div>'
              +     '</div>'
              +   '</div>'
              + '</div>';
            document.body.appendChild(modal);
            modal.addEventListener('click', function (e) {
                if (e.target === modal) modal.classList.remove('open');
            });
            modal.querySelector('.DialogCloseButton').addEventListener('click', function () {
                modal.classList.remove('open');
            });
        }
        modal.classList.add('open');
        loadStorageInfo();
    }

    function loadStorageInfo() {
        var body = document.getElementById('storage-modal-body');
        body.innerHTML = '<div class="storage-loading">' + __('Caricamento...') + '</div>';
        fetch(BASE_URL + '?action=diskinfo')
            .then(function (r) { return r.json(); })
            .then(function (data) { renderStorageInfo(body, data); })
            .catch(function () { body.innerHTML = '<div class="storage-loading">' + __('Info non disponibili') + '</div>'; });
    }

    function renderStorageInfo(body, data) {
        var max = data.folders.length ? data.folders[0].size : 1;
        var hotMax = data.hot_folders.length ? data.hot_folders[0].size : 1;

        var html = '<div class="storage-summary">'
                 +   '<div class="storage-stat"><div class="storage-stat-label">' + __('Disco totale') + '</div><div class="storage-stat-value">' + data.disk_total + '</div></div>'
                 +   '<div class="storage-stat"><div class="storage-stat-label">' + __('Usato') + '</div><div class="storage-stat-value">' + data.disk_used + ' (' + data.disk_used_pct + '%)</div></div>'
                 +   '<div class="storage-stat"><div class="storage-stat-label">' + __('Libero') + '</div><div class="storage-stat-value">' + data.disk_free + '</div></div>'
                 +   '<div class="storage-stat"><div class="storage-stat-label">' + __('Magento') + '</div><div class="storage-stat-value">' + data.magento_size + '</div></div>'
                 + '</div>';

        if (data.hot_folders.length) {
            html += '<h3 class="storage-section-title">' + __('Cartelle Magento (cache, log, static, ecc.)') + '</h3>';
            html += '<div class="storage-bars">';
            data.hot_folders.forEach(function (f) {
                var pct = Math.max(1, (f.size / hotMax) * 100);
                html += '<div class="storage-bar-row">'
                      +   '<div class="storage-bar-name">' + escapeHtml(f.name) + '</div>'
                      +   '<div class="storage-bar-track"><div class="storage-bar-fill" style="width:' + pct + '%"></div></div>'
                      +   '<div class="storage-bar-size">' + f.size_human + '</div>'
                      + '</div>';
            });
            html += '</div>';
        }

        html += '<h3 class="storage-section-title">' + __('Cartelle principali di ') + escapeHtml(data.root_name) + '</h3>';
        html += '<div class="storage-bars">';
        data.folders.forEach(function (f) {
            var pct = Math.max(1, (f.size / max) * 100);
            html += '<div class="storage-bar-row">'
                  +   '<div class="storage-bar-name">' + escapeHtml(f.name) + '</div>'
                  +   '<div class="storage-bar-track"><div class="storage-bar-fill" style="width:' + pct + '%"></div></div>'
                  +   '<div class="storage-bar-size">' + f.size_human + '</div>'
                  + '</div>';
        });
        html += '</div>';

        body.innerHTML = html;
    }

    // ── Tour / Help ──────────────────────────────────────────
    //
    // Due modalità:
    //   1. Explore mode: click su Guida → modalità help. Hover sugli elementi
    //      target li evidenzia, click mostra il testo. Altro click su Guida esce.
    //   2. Tour guidato: doppio click su Guida → tour passo-passo con Avanti/Fine.

    var TOUR_RAW = window.PANEL_TOUR || [];
    // Espande gli step con "each": true in uno step per ogni elemento matching
    function expandTour() {
        var result = [];
        TOUR_RAW.forEach(function (step) {
            if (step.each) {
                var els = document.querySelectorAll(step.target);
                els.forEach(function (el, i) {
                    // Crea un selettore unico per questo elemento
                    if (!el.id) el.id = 'tour-dyn-' + Math.random().toString(36).slice(2, 8);
                    result.push({ target: '#' + el.id, text: step.text, placement: step.placement });
                });
            } else {
                result.push(step);
            }
        });
        return result;
    }
    var TOUR = TOUR_RAW;
    var tourMode = null; // null | 'explore' | 'guided'
    var tourStep = 0;
    var tourBackdrop = null;
    var tourTooltip = null;
    var tourHighlight = null;
    var tourClickTimer = null;

    function createTourElements() {
        tourBackdrop = document.createElement('div');
        tourBackdrop.id = 'tour-backdrop';
        document.body.appendChild(tourBackdrop);

        tourHighlight = document.createElement('div');
        tourHighlight.id = 'tour-highlight';
        document.body.appendChild(tourHighlight);

        tourTooltip = document.createElement('div');
        tourTooltip.id = 'tour-tooltip';
        document.body.appendChild(tourTooltip);
    }

    function removeTourElements() {
        if (tourBackdrop) { tourBackdrop.remove(); tourBackdrop = null; }
        if (tourHighlight) { tourHighlight.remove(); tourHighlight = null; }
        if (tourTooltip) { tourTooltip.remove(); tourTooltip = null; }
    }

    function findTourStep(el) {
        // Check all raw tour steps including each-expanded
        for (var i = 0; i < TOUR_RAW.length; i++) {
            var step = TOUR_RAW[i];
            if (step.each) {
                // Match any element of this selector
                var match = el.closest(step.target);
                if (match) return { text: step.text, placement: step.placement, target: match };
            } else {
                var target = document.querySelector(step.target);
                if (target && (target === el || target.contains(el))) return { text: step.text, placement: step.placement, target: target };
            }
        }
        return null;
    }

    function renderTourStep(stepIdx, showCounter) {
        var step = TOUR[stepIdx];
        var el = document.querySelector(step.target);
        if (!el || el.offsetParent === null) return false;

        var rect = el.getBoundingClientRect();
        var pad = 6;

        // Backdrop mask: ritaglia l'elemento target
        var maskRect = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><rect width=\'' + (rect.width + pad * 2) + '\' height=\'' + (rect.height + pad * 2) + '\' rx=\'3\'/></svg>"), linear-gradient(white, white)';
        tourBackdrop.style.maskImage = maskRect;
        tourBackdrop.style.webkitMaskImage = maskRect;
        var maskPos = (rect.left - pad) + 'px ' + (rect.top - pad) + 'px, 0 0';
        tourBackdrop.style.maskPosition = maskPos;
        tourBackdrop.style.webkitMaskPosition = maskPos;
        tourBackdrop.style.maskComposite = 'exclude';
        tourBackdrop.style.webkitMaskComposite = 'xor';
        tourBackdrop.style.maskRepeat = 'no-repeat';
        tourBackdrop.style.webkitMaskRepeat = 'no-repeat';

        // Highlight clamped to viewport (no pad, match hover box-shadow)
        var hlLeft   = Math.max(4, rect.left);
        var hlTop    = Math.max(4, rect.top);
        var hlRight  = Math.min(window.innerWidth - 4, rect.right);
        var hlBottom = Math.min(window.innerHeight - 4, rect.bottom);
        tourHighlight.style.top = hlTop + 'px';
        tourHighlight.style.left = hlLeft + 'px';
        tourHighlight.style.width = (hlRight - hlLeft) + 'px';
        tourHighlight.style.height = (hlBottom - hlTop) + 'px';

        // Tooltip content
        var html = '';
        if (showCounter) {
            html += '<div class="tour-progress-track"><div class="tour-progress" style="width:' + (((stepIdx + 1) / TOUR.length) * 100) + '%"></div></div>';
        }
        html += '<div class="tour-body">' + escapeHtml(__(step.text)) + '</div>';
        if (showCounter) {
            html += '<div class="tour-footer">';
            html += '<span class="tour-counter">' + (stepIdx + 1) + ' ' + __('di') + ' ' + TOUR.length + '</span>';
            html += '<button class="tour-btn" id="tour-next">' + (stepIdx === TOUR.length - 1 ? __('Fine') : __('Avanti')) + '</button>';
            html += '</div>';
        }
        tourTooltip.innerHTML = html;

        var nextBtn = document.getElementById('tour-next');
        if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextTourStep(); });

        // Make visible first so we can measure
        tourTooltip.style.transform = '';
        tourTooltip.style.display = 'block';
        tourTooltip.style.left = '-9999px';
        tourTooltip.style.top = '0';
        var tipW = tourTooltip.offsetWidth;
        var tipH = tourTooltip.offsetHeight;

        // Position tooltip
        var placement = step.placement || 'bottom';
        var tx, ty;
        if (placement === 'bottom') {
            tx = rect.left + rect.width / 2 - tipW / 2;
            ty = rect.bottom + pad + 12;
        } else if (placement === 'top') {
            tx = rect.left + rect.width / 2 - tipW / 2;
            ty = rect.top - pad - 12 - tipH;
        } else if (placement === 'right') {
            tx = rect.right + pad + 12;
            ty = rect.top + rect.height / 2 - tipH / 2;
        } else {
            tx = rect.left - pad - 12 - tipW;
            ty = rect.top + rect.height / 2 - tipH / 2;
        }
        // Clamp to viewport
        tx = Math.max(8, Math.min(window.innerWidth - tipW - 8, tx));
        ty = Math.max(8, Math.min(window.innerHeight - tipH - 8, ty));
        tourTooltip.style.top = ty + 'px';
        tourTooltip.style.left = tx + 'px';
        return true;
    }

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderExploreStep(hit) {
        var el = hit.target;
        var rect = el.getBoundingClientRect();

        // Highlight exactly the element bounds, clamped to viewport (click = blue)
        tourHighlight.classList.remove('hover');
        tourHighlight.style.display = '';
        var hlLeft   = Math.max(4, rect.left);
        var hlTop    = Math.max(4, rect.top);
        var hlRight  = Math.min(window.innerWidth - 4, rect.right);
        var hlBottom = Math.min(window.innerHeight - 4, rect.bottom);
        tourHighlight.style.top = hlTop + 'px';
        tourHighlight.style.left = hlLeft + 'px';
        tourHighlight.style.width = (hlRight - hlLeft) + 'px';
        tourHighlight.style.height = (hlBottom - hlTop) + 'px';

        // Tooltip content (no button, no counter in explore)
        tourTooltip.innerHTML = '<div class="tour-body">' + escapeHtml(__(hit.text)) + '</div>';
        tourTooltip.style.display = 'block';
        tourTooltip.style.transform = '';
        tourTooltip.style.left = '-9999px';
        tourTooltip.style.top = '0';
        var tipW = tourTooltip.offsetWidth;
        var tipH = tourTooltip.offsetHeight;

        var placement = hit.placement || 'bottom';
        var gap = 12;
        var tx, ty;
        if (placement === 'bottom') {
            tx = rect.left + rect.width / 2 - tipW / 2;
            ty = rect.bottom + gap;
        } else if (placement === 'top') {
            tx = rect.left + rect.width / 2 - tipW / 2;
            ty = rect.top - gap - tipH;
        } else if (placement === 'right') {
            tx = rect.right + gap;
            ty = rect.top + rect.height / 2 - tipH / 2;
        } else {
            tx = rect.left - gap - tipW;
            ty = rect.top + rect.height / 2 - tipH / 2;
        }
        tx = Math.max(8, Math.min(window.innerWidth - tipW - 8, tx));
        ty = Math.max(8, Math.min(window.innerHeight - tipH - 8, ty));
        tourTooltip.style.top = ty + 'px';
        tourTooltip.style.left = tx + 'px';
    }

    function startGuidedTour() {
        endTour();
        tourMode = 'guided';
        tourStep = 0;
        TOUR = expandTour();
        createTourElements();
        tourBackdrop.addEventListener('click', endTour);
        renderTourStep(tourStep, true);
    }

    function nextTourStep() {
        tourStep++;
        while (tourStep < TOUR.length && !renderTourStep(tourStep, true)) {
            tourStep++;
        }
        if (tourStep >= TOUR.length) endTour();
    }

    function markTourTargets() {
        // Mark all elements that have a tour step
        TOUR_RAW.forEach(function (step) {
            document.querySelectorAll(step.target).forEach(function (el) {
                el.classList.add('tour-target');
            });
        });
    }
    function unmarkTourTargets() {
        document.querySelectorAll('.tour-target').forEach(function (el) {
            el.classList.remove('tour-target');
        });
    }

    function startExploreMode() {
        endTour();
        tourMode = 'explore';
        createTourElements();
        document.body.classList.add('tour-explore');
        markTourTargets();
        tourHighlight.style.display = 'none';

        // Intro tooltip (no button, clicca in giro per esplorare)
        var help = document.getElementById('nav-help');
        var hrect = help.getBoundingClientRect();
        tourTooltip.innerHTML = '<div class="tour-body">' + escapeHtml(__('tour_intro')) + '</div>';
        tourTooltip.style.display = 'block';
        tourTooltip.style.transform = '';
        tourTooltip.style.left = '-9999px';
        tourTooltip.style.top = '0';
        var tipW = tourTooltip.offsetWidth;
        var tipH = tourTooltip.offsetHeight;
        var tx = Math.max(8, Math.min(window.innerWidth - tipW - 8, hrect.right + 16));
        var ty = Math.max(8, Math.min(window.innerHeight - tipH - 8, hrect.top - 20));
        tourTooltip.style.left = tx + 'px';
        tourTooltip.style.top = ty + 'px';
    }

    function endTour() {
        tourMode = null;
        document.body.classList.remove('tour-explore');
        unmarkTourTargets();
        removeTourElements();
    }

    // Explore mode: intercept ALL clicks
    document.addEventListener('click', function (e) {
        if (tourMode !== 'explore') return;
        if (e.target.closest('#nav-help') || e.target.closest('#tour-tooltip')) return;
        // Blocca SEMPRE il click normale in explore mode
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        var hit = findTourStep(e.target);
        if (hit) {
            tourHighlight.style.display = '';
            renderExploreStep(hit);
        }
    }, true);

    // Explore mode: hover highlight via #tour-highlight (clamped to viewport)
    document.addEventListener('mouseover', function (e) {
        if (tourMode !== 'explore') return;
        if (e.target.closest('#tour-tooltip') || e.target.closest('#nav-help')) return;
        var hit = findTourStep(e.target);
        if (!hit) {
            tourHighlight.classList.remove('hover');
            if (!tourTooltip || tourTooltip.style.display === 'none') tourHighlight.style.display = 'none';
            return;
        }
        var rect = hit.target.getBoundingClientRect();
        var hlLeft   = Math.max(4, rect.left);
        var hlTop    = Math.max(4, rect.top);
        var hlRight  = Math.min(window.innerWidth - 4, rect.right);
        var hlBottom = Math.min(window.innerHeight - 4, rect.bottom);
        tourHighlight.style.display = '';
        tourHighlight.style.top = hlTop + 'px';
        tourHighlight.style.left = hlLeft + 'px';
        tourHighlight.style.width = (hlRight - hlLeft) + 'px';
        tourHighlight.style.height = (hlBottom - hlTop) + 'px';
        tourHighlight.classList.add('hover');
    });

    var navHelp = document.getElementById('nav-help');
    if (navHelp) {
        navHelp.addEventListener('click', function (e) {
            e.stopPropagation();
            if (tourMode) { endTour(); return; }
            startExploreMode();
        });
        navHelp.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            startGuidedTour();
        });
    }

})();
