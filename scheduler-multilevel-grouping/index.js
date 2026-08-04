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

// The Scheduler renders resource editors as an icon plus an editor, without a
// text label. The room editor repeats that structure so both rows match.
const createRoomGroup = (form, roomId) => ({
  itemType: 'group',
  name: 'roomGroup',
  cssClass: 'dx-scheduler-form-group-with-icon',
  colCount: 2,
  colCountByScreen: { xs: 2 },
  items: [
    {
      colSpan: 1,
      name: 'roomIcon',
      cssClass: 'dx-scheduler-form-icon',
      template: () => $('<div>').addClass('dx-icon dx-icon-conferenceroomoutline'),
    },
    {
      itemType: 'simple',
      name: 'roomEditor',
      colSpan: 1,
      label: { visible: false },
      editorType: 'dxSelectBox',
      editorOptions: {
        dataSource: rooms,
        displayExpr: 'shortText',
        valueExpr: 'id',
        value: roomId,
        placeholder: 'Room',
        // Match the styling the Scheduler applies to its own editors.
        stylingMode: form.getEditor('assigneeId')?.option('stylingMode'),
        onValueChanged(e) {
          const editor = form.getEditor('assigneeId');

          editor?.option('dataSource', employeesOf(e.value));
          editor?.option('value', []);
        },
      },
    },
  ],
});

const hideLabels = (items) => {
  items.forEach((item) => {
    if (item.items) {
      hideLabels(item.items);
    } else if (item.dataField !== 'allDay') {
      item.label = { ...item.label, visible: false };
    }
  });
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

      if (findItem(items, (item) => item.name === 'roomGroup')) {
        return;
      }

      const appointment = e.appointmentData ?? {};
      // The Scheduler prefills the resource value from the clicked cell as a
      // scalar, while allowMultiple appointments store an array.
      const assigneeIds = appointment.assigneeId;
      const [assigneeId] = Array.isArray(assigneeIds) ? assigneeIds : [assigneeIds];
      const roomId = roomOf(assigneeId);
      const employee = findItem(items, (item) => item.name === 'assigneeIdGroup');

      // The Repeat editor keeps its value outside of formData, so rebuilding
      // the item list below would reset it and rewrite the recurrence rule.
      const repeatValue = form.getEditor('repeatEditor')?.option('value');

      employee.list.splice(employee.index, 0, createRoomGroup(form, roomId));
      hideLabels(items);

      const description = findItem(items, (item) => item.name === 'descriptionGroup');

      description.list[description.index].visible = false;
      form.option('items', items.slice());

      form.getEditor('repeatEditor')?.option('value', repeatValue);

      form.getEditor('assigneeId')?.option('dataSource', roomId ? employeesOf(roomId) : []);
    },
  });
});
