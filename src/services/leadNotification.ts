export interface ProspectLead {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  category: string;
  brand: string;
  model: string;
  year: number | string;
  mileageHours?: string;
  condition?: string;
  notes?: string;
}

export const THEO_RECREO_SALES_EMAILS = {
  primary: 'theorecreo.ventes@gmail.com',
  teamCc: ['jonathan@theorecreo.com', 'jeff@theorecreo.com'],
} as const;

export function buildLeadNotificationPayload(lead: ProspectLead) {
  const subject = `🔥 Nouveau Prospect Powersports - ${lead.brand} ${lead.model} (${lead.year})`;

  const text = [
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

  return {
    to: [THEO_RECREO_SALES_EMAILS.primary],
    cc: [...THEO_RECREO_SALES_EMAILS.teamCc],
    replyTo: lead.clientEmail,
    subject,
    text,
  };
}
