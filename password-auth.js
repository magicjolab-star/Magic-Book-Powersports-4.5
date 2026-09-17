/**
 * ===================================================================================
 * MAGIC BOOK POWERSPORTS — MAGIC APP PRODUCTION
 * Création originale, conception et développement par Jonathan Labelle, PDG.
 * Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
 * Tous droits réservés.
 * ===================================================================================
 */

"use strict";

const FALLBACK_SUPABASE_URL = "https://ehtvkqzqijjswqvxeyeu.supabase.co";
const FALLBACK_SUPABASE_KEY = "sb_publishable_KW_Hn-zQ51MvSnjLIDJpnw_Aw3ZvNU6";

function configuration() {
  return {
    url: String(process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/\/+$/, ""),
    key: String(
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      FALLBACK_SUPABASE_KEY
    )
  };
}

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(String(value)).origin;
  } catch {
    return "";
  }
}

function requestOrigin(request) {
  const protocol = String(request.headers?.["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const host = String(request.headers?.host || "").trim();
  return host ? normalizeOrigin(`${protocol}://${host}`) : "";
}

function applyCors(request, response) {
  const origin = normalizeOrigin(request.headers?.origin);
  if (!origin) return true;

  const configured = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean);

  const allowed = new Set([
    requestOrigin(request),
    "https://magic-app.ca",
    "https://www.magic-app.ca",
    ...configured
  ]);

  if (!allowed.has(origin)) return false;

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "86400");
  response.setHeader("Vary", "Origin");
  return true;
}

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
    ? email
    : "";
}

function cleanPassword(value) {
  const password = String(value || "");
  return password.length >= 8 && password.length <= 128 ? password : "";
}

async function supabaseFetch(path, options = {}, accessToken = "") {
  const { url, key } = configuration();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${accessToken || key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(`${url}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Réponse Supabase invalide." };
  }

  if (!response.ok) {
    const error = new Error(
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      `Supabase HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

async function getUser(accessToken) {
  if (!accessToken) {
    const error = new Error("Session absente.");
    error.status = 401;
    throw error;
  }
  return supabaseFetch("/auth/v1/user", { method: "GET" }, accessToken);
}

async function syncProfile(accessToken, user, accountType) {
  const normalizedType = accountType === "professionnel"
    ? "professionnel"
    : user?.user_metadata?.user_type === "professionnel"
      ? "professionnel"
      : "particulier";

  try {
    const rows = await supabaseFetch(
      "/rest/v1/profiles?on_conflict=id",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: [
          {
            id: user.id,
            email: cleanEmail(user.email),
            account_type: normalizedType,
            marketing_consent: false,
            marketing_consent_at: null,
            marketing_source: "magic_book_powersports"
          }
        ]
      },
      accessToken
    );

    return Array.isArray(rows) ? rows[0] || null : rows;
  } catch (error) {
    console.warn("Magic Book profile sync:", error?.message || error);
    return null;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    user_metadata: user.user_metadata || {}
  };
}

module.exports = async function handler(request, response) {
  if (!applyCors(request, response)) {
    return sendJson(response, 403, {
      error: "Cette origine n’est pas autorisée.",
      code: "origin_not_allowed"
    });
  }

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Méthode non autorisée." });
  }

  const action = String(request.query?.action || "");
  const body = request.body || {};

  try {
    if (action === "login") {
      const email = cleanEmail(body.email);
      const password = cleanPassword(body.password);

      if (!email || !password) {
        return sendJson(response, 400, {
          error: "Courriel invalide ou mot de passe trop court."
        });
      }

      const session = await supabaseFetch(
        "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          body: { email, password }
        }
      );

      const user = session.user || await getUser(session.access_token);
      const profile = await syncProfile(session.access_token, user);

      return sendJson(response, 200, {
        ...session,
        user: publicUser(user),
        profile
      });
    }

    if (action === "signup") {
      const email = cleanEmail(body.email);
      const password = cleanPassword(body.password);
      const accountType = body.account_type === "professionnel"
        ? "professionnel"
        : "particulier";

      if (!email || !password) {
        return sendJson(response, 400, {
          error: "Courriel invalide ou mot de passe trop court."
        });
      }

      const result = await supabaseFetch(
        "/auth/v1/signup",
        {
          method: "POST",
          body: {
            email,
            password,
            data: {
              user_type: accountType,
              account_type: accountType,
              marketing_consent: false,
              source: "magic_book_powersports_370",
              auth_mode: "email_password"
            }
          }
        }
      );

      if (result?.access_token && result?.user) {
        result.profile = await syncProfile(
          result.access_token,
          result.user,
          accountType
        );
      }

      return sendJson(response, 200, result);
    }

    if (action === "recover") {
      const email = cleanEmail(body.email);
      if (!email) {
        return sendJson(response, 400, { error: "Adresse courriel invalide." });
      }

      const redirectTo = String(body.redirect_to || "").trim();
      const query = redirectTo
        ? `?redirect_to=${encodeURIComponent(redirectTo)}`
        : "";

      await supabaseFetch(
        `/auth/v1/recover${query}`,
        {
          method: "POST",
          body: { email }
        }
      );

      return sendJson(response, 200, { ok: true });
    }

    if (action === "refresh") {
      const refreshToken = String(body.refresh_token || "");
      if (!refreshToken) {
        return sendJson(response, 401, { error: "Jeton de renouvellement absent." });
      }

      const session = await supabaseFetch(
        "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          body: { refresh_token: refreshToken }
        }
      );

      return sendJson(response, 200, session);
    }

    if (action === "me") {
      const accessToken = String(body.access_token || "");
      const user = await getUser(accessToken);
      const profile = await syncProfile(accessToken, user);

      return sendJson(response, 200, {
        user: publicUser(user),
        profile
      });
    }

    if (action === "entitlement") {
      const accessToken = String(body.access_token || "");
      const user = await getUser(accessToken);

      const rows = await supabaseFetch(
        `/rest/v1/pro_entitlements?user_id=eq.${encodeURIComponent(user.id)}&select=role,plan_code,billing_provider,is_active,expiration_date&limit=1`,
        { method: "GET" },
        accessToken
      );

      return sendJson(response, 200, {
        entitlement: Array.isArray(rows) ? rows[0] || null : null
      });
    }

    if (action === "logout") {
      const accessToken = String(body.access_token || "");
      if (accessToken) {
        try {
          await supabaseFetch(
            "/auth/v1/logout",
            { method: "POST", body: {} },
            accessToken
          );
        } catch {
        }
      }
      return sendJson(response, 200, { ok: true });
    }

    return sendJson(response, 404, { error: "Action inconnue." });
  } catch (error) {
    console.error("Magic Book password auth:", error?.message || error);
    return sendJson(response, Number(error?.status) || 500, {
      error: error?.message || "Erreur d’authentification."
    });
  }
};
