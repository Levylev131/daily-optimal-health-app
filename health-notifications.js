(function () {
  'use strict';

  var _interval = null;
  var _alignTimer = null;
  var _shown = {}; // key: pageKey:mins:YYYY-MM-DD → true

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function playChime() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Noise burst — filtered static hit
      var bufLen = Math.floor(ctx.sampleRate * 0.18);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = buf;
      var nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 1200;
      nFilter.Q.value = 0.6;
      var nGain = ctx.createGain();
      nSrc.connect(nFilter); nFilter.connect(nGain); nGain.connect(ctx.destination);
      nGain.gain.setValueAtTime(0.5, ctx.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      nSrc.start(ctx.currentTime);
      nSrc.stop(ctx.currentTime + 0.18);

      // 3 sharp alarm beeps
      [0, 0.14, 0.28].forEach(function(t) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 880;
        g.gain.setValueAtTime(0.13, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.1);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.1);
      });

      // Descending chime
      var mainOsc = ctx.createOscillator();
      var mainGain = ctx.createGain();
      mainOsc.connect(mainGain); mainGain.connect(ctx.destination);
      mainOsc.type = 'sine';
      mainOsc.frequency.setValueAtTime(1046, ctx.currentTime + 0.45);
      mainOsc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 1.1);
      mainGain.gain.setValueAtTime(0.38, ctx.currentTime + 0.45);
      mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.9);
      mainOsc.start(ctx.currentTime + 0.45);
      mainOsc.stop(ctx.currentTime + 1.9);
    } catch (e) {}
  }

  function minsToDisplay(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  function triggerClocks(timeLabel, icon) {
    var emojis = icon
      ? [icon]
      : ['🔔','🔔','🔔','✨','⭐','🌟','💫','🔔','🔔','🔔'];

    if (!document.getElementById('doh-clock-fall-style')) {
      var s = document.createElement('style');
      s.id = 'doh-clock-fall-style';
      s.textContent = [
        '@keyframes doh-clock-fall{0%{transform:translateY(-60px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) translateX(var(--cl-drift)) rotate(var(--cl-spin));opacity:0}}',
        '@keyframes doh-burst{0%{opacity:1;transform:translate(calc(-50% + 0px),calc(-50% + 0px)) scale(0.2)}100%{opacity:0;transform:translate(calc(-50% + var(--bx)),calc(-50% + var(--by))) scale(1.4)}}',
        '@keyframes doh-flash{0%{opacity:0.6}60%{opacity:0.25}100%{opacity:0}}'
      ].join('');
      document.head.appendChild(s);
    }

    // Screen flash
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(45,212,110,0.22);pointer-events:none;z-index:9994;animation:doh-flash 0.6s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(function() { flash.remove(); }, 700);

    // Center burst — emojis explode outward
    function launchBurst(delay) {
      var count = 30;
      for (var i = 0; i < count; i++) {
        (function(idx) {
          setTimeout(function() {
            var angle = (idx / count) * Math.PI * 2;
            var dist  = 110 + Math.random() * 230;
            var el    = document.createElement('div');
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.cssText =
              'position:fixed;top:50%;left:50%;' +
              'font-size:' + (18 + Math.random() * 22).toFixed(0) + 'px;' +
              'pointer-events:none;z-index:9997;' +
              '--bx:' + (Math.cos(angle) * dist).toFixed(1) + 'px;' +
              '--by:' + (Math.sin(angle) * dist).toFixed(1) + 'px;' +
              'animation:doh-burst ' + (0.45 + Math.random() * 0.4).toFixed(2) + 's ease-out forwards;';
            document.body.appendChild(el);
            setTimeout(function() { el.remove(); }, 1000);
          }, delay + idx * 16);
        })(i);
      }
    }

    // Falling wave
    function launchWave(waveDelay) {
      var total = 70;
      for (var i = 0; i < total; i++) {
        (function (idx) {
          setTimeout(function () {
            var drift = ((Math.random() - 0.5) * 240).toFixed(1);
            var spin  = ((Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 300)).toFixed(0);
            var dur   = (1.6 + Math.random() * 2.0).toFixed(2);
            var left  = (Math.random() * 96).toFixed(1);
            var el    = document.createElement('div');
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.cssText =
              'position:fixed;top:-40px;left:' + left + 'vw;' +
              'font-size:' + (16 + Math.random() * 28).toFixed(1) + 'px;' +
              'opacity:0.95;pointer-events:none;z-index:9997;' +
              '--cl-drift:' + drift + 'px;--cl-spin:' + spin + 'deg;' +
              'animation:doh-clock-fall ' + dur + 's ease-in forwards;';
            document.body.appendChild(el);
            setTimeout(function () { el.remove(); }, 5000);
          }, waveDelay + idx * 28);
        })(i);
      }
    }

    // Falling name labels
    function launchNameDrop(delay) {
      if (!timeLabel) return;
      var positions = [20, 50, 75];
      var stagger   = [0, 500, 1100];
      positions.forEach(function (leftPct, pi) {
        setTimeout(function () {
          var drift = ((Math.random() - 0.5) * 60).toFixed(1);
          var spin  = ((pi % 2 === 0 ? 1 : -1) * (4 + Math.random() * 10)).toFixed(0);
          var dur   = (2.8 + Math.random() * 1.2).toFixed(2);
          var el    = document.createElement('div');
          el.textContent = timeLabel;
          el.style.cssText =
            'position:fixed;top:-80px;left:' + leftPct + 'vw;transform:translateX(-50%);' +
            'font-size:30px;font-weight:900;color:#2dd46e;' +
            'text-shadow:0 0 16px rgba(45,212,110,1),0 0 32px rgba(45,212,110,0.7),0 0 52px rgba(45,212,110,0.4);' +
            'pointer-events:none;z-index:9998;white-space:nowrap;letter-spacing:1px;' +
            '--cl-drift:' + drift + 'px;--cl-spin:' + spin + 'deg;' +
            'animation:doh-clock-fall ' + dur + 's ease-in forwards;';
          document.body.appendChild(el);
          setTimeout(function () { el.remove(); }, 5000);
        }, delay + stagger[pi]);
      });
    }

    launchBurst(0);
    launchWave(0);
    launchNameDrop(1200);
    launchWave(3000);
    launchNameDrop(5000);
    launchWave(6000);
  }

  /* ── ReminderPopup — fires on every page ── */
  var _notifPopups = [];
  var _notifContainer = null;

  function _escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getNotifContainer() {
    if (!_notifContainer || !document.body.contains(_notifContainer)) {
      if (!document.getElementById('doh-popup-style')) {
        var s = document.createElement('style');
        s.id = 'doh-popup-style';
        s.textContent =
          '.doh-rp{flex-shrink:0;position:relative;background:rgba(8,28,16,0.97);border:1px solid rgba(45,212,110,0.45);border-radius:16px;padding:18px 18px 16px;backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.55),0 0 20px rgba(45,212,110,0.1);opacity:0;transform:translateX(30px);transition:opacity 0.3s ease,transform 0.3s cubic-bezier(.34,1.4,.64,1);color:#f0fff4;}' +
          '.doh-rp.doh-rp-visible{opacity:1;transform:translateX(0);}' +
          '.doh-rp-close{position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#f0fff4;font-size:22px;cursor:pointer;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;}' +
          '.doh-rp-close:hover{background:rgba(255,80,80,0.2);border-color:rgba(255,80,80,0.4);color:#ff9999;}' +
          '.doh-rp-icon{font-size:32px;margin-bottom:8px;line-height:1;}' +
          '.doh-rp-name{font-size:15px;font-weight:800;margin-bottom:4px;}' +
          '.doh-rp-msg{font-size:13px;color:rgba(240,255,244,0.55);margin-bottom:14px;line-height:1.4;}' +
          '.doh-rp-btn{background:#2dd46e;color:#000;font-weight:800;border:none;border-radius:10px;padding:10px 0;cursor:pointer;font-size:13px;width:100%;transition:background 0.2s;}' +
          '.doh-rp-btn:hover{background:#3de87c;}';
        document.head.appendChild(s);
      }
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;width:270px;z-index:10000;display:flex;flex-direction:column;gap:8px;';
      var header = document.createElement('div');
      header.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(240,255,244,0.55);padding:0 4px 2px;';
      header.textContent = '🔔 Notifications';
      wrap.appendChild(header);
      _notifContainer = document.createElement('div');
      _notifContainer.style.cssText = 'display:flex;flex-direction:column;gap:10px;max-height:522px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(45,212,110,0.35) transparent;';
      wrap.appendChild(_notifContainer);
      document.body.appendChild(wrap);
      _notifContainer._wrap = wrap;
    }
    return _notifContainer;
  }

  function ReminderPopup(label, icon, pageKey) {
    var container = getNotifContainer();
    var name = label.replace(/^Check in:\s*/i, '');
    var card = document.createElement('div');
    card.className = 'doh-rp';
    card.innerHTML =
      '<button class="doh-rp-close" title="Dismiss">×</button>' +
      '<div class="doh-rp-icon">' + (icon || '🔔') + '</div>' +
      '<div class="doh-rp-name">' + _escHtml(name) + '</div>' +
      '<div class="doh-rp-msg">Time to check in today!</div>' +
      '<button class="doh-rp-btn">Go to Challenge</button>';
    container.appendChild(card);
    _notifPopups.push(card);
    setTimeout(function() {
      card.classList.add('doh-rp-visible');
      container.scrollTop = container.scrollHeight;
    }, 30);

    function dismiss() {
      card.classList.remove('doh-rp-visible');
      setTimeout(function() {
        card.remove();
        var idx = _notifPopups.indexOf(card);
        if (idx !== -1) _notifPopups.splice(idx, 1);
        if (_notifPopups.length === 0) {
          (_notifContainer._wrap || _notifContainer).remove();
          _notifContainer = null;
        }
      }, 380);
    }

    setTimeout(dismiss, 10000);
    card.querySelector('.doh-rp-close').addEventListener('click', dismiss);
    card.querySelector('.doh-rp-btn').addEventListener('click', function() {
      dismiss();
      window.location.href = 'challenges.html';
    });
  }

  function showBanner(label, timeMins, icon, pageKey) {
    var isChallengeNotif = pageKey && pageKey.indexOf('ch-') === 0;
    if (typeof window.dohNotifications.onNotify === 'function') {
      window.dohNotifications.onNotify(pageKey, label, timeMins, icon || null);
    } else if (isChallengeNotif) {
      ReminderPopup(label, icon || null, pageKey);
    }
    playChime();
    triggerClocks(label.replace(/^Check in:\s*/i, ''), icon || null);
    if (isChallengeNotif) return; // ReminderPopup already shown — skip toast and fallback banner
    if (typeof toast === 'function') {
      toast('🔔 ' + label, 9000, true);
      return;
    }
    // Fallback: standalone fixed banner for non-challenge schedule pages
    var banner = document.getElementById('doh-notif-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'doh-notif-banner';
      banner.style.cssText = [
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%)',
        'background:#1e293b;color:#f1f5f9;border:1px solid #334155',
        'padding:12px 18px;border-radius:14px;font-size:.88rem;font-family:inherit',
        'z-index:9999;box-shadow:0 6px 28px rgba(0,0,0,.55)',
        'display:flex;align-items:center;gap:10px;max-width:400px;min-width:220px'
      ].join(';');
      document.body.appendChild(banner);
    }
    banner.innerHTML = '<span style="font-size:1.1rem;flex-shrink:0">🔔</span>'
      + '<span style="flex:1;line-height:1.4">' + label + '</span>'
      + '<button onclick="this.parentElement.style.display=\'none\'"'
      + ' style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.3rem;line-height:1;padding:0 2px;flex-shrink:0">×</button>';
    banner.style.display = 'flex';
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(function () { banner.style.display = 'none'; }, 9000);
  }

  function hasEnabledNotifs() {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('notif:') === 0 && k.slice(-8) === ':enabled') return true;
    }
    return false;
  }

  function checkNow() {
    var now = new Date();
    var currentMins = now.getHours() * 60 + now.getMinutes();
    var today = todayStr();

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
          var notifKey = pk + ':' + task.mins + ':' + today;
          if (_shown[notifKey]) return;
          if (task.mins === currentMins) {
            _shown[notifKey] = true;
            showBanner(task.label, task.mins, task.icon || null, pk);
          }
        });
      })(pageKey, tasks);
    }
  }

  function scheduleAll() {
    clearInterval(_interval); _interval = null;
    clearTimeout(_alignTimer); _alignTimer = null;
    if (!hasEnabledNotifs()) return;

    // Align first poll to just after the next minute boundary, then tick every 60s
    var now = new Date();
    var msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 150;
    _alignTimer = setTimeout(function () {
      _alignTimer = null;
      checkNow();
      _interval = setInterval(checkNow, 60000);
    }, msToNext);
  }

  function requestPermission(cb) {
    cb(true); // in-app notifications — no browser permission required
  }

  function celebrateComplete(label, icon) {
    try {
      var a = new Audio('audio/Confetti.ogg');
      a.volume = 1.0;
      a.play();
    } catch(e) {}

    if (!document.getElementById('doh-complete-style')) {
      var s = document.createElement('style');
      s.id = 'doh-complete-style';
      s.textContent =
        '@keyframes doh-complete-flash{0%{opacity:0.7}100%{opacity:0}}' +
        '@keyframes doh-ch-burst{0%{opacity:1;transform:translate(calc(-50% + 0px),calc(-50% + 0px)) scale(0.1)}100%{opacity:0;transform:translate(calc(-50% + var(--bx)),calc(-50% + var(--by))) scale(1.3)}}' +
        '@keyframes doh-confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(var(--cf-spin)) translateX(var(--cf-drift));opacity:0}}' +
        '@keyframes doh-name-complete{0%{transform:translateX(-50%) translateY(0);opacity:1}100%{transform:translateX(-50%) translateY(110vh) rotate(var(--nd-spin));opacity:0}}';
      document.head.appendChild(s);
    }

    // Gold screen flash
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(250,204,21,0.28);pointer-events:none;z-index:9994;animation:doh-complete-flash 0.9s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(function() { flash.remove(); }, 1000);

    // Burst of challenge emoji + trophy from center
    var burstEmojis = ['🏆', icon, icon, '🏆', icon, '🏆'];
    for (var i = 0; i < 28; i++) {
      (function(idx) {
        setTimeout(function() {
          var angle = (idx / 28) * Math.PI * 2;
          var dist = 160 + Math.random() * 340;
          var el = document.createElement('div');
          el.textContent = burstEmojis[idx % burstEmojis.length];
          el.style.cssText =
            'position:fixed;top:50%;left:50%;' +
            'font-size:' + (32 + Math.random() * 40).toFixed(0) + 'px;' +
            'pointer-events:none;z-index:9998;' +
            '--bx:' + (Math.cos(angle) * dist).toFixed(1) + 'px;' +
            '--by:' + (Math.sin(angle) * dist).toFixed(1) + 'px;' +
            'animation:doh-ch-burst ' + (3.5 + Math.random() * 0.35).toFixed(2) + 's ease-out forwards;';
          document.body.appendChild(el);
          setTimeout(function() { el.remove(); }, 4500);
        }, idx * 18);
      })(i);
    }

    // Colored confetti rain — wave helper
    var colors = ['#facc15','#4ade80','#f472b6','#60a5fa','#fb923c','#a78bfa','#fff','#f87171'];
    function launchConfettiWave(waveDelay) {
      for (var j = 0; j < 100; j++) {
        (function(idx) {
          setTimeout(function() {
            var el = document.createElement('div');
            el.style.cssText =
              'position:fixed;top:-12px;' +
              'left:' + (Math.random() * 100).toFixed(1) + 'vw;' +
              'width:' + (5 + Math.random() * 8).toFixed(0) + 'px;' +
              'height:' + (9 + Math.random() * 8).toFixed(0) + 'px;' +
              'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
              'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
              'pointer-events:none;z-index:9997;' +
              '--cf-spin:' + ((Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360)).toFixed(0) + 'deg;' +
              '--cf-drift:' + ((Math.random() - 0.5) * 160).toFixed(1) + 'px;' +
              'animation:doh-confetti-fall ' + (1.8 + Math.random() * 2.2).toFixed(2) + 's linear forwards;';
            document.body.appendChild(el);
            setTimeout(function() { el.remove(); }, waveDelay + 4500);
          }, waveDelay + idx * 18);
        })(j);
      }
    }
    launchConfettiWave(0);
    launchConfettiWave(4500);
    launchConfettiWave(8000);

    // Second emoji burst at 5s
    setTimeout(function() {
      for (var k = 0; k < 28; k++) {
        (function(idx) {
          setTimeout(function() {
            var angle = (idx / 28) * Math.PI * 2;
            var dist = 160 + Math.random() * 340;
            var el = document.createElement('div');
            el.textContent = burstEmojis[idx % burstEmojis.length];
            el.style.cssText =
              'position:fixed;top:50%;left:50%;' +
              'font-size:' + (32 + Math.random() * 40).toFixed(0) + 'px;' +
              'pointer-events:none;z-index:9998;' +
              '--bx:' + (Math.cos(angle) * dist).toFixed(1) + 'px;' +
              '--by:' + (Math.sin(angle) * dist).toFixed(1) + 'px;' +
              'animation:doh-ch-burst ' + (3.5 + Math.random() * 0.35).toFixed(2) + 's ease-out forwards;';
            document.body.appendChild(el);
            setTimeout(function() { el.remove(); }, 4500);
          }, idx * 18);
        })(k);
      }
    }, 5000);

    // Falling name labels — 3 waves
    if (label) {
      var dropTexts = [icon + ' ' + label, 'Complete! 🏆', icon + ' ' + label];
      function launchNameWave(baseDelay) {
        [20, 52, 78].forEach(function(leftPct, pi) {
          setTimeout(function() {
            var el = document.createElement('div');
            el.textContent = dropTexts[pi];
            el.style.cssText =
              'position:fixed;top:-80px;left:' + leftPct + 'vw;transform:translateX(-50%);' +
              'font-size:28px;font-weight:900;color:#facc15;' +
              'text-shadow:0 0 16px rgba(250,204,21,1),0 0 32px rgba(250,204,21,0.7),0 0 50px rgba(250,204,21,0.4);' +
              'pointer-events:none;z-index:9999;white-space:nowrap;letter-spacing:1px;' +
              '--nd-spin:' + ((pi % 2 === 0 ? 1 : -1) * (4 + Math.random() * 9)).toFixed(0) + 'deg;' +
              'animation:doh-name-complete ' + (3.2 + Math.random() * 1.0).toFixed(2) + 's ease-in forwards;';
            document.body.appendChild(el);
            setTimeout(function() { el.remove(); }, baseDelay + 5000);
          }, baseDelay + [200, 800, 1500][pi]);
        });
      }
      launchNameWave(0);
      launchNameWave(5000);
      launchNameWave(9500);
    }
  }

  window.dohNotifications = { schedule: scheduleAll, requestPermission: requestPermission, onNotify: null, testClocks: function(icon) { triggerClocks('9:00 AM', icon || null); }, celebrate: function(label, icon) { celebrateComplete(label, icon || null); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleAll);
  } else {
    scheduleAll();
  }
})();
