import { useEffect, useState } from 'react';
import { APP } from '../config';
import { withTimeout } from '../domain/splash-policy';
import type { Draft } from '../domain/drafts';
import { initializeDrafts, persistDrafts } from '../services/storage';
export type BootState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; drafts: Draft[] };
export function useBootstrap(attempt: number) {
  const [state, setState] = useState<BootState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    // Add existing authenticated session/data initializers here, with this abort signal.
    withTimeout(initializeDrafts(), APP.bootTimeoutMs, controller.signal)
      .then(drafts => { if (!controller.signal.aborted) setState({ status: 'ready', drafts }); })
      .catch(error => { if (!controller.signal.aborted) setState({ status: 'error', message: error instanceof Error ? error.message : 'Chargement impossible.' }); });
    return () => controller.abort();
  }, [attempt]);
  const updateDrafts = (drafts: Draft[]) => {
    persistDrafts(drafts); // Update UI only AFTER persistence succeeds.
    setState({ status: 'ready', drafts });
  };
  return { state, updateDrafts };
}
