import '../js/__internal/integration/jquery';
import '../js/ui/scheduler';
import $ from 'jquery';
import { setupThemeSelector } from './themeSelector.ts';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();

const appointments = [
  {
    text: 'Team Standup',
    startDate: new Date(year, month, day, 9, 0),
    endDate: new Date(year, month, day, 9, 30),
  },
  {
    text: 'Design Review',
    startDate: new Date(year, month, day, 10, 0),
    endDate: new Date(year, month, day, 11, 30),
  },
  {
    text: 'Recurring Weekly',
    startDate: new Date(year, month, day, 14, 0),
    endDate: new Date(year, month, day, 15, 0),
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
  },
];

window.addEventListener('load', () =>
  setupThemeSelector('theme-selector')
    .catch((err) => console.error('Theme loading failed:', err))
    .then(() => {
      const scheduler = ($('#widget-container') as any).dxScheduler({
        dataSource: {
          store: {
            type: 'array',
            data: appointments,
          },
        },
        currentView: 'week',
        currentDate: now,
        startDayHour: 8,
        endDayHour: 20,
        height: 700,
        onAppointmentFormOpening(e: any) {
          updateLog(`Popup opened for: "${e.appointmentData?.text || 'New Appointment'}"`);
        },
        onAppointmentUpdating(e: any) {
          updateLog(`Updating: "${e.oldData?.text}"`);
        },
        onAppointmentUpdated(e: any) {
          updateLog(`Updated: "${e.appointmentData?.text}"`);
        },
        onAppointmentAdding(e: any) {
          updateLog(`Adding: "${e.appointmentData?.text || '(new)'}"`);
        },
        onAppointmentAdded(e: any) {
          updateLog(`Added: "${e.appointmentData?.text}"`);
        },
      }).dxScheduler('instance');

      (window as any).scheduler = scheduler;

      updateLog('Scheduler ready. Double-click a cell or appointment to open the popup.');
    }));

function updateLog(message: string) {
  const log = document.getElementById('event-log');
  if (!log) return;
  const time = new Date().toLocaleTimeString();
  log.textContent = `[${time}] ${message}\n${log.textContent}`;
}
