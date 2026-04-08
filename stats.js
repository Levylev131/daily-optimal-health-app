// ─── HEATMAP ─────────────────────────────────────────────────────────────────
function buildHeatmapData() {
  const pid = getActiveId();
  if (!pid) return {};
  const result = {};
  const pfx = `doh_${pid}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // SPA task keys: doh_{pid}_{YYYY-MM-DD}_{goalId}
    if (k.startsWith(pfx)) {
      const dateMatch = k.slice(pfx.length).match(/^(\d{4}-\d{2}-\d{2})_/);
      if (!dateMatch) continue;
      const date = dateMatch[1];
      try { result[date] = (result[date] || 0) + JSON.parse(localStorage.getItem(k)).length; } catch {}
    }
    // Individual page task keys: ht:{profileId}:{pageKey}:{YYYY-MM-DD}
    const htMatch = k.match(new RegExp('^ht:' + pid + ':[^:]+:(\\d{4}-\\d{2}-\\d{2})$'));
    if (htMatch) {
      const date = htMatch[1];
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (Array.isArray(val)) result[date] = (result[date] || 0) + val.filter(Boolean).length;
      } catch {}
    }
  }
  return result;
}

function heatColor(count, isDegen) {
  if (count === 0) return 'rgba(255,255,255,0.06)';
  if (isDegen) {
    if (count <= 3)  return '#3a0060';
    if (count <= 8)  return '#7a00aa';
    if (count <= 15) return '#c800ff';
    return '#f0a0ff';
  } else {
    if (count <= 3)  return '#1a5c32';
    if (count <= 8)  return '#1a8a50';
    if (count <= 15) return '#2dd46e';
    return '#7fffc4';
  }
}

function renderHeatmap() {
  const data = buildHeatmapData();
  const WEEKS = 20;
  const isDegen = STATE.mode === 'degen';
  const today = new Date(); today.setHours(0,0,0,0);

  // Build week columns starting from WEEKS*7 days ago
  const origin = new Date(today);
  origin.setDate(today.getDate() - (WEEKS * 7 - 1));

  const weekCols = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    let mLabel = '';
    for (let d = 0; d < 7; d++) {
      const dt = new Date(origin);
      dt.setDate(origin.getDate() + w * 7 + d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      const count = data[key] || 0;
      const isFuture = dt > today;
      if (d === 0 && dt.getMonth() !== lastMonth) {
        mLabel = dt.toLocaleDateString('en-US', { month: 'short' });
        lastMonth = dt.getMonth();
      }
      days.push({ key, count, isFuture });
    }
    weekCols.push(days);
    monthLabels.push(mLabel);
  }

  const monthRow = monthLabels.map(l =>
    `<div class="hm-mlbl">${l}</div>`
  ).join('');

  const grid = weekCols.map(days =>
    `<div class="hm-week">${days.map(d =>
      `<div class="hm-day"
        style="background:${d.isFuture ? 'rgba(255,255,255,0.03)' : heatColor(d.count, isDegen)}"
        data-tip="${(()=>{ const dt=new Date(d.key+'T00:00:00'); const lbl=dt.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}); return lbl + (d.isFuture ? ' · future' : d.count ? ' · '+d.count+' task'+(d.count!==1?'s':'')+' done' : ' · no activity'); })()}"></div>`
    ).join('')}</div>`
  ).join('');

  const legendColors = isDegen
    ? ['rgba(255,255,255,0.06)', '#3a0060', '#7a00aa', '#c800ff', '#f0a0ff']
    : ['rgba(255,255,255,0.06)', '#1a5c32', '#1a8a50', '#2dd46e', '#7fffc4'];

  return `<div class="heatmap-scroll">
    <div class="heatmap-months">${monthRow}</div>
    <div class="heatmap-grid">${grid}</div>
    <div class="hm-legend">
      ${legendColors.map(c=>`<div class="hm-lswatch" style="background:${c}"></div>`).join('')}
      <span>less → more</span>
    </div>
  </div>`;
}

// ─── ALL-TIME STATS ───────────────────────────────────────────────────────────
function allTimeStats() {
  const pid = getActiveId();
  if (!pid) return { tasks: 0, daysActive: 0, tasksThisWeek: 0, daysThisMonth: 0 };
  let tasks = 0, tasksThisWeek = 0;
  const activeDays = new Set(), activeDaysThisMonth = new Set();
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const pfx = `doh_${pid}_`;
  // Count SPA task keys (format: doh_{pid}_{YYYY-MM-DD}_{goalId})
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k.startsWith(pfx)) continue;
    const dateMatch = k.slice(pfx.length).match(/^(\d{4}-\d{2}-\d{2})_/);
    if (!dateMatch) continue;
    try {
      const val = JSON.parse(localStorage.getItem(k));
      if (Array.isArray(val) && val.length > 0) {
        const d = dateMatch[1];
        tasks += val.length;
        activeDays.add(d);
        if (new Date(d + 'T00:00:00') >= weekAgo) tasksThisWeek += val.length;
        if (d.startsWith(thisMonth)) activeDaysThisMonth.add(d);
      }
    } catch {}
  }
  // Count individual page task keys (format: ht:{profileId}:{pageKey}:{YYYY-MM-DD})
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const htMatch = k.match(new RegExp('^ht:' + pid + ':[^:]+:(\\d{4}-\\d{2}-\\d{2})$'));
    if (!htMatch) continue;
    try {
      const val = JSON.parse(localStorage.getItem(k));
      if (Array.isArray(val)) {
        const done = val.filter(Boolean).length;
        if (done > 0) {
          const d = htMatch[1];
          tasks += done;
          activeDays.add(d);
          if (new Date(d + 'T00:00:00') >= weekAgo) tasksThisWeek += done;
          if (d.startsWith(thisMonth)) activeDaysThisMonth.add(d);
        }
      }
    } catch {}
  }
  return { tasks, daysActive: activeDays.size, tasksThisWeek, daysThisMonth: activeDaysThisMonth.size };
}
