// Дополнительные сценарии — вне чек-листа задачи. Выбраны по местам, которые
// в коде фичи не покрыты автотестами или выглядят рискованно.
(function () {
  var S = window.SCENARIOS = window.SCENARIOS || [];
  var add = function (scenario) {
    scenario.extra = true;
    S.push(scenario);
  };

  // ——— 8. Кривые данные ——————————————————————————————————————————————————

  add({
    id: 'data-orphan',
    section: '8. Кривые данные',
    title: 'Сирота: parentId ссылается на несуществующий id',
    tags: ['битые данные'],
    goal: 'Узел с parentId = «ghost» не имеет родителя в источнике.',
    steps: [
      'Посмотреть, где оказался <b>Room 102 (сирота)</b>: рядом с Building A, отдельным корнем или пропал.',
      'Проверить, отрисовались ли его встречи.',
      'Проверить консоль на предупреждения.',
    ],
    expect: 'Ожидаемо (по коду) сирота становится корнем и получает свою группу — '
      + 'встречи видны, ничего не теряется и не падает.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.broken.orphan)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.orphan, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-cycle',
    section: '8. Кривые данные',
    title: 'Цикл A → B → A',
    tags: ['битые данные'],
    goal: 'Взаимные ссылки не должны приводить к зависанию или переполнению стека.',
    steps: [
      'Дождаться отрисовки: страница не должна «повиснуть».',
      'Посмотреть, как показаны Node A и Node B (оба корня? один вложен?).',
      'Проверить консоль.',
    ],
    expect: 'Ребро цикла игнорируется, оба узла становятся корнями-листьями; ни зависания, ни исключения.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', ['a', 'b', 'c']),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.cycle, parentIdExpr: 'parentId', label: 'Node', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-self-parent',
    section: '8. Кривые данные',
    title: 'Узел сам себе родитель (parentId === id)',
    tags: ['битые данные'],
    goal: 'Вырожденный случай, для которого в коде нет unit-теста.',
    steps: [
      'Проверить, что Node A показан один раз, а не дважды и не вложен в себя.',
      'Проверить, что Node B (его настоящий ребёнок) на месте.',
      'Проверить консоль и время отрисовки.',
    ],
    expect: 'Самоссылка трактуется как «нет родителя»: Node A — корень, Node B — его лист; без падений.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', ['b']),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.selfParent, parentIdExpr: 'parentId', label: 'Node', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-duplicate-ids',
    section: '8. Кривые данные',
    title: 'Дублирующиеся id в источнике ресурса',
    tags: ['битые данные', 'риск'],
    goal: 'В источнике два узла с id = 101. По коду дерево строится по хешу id, и один из них перетирается.',
    steps: [
      'Сосчитать листовые группы в шапке и сравнить с числом уникальных комнат (ожидается 2: Room 101 и Room 102).',
      'Посмотреть в диагностике блок «Повторяющиеся подписи листовых групп».',
      'Проверить, не задублировались ли встречи Room 101.',
      'Проверить общую ширину сетки: лишняя группа = лишняя колонка.',
    ],
    expect: 'Дубли id — данные некорректные, но виджет не должен рисовать одну и ту же группу дважды '
      + 'и не должен дублировать встречи. Если групп 3 вместо 2 — это дефект (отметить как баг).',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', [101, 102]),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.duplicateIds, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-empty-parent',
    section: '8. Кривые данные',
    title: 'Родители без детей рядом с обычной веткой',
    tags: ['битые данные'],
    goal: 'Building B и Building C не имеют потомков, Building A имеет одну комнату.',
    steps: [
      'Проверить, что пустые родители стали листьями со своей сеткой.',
      'Проверить выравнивание уровней: у Building A лист на 2-м уровне, у B и C — на 1-м.',
      'Повторить в вертикальной ориентации.',
    ],
    expect: 'Смешанная глубина отрисована ровно, без пустых ячеек над листьями верхнего уровня.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.broken.emptyParent)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.emptyParent, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-object-ids',
    section: '8. Кривые данные',
    title: 'id-объекты вместо скаляров',
    tags: ['объектные id'],
    goal: 'valueExpr может отдавать объекты; сравнение по значению работает в дереве, но не везде дальше.',
    steps: [
      'Проверить, что дерево построено: Building A → Room 101 / Room 102.',
      'Проверить, что встречи попали в свои группы (id встречи — тот же объект по значению, но другой по ссылке).',
      'Открыть встречу двойным кликом и посмотреть, определился ли ресурс в форме.',
      'Навести курсор на встречу и посмотреть подсказку.',
    ],
    expect: 'Группировка и попадание встреч в группы работают по значению id; '
      + 'если встречи исчезают или форма не видит ресурс — дефект.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: [
          {
            text: 'Room 101 — планёрка', roomId: [{ code: 'r1' }], startDate: H.at(0, 10), endDate: H.at(0, 11),
          },
          {
            text: 'Room 102 — интервью', roomId: [{ code: 'r2' }], startDate: H.at(1, 12), endDate: H.at(1, 13, 30),
          },
        ],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.broken.objectIds, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-appointment-on-parent',
    section: '8. Кривые данные',
    title: 'Встреча назначена на родительский узел',
    tags: ['риск', 'данные'],
    goal: 'Группы создаются только для листьев. Что происходит со встречей, у которой roomId = id родителя?',
    steps: [
      'Найти в сетке три встречи: «Лист 101», «Лист 301» — должны быть видны.',
      'Найти «Родитель Building A» и «Родитель Floor 1» — посмотреть, есть ли они где-нибудь.',
      'Сверить с диагностикой: «встреч в DOM» должно быть меньше, чем записей в источнике.',
      'Проверить, есть ли предупреждение в консоли.',
    ],
    expect: 'По коду такие встречи молча отбрасываются. Вопрос к фиче: пользователь теряет данные без '
      + 'единого сообщения — стоит либо предупреждение в консоли, либо явная ремарка в документации.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: [
          {
            text: 'Лист 101', roomId: [101], startDate: H.at(0, 9), endDate: H.at(0, 10),
          },
          {
            text: 'Лист 301', roomId: [301], startDate: H.at(0, 11), endDate: H.at(0, 12),
          },
          {
            text: 'Родитель Building A', roomId: ['b1'], startDate: H.at(1, 9), endDate: H.at(1, 10),
          },
          {
            text: 'Родитель Floor 1', roomId: ['f11'], startDate: H.at(1, 11), endDate: H.at(1, 12),
          },
          {
            text: 'Родитель + лист', roomId: ['b1', 102], startDate: H.at(2, 9), endDate: H.at(2, 10),
          },
        ],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'data-multiple-branches',
    section: '8. Кривые данные',
    title: 'allowMultiple: одна встреча в листьях разных ветвей',
    tags: ['allowMultiple'],
    goal: 'Встреча с roomId = [101, 301] должна отрисоваться в обеих группах разных Building.',
    steps: [
      'Найти «Общая встреча» под Room 101 и под Room 301.',
      'Перетащить одну из копий в другую группу и посмотреть, что стало со второй.',
      'Открыть форму и проверить состав TagBox ресурса.',
    ],
    expect: 'Копии отрисованы во всех выбранных листьях; правка одной копии меняет одну запись данных, '
      + 'а не размножает встречу.',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: [
          {
            text: 'Общая встреча', roomId: [101, 301], startDate: H.at(0, 10), endDate: H.at(0, 12),
          },
          {
            text: 'Только 102', roomId: [102], startDate: H.at(1, 10), endDate: H.at(1, 11),
          },
        ],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentUpdating: function (e) {
          LAB.log('updating:', e.oldData.roomId, '→', e.newData.roomId);
        },
      });
    },
  });

  // ——— 9. Опции и интеграции ————————————————————————————————————————————

  add({
    id: 'opt-agenda',
    section: '9. Опции и интеграции',
    title: 'Agenda + иерархия',
    tags: ['agenda', 'риск'],
    goal: 'Agenda рисует группы по своему старому пути. Проверить, все ли уровни попали в список.',
    steps: [
      'Сравнить список групп слева с деревом: ожидаются Building A / Floor 1 / Room 101 / Room 102 / Floor 2 / Room 201 / Building B / Floor 1 / Room 301.',
      'Пересчитать встречи: все ли записи источника видны в списке.',
      'Переключиться на Week и обратно — картинка Agenda должна восстановиться.',
    ],
    expect: 'Список сгруппирован по дереву и ни одна встреча не потеряна. '
      + 'Если подписи родителей отсутствуют, а встречи при этом перечислены — дефект Agenda (отметить как баг).',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'agenda', groupOrientation: 'vertical' },
          { type: 'week', groupOrientation: 'horizontal' },
        ],
        currentView: 'agenda',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-month',
    section: '9. Опции и интеграции',
    title: 'Month + иерархия',
    tags: ['month'],
    goal: 'Month не перечислен в списке поддерживаемых видов задачи, но доступен пользователю.',
    steps: [
      'Проверить шапку в горизонтальной ориентации: 3 уровня × 7 дней недели на каждую группу.',
      'Переключить на вертикальную (второй вид) — панель групп слева.',
      'Проверить, что встречи попадают в правильные дни и группы, а «ещё N» открывает список своей группы.',
    ],
    expect: 'Иерархия отрисована так же, как в Week; переполнение ячейки («ещё N») показывает встречи только своей группы.',
    fn: function (H) {
      return H.base({
        crossScrollingEnabled: true,
        views: [
          { type: 'month', groupOrientation: 'horizontal' },
          { type: 'month', name: 'Month (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'month',
        height: 700,
        dataSource: H.appts('roomId', H.leafIds(H.tree3), { perId: 4 }),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-group-by-date',
    section: '9. Опции и интеграции',
    title: 'groupByDate + иерархия',
    tags: ['groupByDate', 'риск'],
    goal: 'При группировке по датам порядок уровней инвертируется: сначала дата, потом группы. '
      + 'Признак «последняя колонка группы» при этом пересчитывается отдельно.',
    steps: [
      'Осмотреть шапку: дни недели верхним уровнем, внутри каждого дня — дерево комнат.',
      'Внимательно посмотреть на вертикальные разделители: сильная линия должна стоять на границе <b>дней</b> и на границе верхних узлов дерева, тонкая — внутри этажа.',
      'Сравнить с тем же деревом без groupByDate (сценарий «horizontal · week · 3 уровня»).',
      'Проверить, что встречи стоят под правильной парой «день + комната».',
    ],
    expect: 'Дерево повторяется под каждой датой полностью; границы групп/дат нарисованы одинаково для всех дат '
      + '(в т.ч. для последней). Пропавший или лишний разделитель — дефект.',
    fn: function (H) {
      return H.base({
        crossScrollingEnabled: true,
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        groupByDate: true,
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-virtual-scrolling',
    section: '9. Опции и интеграции',
    title: 'Виртуальная прокрутка + 18 листовых групп',
    tags: ['virtual scrolling', 'риск'],
    goal: 'Виртуальный рендеринг с иерархией автотестами не покрыт.',
    steps: [
      'Проскроллить сетку вправо до конца и обратно — заголовки уровней должны оставаться на своих колонках.',
      'Проскроллить вниз и вверх — встречи не должны дублироваться или пропадать.',
      'Быстро подёргать скролл (рывками) и проверить консоль.',
      'Сверить число листовых групп в диагностике: 18.',
    ],
    expect: 'Шапка и сетка не расходятся при прокрутке; встречи не мигают и не дублируются; исключений нет.',
    fn: function (H) {
      return H.base({
        crossScrollingEnabled: true,
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        height: 500,
        scrolling: { mode: 'virtual' },
        dataSource: H.appts('roomId', H.leafIds(H.treeWide)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeWide, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-cross-scrolling',
    section: '9. Опции и интеграции',
    title: 'crossScrollingEnabled + вертикальная группировка',
    tags: ['crossScrolling'],
    goal: 'Панель групп при кросс-скролле должна ехать синхронно с сеткой по вертикали и стоять на месте по горизонтали.',
    steps: [
      'Проскроллить по горизонтали — панель групп слева должна остаться видимой.',
      'Проскроллить по вертикали — подписи групп должны совпадать со своими полосами.',
      'Проверить угловую ячейку (пересечение шапки и панели групп) на артефакты.',
    ],
    expect: 'Синхронная прокрутка без «уползания» подписей; границы уровней совпадают с полосами сетки.',
    fn: function (H) {
      return H.base({
        views: [{ type: 'timelineWeek', groupOrientation: 'vertical' }],
        currentView: 'timelineWeek',
        height: 480,
        crossScrollingEnabled: true,
        dataSource: H.appts('roomId', H.leafIds(H.treeWide)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeWide, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-narrow',
    section: '9. Опции и интеграции',
    title: 'Узкий контейнер (телефон) + иерархия',
    tags: ['адаптивность'],
    goal: 'На узкой ширине шапка групп конкурирует с колонками дат.',
    steps: [
      'Выставить сверху «Ширина» = 480, затем 360.',
      'Проверить, читаемы ли подписи уровней и есть ли у них подсказки (диагностика).',
      'Двойным кликом открыть форму — на узком экране она должна стать полноэкранной.',
      'Переключиться на вертикальную ориентацию: панель групп займёт заметную долю ширины — оценить, остаётся ли сетка пригодной.',
    ],
    expect: 'Нет горизонтального «разъезда» шапки и сетки, нет наложения текста; форма адаптивна.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'day', groupOrientation: 'horizontal' },
          { type: 'day', name: 'Day (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'day',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-rtl',
    section: '9. Опции и интеграции',
    title: 'RTL: направление уровней и разделители',
    tags: ['RTL'],
    goal: 'В RTL дерево должно строиться справа налево, а «внешняя» граница группы — на правильной стороне.',
    steps: [
      'Проверить порядок групп: Building A должен быть справа.',
      'Проверить вертикальные разделители: сильная линия — между Building, тонкая — внутри этажа (без двойных линий).',
      'Переключить на вертикальную ориентацию — панель групп должна быть справа.',
      'Перетащить встречу между группами и проверить, что она попала туда, куда её отпустили.',
    ],
    expect: 'Зеркальная раскладка без двойных/пропавших границ; drag&drop не путает соседние группы.',
    fn: function (H) {
      return H.base({
        rtlEnabled: true,
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
    id: 'opt-recurrence',
    section: '9. Опции и интеграции',
    title: 'Повторяющиеся встречи в листовых группах',
    tags: ['recurrence'],
    goal: 'Правило повторения + группировка: все вхождения должны остаться в своей группе.',
    steps: [
      'Проверить, что ежедневная встреча Room 101 видна во все будни, и только в Room 101.',
      'Открыть одно вхождение, выбрать «Текущая встреча», перенести её в другую комнату и сохранить.',
      'Проверить, что исключение встало в новую группу, а остальные вхождения остались в исходной.',
      'Смотреть лог событий.',
    ],
    expect: 'Вхождения не «протекают» в соседние группы; исключение серии живёт в выбранной группе.',
    fn: function (H, LAB) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: [
          {
            text: 'Daily standup',
            roomId: [101],
            startDate: H.at(0, 9, 30),
            endDate: H.at(0, 10),
            recurrenceRule: 'FREQ=DAILY;COUNT=5',
          },
          {
            text: 'Weekly sync',
            roomId: [301],
            startDate: H.at(1, 14),
            endDate: H.at(1, 15),
            recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU',
          },
        ],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onAppointmentUpdating: function (e) {
          LAB.log('updating:', e.oldData.text, e.oldData.roomId, '→', e.newData.roomId);
        },
      });
    },
  });

  add({
    id: 'opt-current-time',
    section: '9. Опции и интеграции',
    title: 'Индикатор текущего времени поперёк групп',
    tags: ['currentTimeIndicator'],
    goal: 'Индикатор и затенение прошедшего времени должны проходить через все листовые группы одинаково.',
    steps: [
      'Проверить, что красная линия есть в каждой листовой группе и стоит на одной высоте.',
      'Проверить затенение прошедшего времени (shadeUntilCurrentTime) — не должно быть «ступенек» между группами.',
      'Повторить на вертикальной ориентации: линия должна идти через все полосы.',
    ],
    expect: 'Индикатор непрерывен и одинаков во всех группах; затенение не путает границы групп с границами дней.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        currentDate: new Date(),
        showCurrentTimeIndicator: true,
        shadeUntilCurrentTime: true,
        indicatorUpdateInterval: 10000,
        dataSource: [],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-async-store',
    section: '9. Опции и интеграции',
    title: 'Асинхронный источник ресурсов (CustomStore, 800 мс)',
    tags: ['async', 'риск'],
    goal: 'Дерево строится после загрузки ресурсов. Проверить, что первая отрисовка не «застывает» без групп.',
    steps: [
      'Перезапустить сценарий (Ctrl+Enter) и следить за первой секундой: сначала загрузка, потом полное дерево.',
      'Проверить, что после загрузки встречи стоят в своих группах (а не свалены в одну).',
      'Нажать <b>перезагрузить ресурсы</b> и проверить, что дерево перестроилось.',
    ],
    expect: 'После загрузки — полное дерево и правильное распределение встреч; '
      + 'нет промежуточного состояния, которое остаётся навсегда.',
    fn: function (H, LAB, DevExpress) {
      var store = new DevExpress.data.CustomStore({
        key: 'id',
        loadMode: 'raw',
        load: function () {
          return new Promise(function (resolve) {
            setTimeout(function () { resolve(H.tree3); }, 800);
          });
        },
      });

      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: store, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        toolbar: [
          'viewSwitcher',
          'dateNavigator',
          {
            widget: 'dxButton',
            location: 'after',
            options: {
              text: 'перезагрузить ресурсы',
              onClick: function () {
                LAB.scheduler().option('resources', [{
                  fieldExpr: 'roomId', dataSource: store, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
                }]);
                setTimeout(LAB.diagnose, 1200);
              },
            },
          },
        ],
      });
    },
  });

  add({
    id: 'opt-datasource-filter',
    section: '9. Опции и интеграции',
    title: 'DataSource ресурса с filter / sort / map',
    tags: ['DataSource', 'риск'],
    goal: 'Источник ресурсов задан через DataSource с фильтром, сортировкой и преобразованием — '
      + 'всё это должно применяться до построения дерева.',
    steps: [
      'Проверить, что комната с id 201 отфильтрована и её нет ни в шапке, ни как пустой узел.',
      'Проверить сортировку: комнаты внутри этажа — по убыванию названия.',
      'Проверить, что map сработал: у подписей есть префикс «№».',
      'Проверить, что встречи отфильтрованной комнаты не появились в чужой группе.',
    ],
    expect: 'filter/sort/map применяются к дереву; отфильтрованный узел исчезает полностью; '
      + 'его встречи не «переезжают» к соседям.',
    fn: function (H, LAB, DevExpress) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId',
          parentIdExpr: 'parentId',
          label: 'Room',
          allowMultiple: true,
          dataSource: new DevExpress.data.DataSource({
            store: H.tree3,
            paginate: false,
            filter: ['id', '<>', 201],
            sort: [{ selector: 'text', desc: true }],
            map: function (item) {
              return Object.assign({}, item, {
                text: typeof item.id === 'number' ? '№ ' + item.text : item.text,
              });
            },
          }),
        }],
      });
    },
  });

  add({
    id: 'opt-runtime-groups',
    section: '9. Опции и интеграции',
    title: 'Смена groups / parentIdExpr в рантайме',
    tags: ['рантайм', 'риск'],
    goal: 'Включение и выключение иерархии на живом виджете (частый сценарий в приложениях).',
    steps: [
      'Нажать <b>убрать parentIdExpr</b> — группировка должна стать плоской (все узлы дерева как отдельные группы).',
      'Нажать <b>вернуть иерархию</b> — дерево должно восстановиться.',
      'Нажать <b>groups = []</b> и затем <b>groups = [roomId]</b>.',
      'Нажать <b>другое дерево</b> (2 уровня вместо 3) и проверить полную перерисовку.',
      'После каждого шага смотреть консоль и диагностику.',
    ],
    expect: 'Каждое переключение даёт консистентную картинку: нет «полудерева», лишних колонок, '
      + 'пропавших встреч и исключений.',
    fn: function (H, LAB) {
      var hierarchical = {
        fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
      };
      var flatResource = {
        fieldExpr: 'roomId', dataSource: H.tree3, label: 'Room', allowMultiple: true,
      };
      var button = function (text, handler) {
        return {
          widget: 'dxButton',
          location: 'after',
          options: {
            text: text,
            onClick: function () {
              handler(LAB.scheduler());
              setTimeout(LAB.diagnose, 400);
            },
          },
        };
      };

      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [hierarchical],
        toolbar: [
          'dateNavigator',
          button('убрать parentIdExpr', function (s) { s.option('resources', [flatResource]); }),
          button('вернуть иерархию', function (s) { s.option('resources', [hierarchical]); }),
          button('groups = []', function (s) { s.option('groups', []); }),
          button('groups = [roomId]', function (s) { s.option('groups', ['roomId']); }),
          button('другое дерево', function (s) {
            s.option('resources', [{
              fieldExpr: 'roomId', dataSource: H.tree2, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
            }]);
            s.option('dataSource', H.appts('roomId', H.leafIds(H.tree2)));
          }),
        ],
      });
    },
  });

  add({
    id: 'opt-template',
    section: '9. Опции и интеграции',
    title: 'resourceCellTemplate по уровням',
    tags: ['template'],
    goal: 'Шаблон заголовка получает уровень, признак листа и путь до корня. Проверить, что данные шаблона верны на каждом уровне.',
    steps: [
      'Осмотреть шапку: у родителей — жирная подпись с числом уровня, у листьев — цветная точка и полный путь в подсказке.',
      'Сверить <code>level</code> в подписи с фактическим уровнем.',
      'Переключиться на вертикальную ориентацию и повторить.',
      'Переключиться на Agenda (третий вид) и посмотреть, приходят ли туда те же поля.',
    ],
    expect: 'На всех уровнях доступны <code>level</code>, <code>isLeaf</code>, <code>path</code> и исходные данные узла; '
      + 'значения совпадают с деревом. Расхождение между видами — дефект.',
    fn: function (H) {
      return H.base({
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'week', name: 'Week (vertical)', groupOrientation: 'vertical' },
          { type: 'agenda', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        resourceCellTemplate: function (data, index, element) {
          var path = (data.path || []).map(function (p) { return p.text; }).join(' / ');
          var wrapper = document.createElement('div');

          wrapper.style.cssText = 'display:flex;gap:4px;align-items:center;justify-content:center;'
            + 'overflow:hidden;white-space:nowrap;padding:0 4px;';
          wrapper.title = path + '  ·  level=' + data.level + ', isLeaf=' + data.isLeaf
            + ', resourceIndex=' + data.resourceIndex;

          if (data.isLeaf) {
            var dot = document.createElement('i');
            dot.style.cssText = 'width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:'
              + (data.color || 'transparent');
            wrapper.appendChild(dot);
          }

          var text = document.createElement('span');
          text.style.cssText = 'overflow:hidden;text-overflow:ellipsis;'
            + (data.isLeaf ? '' : 'font-weight:600;');
          text.textContent = data.text + ' · L' + data.level;
          wrapper.appendChild(text);

          // В jQuery-подходе шаблон получает jQuery-элемент, а не DOM-узел.
          var host = element.appendChild ? element : element[0];
          host.appendChild(wrapper);
        },
      });
    },
  });

  add({
    id: 'opt-group-texts',
    section: '9. Опции и интеграции',
    title: 'Подпись встречи и подсказка: виден ли путь по дереву',
    tags: ['a11y', 'tooltip'],
    goal: 'Доступное имя встречи собирается из названий групп. Проверить, попадают ли туда родительские уровни.',
    steps: [
      'Навести курсор на встречу под Room 101 и прочитать подсказку.',
      'Кликнуть по встрече — в тултипе посмотреть, указана ли комната и её ветка.',
      'Через инспектор (или скринридер) прочитать <code>aria-label</code> встречи.',
      'Сравнить с двумя одноимёнными комнатами: в дереве есть два «Floor 1» — можно ли по подписи понять, о каком речь.',
    ],
    expect: 'Название встречи однозначно идентифицирует группу. Если в подписи только имя листа, '
      + 'а одноимённые узлы неразличимы — это замечание к доступности (отметить и описать).',
    fn: function (H) {
      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        dataSource: [
          {
            text: 'Планёрка', roomId: [101], startDate: H.at(0, 10), endDate: H.at(0, 11),
          },
          {
            text: 'Ретро', roomId: [301], startDate: H.at(0, 12), endDate: H.at(0, 13),
          },
        ],
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-resize-select',
    section: '9. Опции и интеграции',
    title: 'Ресайз встречи и выделение ячеек на границе групп',
    tags: ['resize', 'выделение'],
    goal: 'Ручки ресайза и выделение мышью не должны пересекать границу группы.',
    steps: [
      'Растянуть встречу вниз и вверх внутри Room 101.',
      'Попробовать протянуть выделение мышью из Room 101 в Room 102 — выделение не должно уходить в чужую группу.',
      'Нажать Shift+стрелки на выделенной ячейке и проверить границу группы.',
      'Открыть форму из выделения (двойной клик) и проверить, что предзаполнены и время, и группа.',
    ],
    expect: 'Ресайз ограничен своей группой; выделение не «перепрыгивает» в соседнюю группу; '
      + 'создание из выделения даёт правильные время и ресурс.',
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
          LAB.log('resize/move:', String(e.newData.startDate), '→', String(e.newData.endDate),
            '| roomId =', e.newData.roomId);
        },
        onCellClick: function (e) {
          LAB.log('cellClick: groups =', e.cellData.groups, String(e.cellData.startDate));
        },
      });
    },
  });

  add({
    id: 'opt-interval-count',
    section: '9. Опции и интеграции',
    title: 'intervalCount + иерархия (много колонок)',
    tags: ['intervalCount'],
    goal: 'Две недели × дерево комнат — проверить выравнивание шапки при большом числе колонок.',
    steps: [
      'Проверить, что каждый лист получил 10 рабочих дней (2 недели), а родители растянуты корректно.',
      'Проскроллить вправо до конца — шапка не должна расходиться с сеткой.',
      'Проверить разделители на стыке недель и на стыке групп — они не должны сливаться.',
    ],
    expect: 'colSpan родителя = число листьев × число колонок вида; шапка и сетка совпадают на всей ширине.',
    fn: function (H) {
      return H.base({
        crossScrollingEnabled: true,
        views: [{
          type: 'workWeek', groupOrientation: 'horizontal', intervalCount: 2,
        }],
        currentView: 'workWeek',
        dataSource: H.appts('roomId', H.leafIds(H.tree3)),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
      });
    },
  });

  add({
    id: 'opt-two-hierarchies',
    section: '9. Опции и интеграции',
    title: 'Две иерархии в groups одновременно',
    tags: ['две иерархии', 'риск'],
    goal: 'Оба ресурса с parentIdExpr. Такой набор автотестами не покрыт.',
    steps: [
      'Осмотреть шапку: сначала дерево комнат, внутри каждого листа — дерево сотрудников.',
      'Сосчитать листовые группы: 4 комнаты × 4 сотрудника = 16.',
      'Проверить, что встречи попадают в правильную пару и не размножаются.',
      'Поменять порядок в <code>groups</code> в коде и сравнить.',
    ],
    expect: 'Иерархии вкладываются друг в друга без потери уровней; число полос равно произведению листьев; '
      + 'исключений нет.',
    fn: function (H) {
      var rooms = H.leafIds(H.tree3);
      var employees = H.leafIds(H.tree2);
      var data = [];

      // Вид «день» показывает только опорную дату, поэтому все встречи ставим на неё.
      rooms.forEach(function (roomId, i) {
        data.push({
          text: 'Встреча ' + (i + 1),
          roomId: [roomId],
          assigneeId: [employees[i % employees.length]],
          startDate: H.at(2, 9 + i * 2),
          endDate: H.at(2, 10 + i * 2),
        });
      });

      return H.base({
        crossScrollingEnabled: true,
        views: [{ type: 'day', groupOrientation: 'horizontal' }],
        currentView: 'day',
        height: 700,
        dataSource: data,
        groups: ['roomId', 'assigneeId'],
        resources: [
          {
            fieldExpr: 'roomId', dataSource: H.tree3, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
          },
          {
            fieldExpr: 'assigneeId', dataSource: H.tree2, parentIdExpr: 'parentId', label: 'Employee', allowMultiple: true,
          },
        ],
      });
    },
  });

  add({
    id: 'opt-themes',
    section: '9. Опции и интеграции',
    title: 'Прогон по темам: тёмные, контрастные, compact',
    tags: ['темы', 'CSS'],
    goal: 'Иерархическая панель групп добавила свои стили. Проверить их во всех темах — особенно тёмных и контрастных.',
    steps: [
      'Пройти селектором «Тема» сверху: Fluent Light/Dark, Material Light/Dark, Generic Light/Dark/Contrast и compact-варианты (страница перезагрузится, сценарий сохранится).',
      'Смотреть: цвет разделителей уровней, фон заголовков родителей, читаемость текста, высоту рядов в compact.',
      'Отдельно проверить Contrast — там границы толще.',
      'В вертикальной ориентации (второй вид) проверить ширину столбцов уровней в каждой теме.',
    ],
    expect: 'Ни одного захардкоженного светлого цвета: заголовки и разделители читаемы во всех темах; '
      + 'в compact-темах ничего не обрезано сильнее обычного.',
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
    id: 'opt-perf',
    section: '9. Опции и интеграции',
    title: 'Нагрузка: 18 групп × 300 встреч',
    tags: ['производительность'],
    goal: 'Оценить отзывчивость на большом объёме: время первой отрисовки и плавность прокрутки.',
    steps: [
      'Перезапустить сценарий (Ctrl+Enter) и заметить, сколько идёт отрисовка (время появится в логе).',
      'Проскроллить сетку по горизонтали и вертикали — оценить плавность.',
      'Перетащить одну встречу — задержки быть не должно.',
      'Переключить вид на Timeline Month и вернуться назад.',
    ],
    expect: 'Отрисовка ощутимо не хуже плоской группировки с тем же числом групп; '
      + 'прокрутка и drag&drop без заметных фризов.',
    fn: function (H, LAB) {
      var leaves = H.leafIds(H.treeWide);
      var data = [];
      var started = Date.now();

      leaves.forEach(function (id, i) {
        for (var n = 0; n < 17; n += 1) {
          data.push({
            text: H.titles[(i + n) % H.titles.length],
            roomId: [id],
            startDate: H.at(n % 5, 8 + (n % 9), (n % 2) * 30),
            endDate: H.at(n % 5, 9 + (n % 9), (n % 2) * 30),
          });
        }
      });

      return H.base({
        crossScrollingEnabled: true,
        views: [
          { type: 'week', groupOrientation: 'horizontal' },
          { type: 'timelineMonth', groupOrientation: 'vertical' },
        ],
        currentView: 'week',
        height: 560,
        dataSource: data,
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: H.treeWide, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        onContentReady: function () {
          LAB.log('contentReady за', (Date.now() - started) + ' мс, встреч в источнике:', data.length);
        },
      });
    },
  });

  add({
    id: 'opt-narrow-cells',
    section: '9. Опции и интеграции',
    title: 'Ловушка: много групп без crossScrolling — встречи исчезают',
    tags: ['ловушка', 'не дефект фичи'],
    goal: 'Знать заранее, чтобы не записать в баги фичи: если групп много и crossScrolling выключен, '
      + 'ячейки сжимаются и встречи не рисуются вовсе. Поведение одинаково для плоской и иерархической группировки.',
    steps: [
      'Смотреть исходное состояние: 6 листьев, crossScrolling выключен — встреч в сетке нет (ширина ячейки в диагностике ~28px и меньше).',
      'Нажать <b>crossScrolling: on</b> — встречи появятся, сетка станет прокручиваемой.',
      'Нажать <b>плоские ресурсы</b> — то же самое без иерархии: встречи так же пропадают.',
      'Вывод: в таких сценариях включайте crossScrolling, а пропажу встреч в узких ячейках не относите к многоуровневой группировке.',
    ],
    expect: 'Поведение идентично для плоской и иерархической группировки — значит, к фиче отношения не имеет. '
      + 'Отличие между ними было бы дефектом.',
    fn: function (H, LAB) {
      var tree = [
        { id: 'b1', text: 'Building A', parentId: null },
        { id: 11, text: 'Room 11', parentId: 'b1', color: '#A7E3A5' },
        { id: 12, text: 'Room 12', parentId: 'b1', color: '#F9E2AE' },
        { id: 13, text: 'Room 13', parentId: 'b1', color: '#F1BBBC' },
        { id: 'b2', text: 'Building B', parentId: null },
        { id: 21, text: 'Room 21', parentId: 'b2', color: '#CFE4FA' },
        { id: 22, text: 'Room 22', parentId: 'b2', color: '#A7E3A5' },
        { id: 23, text: 'Room 23', parentId: 'b2', color: '#F9E2AE' },
      ];
      var leaves = [11, 12, 13, 21, 22, 23];

      return H.base({
        views: [{ type: 'week', groupOrientation: 'horizontal' }],
        currentView: 'week',
        crossScrollingEnabled: false,
        dataSource: H.appts('roomId', leaves),
        groups: ['roomId'],
        resources: [{
          fieldExpr: 'roomId', dataSource: tree, parentIdExpr: 'parentId', label: 'Room', allowMultiple: true,
        }],
        toolbar: [
          'dateNavigator',
          {
            widget: 'dxButton',
            location: 'after',
            options: {
              text: 'crossScrolling: on',
              onClick: function () {
                LAB.scheduler().option('crossScrollingEnabled', true);
                setTimeout(LAB.diagnose, 500);
              },
            },
          },
          {
            widget: 'dxButton',
            location: 'after',
            options: {
              text: 'плоские ресурсы',
              onClick: function () {
                LAB.scheduler().option('resources', [{
                  fieldExpr: 'roomId',
                  dataSource: tree.filter(function (item) { return typeof item.id === 'number'; }),
                  label: 'Room',
                  allowMultiple: true,
                }]);
                setTimeout(LAB.diagnose, 500);
              },
            },
          },
        ],
      });
    },
  });
}());
