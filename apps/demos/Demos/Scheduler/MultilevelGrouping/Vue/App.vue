<template>
  <DxScheduler
    :data-source="appointments"
    :groups="groups"
    :resources="resources"
    :current-date="currentDate"
    :start-day-hour="9"
    :end-day-hour="16"
    :cross-scrolling-enabled="true"
    :show-all-day-panel="false"
    :show-current-time-indicator="false"
    :height="700"
    :on-appointment-form-opening="onAppointmentFormOpening"
    current-view="Vertical Grouping"
  >
    <DxView
      type="workWeek"
      name="Vertical Grouping"
      group-orientation="vertical"
    />
    <DxView
      type="workWeek"
      name="Horizontal Grouping"
      group-orientation="horizontal"
    />
  </DxScheduler>
</template>
<script setup lang="ts">
import { DxScheduler, DxView, type DxSchedulerTypes } from 'devextreme-vue/scheduler';
import { appointments, assignees } from './data.ts';

const groups = ['assigneeId'];
const currentDate = new Date(2026, 6, 13);

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

type Form = DxSchedulerTypes.AppointmentFormOpeningEvent['form'];
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

function onAppointmentFormOpening(e: DxSchedulerTypes.AppointmentFormOpeningEvent) {
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
}
</script>

<style>
.dx-scheduler-cell-sizes-horizontal {
  width: 100px;
}

.dx-scheduler-group-header {
  min-width: 120px;
}

.dx-scheduler-group-header,
.dx-scheduler-header-panel-empty-cell,
.dx-scheduler-work-space-vertical-group-table,
.dx-scheduler-work-space-vertical-grouped .dx-scheduler-time-panel-cell,
.dx-scheduler-work-space-grouped:not(.dx-scheduler-work-space-vertical-grouped)
  .dx-scheduler-header-panel-cell {
  background-color: var(--dx-color-main-bg);
}

.dx-scheduler-group-header,
.dx-scheduler-group-header .dx-scheduler-group-header-content {
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}
</style>
