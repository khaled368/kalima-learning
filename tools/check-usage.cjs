'use strict';
process.env.TZ='Europe/Berlin';
const assert=require('node:assert/strict');
const {createTracker,dayKey,splitDuration}=require('../dist/usage.js');
class Target{
 constructor(){this.listeners=new Map();this.visibilityState='visible';this.focused=true;}
 addEventListener(type,listener){const set=this.listeners.get(type)||new Set();set.add(listener);this.listeners.set(type,set);}
 removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
 dispatchEvent(event){for(const listener of [...(this.listeners.get(event.type)||[])])listener(event);return true;}
 hasFocus(){return this.focused;}
}
function storage(initial={}){const map=new Map(Object.entries(initial));return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};}
function harness({start=new Date(2026,10,1,12).getTime(),sharedStorage=storage(),clock}={}){
 const time=clock||{wall:start,perf:0},doc=new Target(),win=new Target(),timers=new Map();let id=0;
 win.document=doc;win.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options?.detail;}};
 const tracker=createTracker({window:win,document:doc,storage:sharedStorage,wallNow:()=>time.wall,monoNow:()=>time.perf,tabId:'test-tab-'+Math.random(),setInterval:fn=>{timers.set(++id,fn);return id;},clearInterval:id=>timers.delete(id)});
 function advance(ms,tick=true){let left=ms;while(left>0){const part=Math.min(left,5000);time.wall+=part;time.perf+=part;left-=part;if(tick)for(const fn of [...timers.values()])fn();}}
 return{tracker,doc,win,timers,storage:sharedStorage,time,advance};
}
// Foreground time and idempotent setup, with unrelated learning records preserved.
{
 const h=harness({sharedStorage:storage({'wort-learned':'[0,8]'})});h.tracker.start();h.tracker.start();assert.equal(h.timers.size,1);assert.equal(h.tracker.snapshot().activeMs,0);h.advance(61000);assert.equal(h.tracker.snapshot().activeMs,61000);assert.equal(h.tracker.snapshot().totalDays,1);assert.equal(h.storage.getItem('wort-learned'),'[0,8]');h.tracker.stop();assert.equal(h.timers.size,0);
}
// Hidden and blurred intervals are not counted; actual activity resumes the timer.
{
 const h=harness();h.tracker.start();h.advance(10000);h.doc.visibilityState='hidden';h.doc.dispatchEvent({type:'visibilitychange'});h.advance(60000);assert.equal(h.tracker.snapshot().activeMs,10000);h.doc.visibilityState='visible';h.doc.dispatchEvent({type:'visibilitychange'});h.advance(5000);h.win.dispatchEvent({type:'blur'});h.advance(30000);assert.equal(h.tracker.snapshot().activeMs,15000);h.win.dispatchEvent({type:'focus'});h.advance(5000);assert.equal(h.tracker.snapshot().activeMs,20000);h.tracker.stop();
}
// Programmatic scrolling after blur must not resume foreground counting.
{
 const h=harness();h.tracker.start();h.advance(2000);h.win.dispatchEvent({type:'blur'});h.doc.dispatchEvent({type:'scroll'});h.advance(30000);assert.equal(h.tracker.snapshot().activeMs,2000);assert.equal(h.tracker.snapshot().isActive,false);h.doc.dispatchEvent({type:'pointerdown'});h.advance(1000);assert.equal(h.tracker.snapshot().activeMs,3000);h.tracker.stop();
}
// Five-minute reading allowance, then idle pause. Returning activity starts a fresh active interval.
{
 const h=harness();h.tracker.start();h.advance(10*60*1000);assert.equal(h.tracker.snapshot().activeMs,300000);assert.equal(h.tracker.snapshot().isIdle,true);h.doc.dispatchEvent({type:'pointerdown'});h.advance(30000);assert.equal(h.tracker.snapshot().activeMs,330000);h.tracker.stop();
}
// Local midnight splits actual elapsed milliseconds across distinct active dates.
{
 const h=harness({start:new Date(2026,10,1,23,59,59).getTime()});h.tracker.start();h.advance(3000,false);const result=h.tracker.snapshot();assert.deepEqual(result.days,[{day:'2026-11-01',activeMs:1000},{day:'2026-11-02',activeMs:2000}]);assert.equal(result.totalDays,2);h.tracker.stop();
}
// A manual wall-clock jump does not manufacture hours; elapsed monotonic time is authoritative.
{
 const h=harness();h.tracker.start();h.time.wall+=24*3600000;h.advance(10000);assert.equal(h.tracker.snapshot().activeMs,10000);h.tracker.stop();
}
// Persistence survives a new tab/session, without inventing time before tracking.
{
 const shared=storage(),a=harness({sharedStorage:shared});a.tracker.start();a.advance(5000);a.tracker.stop();const b=harness({sharedStorage:shared,start:a.time.wall});b.tracker.start();assert.equal(b.tracker.snapshot().activeMs,5000);assert.equal(b.tracker.snapshot().currentSessionMs,0);b.advance(5000);assert.equal(b.tracker.snapshot().activeMs,10000);assert.equal(b.tracker.snapshot().currentSessionMs,5000);b.tracker.stop();
}
// Two simultaneously visible tabs share a foreground lease and cannot double the total.
{
 const shared=storage(),clock={wall:new Date(2026,10,1,12).getTime(),perf:0};const a=harness({sharedStorage:shared,clock}),b=harness({sharedStorage:shared,clock});a.tracker.start();b.tracker.start();a.advance(10000);assert.equal(a.tracker.snapshot().activeMs,10000);assert.equal(b.tracker.snapshot().currentSessionMs,0);a.tracker.stop();b.tracker.snapshot();b.advance(10000);b.tracker.stop();assert.equal(b.tracker.snapshot().activeMs,20000);
}
// Lease takeover clips the old owner at the acquisition time; pending contributions merge safely.
{
 const shared=storage(),clock={wall:new Date(2026,10,1,12).getTime(),perf:0},a=harness({sharedStorage:shared,clock});a.tracker.start();a.advance(20000,false);const b=harness({sharedStorage:shared,clock});b.tracker.start();assert.equal(a.tracker.snapshot().currentSessionMs,20000);b.advance(10000);a.tracker.stop();b.tracker.stop();assert.equal(b.tracker.snapshot().activeMs,30000);
}
// Disabled/corrupt local storage remains usable in the current session.
{
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};const h=harness({sharedStorage:broken});h.tracker.start();h.advance(5000);assert.equal(h.tracker.snapshot().activeMs,5000);assert.equal(h.tracker.snapshot().persistent,false);h.tracker.stop();
 const corrupt=harness({sharedStorage:storage({'wort-usage-v1':'{badJSON'})});corrupt.tracker.start();corrupt.advance(5000);assert.equal(corrupt.tracker.snapshot().activeMs,5000);corrupt.tracker.stop();
}
// Autumn daylight-saving day is 25 hours, rather than an assumed fixed 24-hour bucket.
{
 const parts=splitDuration(new Date(2026,9,25,0,0,0).getTime(),26*3600000);assert.equal(parts[0].day,'2026-10-25');assert.equal(parts[0].activeMs,25*3600000);assert.equal(parts[1].activeMs,3600000);assert.equal(dayKey(new Date(2026,9,26,12)),'2026-10-26');
}
console.log('PASS: foreground/blur/hidden/idle timing, local midnight/DST, monotonic clock jumps, persistence, tab deduplication/takeover, corrupt storage, and untouched learning data.');
