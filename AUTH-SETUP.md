# Local accounts — version 1.2

Abhyas now uses device-local username/password accounts. No Firebase project, Google sign-in, network authentication or account server is involved.

## Warning shown in the app

Your account credentials and encrypted study data are stored only in this browser or app on this device. Deleting your account, clearing browser/app data, or uninstalling the app removes them. There is no Google login, cloud sync or password recovery. Keep an encrypted backup and remember your password. Exported backup files remain until you delete them separately.

## Behavior

- User IDs: 3–32 ASCII letters, digits, underscores or hyphens, case insensitive. User IDs are visible in local storage; choose a non-sensitive alias.
- Passwords: 12–128 characters with uppercase, lowercase, a number and a non-whitespace special character. Passwords and derived keys are never persisted by the app. A browser password manager may separately offer to save a password.
- PBKDF2-HMAC-SHA256 with 600,000 iterations, random 16-byte account salt, a non-exportable AES-256-GCM key, fresh random 12-byte IV per write and account ID as authenticated data.
- Study data remains decrypted in memory only while unlocked. Each account has a separate encrypted record. Reload/log out requires entering the password again. Logout pauses the timer; reminders cannot ring while locked.
- Encrypted backup exports the account record. Restore on the login screen never overwrites an existing user ID and requires the original password. This is manual transfer, not sync.
- Settings study exports remain plaintext JSON. Store these privately. Use **Encrypted backup** for protected exports.
- Existing unencrypted data is preserved until the user explicitly chooses **Move old workspace**, confirms replacement of the current account workspace, and encrypted persistence succeeds.
- Account deletion requires a confirmation and typing the user ID. It removes only that account; external backups and other accounts remain.
- Saves are queued, with a persistent encryption/save status. Storage failure leaves the last successful ciphertext intact, warns the user, and blocks ordinary logout until they export their unsaved work. Closing or force-stopping during a pending write can lose the latest changes.

## Limits

This is an offline personal lock, not a server-backed security boundary. Malicious same-origin scripts, a compromised device/browser, or someone with access to an unlocked session can read its data. Strong passwords matter because copied ciphertext can be attacked offline. Local storage clearing cannot be undone without an external backup and its password. Web and Android stores are separate.

References: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [MDN AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams).
