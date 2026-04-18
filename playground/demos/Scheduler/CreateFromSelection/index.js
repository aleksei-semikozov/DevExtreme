$(() => {
  console.log('CreateFromSelection demo v2.0.0');
  let selectionData = null;
  let $overlay = null;

  function showSelectionOverlay($cells) {
    removeOverlay();
    if (!$cells.length) return;

    const rects = [];
    $cells.each(function () {
      rects.push(this.getBoundingClientRect());
    });

    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.width));
    const maxY = Math.max(...rects.map((r) => r.y + r.height));

    $overlay = $('<div>').css({
      position: 'fixed',
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${maxX - minX}px`,
      height: `${maxY - minY}px`,
      backgroundColor: 'rgba(0, 120, 215, 0.2)',
      borderRadius: '2px',
      pointerEvents: 'none',
      zIndex: 100,
    }).appendTo('body');
  }

  function removeOverlay() {
    if ($overlay) {
      $overlay.remove();
      $overlay = null;
    }
  }

  const tooltip = $('#creation-tooltip').dxTooltip({
    width: 260,
    height: 'auto',
    shading: false,
    position: 'right',
    hideOnOutsideClick: true,
    hideOnParentScroll: false,
    contentTemplate() {
      const $content = $('<div>').addClass('popover-content');

      $('<div id="appointment-subject">').appendTo($content);

      const $buttons = $('<div>').addClass('popover-buttons');
      $('<div id="create-btn">').appendTo($buttons);
      $('<div id="cancel-btn">').appendTo($buttons);
      $buttons.appendTo($content);

      return $content;
    },
    onShown() {
      $('#appointment-subject').dxTextBox({
        placeholder: 'Enter appointment name',
        stylingMode: 'outlined',
      }).dxTextBox('instance').focus();

      $('#create-btn').dxButton({
        text: 'Create',
        type: 'default',
        onClick() {
          if (!selectionData) return;

          const subject = $('#appointment-subject').dxTextBox('instance').option('value');
          if (!subject) return;

          scheduler.addAppointment({
            text: subject,
            startDate: selectionData.startDate,
            endDate: selectionData.endDate,
            ...selectionData.groups,
          });

          tooltip.hide();
        },
      });

      $('#cancel-btn').dxButton({
        text: 'Cancel',
        onClick() {
          tooltip.hide();
        },
      });
    },
    onHidden() {
      removeOverlay();
      const subjectBox = $('#appointment-subject').data('dxTextBox');
      if (subjectBox) {
        subjectBox.option('value', '');
      }
    },
  }).dxTooltip('instance');

  const scheduler = $('#scheduler').dxScheduler({
    timeZone: 'America/Los_Angeles',
    dataSource: data,
    views: [{
      type: 'workWeek',
      groupOrientation: 'horizontal',
      cellDuration: 30,
    }],
    currentView: 'workWeek',
    currentDate: new Date(2021, 3, 21),
    startDayHour: 9,
    endDayHour: 16,
    groups: ['priorityId'],
    resources: [{
      fieldExpr: 'priorityId',
      allowMultiple: false,
      dataSource: priorityData,
      label: 'Priority',
    }],
    showCurrentTimeIndicator: false,
    allDayPanelMode: 'allDay',
    onSelectionEnd(e) {
      const cells = e.selectedCellData;
      if (cells.length <= 1) {
        return;
      }

      const startDate = cells[0].startDateUTC || cells[0].startDate;
      const endDate = cells[cells.length - 1].endDateUTC || cells[cells.length - 1].endDate;

      selectionData = {
        startDate,
        endDate,
        groups: cells[0].groups || {},
      };

      const $focused = e.component.$element().find('.dx-scheduler-date-table-cell.dx-state-focused');
      showSelectionOverlay($focused);

      setTimeout(() => {
        if ($overlay) {
          tooltip.option('target', $overlay);
          tooltip.show();
        }
      }, 50);
    },
  }).dxScheduler('instance');
});
