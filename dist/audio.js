/* German speech playback: native device voices plus a bundled eSpeak/meSpeak renderer.
 * meSpeak/eSpeak assets are GPL-3.0; see assets/audio-engine/ and Sources.
 * An AudioContext is unlocked directly by the user's tap, before any lazy downloads.
 */
(function(global){
 'use strict';
 const ENGINE_SCRIPT='assets/audio-engine/mespeak.js';
 const MAX_CACHE_BYTES=8*1024*1024;
 let context=null,source=null,htmlAudio=null,htmlUrl=null,enginePromise=null,nativeUtterance=null;
 let active=null,sequence=0,phase={state:'idle',message:'',text:'',engine:null};
 const cache=new Map();let cacheBytes=0,previousSessionType=null;
 function releaseSession(){if(previousSessionType===null)return;try{if(global.navigator?.audioSession?.type==='playback')global.navigator.audioSession.type=previousSessionType;}catch{}previousSessionType=null;}
 const nativeAvailable=()=>typeof global.SpeechSynthesisUtterance==='function'&&Boolean(global.speechSynthesis);
 const messages={loading:'يُجهّز الصوت لأول مرة…',playing:'جارٍ النطق…',finished:'انتهى النطق.',stopped:'توقّف الصوت.'};
 function current(job){return active===job&&job.id===sequence&&!job.done;}
 function announce(job,state,message,engine){
  if(job&&!current(job))return;
  phase={state,message:message||messages[state]||'',text:job?.text||'',engine:engine||job?.engine||null};
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
   phase={state:'stopped',message:messages.stopped,text:old.text,engine:old.engine||null};
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
   const timer=setTimeout(()=>reject(new Error('تعذّر تجهيز الصوت. تحقّق من الاتصال ثم اضغط سماع مجددًا.')),25000);
   function loaded(){
    if(!global.meSpeak?.loadVoice){clearTimeout(timer);reject(new Error('تعذّر تحميل محرّك النطق.'));return;}
    try{
     if(global.meSpeak.isVoiceLoaded?.('de')){clearTimeout(timer);resolve(global.meSpeak);return;}
     global.meSpeak.loadVoice('de',(ok)=>{clearTimeout(timer);if(ok)resolve(global.meSpeak);else reject(new Error('تعذّر تحميل الصوت الألماني. أعد المحاولة.'));});
    }catch(error){clearTimeout(timer);reject(error);}
   }
   if(global.meSpeak?.speak){loaded();return;}
   const script=document.createElement('script');script.src=ENGINE_SCRIPT;script.async=true;script.dataset.wortAudioEngine='true';script.onload=loaded;
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('تعذّر تحميل الصوت. تحقّق من الاتصال وأعد المحاولة.'));};document.head.appendChild(script);
  }).catch(error=>{enginePromise=null;throw error;});
  return enginePromise;
 }
 function asBuffer(stream){
  if(stream instanceof ArrayBuffer)return stream;
  if(ArrayBuffer.isView(stream))return stream.buffer.slice(stream.byteOffset,stream.byteOffset+stream.byteLength);
  if(Array.isArray(stream))return Uint8Array.from(stream).buffer;
  if(typeof stream==='string'){
   const binary=atob(stream.includes(',')?stream.slice(stream.indexOf(',')+1):stream);return Uint8Array.from(binary,char=>char.charCodeAt(0)).buffer;
  }
  throw new Error('لم ينتج محرّك النطق ملفًا صوتيًا صالحًا.');
 }
 async function synthesize(text){
  text=String(text||'').replace(/\s+/g,' ').trim();
  if(!text)throw new Error('لا يوجد نص للنطق.');
  if(text.length>2500)throw new Error('اختر جملة أقصر للنطق.');
  if(cache.has(text)){const cached=cache.get(text);cache.delete(text);cache.set(text,cached);return cached.slice(0);}
  const engine=await loadEngine();
  const buffer=await new Promise((resolve,reject)=>{
   let finished=false;
   const timer=setTimeout(()=>{if(!finished){finished=true;reject(new Error('استغرق تجهيز النطق وقتًا طويلًا. حاول مجددًا.'));}},25000);
   try{engine.speak(text,{voice:'de',rawdata:true,speed:155,amplitude:100,pitch:50,wordgap:2},(ok,id,stream)=>{
    if(finished)return;finished=true;clearTimeout(timer);
    if(!ok||!stream){reject(new Error('تعذّر إنتاج الصوت. اضغط سماع مجددًا.'));return;}
    try{resolve(asBuffer(stream));}catch(error){reject(error);}
   });}catch(error){clearTimeout(timer);finished=true;reject(error);}
  });
  const bytes=new Uint8Array(buffer);
  if(bytes.length<=44||String.fromCharCode(...bytes.slice(0,4))!=='RIFF')throw new Error('تعذّر إنتاج ملف النطق.');
  if(buffer.byteLength<=2*1024*1024){
   while(cache.size>=8||cacheBytes+buffer.byteLength>MAX_CACHE_BYTES){const first=cache.keys().next().value;if(first===undefined)break;cacheBytes-=cache.get(first).byteLength;cache.delete(first);}
   cache.set(text,buffer);cacheBytes+=buffer.byteLength;
  }
  return buffer.slice(0);
 }
 function decode(ctx,buffer){return new Promise((resolve,reject)=>{try{const result=ctx.decodeAudioData(buffer.slice(0),resolve,reject);if(result?.catch)result.catch(reject);}catch(error){reject(error);}});}
 async function localSpeech(job,ctx){
  job.engine='local';announce(job,'loading',messages.loading,'local');
  const buffer=await synthesize(job.text);if(!current(job))return false;
  if(ctx){
   if(ctx.state!=='running')await ctx.resume();
   if(!current(job))return false;
   if(ctx.state!=='running')throw new Error('اضغط سماع مرة أخرى لتفعيل الصوت في المتصفح.');
   const audio=await decode(ctx,buffer);if(!current(job))return false;
   if(!audio.length||!audio.duration)throw new Error('تعذّر قراءة ملف النطق.');
   return new Promise((resolve,reject)=>{
    try{
     const node=ctx.createBufferSource();node.buffer=audio;node.connect(ctx.destination);source=node;job.cancel=()=>resolve(false);
     node.onended=()=>{try{node.disconnect();}catch{}if(source===node)source=null;resolve(current(job));};
     node.start(0);announce(job,'playing',messages.playing,'local');
    }catch(error){reject(error);}
   });
  }
  // Older browsers without Web Audio retain an HTMLAudio element between taps.
  return new Promise((resolve,reject)=>{
   job.cancel=()=>resolve(false);
   if(!htmlAudio){htmlAudio=new Audio();htmlAudio.preload='auto';htmlAudio.setAttribute('playsinline','');}
   if(htmlUrl)URL.revokeObjectURL(htmlUrl);htmlUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));htmlAudio.src=htmlUrl;
   htmlAudio.onended=()=>resolve(current(job));htmlAudio.onerror=()=>reject(new Error('تعذّر تشغيل الصوت على هذا الجهاز.'));
   const playing=htmlAudio.play();playing?.then(()=>announce(job,'playing',messages.playing,'local')).catch(()=>reject(new Error('اضغط سماع مرة أخرى للسماح بتشغيل الصوت.')));
  });
 }
 function germanVoice(){
  if(!nativeAvailable())return null;
  try{const voices=global.speechSynthesis.getVoices().filter(voice=>/^de(?:[-_]|$)/i.test(voice.lang));return voices.find(voice=>voice.localService)||voices[0]||null;}catch{return null;}
 }
 function waitForVoice(){
  const voice=germanVoice();if(voice)return Promise.resolve(voice);
  return new Promise(resolve=>{
   let elapsed=0;const timer=setInterval(()=>{elapsed+=50;const found=germanVoice();if(found||elapsed>=500){clearInterval(timer);resolve(found);}},50);
  });
 }
 async function nativeSpeech(job){
  const voice=await waitForVoice();if(!voice||!current(job))return false;
  job.engine='device';
  return new Promise((resolve,reject)=>{
   let started=false,finished=false;const synth=global.speechSynthesis;
   const utterance=new SpeechSynthesisUtterance(job.text);nativeUtterance=utterance;
   utterance.lang=voice.lang||'de-DE';utterance.voice=voice;utterance.rate=.85;utterance.pitch=1;utterance.volume=1;
   const maxTime=setTimeout(()=>fail(),Math.min(90000,job.text.length*180+12000));
   const startTime=setTimeout(()=>{if(!started)fail();},1800);
   const keepAlive=setInterval(()=>{if(current(job)&&synth.paused)try{synth.resume();}catch{}},7000);
   function finish(value){if(finished)return;finished=true;clearTimeout(maxTime);clearTimeout(startTime);clearInterval(keepAlive);if(nativeUtterance===utterance)nativeUtterance=null;resolve(value);}
   job.cancel=()=>finish(false);
   function fail(){if(finished)return;try{synth.cancel();}catch{}finish(false);}
   utterance.onstart=()=>{if(!current(job)){finish(false);return;}started=true;clearTimeout(startTime);announce(job,'playing',messages.playing,'device');};
   utterance.onend=()=>finish(current(job));utterance.onerror=()=>finish(false);
   try{synth.resume();synth.speak(utterance);}catch{finish(false);}
  });
 }
 function speak(text,options={}){
  text=String(text||'').replace(/\s+/g,' ').trim();
  stop();if(!text)return Promise.resolve(false);
  const ctx=unlock();
  const id=sequence;
  const promise=new Promise((resolve,reject)=>{
   const job={id,text,resolve,reject,onStatus:options.onStatus,done:false,engine:null};active=job;
   announce(job,'loading',messages.loading);
   (async()=>{
    // Bundled German is the default: it works even where device voices are absent or silent.
    let played=false;
    if(options.engine==='native'||options.engine==='auto')played=await nativeSpeech(job);
    if(!current(job))return;
    if(!played)played=await localSpeech(job,ctx);
    if(!current(job))return;
    announce(job,'finished',messages.finished,job.engine);complete(job,Boolean(played));
   })().catch(error=>{if(!current(job))return;const failure=new Error(error?.message||'تعذّر تشغيل الصوت. اضغط سماع للمحاولة مجددًا.');announce(job,'error',failure.message,job.engine);complete(job,false,failure);});
  });
  return promise;
 }
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(context?.state==='running')context.suspend().catch(()=>{});}});
 global.WORT_AUDIO=Object.freeze({speak,stop,synthesize,prepare:loadEngine,get state(){return{...phase};},get supported(){return Boolean(global.AudioContext||global.webkitAudioContext||global.Audio||nativeAvailable());}});
})(globalThis);
