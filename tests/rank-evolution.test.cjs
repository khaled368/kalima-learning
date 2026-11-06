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
const shards=Array.from({length:8},()=>({style:{},querySelector(){return create();}}));
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
 assert.equal(fields['#previous-shield'].style.opacity,'0','old shield is not visible before it has been assembled');
 assert.equal(fields['#previous-shield'].style.backgroundPosition,'0% 0');
 assert.equal(fields['#shield'].style.opacity,'0','silver stays hidden during assembly');
 assert.ok(host.classList.contains('is-assembling'),'progress builds the old shield before it breaks');
 assert.equal(shards.filter(s=>Number(s.style.opacity)===1).length,0,'none assembled at 0%');
 runFrame(.15);
 assert.equal(shards.filter(s=>Number(s.style.opacity)===1).length,1,'first fragment snaps into place as bar fills');
 assert.ok(Number(shards[1].style.opacity)>0 && Number(shards[1].style.opacity)<1,'next shard is travelling into position');
 runFrame(.55);
 assert.equal(shards.filter(s=>Number(s.style.opacity)===1).length,4,'halfway progress has assembled half the shield');
 assert.ok(!host.classList.contains('is-ripping'));
 assert.equal(fields['#shield'].style.opacity,'0');
 runFrame(1.01);
 assert.ok(host.classList.contains('is-ripping'),'old badge cracks at 100%');
 assert.ok(!host.classList.contains('is-assembling'),'building mode ends at full bar');
 assert.ok(shards.every(s=>s.style.opacity===''&&s.style.transform===''),'shatter keyframes take over cleanly');
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
 // The first third of celebration music is removed, not the bar's progress sound.
 const playEvents=[];
 const mockSources=[];
 const soundEngine=new LevelUp(host,{soundEnabled:false,progressSeconds:4,celebrationStartFraction:1/3});
 soundEngine.ctx={
   currentTime:10,destination:{},
   createBufferSource(){
     const source={connect(){},start(when,offset){playEvents.push({when,offset});},stop(){}};
     mockSources.push(source);return source;
   },
   createGain(){return{gain:{value:0},connect(){}};}
 };
 soundEngine._scheduleAudio({progress:{duration:4},celebration:{duration:9}});
 assert.equal(playEvents.length,2);
 assert.equal(playEvents[0].offset,0,'progress sound starts untrimmed');
 assert.equal(playEvents[1].offset,3,'part one of three-part celebration audio is skipped');
 assert.equal(playEvents[1].when,14.44,'celebration plays as the new shield emerges');
 assert.ok(Math.abs(soundEngine.audioEnd-10.36)<.001,'timeline ends after remaining two sections');
 soundEngine.destroy();
 console.log('PASS: old shield assembles with XP, shatters only at 100%, new shield stays still; part one of music is skipped.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
