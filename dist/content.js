/* Normalize curriculum data while preserving every legacy German card ID. */
(function(global){
 'use strict';
 const course=global.WORT_COURSE,{native,target}=course;
 const i18n=global.WORT_I18N;
 const rows={
  'تعذّر تحميل محتوى المنهاج. حاول مرة أخرى.':['The course content could not be loaded. Please try again.','De cursusinhoud kon niet worden geladen. Probeer het opnieuw.','Die Kursinhalte konnten nicht geladen werden. Bitte erneut versuchen.'],
  'لم تتوفر ترجمة لهذه الكلمة بعد.':['A translation for this word is not available yet.','Er is nog geen vertaling voor dit woord beschikbaar.','Für dieses Wort ist noch keine Übersetzung verfügbar.'],
  'أقسام تعليمية تقريبية من A1 إلى C1؛ ليست قوائم امتحان رسمية.':['Approximate learning groups from A1 to C1; these are not official exam lists.','Benaderende leergroepen van A1 tot C1; dit zijn geen officiële examenlijsten.','Ungefähre Lerngruppen von A1 bis C1; keine offiziellen Prüfungslisten.'],
  '{level} · {count} مفردة':['{level} · {count} words','{level} · {count} woorden','{level} · {count} Wörter'],
  'النطق متاح باللغة التي تتعلّمها. التقدّم والمحفوظات محفوظة محليًا لكل لغة؛ وقت الاستخدام إجمالي للموقع.':['Pronunciation uses the language you are learning. Progress and saved words are stored locally for each language; usage time covers the whole site.','De uitspraak gebruikt de taal die je leert. Voortgang en opgeslagen woorden worden lokaal per taal bewaard; de gebruikstijd geldt voor de hele website.','Die Aussprache verwendet deine Lernsprache. Fortschritt und gespeicherte Wörter werden lokal je Sprache gespeichert; die Nutzungszeit gilt für die gesamte Website.']
 };
 for(const [n,lang] of ['en','nl','de'].entries())i18n.add({[lang]:Object.fromEntries(Object.entries(rows).map(([key,values])=>[key,values[n]]))});
 const grammarNotes={
 'في معنى الطقس يُستعمل هذا الفعل مع es فقط؛ الشرطات تعني أن الشخص غير مستعمل في هذا المعنى.':['For weather, this verb is used only with es. Dashes indicate persons not used in this meaning.','Voor weer wordt dit werkwoord alleen met es gebruikt. Streepjes geven aan welke personen hier niet worden gebruikt.','Bei Wetterangaben wird dieses Verb nur mit es verwendet. Striche kennzeichnen Personen, die in dieser Bedeutung nicht gebraucht werden.'],
 'في معنى حدوث الشيء يُستعمل الفعل عادةً مع الغائب المفرد أو الجمع.':['When it means that something happens, this verb normally takes a third-person singular or plural subject.','In de betekenis dat iets gebeurt, wordt dit werkwoord meestal in de derde persoon enkelvoud of meervoud gebruikt.','In der Bedeutung des Geschehens steht dieses Verb gewöhnlich in der dritten Person Singular oder Plural.'],
 'في هذا المعنى الفعل انعكاسي: sich ereignen.':['In this meaning the verb is reflexive: sich ereignen.','In deze betekenis is het werkwoord wederkerend: sich ereignen.','In dieser Bedeutung ist das Verb reflexiv: sich ereignen.'],
 'قد يُستعمل haben أو sein مع هذا الفعل بحسب المعنى؛ يعرض الجدول هنا الاستعمال الأول في المصدر.':['Depending on its meaning, this verb may use haben or sein. The table shows the first usage in the source.','Afhankelijk van de betekenis kan dit werkwoord haben of sein gebruiken. De tabel toont het eerste gebruik uit de bron.','Je nach Bedeutung kann dieses Verb mit haben oder sein stehen. Die Tabelle zeigt die erste Verwendung aus der Quelle.'],
 'مع فعلٍ آخر قد يُستعمل المصدر البديل في الماضي المركّب؛ يعرض الجدول الصيغة المستقلة للفعل.':['With another verb, the perfect may use a substitute infinitive. The table shows the verb used on its own.','Met een ander werkwoord kan de voltooide tijd een vervangende infinitief gebruiken. De tabel toont het zelfstandige gebruik.','Mit einem weiteren Verb kann im Perfekt der Ersatzinfinitiv stehen. Die Tabelle zeigt den selbstständigen Gebrauch.'],
 'هذا هو الاستعمال غير المتعدّي: فزع. الفعل المتعدّي بمعنى أخاف له erschreckte / erschreckt.':['This is the intransitive meaning: to be startled. The transitive meaning, to frighten, uses erschreckte / erschreckt.','Dit is het onovergankelijke gebruik: schrikken. Het overgankelijke laten schrikken heeft erschreckte / erschreckt.','Dies ist der intransitive Gebrauch: erschrecken. Das transitive Verb hat die Formen erschreckte / erschreckt.'],
 'هذا هو الاستعمال غير المتعدّي: كان معلّقًا. الفعل المتعدّي له hängte / gehängt.':['This is the intransitive meaning: to hang. The transitive verb uses hängte / gehängt.','Dit is het onovergankelijke gebruik: hangen. Het overgankelijke werkwoord heeft hängte / gehängt.','Dies ist der intransitive Gebrauch: hängen. Das transitive Verb hat die Formen hängte / gehängt.']
 };
 for(const [n,lang] of ['en','nl','de'].entries())i18n.add({[lang]:Object.fromEntries(Object.entries(grammarNotes).map(([key,values])=>[key,values[n]]))});
 const files=new Map();let activeManifest=null,supplement=null;
 const text=value=>Array.isArray(value)?value.filter(Boolean).join('؛ '):typeof value==='string'?value.trim():'';
 async function json(path){if(files.has(path))return files.get(path);const pending=fetch(path).then(async response=>{if(!response.ok)throw new Error(i18n.t('تعذّر تحميل محتوى المنهاج. حاول مرة أخرى.'));return response.json()}).catch(error=>{files.delete(path);throw error});files.set(path,pending);return pending;}
 async function manifest(){
  const base=await json('data/manifest.json');
  const selected=target==='de'?base:await json('data/courses/'+target+'/manifest.json');
  const total=selected.levels.reduce((sum,level)=>sum+Number(level.count||0),0);
  activeManifest={...base,...selected,target,total,levels:selected.levels.map(level=>({...level})),levelNote:target==='de'&&native==='ar'?base.levelNote:i18n.t('أقسام تعليمية تقريبية من A1 إلى C1؛ ليست قوائم امتحان رسمية.')};
  activeManifest.shields=(selected.shields||base.shields).map(shield=>({...shield,name:i18n.t(shield.name),threshold:target==='de'?shield.threshold:Math.max(1,Math.round(shield.threshold*total/10000))}));
  return activeManifest;
 }
 async function germanSupplement(){if(native==='ar')return {};if(supplement)return supplement;supplement=await json('data/courses/de/translations.json');return supplement.cards||supplement.translations||supplement;}
 function normalize(raw,extra={}){
  const terms=raw.texts||raw.translations||{},extras=extra.texts||extra.translations||extra;
  const legacy=target==='de'&&typeof raw.german==='string';
  const term=text(terms[target])||(legacy?raw.german:text(raw.term||raw.word||raw.text));
  const meaning=text(terms[native])||text(extras[native])||(legacy&&native==='ar'?raw.arabic:'');
  const examples=(raw.examples||[]).map((example,index)=>{
   const values=example.texts||example.translations||{},translated=extra.examples?.[index]||{},translatedValues=translated.texts||translated;
   const de=text(values[target])||(legacy?text(example.de):text(example.text||example.target));
   const ar=text(values[native])||text(translatedValues[native])||(legacy&&native==='ar'?text(example.ar):'');
   return de&&ar?{...example,de,ar}:null;
  }).filter(Boolean);
  const grammar=raw.grammar?.[target]||raw.grammar||{};
  return {...raw,id:raw.id,level:raw.level,german:term,arabic:meaning||i18n.t('لم تتوفر ترجمة لهذه الكلمة بعد.'),lemma:text(raw.lemmas?.[target])||(legacy?raw.lemma:term),article:text(raw.articles?.[target])||(legacy?raw.article:text(raw.article)),plural:text(raw.plurals?.[target])||(legacy?raw.plural:text(grammar.plural)),pos:raw.pos||'other',examples,grammar,targetLang:target,nativeLang:native,translationAvailable:Boolean(meaning)};
 }
 async function loadLevel(code,model=activeManifest){
  if(!model)model=await manifest();const level=model.levels.find(level=>level.code===code);if(!level)throw new Error(i18n.t('تعذّر تحميل محتوى المنهاج. حاول مرة أخرى.'));
  const data=await json(level.data||'data/'+code+'.json'),rows=Array.isArray(data)?data:data.cards;
  if(!Array.isArray(rows))throw new Error(i18n.t('تعذّر تحميل محتوى المنهاج. حاول مرة أخرى.'));
  const extra=target==='de'?await germanSupplement():{};
  return rows.map(raw=>normalize(raw,extra[String(raw.id)]||{}));
 }
 global.WORT_CONTENT=Object.freeze({manifest,loadLevel,normalize});
})(globalThis);
