/* Voice settings for the browser. No external TTS provider or microphone permission. */
(function(global){
 'use strict';
 const audio=global.WORT_AUDIO;
 const dialog=document.getElementById('kalima-voice-dialog');
 if(!audio||!dialog||global.KalimaAndroidTTS)return;
 const target=global.WORT_COURSE?.target||'de';
 const lang=global.WORT_COURSE?.native||'ar';
 const labels={
  ar:{title:'إعدادات النطق',choice:'اختر صوتًا',automatic:'أفضل صوت متاح تلقائيًا',speed:'سرعة النطق',
      fallback:'السماح بالصوت الآلي الاحتياطي عند تعذّر صوت الجهاز',
      preview:'جرّب الصوت',close:'إغلاق',noVoices:'لا يعرض المتصفح أصواتًا قابلة للاختيار لهذه اللغة؛ سنستخدم صوت الجهاز الافتراضي.',
      limited:'في Safari على الآيفون قد لا تظهر أصوات Enhanced وPremium حتى بعد تنزيلها. الجودة تعتمد على الأصوات التي يتيحها المتصفح.',
      available:'اختر صوتًا وجربه لتحديد الأنسب لك.',error:'تعذّر تشغيل صوت المتصفح. يمكنك تفعيل الصوت الاحتياطي.'},
  en:{title:'Pronunciation settings',choice:'Choose voice',automatic:'Best available voice automatically',speed:'Speaking speed',
      fallback:'Use the robotic fallback if the device voice fails',
      preview:'Test voice',close:'Close',noVoices:'Your browser does not list voices for this language; the default device voice will be used.',
      limited:'Safari on iPhone may not show downloaded Enhanced or Premium voices. Quality depends on voices the browser exposes.',
      available:'Choose and test the voice you prefer.',error:'Browser voice could not play. You may enable the fallback.'},
  nl:{title:'Uitspraakinstellingen',choice:'Kies een stem',automatic:'Automatisch de beste beschikbare stem',speed:'Spreeksnelheid',
      fallback:'Gebruik de robotstem als de apparaatstem niet werkt',
      preview:'Test de stem',close:'Sluiten',noVoices:'De browser toont geen stemmen voor deze taal. We gebruiken de standaardstem.',
      limited:'Safari op iPhone toont mogelijk geen gedownloade verbeterde stemmen. De kwaliteit hangt af van de browser.',
      available:'Kies en test de stem die je het prettigst vindt.',error:'De browserstem kon niet worden afgespeeld.'},
  de:{title:'Aussprache einstellen',choice:'Stimme auswählen',automatic:'Beste verfügbare Stimme automatisch',speed:'Sprechtempo',
      fallback:'Bei Problemen die robotische Ersatzstimme verwenden',
      preview:'Stimme testen',close:'Schließen',noVoices:'Der Browser zeigt keine Stimmen für diese Sprache. Die Standardstimme wird benutzt.',
      limited:'Safari auf dem iPhone zeigt heruntergeladene Premium-Stimmen eventuell nicht an. Die Qualität hängt vom Browser ab.',
      available:'Wähle und teste die angenehmste Stimme.',error:'Die Browserstimme konnte nicht abgespielt werden.'}
 }[lang]||null;
 const t=labels||{title:'إعدادات النطق',choice:'اختر صوتًا',automatic:'صوت الجهاز',speed:'السرعة',fallback:'الصوت الآلي الاحتياطي',preview:'جرّب',close:'إغلاق',noVoices:'الصوت الافتراضي',limited:'جودة الصوت تعتمد على المتصفح.',available:'جرّب الأصوات المتاحة.',error:'تعذّر النطق'};
 const voiceSelect=dialog.querySelector('#kalima-voice-select');
 const rateSelect=dialog.querySelector('#kalima-voice-rate');
 const fallback=dialog.querySelector('#kalima-voice-robotic');
 const note=dialog.querySelector('#kalima-voice-note');
 const preview=dialog.querySelector('#kalima-voice-preview');
 const close=dialog.querySelector('#kalima-voice-close');
 const title=dialog.querySelector('#kalima-voice-heading');
 title.textContent=t.title;
 dialog.querySelector('#kalima-voice-choice-label').textContent=t.choice;
 dialog.querySelector('#kalima-voice-rate-label').textContent=t.speed;
 dialog.querySelector('#kalima-voice-robotic-label').textContent=t.fallback;
 preview.textContent=t.preview;close.textContent=t.close;
 function render(){
  const prefs=audio.getVoiceSettings(target);
  const list=audio.getVoiceOptions(target);
  voiceSelect.replaceChildren();
  const automatic=document.createElement('option');
  automatic.value='';automatic.textContent=t.automatic;voiceSelect.appendChild(automatic);
  for(const voice of list){
   const option=document.createElement('option');
   option.value=voice.id;
   option.textContent=voice.name+(voice.enhanced?' ✨':'')+' ('+voice.language+')';
   voiceSelect.appendChild(option);
  }
  voiceSelect.value=list.some(voice=>voice.id===prefs.voiceId)?prefs.voiceId:'';
  rateSelect.value=String(prefs.rate);
  if(![...rateSelect.options].some(option=>option.value===rateSelect.value))rateSelect.value='0.98';
  fallback.checked=prefs.allowRobotic;
  const ios=/(iPhone|iPad|iPod)/i.test(global.navigator?.userAgent||'');
  note.textContent=list.length?(ios?t.limited:t.available):t.noVoices;
 }
 function update(settings){
  if(audio.setVoiceSettings(target,settings))render();
 }
 voiceSelect.addEventListener('change',()=>update({voiceId:voiceSelect.value}));
 rateSelect.addEventListener('change',()=>update({rate:Number(rateSelect.value)}));
 fallback.addEventListener('change',()=>update({allowRobotic:fallback.checked}));
 preview.addEventListener('click',()=>{
  preview.disabled=true;
  const samples={de:'Guten Morgen! Wie geht es dir heute?',en:'Good morning! How are you today?',nl:'Goedemorgen! Hoe gaat het vandaag met je?',ar:'صباح الخير، كيف حالك اليوم؟'};
  audio.speak(samples[target]||samples.de,{lang:target})
   .catch(error=>{note.textContent=error?.message||t.error;})
   .finally(()=>{preview.disabled=false;});
 });
 close.addEventListener('click',()=>{audio.stop();dialog.close();});
 dialog.addEventListener('close',()=>{audio.stop();preview.disabled=false;});
 document.querySelectorAll('[data-voice-settings-open]').forEach(button=>{
  button.textContent='🎙️ '+t.title;
  button.hidden=false;
  button.addEventListener('click',()=>{render();if(!dialog.open)dialog.showModal();});
 });
 try{global.speechSynthesis?.addEventListener?.('voiceschanged',()=>{if(dialog.open)render();});}catch{}
})(globalThis);
