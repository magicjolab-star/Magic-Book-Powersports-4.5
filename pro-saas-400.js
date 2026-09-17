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

  const SESSION_KEY = "magicbook-auth-session-v1";

  const DEFAULT_BRANDING = Object.freeze({
    company_name: "Magic Book Powersports",
    representative_name: "Jonathan Labelle - Votre spécialiste",
    phone: "",
    email: "Jonathan@magic-app.ca",
    website: "https://magic-app.ca",
    address: "",
    logo_url: "",
    primary_color: "#061121",
    accent_color: "#5DE2E7",
    gold_color: "#C59B5F",
    plan_tier: "standard"
  });

  const $ = (id) => document.getElementById(id);

  let state = {
    role: "standard",
    status: "inactive",
    canCustomize: false,
    branding: { ...DEFAULT_BRANDING }
  };

  function currentSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function accessToken() {
    return String(currentSession()?.access_token || "");
  }

  async function parseResponse(response) {
    const responseText = await response.text();
    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(`Réponse serveur invalide (${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          data?.error ||
          data?.message ||
          `Erreur HTTP ${response.status}`
      );
    }

    return data;
  }

  async function apiRequest(
    path,
    { method = "GET", body, authenticated = true } = {}
  ) {
    const headers = {
      Accept: "application/json"
    };

    if (authenticated) {
      const token = accessToken();

      if (!token) {
        throw new Error(
          "Connectez-vous à Magic Book Powersports pour continuer."
        );
      }

      headers.Authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, {
      method,
      headers,
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    return parseResponse(response);
  }

  function normalizeBranding(branding) {
    return {
      ...DEFAULT_BRANDING,
      ...(branding || {})
    };
  }

  function validColor(value, fallback) {
    return /^#[0-9A-F]{6}$/i.test(String(value || ""))
      ? String(value).toUpperCase()
      : fallback;
  }

  function contrastColor(hex) {
    const value = validColor(hex, "#5DE2E7").slice(1);
    const channels = [
      value.slice(0, 2),
      value.slice(2, 4),
      value.slice(4, 6)
    ].map((channel) => parseInt(channel, 16) / 255);

    const linear = channels.map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    );

    const luminance =
      0.2126 * linear[0] +
      0.7152 * linear[1] +
      0.0722 * linear[2];

    return luminance > 0.52 ? "#001015" : "#FFFFFF";
  }

  function applyBranding(branding, active) {
    const root = document.documentElement;
    const primary = validColor(branding.primary_color, "#061121");
    const accent = validColor(branding.accent_color, "#5DE2E7");
    const gold = validColor(branding.gold_color, "#C59B5F");

    root.style.setProperty("--tenant-primary", primary);
    root.style.setProperty("--tenant-accent", accent);
    root.style.setProperty("--tenant-gold", gold);
    root.style.setProperty("--tenant-on-accent", contrastColor(accent));
    root.dataset.brandActive = active ? "true" : "false";
  }

  function setMessage(elementId, message, type = "") {
    const element = $(elementId);
    if (!element) return;

    element.textContent = message || "";
    element.className =
      "mbp-message" +
      (message ? " show" : "") +
      (type ? ` ${type}` : "");
  }

  function showDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function uiTemplate() {
    return `
      <section id="mbpProStatus" class="mbp-pro-status" aria-live="polite">
        <div>
          <span id="mbpPlanBadge" class="mbp-badge">VERSION STANDARD</span>
          <h2 id="mbpPlanTitle">Magic Book Powersports</h2>
          <p id="mbpPlanText">Les fonctions essentielles d’évaluation sont actives.</p>
        </div>
        <button id="mbpOpenPaywall" class="mbp-outline-button" type="button">Découvrir Pro</button>
      </section>

      <section id="mbpCompanyPanel" class="mbp-panel" hidden>
        <div class="mbp-panel-head">
          <div>
            <span class="mbp-eyebrow">MARQUE BLANCHE</span>
            <h2>Paramètres de l'entreprise</h2>
            <p>Personnalisez l’application, les impressions et les évaluations partagées.</p>
          </div>
          <span class="mbp-active-badge">PRO ACTIF</span>
        </div>

        <div class="mbp-logo-row">
          <div class="mbp-logo-preview">
            <img id="mbpLogoPreview" alt="Logo de l’entreprise" hidden>
            <span id="mbpLogoPlaceholder">LOGO</span>
          </div>
          <div>
            <label class="mbp-outline-button" for="mbpLogoFile">Téléverser le logo</label>
            <input id="mbpLogoFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>
            <small>PNG, JPG ou WebP — maximum 2 Mo.</small>
          </div>
        </div>

        <div class="mbp-fields-grid">
          <label>Nom de l’entreprise<input id="mbpCompanyName" type="text" maxlength="160" autocomplete="organization"></label>
          <label>Représentant<input id="mbpRepresentative" type="text" maxlength="160" autocomplete="name"></label>
          <label>Téléphone<input id="mbpPhone" type="tel" maxlength="60" autocomplete="tel"></label>
          <label>Courriel<input id="mbpEmail" type="email" maxlength="254" autocomplete="email"></label>
          <label>Site Web<input id="mbpWebsite" type="url" maxlength="500" placeholder="https://..."></label>
          <label>Adresse complète<textarea id="mbpAddress" maxlength="500" rows="3"></textarea></label>
        </div>

        <div class="mbp-colors-grid">
          <label>Couleur principale<input id="mbpPrimaryColor" type="color" value="#061121"></label>
          <label>Couleur d’accent<input id="mbpAccentColor" type="color" value="#5DE2E7"></label>
          <label>Couleur dorée<input id="mbpGoldColor" type="color" value="#C59B5F"></label>
        </div>

        <div class="mbp-actions-row">
          <button id="mbpSaveCompany" class="mbp-primary-button" type="button">Enregistrer l’identité</button>
          <button id="mbpManageSubscription" class="mbp-outline-button" type="button">Gérer mon abonnement</button>
        </div>
        <div id="mbpCompanyMessage" class="mbp-message" aria-live="polite"></div>
      </section>

      <section id="mbpTipsPanel" class="mbp-panel" hidden>
        <span class="mbp-eyebrow">VENDEUR DE RÊVE</span>
        <h2>Conseils Pro</h2>
        <blockquote>Le rêve nous amène le client. L’honnêteté le fait signer. Le service le fait revenir.</blockquote>
        <div class="mbp-tips-grid">
          <article><strong>✨ Commencez par le rêve</strong><p>Identifiez l’expérience recherchée : liberté, performance, aventure, famille ou utilité avant de défendre un prix.</p></article>
          <article><strong>⚖️ Expliquez la valeur</strong><p>Séparez clairement le prix affiché, la valeur de marché et la valeur de reprise. Une offre comprise paraît plus équitable.</p></article>
          <article><strong>🛠️ Protégez la marge honnêtement</strong><p>Appuyez l’offre sur l’inspection, la remise en état, la garantie, le risque d’inventaire et la vitesse probable de revente.</p></article>
          <article><strong>🤝 Fermez avec une action claire</strong><p>Terminez par une prochaine étape précise : inspection, dépôt, essai, approbation ou rendez-vous de livraison.</p></article>
        </div>
      </section>
    `;
  }

  function paywallTemplate() {
    return `
      <dialog id="mbpPaywall" class="mbp-dialog">
        <button id="mbpClosePaywall" class="mbp-close" type="button" aria-label="Fermer">×</button>
        <span class="mbp-badge">MAGIC BOOK POWERSPORTS PRO</span>
        <h2>Rentabilisez chaque transaction</h2>
        <p class="mbp-lead">Passez à la version Pro pour rentabiliser chaque transaction. Personnalisez l'application aux couleurs de votre concession, intégrez votre logo sur les évaluations clients et débloquez nos astuces de négociation exclusives. Le rêve nous amène le client. L’honnêteté le fait signer. Le service le fait revenir.</p>

        <div class="mbp-price-grid">
          <article>
            <h3>Forfait Mensuel Pro</h3>
            <strong id="mbpMonthlyPrice">149,99 $ CA</strong>
            <small>par mois</small>
            <button class="mbp-primary-button" type="button" data-mbp-plan="monthly">Choisir le forfait mensuel</button>
          </article>
          <article class="featured">
            <h3>Forfait Annuel Pro</h3>
            <strong id="mbpAnnualPrice">1 499,99 $ CA</strong>
            <small>par année</small>
            <span class="mbp-saving">Économie de 299,89 $ CA par année</span>
            <button class="mbp-primary-button" type="button" data-mbp-plan="annual">Choisir le forfait annuel</button>
          </article>
        </div>

        <p class="mbp-renewal">Abonnement renouvelé automatiquement selon la période choisie, sauf annulation dans Google Play. Le prix et les conditions affichés par Google Play au moment de l’achat font foi.</p>
        <div class="mbp-actions-row">
          <button id="mbpRestorePurchases" class="mbp-outline-button" type="button">Restaurer mes achats</button>
          <button id="mbpPaywallManage" class="mbp-outline-button" type="button">Gérer mon abonnement</button>
        </div>
        <p id="mbpBillingNotice" class="mbp-fine">Google Play Billing est requis pour souscrire.</p>
        <div id="mbpBillingMessage" class="mbp-message" aria-live="polite"></div>
        <div class="mbp-legal"><a href="/privacy.html">Politique de confidentialité</a><a href="/terms.html">Conditions d’utilisation</a></div>
      </dialog>
    `;
  }

  function leadTemplate() {
    return `
      <dialog id="mbpLeadDialog" class="mbp-dialog mbp-lead-dialog">
        <button id="mbpCloseLead" class="mbp-close" type="button" aria-label="Fermer">×</button>
        <h2>Parler à votre spécialiste</h2>
        <p class="mbp-fine">La version gratuite achemine la demande à Jonathan Labelle - Votre spécialiste.</p>
        <form id="mbpLeadForm">
          <label>Nom<input id="mbpLeadName" type="text" maxlength="120" required></label>
          <label>Courriel<input id="mbpLeadEmail" type="email" maxlength="254" required></label>
          <label>Téléphone<input id="mbpLeadPhone" type="tel" maxlength="60"></label>
          <label>Message<textarea id="mbpLeadMessage" maxlength="2000" rows="5"></textarea></label>
          <input id="mbpLeadTrap" name="company_website" type="text" tabindex="-1" autocomplete="off" class="mbp-honeypot" aria-hidden="true">
          <button class="mbp-primary-button" type="submit">Envoyer ma demande</button>
          <div id="mbpLeadMessageStatus" class="mbp-message" aria-live="polite"></div>
        </form>
      </dialog>
    `;
  }

  function mountUi() {
    if ($("mbpProStatus")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "mbpSaasRoot";
    wrapper.innerHTML = uiTemplate();

    const accountHost =
      $("screen-account") ||
      $("accountPanel") ||
      document.querySelector('[data-screen="account"]') ||
      document.querySelector("main") ||
      document.body;

    accountHost.appendChild(wrapper);

    const paywallHolder = document.createElement("div");
    paywallHolder.innerHTML = paywallTemplate() + leadTemplate();

    while (paywallHolder.firstElementChild) {
      document.body.appendChild(paywallHolder.firstElementChild);
    }

    const resultActions = document.querySelector(".result-actions");

    if (resultActions && !$("mbpShareResult")) {
      const shareButton = document.createElement("button");
      shareButton.id = "mbpShareResult";
      shareButton.className = "action secondary-action";
      shareButton.type = "button";
      shareButton.textContent = "🔗 Créer un lien client";
      resultActions.appendChild(shareButton);
    }

    bindUiEvents();
  }

  function bindUiEvents() {
    $("mbpOpenPaywall")?.addEventListener("click", openPaywall);
    $("mbpClosePaywall")?.addEventListener("click", () =>
      closeDialog($("mbpPaywall"))
    );

    document.querySelectorAll("[data-mbp-plan]").forEach((button) => {
      button.addEventListener("click", () =>
        purchasePlan(button.dataset.mbpPlan)
      );
    });

    $("mbpRestorePurchases")?.addEventListener(
      "click",
      restorePurchases
    );

    $("mbpManageSubscription")?.addEventListener(
      "click",
      manageSubscription
    );

    $("mbpPaywallManage")?.addEventListener(
      "click",
      manageSubscription
    );

    $("mbpSaveCompany")?.addEventListener(
      "click",
      saveCompanySettings
    );

    $("mbpLogoFile")?.addEventListener("change", (event) => {
      uploadLogo(event.target.files?.[0]);
      event.target.value = "";
    });

    $("mbpShareResult")?.addEventListener("click", () =>
      createShare().catch((error) => alert(error.message))
    );

    $("mbpCloseLead")?.addEventListener("click", () =>
      closeDialog($("mbpLeadDialog"))
    );

    $("mbpLeadForm")?.addEventListener("submit", submitLead);
  }

  function fillSettingsForm() {
    const branding = normalizeBranding(state.branding);

    const values = {
      mbpCompanyName: branding.company_name,
      mbpRepresentative: branding.representative_name,
      mbpPhone: branding.phone,
      mbpEmail: branding.email,
      mbpWebsite: branding.website,
      mbpAddress: branding.address,
      mbpPrimaryColor: branding.primary_color,
      mbpAccentColor: branding.accent_color,
      mbpGoldColor: branding.gold_color
    };

    Object.entries(values).forEach(([elementId, value]) => {
      if ($(elementId)) $(elementId).value = value || "";
    });

    const preview = $("mbpLogoPreview");
    const placeholder = $("mbpLogoPlaceholder");

    if (preview && branding.logo_url) {
      preview.src = branding.logo_url;
      preview.hidden = false;
      if (placeholder) placeholder.hidden = true;
    } else {
      if (preview) preview.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }
  }

  function renderState() {
    const pro = state.canCustomize;

    document.documentElement.dataset.pro = pro ? "true" : "false";

    if ($("mbpCompanyPanel")) $("mbpCompanyPanel").hidden = !pro;
    if ($("mbpTipsPanel")) $("mbpTipsPanel").hidden = !pro;

    if ($("mbpPlanBadge")) {
      $("mbpPlanBadge").textContent = pro
        ? "PRO ACTIF"
        : "VERSION STANDARD";
    }

    if ($("mbpPlanText")) {
      $("mbpPlanText").textContent = pro
        ? "La marque blanche, les exports personnalisés et les conseils Pro sont actifs."
        : "Les fonctions essentielles d’évaluation sont actives.";
    }

    if ($("mbpOpenPaywall")) {
      $("mbpOpenPaywall").textContent = pro
        ? "Paramètres Pro"
        : "Découvrir Pro";
    }

    applyBranding(
      state.branding,
      pro || document.documentElement.dataset.shared === "true"
    );

    fillSettingsForm();
    renderContactCard();
  }

  async function loadServerState() {
    if (!accessToken()) {
      state = {
        role: "standard",
        status: "inactive",
        canCustomize: false,
        branding: { ...DEFAULT_BRANDING }
      };

      renderState();
      return state;
    }

    try {
      const data = await apiRequest("/api/pro?action=me");

      state = {
        role: data.entitlement?.role || "standard",
        status: data.entitlement?.status || "inactive",
        canCustomize: data.can_customize === true,
        branding: normalizeBranding(data.branding)
      };
    } catch (error) {
      console.warn("Magic Book Powersports Pro:", error);
    }

    renderState();
    return state;
  }

  async function openPaywall() {
    if (state.canCustomize) {
      $("mbpCompanyPanel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    showDialog($("mbpPaywall"));
    await loadGooglePlayPlans();
  }

  async function loadGooglePlayPlans() {
    const billing = window.MagicBilling;
    const planButtons = document.querySelectorAll("[data-mbp-plan]");

    if (!billing?.isAvailable) {
      planButtons.forEach((button) => {
        button.disabled = true;
      });

      if ($("mbpBillingNotice")) {
        $("mbpBillingNotice").textContent =
          "Les nouveaux abonnements sont disponibles dans l’application Android publiée sur Google Play.";
      }

      return;
    }

    if (!accessToken()) {
      planButtons.forEach((button) => {
        button.disabled = true;
      });

      setMessage(
        "mbpBillingMessage",
        "Connectez-vous avant de choisir un abonnement.",
        "error"
      );
      return;
    }

    try {
      setMessage("mbpBillingMessage", "Chargement des offres Google Play…");
      const plans = await billing.loadPlans();

      if ($("mbpMonthlyPrice")) {
        $("mbpMonthlyPrice").textContent = plans.monthly.priceString;
      }

      if ($("mbpAnnualPrice")) {
        $("mbpAnnualPrice").textContent = plans.annual.priceString;
      }

      const monthlyButton = document.querySelector(
        '[data-mbp-plan="monthly"]'
      );
      const annualButton = document.querySelector(
        '[data-mbp-plan="annual"]'
      );

      if (monthlyButton) monthlyButton.disabled = !plans.monthly.available;
      if (annualButton) annualButton.disabled = !plans.annual.available;

      setMessage(
        "mbpBillingMessage",
        "Paiement sécurisé par Google Play."
      );
    } catch (error) {
      setMessage("mbpBillingMessage", error.message, "error");
    }
  }

  async function purchasePlan(plan) {
    const billing = window.MagicBilling;

    if (!billing?.isAvailable) {
      setMessage(
        "mbpBillingMessage",
        "Google Play Billing est disponible dans l’application Android.",
        "error"
      );
      return;
    }

    if (!accessToken()) {
      closeDialog($("mbpPaywall"));
      document
        .querySelector('[data-screen="account"], #accountPanel')
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const button = document.querySelector(
      `[data-mbp-plan="${plan}"]`
    );

    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }

    setMessage("mbpBillingMessage", "Ouverture de Google Play…");

    try {
      await billing.purchase(plan);
      await loadServerState();
      closeDialog($("mbpPaywall"));

      setMessage(
        "mbpCompanyMessage",
        "Votre abonnement Pro est actif. Bienvenue! 🎉",
        "success"
      );

      $("mbpCompanyPanel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (error) {
      if (error?.userCancelled !== true) {
        setMessage("mbpBillingMessage", error.message, "error");
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    }
  }

  async function restorePurchases() {
    const billing = window.MagicBilling;

    if (!billing?.isAvailable) {
      setMessage(
        "mbpBillingMessage",
        "La restauration est disponible dans l’application Android.",
        "error"
      );
      return;
    }

    try {
      setMessage("mbpBillingMessage", "Restauration des achats…");
      await billing.restorePurchases();
      await loadServerState();

      if (state.canCustomize) {
        closeDialog($("mbpPaywall"));
        setMessage(
          "mbpCompanyMessage",
          "Votre abonnement Pro a été restauré.",
          "success"
        );
      } else {
        setMessage(
          "mbpBillingMessage",
          "Aucun abonnement Pro actif n’a été trouvé.",
          "error"
        );
      }
    } catch (error) {
      setMessage("mbpBillingMessage", error.message, "error");
    }
  }

  async function manageSubscription() {
    try {
      await window.MagicBilling?.manageSubscription?.();
    } catch (error) {
      setMessage("mbpCompanyMessage", error.message, "error");
      setMessage("mbpBillingMessage", error.message, "error");
    }
  }

  async function saveCompanySettings() {
    if (!state.canCustomize) {
      await openPaywall();
      return;
    }

    const payload = {
      company_name: $("mbpCompanyName")?.value || "",
      representative_name: $("mbpRepresentative")?.value || "",
      phone: $("mbpPhone")?.value || "",
      email: $("mbpEmail")?.value || "",
      website: $("mbpWebsite")?.value || "",
      address: $("mbpAddress")?.value || "",
      primary_color: $("mbpPrimaryColor")?.value || "#061121",
      accent_color: $("mbpAccentColor")?.value || "#5DE2E7",
      gold_color: $("mbpGoldColor")?.value || "#C59B5F"
    };

    try {
      setMessage("mbpCompanyMessage", "Enregistrement…");

      const result = await apiRequest("/api/pro?action=save-settings", {
        method: "POST",
        body: payload
      });

      state.branding = normalizeBranding(result.branding);
      renderState();

      setMessage(
        "mbpCompanyMessage",
        "Identité de l’entreprise enregistrée.",
        "success"
      );
    } catch (error) {
      setMessage("mbpCompanyMessage", error.message, "error");
    }
  }

  async function fileToBase64(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";

    for (let offset = 0; offset < bytes.length; offset += 32768) {
      binary += String.fromCharCode(
        ...bytes.subarray(offset, offset + 32768)
      );
    }

    return btoa(binary);
  }

  async function uploadLogo(file) {
    if (!file) return;

    if (!state.canCustomize) {
      await openPaywall();
      return;
    }

    if (file.size > 2_097_152) {
      setMessage(
        "mbpCompanyMessage",
        "Le logo doit peser au maximum 2 Mo.",
        "error"
      );
      return;
    }

    const allowedTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/webp"
    ]);

    if (!allowedTypes.has(file.type)) {
      setMessage(
        "mbpCompanyMessage",
        "Formats acceptés : PNG, JPG ou WebP.",
        "error"
      );
      return;
    }

    try {
      setMessage("mbpCompanyMessage", "Téléversement du logo…");

      const result = await apiRequest("/api/pro?action=upload-logo", {
        method: "POST",
        body: {
          mime_type: file.type,
          data_base64: await fileToBase64(file)
        }
      });

      state.branding = normalizeBranding(result.branding);
      renderState();

      setMessage("mbpCompanyMessage", "Logo enregistré.", "success");
    } catch (error) {
      setMessage("mbpCompanyMessage", error.message, "error");
    }
  }

  function createElement(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function safeWebsite(value) {
    if (!value) return "";

    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol)
        ? parsed.toString()
        : "";
    } catch {
      return "";
    }
  }

  function renderContactCard() {
    const card =
      document.querySelector("[data-magicbook-brand-contact]") ||
      document.querySelector(".card.contact");

    if (!card) return;

    const branding = normalizeBranding(state.branding);
    card.setAttribute("data-magicbook-brand-contact", "");
    card.replaceChildren();

    if (branding.logo_url) {
      const logo = createElement("img", "mbp-contact-logo");
      logo.src = branding.logo_url;
      logo.alt = branding.company_name || "Logo de l’entreprise";
      logo.loading = "lazy";
      card.appendChild(logo);
    }

    card.appendChild(
      createElement(
        "div",
        "mbp-contact-company",
        branding.company_name
      )
    );

    card.appendChild(
      createElement(
        "div",
        "mbp-contact-person",
        branding.representative_name
      )
    );

    const lines = createElement("div", "mbp-contact-lines");

    function addLink(label, value, href) {
      if (!value || !href) return;

      const link = createElement("a", "", `${label} ${value}`);
      link.href = href;

      if (href.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      lines.appendChild(link);
    }

    addLink(
      "📞",
      branding.phone,
      branding.phone
        ? `tel:${branding.phone.replace(/[^\d+]/g, "")}`
        : ""
    );

    addLink(
      "✉️",
      branding.email,
      branding.email ? `mailto:${branding.email}` : ""
    );

    addLink(
      "🌐",
      branding.website,
      safeWebsite(branding.website)
    );

    if (branding.address) {
      lines.appendChild(
        createElement("span", "", `📍 ${branding.address}`)
      );
    }

    card.appendChild(lines);

    const leadButton = createElement(
      "button",
      "action secondary-action",
      "📩 Envoyer une demande"
    );
    leadButton.type = "button";
    leadButton.addEventListener("click", openLeadDialog);
    card.appendChild(leadButton);
  }

  function currentEvaluation() {
    return window.MagicBookCore?.getCurrentResult?.() || null;
  }

  function preparePrintBranding() {
    const results = $("results");
    if (!results) return;

    results
      .querySelectorAll(".mbp-print-only")
      .forEach((element) => element.remove());

    const branding = normalizeBranding(state.branding);
    const header = createElement(
      "div",
      "mbp-print-only mbp-print-header"
    );

    if (branding.logo_url) {
      const logo = createElement("img");
      logo.src = branding.logo_url;
      logo.alt = branding.company_name;
      header.appendChild(logo);
    }

    header.appendChild(createElement("h1", "", branding.company_name));
    header.appendChild(
      createElement("p", "", branding.representative_name)
    );

    const contact = [
      branding.phone,
      branding.email,
      branding.website
    ]
      .filter(Boolean)
      .join(" • ");

    if (contact) header.appendChild(createElement("p", "", contact));
    if (branding.address) {
      header.appendChild(createElement("p", "", branding.address));
    }

    const footer = createElement(
      "div",
      "mbp-print-only mbp-print-footer",
      `${branding.company_name} — ${branding.representative_name} — Évaluation produite avec Magic Book Powersports`
    );

    results.prepend(header);
    results.appendChild(footer);
  }

  async function createShare() {
    const current = currentEvaluation();

    if (!current?.data || !current?.payload) {
      throw new Error("Générez d’abord une évaluation.");
    }

    const vehicleName = [
      current.payload.annee,
      current.payload.marque,
      current.payload.modele
    ]
      .filter(Boolean)
      .join(" ");

    const result = await apiRequest("/api/pro?action=create-share", {
      method: "POST",
      body: {
        vehicle_name: vehicleName,
        payload: current.payload,
        result: current.data
      }
    });

    if (navigator.share) {
      await navigator.share({
        title: `Évaluation ${vehicleName}`,
        url: result.share_url
      });
    } else {
      await navigator.clipboard.writeText(result.share_url);
      alert("Lien client copié.");
    }
  }

  async function loadSharedResult() {
    const token = new URLSearchParams(location.search).get("share");
    if (!token) return false;

    const result = await apiRequest(
      `/api/pro?action=get-share&token=${encodeURIComponent(token)}`,
      { authenticated: false }
    );

    document.documentElement.dataset.shared = "true";

    state = {
      role: result.branding?.plan_tier === "pro" ? "pro" : "standard",
      status: "shared",
      canCustomize: false,
      branding: normalizeBranding(result.branding)
    };

    applyBranding(state.branding, true);

    if (!window.MagicBookCore?.renderSharedResult) {
      throw new Error("Le moteur de résultat partagé n’est pas disponible.");
    }

    window.MagicBookCore.renderSharedResult(
      result.result,
      result.payload
    );

    renderContactCard();
    preparePrintBranding();
    return true;
  }

  function openLeadDialog() {
    const currentEmail =
      $("accountEmailText")?.textContent ||
      $("accountEmail")?.value ||
      "";

    if (currentEmail && $("mbpLeadEmail")) {
      $("mbpLeadEmail").value = currentEmail;
    }

    showDialog($("mbpLeadDialog"));
  }

  async function submitLead(event) {
    event.preventDefault();

    const current = currentEvaluation();
    const vehicleName = current?.payload
      ? [
          current.payload.annee,
          current.payload.marque,
          current.payload.modele
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    const body = {
      name: $("mbpLeadName")?.value || "",
      email: $("mbpLeadEmail")?.value || "",
      phone: $("mbpLeadPhone")?.value || "",
      message: $("mbpLeadMessage")?.value || "",
      company_website: $("mbpLeadTrap")?.value || "",
      vehicle_name: vehicleName,
      evaluation: current?.data || {}
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (accessToken()) {
      headers.Authorization = `Bearer ${accessToken()}`;
    }

    try {
      setMessage("mbpLeadMessageStatus", "Envoi en cours…");

      const response = await fetch("/api/lead", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify(body)
      });

      const result = await parseResponse(response);

      setMessage(
        "mbpLeadMessageStatus",
        result.message,
        "success"
      );

      $("mbpLeadForm")?.reset();
    } catch (error) {
      setMessage("mbpLeadMessageStatus", error.message, "error");
    }
  }

  function installResultObserver() {
    const cards = $("cards");
    if (!cards) return;

    const observer = new MutationObserver(() => {
      requestAnimationFrame(renderContactCard);
    });

    observer.observe(cards, {
      childList: true,
      subtree: true
    });
  }

  async function initialize() {
    mountUi();
    installResultObserver();

    window.addEventListener("beforeprint", preparePrintBranding);

    window.addEventListener("magicbook:billing-changed", async () => {
      await loadServerState();
    });

    window.addEventListener("magicbook:auth-wall", async (event) => {
      if (event.detail?.logged) {
        try {
          await window.MagicBilling?.identifyCurrentUser?.();
        } catch {
          // Le compte gratuit demeure entièrement fonctionnel.
        }

        await loadServerState();
      } else {
        state = {
          role: "standard",
          status: "inactive",
          canCustomize: false,
          branding: { ...DEFAULT_BRANDING }
        };
        renderState();
      }
    });

    const shared = await loadSharedResult();

    if (!shared) {
      await loadServerState();

      if (accessToken() && window.MagicBilling?.isAvailable) {
        try {
          await window.MagicBilling.refresh();
        } catch {
          // Aucun abonnement n’est requis pour la version gratuite.
        }
      }

      if (new URLSearchParams(location.search).get("pro") === "1") {
        await openPaywall();
      }
    }
  }

  window.MagicBookPro = Object.freeze({
    refresh: loadServerState,
    openPaywall,
    openLeadDialog,
    getState() {
      return {
        ...state,
        branding: { ...state.branding }
      };
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
