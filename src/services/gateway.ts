import type { AppSnapshot, EvaluationInput, EvaluationResult, ProAction } from '../domain/models.ts';

export interface MagicBookGateway {
  bootstrap(signal: AbortSignal): Promise<AppSnapshot>;
  evaluate(input: EvaluationInput, signal: AbortSignal): Promise<EvaluationResult>;
  runProAction(action: ProAction, signal: AbortSignal): Promise<void>;
}

export function previewSnapshot(): AppSnapshot {
  return {
    mode: 'preview',
    displayName: null,
    entitlement: null,
    sharedRecords: [],
    canEvaluate: false,
  };
}

export const previewGateway: MagicBookGateway = {
  async bootstrap(signal) {
    if (signal.aborted) throw new Error('Chargement annulé.');
    return previewSnapshot();
  },
  async evaluate() {
    throw new Error('Le moteur d’évaluation n’est pas connecté.');
  },
  async runProAction() {
    throw new Error('Le module PRO n’est pas connecté au backend sécurisé.');
  },
};
