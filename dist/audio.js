/* Language-aware speech playback: native device voices plus a bundled eSpeak/meSpeak renderer.
 * meSpeak/eSpeak assets are GPL-3.0; see assets/audio-engine/ and Sources.
 * An AudioContext is unlocked directly by the user's tap, before any lazy downloads.
 */
(function(global){
 'use strict';
 const ENGINE_SCRIPT='assets/audio-engine/mespeak.js';
 const MAX_CACHE_BYTES=8*1024*1024;
 const LANGUAGES={de:{locale:'de-DE',voice:'de',file:'de'},en:{locale:'en-US',voice:'en/en-us',aliases:['en-us'],file:'en/en-us'},nl:{locale:'nl-NL',voice:'nl',file:'nl'},ar:{locale:'ar-SA',voice:null}};
 const voicePromises=new Map();
 const SETTINGS={rawdata:true,speed:155,amplitude:100,pitch:50,wordgap:2};
 const TEXT={
  ar:{loading:'يُجهّز الصوت لأول مرة…',playing:'جارٍ النطق…',finished:'انتهى النطق.',stopped:'توقّف الصوت.',failed:'تعذّر تشغيل الصوت. اضغط سماع للمحاولة مجددًا.',load:'تعذّر تحميل الصوت. تحقّق من الاتصال وأعد المحاولة.',empty:'لا يوجد نص للنطق.',long:'اختر جملة أقصر للنطق.',timeout:'استغرق تجهيز النطق وقتًا طويلًا. حاول مجددًا.',activate:'اضغط سماع مرة أخرى لتفعيل الصوت في المتصفح.',invalid:'تعذّر إنتاج ملف النطق.',unsupported:'لا يتوفر صوت لهذه اللغة على هذا الجهاز. فعّل صوت اللغة في إعدادات جهازك ثم أعد المحاولة.',unbundled:'لا يتوفر ملف صوت مدمج لهذه اللغة؛ استخدم النطق بصوت الجهاز.'},
  en:{loading:'Preparing speech…',playing:'Speaking…',finished:'Speech finished.',stopped:'Speech stopped.',failed:'Speech could not play. Tap Listen to try again.',load:'Speech could not load. Check your connection and try again.',empty:'There is no text to speak.',long:'Choose a shorter sentence.',timeout:'Speech preparation took too long. Try again.',activate:'Tap Listen again to enable audio in your browser.',invalid:'A valid speech recording could not be created.',unsupported:'No voice for this language is available on this device. Enable a voice in your device settings and try again.',unbundled:'No bundled voice is available for this language; use device speech playback.'},
  nl:{loading:'Uitspraak wordt voorbereid…',playing:'Wordt uitgesproken…',finished:'Uitspraak voltooid.',stopped:'Uitspraak gestopt.',failed:'Het geluid kan niet worden afgespeeld. Tik op Luisteren om het opnieuw te proberen.',load:'Het geluid kan niet worden geladen. Controleer je verbinding en probeer het opnieuw.',empty:'Er is geen tekst om uit te spreken.',long:'Kies een kortere zin.',timeout:'Het voorbereiden duurde te lang. Probeer het opnieuw.',activate:'Tik opnieuw op Luisteren om geluid in je browser in te schakelen.',invalid:'Er kon geen geldige geluidsopname worden gemaakt.',unsupported:'Op dit apparaat is geen stem voor deze taal beschikbaar. Schakel een stem in via de apparaatinstellingen en probeer het opnieuw.',unbundled:'Er is geen meegeleverde stem voor deze taal; gebruik een stem van het apparaat.'},
  de:{loading:'Sprachausgabe wird vorbereitet…',playing:'Wird vorgelesen…',finished:'Sprachausgabe beendet.',stopped:'Sprachausgabe gestoppt.',failed:'Die Sprachausgabe konnte nicht abgespielt werden. Tippe erneut auf Anhören.',load:'Die Sprachausgabe konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.',empty:'Es ist kein Text zum Vorlesen vorhanden.',long:'Wähle einen kürzeren Satz.',timeout:'Die Vorbereitung dauerte zu lange. Versuche es erneut.',activate:'Tippe erneut auf Anhören, um Audio im Browser zu aktivieren.',invalid:'Es konnte keine gültige Sprachaufnahme erstellt werden.',unsupported:'Auf diesem Gerät ist keine Stimme für diese Sprache verfügbar. Aktiviere eine Stimme in den Geräteeinstellungen und versuche es erneut.',unbundled:'Für diese Sprache ist keine Stimme mitgeliefert; verwende die Sprachausgabe des Geräts.'}
 };
 function messages(){return TEXT[global.WORT_COURSE?.native]||TEXT.ar;}
 function language(options={}){
  const code=String(options.lang||global.WORT_COURSE?.target||'de').toLowerCase().split(/[-_]/)[0];
  if(!Object.prototype.hasOwnProperty.call(LANGUAGES,code))throw new Error(messages().unsupported);
  return code;
 }
 function failure(key){return new Error(messages()[key]||messages().failed);}
 let context=null,source=null,htmlAudio=null,htmlUrl=null,enginePromise=null,nativeUtterance=null;
 let active=null,sequence=0,phase={state:'idle',message:'',text:'',engine:null};
 const cache=new Map();let cacheBytes=0,previousSessionType=null;
 function releaseSession(){if(previousSessionType===null)return;try{if(global.navigator?.audioSession?.type==='playback')global.navigator.audioSession.type=previousSessionType;}catch{}previousSessionType=null;}
 const nativeAvailable=()=>typeof global.SpeechSynthesisUtterance==='function'&&Boolean(global.speechSynthesis);
 function current(job){return active===job&&job.id===sequence&&!job.done;}
 function announce(job,state,message,engine){
  if(job&&!current(job))return;
  phase={state,message:message||messages()[state]||'',text:job?.text||'',engine:engine||job?.engine||null};
  try{job?.onStatus?.({...phase});}catch{}
  try{global.dispatchEvent(new CustomEvent('wort-audio-status',{detail:{...phase}}));}catch{}
 }
 function complete(job,value,error){
  if(job.done)return;job.done=true;
  if(active===job)active=null;
  releaseSession();
  if(error)job.reject(error);else job.resolve(value);
 }
 function stop(){
  sequence++;
  releaseSession();
  const old=active;
  if(old){try{old.cancel?.();}catch{}old.done=true;old.resolve(false);active=null;}
  if(nativeAvailable())try{global.speechSynthesis.cancel();}catch{}
  nativeUtterance=null;
  if(source){try{source.onended=null;source.stop();source.disconnect();}catch{}source=null;}
  if(htmlAudio){try{htmlAudio.pause();}catch{}htmlAudio.onended=null;htmlAudio.onerror=null;}
  if(global.meSpeak?.stop)try{global.meSpeak.stop();}catch{}
  if(old){
   phase={state:'stopped',message:messages().stopped,text:old.text,engine:old.engine||null};
   try{old.onStatus?.({...phase});}catch{}
   try{global.dispatchEvent(new CustomEvent('wort-audio-status',{detail:{...phase}}));}catch{}
  }
 }
 function unlock(){
  try{if(global.navigator?.audioSession){previousSessionType=global.navigator.audioSession.type;global.navigator.audioSession.type='playback';}}catch{previousSessionType=null;}
  const Constructor=global.AudioContext||global.webkitAudioContext;
  if(!Constructor)return null;
  try{
   if(!context||context.state==='closed')context=new Constructor();
   if(context.state!=='running')context.resume().catch(()=>{});
   // Starting a real buffer inside the original click unlocks Safari/iOS playback.
   const silent=context.createBuffer(1,1,22050),warm=context.createBufferSource();warm.buffer=silent;warm.connect(context.destination);warm.start(0);warm.onended=()=>warm.disconnect();
   return context;
  }catch{return null;}
 }
 function loadEngine(){
  if(enginePromise)return enginePromise;
  enginePromise=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(failure('load')),25000);
   function loaded(){
    clearTimeout(timer);
    if(!global.meSpeak?.loadVoice){reject(failure('load'));return;}
    resolve(global.meSpeak);
   }
   if(global.meSpeak?.speak){loaded();return;}
   const script=document.createElement('script');script.src=ENGINE_SCRIPT;script.async=true;script.dataset.wortAudioEngine='true';script.onload=loaded;
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(failure('load'));};document.head.appendChild(script);
  }).catch(error=>{enginePromise=null;throw error;});
  return enginePromise;
 }
 function loadedVoice(engine,profile){return [profile.voice,...(profile.aliases||[])].find(id=>id&&engine.isVoiceLoaded?.(id))||null;}
 function loadVoice(lang){
  const profile=LANGUAGES[lang];
  if(!profile?.voice)return Promise.reject(failure('unbundled'));
  if(voicePromises.has(lang))return voicePromises.get(lang);
  const pending=loadEngine().then(engine=>new Promise((resolve,reject)=>{
   if(loadedVoice(engine,profile)){resolve(engine);return;}
   const timer=setTimeout(()=>reject(failure('load')),25000);
   try{engine.loadVoice(profile.file,(ok)=>{
    clearTimeout(timer);
    // meSpeak silently substitutes its default voice when an unloaded voice is requested.
    if(ok&&loadedVoice(engine,profile))resolve(engine);else reject(failure('load'));
   });}catch(error){clearTimeout(timer);reject(error);}
  })).catch(error=>{voicePromises.delete(lang);throw error;});
  voicePromises.set(lang,pending);return pending;
 }
 function prepare(options={}){
  let lang;try{lang=language(options);}catch(error){return Promise.reject(error);}
  if(LANGUAGES[lang].voice)return loadVoice(lang);
  return waitForVoice(lang).then(voice=>{if(!voice)throw failure('unsupported');return {voice,native:true};});
 }
 function asBuffer(stream){
  if(stream instanceof ArrayBuffer)return stream;
  if(ArrayBuffer.isView(stream))return stream.buffer.slice(stream.byteOffset,stream.byteOffset+stream.byteLength);
  if(Array.isArray(stream))return Uint8Array.from(stream).buffer;
  if(typeof stream==='string'){
   const binary=atob(stream.includes(',')?stream.slice(stream.indexOf(',')+1):stream);return Uint8Array.from(binary,char=>char.charCodeAt(0)).buffer;
  }
  throw failure('invalid');
 }
 async function synthesize(text,options={}){
  const lang=language(options),profile=LANGUAGES[lang];
  text=String(text||'').replace(/\s+/g,' ').trim();
  if(!text)throw failure('empty');
  if(text.length>2500)throw failure('long');
  const key=JSON.stringify([lang,profile.voice,SETTINGS,text]);
  if(cache.has(key)){const cached=cache.get(key);cache.delete(key);cache.set(key,cached);return cached.slice(0);}
  const engine=await loadVoice(lang);
  const buffer=await new Promise((resolve,reject)=>{
   let finished=false;
   const timer=setTimeout(()=>{if(!finished){finished=true;reject(failure('timeout'));}},25000);
   try{engine.speak(text,{...SETTINGS,voice:loadedVoice(engine,profile)},(ok,id,stream)=>{
    if(finished)return;finished=true;clearTimeout(timer);
    if(!ok||!stream){reject(failure('invalid'));return;}
    try{resolve(asBuffer(stream));}catch(error){reject(error);}
   });}catch(error){clearTimeout(timer);finished=true;reject(error);}
  });
  const bytes=new Uint8Array(buffer);
  if(bytes.length<=44||String.fromCharCode(...bytes.slice(0,4))!=='RIFF')throw failure('invalid');
  if(buffer.byteLength<=2*1024*1024){
   while(cache.size>=8||cacheBytes+buffer.byteLength>MAX_CACHE_BYTES){const first=cache.keys().next().value;if(first===undefined)break;cacheBytes-=cache.get(first).byteLength;cache.delete(first);}
   if(cache.has(key))cacheBytes-=cache.get(key).byteLength;
   cache.set(key,buffer);cacheBytes+=buffer.byteLength;
  }
  return buffer.slice(0);
 }
 function decode(ctx,buffer){return new Promise((resolve,reject)=>{try{const result=ctx.decodeAudioData(buffer.slice(0),resolve,reject);if(result?.catch)result.catch(reject);}catch(error){reject(error);}});}
 async function localSpeech(job,ctx){
  job.engine='local';announce(job,'loading',messages().loading,'local');
  const buffer=await synthesize(job.text,{lang:job.lang});if(!current(job))return false;
  if(ctx){
   if(ctx.state!=='running')await ctx.resume();
   if(!current(job))return false;
   if(ctx.state!=='running')throw failure('activate');
   const audio=await decode(ctx,buffer);if(!current(job))return false;
   if(!audio.length||!audio.duration)throw failure('invalid');
   return new Promise((resolve,reject)=>{
    try{
     const node=ctx.createBufferSource();node.buffer=audio;node.connect(ctx.destination);source=node;job.cancel=()=>resolve(false);
     node.onended=()=>{try{node.disconnect();}catch{}if(source===node)source=null;resolve(current(job));};
     node.start(0);announce(job,'playing',messages().playing,'local');
    }catch(error){reject(error);}
   });
  }
  // Older browsers without Web Audio retain an HTMLAudio element between taps.
  return new Promise((resolve,reject)=>{
   job.cancel=()=>resolve(false);
   if(!htmlAudio){htmlAudio=new Audio();htmlAudio.preload='auto';htmlAudio.setAttribute('playsinline','');}
   if(htmlUrl)URL.revokeObjectURL(htmlUrl);htmlUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));htmlAudio.src=htmlUrl;
   htmlAudio.onended=()=>resolve(current(job));htmlAudio.onerror=()=>reject(failure('failed'));
   const playing=htmlAudio.play();playing?.then(()=>announce(job,'playing',messages().playing,'local')).catch(()=>reject(failure('activate')));
  });
 }
 /* Choose the most natural installed/device voice, not the first local voice.
    Some browsers return compact/legacy voices before enhanced ones. */
 function voiceRank(voice,lang){
  const name=String(voice.name||'')+' '+String(voice.voiceURI||'');
  const locale=String(voice.lang||'').toLowerCase().replace('_','-');
  const profile=LANGUAGES[lang].locale.toLowerCase();
  let score=locale===profile?25:0;
  if(/enhanced|premium|neural|natural|high.quality|google|microsoft|siri|online/i.test(name))score+=40;
  if(/compact|legacy|espeak|festival|robot|basic|low.quality/i.test(name))score-=65;
  if(voice.default)score+=8;
  if(voice.localService===false)score+=5;
  return score;
 }
 function androidAvailable(){return Boolean(global.KalimaAndroidTTS && typeof global.KalimaAndroidTTS.speak==='function');}
 function androidSpeech(job){
  if(!androidAvailable())return Promise.resolve(false);
  job.engine='android';
  return new Promise(resolve=>{
   let finished=false;
   const timeout=setTimeout(()=>finish(false),Math.min(70000,job.text.length*220+15000));
   function finish(ok){
    if(finished)return;
    finished=true;
    clearTimeout(timeout);
    global.removeEventListener('kalima-tts-status',onStatus);
    resolve(Boolean(ok&&current(job)));
   }
   function onStatus(event){
    if(Number(event?.detail?.id)!==job.id)return;
    const status=event.detail.status;
    if(status==='playing'){announce(job,'playing',messages().playing,'android');}
    else if(status==='finished')finish(true);
    else if(status==='error'||status==='stopped')finish(false);
   }
   global.addEventListener('kalima-tts-status',onStatus);
   job.cancel=()=>{
    try{global.KalimaAndroidTTS.stop();}catch{}
    finish(false);
   };
   try{global.KalimaAndroidTTS.speak(job.text,job.lang,job.id);}catch{finish(false);}
  });
 }
 function deviceVoice(lang){
  if(!nativeAvailable())return null;
  try{
   const voices=global.speechSynthesis.getVoices().filter(voice=>String(voice.lang).toLowerCase().split(/[-_]/)[0]===lang);
   return voices.sort((a,b)=>voiceRank(b,lang)-voiceRank(a,lang))[0]||null;
  }catch{return null;}
 }
 function waitForVoice(lang){
  if(!nativeAvailable())return Promise.resolve(null);
  const voice=deviceVoice(lang);if(voice)return Promise.resolve(voice);
  return new Promise(resolve=>{
   let elapsed=0;const timer=setInterval(()=>{
    elapsed+=100;const found=deviceVoice(lang);
    if(found||elapsed>=1600){clearInterval(timer);resolve(found);}
   },100);
  });
 }
 async function nativeSpeech(job){
  const voice=await waitForVoice(job.lang);if(!voice||!current(job))return false;
  job.engine='device';
  return new Promise((resolve,reject)=>{
   let started=false,finished=false;const synth=global.speechSynthesis;
   const utterance=new SpeechSynthesisUtterance(job.text);nativeUtterance=utterance;
   utterance.lang=voice.lang||LANGUAGES[job.lang].locale;utterance.voice=voice;utterance.rate=.94;utterance.pitch=1;utterance.volume=1;
   const maxTime=setTimeout(()=>fail(),Math.min(90000,job.text.length*180+12000));
   const startTime=setTimeout(()=>{if(!started)fail();},6000);
   const keepAlive=setInterval(()=>{if(current(job)&&synth.paused)try{synth.resume();}catch{}},7000);
   function finish(value){if(finished)return;finished=true;clearTimeout(maxTime);clearTimeout(startTime);clearInterval(keepAlive);if(nativeUtterance===utterance)nativeUtterance=null;resolve(value);}
   job.cancel=()=>finish(false);
   function fail(){if(finished)return;try{synth.cancel();}catch{}finish(false);}
   utterance.onstart=()=>{if(!current(job)){finish(false);return;}started=true;clearTimeout(startTime);announce(job,'playing',messages().playing,'device');};
   utterance.onend=()=>finish(current(job));utterance.onerror=()=>finish(false);
   try{synth.resume();synth.speak(utterance);}catch{finish(false);}
  });
 }
 function speak(text,options={}){
  text=String(text||'').replace(/\s+/g,' ').trim();
  stop();if(!text)return Promise.resolve(false);
  let lang;try{lang=language(options);}catch(error){return Promise.reject(error);}
  const ctx=unlock();
  const id=sequence;
  const promise=new Promise((resolve,reject)=>{
   const job={id,text,lang,resolve,reject,onStatus:options.onStatus,done:false,engine:null};active=job;
   announce(job,'loading',messages().loading);
   (async()=>{
    // The bundled meSpeak/eSpeak voice sounds robotic. Prefer natural TTS
    // from the actual phone/browser, with meSpeak only as a last resort.
    let played=false,localError=null;
    // The Android APK uses the installed Android text-to-speech engine. Web
    // speech synthesis is preferred in ordinary browsers (especially iOS).
    if(androidAvailable())played=await androidSpeech(job);
    if(!current(job))return;
    if(!played)played=await nativeSpeech(job);
    if(!current(job))return;
    if(!played&&LANGUAGES[lang].voice&&options.engine!=='native'){
     try{played=await localSpeech(job,ctx);}catch(error){localError=error;}
    }
    if(!current(job))return;
    if(!played)throw localError||failure('unsupported');
    if(!current(job))return;
    announce(job,'finished',messages().finished,job.engine);complete(job,Boolean(played));
   })().catch(error=>{if(!current(job))return;const failure=new Error(error?.message||messages().failed);announce(job,'error',failure.message,job.engine);complete(job,false,failure);});
  });
  return promise;
 }
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(context?.state==='running')context.suspend().catch(()=>{});}});
 global.WORT_AUDIO=Object.freeze({speak,stop,synthesize,prepare,get state(){return{...phase};},get supported(){return Boolean(global.AudioContext||global.webkitAudioContext||global.Audio||nativeAvailable());}});
})(globalThis);
