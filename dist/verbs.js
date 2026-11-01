/* German verb paradigms compiled from LanguageTool/RosaeNLG and Wiktionary principal parts.
 * Linguistic data: CC BY-SA 4.0; extraction/helper code Apache-2.0. See Sources and licences.
 */
(function(global){
 'use strict';
 let data=null,pending=null;
 const normalize=value=>String(value||'').normalize('NFC').toLocaleLowerCase().trim();
 const pronouns=['ich','du','er/sie/es','wir','ihr','sie/Sie'];
 const reflexives=['mich','dich','sich','uns','euch','sich'];
 async function load(){
  if(data)return data;
  if(!pending)pending=fetch('data/verbs.json').then(response=>{if(!response.ok)throw new Error('تعذّر تحميل تصريفات الأفعال.');return response.json();}).then(value=>{data=value;return value;}).catch(error=>{pending=null;throw error;});
  return pending;
 }
 function lookup(word){
  if(!data||!word)return null;
  if(typeof word==='object'&&word.pos&&word.pos!=='verb')return null;
  const text=typeof word==='string'?word:word.german;
  const name=normalize(text),reflexive=name.startsWith('sich '),bare=name.replace(/^sich\s+/,'');
  const id=typeof word==='object'?String(word.id):null;
  const key=(id&&data.byId[id])||data.aliases[name]||data.aliases[bare]||(data.verbs[bare]?bare:null);
  const original=key&&data.verbs[key];if(!original)return null;
  const record={...original,pronouns:original.pronouns||pronouns,notes:[...(original.notes||[])]};
  record.displayForm=text;record.reflexive=reflexive;
  if(reflexive){
   record.reflexivePronouns=reflexives;
   record.infinitive='sich '+original.infinitive;
   for(const tense of ['present','preterite'])record[tense]=original[tense].map((form,index)=>{
    const suffix=record.separablePrefix?' '+record.separablePrefix:'';
    if(suffix&&form.endsWith(suffix))return form.slice(0,-suffix.length)+' '+reflexives[index]+suffix;
    return form+' '+reflexives[index];
   });
   record.perfect=original.perfect.map((form,index)=>{const [auxiliary,...rest]=form.split(' ');return auxiliary+' '+reflexives[index]+' '+rest.join(' ');});
  }
  if(bare!==normalize(original.infinitive)){
   record.formOf=original.infinitive;
   record.notes.unshift('الكلمة المعروضة صيغة من الفعل '+original.infinitive+'؛ يعرض الجدول تصريف الفعل الأصلي.');
  }
  return record;
 }
 global.WORT_VERBS={load,lookup,get coverage(){return data?.coverage||null;}};
})(globalThis);
