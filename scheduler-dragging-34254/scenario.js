/* Shared scenario for PR #34254 repro pages.
   Expects window.DEMO_CONFIG = { newAppointments: bool, badge: string, badgeColor?: string } */
(function () {
  var cfg = window.DEMO_CONFIG;
  var scenario = 'p1';
  var schedulerA = null;
  var schedulerB = null;

  function fmtDate(d) {
    if (!(d instanceof Date)) return String(d);
    return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function fmtItem(data) {
    if (data === undefined) return 'undefined';
    if (data === null) return 'null';
    try {
      return '{ start: ' + fmtDate(data.startDate) + ', end: ' + fmtDate(data.endDate) + ' }';
    } catch (e) { return String(data); }
  }

  function addLog(msg, cls) {
    var el = document.getElementById('log');
    var line = document.createElement('div');
    line.className = 'log-line' + (cls ? ' ' + cls : '');
    line.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    el.insertBefore(line, el.firstChild);
  }

  function makeOptions(name) {
    var options = {
      dataSource: name === 'A' ? [{
        text: 'Appointment 1',
        startDate: new Date(2015, 1, 9, 8),
        endDate: new Date(2015, 1, 9, 9),
      }] : [],
      views: ['day'],
      currentView: 'day',
      currentDate: new Date(2015, 1, 9),
      startDayHour: 7,
      endDayHour: 13,
      cellDuration: 60,
      editing: true,
      height: 430,
      onAppointmentUpdating: function (e) {
        addLog('Scheduler ' + name + ' onAppointmentUpdating — newData: ' + fmtItem(e.newData), 'bad');
      },
      onAppointmentUpdated: function () {
        addLog('Scheduler ' + name + ' onAppointmentUpdated (appointment was MOVED)', 'bad');
      },
    };
    options._newAppointments = cfg.newAppointments;

    if (scenario === 'c1') {
      options.appointmentDragging = {
        onDragEnd: function (e) {
          addLog('Scheduler ' + name + ' appointmentDragging.onDragEnd — cancel = confirm promise (pending)');
          e.cancel = new Promise(function (resolve) {
            DevExpress.ui.dialog.confirm('Move the appointment?', 'Confirm move').then(function (moveConfirmed) {
              addLog('dialog answered: ' + (moveConfirmed ? 'Move' : 'Cancel (e.cancel resolves true)'), moveConfirmed ? 'good' : undefined);
              resolve(!moveConfirmed);
            });
          });
        },
      };
    }

    if (scenario === 'p2') {
      options.appointmentDragging = {
        group: 'sharedGroup',
        onDragStart: function (e) {
          addLog('Scheduler ' + name + ' appointmentDragging.onDragStart');
        },
        onDragEnd: function (e) {
          var ok = e.toItemData !== undefined;
          addLog('Scheduler ' + name + ' appointmentDragging.onDragEnd — toItemData: '
            + fmtItem(e.toItemData), ok ? 'good' : 'bad');
        },
        onRemove: function (e) {
          addLog('Scheduler ' + name + ' appointmentDragging.onRemove');
          e.component.deleteAppointment(e.itemData);
        },
        onAdd: function (e) {
          addLog('Scheduler ' + name + ' appointmentDragging.onAdd — itemData: ' + fmtItem(e.itemData), 'good');
          e.component.addAppointment(e.itemData);
        },
      };
    }
    return options;
  }

  function recreate() {
    var elA = document.getElementById('schedulerA');
    var elB = document.getElementById('schedulerB');
    if (schedulerA) { schedulerA.dispose(); elA.innerHTML = ''; }
    if (schedulerB) { schedulerB.dispose(); elB.innerHTML = ''; }
    schedulerA = new DevExpress.ui.dxScheduler(elA, makeOptions('A'));
    schedulerB = new DevExpress.ui.dxScheduler(elB, makeOptions('B'));
    document.getElementById('log').innerHTML = '';
    var hints = {
      p1: 'P1 (fixed in acd03721): schedulers are NOT linked (no appointmentDragging.group). Drag "Appointment 1" from Scheduler A and drop it on a cell of Scheduler B. Expected: the appointment snaps back, log stays empty. Bug: it MOVES inside Scheduler A and onAppointmentUpdating/Updated appear in the log.',
      p2: 'P2 (fixed in acd03721): both schedulers share appointmentDragging.group. Drag "Appointment 1" from Scheduler A onto Scheduler B. Check onDragEnd in the log. Expected: toItemData contains the drop dates. Bug: toItemData is undefined.',
      c1: 'C1 (async cancel): drag "Appointment 1" to another cell WITHIN Scheduler A. A confirm dialog opens while e.cancel is a pending promise. Expected: no data changes until you answer; "Move the appointment? → No" reverts the move. Bug: red onAppointmentUpdating/Updated lines appear BEFORE you answer, and pressing No does not bring the appointment back.',
    };
    document.getElementById('hint').textContent = hints[scenario];
  }

  window.addEventListener('DOMContentLoaded', function () {
    var badge = document.getElementById('badge');
    badge.textContent = cfg.badge;
    if (cfg.badgeColor) badge.style.background = cfg.badgeColor;

    document.querySelectorAll('input[name="scenario"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        scenario = this.value;
        recreate();
      });
    });
    recreate();
  });
}());
