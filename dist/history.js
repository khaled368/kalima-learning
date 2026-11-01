/* First-learning history. Legacy undated totals remain undated rather than invented. */
(function(global){
 'use strict';
 const KEY='wort-learning-history-v1',LEVELS=['A1','A2','B1','B2','C1'];
 let state=null,known=new Map(),persistent=true;
 const idKey=id=>String(id);
 function dayKey(value=new Date()){const date=value instanceof Date?value:new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
 function validDay(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;}
 function levelFor(id){if(typeof id==='number'&&id>=0&&id<90)return LEVELS[Math.floor(id/18)];const code=String(id).split(':')[0];return LEVELS.includes(code)?code:null;}
 function read(){try{return JSON.parse(localStorage.getItem(KEY));}catch{return null;}}
 function normalize(input,today){const model={version:1,startedAt:validDay(input?.startedAt)?input.startedAt:today,events:[],undatedIds:[]};const map=new Map();
  for(const event of Array.isArray(input?.events)?input.events:[]){if(!event||!['string','number'].includes(typeof event.id)||!validDay(event.day))continue;const level=LEVELS.includes(event.level)?event.level:levelFor(event.id);if(!level)continue;const key=idKey(event.id),old=map.get(key);if(!old||event.day<old.day)map.set(key,{id:event.id,day:event.day,level,...(typeof event.at==='string'?{at:event.at}:{})});}
  model.events=[...map.values()];return model;
 }
 function save(){if(!state)return;try{localStorage.setItem(KEY,JSON.stringify(state));persistent=true;}catch{persistent=false;}}
 function reconcile(){const dated=new Set();state.events=state.events.filter(event=>known.has(idKey(event.id))).map(event=>{dated.add(idKey(event.id));return {...event,id:known.get(idKey(event.id))};});state.events.sort((a,b)=>a.day.localeCompare(b.day)||idKey(a.id).localeCompare(idKey(b.id)));state.undatedIds=[...known].filter(([key])=>!dated.has(key)).map(([,id])=>id);}
 function mergeStored(){const external=read();if(!external)return;const clean=normalize(external,dayKey());state=normalize({startedAt:clean.startedAt<state.startedAt?clean.startedAt:state.startedAt,events:[...state.events,...clean.events]},dayKey());}
 function init(ids,legacyToday={},now=new Date()){known=new Map((Array.isArray(ids)?ids:[]).map(id=>[idKey(id),id]));const today=dayKey(now);state=normalize(read(),today);
  if(validDay(legacyToday?.day)&&Array.isArray(legacyToday.ids))for(const id of legacyToday.ids){const key=idKey(id);if(!known.has(key)||state.events.some(event=>idKey(event.id)===key))continue;const level=levelFor(known.get(key));if(level)state.events.push({id:known.get(key),day:legacyToday.day,level});}
  reconcile();save();return snapshot();
 }
 function sync(ids){if(!state)return init(ids);known=new Map((Array.isArray(ids)?ids:[]).map(id=>[idKey(id),id]));const before=JSON.stringify(state);mergeStored();reconcile();if(JSON.stringify(state)!==before)save();return snapshot();}
 function record(word,now=new Date()){if(!state)init([]);const id=typeof word==='object'?word.id:word,level=typeof word==='object'&&LEVELS.includes(word.level)?word.level:levelFor(id);if(!level)return snapshot();const alreadyKnown=known.has(idKey(id));mergeStored();known.set(idKey(id),id);if(alreadyKnown&&!state.events.some(event=>idKey(event.id)===idKey(id))){reconcile();save();return snapshot();}
  if(!state.events.some(event=>idKey(event.id)===idKey(id)))state.events.push({id,level,day:dayKey(now),at:(now instanceof Date?now:new Date(now)).toISOString()});
  reconcile();save();return snapshot();
 }
 function snapshot(){if(!state)return null;return {version:1,startedAt:state.startedAt,events:state.events.map(event=>({...event})),undatedIds:[...state.undatedIds],persistent};}
 global.WORT_HISTORY=Object.freeze({init,sync,record,snapshot,dayKey,levelFor,validDay,key:KEY});
})(globalThis);
