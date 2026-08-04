const roomsById = {};
rooms.forEach((room) => { roomsById[room.id] = room; });

const childrenOf = (parentId) => rooms.filter((room) => room.parentId === parentId);

const ancestorsOf = (id) => {
  const chain = [];
  let current = roomsById[id];

  while (current) {
    chain.unshift(current);
    current = roomsById[current.parentId];
  }

  return chain;
};

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

const createCascadeItems = (form, appointmentData) => {
  const chain = ancestorsOf(appointmentData.roomId);
  const buildingId = chain.length ? chain[0].id : null;
  const floorId = chain.length > 1 ? chain[1].id : null;

  const setRooms = (parentId) => {
    form.getEditor('roomId').option({
      dataSource: parentId ? childrenOf(parentId) : [],
      value: null,
    });
  };

  return [
    {
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
          form.getEditor('floorEditor').option({
            dataSource: childrenOf(e.value),
            value: null,
          });
          setRooms(null);
        },
      },
    },
    {
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
          setRooms(e.value);
        },
      },
    },
  ];
};

$(() => {
  $('#scheduler').dxScheduler({
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
      const { form } = e;
      const items = form.option('items');

      if (findItem(items, (item) => item.name === 'buildingEditor')) {
        return;
      }

      const room = findItem(items, (item) => item.dataField === 'roomId');
      room.list.splice(room.index, 0, ...createCascadeItems(form, e.appointmentData));
      form.option('items', items.slice());

      // Rebuilding the item list recreates the Repeat editor, whose value is
      // kept outside of formData and is therefore lost.
      form.getEditor('repeatEditor')?.option('value', e.appointmentData.recurrenceRule ? 'custom' : 'never');

      const chain = ancestorsOf(e.appointmentData.roomId);
      form.getEditor('roomId').option('dataSource', chain.length > 1 ? childrenOf(chain[1].id) : []);
    },
  });
});
