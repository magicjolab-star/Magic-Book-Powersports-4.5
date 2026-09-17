# Raccordement à Magic Book existant

## Périmètre exact

Cette livraison est une interface mobile. Aucun accès à votre dépôt, base de production ou compte d'achat n'a été utilisé. Aucun fichier SQL n'est appliqué.

Le contrat `MagicBookGateway` expose `bootstrap(signal)` et `evaluate(input, signal)`. Les retours sont typés dans `src/domain/models.ts`. Implémenter ces deux méthodes avec vos services déjà déployés, puis remplacer `previewGateway` par l'adaptateur authentifié dans `App.tsx` (ou injecter ce gateway depuis votre racine existante).

`bootstrap` doit restaurer/valider la session et renvoyer les données autorisées. Une session absente ne doit pas étre remplacée par un faux utilisateur ni par un abonnement actif. Le booléen `canEvaluate` pilote uniquement l'UX; le serveur doit revérifier les droits pour chaque requéte.

`evaluate` doit appeler le moteur existant avec une authentification valide. La structure `{ low, high, currency, explanation }` est une proposition pour l'affichage, non une structure définie par le SQL fourni. Adaptez la réponse du moteur réel dans ce gateway. Les entrées sont validées pour l'UX puis DOIVENT étre revalidées côté serveur. Le contrôle de format du NIV ne remplace ni un décodage constructeur ni la vérification d'un numéro de série.

Les requétes longues doivent respecter AbortSignal. Les appels authentifiés doivent utiliser HTTPS et les jetons de l'utilisateur obtenus depuis votre couche d'authentification, pas une clé secrète intégrée au bundle. Ne journalisez pas les jetons, NIV ou coordonnées clients.

## Contraintes présentes dans votre SQL

Source : `docs/schema/20260904_magic_book_powersports_v4.sql`, conservée sans modification.

- `pro_entitlements` est accessible en SELECT au rôle `authenticated`, uniquement pour la ligne `auth.uid() = user_id`. Le client ne doit pas modifier son rôle, son plan ou son activation.
- Le SQL révoque les privilèges `anon` et `authenticated` sur `company_settings`, `shared_evaluations`, `revenuecat_webhook_events` et `lead_submissions`. Les lectures/écritures utiles à l'interface doivent passer par un serveur autorisé, pas par une clé `service_role` embarquée.
- Les enregistrements `shared_evaluations` comportent `payload`, `result` et `branding_snapshot` en JSONB : leurs sous-champs ne sont pas spécifiés. Ne pas inférer un moteur de calcul à partir de ces noms.
- `token_hash` est une empreinte, pas une URL publique et pas un jeton à distribuer au client.
- Le fichier crée un journal de webhooks RevenueCat, mais ne contient pas le code du webhook ni un SDK d'achat. Cette interface n'en invente pas l'implémentation.

La table `company_settings` est décrite par un modèle TypeScript pour votre raccordement ultérieur. Le thème Beta 4.1 reste celui demandé; aucune personnalisation de marque blanche non authentifiée n'est appliquée.

## Dépendances

Les versions de `package.json` sont alignées sur le template officiel SDK 57 et son catalogue de modules consultés le 12 septembre 2026. Un accès npm est nécessaire pour installer et vérifier les dépendances. Exécuter `npx expo install --check`; en cas de désalignement voulu, utiliser `npx expo install --fix` puis relancer les vérifications et committer le lockfile généré.

Ne pas installer aveuglément ces versions par-dessus un projet plus ancien : migrer dans une branche de test et conserver la navigation, la session et les services déjà fonctionnels.
