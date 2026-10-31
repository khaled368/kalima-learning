#!/usr/bin/env python3
"""Retain examples that contain the headword or a sourced inflection, preventing cross-sense merge noise."""
import json,re,sqlite3,unicodedata,collections
from pathlib import Path
P=Path(__file__).resolve().parent.parent/'data-sources'
def norm(s):return unicodedata.normalize('NFC',s).casefold().strip()
rows=json.loads((P/'combined-candidates.json').read_text())+json.loads((P/'ding-additional-typed-candidates.json').read_text())
c=sqlite3.connect(P/'grundwortschatz-app.db');metadata={}
for source_id,word,enrichment,meta in c.execute('select id,word,enrichment_json,metadata_json from words'):
 metadata[source_id]=(json.loads(enrichment or '{}'),json.loads(meta or '{}'))
result={};missing=[]
for row in rows:
 if row.get('originalPos')=='proper_noun':continue
 word=row['german'];source=row.get('sourceId');enrich,meta=metadata.get(source,({},{}))
 variants={norm(word)}
 if row.get('pos') in ['noun','substantiv','verb','adjective','adjektiv']:
  forms=enrich.get('inflections',[]) or []
  for form in forms:
   value=form.get('form_text','');tags=form.get('tags','')
   if any(tag in tags for tag in ['archaic','obsolete','rare','abbreviation','alternative','variant']):continue
   value=re.sub(r'\([^)]*\)','',value).strip()
   parts=value.split()
   if parts and parts[0] in ['der','die','das','des','dem','den','ein','eine','einer','eines','einem','einen','ich','du','er','sie','es','wir','ihr']:value=' '.join(parts[1:])
   if re.fullmatch(r'[A-Za-zÄÖÜäöüß]+(?:[- ][A-Za-zÄÖÜäöüß]+)*',value) and len(value)>=3:
    variants.add(norm(value))
 pattern=re.compile(r'(?<![\w])(?:'+ '|'.join(re.escape(x) for x in sorted(variants,key=len,reverse=True))+r')(?![\w])',re.I)
 candidates=list(row.get('examples',[]))
 for sentence in meta.get('tatoeba_examples',[]) or []:
  if isinstance(sentence,dict):sentence=sentence.get('text') or sentence.get('sentence')
  if isinstance(sentence,str):candidates.append({'de':sentence,'source':'Tatoeba via WortUniversum','sourceUrl':'https://tatoeba.org/','license':'CC BY 2.0 FR'})
 for grade,sentences in (meta.get('grade_examples') or {}).items():
  for sentence in sentences:
   if isinstance(sentence,str):candidates.append({'de':sentence,'generated':True,'source':'WortUniversum generated learning example','sourceUrl':'https://huggingface.co/datasets/cstr/grundwortschatz-voc-de'})
 valid=[];seen=set()
 for ex in candidates:
  text=ex.get('de','').strip()
  if text in seen or len(text)>320 or not pattern.search(norm(text)):continue
  seen.add(text);valid.append(ex)
 valid.sort(key=lambda ex:(bool(ex.get('generated')),not bool(re.search(r'[.!?]$',ex['de'])),len(ex['de'])))
 if valid:
  key=norm(word)
  if key not in result:result[key]=valid[:3]
 else:missing.append({'sourceId':source,'german':word})
(P/'validated-example-overrides.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(P/'missing-validated-examples.json').write_text(json.dumps(missing,ensure_ascii=False))
print('Validated examples for',len(result),'distinct surfaces; no matching example for',len(missing))
