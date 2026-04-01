(function () {
  'use strict';

  var _timers = [];

  function scheduleAll() {
    _timers.forEach(function (t) { clearTimeout(t); });
    _timers = [];

    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    var now = new Date();
    var nowMins = now.getHours() * 60 + now.getMinutes();

    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || key.indexOf('notif:') !== 0 || key.slice(-8) !== ':enabled') continue;

      var pageKey = key.slice(6, -8);
      var raw = localStorage.getItem('notif:' + pageKey + ':tasks');
      if (!raw) continue;

      var tasks;
      try { tasks = JSON.parse(raw); } catch (e) { continue; }

      (function (pk, taskList) {
        taskList.forEach(function (task) {
          if (task.mins <= nowMins) return;
          var ms = (task.mins - nowMins) * 60000;
          var t = setTimeout(function () {
            if (Notification.permission === 'granted') {
              new Notification('\u23F0 ' + task.label, {
                body: 'Check it off your schedule!',
                tag: 'doh-' + pk + '-' + task.mins
              });
            }
          }, ms);
          _timers.push(t);
        });
      })(pageKey, tasks);
    }
  }

  function requestPermission(cb) {
    if (!('Notification' in window)) { cb(false); return; }
    if (Notification.permission === 'granted') { cb(true); return; }
    if (Notification.permission === 'denied') { cb(false); return; }
    Notification.requestPermission().then(function (p) { cb(p === 'granted'); });
  }

  window.dohNotifications = { schedule: scheduleAll, requestPermission: requestPermission };

  // Auto-run on load if already permitted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleAll);
    } else {
      scheduleAll();
    }
  }
})();
