(function () {
  // ── LEVELS (mirrors index.html) ───────────────────────────────────────────
  const LEVELS = [
    {name:'Couch Potato',      min:0},
    {name:'Weekend Warrior',   min:150},
    {name:'Health Curious',    min:400},
    {name:'Health Enthusiast', min:800},
    {name:'Optimizer',         min:1400},
    {name:'Biohacker',         min:2200},
    {name:'Longevity Legend',  min:3500},
  ];

  // ── PROFILE HELPERS ───────────────────────────────────────────────────────
  function getActiveId()  { return localStorage.getItem('doh_active_profile') || null; }
  function getProfiles()  { return JSON.parse(localStorage.getItem('doh_profiles') || '{}'); }
  function pfx()          { const id = getActiveId(); return id ? `doh_${id}_` : null; }

  function getXP()        { const p = pfx(); return p ? parseInt(localStorage.getItem(p+'xp') || '0') : 0; }
  function getStreak()    { const p = pfx(); return p ? JSON.parse(localStorage.getItem(p+'streak') || '{"count":0,"last":""}') : {count:0,last:''}; }

  function setXP(val)     { const p = pfx(); if(p) localStorage.setItem(p+'xp', Math.max(0,val)); }
  function setStreak(obj) { const p = pfx(); if(p) localStorage.setItem(p+'streak', JSON.stringify(obj)); }

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

  function touchStreak() {
    const today = todayISO();
    const s = getStreak();
    if (s.last === today) return;
    const yd = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
    s.count = (s.last === ydStr) ? s.count + 1 : 1;
    s.last = today;
    setStreak(s);
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

  function storageKey() { return 'ht:' + pageKey + ':' + toISO(currentDate); }

  // ── BUILD PROFILE BAR ─────────────────────────────────────────────────────
  function buildProfileBar() {
    const bar = document.createElement('div');
    bar.id = 'pf-bar';
    updateProfileBar(bar);
    const back = document.querySelector('.back');
    back.parentNode.insertBefore(bar, back.nextSibling);
  }

  function updateProfileBar(bar) {
    bar = bar || document.getElementById('pf-bar');
    if (!bar) return;

    const activeId = getActiveId();
    const profiles = getProfiles();
    const profile  = activeId ? profiles[activeId] : null;

    if (!profile) {
      bar.innerHTML = `<a href="index.html" class="pf-home-btn">🏠 Home — set up profile there</a>`;
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
      <div class="pf-avatar" style="background:${profile.color}">${initials(profile.name)}</div>
      <div class="pf-info">
        <div class="pf-name">${profile.name}</div>
        <div class="pf-level">${lv.name}</div>
        <div class="pf-xp-row">
          <div class="pf-xp-track"><div class="pf-xp-fill" style="width:${pct.toFixed(1)}%"></div></div>
          <span class="pf-xp-num">${xp} XP</span>
        </div>
      </div>
      <div class="pf-streak">🔥 ${streak.count}</div>
    `;
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
          setXP(getXP() + 10);
          touchStreak();
        }
      });
      saveDay();
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
          const xp = getXP();
          setXP(cb.checked ? xp + 10 : xp - 10);
          if (cb.checked) touchStreak();
          updateProfileBar();
        }
        saveDay();
      });
    });
  }

  // ── STATE ─────────────────────────────────────────────────────────────────
  function saveDay() {
    const cbs = document.querySelectorAll('tbody input[type=checkbox]');
    const state = Array.from(cbs).map(function (cb) { return cb.checked; });
    localStorage.setItem(storageKey(), JSON.stringify(state));
    updateProgress();
  }

  function loadDay() {
    const raw = localStorage.getItem(storageKey());
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

  function showToast(msg) {
    var existing = document.getElementById('ht-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ht-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('ht-toast--show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('ht-toast--show');
      setTimeout(function () { toast.remove(); }, 400);
    }, 2200);
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

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    buildProfileBar();
    buildDayBar();
    addCheckboxColumn();
    renderDay();
    setInterval(function () { updateNowIndicator(); updateCheckboxStates(); }, 60000);
    document.body.style.opacity = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
