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

  $('<style>').text(`
    .scheduler-container { position: relative; }
    .all-hidden-toast {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 22px;
      max-width: 460px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
      z-index: 1000;
    }
    .all-hidden-toast-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #c50f1f;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }
    .all-hidden-toast-text {
      color: #242424;
      font-size: 15px;
      line-height: 1.45;
    }
  `).appendTo('head');

  function showAllHiddenToast() {
    $('.scheduler-container .all-hidden-toast').remove();
    const $toast = $(
      '<div class="all-hidden-toast">'
      + '<span class="all-hidden-toast-icon">!</span>'
      + '<div class="all-hidden-toast-text"></div>'
      + '</div>',
    );
    $toast.find('.all-hidden-toast-text').text(
      'The hiddenWeekDays option cannot hide all days of the week. At least one day must remain visible.',
    );
    $toast.appendTo('.scheduler-container');
    setTimeout(() => $toast.fadeOut(200, () => $toast.remove()), 4000);
  }

  const checkboxInstances = [];
  let suppressCheckboxHandler = false;

  function syncVisibleSetToCheckboxes() {
    suppressCheckboxHandler = true;
    checkboxInstances.forEach((cb, idx) => cb.option('value', visibleSet.has(idx)));
    suppressCheckboxHandler = false;
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
        const hidden = computeHiddenWeekDays();
        if (hidden.length === 7) {
          showAllHiddenToast();
        }
        scheduler.option('views', buildViews(hidden));
      },
    }).dxCheckBox('instance');
    checkboxInstances.push(cbInstance);
  });
});
