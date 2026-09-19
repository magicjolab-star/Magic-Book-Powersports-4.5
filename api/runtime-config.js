export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const revenueCatGooglePublicSdkKey = String(
    process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ||
    process.env.REVENUECAT_GOOGLE_PUBLIC_SDK_KEY ||
    ''
  ).trim();

  return res.status(200).json({
    revenueCatGooglePublicSdkKey,
    packageName: 'com.magicproduction.magicbook',
    entitlement: 'pro',
    products: {
      monthly: 'magic_book_pro_v1:monthly-autorenewing',
      annual: 'magic_book_pro_v1:annual-autorenewing'
    }
  });
}
