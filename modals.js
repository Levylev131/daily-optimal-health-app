// ─── MODAL SYSTEM ────────────────────────────────────────────────────────────
function showModal(html) {
  document.getElementById('modal-wrap').innerHTML =
    `<div class="modal-overlay" onclick="handleOverlayClick(event)">${html}</div>`;
}
function closeModal() { document.getElementById('modal-wrap').innerHTML = ''; }
function handleOverlayClick(e) { if(e.target.classList.contains('modal-overlay')) closeModal(); }

function showLevelsModal() {
  const isDegen = STATE.mode === 'degen';
  const lvls = LEVELS[isDegen ? 'degen' : 'health'];
  const curIdx = getLevel(isDegen).idx;
  const rows = lvls.map((l, i) => {
    const isCur = i === curIdx;
    const isUnlocked = STATE.xp >= l.min;
    return `<div class="lvl-row${isCur ? ' lvl-cur' : isUnlocked ? ' lvl-done' : ''}">
      <div class="lvl-num">${i + 1}</div>
      <div class="lvl-info">
        <div class="lvl-name">${l.name}</div>
        <div class="lvl-xp">${i === 0 ? 'Starting rank' : l.min + ' XP to unlock'}</div>
      </div>
      ${isCur ? '<div class="lvl-badge">▶ You</div>' : isUnlocked ? '<div class="lvl-badge lvl-badge-done">✓</div>' : ''}
    </div>`;
  }).join('');
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">${isDegen ? '💀' : '🏆'}</div>
    <div class="modal-title">${isDegen ? 'Degen Ranks' : 'Health Ranks'}</div>
    <div class="modal-sub">Earn XP by checking off daily tasks to climb the ranks.</div>
    <div class="lvl-list">${rows}</div>
  </div>`);
}

function showLoginModal() {
  const profiles = Object.values(getProfiles());
  const existingHTML = profiles.length ? `
    <div class="modal-divider">or pick an existing profile</div>
    <div class="profile-list">
      ${profiles.map(p=>`
        <div class="profile-item" onclick="switchProfile('${p.id}')">
          <div class="p-avatar" style="background:${p.color};font-size:${p.avatar?'1.1rem':'.82rem'}">${p.avatar || initials(p.name)}</div>
          <div>
            <div class="p-item-name">${p.name}</div>
            <div class="p-item-meta">Since ${new Date(p.created).toLocaleDateString()}</div>
          </div>
        </div>`).join('')}
    </div>` : '';

  showModal(`<div class="modal">
    <div class="modal-icon">🌿</div>
    <div class="modal-title">Save your progress</div>
    <div class="modal-sub">Enter your name to track your streak, XP, and daily completions across sessions.</div>
    <input class="modal-input" id="login-name" type="text" placeholder="Your name..."
      maxlength="30" onkeydown="if(event.key==='Enter') submitLogin()">
    <button class="modal-btn" onclick="submitLogin()">Get Started →</button>
    <button class="modal-btn-ghost" onclick="sessionStorage.setItem('doh_guest_ok','1');closeModal();renderHub()">Continue as Guest</button>
    <div class="modal-guest-note">Guest progress won't be saved when you close the browser.</div>
    ${existingHTML}
  </div>`);
  setTimeout(()=>document.getElementById('login-name')?.focus(), 60);
}

function submitLogin() {
  const el = document.getElementById('login-name');
  const name = el?.value.trim() || '';
  if (!name) { if(el){el.style.borderColor='#ef4444'; el.placeholder='Enter a name first...';} return; }
  const profile = createProfile(name);
  localStorage.setItem('doh_active_profile', profile.id);

  // Migrate any guest session task data to the new profile
  const guestKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k && k.startsWith('ht:guest:')) guestKeys.push(k);
  }
  guestKeys.forEach(k => {
    const newKey = k.replace('ht:guest:', `ht:${profile.id}:`);
    localStorage.setItem(newKey, sessionStorage.getItem(k));
    sessionStorage.removeItem(k);
  });

  loadState();
  closeModal();
  renderProfileBtn();
  renderHub();
}

function switchProfile(id) {
  // If switching away from guest, discard their session data
  if (!getActiveId()) {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) keys.push(sessionStorage.key(i));
    keys.forEach(k => { if (k && k.startsWith('ht:guest:')) sessionStorage.removeItem(k); });
    sessionStorage.removeItem('doh_guest_ok');
  }
  localStorage.setItem('doh_active_profile', id);
  loadState();
  closeModal();
  closeDropdown();
  renderProfileBtn();
  document.getElementById('sch-view').classList.remove('active');
  document.getElementById('hub-view').classList.add('active');
  renderHub();
  window.scrollTo(0,0);
}

function signOut() {
  localStorage.removeItem('doh_active_profile');
  loadState();
  closeDropdown();
  renderProfileBtn();
  document.getElementById('sch-view').classList.remove('active');
  document.getElementById('hub-view').classList.add('active');
  renderHub();
  window.scrollTo(0,0);
  showLoginModal();
}

function showSwitchModal() {
  closeDropdown();
  const profiles = Object.values(getProfiles());
  const activeId = getActiveId();
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">🔄</div>
    <div class="modal-title">Switch Profile</div>
    <div class="modal-sub">Select a profile or create a new one.</div>
    <div class="profile-list" style="margin-bottom:14px">
      ${profiles.map(p=>`
        <div class="profile-item ${p.id===activeId?'active-profile':''}">
          <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer" onclick="switchProfile('${p.id}')">
            <div class="p-avatar" style="background:${p.color};font-size:${p.avatar?'1.1rem':'.82rem'}">${p.avatar || initials(p.name)}</div>
            <div>
              <div class="p-item-name">${p.name}${p.id===activeId?' ✓':''}</div>
              <div class="p-item-meta">Since ${new Date(p.created).toLocaleDateString()}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="p-item-action" title="Reset data" onclick="showResetProfileModal('${p.id}')">↺</button>
            <button class="p-item-action p-item-action--del" title="Delete profile" onclick="showDeleteProfileModal('${p.id}')">✕</button>
          </div>
        </div>`).join('')}
    </div>
    <div class="modal-divider">create new</div>
    <input class="modal-input" id="new-pname" type="text" placeholder="New profile name..."
      maxlength="30" onkeydown="if(event.key==='Enter') addNewProfile()">
    <button class="modal-btn" onclick="addNewProfile()">Create Profile</button>
  </div>`);
}

function addNewProfile() {
  const el = document.getElementById('new-pname');
  const name = el?.value.trim() || '';
  if (!name) { if(el){el.style.borderColor='#ef4444';} return; }
  const profile = createProfile(name);
  switchProfile(profile.id);
  toast(`Welcome, ${name}! 🎉`);
}

function showExportModal() {
  closeDropdown();
  const pid = getActiveId();
  if (!pid) return;
  const data = { profile: getActiveProfile(), keys: {} };
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(`doh_${pid}_`)) data.keys[k] = localStorage.getItem(k);
  }
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">📤</div>
    <div class="modal-title">Export / Import</div>
    <div class="modal-sub">Copy this code to restore your progress on another device.</div>
    <textarea class="export-code" id="export-code" readonly>${code}</textarea>
    <button class="modal-btn" onclick="copyExport()">Copy Code</button>
    <div class="modal-divider">import on this device</div>
    <textarea class="export-code" id="import-code" placeholder="Paste your code here..."></textarea>
    <button class="modal-btn-sec" onclick="importData()">Import →</button>
  </div>`);
}

function copyExport() {
  const code = document.getElementById('export-code')?.value || '';
  navigator.clipboard.writeText(code).then(()=>toast('Copied! ✓')).catch(()=>{
    document.getElementById('export-code').select();
    document.execCommand('copy');
    toast('Copied! ✓');
  });
}

function importData() {
  const raw = document.getElementById('import-code')?.value.trim() || '';
  if (!raw) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!data.profile || !data.keys) throw new Error('invalid');
    const profiles = getProfiles();
    profiles[data.profile.id] = data.profile;
    localStorage.setItem('doh_profiles', JSON.stringify(profiles));
    Object.entries(data.keys).forEach(([k,v]) => localStorage.setItem(k,v));
    switchProfile(data.profile.id);
    toast(`Welcome back, ${data.profile.name}! ✓`);
  } catch { toast('Invalid code ✗'); }
}

// ─── DANGER ZONE MODALS ───────────────────────────────────────────────────────
function showResetAllModal() {
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">🗑️</div>
    <div class="modal-title" style="color:#ef4444">Reset All Data</div>
    <div class="modal-sub">This will permanently delete <strong>every profile</strong>, all XP, streaks, task history, and settings. There is no undo.</div>
    <div class="danger-confirm-box">Type <strong>RESET</strong> to confirm</div>
    <input class="modal-input" id="reset-confirm-input" type="text" placeholder="Type RESET here..." autocomplete="off">
    <button class="modal-btn modal-btn--danger" onclick="confirmResetAll()">Wipe Everything</button>
    <button class="modal-btn-sec" onclick="closeModal()">Cancel</button>
  </div>`);
  setTimeout(() => document.getElementById('reset-confirm-input')?.focus(), 60);
}

function confirmResetAll() {
  const val = document.getElementById('reset-confirm-input')?.value.trim();
  if (val !== 'RESET') {
    const el = document.getElementById('reset-confirm-input');
    if (el) { el.style.borderColor = '#ef4444'; el.value = ''; el.placeholder = 'You must type RESET exactly...'; }
    return;
  }
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  keys.forEach(k => { if (k.startsWith('doh_') || k.startsWith('ht:')) localStorage.removeItem(k); });
  closeModal();
  location.reload();
}

function showResetProfileModal(id) {
  const p = getProfiles()[id];
  if (!p) return;
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">↺</div>
    <div class="modal-title">Reset Profile</div>
    <div class="modal-sub">Wipe all XP, streaks, and task history for <strong>${p.name}</strong>? The profile itself will remain.</div>
    <button class="modal-btn modal-btn--danger" onclick="confirmResetProfile('${id}')">Yes, Reset</button>
    <button class="modal-btn-sec" onclick="closeModal()">Cancel</button>
  </div>`);
}

function confirmResetProfile(id) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  keys.forEach(k => {
    if (k.startsWith(`doh_${id}_`) || k.startsWith(`ht:${id}:`)) localStorage.removeItem(k);
  });
  // Also reset freezes on the profile object
  const profiles = getProfiles();
  if (profiles[id]) { profiles[id].freezes = 0; localStorage.setItem('doh_profiles', JSON.stringify(profiles)); }
  closeModal();
  if (getActiveId() === id) { loadState(); renderProfileBtn(); renderHub(); }
  toast('Profile reset ✓');
}

function showDeleteProfileModal(id) {
  const p = getProfiles()[id];
  if (!p) return;
  showModal(`<div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-icon">🗑️</div>
    <div class="modal-title" style="color:#ef4444">Delete Profile</div>
    <div class="modal-sub">Permanently delete <strong>${p.name}</strong> and all their data? This cannot be undone.</div>
    <button class="modal-btn modal-btn--danger" onclick="confirmDeleteProfile('${id}')">Yes, Delete</button>
    <button class="modal-btn-sec" onclick="closeModal()">Cancel</button>
  </div>`);
}

function confirmDeleteProfile(id) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  keys.forEach(k => {
    if (k.startsWith(`doh_${id}_`) || k.startsWith(`ht:${id}:`)) localStorage.removeItem(k);
  });
  const profiles = getProfiles();
  delete profiles[id];
  localStorage.setItem('doh_profiles', JSON.stringify(profiles));
  if (getActiveId() === id) localStorage.removeItem('doh_active_profile');
  closeModal();
  loadState();
  renderProfileBtn();
  document.getElementById('sch-view').classList.remove('active');
  document.getElementById('profile-view').classList.remove('active');
  document.getElementById('hub-view').classList.add('active');
  renderHub();
  window.scrollTo(0, 0);
  if (!getActiveId()) showLoginModal();
}
