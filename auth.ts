import { supabase } from '../services/supabase';

export type UserTier = 'public' | 'pro';

export interface WhiteLabelConfig {
  primaryColor: string;
  accentColor?: string;
  goldColor?: string;
  logoUrl: string;
}

export interface UserSession {
  uid: string;
  email: string;
  tier: UserTier;
  dealerId?: string;
  whiteLabelConfig?: WhiteLabelConfig;
}

export type EntitlementRow = {
  role: 'standard' | 'pro' | 'admin';
  plan_code: 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL';
  status: 'inactive' | 'pending' | 'active' | 'billing_issue' | 'canceled' | 'expired';
  is_active: boolean;
  expiration_date: string | null;
};

export function resolveTier(entitlement: EntitlementRow | null): UserTier {
  if (!entitlement) return 'public';

  const validPlan = entitlement.plan_code === 'PRO_MONTHLY' || entitlement.plan_code === 'PRO_ANNUAL';
  const validRole = entitlement.role === 'pro' || entitlement.role === 'admin';
  const active = entitlement.is_active && entitlement.status === 'active';
  const notExpired = !entitlement.expiration_date || new Date(entitlement.expiration_date).getTime() > Date.now();

  return validPlan && validRole && active && notExpired ? 'pro' : 'public';
}

export async function authenticateUser(email: string, password: string): Promise<UserSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error('Courriel ou mot de passe invalide.');

  const { data: entitlement, error: entitlementError } = await supabase
    .from('pro_entitlements')
    .select('role,plan_code,status,is_active,expiration_date')
    .eq('user_id', data.user.id)
    .maybeSingle<EntitlementRow>();

  if (entitlementError) {
    await supabase.auth.signOut();
    throw new Error('Impossible de vérifier les droits du compte.');
  }

  return {
    uid: data.user.id,
    email: data.user.email ?? email,
    tier: resolveTier(entitlement ?? null),
  };
}

export function requirePro(session: UserSession): void {
  if (session.tier !== 'pro') throw new Error('Cette fonctionnalité nécessite Magic Book Pro.');
}
