'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../dist/level-up-engine.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
assert.match(html,/id="previous-shield"/);
const fields={};
for(const id of ['#score-number','#progress-fill','#progress-track','#shield','#previous-shield','#score-hint','#rank-name','#rank-subtitle'])
 fields[id]={style:{},textContent:'',setAttribute(){}};
let now=0,raf=null;
const classes=new Set();
const variables={};
const host={
 querySelector(id){return id==='.particles'?{childElementCount:1}:fields[id]||null;},
 classList:{add(c){classes.add(c);},remove(c){classes.delete(c);}},
 style:{setProperty(k,v){variables[k]=v;}}
};
const env={
 document:{querySelector(){return host;}},performance:{now(){return now;}},
 navigator:{vibrate(){}},cancelAnimationFrame(){},
 requestAnimationFrame(callback){raf=callback;return 1;}
};
env.globalThis=env;
vm.runInNewContext(js,env);
const LevelUp=env.KalimaLevelUp.LevelUpCelebration;
const runFrame=seconds=>{now=seconds*1000;assert.ok(raf,'frame exists');const next=raf;raf=null;next();};
async function run(){
 const animator=new LevelUp(host,{soundEnabled:false});
 animator._prepareAudio=async()=>null;
 animator._scheduleAudio=()=>{animator.audioEnd=animator.duration+animator.transitionSeconds+7;};
 await animator.play(1);
 assert.equal(animator.transitionSeconds,.82,'new ranks should evolve from the previous shield');
 assert.match(fields['#previous-shield'].style.backgroundPosition,/^0% 0$/,'silver previous shield is bronze');
 runFrame(3.8);
 assert.equal(fields['#previous-shield'].style.opacity,'0');
 assert.equal(fields['#shield'].style.opacity,'0');
 assert.ok(!classes.has('is-evolving')&&!classes.has('is-revealed'));
 runFrame(4.32);
 assert.ok(classes.has('is-evolving'),'old shield enters after 100%');
 assert.ok(Number(fields['#previous-shield'].style.opacity)>.6,'the previous shield is actually visible');
 assert.equal(fields['#shield'].style.opacity,'0','new shield must not appear yet');
 runFrame(4.6);
 assert.equal(fields['#shield'].style.opacity,'0');
 runFrame(5.05);
 assert.ok(classes.has('is-revealed'),'new shield unlocks after cinematic evolution');
 assert.ok(Number(fields['#shield'].style.opacity)>.2,'new shield becomes visible');
 assert.ok(Number(fields['#previous-shield'].style.opacity)<.01,'old shield fades away');
 assert.equal(variables['--evolution'],'1');
 animator.destroy();
 // The first rank has no previous real shield.
 const first=new LevelUp(host,{soundEnabled:false});
 first._prepareAudio=async()=>null;
 first._scheduleAudio=()=>{first.audioEnd=first.duration+8;};
 now=0;
 await first.play(0);
 assert.equal(first.transitionSeconds,0);
 runFrame(4.2);
 assert.ok(classes.has('is-revealed'),'the initial bronze shield reveals without a non-existent predecessor');
 first.destroy();
 // Verify actual spectral onsets rather than a fake timer pulse.
 const spectrum=new LevelUp(host,{soundEnabled:false});
 spectrum.ctx={sampleRate:48000};
 const bins=new Uint8Array(1024);
 spectrum.analyser={fftSize:2048,getByteFrequencyData(out){out.set(bins);}};
 spectrum.samples=new Uint8Array(1024);
 const baseline=spectrum._bassLevel();
 assert.equal(baseline.level,0);assert.equal(baseline.hit,0);
 for(let i=2;i<=12;i++)bins[i]=170;
 const kick=spectrum._bassLevel();
 assert.ok(kick.level>.5&&kick.hit>.5,'45–300 Hz kick must trigger');
 assert.ok(spectrum._bassLevel().hit<.2,'steady bass must not create fake repeated beats');
 console.log('PASS: full progress -> old shield -> gold evolution -> new shield, with true audio bass onset.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
