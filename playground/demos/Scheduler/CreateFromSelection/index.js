$(() => {
  let selectionData = null;
  let lastSelectedCellRects = [];
  let $overlay = null;

  function createOverlay(schedulerElement, rects) {
    removeOverlay();
    if (!rects.length) return;

    const containerRect = schedulerElement.find('.dx-scheduler-date-table')[0].getBoundingClientRect();

    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.width));
    const maxY = Math.max(...rects.map((r) => r.y + r.height));

    $overlay = $('<div>').css({
      position: 'fixed',
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
      backgroundColor: 'rgba(0, 120, 215, 0.2)',
      border: '1px solid rgba(0, 120, 215, 0.4)',
      borderRadius: '2px',
      pointerEvents: 'none',
      zIndex: 1,
    }).appendTo('body');
  }

  function removeOverlay() {
    if ($overlay) {
      $overlay.remove();
      $overlay = null;
    }
  }

  function getOverlayCenter() {
    if (!$overlay) return null;
    return $overlay;
  }

  const popover = $('#creation-popover').dxPopover({
    width: 280,
    showTitle: true,
    title: 'New Appointment',
    shading: false,
    position: 'right',
    hideOnOutsideClick: true,
    hideOnParentScroll: false,
    contentTemplate() {
      const $content = $('<div>').addClass('popover-content');

      $('<div>').addClass('dx-field').append(
        $('<div id="appointment-subject">'),
      ).appendTo($content);

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

          popover.hide();
        },
      });

      $('#cancel-btn').dxButton({
        text: 'Cancel',
        onClick() {
          popover.hide();
        },
      });
    },
    onHidden() {
      removeOverlay();
    },
  }).dxPopover('instance');

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
    showAllDayPanel: false,
    onOptionChanged(e) {
      if (e.name === 'selectedCellData' && e.value && e.value.length > 0) {
        const $el = e.component.$element();
        const focused = $el.find('.dx-scheduler-date-table-cell.dx-state-focused, .dx-scheduler-date-table-cell.dx-scheduler-focused-cell');
        if (focused.length > 0) {
          lastSelectedCellRects = [];
          focused.each(function () {
            lastSelectedCellRects.push(this.getBoundingClientRect());
          });
        }
      }
    },
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

      setTimeout(() => {
        createOverlay(e.component.$element(), lastSelectedCellRects);

        const target = getOverlayCenter();
        if (target) {
          popover.option('target', target);
          popover.show();
        }
      }, 50);
    },
  }).dxScheduler('instance');
});
