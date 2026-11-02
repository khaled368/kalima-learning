/* Android-only, opt-in local reminder for the daily vocabulary goal. */
(function(global){
 'use strict';
 const bridge=global.KalimaDailyReminder,section=document.getElementById('daily-reminder-control');
 if(!section||!bridge||typeof bridge.getSettings!=='function')return;
 const native=global.WORT_COURSE?.native||'ar';
 const locale={
  ar:['🔔 تذكير الهدف اليومي','موعد التذكير','فعّل التذكير ليصلك إشعار إذا لم تكمل 20 كلمة.','سيصلك تذكير إذا لم تكمل هدفك اليومي.','اسمح بإشعارات كلمة في إعدادات الهاتف.'],
  en:['🔔 Daily goal reminder','Reminder time','Enable notifications for your daily 20 words.','Reminders are sent only if your goal is unfinished.','Allow Kalima notifications in Android settings.'],
  nl:['🔔 Dagelijkse herinnering','Tijd','Stel een herinnering in voor je 20 woorden.','Alleen een melding als je doel niet is voltooid.','Sta Kalima-meldingen toe in Android-instellingen.'],
  de:['🔔 Tägliche Erinnerung','Uhrzeit','Erinnerung für dein 20-Wörter-Ziel aktivieren.','Nur bei unerreichtem Tagesziel wirst du erinnert.','Erlaube Kalima-Benachrichtigungen in Android.']
 }[native]||['🔔 تذكير الهدف اليومي','موعد التذكير','فعّل التذكير ليصلك إشعار إذا لم تكمل 20 كلمة.','سيصلك تذكير إذا لم تكمل هدفك اليومي.','اسمح بإشعارات كلمة في إعدادات الهاتف.'];
 const toggle=section.querySelector('#daily-reminder-enabled');
 const time=section.querySelector('#daily-reminder-time');
 const note=section.querySelector('#daily-reminder-note');
 section.querySelector('#daily-reminder-title').textContent=locale[0];
 section.querySelector('#daily-reminder-time-label').textContent=locale[1];
 function settings(){
  try{return JSON.parse(bridge.getSettings());}
  catch{return{enabled:false,hour:20,minute:0,permission:false};}
 }
 function refresh(){
  const current=settings();
  toggle.checked=Boolean(current.enabled);
  time.value=String(current.hour).padStart(2,'0')+':'+String(current.minute).padStart(2,'0');
  note.textContent=current.enabled?(current.permission?locale[3]:locale[4]):locale[2];
 }
 function save(){
  const match=/^(\d{2}):(\d{2})$/.exec(time.value);
  if(!match)return;
  try{bridge.configure(toggle.checked,Number(match[1]),Number(match[2]),native);}
  catch{return;}
  const current=settings();
  note.textContent=toggle.checked?(current.permission?locale[3]:locale[4]):locale[2];
  // The native bridge updates settings asynchronously and dispatches a refresh.
 }
 toggle.addEventListener('change',save);
 time.addEventListener('change',save);
 global.addEventListener('kalima-reminder-permission',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 section.hidden=false;
 refresh();
 global.WORT_DAILY_REMINDERS=Object.freeze({
  syncProgress(day,count){try{bridge.updateProgress(String(day),Number(count),native);}catch{}}
 });
})(globalThis);
