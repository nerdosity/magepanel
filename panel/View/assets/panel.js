/* ================================================================
   Nerdosity Deploy Panel — Frontend JS
   ================================================================ */
(function () {
    'use strict';

    // Config injected by PHP (see dashboard.php)
    var TOKEN    = window.PANEL_TOKEN    || '';
    var BASE_URL = window.PANEL_BASE_URL || 'index.php';
    var PRESETS  = window.PANEL_PRESETS  || {};

    // DOM refs
    var term         = document.getElementById('terminal');
    var btnRun       = document.getElementById('btn-run');
    var btnStop      = document.getElementById('btn-stop');
    var btnClear     = document.getElementById('btn-clear');
    var progressBar  = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    var sysInfo      = document.getElementById('sys-info');
    var mainBadge    = document.getElementById('maintenance-badge');

    var currentEs = null;
    var stopRequested = false;

    // ----------------------------------------------------------------
    //  Terminal output
    // ----------------------------------------------------------------

    function clearOutput() {
        while (term.firstChild) {
            term.removeChild(term.firstChild);
        }
        var ph = document.createElement('div');
        ph.className = 'term-placeholder';
        ph.textContent = 'L\'output apparirà qui...';
        term.appendChild(ph);

        setProgress(0, '');
    }

    function addLine(text, type) {
        var ph = term.querySelector('.term-placeholder');
        if (ph) {
            term.removeChild(ph);
        }

        var div = document.createElement('div');
        var safeType = /^[a-z\-]+$/.test(type) ? type : 'output';
        div.className = 'line line-' + safeType;
        div.textContent = text;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
    }

    function addSeparator(label) {
        var div = document.createElement('div');
        div.className = 'line line-separator';
        div.textContent = '─── ' + label + ' ' + '─'.repeat(Math.max(0, 52 - label.length));
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
    }

    function setProgress(pct, label) {
        if (progressBar)  progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = label;
    }

    // ----------------------------------------------------------------
    //  Task runner (SSE-based)
    // ----------------------------------------------------------------

    function runTask(taskId) {
        return new Promise(function (resolve) {
            var url = BASE_URL
                + '?action=stream'
                + '&task='  + encodeURIComponent(taskId)
                + '&token=' + encodeURIComponent(TOKEN);

            var es = new EventSource(url);
            currentEs = es;

            es.onmessage = function (e) {
                try {
                    var data = JSON.parse(e.data);
                    addLine(data.line, data.type);
                } catch (ex) {
                    addLine(e.data, 'output');
                }
            };

            es.addEventListener('done', function (e) {
                es.close();
                currentEs = null;
                resolve(parseInt(e.data, 10) === 0);
            });

            es.onerror = function () {
                es.close();
                currentEs = null;
                addLine('Errore di connessione SSE', 'error');
                resolve(false);
            };
        });
    }

    async function runSelectedTasks() {
        var checked = Array.from(document.querySelectorAll('.task-check:checked'));
        if (!checked.length) {
            alert('Seleziona almeno un\'operazione');
            return;
        }

        var taskIds    = checked.map(function (c) { return c.value; });
        var taskLabels = checked.map(function (c) { return c.dataset.label || c.value; });

        clearOutput();
        setRunning(true);
        stopRequested = false;

        var allOk = true;

        for (var i = 0; i < taskIds.length; i++) {
            if (stopRequested) {
                addLine('Operazioni interrotte dall\'utente', 'warn');
                break;
            }

            addSeparator(taskLabels[i]);
            setProgress(
                Math.round((i / taskIds.length) * 100),
                '[' + (i + 1) + '/' + taskIds.length + '] ' + taskLabels[i]
            );

            var ok = await runTask(taskIds[i]);
            if (!ok) allOk = false;
        }

        setProgress(100, allOk ? 'Completato' : 'Completato con errori');
        addSeparator(allOk ? '✓ TUTTO OK' : '✗ CI SONO STATI ERRORI');
        setRunning(false);

        // Refresh sys info in case maintenance state changed
        loadSysInfo();
    }

    // ----------------------------------------------------------------
    //  Running state
    // ----------------------------------------------------------------

    function setRunning(isRunning) {
        btnRun.disabled  = isRunning;
        btnStop.disabled = !isRunning;

        document.querySelectorAll('.task-check, .group-check, .preset-btn').forEach(function (el) {
            el.disabled = isRunning;
        });
    }

    // ----------------------------------------------------------------
    //  Presets
    // ----------------------------------------------------------------

    function applyPreset(presetKey) {
        var ids = PRESETS[presetKey] || [];

        document.querySelectorAll('.task-check').forEach(function (cb) {
            cb.checked = ids.indexOf(cb.value) !== -1;
        });

        // Sync group checkboxes
        syncGroupChecks();
    }

    function syncGroupChecks() {
        document.querySelectorAll('.group-check').forEach(function (gc) {
            var group = gc.dataset.group;
            var all   = document.querySelectorAll('.task-check[data-group="' + CSS.escape(group) + '"]');
            var checked = document.querySelectorAll('.task-check[data-group="' + CSS.escape(group) + '"]:checked');
            gc.checked       = checked.length === all.length && all.length > 0;
            gc.indeterminate = checked.length > 0 && checked.length < all.length;
        });
    }

    // ----------------------------------------------------------------
    //  System info
    // ----------------------------------------------------------------

    function loadSysInfo() {
        var url = BASE_URL + '?action=detect&token=' + encodeURIComponent(TOKEN);

        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (sysInfo) {
                    sysInfo.textContent =
                        'PHP ' + data.php +
                        ' · Magento ' + data.magento +
                        ' · Disco libero: ' + data.disk_free +
                        ' / ' + data.disk_total +
                        ' (' + data.disk_used_pct + '% usato)';
                }

                if (mainBadge) {
                    if (data.maintenance) {
                        mainBadge.className = 'badge badge-maintenance';
                        mainBadge.textContent = 'MANUTENZIONE';
                    } else {
                        mainBadge.className = 'badge badge-hidden';
                    }
                }
            })
            .catch(function () {
                if (sysInfo) sysInfo.textContent = 'Info non disponibili';
            });
    }

    // ----------------------------------------------------------------
    //  Event listeners
    // ----------------------------------------------------------------

    btnRun.addEventListener('click', runSelectedTasks);

    btnStop.addEventListener('click', function () {
        stopRequested = true;
        if (currentEs) {
            currentEs.close();
            currentEs = null;
            addLine('Stop richiesto — attendo fine operazione corrente...', 'warn');
            setRunning(false);
        }
    });

    btnClear.addEventListener('click', clearOutput);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            applyPreset(this.dataset.preset);
        });
    });

    // Group checkboxes (select/deselect all in group)
    document.querySelectorAll('.group-check').forEach(function (gc) {
        gc.addEventListener('change', function () {
            var group = this.dataset.group;
            document.querySelectorAll('.task-check[data-group="' + CSS.escape(group) + '"]').forEach(function (cb) {
                cb.checked = gc.checked;
            });
        });
    });

    // Individual task checkboxes → sync group state
    document.querySelectorAll('.task-check').forEach(function (cb) {
        cb.addEventListener('change', syncGroupChecks);
    });

    // ----------------------------------------------------------------
    //  Init
    // ----------------------------------------------------------------

    clearOutput();
    loadSysInfo();

})();
