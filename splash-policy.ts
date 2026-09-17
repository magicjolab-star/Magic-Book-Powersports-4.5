export type SplashGate = {
  ready: boolean; minimumElapsed: boolean; mediaFailed: boolean;
  mediaExpired: boolean; skipped: boolean; reducedMotion: boolean;
};
// Video failure/timeout must NEVER mark application data as ready.
export function mayRevealDashboard(gate: SplashGate): boolean {
  return gate.ready && (gate.minimumElapsed || gate.mediaFailed || gate.mediaExpired || gate.skipped || gate.reducedMotion);
}
export async function withTimeout<T>(work: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      fn();
    };
    const abort = () => finish(() => reject(new Error('Initialisation annulée.')));
    const timer = setTimeout(() => finish(() => reject(new Error('Le chargement prend trop de temps. Réessayez.'))), ms);
    signal?.addEventListener('abort', abort, { once: true });
    work.then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
    if (signal?.aborted) abort();
  });
}
