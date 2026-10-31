'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
let session = null, toastTimer, loadRequest = 0;
const safeRead = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const storedSet = key => { const value=safeRead(key,[]); return new Set(Array.isArray(value)?value.filter(id=>typeof id==='number'||typeof id==='string'):[]); };
const saved=storedSet('wort-saved'), learned=storedSet('wort-learned');
const day = new Date().toLocaleDateString('en-CA');
const oldToday=safeRead('wort-today',{});
const today={day,ids:oldToday?.day===day&&Array.isArray(oldToday.ids)?[...new Set(oldToday.ids)]:[]};
let storageAvailable=true;
const totalWords=()=>manifest?.levels.reduce((n,l)=>n+l.count,0)||0;
function idLevel(id) { return typeof id==='number' && id>=0 && id<90 ? LEVELS[Math.floor(id/18)].code : String(id).split(':')[0]; }
function countLearned(code) { return [...learned].filter(id=>idLevel(id)===code).length; }
function remember() {
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
 const total=totalWords(),done=Math.min(total,learned.size),percent=total?done/total*100:0;
 $('#overall-count').textContent=`${done.toLocaleString('ar')} / ${total.toLocaleString('ar')}`;
 $('#overall-percent').textContent=`${percent.toLocaleString('ar',{maximumFractionDigits:1})}٪`;
 $('#overall-bar').style.width=`${percent}%`;$('#overall-bar').parentElement.setAttribute('aria-valuenow',percent.toFixed(1));
 const levelCount=manifest?.levels.find(level=>level.code===activeLevel)?.count||0;
 const levelDone=Math.min(levelCount,countLearned(activeLevel));
 $('#level-learned').textContent=`${levelDone} من ${levelCount} كلمة تعلّمتها`;
 $('#level-bar').style.width=`${levelCount?levelDone/levelCount*100:0}%`;
 $('#level-bar').parentElement.setAttribute('aria-valuenow',String(levelCount?Math.round(levelDone/levelCount*100):0));
 $('#stats-learned').textContent=done.toLocaleString('ar');$('#stats-today').textContent=today.ids.length.toLocaleString('ar');
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
function matchingWords() {
 const query=$('#search').value.trim().toLocaleLowerCase(),pos=$('#pos-filter').value;
 return (cache.get(activeLevel)||[]).filter(word=>(pos==='all'||(pos==='other'?!['noun','verb','adjective'].includes(word.pos):word.pos===pos))&&(!query||`${word.article||''} ${word.german} ${word.arabic}`.toLocaleLowerCase().includes(query)));
}
function card(word) {
 const full=`${word.article?word.article+' ':''}${word.german}`;
 return `<article class="word-card" data-card-id="${esc(word.id)}"><button class="word-open" data-open="${esc(word.id)}" aria-label="تفاصيل ${esc(full)}"><div class="word-pos"><span>${POS[word.pos]||POS.other}</span><span class="word-level">${word.level}</span></div><h3 class="word-head" lang="de" dir="ltr">${word.article?`<span class="article">${esc(word.article)}</span> `:''}${esc(word.german)}</h3><p class="translation">${esc(word.arabic)}</p></button><div class="card-actions"><button class="save-button ${saved.has(word.id)?'saved':''}" data-save="${esc(word.id)}" aria-label="${saved.has(word.id)?'إزالة من المحفوظات':'حفظ الكلمة'}" aria-pressed="${saved.has(word.id)}">${saved.has(word.id)?'★':'☆'}</button><button class="icon-button" data-speak="${esc(word.id)}" aria-label="استمع إلى ${esc(word.german)}">♬</button><span class="${learned.has(word.id)?'learned-badge':'card-footer'}">${learned.has(word.id)?'✓ تعلّمتها':'المعنى والأمثلة ←'}</span></div></article>`;
}
function renderCards() {
 const list=matchingWords();$('#results-count').textContent=`${list.length.toLocaleString('ar')} كلمة · ${Math.min(pageSize,list.length)} بطاقة معروضة`;
 $('#cards').innerHTML=list.length?list.slice(0,pageSize).map(card).join(''):'<div class="empty">لم نجد كلمات مطابقة. جرّب كلمة أخرى أو غيّر نوع الكلمة.</div>';
 $('#load-more').hidden=pageSize>=list.length;
}
async function showPanel(name) {
 panel=name;document.querySelectorAll('main > .panel').forEach(p=>p.hidden=p.id!==`${name}-panel`);document.querySelectorAll('[data-panel]').forEach(b=>{b.classList.toggle('active',b.dataset.panel===name);if(b.dataset.panel===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 status('');window.scrollTo({top:0,behavior:'instant'});
 if(name==='saved')await renderSaved();if(name==='progress')renderProgress();
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
function learnWord(word) { if(learned.has(word.id))return;learned.add(word.id);if(!today.ids.includes(word.id))today.ids.push(word.id);remember();renderCards();if(panel==='saved')renderSaved();toast('كلمة جديدة في رصيدك ✨');if(currentWord?.id===word.id)updateWordControls(); }
function speak(text) {
 if(!('speechSynthesis'in window)){toast('النطق غير مدعوم في هذا المتصفح.');return;}
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='de-DE';utterance.rate=.83;
 const voice=speechSynthesis.getVoices().find(voice=>voice.lang.startsWith('de'));if(voice)utterance.voice=voice;speechSynthesis.speak(utterance);
}
function stopSpeech() { if('speechSynthesis'in window)speechSynthesis.cancel(); }
function updateWordControls() {const isSaved=saved.has(currentWord.id);$('#word-save').textContent=isSaved?'★':'☆';$('#word-save').setAttribute('aria-pressed',String(isSaved));$('#word-save').setAttribute('aria-label',isSaved?'إزالة من المحفوظات':'حفظ الكلمة');$('#mark-word').disabled=learned.has(currentWord.id);$('#mark-word').textContent=learned.has(currentWord.id)?'تعلّمتها ✓':'تعلّمت هذه الكلمة ✓';}
function openWord(word) {
 currentWord=word;wordTab='meaning';$('#word-title').textContent=word.german;updateWordControls();renderWord();if(!$('#word-dialog').open)$('#word-dialog').showModal();$('#word-dialog').scrollTop=0;
}
function exampleHtml(example) {return `<article class="example-card"><div class="example-de" lang="de" dir="ltr">${esc(example.de)}</div>${example.ar?`<p class="example-ar">${esc(example.ar)}</p>`:''}<button class="secondary" data-example-speak="${esc(example.de)}" aria-label="استمع إلى المثال">استمع إلى المثال ♬</button></article>`;}
function renderWord() {
 const word=currentWord;
 document.querySelectorAll('[data-word-tab]').forEach(b=>{const active=b.dataset.wordTab===wordTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#word-content').setAttribute('aria-labelledby',`${wordTab}-tab`);
 const examples=word.examples||[];
 if(wordTab==='meaning') {
  $('#word-content').innerHTML=`<section class="meaning-block"><div class="word-pos"><span>${POS[word.pos]||POS.other}</span><span>${word.level}</span></div><div class="word-main"><h2 lang="de" dir="ltr">${word.article?`<span class="article">${esc(word.article)}</span> `:''}${esc(word.german)}</h2><button class="icon-button" data-pronounce aria-label="نطق الكلمة">♬</button></div>${word.ipa?`<p class="pronunciation" lang="de" dir="ltr">${esc(word.ipa)}</p>`:''}<p class="definition">${esc(word.arabic)}</p>${degreeHtml(word)}${word.plural?`<p class="pronunciation">الجمع: <b lang="de" dir="ltr">${esc(word.plural)}</b></p>`:''}</section><section><div class="section-heading"><h3>الكلمة في سياقها</h3><button class="secondary" data-detail-examples>كل الأمثلة ←</button></div>${examples.length?exampleHtml(examples[0]):'<p class="source-note">لا يتوفر مثال موثّق لهذه الكلمة في المصدر الحالي.</p>'}</section>${word.note?`<p class="source-note">${esc(word.note)}</p>`:''}`;
 }else if(wordTab==='examples') {
  $('#word-content').innerHTML=`<div class="section-heading"><h2>أمثلة على <b lang="de">${esc(word.german)}</b></h2><span>${examples.length} أمثلة</span></div>${examples.length?examples.map(exampleHtml).join(''):'<div class="empty">لا تتوفر أمثلة في المصدر الحالي لهذه الكلمة.</div>'}`;
 }else $('#word-content').innerHTML=grammarHtml(word);
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
function grammarHtml(word) {
 let html=`<section class="grammar-section"><h2>تصريفات <b lang="de">${esc(word.german)}</b></h2>${degreeHtml(word)}`;
 if(word.pos==='noun')html+=`<div class="example-card"><p>أداة الاسم: <b lang="de">${esc(word.article||'—')}</b></p>${word.plural?`<p>الجمع: <b lang="de">${esc(word.plural)}</b></p>`:''}</div>`;
 if(word.verbForms)html+=`<div class="grammar-grid">${Object.entries(word.verbForms).map(([key,value])=>`<div class="grammar-block"><h4>${({present:'المضارع',past:'الماضي البسيط',perfect:'الماضي التام'})[key]||esc(key)}</h4><p lang="de" dir="ltr">${esc(value)}</p></div>`).join('')}</div>`;
 html+='</section>';
 if(word.pos==='adjective'&&word.declensionStem)html+=adjectiveTables(word);
 if(word.forms?.length)html+=`<section class="grammar-section"><h3>صيغ الكلمة من المصدر</h3><div class="grammar-grid">${word.forms.slice(0,80).map(form=>`<div class="grammar-block"><strong lang="de" dir="ltr">${esc(form.form||form.text)}</strong><small dir="ltr">${esc((form.tags||[]).join(' · '))}</small></div>`).join('')}</div></section>`;
 if(!word.declensionStem&&!word.forms?.length&&!word.verbForms&&!word.plural)html+='<p class="source-note">لا تتوفر تصريفات إضافية موثّقة في بيانات هذه الكلمة.</p>';
 return html;
}
function nextWord() {const list=cache.get(currentWord.level)||[];const index=list.findIndex(w=>w.id===currentWord.id);if(list.length)openWord(list[(index+1)%list.length]);}
function renderProgress() {
 if(!manifest)return;
 const shields=manifest.shields||[];const unlocked=shields.filter(s=>learned.size>=s.threshold).length;
 $('#stats-shields').textContent=`${unlocked} / ${shields.length}`;$('#shields-caption').textContent=`${unlocked} مكتسبة`;
 $('#shield-note').textContent=manifest.shieldNote||'تفتح الدروع مع زيادة عدد الكلمات التي تتعلّمها.';
 $('#progress-levels').innerHTML=LEVELS.map(level=>{const count=manifest.levels.find(l=>l.code===level.code)?.count||0,done=Math.min(count,countLearned(level.code));return `<div class="overall-progress"><div class="progress-label"><strong>${level.code} · ${level.name}</strong><span>${done} / ${count}</span></div><div class="track"><i style="width:${count?done/count*100:0}%"></i></div></div>`;}).join('');
 $('#shields').innerHTML=shields.map((shield,index)=>{const earned=learned.size>=shield.threshold;return `<article class="shield-card ${earned?'unlocked':''}"><div class="shield-art">${`<div class="shield-sprite" role="img" aria-label="درع سند ${esc(shield.name)}" style="background-position:${index%5*25}% ${index<5?0:100}%"></div>`}</div><strong>${esc(shield.name)}</strong><small>${shield.threshold.toLocaleString('ar')} كلمة</small><span class="shield-lock">${earned?'✓ مكتسب':'🔒 لم يُفتح بعد'}</span></article>`;}).join('');
}
function shuffled(list) {const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
async function startSession(type,code) {
 status('');try {
  const pool=await loadLevel(code);if(pool.length<4){toast('هذا المستوى لا يحتوي على كلمات كافية للاختبار.');return;}
  session={type,code,pool,words:shuffled(pool).slice(0,10),index:0,score:0,answered:false};renderSession();$('#training-dialog').showModal();
 }catch(error){status(error.message);toast(error.message);}
}
function renderSession() {
 const s=session,done=s.index===s.words.length;
 if(done){$('#training-content').innerHTML=`<p class="eyebrow">المستوى ${s.code}</p><h2 id="training-title">${s.type==='quiz'?'أكملت الاختبار 🎉':'أكملت المراجعة 🌱'}</h2><p class="quiz-word">${s.type==='quiz'?`${s.score} / ${s.words.length}`:`${s.words.length} كلمات`}</p><p>كل محاولة تجعل الكلمات أقرب إليك.</p><button class="primary" id="session-again">جلسة جديدة</button>`;$('#session-again').onclick=()=>{$('#training-dialog').close();startSession(s.type,s.code);};return;}
 const word=s.words[s.index];s.answered=false;
 let html=`<p class="eyebrow">${s.code} · ${s.index+1} من ${s.words.length}</p><h2 id="training-title">${s.type==='quiz'?'ما معنى هذه الكلمة؟':'بطاقات المراجعة'}</h2><div class="track"><i style="width:${s.index/s.words.length*100}%"></i></div><p class="quiz-word" lang="de" dir="ltr">${esc(`${word.article||''} ${word.german}`.trim())}</p><button class="secondary" id="session-speak">استمع ♬</button>`;
 if(s.type==='quiz'){
  const distractors=shuffled(s.pool.filter(w=>w.id!==word.id&&w.arabic!==word.arabic)).slice(0,3);s.options=shuffled([word,...distractors]);
  html+=`<div class="quiz-options">${s.options.map((w,i)=>`<button data-answer="${i}">${esc(w.arabic)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p><button class="primary" id="session-next" hidden>التالي ←</button>`;
 }else html+='<div id="review-answer" aria-live="polite"></div><div class="review-controls"><button class="secondary" id="review-reveal">أظهر المعنى والمثال</button><button class="primary" id="session-next" hidden>تعلّمتها ←</button><button class="secondary" id="review-skip">راجعها لاحقًا</button></div>';
 $('#training-content').innerHTML=html;$('#session-speak').onclick=()=>speak(`${word.article||''} ${word.german}`);
 if(s.type==='quiz')document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
  if(s.answered)return;s.answered=true;const correct=s.options[+button.dataset.answer].id===word.id;
  document.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;if(s.options[+b.dataset.answer].id===word.id)b.classList.add('correct');});
  if(correct){s.score++;learnWord(word);}else button.classList.add('incorrect');
  $('.feedback').textContent=correct?'إجابة صحيحة! ✨':`المعنى الصحيح: ${word.arabic}`;$('#session-next').hidden=false;
 });else{
  $('#review-reveal').onclick=()=>{$('#review-answer').innerHTML=`<p class="definition">${esc(word.arabic)}</p>${word.examples?.length?exampleHtml(word.examples[0]):''}`;$('#review-reveal').hidden=true;$('#session-next').hidden=false;};
  $('#review-skip').onclick=()=>{s.index++;renderSession();};
 }
 $('#session-next').onclick=()=>{if(s.type==='review')learnWord(word);s.index++;renderSession();};
}
function renderSources() {$('#sources-content').innerHTML=`<p>${esc(manifest?.levelNote||'تصنيف المستويات تعليمي تقريبي، وليس قائمة امتحان رسمية.')}</p>${(manifest?.sources||[]).map(source=>`<div class="example-card"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a><p class="source-note">${esc(source.license||'')}</p>${source.note?`<p>${esc(source.note)}</p>`:''}</div>`).join('')}<p class="source-note">التقدم والمحفوظات محفوظة محليًا في هذا المتصفح. حذف بيانات المتصفح يمحوها. النطق يعتمد على الأصوات الألمانية المتاحة في جهازك.</p>`;}

$('#search').oninput=()=>{pageSize=24;renderCards();};$('#pos-filter').onchange=()=>{pageSize=24;renderCards();};$('#load-more').onclick=()=>{pageSize+=24;renderCards();};
$('#level-tabs').onclick=e=>{const b=e.target.closest('[data-level]');if(b)selectLevel(b.dataset.level);};
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>showPanel(b.dataset.panel));$('.brand').onclick=e=>{e.preventDefault();showPanel('library');};
$('#word-back').onclick=()=>$('#word-dialog').close();$('#word-save').onclick=()=>toggleSave(currentWord);$('#mark-word').onclick=()=>learnWord(currentWord);$('#word-next').onclick=nextWord;
document.querySelectorAll('[data-word-tab]').forEach(b=>b.onclick=()=>{wordTab=b.dataset.wordTab;renderWord();});
$('.word-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...document.querySelectorAll('[data-word-tab]')],index=buttons.findIndex(b=>b.dataset.wordTab===wordTab);const next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowLeft'?1:-1)+3)%3;buttons[next].click();buttons[next].focus();};
document.body.addEventListener('click',e=>{
 const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]'),audio=e.target.closest('[data-speak]'),example=e.target.closest('[data-example-speak]');
 if(open){const word=findWord(open.dataset.open);if(word)openWord(word);}if(save){const word=findWord(save.dataset.save);if(word)toggleSave(word);}if(audio){const word=findWord(audio.dataset.speak);if(word)speak(`${word.article||''} ${word.german}`);}if(example)speak(example.dataset.exampleSpeak);if(e.target.closest('[data-pronounce]'))speak(`${currentWord.article||''} ${currentWord.german}`);if(e.target.closest('[data-detail-examples]')){wordTab='examples';renderWord();}
});
$('#review-level').onclick=()=>startSession('review',activeLevel);$('#quiz-level').onclick=()=>startSession('quiz',activeLevel);$('#start-review').onclick=()=>startSession('review',$('#training-level').value);$('#start-quiz').onclick=()=>startSession('quiz',$('#training-level').value);$('#training-close').onclick=()=>$('#training-dialog').close();
$('#open-sources').onclick=()=>{renderSources();$('#sources-dialog').showModal();};$('#sources-close').onclick=()=>$('#sources-dialog').close();
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',stopSpeech));
async function init(){try{const response=await fetch('data/manifest.json');if(!response.ok)throw new Error('تعذّر تحميل بيانات الموقع. أعد المحاولة.');manifest=await response.json();$('#level-note').textContent=manifest.levelNote||$('#level-note').textContent;buildLevels();await selectLevel('A1');updateProgress();}catch(error){status(error.message);$('#cards').innerHTML='<div class="empty">تعذّر بدء الموقع. <button class="secondary" id="retry-app">أعد المحاولة</button></div>';$('#retry-app').onclick=init;}}
init();
