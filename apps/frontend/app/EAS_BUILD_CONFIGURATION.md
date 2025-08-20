# EAS Build & Submit Configuration

This document explains the EAS build and submit profiles configured in `eas.json`.

## Build Profiles

### `previewApk`
- **Purpose**: Creates APK files for internal testing and Expo preview builds
- **Output**: APK format
- **Usage**: Used by `frontend_native_android_preview.yml` workflow
- **Note**: APK files are NOT suitable for Google Play Store submission

### `production`
- **Purpose**: Creates AAB (Android App Bundle) for Google Play Store submission
- **Output**: AAB format 
- **Usage**: Used by `frontend_native_android.yml` workflow for production builds
- **Note**: AAB format is REQUIRED for Google Play Store uploads

## Submit Profiles

### `production`
- **Android**: Submits to the **public track** (production) in Google Play Store
- **iOS**: Submits to App Store Connect

## Key Differences: APK vs AAB

- **APK**: For internal testing, sideloading, and distribution outside app stores
- **AAB**: Required format for Google Play Store. Google generates optimized APKs from AAB

## Workflow Integration

- **Preview Workflow** (`frontend_native_android_preview.yml`):
  ```bash
  eas build --platform android --profile previewApk
  ```
  
- **Production Workflow** (`frontend_native_android.yml`):
  ```bash
  eas build --platform android --profile production
  eas submit --platform android --profile production
  ```

## Customer Configurations

The app supports multiple customer configurations (devConfig, swosyConfig, studiFutterConfig) which are handled through the `getFinalConfig()` function in `config.ts`. The EAS profiles work with all customer configurations.