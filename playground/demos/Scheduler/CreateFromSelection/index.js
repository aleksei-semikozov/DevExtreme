$(() => {
  let selectionData = null;
  let lastSelectedCellRects = [];

  function clearSelectedCells(schedulerElement) {
    schedulerElement
      .find('.selection-highlighted')
      .removeClass('selection-highlighted');
    schedulerElement.removeClass('selection-active');
  }

  function highlightCellsByRects(schedulerElement, rects) {
    clearSelectedCells(schedulerElement);
    if (!rects.length) return;

    const allCells = schedulerElement.find('.dx-scheduler-date-table-cell');

    allCells.each(function () {
      const rect = this.getBoundingClientRect();
      for (const saved of rects) {
        if (Math.abs(rect.x - saved.x) < 2
          && Math.abs(rect.y - saved.y) < 2
          && Math.abs(rect.width - saved.width) < 2) {
          $(this).addClass('selection-highlighted');
          break;
        }
      }
    });

    schedulerElement.addClass('selection-active');
  }

  function getMiddleHighlighted(schedulerElement) {
    const highlighted = schedulerElement.find('.selection-highlighted');
    if (!highlighted.length) return null;
    return highlighted.eq(Math.floor(highlighted.length / 2));
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
      clearSelectedCells($('#scheduler'));
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
        console.log('onOptionChanged selectedCellData:', e.value.length, 'focused cells:', focused.length);
        if (focused.length > 0) {
          lastSelectedCellRects = [];
          focused.each(function () {
            lastSelectedCellRects.push(this.getBoundingClientRect());
          });
          console.log('Saved rects:', lastSelectedCellRects.length, JSON.stringify(lastSelectedCellRects[0]));
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

      const $schedulerElement = e.component.$element();

      setTimeout(() => {
        console.log('Highlighting with rects:', lastSelectedCellRects.length);
        highlightCellsByRects($schedulerElement, lastSelectedCellRects);

        const middleCell = getMiddleHighlighted($schedulerElement);
        if (middleCell && middleCell.length) {
          popover.option('target', middleCell);
          popover.show();
        }
      }, 50);
    },
  }).dxScheduler('instance');
});
