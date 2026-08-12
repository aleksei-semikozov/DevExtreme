(function () {
  'use strict';

  var LS = 'mlg4716:';
  var STATUS_LABEL = { pass: '✓ работает', fail: '✗ баг', na: '— не применимо' };

  var scenarios = window.SCENARIOS || [];
  var byId = {};
  scenarios.forEach(function (s) { byId[s.id] = s; });

  var state = {
    current: null,
    tab: 'code',
    instance: null,
    errors: [],
    H: null,
  };

  var el = {};
  ['theme', 'width', 'rtl', 'btn-axe', 'btn-report', 'progress-text', 'bar-pass', 'bar-fail',
    'bar-na', 'filter', 'scenario-list', 'btn-reset-all', 'sc-title', 'sc-tags', 'sc-goal',
    'sc-steps', 'sc-expect', 'verdict-buttons', 'notes', 'auto-advance', 'btn-prev', 'btn-next',
    'btn-run', 'btn-rerender', 'btn-diag', 'errors', 'stage-wrap', 'diag', 'code', 'btn-revert',
    'btn-copy', 'edited-badge', 'editor-hint', 'stage-info', 'modal', 'modal-text', 'modal-copy',
    'modal-close', 'modal-title'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  // ——— storage ———————————————————————————————————————————————————————————

  function get(key, fallback) {
    var raw = localStorage.getItem(LS + key);
    return raw === null ? fallback : raw;
  }

  function set(key, value) {
    if (value === null || value === undefined || value === '') {
      localStorage.removeItem(LS + key);
    } else {
      localStorage.setItem(LS + key, value);
    }
  }

  var statusOf = function (id) { return get('status:' + id, ''); };
  var notesOf = function (id) { return get('notes:' + id, ''); };
  var codeOf = function (id) { return get('code:' + id, null); };

  // ——— источник кода из функций ————————————————————————————————————————

  function dedent(text) {
    var lines = text.replace(/\t/g, '  ').split('\n');
    var indent = Infinity;

    lines.forEach(function (line) {
      if (!line.trim()) { return; }
      indent = Math.min(indent, line.match(/^ */)[0].length);
    });

    if (!isFinite(indent)) { indent = 0; }

    return lines.map(function (line) { return line.slice(indent); }).join('\n').trim();
  }

  function bodyOf(fn) {
    var src = String(fn);
    var start = src.indexOf('{');
    var end = src.lastIndexOf('}');

    return dedent(src.slice(start + 1, end));
  }

  var defaultPrelude = bodyOf(window.PRELUDE_SOURCE);

  function preludeCode() { return get('prelude', null) || defaultPrelude; }

  function scenarioCode(scenario) { return codeOf(scenario.id) || bodyOf(scenario.fn); }

  // ——— перехват ошибок ——————————————————————————————————————————————————

  // W0019/W0021 — предупреждения триальной лицензии dev-сборки, к тестированию не относятся.
  var IGNORED = /^W00(19|21)\b/;

  function pushError(kind, text) {
    if (IGNORED.test(String(text))) { return; }

    state.errors.push({ kind: kind, text: String(text) });
    renderErrors();
  }

  window.addEventListener('error', function (e) {
    pushError('error', (e.message || 'ошибка') + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : ''));
  });

  window.addEventListener('unhandledrejection', function (e) {
    pushError('error', 'unhandled rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });

  ['error', 'warn'].forEach(function (level) {
    var original = console[level];

    console[level] = function () {
      pushError(level, Array.prototype.map.call(arguments, function (a) {
        return a && a.message ? a.message : String(a);
      }).join(' '));
      original.apply(console, arguments);
    };
  });

  function renderErrors() {
    if (!state.errors.length) {
      el.errors.hidden = true;
      el.errors.innerHTML = '';
      return;
    }

    el.errors.hidden = false;
    el.errors.innerHTML = '<b>Консоль во время рендера (' + state.errors.length + ')</b>'
      + state.errors.map(function (e) {
        return '<div class="err-' + e.kind + '">' + escapeHtml(e.text) + '</div>';
      }).join('');
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ——— API для кода сценариев ———————————————————————————————————————————

  var LAB = {
    scheduler: function () { return state.instance; },
    log: function () {
      var text = Array.prototype.map.call(arguments, function (a) {
        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
      }).join(' ');

      var line = document.createElement('div');
      line.className = 'log-line';
      line.textContent = new Date().toLocaleTimeString() + '  ' + text;
      el.diag.insertBefore(line, el.diag.firstChild);
    },
    diagnose: function () { renderDiagnostics(); },
  };

  window.LAB = LAB;

  // ——— запуск сценария —————————————————————————————————————————————————

  function buildPrelude() {
    var factory = new Function('DevExpress', '$', preludeCode());
    var H = factory(window.DevExpress, window.jQuery);

    if (!H || typeof H !== 'object') {
      throw new Error('Prelude должен вернуть объект (return { … })');
    }

    return H;
  }

  function run() {
    var scenario = state.current;
    if (!scenario) { return; }

    state.errors = [];
    renderErrors();
    el.diag.innerHTML = '';

    if (state.instance) {
      try { state.instance.dispose(); } catch (e) { /* виджет мог не создаться */ }
      state.instance = null;
    }

    el['stage-wrap'].innerHTML = '<div id="scheduler"></div>';

    var options;

    try {
      state.H = buildPrelude();
      options = new Function('H', 'LAB', 'DevExpress', '$', scenarioCode(scenario))(
        state.H, LAB, window.DevExpress, window.jQuery
      );
    } catch (e) {
      pushError('error', 'Код сценария не выполнился: ' + e.message);
      return;
    }

    if (!options || typeof options !== 'object') {
      pushError('error', 'Код сценария должен вернуть объект опций Scheduler (return { … })');
      return;
    }

    if (el.rtl.checked && options.rtlEnabled === undefined) {
      options.rtlEnabled = true;
    }

    var width = el.width.value;
    el['stage-wrap'].style.maxWidth = width ? width + 'px' : '';
    el['stage-wrap'].dir = options.rtlEnabled ? 'rtl' : 'ltr';

    try {
      state.instance = window.jQuery('#scheduler').dxScheduler(options).dxScheduler('instance');
    } catch (e) {
      pushError('error', 'Scheduler не создался: ' + e.message);
      return;
    }

    setTimeout(renderDiagnostics, 400);
  }

  // ——— диагностика ——————————————————————————————————————————————————————

  function textOf(node) { return (node.textContent || '').replace(/\s+/g, ' ').trim(); }

  function collectHorizontal(root) {
    var rows = root.querySelectorAll('thead tr.dx-scheduler-group-row');

    return Array.prototype.map.call(rows, function (row) {
      return Array.prototype.map.call(row.querySelectorAll('.dx-scheduler-group-header'), function (cell) {
        return textOf(cell) + '×' + (cell.colSpan || 1) + (cell.rowSpan > 1 ? '↕' + cell.rowSpan : '');
      });
    });
  }

  function collectVertical(root) {
    var container = root.querySelector('.dx-scheduler-group-flex-container');
    if (!container) { return []; }

    var lines = [];

    (function walk(node, depth) {
      Array.prototype.forEach.call(node.children, function (child) {
        var header = child.classList.contains('dx-scheduler-group-header') ? child : null;

        if (header) {
          lines.push(new Array(depth + 1).join('    ') + textOf(header)
            + (header.classList.contains('dx-scheduler-group-header-leaf') ? '  (leaf)' : ''));
          return;
        }

        var own = Array.prototype.filter.call(child.children, function (n) {
          return n.classList.contains('dx-scheduler-group-header');
        });

        if (own.length) {
          own.forEach(function (h) {
            lines.push(new Array(depth + 1).join('    ') + textOf(h)
              + (h.classList.contains('dx-scheduler-group-header-leaf') ? '  (leaf)' : ''));
            walk(h.parentNode, depth + 1);
          });
        } else {
          walk(child, depth);
        }
      });
    }(container, 0));

    return lines.filter(function (line, index, all) { return all.indexOf(line) === index; });
  }

  // В вертикальной панели у листьев есть свой класс; в горизонтальной шапке лист — это ячейка,
  // чей rowSpan достаёт до последнего уровня.
  function countLeafCells(root) {
    var marked = root.querySelectorAll('.dx-scheduler-group-header-leaf');
    if (marked.length) { return marked.length; }

    var rows = root.querySelectorAll('thead tr.dx-scheduler-group-row');
    var total = 0;

    Array.prototype.forEach.call(rows, function (row, index) {
      Array.prototype.forEach.call(row.querySelectorAll('.dx-scheduler-group-header'), function (cell) {
        if (index + (cell.rowSpan || 1) === rows.length) { total += 1; }
      });
    });

    return total;
  }

  function collectAgenda(root) {
    var rows = root.querySelectorAll('.dx-scheduler-group-table tr');

    return Array.prototype.map.call(rows, function (row) {
      return Array.prototype.map.call(row.cells, function (cell) {
        return textOf(cell) + (cell.rowSpan > 1 ? '↕' + cell.rowSpan : '');
      }).join(' | ');
    }).filter(function (line) { return line.trim(); });
  }

  function renderDiagnostics() {
    var root = el['stage-wrap'];
    var inst = state.instance;
    var out = [];

    if (!inst) {
      el.diag.innerHTML = '<div class="diag-empty">Сценарий не запущен.</div>';
      return;
    }

    var headers = root.querySelectorAll('.dx-scheduler-group-header');
    var leafHeaders = root.querySelectorAll('.dx-scheduler-group-header-leaf');
    var horizontalRows = collectHorizontal(root);
    var verticalLines = collectVertical(root);
    var agendaLines = headers.length ? [] : collectAgenda(root);
    var appointments = root.querySelectorAll('.dx-scheduler-appointment:not(.dx-scheduler-appointment-tooltip)');
    var cell = root.querySelector('.dx-scheduler-date-table-cell');
    var cellWidth = cell ? cell.getBoundingClientRect().width.toFixed(1) : '—';

    var facts = [
      ['view', String(inst.option('currentView'))],
      ['groupOrientation', findOrientation(inst)],
      ['groups', JSON.stringify(inst.option('groups') || [])],
      ['ячеек-заголовков групп', String(headers.length)],
      ['листовых групп', String(countLeafCells(root))],
      ['уровней в горизонтальной шапке', String(horizontalRows.length)],
      ['встреч в DOM', String(appointments.length)],
      ['ширина ячейки, px', String(cellWidth)],
    ];

    out.push('<div class="diag-block"><b>Факты</b><table class="facts">'
      + facts.map(function (f) {
        return '<tr><td>' + escapeHtml(f[0]) + '</td><td>' + escapeHtml(f[1]) + '</td></tr>';
      }).join('') + '</table></div>');

    if (horizontalRows.length) {
      out.push('<div class="diag-block"><b>Горизонтальная шапка (текст×colSpan)</b><pre>'
        + horizontalRows.map(function (row, i) {
          return 'уровень ' + i + ': ' + escapeHtml(row.join(' | '));
        }).join('\n') + '</pre></div>');
    }

    if (verticalLines.length) {
      out.push('<div class="diag-block"><b>Вертикальная панель групп</b><pre>'
        + escapeHtml(verticalLines.join('\n')) + '</pre></div>');
    }

    if (agendaLines.length) {
      out.push('<div class="diag-block"><b>Панель групп Agenda (своя, старая разметка)</b><pre>'
        + escapeHtml(agendaLines.join('\n')) + '</pre></div>');
    }

    if (!appointments.length && cell && cell.getBoundingClientRect().width < 30) {
      out.push('<div class="diag-block warn"><b>Встречи не отрисованы: ячейки слишком узкие</b>'
        + '<div class="diag-empty">Это поведение платформы, одинаковое для плоской и иерархической '
        + 'группировки: при ширине ячейки меньше ~28px встречи не рендерятся. Лечится '
        + '<code>crossScrollingEnabled: true</code> — не считать дефектом фичи.</div></div>');
    }

    var truncated = [];
    Array.prototype.forEach.call(headers, function (cell) {
      var content = cell.querySelector('.dx-scheduler-group-header-content') || cell;

      if (content.scrollWidth > content.clientWidth + 1 || content.scrollHeight > content.clientHeight + 1) {
        truncated.push({
          text: textOf(cell),
          title: cell.getAttribute('title') || content.getAttribute('title') || '',
          aria: cell.getAttribute('aria-label') || content.getAttribute('aria-label') || '',
        });
      }
    });

    out.push('<div class="diag-block"><b>Обрезанный текст заголовков (' + truncated.length + ')</b>'
      + (truncated.length
        ? '<pre>' + truncated.map(function (t) {
          return (t.title || t.aria ? '✓ подсказка есть' : '✗ подсказки НЕТ') + '  «' + escapeHtml(t.text) + '»'
            + (t.title ? '  title=«' + escapeHtml(t.title) + '»' : '')
            + (t.aria ? '  aria-label=«' + escapeHtml(t.aria) + '»' : '');
        }).join('\n') + '</pre>'
        : '<div class="diag-empty">Обрезки нет — сузьте окно или возьмите сценарий с длинными названиями.</div>')
      + '</div>');

    var aria = {};
    Array.prototype.forEach.call(headers, function (cell) {
      var signature = cell.tagName.toLowerCase()
        + ' role=' + (cell.getAttribute('role') || '—')
        + ' scope=' + (cell.getAttribute('scope') || '—')
        + ' title=' + (cell.hasAttribute('title') ? 'да' : 'нет')
        + ' aria-label=' + (cell.hasAttribute('aria-label') ? 'да' : 'нет')
        + (cell.classList.contains('dx-scheduler-group-header-leaf') ? ' leaf' : '');

      aria[signature] = (aria[signature] || 0) + 1;
    });

    out.push('<div class="diag-block"><b>Разметка заголовков групп</b><pre>'
      + Object.keys(aria).map(function (k) { return aria[k] + '×  ' + escapeHtml(k); }).join('\n')
      + '</pre></div>');

    var duplicates = {};
    Array.prototype.forEach.call(leafHeaders.length ? leafHeaders : headers, function (cell) {
      var text = textOf(cell);
      duplicates[text] = (duplicates[text] || 0) + 1;
    });

    var repeated = Object.keys(duplicates).filter(function (k) { return duplicates[k] > 1; });

    if (repeated.length) {
      out.push('<div class="diag-block warn"><b>Повторяющиеся подписи листовых групп</b><pre>'
        + repeated.map(function (k) { return duplicates[k] + '× ' + escapeHtml(k); }).join('\n')
        + '</pre><div class="diag-empty">Дубли законны, если это одноимённые узлы под разными родителями.</div></div>');
    }

    el.diag.innerHTML = out.join('');
  }

  function findOrientation(inst) {
    var views = inst.option('views') || [];
    var current = inst.option('currentView');
    var view = views.filter(function (v) { return v && (v.type === current || v.name === current); })[0];

    return (view && view.groupOrientation) || inst.option('groupOrientation') || 'по умолчанию';
  }

  // ——— axe ——————————————————————————————————————————————————————————————

  function runAxe() {
    var report = function () {
      window.axe.run(el['stage-wrap'], { resultTypes: ['violations'] }).then(function (result) {
        var block = document.createElement('div');
        block.className = 'diag-block ' + (result.violations.length ? 'warn' : '');
        block.innerHTML = '<b>axe-core: нарушений ' + result.violations.length + '</b>'
          + (result.violations.length
            ? '<pre>' + result.violations.map(function (v) {
              return '[' + v.impact + '] ' + escapeHtml(v.id) + ' — ' + escapeHtml(v.help)
                + '\n    узлов: ' + v.nodes.length + '; первый: ' + escapeHtml(String(v.nodes[0].target));
            }).join('\n') + '</pre>'
            : '<div class="diag-empty">Чисто.</div>');
        el.diag.insertBefore(block, el.diag.firstChild);
      });
    };

    if (window.axe) { report(); return; }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.3/axe.min.js';
    script.onload = report;
    script.onerror = function () {
      pushError('warn', 'axe-core не загрузился с CDN — проверка доступности недоступна офлайн.');
    };
    document.head.appendChild(script);
  }

  // ——— sidebar ——————————————————————————————————————————————————————————

  function renderList() {
    var filter = el.filter.value.trim().toLowerCase();
    var html = '';
    var lastSection = null;

    scenarios.forEach(function (s, index) {
      var haystack = (s.title + ' ' + s.section + ' ' + (s.goal || '')).toLowerCase();
      if (filter && haystack.indexOf(filter) === -1) { return; }

      if (s.section !== lastSection) {
        lastSection = s.section;
        html += '<div class="sec">' + escapeHtml(s.section) + '</div>';
      }

      var status = statusOf(s.id);
      html += '<a href="#' + s.id + '" class="item' + (state.current === s ? ' active' : '')
        + (status ? ' st-' + status : '') + '" data-id="' + s.id + '">'
        + '<i class="dot"></i><span class="num">' + (index + 1) + '</span>'
        + '<span class="txt">' + escapeHtml(s.title) + '</span>'
        + (s.extra ? '<em class="extra" title="сценарий вне чек-листа задачи">доп</em>' : '')
        + (notesOf(s.id) ? '<em class="hasnote" title="есть заметка">✎</em>' : '')
        + '</a>';
    });

    el['scenario-list'].innerHTML = html || '<div class="diag-empty">Ничего не найдено.</div>';
    renderProgress();
  }

  function renderProgress() {
    var counts = { pass: 0, fail: 0, na: 0 };

    scenarios.forEach(function (s) {
      var status = statusOf(s.id);
      if (counts[status] !== undefined) { counts[status] += 1; }
    });

    var done = counts.pass + counts.fail + counts.na;
    el['progress-text'].textContent = done + ' / ' + scenarios.length
      + '  ·  ✓ ' + counts.pass + '  ✗ ' + counts.fail + '  — ' + counts.na;

    var total = scenarios.length || 1;
    el['bar-pass'].style.width = (counts.pass / total * 100) + '%';
    el['bar-fail'].style.width = (counts.fail / total * 100) + '%';
    el['bar-na'].style.width = (counts.na / total * 100) + '%';
  }

  // ——— сценарий —————————————————————————————————————————————————————————

  function select(scenario, options) {
    if (!scenario) { return; }

    state.current = scenario;
    if (!(options && options.fromHash)) { location.hash = scenario.id; }

    el['sc-title'].textContent = scenario.title;
    el['sc-tags'].innerHTML = (scenario.tags || []).map(function (t) {
      return '<span class="tag">' + escapeHtml(t) + '</span>';
    }).join('') + (scenario.extra
      ? '<span class="tag tag-extra">вне чек-листа задачи</span>'
      : '<span class="tag tag-plan">из чек-листа задачи</span>');
    el['sc-goal'].textContent = scenario.goal || '';
    el['sc-steps'].innerHTML = (scenario.steps || []).map(function (s) {
      return '<li>' + s + '</li>';
    }).join('');
    el['sc-expect'].innerHTML = scenario.expect || '';

    el.notes.value = notesOf(scenario.id);
    renderVerdict();
    renderEditor();
    renderList();
    el['stage-info'].textContent = 'сценарий ' + (scenarios.indexOf(scenario) + 1) + ' из ' + scenarios.length;
    run();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderVerdict() {
    var status = statusOf(state.current.id);

    Array.prototype.forEach.call(el['verdict-buttons'].querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.dataset.status === status);
    });
  }

  function renderEditor() {
    var isPrelude = state.tab === 'prelude';
    el.code.value = isPrelude ? preludeCode() : scenarioCode(state.current);
    el['edited-badge'].hidden = isPrelude ? !get('prelude', null) : !codeOf(state.current.id);
    el['editor-hint'].innerHTML = isPrelude
      ? 'Общий код для всех сценариев: должен вернуть объект <code>H</code> (данные и хелперы). Ctrl+Enter — применить и перезапустить сценарий.'
      : 'Код получает <code>H</code> (данные из prelude), <code>LAB</code> (<code>LAB.scheduler()</code>, <code>LAB.log(…)</code>), <code>DevExpress</code>, <code>$</code> и должен вернуть объект опций Scheduler. Ctrl+Enter — запустить.';
  }

  function saveCode() {
    if (state.tab === 'prelude') {
      set('prelude', el.code.value === defaultPrelude ? null : el.code.value);
    } else {
      set('code:' + state.current.id, el.code.value === bodyOf(state.current.fn) ? null : el.code.value);
    }

    el['edited-badge'].hidden = state.tab === 'prelude' ? !get('prelude', null) : !codeOf(state.current.id);
  }

  function step(delta) {
    var index = scenarios.indexOf(state.current) + delta;
    if (index >= 0 && index < scenarios.length) { select(scenarios[index]); }
  }

  // ——— отчёт ————————————————————————————————————————————————————————————

  function buildReport() {
    var build = window.BUILD_INFO || {};
    var lines = [];
    var counts = { pass: 0, fail: 0, na: 0, none: 0 };

    scenarios.forEach(function (s) {
      var status = statusOf(s.id) || 'none';
      counts[status] += 1;
    });

    lines.push('# Scheduler · Multilevel grouping — ручное тестирование (issue 4716)');
    lines.push('');
    lines.push('- Сборка: `' + (build.branch || '?') + '` @ `' + (build.commit || '?') + '`'
      + (build.builtAt ? ', собрано ' + build.builtAt : ''));
    lines.push('- Стенд: ' + location.href.split('#')[0]);
    lines.push('- Тема: `' + (localStorage.getItem('mlgTheme') || 'fluent.blue.light') + '`'
      + (el.rtl.checked ? ', RTL включён' : '') + (el.width.value ? ', ширина ' + el.width.value + 'px' : ''));
    lines.push('- Браузер: `' + navigator.userAgent + '`');
    lines.push('- Итог: ✓ ' + counts.pass + ' · ✗ ' + counts.fail + ' · — ' + counts.na
      + ' · не проверено ' + counts.none + ' (всего ' + scenarios.length + ')');
    lines.push('');

    var fails = scenarios.filter(function (s) { return statusOf(s.id) === 'fail'; });

    if (fails.length) {
      lines.push('## Найденные проблемы');
      lines.push('');
      fails.forEach(function (s) {
        lines.push('### ' + s.title);
        lines.push('');
        lines.push('- Раздел: ' + s.section + (s.extra ? ' (вне чек-листа задачи)' : ''));
        lines.push('- Ожидалось: ' + stripHtml(s.expect));
        lines.push('- Заметка: ' + (notesOf(s.id) || '—'));
        lines.push('- Ссылка: ' + location.href.split('#')[0] + '#' + s.id);
        lines.push('');
      });
    }

    lines.push('## Полный чек-лист');
    lines.push('');
    lines.push('| # | Раздел | Сценарий | Статус | Заметка |');
    lines.push('|---|--------|----------|--------|---------|');

    scenarios.forEach(function (s, i) {
      var status = statusOf(s.id);
      lines.push('| ' + (i + 1) + ' | ' + s.section + ' | ' + s.title + ' | '
        + (STATUS_LABEL[status] || 'не проверено') + ' | '
        + (notesOf(s.id).replace(/\n/g, ' ') || '') + ' |');
    });

    return lines.join('\n');
  }

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    return textOf(div);
  }

  function openModal(title, text) {
    el['modal-title'].textContent = title;
    el['modal-text'].value = text;
    el.modal.hidden = false;
    el['modal-text'].focus();
    el['modal-text'].setSelectionRange(0, 0);
  }

  // ——— темы, ширина, RTL ————————————————————————————————————————————————

  function renderThemes() {
    var groups = {};

    window.DX_THEMES.forEach(function (t) {
      (groups[t.group] = groups[t.group] || []).push(t);
    });

    el.theme.innerHTML = Object.keys(groups).map(function (g) {
      return '<optgroup label="' + escapeHtml(g) + '">' + groups[g].map(function (t) {
        return '<option value="' + t.name + '">' + escapeHtml(t.text) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    el.theme.value = localStorage.getItem('mlgTheme') || 'fluent.blue.light';
  }

  // ——— события ——————————————————————————————————————————————————————————

  el.theme.addEventListener('change', function () {
    localStorage.setItem('mlgTheme', el.theme.value);
    location.reload();
  });

  el.width.addEventListener('change', function () {
    set('width', el.width.value);
    run();
  });

  el.rtl.addEventListener('change', function () {
    set('rtl', el.rtl.checked ? '1' : '');
    run();
  });

  el.filter.addEventListener('input', renderList);

  el['scenario-list'].addEventListener('click', function (e) {
    var item = e.target.closest('.item');
    if (!item) { return; }
    e.preventDefault();
    select(byId[item.dataset.id]);
  });

  el['verdict-buttons'].addEventListener('click', function (e) {
    var button = e.target.closest('button[data-status]');
    if (!button) { return; }

    var status = button.dataset.status;
    set('status:' + state.current.id, statusOf(state.current.id) === status ? '' : status);
    renderVerdict();
    renderList();

    if (el['auto-advance'].checked && statusOf(state.current.id)) { step(1); }
  });

  el.notes.addEventListener('input', function () {
    set('notes:' + state.current.id, el.notes.value);
    renderList();
  });

  el['btn-prev'].addEventListener('click', function () { step(-1); });
  el['btn-next'].addEventListener('click', function () { step(1); });
  el['btn-run'].addEventListener('click', function () { saveCode(); run(); });
  el['btn-rerender'].addEventListener('click', run);
  el['btn-diag'].addEventListener('click', renderDiagnostics);
  el['btn-axe'].addEventListener('click', runAxe);

  el['btn-revert'].addEventListener('click', function () {
    if (state.tab === 'prelude') {
      set('prelude', null);
    } else {
      set('code:' + state.current.id, null);
    }

    renderEditor();
    run();
  });

  el['btn-copy'].addEventListener('click', function () {
    navigator.clipboard.writeText(el.code.value);
    el['btn-copy'].textContent = 'скопировано';
    setTimeout(function () { el['btn-copy'].textContent = 'Копировать'; }, 1200);
  });

  el.code.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveCode();
      run();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      var start = el.code.selectionStart;
      el.code.setRangeText('  ', start, el.code.selectionEnd, 'end');
    }
  });

  el.code.addEventListener('blur', saveCode);

  document.querySelector('.tabs').addEventListener('click', function (e) {
    var button = e.target.closest('button[data-tab]');
    if (!button) { return; }

    saveCode();
    state.tab = button.dataset.tab;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button[data-tab]'), function (b) {
      b.classList.toggle('active', b.dataset.tab === state.tab);
    });
    renderEditor();
  });

  el['btn-report'].addEventListener('click', function () {
    openModal('Отчёт (markdown — можно вставить в задачу)', buildReport());
  });

  el['modal-copy'].addEventListener('click', function () {
    navigator.clipboard.writeText(el['modal-text'].value);
    el['modal-copy'].textContent = 'скопировано';
    setTimeout(function () { el['modal-copy'].textContent = 'Копировать'; }, 1200);
  });

  el['modal-close'].addEventListener('click', function () { el.modal.hidden = true; });

  el.modal.addEventListener('click', function (e) {
    if (e.target === el.modal) { el.modal.hidden = true; }
  });

  el['btn-reset-all'].addEventListener('click', function () {
    if (!confirm('Сбросить все статусы, заметки и правки кода?')) { return; }

    Object.keys(localStorage).filter(function (k) { return k.indexOf(LS) === 0; })
      .forEach(function (k) { localStorage.removeItem(k); });

    el.notes.value = '';
    renderVerdict();
    renderEditor();
    renderList();
    run();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') { return; }

    if (e.key === '[') { step(-1); }
    if (e.key === ']') { step(1); }
    if (e.key === 'Escape') { el.modal.hidden = true; }
  });

  window.addEventListener('hashchange', function () {
    var scenario = byId[location.hash.slice(1)];
    if (scenario && scenario !== state.current) { select(scenario, { fromHash: true }); }
  });

  // ——— старт ————————————————————————————————————————————————————————————

  renderThemes();

  var build = window.BUILD_INFO || {};
  document.querySelector('.brand span').textContent = 'issue 4716 · сборка '
    + (build.version || '?') + ' из ветки фичи @ ' + (build.commit || '?')
    + ' (' + (build.builtAt || '?') + ')';

  el.width.value = get('width', '');
  el.rtl.checked = get('rtl', '') === '1';
  select(byId[location.hash.slice(1)] || scenarios[0], { fromHash: true });
}());
