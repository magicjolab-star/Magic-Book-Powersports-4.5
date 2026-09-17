# Magic Book Powersports — Beta 4.1

Interface React Native + TypeScript, basée sur Expo SDK 57. Livrable autonome pour Android, iOS et aperçu web. Il ne remplace pas automatiquement votre application existante ni votre site Wix.

## Démarrage

Node.js 22.16 ou ultérieur et accès au registre npm sont nécessaires.

```bash
cd magic-book-beta-4.1
npm install
npx expo install --check
npm run check:assets
npm test
npm run typecheck
npm run web
```

Pour Metro mobile : `npm start`. Pour construire un APK d'essai avec votre compte Expo : `npx eas-cli@latest build --platform android --profile preview`. Un environnement Android/iOS ou un appareil compatible est requis pour valider la partie native. Aucun binaire ni déploiement distant n'a été produit dans ce livrable.

## Ressources intégrées

| Ressource fournie | Utilisation |
| --- | --- |
| `18490.png` | Logo officiel sur l'accueil, l'en-téte et le repli du splash |
| `18485.png`, `18478.png` | Références de direction artistique, conservées sous `docs/references/` |
| `18491.mp4` | Splash vidéo local, lu sans son |
| `18462.png` | Logo d'entreprise cliquable dans le footer de tous les écrans |

Les originaux n'ont pas été redessinés, retouchés ou générés. Les exports `app-icon.png`, `adaptive-foreground.png` et `favicon.png` sont des redimensionnements techniques du logo fourni. Le premier est opaque en 1024 × 1024; le second place le logo dans une zone centrale avec des marges pour les masques Android. Les fonds noirs d'origine sont conservés, pas présentés comme transparents.

## Composants

- `App.tsx` : orchestration du démarrage, navigation et pied de page global.
- `app.config.ts` : version, icônes et splash natif statique.
- `src/theme/theme.ts` : palette bleu marine/or/cyan, espacements, rayons, durées.
- `src/components/VideoSplash.tsx` : vidéo locale, gestion des erreurs et fondu.
- `src/components/SplashBoundary.tsx` : repli si le lecteur natif échoue à l'initialisation.
- `src/components/CompanyFooter.tsx` : logo et ouverture du site officiel.
- `src/screens/HomeScreen.tsx` : tableau de bord et accès aux outils.
- `src/screens/EvaluationScreen.tsx` : formulaire, NIV optionnel et validation.
- `src/screens/HistoryScreen.tsx` : partages reçus du serveur, sans fausses données.
- `src/screens/AccountScreen.tsx` : affichage des droits transmis par le serveur.
- `src/services/gateway.ts` : point de raccordement à votre backend existant.

## Déroulement du splash

1. L'OS affiche d'abord l'icône statique configurée avec `expo-splash-screen`.
2. Après rendu de la racine React, la vidéo `18491.mp4` démarre, muette et en boucle.
3. `useAppBootstrap` charge les images et attend le résultat du gateway. Le gateway d'aperçu ne contient aucune donnée commerciale fictive.
4. Le passage au tableau de bord exige une initialisation terminée, une image vidéo rendue ou un repli disponible, l'application au premier plan et un bref temps d'affichage minimal.
5. Un fondu de 420 ms termine le splash. Il n'est pas nécessaire d'attendre les 9,92 secondes entières du clip si l'application est déjà préte.

Un lecteur bloqué plus de 4 secondes passe sur le logo. Un chargement applicatif dépassant 12 secondes aboutit à un écran dégradé explicite avec réessai, jamais à un abonnement fictivement actif. Les lecteurs et abonnements aux événements sont nettoyés; l'application en arrière-plan suspend la lecture. La préférence de réduction des animations utilise une image statique.

## Ce qui est opérationnel / ce qui doit étre raccordé

L'interface, la navigation, les ressources locales, les formulaires et leur validation sont implémentés. Le footer ouvre `https://magic-app.ca`.

L'authentification, les estimations IA, les achats Google Play / RevenueCat et les partages serveur ne sont PAS simulés et ne sont PAS déployés par ce projet. En mode aperçu, le formulaire peut vérifier une saisie, mais ne fournit pas de prix. Les formulaires restent en mémoire pendant leur affichage et sont réinitialisés au changement d'écran; ils ne constituent pas une sauvegarde de dossier.

Le fichier SQL fourni décrit des autorisations et des tables, mais pas un moteur d'estimation ni des routes HTTP. `MagicBookGateway` est donc un contrat d'adaptation proposé, pas une API existante inventée. Voir `docs/INTEGRATION.md`.

## Attention : mise à jour d'une application publiée

Le namespace par défaut `ca.magicapp.magicbook.beta` est réservé à cette base de test. L'identifiant publié réel n'était pas fourni. Avant une vraie mise à jour, conserver l'identifiant original, la configuration de signature originale et les parcours existants; choisir un `versionCode` neuf. Le numéro affiché 4.1.0 ne détermine pas le `versionCode` déjà utilisé sur Google Play.

## Vérifications effectuées

Voir `docs/VALIDATION.md`. Les tests de logique et les empreintes des médias ont été vérifiés. Aucune compilation Android/iOS ni validation visuelle sur appareil n'est revendiquée.

## Sources techniques

Versions : https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json

Template : https://raw.githubusercontent.com/expo/expo/sdk-57/templates/expo-template-blank-typescript/package.json

Vidéo : https://docs.expo.dev/versions/v57.0.0/sdk/video/

Splash : https://docs.expo.dev/versions/latest/sdk/splash-screen/

Icônes : https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/

Variables publiques : https://docs.expo.dev/guides/environment-variables/

Version Android : https://developer.android.com/studio/publish/versioning

Les ressources originales et le SQL conservent les attributions fournies par leur propriétaire.
