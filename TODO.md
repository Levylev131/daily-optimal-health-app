# Daily Optimal Health — TODO

## Version History
- **v1.6** — 30-day challenges: history dropdown, re-run same/different challenge, per-run stats (score, streak, grid, summary)
- **v1.5** — Degenerate mode restored (mode toggle visible on hub), in-app notifications (Web Audio chime + banner, replaces broken browser Notification API on file://)
- **v1.4** — 3 independent hub widgets — each configurable, S/M/L sizes, 3-column row layout (3×S or M+S fits one row), arrange/hide per widget
- **v1.3** — Creatine Guide (`creatine.html`) + Meal Recipes (`meals.html`) — hub cards, dosage calc, recipe browser
- **v1.2** — Breathing Timer (`breathing-timer.html`) — patterns, lung SVG shape, ripple rings, XP, history
- **v1.1** — Blog Feed page, editor/feed context handoff, toolbar active states, list backspace fix, unlink on clear fmt
- **v1.0** — Blog tool, streak milestones, snowflake freeze animation, toast overhaul, dohDebug helper
- **v0.9** — Body map granular segments (upper/lower torso, arm, leg, knees), strength/cardio/mobility workout tabs on drill-down pages
- **v0.8** — Dashboard (`dashboard.html`), body-map SVG overhaul, streak audit on load, water↔habit sync, habit name auto-capitalize
- **v0.7** — Elder Mode: warm amber theme, larger fonts, no particles/animations
- **v0.6** — Phase 3 refactor: extract profile.js (~270 lines) + stats.js (~95 lines) from index.html
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
- [x] Dashboard page (`dashboard.html`) — XP, streaks, habits, challenges, fasting, workouts, nutrition at a glance
- [x] Body map SVG overhaul — detailed muscle/joint layer, body-part.html drill-down
- [x] Streak audit on page load — freeze consumed automatically if day missed
- [x] Water ↔ habit bidirectional sync (water goal met = water habit checked, and vice versa)
- [x] Habit name auto-capitalizes on save
- [x] Body map granular SVG segments (upper/lower torso, arm, leg, knees)
- [x] Body-part drill-down workout tabs (Strength / Cardio / Mobility)
- [x] Blog tool (`blog.html`) — write, format, export posts
- [x] Streak milestones — toast at 7/14/21/30/60/90/100/365 days
- [x] Best streak tracking persisted to localStorage
- [x] Streak freeze fix — no longer auto-increments count on freeze use
- [x] Snowflake particle animation on streak freeze use
- [x] Toast overhaul — slide-in animation, ack toast with "Got it" button
- [x] `checkAllDone()` — celebration toast when all tasks checked
- [x] `dohDebug` console helper on hub + schedule pages
- [x] Breathing Timer (`breathing-timer.html`) — 6 patterns, rounds, lung/circle/triangle/square shapes, ripple rings, session history, XP
- [x] Creatine Guide (`creatine.html`) — protocols, dosage calculator, myths, safety, daily logging
- [x] Meal Recipes (`meals.html`) — recipe browser
- [x] Blog Feed page (`blog-reader.html`) — card grid, filters, search, reader overlay
- [x] Editor ↔ Feed context handoff — swap buttons preserve active post
- [x] Blog toolbar active states (B/I/U/S highlight when format is on)
- [x] ¶ button unwraps blockquotes and inline code
- [x] Backspace at list item start strips bullet, stays on same line
- [x] Clear formatting also unlinks links
- [x] 3 independent hub widgets (`__widget1/2/3`) — each has its own type (water/habits/sleep/supplements) and size (S/M/L), rendered in a 3-column `.hub-widget-row` so 3×small or medium+small share one row

## In Progress
<!-- Add what you're currently working on -->

## Up Next
<!-- Add what's coming next -->

## Backlog / Ideas
- ~~**Stats/Dashboard page**~~ — done in v0.8 as `dashboard.html`.
- ~~**Degenerate mode**~~ — restored in v1.5.
- ~~**Phase 3 refactor**~~ — done in v0.6.
- ~~**Better notifications**~~ — done in v1.5 as in-app chime + banner (Web Audio API + fixed toast). PWA/Electron still possible for background notifications.
- More profile icon alternatives — especially for Transcendent (rank 13). Currently ☀️ placeholder.
- ~~**Old People Mode**~~ — done in v0.7 as Elder Mode.
