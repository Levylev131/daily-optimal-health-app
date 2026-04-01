# Daily Optimal Health — CLAUDE.md

## What this project is
A browser-based daily health schedule app. No build tools, no server — pure HTML/CSS/JS opened directly from the filesystem. Two modes: **Health** (green theme) and **Degenerate** (purple theme, for gamers/vapers trying to improve).

## How to run
Open `index.html` directly in a browser. All pages work as `file://` URLs.

## File structure

| File | Purpose |
|------|---------|
| `index.html` | Full SPA hub — all schedule data embedded, profile system, XP, streaks, heatmap |
| `health.css` | Shared styles for all normal pages (bone, brain, etc.) |
| `health-stickers.js` | Animated background emoji grid for normal pages |
| `health-tracker.js` | Checkboxes + day changer + profile bar injected into normal pages |
| `bone.html` | Bone health schedule |
| `brain.html` | Brain health schedule |
| `cardio.html` | Cardiovascular health schedule |
| `digestive.html` | Digestive health schedule |
| `longevity.html` | Longevity schedule |
| `muscle.html` | Muscle building schedule |
| `degenerates.html` | Degenerate mode schedule |
| `degenerates-plus.html` | Degenerate+ schedule |
| `super-degenerate.html` | Super degenerate schedule |

## Architecture

### index.html (SPA)
Single file, ~1200 lines. All schedule data is in the `S` object (keyed by ID: `longevity`, `muscle`, `cardio`, `bone`, `brain`, `digestive`, `degenerates`, `degenerates-plus`, `super-degenerate`). Clicking a hub card navigates to `{id}.html` via `window.location.href`.

**Key functions:**
- `renderHub()` — draws the hub cards with SVG progress rings
- `renderHeatmap()` — 20-week activity heatmap on the profile page
- `openGoal(id)` — navigates to the individual .html page
- `getLevel(isDegen)` — returns level object from LEVELS table
- `storagePrefix()` — returns `doh_{profileId}_` or `doh_guest_`

### normal pages (bone.html, brain.html, etc.)
Static HTML tables. `health-tracker.js` is injected via `<script defer>` and adds:
- Profile bar at the top (reads SPA profile data from localStorage)
- Day changer bar (Prev/Next navigation)
- Checkbox column (prepended as first column to preserve `td:last-child` for hover popup)

### health-tracker.js
Self-contained IIFE. No dependencies. Reads/writes:
- SPA profile data (read-only for display, writes XP/streak on task complete)
- Its own task state per page per date

### CSS layout — normal pages
- Checkbox: column 1 (`td:nth-child(1)`, class `.cb-td`)
- Time: column 2 (`tbody td:nth-child(2)`) — 72px wide
- Activity: column 3 (`td:last-child`) — fills remaining space, `position: relative` for hover popup

## localStorage key formats

| Key | Value | Used by |
|-----|-------|---------|
| `doh_profiles` | `{ [id]: { id, name, color, created } }` | SPA + health-tracker.js |
| `doh_active_profile` | profile ID string | SPA + health-tracker.js |
| `doh_{id}_xp` | integer | SPA + health-tracker.js |
| `doh_{id}_streak` | `{ count, last: 'YYYY-MM-DD' }` | SPA + health-tracker.js |
| `doh_{id}_{date}_{goalId}` | `[indexes of checked tasks]` | SPA only |
| `ht:{pageKey}:{date}` | `[true/false per row]` | health-tracker.js only |
| `doh_mode` | `'health'` or `'degen'` | SPA |

Note: SPA task state and normal page task state are stored separately (different key formats). XP and streak ARE shared.

## XP & Level system
+10 XP per health task checked, +15 per degen task. Only applies when viewing today (not past days).

| Level | Health | Degen | XP |
|-------|--------|-------|----|
| 1 | Couch Potato | Absolute Degenerate | 0 |
| 2 | Weekend Warrior | Slightly Less Bad | 150 |
| 3 | Health Curious | Attempting Human | 400 |
| 4 | Health Enthusiast | Functioning Adult | 800 |
| 5 | Optimizer | Respectable Person | 1400 |
| 6 | Biohacker | Reformed | 2200 |
| 7 | Longevity Legend | Devil Is Disappointed | 3500 |
| 8 | Elite Performer | Suspicious Improvement | 5500 |
| 9 | Peak Human | Unrecognizable | 8500 |
| 10 | Longevity Architect | Mom Is Proud | 13000 |
| 11 | Centenarian Candidate | Dealer Lost A Customer | 20000 |
| 12 | Demigod | Certified Ex-Degenerate | 30000 |
| 13 | Transcendent | A Different Species | 45000 |

## Design principles
- Dual identity is a core pillar — Health (green) and Degenerate (purple) themes must both work
- No build tools, no frameworks, no bundler — keep it plain HTML/JS/CSS
- localStorage is the only persistence layer
- `file://` compatible — no fetch() calls to relative paths, no ES modules
