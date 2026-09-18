import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildLeadNotificationPayload, type ProspectLead } from '../src/services/leadNotification';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseLead(body: unknown): ProspectLead | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  const lead: ProspectLead = {
    clientName: clean(raw.clientName, 160),
    clientPhone: clean(raw.clientPhone, 64),
    clientEmail: clean(raw.clientEmail, 320).toLowerCase(),
    category: clean(raw.category, 80),
    brand: clean(raw.brand, 100),
    model: clean(raw.model, 120),
    year: clean(raw.year, 8),
    mileageHours: clean(raw.mileageHours, 80),
    condition: clean(raw.condition, 80),
    notes: clean(raw.notes, 2000),
  };

  if (!lead.clientName || !lead.clientPhone || !EMAIL_RE.test(lead.clientEmail)) return null;
  if (!lead.category || !lead.brand || !lead.model || !String(lead.year).trim()) return null;
  return lead;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const lead = parseLead(req.body);
  if (!lead) return res.status(400).json({ error: 'INVALID_LEAD' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[lead] RESEND_API_KEY missing');
    return res.status(503).json({ error: 'EMAIL_NOT_CONFIGURED' });
  }

  const message = buildLeadNotificationPayload(lead);
  const from = process.env.LEAD_FROM_EMAIL || 'Magic Book Powersports <noreply@magic-app.ca>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: message.to,
      cc: message.cc,
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
    }),
  });

  const raw = await response.text();
  let provider: unknown = raw;
  try { provider = raw ? JSON.parse(raw) : null; } catch {}

  if (!response.ok) {
    console.error('[lead] Resend rejected request', { status: response.status, provider });
    return res.status(502).json({ error: 'EMAIL_DELIVERY_FAILED' });
  }

  return res.status(200).json({ ok: true, delivery: provider });
}
