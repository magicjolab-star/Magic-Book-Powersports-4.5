import { decodeDrafts, encodeDrafts, STORAGE_KEY, type Draft } from '../domain/drafts';
export async function initializeDrafts(): Promise<Draft[]> {
  // Real readiness: read and validate the local repository. No fake loading percentage.
  try { return decodeDrafts(window.localStorage.getItem(STORAGE_KEY)); }
  catch { throw new Error('Les dossiers locaux ne peuvent pas être chargés. Vérifiez l’accès au stockage ou réinitialisez-le.'); }
}
export function persistDrafts(drafts: Draft[]): void {
  const payload = encodeDrafts(drafts);
  try { window.localStorage.setItem(STORAGE_KEY, payload); }
  catch { throw new Error('Enregistrement impossible : stockage indisponible ou plein. Aucun dossier n’a été ajouté.'); }
}
export function resetDrafts(): void { window.localStorage.removeItem(STORAGE_KEY); }
