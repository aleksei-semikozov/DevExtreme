import { bootstrapApplication } from '@angular/platform-browser';
import { Component, enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxSchedulerModule } from 'devextreme-angular';
import { DxSchedulerTypes } from 'devextreme-angular/ui/scheduler';
import {
  Appointment, Assignee, Resource, Service,
} from './app.service';

type Form = DxSchedulerTypes.AppointmentFormOpeningEvent['form'];
type FormItem = {
  name?: string;
  dataField?: string;
  items?: FormItem[];
  [key: string]: unknown;
};
type FoundItem = { list: FormItem[]; index: number } | null;

if (!/localhost/.test(document.location.host)) {
  enableProdMode();
}

let modulePrefix = '';
// @ts-ignore
if (window && window.config?.packageConfigPaths) {
  modulePrefix = '/app';
}

@Component({
  selector: 'demo-app',
  templateUrl: `.${modulePrefix}/app.component.html`,
  styleUrls: [`.${modulePrefix}/app.component.css`],
  providers: [Service],
  imports: [
    CommonModule,
    DxSchedulerModule,
  ],
})
export class AppComponent {
  appointments: Appointment[];

  assignees: Assignee[];

  resources: Resource[];

  rooms: Assignee[];

  groups: string[] = ['assigneeId'];

  currentDate: Date = new Date(2026, 6, 13);

  constructor(service: Service) {
    this.appointments = service.getAppointments();
    this.assignees = service.getAssignees();
    this.resources = service.getResources();
    this.rooms = this.assignees.filter((item) => item.parentId === null);
  }

  employeesOf(roomId: string | null): Assignee[] {
    return this.assignees.filter((item) => item.parentId === roomId);
  }

  roomOf(assigneeId: number | undefined): string | null {
    return this.assignees.find((item) => item.id === assigneeId)?.parentId ?? null;
  }

  findItem(items: FormItem[], predicate: (item: FormItem) => boolean): FoundItem {
    for (let i = 0; i < items.length; i += 1) {
      if (predicate(items[i])) {
        return { list: items, index: i };
      }

      const nested = items[i].items;

      if (nested) {
        const found = this.findItem(nested, predicate);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  createRoomGroup(form: Form, roomId: string | null): FormItem {
    return {
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
            dataSource: this.rooms,
            displayExpr: 'shortText',
            valueExpr: 'id',
            value: roomId,
            placeholder: 'Room',
            stylingMode: form.getEditor('assigneeId')?.option('stylingMode'),
            onValueChanged: (e) => {
              const editor = form.getEditor('assigneeId');

              editor?.option('dataSource', this.employeesOf(e.value));
              editor?.option('value', []);
            },
          },
        },
      ],
    };
  }

  renderEmployeeTag(data: { text: string; color?: string }) {
    const tag = document.createElement('div');

    tag.className = 'dx-tag-content';
    tag.style.backgroundColor = data.color ?? '';
    tag.style.borderColor = data.color ?? 'transparent';
    tag.textContent = data.text;

    const removeButton = document.createElement('div');

    removeButton.className = 'dx-tag-remove-button';
    tag.appendChild(removeButton);

    return tag;
  }

  hideLabels(items: FormItem[]) {
    items.forEach((item) => {
      if (item.items) {
        this.hideLabels(item.items);
      } else if (item.dataField !== 'allDay') {
        item.label = { ...(item.label as object), visible: false };
      }
    });
  }

  onAppointmentFormOpening(e: DxSchedulerTypes.AppointmentFormOpeningEvent) {
    const { form } = e;
    const items = form.option('items') as FormItem[];

    if (this.findItem(items, (item) => item.name === 'roomGroup')) {
      return;
    }

    const appointment = e.appointmentData ?? {};
    const assigneeIds = appointment.assigneeId as number | number[] | undefined;
    const [assigneeId] = Array.isArray(assigneeIds) ? assigneeIds : [assigneeIds];
    const roomId = this.roomOf(assigneeId);
    const employee = this.findItem(items, (item) => item.name === 'assigneeIdGroup');

    const repeatValue = form.getEditor('repeatEditor')?.option('value');

    employee?.list.splice(employee.index, 0, this.createRoomGroup(form, roomId));
    this.hideLabels(items);

    const employeeEditor = this.findItem(items, (item) => item.dataField === 'assigneeId');

    if (employeeEditor) {
      employeeEditor.list[employeeEditor.index].validationRules = [
        { type: 'required', message: 'Employee is required' },
      ];
      employeeEditor.list[employeeEditor.index].editorOptions = {
        ...(employeeEditor.list[employeeEditor.index].editorOptions as object),
        tagTemplate: this.renderEmployeeTag,
      };
    }

    const description = this.findItem(items, (item) => item.name === 'descriptionGroup');

    if (description) {
      description.list[description.index].visible = false;
    }
    form.option('items', items.slice());

    form.getEditor('repeatEditor')?.option('value', repeatValue);

    form.getEditor('assigneeId')?.option('dataSource', roomId ? this.employeesOf(roomId) : []);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
  ],
});
