# Kalima Android offline-first APK (v0.8)

This installable Android APK contains the complete `dist/` application and
learning curriculum, instead of loading the website from GitHub Pages on
each launch. Android manages its launcher icon, back button, speech,
app storage, and installation.

- Study content, 35 practical sections, A1–C1 curricula, themes, navigation
  and the bundled speech engine are packaged offline.
- Internet remains necessary for authentication, cloud syncing, account
  verification and external links. Voice output also depends on installed
  offline voice data when using Android TTS.
- This is an **offline-packaged hybrid Android application**, not yet a
  completely native reimplementation. The existing interface runs in a
  WebView from secure, built-in APK assets, never the live webpage.
- Keeps the original origin `https://khaled368.github.io/kalima-learning/`
  through local request interception, preserving compatible in-app browser
  storage and auth redirects. Supabase requests remain network requests.
- Minimum Android version: Android 8 (API 26). App ID:
  `com.kalima.learning`. Version `0.8.0-offline-test`.

## Build

Run the GitHub workflow `Build Kalima Android test APK` manually or use
`gradle -p android assembleDebug` after installing Android SDK 35. Gradle
copies `dist/` to a generated Android assets folder on every build; it
does not commit duplicate curriculum files. The workflow checks packaged
HTML, topics and JSON, then publishes `Kalima-Android-Test.apk` in the
`android-preview-v8` prerelease.

Because files now ship inside the APK, **changes to lessons or design
require a new APK** to reach existing installations. The workflow is
triggered when `dist/` or `android/` changes. Updating GitHub Pages
does not change installed copies of this offline-packaged app.

This remains a testing APK signed with an ephemeral debug key. It may
not install over another build signed with a different key. Sign in and
confirm cloud progress sync before uninstalling an older test APK, as
local storage is erased on uninstall. Production distribution requires a
permanent release signing key and additional Android testing.

## Android daily word-goal reminders

The daily 20-word goal card has an optional reminder below it in the APK.
It starts disabled; the learner enables it and chooses a local time (20:00
by default). Android 13+ asks for notification permission when enabled.
The inexact local alarm runs once each day, without internet or a push server.
It is omitted when this device has recorded 20 words learned on that date.
Reminders survive reboots and timezone changes; Android may delay them for
battery optimization. Learning completed only on a different device is not
known to this phone until it syncs.
