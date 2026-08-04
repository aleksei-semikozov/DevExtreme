const rooms = assignees.filter((item) => item.parentId === null);

const employeesOf = (roomId) => assignees.filter((item) => item.parentId === roomId);

const roomOf = (assigneeId) => {
  const employee = assignees.find((item) => item.id === assigneeId);

  return employee ? employee.parentId : null;
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

const createRoomItem = (form, roomId) => ({
  itemType: 'simple',
  name: 'roomEditor',
  label: { text: 'Room' },
  colSpan: 1,
  editorType: 'dxSelectBox',
  editorOptions: {
    dataSource: rooms,
    displayExpr: 'text',
    valueExpr: 'id',
    value: roomId,
    onValueChanged(e) {
      const editor = form.getEditor('assigneeId');

      editor?.option('dataSource', employeesOf(e.value));
      editor?.option('value', []);
    },
  },
});

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
    currentDate: new Date(2026, 6, 13),
    startDayHour: 9,
    endDayHour: 16,
    groups: ['assigneeId'],
    resources: [
      {
        fieldExpr: 'assigneeId',
        dataSource: assignees,
        parentIdExpr: 'parentId',
        label: 'Employee',
        allowMultiple: true,
        icon: 'user',
      },
    ],
    crossScrollingEnabled: true,
    showAllDayPanel: false,
    showCurrentTimeIndicator: false,
    height: 730,
    onAppointmentFormOpening(e) {
      const { form } = e;
      const items = form.option('items');

      if (findItem(items, (item) => item.name === 'roomEditor')) {
        return;
      }

      const appointment = e.appointmentData ?? {};
      const [assigneeId] = appointment.assigneeId ?? [];
      const roomId = roomOf(assigneeId);
      const employee = findItem(items, (item) => item.dataField === 'assigneeId');

      // The Repeat editor keeps its value outside of formData, so rebuilding
      // the item list below would reset it and rewrite the recurrence rule.
      const repeatValue = form.getEditor('repeatEditor')?.option('value');

      employee.list.splice(employee.index, 0, createRoomItem(form, roomId));
      form.option('items', items.slice());

      form.getEditor('repeatEditor')?.option('value', repeatValue);

      form.getEditor('assigneeId')?.option('dataSource', roomId ? employeesOf(roomId) : []);
    },
  });
});
