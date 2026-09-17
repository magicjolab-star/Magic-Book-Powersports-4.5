# CI/CD - Beta 4.1

## Déclenchement

Push sur beta-release. Une exécution manuelle est également possible sur cette branche.
Les pull requests vers beta-release ne reçoivent pas de secrets de signature et
exécutent seulement quality.yml (tests et build web).

## Installation initiale

```sh
npm install
npm test
npm run build
```

Committer package-lock.json avant la première CI. Les principales dépendances sont
épinglées dans package.json ; le lockfile fixe aussi leurs dépendances transitives.
Le workflow s'arrête avec un message clair si le lockfile ou le package Android manque.

## Environnement GitHub beta

Créer un environnement beta, limiter les branches autorisées à beta-release et
configurer les valeurs suivantes. Protéger aussi les modifications du workflow.

Variables :

| Nom | Valeur |
|---|---|
| ANDROID_APP_ID | Package Android exact de votre application existante |
| ANDROID_VERSION_CODE_BASE | Entier supérieur à tous les versionCode déjà utilisés |
| FIREBASE_GROUPS | Alias des groupes séparés par une virgule ; défaut beta-testers |

Secrets :

| Nom | Valeur |
|---|---|
| ANDROID_KEYSTORE_BASE64 | Keystore encodé en Base64, sans retour à la ligne |
| ANDROID_KEYSTORE_PASSWORD | Mot de passe du keystore |
| ANDROID_KEY_ALIAS | Alias de la clé |
| ANDROID_KEY_PASSWORD | Mot de passe de la clé |
| FIREBASE_APP_ID | Identifiant Firebase de l'app Android, pas le package name |
| FIREBASE_SERVICE_ACCOUNT_JSON | JSON d'un compte de service autorisé à distribuer |

Le compte de service doit avoir les droits Firebase App Distribution nécessaires
sur le projet concerné (rôle Firebase App Distribution Admin), pas un rôle Owner global.
Enregistrer l'application avec le même package Android dans Firebase et créer le groupe.
Ne pas publier les clés ou comptes de service dans GitHub, public/, src/ ou une variable VITE_*.

Encodage local du keystore, avec Python 3, sur votre propre ordinateur :

```sh
python -c "import base64,pathlib; print(base64.b64encode(pathlib.Path('VOTRE_FICHIER.keystore').read_bytes()).decode())"
```

Copier la sortie uniquement dans le secret GitHub prévu. Ne pas la partager dans un chat.
Le workflow écrit les fichiers sensibles dans RUNNER_TEMP puis les supprime.
Les actions sont fixées à des versions explicites ; un durcissement supplémentaire
consiste à les épingler aux SHA validés par votre organisation.

## Ce que fait le pipeline

Validation des variables, npm ci, tests, injection des ressources, contrôle TypeScript,
build Vite, ajout/synchronisation Capacitor, icônes natives, assembleRelease,
bundleRelease, vérification de signature APK, archivage des trois livrables,
distribution de l'APK via la CLI officielle Firebase.

Le versionCode est ANDROID_VERSION_CODE_BASE + github.run_number. Conserver la base
ou l'augmenter lorsque nécessaire, et ne jamais la réinitialiser vers un ancien numéro.
Une réexécution du même run conserve le même versionCode.

## Google Play et TestFlight

Le fichier AAB est archivé mais ce workflow ne l'envoie pas au Play Store.
Choisir ensuite une piste de test dans la Play Console, ou ajouter un pipeline
Android Publisher API / Fastlane avec les autorisations de ce compte.

Attention : une clé d'upload Google Play peut être différente de la clé qui signe
les APK installés depuis le Play Store. Un APK Firebase signé avec la seule clé
d'upload peut ne pas pouvoir remplacer une app installée depuis Google Play.
Utiliser un appareil/profil de test distinct dans ce cas. Ne pas désinstaller une
app avec des données importantes sans sauvegarde.

Un envoi TestFlight nécessite une compilation iOS sur macOS/Xcode, une signature
Apple et un upload vers App Store Connect. Le job Linux/Firebase n'effectue pas
ces opérations. ios:prepare prépare les ressources et la version, pas la distribution.
