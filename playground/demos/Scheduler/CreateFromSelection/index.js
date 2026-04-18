$(() => {
  console.log('CreateFromSelection demo v3.0.0');
  let selectionData = null;

  const tooltip = $('#creation-tooltip').dxTooltip({
    width: 260,
    height: 'auto',
    shading: false,
    position: 'right',
    hideOnOutsideClick: true,
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
      const middleCell = $focused.eq(Math.floor($focused.length / 2));

      tooltip.option('target', middleCell);
      tooltip.show();
    },
  }).dxScheduler('instance');
});
