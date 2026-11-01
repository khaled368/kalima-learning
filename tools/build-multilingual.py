#!/usr/bin/env python3
"""Build four-text dictionary courses. Levels are frequency-based study bands, not CEFR certification.

Original German cards are never rewritten. Raw files live under data-sources/multilingual;
source URLs and licences are exported with each course. Run with --allow-partial-legacy
only while authored legacy supplement files are still being prepared.
"""
from pathlib import Path
import argparse,collections,hashlib,json,re,sqlite3,tarfile,unicodedata,zipfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]; RAW=ROOT/'data-sources'; SRC=RAW/'multilingual'; OUT=ROOT/'dist/data/courses'; LEVELS=['A1','A2','B1','B2','C1']; LANGS=['ar','en','nl','de']
parser=argparse.ArgumentParser();parser.add_argument('--allow-partial-legacy',action='store_true');parser.add_argument('--legacy-only',action='store_true');args=parser.parse_args()
NS={'t':'http://www.tei-c.org/ns/1.0'}; DIAC=re.compile('[\u064b-\u065f\u0670\u0640]'); CLEAN=re.compile(r'[A-Za-zÄÖÜäöüßÉéËëÏïÀàÈèÊêÔôÛûÇç]+(?:[- ][A-Za-zÄÖÜäöüßÉéËëÏïÀàÈèÊêÔôÛûÇç]+){0,3}')
POS={'n':'noun','v':'verb','adj':'adjective','adv':'adverb','prep':'preposition','conj':'conjunction','pron':'pronoun','interj':'interjection','num':'other'}
def load(p):return json.loads(p.read_text())
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_suffix(p.suffix+'.tmp');temp.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')));temp.replace(p)
def norm(t):return unicodedata.normalize('NFC',str(t).replace('_',' ')).strip().casefold()
def key(lang,t):
 t=norm(t)
 if lang=='ar':
  t=DIAC.sub('',t)
  if len(t)>4 and t.startswith('ال') and t not in ['الذي','التي','الذين','الله','اللهم']:t=t[2:]
 return t
FREQ={}
for lang in LANGS:
 FREQ[lang]={}
 for i,line in enumerate((SRC/f'{lang}-frequency.txt').read_text().splitlines()):
  word=line.rsplit(' ',1)[0];FREQ[lang].setdefault(key(lang,word),i+1)
def rank(lang,t):return FREQ[lang].get(key(lang,t),1000000)
def first(t):return re.split(r'[؛;،,]|\s*\(',str(t))[0].strip()
def arscore(a,b):
 aa={key('ar',x) for x in re.findall(r'[\u0600-\u06ff]+',a)};bb={key('ar',x) for x in re.findall(r'[\u0600-\u06ff]+',b)}
 return len(aa&bb)
def db(name):
 return {norm(w):{'values':t.split(' | '),'score':s,'importance':imp or 0} for w,t,s,imp in sqlite3.connect(SRC/name).execute('select written_rep,trans_list,max_score,rel_importance from simple_translation')}
ENNL=db('en-nl.sqlite3'); DENL=db('de-nl.sqlite3'); NLEN=db('nl-en.sqlite3'); ARMAP=load(RAW/'eng-ara-map.json')
legacy=[w for level in LEVELS for w in load(ROOT/'dist/data'/f'{level}.json')]; NEW_CONTEXT=load(ROOT/'tools/multilingual/new-course-context-corrections.json') if (ROOT/'tools/multilingual/new-course-context-corrections.json').exists() else {}; LEG={norm(w['german']):{**w,'arabic':NEW_CONTEXT.get(str(w['id']),{}).get('texts',{}).get('ar',w['arabic']),'pos':NEW_CONTEXT.get(str(w['id']),{}).get('pos',w['pos'])} for w in legacy}; base=load(ROOT/'dist/data/manifest.json')
authored={}
def override_order(p):
 group=3 if 'quality' in p.name else 2 if 'core' in p.name else 1 if 'full' in p.name else 0
 match=re.search(r'-(\d+)\.json$',p.name);return (group,int(match.group(1)) if match else 0,p.name)
for p in sorted((ROOT/'tools/multilingual').glob('legacy-overrides-*.json'),key=override_order):authored.update(load(p))
# Cache extraction only; a clean checkout can regenerate it from the retained licensed TEI.
cache=SRC/'derived-ding.json'
if cache.exists():ding=load(cache)
else:
 ding=[];t=tarfile.open(RAW/'freedict-deu-eng.src.tar.xz');member=next(m for m in t.getmembers() if m.name.endswith('.tei'))
 for _,e in ET.iterparse(t.extractfile(member),events=('end',)):
  if not e.tag.endswith('}entry'):continue
  forms=[' '.join(''.join(q.itertext()).split()) for q in e.findall('./t:form/t:orth',NS)];ens=[' '.join(''.join(q.itertext()).split()) for q in e.findall('./t:sense/t:cit[@type="trans"]/t:quote',NS)]
  gram={q.tag.split('}')[-1]:q.text for q in e.findall('./t:gramGrp/*',NS)};source=e.attrib.get('{http://www.w3.org/XML/1998/namespace}id','')
  for de in forms:
   if CLEAN.fullmatch(de) and len(de)>1:ding.append({'de':de,'en':ens,'grammar':gram,'sourceId':source})
  e.clear()
 write(cache,ding)
print('Ding entries',len(ding),flush=True)
DING=collections.defaultdict(list)
for w in ding:DING[norm(w['de'])].append(w)
RAWEN=collections.defaultdict(list)
for w in load(RAW/'combined-candidates.json')+load(RAW/'ding-additional-typed-candidates.json'):RAWEN[norm(w['german'])].extend(w.get('english',[]))
# English/Arabic/Dutch/German source sentence alignment uses exact English strings.
example_maps={}
for lang,path in [('de',RAW/'deu-eng-sentences.zip'),('nl',SRC/'nld-eng.zip'),('ar',SRC/'ara-eng.zip')]:
 z=zipfile.ZipFile(path);name=next(n for n in z.namelist() if n.endswith('.txt') and not n.startswith('_'));sent={}
 for line in z.open(name):
  p=line.decode('utf8').rstrip('\n').split('\t')
  if len(p)<3:continue
  en,text,attrib=p[:3]
  if len(en)>200 or len(text)>240 or not re.search('[.!?]$',en):continue
  if lang=='ar' and not re.search('[\u0600-\u06ff]',text):continue
  sent.setdefault(en,{'text':text,'attribution':attrib})
 example_maps[lang]=sent
examples=[]
all_english=set.union(*(set(v) for v in example_maps.values()))
for en in sorted(all_english,key=lambda x:(len(x),x)):
 present={l:v[en] for l,v in example_maps.items() if en in v}
 examples.append({'texts':{'en':en,**{l:v['text'] for l,v in present.items()}},'source':'Tatoeba via ManyThings','sourceUrl':'https://tatoeba.org/','license':'CC BY 2.0 FR','attributions':{l:v['attribution'] for l,v in present.items()}})
PARALLEL_FIXES=load(ROOT/'tools/multilingual/reviewed-parallel-examples.json') if (ROOT/'tools/multilingual/reviewed-parallel-examples.json').exists() else []
BANNED_EN={v['replaceEnglish'] for v in PARALLEL_FIXES}
examples=[e for e in examples if e['texts'].get('en') not in BANNED_EN]
TOKENS=[];EXINDEX={l:collections.defaultdict(list) for l in LANGS}
for i,e in enumerate(examples):
 tokens={l:{key(l,t) for t in re.findall(r'[^\W\d_]+',text,re.UNICODE)} for l,text in e['texts'].items()};TOKENS.append(tokens)
 for l in tokens:
  for token in tokens[l]:EXINDEX[l][token].append(i)
def contains(lang,term,e):
 words=[key(lang,t) for t in re.findall(r'[^\W\d_]+',term,re.UNICODE)]
 if len(words)==1:
  k=words[0]
  if k in TOKENS[e][lang]:return True
  if lang=='ar':return any(re.fullmatch(r'[وفبكل]?'+re.escape(k),t) for t in TOKENS[e][lang])
  return False
 return norm(term) in norm(examples[e]['texts'][lang])
def cardexamples(texts,target):
 terms=re.findall(r'[^\W\d_]+',texts[target],re.UNICODE)
 candidates=EXINDEX[target].get(key(target,terms[0]),[]) if terms else []
 found=[];missing={l for l in LANGS if l!=target}
 for i in candidates:
  if not contains(target,texts[target],i):continue
  available={l for l in missing if l in examples[i]['texts'] and contains(l,texts[l],i)}
  if available:
   admitted={target}|available;raw=examples[i];found.append({**raw,'texts':{l:t for l,t in raw['texts'].items() if l in admitted},'attributions':{l:t for l,t in raw.get('attributions',{}).items() if l in admitted}});missing-=available
  if not missing:break
 return found
def cleanrow(texts):return all(isinstance(texts.get(l),str) and texts[l].strip() and len(texts[l])<=80 for l in LANGS) and not re.search('[A-Za-z]',texts['ar'])
# Bulk curriculum admission requires an exact Arabic meaning anchor on a shared WordNet sense,
# a matching source POS, and a Dutch translation listed independently for DE and EN.
# Broad dictionary pivots are deliberately NOT admitted merely to meet a word-count target.
rows=[]
def add(texts,pos,source,quality,articles=None,synset=None,target_only=None,intended=None,authored_examples=None):
 texts={l:first(v) for l,v in texts.items()}
 articles=dict(articles or {})
 if pos=='verb' and texts.get('en','').lower().startswith('to '):texts['en']=texts['en'][3:].strip()
 match=re.match(r'^(de|het) (.+)$',texts.get('nl','')) if pos=='noun' else None
 if match:articles.setdefault('nl',match.group(1));texts['nl']=match.group(2)
 if not cleanrow(texts):return
 rows.append({'texts':texts,'articles':articles,'pos':pos,'sourceId':source,'quality':quality,'synset':synset,'targetOnly':target_only,'intendedLevel':intended,'examples':authored_examples or [],'order':len(rows)})
def tab(path,tag):
 d=collections.defaultdict(list)
 for line in path.read_text().splitlines():
  p=line.split('\t')
  if len(p)==3 and p[1]==tag:d[p[0]].append(p[2].replace('_',' '))
 return d
ARWN=tab(SRC/'wn-data-arb.tab','arb:lemma');NLWN=tab(SRC/'wn-data-nld.tab','nld:lemma');ENWN={};t=tarfile.open(SRC/'wn-en.tar.gz')
for member in t.getmembers():
 if '/data.' not in member.name:continue
 for b in t.extractfile(member):
  line=b.decode('utf8')
  if not re.match(r'^\d{8} ',line):continue
  p=line.split('|',1)[0].split();pos='a' if p[2]=='s' else p[2];ENWN[p[0]+'-'+pos]=[p[4+2*i].replace('_',' ') for i in range(int(p[3],16))]
BY_EN=collections.defaultdict(list)
for item in ding:
 for en in item['en']:BY_EN[norm(en)].append(item)
function_ar={'على','عن','في','من','هل','لم','لن','لو','أن','إن','بل','ما','لا','أو','أم','كم','كل'}
strict_synsets=0
for sid in sorted(set(ARWN)&set(NLWN)&set(ENWN)):
 ens=[e for e in ENWN[sid] if CLEAN.fullmatch(e) and e[:1].islower()]
 nls=[n for n in NLWN[sid] if CLEAN.fullmatch(n)]
 ars=[a for a in ARWN[sid] if len(key('ar',a))>=3 and key('ar',a) not in function_ar and not re.search('[A-Za-z]',a)]
 if not ens or not nls or not ars:continue
 wn_ar={key('ar',a) for a in ars};candidates=[]
 for english in ens:
  en_nls={norm(n) for n in ENNL.get(norm(english),{}).get('values',[])}
  for item in BY_EN[norm(english)]:
   known=LEG.get(norm(item['de']))
   if not known or {'noun':'n','verb':'v','adjective':'a','adverb':'r'}.get(known['pos'])!=sid[-1]:continue
   if {'n':'n','v':'v','adj':'a','adv':'r'}.get(item['grammar'].get('pos'))!=sid[-1]:continue
   de_nls={norm(n) for n in DENL.get(norm(item['de']),{}).get('values',[])}
   hits=[n for n in nls if norm(n) in de_nls and norm(n) in en_nls]
   if not hits:continue
   valid=[]
   for original in re.split('[؛;،,]',known['arabic']):
    original=first(original);k=key('ar',original)
    variants={k}
    if sid[-1]=='v' and k.startswith('ي') and len(k)>3:variants.add(k[1:])
    if variants&wn_ar:valid.append(original)
   if not valid:continue
   candidates.append((rank('de',item['de']),len(item['de']),item['de'],item,hits,valid))
 if not candidates:continue
 _,_,_,item,hits,valid=min(candidates,key=lambda v:v[:3]);strict_synsets+=1
 pos={'n':'noun','v':'verb','a':'adjective','r':'adverb'}[sid[-1]];article={'masc':'der','fem':'die','neut':'das'}.get(item['grammar'].get('gen'),'') if pos=='noun' else '';articles={'de':article} if article else {}
 eligible_en=[e for e in ens if norm(e) in {norm(v) for v in item['en']}];canonical={'de':item['de'],'en':min(eligible_en,key=lambda x:(rank('en',x),len(x),x)),'nl':min(hits,key=lambda x:(rank('nl',x),len(x),x)),'ar':min(valid,key=lambda x:(rank('ar',x),len(x),x))}
 for en in eligible_en:add({**canonical,'en':en},pos,'strict-wn:'+sid,20,articles,sid,'en')
 # Do not expand unchecked Dutch synonyms from WordNet; require the chosen German anchor too.
 all_en_nls={norm(n) for en in eligible_en for n in ENNL.get(norm(en),{}).get('values',[])};de_nls={norm(n) for n in DENL.get(norm(item['de']),{}).get('values',[])}
 for nl in nls:
  if norm(nl) in all_en_nls and norm(nl) in de_nls:add({**canonical,'nl':nl},pos,'strict-wn:'+sid,20,articles,sid,'nl')
 for ar in valid:add({**canonical,'ar':ar},pos,'strict-wn:'+sid,20,articles,sid,'ar')
# Reviewed source corrections repair the new courses only; legacy German IDs and cards stay intact.
audit_file=ROOT/'tools/multilingual/reviewed-course-concepts.json'
if not audit_file.exists() and Path('/tmp/wort-corpus-quality-audit.json').exists():
 audit=load(Path('/tmp/wort-corpus-quality-audit.json'));write(audit_file,[{'id':'reviewed:'+str(i),'originalSourceId':v.get('sourceId'),'texts':v['suggestedTexts'],'pos':v['suggestedPos']} for i,v in enumerate(audit['issues'])])
reviewed=load(audit_file) if audit_file.exists() else []
by_source={v.get('originalSourceId'):v for v in reviewed}
for word in legacy:
 extra=authored.get(str(word['id']),{})
 if not extra.get('en') or not extra.get('nl'):continue
 source='authored:'+str(word['id']);correction=by_source.get(source)
 texts=correction['texts'] if correction else {'de':word['german'],'ar':first(word['arabic']),'en':first(extra['en']),'nl':first(extra['nl'])};context=NEW_CONTEXT.get(str(word['id']),{});texts={**texts,**context.get('texts',{})};pos=context.get('pos',correction['pos'] if correction else word['pos']);articles={'de':word['article']} if word.get('article') and pos=='noun' else {}
 add(texts,pos,source,50,articles)
foundation=load(ROOT/'tools/multilingual/foundation.json') if (ROOT/'tools/multilingual/foundation.json').exists() else []
if isinstance(foundation,dict):foundation=foundation.get('cards',foundation.get('concepts',list(foundation.values())))
for extra_file in sorted((ROOT/'tools/multilingual').glob('foundation-*.json')):foundation.extend(load(extra_file))
for item in foundation:
 ex=list(item.get('examples',[]))+[v['example'] for v in PARALLEL_FIXES if norm(v.get('conceptEnglish',''))==norm(item['texts'].get('en',''))]
 add(item['texts'],item.get('pos','other'),str(item.get('id','foundation')),100,item.get('articles'),target_only=item.get('targetOnly'),intended=item.get('level'),authored_examples=ex)
corrected_sources={v.get('originalSourceId') for v in reviewed}
rows=[row for row in rows if row['sourceId'] not in corrected_sources]
for item in reviewed:add(item['texts'],item['pos'],item['id'],110)
standard={'I','English','Dutch','German','Arabic','French','Spanish','Italian','Chinese','Japanese','Portuguese','Russian','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','January','February','March','April','May','June','July','August','September','October','November','December'}
for row in rows:
 if row['quality']<50 and row['texts']['en'] not in standard:row['texts']['en']=row['texts']['en'].lower()
print('Strict verified synsets',strict_synsets,'admitted rows',len(rows),flush=True)
SOURCES=[
 {'name':'Ding / FreeDict German–English','url':'https://dict.tu-chemnitz.de/','license':'GPL-3.0 / AGPL-3.0 for separate parts of the combined TEI'},
 {'name':'WikDict German–Dutch and English–Dutch','url':'https://www.wikdict.com/page/download','license':'CC BY-SA 4.0; Wiktionary data extracted via DBnary and WikDict'},
 {'name':'FreeDict English–Arabic / Arabeyes','url':'https://freedict.org/downloads/#dictionary-downloads','license':'GPL-2.0-or-later'},
 {'name':'Arabic WordNet / Open Dutch WordNet / Princeton WordNet3.0','url':'https://github.com/omwn/omw-data','license':'Arabic CC BY-SA3.0; Dutch CC BY-SA4.0; English WordNet licence'},
 {'name':'Tatoeba sentence pairs via ManyThings','url':'https://www.manythings.org/anki/','license':'CC BY2.0 FR; sentence attribution retained in each example'},
 {'name':'FrequencyWords','url':'https://github.com/hermitdave/FrequencyWords','license':'CC BY-SA4.0 (frequency data); ranking only'}]
stats={l:load(OUT/l/'manifest.json')['qualityStats'] for l in ['en','nl','ar']} if args.legacy_only else {}
if not args.legacy_only:
 for target in ['en','nl','ar']:
  chosen={}
  for row in rows:
   if row.get('targetOnly') and row['targetOnly']!=target:continue
   artext=row['texts']['ar'];entext=row['texts']['en'].lower()
   grammar_terms={'pronoun','relative pronoun','preposition','particle','article','definite article','indefinite article','letter','character','expression','form','conjugation','abbreviation'}
   if len(artext.split())>2 and artext.startswith(('أداة ','حرف ','ضمير ','صيغة ','تعبير عن ','اختصار ')) and entext not in grammar_terms:continue
   if target=='ar':
    ar=row['texts']['ar'];en=row['texts']['en'].lower()
    if ((ar.startswith('أداة ') and en not in ['tool','instrument','article','definite article','indefinite article']) or (ar.startswith('حرف ') and en not in ['letter','character','preposition','particle']) or (ar.startswith('ضمير ') and en!='pronoun') or ar.startswith('صيغة ') or (ar.startswith('تعبير عن ') and not en.startswith('expression'))):continue
   k=key(target,row['texts'][target]);old=chosen.get(k)
   score=lambda x:(x['quality'],-x['order'])
   if old is None or score(row)>score(old):chosen[k]=row
  ordered=sorted(chosen.values(),key=lambda row:(rank(target,row['texts'][target]),-row['quality'],len(row['texts'][target]),key(target,row['texts'][target])))
  must_keep=[row for row in ordered if row.get('intendedLevel') in ['A1','A2']];rest=[row for row in ordered if row.get('intendedLevel') not in ['A1','A2']];selected=must_keep+rest[:max(0,10000-len(must_keep))];total=len(selected);capacities={l:total//5+(i<total%5) for i,l in enumerate(LEVELS)};groups={l:[] for l in LEVELS}
  remaining=[]
  for row in selected:
   level=row.get('intendedLevel')
   if level in ['A1','A2'] and len(groups[level])<capacities[level]:groups[level].append(row)
   else:remaining.append(row)
  cursor=0
  for level in LEVELS:
   needed=capacities[level]-len(groups[level]);groups[level]+=remaining[cursor:cursor+needed];cursor+=needed
  assert cursor==len(remaining)
  excount=0;quality=collections.Counter();pair_coverage=collections.Counter()
  for level in LEVELS:
   cards=[]
   for row in groups[level]:
    texts=row['texts'];ex=row.get('examples') or cardexamples(texts,target);excount+=len(ex);quality[str(row['quality'])]+=1
    for native in LANGS:
     if native!=target:pair_coverage[native]+=any(e.get('texts',{}).get(target) and e.get('texts',{}).get(native) for e in ex)
    cards.append({'id':level+':'+target+':'+hashlib.sha1(key(target,texts[target]).encode()).hexdigest()[:14],'level':level,'pos':row['pos'],'texts':texts,'articles':row['articles'],'examples':ex,'source':'Wort authored meanings' if row['quality']>=50 else 'WordNet sense with reviewed German–Arabic anchor and independent Dutch agreement','sourceId':row['sourceId'],'sourceUrl':None if row['quality']>=50 else 'https://github.com/omwn/omw-data','translationKind':'authored' if row['quality']>=50 else 'sense-aligned','synset':row.get('synset')})
   assert len(cards)==capacities[level] and len({key(target,c['texts'][target]) for c in cards})==len(cards)
   write(OUT/target/(level+'.json'),cards)
  manifest={'target':target,'levels':[{'code':l,'count':len(groups[l]),'data':f'data/courses/{target}/{l}.json'} for l in LEVELS],'total':total,'levelNote':'Frequency-based study groups A1–C1; approximate learning order, not official exam or CEFR lists.','sources':SOURCES,'qualityStats':{'cards':total,'translatedExampleRecords':excount,'exampleCardsByNative':dict(pair_coverage),'sentencePairPool':len(examples),'fourWaySentencePool':sum(len(e['texts'])==4 for e in examples),'selectionQuality':dict(quality),'strictVerifiedSynsets':strict_synsets},'qualityRules':['No broad dictionary pivot admitted merely to meet a count.','Bulk entry requires a shared WordNet sense, matching POS, reviewed German–Arabic gloss anchor, exact German-to-English dictionary gloss, and direct Dutch agreement from German and English.','Common function words and legacy meanings use contextually authored four-language concepts, assisted by AI and not certified human translations.','Only validated target/native fields are retained in source example records.'],'dataLicense':'Source-specific licences and attribution are retained in exported data.'}
  write(OUT/target/'manifest.json',manifest);stats[target]=manifest['qualityStats'];print(target,stats[target],flush=True)
# Legacy DE meanings prefer exact original sourceId translations, never a headword-merged shortest gloss.
legacy_supp={};missing=[];enexample={};legacy_sources=collections.Counter()
def dutch_example_matches(meaning,sentence):
 normal=norm(sentence)
 for gloss in re.split('[؛;,،/]',meaning):
  gloss=first(gloss);words=re.findall(r'[^\W\d_]+',gloss,re.UNICODE)
  if not words or not any(len(w)>=3 for w in words):continue
  if norm(gloss).startswith(('afhankelijk van','in deze context','gebruikt als','een vorm van')):continue
  phrase=norm(gloss)
  if re.search(r'(?<!\w)'+re.escape(phrase)+r'(?!\w)',normal):return True
 return False
EXACT_RAW={str(w.get('sourceId')):w for w in load(RAW/'combined-candidates.json')+load(RAW/'ding-additional-typed-candidates.json')}
noise={'cum','vide','idem','ibid','ibidem','q.v.','cf.','stet','ditto'}
def sensible(en):return isinstance(en,str) and en.strip() and norm(en) not in noise and len(en)<120
z=zipfile.ZipFile(RAW/'deu-eng-sentences.zip')
for line in z.open('deu.txt'):
 parts=line.decode('utf8').rstrip('\n').split('\t')
 if len(parts)>=3 and parts[0] not in BANNED_EN:enexample.setdefault(parts[1].strip(),[]).append((parts[0],parts[2]))
for word in legacy:
 k=norm(word['german']);extra=authored.get(str(word['id']),{});original=EXACT_RAW.get(str(word.get('sourceId')),{});exact=[e for e in original.get('english',[]) if sensible(e)]
 # A sourceId is accepted only for the same spelling; unrelated source IDs cannot supply a meaning.
 if norm(original.get('german',''))!=k:exact=[]
 candidates=[]
 for item in DING.get(k,[]):
  for en in item['en']:
   if not sensible(en):continue
   candidates.append((POS.get(item['grammar'].get('pos'))==word['pos'],arscore(word['arabic'],' '.join(ARMAP.get(norm(en),[]))),rank('en',en),len(en),en))
 candidates.sort(key=lambda v:(-int(v[0]),-v[1],v[2],v[3],v[4]))
 matched=[v[4] for v in candidates if v[0]];ens=list(dict.fromkeys(exact+matched+[v[4] for v in candidates]+[e for e in RAWEN.get(k,[]) if sensible(e)]))
 direct=DENL.get(k,{}).get('values',[])
 if not ens:ens=[e for nl in direct for e in NLEN.get(norm(nl),{}).get('values',[]) if sensible(e)]
 english=extra.get('en') or (ens[0] if ens else '')
 primary=first(english);lookup=norm(primary[3:] if primary.lower().startswith('to ') else primary)
 english_dutch=ENNL.get(lookup,{}).get('values',[]);dekeys={norm(n) for n in direct};preferred=[n for n in english_dutch if norm(n) in dekeys]
 other_dutch=[n for en in ens for n in ENNL.get(norm(en),{}).get('values',[])]
 dutch=extra.get('nl') or ((preferred or english_dutch or direct or other_dutch)[0] if (preferred or english_dutch or direct or other_dutch) else '')
 translations={l:v for l,v in {'en':english,'nl':dutch}.items() if v};example_trans=[]
 for example in word.get('examples',[]):
  pair=next(iter(enexample.get(example['de'].strip(),[])),None);translated={}
  if pair:
   translated['en']=pair[0]
   if pair[0] in example_maps['nl'] and dutch_example_matches(dutch,example_maps['nl'][pair[0]]['text']):translated['nl']=example_maps['nl'][pair[0]]['text']
  example_trans.append(translated)
 kind='authored' if extra else 'source-exact' if exact else 'dictionary-fallback';legacy_sources[kind]+=1
 legacy_supp[str(word['id'])]={'texts':translations,'examples':example_trans,'translationKind':kind,'sourceId':word.get('sourceId'),'needsReview':kind=='dictionary-fallback' and not any(v[1]>0 for v in candidates if v[0])}
 if len(translations)!=2:missing.append({'id':word['id'],'german':word['german'],'arabic':word['arabic'],'en':english,'nl':dutch})
write(OUT/'de/translations.json',{'cards':legacy_supp,'sources':SOURCES,'coverage':{'cards':10000,'completeMeanings':10000-len(missing),'meaningSources':dict(legacy_sources),'englishExamples':sum(bool(e.get('en')) for w in legacy_supp.values() for e in w['examples']),'dutchExamples':sum(bool(e.get('nl')) for w in legacy_supp.values() for e in w['examples'])}})
write(OUT/'sources.json',{'sources':SOURCES,'courseStats':stats,'legacyMissing':len(missing),'notes':['German legacy data and IDs are preserved.','Authored English and Dutch meanings were prepared with AI assistance against the original German and Arabic context; they are not certified human translations.','Only fully translated example pairs are displayed by the content adapter.','Dictionary meanings are not certified human translations.','Frequency-based study bands are approximate.']})
write(SRC/'legacy-still-missing.json',missing)
license_dir=ROOT/'dist/licenses';license_dir.mkdir(exist_ok=True)
wn_archive=tarfile.open(SRC/'wn-en.tar.gz');wn_notice=[]
for raw_line in wn_archive.extractfile('dict/data.noun'):
 line=raw_line.decode('utf8')
 if re.match(r'^\d{8} ',line):break
 wn_notice.append(re.sub(r'^\s+\d+\s','',line))
(license_dir/'WordNet-3.0.txt').write_text(''.join(wn_notice))
(license_dir/'multilingual-sources.txt').write_text('\n\n'.join(s['name']+'\n'+s['url']+'\n'+s['license'] for s in SOURCES)+'\n\nSource dictionary translation links are reproduced with original source attribution. Sentence attributions are included per example. Authored legacy overrides are maintained in tools/multilingual/.\n')
print('legacy missing',len(missing),flush=True)
if missing and not args.allow_partial_legacy:raise SystemExit('Legacy native-language supplements incomplete: '+str(len(missing)))
