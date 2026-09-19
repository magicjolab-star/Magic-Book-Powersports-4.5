import type { CapacitorConfig } from '@capacitor/cli';

const appId = process.env.APP_ANDROID_PACKAGE || 'com.magicproduction.magicbook';

const config: CapacitorConfig = {
  appId,
  appName: 'Magic Book Powersports',
  webDir: 'dist',
  android: {
    allowMixedContent: false
  }
};

export default config;
