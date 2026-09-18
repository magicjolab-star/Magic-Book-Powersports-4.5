import { useCallback, useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { assets } from '../config/assets';
import { theme } from '../theme/theme';
import { withDeadline } from '../domain/startup';
import { previewSnapshot, type MagicBookGateway } from '../services/gateway';
import type { BootstrapState } from '../domain/models';
export function useAppBootstrap(gateway:MagicBookGateway) {
 const [attempt,setAttempt]=useState(0);
 const [state,setState]=useState<BootstrapState>({status:'loading',snapshot:previewSnapshot(),error:null});
 const retry=useCallback(()=>setAttempt(value=>value+1),[]);
 useEffect(()=>{
  const lifetime=new AbortController();
  setState(previous=>({...previous,status:'loading',error:null}));
  withDeadline(async signal=>{
   // Video loading is independent. A video failure must not lock the dashboard.
   const [,snapshot]=await Promise.all([
    Asset.loadAsync([assets.appLogo,assets.companyLogo]),gateway.bootstrap(signal)
   ]);
   return snapshot;
  },theme.motion.bootstrapTimeoutMs,lifetime.signal)
   .then(snapshot=>{if(!lifetime.signal.aborted)setState({status:'ready',snapshot,error:null});})
   .catch(()=>{
    // Fail closed: no stale PRO permissions and no invented business data.
    if(!lifetime.signal.aborted)setState({
     status:'degraded',snapshot:previewSnapshot(),
     error:'Connexion indisponible. L’interface reste accessible, sans données synchronisées.'
    });
   });
  return ()=>lifetime.abort();
 },[attempt,gateway]);
 return {...state,retry};
}
