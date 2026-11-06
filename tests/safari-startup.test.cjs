/* Safari startup should not block on a stalled account session or stale assets. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','dist');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const code=read('app-bootstrap.js');
const account=read('account.js');
const curriculum=read('content.js');
const html=read('index.html');
assert.match(code,/Promise\.race\(/,'account session has a fallback');
assert.match(code,/setTimeout\(resolve,\s*8000\)/,'account timeout is bounded');
assert.match(code,/url\.searchParams\.set\('kalimaBuild', SCRIPT_BUILD\)/,'all dynamic scripts receive fresh version');
assert.match(account,/state\.error=errorText\(error\);render\(\);[\s\S]*?finishReady\(\)/,'auth startup error resolves app readiness');
assert.match(account,/state\.error=t\('تعذّر تجهيز بيانات الحساب\. حاول مجددًا\.'\);render\(\);[\s\S]*?finishReady\(\)/,'cloud startup error resolves app readiness');
assert.match(curriculum,/fetch\(path,\{cache:"no-cache"\}\)/,'Safari revalidates lesson data');
assert.match(html,/app-bootstrap\.js\?v=[a-z0-9-]+/,'Safari gets a versioned bootstrap script');
assert.match(html,/account\.js\?v=20261102-safari-resilience/,'Safari gets fresh account module');
async function runStalledAccount(){
 const scripts=[];
 let classes=['kalima-booting'],timerId=0;
 const status={textContent:'',setAttribute(){}};
 const main={setAttribute(name,value){this[name]=value;}};
 const retry={hidden:true,addEventListener(){}};
 const boot={remove(){this.removed=true;}};
 const message={textContent:''};
 const nodes={'#app-status':status,'#main-content':main,
  '#kalima-boot-retry':retry,'#kalima-boot-screen':boot,'#kalima-boot-message':message};
 const document={
  querySelector(query){return nodes[query]||null;},
  documentElement:{classList:{remove(name){classes=classes.filter(x=>x!==name);},add(name){classes.push(name);}}},
  createElement(tag){assert.equal(tag,'script');return{};},
  body:{append(node){
    scripts.push(node.src);
    queueMicrotask(()=>node.onload?.());
  }}
 };
 const global={
  document,location:{href:'https://khaled368.github.io/kalima-learning/?check=1',reload(){}},
  WORT_COURSE:{native:'ar'},
  WORT_ACCOUNT:{ready:new Promise(()=>{})},
  setTimeout(fn,time){if(time===8000)queueMicrotask(fn);return ++timerId;},
  clearTimeout(){},URL,Promise
 };
 global.window=global;
 vm.runInNewContext(code,global,{filename:'app-bootstrap.js'});
 await Promise.race([global.WORT_APP_READY,new Promise((_,reject)=>setTimeout(()=>reject(new Error('boot hung')),1200))]);
 assert.ok(!classes.includes('kalima-booting'),'incomplete 0 / 0 UI must not linger');
 assert.ok(classes.includes('kalima-boot-finished'),'boot must finish');
 assert.equal(main['aria-busy'],'false');
 assert.ok(scripts.length>25,'complete course modules loaded');
 const buildVersion=code.match(/const SCRIPT_BUILD = '([^']+)'/)[1];
 assert.ok(scripts.every(src=>src.includes('kalimaBuild='+buildVersion)),
   'every module is versioned with the current bootstrap build');
 assert.ok(scripts.some(src=>src.includes('review-mistakes.js')),
   'current missed-word module retained');
}
runStalledAccount().then(()=>console.log('PASS: Safari startup works despite unresolved account, and all modules avoid old caches.'))
 .catch(error=>{console.error(error);process.exitCode=1;});
