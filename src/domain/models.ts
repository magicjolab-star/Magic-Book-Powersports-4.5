import type { ProEntitlement } from '../types/database';

export type Tab = 'home' | 'evaluate' | 'history' | 'account';
export type VehicleCategory = 'VTT' | 'Côte-à-côte' | 'Moto' | 'Motomarine' | 'Bateau';
export type Condition = 'Excellent' | 'Bon' | 'À remettre en état';
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD';
export type ProAction = 'acquisition-target' | 'deal-analysis' | 'negotiation-assistant';

export type VehicleCategoryInput = VehicleCategory;

export type EvaluationInput = {
  category: VehicleCategory;
  make: string;
  model: string;
  year: string;
  vin: string;
  usage: string;
  usageUnit: 'km' | 'h';
  condition: Condition;
};

export type EvaluationResult = {
  low: number;
  high: number;
  currency: CurrencyCode;
  explanation: string;
};

export type SharedRecord = {
  id: string;
  vehicle_name: string;
  created_at: string;
  expires_at: string;
};

export type AppSnapshot = {
  mode: 'preview' | 'connected';
  displayName: string | null;
  entitlement: ProEntitlement | null;
  sharedRecords: SharedRecord[];
  canEvaluate: boolean;
};

export type BootstrapState = {
  status: 'loading' | 'ready' | 'degraded';
  snapshot: AppSnapshot;
  error: string | null;
};
