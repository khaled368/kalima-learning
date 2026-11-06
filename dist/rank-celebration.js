/* Live Kalima rank-up. Original shields, cinematic progress, separate stage audio.
 * Audio assets may require third-party rights before public distribution.
 */
(function(global){
 'use strict';
 const course=global.WORT_COURSE||{native:'ar',key:x=>x};
 const KEY=course.key('wort-rank-celebrations-v1');
 const messages={
  ar:{title:'ترقية جديدة!',label:'حصلت على الدرع',continue:'متابعة التعلّم'},
  en:{title:'Rank up!',label:'You earned the shield',continue:'Keep learning'},
  de:{title:'Neuer Rang!',label:'Dein neuer Rang',continue:'Weiterlernen'},
  nl:{title:'Nieuw niveau!',label:'Je hebt een schild verdiend',continue:'Verder leren'}
 };
 const t=messages[course.native]||messages.ar;
 const read=(key,fallback)=>{try{return JSON.parse(global.localStorage?.getItem(key)||'null')??fallback;}catch{return fallback;}};
 const stored=read(KEY,[]);
 const seen=new Set((Array.isArray(stored)?stored:[]).filter(v=>typeof v==='number'&&v>0&&Number.isFinite(v)));
 let dialog=null,animation=null,previousFocus=null,closeTimer=0;
 function mount(){
  if(dialog)return dialog;
  dialog=global.document.getElementById('rank-celebration-dialog');
  if(!dialog)return null;
  const closeButton=dialog.querySelector('[data-rank-close]');
  closeButton?.addEventListener('click',close);
  dialog.addEventListener('close',()=>{
   global.clearTimeout(closeTimer);closeTimer=0;
   animation?.destroy();animation=null;
   previousFocus?.focus?.({preventScroll:true});
  });
  dialog.addEventListener('cancel',()=>{global.clearTimeout(closeTimer);});
  return dialog;
 }
 function close(){
  global.clearTimeout(closeTimer);closeTimer=0;
  if(dialog?.open)dialog.close();
 }
 function show(shield){
  if(!shield||!Number.isInteger(shield.index)||shield.index<0||shield.index>9||!Number.isFinite(shield.threshold))return false;
  const root=mount();
  if(!root||!global.KalimaLevelUp?.LevelUpCelebration||typeof root.showModal!=='function')return false;
  previousFocus=global.document.activeElement;
  if(root.open)root.close();
  root.classList.remove('is-revealed');
  root.querySelector('[data-rank-heading]').textContent=t.title;
  root.querySelector('[data-rank-label]').textContent=t.label;
  root.querySelector('[data-rank-close]').textContent=t.continue;
  const ranks=global.KalimaLevelUp.DEFAULT_RANKS.map((rank,index)=>
   index===shield.index?{...rank,name:shield.name,threshold:shield.threshold}:rank);
  root.showModal();
  try{
   animation=new global.KalimaLevelUp.LevelUpCelebration(root,{
    ranks,progressSeconds:4.15,sprite:'assets/kalima-shields.png',
    progressSound:'assets/level-up-progress.mp3',
    celebrationSound:'assets/level-up-celebration-trimmed.mp3',
    celebrationStartFraction:0, // Already trimmed by four seconds.
    soundEnabled:true
   });
   // Begin from the user's learning action to unlock browser audio.
   Promise.resolve(animation.play(shield.index)).catch(()=>{});
  }catch(error){root.close();return false;}
  root.querySelector('[data-rank-close]')?.focus?.({preventScroll:true});
  // Last sound decays naturally before this timeout.
  closeTimer=global.setTimeout(close,16000);
  return true;
 }
 function onLearn(before,after,shields){
  if(!Number.isFinite(before)||!Number.isFinite(after)||after<=before||!Array.isArray(shields))return null;
  const gained=shields.map((shield,index)=>({...shield,index}))
   .filter(shield=>Number.isFinite(shield.threshold)&&before<shield.threshold
    &&after>=shield.threshold&&!seen.has(shield.threshold));
  if(!gained.length)return null;
  const awarded=gained[gained.length-1];
  // Only mark as viewed once an actual animation can be shown.
  if(!show(awarded))return null;
  for(const shield of gained)seen.add(shield.threshold);
  try{global.localStorage?.setItem(KEY,JSON.stringify([...seen]));}catch{}
  return awarded;
 }
 global.WORT_RANK_CELEBRATION=Object.freeze({
  onLearn,close,get seen(){return [...seen];}
 });
})(globalThis);
