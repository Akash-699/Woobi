# Woobi Android Application (`apps/android`)

## Overview
`apps/android` contains the native Android mobile application for Woobi, built with Kotlin and Jetpack Compose.

## Key Identifiers & Preservation Notice
- **Application ID / Namespace**: `com.example.aurawardrobe` (PRESERVED for backward compatibility with existing device installations)
- **App Display Name**: `Woobi` (User-facing launcher name)
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 36 (Android 16)
- **Gradle Version**: 9.1.0 / Kotlin 2.2.0

## Architecture Rule
The mobile application interfaces with backend services via network HTTP/REST endpoints defined in `modules/core/contracts`.

## App entry point
`android-app/app/src/main/java/com/example/aurawardrobe/MainActivity.kt` opens
`file:///android_asset/index.html` in a WebView. The dashboard shows the red-carpet
welcome at launch and waits for Enter Woobi before revealing its content.
Welcome sources live in `modules/core/app/welcome/` and are bundled in
`android-app/app/src/main/assets/welcome/`. The selected playable login
design and its wardrobe images are bundled in `android-app/app/src/main/assets/login/`.
The source page lives in `modules/core/login/`; update the bundled copy when it changes.
The footer opens the bundled wardrobe homepage for UI review. Authentication is
not yet connected on Android: the bundled config is a safe stub and the WebView
blocks browser Firebase sign-in from the file origin. Native Android
authentication and session handling are required before this can gate access.
