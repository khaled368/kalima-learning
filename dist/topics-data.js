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
  },
  {
    "id": "work",
    "title": "في العمل",
    "subtitle": "الدوام والراتب والإجازات",
    "icon": "💼",
    "tone": "blue",
    "words": [
      [
        "der Arbeitsvertrag",
        "عقد العمل"
      ],
      [
        "die Lohnabrechnung",
        "قسيمة الراتب"
      ],
      [
        "der Dienstplan",
        "جدول الدوام"
      ],
      [
        "die Schicht",
        "وردية العمل"
      ],
      [
        "die Überstunden",
        "الساعات الإضافية"
      ],
      [
        "die Pause",
        "الاستراحة"
      ],
      [
        "der Urlaub",
        "الإجازة"
      ],
      [
        "der Krankenstand",
        "الإجازة المرضية"
      ],
      [
        "die Zeiterfassung",
        "تسجيل ساعات العمل"
      ],
      [
        "der Vorgesetzte",
        "المسؤول في العمل"
      ],
      [
        "die Kündigung",
        "إنهاء عقد العمل"
      ],
      [
        "der Stundenlohn",
        "الأجر بالساعة"
      ]
    ],
    "phrases": [
      [
        "Wann beginnt meine Schicht?",
        "متى تبدأ ورديتي؟"
      ],
      [
        "Können Sie mir bitte den Dienstplan schicken?",
        "هل يمكنك إرسال جدول الدوام لي من فضلك؟"
      ],
      [
        "Ich habe eine Frage zu meiner Lohnabrechnung.",
        "لدي سؤال عن قسيمة راتبي."
      ],
      [
        "Wie werden meine Überstunden bezahlt?",
        "كيف تُدفع ساعاتي الإضافية؟"
      ],
      [
        "Ich möchte Urlaub beantragen.",
        "أريد تقديم طلب إجازة."
      ],
      [
        "Ich bin krank und kann heute nicht arbeiten.",
        "أنا مريض ولا أستطيع العمل اليوم."
      ],
      [
        "Wo muss ich meine Arbeitszeit eintragen?",
        "أين يجب أن أسجّل ساعات عملي؟"
      ],
      [
        "Können Sie mir diese Aufgabe noch einmal erklären?",
        "هل يمكنك شرح هذه المهمة لي مرة أخرى؟"
      ],
      [
        "Wann habe ich Pause?",
        "متى موعد استراحتي؟"
      ],
      [
        "An wen kann ich mich bei Fragen wenden?",
        "إلى من يمكنني التوجّه عند وجود أسئلة؟"
      ]
    ]
  },
  {
    "id": "ams",
    "title": "في AMS والدوائر",
    "subtitle": "المساعدات والمواعيد والاستمارات",
    "icon": "🏛️",
    "tone": "violet",
    "words": [
      [
        "das AMS",
        "مكتب سوق العمل في النمسا"
      ],
      [
        "das Arbeitslosengeld",
        "إعانة البطالة"
      ],
      [
        "die Notstandshilfe",
        "مساعدة الطوارئ بعد إعانة البطالة"
      ],
      [
        "die Arbeitslosmeldung",
        "التسجيل كعاطل عن العمل"
      ],
      [
        "der Antrag",
        "الطلب الرسمي"
      ],
      [
        "der Bescheid",
        "القرار الإداري المكتوب"
      ],
      [
        "der Termin",
        "الموعد"
      ],
      [
        "die Stellenvermittlung",
        "التوسط لإيجاد وظيفة"
      ],
      [
        "die Betreuungsvereinbarung",
        "اتفاق المتابعة مع AMS"
      ],
      [
        "die Unterlagen",
        "المستندات"
      ],
      [
        "die Meldebestätigung",
        "إثبات تسجيل السكن"
      ],
      [
        "das Formular",
        "الاستمارة"
      ]
    ],
    "phrases": [
      [
        "Ich möchte mich arbeitslos melden.",
        "أريد تسجيل نفسي كعاطل عن العمل."
      ],
      [
        "Ich habe einen Termin beim AMS.",
        "لدي موعد في مكتب AMS."
      ],
      [
        "Welche Unterlagen muss ich mitbringen?",
        "ما المستندات التي يجب أن أحضرها؟"
      ],
      [
        "Ich möchte meine neue Beschäftigung melden.",
        "أريد إبلاغكم عن عملي الجديد."
      ],
      [
        "Kann ich meinen Termin verschieben?",
        "هل يمكنني تغيير موعدي؟"
      ],
      [
        "Ich habe eine Frage zu meinem Arbeitslosengeld.",
        "لدي سؤال عن إعانة البطالة الخاصة بي."
      ],
      [
        "Ist mein Antrag vollständig?",
        "هل طلبي مكتمل؟"
      ],
      [
        "Ich habe einen Brief vom AMS bekommen.",
        "وصلتني رسالة من AMS."
      ],
      [
        "Können Sie mir den Bescheid erklären?",
        "هل يمكنك شرح القرار الإداري لي؟"
      ],
      [
        "Ich möchte einen Deutschkurs besuchen.",
        "أريد الالتحاق بدورة لغة ألمانية."
      ]
    ]
  },
  {
    "id": "pharmacy",
    "title": "في الصيدلية",
    "subtitle": "الوصفات والأدوية والاستفسارات",
    "icon": "💊",
    "tone": "rose",
    "words": [
      [
        "die Apotheke",
        "الصيدلية"
      ],
      [
        "das Rezept",
        "الوصفة الطبية"
      ],
      [
        "das Medikament",
        "الدواء"
      ],
      [
        "die Tablette",
        "القرص الدوائي"
      ],
      [
        "die Salbe",
        "المرهم"
      ],
      [
        "die Tropfen",
        "القطرات"
      ],
      [
        "die Packungsbeilage",
        "النشرة المرفقة بالدواء"
      ],
      [
        "die Nebenwirkung",
        "الأثر الجانبي"
      ],
      [
        "die Dosierung",
        "الجرعة"
      ],
      [
        "das Pflaster",
        "اللاصق الطبي"
      ],
      [
        "der Hustensaft",
        "شراب السعال"
      ],
      [
        "die Allergie",
        "الحساسية"
      ]
    ],
    "phrases": [
      [
        "Ich möchte dieses Rezept einlösen.",
        "أريد صرف هذه الوصفة الطبية."
      ],
      [
        "Ist dieses Medikament rezeptpflichtig?",
        "هل يتطلب هذا الدواء وصفة طبية؟"
      ],
      [
        "Wie oft soll ich diese Tabletten einnehmen?",
        "كم مرة يجب أن أتناول هذه الأقراص؟"
      ],
      [
        "Soll ich das Medikament vor oder nach dem Essen einnehmen?",
        "هل أتناول الدواء قبل الطعام أم بعده؟"
      ],
      [
        "Hat dieses Medikament Nebenwirkungen?",
        "هل لهذا الدواء آثار جانبية؟"
      ],
      [
        "Ich habe eine Allergie gegen Penicillin.",
        "لدي حساسية من البنسلين."
      ],
      [
        "Gibt es dieses Medikament auch für Kinder?",
        "هل يتوفر هذا الدواء للأطفال أيضًا؟"
      ],
      [
        "Wie muss ich die Tropfen aufbewahren?",
        "كيف يجب أن أحفظ القطرات؟"
      ],
      [
        "Ich brauche ein Pflaster.",
        "أحتاج إلى لاصق طبي."
      ],
      [
        "Können Sie mir die Packungsbeilage erklären?",
        "هل يمكنك شرح النشرة المرفقة بالدواء لي؟"
      ]
    ]
  },
  {
    "id": "housing",
    "title": "في السكن والإيجار",
    "subtitle": "الشقة والعقد والفواتير والصيانة",
    "icon": "🏠",
    "tone": "green",
    "words": [
      [
        "die Wohnung",
        "الشقة"
      ],
      [
        "die Miete",
        "الإيجار"
      ],
      [
        "der Mietvertrag",
        "عقد الإيجار"
      ],
      [
        "die Kaution",
        "مبلغ التأمين على السكن"
      ],
      [
        "die Betriebskosten",
        "تكاليف تشغيل المبنى"
      ],
      [
        "die Heizung",
        "التدفئة"
      ],
      [
        "der Strom",
        "الكهرباء"
      ],
      [
        "das Warmwasser",
        "الماء الساخن"
      ],
      [
        "der Vermieter",
        "مالك العقار المؤجر"
      ],
      [
        "die Hausverwaltung",
        "إدارة العقار"
      ],
      [
        "die Reparatur",
        "التصليح"
      ],
      [
        "die Wohnungsbesichtigung",
        "معاينة الشقة"
      ]
    ],
    "phrases": [
      [
        "Ist die Wohnung noch frei?",
        "هل الشقة ما زالت متاحة؟"
      ],
      [
        "Sind die Betriebskosten in der Miete enthalten?",
        "هل تكاليف تشغيل المبنى مشمولة في الإيجار؟"
      ],
      [
        "Wie hoch ist die Kaution?",
        "كم مبلغ التأمين على السكن؟"
      ],
      [
        "Wann kann ich die Wohnung besichtigen?",
        "متى يمكنني معاينة الشقة؟"
      ],
      [
        "Die Heizung funktioniert nicht.",
        "التدفئة لا تعمل."
      ],
      [
        "In der Küche ist der Abfluss verstopft.",
        "أنبوب التصريف في المطبخ مسدود."
      ],
      [
        "Kann ich den Mietvertrag per E-Mail bekommen?",
        "هل يمكنني الحصول على عقد الإيجار عبر البريد الإلكتروني؟"
      ],
      [
        "Wo darf ich mein Auto parken?",
        "أين يُسمح لي بركن سيارتي؟"
      ],
      [
        "Wann kommt der Handwerker?",
        "متى سيأتي عامل الصيانة؟"
      ],
      [
        "Ich möchte einen Schaden in der Wohnung melden.",
        "أريد الإبلاغ عن ضرر في الشقة."
      ]
    ]
  },
  {
    "id": "car",
    "title": "في السيارة والورشة",
    "subtitle": "الأعطال والتأمين والفحص الفني",
    "icon": "🚗",
    "tone": "indigo",
    "words": [
      [
        "der Führerschein",
        "رخصة القيادة"
      ],
      [
        "der Zulassungsschein",
        "شهادة تسجيل السيارة"
      ],
      [
        "die Versicherung",
        "التأمين"
      ],
      [
        "die Tankstelle",
        "محطة الوقود"
      ],
      [
        "der Reifen",
        "الإطار"
      ],
      [
        "der Reifendruck",
        "ضغط الهواء في الإطار"
      ],
      [
        "der Motor",
        "المحرّك"
      ],
      [
        "die Panne",
        "عطل السيارة على الطريق"
      ],
      [
        "die Batterie",
        "البطارية"
      ],
      [
        "die Werkstatt",
        "ورشة تصليح السيارات"
      ],
      [
        "das Pickerl",
        "ملصق الفحص الفني الدوري في النمسا"
      ],
      [
        "das Motoröl",
        "زيت المحرّك"
      ]
    ],
    "phrases": [
      [
        "Mein Auto springt nicht an.",
        "سيارتي لا تعمل عند محاولة تشغيلها."
      ],
      [
        "Wo ist die nächste Tankstelle?",
        "أين أقرب محطة وقود؟"
      ],
      [
        "Ich habe einen platten Reifen.",
        "لدي إطار فارغ من الهواء."
      ],
      [
        "Können Sie die Batterie überprüfen?",
        "هل يمكنك فحص البطارية؟"
      ],
      [
        "Wann ist das Pickerl fällig?",
        "متى يحين موعد الفحص الفني الدوري للسيارة؟"
      ],
      [
        "Wie viel kostet die Reparatur?",
        "كم تكلفة التصليح؟"
      ],
      [
        "Die Motorkontrollleuchte leuchtet.",
        "ضوء فحص المحرّك مضاء."
      ],
      [
        "Ich brauche einen Termin in der Werkstatt.",
        "أحتاج إلى موعد في ورشة التصليح."
      ],
      [
        "Können Sie den Reifendruck prüfen?",
        "هل يمكنك فحص ضغط الإطارات؟"
      ],
      [
        "Mein Auto ist unterwegs liegen geblieben.",
        "تعطلت سيارتي أثناء الطريق ولم تعد تسير."
      ]
    ]
  },
  {
    "id": "bank",
    "title": "في البنك",
    "subtitle": "الحساب والتحويلات والمدفوعات",
    "icon": "🏦",
    "tone": "blue",
    "words": [
      [
        "das Bankkonto",
        "الحساب البنكي"
      ],
      [
        "die Bankomatkarte",
        "بطاقة الصراف الآلي في النمسا"
      ],
      [
        "die Überweisung",
        "التحويل البنكي"
      ],
      [
        "die IBAN",
        "رقم الحساب البنكي الدولي"
      ],
      [
        "der Kontoauszug",
        "كشف الحساب"
      ],
      [
        "das Onlinebanking",
        "الخدمات المصرفية عبر الإنترنت"
      ],
      [
        "die Kontogebühr",
        "رسوم الحساب البنكي"
      ],
      [
        "die Abbuchung",
        "الخصم من الحساب"
      ],
      [
        "die Rückerstattung",
        "استرداد المبلغ"
      ],
      [
        "die Ratenzahlung",
        "الدفع بالتقسيط"
      ],
      [
        "der Dauerauftrag",
        "أمر التحويل البنكي الدائم"
      ],
      [
        "die Kreditkarte",
        "بطاقة الائتمان"
      ]
    ],
    "phrases": [
      [
        "Ich möchte ein Bankkonto eröffnen.",
        "أريد فتح حساب بنكي."
      ],
      [
        "Ich habe eine Frage zu einer Abbuchung.",
        "لدي سؤال عن مبلغ خُصم من حسابي."
      ],
      [
        "Ich glaube, dieser Betrag wurde zweimal abgebucht.",
        "أعتقد أن هذا المبلغ خُصم مرتين."
      ],
      [
        "Kann ich am Schalter eine Überweisung machen?",
        "هل يمكنني إجراء تحويل بنكي عند الشباك؟"
      ],
      [
        "Wie hoch sind die Kontogebühren?",
        "كم تبلغ رسوم الحساب البنكي؟"
      ],
      [
        "Ich möchte einen Dauerauftrag einrichten.",
        "أريد إعداد أمر تحويل بنكي دائم."
      ],
      [
        "Kann ich den Betrag in Raten bezahlen?",
        "هل يمكنني دفع المبلغ على أقساط؟"
      ],
      [
        "Meine Bankomatkarte funktioniert nicht.",
        "بطاقتي البنكية لا تعمل."
      ],
      [
        "Wie kann ich meine Karte sperren lassen?",
        "كيف يمكنني طلب إيقاف بطاقتي البنكية؟"
      ],
      [
        "Können Sie mir einen Kontoauszug ausdrucken?",
        "هل يمكنك طباعة كشف حساب لي؟"
      ]
    ]
  },
  {
    "id": "phone",
    "title": "في الهاتف والاتصالات",
    "subtitle": "الشريحة والاشتراك والإنترنت",
    "icon": "📱",
    "tone": "teal",
    "words": [
      [
        "das Handy",
        "الهاتف المحمول"
      ],
      [
        "die SIM-Karte",
        "شريحة الهاتف"
      ],
      [
        "der Tarif",
        "باقة الاشتراك"
      ],
      [
        "der Vertrag",
        "العقد"
      ],
      [
        "das Guthaben",
        "الرصيد"
      ],
      [
        "die Rechnung",
        "الفاتورة"
      ],
      [
        "die Rufnummer",
        "رقم الهاتف"
      ],
      [
        "das Datenvolumen",
        "حجم بيانات الإنترنت"
      ],
      [
        "der Empfang",
        "إشارة الشبكة"
      ],
      [
        "die Mailbox",
        "البريد الصوتي"
      ],
      [
        "die Kündigung",
        "إلغاء العقد"
      ],
      [
        "die Netzabdeckung",
        "تغطية الشبكة"
      ]
    ],
    "phrases": [
      [
        "Ich möchte eine neue SIM-Karte kaufen.",
        "أريد شراء شريحة هاتف جديدة."
      ],
      [
        "Wie viel Datenvolumen ist im Tarif enthalten?",
        "ما حجم بيانات الإنترنت المشمول في الباقة؟"
      ],
      [
        "Wann endet mein Vertrag?",
        "متى ينتهي عقدي؟"
      ],
      [
        "Ich habe keinen Empfang.",
        "ليست لدي إشارة شبكة."
      ],
      [
        "Meine SIM-Karte funktioniert nicht.",
        "شريحة هاتفي لا تعمل."
      ],
      [
        "Wie kann ich mein Guthaben aufladen?",
        "كيف يمكنني شحن رصيدي؟"
      ],
      [
        "Ich möchte meine Rufnummer mitnehmen.",
        "أريد الاحتفاظ برقم هاتفي عند الانتقال إلى شركة أخرى."
      ],
      [
        "Warum ist meine Rechnung so hoch?",
        "لماذا فاتورتي مرتفعة جدًا؟"
      ],
      [
        "Gibt es einen günstigeren Tarif?",
        "هل توجد باقة أرخص؟"
      ],
      [
        "Können Sie mir helfen, das Handy einzurichten?",
        "هل يمكنك مساعدتي في إعداد الهاتف؟"
      ]
    ]
  },
  {
    "id": "restaurant",
    "title": "في المطعم",
    "subtitle": "الطلب والحساسية والدفع",
    "icon": "🍽️",
    "tone": "amber",
    "words": [
      [
        "die Speisekarte",
        "قائمة الطعام"
      ],
      [
        "die Bestellung",
        "الطلب"
      ],
      [
        "das Gericht",
        "الطبق"
      ],
      [
        "das Tagesmenü",
        "قائمة طعام اليوم"
      ],
      [
        "die Rechnung",
        "الفاتورة"
      ],
      [
        "das Trinkgeld",
        "البقشيش"
      ],
      [
        "der Kellner",
        "النادل"
      ],
      [
        "die Kellnerin",
        "النادلة"
      ],
      [
        "die Reservierung",
        "الحجز"
      ],
      [
        "die Vorspeise",
        "المقبلات"
      ],
      [
        "die Hauptspeise",
        "الطبق الرئيسي"
      ],
      [
        "die Nachspeise",
        "الحلوى بعد الطعام"
      ]
    ],
    "phrases": [
      [
        "Haben Sie einen freien Tisch für vier Personen?",
        "هل لديكم طاولة شاغرة لأربعة أشخاص؟"
      ],
      [
        "Kann ich bitte die Speisekarte bekommen?",
        "هل يمكنني الحصول على قائمة الطعام من فضلك؟"
      ],
      [
        "Was empfehlen Sie heute?",
        "بماذا تنصحون اليوم؟"
      ],
      [
        "Ich möchte dieses Gericht bestellen.",
        "أريد طلب هذا الطبق."
      ],
      [
        "Ist dieses Gericht vegetarisch?",
        "هل هذا الطبق نباتي؟"
      ],
      [
        "Enthält dieses Gericht Nüsse?",
        "هل يحتوي هذا الطبق على المكسرات؟"
      ],
      [
        "Kann ich das ohne Zwiebeln bekommen?",
        "هل يمكنني الحصول عليه دون بصل؟"
      ],
      [
        "Könnten Sie uns bitte Wasser bringen?",
        "هل يمكنكم إحضار ماء لنا من فضلكم؟"
      ],
      [
        "Könnten wir bitte bezahlen?",
        "هل يمكننا دفع الحساب من فضلكم؟"
      ],
      [
        "Kann ich mit Karte bezahlen?",
        "هل يمكنني الدفع بالبطاقة؟"
      ]
    ]
  },
  {
    "id": "worksite",
    "title": "في موقع العمل",
    "subtitle": "الأدوات والسلامة والورديات",
    "icon": "👷",
    "tone": "green",
    "words": [
      [
        "die Schutzbrille",
        "النظارات الواقية"
      ],
      [
        "die Arbeitshandschuhe",
        "قفازات العمل"
      ],
      [
        "die Sicherheitsschuhe",
        "أحذية السلامة"
      ],
      [
        "das Werkzeug",
        "الأداة / أدوات العمل"
      ],
      [
        "die Maschine",
        "الآلة"
      ],
      [
        "der Not-Aus-Schalter",
        "زر الإيقاف الاضطراري"
      ],
      [
        "die Schicht",
        "وردية العمل"
      ],
      [
        "die Montage",
        "التركيب"
      ],
      [
        "die Leiter",
        "السلم"
      ],
      [
        "die Palette",
        "منصة نقل البضائع"
      ],
      [
        "die Arbeitsanweisung",
        "تعليمات العمل"
      ],
      [
        "der Gehörschutz",
        "واقي السمع"
      ]
    ],
    "phrases": [
      [
        "Wo finde ich die Schutzbrille?",
        "أين أجد النظارات الواقية؟"
      ],
      [
        "Die Maschine funktioniert nicht richtig.",
        "الآلة لا تعمل بشكل صحيح."
      ],
      [
        "Bitte schalten Sie die Maschine aus.",
        "يرجى إيقاف تشغيل الآلة."
      ],
      [
        "Ich verstehe die Arbeitsanweisung nicht.",
        "لا أفهم تعليمات العمل."
      ],
      [
        "Muss ich heute Überstunden machen?",
        "هل يجب أن أعمل ساعات إضافية اليوم؟"
      ],
      [
        "Wann beginnt die nächste Schicht?",
        "متى تبدأ الوردية التالية؟"
      ],
      [
        "Wo ist der Not-Aus-Schalter?",
        "أين يوجد زر الإيقاف الاضطراري؟"
      ],
      [
        "Ich brauche neue Arbeitshandschuhe.",
        "أحتاج إلى قفازات عمل جديدة."
      ],
      [
        "Ist dieser Bereich gesperrt?",
        "هل هذه المنطقة مغلقة وممنوع الدخول إليها؟"
      ],
      [
        "Ich habe eine Frage zur Arbeitssicherheit.",
        "لدي سؤال بخصوص السلامة المهنية."
      ]
    ]
  }
 ];
 global.WORT_TOPICS_DATA=Object.freeze(categories.map(entry=>Object.freeze({
  ...entry,words:Object.freeze(entry.words.map(pair=>Object.freeze(pair))),
  phrases:Object.freeze(entry.phrases.map(pair=>Object.freeze(pair)))
 })));
})(globalThis);
