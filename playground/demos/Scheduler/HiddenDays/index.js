$(() => {
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultVisible = [0, 1, 2, 4, 6];

  const visibleSet = new Set(defaultVisible);

  function computeHiddenWeekDays() {
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !visibleSet.has(d));
  }

  const scheduler = $('#scheduler').dxScheduler({
    timeZone: 'America/Los_Angeles',
    dataSource: data,
    views: ['week', 'workWeek', 'month', 'timelineWeek', 'agenda'],
    currentView: 'week',
    currentDate: new Date(2021, 3, 29),
    startDayHour: 9,
    height: 730,
    hiddenWeekDays: computeHiddenWeekDays(),
    editing: {
      allowAdding: true,
      allowDeleting: true,
      allowUpdating: true,
      allowResizing: true,
      allowDragging: true,
    },
    onOptionChanged(e) {
      if (e.name === 'currentView') {
        updateWeekendCheckboxVisibility(e.value);
      }
    },
  }).dxScheduler('instance');

  const checkBoxInstances = {};

  dayLabels.forEach((label, idx) => {
    checkBoxInstances[idx] = $(`#day-${idx}`).dxCheckBox({
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
          DevExpress.ui.dialog.alert(
            'All days are hidden. The Scheduler requires at least one visible day. The option is ignored and all days are shown.',
            'Visible Week Days',
          );
        }
        scheduler.option('hiddenWeekDays', hidden);
      },
    }).dxCheckBox('instance');
  });

  function updateWeekendCheckboxVisibility(currentView) {
    const isWorkWeek = currentView === 'workWeek';
    $('#day-0').toggle(!isWorkWeek);
    $('#day-6').toggle(!isWorkWeek);
  }

  updateWeekendCheckboxVisibility(scheduler.option('currentView'));
});
