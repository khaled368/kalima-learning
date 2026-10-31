#!/usr/bin/env python3
"""Compile distinct dictionary headwords, preserve original saved IDs, and balance five learning groups.
Source fetch/normalization scripts and licences are documented in SOURCES.md.
"""
import json,re,unicodedata,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
RAW=ROOT/'data-sources'; OUT=ROOT/'dist'/'data'; OUT.mkdir(exist_ok=True)
def read(path):return json.loads(path.read_text())
def norm(text):return unicodedata.normalize('NFC',text).strip().casefold()
levels=['A1','A2','B1','B2','C1']
curated=read(ROOT/'tools/curated-vocabulary.json')
translations={}
for file in (ROOT/'tools/translations').glob('ar-translations-*.json'):translations.update(read(file))
full_translations={}
metadata_fixes={}
full_exclude=set()
for file in (ROOT/'tools/translations').glob('full-translations-*.json'):full_translations.update(read(file))
for file in (ROOT/'tools/translations').glob('full-metadata-*.json'):metadata_fixes.update(read(file))
for file in (ROOT/'tools/translations').glob('full-exclude-*.json'):
 rows=read(file)
 if isinstance(rows,dict):rows=rows.get('exclude',list(rows))
 for row in rows:full_exclude.add(norm(row.get('german','')) if isinstance(row,dict) else norm(row))
corrections={}
for file in (ROOT/'tools/translations').glob('meaning-corrections-*.json'):corrections.update(read(file))
reviewed=read(ROOT/'tools/reviewed-details.json')
validated_examples=read(RAW/'validated-example-overrides.json')
exclude=set()
for file in [RAW/'ar-translations-1-review.json',RAW/'ar-uncertain-2.json',RAW/'ar-translations-3-exclude.json']:
 if not file.exists():continue
 rows=read(file)
 if isinstance(rows,dict):rows=rows.get('reviewRecommended',[])
 for row in rows:exclude.add(str(row.get('sourceId')) if isinstance(row,dict) else str(row))
POS={'substantiv':'noun','adjektiv':'adjective','pron':'pronoun','pronomen':'pronoun','prep':'preposition','praeposition':'preposition','conj':'conjunction','konjunktion':'conjunction','intj':'interjection','aux':'verb','proadv':'adverb','sconj':'conjunction','wpro':'pronoun','num':'other','numerale':'other','det':'other','card':'other','particle':'other','artikel':'other','partikel':'other','kardinalzahlwort':'other','postp':'preposition'}
base=read(RAW/'combined-candidates.json')
extra=read(RAW/'ding-additional-typed-candidates.json')
vetted={norm(w['german']):w for w in read(RAW/'extra-direct-vetted-pool.json')}
by_word={};rejected=collections.Counter()
name_pattern=re.compile(r'Vorname|Nachname|Familienname|Eigenname|männlicher Name|weiblicher Name|surname|given name|family name',re.I)
questionable_ar=re.compile(r'صيغة غير معيارية|غير موثّقة|غير محدد المعنى|غير مكتمل|لفظ إنجليزي|إطالة كتابية|اسم (?:شخص|عائلة|شارع)|علامة تجارية|معنى مشتق')
def eligible(w):
 if w.get('originalPos') in ('proper_noun','name') or w.get('pos') in ('proper_noun','name'):return False
 if str(w.get('sourceId')) in exclude or norm(w['german']) in full_exclude:return False
 if name_pattern.search(' '.join(w.get('definitions',[]))):return False
 if not re.fullmatch(r'[A-Za-zÄÖÜäöüßÉé]+(?:[- ][A-Za-zÄÖÜäöüßÉé]+)*',w['german']):return False
 if len(w['german'])<2:return False
 if not w.get('examples'):return False
 return True
for word in base+extra:
 if not eligible(word):rejected['quality']+=1;continue
 if norm(word['german'])!=norm(word.get('lemma') or word['german']):rejected['inflected_surface']+=1;continue
 w=dict(word);key=norm(w['german'])
 w['pos']=POS.get(w['pos'],w['pos'])
 if key in validated_examples:w['examples']=validated_examples[key]
 else:rejected['unmatched_example']+=1;continue
 if key in metadata_fixes:
  for field,value in metadata_fixes[key].items():
   if field in ['pos','article','plural','comparative','superlative','declensionStem','examples','note']:w[field]=value
 if key in reviewed:w.update(reviewed[key])
 if w['pos'] in ['abbrev','unknown','andere','prefix']:rejected['untyped']+=1;continue
 if str(w['sourceId']) in translations:
  w['arabic']=translations[str(w['sourceId'])];w['translationKind']='authored'
 if key in vetted:
  w['arabic']=vetted[key]['arabic'];w['translationKind']='direct'
 if key in full_translations:
  w['arabic']=full_translations[key];w['translationKind']='authored'
 if key in corrections:
  w['arabic']=corrections[key];w['translationKind']='reviewed'
 if w.get('translationKind')=='pivot':rejected['unreviewed_pivot']+=1;continue
 if not w.get('arabic') or not re.search(r'[\u0600-\u06ff]',w['arabic']):rejected['untranslated']+=1;continue
 if questionable_ar.search(w['arabic']):rejected['dubious_gloss']+=1;continue
 if key not in by_word:by_word[key]=w
# Keep original IDs and glosses, overriding homonym noise.
seeds=[]
for seed in curated:
 seed=dict(seed);key=norm(seed['german']);source=by_word.pop(key,{})
 for field in ['ipa','sourceUrl','sourceId','definitions']:
  if source.get(field) and not seed.get(field):seed[field]=source[field]
 seed['forms']=[] # Curated morphology is reviewed; merged homonym tables are not used here.
 if key in reviewed:seed.update(reviewed[key])
 seed['lemma']=seed['german'];seed['translationKind']='curated'
 seeds.append(seed)
# Frequency is a learning-order heuristic, not a CEFR certification.
def score(w):
 tags=w.get('cefrTags',[])
 tag=min([levels.index(x) for x in tags if x in levels],default=3)
 freq=w.get('frequency',1e9)
 if not isinstance(freq,(float,int)):freq=1e9
 full=any(re.search(r'[.!?]$',e['de'].strip()) for e in w['examples'])
 # Prefer examples in complete sentences to dictionary fragments.
 extra_source=1 if str(w.get('sourceId','')).startswith('ding-') else 0
 return (extra_source,0 if full else 1,tag,freq,len(w['german']),w['german'].casefold())
pool=sorted(by_word.values(),key=score)
needed=10000-len(seeds)
assert len(pool)>=needed,(len(pool),needed,rejected)
selected=pool[:needed]
# Allocate two thousand real entries per level, maintaining all old level placements.
assigned={level:[w for w in seeds if w['level']==level] for level in levels}
index=0
for level in levels:
 count=2000-len(assigned[level])
 for word in selected[index:index+count]:
  w=dict(word);w['level']=level;w['id']=level+':'+norm(w['german']);assigned[level].append(w)
 index+=count

def compact(w):
 out={key:w[key] for key in ['id','level','german','lemma','article','arabic','pos','plural','comparative','superlative','declensionStem','verbForms','translationKind','sourceUrl','sourceId','note'] if w.get(key) is not None and w.get(key)!=''}
 out.setdefault('article','');out.setdefault('pos','other')
 if out['pos']!='noun':out['article']=''
 examples=[];seen=set()
 for e in w.get('examples',[]):
  text=e.get('de','').strip()
  if not text or text in seen:continue
  seen.add(text)
  ex={k:v for k,v in e.items() if v and k in ['de','ar','source','sourceUrl','license','generated','author']}
  examples.append(ex)
 examples.sort(key=lambda e:(0 if e.get('ar') else 1,0 if len(e['de'])<240 else 1,0 if re.search(r'[.!?]$',e['de']) else 1,len(e['de'])))
 out['examples']=examples[:2]
 # Only reviewed morphology is displayed; noisy merged foreign-language inflections are omitted.
 return out
counts={};kinds=collections.Counter();stats=collections.Counter()
for level in levels:
 data=[compact(w) for w in assigned[level]]
 assert len(data)==2000
 (OUT/(level+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 for w in data:
  kinds[w['translationKind']]+=1
  stats['translated_examples']+=sum(bool(e.get('ar')) for e in w['examples'])
  stats['complete_sentence_entries']+=any(re.search(r'[.!?]$',e['de']) for e in w['examples'])
 counts[level]=len(data)
names=['برونزي','فضي','ذهبي','نجمي','ماسي','ملكي','إمبراطوري','كريستالي','أسطوري','خالد'];thresholds=[100,250,500,1000,2000,3500,5000,6500,8000,10000]
sources=[
 {'name':'WortUniversum German Vocabulary Database','url':'https://huggingface.co/datasets/cstr/grundwortschatz-voc-de','license':'GPL-3.0؛ بيانات من Wiktionary CC BY-SA 4.0 وTatoeba CC BY 2.0 FR','note':'استُبعدت أسماء الأشخاص والصيغ المكررة والإدخالات المعلّمة للمراجعة. تتضمن البيانات أمثلة مولّدة في المصدر ومعلّمة بذلك.'},
 {'name':'Ding / TU Chemnitz via FreeDict — German–English','url':'https://freedict.org/downloads/#dictionary-downloads','license':'GPL-3.0 / AGPL-3.0، راجع ملف تراخيص Ding','note':'مداخل قاموسية إضافية مع أمثلة أصلية؛ بعض الأمثلة تعبيرات أو تراكيب قصيرة.'},
 {'name':'FreeDict English–Arabic / Arabeyes','url':'https://freedict.org/downloads/#dictionary-downloads','license':'GPL-2.0-or-later','note':'استُخدم المصدر أثناء جمع البيانات، ثم استُبدلت المعاني المنقولة عبر الإنجليزية بترجمات عربية مُعدّة للموقع.'},
 {'name':'German–Arabic dictionary — selected entries only','url':'https://github.com/Mohamed-bouri/german-arabic','license':'MIT','note':'استُخدمت المداخل المنقّحة فقط؛ استُبعدت التعريفات الاصطناعية.'},
 {'name':'تراخيص البيانات المجمّعة','url':'licenses/GPL-3.0.txt','license':'نسخة من رخصة GPL-3.0؛ ملفات JSON للمستويات متاحة للتنزيل من روابطها أدناه.'}
]
manifest={'levels':[{'code':l,'count':2000,'data':'data/'+l+'.json'} for l in levels],'total':10000,'levelNote':'2000 بطاقة في كل قسم، تضم مفردات وصيغًا لغوية مفيدة. تقسيم المستويات تعليمي تقريبي وليس قائمة امتحان رسمية. الأمثلة بالألمانية مع ترجمة عربية حين تتوفر، والتصريفات المعروضة مُعدّة للكلمات التي راجعناها.','shields':[{'name':n,'threshold':t} for n,t in zip(names,thresholds)],'shieldNote':'الدروع العشرة تفتح مع تقدّمك في تعلّم الكلمات، من 100 إلى 10,000 كلمة.','sources':sources,'dataLicense':'See source-specific licence notices in licenses/','translationCounts':dict(kinds),'qualityStats':dict(stats)}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'counts':counts,'pool':len(pool),'rejected':dict(rejected),'translations':dict(kinds),'examples':dict(stats)},ensure_ascii=False,indent=2))
