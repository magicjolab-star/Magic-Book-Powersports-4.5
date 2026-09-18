// Source-derived read models: 20260904_magic_book_powersports_v4.sql.
// The original SQL is included unchanged in docs/schema, never executed by this app.
export interface ProEntitlement {
 user_id:string;
 role:'standard'|'pro'|'admin';
 plan_code:'FREE'|'PRO_MONTHLY'|'PRO_ANNUAL';
 billing_provider:'none'|'google_play'|'manual';
 status:'inactive'|'pending'|'active'|'billing_issue'|'canceled'|'expired';
 is_active:boolean;
 expiration_date:string|null;
 will_renew:boolean;
 billing_issue_detected_at:string|null;
 revenuecat_app_user_id:string|null;
 revenuecat_product_id:string|null;
 revenuecat_base_plan_id:string|null;
 revenuecat_entitlement_id:string;
 revenuecat_environment:'PRODUCTION'|'SANDBOX'|null;
 last_revenuecat_event_id:string|null;
 last_verified_at:string|null;
 created_at:string; updated_at:string;
}
export interface CompanySettings {
 user_id:string; company_name:string; representative_name:string;
 phone:string; email:string; website:string; address:string;
 logo_url:string; logo_path:string;
 primary_color:string; accent_color:string; gold_color:string;
 created_at:string; updated_at:string;
}
