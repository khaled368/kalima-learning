#!/usr/bin/env python3
"""Check shipped multilingual curricula, pair coverage, and legacy German preservation."""
from pathlib import Path
import argparse,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';LEVELS=['A1','A2','B1','B2','C1'];LANGS=['ar','en','nl','de']
p=argparse.ArgumentParser();p.add_argument('--require-authored',action='store_true');args=p.parse_args()
def read(path):return json.loads(path.read_text())
def norm(text):return unicodedata.normalize('NFC',text).strip().casefold()
def require(ok,message):
 if not ok:raise AssertionError(message)
legacy=[];baseline='b277e6f402a96f0cc2be2cb667a525807e977211'
for level in LEVELS:
 path='dist/data/'+level+'.json';data=(ROOT/path).read_bytes();old=subprocess.check_output(['git','show',baseline+':'+path],cwd=ROOT);require(data==old,'Original German cards changed: '+level)
 rows=json.loads(data);require(len(rows)==2000,'Original German count');legacy+=rows
for path in ['dist/data/manifest.json','dist/data/verbs.json']:
 require((ROOT/path).read_bytes()==subprocess.check_output(['git','show',baseline+':'+path],cwd=ROOT),'Legacy data changed: '+path)
ids={str(w['id']) for w in legacy};supp=read(DIST/'data/courses/de/translations.json')['cards'];require(set(supp)==ids,'German supplement IDs differ')
for card_id,entry in supp.items():
 require(all(isinstance(entry.get('texts',{}).get(lang),str) and entry['texts'][lang].strip() for lang in ['en','nl']),'Missing legacy native translation: '+card_id)
 if args.require_authored:require(entry.get('translationKind')=='authored','Unreviewed legacy translation: '+card_id)
result={'de':{'cards':10000,'legacyPreserved':True,'authored':sum(x.get('translationKind')=='authored' for x in supp.values())}}
for target in ['en','nl','ar']:
 manifest=read(DIST/f'data/courses/{target}/manifest.json');require([x['code'] for x in manifest['levels']]==LEVELS,'Five levels required: '+target)
 seen=set();terms=set();examples=0;pair_counts={lang:0 for lang in LANGS if lang!=target};total=0
 for level in manifest['levels']:
  rows=read(DIST/level['data']);require(len(rows)==level['count'],'Manifest count mismatch: '+level['data'])
  for w in rows:
   require(w['id'].startswith(level['code']+':'+target+':'),'Course/level ID mismatch: '+w['id']);require(w['id'] not in seen,'Duplicate card ID: '+w['id']);seen.add(w['id'])
   texts=w.get('texts',{});require(all(isinstance(texts.get(lang),str) and texts[lang].strip() for lang in LANGS),'Incomplete four-language meaning: '+w['id'])
   key=norm(texts[target]);require(key not in terms,'Duplicate target term: '+key);terms.add(key)
   if target=='ar':require(bool(re.search(r'[\u0600-\u06ff]',texts[target])),'Non-Arabic Arabic headword')
   available=set()
   for ex in w.get('examples',[]):
    extexts=ex.get('texts',{});require(target in extexts and len(extexts)>=2,'Unpaired example: '+w['id']);require(all(isinstance(v,str) and v.strip() for v in extexts.values()),'Empty example translation')
    require(bool(ex.get('source') or ex.get('attributions')),'Example provenance required');examples+=1;available.update(set(extexts)-{target})
   for lang in available:
    if lang in pair_counts:pair_counts[lang]+=1
  total+=len(rows)
 require(total==manifest['total'],'Course total mismatch');require(total>150,'Curriculum contains only the foundation')
 result[target]={'cards':total,'levels':[x['count'] for x in manifest['levels']],'exampleRecords':examples,'exampleCardsByNative':pair_counts}
print(json.dumps({'pass':True,'curricula':result},ensure_ascii=False))
