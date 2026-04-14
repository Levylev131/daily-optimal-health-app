(function () {
  // ── LEVELS (mirrors index.html) ───────────────────────────────────────────
  const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 100, 365];
  const LEVELS = [
    {name:'Couch Potato',      min:0},
    {name:'Weekend Warrior',   min:150},
    {name:'Health Curious',    min:400},
    {name:'Health Enthusiast', min:800},
    {name:'Optimizer',         min:1400},
    {name:'Biohacker',         min:2200},
    {name:'Longevity Legend',       min:3500},
    {name:'Elite Performer',        min:5500},
    {name:'Peak Human',             min:8500},
    {name:'Longevity Architect',    min:13000},
    {name:'Centenarian Candidate',  min:20000},
    {name:'Demigod',                min:30000},
    {name:'Transcendent',           min:45000},
  ];

  // ── PROFILE HELPERS ───────────────────────────────────────────────────────
  function getActiveId()  { return localStorage.getItem('doh_active_profile') || null; }
  function getProfiles()  { return JSON.parse(localStorage.getItem('doh_profiles') || '{}'); }
  function pfx()          { const id = getActiveId(); return `doh_${id || 'guest'}_`; }

  function getXP()        { const p = pfx(); return p ? parseInt(localStorage.getItem(p+'xp') || '0') : 0; }
  function getStreak()    { const p = pfx(); return p ? JSON.parse(localStorage.getItem(p+'streak') || '{"count":0,"last":""}') : {count:0,last:''}; }

  function setXP(val)     { const p = pfx(); if(p) localStorage.setItem(p+'xp', Math.max(0,val)); }
  function setStreak(obj) { const p = pfx(); if(p) localStorage.setItem(p+'streak', JSON.stringify(obj)); }

  function getFreezes() {
    const id = getActiveId(); if (!id) return 0;
    return parseInt(getProfiles()[id]?.freezes || 0);
  }
  function setFreezes(val) {
    const id = getActiveId(); if (!id) return;
    const profiles = getProfiles(); if (!profiles[id]) return;
    profiles[id].freezes = Math.max(0, Math.min(3, val));
    localStorage.setItem('doh_profiles', JSON.stringify(profiles));
  }

  // Award XP and check for level-up (awards a freeze token on rank-up)
  function awardXP(amount) {
    const xpBefore = getXP();
    setXP(xpBefore + amount);
    const lvBefore = levelFor(xpBefore);
    const lvAfter  = levelFor(getXP());
    if (lvAfter.idx > lvBefore.idx) {
      const freezes = getFreezes();
      if (freezes < 3) {
        setFreezes(freezes + 1);
        showToast('\uD83C\uDF89 Rank up: ' + lvAfter.name + '! +1 \u2744\uFE0F freeze (' + (freezes + 1) + '/3)');
      } else {
        showToast('\uD83C\uDF89 Rank up: ' + lvAfter.name + '!');
      }
    }
  }

  function levelFor(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return {idx:i, ...LEVELS[i], next: LEVELS[i+1]||null};
    return {idx:0, ...LEVELS[0], next: LEVELS[1]||null};
  }

  function initials(name) {
    return name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()||'').join('');
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function auditStreak() {
    const today = todayISO();
    const s = getStreak();
    if (!s.last || s.last === today) return;
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
    if (s.last === ydStr) return; // yesterday — still valid
    // Missed at least one day
    const freezes = getFreezes();
    if (freezes > 0) {
      setFreezes(freezes - 1);
      const p = pfx();
      localStorage.setItem(p + 'freeze_uses', parseInt(localStorage.getItem(p + 'freeze_uses') || '0') + 1);
      // Protect streak count — do NOT increment; user must still earn today's increment by completing tasks
      s.last = today;
      setStreak(s);
      triggerSnowflakes();
      showToast('❄️ Streak Freeze Used — Streak Protected! (' + (freezes - 1) + ' Left)', 10000, true);
    } else {
      s.count = 0;
      setStreak(s);
    }
  }

  function touchStreak() {
    const today = todayISO();
    const s = getStreak();
    if (s.last === today) return;
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
    s.count = (s.last === ydStr) ? s.count + 1 : 1;
    s.last = today;
    setStreak(s);
    const p = pfx();
    const bestStored = parseInt(localStorage.getItem(p + 'best_streak') || '0');
    if (s.count > bestStored) localStorage.setItem(p + 'best_streak', s.count);
    if (STREAK_MILESTONES.includes(s.count)) {
      showToast('🔥 ' + s.count + '-day streak! Keep it going!');
    }
  }

  // ── PAGE KEY / DATE STATE ─────────────────────────────────────────────────
  const pageKey = document.title.split('—')[0].trim().replace(/\s+/g, '-').toLowerCase();
  let currentDate = todayMidnight();

  function todayMidnight() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }

  function toISO(d) { return d.toISOString().slice(0,10); }

  function isToday() { return toISO(currentDate) === todayISO(); }

  function formatLabel(d) {
    const diff = Math.round((d - todayMidnight()) / 86400000);
    const longLabel = d.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
    if (diff === 0) return '▶ Today — ' + longLabel;
    if (diff === -1) return 'Yesterday — ' + longLabel;
    return longLabel;
  }

  function storageKey() {
    const id = getActiveId() || 'guest';
    return 'ht:' + id + ':' + pageKey + ':' + toISO(currentDate);
  }

  // Named profiles use localStorage; guests use sessionStorage (clears on browser close)
  function taskStorage() { return getActiveId() ? localStorage : sessionStorage; }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  function isNotifEnabled() {
    return localStorage.getItem('notif:' + pageKey + ':enabled') === '1';
  }

  function savePageTasks() {
    var tasks = [];
    document.querySelectorAll('tbody tr').forEach(function (row) {
      var mins = parseRowMinutes(row);
      if (mins === null) return;
      var summary = row.querySelector('.summary');
      var label = summary ? summary.textContent.trim() : (row.cells[1] ? row.cells[1].textContent.trim() : '');
      if (!label) return;
      tasks.push({ label: label, mins: mins });
    });
    localStorage.setItem('notif:' + pageKey + ':tasks', JSON.stringify(tasks));
  }

  function toggleNotif() {
    if (isNotifEnabled()) {
      localStorage.removeItem('notif:' + pageKey + ':enabled');
      localStorage.removeItem('notif:' + pageKey + ':tasks');
      updateProfileBar();
      if (window.dohNotifications) window.dohNotifications.schedule();
      showToast('Reminders off.');
    } else {
      if (!window.dohNotifications) { showToast('Notifications not available.'); return; }
      var enabledCount = 0;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('notif:') === 0 && k.slice(-8) === ':enabled') enabledCount++;
      }
      if (enabledCount >= 3) { showToast('Max 3 reminders — turn one off first.'); return; }
      window.dohNotifications.requestPermission(function (granted) {
        if (!granted) { showToast('Permission denied — check browser settings.'); return; }
        localStorage.setItem('notif:' + pageKey + ':enabled', '1');
        savePageTasks();
        updateProfileBar();
        window.dohNotifications.schedule();
        showToast('Reminders on! \uD83D\uDD14');
      });
    }
  }

  // ── BUILD PROFILE BAR ─────────────────────────────────────────────────────
  function buildProfileBar() {
    const bar = document.createElement('div');
    bar.id = 'pf-bar';
    updateProfileBar(bar);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function updateProfileBar(bar) {
    bar = bar || document.getElementById('pf-bar');
    if (!bar) return;

    const activeId = getActiveId();
    const profiles = getProfiles();
    const profile  = activeId ? profiles[activeId] : null;

    if (!profile) {
      bar.innerHTML = `<a href="index.html" class="pf-home-btn">🏠 Home</a>`;
      return;
    }

    const xp = getXP();
    const streak = getStreak();
    const lv = levelFor(xp);
    const xpIn  = xp - lv.min;
    const xpFor = lv.next ? lv.next.min - lv.min : 1;
    const pct   = lv.next ? Math.min(100, xpIn / xpFor * 100) : 100;

    bar.innerHTML = `
      <a href="index.html" class="pf-home">← Home</a>
      <div class="pf-avatar pf-avatar--clickable" style="background:${profile.color};font-size:${profile.avatar?'1.2rem':'0.78rem'}" title="Profile options">${profile.avatar || initials(profile.name)}</div>
      <div class="pf-info">
        <div class="pf-name">${profile.name}</div>
        <div class="pf-level">${lv.name}</div>
        <div class="pf-xp-row">
          <div class="pf-xp-track"><div class="pf-xp-fill" style="width:${pct.toFixed(1)}%"></div></div>
          <span class="pf-xp-num">${xp} XP</span>
        </div>
      </div>
      <div class="pf-streak">🔥 ${streak.count}</div>
      <button class="pf-notif-btn${isNotifEnabled() ? ' pf-notif-on' : ''}" id="pf-notif-btn" title="${isNotifEnabled() ? 'Reminders on — click to disable' : 'Enable reminders'}">🔔</button>
    `;

    bar.querySelector('.pf-avatar--clickable').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleProfilePopup();
    });

    var notifBtn = bar.querySelector('#pf-notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleNotif();
      });
    }
  }

  function toggleProfilePopup() {
    var existing = document.getElementById('pf-popup');
    if (existing) { existing.remove(); return; }

    var popup = document.createElement('div');
    popup.id = 'pf-popup';
    popup.innerHTML =
      '<button class="pf-pop-btn" id="pf-switch-btn">⇄ Switch Profile</button>' +
      '<div class="pf-pop-divider"></div>' +
      '<button class="pf-pop-btn pf-pop-logout" id="pf-logoff-btn">← Log Off</button>';

    document.getElementById('pf-bar').appendChild(popup);

    document.getElementById('pf-switch-btn').addEventListener('click', function () {
      localStorage.removeItem('doh_active_profile');
      window.location.href = 'index.html';
    });

    document.getElementById('pf-logoff-btn').addEventListener('click', function () {
      window.location.href = 'index.html';
    });

    setTimeout(function () {
      document.addEventListener('click', function closePopup() {
        var p = document.getElementById('pf-popup');
        if (p) p.remove();
        document.removeEventListener('click', closePopup);
      });
    }, 0);
  }

  // ── BUILD DAY BAR ─────────────────────────────────────────────────────────
  function buildDayBar() {
    const bar = document.createElement('div');
    bar.id = 'day-bar';
    bar.innerHTML =
      '<button id="dc-prev" class="dc-btn">&#9664; Prev</button>' +
      '<div id="dc-center">' +
        '<div id="dc-label"></div>' +
        '<div id="dc-progress-row">' +
          '<span id="dc-count"></span>' +
          '<div id="dc-bar-wrap"><div id="dc-fill"></div></div>' +
        '</div>' +
      '</div>' +
      '<button id="dc-next" class="dc-btn">Next &#9654;</button>';

    const table = document.querySelector('table');
    table.parentNode.insertBefore(bar, table);

    document.getElementById('dc-prev').addEventListener('click', function () {
      currentDate.setDate(currentDate.getDate() - 1);
      renderDay();
    });
    document.getElementById('dc-next').addEventListener('click', function () {
      if (currentDate < todayMidnight()) {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDay();
      }
    });
  }

  // ── ADD CHECKBOX COLUMN ───────────────────────────────────────────────────
  function addCheckboxColumn() {
    const th = document.createElement('th');
    th.className = 'cb-th';

    const checkAllBtn = document.createElement('button');
    checkAllBtn.textContent = '✓';
    checkAllBtn.className = 'cb-all-btn';
    checkAllBtn.title = 'Check all tasks for this day';
    checkAllBtn.addEventListener('click', function () {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      document.querySelectorAll('tbody tr').forEach(function (row) {
        const cb = row.querySelector('input[type=checkbox]');
        if (!cb || cb.checked) return;

        if (isToday()) {
          // cells[0]=cb, cells[1]=time
          const timeText = row.cells[1] ? row.cells[1].textContent.trim() : '';
          const m = timeText.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (m) {
            let h = parseInt(m[1]);
            const min = parseInt(m[2]);
            const ampm = m[3].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            if (h * 60 + min > nowMins) return; // skip future tasks
          }
        }

        cb.checked = true;
        row.classList.add('row-done');
        if (isToday()) {
          awardXP(10);
          touchStreak();
        }
      });
      saveDay();
      checkAllDone();
      updateProfileBar();
    });
    th.appendChild(checkAllBtn);

    const headerRow = document.querySelector('thead tr');
    headerRow.insertBefore(th, headerRow.firstChild);

    document.querySelectorAll('tbody tr').forEach(function (row, i) {
      const td = document.createElement('td');
      td.className = 'cb-td';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.idx = String(i);
      td.appendChild(cb);
      row.insertBefore(td, row.firstChild);

      var futureClickCount = 0;
      var futureClickTimer = null;

      cb.addEventListener('change', function () {
        if (isToday()) {
          const taskMins = parseRowMinutes(row);
          const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
          if (taskMins !== null && taskMins > nowMins) {
            cb.checked = false;
            futureClickCount++;
            clearTimeout(futureClickTimer);
            futureClickTimer = setTimeout(function () { futureClickCount = 0; }, 3000);
            if (futureClickCount === 2) {
              showToast("Bro, it's not time yet. Chill. ⏳");
            } else if (futureClickCount >= 3) {
              showToast("OK you need to go touch some grass. 🌿");
              futureClickCount = 0;
            } else {
              showToast("This task hasn't started yet!");
            }
            return;
          }
        }
        row.classList.toggle('row-done', cb.checked);
        if (isToday()) {
          if (cb.checked) { awardXP(10); touchStreak(); } else { setXP(getXP() - 10); }
          updateProfileBar();
        }
        saveDay();
        checkAllDone();
      });
    });
  }

  // ── STATE ─────────────────────────────────────────────────────────────────
  function checkAllDone() {
    if (!isToday()) return;
    var cbs = Array.from(document.querySelectorAll('tbody input[type=checkbox]'));
    if (cbs.length && cbs.every(function(cb) { return cb.checked; })) {
      showToast('All done today! 🎊');
    }
  }

  function saveDay() {
    const cbs = document.querySelectorAll('tbody input[type=checkbox]');
    const state = Array.from(cbs).map(function (cb) { return cb.checked; });
    taskStorage().setItem(storageKey(), JSON.stringify(state));
    updateProgress();
  }

  function loadDay() {
    const raw = taskStorage().getItem(storageKey());
    const state = raw ? JSON.parse(raw) : null;
    document.querySelectorAll('tbody tr').forEach(function (row, i) {
      const cb = row.querySelector('input[type=checkbox]');
      if (!cb) return;
      cb.checked = state ? !!state[i] : false;
      row.classList.toggle('row-done', cb.checked);
    });
    updateProgress();
  }

  function updateProgress() {
    const cbs = Array.from(document.querySelectorAll('tbody input[type=checkbox]'));
    const total = cbs.length;
    const done  = cbs.filter(function (cb) { return cb.checked; }).length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    document.getElementById('dc-count').textContent = done + ' / ' + total + ' tasks';
    document.getElementById('dc-fill').style.width = pct + '%';
  }

  function parseRowMinutes(row) {
    const timeText = row.cells[1] ? row.cells[1].textContent.trim() : '';
    const m = timeText.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  function updateNowIndicator() {
    if (!isToday()) {
      var card = document.getElementById('now-card');
      if (card) card.style.display = 'none';
      return;
    }

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    var currentRow = null;

    for (var i = 0; i < rows.length; i++) {
      const taskMins = parseRowMinutes(rows[i]);
      if (taskMins === null) continue;
      const nextMins = rows[i + 1] ? parseRowMinutes(rows[i + 1]) : taskMins + 30;
      if (taskMins <= nowMins && nowMins < (nextMins || taskMins + 30)) {
        currentRow = rows[i];
        break;
      }
    }

    var card = document.getElementById('now-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'now-card';
      card.innerHTML =
        '<div class="now-card-dot"></div>' +
        '<div class="now-card-body">' +
          '<div class="now-card-label">NOW</div>' +
          '<div class="now-card-task"></div>' +
        '</div>' +
        '<div class="now-card-arrow">↑</div>';
      card.addEventListener('click', function () {
        var target = document.getElementById('now-card-target');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      document.body.appendChild(card);
    }

    if (!currentRow) {
      card.style.display = 'none';
      return;
    }

    // Mark target row for scroll
    document.querySelectorAll('tbody tr').forEach(function (r) { r.id = ''; });
    currentRow.id = 'now-card-target';

    const summary = currentRow.querySelector('.summary');
    const timeCell = currentRow.cells[1];
    const timeText = timeCell ? timeCell.textContent.trim() : '';
    card.querySelector('.now-card-task').textContent = (timeText ? timeText + ' — ' : '') + (summary ? summary.textContent : '');
    card.style.display = 'flex';
  }

  function triggerSnowflakes() {
    if (!document.getElementById('snowflake-style')) {
      var s = document.createElement('style');
      s.id = 'snowflake-style';
      s.textContent = '@keyframes sf-fall{0%{transform:translateY(-20px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) translateX(var(--sf-drift)) rotate(360deg);opacity:0}}';
      document.head.appendChild(s);
    }
    var colors = ['#7dd3fc','#bfdbfe','#e0f2fe','#ffffff','#93c5fd','#38bdf8'];
    for (var i = 0; i < 45; i++) {
      (function(i) {
        setTimeout(function() {
          var el = document.createElement('div');
          el.textContent = '❄';
          var drift = ((Math.random() - 0.5) * 140).toFixed(1);
          el.style.cssText = 'position:fixed;top:-24px;left:' + (Math.random()*100).toFixed(1) + 'vw;'
            + 'font-size:' + (13 + Math.random()*14).toFixed(1) + 'px;'
            + 'color:' + colors[Math.floor(Math.random()*colors.length)] + ';'
            + 'opacity:0.9;pointer-events:none;z-index:9998;'
            + '--sf-drift:' + drift + 'px;'
            + 'animation:sf-fall ' + (2.2 + Math.random()*2).toFixed(2) + 's linear forwards;';
          document.body.appendChild(el);
          setTimeout(function() { el.remove(); }, 4500);
        }, i * 35);
      })(i);
    }
  }

  var lastHtToastParams = null;
  var htToastTmr = null;
  function showToast(msg, duration, ack) {
    duration = duration || 2200;
    lastHtToastParams = { msg: msg, duration: duration, ack: ack };
    clearTimeout(htToastTmr);
    var existing = document.getElementById('ht-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ht-toast';
    if (ack) {
      toast.classList.add('ht-toast--ack');
      var snowflakeMatch = msg.match(/^❄️?\s*/);
      var icon = snowflakeMatch
        ? '<span style="background:rgba(0,0,0,0.7);border-radius:50%;width:40px;height:40px;display:inline-grid;place-items:center;flex-shrink:0;vertical-align:middle;"><span style="font-size:1.5rem;line-height:1;display:block;transform:translateY(-1px);">❄️</span></span>'
        : '';
      var text = snowflakeMatch ? msg.slice(snowflakeMatch[0].length) : msg;
      toast.innerHTML = icon + '<span>' + text + '</span>';
      var btn = document.createElement('button');
      btn.textContent = 'Got it';
      btn.style.cssText = 'background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.4);color:#4ade80;font-size:.8rem;font-weight:800;padding:6px 14px;border-radius:12px;cursor:pointer;flex-shrink:0;';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearTimeout(htToastTmr);
        toast.classList.remove('ht-toast--show');
      });
      toast.appendChild(btn);
    } else {
      toast.textContent = msg;
    }
    toast.addEventListener('click', function() {
      if (!toast.classList.contains('ht-toast--show') && lastHtToastParams) {
        showToast(lastHtToastParams.msg, lastHtToastParams.duration, lastHtToastParams.ack);
      }
    });
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('ht-toast--active', 'ht-toast--show'); }, 10);
    htToastTmr = setTimeout(function () { toast.classList.remove('ht-toast--show'); }, duration);
  }

  function updateCheckboxStates() {
    // no-op: future task blocking is handled in the change event
  }

  function renderDay() {
    document.getElementById('dc-label').textContent = formatLabel(currentDate);
    document.getElementById('dc-next').disabled = currentDate >= todayMidnight();
    loadDay();
    updateNowIndicator();
    updateCheckboxStates();
  }

  // ── DEBUG HELPER (console only) ───────────────────────────────────────────
  function exposeDebug() {
    window.dohDebug = window.dohDebug || {};
    // Schedule-page methods — extend the hub's dohDebug object (or stand alone)
    window.dohDebug.streakAdd = function(n) {
      var s = getStreak(); n = n || 1;
      s.count += n; s.last = todayISO(); setStreak(s);
      var p = pfx(); var best = parseInt(localStorage.getItem(p+'best_streak')||'0');
      if (s.count > best) localStorage.setItem(p+'best_streak', s.count);
      updateProfileBar(); console.log('Streak \u2192', s.count);
    };
    window.dohDebug.streakSet = function(n) {
      var s = getStreak(); s.count = n; s.last = todayISO(); setStreak(s);
      var p = pfx(); var best = parseInt(localStorage.getItem(p+'best_streak')||'0');
      if (n > best) localStorage.setItem(p+'best_streak', n);
      updateProfileBar(); console.log('Streak set to', n);
    };
    window.dohDebug.streakMissDay = function() {
      var s = getStreak(); var d = new Date(); d.setDate(d.getDate()-2);
      s.last = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      setStreak(s); console.log('Last streak set 2 days ago \u2014 reload to trigger audit');
    };
    window.dohDebug.streakReset = function() {
      setStreak({count:0,last:''}); updateProfileBar(); console.log('Streak reset');
    };
    window.dohDebug.bestReset = function() {
      localStorage.removeItem(pfx()+'best_streak'); console.log('Best streak reset');
    };
    window.dohDebug.freezeSet = function(n) {
      setFreezes(n==null?3:n); updateProfileBar(); console.log('Freezes \u2192', getFreezes());
    };
    window.dohDebug.freezeUse = function() {
      if (getFreezes() > 0) { setFreezes(getFreezes()-1); localStorage.setItem(pfx()+'freeze_uses', parseInt(localStorage.getItem(pfx()+'freeze_uses')||'0')+1); }
      triggerSnowflakes();
      showToast('\u2744\uFE0F Streak Freeze Used \u2014 Streak Protected! ('+getFreezes()+' Left)', 10000, true);
      updateProfileBar();
    };
    window.dohDebug.daysAdd = function(n) {
      n = n||1; var p = pfx(); var cur = parseInt(localStorage.getItem(p+'freeze_uses')||'0');
      localStorage.setItem(p+'freeze_uses', cur+n); console.log('Days protected \u2192', cur+n);
    };
    window.dohDebug.daysReset = function() {
      localStorage.setItem(pfx()+'freeze_uses','0'); console.log('Days protected reset');
    };
    window.dohDebug.toastFreeze   = function() { triggerSnowflakes(); showToast('\u2744\uFE0F Streak Freeze Used \u2014 Streak Protected! ('+getFreezes()+' Left)', 10000, true); };
    window.dohDebug.toastRankUp   = function() { showToast('\uD83C\uDF89 Rank Up: Biohacker!'); };
    window.dohDebug.toastAllDone  = function() { showToast('All Done Today! \uD83C\uDF8A'); };
    window.dohDebug.toastStreak   = function(n) { var s = getStreak(); showToast('\uD83D\uDD25 '+(n||s.count)+'-Day Streak! Keep It Going!'); };
    window.dohDebug.auditNow      = function() { auditStreak(); updateProfileBar(); console.log('auditStreak ran'); };
    window.dohDebug.help = function() {
      console.log([
        '\u2500\u2500\u2500 dohDebug (schedule page) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
        'Streak',
        '  .streakAdd(n=1)      increment streak by n',
        '  .streakSet(n)        set streak to exact value',
        '  .streakMissDay()     set last date 2 days ago \u2014 reload to trigger audit',
        '  .streakReset()       reset streak to 0',
        '  .auditNow()          run auditStreak() immediately',
        'Best Streak',
        '  .bestReset()         clear stored best streak',
        'Freezes',
        '  .freezeSet(n=3)      set freeze count (0-3)',
        '  .freezeUse()         consume a freeze + show toast',
        'Days Protected',
        '  .daysAdd(n=1)        increment days protected',
        '  .daysReset()         reset days protected to 0',
        'Toasts',
        '  .toastFreeze()       show freeze notification',
        '  .toastRankUp()       show rank-up notification',
        '  .toastAllDone()      show all-done notification',
        '  .toastStreak(n)      show streak milestone notification',
        '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
      ].join('\n'));
    };
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    auditStreak();
    buildProfileBar();
    buildDayBar();
    addCheckboxColumn();
    renderDay();
    if (isNotifEnabled()) savePageTasks();
    if (window.dohNotifications) window.dohNotifications.schedule();
    setInterval(function () { updateNowIndicator(); updateCheckboxStates(); }, 60000);
    document.body.style.opacity = '1';
    exposeDebug();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
