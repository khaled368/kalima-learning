#!/usr/bin/env python3
"""Match existing German examples to an attributed human DE/AR parallel corpus.
Does not change application vocabulary files. Existing authored translations win at merge time.
"""
from pathlib import Path
import bz2,collections,html,json,re,sys,unicodedata,zipfile
ROOT=Path(__file__).resolve().parent.parent
RAW=ROOT/'data-sources'
archive=Path(sys.argv[1]) if len(sys.argv)>1 else RAW/'tatoeba-ar-de.zip'
if not archive.exists():raise SystemExit('Parallel corpus archive not downloaded: '+str(archive))
def clean(text):
 return re.sub(r'\s+',' ',unicodedata.normalize('NFC',html.unescape(text)).replace('’',"'").replace('‘',"'").replace('„','"').replace('“','"').replace('”','"')).strip()
targets={}
existing={}
for level in ['A1','A2','B1','B2','C1']:
 for word in json.loads((ROOT/'dist/data'/f'{level}.json').read_text()):
  for example in word.get('examples',[]):
   de=example.get('de','').strip()
   if de:targets.setdefault(clean(de),set()).add(de)
   if de and example.get('ar','').strip():existing[de]=example['ar'].strip()
map_out={};variants=collections.defaultdict(collections.Counter)
with zipfile.ZipFile(archive) as zipped:
 names=zipped.namelist()
 de_files=[name for name in names if name.endswith('.de')]
 ar_files=[name for name in names if name.endswith('.ar')]
 if not de_files or not ar_files:raise SystemExit('No German/Arabic plain parallel files in '+str(names[:20]))
 de_name=de_files[0];ar_name=ar_files[0]
 total=0
 with zipped.open(de_name) as de_stream,zipped.open(ar_name) as ar_stream:
  for raw_de,raw_ar in zip(de_stream,ar_stream):
   total+=1
   de=clean(raw_de.decode('utf8'));ar=html.unescape(raw_ar.decode('utf8')).strip()
   if de not in targets or not re.search(r'[\u0600-\u06ff]',ar):continue
   for original in targets[de]:variants[original][ar]+=1
 for target,choices in variants.items():map_out[target]=choices.most_common(1)[0][0]
 readmes={name:zipped.read(name).decode('utf8',errors='replace') for name in names if 'readme' in name.lower() or 'licen' in name.lower()}
RAW.mkdir(exist_ok=True)
attribution={}
author_file=RAW/'ara_sentences_detailed.tsv.bz2'
if author_file.exists():
 wanted_ar={clean(value) for value in map_out.values()}; authors={}
 with bz2.open(author_file,'rt',encoding='utf8') as stream:
  for line in stream:
   fields=line.rstrip('\n').split('\t')
   if len(fields)<4 or clean(fields[2]) not in wanted_ar:continue
   username=fields[3].strip()
   if username and username not in ['\\N','-']:
    authors.setdefault(clean(fields[2]),{'author':username,'arabicSentenceId':fields[0],'sourceUrl':'https://tatoeba.org/en/sentences/show/'+fields[0],'license':'CC BY 2.0 FR'})
 for de,ar in map_out.items():
  if clean(ar) in authors:attribution[de]={**authors[clean(ar)],'ar':ar}
(RAW/'ar-example-human-map.json').write_text(json.dumps(map_out,ensure_ascii=False,separators=(',',':')))
(RAW/'ar-example-human-attribution.json').write_text(json.dumps(attribution,ensure_ascii=False,separators=(',',':')))
metadata={'source':'OPUS Tatoeba German–Arabic parallel corpus','url':'https://object.pouta.csc.fi/OPUS-Tatoeba/v2023-04-12/moses/ar-de.txt.zip','upstream':'https://tatoeba.org/','license':'CC BY 2.0 FR (see archive README; some source sentences may be CC0)','archive':archive.name,'files':{'de':de_name,'ar':ar_name},'parallelPairs':total,'targetUnique':sum(map(len,targets.values())),'matchedTargets':len(map_out),'matchedWithKnownArabicAuthor':len(attribution),'authorSource':str(author_file) if author_file.exists() else None,'matchedStillMissingArabic':sum(de not in existing for de in map_out),'matching':'NFC/HTML-entity/typographic-quote/whitespace normalization; exact case and sentence punctuation retained. No fuzzy or English pivot matching.','archiveReadmes':readmes}
(RAW/'ar-example-human-source.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
print(json.dumps({key:metadata[key] for key in ['parallelPairs','targetUnique','matchedTargets','matchedStillMissingArabic']},ensure_ascii=False))
for de,ar in list(map_out.items())[:12]:print(de,'=>',ar)
