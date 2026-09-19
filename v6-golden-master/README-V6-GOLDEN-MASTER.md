# Magic Book Powersports V6.0 — Golden Master

## Source UX locked
- Historical repository: magicjolab-star/jolab-magic-book-2.1
- Historical commit: 641deb2fe6d4860cc521e6b61b84f279d8399f8c
- Golden entrypoint: index-360.html?v=460
- Purpose: V4.6 is the immutable UX/flow reference for V6.0.

## Imported V4.6 modules
- index-360.html
- style-330.css
- style-352.css
- style-360.css
- style-361-ui.css
- accessory-350.css
- data-330.js
- app-330.js
- accessory-350.js
- auth-352.js
- premium-360.js
- flow-361.js
- flow-core-361.js
- auth-otp-guard.js
- optional-access-365.js
- analytics.js
- api/vin.js
- api/auth.js
- manifest.webmanifest
- sw.js
- v44-intro.js
- v44.html
- commercial.html
- privacy.html

## V6 non-regression rules
1. Do not rebuild the V4.6 interaction model in React Native.
2. Preserve the NIV/VIN decoder as the first evaluation entry point, with manual selection as fallback.
3. Preserve cascading selects: category -> brand -> model -> year -> usage -> condition -> accessories.
4. Preserve OTP email authentication and session/history behavior.
5. Lead acquisition must be invisible until the strict conversion funnel completes.
6. Strict funnel: email -> OTP validation -> explicit consent -> successful analysis -> automatic lead delivery.
7. Never show a primary "Transmettre à Théo Récréo" CTA before analysis.
8. Preserve V4.6 visual hierarchy and premium blue-night/gold/cyan styling.
9. Preserve functional intro media behavior, with a non-blocking safety fallback.
10. Preserve history, accessories and market-comparable entry points.

## Modern backend to merge from current project
Use current production modules from Magic-Book-Powersports-4.5:
- Supabase auth/database
- Resend lead routing
- RevenueCat Capacitor 13.6.0
- Android package com.magicproduction.magicbook
- Android API 36
- Vercel CI/CD
- build-playstore.ps1
- Digital Asset Links

## Lead routing contract
- To: theorecreo.ventes@gmail.com
- CC: jonathan@theorecreo.com
- CC: jeff@theorecreo.com
- Reply-To: authenticated prospect email
- Send only after consent + successful evaluation
- One evaluation should create at most one lead

## RevenueCat contract
- Entitlement: pro
- Monthly: magic_book_pro_v1:monthly-autorenewing
- Annual: magic_book_pro_v1:annual-autorenewing
- Free evaluation flow must remain usable without a subscription

## Media references from V4.6
The historical HTML references these binary assets:
- /magic-book-final-192.webp
- /magic-book-final-512.webp
- /18559_2.mp4
- /assets/17525.mp4
- /v44-intro.mp4

Binary media were not duplicated by the text-only GitHub contents integration. They remain source-of-truth assets in the historical repository/deployment and must be restored byte-for-byte or replaced only by explicitly approved V6 media.

## V6 target package
com.magicproduction.magicbook
