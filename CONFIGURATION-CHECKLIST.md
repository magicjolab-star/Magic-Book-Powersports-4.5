<!--
===================================================================================
MAGIC BOOK POWERSPORTS (par Magic app production)
Création originale, conception et développement par Jonathan Labelle, PDG.
Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
Tous droits réservés.
===================================================================================
-->

# Configuration finale Google Play

## 1. Appliquer le kit

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

```powershell
.\install.ps1 -ProjectRoot "C:\CHEMIN\VERS\jolab-magic-book-2.1"
```

## 2. Supabase

Exécuter entièrement :

```text
supabase/migrations/20260904_magic_book_powersports_v4.sql
```

Puis confirmer la présence des tables :

```text
pro_entitlements
company_settings
shared_evaluations
revenuecat_webhook_events
lead_submissions
```

## 3. Google Play Console

```text
Application ID : com.magicjolab.magicbook
Abonnement : magic_book_pro_v1
Plan mensuel : monthly-autorenewing
Prix Canada : 149,99 $ CA / mois
Plan annuel : annual-autorenewing
Prix Canada : 1 499,99 $ CA / an
```

Activer les deux plans et publier au minimum sur la piste de tests internes.

## 4. RevenueCat

```text
Application Android : com.magicjolab.magicbook
Entitlement : pro
Offering : magic_book_pro
Package mensuel : $rc_monthly
Produit mensuel : magic_book_pro_v1:monthly-autorenewing
Package annuel : $rc_annual
Produit annuel : magic_book_pro_v1:annual-autorenewing
```

Définir `magic_book_pro` comme Offering courant.

Webhook :

```text
https://VOTRE-DOMAINE/api/revenuecat-webhook
```

Configurer le même secret dans :

```text
Authorization : Bearer VOTRE_SECRET_LONG
REVENUECAT_WEBHOOK_AUTHORIZATION=Bearer VOTRE_SECRET_LONG
```

Activer la signature HMAC et copier son secret dans :

```text
REVENUECAT_WEBHOOK_SIGNING_SECRET
```

## 5. Variables Vercel

```text
APP_ORIGIN
MAGIC_API_ORIGIN
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
REVENUECAT_SECRET_API_KEY
REVENUECAT_ENTITLEMENT_ID
REVENUECAT_ALLOWED_PRODUCTS
REVENUECAT_MONTHLY_BASE_PLAN_ID
REVENUECAT_ANNUAL_BASE_PLAN_ID
REVENUECAT_WEBHOOK_AUTHORIZATION
REVENUECAT_WEBHOOK_SIGNING_SECRET
REVENUECAT_WEBHOOK_TOLERANCE_SECONDS
REVENUECAT_ACCEPT_SANDBOX
RESEND_API_KEY
RESEND_FROM
ADMIN_LEAD_EMAIL
ALLOWED_ORIGINS
SHARE_EXPIRATION_DAYS
```

Valeur de routage officielle :

```text
ADMIN_LEAD_EMAIL=Jonathan@magic-app.ca
```

## 6. Resend

Vérifier le domaine `magic-app.ca`, puis utiliser :

```text
RESEND_FROM=Magic Book Powersports <leads@magic-app.ca>
ADMIN_LEAD_EMAIL=Jonathan@magic-app.ca
```

## 7. Build signé en une commande

```powershell
.\build-playstore.ps1 `
  -ProjectRoot "C:\CHEMIN\VERS\jolab-magic-book-2.1" `
  -ApiOrigin "https://VOTRE-DOMAINE" `
  -RevenueCatPublicKey "goog_VOTRE_CLE_PUBLIQUE_ANDROID" `
  -KeystoreFile "C:\CHEMIN\magic-book-upload.keystore" `
  -KeystoreAlias "magicbook"
```

Sorties :

```text
release/Magic-Book-Powersports-4.0.0-production.aab
release/Magic-Book-Powersports-4.0.0-production.apk
```

## 8. Test d’achat réel

Installer l’application depuis une piste Google Play interne ou fermée avec un compte testeur. Un APK installé directement ne reproduit pas toujours le contexte de facturation Google Play nécessaire aux abonnements.
