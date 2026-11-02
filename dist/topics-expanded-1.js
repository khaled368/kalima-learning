/* More practical vocabulary and full-sentence examples in all four course languages.
   Each tuple is German, Arabic, English, Dutch. */
(function(global){'use strict';const data={
  "hospital": {
    "w": [
      [
        "die Untersuchung",
        "الفحص الطبي",
        "the medical examination",
        "het medisch onderzoek"
      ],
      [
        "das Wartezimmer",
        "غرفة الانتظار",
        "the waiting room",
        "de wachtkamer"
      ],
      [
        "der Blutdruck",
        "ضغط الدم",
        "blood pressure",
        "de bloeddruk"
      ],
      [
        "die Überweisung",
        "الإحالة الطبية",
        "the medical referral",
        "de verwijzing"
      ],
      [
        "die Spritze",
        "الحقنة",
        "the injection",
        "de injectie"
      ],
      [
        "die Infusion",
        "المحلول الوريدي",
        "the IV drip",
        "het infuus"
      ],
      [
        "die Diagnose",
        "التشخيص",
        "the diagnosis",
        "de diagnose"
      ],
      [
        "die Behandlung",
        "العلاج",
        "the treatment",
        "de behandeling"
      ]
    ],
    "p": [
      [
        "Wie lange muss ich noch warten?",
        "كم بقي عليّ أن أنتظر؟",
        "How much longer do I need to wait?",
        "Hoe lang moet ik nog wachten?"
      ],
      [
        "Können Sie bitte meinen Blutdruck messen?",
        "هل يمكنك قياس ضغط دمي من فضلك؟",
        "Could you measure my blood pressure, please?",
        "Kunt u alstublieft mijn bloeddruk meten?"
      ],
      [
        "Ich habe eine Überweisung vom Hausarzt.",
        "لدي إحالة من طبيب الأسرة.",
        "I have a referral from my family doctor.",
        "Ik heb een verwijzing van de huisarts."
      ],
      [
        "Wann bekomme ich meine Untersuchungsergebnisse?",
        "متى سأحصل على نتائج الفحص؟",
        "When will I receive my test results?",
        "Wanneer krijg ik mijn onderzoeksresultaten?"
      ],
      [
        "Kann mir jemand die Behandlung erklären?",
        "هل يستطيع أحد شرح العلاج لي؟",
        "Can someone explain the treatment to me?",
        "Kan iemand mij de behandeling uitleggen?"
      ]
    ]
  },
  "train": {
    "w": [
      [
        "die ÖBB",
        "السكك الحديدية النمساوية",
        "Austrian Federal Railways",
        "de Oostenrijkse spoorwegen"
      ],
      [
        "der Schalter",
        "شباك التذاكر",
        "the ticket counter",
        "het loket"
      ],
      [
        "die Durchsage",
        "الإعلان الصوتي",
        "the announcement",
        "de omroep"
      ],
      [
        "die Sitzplatzreservierung",
        "حجز مقعد",
        "the seat reservation",
        "de zitplaatsreservering"
      ],
      [
        "die Rückfahrt",
        "رحلة العودة",
        "the return journey",
        "de terugreis"
      ],
      [
        "die Einzelfahrkarte",
        "تذكرة ذهاب واحدة",
        "the single ticket",
        "het enkele kaartje"
      ],
      [
        "die Zugnummer",
        "رقم القطار",
        "the train number",
        "het treinnummer"
      ],
      [
        "die Ersatzverbindung",
        "رحلة بديلة",
        "the alternative connection",
        "de alternatieve verbinding"
      ]
    ],
    "p": [
      [
        "Ist mein Ticket auch für diesen Zug gültig?",
        "هل تذكرتي صالحة لهذا القطار أيضًا؟",
        "Is my ticket valid on this train too?",
        "Is mijn kaartje ook geldig voor deze trein?"
      ],
      [
        "Gibt es eine direkte Verbindung nach Graz?",
        "هل توجد رحلة مباشرة إلى غراتس؟",
        "Is there a direct connection to Graz?",
        "Is er een rechtstreekse verbinding naar Graz?"
      ],
      [
        "Wo kann ich einen Sitzplatz reservieren?",
        "أين يمكنني حجز مقعد؟",
        "Where can I reserve a seat?",
        "Waar kan ik een zitplaats reserveren?"
      ],
      [
        "Ich habe die Durchsage nicht verstanden.",
        "لم أفهم الإعلان الصوتي.",
        "I didn't understand the announcement.",
        "Ik heb de omroep niet begrepen."
      ],
      [
        "Fährt heute ein Ersatzzug?",
        "هل يوجد قطار بديل اليوم؟",
        "Is there a replacement train today?",
        "Rijdt er vandaag een vervangende trein?"
      ]
    ]
  },
  "bus": {
    "w": [
      [
        "der Bussteig",
        "رصيف انطلاق الحافلات",
        "the bus platform",
        "het busperron"
      ],
      [
        "der Fahrgast",
        "الراكب",
        "the passenger",
        "de passagier"
      ],
      [
        "der Fahrscheinkontrolleur",
        "مراقب التذاكر",
        "the ticket inspector",
        "de kaartjescontroleur"
      ],
      [
        "die Umleitung",
        "التحويلة المرورية",
        "the diversion",
        "de omleiding"
      ],
      [
        "die Abfahrtszeit",
        "موعد المغادرة",
        "the departure time",
        "de vertrektijd"
      ],
      [
        "die Anzeigetafel",
        "لوحة مواعيد الرحلات",
        "the departures board",
        "het vertrekbord"
      ],
      [
        "das Tagesticket",
        "تذكرة يوم كامل",
        "the day ticket",
        "het dagkaartje"
      ],
      [
        "die Umsteigestelle",
        "مكان تبديل وسيلة النقل",
        "the transfer stop",
        "de overstaphalte"
      ]
    ],
    "p": [
      [
        "Hält dieser Bus am Krankenhaus?",
        "هل تتوقف هذه الحافلة عند المستشفى؟",
        "Does this bus stop at the hospital?",
        "Stopt deze bus bij het ziekenhuis?"
      ],
      [
        "Kann ich im Bus ein Ticket kaufen?",
        "هل يمكنني شراء تذكرة داخل الحافلة؟",
        "Can I buy a ticket on the bus?",
        "Kan ik in de bus een kaartje kopen?"
      ],
      [
        "Wo kann ich zur Linie 5 umsteigen?",
        "أين يمكنني الانتقال إلى الخط رقم 5؟",
        "Where can I change to route 5?",
        "Waar kan ik overstappen op lijn 5?"
      ],
      [
        "Der Bus ist heute ausgefallen.",
        "أُلغيت رحلة الحافلة اليوم.",
        "The bus service was cancelled today.",
        "De busrit is vandaag uitgevallen."
      ],
      [
        "Gilt dieses Ticket den ganzen Tag?",
        "هل هذه التذكرة صالحة طوال اليوم؟",
        "Is this ticket valid all day?",
        "Is dit kaartje de hele dag geldig?"
      ]
    ]
  },
  "kindergarten": {
    "w": [
      [
        "die Leitung",
        "إدارة الروضة",
        "the kindergarten director",
        "de leiding"
      ],
      [
        "die Warteliste",
        "قائمة الانتظار",
        "the waiting list",
        "de wachtlijst"
      ],
      [
        "das Aufnahmegespräch",
        "مقابلة القبول",
        "the admission meeting",
        "het intakegesprek"
      ],
      [
        "das Mittagessen",
        "وجبة الغداء",
        "lunch",
        "de lunch"
      ],
      [
        "die Schlafenszeit",
        "وقت القيلولة",
        "nap time",
        "de slaaptijd"
      ],
      [
        "die Betreuungskosten",
        "تكاليف الرعاية",
        "childcare fees",
        "de opvangkosten"
      ],
      [
        "der Abholberechtigte",
        "الشخص المخوّل باستلام الطفل",
        "the authorised pick-up person",
        "de gemachtigde ophaler"
      ],
      [
        "der Turnbeutel",
        "حقيبة الملابس الرياضية",
        "the gym bag",
        "de gymtas"
      ]
    ],
    "p": [
      [
        "Steht mein Kind noch auf der Warteliste?",
        "هل ما زال طفلي على قائمة الانتظار؟",
        "Is my child still on the waiting list?",
        "Staat mijn kind nog op de wachtlijst?"
      ],
      [
        "Wann findet das Aufnahmegespräch statt?",
        "متى تُعقد مقابلة القبول؟",
        "When is the admission meeting?",
        "Wanneer is het intakegesprek?"
      ],
      [
        "Wer darf mein Kind abholen?",
        "من يُسمح له باستلام طفلي؟",
        "Who is allowed to pick up my child?",
        "Wie mag mijn kind ophalen?"
      ],
      [
        "Mein Kind möchte heute nicht im Kindergarten schlafen.",
        "طفلي لا يريد النوم في الروضة اليوم.",
        "My child doesn't want to nap at kindergarten today.",
        "Mijn kind wil vandaag niet op de kleuterschool slapen."
      ],
      [
        "Können Sie mir die Betreuungskosten erklären?",
        "هل يمكنك شرح تكاليف الرعاية لي؟",
        "Could you explain the childcare fees to me?",
        "Kunt u mij de opvangkosten uitleggen?"
      ]
    ]
  },
  "school": {
    "w": [
      [
        "die Klassenarbeit",
        "الاختبار الصفي",
        "the class test",
        "de klassentoets"
      ],
      [
        "die Schulferien",
        "العطلة المدرسية",
        "the school holidays",
        "de schoolvakantie"
      ],
      [
        "die Schulbücher",
        "الكتب المدرسية",
        "the schoolbooks",
        "de schoolboeken"
      ],
      [
        "die Nachmittagsbetreuung",
        "الرعاية بعد الظهر",
        "after-school care",
        "de naschoolse opvang"
      ],
      [
        "der Turnunterricht",
        "حصة الرياضة",
        "the PE lesson",
        "de gymles"
      ],
      [
        "die Schulveranstaltung",
        "الفعالية المدرسية",
        "the school event",
        "het schoolevenement"
      ],
      [
        "die Unterschrift der Eltern",
        "توقيع أولياء الأمور",
        "the parents' signature",
        "de handtekening van de ouders"
      ],
      [
        "die Schulbescheinigung",
        "إثبات التسجيل المدرسي",
        "the school attendance certificate",
        "de schoolverklaring"
      ]
    ],
    "p": [
      [
        "Müssen wir diesen Zettel unterschreiben?",
        "هل يجب علينا توقيع هذه الورقة؟",
        "Do we need to sign this note?",
        "Moeten we dit briefje ondertekenen?"
      ],
      [
        "Wann sind die nächsten Schulferien?",
        "متى تبدأ العطلة المدرسية القادمة؟",
        "When are the next school holidays?",
        "Wanneer is de volgende schoolvakantie?"
      ],
      [
        "Braucht mein Kind morgen Turnsachen?",
        "هل يحتاج طفلي إلى ملابس رياضية غدًا؟",
        "Does my child need gym clothes tomorrow?",
        "Heeft mijn kind morgen gymkleren nodig?"
      ],
      [
        "Wie kann ich mein Kind für die Nachmittagsbetreuung anmelden?",
        "كيف أسجّل طفلي في الرعاية بعد الظهر؟",
        "How can I register my child for after-school care?",
        "Hoe kan ik mijn kind aanmelden voor de naschoolse opvang?"
      ],
      [
        "Wann bekomme ich eine Schulbescheinigung?",
        "متى يمكنني الحصول على إثبات التسجيل المدرسي؟",
        "When can I get a school attendance certificate?",
        "Wanneer kan ik een schoolverklaring krijgen?"
      ]
    ]
  },
  "supermarket": {
    "w": [
      [
        "das Mindesthaltbarkeitsdatum",
        "تاريخ أفضل استهلاك قبل",
        "the best-before date",
        "de houdbaarheidsdatum"
      ],
      [
        "das Pfand",
        "مبلغ الرهن على العبوة",
        "the bottle deposit",
        "het statiegeld"
      ],
      [
        "der Gutschein",
        "قسيمة الشراء",
        "the voucher",
        "de waardebon"
      ],
      [
        "die Zutaten",
        "المكوّنات",
        "the ingredients",
        "de ingrediënten"
      ],
      [
        "der Tiefkühlbereich",
        "قسم الأطعمة المجمدة",
        "the frozen food section",
        "de diepvriesafdeling"
      ],
      [
        "die Selbstbedienungskasse",
        "صندوق الدفع الذاتي",
        "the self-checkout",
        "de zelfscankassa"
      ],
      [
        "die Waage",
        "الميزان",
        "the weighing scale",
        "de weegschaal"
      ],
      [
        "die Reklamation",
        "الشكوى على المنتج",
        "the product complaint",
        "de klacht over een product"
      ]
    ],
    "p": [
      [
        "Ist dieses Produkt noch haltbar?",
        "هل ما زال هذا المنتج صالحًا للاستهلاك؟",
        "Is this product still within its use-by date?",
        "Is dit product nog binnen de houdbaarheidsdatum?"
      ],
      [
        "Wie funktioniert die Selbstbedienungskasse?",
        "كيف يعمل صندوق الدفع الذاتي؟",
        "How does the self-checkout work?",
        "Hoe werkt de zelfscankassa?"
      ],
      [
        "Kann ich den Gutschein an der Kasse einlösen?",
        "هل يمكنني استخدام القسيمة عند صندوق الدفع؟",
        "Can I redeem the voucher at the checkout?",
        "Kan ik de waardebon bij de kassa inwisselen?"
      ],
      [
        "Wo kann ich leere Pfandflaschen zurückgeben?",
        "أين يمكنني إعادة عبوات الرهن الفارغة؟",
        "Where can I return empty deposit bottles?",
        "Waar kan ik lege statiegeldflessen inleveren?"
      ],
      [
        "Welche Zutaten enthält dieses Produkt?",
        "ما المكونات الموجودة في هذا المنتج؟",
        "What ingredients does this product contain?",
        "Welke ingrediënten bevat dit product?"
      ]
    ]
  },
  "everyday": {
    "w": [
      [
        "der Ausweis",
        "وثيقة الهوية",
        "the ID document",
        "het identiteitsbewijs"
      ],
      [
        "die Öffnungszeiten",
        "ساعات العمل الرسمية",
        "the opening hours",
        "de openingstijden"
      ],
      [
        "die Warteschlange",
        "طابور الانتظار",
        "the queue",
        "de wachtrij"
      ],
      [
        "die Auskunft",
        "الاستعلامات",
        "the information desk",
        "de informatiebalie"
      ],
      [
        "die Bestätigung",
        "التأكيد الرسمي",
        "the confirmation",
        "de bevestiging"
      ],
      [
        "die Kopie",
        "النسخة",
        "the copy",
        "de kopie"
      ],
      [
        "die Gebühr",
        "الرسم المالي",
        "the fee",
        "de kosten"
      ],
      [
        "der Eingang",
        "المدخل",
        "the entrance",
        "de ingang"
      ]
    ],
    "p": [
      [
        "Entschuldigung, wo ist der Eingang?",
        "عذرًا، أين المدخل؟",
        "Excuse me, where is the entrance?",
        "Pardon, waar is de ingang?"
      ],
      [
        "Muss ich zuerst eine Nummer ziehen?",
        "هل يجب أن آخذ رقم انتظار أولًا؟",
        "Do I need to take a queue number first?",
        "Moet ik eerst een nummertje trekken?"
      ],
      [
        "Wo finde ich die Öffnungszeiten?",
        "أين أجد ساعات العمل؟",
        "Where can I find the opening hours?",
        "Waar kan ik de openingstijden vinden?"
      ],
      [
        "Brauche ich eine Kopie von diesem Dokument?",
        "هل أحتاج إلى نسخة من هذه الوثيقة؟",
        "Do I need a copy of this document?",
        "Heb ik een kopie van dit document nodig?"
      ],
      [
        "Können Sie mir das schriftlich bestätigen?",
        "هل يمكنك تأكيد ذلك لي خطيًا؟",
        "Could you confirm that in writing?",
        "Kunt u dit schriftelijk bevestigen?"
      ]
    ]
  },
  "work": {
    "w": [
      [
        "die Personalabteilung",
        "قسم الموارد البشرية",
        "the HR department",
        "de personeelsafdeling"
      ],
      [
        "die Lohnerhöhung",
        "زيادة الراتب",
        "the pay rise",
        "de loonsverhoging"
      ],
      [
        "die Krankmeldung",
        "إبلاغ المرض",
        "the sick notification",
        "de ziekmelding"
      ],
      [
        "die Vertretung",
        "المناوبة بدل زميل",
        "the cover shift",
        "de vervanging"
      ],
      [
        "der Zuschlag",
        "علاوة الأجر",
        "the pay supplement",
        "de toeslag"
      ],
      [
        "die Arbeitskleidung",
        "ملابس العمل",
        "work clothing",
        "de werkkleding"
      ],
      [
        "der Feierabend",
        "نهاية يوم العمل",
        "the end of the working day",
        "het einde van de werkdag"
      ],
      [
        "die Arbeitsanweisung",
        "تعليمات العمل",
        "the work instructions",
        "de werkinstructie"
      ]
    ],
    "p": [
      [
        "Wer ist heute für unsere Schicht zuständig?",
        "من المسؤول عن ورديتنا اليوم؟",
        "Who is in charge of our shift today?",
        "Wie is vandaag verantwoordelijk voor onze dienst?"
      ],
      [
        "Ich möchte meinen Dienstplan überprüfen.",
        "أريد مراجعة جدول دوامي.",
        "I would like to check my work schedule.",
        "Ik wil mijn werkrooster controleren."
      ],
      [
        "Bekomme ich für die Nachtschicht einen Zuschlag?",
        "هل أحصل على علاوة للوردية الليلية؟",
        "Do I receive a supplement for night shifts?",
        "Krijg ik een toeslag voor de nachtdienst?"
      ],
      [
        "Ich muss mich für morgen krankmelden.",
        "عليّ إبلاغ الشركة بأنني مريض غدًا.",
        "I need to report sick for tomorrow.",
        "Ik moet me voor morgen ziekmelden."
      ],
      [
        "Können wir die Aufgabe gemeinsam erledigen?",
        "هل يمكننا إنجاز المهمة معًا؟",
        "Can we complete the task together?",
        "Kunnen we de taak samen uitvoeren?"
      ]
    ]
  },
  "ams": {
    "w": [
      [
        "die Stellenausschreibung",
        "إعلان وظيفة شاغرة",
        "the job vacancy notice",
        "de vacaturetekst"
      ],
      [
        "die Arbeitsbestätigung",
        "شهادة العمل",
        "the employment confirmation",
        "de werkverklaring"
      ],
      [
        "der Lebenslauf",
        "السيرة الذاتية",
        "the CV",
        "het cv"
      ],
      [
        "die Weiterbildung",
        "التدريب الإضافي",
        "further training",
        "de bijscholing"
      ],
      [
        "die Mitteilung",
        "الإشعار",
        "the notification",
        "de mededeling"
      ],
      [
        "die Frist",
        "المهلة النهائية",
        "the deadline",
        "de deadline"
      ],
      [
        "der Versicherungsnachweis",
        "إثبات التأمين",
        "the insurance proof",
        "het verzekeringsbewijs"
      ],
      [
        "die Beratung",
        "الاستشارة",
        "the counselling session",
        "het adviesgesprek"
      ]
    ],
    "p": [
      [
        "Ich habe eine neue Stelle gefunden.",
        "وجدت وظيفة جديدة.",
        "I have found a new job.",
        "Ik heb een nieuwe baan gevonden."
      ],
      [
        "Bis wann muss ich die Unterlagen einreichen?",
        "حتى متى يجب تسليم المستندات؟",
        "By when must I submit the documents?",
        "Tot wanneer moet ik de documenten indienen?"
      ],
      [
        "Ich interessiere mich für eine Weiterbildung.",
        "أنا مهتم بدورة تدريبية إضافية.",
        "I am interested in further training.",
        "Ik ben geïnteresseerd in bijscholing."
      ],
      [
        "Können wir den Lebenslauf gemeinsam durchgehen?",
        "هل يمكننا مراجعة السيرة الذاتية معًا؟",
        "Could we review my CV together?",
        "Kunnen we samen mijn cv doornemen?"
      ],
      [
        "Ich möchte wissen, welche Stellen noch frei sind.",
        "أريد معرفة الوظائف الشاغرة حاليًا.",
        "I would like to know which positions are still open.",
        "Ik wil graag weten welke vacatures nog openstaan."
      ]
    ]
  }
};global.WORT_TOPICS_EXTRA=Object.assign(global.WORT_TOPICS_EXTRA||{},data);})(globalThis);
