# Shoperic Mobile

Native Android & iOS shell for the **Shoperic** e-commerce store, built with [Capacitor 6](https://capacitorjs.com/).

The Next.js store is deployed separately. This app is a thin native wrapper that loads the live store URL (`server.url` in `capacitor.config.ts`) inside a native WebView — one web codebase, a real app-store presence, nothing to rebuild when the store changes.

## Prerequisites

- **Node.js 18+** (with npm, pnpm, or bun)
- **Android:** [Android Studio](https://developer.android.com/studio) (SDK 34+, platform tools)
- **iOS:** [Xcode 15+](https://apps.apple.com/app/xcode/id497799835) + CocoaPods (macOS only)

## Setup

```bash
bun install          # or: npm install
cp .env.example .env # then edit .env
```

Set the store URL before syncing — either in `.env` or by exporting it in your shell:

```bash
export STORE_URL=https://your-store-domain.com
```

The config reads `process.env.STORE_URL`, so any way of setting the variable works (e.g. `npx dotenv -e .env -- cap sync` if you prefer keeping it in `.env`).

## Add native platforms

Generated once per machine (folders are git-ignored):

```bash
npx cap add android
npx cap add ios   # macOS only
```

## Run

Sync the config and web assets into the native projects, then open the IDE:

```bash
npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

Run on a device/emulator from the IDE as you would any native app.

## Changing the store URL

The URL is resolved when the Capacitor CLI runs:

1. Set `STORE_URL` (in `.env` or your shell), **or** edit the fallback in `capacitor.config.ts` → `server.url`.
2. Re-run `npx cap sync` and rebuild/redeploy the native app.

Local/HTTP URLs additionally require `server.cleartext: true` in `capacitor.config.ts` (never enable it for production builds).

## Payments

Checkout uses **Razorpay**. When a payment starts, Razorpay's checkout page opens in an in-app browser window on top of the WebView; `server.allowNavigation` already includes `checkout.razorpay.com`, so the flow stays inside the app and the success/failure callback returns to the store. No extra configuration is needed.

## Building for the stores

### Android (Play Store)

1. `npx cap open android`
2. **Build → Generate Signed Bundle / APK… → Android App Bundle**
3. Create (or reuse) an upload keystore — keep it and its passwords safe; losing it locks you out of the listing (unless you enroll in Play App Signing).
4. Upload the signed `.aab` to the Play Console.

### iOS (App Store)

1. `npx cap open ios`
2. Select the app target → **Signing & Capabilities** → choose your team/bundle ID.
3. **Product → Archive**, then upload the archive from the Organizer to App Store Connect.

## Project structure

| Path                 | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `capacitor.config.ts`| App ID/name, store URL (`server.url`), splash & status bar config     |
| `www/index.html`     | Fallback loading page (only served if `server.url` is removed)        |
| `.env.example`       | Template for the `STORE_URL` environment variable                     |
| `package.json`       | Capacitor dependencies and `cap` scripts                              |
| `android/`           | Generated Android Studio project (`npx cap add android`) — git-ignored |
| `ios/`               | Generated Xcode project (`npx cap add ios`) — git-ignored             |
