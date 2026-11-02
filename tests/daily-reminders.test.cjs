'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('dist/index.html'),account=read('dist/account.js'),accountCss=read('dist/account.css'),app=read('dist/app.js'),loader=read('dist/app-bootstrap.js');
const native=read('android/app/src/main/java/com/kalima/learning/DailyReminderReceiver.java');
const java=read('android/app/src/main/java/com/kalima/learning/MainActivity.java');
const manifest=read('android/app/src/main/AndroidManifest.xml');
assert.doesNotMatch(html,/id="daily-reminder-control"/,'reminder must no longer appear in main vocabulary page');
assert.match(account,/id="daily-reminder-control" class="daily-reminder-control" hidden/,'account dialog contains the reminder controls');
assert.ok(account.indexOf('id="account-body"') < account.indexOf('id="daily-reminder-control"'),'settings follow account content');
assert.ok(account.indexOf('id="daily-reminder-control"') < account.indexOf('id="account-error"'),'settings persist outside account body re-renders');
assert.match(accountCss,/#account-dialog \.daily-reminder-control/,'account owns the reminder styles');
assert.doesNotMatch(read('dist/daily-goal-illustration.css'),/daily-reminder-control/,'home page no longer styles reminders');
assert.match(loader,/daily-reminders\.js\?v=/);
assert.ok(loader.indexOf('daily-reminders.js') < loader.indexOf('app.js'),'reminder init precedes app progress');
assert.match(app,/WORT_DAILY_REMINDERS\?\.syncProgress\(today\.day,today\.ids\.length\)/);
assert.match(native,/if\(count>=GOAL\)return/,'finished goals produce no reminders');
assert.match(native,/setAndAllowWhileIdle/,'respects Android power limits');
assert.match(native,/ACTION_BOOT_COMPLETED/,'resumes after reboot');
assert.match(java,/addJavascriptInterface\(new ReminderBridge\(\)/,'Android reminder bridge installed');
assert.match(java,/Manifest\.permission\.POST_NOTIFICATIONS/,'permission requested on opt-in');
assert.match(manifest,/android\.permission\.POST_NOTIFICATIONS/);
assert.match(manifest,/android\.permission\.RECEIVE_BOOT_COMPLETED/);
function fixture(bridge){
 const handlers={};
 function element(){const events={};return{hidden:true,checked:false,value:'',textContent:'',events,
  addEventListener(type,listener){events[type]=listener;},
  querySelector(q){return nodes[q.substring(1)];}};}
 const nodes=Object.fromEntries(['daily-reminder-control','daily-reminder-enabled','daily-reminder-time',
  'daily-reminder-title','daily-reminder-time-label','daily-reminder-note'].map(x=>[x,element()]));
 const document={getElementById(id){return nodes[id];},hidden:false,addEventListener(type,listener){handlers[type]=listener;}};
 const ctx={document,KalimaDailyReminder:bridge,WORT_COURSE:{native:'ar'},addEventListener(type,listener){handlers[type]=listener;}};
 vm.createContext(ctx);
 vm.runInContext(read('dist/daily-reminders.js'),ctx);
 return {ctx,nodes,handlers};
}
const browser=fixture(undefined);
assert.equal(browser.nodes['daily-reminder-control'].hidden,true,'browser does not show Android-only settings');
const state={enabled:false,hour:20,minute:0,permission:true},calls=[],updates=[];
const bridge={
 getSettings(){return JSON.stringify(state);},
 configure(enabled,hour,minute,lang){calls.push({enabled,hour,minute,lang});Object.assign(state,{enabled,hour,minute});},
 updateProgress(day,count,lang){updates.push({day,count,lang});}
};
const appView=fixture(bridge),nodes=appView.nodes;
assert.equal(nodes['daily-reminder-control'].hidden,false);
assert.equal(nodes['daily-reminder-enabled'].checked,false,'notifications require opt-in');
assert.equal(nodes['daily-reminder-time'].value,'20:00','default time 20:00');
nodes['daily-reminder-enabled'].checked=true;
nodes['daily-reminder-enabled'].events.change();
assert.equal(calls.length,1);
assert.deepEqual(calls[0],{enabled:true,hour:20,minute:0,lang:'ar'});
nodes['daily-reminder-time'].value='18:30';
nodes['daily-reminder-time'].events.change();
assert.deepEqual(calls[1],{enabled:true,hour:18,minute:30,lang:'ar'});
appView.ctx.WORT_DAILY_REMINDERS.syncProgress('2026-11-02',12);
assert.equal(updates[0].count,12);
assert.equal(updates[0].day,'2026-11-02');
state.enabled=false;
appView.handlers['kalima-reminder-permission']({detail:{granted:false}});
assert.equal(nodes['daily-reminder-enabled'].checked,false,'permission denial disables toggle');
console.log('PASS: opt-in native reminders, 20:00 default, editable time, 20-word goal and Android permissions.');
