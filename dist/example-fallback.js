/* Kalima bilingual example fallback:
   hand-written contextual sentences for common German verbs and,
   only when no verified source example is available, a clearly labelled
   word-learning sentence. Never misrepresent vocabulary notes as usage.
 */
(function(global) {
 'use strict';
 const authored={
  anrufen:[
   ['Ich rufe meine Mutter heute Abend an.','سأتصل بأمي هذا المساء.'],
   ['Kannst du mich später anrufen?','هل يمكنك الاتصال بي لاحقًا؟'],
   ['Er hat gestern seinen Freund angerufen.','اتصل بصديقه أمس.']
  ],
  nähern:[
   ['Wir nähern uns dem Bahnhof.','نحن نقترب من محطة القطار.'],
   ['Der Zug nähert sich langsam.','يقترب القطار ببطء.'],
   ['Bitte nähern Sie sich nicht der Kante.','يرجى عدم الاقتراب من الحافة.']
  ],
  aufstehen:[
   ['Ich stehe jeden Tag um sieben Uhr auf.','أنهض من النوم كل يوم الساعة السابعة.'],
   ['Morgen muss ich früh aufstehen.','يجب أن أنهض مبكرًا غدًا.']
  ],
  abholen:[
   ['Ich hole dich nach der Arbeit ab.','سآتي لاصطحابك بعد العمل.'],
   ['Kannst du das Paket morgen abholen?','هل يمكنك استلام الطرد غدًا؟']
  ],
  ankommen:[
   ['Der Zug kommt pünktlich an.','يصل القطار في الوقت المحدد.'],
   ['Wann wirst du in Wien ankommen?','متى ستصل إلى فيينا؟']
  ],
  anfangen:[
   ['Wir möchten jetzt mit dem Unterricht anfangen.','نريد أن نبدأ الدرس الآن.'],
   ['Wann können wir anfangen?','متى يمكننا أن نبدأ؟']
  ],
  aufräumen:[
   ['Ich möchte heute mein Zimmer aufräumen.','أريد ترتيب غرفتي اليوم.'],
   ['Wir müssen die Wohnung aufräumen.','يجب علينا ترتيب الشقة.']
  ],
  mitkommen:[
   ['Möchtest du heute mitkommen?','هل ترغب في المجيء معنا اليوم؟'],
   ['Meine Schwester kann morgen mitkommen.','يمكن لأختي أن تأتي معنا غدًا.']
  ],
  zurückkommen:[
   ['Ich werde am Sonntag zurückkommen.','سأعود يوم الأحد.'],
   ['Wann möchtest du zurückkommen?','متى تريد العودة؟']
  ],
  gehen:[
   ['Ich gehe heute zu Fuß zur Schule.','سأذهب اليوم إلى المدرسة سيرًا على الأقدام.'],
   ['Wir gehen jetzt nach Hause.','نحن نذهب الآن إلى المنزل.']
  ],
  kommen:[
   ['Kommst du morgen zu Besuch?','هل ستأتي لزيارتنا غدًا؟'],
   ['Meine Freunde kommen heute Abend.','سيأتي أصدقائي هذا المساء.']
  ],
  sprechen:[
   ['Ich spreche jeden Tag ein bisschen Deutsch.','أتحدث الألمانية قليلًا كل يوم.'],
   ['Können wir später sprechen?','هل يمكننا التحدث لاحقًا؟']
  ],
  lernen:[
   ['Ich lerne jeden Tag neue Wörter.','أتعلم كلمات جديدة كل يوم.'],
   ['Wir lernen zusammen Deutsch.','نتعلم الألمانية معًا.']
  ],
  verstehen:[
   ['Ich kann die Frage gut verstehen.','أستطيع فهم السؤال جيدًا.'],
   ['Kannst du diesen Satz verstehen?','هل تستطيع فهم هذه الجملة؟']
  ],
  schreiben:[
   ['Ich schreibe eine Nachricht an meinen Freund.','أكتب رسالة إلى صديقي.'],
   ['Kannst du deinen Namen schreiben?','هل تستطيع كتابة اسمك؟']
  ],
  lesen:[
   ['Ich lese abends ein Buch.','أقرأ كتابًا في المساء.'],
   ['Wir möchten diese Geschichte lesen.','نريد قراءة هذه القصة.']
  ],
  hören:[
   ['Ich höre gern Musik.','أحب الاستماع إلى الموسيقى.'],
   ['Kannst du mich gut hören?','هل يمكنك سماعي جيدًا؟']
  ],
  sehen:[
   ['Ich sehe einen Vogel im Garten.','أرى طائرًا في الحديقة.'],
   ['Möchtest du den Film sehen?','هل تريد مشاهدة الفيلم؟']
  ],
  essen:[
   ['Wir essen heute zusammen.','نأكل معًا اليوم.'],
   ['Ich möchte einen Apfel essen.','أريد أن آكل تفاحة.']
  ],
  trinken:[
   ['Ich trinke morgens ein Glas Wasser.','أشرب كوبًا من الماء صباحًا.'],
   ['Du solltest genug Wasser trinken.','ينبغي أن تشرب ماءً كافيًا.']
  ],
  kaufen:[
   ['Ich kaufe heute Brot und Milch.','سأشتري اليوم خبزًا وحليبًا.'],
   ['Wo kann ich eine Fahrkarte kaufen?','أين يمكنني شراء تذكرة؟']
  ],
  bezahlen:[
   ['Kann ich mit Karte bezahlen?','هل يمكنني الدفع بالبطاقة؟'],
   ['Wir möchten die Rechnung bezahlen.','نود دفع الفاتورة.']
  ],
  zahlen:[
   ['Ich zahle die Miete jeden Monat.','أدفع الإيجار كل شهر.'],
   ['Kannst du an der Kasse zahlen?','هل تستطيع الدفع عند الصندوق؟']
  ],
  fahren:[
   ['Ich fahre mit dem Bus zur Arbeit.','أذهب إلى العمل بالحافلة.'],
   ['Wir möchten morgen nach Graz fahren.','نريد الذهاب غدًا إلى غراتس.']
  ],
  arbeiten:[
   ['Meine Schwester arbeitet in einem Büro.','تعمل أختي في مكتب.'],
   ['Ich muss morgen früh arbeiten.','عليّ أن أعمل مبكرًا غدًا.']
  ],
  wohnen:[
   ['Wir wohnen in einer kleinen Wohnung.','نسكن في شقة صغيرة.'],
   ['Wo möchtest du später wohnen?','أين تريد أن تسكن لاحقًا؟']
  ],
  schlafen:[
   ['Das Baby schläft schon.','الطفل نائم بالفعل.'],
   ['Ich möchte heute früh schlafen.','أريد النوم مبكرًا اليوم.']
  ],
  spielen:[
   ['Die Kinder spielen im Park.','يلعب الأطفال في الحديقة.'],
   ['Wir spielen am Wochenende Fußball.','نلعب كرة القدم في عطلة نهاية الأسبوع.']
  ],
  helfen:[
   ['Kannst du mir bitte helfen?','هل يمكنك مساعدتي من فضلك؟'],
   ['Ich möchte meiner Nachbarin helfen.','أريد مساعدة جارتي.']
  ],
  fragen:[
   ['Darf ich dich etwas fragen?','هل يمكنني أن أسألك شيئًا؟'],
   ['Ich möchte den Lehrer fragen.','أريد سؤال المعلم.']
  ],
  antworten:[
   ['Kannst du auf meine Frage antworten?','هل يمكنك الإجابة عن سؤالي؟'],
   ['Ich werde dir morgen antworten.','سأرد عليك غدًا.']
  ],
  warten:[
   ['Ich warte an der Haltestelle.','أنتظر عند موقف الحافلات.'],
   ['Kannst du fünf Minuten warten?','هل يمكنك الانتظار خمس دقائق؟']
  ],
  suchen:[
   ['Ich suche meinen Schlüssel.','أبحث عن مفتاحي.'],
   ['Wir möchten eine neue Wohnung suchen.','نريد البحث عن شقة جديدة.']
  ],
  finden:[
   ['Ich kann mein Handy nicht finden.','لا أستطيع العثور على هاتفي.'],
   ['Wo kann ich diese Adresse finden?','أين يمكنني العثور على هذا العنوان؟']
  ],
  brauchen:[
   ['Ich brauche heute deine Hilfe.','أحتاج إلى مساعدتك اليوم.'],
   ['Wir brauchen mehr Zeit.','نحتاج إلى مزيد من الوقت.']
  ],
  machen:[
   ['Ich mache heute meine Hausaufgaben.','أؤدي واجباتي المنزلية اليوم.'],
   ['Was möchtest du morgen machen?','ماذا تريد أن تفعل غدًا؟']
  ],
  erklären:[
   ['Kannst du mir diese Regel erklären?','هل تستطيع شرح هذه القاعدة لي؟'],
   ['Die Lehrerin möchte das Thema erklären.','تريد المعلمة شرح الموضوع.']
  ],
  besuchen:[
   ['Wir besuchen morgen unsere Großeltern.','سنزور جدَّينا غدًا.'],
   ['Ich möchte einen Deutschkurs besuchen.','أريد الالتحاق بدورة لغة ألمانية.']
  ],
  öffnen:[
   ['Kannst du bitte das Fenster öffnen?','هل يمكنك فتح النافذة من فضلك؟'],
   ['Wir dürfen die Tür jetzt öffnen.','يُسمح لنا الآن بفتح الباب.']
  ],
  schließen:[
   ['Bitte schließen Sie die Tür.','يرجى إغلاق الباب.'],
   ['Wir müssen das Fenster schließen.','علينا إغلاق النافذة.']
  ],
  versuchen:[
   ['Ich werde es noch einmal versuchen.','سأحاول مرة أخرى.'],
   ['Wir möchten eine andere Lösung versuchen.','نريد تجربة حل آخر.']
  ],
  vergessen:[
   ['Ich darf meinen Schlüssel nicht vergessen.','يجب ألا أنسى مفتاحي.'],
   ['Bitte vergiss den Termin nicht.','رجاءً لا تنسَ الموعد.']
  ],
  entscheiden:[
   ['Ich muss mich heute entscheiden.','يجب أن أتخذ قراري اليوم.'],
   ['Du kannst selbst entscheiden.','يمكنك أن تقرر بنفسك.']
  ],
  glauben:[
   ['Ich glaube dir.','أنا أصدقك.'],
   ['Wir glauben an eine gute Zukunft.','نؤمن بمستقبل جيد.']
  ],
  denken:[
   ['Ich denke oft an meine Familie.','أفكر كثيرًا في عائلتي.'],
   ['Was denkst du darüber?','ما رأيك في ذلك؟']
  ],
  laufen:[
   ['Ich laufe jeden Morgen im Park.','أركض في الحديقة كل صباح.'],
   ['Wir möchten zum Bahnhof laufen.','نريد المشي إلى محطة القطار.']
  ],
  bleiben:[
   ['Ich bleibe heute zu Hause.','سأبقى في المنزل اليوم.'],
   ['Kannst du noch eine Stunde bleiben?','هل يمكنك البقاء ساعة أخرى؟']
  ],
  wissen:[
   ['Ich möchte die Antwort wissen.','أريد معرفة الجواب.'],
   ['Weißt du, wo der Bahnhof ist?','هل تعرف أين تقع محطة القطار؟']
  ],
  geben:[
   ['Kannst du mir das Buch geben?','هل يمكنك إعطائي الكتاب؟'],
   ['Ich möchte dir einen Rat geben.','أريد أن أقدم لك نصيحة.']
  ],
  nehmen:[
   ['Ich nehme heute den Bus.','سأستقل الحافلة اليوم.'],
   ['Darf ich diesen Stuhl nehmen?','هل يمكنني أخذ هذا الكرسي؟']
  ],
  bringen:[
   ['Ich bringe dir ein Glas Wasser.','سأحضر لك كوبًا من الماء.'],
   ['Kannst du das Paket morgen bringen?','هل يمكنك إحضار الطرد غدًا؟']
  ],
  sein:[
   ['Ich bin heute zu Hause.','أنا في المنزل اليوم.'],
   ['Das Wetter ist heute schön.','الطقس جميل اليوم.']
  ],
  haben:[
   ['Ich habe morgen einen Termin.','لدي موعد غدًا.'],
   ['Wir haben noch genug Zeit.','ما زال لدينا وقت كافٍ.']
  ],
  werden:[
   ['Es wird heute Abend kalt.','سيصبح الجو باردًا هذا المساء.'],
   ['Ich möchte Arzt werden.','أريد أن أصبح طبيبًا.']
  ]
 };
 const teachingNote={
  ar:'جملة لتعريف الكلمة (وليست مثال استعمال في سياق)',
  en:'Word-learning sentence (not a contextual usage example)',
  nl:'Zin om het woord te leren (geen gebruiksvoorbeeld)',
  de:'Satz zum Lernen des Wortes (kein Anwendungsbeispiel)'
 };
 const authoredNote={
  ar:'مثال سياقي من كتابة كلمة',
  en:'Contextual example written for Kalima',
  nl:'Voorbeeldzin geschreven voor Kalima',
  de:'Anwendungsbeispiel von Kalima'
 };
 const sentence={
  de:term=>'Heute lerne ich das Wort „'+term+'“.',
  en:term=>'Today I am learning the word “'+term+'”.',
  nl:term=>'Vandaag leer ik het woord ‘'+term+'’.',
  ar:term=>'أتعلّم اليوم كلمة «'+term+'».'
 };
 const clean=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,160);
 const canonical=word=>clean(word.lemma||word.german||word.term||'').toLocaleLowerCase('de-DE').replace(/^sich\s+/,'');
 function curated(word,target,native){
  if(target!=='de'||native!=='ar')return [];
  const key=canonical(word);
  const extra=global.WORT_A1_AUTHORED_EXAMPLES?.[key];
  const pairs=authored[key]||(extra?[extra]:null);
  return pairs?pairs.map(([de,ar])=>({de,ar,source:authoredNote.ar,kalimaAuthored:true})): [];
 }
 function create(word,target,native){
  const specific=curated(word,target,native);
  if(specific.length)return specific;
  const term=clean(word.term||word.german||word.lemma);
  if(!term)return [];
  return [{de:(sentence[target]||sentence.de)(term),ar:(sentence[native]||sentence.ar)(term),
    source:teachingNote[native]||teachingNote.ar,vocabularyNote:true}];
 }
 global.WORT_EXAMPLE_FALLBACK=Object.freeze({create,curated});
})(globalThis);
