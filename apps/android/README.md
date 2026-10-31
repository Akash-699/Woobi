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
