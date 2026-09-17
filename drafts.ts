export const categories = ['VTT', 'Côte-à-côte', 'Motocross', 'Motomarine', 'Bateau'] as const;
export const conditions = ['Excellent', 'Bon', 'À reconditionner'] as const;
export type DraftInput = {
  category: string; brand: string; model: string; year: string;
  mileage: string; hours: string; vin: string; condition: string; notes: string;
};
export type Draft = DraftInput & { id: string; createdAt: string; status: 'draft' };
export const STORAGE_KEY = 'magic-book:beta41:drafts:v1';
export const MAX_DRAFTS = 500;
export function validateDraft(input: DraftInput, now = new Date()): string[] {
  const errors: string[] = [];
  if (!categories.some(v => v === input.category)) errors.push('Choisissez une catégorie.');
  if (!input.brand.trim() || input.brand.length > 80) errors.push('Indiquez une marque (80 caractères maximum).');
  if (!input.model.trim() || input.model.length > 120) errors.push('Indiquez un modèle (120 caractères maximum).');
  const year = Number(input.year);
  if (!/^\d{4}$/.test(input.year) || year < 1900 || year > now.getFullYear() + 1) errors.push('Vérifiez l’année du véhicule.');
  for (const [value, label] of [[input.mileage, 'kilométrage'], [input.hours, 'nombre d’heures']]) {
    if (value !== '' && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) > 5000000)) errors.push(`Vérifiez le ${label}.`);
  }
  if (input.vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(input.vin.toUpperCase())) errors.push('Le NIV doit contenir 17 caractères, sans I, O ou Q. Pour un autre identifiant, utilisez les notes.');
  if (!conditions.some(v => v === input.condition)) errors.push('Choisissez un état.');
  if (input.notes.length > 1000) errors.push('Les notes sont limitées à 1 000 caractères.');
  return errors;
}
export function createDraft(input: DraftInput): Draft {
  const normalized = Object.fromEntries(Object.entries(input).map(([k,v]) => [k,v.trim()])) as DraftInput;
  normalized.vin = normalized.vin.toUpperCase();
  const errors = validateDraft(normalized);
  if (errors.length) throw new Error(errors.join(' '));
  return { ...normalized, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'draft' };
}
export function decodeDrafts(raw: string | null): Draft[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('Format de stockage invalide.');
  const record = parsed as Record<string, unknown>;
  if (record.schemaVersion !== 1 || !Array.isArray(record.drafts) || record.drafts.length > MAX_DRAFTS) throw new Error('Version ou taille du stockage invalide.');
  const keys = ['category','brand','model','year','mileage','hours','vin','condition','notes','id','createdAt'];
  const ids = new Set<string>();
  for (const draft of record.drafts) {
    if (!draft || typeof draft !== 'object' || keys.some(k => typeof draft[k] !== 'string') || draft.status !== 'draft') throw new Error('Un dossier enregistré est invalide.');
    if (!draft.id || ids.has(draft.id) || !Number.isFinite(Date.parse(draft.createdAt)) || validateDraft(draft as DraftInput).length) throw new Error('Un dossier enregistré est incomplet.');
    ids.add(draft.id);
  }
  return record.drafts as Draft[];
}
export function encodeDrafts(drafts: Draft[]): string {
  if (drafts.length > MAX_DRAFTS) throw new Error('La limite de 500 dossiers locaux est atteinte.');
  const raw = JSON.stringify({ schemaVersion: 1, drafts });
  decodeDrafts(raw);
  return raw;
}
