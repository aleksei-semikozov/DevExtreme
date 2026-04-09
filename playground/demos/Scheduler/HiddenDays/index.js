$(() => {
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultVisible = [0, 1, 2, 4, 6];
  const visibleSet = new Set(defaultVisible);

  function computeHiddenWeekDays() {
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !visibleSet.has(d));
  }

  function buildViews(hidden) {
    return [
      { type: 'week', hiddenWeekDays: hidden },
      { type: 'workWeek', hiddenWeekDays: hidden },
      { type: 'month', hiddenWeekDays: hidden },
      { type: 'timelineWeek', hiddenWeekDays: hidden },
      { type: 'agenda', hiddenWeekDays: hidden },
    ];
  }

  function showAllHiddenToast() {
    DevExpress.ui.notify(
      {
        message: 'The hiddenWeekDays option cannot hide all days of the week. At least one day must remain visible.',
        type: 'warning',
        displayTime: 4000,
        position: { my: 'bottom', at: 'bottom', of: '#scheduler', offset: '0 -24' },
      },
    );
  }

  const scheduler = $('#scheduler').dxScheduler({
    timeZone: 'America/Los_Angeles',
    dataSource: data,
    views: buildViews(computeHiddenWeekDays()),
    currentView: 'week',
    currentDate: new Date(2021, 3, 26),
    startDayHour: 9,
    height: 730,
    editing: {
      allowAdding: true,
      allowDeleting: true,
      allowUpdating: true,
      allowResizing: true,
      allowDragging: true,
    },
  }).dxScheduler('instance');

  const $optionsPanel = $('.options');
  dayLabels.forEach((label, idx) => {
    const $cb = $('<div class="option"></div>').appendTo($optionsPanel);
    $cb.dxCheckBox({
      text: label,
      value: visibleSet.has(idx),
      onValueChanged(e) {
        if (e.value) {
          visibleSet.add(idx);
        } else {
          visibleSet.delete(idx);
        }
        const hidden = computeHiddenWeekDays();
        if (hidden.length === 7) {
          showAllHiddenToast();
        }
        scheduler.option('views', buildViews(hidden));
      },
    });
  });
});
