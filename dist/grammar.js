/* Target-specific teaching paradigms. German morphology remains in verbs.js. */
(function(global){
 'use strict';
 const course=global.WORT_COURSE||{target:'de',native:'ar',dir:code=>code==='ar'?'rtl':'ltr'};
 const i18n=global.WORT_I18N;
 const catalog={
  'تصريف الفعل':['Verb forms','Werkwoordsvormen','Verbformen'],
  'المضارع':['Present','Tegenwoordige tijd','Gegenwart'],
  'الماضي البسيط':['Simple past','Onvoltooid verleden tijd','Einfache Vergangenheit'],
  'المضارع التام':['Present perfect','Voltooide tegenwoordige tijd','Present Perfect'],
  'الماضي':['Past','Verleden tijd','Vergangenheit'],
  'المستقبل':['Future','Toekomende tijd','Zukunft'],
  'زمن تصريف الفعل':['Verb tense','Werkwoordstijd','Zeitform'],
  'الحروف المختلفة عن أصل الفعل ملوّنة؛ تبقى الأفعال المساعدة بلون عادي.':['Letters differing from the verb base are highlighted; auxiliary verbs keep their normal colour.','Letters die afwijken van de werkwoordstam zijn gekleurd; hulpwerkwoorden behouden hun gewone kleur.','Vom Verbstamm abweichende Buchstaben sind hervorgehoben; Hilfsverben behalten ihre normale Farbe.'],
  'يغطي هذا القسم مجموعة محددة من الأفعال الشائعة.':['This section covers a selected set of common verbs.','Dit onderdeel behandelt een selectie veelgebruikte werkwoorden.','Dieser Abschnitt umfasst eine Auswahl häufiger Verben.'],
  'لا يتوفر جدول تصريف موثّق لهذه الكلمة بعد.':['A verified conjugation table is not available for this word yet.','Er is nog geen gecontroleerde vervoegingstabel voor dit woord beschikbaar.','Für dieses Wort liegt noch keine geprüfte Konjugationstabelle vor.'],
  'في الجملة الخبرية الإنجليزية، يأتي الفاعل عادةً قبل الفعل.':['In an English statement, the subject usually comes before the verb.','In een Engelse mededelende zin staat het onderwerp gewoonlijk voor het werkwoord.','In einem englischen Aussagesatz steht das Subjekt normalerweise vor dem Verb.'],
  'في الجملة الهولندية الرئيسية، يأتي الفعل المصرَّف عادةً في الموقع الثاني.':['In a Dutch main clause, the finite verb usually occupies the second position.','In een Nederlandse hoofdzin staat de persoonsvorm gewoonlijk op de tweede plaats.','In einem niederländischen Hauptsatz steht das finite Verb normalerweise an zweiter Stelle.'],
  'تتغيّر صيغة الفعل العربي بحسب الضمير والزمن.':['Arabic verb forms change according to the pronoun and tense.','Arabische werkwoordsvormen veranderen naargelang het voornaamwoord en de tijd.','Arabische Verbformen verändern sich je nach Pronomen und Zeitform.'],
  'معلومات لغوية':['Language notes','Taalaantekeningen','Sprachliche Hinweise'],
  'الجمع':['Plural','Meervoud','Plural'],
  'المقارنة':['Comparative','Vergrotende trap','Komparativ'],
  'التفضيل':['Superlative','Overtreffende trap','Superlativ'],
  'في الإنجليزية، تسبق الصفة الاسم عادةً، ولا تتغيّر بسبب جنس الاسم.':['In English, an adjective usually precedes its noun and does not change with the noun’s gender.','In het Engels staat een bijvoeglijk naamwoord gewoonlijk voor het zelfstandig naamwoord en verandert het niet met het geslacht.','Im Englischen steht ein Adjektiv normalerweise vor seinem Substantiv und verändert sich nicht nach dessen Geschlecht.'],
  'في الهولندية، يتأثر انتهاء الصفة بأداة التعريف ونوع الاسم والسياق.':['In Dutch, an adjective ending depends on the article, noun type and context.','In het Nederlands hangt de uitgang van een bijvoeglijk naamwoord af van het lidwoord, het soort zelfstandig naamwoord en de context.','Im Niederländischen hängt die Adjektivendung vom Artikel, der Art des Substantivs und dem Kontext ab.'],
  'في العربية، تتبع الصفة الاسم عادةً وتوافقه في الإعراب والتعريف والتنكير، مع مراعاة قواعد الجنس والعدد.':['In Arabic, an adjective usually follows its noun and agrees in case and definiteness, with gender and number agreement rules.','In het Arabisch volgt een bijvoeglijk naamwoord gewoonlijk het zelfstandig naamwoord en volgt het de regels voor naamval, bepaaldheid, geslacht en getal.','Im Arabischen folgt ein Adjektiv normalerweise seinem Substantiv und richtet sich nach den Regeln für Kasus, Bestimmtheit, Genus und Numerus.'],
  'أنا':['I','ik','ich'],'أنت (مفرد)':['you (singular)','jij (enkelvoud)','du (Singular)'],'هو / هي / لغير العاقل':['he / she / it','hij / zij / het','er / sie / es'],'نحن':['we','wij','wir'],'أنتم (جمع)':['you (plural)','jullie (meervoud)','ihr (Plural)'],'هم / هن':['they','zij (meervoud)','sie (Plural)'],
  'أنتَ':['you (masculine singular)','jij (mannelijk enkelvoud)','du (männlich, Singular)'],'أنتِ':['you (feminine singular)','jij (vrouwelijk enkelvoud)','du (weiblich, Singular)'],'هو':['he','hij','er'],'هي':['she','zij','sie'],'أنتما':['you two','jullie twee','ihr beide'],'أنتم':['you (masculine plural)','jullie (mannelijk meervoud)','ihr (männlich, Plural)'],'أنتن':['you (feminine plural)','jullie (vrouwelijk meervoud)','ihr (weiblich, Plural)'],'هما (مذكر)':['they two (masculine)','zij twee (mannelijk)','sie beide (männlich)'],'هما (مؤنث)':['they two (feminine)','zij twee (vrouwelijk)','sie beide (weiblich)'],'هم':['they (masculine plural)','zij (mannelijk meervoud)','sie (männlich, Plural)'],'هن':['they (feminine plural)','zij (vrouwelijk meervoud)','sie (weiblich, Plural)']
 };
 for(const [index,language] of ['en','nl','de'].entries())i18n?.add?.({[language]:Object.fromEntries(Object.entries(catalog).map(([key,values])=>[key,values[index]]))});
 const t=value=>i18n?.t?.(value)??value;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=value=>String(value||'').normalize('NFC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,'').trim();
 const entries={en:new Map(),nl:new Map(),ar:new Map()};
 const sixKeys=['أنا','أنت (مفرد)','هو / هي / لغير العاقل','نحن','أنتم (جمع)','هم / هن'];
 const pronouns={en:['I','you','he / she / it','we','you','they'],nl:['ik','jij','hij / zij / het','wij','jullie','zij'],ar:['أنا','أنتَ','أنتِ','هو','هي','نحن','أنتما','أنتم','أنتن','هما (مذكر)','هما (مؤنث)','هم','هن']};
 const tenses={en:[['present','المضارع'],['preterite','الماضي البسيط'],['perfect','المضارع التام']],nl:[['present','المضارع'],['preterite','الماضي البسيط'],['perfect','المضارع التام']],ar:[['present','المضارع'],['past','الماضي'],['future','المستقبل']]};
 function add(language,entry){entries[language].set(normalize(entry.lemma),Object.freeze({...entry,pronouns:pronouns[language],personKeys:language==='ar'?pronouns.ar:sixKeys}));}
 // Each tuple states the actual third-person, past and participle, including irregulars.
 const english=[['have','has','had','had'],['do','does','did','done'],['go','goes','went','gone'],['come','comes','came','come'],['see','sees','saw','seen'],['take','takes','took','taken'],['give','gives','gave','given'],['make','makes','made','made'],['know','knows','knew','known'],['think','thinks','thought','thought'],['say','says','said','said'],['speak','speaks','spoke','spoken'],['write','writes','wrote','written'],['read','reads','read','read'],['eat','eats','ate','eaten'],['drink','drinks','drank','drunk'],['learn','learns','learned','learned'],['work','works','worked','worked'],['play','plays','played','played'],['live','lives','lived','lived'],['want','wants','wanted','wanted'],['need','needs','needed','needed'],['buy','buys','bought','bought'],['find','finds','found','found'],['understand','understands','understood','understood'],['sleep','sleeps','slept','slept'],['run','runs','ran','run']];
 for(const [lemma,third,past,participle] of english)add('en',{lemma,stem:lemma,present:[lemma,lemma,third,lemma,lemma,lemma],preterite:Array(6).fill(past),perfect:['have','have','has','have','have','have'].map(aux=>aux+' '+participle)});
 add('en',{lemma:'be',stem:'be',present:['am','are','is','are','are','are'],preterite:['was','were','was','were','were','were'],perfect:['have','have','has','have','have','have'].map(aux=>aux+' been')});
 const dutch=[
  ['hebben','heb','hebt','heeft','had','hadden','gehad'],['doen','doe','doet','doet','deed','deden','gedaan'],['gaan','ga','gaat','gaat','ging','gingen','gegaan','zijn'],['komen','kom','komt','komt','kwam','kwamen','gekomen','zijn'],['zien','zie','ziet','ziet','zag','zagen','gezien'],['nemen','neem','neemt','neemt','nam','namen','genomen'],['geven','geef','geeft','geeft','gaf','gaven','gegeven'],['maken','maak','maakt','maakt','maakte','maakten','gemaakt'],['weten','weet','weet','weet','wist','wisten','geweten'],['denken','denk','denkt','denkt','dacht','dachten','gedacht'],['zeggen','zeg','zegt','zegt','zei','zeiden','gezegd'],['spreken','spreek','spreekt','spreekt','sprak','spraken','gesproken'],['schrijven','schrijf','schrijft','schrijft','schreef','schreven','geschreven'],['lezen','lees','leest','leest','las','lazen','gelezen'],['eten','eet','eet','eet','at','aten','gegeten'],['drinken','drink','drinkt','drinkt','dronk','dronken','gedronken'],['leren','leer','leert','leert','leerde','leerden','geleerd'],['werken','werk','werkt','werkt','werkte','werkten','gewerkt'],['spelen','speel','speelt','speelt','speelde','speelden','gespeeld'],['wonen','woon','woont','woont','woonde','woonden','gewoond'],['willen','wil','wilt','wil','wilde','wilden','gewild'],['kopen','koop','koopt','koopt','kocht','kochten','gekocht'],['vinden','vind','vindt','vindt','vond','vonden','gevonden'],['begrijpen','begrijp','begrijpt','begrijpt','begreep','begrepen','begrepen'],['slapen','slaap','slaapt','slaapt','sliep','sliepen','geslapen']
 ];
 for(const [lemma,first,second,third,past,pastPlural,participle,auxiliary] of dutch){const aux=auxiliary==='zijn'?['ben','bent','is','zijn','zijn','zijn']:['heb','hebt','heeft','hebben','hebben','hebben'];add('nl',{lemma,stem:first,present:[first,second,third,lemma,lemma,lemma],preterite:[past,past,past,pastPlural,pastPlural,pastPlural],perfect:aux.map(form=>form+' '+participle)});}
 add('nl',{lemma:'zijn',stem:'zijn',present:['ben','bent','is','zijn','zijn','zijn'],preterite:['was','was','was','waren','waren','waren'],perfect:['ben','bent','is','zijn','zijn','zijn'].map(aux=>aux+' geweest')});
 function arabicSound(lemma,presentStem){const past=[lemma+'ت',lemma+'ت',lemma+'ت',lemma,lemma+'ت',lemma+'نا',lemma+'تما',lemma+'تم',lemma+'تن',lemma+'ا',lemma+'تا',lemma+'وا',lemma+'ن'];const present=['أ'+presentStem,'ت'+presentStem,'ت'+presentStem+'ين','ي'+presentStem,'ت'+presentStem,'ن'+presentStem,'ت'+presentStem+'ان','ت'+presentStem+'ون','ت'+presentStem+'ن','ي'+presentStem+'ان','ت'+presentStem+'ان','ي'+presentStem+'ون','ي'+presentStem+'ن'];add('ar',{lemma,stem:lemma,past,present,future:present.map(form=>'س'+form)});}
 for(const lemma of ['كتب','درس','عمل','فهم','فتح','ذهب','شرب','لعب','سكن','دخل','خرج','سمع','شاهد','ساعد','تعلم','تكلم','سافر','بحث','طلب','جلس'])arabicSound(lemma,lemma);
 const arabicIrregular=[
  ['أكل',['أكلت','أكلت','أكلت','أكل','أكلت','أكلنا','أكلتما','أكلتم','أكلتن','أكلا','أكلتا','أكلوا','أكلن'],['آكل','تأكل','تأكلين','يأكل','تأكل','نأكل','تأكلان','تأكلون','تأكلن','يأكلان','تأكلان','يأكلون','يأكلن']],
  ['أخذ',['أخذت','أخذت','أخذت','أخذ','أخذت','أخذنا','أخذتما','أخذتم','أخذتن','أخذا','أخذتا','أخذوا','أخذن'],['آخذ','تأخذ','تأخذين','يأخذ','تأخذ','نأخذ','تأخذان','تأخذون','تأخذن','يأخذان','تأخذان','يأخذون','يأخذن']],
  ['كان',['كنت','كنت','كنت','كان','كانت','كنا','كنتما','كنتم','كنتن','كانا','كانتا','كانوا','كن'],['أكون','تكون','تكونين','يكون','تكون','نكون','تكونان','تكونون','تكن','يكونان','تكونان','يكونون','يكن']],
  ['قال',['قلت','قلت','قلت','قال','قالت','قلنا','قلتما','قلتم','قلتن','قالا','قالتا','قالوا','قلن'],['أقول','تقول','تقولين','يقول','تقول','نقول','تقولان','تقولون','تقلن','يقولان','تقولان','يقولون','يقلن']],
  ['نام',['نمت','نمت','نمت','نام','نامت','نمنا','نمتما','نمتم','نمتن','ناما','نامتا','ناموا','نمن'],['أنام','تنام','تنامين','ينام','تنام','ننام','تنامان','تنامون','تنمن','ينامان','تنامان','ينامون','ينمن']]
 ];
 for(const [lemma,past,present] of arabicIrregular)add('ar',{lemma,stem:lemma,past,present,future:present.map(form=>'س'+form)});
 function lookup(word,language=course.target){
  if(!entries[language])return null;
  const term=normalize(typeof word==='string'?word:word?.lemma||word?.german||word?.term||word?.word).replace(language==='en'?/^to\s+/:/^\u0000/,'');
  const direct=entries[language].get(term);if(direct)return direct;
  if(language==='ar')for(const entry of entries.ar.values())if(normalize(entry.present[3])===term)return entry;
  const grammar=typeof word==='object'?word.grammar:null;
  if(grammar&&(grammar.verified||grammar.source)&&Array.isArray(grammar.pronouns)&&grammar.pronouns.length){
   const allowed=tenses[language],forms=Object.fromEntries(allowed.filter(([key])=>Array.isArray(grammar[key])&&grammar[key].length===grammar.pronouns.length&&grammar[key].every(form=>typeof form==='string'&&form.trim())).map(([key])=>[key,grammar[key]]));
   if(Object.keys(forms).length)return {...forms,lemma:word.lemma||word.german,stem:grammar.stem||word.lemma||word.german,pronouns:grammar.pronouns,personKeys:grammar.personKeys||grammar.pronouns};
  }
  return null;
 }
 function letters(base,form){
  const a=Array.from(normalize(base)),b=Array.from(String(form)),plain=b.map(c=>normalize(c));
  const table=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===plain[j]?1+table[i+1][j+1]:Math.max(table[i+1][j],table[i][j+1]);
  const unchanged=new Set();let i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===plain[j]){unchanged.add(j);i++;j++;}else if(table[i+1][j]>=table[i][j+1])i++;else j++;}
  return b.map((char,index)=>unchanged.has(index)||!/[\p{L}\p{M}]/u.test(char)?esc(char):'<span class="verb-change">'+esc(char)+'</span>').join('');
 }
 function formHtml(entry,form,tense,language){
  const parts=String(form).split(/(\s+)/);const helpers=new Set(language==='en'?['have','has','had']:['heb','hebt','heeft','hebben','ben','bent','is','zijn']);
  return parts.map((token,index)=>tense==='perfect'&&index===0&&helpers.has(token)?esc(token):/^\s+$/.test(token)?esc(token):letters(entry.stem,token)).join('');
 }
 function render(word,options={}){
  const language=options.target||course.target;if(!entries[language]||!word)return '';
  const direction=course.dir(language),nativeDirection=course.dir(course.native),term=word.lemma||word.german||word.term||'';
  if(word.pos!=='verb'){
   const grammar=word.grammar||{},fields=[['الجمع',grammar.plural||word.plural],['المقارنة',grammar.comparative],['التفضيل',grammar.superlative]].filter(([,value])=>typeof value==='string'&&value.trim());
   const tip=word.pos==='adjective'?{en:'في الإنجليزية، تسبق الصفة الاسم عادةً، ولا تتغيّر بسبب جنس الاسم.',nl:'في الهولندية، يتأثر انتهاء الصفة بأداة التعريف ونوع الاسم والسياق.',ar:'في العربية، تتبع الصفة الاسم عادةً وتوافقه في الإعراب والتعريف والتنكير، مع مراعاة قواعد الجنس والعدد.'}[language]:'';
   if(!fields.length&&!tip)return '';
   return `<section class="grammar-section"><h2>${esc(t('معلومات لغوية'))}</h2>${fields.map(([label,value])=>`<p>${esc(t(label))}: <b lang="${language}" dir="${direction}">${esc(value)}</b></p>`).join('')}${tip?`<p class="source-note">${esc(t(tip))}</p>`:''}</section>`;
  }
  const entry=lookup(word,language);
  if(!entry){const hint={en:'في الجملة الخبرية الإنجليزية، يأتي الفاعل عادةً قبل الفعل.',nl:'في الجملة الهولندية الرئيسية، يأتي الفعل المصرَّف عادةً في الموقع الثاني.',ar:'تتغيّر صيغة الفعل العربي بحسب الضمير والزمن.'}[language];return `<section class="verb-section"><h2>${esc(t('تصريف الفعل'))} <b lang="${language}" dir="${direction}">${esc(term)}</b></h2><p class="source-note">${esc(t('لا يتوفر جدول تصريف موثّق لهذه الكلمة بعد.'))}</p><p class="verb-note">${esc(t(hint))}</p></section>`;}
  const available=tenses[language].filter(([key])=>Array.isArray(entry[key])),tense=available.some(([key])=>key===options.tense)?options.tense:available[0][0];
  return `<section class="verb-section"><div class="verb-base-heading"><h2>${esc(t('تصريف الفعل'))} <b lang="${language}" dir="${direction}">${esc(entry.lemma)}</b></h2></div><div class="verb-tense-tabs" role="group" aria-label="${esc(t('زمن تصريف الفعل'))}">${available.map(([key,label])=>`<button type="button" class="secondary" data-verb-tense="${key}" aria-pressed="${key===tense}">${esc(t(label))}</button>`).join('')}</div><p class="verb-legend">${esc(t('الحروف المختلفة عن أصل الفعل ملوّنة؛ تبقى الأفعال المساعدة بلون عادي.'))}</p><table class="verb-table" dir="${direction}"><caption class="sr-only">${esc(entry.lemma)} · ${esc(t(available.find(([key])=>key===tense)[1]))}</caption><tbody>${entry[tense].map((form,index)=>`<tr><th scope="row" class="verb-pronoun"><span lang="${language}" dir="${direction}">${esc(entry.pronouns[index])}</span><span aria-hidden="true"> · </span><span lang="${course.native}" dir="${nativeDirection}">${esc(t(entry.personKeys[index]))}</span></th><td class="verb-form" lang="${language}" dir="${direction}">${formHtml(entry,form,tense,language)}</td></tr>`).join('')}</tbody></table><p class="source-note">${esc(t('يغطي هذا القسم مجموعة محددة من الأفعال الشائعة.'))}</p></section>`;
 }
 global.WORT_GRAMMAR=Object.freeze({render,lookup,get coverage(){return Object.fromEntries(Object.entries(entries).map(([language,values])=>[language,values.size]));}});
 if(typeof module==='object'&&module.exports)module.exports=global.WORT_GRAMMAR;
})(globalThis);
