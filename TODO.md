# Daily Optimal Health — TODO

## Version History
- **v0.5** — 5 new Tools pages + hub cards (commit 98fb823)
- **v0.4** — Phase 1 & 2 refactor: index.html 2091 → 839 lines (commit cf10ca1)
- **v0.3** — Tools & Trackers, Schedule Builder, Custom View (commit 5330dd7)
- **v0.2** — never committed separately; work absorbed into v0.3
- **v0.1** — Daily Optimal Health baseline (commit 9fdefe8)

## Done
- [x] SPA hub (`index.html`) — profiles, XP, streaks, heatmap
- [x] Health schedule pages (bone, brain, cardio, digestive, longevity, muscle)
- [x] Degenerate schedule pages (degenerates, degenerates+, super-degenerate) — hidden, restorable
- [x] `health-tracker.js` — checkboxes, day nav, profile bar on schedule pages
- [x] Tools & Trackers page (`tools.html`) — journal, water, sleep, mood, checklist, supplements
- [x] Schedule Builder (`schedule-builder.html`) — create/edit/delete custom schedules
- [x] Custom Schedule Viewer (`custom-view.html`) — task checking with day nav + XP
- [x] Workout Logger (`workout-log.html`) — exercises, sets, reps, weight, day nav
- [x] Nutrition Log (`nutrition-log.html`) — meals, macros, daily totals, day nav
- [x] Fasting Tracker (`fasting-tracker.html`) — real-time timer, presets, history
- [x] Habit Tracker (`habit-tracker.html`) — custom habits, streaks, day nav
- [x] 30-Day Challenges (`challenges.html`) — 10 preset challenges, check-in grid
- [x] Custom schedules shown as hub cards on index page with progress rings
- [x] All new pages have working back buttons to index.html
- [x] Phase 1 & 2 code refactor — CSS, constants, schedule data, utils, modals extracted

## In Progress
<!-- Add what you're currently working on -->

## Up Next
<!-- Add what's coming next -->

## Backlog / Ideas
- **Stats/Dashboard page** — single page showing all data at a glance: streak, XP, active habits, fasting history, workout frequency. All data already in localStorage.
- **Degenerate mode** (back burner) — concept is solid, currently hidden in `index.html` via `false` flags in `renderHub()`. Pages intact. Restore by flipping those flags to `true`.
- **Phase 3 refactor** (back burner) — extract `profile.js` (~250 lines) and `stats.js` (~95 lines) from `index.html`. Sections are clearly marked, easy to pick up later.
- Better notifications — browser notifications are unreliable on file:// URLs. Options: in-app chime/banner (easy), PWA install (medium), Electron desktop app (bigger lift).
- More profile icon alternatives — especially for Transcendent (rank 13). Currently ☀️ placeholder.
