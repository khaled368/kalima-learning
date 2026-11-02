/* Scenario-based practical language lessons: German, Arabic, English, Dutch.
   Curated translations are aligned to the 35 original Arabic/German sections.
   The same 20 useful words and 15 contextual phrases appear in every selected
   course pair. Navigation remains independent of vocabulary progress. */
(function(global){
 'use strict';
 const library=global.WORT_TOPICS_DATA||[];
 const translations=global.WORT_TOPICS_TRANSLATIONS||{};
 const extras=global.WORT_TOPICS_EXTRA||{};
 const further=global.WORT_TOPICS_MORE||{};
 const course=global.WORT_COURSE||{native:'ar',target:'de',dir:lang=>lang==='ar'?'rtl':'ltr'};
 const native=['ar','en','nl','de'].includes(course.native)?course.native:'ar';
 const target=['ar','en','nl','de'].includes(course.target)?course.target:'de';
 const direction=lang=>lang==='ar'?'rtl':'ltr';
 const locale=native==='ar'?'ar':native==='nl'?'nl-NL':native==='de'?'de-DE':'en';
 const ui={
  ar:{heading:'أقسام الحياة اليومية',home:'العودة للمفردات ←',intro:'اختر الموقف الذي تحتاج إليه، وتعلّم الكلمات والجمل التي تساعدك على التحدث بثقة.',categorySearch:'ابحث عن قسم أو كلمة...',detailSearch:'ابحث بالكلمات أو الجمل...',open:'افتح قسم',words:'الكلمات',phrases:'الجمل',wordTitle:'الكلمات الأساسية',phraseTitle:'جمل تحتاجها',back:'← جميع الأقسام',listen:'استمع',audio:'استمع إلى',wordsCount:'كلمة',phrasesCount:'جملة',summary:'كلمات وجمل مفيدة لهذا الموقف',empty:'لم أجد قسمًا مطابقًا للبحث. جرّب كلمة أخرى.',emptyDetail:'لا توجد كلمات أو جمل مطابقة. جرّب بحثًا آخر.'},
  en:{heading:'Everyday situations',home:'Back to vocabulary ←',intro:'Choose a situation to practise helpful words and sentences.',categorySearch:'Search topics or words...',detailSearch:'Search words or sentences...',open:'Open',words:'Words',phrases:'Sentences',wordTitle:'Useful words',phraseTitle:'Useful sentences',back:'← All topics',listen:'Listen',audio:'Listen to',wordsCount:'words',phrasesCount:'sentences',summary:'Useful words and sentences for this situation',empty:'No matching topic found. Try a different search.',emptyDetail:'No matching words or sentences. Try another search.'},
  nl:{heading:'Dagelijkse situaties',home:'Terug naar woorden ←',intro:'Kies een situatie en oefen nuttige woorden en zinnen.',categorySearch:'Zoek onderwerpen of woorden...',detailSearch:'Zoek woorden of zinnen...',open:'Open',words:'Woorden',phrases:'Zinnen',wordTitle:'Nuttige woorden',phraseTitle:'Nuttige zinnen',back:'← Alle onderwerpen',listen:'Luister',audio:'Luister naar',wordsCount:'woorden',phrasesCount:'zinnen',summary:'Nuttige woorden en zinnen voor deze situatie',empty:'Geen passend onderwerp gevonden. Probeer opnieuw.',emptyDetail:'Geen passende woorden of zinnen gevonden.'},
  de:{heading:'Alltagssituationen',home:'Zurück zu den Vokabeln ←',intro:'Wähle eine Situation und übe nützliche Wörter und Sätze.',categorySearch:'Themen oder Wörter suchen...',detailSearch:'Wörter oder Sätze suchen...',open:'Öffne',words:'Wörter',phrases:'Sätze',wordTitle:'Wichtige Wörter',phraseTitle:'Nützliche Sätze',back:'← Alle Themen',listen:'Anhören',audio:'Anhören:',wordsCount:'Wörter',phrasesCount:'Sätze',summary:'Nützliche Wörter und Sätze für diese Situation',empty:'Kein passendes Thema gefunden. Bitte anders suchen.',emptyDetail:'Keine passenden Wörter oder Sätze gefunden.'}
 }[native];
 const panel=document.getElementById('topics-panel');
 if(!panel||!library.length)return;
 const grid=panel.querySelector('#topics-grid');
 const overview=panel.querySelector('#topics-overview');
 const detail=panel.querySelector('#topics-detail');
 const search=panel.querySelector('#topics-search');
 const detailSearch=panel.querySelector('#topics-detail-search');
 const content=panel.querySelector('#topics-items');
 const caption=panel.querySelector('#topics-detail-caption');
 const title=panel.querySelector('#topics-detail-title');
 let selected=null,view='words';
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=value=>String(value??'').trim().toLocaleLowerCase('de-DE');
 const fmt=value=>Number(value||0).toLocaleString(locale);
 // Keep each original translation tied to the same exact source sentence.
 // A missing translation is an error, never fall back to the wrong language.
 const catalog=library.map(category=>{
  const trans=translations[category.id];
  const added=extras[category.id];
  const more=further[category.id];
  if(!trans||!added||!more)throw new Error('Missing multilingual topic: '+category.id);
  const wordsEn=trans.wEn.split('|'),wordsNl=trans.wNl.split('|');
  const phrasesEn=trans.pEn.split('|'),phrasesNl=trans.pNl.split('|');
  if(wordsEn.length!==category.words.length||wordsNl.length!==category.words.length||
     phrasesEn.length!==category.phrases.length||phrasesNl.length!==category.phrases.length){
   throw new Error('Unaligned multilingual topic: '+category.id);
  }
  function mapped(rows,en,nl,extra){
   const all=rows.map(([de,ar],i)=>({de,ar,en:en[i],nl:nl[i]}));
   for(const row of extra){
    if(row.length!==4)throw new Error('Invalid additional topic entry: '+category.id);
    const [de,ar,english,dutch]=row;
    all.push({de,ar,en:english,nl:dutch});
   }
   if(all.some(entry=>!entry[target]||!entry[native]))throw new Error('Missing lesson translation: '+category.id);
   return all;
  }
  const allWords=mapped(category.words,wordsEn,wordsNl,[...added.w,...more.w]);
  const allPhrases=mapped(category.phrases,phrasesEn,phrasesNl,[...added.p,...more.p]);
  const nativeTitle=native==='ar'?category.title:trans.title[native==='en'?0:native==='nl'?1:2];
  return {
   id:category.id,tone:category.tone,icon:category.icon,
   title:nativeTitle,
   subtitle:native==='ar'?category.subtitle:ui.summary,
   words:allWords.map(x=>[x[target],x[native]]),
   phrases:allPhrases.map(x=>[x[target],x[native]]),
   searchIndex:normalize([category.title,category.subtitle,trans.title.join(' '),
    ...allWords.flatMap(x=>Object.values(x)),...allPhrases.flatMap(x=>Object.values(x))].join(' '))
  };
 });
 // Localize new page controls without changing app-wide navigation.
 panel.dir=direction(native);
 const setText=(selector,value)=>{
  const element=panel.querySelector(selector);if(element)element.textContent=value;
 };
 setText('#topics-page-title',ui.heading);
 setText('.topics-home',ui.home);
 setText('.topics-page-intro',ui.intro);
 setText('#topics-back',ui.back);
 for(const key of ['words','phrases'])setText('[data-topic-filter="'+key+'"]',ui[key]);
 if(search){search.placeholder=ui.categorySearch;search.setAttribute('aria-label',ui.categorySearch);}
 if(detailSearch){detailSearch.placeholder=ui.detailSearch;detailSearch.setAttribute('aria-label',ui.detailSearch);}
 const shortcut=document.getElementById('top-topics-button');
 if(shortcut){shortcut.title=ui.heading;shortcut.setAttribute('aria-label',ui.heading);}
 function renderGrid(){
  const query=normalize(search.value);
  const filtered=catalog.filter(category=>!query||category.searchIndex.includes(query));
  grid.innerHTML=filtered.length?filtered.map(category=>
   '<button class="topics-tile topics-tone-'+safe(category.tone)+'" type="button" data-topic-open="'+safe(category.id)+'" aria-label="'+safe(ui.open+' '+category.title)+'">'+
   '<span class="topics-tile-icon" aria-hidden="true">'+category.icon+'</span>'+
   '<span class="topics-tile-body"><strong>'+safe(category.title)+'</strong><small>'+safe(category.subtitle)+'</small>'+
   '<span class="topics-tile-count">'+fmt(category.words.length)+' '+safe(ui.wordsCount)+' · '+fmt(category.phrases.length)+' '+safe(ui.phrasesCount)+'</span></span>'+
   '<span class="topics-tile-chevron" aria-hidden="true">←</span></button>'
  ).join(''):'<p class="topics-empty">'+safe(ui.empty)+'</p>';
 }
 function renderCollection(category,kind,query){
  const rows=(kind==='words'?category.words:category.phrases).map((pair,index)=>({pair,index})).filter(({pair})=>!query||normalize(pair.join(' ')).includes(query));
  if(!rows.length)return '';
  const label=kind==='words'?ui.wordTitle:ui.phraseTitle;
  return '<section class="topics-collection" aria-label="'+safe(label)+'">'+
    '<div class="topics-collection-heading"><h3>'+safe(label)+'</h3><span>'+fmt(rows.length)+'</span></div>'+
    '<div class="topics-entry-list">'+rows.map(({pair,index})=>
      '<article class="topics-entry"><span class="topics-entry-main">'+
      '<strong lang="'+target+'" dir="'+direction(target)+'">'+safe(pair[0])+'</strong>'+
      '<span lang="'+native+'" dir="'+direction(native)+'">'+safe(pair[1])+'</span></span>'+
      '<button class="topics-audio-button" type="button" data-topic-say="'+kind+':'+index+'" aria-label="'+safe(ui.audio+' '+pair[0])+'">'+
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg>'+
      '<span>'+safe(ui.listen)+'</span></button></article>'
    ).join('')+'</div></section>';
 }
 function renderDetail(){
  if(!selected)return;
  const query=normalize(detailSearch.value);
  const wordHtml=view==='words'?renderCollection(selected,'words',query):'';
  const phraseHtml=view==='phrases'?renderCollection(selected,'phrases',query):'';
  content.innerHTML=wordHtml+phraseHtml||'<p class="topics-empty">'+safe(ui.emptyDetail)+'</p>';
  panel.querySelectorAll('[data-topic-filter]').forEach(button=>{
   const pressed=button.dataset.topicFilter===view;
   button.classList.toggle('active',pressed);
   button.setAttribute('aria-pressed',String(pressed));
  });
 }
 function openCategory(id){
  const item=catalog.find(x=>x.id===id);if(!item)return;
  selected=item;view='words';detailSearch.value='';
  title.textContent=item.icon+' '+item.title;
  caption.textContent=item.subtitle;
  overview.hidden=true;detail.hidden=false;
  renderDetail();
  window.scrollTo({top:0,behavior:'instant'});
  title.setAttribute('tabindex','-1');
  title.focus({preventScroll:true});
 }
 function closeCategory(){
  if(!selected)return;
  selected=null;
  detail.hidden=true;overview.hidden=false;
  // Never re-focus the search input and trigger the phone keyboard.
  search.value='';
  renderGrid();
  window.scrollTo({top:0,behavior:'instant'});
  const heading=panel.querySelector('#topics-page-title');
  if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
 }
 search.addEventListener('input',renderGrid);
 detailSearch.addEventListener('input',renderDetail);
 panel.addEventListener('click',event=>{
  const element=event.target;
  const open=element.closest('[data-topic-open]');
  if(open){openCategory(open.dataset.topicOpen);return;}
  if(element.closest('#topics-back')){closeCategory();return;}
  const filter=element.closest('[data-topic-filter]');
  if(filter&&['words','phrases'].includes(filter.dataset.topicFilter)){view=filter.dataset.topicFilter;renderDetail();return;}
  const audio=element.closest('[data-topic-say]');
  if(audio&&selected){
   const [kind,indexText]=audio.dataset.topicSay.split(':');
   const number=Number(indexText);
   const rows=kind==='words'?selected.words:selected.phrases;
   if((kind!=='words'&&kind!=='phrases')||!Number.isInteger(number)||!rows[number])return;
   document.dispatchEvent(new CustomEvent('wort:speak',{detail:{text:rows[number][0],lang:target,button:audio}}));
  }
 });
 renderGrid();
 global.WORT_TOPICS=Object.freeze({list:library,catalog,open:openCategory});
})(globalThis);
