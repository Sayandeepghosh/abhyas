# Abhyas release audit — 12 October 2026

Scope: the static website, shared study tools, GitHub Pages deployment workflow, and the new offline Android wrapper. This is a source review with automated regression/stress tests and browser checks, not a third-party penetration-test certification.

## Fixed findings

| Area | Issue addressed | Result |
| --- | --- | --- |
| Saved data | Malformed or structurally unsafe browser data could reach rendering | Validate saved data and imported records; preserve corrupt originals for recovery instead of overwriting them |
| Backups | Weak validation and failed imports could lose the current workspace | Validate dates, enums, bounds, IDs and record types; strip unknown properties; reject files above 10 MB; persist successfully before swapping state |
| Storage capacity | Failed writes could appear successful | Persistent unsaved-data warning and recovery export; keep the last saved copy intact |
| Multiple tabs | Competing tabs could overwrite notes or duplicate completion/alarms | Exclusive Web Lock where supported, compare-before-write fallback, storage-change conflict handling, and read-only competing tabs |
| Recovery | A newly opened locked tab initially held starter data for export | Load the saved workspace before displaying the read-only state |
| Timer | Pausing at expiry could discard a completed session; repeated completion could duplicate it | Complete expired sessions exactly once; record the scheduled completion date |
| Reminders | Past daily reminders, expired one-time reminders and rounded snooze time | Wait for the next daily occurrence, require editing expired one-time reminders, and use an exact five-minute snooze deadline |
| Midnight | Dashboard and water totals could remain on yesterday | Detect date rollover and refresh relevant views |
| Large libraries | Rendering entire collections could create excessive DOM output | Initially render at most 100 planner rows/notes, with explicit pagination and bounded note previews |
| Offline cache | Arbitrary query variants/navigation URLs could grow caches; writes could fail | Cache only known assets, use one navigation key, scope cleanup to this app, and tolerate cache-write failures |
| Script injection | Missing policy defense around a client-rendered app | Escape user strings; add CSP restricting scripts to local files, disallow inline handlers, objects, base-tag changes and form navigation |
| CI supply chain | Deployment actions referenced mutable version tags | Pin actions to full commit hashes and use limited job permissions |
| Short screens | Settings/navigation could be unreachable | Independently scrollable sidebar, compact short-screen layout, mobile bottom navigation |

## Automated verification

Run `node --test tests/*.test.cjs` from the repository root. The release suite has **47 passing tests** covering:

- Normal timer completion, pause/reset, break accounting, persistence and activity totals.
- Corrupt storage recovery, quota errors, unavailable storage, conflicting writes and duplicate tabs.
- Invalid IDs/dates/numbers, duplicate records, null entries, prototype-related properties, oversized imports, and 1,000 deterministic malformed structures.
- HTML/script/SVG/attribute payload escaping, immutable CI action references, and no dynamic JavaScript evaluation or third-party scripts.
- Import round trips and atomic failure, timer edge cases, reminder deduplication, midnight rollover, and bounded alarm queues.
- Offline deep links, sibling-scope isolation, 1,000 query variants, 100 navigation URLs, redirects, HTTP errors and cache quota failures.
- Android bridge export routing, native screen-wake behavior, ring progress and native security settings.

Stress fixture: **5,000 notes, 10,000 tasks and 100,000 sessions**. Validation plus generating the initial notes/planner/dashboard HTML took about **0.33 seconds** in the local Node VM run; a one-million-character note's bounded preview and word count took about **15 ms**. These are synthetic JavaScript measurements, not phone/browser rendering benchmarks or a promise that localStorage can hold that volume. Actual browser storage limits are much smaller on many devices and are handled with explicit recovery warnings.

## Browser verification

Checked in Chromium at desktop 1366×900 and phone 390×844, 390×500 and 320×568 viewports:

- Light/dark presentation and system-font stack; responsive views and checked layouts without horizontal overflow.
- Phone bottom navigation and sidebar Settings access on a short screen.
- Create and complete a Mains task; update a syllabus milestone.
- Create/edit a note, reload, and confirm persistence. HTML/SVG payloads remained visible text and produced no injected images.
- Complete a real one-minute focus session across navigation/reload; one history record and the completion alert appeared.
- Create a daily reminder; use water logging and guided breathing controls.
- Export a JSON backup, select it through the browser file picker, review and restore it. Imported reminders become paused.
- A second tab was blocked from editing while the first held the workspace lock.
- No captured application console errors during these checks.

## Android build verification

- Compiled with JDK 17, official Android Build Tools 35.0.0 and platform 35.
- Release APK alignment and manifest checked; Android 8.0+ / target API 35.
- `apksigner verify --verbose --print-certs` confirms APK Signature Schemes **v2 and v3**, using an RSA-4096 release key. Public certificate fingerprint and reproducible build instructions are in [android/README.md](android/README.md).
- Signing key and password remain outside the Git repository. APK assets contain no signing material.
- No Internet or runtime permissions. App loads allowlisted bundled files at a fixed HTTPS origin; network requests and file URL access are blocked, cleartext and WebView debugging are disabled, and Android automatic backup is disabled. External HTTPS links open in the system browser only after a user gesture.
- User-selected document import/export uses Android's picker; no broad filesystem access permission.

## Remaining limits

1. **Native device testing is outstanding.** No Android phone or emulator was available. Compilation/signing and shared browser UI tests do not verify OEM WebViews, document providers, keyboard insets, screen rotations or device power management. Use an updated Android System WebView and perform a device smoke test before wider distribution.
2. **Foreground alarms only.** Neither edition schedules reliable system alarms while closed, suspended or locked. Android keeps the screen awake during a foreground timer; this does not grant background execution.
3. **Local, unencrypted app data.** No account, backend or cloud sync exists. Anyone with access to the unlocked browser/app profile may read notes. Export files contain plain text. Uninstalling, clearing storage or browser eviction can remove data. Export backups regularly.
4. **GitHub Pages header limits.** The inspected live response used HTTPS/HSTS. CSP is delivered in HTML; GitHub Pages does not provide this project with custom response-header configuration. `frame-ancestors` cannot be enforced through a meta policy, so header-based anti-framing protection remains unavailable on this host. Other project pages under the same GitHub Pages origin share the browser origin security boundary.
5. **No authenticated backend to penetration-test.** No SQL, server authorization, payment or user-account system is implemented. No DDoS, public-site load flood, OS exploit or independent vulnerability scanner assessment was performed.
6. **Browser fallback race.** Browsers without Web Locks use compare-before-write and storage events. That fallback reduces conflicts but is not a transactional cross-tab lock; use one editing tab.

References: [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy), [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [Android local content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [Android APK signer](https://developer.android.com/tools/apksigner).
