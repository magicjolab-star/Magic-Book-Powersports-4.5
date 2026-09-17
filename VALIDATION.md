# Rapport de validation — 12 septembre 2026

## Exécuté

- 17 tests Node réussis : barrière de démarrage, délais, annulations, champs obligatoires, NIV optionnel, années et utilisation, cohérence des retours, mode aperçu sans faux droits.
- Vérification syntaxique TypeScript/TSX : 24 fichiers, aucune erreur de syntaxe.
- Contrôle TypeScript strict de la couche pure (domain, types/database, services/gateway), sans dépendances natives : réussi.
- Empreintes SHA-256 des deux logos et de la vidéo : originaux identiques aux fichiers fournis.
- Exports d'icônes : PNG 1024x1024, PNG adaptatif 1024x1024 et favicon 192x192.
- Inspection du MP4 via ffprobe : 1080x1080, environ 9,92 secondes, H.264 + piste AAC. La piste audio est conservée dans le fichier mais la lecture du splash est muette.

## Non exécuté

L'accès DNS au registre npm n'était pas disponible dans l'environnement de création. Les dépendances Expo/React Native n'ont donc pas pu étre installées. Le contrôle TypeScript complet avec ces dépendances, le bundling Metro, la compilation Android/iOS et les tests visuels sur appareil restent à effectuer. Le contrôle syntaxique ne prouve pas la compatibilité de chaque prop native.

Aucun achat, authentification, calcul d'estimation ou accès aux données de production n'a été testé ni déployé.

## Recette sur appareil

1. Démarrage normal : icône système, vidéo muette, puis fondu vers l'accueil sans action de l'utilisateur.
2. Lecteur vidéo bloqué : repli sur le logo après le délai, pas de chargement infini.
3. Backend lent/indisponible : avertissement explicite et bouton Réessayer, pas de données fictives ni de droits PRO accordés.
4. Passage arrière-plan/premier plan : pause/reprise et absence d'ouverture sous un splash encore actif.
5. Réduction des animations : logo statique et transition sans animation.
6. Navigation sur tous les onglets et ouverture de `magic-app.ca` depuis le footer de chacun.
7. Formulaire : NIV vide accepté, NIV invalide signalé, unités km/h distinctes, saisie conservée uniquement tant que l'écran reste monté.
8. Petits écrans, tablette, paysage, lecteur d'écran et taille de police augmentée.
9. Lors du raccordement réel : session expirée, droits révoqués et réponse de calcul invalide doivent échouer sans résultat inventé.

Le splash natif et l'icône doivent étre vérifiés dans un véritable binaire d'essai; un aperçu web ou Expo Go ne suffit pas à les valider.
