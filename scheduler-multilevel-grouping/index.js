const crossMode = window.DX_CROSS_MODE || 'perview';

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

const renderEmployeeTag = (data) => {
  const tag = document.createElement('div');

  tag.className = 'dx-tag-content';
  tag.style.backgroundColor = data.color ?? '';
  tag.style.borderColor = data.color ?? 'transparent';
  tag.textContent = data.text;

  const removeButton = document.createElement('div');

  removeButton.className = 'dx-tag-remove-button';
  tag.appendChild(removeButton);

  return tag;
};

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
      cellDuration: 60,
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
    crossScrollingEnabled: crossMode === 'on',
    showAllDayPanel: false,
    showCurrentTimeIndicator: false,
    height: 700,
    onOptionChanged(e) {
      if (crossMode === 'perview' && e.name === 'currentView') {
        e.component.option('crossScrollingEnabled', e.value === 'Horizontal Grouping');
      }
    },
    onAppointmentFormOpening(e) {
      const { form } = e;
      const items = form.option('items');

      if (findItem(items, (item) => item.name === 'roomGroup')) {
        return;
      }

      const appointment = e.appointmentData ?? {};
      const assigneeIds = appointment.assigneeId;
      const [assigneeId] = Array.isArray(assigneeIds) ? assigneeIds : [assigneeIds];
      const roomId = roomOf(assigneeId);
      const employee = findItem(items, (item) => item.name === 'assigneeIdGroup');

      const repeatValue = form.getEditor('repeatEditor')?.option('value');

      employee?.list.splice(employee.index, 0, createRoomGroup(form, roomId));
      hideLabels(items);

      const employeeEditor = findItem(items, (item) => item.dataField === 'assigneeId');

      if (employeeEditor) {
        employeeEditor.list[employeeEditor.index].validationRules = [
          { type: 'required', message: 'Employee is required' },
        ];
        employeeEditor.list[employeeEditor.index].editorOptions = {
          ...employeeEditor.list[employeeEditor.index].editorOptions,
          tagTemplate: renderEmployeeTag,
        };
      }

      const description = findItem(items, (item) => item.name === 'descriptionGroup');

      if (description) {
        description.list[description.index].visible = false;
      }
      form.option('items', items.slice());

      form.getEditor('repeatEditor')?.option('value', repeatValue);

      form.getEditor('assigneeId')?.option('dataSource', roomId ? employeesOf(roomId) : []);
    },
  });
});
