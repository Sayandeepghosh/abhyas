# Abhyas

A responsive, installable UPSC preparation workspace for Prelims and Mains.

## GitHub Pages

Website: https://sayandeepghosh.github.io/abhyas/

Repository: https://github.com/Sayandeepghosh/abhyas

Every push to `main` runs the JavaScript checks and core tests, then deploys `dist/` to GitHub Pages using `.github/workflows/pages.yml`. The workflow can also be run manually from the Actions tab. Pages must use **GitHub Actions** as its deployment source.

The website and source repository are public. Personal study data stays in each visitor's browser and is not committed or uploaded to GitHub. The previous private Sites version is a separate deployment; this workflow updates GitHub Pages only. To move your own notes between the two sites, export a backup from Settings on the old site and import it on the new site.

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
- White, black and subtle teal visual design, geometric illustration, timer ring and reduced-motion support.
- Signed offline Android edition with native file import/export; see [Android instructions](android/README.md).

## Important product boundaries

The website is a client-side web app. The Android APK bundles it in a restricted native WebView; there is no native iOS binary. Browser installation and offline support depend on the browser. Alarms need the app open and device awake; this is not a replacement for system wake-up alarms. Browser notifications require permission. Neither edition runs a background alarm service.

All study data remains in localStorage within the browser or Android app. There is no account, server database, cloud sync, coaching content feed, or third-party analytics. Export backups before clearing data or uninstalling. Website and Android data are separate; backups transfer between them. Use one editing tab at a time. Typography uses native system fonts: San Francisco on Apple devices, with platform-appropriate system fallbacks elsewhere. No external font requests are made.

The syllabus is an intentionally broad preparation checklist, not an exhaustive or official syllabus. Follow current UPSC notices for authoritative requirements. Starter tasks and notes are editable examples; no study results are fabricated.

## Verification

`node --check dist/app.js`

`node --test tests/*.test.cjs`

Tests cover timer accounting, reminders, malformed imports, storage recovery, competing tabs, injection payloads, offline caching, large data sets, and Android bridge behavior. See [audit report](AUDIT.md) for findings, fixes, evidence and remaining limitations.

Source is in `dist/`; deployment identity and static root are in `.openai/hosting.json`.
