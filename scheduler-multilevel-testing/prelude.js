// Общие данные стенда. Код ниже редактируется прямо на странице (вкладка «Общие данные»)
// и должен вернуть объект — он попадает в сценарии как `H`.
function PRELUDE_SOURCE(DevExpress, $) {
  // Опорная неделя: пн 10 августа 2026 — пт 14 августа 2026.
  const currentDate = new Date(2026, 7, 12);
  const at = (dayOffset, hours, minutes) => new Date(2026, 7, 10 + dayOffset, hours, minutes || 0);

  // 2 уровня: Room → Employee
  const tree2 = [
    { id: 'r1', text: 'Room 1', parentId: null },
    { id: 11, text: 'Samantha Bright', parentId: 'r1', color: '#A7E3A5' },
    { id: 12, text: 'John Heart', parentId: 'r1', color: '#F9E2AE' },
    { id: 'r2', text: 'Room 2', parentId: null },
    { id: 13, text: 'Todd Hoffman', parentId: 'r2', color: '#F1BBBC' },
    { id: 14, text: 'Sandra Johnson', parentId: 'r2', color: '#CFE4FA' },
  ];

  // 3 уровня: Building → Floor → Room
  const tree3 = [
    { id: 'b1', text: 'Building A', parentId: null },
    { id: 'f11', text: 'Floor 1', parentId: 'b1' },
    { id: 101, text: 'Room 101', parentId: 'f11', color: '#A7E3A5' },
    { id: 102, text: 'Room 102', parentId: 'f11', color: '#F9E2AE' },
    { id: 'f12', text: 'Floor 2', parentId: 'b1' },
    { id: 201, text: 'Room 201', parentId: 'f12', color: '#F1BBBC' },
    { id: 'b2', text: 'Building B', parentId: null },
    { id: 'f21', text: 'Floor 1', parentId: 'b2' },
    { id: 301, text: 'Room 301', parentId: 'f21', color: '#CFE4FA' },
  ];

  // Неравномерная глубина в пределах 3: ветка на 3 уровня, ветка на 2 уровня
  // и лист без родителя и без детей (Lobby) на верхнем уровне.
  const treeMixed = [
    { id: 'b1', text: 'Building A', parentId: null },
    { id: 'f11', text: 'Floor 1', parentId: 'b1' },
    { id: 101, text: 'Room 101', parentId: 'f11', color: '#A7E3A5' },
    { id: 102, text: 'Room 102', parentId: 'f11', color: '#F9E2AE' },
    { id: 'b2', text: 'Building B', parentId: null },
    { id: 401, text: 'Room 401', parentId: 'b2', color: '#F1BBBC' },
    { id: 'lobby', text: 'Lobby', parentId: null, color: '#CFE4FA' },
  ];

  // «Родитель с частью детей»: у Building A в источнике только одна из двух комнат,
  // у Building B детей нет вовсе.
  const treeSubset = [
    { id: 'b1', text: 'Building A', parentId: null },
    { id: 101, text: 'Room 101', parentId: 'b1', color: '#A7E3A5' },
    { id: 'b2', text: 'Building B (без детей)', parentId: null, color: '#F9E2AE' },
  ];

  // Плоский ресурс — регрессия «как было до фичи».
  const flat = [
    { id: 1, text: 'Samantha Bright', color: '#A7E3A5' },
    { id: 2, text: 'John Heart', color: '#F9E2AE' },
    { id: 3, text: 'Todd Hoffman', color: '#F1BBBC' },
  ];

  const priorities = [
    { id: 'low', text: 'Low', color: '#CFE4FA' },
    { id: 'high', text: 'High', color: '#F1BBBC' },
  ];

  // Длинные подписи — для проверки обрезки текста и подсказки.
  const treeLongNames = [
    { id: 'b1', text: 'Northern Business Center — Building Alpha', parentId: null },
    { id: 'f1', text: 'Third Floor, East Wing (renovated)', parentId: 'b1' },
    { id: 1, text: 'Conference Room 101 «Innovation Hub»', parentId: 'f1', color: '#A7E3A5' },
    { id: 2, text: 'Conference Room 102 «Collaboration Space»', parentId: 'f1', color: '#F9E2AE' },
    { id: 'b2', text: 'Southern Business Center — Building Beta', parentId: null },
    { id: 3, text: 'Executive Boardroom with Panoramic View', parentId: 'b2', color: '#F1BBBC' },
  ];

  // Глубина 4 — вне заявленного scope (макс. 3).
  const tree4 = [
    { id: 'c1', text: 'Campus', parentId: null },
    { id: 'b1', text: 'Building A', parentId: 'c1' },
    { id: 'f1', text: 'Floor 1', parentId: 'b1' },
    { id: 101, text: 'Room 101', parentId: 'f1', color: '#A7E3A5' },
    { id: 102, text: 'Room 102', parentId: 'f1', color: '#F9E2AE' },
    { id: 'f2', text: 'Floor 2', parentId: 'b1' },
    { id: 201, text: 'Room 201', parentId: 'f2', color: '#F1BBBC' },
    { id: 'b2', text: 'Building B', parentId: 'c1' },
    { id: 'f3', text: 'Floor 1', parentId: 'b2' },
    { id: 301, text: 'Room 301', parentId: 'f3', color: '#CFE4FA' },
  ];

  // Кривые данные — каждый ключ ломает дерево по-своему.
  const broken = {
    // parentId указывает на несуществующий id
    orphan: [
      { id: 'b1', text: 'Building A', parentId: null },
      { id: 101, text: 'Room 101', parentId: 'b1', color: '#A7E3A5' },
      { id: 102, text: 'Room 102 (сирота: parentId = ghost)', parentId: 'ghost', color: '#F9E2AE' },
    ],
    // цикл a → b → a
    cycle: [
      { id: 'a', text: 'Node A (parentId = b)', parentId: 'b', color: '#A7E3A5' },
      { id: 'b', text: 'Node B (parentId = a)', parentId: 'a', color: '#F9E2AE' },
      { id: 'c', text: 'Node C (нормальный)', parentId: null, color: '#F1BBBC' },
    ],
    // сам себе родитель
    selfParent: [
      { id: 'a', text: 'Node A (parentId = a)', parentId: 'a', color: '#A7E3A5' },
      { id: 'b', text: 'Node B', parentId: 'a', color: '#F9E2AE' },
    ],
    // дублирующиеся id
    duplicateIds: [
      { id: 'b1', text: 'Building A', parentId: null },
      { id: 101, text: 'Room 101 (первый)', parentId: 'b1', color: '#A7E3A5' },
      { id: 101, text: 'Room 101 (дубль id)', parentId: 'b1', color: '#F9E2AE' },
      { id: 102, text: 'Room 102', parentId: 'b1', color: '#F1BBBC' },
    ],
    // родитель без детей рядом с обычной веткой
    emptyParent: [
      { id: 'b1', text: 'Building A', parentId: null },
      { id: 101, text: 'Room 101', parentId: 'b1', color: '#A7E3A5' },
      { id: 'b2', text: 'Building B (пустой)', parentId: null },
      { id: 'b3', text: 'Building C (пустой)', parentId: null },
    ],
    // id-объекты (валидный, но редкий кейс)
    objectIds: [
      { id: { code: 'b1' }, text: 'Building A', parentId: null },
      { id: { code: 'r1' }, text: 'Room 101', parentId: { code: 'b1' }, color: '#A7E3A5' },
      { id: { code: 'r2' }, text: 'Room 102', parentId: { code: 'b1' }, color: '#F9E2AE' },
    ],
  };

  // Много листьев — для виртуальной прокрутки и «широкой» сетки.
  const treeWide = (() => {
    const items = [];
    const palette = ['#A7E3A5', '#F9E2AE', '#F1BBBC', '#CFE4FA'];

    for (let b = 1; b <= 3; b += 1) {
      items.push({ id: `b${b}`, text: `Building ${b}`, parentId: null });

      for (let f = 1; f <= 2; f += 1) {
        items.push({ id: `b${b}f${f}`, text: `Floor ${f}`, parentId: `b${b}` });

        for (let r = 1; r <= 3; r += 1) {
          items.push({
            id: b * 100 + f * 10 + r,
            text: `Room ${b}${f}${r}`,
            parentId: `b${b}f${f}`,
            color: palette[(b + f + r) % palette.length],
          });
        }
      }
    }

    return items;
  })();

  const childrenOf = (tree, id) => tree.filter((item) => String(item.parentId) === String(id));
  const leaves = (tree) => tree.filter((item) => childrenOf(tree, item.id).length === 0);
  const leafIds = (tree) => leaves(tree).map((item) => item.id);
  const pathOf = (tree, id) => {
    const parts = [];
    let node = tree.find((item) => String(item.id) === String(id));

    while (node) {
      parts.unshift(node.text);
      node = tree.find((item) => String(item.id) === String(node.parentId));
    }

    return parts.join(' / ');
  };

  const titles = [
    'Website Re-Design Plan', 'Book Flights to San Fran', 'Install New Router',
    'Approve Personal Computer Upgrade Plan', 'Final Budget Review', 'New Brochures',
    'Install New Database', 'Approve New Online Marketing Strategy', 'Customer Workshop',
    'Prepare 2026 Marketing Plan', 'Brochure Design Review', 'Upgrade Server Hardware',
  ];

  // Встречи для указанных id ресурса: по 2 на каждый id, по будням опорной недели.
  // Первая встреча каждой группы всегда на опорной дате (ср) — чтобы в дневных видах
  // в каждой группе было что смотреть.
  const appts = (field, ids, options) => {
    const o = options || {};
    const perId = o.perId || 2;
    const asArray = o.asArray !== false;
    const result = [];

    ids.forEach((id, index) => {
      for (let n = 0; n < perId; n += 1) {
        const day = n === 0 ? 2 : (index + n * 2) % 5;
        const hour = 9 + ((index * 3 + n * 2) % 7);
        const appointment = {
          text: titles[(index * 2 + n) % titles.length],
          startDate: at(day, hour, n % 2 ? 30 : 0),
          endDate: at(day, hour + 1, n % 2 ? 30 : 0),
        };

        appointment[field] = asArray ? [id] : id;
        result.push(appointment);
      }
    });

    return result;
  };

  // Базовые опции — всё, что не относится к сути сценария.
  const base = (options) => Object.assign({
    currentDate,
    height: 620,
    startDayHour: 8,
    endDayHour: 19,
    cellDuration: 30,
    showAllDayPanel: false,
    firstDayOfWeek: 1,
    editing: true,
  }, options);

  return {
    currentDate, at, base, appts, titles,
    tree2, tree3, treeMixed, treeSubset, treeLongNames, tree4, treeWide, flat, priorities, broken,
    childrenOf, leaves, leafIds, pathOf,
  };
}
