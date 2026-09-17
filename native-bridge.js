/**
 * ===================================================================================
 * MAGIC BOOK POWERSPORTS (par Magic app production)
 * Création originale, conception et développement par Jonathan Labelle, PDG.
 * Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
 * Tous droits réservés.
 * ===================================================================================
 */

(() => {
  "use strict";

  window.MAGIC_RUNTIME = Object.freeze({
    native: false,
    platform: "web",
    billing: "unavailable",
    apiOrigin: ""
  });

  window.MagicBilling = Object.freeze({
    isAvailable: false,

    async initialize() {
      return false;
    },

    async identifyCurrentUser() {
      throw new Error(
        "Google Play Billing est disponible dans l’application Android."
      );
    },

    async loadPlans() {
      return {
        monthly: {
          available: false,
          priceString: "149,99 $ CA"
        },
        annual: {
          available: false,
          priceString: "1 499,99 $ CA"
        }
      };
    },

    async purchase() {
      throw new Error(
        "Abonnez-vous depuis l’application Android Magic Book Powersports."
      );
    },

    async restorePurchases() {
      throw new Error(
        "La restauration est disponible dans l’application Android."
      );
    },

    async refresh() {
      throw new Error(
        "Google Play Billing est disponible dans l’application Android."
      );
    },

    async manageSubscription() {
      throw new Error(
        "La gestion de l’abonnement est disponible dans Google Play."
      );
    }
  });
})();
