'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../dist/level-up-engine.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../dist/rank-celebration.css'),'utf8');
new vm.Script(js);
assert.match(html,/id="shield-fragments"/);
assert.equal((html.match(/class="shield-shard"/g)||[]).length,8);
assert.match(css,/kalima-shield-shatter/);
assert.doesNotMatch(js,/beatPulse|_bassLevel|this\.bass/);
const makeClasses=()=>({
 set:new Set(),
 add(...items){items.forEach(item=>this.set.add(item));},
 remove(...items){items.forEach(item=>this.set.delete(item));},
 toggle(item,on){if(on)this.set.add(item);else this.set.delete(item);},
 contains(item){return this.set.has(item);}
});
const create=()=>({style:{},textContent:'',classList:makeClasses(),setAttribute(){}});
const fields={};
for(const id of ['#score-number','#progress-fill','#progress-track','#shield','#previous-shield','#shield-fragments','#score-hint','#rank-name','#rank-subtitle'])fields[id]=create();
const shards=Array.from({length:8},()=>({querySelector(){return create();}}));
let now=0,raf=null,vibrations=0,done=0;
const vars={};
const host={
 querySelector(id){return id==='.particles'?{childElementCount:1}:fields[id]||null;},
 querySelectorAll(s){return s==='.shield-shard'?shards:[];},
 classList:makeClasses(),
 style:{setProperty(k,v){vars[k]=v;}}
};
const env={
 document:{querySelector(){return host;}},
 performance:{now(){return now;}},
 navigator:{vibrate(){vibrations++;}},
 cancelAnimationFrame(){},
 requestAnimationFrame(callback){raf=callback;return 1;},
 matchMedia(){return {matches:false};}
};
env.globalThis=env;
vm.runInNewContext(js,env);
const LevelUp=env.KalimaLevelUp.LevelUpCelebration;
const runFrame=seconds=>{
 now=seconds*1000;
 assert.ok(raf,'next animation frame must exist');
 const next=raf;raf=null;next();
};
async function run(){
 const animator=new LevelUp(host,{soundEnabled:false,progressSeconds:1,onFinish(){done++;}});
 await animator.play(1);
 assert.equal(fields['#previous-shield'].style.opacity,'1','bronze visible while bar fills');
 assert.equal(fields['#previous-shield'].style.backgroundPosition,'0% 0');
 assert.equal(fields['#shield'].style.opacity,'0','silver hidden while bar fills');
 runFrame(.55);
 assert.ok(!host.classList.contains('is-ripping'));
 assert.equal(fields['#shield'].style.opacity,'0');
 runFrame(1.01);
 assert.ok(host.classList.contains('is-ripping'),'old badge cracks at 100%');
 assert.equal(fields['#previous-shield'].style.opacity,'0','real old rank gives way to shards');
 assert.equal(fields['#shield'].style.opacity,'0','new badge still inside during first crack');
 runFrame(1.25);
 assert.equal(fields['#shield'].style.opacity,'0');
 runFrame(1.85);
 assert.ok(host.classList.contains('is-revealed'));
 assert.ok(Number(fields['#shield'].style.opacity)>.65,'new rank emerges through fragments');
 assert.equal(vibrations,1,'single automatic haptic upon new shield reveal');
 runFrame(2.6);
 assert.equal(fields['#shield'].style.transform,'scale(1.0000)','new shield settles without pulse');
 runFrame(3.5);
 assert.equal(fields['#shield'].style.transform,'scale(1.0000)','no follow-on bass bouncing');
 runFrame(animator.audioEnd+1);
 assert.equal(done,1,'animation finishes after its scheduled celebration audio');
 now=0;
 await animator.play(0);
 assert.ok(fields['#previous-shield'].classList.contains('is-starter'),'first rank has a neutral shield to split');
 assert.ok(fields['#shield-fragments'].classList.contains('is-starter'));
 animator.destroy();
 console.log('PASS: original rank splits into eight pieces at 100%, new shield emerges and stays still.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
