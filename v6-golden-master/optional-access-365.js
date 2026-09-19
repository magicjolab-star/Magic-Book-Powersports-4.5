(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const PRIMARY_VIDEO='/assets/17525.mp4?v=367';
  const FALLBACK_VIDEO='https://cdn.creativeclaw.co/u/65c72a8e/videos/8a0a3872-77d4-49fe-9826-5e7bcf7d355f.mp4?v=367';

  let authObserver=null;
  let videoObserver=null;
  let videoMonitor=null;
  let fallbackSourceUsed=false;
  let playInProgress=false;

  function currentLanguage(){
    return $('language')?.value==='en'?'en':'fr';
  }

  function updateOptionalCopy(){
    const english=currentLanguage()==='en';
    const accountSub=$('accountSub');
    if(accountSub){
      accountSub.textContent=english
        ? 'Optional sign-in: use your email only to sync evaluations across your devices.'
        : 'Connexion facultative : utilise ton courriel seulement pour synchroniser tes évaluations entre tes appareils.';
    }

    const privacy=$('accountPrivacyText');
    if(privacy){
      const link=privacy.querySelector('a');
      privacy.textContent=english
        ? 'Email sign-in is optional. You can use Magic Book without creating an account. '
        : 'La connexion par courriel est facultative. Tu peux utiliser Magic Book sans créer de compte. ';
      if(link)privacy.appendChild(link);
    }

    const panel=$('accountPanel');
    if(panel){
      panel.setAttribute('aria-label',english?'Optional Magic Book account':'Compte Magic Book facultatif');
      panel.dataset.optional='true';
    }
  }

  function makeApplicationAccessible(){
    const login=$('ecran-connexion');
    const app=$('ecran-application');

    if(login){
      if(login.style.getPropertyValue('display')!=='block'||login.style.getPropertyPriority('display')!=='important'){
        login.style.setProperty('display','block','important');
      }
      if(login.hasAttribute('aria-hidden'))login.removeAttribute('aria-hidden');
    }

    if(app){
      if(app.style.getPropertyValue('display')!=='block'||app.style.getPropertyPriority('display')!=='important'){
        app.style.setProperty('display','block','important');
      }
      if(app.hasAttribute('aria-hidden'))app.removeAttribute('aria-hidden');
    }

    document.documentElement.dataset.authWall='optional';
    updateOptionalCopy();
  }

  function loaderVisible(){
    const loader=$('loader');
    if(!loader||loader.hidden)return false;
    const style=getComputedStyle(loader);
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0;
  }

  function videoElements(){
    const loader=$('loader');
    const screen=$('ecran-chargement');
    const video=screen?.querySelector('video.magic-book-video');
    return {loader,screen,video};
  }

  function configureVideo(){
    const {screen,video}=videoElements();
    if(!screen||!video)return null;

    video.muted=true;
    video.defaultMuted=true;
    video.autoplay=true;
    video.loop=true;
    video.playsInline=true;
    video.preload='auto';
    video.setAttribute('muted','');
    video.setAttribute('autoplay','');
    video.setAttribute('loop','');
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.disablePictureInPicture=true;

    const source=video.querySelector('source');
    const current=source?.getAttribute('src')||video.getAttribute('src')||'';
    if(!current.includes('v=367')){
      if(source)source.setAttribute('src',PRIMARY_VIDEO);
      else video.setAttribute('src',PRIMARY_VIDEO);
      try{video.load()}catch(_){ }
    }

    return video;
  }

  function markVideoPlaying(){
    const {screen}=videoElements();
    if(!screen)return;
    screen.classList.add('video-playing');
    screen.classList.remove('video-fallback','video-preparing');
    screen.dataset.videoState='playing';
  }

  function markVideoPreparing(){
    const {screen}=videoElements();
    if(!screen)return;
    screen.classList.add('video-preparing');
    screen.classList.remove('video-playing');
    screen.dataset.videoState='preparing';
  }

  function useFallbackSource(){
    const {screen,video}=videoElements();
    if(!screen||!video||fallbackSourceUsed)return false;
    fallbackSourceUsed=true;
    screen.dataset.videoSource='fallback';
    screen.classList.add('video-preparing');
    screen.classList.remove('video-playing');
    try{video.pause()}catch(_){ }
    const source=video.querySelector('source');
    if(source)source.setAttribute('src',FALLBACK_VIDEO);
    else video.setAttribute('src',FALLBACK_VIDEO);
    try{video.load()}catch(_){ }
    return true;
  }

  function markVideoFallback(){
    const {screen}=videoElements();
    if(!screen)return;
    screen.classList.remove('video-playing','video-preparing');
    screen.classList.add('video-fallback');
    screen.dataset.videoState='fallback';
  }

  async function playLoadingVideo(restart=false){
    if(playInProgress||!loaderVisible())return;
    const video=configureVideo();
    if(!video)return;

    playInProgress=true;
    markVideoPreparing();
    try{
      if(restart){
        try{video.currentTime=0}catch(_){ }
      }
      if(video.readyState===0){
        try{video.load()}catch(_){ }
      }
      const attempt=video.play();
      if(attempt&&typeof attempt.then==='function')await attempt;
      if(video.paused)throw new Error('Video remained paused');
      markVideoPlaying();
    }catch(error){
      if(useFallbackSource()){
        await new Promise(resolve=>setTimeout(resolve,120));
        try{
          const retry=video.play();
          if(retry&&typeof retry.then==='function')await retry;
          if(video.paused)throw new Error('Fallback video remained paused');
          markVideoPlaying();
        }catch(_){
          markVideoFallback();
        }
      }else{
        markVideoFallback();
      }
    }finally{
      playInProgress=false;
    }
  }

  function stopLoadingVideo(){
    const {screen,video}=videoElements();
    if(video){
      try{video.pause()}catch(_){ }
      try{video.currentTime=0}catch(_){ }
    }
    if(screen){
      screen.classList.remove('video-playing','video-preparing');
      screen.dataset.videoState='stopped';
    }
    if(videoMonitor){
      clearInterval(videoMonitor);
      videoMonitor=null;
    }
  }

  function monitorVideo(){
    if(videoMonitor)clearInterval(videoMonitor);
    if(!loaderVisible()){
      stopLoadingVideo();
      return;
    }

    playLoadingVideo(false);
    videoMonitor=setInterval(()=>{
      const {video}=videoElements();
      if(!loaderVisible()){
        stopLoadingVideo();
        return;
      }
      if(video&&(video.paused||video.ended||video.readyState<2))playLoadingVideo(false);
    },650);
  }

  function syncVideoWithLoader(restart=false){
    if(loaderVisible()){
      requestAnimationFrame(()=>{
        playLoadingVideo(restart);
        monitorVideo();
      });
    }else{
      stopLoadingVideo();
    }
  }

  function installVideoController(){
    const {loader,screen,video}=videoElements();
    if(!loader||!screen||!video)return;

    configureVideo();
    screen.dataset.videoSource='primary';

    video.addEventListener('playing',markVideoPlaying);
    video.addEventListener('loadeddata',()=>{if(loaderVisible()&&video.paused)playLoadingVideo(false)});
    video.addEventListener('canplay',()=>{if(loaderVisible()&&video.paused)playLoadingVideo(false)});
    video.addEventListener('stalled',()=>{if(loaderVisible())playLoadingVideo(false)});
    video.addEventListener('error',()=>{
      if(useFallbackSource())playLoadingVideo(true);
      else markVideoFallback();
    });

    videoObserver=new MutationObserver(()=>syncVideoWithLoader(true));
    videoObserver.observe(loader,{attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});

    $('go')?.addEventListener('click',()=>{
      const model=String($('modele')?.value||'').trim();
      const year=String($('annee')?.value||'').trim();
      if(!model||!year)return;
      loader.style.display='block';
      playLoadingVideo(true);
      monitorVideo();
    },true);

    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)stopLoadingVideo();
      else syncVideoWithLoader(false);
    });
    window.addEventListener('pageshow',()=>syncVideoWithLoader(false));
    window.addEventListener('pagehide',stopLoadingVideo);

    syncVideoWithLoader(false);
  }

  function install(){
    if(!$('ecran-application'))return;

    if(!document.getElementById('optionalAccess365Styles')){
      const style=document.createElement('style');
      style.id='optionalAccess365Styles';
      style.textContent=`
        #ecran-connexion,#ecran-application{display:block!important}
        .video-loader-container::before{content:"";position:absolute;inset:0;z-index:0;background:#050b14 url('/api/hero?v=363') center/contain no-repeat;opacity:.36;transition:opacity .22s ease}
        .video-loader-container .magic-book-video{opacity:0;transition:opacity .22s ease;background:#050b14}
        .video-loader-container.video-playing::before{opacity:0}
        .video-loader-container.video-playing .magic-book-video{opacity:1}
        .video-loader-container.video-fallback::before{opacity:.52}
        .video-loader-container.video-fallback .magic-book-video{opacity:0}
      `;
      document.head.appendChild(style);
    }

    makeApplicationAccessible();

    authObserver=new MutationObserver(()=>requestAnimationFrame(makeApplicationAccessible));
    [$('ecran-connexion'),$('ecran-application')].filter(Boolean).forEach(element=>{
      authObserver.observe(element,{attributes:true,attributeFilter:['style','aria-hidden']});
    });

    window.addEventListener('magicbook:auth-wall',makeApplicationAccessible);
    window.addEventListener('storage',makeApplicationAccessible);
    $('language')?.addEventListener('change',()=>setTimeout(updateOptionalCopy,0));
    setTimeout(makeApplicationAccessible,0);

    installVideoController();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
