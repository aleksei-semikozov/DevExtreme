import React from 'react';

import Scheduler, { View } from 'devextreme-react/scheduler';
import type { SchedulerTypes } from 'devextreme-react/scheduler';
import { appointments, assignees } from './data.ts';

const currentDate = new Date(2026, 6, 13);

const groups = ['assigneeId'];

const resources = [
  {
    fieldExpr: 'assigneeId',
    dataSource: assignees,
    parentIdExpr: 'parentId',
    label: 'Employee',
    allowMultiple: true,
    icon: 'user',
  },
];

type Form = SchedulerTypes.AppointmentFormOpeningEvent['form'];
type FormItem = {
  name?: string;
  dataField?: string;
  items?: FormItem[];
  [key: string]: unknown;
};
type FoundItem = { list: FormItem[]; index: number } | null;

const rooms = assignees.filter((item) => item.parentId === null);

const employeesOf = (roomId: string | null) => assignees
  .filter((item) => item.parentId === roomId);

const roomOf = (assigneeId: number | undefined): string | null => assignees
  .find((item) => item.id === assigneeId)?.parentId ?? null;

const findItem = (items: FormItem[], predicate: (item: FormItem) => boolean): FoundItem => {
  for (let i = 0; i < items.length; i += 1) {
    if (predicate(items[i])) {
      return { list: items, index: i };
    }

    const nested = items[i].items;

    if (nested) {
      const found = findItem(nested, predicate);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

const createRoomGroup = (form: Form, roomId: string | null): FormItem => ({
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
      template: () => '<div class="dx-icon dx-icon-conferenceroomoutline"></div>',
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
        onValueChanged(e: { value: string }) {
          const editor = form.getEditor('assigneeId');

          editor?.option('dataSource', employeesOf(e.value));
          editor?.option('value', []);
        },
      },
    },
  ],
});

const renderEmployeeTag = (data: { text: string; color?: string }) => {
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

const hideLabels = (items: FormItem[]) => {
  items.forEach((item) => {
    if (item.items) {
      hideLabels(item.items);
    } else if (item.dataField !== 'allDay') {
      item.label = { ...(item.label as object), visible: false };
    }
  });
};

const onAppointmentFormOpening = (e: SchedulerTypes.AppointmentFormOpeningEvent) => {
  const { form } = e;
  const items = form.option('items') as FormItem[];

  if (findItem(items, (item) => item.name === 'roomGroup')) {
    return;
  }

  const appointment = e.appointmentData ?? {};
  const assigneeIds = appointment.assigneeId as number | number[] | undefined;
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
      ...(employeeEditor.list[employeeEditor.index].editorOptions as object),
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
};

const App = () => (
  <Scheduler
    dataSource={appointments}
    groups={groups}
    resources={resources}
    defaultCurrentView="Vertical Grouping"
    defaultCurrentDate={currentDate}
    startDayHour={9}
    endDayHour={16}
    crossScrollingEnabled={true}
    showAllDayPanel={false}
    showCurrentTimeIndicator={false}
    height={700}
    onAppointmentFormOpening={onAppointmentFormOpening}
  >
    <View
      name="Vertical Grouping"
      type="workWeek"
      groupOrientation="vertical"
    />
    <View
      name="Horizontal Grouping"
      type="workWeek"
      groupOrientation="horizontal"
    />
  </Scheduler>
);

export default App;
