(()=>{
  'use strict';

  const COOLDOWN_MS=60000;
  const KEY='magicbook-otp-next-request-v1';
  const nativeFetch=window.fetch.bind(window);
  const $=id=>document.getElementById(id);
  let timer=null;

  function readNext(){
    try{return Number(localStorage.getItem(KEY)||0)||0}catch{return 0}
  }

  function writeNext(ts){
    try{localStorage.setItem(KEY,String(ts))}catch{}
  }

  function secondsLeft(){
    return Math.max(0,Math.ceil((readNext()-Date.now())/1000));
  }

  function isEnglish(){return $('language')?.value==='en'}

  function updateButton(){
    const btn=$('accountSubmit');
    if(!btn)return;
    const left=secondsLeft();
    if(left>0){
      btn.disabled=true;
      btn.dataset.otpCooldown='true';
      btn.textContent=isEnglish()?`Resend code (${left}s)`:`Renvoyer le code (${left}s)`;
    }else if(btn.dataset.otpCooldown==='true'){
      btn.disabled=false;
      delete btn.dataset.otpCooldown;
      btn.textContent=isEnglish()?'Resend code':'Renvoyer le code';
    }
  }

  function startTimer(){
    updateButton();
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{
      updateButton();
      if(secondsLeft()<=0){clearInterval(timer);timer=null}
    },1000);
  }

  function setMessage(text,type='error'){
    const el=$('accountMessage');
    if(!el)return;
    el.textContent=text;
    el.className='account-message show '+type;
  }

  function cooldownMessage(left){
    return isEnglish()
      ? `Please wait ${left} second${left===1?'':'s'} before requesting another code.`
      : `Attends ${left} seconde${left===1?'':'s'} avant de demander un nouveau code.`;
  }

  function installDeleteAccountLink(){
    const profile=$('accountProfile');
    if(!profile||document.getElementById('accountDeleteLink'))return;
    const link=document.createElement('a');
    link.id='accountDeleteLink';
    link.href='/delete-account.html';
    link.textContent=isEnglish()?'Delete my account':'Supprimer mon compte';
    link.setAttribute('aria-label',link.textContent);
    link.style.cssText='display:inline-flex;align-items:center;justify-content:center;margin-left:8px;padding:9px 12px;border:1px solid #ff657588;border-radius:10px;color:#ffd7dc;text-decoration:none;font-weight:800;font-size:.78rem;background:#38131c;';
    profile.appendChild(link);
  }

  window.fetch=async function(input,init){
    let url='';
    try{url=typeof input==='string'?input:(input&&input.url)||''}catch{}
    let parsed;
    try{parsed=new URL(url,location.origin)}catch{parsed=null}

    if(parsed?.pathname==='/api/auth'&&parsed.searchParams.get('action')==='send-code'){
      const left=secondsLeft();
      if(left>0){
        startTimer();
        return new Response(JSON.stringify({error:cooldownMessage(left),code:'otp_client_cooldown',retry_after:left}),{
          status:429,
          headers:{'Content-Type':'application/json','Retry-After':String(left),'Cache-Control':'no-store'}
        });
      }

      const response=await nativeFetch(input,init);
      let retry=0;
      if(response.ok){
        retry=Number(response.headers.get('X-MagicBook-OTP-Cooldown')||60)||60;
      }else if(response.status===429){
        retry=Number(response.headers.get('Retry-After')||60)||60;
      }
      if(retry>0){
        writeNext(Date.now()+Math.max(1,retry)*1000);
        startTimer();
      }
      return response;
    }

    if(parsed?.pathname==='/api/auth'&&parsed.searchParams.get('action')==='send-link'){
      return new Response(JSON.stringify({error:'Magic links are disabled. Use the 6-digit email code.',code:'magic_link_disabled'}),{
        status:410,
        headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
      });
    }

    return nativeFetch(input,init);
  };

  document.addEventListener('click',event=>{
    const btn=event.target?.closest?.('#accountSubmit');
    if(!btn)return;
    const left=secondsLeft();
    if(left<=0)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setMessage(cooldownMessage(left));
    startTimer();
  },true);

  function init(){startTimer();installDeleteAccountLink()}
  if(readNext()>Date.now())startTimer();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('change',event=>{if(event.target?.id==='language'){const link=document.getElementById('accountDeleteLink');if(link){link.textContent=isEnglish()?'Delete my account':'Supprimer mon compte';link.setAttribute('aria-label',link.textContent)}}});
})();
