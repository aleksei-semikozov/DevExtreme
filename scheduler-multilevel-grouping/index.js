const byId = {};
rooms.forEach((room) => { byId[room.id] = room; });

const childrenOf = (parentId) => rooms.filter((room) => room.parentId === parentId);
const isLeaf = (room) => childrenOf(room.id).length === 0;
const leaves = rooms.filter(isLeaf);

const chainOf = (id) => {
  const chain = [];
  let current = byId[id];
  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId[current.parentId] : null;
  }
  return chain;
};

const pathOf = (room) => chainOf(room.id).map((item) => item.text).join(' / ');
const parentPathOf = (room) => chainOf(room.id).slice(0, -1).map((item) => item.text).join(' / ');

const findItem = (items, predicate) => {
  for (let i = 0; i < items.length; i += 1) {
    if (predicate(items[i])) {
      return { list: items, index: i };
    }
    if (items[i].items) {
      const found = findItem(items[i].items, predicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Вариант 1 — как сейчас в PR: один список, в каждом пункте полный путь.
const applyFullPath = (form) => {
  const editor = form.getEditor('roomId');
  editor.option({
    dataSource: leaves,
    displayExpr: pathOf,
  });
};

// Вариант 2 — один список, но сгруппированный: заголовок группы = путь до родителя.
const applyGrouped = (form) => {
  const editor = form.getEditor('roomId');
  editor.option({
    dataSource: new DevExpress.data.DataSource({
      store: leaves.map((room) => ({ ...room, group: parentPathOf(room) })),
      key: 'id',
      group: 'group',
    }),
    grouped: true,
    displayExpr: 'text',
  });
};

// Вариант 3 — каскад: Building → Floor → Room, каждый следующий фильтруется предыдущим.
const applyCascade = (form, appointmentData) => {
  const chain = appointmentData.roomId ? chainOf(appointmentData.roomId) : [];
  const buildingId = chain.length ? chain[0].id : null;
  const floorId = chain.length > 1 ? chain[1].id : null;

  const resetRooms = (parentId) => {
    const editor = form.getEditor('roomId');
    editor.option('dataSource', parentId ? childrenOf(parentId) : []);
    editor.option('value', null);
  };

  const buildingItem = {
    itemType: 'simple',
    name: 'buildingEditor',
    label: { text: 'Building' },
    colSpan: 1,
    editorType: 'dxSelectBox',
    editorOptions: {
      dataSource: childrenOf(null),
      displayExpr: 'text',
      valueExpr: 'id',
      value: buildingId,
      onValueChanged(e) {
        const floorEditor = form.getEditor('floorEditor');
        floorEditor.option('dataSource', childrenOf(e.value));
        floorEditor.option('value', null);
        resetRooms(null);
      },
    },
  };

  const floorItem = {
    itemType: 'simple',
    name: 'floorEditor',
    label: { text: 'Floor' },
    colSpan: 1,
    editorType: 'dxSelectBox',
    editorOptions: {
      dataSource: childrenOf(buildingId),
      displayExpr: 'text',
      valueExpr: 'id',
      value: floorId,
      onValueChanged(e) {
        resetRooms(e.value);
      },
    },
  };

  const items = form.option('items');
  const found = findItem(items, (item) => item.dataField === 'roomId');
  if (found && !findItem(items, (item) => item.name === 'buildingEditor')) {
    found.list.splice(found.index, 0, buildingItem, floorItem);
    form.option('items', items.slice());

    // пересборка items пересоздаёт редактор Repeat, а он хранит значение вне formData
    const repeatEditor = form.getEditor('repeatEditor');
    if (repeatEditor) {
      repeatEditor.option('value', appointmentData.recurrenceRule ? 'custom' : 'never');
    }
  }

  const editor = form.getEditor('roomId');
  editor.option({
    dataSource: floorId ? childrenOf(floorId) : [],
    displayExpr: 'text',
  });
};

$(() => {
  let variant = 'path';

  const scheduler = $('#scheduler').dxScheduler({
    dataSource: appointments,
    views: [{
      type: 'workWeek',
      name: 'Vertical Grouping',
      groupOrientation: 'vertical',
    }, {
      type: 'workWeek',
      name: 'Horizontal Grouping',
      groupOrientation: 'horizontal',
    }],
    currentView: 'Vertical Grouping',
    currentDate: new Date(2021, 3, 26),
    startDayHour: 9,
    endDayHour: 15,
    cellDuration: 60,
    groups: ['roomId'],
    resources: [
      {
        fieldExpr: 'roomId',
        dataSource: rooms,
        parentIdExpr: 'parentId',
        label: 'Room',
        allowMultiple: false,
      },
    ],
    crossScrollingEnabled: true,
    showAllDayPanel: false,
    showCurrentTimeIndicator: false,
    height: 730,
    onAppointmentFormOpening(e) {
      if (variant === 'path') {
        applyFullPath(e.form);
      } else if (variant === 'grouped') {
        applyGrouped(e.form);
      } else {
        applyCascade(e.form, e.appointmentData);
      }
    },
  }).dxScheduler('instance');

  $('#variant').dxSelectBox({
    dataSource: [
      { id: 'path', text: '1 — Полный путь в каждом пункте (как сейчас в PR)' },
      { id: 'grouped', text: '2 — Сгруппированный список (путь в заголовке группы)' },
      { id: 'cascade', text: '3 — Каскад: Building → Floor → Room' },
    ],
    displayExpr: 'text',
    valueExpr: 'id',
    value: 'path',
    width: 460,
    inputAttr: { 'aria-label': 'Вариант редактора комнаты' },
    onValueChanged(e) { variant = e.value; },
  });

  $('#open-popup').dxButton({
    text: 'Открыть попап встречи',
    type: 'default',
    onClick() {
      scheduler.showAppointmentPopup(appointments[0], false);
    },
  });
});
