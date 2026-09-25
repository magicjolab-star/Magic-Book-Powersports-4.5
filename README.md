# Magic Book Powersports — V6.0.0 (Golden Master)

Reference version: **V4.6** (immutable UX/flow). All V6 development restarts from 4.6.

## Layout

- `v6-golden-master/` — locked 4.6 golden master (**do not modify**). Single entrypoint: `index-360.html?v=460`.
- `src/billing/` — RevenueCat native integration.
- `.github/workflows/build-playstore.yml` — pipeline: builds, signs and publishes `Magic-Book-Powersports-6.0.0-production.aab` (package `com.magicproduction.magicbook`, versionCode 60000, target API 36).
- `api/` — backend functions (leads, runtime config).
- `capacitor.config.ts`, `package.json` (version 6.0.0, RevenueCat 13.6.0), `.well-known/assetlinks.json`.
- `vercel.json` — serves the golden master statically (`v6-golden-master/` → `dist/`).

## Pipeline

Push to `v6-golden-master-v460` (paths: `v6-golden-master/**`, `src/billing/**`, `package.json`, `capacitor.config.ts`, `.well-known/assetlinks.json`, `upload-playstore.js`, workflow) or manual `workflow_dispatch` → GitHub Actions → certified AAB artifact `Magic-Book-Powersports-6.0.0-PlayStore` → Google Play Internal release when service-account secrets exist.

## Required GitHub secrets

- `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` (and `ANDROID_KEY_PASSWORD` if different) — without the upload key, the build intentionally fails at the signing step.
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` or `GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64` — for Play Internal publishing.

## History

2026-09-24: restarted V6 development from the 4.6 golden master; removed the dead V5.1 Expo/React scaffolding. The Play Store AAB is built exclusively from `v6-golden-master/`.
