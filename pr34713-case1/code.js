window.DEMO_CODE = {};

window.DEMO_CODE.fail = `const rooms = [
  { id: 'board', text: 'Board rooms' },
  { id: 11, text: 'Room 11', parentId: 'board' },
  { id: 12, text: 'Room 12', parentId: 'board' },
];

const appointment = {
  text: 'Meeting',
  ownerId: 1,
  roomId: 'board',
  startDate: new Date(2026, 7, 12, 10, 0),
  endDate: new Date(2026, 7, 12, 12, 0),
};

let opened = false;

$('#scheduler').dxScheduler({
  views: ['day'],
  currentView: 'day',
  currentDate: new Date(2026, 7, 12),
  startDayHour: 9,
  endDayHour: 14,
  showAllDayPanel: false,
  showCurrentTimeIndicator: false,
  height: 400,
  dataSource: [appointment],
  groups: ['ownerId'],
  resources: [
    {
      fieldExpr: 'ownerId',
      dataSource: [{ id: 1, text: 'Samantha Bright' }],
      label: 'Owner',
    },
    {
      fieldExpr: 'roomId',
      parentIdExpr: 'parentId',
      dataSource: rooms,
      label: 'Room',
    },
  ],
  onContentReady(e) {
    if (opened) return;
    opened = true;
    setTimeout(() => e.component.showAppointmentPopup(appointment));
  },
});`;

window.DEMO_CODE.pass = window.DEMO_CODE.fail.replace(
  "  roomId: 'board',",
  '  roomId: 11,',
);
