<!--
===================================================================================
MAGIC BOOK POWERSPORTS (par Magic app production)
Création originale, conception et développement par Jonathan Labelle, PDG.
Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
Tous droits réservés.
===================================================================================
-->

# Magic Book Powersports 4.0 — Kit Google Play

Ce kit ajoute Google Play Billing par RevenueCat, les autorisations Pro sécurisées, la marque blanche, les impressions et partages dynamiques, le routage des leads par Resend et la préparation Capacitor Android API 36, sans retirer les fonctions existantes.

## Installation automatisée sous Windows PowerShell

1. Décompresser ce dossier à côté du projet Magic Book Powersports.
2. Ouvrir PowerShell dans ce dossier.
3. Exécuter :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

```powershell
.\install.ps1 -ProjectRoot "C:\CHEMIN\VERS\jolab-magic-book-2.1"
```

4. Dans le projet, créer les variables locales nécessaires :

```powershell
$env:MAGIC_API_ORIGIN="https://VOTRE-PROJET.vercel.app"
$env:REVENUECAT_ANDROID_PUBLIC_SDK_KEY="goog_VOTRE_CLE_PUBLIQUE_ANDROID"
```

5. Générer et ouvrir le projet Android :

```powershell
npm run android:prepare
```

```powershell
npx cap open android
```

## Migration Supabase

Le fichier est disponible aux deux emplacements suivants :

```text
01-SUPABASE-MIGRATION.sql
overlay/supabase/migrations/20260904_magic_book_powersports_v4.sql
```

## Variables Vercel obligatoires

Copier les noms contenus dans `.env.playstore.example` vers Vercel. Les clés secrètes ne doivent jamais être intégrées au bundle Android.

## Produits Google Play / RevenueCat

```text
Application ID : com.magicjolab.magicbook
Entitlement RevenueCat : pro
Offering RevenueCat : magic_book_pro
Produit Google Play : magic_book_pro_v1
Plan mensuel : monthly-autorenewing — 149,99 $ CA / mois
Plan annuel : annual-autorenewing — 1 499,99 $ CA / an
```


## Build automatisé complet sous Windows

```powershell
.\build-playstore.ps1 `
  -ProjectRoot "C:\CHEMIN\VERS\jolab-magic-book-2.1" `
  -ApiOrigin "https://VOTRE-DOMAINE" `
  -RevenueCatPublicKey "goog_VOTRE_CLE_PUBLIQUE_ANDROID" `
  -KeystoreFile "C:\CHEMIN\magic-book-upload.keystore" `
  -KeystoreAlias "magicbook"
```

Le script demande les deux mots de passe sans les écrire dans les fichiers.

## Documents de contrôle

```text
CONFIGURATION-CHECKLIST.md
VALIDATION-REPORT.md
```

## Génération signée

Définir les variables de signature, puis exécuter :

```powershell
$env:KEYSTORE_FILE=(Resolve-Path ".\magic-book-upload.keystore").Path
$env:KEYSTORE_PASSWORD="VOTRE_MOT_DE_PASSE"
$env:KEY_ALIAS="magicbook"
$env:KEY_PASSWORD="VOTRE_MOT_DE_PASSE_DE_CLE"
```

```powershell
npm run android:aab
```

```powershell
npm run android:apk
```

Les sorties finales se trouvent dans :

```text
release/Magic-Book-Powersports-4.0.0-production.aab
release/Magic-Book-Powersports-4.0.0-production.apk
```

## Double vérification

```powershell
npm run verify:playstore
```

Le contrôle doit terminer avec `MAGIC BOOK POWERSPORTS 4.0 — VALIDATION REUSSIE`.
