$(() => {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const scheduler = $('#scheduler').dxScheduler({
    dataSource: appointments,
    views: ['week', 'month'],
    currentView: 'week',
    currentDate: new Date(2024, 0, 10),
    startDayHour: 8,
    endDayHour: 19,
    height: 600,
    hiddenDays: [],
  }).dxScheduler('instance');

  $('#day-picker').dxButtonGroup({
    items: dayLabels.map((label, idx) => ({ text: label, value: idx })),
    keyExpr: 'value',
    selectionMode: 'multiple',
    selectedItemKeys: allDays.slice(),
    onSelectionChanged(e) {
      const selected = e.component.option('selectedItemKeys');
      const hidden = allDays.filter((d) => !selected.includes(d));
      scheduler.option('hiddenDays', hidden);
    },
  });
});
