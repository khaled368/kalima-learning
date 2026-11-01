'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SPEAKER_ICON='<svg class="reference-speaker" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
function wordArtwork(word){return ({Tisch:'🪑',Schule:'🏫',Buch:'📖',Haus:'🏠',Apfel:'🍎',Brot:'🍞',Wasser:'💧',Kaffee:'☕',lernen:'🏃',Zug:'🚆',Katze:'🐈',Hund:'🐕'})[word.german]||(word.pos==='verb'?'↗':'◈');}
const articleHtml = article => `<span class="article" data-article="${esc(String(article).toLocaleLowerCase())}">${esc(article)}</span>`;
const LEVELS = [
 {code:'A1',name:'مبتدئ',description:'الأساسيات والتواصل في الحياة اليومية'},
 {code:'A2',name:'أساسي',description:'توسيع مفردات المواقف اليومية والعمل والسفر'},
 {code:'B1',name:'متوسط',description:'التجارب والآراء والتعبير عن الأفكار'},
 {code:'B2',name:'فوق المتوسط',description:'نقاشات أوسع ولغة أكثر تفصيلًا'},
 {code:'C1',name:'متقدّم',description:'مفردات دقيقة للتحليل والنقاش المتقدّم'}
];
const POS = {noun:'اسم',verb:'فعل',adjective:'صفة',adverb:'ظرف',pronoun:'ضمير',preposition:'حرف جر',conjunction:'حرف ربط',interjection:'تعجّب',other:'كلمة'};
const cache = new Map();
const wordMap = new Map();
let manifest = null, activeLevel = 'A1', panel = 'library', pageSize = 24, currentWord = null, wordTab = 'meaning';
let badgesReturnPanel = 'library';
let calendarView=null;
const DAILY_GOAL=20;
let session = null, toastTimer, loadRequest = 0;
let wordAdvanceTimer=null,wordAdvanceVersion=0;
const WORD_ADVANCE_DELAY=650;
const safeRead = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const storedSet = key => { const value=safeRead(key,[]); return new Set(Array.isArray(value)?value.filter(id=>typeof id==='number'||typeof id==='string').map(id=>typeof id==='string'&&/^\d+$/.test(id)&&Number(id)<90?Number(id):id):[]); };
const saved=storedSet('wort-saved'), learned=storedSet('wort-learned');
const day = WORT_HISTORY.dayKey();
const oldToday=safeRead('wort-today',{});
const today={day,ids:oldToday?.day===day&&Array.isArray(oldToday.ids)?[...new Set(oldToday.ids)]:[]};
WORT_HISTORY.init([...learned],oldToday);
let storageAvailable=true;
let analyticsView=null,assessmentView=null,audioRequest=0,audioButton=null;
let verbDataReady=false,verbLoading=null,verbTense='present';
let cardView=safeRead('wort-card-view','compact');
if(!['compact','grid'].includes(cardView))cardView='compact';
const totalWords=()=>manifest?.levels.reduce((n,l)=>n+l.count,0)||0;
function idLevel(id) { return typeof id==='number' && id>=0 && id<90 ? LEVELS[Math.floor(id/18)].code : String(id).split(':')[0]; }
function countLearned(code) { return [...learned].filter(id=>idLevel(id)===code).length; }
function refreshToday(){const current=WORT_HISTORY.dayKey();today.day=current;today.ids=(WORT_HISTORY.snapshot()?.events||[]).filter(event=>event.day===current).map(event=>event.id);}
function remember() {
 for(const id of storedSet('wort-learned'))learned.add(id);
 WORT_HISTORY.sync([...learned]);refreshToday();
 try { localStorage.setItem('wort-saved',JSON.stringify([...saved]));localStorage.setItem('wort-learned',JSON.stringify([...learned]));localStorage.setItem('wort-today',JSON.stringify(today)); }
 catch { if(storageAvailable)toast('التخزين غير متاح. سيبقى تقدّمك في هذه الجلسة فقط.');storageAvailable=false; }
 updateProgress();
}
function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3200); }
function status(text) { $('#app-status').textContent=text; }
async function loadLevel(code) {
 if(cache.has(code))return cache.get(code);
 const response=await fetch(`data/${code}.json`);
 if(!response.ok)throw new Error('تعذّر تحميل مفردات المستوى. تحقّق من الاتصال وحاول مرة أخرى.');
 const list=await response.json();
 if(!Array.isArray(list))throw new Error('تعذّر قراءة بيانات المفردات.');
 cache.set(code,list);list.forEach(word=>wordMap.set(word.id,word));return list;
}
function buildLevels() {
 $('#level-tabs').innerHTML=LEVELS.map(level=>`<button class="level-tab ${level.code===activeLevel?'active':''}" data-level="${level.code}" aria-pressed="${level.code===activeLevel}"><strong dir="ltr">${level.code}</strong><small>${level.name}</small></button>`).join('');
 $('#training-level').innerHTML=LEVELS.map(level=>`<option value="${level.code}">${level.code} · ${level.name}</option>`).join('');
}
function updateProgress() {
 refreshToday();
 const total=totalWords(),done=Math.min(total,learned.size),percent=total?done/total*100:0;
 $('#overall-count').textContent=`${done.toLocaleString('ar')} / ${total.toLocaleString('ar')}`;
 $('#overall-percent').textContent=`${percent.toLocaleString('ar',{maximumFractionDigits:1})}٪`;
 $('#overall-bar').style.width=`${percent}%`;$('#overall-bar').parentElement.setAttribute('aria-valuenow',percent.toFixed(1));
 const levelCount=manifest?.levels.find(level=>level.code===activeLevel)?.count||0;
 const levelDone=Math.min(levelCount,countLearned(activeLevel));
 $('#level-learned').textContent=`${levelDone} من ${levelCount} كلمة تعلّمتها`;
 $('#level-bar').style.width=`${levelCount?levelDone/levelCount*100:0}%`;
 $('#level-bar').parentElement.setAttribute('aria-valuenow',String(levelCount?Math.round(levelDone/levelCount*100):0));
 $('#daily-goal-count').textContent=`${today.ids.length.toLocaleString('ar')} / ${DAILY_GOAL.toLocaleString('ar')}`;$('#daily-goal-status').textContent=today.ids.length>=DAILY_GOAL?'اكتمل الهدف · واصل بكلمة جديدة':'افتح كلمة جديدة وابدأ التعلّم';$('#daily-goal-button').classList.toggle('is-complete',today.ids.length>=DAILY_GOAL);
 $('#stats-learned').textContent=done.toLocaleString('ar');$('#stats-today').textContent=today.ids.length.toLocaleString('ar');$('#stats-saved').textContent=saved.size.toLocaleString('ar');updateOwnedShield();if(panel==='badges')renderBadges();
 updateReviewAvailability();
 if(panel==='progress')renderProgress();
}
async function selectLevel(code) {
 activeLevel=code;pageSize=24;const request=++loadRequest;
 document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('active',b.dataset.level===code);b.setAttribute('aria-pressed',String(b.dataset.level===code));});
 const level=LEVELS.find(level=>level.code===code);
 $('#level-title').textContent=`${code} · ${level.name}`;$('#level-caption').textContent='قسم المستوى';$('#level-description').textContent=level.description;
 $('#level-count').textContent=`${manifest?.levels.find(l=>l.code===code)?.count||0} كلمة`;
 $('#training-level').value=code;$('#search').value='';$('#pos-filter').value='all';
 $('#cards').innerHTML='<p class="empty">جارٍ تحميل البطاقات…</p>';$('#load-more').hidden=true;status('');updateProgress();
 try { await loadLevel(code);if(request!==loadRequest)return;renderCards(); }
 catch(error){if(request!==loadRequest)return;$('#cards').innerHTML='<div class="empty">تعذّر تحميل الكلمات. <button class="secondary" id="retry-level">حاول مرة أخرى</button></div>';$('#retry-level').onclick=()=>selectLevel(code);status(error.message);}
}
async function startDailyGoal(){
 const button=$('#daily-goal-button'),code=activeLevel;
 button.disabled=true;button.setAttribute('aria-busy','true');
 try{
  const words=await loadLevel(code);if(panel!=='library'||activeLevel!==code)return;
  const word=words.find(word=>!learned.has(word.id));
  if(!word){toast('أكملت كلمات هذا المستوى. اختر مستوى آخر أو راجع ما تعلّمته.');return;}
  pageSize=24;$('#search').value='';$('#pos-filter').value='all';renderCards();openWord(word);
 }catch(error){toast(error.message||'تعذّر فتح كلمات الهدف. حاول مجددًا.');}
 finally{button.disabled=false;button.removeAttribute('aria-busy');}
}
function normalizeSearch(value) { return String(value).normalize('NFC').toLocaleLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ß/g,'ss'); }
function matchingWords() {
 const query=normalizeSearch($('#search').value.trim()),pos=$('#pos-filter').value;
 const list=(cache.get(activeLevel)||[]).filter(word=>!learned.has(word.id)&&(pos==='all'||(pos==='other'?!['noun','verb','adjective'].includes(word.pos):word.pos===pos))&&(!query||normalizeSearch(`${word.article||''} ${word.german} ${word.arabic}`).includes(query)));
 return list;
}
function setCardView(view) {
 cardView=view;document.body.dataset.cardView=view;
 document.querySelectorAll('[data-card-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cardView===view)));
 try{localStorage.setItem('wort-card-view',JSON.stringify(view));}catch{}
}
function card(word) {
 const full=`${word.article?word.article+' ':''}${word.german}`;
 return `<article class="word-card" data-card-id="${esc(word.id)}"><button class="word-open" data-open="${esc(word.id)}" aria-label="تفاصيل ${esc(full)}"><span class="word-pos"><span>${POS[word.pos]||POS.other} <span class="word-level">${word.level}</span></span>${learned.has(word.id)?'<span class="learned-badge" aria-label="تعلّمتها">✓</span>':'<span class="card-hint" aria-hidden="true">التفاصيل ←</span>'}</span><span class="word-pair"><span class="word-head" lang="de" dir="ltr">${word.article?`${articleHtml(word.article)} `:''}${esc(word.german)}</span><span class="translation" lang="ar" dir="rtl">${esc(word.arabic)}</span></span><span class="reference-card-icon" aria-hidden="true">${wordArtwork(word)}</span></button><div class="card-actions"><button class="save-button ${saved.has(word.id)?'saved':''}" data-save="${esc(word.id)}" aria-label="${saved.has(word.id)?'إزالة من المحفوظات':'حفظ الكلمة'}" aria-pressed="${saved.has(word.id)}">${saved.has(word.id)?'★':'☆'}</button><button class="icon-button" data-speak="${esc(word.id)}" aria-label="استمع إلى ${esc(word.german)}">${SPEAKER_ICON}</button></div></article>`;
}
function renderCards() {
 const list=matchingWords();$('#results-count').textContent=`${list.length.toLocaleString('ar')} كلمة غير متعلّمة · ${Math.min(pageSize,list.length)} معروضة`;
 $('#cards').innerHTML=list.length?list.slice(0,pageSize).map(card).join(''):(($('#search').value||$('#pos-filter').value!=='all')?'<div class="empty">لم نجد كلمات غير متعلّمة تطابق البحث. تجد الكلمات السابقة في المراجعة.</div>':'<div class="empty"><h3>أكملت كلمات هذا المستوى 🌿</h3><p>يمكنك مراجعتها أو الانتقال إلى مستوى آخر.</p><button class="secondary" data-review-learned>مراجعة الكلمات</button></div>');
 $('#load-more').hidden=pageSize>=list.length;
}
async function showPanel(name) {
 if(name!==panel)cancelWordAdvance();
 if(name==='badges'&&panel!=='badges')badgesReturnPanel=panel;
 if(name!==panel)stopSpeech();
 panel=name;document.querySelectorAll('main > .panel').forEach(p=>p.hidden=p.id!==`${name}-panel`);document.querySelectorAll('[data-panel]').forEach(b=>{b.classList.toggle('active',b.dataset.panel===name);if(b.dataset.panel===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 $('#home-shield-button').setAttribute('aria-expanded',String(name==='badges'));updateOwnedShield();
 status('');window.scrollTo({top:0,behavior:'instant'});
 if(name==='training')updateReviewAvailability();
 if(name==='saved')await renderSaved();if(name==='progress')renderProgress();if(name==='badges')renderBadges();
 if(name==='writing'&&!$('#writing-content').dataset.mounted){WORT_WRITING.mount($('#writing-content'));$('#writing-content').dataset.mounted='true';}
 if(name==='sentences'&&!$('#sentences-content').dataset.mounted){WORT_SENTENCES.mount($('#sentences-content'));$('#sentences-content').dataset.mounted='true';}
}
async function renderSaved() {
 $('#saved-count').textContent=`${saved.size} كلمة محفوظة`;
 if(!saved.size){$('#saved-cards').innerHTML='<div class="empty">لم تحفظ كلمات بعد. اضغط النجمة على أي بطاقة لتجدها هنا.</div>';return;}
 $('#saved-cards').innerHTML='<p class="empty">جارٍ تحميل محفوظاتك…</p>';
 try { await Promise.all([...new Set([...saved].map(idLevel))].filter(code=>LEVELS.some(l=>l.code===code)).map(loadLevel));$('#saved-cards').innerHTML=[...saved].map(id=>wordMap.get(id)).filter(Boolean).map(card).join(''); }
 catch(error){$('#saved-cards').innerHTML='<div class="empty">تعذّر تحميل بعض المحفوظات. <button class="secondary" id="retry-saved">حاول مجددًا</button></div>';$('#retry-saved').onclick=renderSaved;status(error.message);}
}
function findWord(value) { return wordMap.get(value)||wordMap.get(Number(value)); }
function toggleSave(word) { if(saved.has(word.id)){saved.delete(word.id);toast('أُزيلت من المحفوظات');}else{saved.add(word.id);toast('حُفظت الكلمة');}remember();renderCards();if(panel==='saved')renderSaved();if(currentWord?.id===word.id)updateWordControls(); }
function learnWord(word) { if(learned.has(word.id))return;learned.add(word.id);WORT_HISTORY.record(word);remember();renderCards();if(panel==='saved')renderSaved();toast('كلمة جديدة في رصيدك ✨');if(currentWord?.id===word.id)updateWordControls(); }
function cancelWordAdvance(){clearTimeout(wordAdvanceTimer);wordAdvanceTimer=null;wordAdvanceVersion++;}
function markCurrentWord(){
 const word=currentWord,dialog=$('#word-dialog');
 if(!word||!dialog.open||learned.has(word.id)||wordAdvanceTimer!==null)return;
 cancelWordAdvance();const version=wordAdvanceVersion;
 learnWord(word);
 wordAdvanceTimer=setTimeout(()=>{
  wordAdvanceTimer=null;
  if(version!==wordAdvanceVersion||!dialog.open||currentWord?.id!==word.id)return;
  nextWord();
 },WORD_ADVANCE_DELAY);
}
function speak(text,button=null) {
 if(button&&audioButton===button&&['loading','playing'].includes(WORT_AUDIO.state.state)){stopSpeech();return Promise.resolve(false);}
 const request=++audioRequest;
 if(audioButton){audioButton.removeAttribute('aria-busy');audioButton.classList.remove('audio-playing');}
 audioButton=button;
 if(button)button.setAttribute('aria-busy','true');
 const playing=WORT_AUDIO.speak(text,{onStatus:event=>{
  if(request!==audioRequest)return;
  const state=typeof event==='string'?event:event.state;
  if(state==='loading')toast('جارٍ تجهيز النطق لأول مرة…');
  if(state==='playing'&&button)button.classList.add('audio-playing');
 }});
 return Promise.resolve(playing).catch(error=>{if(request===audioRequest)toast(error.message||'تعذّر تشغيل الصوت. حاول مرة أخرى.');return false;}).finally(()=>{
  if(request===audioRequest){if(button){button.removeAttribute('aria-busy');button.classList.remove('audio-playing');}audioButton=null;}
 });
}
function stopSpeech(){audioRequest++;if(audioButton){audioButton.removeAttribute('aria-busy');audioButton.classList.remove('audio-playing');audioButton=null;}WORT_AUDIO.stop();}
function updateWordControls() {const isSaved=saved.has(currentWord.id);$('#word-save').textContent=isSaved?'★':'☆';$('#word-save').classList.toggle('saved',isSaved);$('#word-save').title=isSaved?'إزالة من المحفوظات':'حفظ الكلمة';$('#word-save').setAttribute('aria-pressed',String(isSaved));$('#word-save').setAttribute('aria-label',isSaved?'إزالة من المحفوظات':'حفظ الكلمة');const isLearned=learned.has(currentWord.id);$('#mark-word').disabled=isLearned;$('#mark-word').classList.toggle('is-learned',isLearned);$('#mark-word').textContent='تعلّمتها ✓';}
function openWord(word) {
 cancelWordAdvance();
 currentWord=word;wordTab='meaning';verbTense='present';$('#word-title').textContent=word.german;updateWordControls();renderWord();if(!$('#word-dialog').open)$('#word-dialog').showModal();$('#word-dialog').scrollTop=0;
}
function exampleHtml(example) {return `<article class="example-card"><div class="example-de" lang="de" dir="ltr">${esc(example.de)}</div>${example.ar?`<p class="example-ar" lang="ar" dir="rtl">${esc(example.ar)}</p>`:''}<button class="secondary" data-example-speak="${esc(example.de)}" aria-label="استمع إلى المثال">استمع إلى المثال ♬</button>${example.source?`<p class="source-note">${example.generated?'مثال تعليمي مولَّد في المصدر · ':''}${example.sourceUrl?`<a href="${esc(example.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(example.source)}</a>`:esc(example.source)}${example.license?' · '+esc(example.license):''}</p>`:''}</article>`;}
function renderInlineVerb(word){
 const current=()=>currentWord?.id===word.id&&wordTab==='meaning'&&$('#inline-conjugation');
 if(verbDataReady){if(current())$('#inline-conjugation').innerHTML=verbGrammarHtml(word);return;}
 if(current())$('#inline-conjugation').innerHTML='<p class="source-note">جارٍ تحميل تصريف الأفعال…</p>';
 if(!verbLoading)verbLoading=WORT_VERBS.load().then(()=>{verbDataReady=true;}).catch(error=>{verbLoading=null;throw error;});
 verbLoading.then(()=>{if(current())$('#inline-conjugation').innerHTML=verbGrammarHtml(word);}).catch(()=>{if(current())$('#inline-conjugation').innerHTML='<div class="empty">تعذّر تحميل التصريف. <button class="secondary" data-retry-verbs>حاول مجددًا</button></div>';});
}
function renderWord() {
 const word=currentWord;
 document.querySelectorAll('[data-word-tab]').forEach(b=>{const active=b.dataset.wordTab===wordTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#word-content').setAttribute('aria-labelledby',`${wordTab}-tab`);
 $('#word-summary').innerHTML=`<div class="reference-word-copy"><div class="reference-word-heading"><h2 lang="de" dir="ltr">${word.article?articleHtml(word.article)+' ':''}${esc(word.german)}</h2><button class="icon-button reference-word-audio" data-pronounce aria-label="نطق الكلمة">${SPEAKER_ICON}</button></div><p class="definition" lang="ar" dir="rtl">${esc(word.arabic)}</p><div class="reference-word-chips"><span>${POS[word.pos]||POS.other}</span><span lang="de" dir="ltr">${word.level}</span></div></div>`;
 const examples=word.examples||[],hasExtraGrammar=word.pos!=='verb'&&Boolean(word.declensionStem||word.forms?.length||word.verbForms);
 if(wordTab==='meaning') {
  $('#word-content').innerHTML=`<section class="reference-meaning"><div class="section-heading"><h3>الكلمة في سياقها</h3><button class="secondary" data-detail-examples>كل الأمثلة ←</button></div>${examples.length?exampleHtml(examples[0]):'<p class="source-note">لا يتوفر مثال موثّق لهذه الكلمة.</p>'}${hasExtraGrammar?'':degreeHtml(word)}${!hasExtraGrammar&&word.plural?`<p class="source-note">الجمع: <b lang="de" dir="ltr">${esc(word.plural)}</b></p>`:''}</section>${word.pos==='verb'?'<div id="inline-conjugation"></div>':hasExtraGrammar?grammarHtml(word):''}${word.note?`<p class="source-note">${esc(word.note)}</p>`:''}`;
  if(word.pos==='verb')renderInlineVerb(word);
 }else if(wordTab==='examples') {
  $('#word-content').innerHTML=`<div class="section-heading"><h2>أمثلة على <b lang="de">${esc(word.german)}</b></h2><span>${examples.length} أمثلة</span></div>${examples.length?examples.map(exampleHtml).join(''):'<div class="empty">لا تتوفر أمثلة في المصدر الحالي لهذه الكلمة.</div>'}`;
 }
 $('#word-content').scrollTop=0;
}
function degreeHtml(word) {
 if(word.pos!=='adjective')return '';
 const degrees=[['الصفة',word.german],['المقارنة',word.comparative],['التفضيل',word.superlative]].filter(d=>d[1]);
 return `<div class="degree-row">${degrees.map(([label,value])=>`<div class="degree-item"><small>${label}</small><strong lang="de" dir="ltr">${esc(value)}</strong></div>`).join('')}</div>`;
}
const CASES=['رفع','جر','داتيف','نصب'];
function adjectiveTables(word) {
 const stem=word.declensionStem;
 const genders=[['المذكر','gender-m'],['المؤنث','gender-f'],['محايد','gender-n'],['جمع','gender-pl']];
 const sets=[
  ['تصريف قوي — بدون أداة',[['er','en','em','en'],['e','er','er','e'],['es','en','em','es'],['e','er','en','e']],null],
  ['تصريف ضعيف — مع أداة التعريف',[['e','en','en','en'],['e','en','en','e'],['e','en','en','e'],['en','en','en','en']],[['der','des','dem','den'],['die','der','der','die'],['das','des','dem','das'],['die','der','den','die']]],
  ['تصريف مختلط — مع أداة التنكير',[['er','en','en','en'],['e','en','en','e'],['es','en','en','es'],['en','en','en','en']],[['ein','eines','einem','einen'],['eine','einer','einer','eine'],['ein','eines','einem','ein'],['keine','keiner','keinen','keine']]]
 ];
 return sets.map(([title,endings,articles])=>`<section class="grammar-section"><h3>${title}</h3><div class="grammar-grid">${genders.map(([label,color],gender)=>`<div class="grammar-block ${color}"><h4>${label}</h4><table class="grammar-table"><tbody>${CASES.map((name,index)=>`<tr><th scope="row">${name}</th><td lang="de" dir="ltr">${articles?esc(articles[gender][index])+' ':''}${esc(stem)}<span class="ending">${endings[gender][index]}</span></td></tr>`).join('')}</tbody></table></div>`).join('')}</div></section>`).join('')+`<section class="grammar-section"><h3>مسند — بدون نهاية إعرابية</h3><div class="example-card" lang="de" dir="ltr">er ist ${esc(word.german)} · sie ist ${esc(word.german)} · es ist ${esc(word.german)}<br>sie sind ${esc(word.german)}</div></section>`;
}
function addedLetters(base,text) {
 const a=Array.from(base.toLocaleLowerCase()),b=Array.from(text.toLocaleLowerCase());
 const rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);
 const same=new Set();let i=0,j=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){same.add(j);i++;j++;}else if(rows[i+1][j]>=rows[i][j+1])i++;else j++;}
 const chars=Array.from(text);let result='',buffer='',changed=null;
 for(let index=0;index<chars.length;index++){
  const mark=!same.has(index)&&/\p{L}/u.test(chars[index]);
  if(changed!==null&&mark!==changed){result+=changed?`<span class="verb-change">${esc(buffer)}</span>`:esc(buffer);buffer='';}
  changed=mark;buffer+=chars[index];
 }
 return result+(changed?`<span class="verb-change">${esc(buffer)}</span>`:esc(buffer));
}
function verbStem(infinitive,prefix='') {
 let base=String(infinitive).replace(/^sich\s+/, '');
 if(prefix&&base.startsWith(prefix))base=base.slice(prefix.length);
 if(base.endsWith('eln'))return base.slice(0,-3)+'l';
 return base.endsWith('en')?base.slice(0,-2):base.endsWith('n')?base.slice(0,-1):base;
}
function coloredVerbForm(entry,form,tense) {
 const prefix=entry.separablePrefix||'';
 const stem=verbStem(entry.infinitive,prefix);
 const neutral=new Set(['mich','dich','sich','uns','euch']);
 const auxiliaries=new Set(['habe','hast','hat','haben','habt','bin','bist','ist','sind','seid']);
 return String(form).split(/(\s+)/).map(token=>{
  if(/^\s+$/.test(token)||neutral.has(token)||token===prefix||(tense==='perfect'&&auxiliaries.has(token)))return esc(token);
  if(!/[a-zäöüß]/i.test(token))return esc(token);
  let lead='',core=token;
  if(prefix&&core.startsWith(prefix)&&core.length>prefix.length){lead=esc(prefix);core=core.slice(prefix.length);}
  if(tense==='perfect'){
   let front='',end='';
   if(core.startsWith('ge')&&core.length>4&&(!stem.startsWith('ge')||core.startsWith('ge'+stem[0]))){front='<span class="verb-change">ge</span>';core=core.slice(2);}
   if(core.endsWith('en')&&core.length>3){end='<span class="verb-change">en</span>';core=core.slice(0,-2);}
   else if(core.endsWith('t')&&core.length>2){end='<span class="verb-change">t</span>';core=core.slice(0,-1);}
   return lead+front+addedLetters(stem,core)+end;
  }
  return lead+addedLetters(stem,core);
 }).join('');
}
function verbGrammarHtml(word) {
 const entry=WORT_VERBS.lookup(word);
 if(!entry)return '<div class="empty">لم يُعثر على تصريف لهذا المدخل. جرّب البحث عن صيغة المصدر للفعل.</div>';
 const tenses=[['present','المضارع'],['preterite','الماضي البسيط'],['perfect','الماضي المركّب']];
 const pronouns=entry.pronouns||['ich','du','er/sie/es','wir','ihr','sie/Sie'];
 const labels=['أنا','أنت','هو / هي','نحن','أنتم','هم / حضرتك'];
 const forms=entry[verbTense]||[];
 return `<section class="verb-section"><div class="verb-base-heading"><h2>تصريف <b lang="de" dir="ltr">${esc(entry.infinitive)}</b></h2>${word.german.toLocaleLowerCase()!==entry.infinitive.toLocaleLowerCase()?`<p class="verb-note">الكلمة <b lang="de">${esc(word.german)}</b> مرتبطة بالفعل الأصلي المعروض هنا.</p>`:''}</div><div class="verb-tense-tabs" role="group" aria-label="زمن تصريف الفعل">${tenses.map(([key,label])=>`<button class="secondary" data-verb-tense="${key}" aria-pressed="${verbTense===key}">${label}</button>`).join('')}</div><p class="verb-legend">الأحرف المضافة أو المتغيّرة فقط ملوّنة. جذر الفعل والضمائر والأفعال المساعدة بلون عادي.</p><table class="verb-table" dir="ltr"><caption class="sr-only">${esc(tenses.find(t=>t[0]===verbTense)[1])} · ${esc(entry.infinitive)}</caption><tbody>${forms.map((form,index)=>`<tr><th scope="row" class="verb-pronoun"><span lang="de">${esc(pronouns[index])}</span><span aria-hidden="true"> · </span><span lang="ar" dir="rtl">${labels[index]}</span></th><td class="verb-form" lang="de" dir="ltr">${coloredVerbForm(entry,form,verbTense)}</td></tr>`).join('')}</tbody></table>${(entry.notes||[]).map(note=>`<p class="verb-note">${esc(note)}</p>`).join('')}</section>`;
}
function grammarHtml(word) {
 if(word.pos==='verb')return verbGrammarHtml(word);
 let html=`<section class="grammar-section"><h2>تصريفات <b lang="de">${esc(word.german)}</b></h2>${degreeHtml(word)}`;
 if(word.pos==='noun')html+=`<div class="example-card"><p>أداة الاسم: <b lang="de">${word.article?articleHtml(word.article):'—'}</b></p>${word.plural?`<p>الجمع: <b lang="de">${esc(word.plural)}</b></p>`:''}</div>`;
 if(word.verbForms)html+=`<p class="source-note">الصيغ مع ضمير المفرد الغائب (هو / هي)، ما لم يُذكر الضمير داخل الصيغة.</p><div class="grammar-grid">${Object.entries(word.verbForms).map(([key,value])=>`<div class="grammar-block"><h4>${({present:'المضارع',past:'الماضي البسيط',perfect:'الماضي المركّب (Perfekt)'})[key]||esc(key)}</h4><p lang="de" dir="ltr">${esc(value)}</p></div>`).join('')}</div>`;
 html+='</section>';
 if(word.pos==='adjective'&&word.declensionStem)html+=adjectiveTables(word);
 if(word.forms?.length)html+=`<section class="grammar-section"><h3>صيغ الكلمة من المصدر</h3><div class="grammar-grid">${word.forms.slice(0,80).map(form=>`<div class="grammar-block"><strong lang="de" dir="ltr">${esc(form.form||form.text)}</strong><small dir="ltr">${esc((form.tags||[]).join(' · '))}</small></div>`).join('')}</div></section>`;
 if(!word.declensionStem&&!word.forms?.length&&!word.verbForms&&!word.plural)html+='<p class="source-note">لا تتوفر تصريفات إضافية موثّقة في بيانات هذه الكلمة.</p>';
 return html;
}
function nextWord(){const list=cache.get(currentWord.level)||[],index=list.findIndex(word=>word.id===currentWord.id);for(let offset=1;offset<=list.length;offset++){const word=list[(index+offset)%list.length];if(!learned.has(word.id)){openWord(word);return;}}$('#word-dialog').close();toast('أكملت كلمات المستوى. يمكنك مراجعتها في قسم المراجعة.');}
function previousWord(){const list=cache.get(currentWord.level)||[],index=list.findIndex(word=>word.id===currentWord.id);for(let offset=1;offset<=list.length;offset++){const word=list[(index-offset+list.length)%list.length];if(panel!=='library'||!learned.has(word.id)){openWord(word);return;}}$('#word-dialog').close();toast('أكملت كلمات المستوى. يمكنك مراجعتها في قسم المراجعة.');}
function progressModel(){const history=WORT_HISTORY.snapshot();return {history,learnedIds:[...learned],savedIds:[...saved],total:totalWords(),levelCounts:Object.fromEntries(LEVELS.map(level=>[level.code,manifest?.levels.find(item=>item.code===level.code)?.count||0])),unknownCount:history?.undatedIds.length||0,loadLevel,speak};}
function formatHours(ms){return (Math.max(0,Number(ms)||0)/3600000).toLocaleString('ar',{maximumFractionDigits:2});}
function updateUsageStats(snapshot){if(!snapshot)return;$('#journey-hours').textContent=formatHours(snapshot.activeMs);$('#journey-active-days').textContent=snapshot.totalDays.toLocaleString('ar');$('#usage-total').textContent=formatHours(snapshot.activeMs);$('#usage-days').textContent=snapshot.totalDays.toLocaleString('ar');const current=WORT_HISTORY.dayKey();$('#usage-today').textContent=formatHours(snapshot.days.find(day=>day.day===current)?.activeMs||0);$('#usage-start').textContent=`بدأ التسجيل: ${snapshot.startedAt}`;$('#usage-live').textContent=snapshot.isIdle?'متوقف مؤقتًا لعدم التفاعل':snapshot.isActive?'● يُحتسب وقتك الآن':'متوقف مؤقتًا';$('#usage-live').classList.toggle('is-active',snapshot.isActive&&!snapshot.isIdle);if(snapshot.persistent===false)$('#usage-note').textContent='التخزين غير متاح في هذا المتصفح؛ الوقت الحالي محسوب لهذه الجلسة فقط. الوقت السابق لتفعيل الميزة لم يكن مسجّلًا.';}
function updateReviewAvailability(){const current=countLearned(activeLevel),training=countLearned($('#training-level').value||activeLevel);$('#review-level').hidden=current===0;$('#start-review').hidden=training===0;$('#review-empty-note').hidden=training>0;$('.training-options').dataset.reviewAvailable=String(training>0);document.querySelectorAll('[data-review-learned]').forEach(button=>button.hidden=current===0);}
function reviewLearned(){showPanel('training');$('#training-level').value=activeLevel;updateReviewAvailability();}
function renderProgress() {
 if(!manifest)return;
 const model=progressModel();
 if(analyticsView)analyticsView.update(model);else analyticsView=WORT_ANALYTICS.mount($('#analytics-content'),model);
 if(calendarView)calendarView.update(model);else calendarView=WORT_CALENDAR.mount($('#calendar-content'),model);
 if(assessmentView)assessmentView.update(model);else assessmentView=WORT_ASSESSMENT.mount($('#assessment-content'),model);
 updateUsageStats(WORT_USAGE.snapshot());
 $('#progress-levels').innerHTML=LEVELS.map(level=>{const count=manifest.levels.find(l=>l.code===level.code)?.count||0,done=Math.min(count,countLearned(level.code));return `<div class="overall-progress"><div class="progress-label"><strong>${level.code} · ${level.name}</strong><span dir="ltr">${done} / ${count}</span></div><div class="track"><i style="width:${count?done/count*100:0}%"></i></div></div>`;}).join('');
 updateOwnedShield();
}
function shieldMarkup(index,name){return `<span class="shield-sprite" role="img" aria-label="درع ${esc(name)}" style="background-position:${index%5*25}% ${index<5?0:100}%"></span>`;}
function ownedShields(){return (manifest?.shields||[]).map((shield,index)=>({...shield,index})).filter(shield=>learned.size>=shield.threshold).sort((a,b)=>a.threshold-b.threshold);}
function updateOwnedShield(){
 const owned=ownedShields(),highest=owned.at(-1),button=$('#home-shield-button');
 $('#stats-shields').textContent=`${owned.length} / ${manifest?.shields?.length||10}`;
 $('#home-shield-art').innerHTML=highest?shieldMarkup(highest.index,highest.name):'<span class="shield-empty-symbol">♢</span>';
 const action=panel==='badges'?'أغلق دروعك المكتسبة':'افتح دروعك المكتسبة';
 $('#home-shield-label').textContent=highest?highest.name:'دروعي';button.setAttribute('aria-label',highest?`درعك الحالي ${highest.name}؛ ${action}`:`لم تكتسب درعًا بعد؛ ${action}`);button.title=action;
}
function renderBadges(){
 if(!manifest)return;
 const owned=ownedShields(),next=(manifest.shields||[]).map((shield,index)=>({...shield,index})).find(shield=>learned.size<shield.threshold);
 updateOwnedShield();$('#shields-caption').textContent=`${owned.length} دروع مكتسبة`;
 $('#shield-note').textContent='هذه الدروع التي فتحتها بتعلّم كلمات جديدة. يظهر أعلى درع مكتسب بجانب اسم الموقع.';
 $('#shields').innerHTML=owned.length?owned.map(shield=>`<article class="shield-card unlocked"><div class="shield-art">${shieldMarkup(shield.index,shield.name)}</div><strong>${esc(shield.name)}</strong><small>${shield.threshold.toLocaleString('ar')} كلمة</small><span class="shield-lock">✓ مكتسب</span></article>`).join(''):'<div class="empty"><h2>درعك الأول ينتظرك</h2><p>لم تكتسب درعًا بعد. كل كلمة جديدة تقرّبك منه.</p></div>';
 $('#badge-next').innerHTML=next?`<article class="badge-next-card"><div class="badge-next-art">${shieldMarkup(next.index,next.name)}</div><div><p class="eyebrow">الدرع القادم</p><h2>${esc(next.name)}</h2><p>باقي ${Math.max(0,next.threshold-learned.size).toLocaleString('ar')} كلمة جديدة</p><div class="track"><i style="width:${Math.min(100,learned.size/next.threshold*100)}%"></i></div><small dir="ltr">${learned.size.toLocaleString('ar')} / ${next.threshold.toLocaleString('ar')}</small></div></article>`:'<div class="badge-complete">اكتملت الدروع العشرة! إنجاز جميل يستحق أن تواصل استخدام كلماتك في الجمل والكتابة.</div>';
}

function shuffled(list) {const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
let reviewRequest = 0;
async function startSession(type,code) {
 const request=++reviewRequest,originPanel=panel;
 status('');try {
  const allWords=await loadLevel(code);
  if(request!==reviewRequest||panel!==originPanel||(originPanel==='training'&&$('#training-level').value!==code)||(originPanel==='library'&&activeLevel!==code))return;
  const pool=allWords.filter(word=>learned.has(word.id));
  if(!pool.length){toast('تعلّم كلمة في هذا المستوى أولًا لتظهر في المراجعة.');return;}
  session={type:'review',code,pool,allWords,words:shuffled(pool).slice(0,10),index:0,score:0,answered:false};
  renderSession();if(!$('#training-dialog').open)$('#training-dialog').showModal();
 }catch(error){if(request!==reviewRequest)return;status(error.message);toast(error.message);}
}
function renderSession() {
 const s=session;if(!s)return;
 if(s.index===s.words.length){
  $('#training-content').innerHTML=`<p class="eyebrow">مراجعة ${esc(s.code)}</p><h2 id="training-title">أكملت مراجعتك ✓</h2><div class="review-summary"><strong dir="ltr">${s.score} / ${s.words.length}</strong><p>إجابات صحيحة من الكلمات التي راجعتها</p></div><p class="review-summary-note">المراجعة تثبّت كلماتك المتعلّمة، ولا تضيف كلمات جديدة إلى تقدّمك.</p><div class="review-summary-actions"><button class="primary" id="session-again" type="button">مراجعة جديدة ↻</button><button class="secondary" id="session-finish" type="button">العودة للمراجعة</button></div>`;
  $('#session-again').onclick=()=>{$('#training-dialog').close();startSession('review',s.code);};
  $('#session-finish').onclick=()=>$('#training-dialog').close();return;
 }
 const word=s.words[s.index];s.answered=false;
 const distractors=shuffled([...new Map(s.allWords.filter(candidate=>candidate.id!==word.id&&candidate.arabic!==word.arabic).map(candidate=>[candidate.arabic,candidate])).values()]).slice(0,3);
 s.options=shuffled([word,...distractors]);
 $('#training-content').innerHTML=`<p class="eyebrow review-session-meta">مراجعة ${esc(s.code)} · ${s.index+1} من ${s.words.length}</p><h2 id="training-title">مراجعة كلماتك</h2><div class="track review-session-track" role="progressbar" aria-label="تقدّم جلسة المراجعة" aria-valuemin="0" aria-valuemax="${s.words.length}" aria-valuenow="${s.index}"><i style="width:${s.index/s.words.length*100}%"></i></div><div class="review-word-heading" dir="ltr"><span class="review-word" lang="de">${word.article?articleHtml(word.article)+' ':''}${esc(word.german)}</span><button class="icon-button review-speak" id="session-speak" type="button" aria-label="استمع إلى ${esc((word.article?word.article+' ':'')+word.german)}" title="استمع إلى الكلمة">${SPEAKER_ICON}</button></div><p class="review-question">ما معنى هذه الكلمة؟</p><div class="quiz-options" role="group" aria-label="اختر معنى الكلمة">${s.options.map((candidate,index)=>`<button type="button" data-answer="${index}">${esc(candidate.arabic)}</button>`).join('')}</div><p class="feedback" role="status" aria-live="polite"></p><button class="primary${s.index===s.words.length-1?'':' word-navigation-button'}" id="session-next" type="button" hidden>${s.index===s.words.length-1?'نتيجة المراجعة':'الكلمة التالية'} ←</button>`;
 $('#session-speak').onclick=()=>speak(`${word.article||''} ${word.german}`,$('#session-speak'));
 $('#training-content').querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
  if(s.answered)return;s.answered=true;
  const correct=s.options[Number(button.dataset.answer)].id===word.id;
  $('#training-content').querySelectorAll('[data-answer]').forEach(option=>{option.disabled=true;if(s.options[Number(option.dataset.answer)].id===word.id)option.classList.add('correct');});
  if(correct)s.score++;else button.classList.add('incorrect');
  $('#training-content .feedback').textContent=correct?'✓ إجابة صحيحة':'المعنى الصحيح: '+word.arabic;
  $('#session-next').hidden=false;
 });
 $('#session-next').onclick=()=>{if(!s.answered)return;s.index++;renderSession();};
}
function renderSources() {$('#sources-content').innerHTML=`<p>${esc(manifest?.levelNote||'تصنيف المستويات تعليمي تقريبي، وليس قائمة امتحان رسمية.')}</p>${(manifest?.sources||[]).map(source=>`<div class="example-card"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a><p class="source-note">${esc(source.license||'')}</p>${source.note?`<p>${esc(source.note)}</p>`:''}</div>`).join('')}<h3>تنزيل بيانات المفردات</h3><div class="data-downloads">${LEVELS.map(level=>`<a href="data/${level.code}.json" download="Wort-${level.code}.json">${level.code} · 2000 مفردة</a>`).join('')}<a href="data/verbs.json" download="Wort-Verbs.json">جداول تصريف الأفعال</a></div><p class="source-note">التقدّم والمحفوظات ونتائج التقييم ووقت الاستخدام محفوظة محليًا في هذا المتصفح. حذف بيانات المتصفح يمحوها. يعمل النطق بمحرك ألماني مضمّن يُحمّل عند أول استخدام. يبدأ تسجيل تواريخ التعلّم ووقت الاستخدام من تفعيل الميزة؛ الكلمات القديمة غير المؤرّخة لا تُوزَّع على أيام تخمينية.</p>`;}

document.querySelectorAll('[data-card-view]').forEach(button=>button.onclick=()=>setCardView(button.dataset.cardView));
setCardView(cardView);
$('#daily-goal-button').onclick=startDailyGoal;
$('#search').oninput=()=>{pageSize=24;renderCards();};$('#pos-filter').onchange=()=>{pageSize=24;renderCards();};$('#load-more').onclick=()=>{pageSize+=24;renderCards();};
$('#level-tabs').onclick=e=>{const b=e.target.closest('[data-level]');if(b)selectLevel(b.dataset.level);};
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>showPanel(b.id==='home-shield-button'&&panel==='badges'?badgesReturnPanel:b.dataset.panel));$('.brand').onclick=e=>{e.preventDefault();showPanel('library');};
$('#word-back').onclick=()=>{cancelWordAdvance();$('#word-dialog').close();};$('#word-save').onclick=()=>toggleSave(currentWord);$('#mark-word').onclick=markCurrentWord;$('#word-previous').onclick=previousWord;
document.querySelectorAll('[data-word-tab]').forEach(b=>b.onclick=()=>{wordTab=b.dataset.wordTab;renderWord();});
$('.word-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...document.querySelectorAll('[data-word-tab]')],index=buttons.findIndex(b=>b.dataset.wordTab===wordTab);const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowLeft'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();};
document.body.addEventListener('click',e=>{
 if(e.target.closest('[data-retry-verbs]')){renderWord();return;}
 if(e.target.closest('[data-review-learned]')){reviewLearned();return;}
 const tenseButton=e.target.closest('[data-verb-tense]');if(tenseButton){verbTense=tenseButton.dataset.verbTense;renderWord();document.querySelector(`[data-verb-tense="${verbTense}"]`)?.focus({preventScroll:true});return;}
 const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]'),audio=e.target.closest('[data-speak]'),example=e.target.closest('[data-example-speak]');
 if(open){const word=findWord(open.dataset.open);if(word)openWord(word);}if(save){const word=findWord(save.dataset.save);if(word)toggleSave(word);}if(audio){const word=findWord(audio.dataset.speak);if(word)speak(`${word.article||''} ${word.german}`,audio);}if(example)speak(example.dataset.exampleSpeak,example);if(e.target.closest('[data-pronounce]'))speak(`${currentWord.article||''} ${currentWord.german}`,e.target.closest('[data-pronounce]'));if(e.target.closest('[data-detail-examples]')){wordTab='examples';renderWord();}
});
$('#training-level').onchange=updateReviewAvailability;
$('#review-level').onclick=()=>startSession('review',activeLevel);$('#start-review').onclick=()=>startSession('review',$('#training-level').value);$('#training-close').onclick=()=>{$('#training-dialog').close();reviewRequest++;};
$('#open-sources').onclick=()=>{renderSources();$('#sources-dialog').showModal();};$('#sources-close').onclick=()=>$('#sources-dialog').close();
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',stopSpeech));
$('#word-dialog').addEventListener('close',cancelWordAdvance);
$('#word-dialog').addEventListener('cancel',cancelWordAdvance);
document.addEventListener('wort:speak',event=>{if(event.detail?.text)speak(event.detail.text,event.detail.button||null);});
WORT_USAGE.start();WORT_USAGE.subscribe(updateUsageStats);
setInterval(()=>{if(!document.hidden){if(today.day!==WORT_HISTORY.dayKey())updateProgress();if(panel==='progress')updateUsageStats(WORT_USAGE.snapshot());}},1000);
window.addEventListener('storage',event=>{if(event.key==='wort-learned'||event.key===WORT_HISTORY.key){for(const id of storedSet('wort-learned'))learned.add(id);WORT_HISTORY.sync([...learned]);renderCards();if(currentWord)updateWordControls();if(manifest)updateProgress();}});
async function init(){try{const response=await fetch('data/manifest.json');if(!response.ok)throw new Error('تعذّر تحميل بيانات الموقع. أعد المحاولة.');manifest=await response.json();$('#level-note').textContent=manifest.levelNote||$('#level-note').textContent;buildLevels();await selectLevel('A1');updateProgress();}catch(error){status(error.message);$('#cards').innerHTML='<div class="empty">تعذّر بدء الموقع. <button class="secondary" id="retry-app">أعد المحاولة</button></div>';$('#retry-app').onclick=init;}}
init();
