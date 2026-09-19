import type { ExpoConfig } from 'expo/config';
// Test namespace only; not the published application's confirmed package.
const production = process.env.EAS_BUILD_PROFILE === 'production';
const androidPackage = process.env.APP_ANDROID_PACKAGE || 'com.magicproduction.magicbook';
const versionCode = Number(process.env.APP_ANDROID_VERSION_CODE || '50000');
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) throw new Error('Invalid Android versionCode');
if (production && process.env.EAS_BUILD_PLATFORM !== 'ios' && (!process.env.APP_ANDROID_PACKAGE || !process.env.APP_ANDROID_VERSION_CODE)) {
 throw new Error('Production: provide the existing Play package and a new versionCode.');
}
if (production && process.env.EAS_BUILD_PLATFORM === 'ios' && !process.env.APP_IOS_BUNDLE_ID) {
 throw new Error('Production: provide the existing iOS bundle identifier.');
}
const config: ExpoConfig = {
 name:'Magic Book Powersports', slug:'magic-book-powersports-beta', version:'5.0.0',
 orientation:'default', userInterfaceStyle:'dark', backgroundColor:'#030B17',
 icon:'./assets/brand/app-icon.png', platforms:['android','ios','web'],
 android:{package:androidPackage,versionCode,adaptiveIcon:{foregroundImage:'./assets/brand/adaptive-foreground.png',backgroundColor:'#000000'}},
 ios:{supportsTablet:true,bundleIdentifier:process.env.APP_IOS_BUNDLE_ID || 'ca.magicapp.magicbook.beta'},
 web:{bundler:'metro',output:'single',favicon:'./assets/brand/favicon.png'},
 plugins:[
  ['expo-splash-screen',{image:'./assets/brand/app-icon.png',imageWidth:200,resizeMode:'contain',backgroundColor:'#030B17'}],
  ['expo-video',{supportsBackgroundPlayback:false,supportsPictureInPicture:false}],
  'expo-asset','expo-system-ui'
 ], extra:{releaseLabel:'V5.0 Production'}
};
export default config;
