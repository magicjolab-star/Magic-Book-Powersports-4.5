#!/usr/bin/env bash
# ===================================================================================
# MAGIC BOOK POWERSPORTS (par Magic app production)
# Création originale, conception et développement par Jonathan Labelle, PDG.
# Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
# Tous droits réservés.
# ===================================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./install.sh /chemin/vers/jolab-magic-book-2.1" >&2
  exit 2
fi

KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$1" && pwd)"

node "$KIT_DIR/scripts/patch-project.mjs" "$PROJECT_ROOT"
cd "$PROJECT_ROOT"
npm install
npm run verify:playstore

echo "Magic Book Powersports 4.0 est prêt pour le build Android."
