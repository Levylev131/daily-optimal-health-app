// ─── PROFILE CRUD ─────────────────────────────────────────────────────────────
function getProfiles()      { return JSON.parse(localStorage.getItem('doh_profiles') || '{}'); }
function getActiveId()      { return localStorage.getItem('doh_active_profile') || null; }
function getActiveProfile() { const id=getActiveId(); return id ? getProfiles()[id] : null; }

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

function createProfile(name) {
  const profiles = getProfiles();
  const id = 'p_' + Date.now();
  const used = Object.values(profiles).map(p=>p.color);
  const color = AVATAR_COLORS.find(c=>!used.includes(c)) || AVATAR_COLORS[0];
  profiles[id] = { id, name: name.trim(), color, created: new Date().toISOString(), freezes: 0 };
  localStorage.setItem('doh_profiles', JSON.stringify(profiles));
  return profiles[id];
}

function initials(name) {
  return name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
}

function storagePrefix() {
  const id = getActiveId();
  return id ? `doh_${id}_` : 'doh_guest_';
}

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
let pfDraftColor  = null;
let pfDraftAvatar = null;
let pfStatFlipped = {};

function getBestStreak() {
  const stored = parseInt(localStorage.getItem(`${storagePrefix()}best_streak`) || '0');
  return Math.max(stored, STATE.streak.count);
}
function getFreezeUses() {
  return parseInt(localStorage.getItem(`${storagePrefix()}freeze_uses`) || '0');
}
function incFreezeUses() {
  localStorage.setItem(`${storagePrefix()}freeze_uses`, getFreezeUses() + 1);
}
function toggleStatCard(name) {
  pfStatFlipped[name] = !pfStatFlipped[name];
  renderProfilePage();
}

function openProfile() {
  closeDropdown();
  const p = getActiveProfile();
  if (!p) { showLoginModal(); return; }
  pfDraftColor  = p.color;
  pfDraftAvatar = p.avatar || null;
  document.getElementById('hub-view').classList.remove('active');
  document.getElementById('sch-view').classList.remove('active');
  document.getElementById('profile-view').classList.add('active');
  renderProfilePage();
  window.scrollTo(0, 0);
}

function renderProfilePage() {
  const p = getActiveProfile();
  if (!p) return;
  const stats = allTimeStats();
  const lv = getLevel(STATE.mode === 'degen');
  const since = new Date(p.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const currentRank = getLevel(STATE.mode === 'degen').idx + 1;
  const iconBtns = AVATAR_ICONS.map(({icon, minRank}) => {
    const locked = minRank > currentRank;
    const rankName = minRank > 0 ? (LEVELS.health[minRank - 1]?.name || `Rank ${minRank}`) : '';
    const tip = locked ? `<div class="avatar-icon-tip">Rank ${minRank} — ${rankName}</div>` : '';
    return `<div class="avatar-icon-wrap">
      <div class="avatar-icon-btn ${pfDraftAvatar===icon?'active':''} ${locked?'locked':''}"
        onclick="${locked?'':` pickAvatar('${icon}')`}">${icon}</div>
      ${tip}
    </div>`;
  }).join('');

  const swatches = AVATAR_COLORS.map(c =>
    `<div class="color-swatch ${pfDraftColor===c?'active':''}"
      style="background:${c}"
      onclick="pickColor('${c}')"></div>`
  ).join('');

  const goalOptions = [
    { id:'', label:'— Not set —' },
    { id:'longevity',        label:'🌿 Longevity' },
    { id:'muscle',           label:'💪 Muscle Building' },
    { id:'cardio',           label:'❤️ Cardiovascular' },
    { id:'bone',             label:'🦴 Bone Health' },
    { id:'brain',            label:'🧠 Brain Health' },
    { id:'digestive',        label:'🥦 Digestive Health' },
    { id:'degenerates',      label:'🎮 Degenerates' },
    { id:'degenerates-plus', label:'💀 Degenerates ++' },
    { id:'super-degenerate', label:'🔥 SUPER Degenerate' },
  ];

  document.getElementById('profile-view').innerHTML = `<div id="profile-page">
    <button class="sch-back" onclick="goHub()">← Back</button>

    <div class="pf-hero">
      <div class="pf-avatar-wrap" onclick="document.getElementById('pf-color-picker').style.display='flex'">
        <div class="pf-avatar" id="pf-avatar-preview" style="background:${pfDraftColor};font-size:${pfDraftAvatar?'2.2rem':'1.8rem'}">${pfDraftAvatar || initials(p.name)}</div>
        <div class="pf-avatar-edit">✏️</div>
      </div>
      <div class="pf-name">${p.name}</div>
      <div class="pf-since">Member since ${since} · ${lv.name}</div>
      <div class="pf-color-picker" id="pf-color-picker" style="display:none">
        <div class="pf-picker-label">Avatar</div>
        <div class="pf-picker-row">${iconBtns}</div>
        <div class="pf-picker-label">Color</div>
        <div class="pf-picker-row">${swatches}</div>
      </div>
    </div>

    <div class="pf-section">
      <div class="pf-section-label">Account</div>
      <div class="pf-card">
        <div class="pf-row">
          <div class="pf-row-icon">👤</div>
          <div class="pf-row-label">Display name</div>
          <input class="pf-row-input" id="pf-name" type="text" value="${p.name}" maxlength="30" placeholder="Your name">
        </div>
        <div class="pf-row">
          <div class="pf-row-icon">✉️</div>
          <div class="pf-row-label">Email</div>
          <input class="pf-row-input" id="pf-email" type="email" value="${p.email||''}" placeholder="Optional — for future notifications">
        </div>
      </div>
    </div>

    <div class="pf-section">
      <div class="pf-section-label">Preferences</div>
      <div class="pf-card">
        <div class="pf-row">
          <div class="pf-row-icon">🎯</div>
          <div class="pf-row-label">Primary goal</div>
          <select class="pf-row-select" id="pf-goal">
            ${goalOptions.map(o=>`<option value="${o.id}" ${(p.primaryGoal||'')===o.id?'selected':''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="pf-row">
          <div class="pf-row-icon">🌗</div>
          <div class="pf-row-label">Default mode</div>
          <select class="pf-row-select" id="pf-mode">
            <option value="health" ${STATE.mode==='health'?'selected':''}>🌿 Health</option>
            <option value="degen"  ${STATE.mode==='degen' ?'selected':''}>💀 Degenerate</option>
            <option value="elder"  ${STATE.mode==='elder' ?'selected':''}>🧓 Elder</option>
          </select>
        </div>
        <div class="pf-row">
          <div class="pf-row-icon">🔔</div>
          <div class="pf-row-label">Reminder time</div>
          <input class="pf-row-input" id="pf-reminder" type="time" value="${p.reminderTime||''}"
            style="color-scheme:dark">
        </div>
      </div>
    </div>

    <div class="pf-section">
      <div class="pf-section-label">Your Stats <span style="font-size:.62rem;color:var(--muted);font-weight:400;margin-left:6px;opacity:.4">tap to flip</span></div>
      <div class="pf-stats-grid">${(()=>{
        const isDegen = STATE.mode === 'degen';
        const lvls = LEVELS[isDegen ? 'degen' : 'health'];
        const nextLv = lvls[lv.idx + 1];
        const xpToNext = nextLv ? nextLv.min - STATE.xp : null;
        const rankPct = nextLv ? Math.min(100, Math.round((STATE.xp - lv.min) / (nextLv.min - lv.min) * 100)) : 100;
        const bestStreak = getBestStreak();
        const freezeUses = getFreezeUses();
        const f = pfStatFlipped;
        return [
          // Streak
          `<div class="pf-stat-card" onclick="toggleStatCard('streak')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.streak
                ? `<span style="font-weight:700;color:var(--acc)">🔥 Day Streak</span>
                   <span>Check off at least one task per day to keep your streak alive.</span>
                   <span style="color:#f87171;margin-top:2px">Missing a day resets it to zero — unless you have a freeze.</span>`
                : `<span style="font-weight:700;color:var(--acc)">🏅 Best Streak</span>
                   <span>Your highest streak ever achieved. Can you beat it?</span>
                   <span style="color:#f59e0b;margin-top:2px">Best streaks are earned through consistency, not perfection.</span>`}
            </div>
            ${!f.streak
              ? `<div class="pf-stat-val" style="font-size:2.4rem;margin-left:-12px;margin-top:-6px">🔥</div><div class="pf-stat-body" style="margin-top:-6px"><div class="pf-stat-num" style="font-size:1.7rem">${STATE.streak.count}</div><div class="pf-stat-lbl">Day Streak</div></div>`
              : `<div class="pf-stat-val" style="font-size:2.4rem;margin-left:-12px;margin-top:-6px">🏅</div><div class="pf-stat-body" style="margin-top:-6px"><div class="pf-stat-num" style="font-size:1.7rem">${bestStreak}</div><div class="pf-stat-lbl">Best Streak</div></div>`}
          </div>`,
          // Tasks
          `<div class="pf-stat-card" onclick="toggleStatCard('tasks')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.tasks
                ? `<span style="font-weight:700;color:var(--acc)">✅ Tasks Done</span>
                   <span>Your all-time total of completed tasks across every schedule.</span>
                   <span style="color:#34d399;margin-top:2px">Every task counts, no matter how small.</span>`
                : `<span style="font-weight:700;color:var(--acc)">📆 Tasks This Week</span>
                   <span>Tasks completed in the last 7 days.</span>
                   <span style="color:#34d399;margin-top:2px">A strong week builds an unstoppable habit.</span>`}
            </div>
            ${!f.tasks
              ? `<div class="pf-stat-val" style="font-size:2rem;margin-left:-12px;margin-top:-6px">✅</div><div class="pf-stat-body" style="margin-top:-6px"><div class="pf-stat-num" style="font-size:1.7rem">${stats.tasks}</div><div class="pf-stat-lbl">Tasks Done</div></div>`
              : `<div class="pf-stat-val" style="font-size:2rem">📆</div><div class="pf-stat-body"><div class="pf-stat-num">${stats.tasksThisWeek}</div><div class="pf-stat-lbl">Tasks This Week</div></div>`}
          </div>`,
          // Rank
          `<div class="pf-stat-card" onclick="toggleStatCard('rank')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.rank
                ? `<span style="font-weight:700;color:var(--acc)">${isDegen ? '💀' : '🏆'} Current Rank</span>
                   <span>Your rank is determined by total XP earned across all schedules.</span>
                   <span style="color:#a78bfa;margin-top:2px">Rank ${lv.idx + 1} of 13 — keep earning XP to climb higher.</span>`
                : `<span style="font-weight:700;color:var(--acc)">📈 Next Rank Progress</span>
                   <span>${nextLv ? `${rankPct}% of the way to ${nextLv.name}.` : 'You\'ve reached the top rank.'}</span>
                   <span style="color:#a78bfa;margin-top:2px">${nextLv ? `${STATE.xp} / ${nextLv.min} XP` : '🌟 Maximum rank achieved.'}</span>`}
            </div>
            ${!f.rank
              ? `<div class="pf-stat-val" style="font-size:2rem;margin-left:-6px">${isDegen ? '💀' : '🏆'}</div><div class="pf-stat-body" style="margin-left:-6px"><div class="pf-stat-num" style="font-size:${lv.name.length>12?'.72rem':'.85rem'}">${lv.name}</div><div class="pf-stat-lbl">Current Rank</div></div>`
              : `<div class="pf-stat-val" style="font-size:2rem;margin-left:12px">📈</div><div class="pf-stat-body" style="align-items:center;margin-left:-18px;text-align:center"><div class="pf-stat-num" style="font-size:1.2rem">${nextLv ? rankPct+'%' : '🌟'}</div><div class="pf-stat-lbl">Next Rank Progress</div></div>`}
          </div>`,
          // Freezes
          `<div class="pf-stat-card" onclick="toggleStatCard('freeze')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.freeze
                ? `<span style="font-weight:700;color:var(--acc)">❄️ Streak Freezes</span>
                   <span>If you miss a day, a freeze is spent automatically — your streak stays intact.</span>
                   <span style="color:#f59e0b;margin-top:2px">Level up to earn one. Max 3 at a time.</span>`
                : `<span style="font-weight:700;color:var(--acc)">🛡️ Days Protected</span>
                   <span>Total times a streak freeze automatically saved your streak.</span>
                   <span style="color:#60a5fa;margin-top:2px">Each one represents a day you almost gave up — but didn't.</span>`}
            </div>
            ${!f.freeze
              ? `<div class="pf-stat-val" style="font-size:2rem">❄️</div><div class="pf-stat-body"><div class="pf-stat-num">${getFreezes()}/3</div><div class="pf-stat-lbl">Streak Freezes</div></div>`
              : `<div class="pf-stat-val" style="font-size:2rem">🛡️</div><div class="pf-stat-body"><div class="pf-stat-num">${freezeUses}</div><div class="pf-stat-lbl">Days Protected</div></div>`}
          </div>`,
          // Days Active
          `<div class="pf-stat-card" onclick="toggleStatCard('days')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.days
                ? `<span style="font-weight:700;color:var(--acc)">📅 Days Active</span>
                   <span>Total unique days you've completed at least one task.</span>
                   <span style="color:#60a5fa;margin-top:2px">Consistency over time is the real secret to progress.</span>`
                : `<span style="font-weight:700;color:var(--acc)">🗓️ Active This Month</span>
                   <span>Days with at least one task completed so far this month.</span>
                   <span style="color:#60a5fa;margin-top:2px">Aim to make every day count this month.</span>`}
            </div>
            ${!f.days
              ? `<div class="pf-stat-val" style="font-size:1.8rem;margin-left:-12px;margin-top:-6px">📅</div><div class="pf-stat-body" style="margin-left:0px;margin-top:-6px"><div class="pf-stat-num" style="font-size:1.7rem">${stats.daysActive}</div><div class="pf-stat-lbl">Days Active</div></div>`
              : `<div class="pf-stat-val" style="font-size:1.8rem">🗓️</div><div class="pf-stat-body"><div class="pf-stat-num" style="font-size:1.7rem">${stats.daysThisMonth}</div><div class="pf-stat-lbl">Active This Month</div></div>`}
          </div>`,
          // XP
          `<div class="pf-stat-card" onclick="toggleStatCard('xp')">
            <span class="pf-stat-toggle">↕</span>
            <div class="pf-stat-tip">
              ${!f.xp
                ? `<span style="font-weight:700;color:var(--acc)">⚡ Total XP</span>
                   <span>Earned by completing tasks. +10 XP for health tasks, +15 XP for degen tasks.</span>
                   <span style="color:#f59e0b;margin-top:2px">XP determines your rank and unlocks profile icons.</span>`
                : `<span style="font-weight:700;color:var(--acc)">🎯 XP to Next Rank</span>
                   <span>${nextLv ? `Earn ${xpToNext} more XP to reach ${nextLv.name}.` : 'You have reached the maximum rank.'}</span>
                   <span style="color:#f59e0b;margin-top:2px">${nextLv ? 'Keep going — you\'re almost there.' : '🌟 Nothing left to prove.'}</span>`}
            </div>
            ${!f.xp
              ? `<div class="pf-stat-val" style="font-size:2rem;margin-left:-18px;margin-top:-6px">⚡</div><div class="pf-stat-body" style="margin-left:-18px;margin-top:-6px"><div class="pf-stat-num">${STATE.xp} XP</div><div class="pf-stat-lbl">Total XP</div></div>`
              : `<div class="pf-stat-val" style="font-size:1.8rem;margin-left:-6px;margin-top:-6px">${xpToNext !== null ? '🎯' : '🌟'}</div><div class="pf-stat-body" style="margin-left:-6px;margin-top:-6px"><div class="pf-stat-num" style="font-size:${xpToNext!==null&&xpToNext>9999?'.85rem':'1.2rem'}">${xpToNext !== null ? xpToNext+' XP' : 'MAX'}</div><div class="pf-stat-lbl">XP to Next Rank</div></div>`}
          </div>`
        ].join('');
      })()}</div>
    </div>

    <div class="pf-section">
      <div class="pf-section-label">Activity — last 20 weeks</div>
      <div class="pf-card" style="padding:16px 18px">
        ${renderHeatmap()}
      </div>
    </div>

    <button class="pf-save" onclick="saveProfile()">Save Changes</button>

    <div class="pf-section pf-danger-zone">
      <div class="pf-section-label" style="color:#ef4444">⚠️ Danger Zone</div>
      <div class="pf-card" style="border-color:rgba(239,68,68,.25)">
        <div class="pf-danger-row">
          <div>
            <div class="pf-danger-title">Reset this profile</div>
            <div class="pf-danger-desc">Wipes all XP, streaks, and task history for <strong>${p.name}</strong>. Profile stays.</div>
          </div>
          <button class="pf-danger-btn" onclick="showResetProfileModal('${p.id}')">Reset</button>
        </div>
        <div class="pf-danger-divider"></div>
        <div class="pf-danger-row">
          <div>
            <div class="pf-danger-title">Delete this profile</div>
            <div class="pf-danger-desc">Permanently removes <strong>${p.name}</strong> and all their data.</div>
          </div>
          <button class="pf-danger-btn" onclick="showDeleteProfileModal('${p.id}')">Delete</button>
        </div>
        <div class="pf-danger-divider"></div>
        <div class="pf-danger-row">
          <div>
            <div class="pf-danger-title">Reset all data</div>
            <div class="pf-danger-desc">Wipes every profile, all task history, XP, and streaks. Cannot be undone.</div>
          </div>
          <button class="pf-danger-btn pf-danger-btn--red" onclick="showResetAllModal()">Reset All</button>
        </div>
      </div>
    </div>
  </div>`;
}

function pickColor(color) {
  pfDraftColor = color;
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.style.background === color || s.style.backgroundColor === color);
  });
  const preview = document.getElementById('pf-avatar-preview');
  if (preview) preview.style.background = color;
}

function pickAvatar(icon) {
  const data = AVATAR_ICONS.find(i => i.icon === icon);
  if (data && data.minRank > getLevel(STATE.mode === 'degen').idx + 1) return;
  pfDraftAvatar = pfDraftAvatar === icon ? null : icon; // tap same icon to deselect
  document.querySelectorAll('.avatar-icon-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === pfDraftAvatar);
  });
  const preview = document.getElementById('pf-avatar-preview');
  if (preview) {
    preview.textContent = pfDraftAvatar || initials(getActiveProfile()?.name || '');
    preview.style.fontSize = pfDraftAvatar ? '2.2rem' : '1.8rem';
  }
}

function saveProfile() {
  const p = getActiveProfile();
  if (!p) return;
  const name    = document.getElementById('pf-name')?.value.trim()     || p.name;
  const email   = document.getElementById('pf-email')?.value.trim()    || '';
  const goal    = document.getElementById('pf-goal')?.value            || '';
  const mode    = document.getElementById('pf-mode')?.value            || STATE.mode;
  const reminder= document.getElementById('pf-reminder')?.value        || '';

  if (!name) { toast('Name cannot be empty ✗'); return; }

  const profiles = getProfiles();
  profiles[p.id] = { ...p, name, email, primaryGoal: goal, reminderTime: reminder, color: pfDraftColor || p.color, avatar: pfDraftAvatar };
  localStorage.setItem('doh_profiles', JSON.stringify(profiles));

  if (mode !== STATE.mode) setMode(mode);

  renderProfileBtn();
  toast('Profile saved ✓');
  // Refresh the page to reflect name/color changes
  renderProfilePage();
}

// ─── PROFILE BUTTON + DROPDOWN ───────────────────────────────────────────────
function renderProfileBtn() {
  const btn = document.getElementById('profile-btn');
  const p = getActiveProfile();
  if (p) {
    btn.textContent = p.avatar || initials(p.name);
    btn.style.background = p.color;
    btn.style.color = '#000';
    btn.style.fontSize = p.avatar ? '1.2rem' : '.82rem';
    btn.title = p.name;
    btn.style.border = `2px solid ${p.color}`;
  } else {
    btn.textContent = '👤';
    btn.style.background = 'var(--glass)';
    btn.style.color = 'var(--muted)';
    btn.title = 'Log in';
    btn.style.border = '2px solid var(--glass-b)';
    btn.style.fontSize = '.9rem';
  }
}

function toggleDropdown() {
  if (document.getElementById('profile-dropdown')) { closeDropdown(); return; }
  const p = getActiveProfile();
  const dd = document.createElement('div');
  dd.id = 'profile-dropdown';
  dd.className = 'p-dropdown';
  if (p) {
    dd.innerHTML = `
      <div class="p-dd-name">👤 ${p.name}</div>
      <div class="p-dd-item" onclick="openProfile()">🪪 View Profile</div>
      <div class="p-dd-item" onclick="showExportModal()">📤 Export / Import data</div>
      <div class="p-dd-item" onclick="showSwitchModal()">🔄 Switch profile</div>
      <div class="p-dd-item danger" onclick="signOut()">← Sign out</div>
      <div class="p-dd-item danger" onclick="closeDropdown();showResetAllModal()">🗑️ Reset all data</div>`;
  } else {
    dd.innerHTML = `<div class="p-dd-item" onclick="closeDropdown();showLoginModal()">→ Log in / Create profile</div>`;
  }
  document.body.appendChild(dd);
}

function closeDropdown() { document.getElementById('profile-dropdown')?.remove(); }
