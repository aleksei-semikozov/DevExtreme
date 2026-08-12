window.DEMO_CODE = `const rooms = [
  { id: 'board', text: 'Board rooms', active: true },
  { id: 12, text: 'Room 12 (архивная)', parentId: 'board', active: false },
  { id: 11, text: 'Room 11', parentId: 'board', active: true },
  { id: 21, text: 'Room 21', active: true },
];

const appointment = {
  text: 'Meeting',
  ownerId: 1,
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
      label: 'Room',
      dataSource: {
        store: rooms,
        filter: ['active', '=', true],
        sort: 'text',
        paginate: false,
      },
    },
  ],
  onContentReady(e) {
    if (opened) return;
    opened = true;
    setTimeout(() => e.component.showAppointmentPopup(appointment));
  },
});`;
