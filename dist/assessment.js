/* Vocabulary recognition check. This is not a CEFR language certification. */
(() => {
  'use strict';

  const languageCourse=globalThis.WORT_COURSE||{};
  const nativeLanguage=languageCourse.native||'ar', locale=languageCourse.locale||nativeLanguage;
  const targetLanguage=languageCourse.target||'de';
  const languageDirection=code=>languageCourse.dir?.(code)||(code==='ar'?'rtl':'ltr');
  const translationRows=[["لا تتوفر كلمات كافية لإعداد أسئلة {level}. حاول مرة أخرى لاحقًا.","There are not enough words to prepare {level} questions. Please try again later.","Er zijn niet genoeg woorden om vragen voor {level} te maken. Probeer het later opnieuw.","Für Fragen zu {level} stehen nicht genügend Wörter bereit. Versuche es später erneut."],["تعذّر إعداد خيارات مختلفة للاختبار. حاول مرة أخرى.","Could not prepare distinct answer choices. Please try again.","Er konden geen verschillende antwoordopties worden gemaakt. Probeer het opnieuw.","Es konnten keine unterschiedlichen Antwortmöglichkeiten erstellt werden. Versuche es erneut."],["علّمتها كمتعلّمة","Marked as learned","Gemarkeerd als geleerd","Als gelernt markiert"],["في قائمة الحفظ","Saved words","Opgeslagen woorden","Gespeicherte Wörter"],["تغطية مجموعات المفردات من A1 إلى C1","Vocabulary coverage from A1 to C1","Woordenschatdekking van A1 tot C1","Wortschatzabdeckung von A1 bis C1"],["{count} من {total} بطاقة","{count} of {total} cards","{count} van {total} kaarten","{count} von {total} Karten"],["المفردات المعلّمة كمتعلّمة في {level}","Words marked as learned in {level}","Woorden gemarkeerd als geleerd in {level}","Als gelernt markierte Wörter in {level}"],["هذه تغطية لقائمتك، وليست حكمًا على إتقان اللغة. الكلمات المحفوظة بالنجمة لا تُحتسب تلقائيًا ككلمات متقنة.","This shows the coverage of your list, not your language proficiency. Starred words are not automatically counted as mastered.","Dit toont de dekking van je lijst, niet je taalvaardigheid. Woorden met een ster tellen niet automatisch als beheerst.","Dies zeigt die Abdeckung deiner Liste, nicht deine Sprachbeherrschung. Mit einem Stern gespeicherte Wörter zählen nicht automatisch als beherrscht."],["آخر محاولة محفوظة","Last saved attempt","Laatste opgeslagen poging","Letzter gespeicherter Versuch"],["بداية A1","Starting A1","Begin A1","Einstieg A1"],["نتيجة اختبار المفردات","Vocabulary check result","Resultaat woordenschattoets","Ergebnis des Wortschatztests"],["مؤشر التعرّف على المفردات","Vocabulary recognition indicator","Indicatie woordherkenning","Hinweis zur Worterkennung"],["أعلى مجموعة متتابعة أجبت عن أربعة أسئلة من خمسة فيها على الأقل هي {level}.","The highest consecutive group in which you answered at least four out of five questions correctly is {level}.","De hoogste aaneengesloten groep waarin je minstens vier van de vijf vragen goed had, is {level}.","Die höchste aufeinanderfolgende Gruppe, in der du mindestens vier von fünf Fragen richtig beantwortet hast, ist {level}."],["لم تبلغ أربعة أجوبة صحيحة من خمسة في مجموعة A1 بهذه العيّنة. ابدأ بتثبيت أساسياتها.","You did not reach four correct answers out of five in the A1 group in this sample. Start by strengthening those basics.","In deze steekproef had je in de A1-groep geen vier van de vijf antwoorden goed. Begin met het versterken van die basis.","In dieser Stichprobe hast du in der Gruppe A1 nicht vier von fünf Antworten erreicht. Festige zunächst diese Grundlagen."],["في هذه العيّنة","in this sample","in deze steekproef","in dieser Stichprobe"],["كلمات علّمتها كمتعلّمة:","Words marked as learned:","Woorden gemarkeerd als geleerd:","Als gelernt markierte Wörter:"],["{correct} من {total} صحيحة","{correct} of {total} correct","{correct} van {total} goed","{correct} von {total} richtig"],["لم توجد كلمات معلّمة كمتعلّمة في هذه العيّنة.","There were no words marked as learned in this sample.","Deze steekproef bevatte geen woorden die als geleerd zijn gemarkeerd.","Diese Stichprobe enthielt keine als gelernt markierten Wörter."],["كلمات أخرى:","Other words:","Andere woorden:","Andere Wörter:"],["لم توجد كلمات أخرى في هذه العيّنة.","There were no other words in this sample.","Deze steekproef bevatte geen andere woorden.","Diese Stichprobe enthielt keine anderen Wörter."],["خطوتك التالية: راجع أخطاء هذه العيّنة وركّز على مجموعة {level} مع استخدام الكلمات داخل جمل.","Next, review the mistakes in this sample and focus on group {level}, using the words in sentences.","Herhaal nu de fouten uit deze steekproef en richt je op groep {level}, waarbij je de woorden in zinnen gebruikt.","Wiederhole als Nächstes die Fehler dieser Stichprobe und konzentriere dich auf Gruppe {level}. Verwende die Wörter dabei in Sätzen."],["واصل توسيع استعمال المفردات في نصوص ومحادثات، وليس التعرّف على معناها فقط.","Keep expanding how you use vocabulary in texts and conversations, as well as recognizing its meaning.","Blijf je woordgebruik in teksten en gesprekken uitbreiden, naast het herkennen van betekenissen.","Erweitere weiter deinen Wortgebrauch in Texten und Gesprächen und nicht nur das Erkennen von Bedeutungen."],["هذا مؤشر تقريبي من {count} سؤالًا على مجموعات تعليمية تقريبية. لا يقيس المحادثة أو الكتابة أو الاستماع، ولا يمنح مستوى CEFR رسميًا.","This is an approximate indicator from {count} questions across approximate learning groups. It does not assess speaking, writing or listening and does not award an official CEFR level.","Dit is een globale indicatie op basis van {count} vragen over globale leergroepen. Spreken, schrijven en luisteren worden niet getoetst en dit geeft geen officieel ERK-niveau.","Dies ist ein ungefährer Hinweis aus {count} Fragen zu ungefähren Lerngruppen. Sprechen, Schreiben und Hören werden nicht geprüft; es wird kein offizielles GER-Niveau vergeben."],["تحقّق ممّا تتذكّره","Check what you remember","Kijk wat je onthoudt","Prüfe, woran du dich erinnerst"],["مؤشر مستواك في المفردات","Your vocabulary indicator","Je woordenschatindicatie","Dein Wortschatzindikator"],["حفظ الكلمات وحده لا يكفي لتحديد مستواك اللغوي الكامل. اختبر التعرّف على معانيها لتحصل على مؤشر أوضح من عدد البطاقات فقط.","Memorizing words alone cannot determine your overall language level. Check how well you recognize their meanings for a clearer indicator than the card count alone.","Alleen woorden onthouden bepaalt niet je volledige taalniveau. Toets hoe goed je hun betekenissen herkent voor een duidelijkere indicatie dan alleen het aantal kaarten.","Wörter auswendig zu lernen bestimmt noch nicht dein gesamtes Sprachniveau. Prüfe, wie gut du ihre Bedeutungen erkennst, um einen klareren Hinweis als nur die Kartenanzahl zu erhalten."],["لم تُسجَّل محاولة تحقق بعد؛ لن نحوّل عدد الكلمات وحده إلى مستوى لغوي.","No check has been saved yet; the word count alone will not be converted into a language level.","Er is nog geen toets opgeslagen; alleen het aantal woorden wordt niet omgezet in een taalniveau.","Es wurde noch kein Test gespeichert; die reine Wortanzahl wird nicht in ein Sprachniveau umgerechnet."],["حاول بدء الاختبار مجددًا","Try starting the check again","Probeer de toets opnieuw te starten","Test erneut starten"],["اختبر مفرداتك","Check your vocabulary","Toets je woordenschat","Wortschatz prüfen"],["٢٥ سؤالًا، خمسة لكل مجموعة. نخلط كلمات علّمتها كمتعلّمة مع كلمات أخرى حين تتوفر. لا نغيّر قوائمك أو تقدّمك تلقائيًا.","25 questions, five per group. Where available, words marked as learned are mixed with other words. Your lists and progress are not changed automatically.","25 vragen, vijf per groep. Waar mogelijk combineren we woorden die als geleerd zijn gemarkeerd met andere woorden. Je lijsten en voortgang worden niet automatisch gewijzigd.","25 Fragen, fünf je Gruppe. Soweit verfügbar werden als gelernt markierte Wörter mit anderen Wörtern gemischt. Deine Listen und dein Fortschritt werden nicht automatisch verändert."],["جارٍ إعداد عيّنة الكلمات من المستويات الخمسة…","Preparing words from the five levels…","Woorden uit de vijf niveaus worden voorbereid…","Wörter aus den fünf Niveaus werden vorbereitet…"],["إلغاء","Cancel","Annuleren","Abbrechen"],["السؤال {current} من {total}","Question {current} of {total}","Vraag {current} van {total}","Frage {current} von {total}"],["الأسئلة المجابة","Questions answered","Beantwoorde vragen","Beantwortete Fragen"],["اختر أقرب معنى للكلمة:","Choose the closest meaning:","Kies de meest passende betekenis:","Wähle die passendste Bedeutung:"],["استمع ♬","Listen ♬","Luisteren ♬","Anhören ♬"],["اختر معنى الكلمة المعروضة","Choose the meaning of the displayed word","Kies de betekenis van het getoonde woord","Bedeutung des angezeigten Wortes auswählen"],["تخطّيت السؤال. المعنى: {meaning}","Question skipped. Meaning: {meaning}","Vraag overgeslagen. Betekenis: {meaning}","Frage übersprungen. Bedeutung: {meaning}"],["إجابة صحيحة.","Correct answer.","Goed antwoord.","Richtige Antwort."],["المعنى الصحيح: {meaning}","Correct meaning: {meaning}","Juiste betekenis: {meaning}","Richtige Bedeutung: {meaning}"],["اعرض النتيجة","Show result","Toon resultaat","Ergebnis anzeigen"],["السؤال التالي ←","Next question →","Volgende vraag →","Nächste Frage →"],["لا أعرف / تخطَّ","I don't know / Skip","Ik weet het niet / Overslaan","Weiß ich nicht / Überspringen"],["أنهِ المحاولة دون حفظ","End attempt without saving","Poging beëindigen zonder opslaan","Versuch ohne Speichern beenden"],["نقيس التعرّف على المعنى في هذه العيّنة، وليس القدرة على استعمال الكلمة في كل سياق.","This sample measures recognition of meaning, not the ability to use each word in every context.","Deze steekproef meet het herkennen van betekenissen, niet of je elk woord in iedere context kunt gebruiken.","Diese Stichprobe misst das Erkennen von Bedeutungen, nicht die Fähigkeit, jedes Wort in jedem Zusammenhang zu verwenden."],["اختبار جديد بعيّنة أخرى","New check with another sample","Nieuwe toets met een andere steekproef","Neuer Test mit anderer Stichprobe"],["العودة لتغطية مفرداتي","Back to vocabulary coverage","Terug naar woordenschatdekking","Zurück zur Wortschatzabdeckung"],["تبقى قائمتك كما هي. هذه النتيجة لا تضيف كلمات متعلّمة أو نقاط تقدّم تلقائيًا.","Your list stays unchanged. This result does not automatically add learned words or progress points.","Je lijst blijft ongewijzigd. Dit resultaat voegt niet automatisch geleerde woorden of voortgangspunten toe.","Deine Liste bleibt unverändert. Dieses Ergebnis fügt nicht automatisch gelernte Wörter oder Fortschrittspunkte hinzu."],["تعذّر الوصول إلى مكتبة الكلمات. أعد تحميل الموقع وحاول مرة أخرى.","Could not access the vocabulary library. Reload the site and try again.","De woordenbibliotheek is niet bereikbaar. Laad de site opnieuw en probeer het nog eens.","Die Wörterbibliothek ist nicht erreichbar. Lade die Website neu und versuche es erneut."],["تعذّر إعداد الأسئلة الخمسة والعشرين. حاول مرة أخرى.","Could not prepare all 25 questions. Please try again.","Niet alle 25 vragen konden worden gemaakt. Probeer het opnieuw.","Die 25 Fragen konnten nicht vorbereitet werden. Versuche es erneut."],["تعذّر تحميل كلمات الاختبار. حاول مرة أخرى.","Could not load the words for the check. Please try again.","De woorden voor de toets konden niet worden geladen. Probeer het opnieuw.","Die Wörter für den Test konnten nicht geladen werden. Versuche es erneut."]];
  const translationCatalog={en:{},nl:{},de:{}};
  for(const [source,en,nl,de] of translationRows){translationCatalog.en[source]=en;translationCatalog.nl[source]=nl;translationCatalog.de[source]=de;}
  globalThis.WORT_I18N?.add(translationCatalog);
  function tr(source,params={}){
    if(globalThis.WORT_I18N?.t)return globalThis.WORT_I18N.t(source,params);
    const value=nativeLanguage==='ar'?source:(translationCatalog[nativeLanguage]?.[source]||source);
    return value.replace(/\{(\w+)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):match);
  }
  const LEVELS = ['A1','A2','B1','B2','C1'];
  const STORAGE = languageCourse.pairKey?.('wort-assessment-v1')||'wort-assessment-v1';
  const mounted = new WeakMap();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalized = value => String(value ?? '').normalize('NFC').toLocaleLowerCase().trim();
  const normalizeMeaning = value => nativeLanguage==='ar'?normalized(value).replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا'):normalized(value);
  const ignoredMeaningWords=new Set(({ar:[],en:['the','a','an'],nl:['de','het','een'],de:['der','die','das','ein','eine']})[nativeLanguage]||[]);
  const meaningTokens=value=>value.split(/[^\p{L}]+/u).map(part=>nativeLanguage==='ar'?part.replace(/^ال/,''):part).filter(part=>part.length>=3&&!ignoredMeaningWords.has(part));
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
      if (pool.length<5 || new Set(pool.map(word=>normalizeMeaning(word.arabic))).size<4) throw new Error(tr('لا تتوفر كلمات كافية لإعداد أسئلة {level}. حاول مرة أخرى لاحقًا.',{level}));
      const known=pool.filter(word=>learned.has(String(word.id)));
      const other=pool.filter(word=>!learned.has(String(word.id)));
      const picked=[...take(known,2),...take(other,3)];
      const selected=new Set(picked.map(word=>String(word.id)));
      if (picked.length<5) picked.push(...take(pool.filter(word=>!selected.has(String(word.id))),5-picked.length));
      return shuffle(picked).map(word => {
        const correctText=normalizeMeaning(word.arabic);
        const correctTokens=new Set(meaningTokens(correctText));
        const byMeaning=new Map();
        for (const option of shuffle(pool)) {
          const text=normalizeMeaning(option.arabic);
          if (text===correctText || String(option.id)===String(word.id)) continue;
          const tokens=meaningTokens(text);
          const overlaps=tokens.some(part=>correctTokens.has(part));
          if (!byMeaning.has(text)) byMeaning.set(text,{word:option,overlaps});
        }
        const candidates=[...byMeaning.values()].sort((a,b)=>Number(a.overlaps)-Number(b.overlaps));
        const samePos=candidates.filter(candidate=>candidate.word.pos===word.pos);
        const different=candidates.filter(candidate=>candidate.word.pos!==word.pos);
        const distractors=[...samePos.filter(candidate=>!candidate.overlaps),...different.filter(candidate=>!candidate.overlaps),...samePos.filter(candidate=>candidate.overlaps),...different.filter(candidate=>candidate.overlaps)].slice(0,3).map(candidate=>candidate.word);
        if (distractors.length!==3) throw new Error(tr('تعذّر إعداد خيارات مختلفة للاختبار. حاول مرة أخرى.'));
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
    const n = value => Number(value).toLocaleString(locale);
    function coverageHtml() {
      const counts=Object.fromEntries(LEVELS.map(level=>[level,0]));
      learned.forEach(id=>{const level=levelForId(id);if(level)counts[level]++;});
      return `<div class="assessment-overview"><div><strong>${n(learned.size)}</strong><span>${esc(tr('علّمتها كمتعلّمة'))}</span></div><div><strong>${n(saved.size)}</strong><span>${esc(tr('في قائمة الحفظ'))}</span></div></div><details class="assessment-coverage"><summary>${esc(tr('تغطية مجموعات المفردات من A1 إلى C1'))}</summary><div>${LEVELS.map(level=>{
        const configured=Number(model.levelCounts?.[level]),total=Number.isFinite(configured)&&configured>=0?configured:2000,count=Math.min(counts[level],total);
        return `<div class="assessment-coverage-row"><div><b dir="ltr">${level}</b><span>${esc(tr('{count} من {total} بطاقة',{count:n(count),total:n(total)}))}</span></div><div class="assessment-track" role="progressbar" aria-label="${esc(tr('المفردات المعلّمة كمتعلّمة في {level}',{level}))}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}"><i style="width:${total?count/total*100:0}%"></i></div></div>`;
      }).join('')}</div><p>${esc(tr('هذه تغطية لقائمتك، وليست حكمًا على إتقان اللغة. الكلمات المحفوظة بالنجمة لا تُحتسب تلقائيًا ككلمات متقنة.'))}</p></details>`;
    }
    function resultHtml(result, compact = false) {
      const date=new Date(result.completedAt),dateLabel=Number.isNaN(date.getTime())?tr('آخر محاولة محفوظة'):date.toLocaleDateString(locale,{year:'numeric',month:'short',day:'numeric'});
      const label=result.level||tr('بداية A1'),next=result.level?LEVELS[LEVELS.indexOf(result.level)+1]:'A1';
      return `<section class="assessment-result ${compact?'assessment-last-result':''}" aria-label="${esc(tr('نتيجة اختبار المفردات'))}"><div class="assessment-result-heading"><div><p>${esc(tr('مؤشر التعرّف على المفردات'))}</p><strong dir="${result.level?'ltr':languageDirection(nativeLanguage)}">${esc(label)}</strong></div><div><b dir="ltr">${n(result.correct)} / ${n(result.total)}</b><small>${esc(dateLabel)}</small></div></div><p>${esc(result.level?tr('أعلى مجموعة متتابعة أجبت عن أربعة أسئلة من خمسة فيها على الأقل هي {level}.',{level:result.level}):tr('لم تبلغ أربعة أجوبة صحيحة من خمسة في مجموعة A1 بهذه العيّنة. ابدأ بتثبيت أساسياتها.'))}</p>${compact?'':`<div class="assessment-score-grid">${LEVELS.map(level=>`<div class="${result.scores[level].correct>=4?'is-passed':''}"><strong dir="ltr">${level}</strong><span dir="ltr">${n(result.scores[level].correct)} / ${n(result.scores[level].total)}</span><small>${esc(tr('في هذه العيّنة'))}</small></div>`).join('')}</div><div class="assessment-retention"><p><b>${esc(tr('كلمات علّمتها كمتعلّمة:'))}</b> ${esc(result.known.total?tr('{correct} من {total} صحيحة',{correct:n(result.known.correct),total:n(result.known.total)}):tr('لم توجد كلمات معلّمة كمتعلّمة في هذه العيّنة.'))}</p><p><b>${esc(tr('كلمات أخرى:'))}</b> ${esc(result.other.total?tr('{correct} من {total} صحيحة',{correct:n(result.other.correct),total:n(result.other.total)}):tr('لم توجد كلمات أخرى في هذه العيّنة.'))}</p></div><p class="assessment-recommendation">${esc(next?tr('خطوتك التالية: راجع أخطاء هذه العيّنة وركّز على مجموعة {level} مع استخدام الكلمات داخل جمل.',{level:next}):tr('واصل توسيع استعمال المفردات في نصوص ومحادثات، وليس التعرّف على معناها فقط.'))}</p>`}<p class="assessment-limit">${esc(tr('هذا مؤشر تقريبي من {count} سؤالًا على مجموعات تعليمية تقريبية. لا يقيس المحادثة أو الكتابة أو الاستماع، ولا يمنح مستوى CEFR رسميًا.',{count:n(result.total)}))}</p></section>`;
    }
    function render() {
      if(destroyed)return;
      let html=`<section class="assessment-widget" aria-labelledby="assessment-title"><header class="assessment-heading"><div><span class="assessment-eyebrow">${esc(tr('تحقّق ممّا تتذكّره'))}</span><h2 id="assessment-title">${esc(tr('مؤشر مستواك في المفردات'))}</h2></div><span class="assessment-tag">A1–C1</span></header>`;
      if(phase==='intro'||phase==='error'){
        html+=`<p class="assessment-intro">${esc(tr('حفظ الكلمات وحده لا يكفي لتحديد مستواك اللغوي الكامل. اختبر التعرّف على معانيها لتحصل على مؤشر أوضح من عدد البطاقات فقط.'))}</p>${coverageHtml()}${latest?resultHtml(latest,true):`<p class="assessment-no-result">${esc(tr('لم تُسجَّل محاولة تحقق بعد؛ لن نحوّل عدد الكلمات وحده إلى مستوى لغوي.'))}</p>`}${error?`<p class="assessment-error" role="alert">${esc(error)}</p>`:''}<button type="button" class="primary assessment-start" data-assessment-action="start">${esc(tr(phase==='error'?'حاول بدء الاختبار مجددًا':'اختبر مفرداتك'))}</button><p class="assessment-hint">${esc(tr('٢٥ سؤالًا، خمسة لكل مجموعة. نخلط كلمات علّمتها كمتعلّمة مع كلمات أخرى حين تتوفر. لا نغيّر قوائمك أو تقدّمك تلقائيًا.'))}</p>`;
      }else if(phase==='loading'){
        html+=`<div class="assessment-loading" role="status"><span class="assessment-spinner" aria-hidden="true"></span><p>${esc(tr('جارٍ إعداد عيّنة الكلمات من المستويات الخمسة…'))}</p></div><button type="button" class="secondary" data-assessment-action="cancel">${esc(tr('إلغاء'))}</button>`;
      }else if(phase==='quiz'){
        const question=questions[index],completed=index+(answer?1:0),word=question.word;
        html+=`<div class="assessment-quiz-meta"><span>${esc(tr('السؤال {current} من {total}',{current:n(index+1),total:n(questions.length)}))}</span><b dir="ltr">${question.level}</b></div><div class="assessment-track" role="progressbar" aria-label="${esc(tr('الأسئلة المجابة'))}" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${completed}"><i style="width:${completed/questions.length*100}%"></i></div><p class="assessment-question">${esc(tr('اختر أقرب معنى للكلمة:'))}</p><div id="assessment-word" class="assessment-word" lang="${targetLanguage}" dir="${languageDirection(targetLanguage)}">${word.article?`<span data-article="${esc(word.article.toLocaleLowerCase())}">${esc(word.article)}</span> `:''}${esc(word.german)}</div>${typeof model.speak==='function'?`<button type="button" class="secondary assessment-listen" data-assessment-action="listen">${esc(tr('استمع ♬'))}</button>`:''}<div class="assessment-options" role="group" aria-describedby="assessment-word" aria-label="${esc(tr('اختر معنى الكلمة المعروضة'))}">${question.options.map((option,optionIndex)=>`<button type="button" lang="${nativeLanguage}" dir="${languageDirection(nativeLanguage)}" data-assessment-answer="${optionIndex}" ${answer?'disabled':''} class="${answer&&String(option.id)===String(word.id)?'is-correct':''} ${answer&&answer.option===optionIndex&&!answer.correct?'is-incorrect':''}">${esc(option.arabic)}</button>`).join('')}</div><p id="assessment-feedback" class="assessment-feedback" role="status" aria-live="polite">${answer?esc(answer.skipped?tr('تخطّيت السؤال. المعنى: {meaning}',{meaning:word.arabic}):answer.correct?tr('إجابة صحيحة.'):tr('المعنى الصحيح: {meaning}',{meaning:word.arabic})):''}</p><div class="assessment-quiz-actions">${answer?`<button type="button" class="primary" data-assessment-action="next" aria-describedby="assessment-feedback">${esc(tr(index===questions.length-1?'اعرض النتيجة':'السؤال التالي ←'))}</button>`:`<button type="button" class="secondary" data-assessment-action="skip">${esc(tr('لا أعرف / تخطَّ'))}</button>`}<button type="button" class="assessment-cancel" data-assessment-action="cancel">${esc(tr('أنهِ المحاولة دون حفظ'))}</button></div><p class="assessment-hint">${esc(tr('نقيس التعرّف على المعنى في هذه العيّنة، وليس القدرة على استعمال الكلمة في كل سياق.'))}</p>`;
      }else if(phase==='result'){
        html+=resultHtml(latest)+`<button type="button" class="primary assessment-start" data-assessment-action="start">${esc(tr('اختبار جديد بعيّنة أخرى'))}</button><button type="button" class="secondary" data-assessment-action="overview">${esc(tr('العودة لتغطية مفرداتي'))}</button><p class="assessment-hint">${esc(tr('تبقى قائمتك كما هي. هذه النتيجة لا تضيف كلمات متعلّمة أو نقاط تقدّم تلقائيًا.'))}</p>`;
      }
      container.innerHTML=html+'</section>';
    }
    async function start() {
      if (typeof model.loadLevel!=='function') {error=tr('تعذّر الوصول إلى مكتبة الكلمات. أعد تحميل الموقع وحاول مرة أخرى.');phase='error';render();return;}
      const run=++generation;phase='loading';error='';render();
      const learnedAtStart=new Set(learned),savedAtStart=new Set(saved);
      try {
        const lists=await Promise.all(LEVELS.map(level=>model.loadLevel(level)));
        if (destroyed || run!==generation) return;
        const pools=Object.fromEntries(LEVELS.map((level,i)=>[level,Array.isArray(lists[i])?lists[i]:[]]));
        questions=makeQuestions(pools,learnedAtStart,savedAtStart,latest?.records||[]);
        if (questions.length!==25) throw new Error(tr('تعذّر إعداد الأسئلة الخمسة والعشرين. حاول مرة أخرى.'));
        records=[];index=0;answer=null;phase='quiz';render();find('.assessment-word')?.scrollIntoView({block:'nearest'});
      } catch (cause) {if(destroyed || run!==generation)return;error=cause?.message||tr('تعذّر تحميل كلمات الاختبار. حاول مرة أخرى.');phase='error';render();}
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
