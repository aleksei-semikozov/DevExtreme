$(() => {
  let selectionData = null;

  function getCellElements(schedulerElement, cellDataArray) {
    const allCells = schedulerElement.find('.dx-scheduler-date-table-cell');
    const result = [];

    cellDataArray.forEach((cellData) => {
      allCells.each(function () {
        const $cell = $(this);
        const data = scheduler.getWorkSpace
          ? null
          : scheduler.$element().dxScheduler('instance');

        if ($cell.data('dxCellData')) {
          const d = $cell.data('dxCellData');
          if (d.startDate?.getTime() === cellData.startDate?.getTime()
            && d.groupIndex === cellData.groupIndex) {
            result.push(this);
          }
        }
      });
    });

    return $(result);
  }

  function markCellsByData(schedulerElement, cellDataArray) {
    clearSelectedCells(schedulerElement);

    const rows = schedulerElement.find('.dx-scheduler-date-table-row');
    const allCells = schedulerElement.find('.dx-scheduler-date-table-cell');
    let found = 0;

    allCells.each(function () {
      const cellRect = this.getBoundingClientRect();
      const $cell = $(this);

      for (const cd of cellDataArray) {
        const cellEl = this;
        const cellData = $(cellEl).data('dxCellData');
        if (cellData
          && cellData.startDate?.getTime() === cd.startDate?.getTime()
          && cellData.groupIndex === cd.groupIndex) {
          $cell.addClass('selection-highlighted');
          found++;
          break;
        }
      }
    });

    if (found > 0) {
      schedulerElement.addClass('selection-active');
    }
    return found;
  }

  function clearSelectedCells(schedulerElement) {
    schedulerElement
      .find('.selection-highlighted')
      .removeClass('selection-highlighted');
    schedulerElement.removeClass('selection-active');
  }

  function getMiddleHighlighted(schedulerElement) {
    const highlighted = schedulerElement.find('.selection-highlighted');
    if (!highlighted.length) return null;
    const midIndex = Math.floor(highlighted.length / 2);
    return highlighted.eq(midIndex);
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
        const found = markCellsByData($schedulerElement, cells);

        const middleCell = getMiddleHighlighted($schedulerElement);
        if (middleCell && middleCell.length) {
          popover.option('target', middleCell);
          popover.show();
        }
      }, 50);
    },
  }).dxScheduler('instance');
});
