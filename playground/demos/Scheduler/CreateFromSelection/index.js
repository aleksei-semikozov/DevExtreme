$(() => {
  console.log('CreateFromSelection demo v1.1.0');
  let selectionData = null;
  let lastSelectedCellRects = [];
  let $overlays = [];
  let $anchor = null;
  let popoverVisible = false;

  function createOverlay(schedulerElement, rects) {
    removeOverlay();
    if (!rects.length) return;

    const columns = {};
    rects.forEach((r) => {
      const key = Math.round(r.x);
      if (!columns[key]) {
        columns[key] = { x: r.x, width: r.width, minY: r.y, maxY: r.y + r.height };
      } else {
        columns[key].minY = Math.min(columns[key].minY, r.y);
        columns[key].maxY = Math.max(columns[key].maxY, r.y + r.height);
      }
    });

    const cols = Object.values(columns);
    cols.forEach((col) => {
      const $el = $('<div>').css({
        position: 'fixed',
        left: `${col.x}px`,
        top: `${col.minY}px`,
        width: `${col.width}px`,
        height: `${col.maxY - col.minY}px`,
        backgroundColor: 'rgba(0, 120, 215, 0.2)',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: 100,
      }).appendTo('body');
      $overlays.push($el);
    });

    const lastCol = cols[cols.length - 1];
    const midY = (lastCol.minY + lastCol.maxY) / 2;
    $anchor = $('<div>').css({
      position: 'fixed',
      left: `${lastCol.x + lastCol.width}px`,
      top: `${midY}px`,
      width: '1px',
      height: '1px',
      pointerEvents: 'none',
    }).appendTo('body');
  }

  function removeOverlay() {
    $overlays.forEach(($el) => $el.remove());
    $overlays = [];
    if ($anchor) {
      $anchor.remove();
      $anchor = null;
    }
  }

  const popover = $('#creation-popover').dxPopover({
    width: 260,
    height: 'auto',
    showTitle: true,
    title: 'New Appointment',
    showCloseButton: false,
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
    onShowing() {
      popoverVisible = true;
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

          console.log('Creating appointment:', JSON.stringify({
            text: subject,
            startDate: selectionData.startDate,
            endDate: selectionData.endDate,
            ...selectionData.groups,
          }));

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
      popoverVisible = false;
      removeOverlay();
      const subjectBox = $('#appointment-subject').data('dxTextBox');
      if (subjectBox) {
        subjectBox.option('value', '');
      }
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
    allDayPanelMode: 'allDay',
    onAppointmentFormOpening() {
      popover.hide();
    },
    onAppointmentTooltipShowing() {
      popover.hide();
    },
    onAppointmentClick() {
      popover.hide();
    },
    onCellClick() {
      popover.hide();
    },
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

      createOverlay(e.component.$element(), lastSelectedCellRects);

      setTimeout(() => {
        if ($anchor) {
          popover.option('target', $anchor);
          popover.show();
        }
      }, 50);
    },
  }).dxScheduler('instance');
});
