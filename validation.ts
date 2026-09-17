import type { EvaluationInput, EvaluationResult } from './models.ts';
export const emptyEvaluation:EvaluationInput = {
 category:'VTT',make:'',model:'',year:'',vin:'',usage:'',usageUnit:'km',condition:'Bon'
};
export function normalizeVin(value:string):string {
 return value.toUpperCase().replace(/\s/g,'');
}
// Format validation only: does not decode, certify, or verify a VIN checksum.
export function validateEvaluation(input:EvaluationInput,currentYear=new Date().getFullYear()) {
 const errors:Partial<Record<keyof EvaluationInput,string>> = {};
 if (!input.make.trim()) errors.make='Indiquez la marque.';
 if (!input.model.trim()) errors.model='Indiquez le modèle.';
 if (!/^\d{4}$/.test(input.year) || Number(input.year)<1950 || Number(input.year)>currentYear+2) {
  errors.year='Vérifiez l’année du véhicule.';
 }
 const vin=normalizeVin(input.vin);
 if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
  errors.vin='Le NIV doit contenir 17 caractères, sans I, O ni Q. Ce champ est optionnel.';
 }
 if (input.usage && (!/^\d+(?:[.,]\d+)?$/.test(input.usage) || Number(input.usage.replace(',','.'))>10000000)) {
  errors.usage='Indiquez une valeur numérique positive valide.';
 }
 return errors;
}
export function isValidResult(result:EvaluationResult):boolean {
 return !!result && Number.isFinite(result.low) && Number.isFinite(result.high)
  && result.low>=0 && result.high>=result.low && result.currency==='CAD'
  && typeof result.explanation==='string';
}
