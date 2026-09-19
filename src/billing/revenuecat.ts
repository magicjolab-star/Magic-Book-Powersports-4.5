import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  type CustomerInfo,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import {
  PaywallPresentationConfiguration,
  RevenueCatUI,
} from '@revenuecat/purchases-capacitor-ui';

export const PRO_ENTITLEMENT_ID = 'pro';

let configured = false;

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('RevenueCat requires a native Capacitor runtime.');
  }
}

function entitlement(info: CustomerInfo) {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] ?? null;
}

export function isPro(info: CustomerInfo): boolean {
  return !!entitlement(info);
}

export async function configureRevenueCat(appUserID?: string | null) {
  assertNative();

  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY missing.');
  }

  const state = await Purchases.isConfigured();

  if (!state.isConfigured) {
    await Purchases.configure({
      apiKey,
      appUserID: appUserID ?? null,
    });
  }

  configured = true;
  return getProStatus();
}

function requireConfigured(): void {
  if (!configured) {
    throw new Error('RevenueCat not configured.');
  }
}

export async function getProStatus() {
  requireConfigured();

  const { customerInfo } = await Purchases.getCustomerInfo();
  const active = entitlement(customerInfo);

  return {
    active: !!active,
    productIdentifier: active?.productIdentifier ?? null,
    expirationDate: active?.expirationDate ?? null,
  };
}

export async function getProPackages(): Promise<{
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
}> {
  requireConfigured();

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;

  if (!current) {
    throw new Error('RevenueCat current offering missing.');
  }

  return {
    monthly: current.monthly ?? null,
    annual: current.annual ?? null,
  };
}

export async function showProPaywall() {
  requireConfigured();

  await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    displayCloseButton: true,
    presentationConfiguration: PaywallPresentationConfiguration.FULL_SCREEN,
  });

  return getProStatus();
}

export async function purchasePro(plan: 'monthly' | 'annual') {
  requireConfigured();

  const packages = await getProPackages();
  const selected = plan === 'annual' ? packages.annual : packages.monthly;

  if (!selected) {
    throw new Error(`RevenueCat package unavailable: ${plan}`);
  }

  const result = await Purchases.purchasePackage({
    aPackage: selected,
  });

  const active = entitlement(result.customerInfo);

  return {
    active: !!active,
    productIdentifier: active?.productIdentifier ?? null,
    expirationDate: active?.expirationDate ?? null,
  };
}

export async function restoreProPurchases() {
  requireConfigured();

  const { customerInfo } = await Purchases.restorePurchases();
  const active = entitlement(customerInfo);

  return {
    active: !!active,
    productIdentifier: active?.productIdentifier ?? null,
    expirationDate: active?.expirationDate ?? null,
  };
}
