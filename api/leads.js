const SALES = {
  to: ['theorecreo.ventes@gmail.com'],
  cc: ['jonathan@theorecreo.com', 'jeff@theorecreo.com'],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseLead(body) {
  if (!body || typeof body !== 'object') return null;

  const lead = {
    clientName: clean(body.clientName, 160),
    clientPhone: clean(body.clientPhone, 64),
    clientEmail: clean(body.clientEmail, 320).toLowerCase(),
    category: clean(body.category, 80),
    brand: clean(body.brand, 100),
    model: clean(body.model, 120),
    year: clean(body.year, 8),
    mileageHours: clean(body.mileageHours, 80),
    condition: clean(body.condition, 80),
    notes: clean(body.notes, 2000),
  };

  if (!lead.clientName || !lead.clientPhone || !EMAIL_RE.test(lead.clientEmail)) return null;
  if (!lead.category || !lead.brand || !lead.model || !lead.year) return null;
  return lead;
}

function buildText(lead) {
  return [
    'Nouveau prospect reçu via Magic Book Powersports :',
    '',
    'INFORMATIONS CLIENT :',
    `- Nom : ${lead.clientName}`,
    `- Téléphone : ${lead.clientPhone}`,
    `- Courriel : ${lead.clientEmail}`,
    '',
    'DÉTAILS DU VÉHICULE :',
    `- Catégorie : ${lead.category}`,
    `- Marque : ${lead.brand}`,
    `- Modèle : ${lead.model}`,
    `- Année : ${lead.year}`,
    `- Kilométrage / Heures : ${lead.mileageHours || 'Non spécifié'}`,
    `- Condition : ${lead.condition || 'Non spécifiée'}`,
    '',
    'NOTES / COMMENTAIRES :',
    lead.notes || 'Aucune note supplémentaire',
  ].join('\n');
}

export default async function handler(req, res) {
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

  const from = process.env.LEAD_FROM_EMAIL || 'Magic Book Powersports <noreply@magic-app.ca>';
  const subject = `🔥 Nouveau Prospect Powersports - ${lead.brand} ${lead.model} (${lead.year})`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: SALES.to,
        cc: SALES.cc,
        reply_to: lead.clientEmail,
        subject,
        text: buildText(lead),
      }),
    });

    const raw = await response.text();
    let provider = raw;
    try { provider = raw ? JSON.parse(raw) : null; } catch {}

    if (!response.ok) {
      console.error('[lead] Resend rejected request', { status: response.status });
      return res.status(502).json({ error: 'EMAIL_DELIVERY_FAILED' });
    }

    return res.status(200).json({ ok: true, delivery: provider });
  } catch (error) {
    console.error('[lead] delivery exception', error instanceof Error ? error.message : String(error));
    return res.status(502).json({ error: 'EMAIL_DELIVERY_FAILED' });
  }
}
