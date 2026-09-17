import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
export function useReducedMotion():boolean|null {
 const [reduced,setReduced]=useState<boolean|null>(null);
 useEffect(()=>{
  let live=true;
  const timer=setTimeout(()=>{if(live)setReduced(value=>value??true);},1500);
  AccessibilityInfo.isReduceMotionEnabled()
   .then(value=>{if(live)setReduced(value);})
   .catch(()=>{if(live)setReduced(true);});
  const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  return ()=>{live=false;clearTimeout(timer);subscription.remove();};
 },[]);
 return reduced;
}
