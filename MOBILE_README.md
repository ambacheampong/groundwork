# Groundwork Mobile App

This directory is configured as a **Capacitor** native app wrapper around the existing Groundwork web app.

## What it is
- The web app is built and deployed to Vercel (see the main README).
- The native iOS/Android app loads your deployed web app (set in `capacitor.config.ts` → `server.url`) in a native webview.
- Native features (push notifications, camera, file storage) are wired through Capacitor plugins and are used in the web code when the app is running inside the native shell.

## Prerequisites
- **iOS**: macOS, Xcode, Apple Developer account.
- **Android**: Android Studio, Google Play Console account.
- **Push notifications**: Firebase project with `google-services.json` (Android) and `GoogleService-Info.plist` (iOS). Add these to the native projects before building.

## Project files
- `capacitor.config.ts` — native app id, display name, and the web URL the app loads.
- `mobile-web/index.html` — offline fallback shown if the web URL cannot be loaded.
- `resources/` — source icon and splash images for native asset generation.
- `ios/` / `android/` — native Xcode and Android Studio projects.

## Common commands
```bash
# Sync web changes to native projects
npm run mobile:sync

# Open iOS project in Xcode
npm run mobile:open:ios

# Open Android project in Android Studio
npm run mobile:open:android

# Run on iOS simulator
npm run mobile:ios

# Run on Android emulator
npm run mobile:android

# Regenerate icons/splash after editing resources/icon.png or resources/splash.png
npm run mobile:assets
```

## Push notifications setup
1. Create a Firebase project at https://console.firebase.google.com.
2. Add iOS and Android apps to the project.
3. Download `GoogleService-Info.plist` and place it in `ios/App/App/`.
4. Download `google-services.json` and place it in `android/app/`.
5. In Xcode, enable **Push Notifications** and **Background Modes > Remote notifications** in the iOS target.
6. In Android, the FCM plugin is already wired through the native project; follow the Capacitor Push Notifications guide for your signing key.
7. The app stores each device token in the `public.push_tokens` table (tied to the signed-in user). Use the server secret `FCM_SERVER_KEY` or the Firebase Admin SDK inside a server function to send targeted or broadcast notifications.

## Camera and file picker
- The profile page uses `@capacitor/camera` for the native avatar/banner capture when the app is running in Capacitor.
- The standard `<input type="file">` still works in mobile browsers and inside the native webview (it triggers the native file picker automatically).

## Important notes
- The native build does **not** work offline by default — it loads your deployed web app. A fully offline version requires moving server functions to a standalone API or Supabase Edge Functions.
- Native builds must be run and tested locally in Xcode or Android Studio — there's no hosted preview for them.
- iOS and Android store review may require additional native behavior (e.g., loading indicators, offline handling). Test thoroughly before submitting.
