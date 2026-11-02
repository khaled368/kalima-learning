/* Regression test of 35 expanded categories in all 12 directed language pairs.
   Run: node tests/topics-multilingual.test.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..','dist');
const files=['topics-data.js','topics-additional-a.js','topics-additional-b.js','topics-language-pack.js','topics-more-manual-a.js','topics-more-manual-b.js','topics-more-related.js','topics.js'];
const sources=files.map(f=>fs.readFileSync(path.join(root,f),'utf8'));
const expectedLanguages=['ar','de','en','nl'];
const sample={de:'das Krankenhaus',ar:'المستشفى',en:'the hospital',nl:'het ziekenhuis'};
let checked=0,spoken=0;
function run(target,native){
 function node(){
  const listeners={};
  return {
   value:'',innerHTML:'',textContent:'',hidden:false,focused:false,attributes:{},listeners,
   classList:{toggle(){}},
   setAttribute(k,v){this.attributes[k]=v;},
   addEventListener(k,fn){listeners[k]=fn;},
   focus(){this.focused=true;}
  };
 }
 const elements=Object.fromEntries(['#topics-grid','#topics-overview','#topics-detail','#topics-search',
 '#topics-page-title','#topics-detail-search','#topics-items','#topics-detail-caption',
 '#topics-detail-title','#topics-back','.topics-page-intro','.topics-home'].map(k=>[k,node()]));
 const tabs=['words','phrases'].map(view=>{const element=node();element.dataset={topicFilter:view};elements['[data-topic-filter="'+view+'"]']=element;return element;});
 const panel=node();
 panel.querySelector=s=>elements[s]||null;
 panel.querySelectorAll=s=>s==='[data-topic-filter]'?tabs:[];
 const header=node(),events=[];
 const document={
  getElementById:id=>id==='topics-panel'?panel:id==='top-topics-button'?header:null,
  dispatchEvent:e=>events.push(e)
 };
 const ctx={document,WORT_COURSE:{target,native},window:{scrollTo(){}},
  CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail;}}};
 vm.createContext(ctx);
 for(let i=0;i<files.length;i++)vm.runInContext(sources[i],ctx,{filename:files[i]});
 const categories=ctx.WORT_TOPICS.catalog;
 assert.equal(categories.length,35,'complete catalog: '+native+' -> '+target);
 assert.equal(new Set(categories.map(x=>x.id)).size,35,'unique category IDs');
 for(const category of categories){
  assert.equal(category.words.length,35,category.id+' word count');
  assert.equal(category.phrases.length,20,category.id+' sentence count');
  assert.equal(new Set(category.words.map(x=>x[0])).size,35,'distinct words in '+category.id);
  assert.equal(new Set(category.phrases.map(x=>x[0])).size,20,'distinct sentences in '+category.id);
  for(const rows of [category.words,category.phrases])for(const [first,second] of rows){
   assert.ok(typeof first==='string'&&first.trim(),'missing target-language translation: '+category.id);
   assert.ok(typeof second==='string'&&second.trim(),'missing native-language translation: '+category.id);
  }
 }
 const hospital=categories.find(x=>x.id==='hospital');
 assert.equal(hospital.words[0][0],sample[target],'correct target text in '+target);
 assert.equal(hospital.words[0][1],sample[native],'correct explanation in '+native);
 const source=ctx.WORT_TOPICS.list.find(x=>x.id==='hospital');
 assert.deepEqual(Array.from(source.words[0]),['das Krankenhaus','المستشفى'],'original source stays intact');
 function tap(type,data){
  panel.listeners.click({target:{closest(selector){return selector===type?data:null;}}});
 }
 assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="hospital"/);
 tap('[data-topic-open]',{dataset:{topicOpen:'hospital'}});
 assert.equal(elements['#topics-overview'].hidden,true,'opens category');
 const firstText=elements['#topics-items'].innerHTML;
 assert.ok(firstText.includes(sample[target]),'target is visible in word list');
 assert.ok(firstText.includes(sample[native]),'native translation is visible in word list');
 assert.doesNotMatch(firstText,/data-topic-say="phrases:/,'only words show by default');
 assert.ok(firstText.includes('lang="'+target+'"'),'target language tagged');
 assert.ok(firstText.includes('lang="'+native+'"'),'native language tagged');
 tap('[data-topic-say]',{dataset:{topicSay:'words:0'}});
 assert.equal(events.length,1,'speech invoked');
 assert.equal(events[0].detail.lang,target,'speech locale is the TARGET language');
 assert.equal(events[0].detail.text,sample[target],'speech uses the TARGET word');
 const spokenPhrase=hospital.phrases[0][0];
 tap('[data-topic-filter]',tabs[1]);
 assert.match(elements['#topics-items'].innerHTML,/data-topic-say="phrases:/,'sentences render in their tab');
 tap('[data-topic-say]',{dataset:{topicSay:'phrases:0'}});
 assert.equal(events[1].detail.text,spokenPhrase,'speech uses target-language sentence');
 assert.doesNotMatch(elements['#topics-items'].innerHTML,new RegExp('data-topic-say="words:'),'sentence filter');
 elements['#topics-detail-search'].value=spokenPhrase;
 elements['#topics-detail-search'].listeners.input();
 assert.ok(elements['#topics-items'].innerHTML.includes(spokenPhrase.replace(/&/g,'&amp;')),'target phrase search works');
 tap('#topics-back',{});
 assert.equal(elements['#topics-overview'].hidden,false,'back restores grid');
 assert.equal(elements['#topics-detail'].hidden,true,'back hides details');
 assert.equal(elements['#topics-search'].focused,false,'back does not open keyboard');
 assert.equal(elements['#topics-search'].value,'','back clears search');
 assert.equal(elements['#topics-page-title'].focused,true,'back focuses heading, not search');
 assert.equal(panel.dir,native==='ar'?'rtl':'ltr','section direction follows native language');
 checked+=categories.reduce((sum,c)=>sum+c.words.length+c.phrases.length,0);
 spoken+=2;
}
for(const native of expectedLanguages)for(const target of expectedLanguages){
 if(native!==target)run(target,native);
}
assert.equal(checked,23100,'1,925 entries in each of 12 language pairs');
assert.equal(spoken,24,'word and sentence speech checked in each pair');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'app-bootstrap.js'),'utf8');
assert.match(bootstrap,/topics-language-pack\.js\?v=/,'full multilingual lesson data loads before UI');
assert.ok(bootstrap.indexOf('topics-language-pack.js')<bootstrap.indexOf('topics.js'));
assert.match(html,/id="top-topics-button"/,'category entry shortcut still exists');
assert.match(html,/topics\.css\?v=/,'light/dark responsive styles retained');
assert.doesNotMatch(html,/ألماني مع ترجمة عربية · اضغط «استمع» لسماع النطق/,'redundant intro remains removed');
assert.doesNotMatch(html,/data-topic-filter="all"/,'third All filter removed');
assert.match(html,/data-topic-filter="words" aria-pressed="true" class="active"/,'word tab selected by default');
assert.match(html,/data-topic-filter="phrases"/,'sentences tab retained');
console.log('PASS: 35 sections × (35 words + 20 contextual sentences) × 12 language pairs = '+checked+' translated displays; speech in each target language; return without search focus.');
