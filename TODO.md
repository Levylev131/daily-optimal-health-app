# Daily Optimal Health — TODO

## Version History
- **v0.4** — Phase 1 & 2 refactor: index.html 2091 → 839 lines (commit cf10ca1)
- **v0.3** — Tools & Trackers, Schedule Builder, Custom View (commit 5330dd7)
- **v0.2** — never committed separately; work absorbed into v0.3
- **v0.1** — Daily Optimal Health baseline (commit 9fdefe8)

## Done
- [x] SPA hub (`index.html`) — profiles, XP, streaks, heatmap
- [x] Health schedule pages (bone, brain, cardio, digestive, longevity, muscle)
- [x] Degenerate schedule pages (degenerates, degenerates+, super-degenerate)
- [x] `health-tracker.js` — checkboxes, day nav, profile bar on schedule pages
- [x] Tools & Trackers page (`tools.html`) — journal, water, sleep, mood, checklist, supplements
- [x] Schedule Builder (`schedule-builder.html`) — create/edit/delete custom schedules
- [x] Custom Schedule Viewer (`custom-view.html`) — task checking with day nav + XP
- [x] Tools & Trackers hub card added to `index.html`

## In Progress
<!-- Add what you're currently working on -->

## Up Next
<!-- Add what's coming next -->

## Backlog / Ideas
- **Phase 3 refactor** (back burner) — extract `profile.js` (~250 lines) and `stats.js` (~95 lines) from `index.html`. Sections are clearly marked, easy to pick up later.
- Better notifications — browser notifications are unreliable on file:// URLs. Options: in-app chime/banner (easy), PWA install (medium), Electron desktop app (bigger lift). PWA/Electron also unblocks making this a real installable app.
- More profile icon alternatives — especially for Transcendent (rank 13). Currently ☀️ placeholder, user wants more options to choose from.
