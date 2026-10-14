# Abhyas for Android

The signed Android Studio edition packages the same `dist/` interface as the website, including the rebuilt sculptural dashboard, white/black/teal theme, illustrated tool cards, command palette, immersive focus mode, motion preferences, notes, planner and study tools. It works offline from its first launch. It uses the device's Android System WebView; keep that component updated.

- Android 8.0 or newer (minimum API 26), target API 35.
- Package: `io.github.sayandeepghosh.abhyas`, version 1.2.0, version code 3.
- No runtime permissions or Internet permission. Only bundled assets load inside the app.
- JSON import and JSON/text export use the system document picker, without broad storage access.
- The screen stays awake while a focus/break timer runs in the foreground.
- Reminders are **foreground reminders**, not Android system alarms. They cannot reliably ring when the app is closed, suspended or the phone is locked.
- Website and app data are separate. Move data with Settings → Export backup / Import backup. Uninstalling or clearing app storage removes local study data.

## Install

Download `Abhyas-1.2.0.apk` from the repository's GitHub release on your phone, open the file, and allow installation from that browser/file manager if Android asks. This is a self-signed release for direct installation, not a Play Store listing. The release includes a SHA-256 checksum.

## Build

Prerequisites: Python 3, JDK 17, official Android SDK Build Tools 35.0.0 and Android platform 35. The build itself makes no network requests and uses no Gradle or third-party Java dependencies.

Windows example from the repository root (adjust paths to your tools):

```powershell
python android/build.py `
  --build-tools ../android-tools/build-tools/android-15 `
  --android-jar ../android-tools/platform/android-35/android.jar `
  --jdk C:/path/to/jdk-17 `
  --signing-dir ../abhyas-signing `
  --output ../releases/Abhyas-1.2.0.apk
```

The first build generates an RSA-4096 release key and a random password in the supplied signing directory, which **must be outside the repository**. Subsequent builds reuse the same key. Keep both files private and back them up securely: updates must use this key and a higher `versionCode`. Losing it prevents installing compatible updates over the existing app. Never upload signing material to releases or source control.

Public certificate SHA-256:
`b124b442f1646b79699a0a990b93c3914fab9c6cdff9f4834743d0c1a35046fa`

The build compiles resources and Java, creates DEX, aligns the archive, signs it, then runs `apksigner verify`, `zipalign -c`, and manifest inspection. Build outputs under `android/.build/` are ignored by Git. `render-icons.py` regenerates the web PNG icons with Pillow; icon generation is not required for normal builds.

## Verification limits

The release build, signature, alignment, bundled assets and manifest are checked. Shared UI behavior is tested in Chromium at desktop and phone viewport sizes. The native activity, keyboard insets and Android document picker still need a physical-device smoke test; no emulator or phone was available in the build environment.

Native design follows Android guidance for [local WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content) and [APK signing](https://developer.android.com/tools/apksigner).

## Local accounts

Version 1.2 adds local username/password accounts and encrypted study workspaces. Accounts exist only in the current browser/app on the current device. Deleting an account, clearing app/browser data or uninstalling removes its stored credentials and study data. No Google login, cloud sync or password reset is provided. Keep an encrypted backup and its password. See [local account documentation](../AUTH-SETUP.md).
