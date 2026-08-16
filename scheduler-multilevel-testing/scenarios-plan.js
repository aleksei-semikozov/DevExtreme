// Сценарии из чек-листа задачи 4716.
(function () {
  var S = window.SCENARIOS = window.SCENARIOS || [];
  var add = function (scenario) { S.push(scenario); };

  var VIEWS = [
    ['timelineDay', 'Timeline Day'],
    ['timelineWeek', 'Timeline Week'],
    ['timelineWorkWeek', 'Timeline Work Week'],
    ['timelineMonth', 'Timeline Month'],
    ['day', 'Day'],
    ['week', 'Week'],
    ['workWeek', 'Work Week'],
  ];

  // ——— 1. Представления ——————————————————————————————————————————————————

  // Код сценария обязан быть самодостаточным (он же попадает в редактор на странице),
  // поэтому вид подставляется в текст, а не берётся из замыкания.
  var viewCode = function (type, orientation) {
    return [
      'return H.base({',
      '  views: [{ type: \'' + type + '\', groupOrientation: \'' + orientation + '\' }],',
      '  currentView: \'' + type + '\',',
      '  dataSource: H.appts(\'roomId\', H.leafIds(H.tree3)),',
      '  groups: [\'roomId\'],',
      '  resources: [{',
      '    fieldExpr: \'roomId\',',
      '    dataSource: H.tree3,',
      '    parentIdExpr: \'parentId\',',
      '    label: \'Room\',',
      '    allowMultiple: true,',
      '  }],',
      '});',
    ].join('\n');
  };

  VIEWS.forEach(function (pair) {
    var type = pair[0];
    var label = pair[1];
    var isTimeline = type.indexOf('timeline') === 0;

    add({
      id: 'view-' + type,
      section: '1. Представления',
      title: label + ' · ' + (isTimeline ? 'vertical' : 'horizontal') + ' · 3 уровня',
      tags: [type, isTimeline ? 'vertical' : 'horizontal'],
      goal: 'Проверить, что многоуровневая группировка отрисована в представлении ' + label
        + ': шапка/панель групп повторяет дерево, встречи стоят в своих листовых группах.',
      steps: [
        'Осмотреть панель групп: <b>Building A → Floor 1 → Room 101/102</b>, <b>Floor 2 → Room 201</b>, <b>Building B → Floor 1 → Room 301</b>.',
        'Сверить с блоком «Диагностика» под сеткой: число листовых групп должно быть 4.',
        'Проскроллить сетку по горизонтали и вертикали — заголовки не должны разъезжаться с колонками.',
        'В коде ниже поменять <code>groupOrientation</code> на противоположную и запустить (Ctrl+Enter).',
      ],
      expect: 'Каждый уровень дерева — свой ряд (горизонтально) или свой столбец (вертикально); '
        + 'родитель растянут ровно на своих потомков; встречи не «уезжают» в чужую группу.',
      fn: new Function('H', 'LAB', viewCode(type, isTimeline ? 'vertical' : 'horizontal')),
    });
  });

  add({
    id: 'view-switch',
    section: '1. Представления',
    title: 'Переключение представлений в рантайме',
    tags: ['все представления', 'переключение'],
    goal: 'Проверить, что при переключении вида через тулбар иерархия не ломается и не остаётся мусор от предыдущего вида.',
    steps: [
      'Переключить все виды в тулбаре по кругу: Day → Week → Work Week → Timeline Day → Timeline Week → Timeline Work Week → Timeline Month.',
      'После каждого переключения смотреть на панель групп и на блок ошибок консоли над сеткой.',
      'Вернуться на первый вид и сверить картинку с исходной.',
    ],
    expect: 'Ни одного исключения в консоли; на каждом виде иерархия полная (4 листа); '
      + 'нет дублей заголовков и «залипших» колонок от прошлого вида.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'day', groupOrientation: 'horizontal' },
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'workWeek', groupOrientation: 'horizontal' },
          { type: 'timelineDay', groupOrientation: 'vertical' },
          { type: 'timelineWeek', groupOrientation: 'vertical' },
          { type: 'timelineWorkWeek', groupOrientation: 'vertical' },
          { type: 'timelineMonth', groupOrientation: 'vertical' },
        ],
        currentView: 'day',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId',
          dataSource: H.tree3,
          parentIdExpr: 'parentId',
          label: 'Room',
          allowMultiple: true,
        }],
      });
    },
  });

  // ——— 2. Ориентация ————————————————————————————————————————————————————

  add({
    id: 'orient-horizontal',
    section: '2. Ориентация группировки',
    title: 'horizontal · week · 3 уровня',
    tags: ['horizontal'],
    goal: 'Горизонтальная группировка: три ряда шапки, colSpan родителя равен числу его листьев.',
    steps: [
      'Сверить в диагностике строку «Горизонтальная шапка»: уровень 0 — Building A×2, Building B×1 (в единицах листьев, умноженных на число колонок вида).',
      'Проверить вертикальные разделители: жирная линия должна отделять соседние <b>Building</b>, тонкая — комнаты внутри этажа.',
      'Проверить, что дата-шапка (дни недели) повторяется под каждым листом.',
    ],
    expect: 'Ряды: Building → Floor → Room. Ширина родителя = сумма ширин его листьев. '
      + 'Разделитель групп верхнего уровня заметно сильнее внутренних.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'orient-vertical',
    section: '2. Ориентация группировки',
    title: 'vertical · week · 3 уровня',
    tags: ['vertical'],
    goal: 'Вертикальная группировка: панель групп слева, по столбцу на уровень, лист занимает высоту своей сетки.',
    steps: [
      'Сверить в диагностике блок «Вертикальная панель групп» — отступы должны повторять дерево, у листьев метка <code>(leaf)</code>.',
      'Проверить, что высота блока родителя равна сумме высот его листьев.',
      'Проверить, что подписи в узких столбцах не обрезаны без подсказки (наведение мышью).',
    ],
    expect: 'Три столбца панели групп (Building / Floor / Room); '
      + 'у листьев класс <code>dx-scheduler-group-header-leaf</code>; каждая полоса сетки принадлежит одному листу.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'vertical' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'orient-runtime',
    section: '2. Ориентация группировки',
    title: 'Смена ориентации кнопкой в рантайме',
    tags: ['horizontal', 'vertical', 'рантайм'],
    goal: 'Проверить перерисовку при смене groupOrientation без пересоздания виджета.',
    steps: [
      'Нажать кнопку <b>horizontal ⇄ vertical</b> в тулбаре 4–5 раз подряд.',
      'Следить за блоком ошибок консоли и за тем, что панель групп каждый раз полная.',
    ],
    expect: 'Каждое переключение даёт корректную панель групп; нет исключений; '
      + 'нет остатков предыдущей ориентации (пустых столбцов/рядов).',
    fn: function (H, LAB) {
      var orientation = 'horizontal';

      return H.base({
        views: [{ type: 'week', groupOrientation: orientation }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        toolbar: {
          items: [
            'viewSwitcher',
            'dateNavigator',
            {
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'horizontal ⇄ vertical',
                onClick: function () {
                  orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
                  LAB.scheduler().option('views', [{ type: 'week', groupOrientation: orientation }]);
                  LAB.log('groupOrientation =', orientation);
                  setTimeout(LAB.diagnose, 300);
                },
              },
            },
          ],
        },
      });
    },
  });

  add({
    id: 'orient-vertical-allday',
    section: '2. Ориентация группировки',
    title: 'vertical + панель «весь день»',
    tags: ['vertical', 'allDay'],
    goal: 'Панель all-day при вертикальной группировке рисуется для каждой листовой группы.',
    steps: [
      'Убедиться, что у каждой листовой группы есть своя строка «Весь день» с встречей.',
      'Перетащить all-day встречу в другую листовую группу и проверить, что она осталась all-day.',
      'Растянуть all-day встречу на несколько дней.',
    ],
    expect: 'По одной all-day полосе на лист; встречи не протекают в соседние группы; '
      + 'после перетаскивания встреча остаётся в панели «весь день».',
    fn: function (H) {
      var leaves = H.leafIds(H.tree3);

      return H.base({
        showAllDayPanel: true,
        views: [{ type: 'week', groupOrientation: 'vertical' }],
        currentView: 'week',
        dataSource: H.appts('roomId', leaves).concat(leaves.map(function (id, i) {
          return {
            text: 'All day #' + (i + 1),
            roomId: [id],
            allDay: true,
            startDate: H.at(i % 5, 0),
            endDate: H.at(i % 5, 23, 59),
          };
        })),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  // ——— 3. Форма иерархии ————————————————————————————————————————————————

  add({
    id: 'shape-2-levels',
    section: '3. Форма иерархии',
    title: '2 уровня (Room → Employee)',
    tags: ['2 уровня'],
    goal: 'Базовый случай из демо: два уровня, у каждой комнаты по два сотрудника.',
    steps: [
      'Проверить, что листов 4 (сотрудники), а комнаты — только заголовки без своих колонок.',
      'Проверить цвет встреч: он берётся из листового ресурса (цвета заданы только у сотрудников).',
    ],
    expect: '4 листовые группы; у комнат нет собственной полосы сетки; цвет встречи = цвет сотрудника.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('assigneeId', H.leafIds(H.tree2)),
        groups: ['assigneeId'],
        resources: [{
          fieldExpr: 'assigneeId', dataSource: H.tree2, parentIdExpr: 'parentId', label: 'Employee', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'shape-3-levels',
    section: '3. Форма иерархии',
    title: '3 уровня (Building → Floor → Room)',
    tags: ['3 уровня'],
    goal: 'Максимальная заявленная глубина: три уровня в обеих ориентациях.',
    steps: [
      'Осмотреть шапку: три ряда, 4 листа.',
      'Переключить вид в тулбаре на Timeline Week (там вертикальная панель) и сверить дерево.',
      'Проверить, что «Floor 1» встречается дважды (в Building A и Building B) и это разные группы.',
    ],
    expect: 'Одноимённые узлы под разными родителями — независимые группы; '
      + 'встречи каждой комнаты остаются в своей ветке.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'timelineWeek', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'shape-mixed-depth',
    section: '3. Форма иерархии',
    title: 'Неравномерная глубина (3 / 2 / 1)',
    tags: ['неравномерная глубина'],
    goal: 'Ветки разной длины: Building A → Floor 1 → Room (3 уровня), Building B → Room 401 (2 уровня), Lobby (лист на верхнем уровне).',
    steps: [
      'Проверить, что короткая ветка растянута на недостающие уровни (rowSpan), а не оставила пустую ячейку.',
      'Проверить, что <b>Lobby</b> — полноценная группа со своей сеткой и встречами.',
      'Переключить на вертикальную ориентацию (второй вид в тулбаре) и повторить проверку.',
    ],
    expect: 'Листья на разных уровнях получают одинаковую по высоте/ширине сетку; '
      + 'нет «дырок» в шапке и нет фантомных подписей.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.treeMixed)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeMixed, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'shape-subset',
    section: '3. Форма иерархии',
    title: 'Родитель с частью детей / без детей',
    tags: ['подмножество детей'],
    goal: 'В источнике у Building A только одна комната из двух, у Building B детей нет вовсе.',
    steps: [
      'Проверить, что Building A показывает ровно одну комнату.',
      'Проверить, что Building B сам стал листом (у него есть своя сетка и встречи).',
      'Проверить цвет встреч Building B — он задан на самом родителе.',
    ],
    expect: 'Родитель без детей ведёт себя как обычный лист; '
      + 'отсутствующие дети не создают пустых групп.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.treeSubset)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeSubset, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  // ——— 4. Заголовки и доступность ———————————————————————————————————————

  add({
    id: 'headers-crop-horizontal',
    section: '4. Заголовки и доступность',
    title: 'Обрезка длинного текста + подсказка (horizontal)',
    tags: ['обрезка', 'hint'],
    goal: 'Длинные названия должны обрезаться и показывать полный текст в нативной подсказке.',
    steps: [
      'Навести мышь на каждый обрезанный заголовок и дождаться подсказки браузера.',
      'Сверить блок «Обрезанный текст заголовков» в диагностике: у всех строк должно быть «✓ подсказка есть».',
      'Сузить стенд селектором «Ширина» до 768/480 и обновить диагностику.',
    ],
    expect: 'У всех обрезанных заголовков есть <code>title</code> с полным текстом; '
      + 'текст обрезается многоточием, а не ломает вёрстку сетки.',
    fn: function (H) {
      return H.base({
        width: 760,
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.treeLongNames)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeLongNames, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'headers-crop-vertical',
    section: '4. Заголовки и доступность',
    title: 'Обрезка длинного текста + подсказка (vertical)',
    tags: ['обрезка', 'hint', 'vertical'],
    goal: 'То же для вертикальной панели: столбцы уровней узкие (65–100px), обрезка почти гарантирована.',
    steps: [
      'Навести мышь на подписи всех трёх уровней.',
      'Сверить диагностику: «✓ подсказка есть» у каждого обрезанного заголовка.',
      'Сравнить с плоской группировкой (сценарий «Плоские ресурсы, vertical») — там подсказки может не быть.',
    ],
    expect: 'В иерархической вертикальной панели у заголовков есть <code>title</code> и <code>aria-label</code>.',
    fn: function (H) {
      return H.base({
        width: 760,
        views: [{ type: 'week', groupOrientation: 'vertical' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.treeLongNames)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeLongNames, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'a11y-smoke',
    section: '4. Заголовки и доступность',
    title: 'a11y smoke: axe + разметка заголовков',
    tags: ['a11y', 'axe'],
    goal: 'Быстрая проверка доступности панели групп: нарушения axe и осмысленность разметки заголовков.',
    steps: [
      'Нажать кнопку <b>axe</b> в правом верхнем углу — результат появится сверху блока диагностики.',
      'Прогнать axe для обеих ориентаций (второй вид в тулбаре).',
      'Посмотреть блок «Разметка заголовков групп»: в горизонтальной шапке ожидается <code>th role=columnheader scope=col/colgroup</code>, в вертикальной иерархии — <code>div</code> с <code>aria-label</code> и <b>без</b> role.',
      'Пройти по сетке скринридером/Tab и послушать, как называется встреча (см. также сценарий «groupTexts в подписи встречи»).',
    ],
    expect: 'Нарушений axe нет (в т.ч. никакого <code>aria-required-parent</code>). '
      + 'У заголовков есть доступное имя; вложенность уровней не заявляется ложными ролями.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  // ——— 5. Взаимодействия ————————————————————————————————————————————————

  add({
    id: 'interact-create',
    section: '5. Взаимодействия',
    title: 'Создание встречи в листовой группе',
    tags: ['создание', 'форма'],
    goal: 'Двойной клик по ячейке конкретной группы должен открыть форму с предзаполненным листовым ресурсом.',
    steps: [
      'Двойной клик по ячейке под <b>Room 201</b> — в форме поле Room должно быть заполнено значением Room 201.',
      'Сохранить встречу и убедиться, что она появилась именно в этой группе.',
      'Повторить для ячейки под <b>Room 301</b> (другая ветка дерева).',
      'В логе под сеткой смотреть, что реально пришло в <code>onAppointmentFormOpening</code>.',
    ],
    expect: 'Ресурс предзаполнен id листа (не родителя); '
      + 'в выпадающем списке ресурса перечислены только листья, без Building/Floor. '
      + '<b>Проверено: список отдаёт и родителей</b> — см. сценарий «Форма предлагает родителей → встреча пропадает».',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentFormOpening: function (e) {
          LAB.log('formOpening: roomId =', e.appointmentData.roomId);
        },
        onAppointmentAdded: function (e) {
          LAB.log('added: roomId =', e.appointmentData.roomId);
        },
      });
    },
  });

  add({
    id: 'interact-edit',
    section: '5. Взаимодействия',
    title: 'Редактирование встречи и смена группы через форму',
    tags: ['редактирование', 'форма'],
    goal: 'Через форму можно перенести встречу в другую листовую группу, и только в листовую.',
    steps: [
      'Открыть любую встречу двойным кликом.',
      'Проверить состав редактора ресурса: должны быть только комнаты-листья.',
      'Сменить комнату на комнату из другой ветки, сохранить, проверить перемещение.',
      'Открыть встречу снова и убедиться, что значение сохранилось.',
    ],
    expect: 'В редакторе ресурса нет родительских узлов (Building/Floor); '
      + 'после сохранения встреча стоит в выбранной группе, и повторное открытие показывает то же значение. '
      + '<b>Проверено: родители в списке есть</b>, а выбор родителя убирает встречу из сетки.',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentUpdated: function (e) {
          LAB.log('updated: roomId =', e.appointmentData.roomId);
        },
      });
    },
  });

  add({
    id: 'interact-dnd',
    section: '5. Взаимодействия',
    title: 'Drag & drop между листовыми группами',
    tags: ['drag&drop'],
    goal: 'Перенос встречи мышью между листьями — в том числе в другую ветку дерева.',
    steps: [
      'Перетащить встречу из <b>Room 101</b> в <b>Room 102</b> (сосед по этажу).',
      'Перетащить встречу из <b>Room 102</b> в <b>Room 301</b> (другой Building).',
      'Перетащить встречу и отпустить <b>над заголовком родителя</b> (Building/Floor) — так делать нельзя, посмотреть, что произойдёт.',
      'Смотреть лог: <code>oldData.roomId → newData.roomId</code> после каждого переноса.',
    ],
    expect: 'Встреча оказывается ровно в целевой листовой группе, дата/время не «съезжают»; '
      + 'в <code>newData</code> лежит id листа. Сброс над заголовком группы не должен ломать данные.',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentUpdating: function (e) {
          LAB.log('updating:', e.oldData.roomId, '→', e.newData.roomId,
            '|', String(e.newData.startDate));
        },
      });
    },
  });

  add({
    id: 'interact-scrollto',
    section: '5. Взаимодействия',
    title: 'scrollTo / scrollToTime к нужной группе',
    tags: ['scrollTo', 'API'],
    goal: 'Программная прокрутка к дате и группе должна попадать в правильную ветку дерева.',
    steps: [
      'Нажать <b>scrollTo Room 301</b> — сетка должна прокрутиться к группе Room 301 (правая ветка) на 15:00.',
      'Нажать <b>scrollTo Room 101</b> — вернуться к первой ветке.',
      'Нажать <b>scrollToTime 18:00</b> — вертикальная прокрутка без смены группы.',
      'Повторить на вертикальной ориентации (второй вид в тулбаре).',
    ],
    expect: 'После каждого нажатия целевая группа и время видны в области прокрутки; '
      + 'исключений нет; при вертикальной группировке прокрутка попадает в нужную полосу.',
    fn: function (H, LAB) {
      var scrollTo = function (roomId) {
        return function () {
          LAB.scheduler().scrollTo(H.at(2, 15, 0), { roomId: roomId });
          LAB.log('scrollTo roomId =', roomId);
        };
      };

      return H.base({
        views: [
          { type: 'timelineWeek', groupOrientation: 'vertical' },
          { type: 'week', groupOrientation: 'horizontal' },
        ],
        currentView: 'timelineWeek',
        height: 420,
        dataSource: H.appts('roomId', H.leafIds(H.treeWide)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeWide, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        toolbar: {
          items: [
            'viewSwitcher',
            'dateNavigator',
            { widget: 'dxButton', location: 'after', options: { text: 'scrollTo Room 313', onClick: scrollTo(313) } },
            { widget: 'dxButton', location: 'after', options: { text: 'scrollTo Room 111', onClick: scrollTo(111) } },
            {
              widget: 'dxButton',
              location: 'after',
              options: {
                text: 'scrollToTime 18:00',
                onClick: function () { LAB.scheduler().scrollToTime(18, 0, H.at(2, 0)); },
              },
            },
          ],
        },
      });
    },
  });

  // ——— 6. Регрессия —————————————————————————————————————————————————————

  add({
    id: 'regress-flat-horizontal',
    section: '6. Регрессия (без иерархии)',
    title: 'Плоские ресурсы, horizontal',
    tags: ['регрессия', 'flat'],
    goal: 'Без <code>parentIdExpr</code> всё должно выглядеть точно как до фичи.',
    steps: [
      'Осмотреть шапку: один ряд групп, три группы.',
      'Проверить разделители групп и цвета встреч.',
      'Проверить создание/перенос встречи.',
    ],
    expect: 'Один уровень группировки, поведение без изменений относительно релиза.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('assigneeId', [1, 2, 3]),
        groups: ['assigneeId'],
        resources: [{
          fieldExpr: 'assigneeId', dataSource: H.flat, label: 'Employee', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'regress-flat-vertical',
    section: '6. Регрессия (без иерархии)',
    title: 'Плоские ресурсы, vertical (и их подсказки)',
    tags: ['регрессия', 'flat', 'vertical'],
    goal: 'Плоская вертикальная группировка: сравнить разметку заголовков с иерархической.',
    steps: [
      'Осмотреть панель групп слева — один столбец.',
      'Сузить ширину до 480 и проверить, обрезается ли текст и есть ли подсказка при наведении.',
      'Сверить блок «Разметка заголовков групп» с иерархическим сценарием.',
    ],
    expect: 'Плоская группировка работает как раньше. '
      + 'Если у обрезанной подписи нет <code>title</code> — это дефект доступности, отметить как баг с заметкой.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'vertical' }],
        currentView: 'week',
        dataSource: H.appts('assigneeId', [1, 2, 3]),
        groups: ['assigneeId'],
        resources: [{
          fieldExpr: 'assigneeId',
          dataSource: [
            { id: 1, text: 'Samantha Bright — Regional Sales Director', color: '#A7E3A5' },
            { id: 2, text: 'John Heart — Chief Technology Officer', color: '#F9E2AE' },
            { id: 3, text: 'Todd Hoffman — Customer Success Manager', color: '#F1BBBC' },
          ],
          label: 'Employee',
          allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'regress-flat-plus-hierarchy',
    section: '6. Регрессия (без иерархии)',
    title: 'Иерархический + плоский ресурс вместе',
    tags: ['регрессия', 'два ресурса'],
    goal: 'Смешанная группировка: сначала иерархия комнат, потом плоский приоритет.',
    steps: [
      'Проверить, что под каждым листом-комнатой раскрылись обе группы приоритета.',
      'Поменять порядок в <code>groups</code> на <code>[\'priorityId\', \'roomId\']</code> (код ниже) и запустить.',
      'Сравнить обе картинки: в каком порядке уровни, не потерялись ли группы.',
    ],
    expect: 'Иерархия и плоский ресурс комбинируются как обычные уровни группировки; '
      + 'порядок в <code>groups</code> определяет порядок уровней, число листовых полос = листья × приоритеты.',
    fn: function (H) {
      var leaves = H.leafIds(H.tree3);
      var data = H.appts('roomId', leaves).map(function (a, i) {
        return Object.assign({}, a, { priorityId: i % 2 ? 'high' : 'low' });
      });

      return H.base({
        crossScrollingEnabled: true,
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        height: 700,
        dataSource: data,
        groups: ['roomId', 'priorityId'],
        resources: [
          {
            fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
          },
          {
            fieldExpr: 'priorityId', dataSource: H.priorities, label: 'Priority', useColorAsDefault: true,
          },
        ],
      });
    },
  });

  // ——— 7. Вне scope —————————————————————————————————————————————————————

  add({
    id: 'outscope-collapse',
    section: '7. Вне scope (не должно работать)',
    title: 'Свёртывание/разворот узлов — не поддерживается',
    tags: ['вне scope'],
    goal: 'Убедиться, что попытки «свернуть» родителя ничего не ломают: API нет, кликов быть не должно.',
    steps: [
      'Кликнуть и дважды кликнуть по заголовку <b>Building A</b>, затем по <b>Floor 1</b>.',
      'Проверить, что группа не свернулась, ничего не исчезло и не появилось исключений.',
      'Проверить, что клик по заголовку не выделяет ячейки и не открывает форму встречи.',
    ],
    expect: 'Заголовок родителя не интерактивен: ни сворачивания, ни выделения, ни формы, ни ошибок в консоли.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'outscope-drag-tree',
    section: '7. Вне scope (не должно работать)',
    title: 'Перетаскивание самой структуры дерева — не поддерживается',
    tags: ['вне scope', 'drag&drop'],
    goal: 'Заголовки групп не должны быть перетаскиваемыми.',
    steps: [
      'Попробовать потащить мышью заголовок <b>Room 101</b> на место <b>Room 201</b>.',
      'Попробовать потащить заголовок <b>Floor 1</b>.',
      'Проверить, что нет ни превью перетаскивания, ни изменения порядка групп, ни ошибок.',
    ],
    expect: 'Перетаскивание заголовков игнорируется полностью; порядок групп неизменен.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'outscope-depth-4',
    section: '7. Вне scope (не должно работать)',
    title: 'Глубина 4 — вне заявленных 3 уровней',
    tags: ['вне scope', 'глубина 4'],
    goal: 'Заявлена поддержка до 3 уровней. Проверить, что 4 уровня не приводят к падению или мусорной вёрстке.',
    steps: [
      'Осмотреть шапку: сколько рядов реально отрисовано (см. диагностику «уровней в горизонтальной шапке»).',
      'Переключиться на вертикальную ориентацию и посмотреть ширину панели групп.',
      'Проверить консоль на исключения и предупреждения.',
    ],
    expect: 'Либо корректная отрисовка 4 уровней, либо аккуратная деградация. '
      + 'Недопустимо: исключение, пустые ряды, разъезжание шапки и сетки.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree4)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree4, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'outscope-kbn',
    section: '7. Вне scope (не должно работать)',
    title: 'Клавиатура: спец. навигация по многоуровневой шапке не требуется',
    tags: ['вне scope', 'клавиатура'],
    goal: 'Специальной навигации по уровням шапки не заявлено. Проверить, что базовая навигация по ячейкам не сломана.',
    steps: [
      'Кликнуть по ячейке под Room 101 и походить стрелками влево/вправо/вверх/вниз.',
      'Проверить, что фокус переходит между группами по горизонтали и не «застревает» на границе.',
      'Нажать Tab несколько раз: фокус должен идти по тулбару и сетке, не попадая внутрь заголовков групп на каждый уровень.',
      'Нажать Enter на ячейке — должна открыться форма новой встречи с правильной группой.',
    ],
    expect: 'Навигация по ячейкам работает как в плоской группировке; '
      + 'заголовки уровней не создают лишних остановок Tab; Enter даёт правильный ресурс.',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentFormOpening: function (e) {
          LAB.log('formOpening: roomId =', e.appointmentData.roomId);
        },
      });
    },
  });
}());
