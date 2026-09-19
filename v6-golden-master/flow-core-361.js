(()=>{
  'use strict';

  const LOGIN_FLAG='magicbook_user_logged';
  const SESSION_KEY='magicbook-auth-session-v1';
  const $=id=>document.getElementById(id);

  function readSession(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}
  }

  function hasStoredSession(){
    const session=readSession();
    return !!(session&&session.access_token);
  }

  function setGate(logged){
    const login=$('ecran-connexion');
    const app=$('ecran-application');
    if(!login||!app)return;
    if(logged){
      login.style.display='none';
      login.setAttribute('aria-hidden','true');
      app.style.display='block';
      app.removeAttribute('aria-hidden');
      document.documentElement.dataset.authWall='open';
    }else{
      login.style.display='block';
      login.removeAttribute('aria-hidden');
      app.style.display='none';
      app.setAttribute('aria-hidden','true');
      document.documentElement.dataset.authWall='locked';
    }
  }

  function markLoggedIn(){
    if(!hasStoredSession())return;
    try{localStorage.setItem(LOGIN_FLAG,'true')}catch(_){ }
    setGate(true);
  }

  function markLoggedOut(){
    try{localStorage.removeItem(LOGIN_FLAG)}catch(_){ }
    setGate(false);
  }

  function installLoginWall(){
    const flagged=localStorage.getItem(LOGIN_FLAG)==='true';
    setGate(flagged&&hasStoredSession());
    if(flagged&&!hasStoredSession())markLoggedOut();

    const profile=$('accountProfile');
    if(profile){
      const syncFromProfile=()=>{
        if(profile.classList.contains('show')&&hasStoredSession())markLoggedIn();
        else if(!hasStoredSession())markLoggedOut();
      };
      new MutationObserver(syncFromProfile).observe(profile,{attributes:true,attributeFilter:['class']});
      syncFromProfile();
    }

    window.addEventListener('storage',event=>{
      if(event.key===LOGIN_FLAG||event.key===SESSION_KEY){
        const logged=localStorage.getItem(LOGIN_FLAG)==='true'&&hasStoredSession();
        setGate(logged);
      }
    });

    window.setInterval(()=>{
      if(localStorage.getItem(LOGIN_FLAG)==='true'&&!hasStoredSession())markLoggedOut();
    },1500);
  }

  function currentLang(){return $('language')?.value==='en'?'en':'fr'}
  function cleanVin(value){return String(value||'').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,'').slice(0,17)}

  function ensureBrandPrompt(selectFresh=false){
    const brand=$('marque');
    if(!brand)return;
    let prompt=Array.from(brand.options).find(option=>option.value==='');
    if(!prompt){
      prompt=document.createElement('option');
      prompt.value='';
      prompt.disabled=true;
      brand.insertBefore(prompt,brand.firstChild);
    }
    prompt.textContent=currentLang()==='en'?'Choose a brand':'Choisir une marque';
    if(selectFresh)brand.value='';
  }

  function validYear(){
    const raw=String($('annee')?.value||'').trim();
    if(!/^\d{4}$/.test(raw))return false;
    const year=Number(raw);
    return year>=1900&&year<=new Date().getFullYear()+2;
  }

  function showStep(id,show){
    const el=$(id);
    if(!el)return;
    el.style.display=show?'block':'none';
    if(show)el.removeAttribute('aria-hidden');
    else el.setAttribute('aria-hidden','true');
  }

  function refreshProgression(){
    const brandOk=String($('marque')?.value||'').trim()!=='';
    const modelOk=brandOk&&String($('modele')?.value||'').trim()!=='';
    const yearOk=modelOk&&validYear();

    showStep('step-modele',brandOk);
    showStep('step-annee',modelOk);
    showStep('step-usage',yearOk);
    showStep('progressive-remainder',yearOk);
  }

  function setVinStatus(text,type=''){
    const status=$('vinDecodeStatus');
    if(!status)return;
    status.textContent=text||'';
    status.className='vin-decode-status'+(type?' '+type:'');
  }

  function ensureBrandValue(make){
    const select=$('marque');
    if(!select||!make)return;
    const normalized=String(make).trim().toLowerCase();
    const aliases={
      'can-am':'Can-Am','can am':'Can-Am','sea-doo':'Sea-Doo','sea doo':'Sea-Doo',
      'ski-doo':'Ski-Doo','ski doo':'Ski-Doo','harley-davidson':'Harley-Davidson',
      'bmw':'BMW Motorrad','bmw motorrad':'BMW Motorrad','gasgas':'GasGas','arctic cat':'Arctic Cat'
    };
    const preferred=aliases[normalized]||make.trim();
    let option=Array.from(select.options).find(o=>o.value.toLowerCase()===preferred.toLowerCase()||o.textContent.trim().toLowerCase()===preferred.toLowerCase());
    if(!option){
      option=document.createElement('option');
      option.value=preferred;
      option.textContent=preferred;
      const other=Array.from(select.options).find(o=>o.value==='Autre');
      select.insertBefore(option,other||null);
    }
    select.value=option.value;
  }

  async function decodeVin(){
    const input=$('niv');
    const button=$('decodeVinBtn');
    const vin=cleanVin(input?.value);
    if(input)input.value=vin;
    const en=currentLang()==='en';
    if(vin.length!==17){
      setVinStatus(en?'Enter a complete 17-character VIN.':'Entre un NIV complet de 17 caractères.','error');
      return;
    }
    if(button){button.disabled=true;button.textContent=en?'Decoding…':'Décodage…'}
    setVinStatus(en?'Looking up the vehicle…':'Identification du véhicule…','');
    try{
      const response=await fetch(`/api/vin?vin=${encodeURIComponent(vin)}`,{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||data.message||(en?'VIN not recognized.':'NIV non reconnu.'));

      if(data.make)ensureBrandValue(data.make);
      const modelParts=[data.model,data.series,data.trim].map(v=>String(v||'').trim()).filter(Boolean);
      const uniqueModel=[...new Set(modelParts.map(v=>v.replace(/\s+/g,' ')))].join(' ');
      if(uniqueModel&&$('modele'))$('modele').value=uniqueModel;
      if(data.year&&$('annee'))$('annee').value=String(data.year);
      refreshProgression();
      try{if(typeof saveDraft==='function')saveDraft()}catch(_){ }

      const found=[data.year,data.make,uniqueModel].filter(Boolean).join(' ');
      setVinStatus((en?'Vehicle identified: ':'Véhicule identifié : ')+found,'success');
    }catch(error){
      setVinStatus(error?.message||(en?'Unable to decode this VIN. Use the manual fields below.':'Impossible de décoder ce NIV. Utilise les champs manuels ci-dessous.'),'error');
    }finally{
      if(button){button.disabled=false;button.textContent=en?'Decode VIN':'Décoder le NIV'}
    }
  }

  function installVinFirst(){
    const details=$('nivDetails');
    const form=$('form');
    const brandStep=$('step-marque');
    if(!details||!form||!brandStep)return;

    const brandGrid=brandStep.parentElement;
    if(details.parentElement!==form)form.insertBefore(details,brandGrid);
    details.open=true;
    details.classList.add('vin-first-details');

    const input=$('niv');
    if(input&&!$('decodeVinBtn')){
      const button=document.createElement('button');
      button.id='decodeVinBtn';
      button.type='button';
      button.className='vin-decode-btn';
      button.textContent=currentLang()==='en'?'Decode VIN':'Décoder le NIV';
      input.insertAdjacentElement('afterend',button);
      const status=document.createElement('div');
      status.id='vinDecodeStatus';
      status.className='vin-decode-status';
      button.insertAdjacentElement('afterend',status);
      button.addEventListener('click',decodeVin);
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();decodeVin()}});
    }

    if(!$('vinManualSeparator')){
      const separator=document.createElement('div');
      separator.id='vinManualSeparator';
      separator.className='vin-manual-separator';
      separator.textContent=currentLang()==='en'?'OR — choose the vehicle manually':'OU — choisir le véhicule manuellement';
      details.insertAdjacentElement('afterend',separator);
    }
  }

  function updateOptionalCopy(){
    const en=currentLang()==='en';
    if($('nivSummary'))$('nivSummary').textContent=en?'🔎 VIN decoder (Optional)':'🔎 Décodeur NIV / VIN (Optionnel)';
    if($('accessorySummary'))$('accessorySummary').textContent=en?'➕ Add accessories (Optional)':'➕ Ajouter des accessoires (Optionnel)';
    if($('decodeVinBtn'))$('decodeVinBtn').textContent=en?'Decode VIN':'Décoder le NIV';
    if($('vinManualSeparator'))$('vinManualSeparator').textContent=en?'OR — choose the vehicle manually':'OU — choisir le véhicule manuellement';
    ensureBrandPrompt(false);
  }

  function resetProgression(){
    ensureBrandPrompt(true);
    if($('niv'))$('niv').value='';
    if($('nivDetails'))$('nivDetails').open=true;
    if($('accessoryDetails'))$('accessoryDetails').open=false;
    setVinStatus('','');
    refreshProgression();
  }

  function installProgressiveForm(){
    if(!$('form')||!$('marque'))return;

    installVinFirst();
    const hasExistingValues=!!(String($('modele')?.value||'').trim()||String($('annee')?.value||'').trim()||String($('millage')?.value||'').trim());
    ensureBrandPrompt(!hasExistingValues);
    updateOptionalCopy();
    refreshProgression();

    $('marque')?.addEventListener('change',refreshProgression);
    $('modele')?.addEventListener('input',refreshProgression);
    $('modele')?.addEventListener('change',refreshProgression);
    $('annee')?.addEventListener('input',refreshProgression);
    $('annee')?.addEventListener('change',refreshProgression);
    $('language')?.addEventListener('change',()=>setTimeout(updateOptionalCopy,0));
    $('reset')?.addEventListener('click',()=>setTimeout(resetProgression,0));

    if(typeof window.fillForm==='function'){
      const baseFillForm=window.fillForm;
      window.fillForm=function(payload){
        const result=baseFillForm(payload);
        ensureBrandPrompt(false);
        if($('nivDetails'))$('nivDetails').open=true;
        refreshProgression();
        return result;
      };
    }
  }

  function installVisualAndFooterFixes(){
    const hero=document.querySelector('.hero');
    if(hero){
      hero.onerror=()=>{
        if(!hero.dataset.fallback){hero.dataset.fallback='1';hero.src='/api/visual?size=512&v=362'}
      };
      hero.src='/magic-book-final-512.webp?v=362';
    }

    const foot=document.querySelector('.foot');
    if(foot){
      const title=foot.querySelector(':scope > b');
      const note=foot.querySelector('.note');
      if(title)title.textContent='Une création de Magic App Production';
      if(note){
        note.innerHTML='<a class="privacy-link" href="https://magic-app.ca/" target="_blank" rel="noopener noreferrer">(magic-app.ca)</a><br><span data-i18n="disclaimer">Estimation assistée par IA. Les montants doivent être validés par un professionnel avant une offre d\'achat ou d\'échange.</span><br><a class="privacy-link" href="/privacy.html" data-i18n="privacy">Politique de confidentialité</a>';
      }
    }
  }

  function injectStyles(){
    if(document.getElementById('flow362Styles'))return;
    const style=document.createElement('style');
    style.id='flow362Styles';
    style.textContent=`
      .vin-first-details{margin-bottom:10px!important}
      .vin-decode-btn{width:100%;margin-top:10px;min-height:48px;border:1px solid rgba(212,175,55,.62);border-radius:13px;background:linear-gradient(180deg,rgba(212,175,55,.18),rgba(212,175,55,.08));color:#f3e5ab;font-weight:900;cursor:pointer}
      .vin-decode-btn:disabled{opacity:.55;cursor:wait}
      .vin-decode-status{min-height:0;margin-top:9px;font-size:.82rem;line-height:1.45;color:#aebdca}
      .vin-decode-status.success{color:#9de5bd}.vin-decode-status.error{color:#ffb0a8}
      .vin-manual-separator{text-align:center;margin:6px 0 14px;color:#aebdca;font-size:.78rem;font-weight:800;letter-spacing:.04em}
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectStyles();
    installVisualAndFooterFixes();
    installLoginWall();
    installProgressiveForm();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
