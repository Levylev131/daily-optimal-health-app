// ─── STATE ────────────────────────────────────────────────────────────────────
const STATE = {
  mode: localStorage.getItem('doh_mode') || 'health',
  xp: 0,
  streak: { count: 0, last: '' },
};

function loadState() {
  const pfx = storagePrefix();
  STATE.xp     = parseInt(localStorage.getItem(`${pfx}xp`) || '0');
  STATE.streak = JSON.parse(localStorage.getItem(`${pfx}streak`) || '{"count":0,"last":""}');
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
let viewDate = null; // null = today; 'YYYY-MM-DD' for past days

function dateKey(d) {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function todayKey() { return dateKey(); }

function isViewingToday() { return !viewDate || viewDate === todayKey(); }

function activeKey() { return viewDate || todayKey(); }

function formatDayLabel() {
  if (isViewingToday()) return '▶ Today';
  const dt = new Date(viewDate + 'T00:00:00');
  const yd = new Date(); yd.setDate(yd.getDate()-1);
  const ydStr = dateKey(yd);
  const lbl = dt.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  return viewDate === ydStr ? 'Yesterday — ' + lbl : lbl;
}

function schPrevDay(goalId) {
  const base = viewDate ? new Date(viewDate + 'T00:00:00') : new Date();
  base.setDate(base.getDate() - 1);
  viewDate = dateKey(base);
  renderSchedule(goalId);
  window.scrollTo(0,0);
}

function schNextDay(goalId) {
  if (isViewingToday()) return;
  const base = new Date(viewDate + 'T00:00:00');
  base.setDate(base.getDate() + 1);
  const next = dateKey(base);
  viewDate = next === todayKey() ? null : next;
  renderSchedule(goalId);
  window.scrollTo(0,0);
}

function getChecked(goalId) {
  const raw = localStorage.getItem(`${storagePrefix()}${activeKey()}_${goalId}`);
  return new Set(raw ? JSON.parse(raw) : []);
}

function saveChecked(goalId, set) {
  localStorage.setItem(`${storagePrefix()}${activeKey()}_${goalId}`, JSON.stringify([...set]));
}

function addXP(amount) {
  const xpBefore = STATE.xp;
  STATE.xp = Math.max(0, STATE.xp + amount);
  localStorage.setItem(`${storagePrefix()}xp`, STATE.xp);
  if (amount > 0) {
    const isDegen = STATE.mode === 'degen';
    const lvls = LEVELS[isDegen ? 'degen' : 'health'];
    const idxFor = xp => { for(let i=lvls.length-1;i>=0;i--) if(xp>=lvls[i].min) return i; return 0; };
    if (idxFor(STATE.xp) > idxFor(xpBefore)) {
      const lv = getLevel(isDegen);
      const freezes = getFreezes();
      if (freezes < 3) {
        setFreezes(freezes + 1);
        toast(`🎉 Rank up: ${lv.name}! +1 ❄️ streak freeze (${freezes + 1}/3)`);
      } else {
        toast(`🎉 Rank up: ${lv.name}!`);
      }
    }
  }
}

function touchStreak() {
  const today = dateKey();
  if (STATE.streak.last === today) return;
  const d = new Date(); d.setDate(d.getDate()-1);
  const yd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  if (STATE.streak.last !== yd && STATE.streak.last !== '') {
    // Missed at least one day — try to use a freeze
    const freezes = getFreezes();
    if (freezes > 0) {
      setFreezes(freezes - 1);
      incFreezeUses();
      STATE.streak.count += 1;
      STATE.streak.last = today;
      localStorage.setItem(`${storagePrefix()}streak`, JSON.stringify(STATE.streak));
      toast(`❄️ Streak freeze used — streak protected! (${freezes - 1} left)`);
      return;
    }
  }
  STATE.streak.count = (STATE.streak.last === yd) ? STATE.streak.count + 1 : 1;
  STATE.streak.last = today;
  localStorage.setItem(`${storagePrefix()}streak`, JSON.stringify(STATE.streak));
  // Track best streak
  if (STATE.streak.count > getBestStreak()) {
    localStorage.setItem(`${storagePrefix()}best_streak`, STATE.streak.count);
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function parseHour(t) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  if (m[3].toUpperCase()==='PM' && h!==12) h+=12;
  if (m[3].toUpperCase()==='AM' && h===12) h=0;
  return h + min/60;
}

function currentTaskIdx(tasks) {
  const now = new Date().getHours() + new Date().getMinutes()/60;
  let best=-1, diff=Infinity;
  tasks.forEach((t,i)=>{
    const h=parseHour(t.time), d=now-h;
    if(d>=0 && d<diff){ diff=d; best=i; }
  });
  return best;
}

function getLevel(isDegenMode) {
  const lvls = LEVELS[isDegenMode?'degen':'health'];
  for(let i=lvls.length-1;i>=0;i--) if(STATE.xp>=lvls[i].min) return {idx:i,...lvls[i],next:lvls[i+1]||null,total:lvls.length};
  return {idx:0,...lvls[0],next:lvls[1]||null,total:lvls.length};
}

function pct(goalId) {
  const g=S[goalId]; if(!g) return 0;
  return getChecked(goalId).size / g.tasks.length;
}

function ringOffset(p, r) {
  return 2*Math.PI*r*(1-Math.min(1,Math.max(0,p)));
}

function todayDone() {
  return Object.keys(S).reduce((s,id)=>s+getChecked(id).size,0);
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function initParticles() {
  const c = document.getElementById('particles');
  c.innerHTML='';
  const health=['🥦','🫐','🥑','🍇','🥬','🍋','🥕','🍓','🌿','🥝','🍅','🧄','🐟','🥚','🍒','🍊'];
  const degen =['🎮','💧','🫁','💀','🔥','🎯','⚡','🕹️','😤','🧃'];
  const pool = STATE.mode==='degen' ? degen : health;
  for(let i=0;i<26;i++) setTimeout(()=>spawnP(c,pool), Math.random()*8000);
}
function spawnP(c, pool) {
  const el=document.createElement('span');
  el.className='ptcl';
  el.textContent=pool[Math.floor(Math.random()*pool.length)];
  const sz=Math.random()*28+26, dur=Math.random()*18+20;
  el.style.cssText=`font-size:${sz}px;left:${Math.random()*96}vw;top:${Math.random()*30+90}vh;animation-duration:${dur}s;`;
  c.appendChild(el);
  el.addEventListener('animationend',()=>{el.remove(); spawnP(c,pool);});
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTmr;
function toast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTmr);
  toastTmr=setTimeout(()=>t.classList.remove('show'),2600);
}
