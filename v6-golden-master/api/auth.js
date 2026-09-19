const crypto = require('crypto');

const FALLBACK_SUPABASE_URL = 'https://ehtvkqzqijjswqvxeyeu.supabase.co';
const FALLBACK_SUPABASE_KEY = 'sb_publishable_KW_Hn-zQ51MvSnjLIDJpnw_Aw3ZvNU6';
const OTP_COOLDOWN_SECONDS = 60;
const OTP_HOURLY_LIMIT = 5;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const otpBuckets = new Map();

function config() {
  const url = String(process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL).replace(/\/+$/, '');
  const key = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY);
  return { url, key, enabled: Boolean(url && key) };
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function cleanEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return '';
  return email;
}

function cleanOtp(value) {
  const token = String(value || '').replace(/\D/g, '').slice(0, 6);
  return /^\d{6}$/.test(token) ? token : '';
}

function emailHash(email) {
  return crypto.createHash('sha256').update(email).digest('hex');
}

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function consumeLocalOtpQuota(req, email) {
  const now = Date.now();
  const key = `${emailHash(email)}:${clientIp(req)}`;
  let bucket = otpBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= OTP_WINDOW_MS) {
    bucket = { windowStart: now, count: 0, lastRequestedAt: 0 };
  }

  const sinceLast = now - bucket.lastRequestedAt;
  if (bucket.lastRequestedAt && sinceLast < OTP_COOLDOWN_SECONDS * 1000) {
    otpBuckets.set(key, bucket);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - sinceLast) / 1000)),
      used: bucket.count,
      limit: OTP_HOURLY_LIMIT
    };
  }

  if (bucket.count >= OTP_HOURLY_LIMIT) {
    otpBuckets.set(key, bucket);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((OTP_WINDOW_MS - (now - bucket.windowStart)) / 1000)),
      used: bucket.count,
      limit: OTP_HOURLY_LIMIT
    };
  }

  bucket.count += 1;
  bucket.lastRequestedAt = now;
  otpBuckets.set(key, bucket);

  if (otpBuckets.size > 5000) {
    for (const [bucketKey, value] of otpBuckets) {
      if (now - value.windowStart >= OTP_WINDOW_MS) otpBuckets.delete(bucketKey);
    }
  }

  return { allowed: true, retryAfter: OTP_COOLDOWN_SECONDS, used: bucket.count, limit: OTP_HOURLY_LIMIT };
}

async function supabaseFetch(path, options = {}, accessToken = '') {
  const c = config();
  if (!c.enabled) throw Object.assign(new Error('Supabase authentication is not configured.'), { status: 503 });
  const headers = {
    apikey: c.key,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  headers.Authorization = `Bearer ${accessToken || c.key}`;
  const response = await fetch(`${c.url}${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || 'Invalid response' }; }
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${response.status}`;
    const error = Object.assign(new Error(message), { status: response.status, data });
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) error.retryAfter = Number(retryAfter) || 0;
    throw error;
  }
  return data;
}

async function getUser(accessToken) {
  if (!accessToken) throw Object.assign(new Error('Session absente.'), { status: 401 });
  return supabaseFetch('/auth/v1/user', { method: 'GET' }, accessToken);
}

async function syncProfile(accessToken, user, override = {}) {
  const md = user?.user_metadata || {};
  const accountType = override.account_type === 'professionnel' || (override.account_type === undefined && md.user_type === 'professionnel') ? 'professionnel' : 'particulier';
  const marketingConsent = accountType === 'particulier' && (override.marketing_consent === true || (override.marketing_consent === undefined && md.marketing_consent === true));
  const consentAt = marketingConsent ? (override.marketing_consent_at || md.marketing_consent_at || new Date().toISOString()) : null;
  const body = [{
    id: user.id,
    email: cleanEmail(user.email),
    account_type: accountType,
    marketing_consent: marketingConsent,
    marketing_consent_at: consentAt,
    marketing_source: 'magic_book'
  }];
  const rows = await supabaseFetch('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(body)
  }, accessToken);
  return Array.isArray(rows) ? rows[0] : rows;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.end();
  }

  const action = String(req.query?.action || 'status');
  try {
    if (req.method === 'GET' && action === 'status') {
      return json(res, 200, {
        enabled: config().enabled,
        mode: 'email_otp_code',
        cloud_history: true,
        resend_cooldown_seconds: OTP_COOLDOWN_SECONDS
      });
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

    if (action === 'send-link') {
      return json(res, 410, {
        error: 'Les liens de connexion sont désactivés. Utilise le code à 6 chiffres.',
        code: 'magic_link_disabled'
      });
    }

    if (action === 'send-code') {
      const email = cleanEmail(req.body?.email);
      if (!email) return json(res, 400, { error: 'Adresse courriel invalide.' });

      const quota = consumeLocalOtpQuota(req, email);
      if (!quota.allowed) {
        res.setHeader('Retry-After', String(quota.retryAfter));
        return json(res, 429, {
          error: `Attends ${quota.retryAfter} seconde${quota.retryAfter > 1 ? 's' : ''} avant de demander un nouveau code.`,
          code: 'otp_cooldown',
          retry_after: quota.retryAfter,
          used: quota.used,
          limit: quota.limit
        });
      }

      const userType = req.body?.user_type === 'professionnel' ? 'professionnel' : 'particulier';
      const marketingConsent = userType === 'particulier' && req.body?.marketing_consent === true;
      const locale = req.body?.locale === 'en' ? 'en' : 'fr';

      try {
        await supabaseFetch('/auth/v1/otp', {
          method: 'POST',
          body: JSON.stringify({
            email,
            create_user: true,
            data: {
              user_type: userType,
              marketing_consent: marketingConsent,
              marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
              locale,
              source: 'magic-book',
              auth_mode: 'otp_code'
            }
          })
        });
      } catch (error) {
        if (Number(error?.status) === 429) {
          const retryAfter = Math.max(60, Number(error?.retryAfter) || 60);
          res.setHeader('Retry-After', String(retryAfter));
          return json(res, 429, {
            error: `Trop de codes ont été demandés. Réessaie dans environ ${retryAfter} secondes.`,
            code: 'email_rate_limited',
            retry_after: retryAfter
          });
        }
        throw error;
      }

      res.setHeader('X-MagicBook-OTP-Cooldown', String(OTP_COOLDOWN_SECONDS));
      return json(res, 200, { ok: true, mode: 'email_otp_code', cooldown: OTP_COOLDOWN_SECONDS });
    }

    if (action === 'verify-code') {
      const email = cleanEmail(req.body?.email);
      const token = cleanOtp(req.body?.token);
      if (!email) return json(res, 400, { error: 'Adresse courriel invalide.' });
      if (!token) return json(res, 400, { error: 'Le code doit contenir 6 chiffres.' });
      const session = await supabaseFetch('/auth/v1/verify', {
        method: 'POST',
        body: JSON.stringify({ email, token, type: 'email' })
      });
      const accessToken = String(session?.access_token || '');
      const user = session?.user || (accessToken ? await getUser(accessToken) : null);
      if (!accessToken || !user) return json(res, 401, { error: 'Code invalide ou expiré.' });
      const accountType = req.body?.account_type === 'professionnel' ? 'professionnel' : 'particulier';
      const marketingConsent = accountType === 'particulier' && req.body?.marketing_consent === true;
      const profile = await syncProfile(accessToken, user, {
        account_type: accountType,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? new Date().toISOString() : null
      });
      return json(res, 200, {
        ok: true,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_in: session.expires_in || 3600,
          expires_at: session.expires_at || 0,
          token_type: session.token_type || 'bearer'
        },
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          user_metadata: user.user_metadata || {}
        },
        profile
      });
    }

    if (action === 'me') {
      const token = String(req.body?.access_token || '');
      const user = await getUser(token);
      const profile = await syncProfile(token, user);
      return json(res, 200, {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          user_metadata: user.user_metadata || {}
        },
        profile
      });
    }

    if (action === 'save-profile') {
      const token = String(req.body?.access_token || '');
      const user = await getUser(token);
      const accountType = req.body?.account_type === 'professionnel' ? 'professionnel' : 'particulier';
      const marketingConsent = accountType === 'particulier' && req.body?.marketing_consent === true;
      const profile = await syncProfile(token, user, {
        account_type: accountType,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? new Date().toISOString() : null
      });
      return json(res, 200, { ok: true, profile });
    }

    if (action === 'history') {
      const token = String(req.body?.access_token || '');
      await getUser(token);
      const rows = await supabaseFetch('/rest/v1/evaluations?select=id,client_key,vehicle_name,payload,result,created_at,updated_at&order=created_at.desc&limit=20', { method: 'GET' }, token);
      return json(res, 200, { evaluations: Array.isArray(rows) ? rows : [] });
    }

    if (action === 'save-evaluation') {
      const token = String(req.body?.access_token || '');
      const user = await getUser(token);
      const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : null;
      const result = req.body?.result && typeof req.body.result === 'object' ? req.body.result : null;
      const clientKey = String(req.body?.client_key || '').slice(0, 300);
      const vehicleName = String(req.body?.vehicle_name || '').trim().slice(0, 220);
      if (!payload || !result || !clientKey || !vehicleName) return json(res, 400, { error: 'Évaluation incomplète.' });
      const body = [{ user_id: user.id, client_key: clientKey, vehicle_name: vehicleName, payload, result }];
      const rows = await supabaseFetch('/rest/v1/evaluations?on_conflict=user_id,client_key', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(body)
      }, token);
      return json(res, 200, { ok: true, evaluation: Array.isArray(rows) ? rows[0] : rows });
    }

    if (action === 'delete-evaluation') {
      const token = String(req.body?.access_token || '');
      await getUser(token);
      const clientKey = String(req.body?.client_key || '').slice(0, 300);
      if (!clientKey) return json(res, 400, { error: 'Clé absente.' });
      await supabaseFetch(`/rest/v1/evaluations?client_key=eq.${encodeURIComponent(clientKey)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      }, token);
      return json(res, 200, { ok: true });
    }

    if (action === 'refresh') {
      const refreshToken = String(req.body?.refresh_token || '');
      if (!refreshToken) return json(res, 401, { error: 'Refresh token absent.' });
      const session = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      return json(res, 200, { session });
    }

    if (action === 'logout') {
      const token = String(req.body?.access_token || '');
      if (token) {
        try { await supabaseFetch('/auth/v1/logout', { method: 'POST', body: '{}' }, token); } catch {}
      }
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'Unknown action.' });
  } catch (error) {
    console.error('Magic Book auth error:', error?.message || error);
    return json(res, Number(error?.status) || 500, { error: error?.message || 'Authentication error.' });
  }
};
