(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const MARKET_CONFIG=Object.freeze({
    active:'recreational',
    recreational:{enabled:true,labelFr:'Véhicules de loisirs',labelEn:'Recreational vehicles'},
    automobile:{enabled:false,visible:false,labelFr:'Automobile',labelEn:'Automotive'}
  });
  window.MAGIC_BOOK_MARKETS=MARKET_CONFIG;

  const cleanVin=value=>String(value||'').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,'').slice(0,17);
  const vinNote={
    fr:"L'ajout du NIV rendra votre estimation plus réaliste. Une mauvaise transcription manuelle de votre modèle peut donner un prix erroné à la hausse ou à la baisse.",
    en:'Adding the VIN can make your estimate more realistic. An incorrect manual transcription of the model may produce a price that is too high or too low.'
  };
  const vinLabel={fr:'NIV / VIN',en:'VIN'};
  const optional={fr:'Optionnel',en:'Optional'};

  function currentLang(){return $('language')?.value==='en'?'en':'fr'}
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
      try{saveDraft()}catch(_){ }
    });
    niv.addEventListener('blur',()=>{niv.value=cleanVin(niv.value)});

    if(typeof formState==='function'){
      const baseFormState=formState;
      formState=function(){
        const state=baseFormState();
        return {...state,niv:cleanVin(niv.value),market:'recreational'};
      };
    }
    if(typeof apiPayload==='function'){
      const baseApiPayload=apiPayload;
      apiPayload=function(){
        const payload=baseApiPayload();
        const vin=cleanVin(niv.value);
        if(vin){
          const prefix=payload.autres_accessoires?`${payload.autres_accessoires}\n`:'';
          payload.autres_accessoires=`${prefix}NIV/VIN: ${vin}`;
          payload.niv=vin;
        }
        payload.market='recreational';
        return payload;
      };
    }
    if(typeof fillForm==='function'){
      const baseFillForm=fillForm;
      fillForm=function(p){
        const out=baseFillForm(p);
        if($('niv'))$('niv').value=cleanVin(p?.niv||'');
        return out;
      };
    }
    try{
      const draft=JSON.parse(localStorage.getItem(typeof DRAFT_KEY!=='undefined'?DRAFT_KEY:'magicbook-draft')||'null');
      if(draft?.niv)niv.value=cleanVin(draft.niv);
    }catch(_){ }
    $('reset')?.addEventListener('click',()=>{niv.value=''});
    $('language')?.addEventListener('change',()=>setTimeout(updateVinCopy,0));
    updateVinCopy();
  }

  function enhanceAccessibility(){
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{
      if(!a.rel.includes('noopener'))a.rel=(a.rel+' noopener').trim();
    });
    const go=$('go');
    if(go)go.setAttribute('aria-describedby','nivNote');
  }

  function loadV44(){
    if(!document.querySelector('link[data-v44]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href='/style-v44.css?v=461';link.dataset.v44='true';document.head.appendChild(link);
    }
    if(!document.querySelector('script[data-v44]')){
      const s=document.createElement('script');s.src='/v44-ui.js?v=460';s.defer=true;s.dataset.v44='true';document.head.appendChild(s);
    }
  }

  function launchIntro(){
    if(window.__MAGIC_V44_INTRO__)return;
    const legacy=$('magic-studio-intro');
    const legacyVideo=$('magic-studio-intro-video');
    if(legacyVideo){try{legacyVideo.pause()}catch{} legacyVideo.removeAttribute('autoplay');legacyVideo.muted=true;}
    if(legacy)legacy.style.display='none';
    const s=document.createElement('script');
    s.src='/v44-intro.js?v=460';
    s.defer=true;
    document.head.appendChild(s);
  }

  function markReady(){
    document.documentElement.dataset.magicBookVersion='4.6.0';
    document.documentElement.dataset.market='recreational';
    document.documentElement.dataset.automobile='prepared-hidden';
  }

  function init(){installHeroFix();installVinIntegration();enhanceAccessibility();markReady();loadV44();launchIntro()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();