/* Kalima: independently authored German / Arabic practical topic library.
   These are everyday learning aids, not medical, legal, or travel advice.
   German entries retain the article; Austrian common terms are included.
   Every displayed phrase has an intentionally matching Arabic translation. */
(function(global) {
 'use strict';
 const categories=[
  {
   id:'hospital',title:'في المستشفى',subtitle:'الأطباء والمواعيد والطوارئ',icon:'🏥',tone:'rose',
   words:[
    ['das Krankenhaus','المستشفى'],
    ['die Notaufnahme','قسم الطوارئ'],
    ['der Arzt','الطبيب'],
    ['die Ärztin','الطبيبة'],
    ['der Termin','الموعد'],
    ['die e-card','بطاقة التأمين الصحي في النمسا'],
    ['die Schmerzen','الآلام'],
    ['das Fieber','الحمّى'],
    ['das Rezept','الوصفة الطبية'],
    ['die Apotheke','الصيدلية'],
    ['das Medikament','الدواء'],
    ['die Allergie','الحساسية']
   ],
   phrases:[
    ['Ich brauche einen Arzt.','أحتاج إلى طبيب.'],
    ['Ich habe starke Schmerzen.','أعاني من آلام شديدة.'],
    ['Mir ist schwindelig.','أشعر بالدوار.'],
    ['Ich habe Fieber.','لدي حمّى.'],
    ['Wo ist die Notaufnahme?','أين قسم الطوارئ؟'],
    ['Ich habe einen Termin um zehn Uhr.','لدي موعد الساعة العاشرة.'],
    ['Ich bin gegen Penicillin allergisch.','لدي حساسية من البنسلين.'],
    ['Können Sie bitte langsamer sprechen?','هل يمكنك التحدث ببطء أكثر من فضلك؟'],
    ['Ich brauche bitte einen Dolmetscher für Arabisch.','أحتاج إلى مترجم للغة العربية من فضلك.'],
    ['Rufen Sie bitte einen Krankenwagen!','اتصلوا بسيارة إسعاف من فضلكم!']
   ]
  },
  {
   id:'train',title:'في محطة القطار',subtitle:'التذاكر والأرصفة وتبديل القطارات',icon:'🚆',tone:'blue',
   words:[
    ['der Bahnhof','محطة القطار'],
    ['der Zug','القطار'],
    ['das Gleis','الرصيف المرقّم / مسار القطار'],
    ['der Bahnsteig','رصيف القطار'],
    ['die Fahrkarte','تذكرة القطار'],
    ['der Fahrkartenautomat','آلة بيع التذاكر'],
    ['der Fahrplan','جدول الرحلات'],
    ['die Verspätung','التأخير'],
    ['die Abfahrt','المغادرة'],
    ['die Ankunft','الوصول'],
    ['das Umsteigen','تبديل القطار'],
    ['der Anschlusszug','القطار التالي المتصل بالرحلة']
   ],
   phrases:[
    ['Wo kann ich eine Fahrkarte kaufen?','أين يمكنني شراء تذكرة؟'],
    ['Von welchem Gleis fährt der Zug nach Wien ab?','من أي رصيف ينطلق القطار إلى فيينا؟'],
    ['Wann fährt der nächste Zug?','متى ينطلق القطار التالي؟'],
    ['Hat der Zug Verspätung?','هل القطار متأخر؟'],
    ['Muss ich in Linz umsteigen?','هل يجب عليّ تبديل القطار في لينتس؟'],
    ['Ist das der Zug nach Salzburg?','هل هذا القطار المتجه إلى سالزبورغ؟'],
    ['Ist dieser Platz frei?','هل هذا المقعد شاغر؟'],
    ['Ich habe meinen Anschlusszug verpasst.','فاتني القطار الذي كان عليّ الانتقال إليه.'],
    ['Wo ist der Fahrkartenautomat?','أين آلة بيع التذاكر؟'],
    ['Wann kommen wir an?','متى سنصل؟']
   ]
  },
  {
   id:'bus',title:'في الحافلة',subtitle:'المواقف والخطوط والتذاكر',icon:'🚌',tone:'teal',
   words:[
    ['der Bus','الحافلة'],
    ['die Bushaltestelle','موقف الحافلة'],
    ['die Linie','خط الحافلة'],
    ['die Fahrkarte','التذكرة'],
    ['die Monatskarte','البطاقة الشهرية'],
    ['der Fahrplan','جدول الحافلات'],
    ['die Abfahrt','المغادرة'],
    ['die Endhaltestelle','الموقف الأخير'],
    ['der Busfahrer','سائق الحافلة'],
    ['die Busfahrerin','سائقة الحافلة'],
    ['die Verspätung','التأخير'],
    ['der Fahrschein','تذكرة الركوب']
   ],
   phrases:[
    ['Fährt dieser Bus zum Bahnhof?','هل تذهب هذه الحافلة إلى محطة القطار؟'],
    ['Wo ist die nächste Bushaltestelle?','أين أقرب موقف حافلات؟'],
    ['Wann kommt der nächste Bus?','متى تصل الحافلة التالية؟'],
    ['Ich möchte eine Fahrkarte kaufen.','أريد شراء تذكرة.'],
    ['Wie viel kostet die Fahrkarte?','كم سعر التذكرة؟'],
    ['Muss ich hier aussteigen?','هل يجب أن أنزل هنا؟'],
    ['Können Sie mir bitte sagen, wann ich aussteigen muss?','هل يمكنك إخباري متى يجب أن أنزل من فضلك؟'],
    ['Ist dieser Bus die Linie 3?','هل هذه الحافلة من الخط رقم 3؟'],
    ['Wo kann ich eine Monatskarte kaufen?','أين يمكنني شراء بطاقة شهرية؟'],
    ['Entschuldigung, ist dieser Platz frei?','عذرًا، هل هذا المقعد شاغر؟']
   ]
  },
  {
   id:'kindergarten',title:'في الروضة',subtitle:'التسجيل والرعاية والطعام والغياب',icon:'🧸',tone:'violet',
   words:[
    ['der Kindergarten','روضة الأطفال'],
    ['die Anmeldung','التسجيل'],
    ['die Pädagogin','المربّية / المعلمة في الروضة'],
    ['die Eingewöhnung','فترة تأقلم الطفل مع الروضة'],
    ['die Jause','وجبة خفيفة (في النمسا)'],
    ['die Trinkflasche','قارورة الماء'],
    ['die Wechselkleidung','ملابس احتياطية'],
    ['die Hausschuhe','حذاء داخلي'],
    ['die Abholzeit','وقت استلام الطفل'],
    ['der Ausflug','الرحلة'],
    ['die Krankmeldung','إبلاغ الغياب بسبب المرض'],
    ['der Elternabend','اجتماع أولياء الأمور']
   ],
   phrases:[
    ['Ich möchte mein Kind im Kindergarten anmelden.','أريد تسجيل طفلي في الروضة.'],
    ['Gibt es noch einen freien Platz?','هل يوجد مكان شاغر؟'],
    ['Wann kann ich mein Kind abholen?','متى يمكنني استلام طفلي؟'],
    ['Mein Kind ist heute krank und kommt nicht.','طفلي مريض اليوم ولن يحضر.'],
    ['Braucht mein Kind Wechselkleidung?','هل يحتاج طفلي إلى ملابس احتياطية؟'],
    ['Muss ich eine Jause mitgeben?','هل يجب أن أضع وجبة خفيفة مع طفلي؟'],
    ['Gibt es morgen einen Ausflug?','هل توجد رحلة غدًا؟'],
    ['Mein Kind hat eine Lebensmittelallergie.','يعاني طفلي من حساسية تجاه أحد الأطعمة.'],
    ['Ich möchte mit der Pädagogin sprechen.','أريد التحدث مع المربّية.'],
    ['Um wie viel Uhr beginnt die Betreuung?','في أي ساعة تبدأ رعاية الأطفال؟']
   ]
  },
  {
   id:'school',title:'في المدرسة',subtitle:'المعلمون والواجبات والمواعيد',icon:'🎒',tone:'indigo',
   words:[
    ['die Schule','المدرسة'],
    ['die Lehrerin','المعلمة'],
    ['der Lehrer','المعلم'],
    ['die Hausaufgaben','الواجبات المنزلية'],
    ['das Schulheft','الدفتر المدرسي'],
    ['die Schultasche','الحقيبة المدرسية'],
    ['der Stundenplan','الجدول الدراسي'],
    ['die Klassenlehrerin','معلمة الصف'],
    ['der Elternsprechtag','يوم لقاء أولياء الأمور بالمعلمين'],
    ['das Zeugnis','الشهادة المدرسية'],
    ['die Entschuldigung','رسالة اعتذار عن الغياب'],
    ['der Unterricht','الدرس / الحصة الدراسية']
   ],
   phrases:[
    ['Mein Kind kann heute nicht zur Schule kommen.','لا يستطيع طفلي الذهاب إلى المدرسة اليوم.'],
    ['Welche Hausaufgaben gibt es für morgen?','ما الواجبات المطلوبة لغد؟'],
    ['Wann beginnt der Unterricht?','متى يبدأ الدوام الدراسي؟'],
    ['Ich möchte mit der Klassenlehrerin sprechen.','أريد التحدث مع معلمة الصف.'],
    ['Mein Kind hat das Schulheft vergessen.','نسي طفلي دفتره المدرسي.'],
    ['Gibt es morgen einen Schulausflug?','هل توجد رحلة مدرسية غدًا؟'],
    ['Wann ist der nächste Elternsprechtag?','متى موعد يوم لقاء أولياء الأمور القادم؟'],
    ['Können Sie mir bitte den Stundenplan schicken?','هل يمكنك إرسال الجدول الدراسي لي من فضلك؟'],
    ['Mein Kind braucht Hilfe bei den Hausaufgaben.','يحتاج طفلي إلى مساعدة في الواجبات المنزلية.'],
    ['Wo kann ich eine Entschuldigung abgeben?','أين يمكنني تسليم رسالة الاعتذار عن الغياب؟']
   ]
  },
  {
   id:'supermarket',title:'في السوبرماركت',subtitle:'الأسعار والأطعمة والدفع',icon:'🛒',tone:'amber',
   words:[
    ['der Supermarkt','السوبرماركت'],
    ['die Kasse','صندوق الدفع'],
    ['der Kassenzettel','إيصال الشراء'],
    ['der Einkaufswagen','عربة التسوق'],
    ['der Einkaufszettel','قائمة التسوق'],
    ['das Regal','الرف'],
    ['der Preis','السعر'],
    ['das Sonderangebot','العرض الخاص'],
    ['das Wechselgeld','الباقي النقدي'],
    ['die Bankomatkarte','البطاقة البنكية (في النمسا)'],
    ['die Milch','الحليب'],
    ['das Sackerl','كيس التسوق (في النمسا)']
   ],
   phrases:[
    ['Wo finde ich Milch?','أين أجد الحليب؟'],
    ['Wie viel kostet das?','كم سعر هذا؟'],
    ['Gibt es das im Angebot?','هل يوجد عرض على هذا المنتج؟'],
    ['Kann ich mit Karte bezahlen?','هل يمكنني الدفع بالبطاقة؟'],
    ['Ich möchte bar bezahlen.','أريد الدفع نقدًا.'],
    ['Kann ich ein Sackerl haben?','هل يمكنني الحصول على كيس؟'],
    ['Wo ist die Kasse?','أين صندوق الدفع؟'],
    ['Ich glaube, der Preis ist falsch.','أعتقد أن السعر غير صحيح.'],
    ['Haben Sie auch Vollkornbrot?','هل لديكم خبز من الحبوب الكاملة أيضًا؟'],
    ['Könnte ich bitte den Kassenzettel bekommen?','هل يمكنني الحصول على إيصال الشراء من فضلك؟']
   ]
  },
  {
   id:'everyday',title:'مواقف الحياة اليومية',subtitle:'العمل والسكن والمواعيد والتواصل',icon:'🏡',tone:'green',
   words:[
    ['die Wohnung','الشقة'],
    ['die Miete','الإيجار'],
    ['der Termin','الموعد'],
    ['das Amt','الدائرة الحكومية'],
    ['das Formular','الاستمارة'],
    ['die Unterschrift','التوقيع'],
    ['die Adresse','العنوان'],
    ['die Rechnung','الفاتورة'],
    ['der Schlüssel','المفتاح'],
    ['die Hilfe','المساعدة'],
    ['die Nachricht','الرسالة'],
    ['die Arbeit','العمل']
   ],
   phrases:[
    ['Können Sie bitte langsamer sprechen?','هل يمكنك التحدث ببطء أكثر من فضلك؟'],
    ['Ich verstehe nicht alles.','لا أفهم كل شيء.'],
    ['Können Sie das bitte wiederholen?','هل يمكنك إعادة ذلك من فضلك؟'],
    ['Ich lerne noch Deutsch.','ما زلت أتعلم الألمانية.'],
    ['Ich brauche einen Termin.','أحتاج إلى موعد.'],
    ['Wo muss ich unterschreiben?','أين يجب أن أوقّع؟'],
    ['Können Sie mir bitte helfen?','هل يمكنك مساعدتي من فضلك؟'],
    ['Ich habe eine Frage zu meiner Rechnung.','لدي سؤال بخصوص فاتورتي.'],
    ['Ich suche eine Wohnung zur Miete.','أبحث عن شقة للإيجار.'],
    ['Wie komme ich zum Rathaus?','كيف أصل إلى مبنى البلدية؟']
   ]
  }
 ];
 global.WORT_TOPICS_DATA=Object.freeze(categories.map(entry=>Object.freeze({
  ...entry,words:Object.freeze(entry.words.map(pair=>Object.freeze(pair))),
  phrases:Object.freeze(entry.phrases.map(pair=>Object.freeze(pair)))
 })));
})(globalThis);
