/* Per-target-language list of incorrectly reviewed words. */
(function(global){
 'use strict';
 const key=global.WORT_COURSE.key('wort-review-mistakes-v1');
 global.WORT_I18N?.add({
  en:{'كلمات تحتاج مراجعة':'Words to revisit','أخطأت في هذه الكلمات. ستبقى هنا حتى تجيب عنها إجابة صحيحة في مراجعة لاحقة.':'You missed these words. They remain until you answer correctly in a later review.','راجع الكلمات الصعبة ↻':'Review missed words ↻','جارٍ تحميل الكلمات الصعبة…':'Loading missed words…','تعذّر تحميل الكلمات الصعبة.':'Could not load missed words.','لا توجد كلمات صعبة لمراجعتها.':'No missed words to review.'},
  de:{'كلمات تحتاج مراجعة':'Wörter zum Wiederholen','أخطأت في هذه الكلمات. ستبقى هنا حتى تجيب عنها إجابة صحيحة في مراجعة لاحقة.':'Du hast diese Wörter falsch beantwortet. Sie bleiben bis zu einer späteren richtigen Antwort.','راجع الكلمات الصعبة ↻':'Fehlerwörter üben ↻','جارٍ تحميل الكلمات الصعبة…':'Fehlerwörter werden geladen…','تعذّر تحميل الكلمات الصعبة.':'Fehlerwörter konnten nicht geladen werden.','لا توجد كلمات صعبة لمراجعتها.':'Keine Fehlerwörter zum Üben.'},
  nl:{'كلمات تحتاج مراجعة':'Woorden om te herhalen','أخطأت في هذه الكلمات. ستبقى هنا حتى تجيب عنها إجابة صحيحة في مراجعة لاحقة.':'Je had deze woorden fout. Ze blijven tot een later goed antwoord.','راجع الكلمات الصعبة ↻':'Foute woorden oefenen ↻','جارٍ تحميل الكلمات الصعبة…':'Foute woorden laden…','تعذّر تحميل الكلمات الصعبة.':'Kon foute woorden niet laden.','لا توجد كلمات صعبة لمراجعتها.':'Geen foute woorden om te oefenen.'}
 });
 const valid=id=>(typeof id==='string'&&id.length>0&&id.length<160)||
   (typeof id==='number'&&Number.isSafeInteger(id));
 function read(){
  try{
   const parsed=JSON.parse(global.localStorage?.getItem(key)||'[]');
   if(!Array.isArray(parsed))return new Map();
   const data=new Map();
   for(const id of parsed)if(valid(id))data.set(String(id),id);
   return data;
  }catch{return new Map();}
 }
 let items=read();
 function update(id,shouldHave){
  if(!valid(id))return false;
  const k=String(id),previous=items.has(k);
  if(previous===shouldHave)return false;
  if(shouldHave)items.set(k,id);else items.delete(k);
  try{global.localStorage?.setItem(key,JSON.stringify([...items.values()]));}catch{}
  return true;
 }
 global.WORT_REVIEW_MISTAKES=Object.freeze({
  key,has(id){return items.has(String(id));},
  all(){return [...items.values()];},
  record(id,correct){return update(id,!correct);},
  forget(id){return update(id,false);},
  reload(){items=read();return [...items.values()];}
 });
})(globalThis);
