(()=>{
  'use strict';

  const $=id=>document.getElementById(id);

  const SESSION_KEY='magicbook-auth-session-v1';
  const PRO_ENTITLEMENT='pro';
  const MONTHLY_PRODUCT='magic_book_pro_v1:monthly-autorenewing';
  const ANNUAL_PRODUCT='magic_book_pro_v1:annual-autorenewing';

  const MARKET_CONFIG=Object.freeze({
    active:'recreational',
    recreational:{
      enabled:true,
      labelFr:'Véhicules de loisirs',
      labelEn:'Recreational vehicles'
    },
    automobile:{
      enabled:false,
      visible:false,
      labelFr:'Automobile',
      labelEn:'Automotive'
    }
  });

  window.MAGIC_BOOK_MARKETS=MARKET_CONFIG;

  const cleanVin=value=>String(value||'')
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g,'')
    .slice(0,17);

  const vinNote={
    fr:"L'ajout du NIV rendra votre estimation plus réaliste. Une mauvaise transcription manuelle de votre modèle peut donner un prix erroné à la hausse ou à la baisse.",
    en:'Adding the VIN can make your estimate more realistic. An incorrect manual transcription of the model may produce a price that is too high or too low.'
  };

  const vinLabel={fr:'NIV / VIN',en:'VIN'};
  const optional={fr:'Optionnel',en:'Optional'};

  let purchases=null;
  let revenueCatUI=null;
  let revenueCatConfigured=false;
  let revenueCatUserId=null;
  let offeringsPromise=null;
  let cachedOfferings=null;

  function currentLang(){
    return $('language')?.value==='en'?'en':'fr';
  }

  function readSession(){
    try{
      return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    }catch{
      return null;
    }
  }

  function decodeBase64UrlUtf8(segment){
    const normalized=String(segment||'')
      .replace(/-/g,'+')
      .replace(/_/g,'/');

    const padded=normalized.padEnd(
      normalized.length+((4-(normalized.length%4))%4),
      '='
    );

    const binary=atob(padded);
    const bytes=new Uint8Array(binary.length);

    for(let i=0;i<binary.length;i+=1){
      bytes[i]=binary.charCodeAt(i);
    }

    if(typeof TextDecoder==='function'){
      return new TextDecoder('utf-8',{fatal:false}).decode(bytes);
    }

    let encoded='';
    for(const byte of bytes){
      encoded+=`%${byte.toString(16).padStart(2,'0')}`;
    }
    return decodeURIComponent(encoded);
  }

  function jwtPayload(){
    try{
      const token=readSession()?.access_token;
      const segment=String(token||'').split('.')[1];
      if(!segment)return null;
      return JSON.parse(decodeBase64UrlUtf8(segment));
    }catch(error){
      console.warn('[MagicBook JWT decode]',error);
      return null;
    }
  }

  function jwtSubject(){
    const subject=jwtPayload()?.sub;
    return typeof subject==='string'&&subject.trim()
      ?subject.trim()
      :null;
  }

  function isNativeCapacitor(){
    try{
      const platform=window.Capacitor?.getPlatform?.();
      return platform==='android'||platform==='ios';
    }catch{
      return false;
    }
  }

  function registerNativePlugin(name){
    return window.Capacitor?.registerPlugin
      ?window.Capacitor.registerPlugin(name)
      :null;
  }

  async function runtimeConfig(){
    const response=await fetch('/api/runtime-config',{cache:'no-store'});
    const data=await response.json().catch(()=>({}));

    if(!response.ok){
      throw new Error(data?.error||'Runtime config unavailable.');
    }

    return data;
  }

  function activeEntitlement(customerInfo){
    return customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT]||null;
  }

  function emitPremiumState(customerInfo){
    const entitlement=activeEntitlement(customerInfo);

    const detail={
      active:!!entitlement,
      entitlement:PRO_ENTITLEMENT,
      productIdentifier:entitlement?.productIdentifier||null,
      expirationDate:entitlement?.expirationDate||null,
      monthlyProduct:MONTHLY_PRODUCT,
      annualProduct:ANNUAL_PRODUCT
    };

    document.documentElement.dataset.magicBookPro=
      detail.active?'active':'inactive';

    window.dispatchEvent(
      new CustomEvent('magicbook:premium-state',{detail})
    );

    return detail;
  }

  async function ensurePlugins(){
    if(purchases)return;

    purchases=registerNativePlugin('Purchases');
    revenueCatUI=registerNativePlugin('RevenueCatUI');

    if(!purchases){
      throw new Error('RevenueCat Purchases plugin unavailable.');
    }
  }

  async function configureRevenueCat(){
    if(!isNativeCapacitor()){
      return {native:false,active:false};
    }

    await ensurePlugins();

    const desiredUserId=jwtSubject();

    if(!revenueCatConfigured){
      const config=await runtimeConfig();
      const apiKey=String(
        config?.revenueCatGooglePublicSdkKey||''
      ).trim();

      if(!apiKey){
        throw new Error(
          'RevenueCat Android Public SDK Key unavailable.'
        );
      }

      await purchases.configure({
        apiKey,
        appUserID:desiredUserId||null
      });

      revenueCatConfigured=true;
      revenueCatUserId=desiredUserId||null;
    }else if(desiredUserId&&desiredUserId!==revenueCatUserId){
      const login=await purchases.logIn({
        appUserID:desiredUserId
      });

      revenueCatUserId=desiredUserId;
      emitPremiumState(login?.customerInfo||login);
    }

    void preloadOfferings();
    return refreshPremium();
  }

  async function customerInfo(){
    if(!revenueCatConfigured){
      await configureRevenueCat();
    }

    const result=await purchases.getCustomerInfo();
    return result?.customerInfo||result;
  }

  async function refreshPremium(){
    if(!isNativeCapacitor()){
      return {native:false,active:false};
    }

    const info=await customerInfo();
    return emitPremiumState(info);
  }

  async function preloadOfferings(){
    if(!isNativeCapacitor()){
      return null;
    }

    if(cachedOfferings){
      return cachedOfferings;
    }

    if(offeringsPromise){
      return offeringsPromise;
    }

    offeringsPromise=(async()=>{
      if(!revenueCatConfigured){
        await configureRevenueCat();
      }

      const result=await purchases.getOfferings();
      cachedOfferings=result?.offerings||result||null;

      window.dispatchEvent(
        new CustomEvent('magicbook:offerings-ready',{
          detail:{
            ready:!!cachedOfferings?.current
          }
        })
      );

      return cachedOfferings;
    })();

    try{
      return await offeringsPromise;
    }finally{
      offeringsPromise=null;
    }
  }

  async function currentOffering(){
    const result=await preloadOfferings();
    const current=result?.current;

    if(!current){
      throw new Error(
        'RevenueCat current offering is not configured.'
      );
    }

    return current;
  }

  async function purchase(plan){
    if(!isNativeCapacitor()){
      throw new Error(
        'Les achats Pro sont disponibles dans l’application Android Google Play.'
      );
    }

    await configureRevenueCat();

    const current=await currentOffering();
    const selected=plan==='annual'
      ?current.annual
      :current.monthly;

    if(!selected){
      throw new Error(
        `RevenueCat package ${plan} unavailable.`
      );
    }

    const result=await purchases.purchasePackage({
      aPackage:selected
    });

    return emitPremiumState(
      result?.customerInfo||result
    );
  }

  async function presentPaywall(){
    if(!isNativeCapacitor()){
      throw new Error(
        'Le paywall est disponible dans l’application Android Google Play.'
      );
    }

    await configureRevenueCat();
    await preloadOfferings();

    if(!revenueCatUI){
      throw new Error('RevenueCatUI plugin unavailable.');
    }

    await revenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier:PRO_ENTITLEMENT,
      displayCloseButton:true
    });

    return refreshPremium();
  }

  async function restore(){
    if(!isNativeCapacitor()){
      throw new Error(
        'La restauration est disponible dans l’application Android Google Play.'
      );
    }

    await configureRevenueCat();

    const result=await purchases.restorePurchases();

    return emitPremiumState(
      result?.customerInfo||result
    );
  }

  function updateVinCopy(){
    const l=currentLang();
    if($('nivLabel'))$('nivLabel').textContent=vinLabel[l];
    if($('nivOptional'))$('nivOptional').textContent=optional[l];
    if($('nivNote'))$('nivNote').textContent=vinNote[l];
    if($('niv'))$('niv').placeholder='Ex: 5Y4AN07Y0RA123456';
  }

  function installHeroFix(){
    const hero=document.querySelector('img.hero');
    if(!hero)return;
    hero.removeAttribute('srcset');
    hero.decoding='sync';
    hero.loading='eager';
    hero.fetchPriority='high';
  }

  function installVinIntegration(){
    const niv=$('niv');
    if(!niv)return;

    niv.value=cleanVin(niv.value);

    niv.addEventListener('input',()=>{
      const next=cleanVin(niv.value);
      if(niv.value!==next)niv.value=next;
      try{saveDraft()}catch{}
    });

    niv.addEventListener('blur',()=>{
      niv.value=cleanVin(niv.value);
    });

    if(typeof formState==='function'){
      const baseFormState=formState;
      formState=function(){
        const state=baseFormState();
        return {
          ...state,
          niv:cleanVin(niv.value),
          market:'recreational'
        };
      };
    }

    if(typeof apiPayload==='function'){
      const baseApiPayload=apiPayload;
      apiPayload=function(){
        const payload=baseApiPayload();
        const vin=cleanVin(niv.value);

        if(vin){
          const prefix=payload.autres_accessoires
            ?`${payload.autres_accessoires}\n`
            :'';

          payload.autres_accessoires=
            `${prefix}NIV/VIN: ${vin}`;

          payload.niv=vin;
        }

        payload.market='recreational';
        payload.currency=payload.currency||'CAD';

        return payload;
      };
    }

    if(typeof fillForm==='function'){
      const baseFillForm=fillForm;
      fillForm=function(payload){
        const out=baseFillForm(payload);
        if($('niv')){
          $('niv').value=cleanVin(payload?.niv||'');
        }
        return out;
      };
    }

    try{
      const draft=JSON.parse(
        localStorage.getItem(
          typeof DRAFT_KEY!=='undefined'
            ?DRAFT_KEY
            :'magicbook-draft'
        )||'null'
      );

      if(draft?.niv){
        niv.value=cleanVin(draft.niv);
      }
    }catch{}

    $('reset')?.addEventListener('click',()=>{
      niv.value='';
    });

    $('language')?.addEventListener(
      'change',
      ()=>setTimeout(updateVinCopy,0)
    );

    updateVinCopy();
  }

  function enhanceAccessibility(){
    document
      .querySelectorAll('a[target="_blank"]')
      .forEach(anchor=>{
        if(!anchor.rel.includes('noopener')){
          anchor.rel=(anchor.rel+' noopener').trim();
        }
      });

    const go=$('go');
    if(go)go.setAttribute('aria-describedby','nivNote');
  }

  function loadV44(){
    if(!document.querySelector('link[data-v44]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href='/style-v44.css?v=600';
      link.dataset.v44='true';
      document.head.appendChild(link);
    }

    if(!document.querySelector('script[data-v44]')){
      const script=document.createElement('script');
      script.src='/v44-ui.js?v=600';
      script.defer=true;
      script.dataset.v44='true';
      document.head.appendChild(script);
    }
  }

  function launchIntro(){
    if(window.__MAGIC_V44_INTRO__)return;

    const legacy=$('magic-studio-intro');
    const legacyVideo=$('magic-studio-intro-video');

    if(legacyVideo){
      try{legacyVideo.pause()}catch{}
      legacyVideo.removeAttribute('autoplay');
      legacyVideo.muted=true;
    }

    if(legacy)legacy.style.display='none';

    const script=document.createElement('script');
    script.src='/v44-intro.js?v=600';
    script.defer=true;
    document.head.appendChild(script);
  }

  function markReady(){
    document.documentElement.dataset.magicBookVersion='6.0.0';
    document.documentElement.dataset.market='recreational';
    document.documentElement.dataset.automobile='prepared-hidden';
  }

  function bindButton(selector,action){
    document.querySelectorAll(selector).forEach(button=>{
      if(button.dataset.revenuecatBound)return;
      button.dataset.revenuecatBound='1';

      button.addEventListener('click',async event=>{
        event.preventDefault();
        if(button.disabled)return;

        button.disabled=true;

        try{
          await action();
        }catch(error){
          console.error('[MagicBook RevenueCat]',error);

          window.dispatchEvent(
            new CustomEvent('magicbook:premium-error',{
              detail:{
                error:error?.message||String(error)
              }
            })
          );
        }finally{
          button.disabled=false;
        }
      });
    });
  }

  function bindPremiumButtons(){
    bindButton(
      '[data-magic-pro-paywall],#proPaywall',
      presentPaywall
    );

    bindButton(
      '[data-magic-pro-monthly],#proMonthly',
      ()=>purchase('monthly')
    );

    bindButton(
      '[data-magic-pro-annual],#proAnnual',
      ()=>purchase('annual')
    );

    bindButton(
      '[data-magic-pro-restore],#proRestore',
      restore
    );
  }

  async function authenticatedRevenueCatWarmup(){
    if(!isNativeCapacitor())return;

    try{
      await configureRevenueCat();
      await preloadOfferings();
    }catch(error){
      console.warn('[MagicBook RevenueCat warmup]',error);
    }
  }

  function installAuthWarmup(){
    window.addEventListener('magicbook:auth-wall',event=>{
      if(event?.detail?.logged===true){
        cachedOfferings=null;
        void authenticatedRevenueCatWarmup();
      }
    });

    window.addEventListener('storage',event=>{
      if(event.key===SESSION_KEY&&event.newValue){
        cachedOfferings=null;
        void authenticatedRevenueCatWarmup();
      }
    });
  }

  window.MagicBookPremium={
    entitlement:PRO_ENTITLEMENT,

    products:{
      monthly:MONTHLY_PRODUCT,
      annual:ANNUAL_PRODUCT
    },

    configure:configureRevenueCat,
    refresh:refreshPremium,
    preload:preloadOfferings,
    purchase,
    presentPaywall,
    restore,
    isNative:isNativeCapacitor
  };

  function init(){
    installHeroFix();
    installVinIntegration();
    enhanceAccessibility();
    markReady();
    loadV44();
    launchIntro();
    bindPremiumButtons();
    installAuthWarmup();

    if(isNativeCapacitor()&&jwtSubject()){
      void authenticatedRevenueCatWarmup();
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
