/* Complete the 35-word/20-sentence practical library with carefully
   selected contextual entries shared from other relevant lesson topics.
   Original rows and their hand-written translations are never modified.
   Each referenced row keeps exactly the same German/Arabic/English/Dutch text. */
(function(global){
 'use strict';
 const more=global.WORT_TOPICS_MORE=global.WORT_TOPICS_MORE||{};
 const rules=global.WORT_TOPICS_RELATED_RULES||{};
 const base=global.WORT_TOPICS_DATA||[];
 const translated=global.WORT_TOPICS_TRANSLATIONS||{};
 const expanded=global.WORT_TOPICS_EXTRA||{};
 const sources={};
 for(const cat of base){
  const tr=translated[cat.id],ex=expanded[cat.id];
  if(!tr||!ex)throw new Error('Missing lesson source: '+cat.id);
  const enW=tr.wEn.split('|'),nlW=tr.wNl.split('|'),
        enP=tr.pEn.split('|'),nlP=tr.pNl.split('|');
  const pair=(rows,en,nl)=>rows.map(([de,ar],i)=>[de,ar,en[i],nl[i]]);
  sources[cat.id]={
   w:[...pair(cat.words,enW,nlW),...ex.w],
   p:[...pair(cat.phrases,enP,nlP),...ex.p]
  };
 }
 function indices(spec){
  const result=[];
  for(const part of String(spec).split(',')){
   const range=part.match(/^(\d+)-(\d+)$/);
   if(range){
    const first=Number(range[1]),last=Number(range[2]);
    if(last<first||last>99)throw new Error('Invalid index range '+part);
    for(let i=first;i<=last;i++)result.push(i);
   }else if(/^\d+$/.test(part))result.push(Number(part));
   else throw new Error('Invalid index '+part);
  }
  return result;
 }
 function select(topic,kind,plan){
  const existing=sources[topic][kind];
  const used=Array.from({length:4},(_,lang)=>new Set(existing.map(row=>row[lang]?.toLocaleLowerCase('de-DE'))));
  const result=[];
  for(const [donor,spec] of plan){
   const options=sources[donor]?.[kind];
   if(!options)throw new Error('Unknown referenced topic '+donor);
   for(const index of indices(spec)){
    const row=options[index];
    if(!row||row.length!==4||row.some(value=>!value?.trim())){
     throw new Error('Invalid '+kind+' source '+donor+':'+index);
    }
    if(row.some((value,i)=>used[i].has(value.toLocaleLowerCase('de-DE'))))continue;
    result.push(row);
    row.forEach((value,i)=>used[i].add(value.toLocaleLowerCase('de-DE')));
    if(result.length===(kind==='w'?15:5))return result;
   }
  }
  throw new Error('Too few relevant '+kind+' for '+topic+': '+result.length);
 }
 for(const cat of base){
  if(more[cat.id])continue;
  const plan=rules[cat.id];
  if(!plan)throw new Error('Missing curated reference plan for '+cat.id);
  more[cat.id]={w:select(cat.id,'w',plan.w),p:select(cat.id,'p',plan.p)};
 }
 global.WORT_TOPICS_MORE=Object.freeze(more);
})(globalThis);
