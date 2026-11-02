/* Kalima practical-topic regression tests. Run: node tests/topics.test.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..','dist');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const loader=fs.readFileSync(path.join(root,'app-bootstrap.js'),'utf8');
const appScript=fs.readFileSync(path.join(root,'app.js'),'utf8');
assert.doesNotMatch(appScript,/toast\(t\("جارٍ تجهيز النطق لأول مرة/,
  'the misleading first-use speech message must not reappear on every audio tap');
assert.match(appScript,/button\.setAttribute\('aria-busy', 'true'\)/,
  'audio button retains accessible loading state while speech prepares');
assert.match(loader,/app\.js\?v=20261102-speech-toast-fix/,
  'the fixed speech module uses a new URL to invalidate older cached scripts');
const css=fs.readFileSync(path.join(root,'topics.css'),'utf8');
function node(){
 const callbacks={};
 return {
  innerHTML:'',textContent:'',value:'',hidden:false,dataset:{},attributes:{},
  classList:{toggle(){},add(){},remove(){}},
  listeners:callbacks,
  addEventListener(name,fn){callbacks[name]=fn;},
  setAttribute(name,value){this.attributes[name]=value;},
  focus(){this.focused=true;}
 };
}
const elements=Object.fromEntries([
 '#topics-grid','#topics-overview','#topics-detail','#topics-search',
 '#topics-page-title','#topics-detail-search','#topics-items','#topics-detail-caption',
 '#topics-detail-title','#topics-back'
].map(x=>[x,node()]));
const filters=['words','phrases'].map(view=>{
 const button=node();button.dataset.topicFilter=view;return button;
});
const panel=node();
panel.querySelector=selector=>elements[selector]||null;
panel.querySelectorAll=selector=>selector==='[data-topic-filter]'?filters:[];
const heard=[];
const document={
 getElementById:id=>id==='topics-panel'?panel:null,
 dispatchEvent:event=>heard.push(event)
};
const context={
 document,window:{scrollTo(){}},
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}
};
vm.createContext(context);
for(const file of ['topics-data.js','topics-additional-a.js','topics-additional-b.js','topics-language-pack.js','topics-more-manual-a.js','topics-more-manual-b.js','topics-more-related.js','topics.js']){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 vm.runInContext(src,context,{filename:file});
}
const categories=context.WORT_TOPICS_DATA;
assert.equal(categories.length,35,'sixteen original and nineteen newly selected practical-life categories');
const expanded=context.WORT_TOPICS.catalog;
assert.equal(expanded.length,35,'all 35 categories are available in the multilingual dashboard');
assert.equal(expanded.reduce((sum,cat)=>sum+cat.words.length,0),1225,'each category contains 35 practical words');
assert.equal(expanded.reduce((sum,cat)=>sum+cat.phrases.length,0),700,'each category contains 20 contextual sentences');
for(const category of expanded){
 assert.equal(category.words.length,35,category.id+' expanded words');
 assert.equal(category.phrases.length,20,category.id+' expanded sentences');
 assert.ok(category.words.every(pair=>pair.length===2&&pair[0]&&pair[1]),category.id+' bilingual words');
 assert.ok(category.phrases.every(pair=>pair.length===2&&pair[0]&&pair[1]),category.id+' bilingual sentences');
}
const expected=['hospital','train','bus','kindergarten','school','supermarket','everyday','work','ams','pharmacy','housing','car','bank','phone','restaurant','worksite','post','interview','language-courses','dentist','emergency','police','ogk','finanzamt','residence','clothes','airport','taxi','family','neighbors','furniture','heating','gym','barber','weather'];
assert.deepEqual(Array.from(categories,x=>x.id),expected,'original category order preserved; added sections follow');
assert.equal(categories.reduce((sum,c)=>sum+c.words.length,0),420,'420 practical bilingual words');
assert.equal(categories.reduce((sum,c)=>sum+c.phrases.length,0),350,'350 practical bilingual contextual phrases');
for(const cat of categories){
 assert.equal(cat.words.length,12,cat.id+' must have 12 words');
 assert.equal(cat.phrases.length,10,cat.id+' must have 10 contextual phrases');
 for(const [kind,rows] of [['word',cat.words],['phrase',cat.phrases]]){
  assert.equal(new Set(Array.from(rows,pair=>pair[0])).size,rows.length,'no duplicate German '+kind+' in '+cat.id);
  for(const pair of rows){
   assert.equal(pair.length,2,'complete bilingual entry: '+cat.id);
   assert.ok(pair[0].trim()&&pair[1].trim(),'nonempty German and Arabic in '+cat.id);
   assert.ok(/[\u0600-\u06ff]/u.test(pair[1]),'Arabic translation in '+cat.id);
  }
 }
}
assert.doesNotMatch(html,/data-topic-filter="all"/,'All filter is removed from the UI');
assert.match(html,/data-topic-filter="words" aria-pressed="true" class="active"/,'Words tab starts selected');
assert.match(html,/data-topic-filter="phrases" aria-pressed="false"/,'Sentences tab remains available');
assert.match(css,/\.topics-filters\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'two equally sized filter buttons');
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="hospital"/,'hospital button rendered');
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="everyday"/,'life section rendered');
for(const id of expected.slice(7)) assert.match(elements['#topics-grid'].innerHTML,new RegExp('data-topic-open="'+id+'"'),'new '+id+' section rendered');
assert.match(html,/<button[^>]+id="top-saved-button"[\s\S]*?<\/button><button[^>]+id="top-topics-button"/,'topics shortcut immediately beside saved star');
assert.match(html,/<section id="topics-panel" class="panel" hidden/,'new panel is integrated with existing showPanel logic');
assert.match(html,/<button[^>]+id="top-topics-button"[^>]+data-panel="topics"/,'header category button uses native panel navigation');
assert.match(html,/topics\.css\?v=/,'new mobile and dark-mode stylesheet linked');
assert.doesNotMatch(html,/ألماني مع ترجمة عربية · اضغط «استمع» لسماع النطق/,'redundant topic language note removed');
assert.ok(loader.indexOf('topics-data.js')>=0&&loader.indexOf('topics.js')>loader.indexOf('topics-data.js'),'data loads before topics feature');
assert.ok(loader.indexOf('app.js')>loader.indexOf('topics.js'),'category shortcut is mounted before app attaches click listeners');
assert.match(css,/html\[data-theme='dark'\] #topics-panel/,'dark theme provided');
assert.match(css,/@media\(max-width:390px\)/,'small phone adjustments provided');
assert.match(css,/#topics-panel \.topics-grid\s*\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,
  'topic grid must have exactly five columns');
assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?#topics-panel \.topics-grid\s*\{\s*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,
  'mobile grid also uses five columns');
assert.match(css,/#topics-panel \.topics-tile\{[^}]*flex-direction:column;/,
  'icons stack above topic names for narrow phone cards');
assert.equal(categories.length/5,7,'35 topics occupy seven full rows of five');

function tap(selector,object){
 panel.listeners.click({target:{closest:test=>test===selector?object:null}});
}
tap('[data-topic-open]',{dataset:{topicOpen:'hospital'}});
assert.equal(elements['#topics-overview'].hidden,true,'opening a topic hides main grid');
assert.equal(elements['#topics-detail'].hidden,false,'opening a topic shows detail');
assert.match(elements['#topics-items'].innerHTML,/das Krankenhaus/,'hospital words are rendered by default');
assert.doesNotMatch(elements['#topics-items'].innerHTML,/data-topic-say="phrases:/,'sentences are hidden until selected');
tap('[data-topic-filter]',filters[1]);
assert.doesNotMatch(elements['#topics-items'].innerHTML,/data-topic-say="words:/,'phrase tab hides word entry controls');
assert.match(elements['#topics-items'].innerHTML,/data-topic-say="phrases:/,'phrase tab retains sentence entry controls');
assert.match(elements['#topics-items'].innerHTML,/Ich brauche einen Arzt/,'phrase tab shows contextual phrases');
const phraseButton={dataset:{topicSay:'phrases:0'}};
tap('[data-topic-say]',phraseButton);
assert.equal(heard.length,1,'audio dispatch fired once');
assert.equal(heard[0].type,'wort:speak','existing Kalima speech event is reused');
assert.equal(heard[0].detail.lang,'de','German pronunciation explicitly requested');
assert.equal(heard[0].detail.text,'Ich brauche einen Arzt.','correct phrase pronounced');
elements['#topics-detail-search'].value='Penicillin';
elements['#topics-detail-search'].listeners.input();
assert.match(elements['#topics-items'].innerHTML,/Penicillin/,'Arabic/German detail search works');
assert.doesNotMatch(elements['#topics-items'].innerHTML,/Ich brauche einen Arzt/,'detail search removes unrelated entries');
tap('#topics-back',{});
assert.equal(elements['#topics-overview'].hidden,false,'back returns to categories');
assert.equal(elements['#topics-detail'].hidden,true,'back closes details without affecting main app');
assert.equal(elements['#topics-page-title'].focused,true,'back focuses the category heading, not the search field');
assert.equal(elements['#topics-search'].focused||false,false,'back must not open search/keyboard');
assert.equal(elements['#topics-search'].value,'','back clears previous category search');
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="hospital"/,'back shows all categories');
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="weather"/,'back shows all categories, including last item');
elements['#topics-search'].value='Kindergarten';
elements['#topics-search'].listeners.input();
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="kindergarten"/,'category search finds nursery');
assert.doesNotMatch(elements['#topics-grid'].innerHTML,/data-topic-open="train"/,'category search filters other locations');
elements['#topics-search'].value='';
elements['#topics-search'].listeners.input();
for(const id of expected.slice(7)){
 tap('[data-topic-open]',{dataset:{topicOpen:id}});
 const category=categories.find(cat=>cat.id===id);
 assert.equal(elements['#topics-overview'].hidden,true,'opening '+id+' works');
 for(const [view,entries] of [['words',category.words],['phrases',category.phrases]]){
  tap('[data-topic-filter]',filters[view==='words'?0:1]);
  const source=elements['#topics-items'].innerHTML;
  for(const [german,arabic] of entries){
   assert.ok(source.includes(german.replace(/&/g,'&amp;')),'entry in '+id+': '+german);
   assert.ok(source.includes(arabic),'Arabic translation in '+id+': '+german);
  }
 }
 tap('#topics-back',{});
}
tap('[data-topic-open]',{dataset:{topicOpen:'bank'}});
elements['#topics-detail-search'].value='خصم';
elements['#topics-detail-search'].listeners.input();
assert.match(elements['#topics-items'].innerHTML,/Abbuchung/,'new bank section Arabic search matches');
tap('#topics-back',{});
elements['#topics-search'].value='Werkstatt';
elements['#topics-search'].listeners.input();
assert.match(elements['#topics-grid'].innerHTML,/data-topic-open="car"/,'category search uses new car vocabulary');
// Verify every new section has a specific contextual expression, not a generic template.
const spotChecks={
  post:'Ich möchte dieses Paket verschicken.',
  interview:'Wie hoch ist das Bruttogehalt?',
  'language-courses':'Ich möchte mich für einen Deutschkurs anmelden.',
  dentist:'Ich habe seit gestern Zahnschmerzen.',
  emergency:'Rufen Sie bitte die Rettung!',
  police:'Ich möchte einen Diebstahl melden.',
  ogk:'Bin ich derzeit versichert?',
  finanzamt:'Ich habe einen Steuerbescheid bekommen.',
  residence:'Mein Dokument läuft bald ab.',
  clothes:'Kann ich das anprobieren?',
  airport:'Wo ist die Sicherheitskontrolle?',
  taxi:'Wie viel kostet die Fahrt ungefähr?',
  family:'Gibt es hier einen Wickelraum?',
  neighbors:'Haben Sie zufällig mein Paket angenommen?',
  furniture:'Ist die Lieferung im Preis enthalten?',
  heating:'Die Heizung wird nicht warm.',
  gym:'Gibt es Kurse für Anfänger?',
  barber:'Wie viel kostet ein Haarschnitt?',
  weather:'Morgen soll es regnen.'
};
for(const [id,phrase] of Object.entries(spotChecks)){
 const category=categories.find(x=>x.id===id);
 assert.ok(category,'new category '+id+' exists');
 assert.ok(category.phrases.some(x=>x[0]===phrase),'relevant scenario sentence for '+id);
}
assert.match(loader,/topics-additional-a\.js\?v=/,'first new topic data bundle loaded');
assert.match(loader,/topics-additional-b\.js\?v=/,'second new topic data bundle loaded');
assert.ok(loader.indexOf('topics-language-pack.js')>loader.indexOf('topics-additional-b.js') &&
 loader.indexOf('topics-language-pack.js')<loader.indexOf('topics.js'),'expanded translations loaded before topic UI');
assert.ok(loader.indexOf('topics-data.js')<loader.indexOf('topics-additional-a.js') &&
 loader.indexOf('topics-additional-a.js')<loader.indexOf('topics-additional-b.js') &&
 loader.indexOf('topics-additional-b.js')<loader.indexOf('topics.js'),'new topics loaded before UI initialization');
tap('#topics-back',{});
elements['#topics-search'].value='';
elements['#topics-search'].listeners.input();
tap('[data-topic-open]',{dataset:{topicOpen:'post'}});
const audioButton={dataset:{topicSay:'words:1'}};
tap('[data-topic-say]',audioButton);
assert.equal(heard.at(-1).detail.text,'das Paket','German speech for new post vocabulary works');
tap('#topics-back',{});
console.log('PASS: 35 practical sections, 1,925 aligned vocabulary and sentence entries, original navigation, search, filters, light/dark CSS and German audio.');
