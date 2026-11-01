# Kalima Android test APK

This is a small Java Android WebView wrapper around
https://khaled368.github.io/kalima-learning/ .

* Purpose: test the existing Kalima website in an installable Android APK
* Internet connection: required for the initial load and most features
* Android support: API 26 (Android 8) or newer
* Login: sign in with the existing Supabase account. WebView app storage is
  separate from Safari/Chrome; cloud-synced progress follows the account.
* App package: `com.kalima.learning`, version `0.4.0-test`
* Source: `android/` (Gradle Android application, Java, no extra app libraries)
* Security: HTTPS only; external links are opened in the phone browser.
  JavaScript and DOM storage are enabled for the application.

The GitHub Actions workflow `.github/workflows/build-android-apk.yml`
compiles a debug-signed APK, uploads an Actions artifact, and publishes
`Kalima-Android-Test.apk` in a public **pre-release** on GitHub.

v0.4 fixes early speech taps, selects media audio output, retries a default voice and opens Android speech settings if German voice data is missing. v0.3 prioritizes higher-quality phone voices in Android TTS (instead of the bundled robotic speech), and also includes the v0.2 Arabic retry screen for network failures, safer external links,
Android Back handling for open word dialogs and tabs, and disables WebView remote debugging.

The APK is for testing and is not a Google Play production release.
Future builds use ephemeral debug keys, so when installing a newly built
APK over an older one you may need to uninstall the previous test version.
To retain progress, use the account sync and confirm it is complete first.
