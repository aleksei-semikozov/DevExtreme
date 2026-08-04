const roomsById = {};
rooms.forEach((room) => { roomsById[room.id] = room; });

const parentPath = (room) => {
  const path = [];
  let parent = roomsById[room.parentId];

  while (parent) {
    path.unshift(parent.text);
    parent = roomsById[parent.parentId];
  }

  return path.join(' / ');
};

const bookableRooms = rooms
  .filter((room) => !rooms.some((item) => item.parentId === room.id))
  .map((room) => ({ ...room, group: parentPath(room) }));

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
      e.form.getEditor('roomId')?.option({
        dataSource: new DevExpress.data.DataSource({
          store: bookableRooms,
          key: 'id',
          group: 'group',
        }),
        grouped: true,
      });
    },
  });
});
