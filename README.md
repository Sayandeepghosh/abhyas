# Abhyas

A responsive, installable UPSC preparation workspace for Prelims and Mains.

## Run locally

From this folder: `python -m http.server 4174 --bind 127.0.0.1 --directory dist`.
Open http://127.0.0.1:4174 in a browser. No build step or package installation is required.

## Features

- Dashboard with actual focus time, completed tasks, study streaks and syllabus progress.
- Configurable Pomodoro and short/long break timers, preserving running timers across navigation and reloads.
- Dated study tasks with subject, stage, duration, completion and editing.
- Autosaving searchable notes, subject filters, word count and text export.
- 56 preparation milestones across Prelims, GS, CSAT, essay, language and optional subjects.
- Daily and one-time reminders, optional browser notifications, audio and snooze.
- Guided breathing, screen breaks, walking breaks and water log.
- Theme and profile preferences, personal target countdown, JSON backup export/import.
- Responsive mobile navigation, web app manifest and offline asset caching.

## Important product boundaries

This is a client-side web app, not a native Android/iOS binary. Browser installation and offline support depend on the browser and hosting authentication. Alarms need the page open and device awake; this is not a replacement for system wake-up alarms. Notifications require permission. The app does not run a background alarm service.

All study data remains in browser localStorage. There is no account, server database, cloud sync, coaching content feed, or third-party analytics. Export backups before clearing browser data. Use one editing tab at a time. Google Fonts is optional; system fallback fonts work when it is unavailable.

The syllabus is an intentionally broad preparation checklist, not an exhaustive or official syllabus. Follow current UPSC notices for authoritative requirements. Starter tasks and notes are editable examples; no study results are fabricated.

## Verification

`node --check dist/app.js`

`node --test tests/core.test.cjs`

Core tests cover timer completion, pause/reset behavior, break accounting, alarm deduplication, backup validation, escaping, and activity totals. Browser checks cover task creation, timer persistence, note autosave/search, syllabus changes, reminders, themes and mobile layout.

Source is in `dist/`; deployment identity and static root are in `.openai/hosting.json`.
