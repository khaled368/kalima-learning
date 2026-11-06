/* Live Kalima rank-up. Original shields, cinematic progress, separate stage audio.
 * Audio assets may require third-party rights before public distribution.
 */
(function(global){
 'use strict';
 const course=global.WORT_COURSE||{native:'ar',key:x=>x};
 const KEY=course.key('wort-rank-celebrations-v1'),SOUND_KEY='wort-rank-sound-enabled';
 const messages={
  ar:{title:'ترقية جديدة!',preview:'معاينة الاحتفال',label:'حصلت على الدرع',previewLabel:'هكذا سيظهر درع الترقية',continue:'متابعة التعلّم',mute:'كتم صوت الاحتفال',unmute:'تشغيل صوت الاحتفال'},
  en:{title:'Rank up!',preview:'Celebration preview',label:'You earned the shield',previewLabel:'This is your next shield',continue:'Keep learning',mute:'Mute celebration audio',unmute:'Enable celebration audio'},
  de:{title:'Neuer Rang!',preview:'Feier-Vorschau',label:'Dein neuer Rang',previewLabel:'Vorschau auf den nächsten Rang',continue:'Weiterlernen',mute:'Erfolgston stummschalten',unmute:'Erfolgston einschalten'},
  nl:{title:'Nieuw niveau!',preview:'Voorbeeld van de viering',label:'Je hebt een schild verdiend',previewLabel:'Dit is je volgende schild',continue:'Verder leren',mute:'Feestgeluid dempen',unmute:'Feestgeluid inschakelen'}
 };
 const t=messages[course.native]||messages.ar;
 const read=(key,fallback)=>{try{return JSON.parse(global.localStorage?.getItem(key)||'null')??fallback;}catch{return fallback;}};
 const stored=read(KEY,[]);
 const seen=new Set((Array.isArray(stored)?stored:[]).filter(v=>typeof v==='number'&&v>0&&Number.isFinite(v)));
 let soundOn=read(SOUND_KEY,true)!==false;
 let dialog=null,animation=null,previousFocus=null,closeTimer=0;
 function mount(){
  if(dialog)return dialog;
  dialog=global.document.getElementById('rank-celebration-dialog');
  if(!dialog)return null;
  const closeButton=dialog.querySelector('[data-rank-close]');
  const soundButton=dialog.querySelector('[data-rank-sound]');
  const updateSound=()=>{
   if(!soundButton)return;
   soundButton.textContent=soundOn?'🔊':'🔇';
   soundButton.title=soundOn?t.mute:t.unmute;
   soundButton.setAttribute('aria-label',soundOn?t.mute:t.unmute);
   soundButton.setAttribute('aria-pressed',String(soundOn));
  };
  closeButton?.addEventListener('click',close);
  soundButton?.addEventListener('click',()=>{
   soundOn=!soundOn;
   try{global.localStorage?.setItem(SOUND_KEY,JSON.stringify(soundOn));}catch{}
   animation?.setSoundEnabled(soundOn);
   updateSound();
  });
  dialog.addEventListener('close',()=>{
   global.clearTimeout(closeTimer);closeTimer=0;
   animation?.destroy();animation=null;
   previousFocus?.focus?.({preventScroll:true});
  });
  dialog.addEventListener('cancel',()=>{global.clearTimeout(closeTimer);});
  updateSound();
  return dialog;
 }
 function close(){
  global.clearTimeout(closeTimer);closeTimer=0;
  if(dialog?.open)dialog.close();
 }
 function show(shield,preview){
  if(!shield||!Number.isInteger(shield.index)||shield.index<0||shield.index>9||!Number.isFinite(shield.threshold))return false;
  const root=mount();
  if(!root||!global.KalimaLevelUp?.LevelUpCelebration||typeof root.showModal!=='function')return false;
  previousFocus=global.document.activeElement;
  if(root.open)root.close();
  root.classList.remove('is-revealed');
  root.querySelector('[data-rank-heading]').textContent=preview?t.preview:t.title;
  root.querySelector('[data-rank-label]').textContent=preview?t.previewLabel:t.label;
  root.querySelector('[data-rank-close]').textContent=t.continue;
  const ranks=global.KalimaLevelUp.DEFAULT_RANKS.map((rank,index)=>
   index===shield.index?{...rank,name:shield.name,threshold:shield.threshold}:rank);
  root.showModal();
  try{
   animation=new global.KalimaLevelUp.LevelUpCelebration(root,{
    ranks,progressSeconds:4.15,sprite:'assets/kalima-shields.png',
    progressSound:'assets/level-up-progress.mp3',
    celebrationSound:'assets/level-up-celebration.mp3',
    soundEnabled:soundOn
   });
   // Must begin from the user's learning/preview click to unlock browser audio.
   Promise.resolve(animation.play(shield.index)).catch(()=>{});
  }catch(error){root.close();return false;}
  root.querySelector('[data-rank-close]')?.focus?.({preventScroll:true});
  // Last sound decays naturally before this timeout.
  closeTimer=global.setTimeout(close,16000);
  return true;
 }
 function preview(shield){return show(shield,true);}
 function onLearn(before,after,shields){
  if(!Number.isFinite(before)||!Number.isFinite(after)||after<=before||!Array.isArray(shields))return null;
  const gained=shields.map((shield,index)=>({...shield,index}))
   .filter(shield=>Number.isFinite(shield.threshold)&&before<shield.threshold
    &&after>=shield.threshold&&!seen.has(shield.threshold));
  if(!gained.length)return null;
  const awarded=gained[gained.length-1];
  // Only mark as viewed once an actual animation can be shown.
  if(!show(awarded,false))return null;
  for(const shield of gained)seen.add(shield.threshold);
  try{global.localStorage?.setItem(KEY,JSON.stringify([...seen]));}catch{}
  return awarded;
 }
 global.WORT_RANK_CELEBRATION=Object.freeze({
  onLearn,preview,close,get seen(){return [...seen];},get soundOn(){return soundOn;}
 });
})(globalThis);
