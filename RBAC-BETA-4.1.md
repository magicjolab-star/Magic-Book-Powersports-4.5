# Magic Book Powersports Beta 4.1 - Supabase RBAC

Authority chain:
1. Supabase Auth establishes identity.
2. public.pro_entitlements + RevenueCat determine Public/PRO.
3. UI feature toggles are presentation only.
4. PostgreSQL RLS remains the server-side authorization boundary.
5. dealership_members scopes B2B data by dealership.

Required CI secrets:
- SUPABASE_ACCESS_TOKEN
- SUPABASE_DB_PASSWORD
- SUPABASE_PROJECT_REF

The Firebase App Distribution step may remain for binary distribution. Firebase is not an authorization authority.
