const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
export const APP = Object.freeze({
  name: 'Magic Book Powersports', version: '4.1.0-beta.1', release: 'BETA 4.1',
  companyUrl: 'https://magic-app.ca',
  icon: asset('app-icon.png'), footerLogo: asset('footer-logo.png'),
  splashVideo: asset('splash-video.mp4'),
  minSplashMs: 2000, mediaTimeoutMs: 12000, bootTimeoutMs: 10000, fadeMs: 420,
});
