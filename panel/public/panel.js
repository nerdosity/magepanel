/* ================================================================
   Nerdosity Deploy Panel — Frontend JS
   ================================================================ */
(function () {
    'use strict';

    var BASE_URL = window.PANEL_BASE_URL || 'index.php';
    var PRESETS  = window.PANEL_PRESETS  || {};
    var I18N     = window.PANEL_I18N     || {};

    // ── Helpers ──────────────────────────────────────────────

    function __(s) { return I18N[s] || s; }

    function clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    function pluralize(n, singular, plural) { return n === 1 ? __(singular) : __(plural); }

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var SVG_PATH_CHECK   = 'M20.486563 3.5134371c4.684583 4.6845827 4.684583 12.2885431 0 16.9731258-4.684583 4.6845828-12.288543 4.6845828-16.973126 0-4.684583-4.6845827-4.684583-12.2885431 0-16.9731258 4.684583-4.6845828 12.288543-4.6845828 16.973126 0zM17.24141 7l-6.965641 6.6359475L6.75859 10.271895 5 11.9539213l3.517179 3.3640525L10.275769 17l1.75859-1.6820262L19 8.6820262 17.24141 7z';
    var SVG_PATH_ERROR_X = 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z';
    var SVG_PATH_CIRCLE  = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z';
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
    var btnRun            = document.getElementById('btn-run');
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
    var sysInfo           = document.getElementById('sys-info');
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
    var detailClear       = document.getElementById('detail-clear');
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
        if (detailRun)  { if (running) detailRun.setAttribute('disabled', ''); else detailRun.removeAttribute('disabled'); }
        if (detailStop) { if (!running) detailStop.setAttribute('disabled', ''); else detailStop.removeAttribute('disabled'); }
    }

    function beginOperation() {
        clearOutput();
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
        btnRun.disabled  = isRunning;
        btnStop.disabled = !isRunning;
        if (btnStatic) btnStatic.disabled = isRunning;
        document.querySelectorAll('.IconBtn[data-preset], .task-run-btn').forEach(function (el) {
            if (isRunning) el.setAttribute('disabled', ''); else el.removeAttribute('disabled');
        });
    }

    function setProgress(pct, label) {
        if (progressBar)  progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = label;
    }

    function updateClearBtn() {
        var hasOutput = term.querySelector('.line') || term.querySelector('.LogStageSection');
        btnClear.disabled = !hasOutput;
        if (detailClear) {
            if (hasOutput) detailClear.removeAttribute('disabled');
            else detailClear.setAttribute('disabled', '');
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
        if (/^\[OK\] .*(exit \d)/.test(text) || /^\[ERRORE\] .*(exit \d|Exit \d)/.test(text)) type = 'exit';
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

    function addSeparator(label) {
        var div = document.createElement('div');
        div.className = 'line line-separator';
        div.textContent = '\u2500\u2500\u2500 ' + label + ' ' + '\u2500'.repeat(Math.max(0, 50 - label.length));
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
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

    function runTask(taskId) {
        return new Promise(function (resolve) {
            openSse(BASE_URL + '?action=stream&task=' + encodeURIComponent(taskId), resolve);
        });
    }

    // ── Static content deploy ────────────────────────────────

    var staticCount = document.getElementById('static-count');

    function updateStaticCount() {
        var total = document.querySelectorAll('.static-opt:checked').length;
        if (staticCount) staticCount.textContent = total > 0 ? (total + ' ' + pluralize(total, 'selezionato', 'selezionati')) : '';
        if (btnStatic) btnStatic.disabled = total === 0;
    }

    document.querySelectorAll('.static-opt').forEach(function (cb) { cb.addEventListener('change', updateStaticCount); });
    updateStaticCount();

    if (btnStatic) {
        btnStatic.addEventListener('click', function () {
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
                openSse(BASE_URL + '?' + qs, function (ok) { finishOperation(ok); });
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

    function updateMaintenanceUI() {
        if (mainBadge) mainBadge.className = maintenanceOn ? 'badge badge-maintenance' : 'badge badge-hidden';
        if (btnMaintenance) btnMaintenance.dataset.state = maintenanceOn ? 'on' : 'off';
        if (maintStateLabel) maintStateLabel.textContent = maintenanceOn ? 'ON' : 'OFF';
    }

    if (btnMaintenance) {
        btnMaintenance.addEventListener('click', function () {
            var msg = maintenanceOn
                ? __('Disattivare la modalità manutenzione? Il sito tornerà online.')
                : __('Attivare la modalità manutenzione? Il sito sarà irraggiungibile.');
            showConfirm(__('Manutenzione'), msg, function () {
                beginOperation();
                openSse(BASE_URL + '?action=stream&task=' + encodeURIComponent(maintenanceOn ? 'maintenance_disable' : 'maintenance_enable'),
                    function () { setRunning(false); loadSysInfo(); });
            });
        });
    }

    // ── System info ──────────────────────────────────────────

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
            })
            .catch(function () { if (sysInfo) sysInfo.textContent = __('Info non disponibili'); });
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
                if (firstGroup) firstGroup.classList.add('expanded');
                var firstCmd = opts.container.querySelector('.ResourceListItemChildren .ResourceSidebarItem');
                if (firstCmd) firstCmd.click();
            })
            .catch(function () { opts.container.textContent = opts.errorMsg; });
    }

    var mageOpts = { container: mageCommandsList, badge: mageCommandsBadge, fetchAction: 'commands', runAction: 'run', loaded: false, errorMsg: __('Impossibile caricare i comandi') };
    var composerOpts = { container: composerCommandsList, badge: composerCommandsBadge, fetchAction: 'composer_commands', runAction: 'run_composer', loaded: false, errorMsg: __('Impossibile caricare i comandi composer') };

    // ── Build command list UI ────────────────────────────────

    function buildNsGroup(ns, cmds, runAction) {
        var group = document.createElement('div');
        group.className = 'ResourceListItem ns-group';

        var parent = document.createElement('div');
        parent.className = 'ResourceListItemParent';

        // Parent sidebar item
        var sidebar = document.createElement('div');
        sidebar.className = 'ResourceSidebarItem selected';

        var groupIcon = document.createElement('div');
        groupIcon.className = 'cmd-icon-group';
        groupIcon.appendChild(createSvg(16, 16, '0 0 24 24', [
            {attrs: {d: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z', fill: '#fff'}}
        ]));
        var resItem = buildResourceItem(groupIcon, ns, cmds.length + ' ' + pluralize(cmds.length, 'comando', 'comandi'));
        sidebar.appendChild(resItem);

        var spacer = document.createElement('div');
        spacer.className = 'flex-auto';
        sidebar.appendChild(spacer);

        // Count badge
        var info = document.createElement('div');
        info.className = 'ResourceSidebarItemInfo';
        var childInfo = document.createElement('div');
        childInfo.className = 'ResourceChildrenInfo';
        var infoItem = document.createElement('div');
        infoItem.className = 'ResourceChildrenInfoItem';
        infoItem.appendChild(wrapIcon(createSvg(14, 14, '0 0 24 24', [{attrs: {fill: '#00d1ca', d: SVG_PATH_CHECK_SM}}]), 14));
        var countVal = document.createElement('div');
        countVal.className = 'ResourceChildrenInfoItemValue';
        countVal.textContent = cmds.length;
        infoItem.appendChild(countVal);
        childInfo.appendChild(infoItem);
        info.appendChild(childInfo);
        sidebar.appendChild(info);

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
                animateExpand(collapse);
            } else {
                animateCollapse(collapse, function () { group.classList.remove('expanded'); });
            }
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

        document.querySelectorAll('.ResourceSidebarItem').forEach(function (el) { el.classList.remove('selected'); });
        document.querySelectorAll('.ResourceListItemChildren .ResourceSidebarItem').forEach(function (el) {
            var t = el.querySelector('.ResourceItem__Title');
            if (t && t.textContent === name) el.classList.add('selected');
        });
        clearOutput();
    }

    // ── Log stage header (CLI mode) ──────────────────────────

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

    // ── Run selected command (CLI mode) ──────────────────────

    function runSelectedCommand() {
        if (!selectedCmd) return;
        var args = detailArgs ? detailArgs.value.trim() : '';
        clearOutput();
        setRunning(true);
        setDetailButtons(true);

        var prefix = selectedCmd.action === 'run_composer' ? 'composer ' : 'bin/magento ';
        var stage = addLogStageHeader(prefix + selectedCmd.name + (args ? ' ' + args : ''), null);
        activeLogLines = stage.lines;

        var url = BASE_URL
            + '?action=' + encodeURIComponent(selectedCmd.action)
            + '&name=' + encodeURIComponent(selectedCmd.name)
            + '&args=' + encodeURIComponent(args);

        openSse(url, function (ok) {
            setRunning(false);
            setDetailButtons(false);
            var pulser = stage.section.querySelector('.progress-pulse');
            if (pulser) pulser.classList.remove('progress-pulse');
            if (stage.iconPath) {
                stage.iconPath.setAttribute('fill', ok ? '#00d1ca' : '#ff4d61');
                stage.iconPath.setAttribute('d', ok ? SVG_PATH_CHECK : SVG_PATH_ERROR_X);
            }
            activeLogLines = null;
            loadSysInfo();
        });
    }

    if (detailRun)  detailRun.addEventListener('click', function () { if (!detailRun.hasAttribute('disabled')) runSelectedCommand(); });
    if (detailStop) detailStop.addEventListener('click', function () { stopExecution(__('Comando interrotto')); setDetailButtons(false); });
    if (detailArgs) detailArgs.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSelectedCommand(); });
    if (detailClear) detailClear.addEventListener('click', function () { clearOutput(); });

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
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });
        function onMove(e) { panel.style.height = Math.max(80, Math.min(window.innerHeight * 0.8, startH + (startY - e.clientY))) + 'px'; }
        function onUp() { handle.classList.remove('dragging'); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
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

        document.querySelectorAll('.header-controls .IconBtn[data-preset]').forEach(function (btn) { btn.style.display = isTasks ? '' : 'none'; });
        var headerSep = document.querySelector('.header-sep');
        if (headerSep) headerSep.style.display = isTasks ? '' : 'none';

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
        btn.addEventListener('click', function () {
            var taskId = this.dataset.task;
            var taskLabel = this.dataset.label;
            showConfirm(__('Esegui task'), __('Eseguire') + ' "' + taskLabel + '"?', function () {
                beginOperation();
                addSeparator(taskLabel);
                setProgress(0, taskLabel);
                runTask(taskId).then(function (ok) { finishOperation(ok); });
            });
        });
    });

    btnStop.addEventListener('click', function () { stopExecution(__('Operazione interrotta')); });
    btnClear.addEventListener('click', clearOutput);

    document.querySelectorAll('.preset-confirm').forEach(function (btn) {
        btn.addEventListener('click', function () {
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
                        setProgress(Math.round((i / ids.length) * 100), '[' + (i + 1) + '/' + ids.length + ']');
                        var ok = await runTask(ids[i]);
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

    var langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.addEventListener('change', function () {
            var url = new URL(window.location.href);
            url.searchParams.set('lang', this.value);
            window.location.href = url.toString();
        });
    }

})();
