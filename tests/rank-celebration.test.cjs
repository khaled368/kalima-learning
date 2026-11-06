'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'../dist');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const source=read('rank-celebration.js'),engine=read('level-up-engine.js');
const html=read('index.html'),css=read('rank-celebration.css'),app=read('app.js'),bootstrap=read('app-bootstrap.js');
new vm.Script(source);new vm.Script(engine);
assert.match(html,/id="rank-celebration-dialog"/);
for(const id of ['shield','score-number','progress-fill','progress-track','score-hint','rank-name','rank-subtitle'])assert.ok(html.includes('id="'+id+'"'));
assert.match(html,/data-rank-sound/);assert.match(html,/data-rank-close/);assert.match(html,/id="rank-preview"/);
assert.match(app,/WORT_RANK_CELEBRATION\?\.onLearn\(previousTotal, learned\.size, manifest\?\.shields\)/);
assert.match(app,/'#rank-preview'\)\.onclick/);
assert.match(css,/is-revealed/);assert.match(css,/kalima-shields\.png/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.ok(bootstrap.indexOf('level-up-engine.js')<bootstrap.indexOf('rank-celebration.js'));
assert.ok(bootstrap.indexOf('rank-celebration.js')<bootstrap.indexOf('app.js'));
assert.match(engine,/requestAnimationFrame/);assert.match(engine,/navigator\?\.vibrate/);
assert.match(engine,/if\(p>=1\)/);assert.match(engine,/classList\.add\('is-revealed'\)/);
assert.match(engine,/setSoundEnabled/);
assert.match(engine,/KalimaHaptics\?\.pulse/);
assert.match(engine,/this\.previousShield\.style\.opacity='0'/,'old shield is built from fragments, not shown fully');
assert.match(engine,/classList\.add\('is-assembling'\)/,'old shield assembles with the XP bar');
assert.match(engine,/this\._assemble\(p\)/,'pieces follow current progress');
assert.match(engine,/this\._assemble\(1\)/,'all pieces fully assembled before tearing');
assert.match(engine,/celebrationStartFraction/,'first music section is skipped');
assert.match(engine,/classList\.add\('is-evolving','is-ripping'\)/,'tear at completed bar');
assert.match(engine,/since>=this\.revealDelay/,'new shield emerges during tear');
assert.match(engine,/now\+this\.duration\+this\.revealDelay/,'victory audio synchronized');
assert.match(html,/id="previous-shield"/);
assert.match(html,/id="shield-fragments"/);
assert.equal((html.match(/class="shield-shard"/g)||[]).length,8);
assert.match(css,/kalima-shield-shatter/);
assert.match(css,/kalima-shield-crack/);
assert.doesNotMatch(engine,/beatPulse|_bassLevel|this\.bass|--beat/,'no bass-reactive pulsing');

assert.match(source,/level-up-progress\.mp3/);assert.match(source,/level-up-celebration\.mp3/);
const androidManifest=fs.readFileSync(path.join(__dirname,'../android/app/src/main/AndroidManifest.xml'),'utf8');
const native=fs.readFileSync(path.join(__dirname,'../android/app/src/main/java/com/kalima/learning/MainActivity.java'),'utf8');
assert.match(androidManifest,/android\.permission\.VIBRATE/);
assert.match(native,/class RankHapticsBridge/);
assert.match(native,/new RankHapticsBridge\(\)/);
const memory=new Map();
let opened=0,played=[],destroyed=0;
function node(){
 return {textContent:'',title:'',attributes:{},style:{},addEventListener(type,fn){this['on'+type]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){}};
}
const selectors=['[data-rank-close]','[data-rank-sound]','[data-rank-heading]','[data-rank-label]'];
const parts=Object.fromEntries(selectors.map(x=>[x,node()]));
const dlg={
 open:false,classList:{add(){},remove(){}},
 querySelector(q){return parts[q]||null;},
 addEventListener(type,handler){this['on'+type]=handler;},
 showModal(){this.open=true;opened++;},
 close(){this.open=false;this.onclose?.();}
};
class FakeEngine{
 constructor(root,opts){this.root=root;this.opts=opts;}
 play(index){played.push({index,opts:this.opts});return Promise.resolve();}
 setSoundEnabled(v){this.opts.soundEnabled=v;}
 destroy(){destroyed++;}
}
const environment={
 WORT_COURSE:{native:'ar',key:x=>x},
 KalimaLevelUp:{LevelUpCelebration:FakeEngine,DEFAULT_RANKS:Array.from({length:10},(_,i)=>({name:'shield'+i,threshold:100*(i+1)}))},
 document:{getElementById(id){return id==='rank-celebration-dialog'?dlg:null;},activeElement:null},
 localStorage:{getItem(k){return memory.get(k)||null;},setItem(k,v){memory.set(k,v);}},
 setTimeout(){return 1;},clearTimeout(){}
};
environment.globalThis=environment;
vm.runInNewContext(source,environment);
const ceremony=environment.WORT_RANK_CELEBRATION;
const shields=[{name:'برونزي',threshold:100},{name:'فضي',threshold:250},{name:'ذهبي',threshold:500}];
assert.equal(ceremony.onLearn(98,99,shields),null);
assert.equal(ceremony.onLearn(99,100,shields).name,'برونزي');
assert.equal(opened,1);assert.equal(played[0].index,0);
assert.equal(played[0].opts.ranks[0].name,'برونزي');
assert.equal(played[0].opts.soundEnabled,true);
assert.equal(played[0].opts.progressSeconds,4.15);
assert.equal(ceremony.onLearn(99,100,shields),null,'no duplicate reward');
assert.equal(ceremony.onLearn(249,250,shields).name,'فضي');
assert.equal(played[1].index,1);
assert.equal(JSON.stringify(ceremony.seen),JSON.stringify([100,250]));
parts['[data-rank-sound]'].onclick();
assert.equal(ceremony.soundOn,false);
assert.equal(memory.get('wort-rank-sound-enabled'),'false');
assert.equal(ceremony.onLearn(499,500,shields).name,'ذهبي');
assert.equal(played[2].opts.soundEnabled,false);
assert.equal(ceremony.onLearn(500,499,shields),null);
const before=JSON.stringify(ceremony.seen),count=opened;
assert.equal(ceremony.preview({...shields[0],index:0}),true);
assert.equal(opened,count+1);
assert.equal(parts['[data-rank-heading]'].textContent,'معاينة الاحتفال');
assert.equal(JSON.stringify(ceremony.seen),before,'preview never grants rank');
assert.ok(destroyed>=2,'previous animation disposed on new opening');

console.log('PASS: rank-up is connected to genuine learning, original shields, audio, and shatter preview.');
