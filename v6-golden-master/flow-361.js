(()=>{
  'use strict';

  const SESSION_KEY='magicbook-auth-session-v1';
  const nativeFetch=window.fetch.bind(window);
  const $=id=>document.getElementById(id);

  function readSession(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}
  }

  function hasSession(){
    const session=readSession();
    return !!(session&&session.access_token);
  }

  function showSignInRequired(event){
    if(hasSession())return;
    if(event){event.preventDefault();event.stopImmediatePropagation()}
    const english=$('language')?.value==='en';
    const message=english
      ? 'Sign in by email before generating an AI evaluation. This protects Magic Book and prevents unauthorized AI usage.'
      : "Connecte-toi par courriel avant de générer une évaluation IA. Cette protection empêche l’utilisation non autorisée de Magic Book et des crédits IA.";
    const accountMessage=$('accountMessage');
    if(accountMessage){
      accountMessage.textContent=message;
      accountMessage.className='account-message show error';
    }
    const panel=$('accountPanel');
    if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});
    const email=$('accountEmail');
    if(email)setTimeout(()=>email.focus(),350);
  }

  window.fetch=function(input,init){
    const options=init?{...init}:{};
    let url='';
    try{url=typeof input==='string'?input:(input&&input.url)||''}catch(_){url=''}
    let pathname='';
    try{pathname=new URL(url,location.origin).pathname}catch(_){pathname=url}

    if(pathname==='/api/evaluate'){
      const session=readSession();
      const headers=new Headers(options.headers||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined));
      if(session&&session.access_token)headers.set('Authorization',`Bearer ${session.access_token}`);
      options.headers=headers;
    }
    return nativeFetch(input,options);
  };

  function installEvaluationGuard(){
    const button=$('go');
    if(button&&!button.dataset.authGuardInstalled){
      button.dataset.authGuardInstalled='true';
      button.addEventListener('click',showSignInRequired,true);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installEvaluationGuard,{once:true});
  else installEvaluationGuard();

  const otpGuard=document.createElement('script');
  otpGuard.src='/auth-otp-guard.js?v=368';
  otpGuard.async=false;
  document.head.appendChild(otpGuard);

  const core=document.createElement('script');
  core.src='/flow-core-361.js?v=366';
  core.async=false;
  document.head.appendChild(core);
})();
