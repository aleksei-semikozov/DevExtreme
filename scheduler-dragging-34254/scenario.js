/* PR #34254 repro: async cancel in appointmentDragging.onDragEnd.
   Expects window.DEMO_CONFIG = { newAppointments: bool, badge: string, badgeColor?: string } */
(function () {
  var cfg = window.DEMO_CONFIG;

  function fmtDate(d) {
    if (!(d instanceof Date)) return String(d);
    return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function addLog(msg, cls) {
    var el = document.getElementById('log');
    var line = document.createElement('div');
    line.className = 'log-line' + (cls ? ' ' + cls : '');
    line.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    el.insertBefore(line, el.firstChild);
  }

  window.addEventListener('DOMContentLoaded', function () {
    var badge = document.getElementById('badge');
    badge.textContent = cfg.badge;
    if (cfg.badgeColor) badge.style.background = cfg.badgeColor;

    new DevExpress.ui.dxScheduler(document.getElementById('scheduler'), {
      dataSource: [{
        text: 'Appointment 1',
        startDate: new Date(2015, 1, 9, 8),
        endDate: new Date(2015, 1, 9, 9),
      }],
      views: ['day'],
      currentView: 'day',
      currentDate: new Date(2015, 1, 9),
      startDayHour: 7,
      endDayHour: 13,
      cellDuration: 60,
      editing: true,
      height: 480,
      _newAppointments: cfg.newAppointments,
      appointmentDragging: {
        onDragEnd: function (e) {
          addLog('onDragEnd — e.cancel = confirm promise (pending)');
          e.cancel = new Promise(function (resolve) {
            DevExpress.ui.dialog.confirm('Move the appointment?', 'Confirm').then(function (moveConfirmed) {
              addLog('dialog answered: ' + (moveConfirmed ? 'Yes' : 'No (cancel)'), moveConfirmed ? 'good' : undefined);
              resolve(!moveConfirmed);
            });
          });
        },
      },
      onAppointmentUpdating: function (e) {
        addLog('onAppointmentUpdating — newData: { start: '
          + fmtDate(e.newData.startDate) + ', end: ' + fmtDate(e.newData.endDate) + ' }', 'bad');
      },
      onAppointmentUpdated: function () {
        addLog('onAppointmentUpdated — data saved', 'bad');
      },
    });
  });
}());
