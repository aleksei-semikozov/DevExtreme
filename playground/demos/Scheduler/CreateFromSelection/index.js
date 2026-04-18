$(() => {
  let selectionData = null;

  function markSelectedCells(schedulerElement) {
    schedulerElement
      .find('.dx-scheduler-date-table-cell.dx-state-focused, .dx-scheduler-date-table-cell.dx-scheduler-focused-cell')
      .addClass('dx-scheduler-selected-cell-data');
    schedulerElement.addClass('selection-active');
  }

  function clearSelectedCells(schedulerElement) {
    schedulerElement
      .find('.dx-scheduler-date-table-cell.dx-scheduler-selected-cell-data')
      .removeClass('dx-scheduler-selected-cell-data');
    schedulerElement.removeClass('selection-active');
  }

  const popover = $('#creation-popover').dxPopover({
    width: 280,
    showTitle: true,
    title: 'New Appointment',
    shading: false,
    position: 'right',
    hideOnOutsideClick: true,
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

      markSelectedCells($schedulerElement);

      const lastCell = $schedulerElement
        .find('.dx-scheduler-date-table-cell.dx-scheduler-selected-cell-data')
        .last();

      if (lastCell.length) {
        popover.option('target', lastCell);
        popover.show();
      }
    },
  }).dxScheduler('instance');
});
