# Woobi - Google Play Console Upload & Release Guide

This folder contains all required production-ready binaries, keys, and metadata needed to publish or update the app on the **Google Play Developer Console**.

---

## 1. Release Files in this Folder

| File | Purpose | Size | Destination in Play Console |
| :--- | :--- | :--- | :--- |
| **`woobi.aab`** | **Signed Android App Bundle** (Official release format) | ~39.6 MB | **Upload directly here!** (Production / Testing track -> Create new release) |
| **`woobi-release.aab`** | Identical backup copy of the release App Bundle | ~39.6 MB | Backup / Alternate |
| **`woobi-release.apk`** | Signed Standalone APK | ~40.1 MB | Sideload testing / Internal testers / Direct Android installation |
| **`upload-keystore.jks`** | Play Store Upload Keystore certificate | ~2.8 KB | Secure storage (Required if setting up Google Play App Signing key or signing future updates) |

---

## 2. App & Package Metadata

- **Application ID / Package Name:** `com.example.aurawardrobe`
- **App Name:** Woobi (Fashion Studio & 3D Fitting Room)
- **Version Code:** `1`
- **Version Name:** `1.0.0`
- **Minimum Android SDK:** API 24 (Android 7.0 Nougat)
- **Target Android SDK:** API 36 (Android 16 / Android 15+ compatible)
- **Build Timestamp:** November 4, 2026
- **Architecture / Framework:** Native Android Jetpack Compose + Offline WebGL Three.js 3D Engine

---

## 3. Upload Keystore & Signing Credentials

- **Keystore File:** `upload-keystore.jks`
- **Keystore Type:** PKCS12
- **Keystore Password:** `woobi2026`
- **Key Alias:** `woobi-upload`
- **Key Password:** `woobi2026`
- **Validity:** Until March 20, 2054
- **SHA-1 Fingerprint:**
  ```
  A1:8B:96:BE:41:5E:57:12:89:00:68:D8:DD:68:80:C7:BD:E3:AD:2B
  ```
- **SHA-256 Fingerprint:**
  ```
  A7:A3:FA:D1:D2:01:D3:A3:0C:C9:AB:D1:91:91:E1:66:E7:E7:08:14:70:32:3E:28:10:21:51:E6:AA:A8:9F:9C
  ```

---

## 4. How to Upload to Google Play Developer Console

1. **Log in to Google Play Console:**
   - Go to [https://play.google.com/console](https://play.google.com/console).
2. **Select or Create App:**
   - Open your existing Woobi app or click **"Create app"** (Package Name: `com.example.aurawardrobe`).
3. **Choose Release Track:**
   - On the left sidebar, navigate to:
     - **Production** (for live release to public users), OR
     - **Testing** > **Internal testing** (recommended first to test on your own devices).
4. **Create New Release:**
   - Click **"Create new release"** in the top-right corner.
5. **Upload the Bundle:**
   - Under **"App bundles"**, drag and drop:
     `S:\Fashion_App\play-store-release\woobi.aab`
6. **Enter Release Notes:**
   - In **"Release name"**, enter `1.0.0` (or `1.0.0 - Production Launch`).
   - Under **"Release notes"**, paste:
     ```
     Initial release of Woobi 3D Fashion Studio:
     - Interactive 3D mannequin with calibrated anatomical sizing (Bust, Glutes, Thighs, Waist, Stomach).
     - Full wardrobe catalog with real-time fabric physics, draping, and garment fitting.
     - 360° Studio rotation, lighting presets, and vanity mirror visualization.
     - Offline-first performance and responsive design.
     ```
7. **Review and Rollout:**
   - Click **"Next"** / **"Save and review release"**.
   - Review any warnings, then click **"Start rollout to Production"** (or **"Save"** for Internal Testing).
