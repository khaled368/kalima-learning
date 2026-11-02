/* Safari/WebKit requires SpeechSynthesis.speak() before the click gesture ends.
 * Run: node tests/browser-audio.test.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const audio=fs.readFileSync(path.join(__dirname,'..','dist','audio.js'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','dist','app-bootstrap.js'),'utf8');
assert.match(loader,/audio\.js\?v=20261102-safari-gesture-fix/,
  'new version must bypass cached browser audio code');
let inGesture=false;
let voices=[];
let spoken=[];
let cancellations=0;
let events=[];
class SpeechSynthesisUtterance {
 constructor(text){this.text=text;}
}
const synthesizer={
 paused:false,
 getVoices(){return voices;},
 cancel(){cancellations++;},
 resume(){},
 speak(utterance){
  assert.equal(inGesture,true,'WebKit speech must be requested in the original click stack');
  spoken.push(utterance);
 }
};
const sandbox={
 WORT_COURSE:{native:'ar',target:'de'},
 SpeechSynthesisUtterance,
 speechSynthesis:synthesizer,
 document:{addEventListener(){}},
 navigator:{},
 dispatchEvent(event){events.push(event.detail);},
 CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},
 setTimeout,clearTimeout,setInterval,clearInterval
};
vm.runInNewContext(audio,sandbox,{filename:'audio.js'});
async function speakFromClick(value){
 inGesture=true;
 const task=sandbox.WORT_AUDIO.speak(value,{lang:'de'});
 inGesture=false;
 assert.equal(spoken.length>0,true,'speech has started synchronously');
 const utterance=spoken.at(-1);
 utterance.onstart?.();
 utterance.onend?.();
 assert.equal(await task,true);
 return utterance;
}
(async()=>{
 const first=await speakFromClick('das Krankenhaus');
 assert.equal(first.lang,'de-DE','locale works while getVoices is empty');
 assert.equal(first.voice,undefined,'browser chooses its native voice if list is loading');
 assert.equal(spoken.length,1,'no duplicate speaking after voices load');
 assert.equal(events.at(-1).state,'finished');
 const preferred={lang:'de-DE',name:'Natural German',default:true};
 voices=[{lang:'en-US',name:'English'},preferred];
 const second=await speakFromClick('der Arbeitsvertrag');
 assert.equal(second.voice,preferred,'preferred matching installed voice is still selected');
 assert.equal(spoken.length,2);
 assert.ok(cancellations>=2,'new audio request still cancels the previous speech');
 console.log('PASS: Safari speech starts synchronously within click, even with no voices loaded; locale and audio events retained.');
})().catch(error=>{console.error(error);process.exitCode=1;});
