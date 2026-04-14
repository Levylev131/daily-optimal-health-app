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
  auditStreak();
}

function auditStreak() {
  const today = dateKey();
  if (!STATE.streak.last || STATE.streak.last === today) return;
  const yd = new Date(); yd.setDate(yd.getDate()-1);
  const ydStr = dateKey(yd);
  if (STATE.streak.last === ydStr) return; // yesterday — still valid
  // Missed at least one day
  const freezes = getFreezes();
  if (freezes > 0) {
    setFreezes(freezes - 1);
    incFreezeUses();
    // Protect streak count — do NOT increment; user must still earn today's increment by completing tasks
    STATE.streak.last = today;
    localStorage.setItem(`${storagePrefix()}streak`, JSON.stringify(STATE.streak));
    setTimeout(() => { triggerSnowflakes(); toast(`❄️ Streak Freeze Used — Streak Protected! (${freezes - 1} Left)`, 10000, true); }, 800);
  } else {
    STATE.streak.count = 0;
    localStorage.setItem(`${storagePrefix()}streak`, JSON.stringify(STATE.streak));
  }
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
  const yd = dateKey(d);
  STATE.streak.count = (STATE.streak.last === yd) ? STATE.streak.count + 1 : 1;
  STATE.streak.last = today;
  localStorage.setItem(`${storagePrefix()}streak`, JSON.stringify(STATE.streak));
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
  if (STATE.mode === 'elder') return;
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

// ─── SNOWFLAKES ───────────────────────────────────────────────────────────────
function triggerSnowflakes() {
  if (!document.getElementById('snowflake-style')) {
    const s = document.createElement('style');
    s.id = 'snowflake-style';
    s.textContent = '@keyframes sf-fall{0%{transform:translateY(-20px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(105vh) translateX(var(--sf-drift)) rotate(360deg);opacity:0}}';
    document.head.appendChild(s);
  }
  const colors = ['#7dd3fc','#bfdbfe','#e0f2fe','#ffffff','#93c5fd','#38bdf8'];
  for (let i = 0; i < 45; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.textContent = '❄';
      const drift = ((Math.random() - 0.5) * 140).toFixed(1);
      el.style.cssText = `position:fixed;top:-24px;left:${(Math.random()*100).toFixed(1)}vw;`
        + `font-size:${(13 + Math.random()*14).toFixed(1)}px;`
        + `color:${colors[Math.floor(Math.random()*colors.length)]};`
        + `opacity:0.9;pointer-events:none;z-index:9998;`
        + `--sf-drift:${drift}px;`
        + `animation:sf-fall ${(2.2 + Math.random()*2).toFixed(2)}s linear forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 35);
  }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTmr;
let lastToastParams = null;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toast').addEventListener('click', function() {
    if (!this.classList.contains('show') && lastToastParams) {
      toast(lastToastParams.msg, lastToastParams.duration, lastToastParams.ack);
    }
  });
});
function toast(msg, duration=2600, ack=false) {
  lastToastParams = { msg, duration, ack };
  const t = document.getElementById('toast');
  t.classList.add('toast-active');
  clearTimeout(toastTmr);
  if (ack) {
    t.classList.add('toast-ack');
    const snowflakeMatch = msg.match(/^❄️?\s*/);
    const icon = snowflakeMatch
      ? `<span style="background:rgba(0,0,0,0.7);border-radius:50%;width:40px;height:40px;display:inline-grid;place-items:center;flex-shrink:0;vertical-align:middle;"><span style="font-size:1.5rem;line-height:1;display:block;transform:translateY(-1px);">❄️</span></span>`
      : '';
    const text = snowflakeMatch ? msg.slice(snowflakeMatch[0].length) : msg;
    t.innerHTML = `${icon}<span>${text}</span><button class="toast-dismiss" onclick="event.stopPropagation(); this.closest('#toast').classList.remove('show','toast-ack')">Got it</button>`;
  } else {
    t.classList.remove('toast-ack');
    t.textContent = msg;
  }
  t.classList.add('show');
  toastTmr = setTimeout(() => t.classList.remove('show', 'toast-ack'), duration);
}
