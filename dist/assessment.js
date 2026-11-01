/* Vocabulary recognition check. This is not a CEFR language certification. */
(() => {
  'use strict';
  const LEVELS = ['A1','A2','B1','B2','C1'];
  const STORAGE = 'wort-assessment-v1';
  const mounted = new WeakMap();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalized = value => String(value ?? '').normalize('NFC').toLocaleLowerCase().trim();
  const normalizeArabic = value => normalized(value).replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا');
  const ids = value => new Set(Array.from(value || [], id => String(id)));
  const shuffle = values => {
    const list = [...values];
    for (let i=list.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; }
    return list;
  };
  function levelForId(id) {
    const text=String(id), numeric=Number(text);
    if (/^\d+$/.test(text) && numeric>=0 && numeric<90) return LEVELS[Math.floor(numeric/18)];
    const level=text.split(':')[0];return LEVELS.includes(level)?level:null;
  }
  function readResult() {
    try {
      const value=JSON.parse(localStorage.getItem(STORAGE));
      if (value?.version!==1 || !Array.isArray(value.records) || value.records.length!==25) return null;
      if (!value.records.every(record => LEVELS.includes(record.level) && typeof record.correct==='boolean' && typeof record.known==='boolean')) return null;
      return summarize(value.records, value.completedAt);
    } catch { return null; }
  }
  function summarize(records, date = new Date().toISOString()) {
    const scores=Object.fromEntries(LEVELS.map(level => {
      const sample=records.filter(record=>record.level===level);
      return [level,{total:sample.length,correct:sample.filter(record=>record.correct).length,skipped:sample.filter(record=>record.skipped).length}];
    }));
    let highest=null;
    for (const level of LEVELS) {
      if (scores[level].total!==5 || scores[level].correct<4) break;
      highest=level;
    }
    const known=records.filter(record=>record.known), others=records.filter(record=>!record.known);
    return {version:1,completedAt:date,level:highest,correct:records.filter(record=>record.correct).length,total:records.length,scores,
      known:{total:known.length,correct:known.filter(record=>record.correct).length},
      other:{total:others.length,correct:others.filter(record=>record.correct).length},records};
  }
  function distinctWords(words) {
    const seen=new Set();
    return words.filter(word => {
      if (!word || word.id==null || typeof word.german!=='string' || typeof word.arabic!=='string' || !word.german.trim() || !word.arabic.trim()) return false;
      const key=normalized(word.german);
      if (seen.has(key)) return false;
      seen.add(key);return true;
    });
  }
  function makeQuestions(pools, learned, saved, previous=[]) {
    const previousIds=new Set(previous.map(record=>String(record.id)));
    const take=(list,count) => {
      const fresh=shuffle(list.filter(word=>!previousIds.has(String(word.id))));
      const repeat=shuffle(list.filter(word=>previousIds.has(String(word.id))));
      return [...fresh,...repeat].slice(0,count);
    };
    return LEVELS.flatMap(level => {
      const pool=distinctWords(pools[level]);
      if (pool.length<5 || new Set(pool.map(word=>normalizeArabic(word.arabic))).size<4) throw new Error(`لا تتوفر كلمات كافية لإعداد أسئلة ${level}. حاول مرة أخرى لاحقًا.`);
      const known=pool.filter(word=>learned.has(String(word.id)));
      const other=pool.filter(word=>!learned.has(String(word.id)));
      const picked=[...take(known,2),...take(other,3)];
      const selected=new Set(picked.map(word=>String(word.id)));
      if (picked.length<5) picked.push(...take(pool.filter(word=>!selected.has(String(word.id))),5-picked.length));
      return shuffle(picked).map(word => {
        const correctText=normalizeArabic(word.arabic);
        const correctTokens=new Set(correctText.split(/[^\p{L}]+/u).filter(part=>part.length>=3).map(part=>part.replace(/^ال/,'')));
        const byMeaning=new Map();
        for (const option of shuffle(pool)) {
          const text=normalizeArabic(option.arabic);
          if (text===correctText || String(option.id)===String(word.id)) continue;
          const tokens=text.split(/[^\p{L}]+/u).filter(part=>part.length>=3).map(part=>part.replace(/^ال/,''));
          const overlaps=tokens.some(part=>correctTokens.has(part));
          if (!byMeaning.has(text)) byMeaning.set(text,{word:option,overlaps});
        }
        const candidates=[...byMeaning.values()].sort((a,b)=>Number(a.overlaps)-Number(b.overlaps));
        const samePos=candidates.filter(candidate=>candidate.word.pos===word.pos);
        const different=candidates.filter(candidate=>candidate.word.pos!==word.pos);
        const distractors=[...samePos.filter(candidate=>!candidate.overlaps),...different.filter(candidate=>!candidate.overlaps),...samePos.filter(candidate=>candidate.overlaps),...different.filter(candidate=>candidate.overlaps)].slice(0,3).map(candidate=>candidate.word);
        if (distractors.length!==3) throw new Error('تعذّر إعداد خيارات مختلفة للاختبار. حاول مرة أخرى.');
        return {word,level,known:learned.has(String(word.id)),saved:saved.has(String(word.id)),options:shuffle([word,...distractors])};
      });
    });
  }
  function mount(container, initialModel = {}) {
    if (!container || typeof container.addEventListener!=='function') throw new TypeError('Assessment container is required.');
    mounted.get(container)?.destroy();
    let model={...initialModel},learned=ids(model.learnedIds),saved=ids(model.savedIds),latest=readResult();
    let phase='intro',questions=[],records=[],index=0,answer=null,error='',generation=0,destroyed=false;
    const now = () => { const date = typeof model.now==='function'?model.now():model.now; const value=date?new Date(date):new Date();return Number.isNaN(value.getTime())?new Date():value; };
    const find = selector => container.querySelector(selector);
    const n = value => Number(value).toLocaleString('ar');
    function coverageHtml() {
      const counts=Object.fromEntries(LEVELS.map(level=>[level,0]));
      learned.forEach(id=>{const level=levelForId(id);if(level)counts[level]++;});
      return `<div class="assessment-overview"><div><strong>${n(learned.size)}</strong><span>علّمتها كمتعلّمة</span></div><div><strong>${n(saved.size)}</strong><span>في قائمة الحفظ</span></div></div><details class="assessment-coverage"><summary>تغطية مجموعات المفردات من A1 إلى C1</summary><div>${LEVELS.map(level=>{
        const total=Number(model.levelCounts?.[level])||2000,count=Math.min(counts[level],total);
        return `<div class="assessment-coverage-row"><div><b dir="ltr">${level}</b><span>${n(count)} من ${n(total)} بطاقة</span></div><div class="assessment-track" role="progressbar" aria-label="المفردات المعلّمة كمتعلّمة في ${level}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}"><i style="width:${count/total*100}%"></i></div></div>`;
      }).join('')}</div><p>هذه تغطية لقائمتك، وليست حكمًا على إتقان اللغة. الكلمات المحفوظة بالنجمة لا تُحتسب تلقائيًا ككلمات متقنة.</p></details>`;
    }
    function resultHtml(result, compact = false) {
      const date=new Date(result.completedAt);const dateLabel=Number.isNaN(date.getTime())?'آخر محاولة محفوظة':date.toLocaleDateString('ar',{year:'numeric',month:'short',day:'numeric'});
      const label=result.level || 'بداية A1';
      const next=result.level?LEVELS[LEVELS.indexOf(result.level)+1]: 'A1';
      return `<section class="assessment-result ${compact?'assessment-last-result':''}" aria-label="نتيجة اختبار المفردات"><div class="assessment-result-heading"><div><p>مؤشر التعرّف على المفردات</p><strong dir="${result.level?'ltr':'rtl'}">${esc(label)}</strong></div><div><b dir="ltr">${result.correct} / ${result.total}</b><small>${esc(dateLabel)}</small></div></div><p>${result.level?`أعلى مجموعة متتابعة أجبت عن أربعة أسئلة من خمسة فيها على الأقل هي ${result.level}.`:'لم تبلغ أربعة أجوبة صحيحة من خمسة في مجموعة A1 بهذه العيّنة. ابدأ بتثبيت أساسياتها.'}</p>${compact?'':`<div class="assessment-score-grid">${LEVELS.map(level=>`<div class="${result.scores[level].correct>=4?'is-passed':''}"><strong dir="ltr">${level}</strong><span dir="ltr">${result.scores[level].correct} / ${result.scores[level].total}</span><small>في هذه العيّنة</small></div>`).join('')}</div><div class="assessment-retention"><p><b>كلمات علّمتها كمتعلّمة:</b> ${result.known.total?`${n(result.known.correct)} من ${n(result.known.total)} صحيحة`:'لم توجد كلمات معلّمة كمتعلّمة في هذه العيّنة.'}</p><p><b>كلمات أخرى:</b> ${result.other.total?`${n(result.other.correct)} من ${n(result.other.total)} صحيحة`:'لم توجد كلمات أخرى في هذه العيّنة.'}</p></div><p class="assessment-recommendation">${next?`خطوتك التالية: راجع أخطاء هذه العيّنة وركّز على مجموعة ${next} مع استخدام الكلمات داخل جمل.`:'واصل توسيع استعمال المفردات في نصوص ومحادثات، وليس التعرّف على معناها فقط.'}</p>`}<p class="assessment-limit">هذا مؤشر تقريبي من ${n(result.total)} سؤالًا على مجموعات تعليمية تقريبية. لا يقيس المحادثة أو الكتابة أو الاستماع، ولا يمنح مستوى CEFR رسميًا.</p></section>`;
    }
    function render() {
      if (destroyed) return;
      let html=`<section class="assessment-widget" aria-labelledby="assessment-title"><header class="assessment-heading"><div><span class="assessment-eyebrow">تحقّق ممّا تتذكّره</span><h2 id="assessment-title">مؤشر مستواك في المفردات</h2></div><span class="assessment-tag">A1–C1</span></header>`;
      if (phase==='intro' || phase==='error') {
        html+=`<p class="assessment-intro">حفظ الكلمات وحده لا يكفي لتحديد مستوى الألمانية الكامل. اختبر التعرّف على معانيها لتحصل على مؤشر أوضح من عدد البطاقات فقط.</p>${coverageHtml()}${latest?resultHtml(latest,true):'<p class="assessment-no-result">لم تُسجَّل محاولة تحقق بعد؛ لن نحوّل عدد الكلمات وحده إلى مستوى لغوي.</p>'}${error?`<p class="assessment-error" role="alert">${esc(error)}</p>`:''}<button type="button" class="primary assessment-start" data-assessment-action="start">${phase==='error'?'حاول بدء الاختبار مجددًا':'اختبر مفرداتك'}</button><p class="assessment-hint">٢٥ سؤالًا، خمسة لكل مجموعة. نخلط كلمات علّمتها كمتعلّمة مع كلمات أخرى حين تتوفر. لا نغيّر قوائمك أو تقدّمك تلقائيًا.</p>`;
      } else if (phase==='loading') {
        html+='<div class="assessment-loading" role="status"><span class="assessment-spinner" aria-hidden="true"></span><p>جارٍ إعداد عيّنة الكلمات من المستويات الخمسة…</p></div><button type="button" class="secondary" data-assessment-action="cancel">إلغاء</button>';
      } else if (phase==='quiz') {
        const question=questions[index],completed=index+(answer?1:0),word=question.word;
        html+=`<div class="assessment-quiz-meta"><span>السؤال ${n(index+1)} من ${n(questions.length)}</span><b dir="ltr">${question.level}</b></div><div class="assessment-track" role="progressbar" aria-label="الأسئلة المجابة" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${completed}"><i style="width:${completed/questions.length*100}%"></i></div><p class="assessment-question">اختر أقرب معنى للكلمة:</p><div id="assessment-word" class="assessment-word" lang="de" dir="ltr">${word.article?`<span data-article="${esc(word.article.toLocaleLowerCase())}">${esc(word.article)}</span> `:''}${esc(word.german)}</div>${typeof model.speak==='function'?'<button type="button" class="secondary assessment-listen" data-assessment-action="listen">استمع ♬</button>':''}<div class="assessment-options" role="group" aria-describedby="assessment-word" aria-label="اختر معنى الكلمة المعروضة">${question.options.map((option,optionIndex)=>`<button type="button" data-assessment-answer="${optionIndex}" ${answer?'disabled':''} class="${answer&&String(option.id)===String(word.id)?'is-correct':''} ${answer&&answer.option===optionIndex&&!answer.correct?'is-incorrect':''}">${esc(option.arabic)}</button>`).join('')}</div><p id="assessment-feedback" class="assessment-feedback" role="status" aria-live="polite">${answer?(answer.skipped?`تخطّيت السؤال. المعنى: ${esc(word.arabic)}`:answer.correct?'إجابة صحيحة.':`المعنى الصحيح: ${esc(word.arabic)}`):''}</p><div class="assessment-quiz-actions">${answer?`<button type="button" class="primary" data-assessment-action="next" aria-describedby="assessment-feedback">${index===questions.length-1?'اعرض النتيجة':'السؤال التالي ←'}</button>`:'<button type="button" class="secondary" data-assessment-action="skip">لا أعرف / تخطَّ</button>'}<button type="button" class="assessment-cancel" data-assessment-action="cancel">أنهِ المحاولة دون حفظ</button></div><p class="assessment-hint">نقيس التعرّف على المعنى في هذه العيّنة، وليس القدرة على استعمال الكلمة في كل سياق.</p>`;
      } else if (phase==='result') {
        html+=resultHtml(latest)+`<button type="button" class="primary assessment-start" data-assessment-action="start">اختبار جديد بعيّنة أخرى</button><button type="button" class="secondary" data-assessment-action="overview">العودة لتغطية مفرداتي</button><p class="assessment-hint">تبقى قائمتك كما هي. هذه النتيجة لا تضيف كلمات متعلّمة أو نقاط تقدّم تلقائيًا.</p>`;
      }
      container.innerHTML=html+'</section>';
    }
    async function start() {
      if (typeof model.loadLevel!=='function') {error='تعذّر الوصول إلى مكتبة الكلمات. أعد تحميل الموقع وحاول مرة أخرى.';phase='error';render();return;}
      const run=++generation;phase='loading';error='';render();
      const learnedAtStart=new Set(learned),savedAtStart=new Set(saved);
      try {
        const lists=await Promise.all(LEVELS.map(level=>model.loadLevel(level)));
        if (destroyed || run!==generation) return;
        const pools=Object.fromEntries(LEVELS.map((level,i)=>[level,Array.isArray(lists[i])?lists[i]:[]]));
        questions=makeQuestions(pools,learnedAtStart,savedAtStart,latest?.records||[]);
        if (questions.length!==25) throw new Error('تعذّر إعداد الأسئلة الخمسة والعشرين. حاول مرة أخرى.');
        records=[];index=0;answer=null;phase='quiz';render();find('.assessment-word')?.scrollIntoView({block:'nearest'});
      } catch (cause) {if(destroyed || run!==generation)return;error=cause?.message||'تعذّر تحميل كلمات الاختبار. حاول مرة أخرى.';phase='error';render();}
    }
    function answerQuestion(option, skipped=false) {
      if (phase!=='quiz' || answer) return;
      const question=questions[index],correct=!skipped&&String(question.options[option]?.id)===String(question.word.id);
      answer={option,correct,skipped};
      records.push({id:question.word.id,level:question.level,known:question.known,saved:question.saved,correct,skipped});
      render();find('[data-assessment-action="next"]')?.focus({preventScroll:true});
    }
    function next() {
      if (phase!=='quiz' || !answer) return;
      if (index===questions.length-1) {
        latest=summarize(records,now().toISOString());phase='result';
        try {localStorage.setItem(STORAGE,JSON.stringify(latest));}catch{}
        render();find('.assessment-result-heading')?.scrollIntoView({block:'nearest'});return;
      }
      index++;answer=null;render();find('[data-assessment-answer]')?.focus({preventScroll:true});
    }
    function onClick(event) {
      const option=event.target.closest('[data-assessment-answer]');
      if (option && container.contains(option)) {answerQuestion(+option.dataset.assessmentAnswer);return;}
      const button=event.target.closest('[data-assessment-action]');
      if (!button || !container.contains(button)) return;
      const action=button.dataset.assessmentAction;
      if (action==='start') start();
      else if (action==='cancel' || action==='overview') {generation++;phase='intro';questions=[];records=[];answer=null;error='';render();find('[data-assessment-action="start"]')?.focus({preventScroll:true});}
      else if (action==='skip') answerQuestion(-1,true);
      else if (action==='next') next();
      else if (action==='listen' && phase==='quiz' && typeof model.speak==='function') model.speak(`${questions[index].word.article||''} ${questions[index].word.german}`.trim(),button);
    }
    function update(nextModel={}) {if(destroyed)return;model={...model,...nextModel};learned=ids(model.learnedIds);saved=ids(model.savedIds);if(phase!=='quiz'&&phase!=='loading')render();}
    function destroy() {if(destroyed)return;destroyed=true;generation++;container.removeEventListener('click',onClick);mounted.delete(container);}
    const api={update,destroy};mounted.set(container,api);container.addEventListener('click',onClick);render();return api;
  }
  globalThis.WORT_ASSESSMENT=Object.freeze({mount});
})();
