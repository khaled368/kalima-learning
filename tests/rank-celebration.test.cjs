'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'../dist');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const source=read('rank-celebration.js');
const html=read('index.html'),css=read('rank-celebration.css');
const app=read('app.js'),bootstrap=read('app-bootstrap.js');
new vm.Script(source);
assert.match(html,/id="rank-celebration-dialog"/,'celebration overlay exists');
assert.match(html,/data-rank-sound/,'sound toggle exists');
assert.match(html,/id="rank-preview"/,'on-demand preview button exists');
assert.match(app,/'#rank-preview'\)\.onclick/,'preview button is wired to the learner's active course');
assert.match(html,/data-rank-close/,'continue button exists');
assert.match(html,/rank-celebration\.css\?v=/,'animated overlay stylesheet is loaded');
assert.match(css,/prefers-reduced-motion:reduce/,'reduced motion is respected');
assert.match(css,/kalima-shields\.png/,'uses real earned shield artwork');
assert.match(bootstrap,/rank-celebration\.js\?v=/,'module is loaded before application');
assert.ok(bootstrap.indexOf('rank-celebration.js')<bootstrap.indexOf('app.js'));
assert.match(app,/WORT_RANK_CELEBRATION\?\.onLearn\(previousTotal, learned\.size, manifest\?\.shields\)/);
const memory=new Map();
let sounds=0,opened=0,closed=0;
function node(){
 return {
  textContent:'',title:'',attributes:{},style:{setProperty(){}},
  children:[],get childElementCount(){return this.children.length;},
  appendChild(v){this.children.push(v);},
  addEventListener(type,fn){this['on'+type]=fn;},
  setAttribute(key,val){this.attributes[key]=val;},
  focus(){}
 };
}
const keys=['.rank-particles','[data-rank-close]','[data-rank-sound]','[data-rank-heading]',
 '[data-rank-label]','[data-rank-name]','[data-rank-count]','.rank-shield'];
const parts=Object.fromEntries(keys.map(x=>[x,node()]));
const dlg={
 open:false,attributes:{},
 classList:{add(){},remove(){}},
 querySelector(q){return parts[q];},
 addEventListener(type,handler){this['on'+type]=handler;},
 showModal(){this.open=true;opened++;},
 close(){this.open=false;closed++;this.onclose?.();}
};
class AudioContextMock{
 state='running';currentTime=0;
 constructor(){this.destination={};}
 createOscillator(){return{
  frequency:{setValueAtTime(){}},connect(){},start(){sounds++;},stop(){},
  type:'sine'
 };}
 createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
}
const environment={
 WORT_COURSE:{native:'ar',key:x=>x},
 document:{getElementById(id){return id==='rank-celebration-dialog'?dlg:null;},createElement(){return node();},activeElement:null},
 localStorage:{getItem(k){return memory.get(k)||null;},setItem(k,v){memory.set(k,v);}},
 matchMedia(){return{matches:false}},
 AudioContext:AudioContextMock,
 setTimeout(){return 1;},clearTimeout(){},
};
environment.globalThis=environment;
vm.runInNewContext(source,environment);
const ceremony=environment.WORT_RANK_CELEBRATION;
const shields=[{name:'برونزي',threshold:100},{name:'فضي',threshold:250},{name:'ذهبي',threshold:500}];
assert.equal(ceremony.onLearn(98,99,shields),null,'no false rank-up below threshold');
const first=ceremony.onLearn(99,100,shields);
assert.equal(first.name,'برونزي');
assert.equal(parts['[data-rank-name]'].textContent,'برونزي');
assert.equal(parts['.rank-shield'].style.backgroundPosition,'0% 0');
assert.equal(opened,1,'overlay shown once');
assert.equal(sounds,6,'short original 6-tone fanfare starts on the learner click');
assert.equal(parts['.rank-particles'].childElementCount,16);
assert.equal(ceremony.onLearn(99,100,shields),null,'no repeat for same shield');
assert.equal(ceremony.onLearn(100,101,shields),null);
const second=ceremony.onLearn(249,250,shields);
assert.equal(second.name,'فضي');
assert.equal(opened,2);
assert.deepEqual(JSON.parse(memory.get('wort-rank-celebrations-v1')),[100,250]);
assert.equal(ceremony.onLearn(250,249,shields),null,'unlearning never triggers a rank');
parts['[data-rank-sound]'].onclick();
assert.equal(ceremony.soundOn,false,'user can mute future fanfares');
assert.equal(memory.get('wort-rank-sound-enabled'),'false');
const third=ceremony.onLearn(499,500,shields);
assert.equal(third.name,'ذهبي');
assert.equal(sounds,12,'muted rank-up never plays music');
assert.equal(opened,3);
assert.equal(parts['[data-rank-name]'].textContent,'ذهبي');
const beforePreview=opened, seenBefore=JSON.stringify(ceremony.seen);
assert.equal(ceremony.preview({...shields[0],index:0}),true);
assert.equal(opened,beforePreview+1,'preview opens without learning new words');
assert.equal(parts['[data-rank-heading]'].textContent,'معاينة الاحتفال');
assert.equal(JSON.stringify(ceremony.seen),seenBefore,'preview never unlocks or re-awards a shield');
console.log('PASS: rank-up overlays use actual shields, original fanfare, one-time milestones, and sound control.');
