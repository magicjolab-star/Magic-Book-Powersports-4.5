export type SplashGate = {
 bootFinished:boolean; visualReady:boolean; minimumElapsed:boolean; active:boolean;
};
export function canDismissSplash(state:SplashGate):boolean {
 return state.bootFinished && state.visualReady && state.minimumElapsed && state.active;
}
export async function withDeadline<T>(
 operation:(signal:AbortSignal)=>Promise<T>,
 milliseconds:number,
 parentSignal?:AbortSignal,
):Promise<T> {
 if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error('Invalid timeout');
 const controller = new AbortController();
 let timer:ReturnType<typeof setTimeout>|undefined;
 let onAbort:(()=>void)|undefined;
 try {
  return await new Promise<T>((resolve,reject)=>{
   onAbort = () => { controller.abort(); reject(new Error('Chargement annulé.')); };
   if (parentSignal?.aborted) { onAbort(); return; }
   parentSignal?.addEventListener('abort',onAbort,{once:true});
   timer = setTimeout(()=>{
    controller.abort();
    reject(new Error('Le chargement a pris trop de temps. Réessayez.'));
   },milliseconds);
   Promise.resolve().then(()=>operation(controller.signal)).then(resolve,reject);
  });
 } finally {
  if (timer) clearTimeout(timer);
  if (onAbort) parentSignal?.removeEventListener('abort',onAbort);
 }
}
