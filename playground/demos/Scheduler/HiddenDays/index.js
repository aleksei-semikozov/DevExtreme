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
    .hidden-days-toast.dx-toast-custom {
      background-color: #ffffff;
      color: #242424;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
    }
    .hidden-days-toast .dx-toast-content {
      padding: 18px 22px;
    }
    .hidden-days-toast .dx-toast-icon { display: none; }
    .hidden-days-toast .dx-toast-message { padding-left: 0; }
    .hidden-days-toast-body {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .hidden-days-toast-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background-color: #c50f1f;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }
    .hidden-days-toast-text {
      color: #242424;
      font-size: 15px;
      line-height: 1.45;
    }
  `).appendTo('head');

  function showAllHiddenToast() {
    DevExpress.ui.notify(
      {
        message: '',
        type: 'custom',
        displayTime: 4000,
        width: 480,
        shading: false,
        contentTemplate(container) {
          const $body = $('<div class="hidden-days-toast-body">');
          $('<span class="hidden-days-toast-icon">!</span>').appendTo($body);
          $('<div class="hidden-days-toast-text">').text(
            'The hiddenWeekDays option cannot hide all days of the week. At least one day must remain visible.',
          ).appendTo($body);
          $(container).append($body);
        },
        animation: {
          show: { type: 'fade', duration: 200, from: 0, to: 1 },
          hide: { type: 'fade', duration: 200, from: 1, to: 0 },
        },
        wrapperAttr: { class: 'hidden-days-toast' },
      },
      { my: 'bottom', at: 'bottom', of: '#scheduler', offset: '0 -24' },
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

  const $container = $('#day-checkboxes');
  dayLabels.forEach((label, idx) => {
    const $cb = $('<div class="option"></div>').appendTo($container);
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
