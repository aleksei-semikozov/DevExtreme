$(() => {
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultVisible = [0, 1, 2, 3, 4, 5, 6];
  const visibleSet = new Set(defaultVisible);
  const VALIDATION_MESSAGE = 'The hiddenWeekDays option cannot hide all days of the week. At least one day must remain visible.';

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

  const checkboxInstances = [];
  let suppressCheckboxHandler = false;

  function syncVisibleSetToCheckboxes() {
    suppressCheckboxHandler = true;
    checkboxInstances.forEach((cb, idx) => cb.option('value', visibleSet.has(idx)));
    suppressCheckboxHandler = false;
  }

  function refreshValidity() {
    const isInvalid = visibleSet.size === 0;
    $('.hidden-days-demo').toggleClass('is-invalid', isInvalid);
    return !isInvalid;
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
    onOptionChanged(e) {
      if (e.name === 'currentView' && e.value === 'workWeek') {
        visibleSet.clear();
        [1, 2, 3, 4, 5].forEach((d) => visibleSet.add(d));
        syncVisibleSetToCheckboxes();
        refreshValidity();
        scheduler.option('views', buildViews(computeHiddenWeekDays()));
      }
    },
  }).dxScheduler('instance');

  const $optionsPanel = $('.options');
  dayLabels.forEach((label, idx) => {
    const $cb = $('<div class="option"></div>').appendTo($optionsPanel);
    const cbInstance = $cb.dxCheckBox({
      text: label,
      value: visibleSet.has(idx),
      onValueChanged(e) {
        if (suppressCheckboxHandler) {
          return;
        }
        if (e.value) {
          visibleSet.add(idx);
        } else {
          visibleSet.delete(idx);
        }
        refreshValidity();
        scheduler.option('views', buildViews(computeHiddenWeekDays()));
      },
    }).dxCheckBox('instance');
    checkboxInstances.push(cbInstance);
  });

  $('<div class="validation-message"></div>').text(VALIDATION_MESSAGE).appendTo($optionsPanel);
  refreshValidity();
});
