#!/usr/bin/env bash
# ===================================================================================
# MAGIC BOOK POWERSPORTS (par Magic app production)
# Création originale, conception et développement par Jonathan Labelle, PDG.
# Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
# Tous droits réservés.
# ===================================================================================

set -euo pipefail

if [ "$#" -lt 4 ] || [ "$#" -gt 5 ]; then
  echo "Usage: ./build-playstore.sh PROJECT_ROOT API_ORIGIN REVENUECAT_PUBLIC_KEY KEYSTORE_FILE [KEY_ALIAS]" >&2
  exit 2
fi

PROJECT_ROOT="$(cd "$1" && pwd)"
export MAGIC_API_ORIGIN="$2"
export REVENUECAT_ANDROID_PUBLIC_SDK_KEY="$3"
export KEYSTORE_FILE="$(cd "$(dirname "$4")" && pwd)/$(basename "$4")"
export KEY_ALIAS="${5:-magicbook}"

read -r -s -p "Mot de passe du keystore: " KEYSTORE_PASSWORD
echo
read -r -s -p "Mot de passe de la clé: " KEY_PASSWORD
echo
export KEYSTORE_PASSWORD KEY_PASSWORD

cd "$PROJECT_ROOT"
npm run android:aab
npm run android:apk
npm run verify:playstore

ls -l \
  release/Magic-Book-Powersports-4.0.0-production.aab \
  release/Magic-Book-Powersports-4.0.0-production.apk

unset KEYSTORE_PASSWORD KEY_PASSWORD
