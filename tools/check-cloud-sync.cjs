/* Account isolation and progress-merge checks; no network or real accounts. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/cloud-sync.js'),'utf8');
const C=require('../dist/cloud-sync.js');
const json=JSON.stringify;
const raw=p=>JSON.parse(JSON.stringify(C.toRaw(p)));
const value=(p,key)=>JSON.parse(C.toRaw(p)[key]);
const owned=(data,actor='test',owner='account-A')=>C.fromRaw(Object.fromEntries(Object.entries(data).map(([key,v])=>[key,json(v)])),owner,actor);
const edit=(p,before,after,actor)=>C.applyChanges(p,before,after,actor,p.stamps).payload;
const eq=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
let checks=0;
function test(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(error){error.message=name+': '+error.message;throw error;}}
test('only allowlisted progress, never sessions or ephemeral leases',()=>{
 for(const key of ['wort-learned','wort-learned:en','wort-saved:nl','wort-writing-v1:a1-einladung','wort-writing-v1:en-a1-invitation:en','wort-usage-v1','wort-course-selection'])assert(C.allowed(key),key);
 for(const key of ['sb-project-auth-token','wort-usage-lease-v1','wort-cloud-v1:owner','access_token','wort-learned:fr','random'])assert(!C.allowed(key),key);
});
test('legacy numeric identifiers and every target course remain separate',()=>{
 const a=owned({'wort-learned':[1,'de:haus'],'wort-learned:en':['en:house']},'one');
 const b=owned({'wort-learned':['1',2],'wort-learned:nl':['nl:huis']},'two');
 const merged=C.mergePayload(a,b);
 eq(value(merged,'wort-learned'),[1,2,'de:haus']);eq(value(merged,'wort-learned:en'),['en:house']);eq(value(merged,'wort-learned:nl'),['nl:huis']);
 eq(raw(C.mergePayload(a,b)),raw(C.mergePayload(b,a)));eq(raw(C.mergePayload(merged,merged)),raw(merged));
});
test('first-learning dates stay earliest and legacy undated words stay undated',()=>{
 const a=owned({'wort-learned':[1,2],'wort-learning-history-v1':{version:1,startedAt:'2026-10-02',events:[{id:1,day:'2026-10-02',level:'A1'}],undatedIds:[2]}},'one');
 const b=owned({'wort-learned':[1,3],'wort-learning-history-v1':{version:1,startedAt:'2026-10-01',events:[{id:'1',day:'2026-10-03',level:'A1'},{id:3,day:'2026-10-01',level:'A1'}],undatedIds:[]}},'two');
 const h=value(C.mergePayload(a,b),'wort-learning-history-v1');eq(h.undatedIds,[2]);assert.equal(h.events.find(e=>e.id===1).day,'2026-10-02');assert.equal(h.startedAt,'2026-10-01');
 const tieA=owned({'wort-learning-history-v1':{events:[{id:1,day:'2026-10-01',level:'A1'}]}},'a');
 const tieB=owned({'wort-learning-history-v1':{events:[{id:'1',day:'2026-10-01',level:'A1'}]}},'b');
 eq(raw(C.mergePayload(tieA,tieB)),raw(C.mergePayload(tieB,tieA)));
});
test('usage max per contribution prevents repeat-sync time inflation',()=>{
 const a=owned({'wort-usage-v1':{version:1,startedAt:'2026-10-01',days:{'2026-10-01':{contributions:{deviceA:5000}}}}},'one');
 const b=owned({'wort-usage-v1':{version:1,days:{'2026-10-01':{contributions:{deviceA:7000,deviceB:3000}}}}},'two');
 let p=C.mergePayload(a,b);for(let i=0;i<5;i++)p=C.mergePayload(p,a);
 eq(value(p,'wort-usage-v1').days['2026-10-01'].contributions,{deviceA:7000,deviceB:3000});
});
test('saved deletions survive an old device and unrelated additions',()=>{
 const base=owned({'wort-saved':[1,2]},'seed'),before=raw(base);
 const removed=edit(base,before,{'wort-saved':json([2])},'remover');
 const added=edit(base,before,{'wort-saved':json([1,2,3])},'adder');
 const result=C.mergePayload(removed,added);
 eq(value(result,'wort-saved'),[2,3]);eq(value(C.mergePayload(result,base),'wort-saved'),[2,3]);
 const restored=edit(result,raw(result),{'wort-saved':json([1,2,3])},'restorer');eq(value(C.mergePayload(restored,result),'wort-saved'),[1,2,3]);
});
test('sentence solves union, drafts keep complete alternatives and mutable checklists',()=>{
 const base=owned({'wort-sentences-v1:en':{solved:['one'],level:'A1',exercise:'one'},'wort-writing-v1:test:en':{text:'original',checked:[0]}},'seed');
 const a=edit(base,raw(base),{'wort-sentences-v1:en':json({solved:['one','two'],level:'A1',exercise:'two'}),'wort-writing-v1:test:en':json({text:'My full draft.',checked:[0,1]})},'deviceA');
 const b=edit(base,raw(base),{'wort-sentences-v1:en':json({solved:['one','three'],level:'A2',exercise:'three'}),'wort-writing-v1:test:en':json({text:'Another full draft.',checked:[]})},'deviceB');
 const p=C.mergePayload(a,b),d=value(p,'wort-writing-v1:test:en');
 eq(value(p,'wort-sentences-v1:en').solved,['one','three','two']);assert(['My full draft.','Another full draft.'].includes(d.text));assert.equal(p.conflicts.length,1);assert.notEqual(JSON.parse(p.conflicts[0].value).text,d.text);eq(raw(C.mergePayload(a,b)),raw(C.mergePayload(b,a)));
 const next=edit(p,raw(p),{...raw(p),'wort-writing-v1:test:en':json({text:'Revised after reading both.',checked:[]})},'deviceA');
 eq(value(C.mergePayload(next,p),'wort-writing-v1:test:en'),{text:'Revised after reading both.',checked:[]});
});
test('foreign snapshot owners are rejected rather than mixed',()=>assert.throws(()=>C.mergePayload(owned({'wort-learned':[1]}),owned({'wort-learned':[2]},'other','account-B')),/owner/));

function documentFor(map=new Map(),options={}){
 class Storage{
  get length(){return map.size;}key(i){return [...map.keys()][i]??null;}
  getItem(key){return map.has(String(key))?map.get(String(key)):null;}
  setItem(key,value){
   if(options.quota){const next=new Map(map);next.set(String(key),String(value));let bytes=0;for(const [k,v] of next)bytes+=2*(k.length+v.length);if(bytes>options.quota){const error=new Error('Storage quota exceeded');error.name='QuotaExceededError';throw error;}}
   map.set(String(key),String(value));
  }removeItem(key){map.delete(String(key));}
 }
 const storage=new Storage(),listeners=new Map();
 let reloads=0;
 const context={console,Storage,localStorage:storage,module:{exports:{}},crypto:{randomUUID:()=>`actor-${Math.random().toString(36).slice(2)}`},CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},setTimeout,clearTimeout,setInterval,clearInterval,location:{reload(){reloads++;}}};
 context.window=context;vm.createContext(context);vm.runInContext(source,context);
 return {C:context.module.exports,storage,map,context,reloads:()=>reloads};
}
function backend(){
 const rows=new Map();let offline=false,conflict=null,paused=null;
 return {rows,get offline(){return offline;},set offline(v){offline=v;},set conflict(v){conflict=v;},set paused(v){paused=v;},client:{from(){let uid;return {select(){return this;},eq(key,value){uid=value;return this;},async maybeSingle(){return offline?{error:new Error('offline')}:{data:rows.has(uid)?JSON.parse(json(rows.get(uid))):null,error:null};}};},async rpc(name,args){
  if(offline)return {error:new Error('offline')};const p=JSON.parse(json(args.next_payload));
  if(paused){const f=paused;paused=null;await f();}
  if(conflict){const f=conflict;conflict=null;f(p.owner,rows);}
  const current=rows.get(p.owner);if((current?.revision||0)!==args.expected_revision)return {data:{ok:false,revision:current?.revision||0,payload:current?.payload||null}};
  const next={revision:(current?.revision||0)+1,payload:p};rows.set(p.owner,next);return {data:{ok:true,...JSON.parse(json(next))}};
 }}};
}
async function runtime(){
 const server=backend();let doc=documentFor();
 // Saved key intentionally precedes learned key to catch insertion-order reload loops.
 doc.storage.setItem('wort-saved',json([1]));doc.storage.setItem('wort-learned',json([1,2]));
 doc.storage.setItem('wort-writing-v1:a1-einladung',json({text:'Anonymous draft',checked:[0]}));
 doc.storage.setItem('sb-test-auth-token','secret-placeholder');doc.storage.setItem('wort-usage-lease-v1',json({owner:'tab'}));
 let cloud=doc.C.create({client:server.client});
 assert.equal((await cloud.activate({id:'account-A'})).requiresReload,true);assert.equal(server.rows.get('account-A').payload.owner,'account-A');
 assert(!Object.keys(server.rows.get('account-A').payload.values).some(key=>key.startsWith('sb-')));
 const map=doc.map;doc=documentFor(map);cloud=doc.C.create({client:server.client});
 assert.equal((await cloud.activate({id:'account-A'})).requiresReload,false,'login hydration must settle after one reload');
 eq(JSON.parse(doc.storage.getItem('wort-learned')),[1,2]);
 assert.equal(doc.storage.getItem('sb-test-auth-token'),'secret-placeholder');
 assert.equal(doc.storage.getItem('wort-usage-lease-v1'),json({owner:'tab'}));
 checks++;console.log('PASS anonymous import, legacy types, auth-key exclusion and no reload loop');
 // CAS conflict introduces an unseen saved item; local unstarring must not erase it.
 server.conflict=(uid,rows)=>{const current=rows.get(uid),remote=C.applyChanges(current.payload,C.toRaw(current.payload),{...C.toRaw(current.payload),'wort-saved':json([1,9]),'wort-learned':json([1,2,9])},'remote',current.payload.stamps).payload;rows.set(uid,{revision:current.revision+1,payload:remote});};
 doc.storage.setItem('wort-learned',json([1,2,3]));await cloud.flush();
 doc.storage.setItem('wort-saved',json([]));await cloud.flush();
 eq(JSON.parse(server.rows.get('account-A').payload.values['wort-saved']),[9]);
 eq(JSON.parse(server.rows.get('account-A').payload.values['wort-learned']),[1,2,3,9]);
 assert.equal(cloud.snapshot().needsReload,true);checks++;console.log('PASS CAS retry and unseen remote saved additions survive local removal');
 // A user can leave offline. Pending changes stay in A's bank and never enter guest/B.
 server.offline=true;doc.storage.setItem('wort-learned:en',json(['en:offline']));
 await assert.rejects(cloud.flush(),error=>error.code==='sync-offline');
 assert.equal((await cloud.activate(null)).requiresReload,true);
 doc=documentFor(map);cloud=doc.C.create({client:server.client});await cloud.activate(null);
 assert.equal(doc.storage.getItem('wort-learned'),null);assert.equal(doc.storage.getItem('wort-writing-v1:a1-einladung'),null);assert.equal(doc.storage.getItem('wort-learned:en'),null);
 assert.equal((await cloud.activate({id:'account-B'})).requiresReload,true);
 doc=documentFor(map);cloud=doc.C.create({client:server.client});await cloud.activate({id:'account-B'});
 assert.equal(doc.storage.getItem('wort-learned'),null);assert.equal(doc.storage.getItem('wort-writing-v1:a1-einladung'),null);
 server.offline=false;await cloud.flush();eq(server.rows.get('account-B').payload.values,{});
 assert.equal((await cloud.activate({id:'account-A'})).requiresReload,true);
 doc=documentFor(map);cloud=doc.C.create({client:server.client});assert.equal((await cloud.activate({id:'account-A'})).requiresReload,false);
 eq(JSON.parse(doc.storage.getItem('wort-learned:en')),['en:offline']);
 eq(JSON.parse(server.rows.get('account-A').payload.values['wort-learned:en']),['en:offline']);
 checks++;console.log('PASS offline logout, A/B/anonymous isolation and later recovery');
 // Capture edits that arrive while the RPC is in flight, then flush them as well.
 let release;server.paused=()=>new Promise(resolve=>{release=resolve;});
 doc.storage.setItem('wort-learned',json([1,2,3,9,10]));const flight=cloud.sync();
 while(!release)await new Promise(resolve=>setImmediate(resolve));
 doc.storage.setItem('wort-learned',json([1,2,3,9,10,11]));release();await flight;await cloud.flush();
 assert(JSON.parse(server.rows.get('account-A').payload.values['wort-learned']).includes(11));
 checks++;console.log('PASS changes during an in-flight request are retained and subsequently uploaded');
 cloud.stop();
 // A stale tab's late app writes must never enter the newly activated account's keys.
 const stale=doc;await cloud.activate({id:'account-B'});const fresh=documentFor(map);const freshCloud=fresh.C.create({client:server.client});await freshCloud.activate({id:'account-B'});
 stale.storage.setItem('wort-learned',json([1,2,3,9,10,11,12]));
 assert.equal(fresh.storage.getItem('wort-learned'),null);const aBank=JSON.parse(map.get('wort-cloud-v1:bank:account-A'));assert(JSON.parse(aBank.payload.values['wort-learned']).includes(12));
 freshCloud.stop();checks++;console.log('PASS stale-tab writes are banked under their original account');

 // An anonymous tab open before sign-in belongs to the claimed account afterwards.
 let anon=documentFor(),anonCloud=anon.C.create({client:server.client});
 anon.storage.setItem('wort-learned',json([21]));await anonCloud.activate({id:'account-C'});
 let claimed=documentFor(anon.map),claimedCloud=claimed.C.create({client:server.client});await claimedCloud.activate({id:'account-C'});
 anon.storage.setItem('wort-learned',json([21,22]));
 assert(JSON.parse(JSON.parse(anon.map.get('wort-cloud-v1:bank:account-C')).payload.values['wort-learned']).includes(22));
 await claimedCloud.activate(null);const guest=documentFor(anon.map);const guestCloud=guest.C.create({client:server.client});await guestCloud.activate(null);
 assert.equal(guest.storage.getItem('wort-learned'),null);guestCloud.stop();
 checks++;console.log('PASS late writes from a claimed anonymous tab never repopulate guest progress');

 // Fail before any app-key removal if there is no space to bank the destination.
 const quotaSettings={quota:16000},limited=documentFor(new Map(),quotaSettings);
 limited.storage.setItem('wort-learned',json([31]));limited.storage.setItem('wort-writing-v1:test',json({text:'Current private draft',checked:[]}));
 const limitedCloud=limited.C.create({client:server.client});
 await limitedCloud.activate(null);
 const fill='x'.repeat(6000);limited.storage.setItem('non-progress-cache',fill);quotaSettings.quota=[...limited.map].reduce((sum,[k,v])=>sum+2*(k.length+v.length),0)+32;
 await assert.rejects(limitedCloud.activate({id:'account-D'}),/quota/i);
 eq(JSON.parse(limited.storage.getItem('wort-learned')),[31]);assert.equal(JSON.parse(limited.storage.getItem('wort-writing-v1:test')).text,'Current private draft');assert.equal(limited.storage.getItem('wort-cloud-v1:pending'),null);
 limitedCloud.stop();checks++;console.log('PASS quota failure preserves active progress and never starts a destructive swap');

 const blocked={console,document:{},module:{exports:{}}};blocked.window=blocked;vm.createContext(blocked);vm.runInContext("Object.defineProperty(window,'localStorage',{get(){throw new Error('SecurityError');}})",blocked);assert.doesNotThrow(()=>vm.runInContext(source,blocked));assert.equal(blocked.WORT_CLOUD_BOOT_ERROR,'SecurityError');
 checks++;console.log('PASS blocked localStorage getter cannot crash script evaluation');
}
runtime().then(()=>console.log(`Cloud synchronization checks passed (${checks}).`)).catch(error=>{console.error(error);process.exitCode=1;});
