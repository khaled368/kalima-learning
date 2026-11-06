/* Kalima rank promotion celebration — original short Web Audio fanfare.
 * Never uses or reproduces copyrighted Battlefield audio.
 * The shield ranks come exclusively from the curriculum manifest.
 */
(function(global){
 'use strict';
 const course=global.WORT_COURSE||{native:'ar',key:x=>x};
 const KEY=course.key('wort-rank-celebrations-v1');
 const SOUND_KEY='wort-rank-sound-enabled';
 const labels={
  ar:{title:'ترقية جديدة!',rank:'حصلت على الدرع',previewTitle:'معاينة الاحتفال',previewRank:'هكذا سيظهر درع الترقية',words:'كلمة متعلّمة',next:'متابعة التعلّم',mute:'كتم صوت الاحتفال',unmute:'تشغيل صوت الاحتفال',close:'إغلاق الاحتفال'},
  en:{title:'Rank up!',rank:'You earned the',previewTitle:'Celebration preview',previewRank:'Your next rank-up shield',words:'words learned',next:'Keep learning',mute:'Mute celebration sound',unmute:'Enable celebration sound',close:'Close celebration'},
  de:{title:'Neuer Rang!',rank:'Du hast erhalten:',previewTitle:'Feier-Vorschau',previewRank:'Dein nächstes Rang-Abzeichen',words:'Wörter gelernt',next:'Weiterlernen',mute:'Erfolgston stummschalten',unmute:'Erfolgston einschalten',close:'Jubel schließen'},
  nl:{title:'Nieuw niveau!',rank:'Je hebt verdiend:',previewTitle:'Voorbeeld van de viering',previewRank:'Je volgende rangschild',words:'woorden geleerd',next:'Verder leren',mute:'Feestgeluid dempen',unmute:'Feestgeluid inschakelen',close:'Feestvenster sluiten'}
 };
 const t=labels[course.native]||labels.ar;
 const read=(key,fallback)=>{
  try{return JSON.parse(global.localStorage?.getItem(key)||'null')??fallback;}catch{return fallback;}
 };
 const seen=new Set((Array.isArray(read(KEY,[]))?read(KEY,[]):[]).filter(v=>typeof v==='number'&&v>0&&Number.isFinite(v)));
 let soundOn=read(SOUND_KEY,true)!==false;
 let timer=0,dialog=null,active=null,previousFocus=null;
 const reduceMotion=()=>Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
 const audioCtx={current:null};
 function fanfare(){
  if(!soundOn)return;
  const AudioCtor=global.AudioContext||global.webkitAudioContext;
  if(!AudioCtor)return;
  try{
   let context=audioCtx.current;
   if(!context||context.state==='closed'){context=new AudioCtor();audioCtx.current=context;}
   if(context.state==='suspended')context.resume().catch(()=>{});
   const start=context.currentTime+0.01;
   // Original brief victory cue: low brass-like accents, rising glints,
   // then a warm chord. All generated locally, without an audio file.
   const notes=[
    [146.83,0,0.16,0.17,'sawtooth'],
    [196.00,0.14,0.17,0.14,'sawtooth'],
    [261.63,0.30,0.18,0.14,'triangle'],
    [392.00,0.48,0.46,0.11,'triangle'],
    [523.25,0.50,0.44,0.07,'sine'],
    [196.00,0.47,0.5,0.08,'sine']
   ];
   for(const [freq,delay,duration,volume,wave] of notes){
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=wave;
    oscillator.frequency.setValueAtTime(freq,start+delay);
    gain.gain.setValueAtTime(0.0001,start+delay);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+delay+0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+delay+duration);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.start(start+delay);oscillator.stop(start+delay+duration+0.015);
   }
  }catch{ /* no disruption if iOS has not unlocked audio */ }
 }
 function makeStars(root){
  const stars=root.querySelector('.rank-particles');
  if(!stars||stars.childElementCount)return;
  for(let index=0;index<16;index++){
   const node=global.document.createElement('span');
   node.className='rank-particle';
   const angle=index*Math.PI*2/16;
   node.style.setProperty('--x',Math.round(Math.cos(angle)*(110+index%4*15))+'px');
   node.style.setProperty('--y',Math.round(Math.sin(angle)*(140+index%3*18))+'px');
   node.style.setProperty('--delay',(index%5*90)+'ms');
   stars.appendChild(node);
  }
 }
 function mount(){
  if(dialog)return dialog;
  dialog=global.document.getElementById('rank-celebration-dialog');
  if(!dialog)return null;
  makeStars(dialog);
  dialog.querySelector('[data-rank-close]')?.addEventListener('click',close);
  const sound=dialog.querySelector('[data-rank-sound]');
  const update=()=>{
   if(sound){
    sound.textContent=soundOn?'🔊':'🔇';
    sound.setAttribute('aria-label',soundOn?t.mute:t.unmute);
    sound.title=soundOn?t.mute:t.unmute;
    sound.setAttribute('aria-pressed',String(soundOn));
   }
  };
  sound?.addEventListener('click',()=>{
   soundOn=!soundOn;
   try{global.localStorage?.setItem(SOUND_KEY,JSON.stringify(soundOn));}catch{}
   update();
   if(soundOn)fanfare();
  });
  dialog.addEventListener('close',()=>{global.clearTimeout(timer);timer=0;active=null;previousFocus?.focus?.({preventScroll:true});});
  dialog.addEventListener('cancel',()=>{global.clearTimeout(timer);timer=0;});
  update();
  return dialog;
 }
 function close(){
  global.clearTimeout(timer);timer=0;
  if(dialog?.open)dialog.close();
  active=null;
 }
 function show(shield,preview=false){
  const root=mount();
  if(!root||typeof root.showModal!=='function')return;
  previousFocus=global.document.activeElement;
  if(root.open)root.close();
  active=shield;
  root.querySelector('[data-rank-heading]').textContent=preview?t.previewTitle:t.title;
  root.querySelector('[data-rank-label]').textContent=preview?t.previewRank:t.rank;
  root.querySelector('[data-rank-name]').textContent=shield.name;
  root.querySelector('[data-rank-count]').textContent=shield.threshold.toLocaleString(course.native||'ar')+' '+t.words;
  root.querySelector('[data-rank-close]').textContent=t.next;
  const art=root.querySelector('.rank-shield');
  art.setAttribute('aria-label',shield.name);
  art.style.backgroundPosition=(shield.index%5*25)+'% '+(shield.index<5?'0':'100%');
  root.querySelector('[data-rank-sound]').title=soundOn?t.mute:t.unmute;
  if(reduceMotion())root.classList.add('rank-reduced-motion');
  else root.classList.remove('rank-reduced-motion');
  root.showModal();
  root.querySelector('[data-rank-close]').focus({preventScroll:true});
  timer=global.setTimeout(close,6500);
 }
 function preview(shield){
  if(!shield||!Number.isFinite(shield.threshold)||!Number.isInteger(shield.index)||shield.index<0)return false;
  // A preview never marks a shield as seen or modifies study progress.
  fanfare();
  show(shield,true);
  return true;
 }
 function onLearn(before,after,shields){
  if(!Number.isFinite(before)||!Number.isFinite(after)||after<=before||!Array.isArray(shields))return null;
  const gained=shields.map((shield,index)=>({...shield,index}))
    .filter(shield=>Number.isFinite(shield.threshold)&&before<shield.threshold
      &&after>=shield.threshold&&!seen.has(shield.threshold));
  if(!gained.length)return null;
  const awarded=gained[gained.length-1];
  for(const shield of gained)seen.add(shield.threshold);
  try{global.localStorage?.setItem(KEY,JSON.stringify([...seen]));}catch{}
  // This call is made directly inside the user's "learned" click stack,
  // retaining the Safari sound-unlock gesture.
  fanfare();
  show(awarded);
  return awarded;
 }
 global.WORT_RANK_CELEBRATION=Object.freeze({
  onLearn,preview,close,get seen(){return [...seen];},get soundOn(){return soundOn;}
 });
})(globalThis);
