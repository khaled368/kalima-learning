/* Practical-life language sections.
   These sections explicitly teach German with Arabic translations regardless
   of the active curriculum pair. They never mutate saved vocabulary progress. */
(function(global){
 'use strict';
 const library=global.WORT_TOPICS_DATA||[];
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
 let selected=null,view='all';
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=value=>String(value??'').trim().toLocaleLowerCase('de-DE');
 const fmt=value=>Number(value||0).toLocaleString('ar');
 function renderGrid(){
  const query=normalize(search.value);
  const filtered=library.filter(category=>{
   if(!query)return true;
   const searchable=[category.title,category.subtitle,...category.words.flat(),...category.phrases.flat()].join(' ');
   return normalize(searchable).includes(query);
  });
  grid.innerHTML=filtered.length?filtered.map(category=>
   '<button class="topics-tile topics-tone-'+safe(category.tone)+'" type="button" data-topic-open="'+safe(category.id)+'" aria-label="افتح قسم '+safe(category.title)+'">'+
   '<span class="topics-tile-icon" aria-hidden="true">'+category.icon+'</span>'+
   '<span class="topics-tile-body"><strong>'+safe(category.title)+'</strong><small>'+safe(category.subtitle)+'</small>'+
   '<span class="topics-tile-count">'+fmt(category.words.length)+' كلمة · '+fmt(category.phrases.length)+' جمل</span></span>'+
   '<span class="topics-tile-chevron" aria-hidden="true">←</span></button>'
  ).join(''):'<p class="topics-empty">لم أجد قسمًا مطابقًا للبحث. جرّب كلمة أخرى.</p>';
 }
 function renderCollection(category,kind,query){
  const rows=(kind==='words'?category.words:category.phrases).map((pair,index)=>({pair,index})).filter(({pair})=>!query||normalize(pair.join(' ')).includes(query));
  if(!rows.length)return '';
  const label=kind==='words'?'الكلمات الأساسية':'جمل تحتاجها';
  return '<section class="topics-collection" aria-label="'+label+'">'+
    '<div class="topics-collection-heading"><h3>'+label+'</h3><span>'+fmt(rows.length)+'</span></div>'+
    '<div class="topics-entry-list">'+rows.map(({pair,index})=>
      '<article class="topics-entry"><span class="topics-entry-main">'+
      '<strong lang="de" dir="ltr">'+safe(pair[0])+'</strong>'+
      '<span lang="ar" dir="rtl">'+safe(pair[1])+'</span></span>'+
      '<button class="topics-audio-button" type="button" data-topic-say="'+kind+':'+index+'" aria-label="استمع بالألمانية إلى '+safe(pair[0])+'">'+
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg>'+
      '<span>استمع</span></button></article>'
    ).join('')+'</div></section>';
 }
 function renderDetail(){
  if(!selected)return;
  const query=normalize(detailSearch.value);
  const wordHtml=(view==='phrases')?'':renderCollection(selected,'words',query);
  const phraseHtml=(view==='words')?'':renderCollection(selected,'phrases',query);
  content.innerHTML=wordHtml+phraseHtml||'<p class="topics-empty">لا توجد كلمات أو جمل مطابقة. جرّب بحثًا آخر.</p>';
  panel.querySelectorAll('[data-topic-filter]').forEach(button=>{
   const pressed=button.dataset.topicFilter===view;
   button.classList.toggle('active',pressed);
   button.setAttribute('aria-pressed',String(pressed));
  });
 }
 function openCategory(id){
  const item=library.find(x=>x.id===id);
  if(!item)return;
  selected=item;view='all';detailSearch.value='';
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
  // Return to ALL sections, not the search input (which opens the
  // on-screen keyboard and makes the user think they entered search).
  search.value='';
  renderGrid();
  window.scrollTo({top:0,behavior:'instant'});
  const heading=panel.querySelector('#topics-page-title');
  if(heading){
   heading.setAttribute('tabindex','-1');
   heading.focus({preventScroll:true});
  }
 }
 search.addEventListener('input',renderGrid);
 detailSearch.addEventListener('input',renderDetail);
 panel.addEventListener('click',event=>{
  const element=event.target;
  const open=element.closest('[data-topic-open]');
  if(open){openCategory(open.dataset.topicOpen);return;}
  if(element.closest('#topics-back')){closeCategory();return;}
  const filter=element.closest('[data-topic-filter]');
  if(filter){view=filter.dataset.topicFilter;renderDetail();return;}
  const audio=element.closest('[data-topic-say]');
  if(audio&&selected){
   const [kind,indexText]=audio.dataset.topicSay.split(':');
   const number=Number(indexText);
   const rows=kind==='words'?selected.words:selected.phrases;
   if((kind!=='words'&&kind!=='phrases')||!Number.isInteger(number)||!rows[number])return;
   document.dispatchEvent(new CustomEvent('wort:speak',{detail:{text:rows[number][0],lang:'de',button:audio}}));
  }
 });
 renderGrid();
 global.WORT_TOPICS=Object.freeze({list:library,open:openCategory});
})(globalThis);
