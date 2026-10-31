import json
from pathlib import Path
P=Path(__file__).resolve().parent
D={}
def item(word,**fields):D.setdefault(word.casefold(),{}).update(fields)
examples=[
('ich','Ich wohne in Berlin.','أنا أسكن في برلين.'),('du','Du sprichst sehr gut Deutsch.','أنت تتحدث الألمانية جيدًا جدًا.'),('er','Er liest ein Buch.','هو يقرأ كتابًا.'),('sie','Sie trinkt einen Kaffee.','هي تشرب قهوة.'),('es','Es regnet heute.','إنها تمطر اليوم.'),('wir','Wir lernen jeden Tag Deutsch.','نحن نتعلّم الألمانية كل يوم.'),('ihr','Ihr seid heute sehr pünktlich.','أنتم ملتزمون بالموعد اليوم.'),('ihn','Ich sehe ihn jeden Morgen.','أراه كل صباح.'),('ihm','Ich helfe ihm bei der Arbeit.','أساعده في العمل.'),('mal','Komm mal bitte hierher.','تعال إلى هنا من فضلك.'),('ein','Das ist ein guter Plan.','هذه خطة جيدة.'),('eine','Sie hat eine neue Tasche.','لديها حقيبة جديدة.'),('der','Der Bus kommt gleich.','ستصل الحافلة حالًا.'),('die','Die Tür ist offen.','الباب مفتوح.'),('das','Das Fenster ist groß.','النافذة كبيرة.'),('sein','Ich möchte heute zu Hause sein.','أودّ أن أكون في المنزل اليوم.'),('haben','Wir haben heute viel Zeit.','لدينا وقت كثير اليوم.'),('werden','Es wird morgen kälter.','سيصبح الجو أبرد غدًا.'),('wollen','Wir wollen zusammen Deutsch lernen.','نريد أن نتعلّم الألمانية معًا.'),('geben','Kannst du mir bitte das Buch geben?','هل يمكنك أن تعطيني الكتاب من فضلك؟'),('bringen','Ich bringe dir ein Glas Wasser.','سأحضر لك كوبًا من الماء.'),('bekommen','Ich bekomme morgen einen Brief.','سأتلقّى رسالة غدًا.'),('Arm','Mein linker Arm tut weh.','ذراعي اليسرى تؤلمني.'),('Leben','Das Leben in dieser Stadt ist angenehm.','الحياة في هذه المدينة مريحة.'),('Bank','Ich sitze auf einer Bank im Park.','أجلس على مقعد في الحديقة.'),('Schloss','Das alte Schloss liegt auf einem Hügel.','يقع القصر القديم على تلّ.'),('Licht','Mach bitte das Licht an.','أشعل الضوء من فضلك.'),('leicht','Diese Tasche ist leicht.','هذه الحقيبة خفيفة.'),('schwer','Diese Aufgabe ist schwer.','هذه المهمة صعبة.'),('lernen','Ich lerne jeden Abend zehn neue Wörter.','أتعلّم عشر كلمات جديدة كل مساء.'),('gehen','Wir gehen heute zu Fuß zur Schule.','نذهب إلى المدرسة سيرًا على الأقدام اليوم.'),('kommen','Meine Freunde kommen morgen zu Besuch.','سيأتي أصدقائي للزيارة غدًا.'),('sehen','Ich sehe einen Vogel im Baum.','أرى طائرًا على الشجرة.'),('lesen','Sie liest jeden Abend ein Buch.','تقرأ كتابًا كل مساء.'),('sprechen','Wir sprechen zu Hause Arabisch.','نتحدث العربية في المنزل.'),('nehmen','Ich nehme heute den Zug.','سأستقل القطار اليوم.'),('finden','Ich finde meinen Schlüssel nicht.','لا أجد مفتاحي.'),('kennen','Kennst du dieses Wort?','هل تعرف هذه الكلمة؟'),('wissen','Ich weiß die Antwort.','أعرف الإجابة.'),('machen','Was machst du am Wochenende?','ماذا تفعل في عطلة نهاية الأسبوع؟'),('sagen','Kannst du das bitte noch einmal sagen?','هل يمكنك أن تقول ذلك مرة أخرى من فضلك؟'),('schreiben','Er schreibt eine Nachricht an seine Schwester.','يكتب رسالة إلى أخته.'),('verstehen','Ich verstehe deine Frage.','أفهم سؤالك.'),('arbeiten','Meine Schwester arbeitet in einem Krankenhaus.','تعمل أختي في مستشفى.'),('helfen','Kannst du mir bitte helfen?','هل يمكنك مساعدتي من فضلك؟'),('bleiben','Wir bleiben heute zu Hause.','سنبقى في المنزل اليوم.'),('fahren','Morgen fahren wir nach Hamburg.','سنسافر إلى هامبورغ غدًا.'),('schlafen','Das Kind schläft schon.','الطفل نائم بالفعل.'),('sitzen','Die Kinder sitzen am Tisch.','يجلس الأطفال إلى الطاولة.'),('liegen','Das Buch liegt auf dem Tisch.','الكتاب موضوع على الطاولة.'),('stehen','Die Flasche steht im Kühlschrank.','الزجاجة في الثلاجة.'),('beginnen','Der Unterricht beginnt um acht Uhr.','يبدأ الدرس في الساعة الثامنة.'),('kaufen','Ich kaufe frisches Obst auf dem Markt.','أشتري فاكهة طازجة من السوق.')]
for word,de,ar in examples:item(word,examples=[{'de':de,'ar':ar,'source':'مثال تعليمي مُعدّ لهذا الموقع'}])
for word in ['ich','du','er','sie','es','wir','ihr','ihn','ihm']:item(word,pos='pronoun',article='')
item('mal',pos='adverb',article='',ipa='',forms=[],germanDefinition='')
for word in ['ein','eine','der','die','das']:item(word,pos='other',article='')
verbs='''sein|ist|war|ist gewesen
haben|hat|hatte|hat gehabt
werden|wird|wurde|ist geworden
wollen|will|wollte|hat gewollt
können|kann|konnte|hat gekonnt
müssen|muss|musste|hat gemusst
sollen|soll|sollte|hat gesollt
dürfen|darf|durfte|hat gedurft
mögen|mag|mochte|hat gemocht
gehen|geht|ging|ist gegangen
kommen|kommt|kam|ist gekommen
fahren|fährt|fuhr|ist gefahren
laufen|läuft|lief|ist gelaufen
fliegen|fliegt|flog|ist geflogen
bleiben|bleibt|blieb|ist geblieben
lesen|liest|las|hat gelesen
sehen|sieht|sah|hat gesehen
sprechen|spricht|sprach|hat gesprochen
essen|isst|aß|hat gegessen
trinken|trinkt|trank|hat getrunken
schlafen|schläft|schlief|hat geschlafen
helfen|hilft|half|hat geholfen
nehmen|nimmt|nahm|hat genommen
geben|gibt|gab|hat gegeben
finden|findet|fand|hat gefunden
denken|denkt|dachte|hat gedacht
bringen|bringt|brachte|hat gebracht
kennen|kennt|kannte|hat gekannt
stehen|steht|stand|hat gestanden
sitzen|sitzt|saß|hat gesessen
liegen|liegt|lag|hat gelegen
lernen|lernt|lernte|hat gelernt
arbeiten|arbeitet|arbeitete|hat gearbeitet
machen|macht|machte|hat gemacht
sagen|sagt|sagte|hat gesagt
schreiben|schreibt|schrieb|hat geschrieben
verstehen|versteht|verstand|hat verstanden
bekommen|bekommt|bekam|hat bekommen
erhalten|erhält|erhielt|hat erhalten
beginnen|beginnt|begann|hat begonnen
treffen|trifft|traf|hat getroffen
tragen|trägt|trug|hat getragen
halten|hält|hielt|hat gehalten
rufen|ruft|rief|hat gerufen
wissen|weiß|wusste|hat gewusst
bezahlen|bezahlt|bezahlte|hat bezahlt
kaufen|kauft|kaufte|hat gekauft
verkaufen|verkauft|verkaufte|hat verkauft
besuchen|besucht|besuchte|hat besucht
leben|lebt|lebte|hat gelebt'''
for line in verbs.splitlines():
 word,present,past,perfect=line.split('|');item(word,pos='verb',article='',verbForms={'present':present,'past':past,'perfect':perfect})
adjectives='''gut|besser|am besten|gut
schlecht|schlechter|am schlechtesten|schlecht
groß|größer|am größten|groß
klein|kleiner|am kleinsten|klein
alt|älter|am ältesten|alt
jung|jünger|am jüngsten|jung
neu|neuer|am neuesten|neu
schön|schöner|am schönsten|schön
lang|länger|am längsten|lang
kurz|kürzer|am kürzesten|kurz
hell|heller|am hellsten|hell
dunkel|dunkler|am dunkelsten|dunkl
stark|stärker|am stärksten|stark
schwach|schwächer|am schwächsten|schwach
hoch|höher|am höchsten|hoh
nah|näher|am nächsten|nah
warm|wärmer|am wärmsten|warm
kalt|kälter|am kältesten|kalt
schnell|schneller|am schnellsten|schnell
langsam|langsamer|am langsamsten|langsam
leicht|leichter|am leichtesten|leicht
schwer|schwerer|am schwersten|schwer
teuer|teurer|am teuersten|teur
billig|billiger|am billigsten|billig
stolz|stolzer|am stolzesten|stolz
gesund|gesünder|am gesündesten|gesund
rot|röter|am rötesten|rot
breit|breiter|am breitesten|breit
glatt|glatter|am glattesten|glatt
hart|härter|am härtesten|hart'''
for line in adjectives.splitlines():
 word,comp,sup,stem=line.split('|');item(word,pos='adjective',article='',comparative=comp,superlative=sup,declensionStem=stem)
(P/'reviewed-details.json').write_text(json.dumps(D,ensure_ascii=False,indent=2));print('Reviewed details:',len(D))
