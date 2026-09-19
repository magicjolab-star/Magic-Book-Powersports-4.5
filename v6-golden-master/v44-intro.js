(()=>{
'use strict';
if(window.__MAGIC_V44_INTRO__)return;
window.__MAGIC_V44_INTRO__=true;

const legacy=document.getElementById('magic-studio-intro');
const legacyVideo=document.getElementById('magic-studio-intro-video');
if(legacyVideo){try{legacyVideo.pause()}catch{} legacyVideo.removeAttribute('autoplay');legacyVideo.muted=true;}
if(legacy)legacy.style.display='none';

const installPanel=document.querySelector('.install-panel');
if(installPanel){installPanel.style.display='none';installPanel.setAttribute('aria-hidden','true');}

const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let installPrompt=null;
let installFinished=isStandalone();
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  updateGate();
});
window.addEventListener('appinstalled',()=>{
  installFinished=true;
  installPrompt=null;
});

const style=document.createElement('style');
style.textContent=`
#v44-studio-intro{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;overflow:hidden;isolation:isolate}
#v44-studio-intro video{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain;background:#000;z-index:1;transform:translateZ(0);transition:opacity .72s ease,transform 1.25s cubic-bezier(.16,1,.3,1),filter 1.1s ease}
#v44-sound-gate{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 50% 42%,rgba(7,40,74,.46),rgba(0,0,0,.94) 72%);text-align:center;transition:opacity .35s ease}
#v44-sound-gate.v44-away{opacity:0;pointer-events:none}
#v44-sound-panel{width:min(440px,88vw);padding:28px 22px;border:1px solid rgba(236,198,104,.62);border-radius:24px;background:linear-gradient(145deg,rgba(4,17,34,.97),rgba(0,0,0,.95));box-shadow:0 25px 80px rgba(0,0,0,.68),0 0 45px rgba(52,197,255,.14)}
#v44-sound-panel strong{display:block;margin-bottom:8px;color:#f0d787;font-size:1.1rem;letter-spacing:.08em}
#v44-sound-panel p{margin:0 0 18px;color:#d7e7f8;line-height:1.5;font-size:.88rem}
#v44-sound-start{width:100%;min-height:62px;padding:12px 16px;border-radius:16px;border:1px solid rgba(255,255,255,.24);background:linear-gradient(110deg,#a77822,#f3dc8d 48%,#b6842c);color:#07111b;font-weight:950;font-size:.93rem;line-height:1.28;letter-spacing:.035em;box-shadow:0 12px 34px rgba(186,139,43,.27),inset 0 1px 0 rgba(255,255,255,.5);cursor:pointer}
#v44-install-note{display:block;margin-top:11px;color:#9fb3c9;font-size:.72rem;line-height:1.45}

#v44-magic-handoff{position:absolute;inset:0;z-index:9;display:none;pointer-events:none;overflow:hidden;background:transparent}
#v44-studio-intro.v44-handoff #v44-magic-handoff{display:block}
#v44-studio-intro.v44-handoff video{opacity:.08;transform:scale(1.035);filter:blur(3px) brightness(.82) saturate(1.2)}

#v44-magic-handoff .v44-veil{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(5,19,34,.05) 0 20%,rgba(1,9,18,.42) 62%,rgba(0,0,0,.9) 100%);animation:v44Veil 1.7s cubic-bezier(.16,1,.3,1) both}
#v44-magic-handoff .v44-aura{position:absolute;left:50%;top:50%;width:14vmin;height:14vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.18);background:radial-gradient(circle,#fff 0 5%,#ffe6a0 7%,#f7c85a 16%,rgba(0,213,255,.85) 32%,rgba(0,135,255,.24) 52%,transparent 72%);box-shadow:0 0 22px #fff7c7,0 0 58px rgba(247,190,62,.95),0 0 120px rgba(0,202,255,.66);animation:v44Aura 1.72s cubic-bezier(.12,.78,.18,1) both}
#v44-magic-handoff .v44-ring{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%) scale(.12);opacity:0}
#v44-magic-handoff .v44-ring.one{width:30vmin;height:30vmin;border:2px solid rgba(255,215,115,.92);box-shadow:0 0 20px rgba(255,204,73,.62),inset 0 0 20px rgba(255,204,73,.32);animation:v44RingOne 1.58s .06s cubic-bezier(.12,.8,.18,1) both}
#v44-magic-handoff .v44-ring.two{width:42vmin;height:42vmin;border:1px solid rgba(68,222,255,.9);box-shadow:0 0 24px rgba(0,210,255,.58),inset 0 0 28px rgba(0,210,255,.16);animation:v44RingTwo 1.62s .13s cubic-bezier(.12,.8,.18,1) both}
#v44-magic-handoff .v44-ring.three{width:58vmin;height:58vmin;border:1px solid rgba(255,221,140,.42);animation:v44RingThree 1.62s .2s cubic-bezier(.12,.8,.18,1) both}
#v44-magic-handoff .v44-star{position:absolute;left:50%;top:50%;width:4px;height:42vh;transform:translate(-50%,-50%) scaleY(.04);transform-origin:center;background:linear-gradient(to bottom,transparent,rgba(94,222,255,.72) 28%,#fff 48%,#ffe9a8 52%,rgba(242,186,67,.75) 72%,transparent);filter:blur(.2px);opacity:0;animation:v44Star 1.26s .1s ease-out both}
#v44-magic-handoff .v44-star:after{content:"";position:absolute;left:50%;top:50%;width:42vh;height:3px;transform:translate(-50%,-50%);background:linear-gradient(to right,transparent,rgba(65,216,255,.78) 26%,#fff 48%,#ffe39a 52%,rgba(242,186,67,.8) 74%,transparent);box-shadow:0 0 18px rgba(255,229,156,.9)}
#v44-magic-handoff .v44-sweep{position:absolute;inset:-35%;background:conic-gradient(from 235deg at 50% 50%,transparent 0 36%,rgba(255,212,105,.08) 39%,rgba(255,230,157,.48) 41%,rgba(75,220,255,.34) 43%,transparent 47% 100%);transform:rotate(-22deg);opacity:0;animation:v44Sweep 1.5s .12s cubic-bezier(.12,.8,.18,1) both}
#v44-magic-handoff .v44-final-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.96) 0 3%,rgba(255,229,151,.68) 11%,rgba(30,207,255,.28) 25%,rgba(0,0,0,0) 56%);opacity:0;animation:v44FinalFlash 1.72s both}
#v44-magic-handoff .v44-particle{position:absolute;left:50%;top:50%;width:3px;height:3px;border-radius:50%;background:#ffe49a;box-shadow:0 0 9px #ffd26c;opacity:0;transform:translate(-50%,-50%)}
#v44-studio-intro.v44-handoff .v44-particle{animation:v44Particle 1.52s var(--d) cubic-bezier(.12,.78,.18,1) both}

@keyframes v44Veil{0%{opacity:0}35%{opacity:.52}100%{opacity:0}}
@keyframes v44Aura{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}18%{opacity:1}58%{opacity:1;transform:translate(-50%,-50%) scale(1.8)}100%{opacity:0;transform:translate(-50%,-50%) scale(10)}}
@keyframes v44RingOne{0%{opacity:0;transform:translate(-50%,-50%) scale(.12)}18%{opacity:1}70%{opacity:.82}100%{opacity:0;transform:translate(-50%,-50%) scale(4.8)}}
@keyframes v44RingTwo{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}20%{opacity:.9}72%{opacity:.62}100%{opacity:0;transform:translate(-50%,-50%) scale(4.1)}}
@keyframes v44RingThree{0%{opacity:0;transform:translate(-50%,-50%) scale(.08)}22%{opacity:.56}100%{opacity:0;transform:translate(-50%,-50%) scale(3.5)}}
@keyframes v44Star{0%{opacity:0;transform:translate(-50%,-50%) scaleY(.04)}25%{opacity:1;transform:translate(-50%,-50%) scaleY(.35)}68%{opacity:.96;transform:translate(-50%,-50%) scaleY(1.15)}100%{opacity:0;transform:translate(-50%,-50%) scaleY(1.8)}}
@keyframes v44Sweep{0%{opacity:0;transform:rotate(-30deg) scale(.55)}26%{opacity:1}100%{opacity:0;transform:rotate(22deg) scale(1.55)}}
@keyframes v44FinalFlash{0%,48%{opacity:0}66%{opacity:1}79%{opacity:.7}100%{opacity:0}}
@keyframes v44Particle{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}18%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.8)}}
`;
document.head.appendChild(style);

const particles=[
 ['-34vw','-22vh','.02s'],['30vw','-26vh','.08s'],['-27vw','18vh','.12s'],['35vw','21vh','.17s'],
 ['-11vw','-36vh','.05s'],['13vw','34vh','.11s'],['-42vw','2vh','.15s'],['42vw','-4vh','.2s'],
 ['-20vw','31vh','.22s'],['22vw','-32vh','.25s'],['-35vw','35vh','.28s'],['36vw','-34vh','.31s']
].map(([x,y,d])=>`<i class="v44-particle" style="--x:${x};--y:${y};--d:${d}"></i>`).join('');

const overlay=document.createElement('div');
overlay.id='v44-studio-intro';
overlay.innerHTML=`
  <video id="v44-studio-video" playsinline preload="auto"><source src="/v44-intro.mp4" type="video/mp4"></video>
  <div id="v44-sound-gate">
    <div id="v44-sound-panel">
      <strong>MAGIC APP PRODUCTION</strong>
      <p id="v44-gate-copy">Installe Magic Book pendant que l'introduction officielle joue au complet avec son.</p>
      <button id="v44-sound-start" type="button">📲 INSTALLER MAGIC BOOK<br>ET LANCER L’INTRO</button>
      <span id="v44-install-note">L'installation est proposée par ton navigateur. L'introduction continue pendant la confirmation.</span>
    </div>
  </div>
  <div id="v44-magic-handoff" aria-hidden="true">
    <div class="v44-veil"></div>
    <div class="v44-sweep"></div>
    <div class="v44-aura"></div>
    <div class="v44-ring one"></div>
    <div class="v44-ring two"></div>
    <div class="v44-ring three"></div>
    <div class="v44-star"></div>
    ${particles}
    <div class="v44-final-flash"></div>
  </div>`;
document.body.appendChild(overlay);

const video=document.getElementById('v44-studio-video');
const gate=document.getElementById('v44-sound-gate');
const start=document.getElementById('v44-sound-start');
const copy=document.getElementById('v44-gate-copy');
const note=document.getElementById('v44-install-note');
let done=false;
let started=false;

function updateGate(){
  if(isStandalone()||installFinished){
    start.innerHTML='▶ OUVRIR MAGIC BOOK<br>AVEC LE SON';
    copy.textContent='L’application est déjà installée. Lance la signature Magic App Production au complet.';
    note.textContent='Introduction complète avec le son original, puis transition lumineuse vers l’application.';
  }else if(installPrompt){
    start.innerHTML='📲 INSTALLER MAGIC BOOK<br>ET LANCER L’INTRO';
    copy.textContent='Un seul geste : installation de Magic Book et lancement de l’introduction officielle avec son.';
    note.textContent='Chrome te demandera de confirmer l’installation pendant que l’introduction joue.';
  }else{
    start.innerHTML='📲 INSTALLER MAGIC BOOK<br>ET LANCER L’INTRO';
    copy.textContent='Préparation de l’installation et de l’introduction officielle…';
    note.textContent='Si l’installation automatique n’est pas encore proposée, l’introduction démarre quand même au complet.';
  }
}

function magicHandoff(){
  if(done)return;
  done=true;
  overlay.classList.add('v44-handoff');
  setTimeout(()=>{
    overlay.style.transition='opacity .52s ease';
    overlay.style.opacity='0';
    overlay.style.pointerEvents='none';
  },1180);
  setTimeout(()=>{
    try{video.pause()}catch{}
    overlay.remove();
    style.remove();
    document.documentElement.classList.add('v44-first-use-ready');
  },1740);
}

async function startExperience(){
  if(started)return;
  started=true;
  start.disabled=true;
  video.currentTime=0;
  video.muted=false;
  video.volume=1;

  let playPromise;
  try{playPromise=video.play()}catch{}

  if(!isStandalone()&&!installFinished){
    try{
      if(installPrompt){
        const prompt=installPrompt;
        installPrompt=null;
        prompt.prompt();
        prompt.userChoice.then(choice=>{
          if(choice&&choice.outcome==='accepted')note.textContent='Installation acceptée — finalisation pendant l’introduction…';
          else note.textContent='Installation reportée — Magic Book reste utilisable dans le navigateur.';
        }).catch(()=>{});
      }else{
        const existing=document.getElementById('install');
        if(existing&&!existing.disabled)existing.click();
      }
    }catch{}
  }

  try{if(playPromise)await playPromise;}catch{
    started=false;
    start.disabled=false;
    note.textContent='Le navigateur a bloqué le son. Appuie de nouveau pour lancer l’introduction.';
    return;
  }
  gate.classList.add('v44-away');
  setTimeout(()=>{gate.style.display='none';},380);
}

start.addEventListener('click',startExperience);
video.addEventListener('ended',magicHandoff,{once:true});
video.addEventListener('error',()=>{if(started)setTimeout(magicHandoff,300);},{once:true});
updateGate();
})();